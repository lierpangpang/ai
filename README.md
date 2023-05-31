# AI Utils

AI Utils is **a compact library for building edge-rendered AI-powered streaming text and chat UIs**.

## Features

- Edge Runtime compatibility
- First-class support for LangChain and native OpenAI, Anthropic, and HuggingFace Inference JavaScript SDKs
- SWR-powered React hooks for fetching and rendering streaming text responses
- Callbacks for saving completed streaming responses to a database (in the same request)

## Installation

```sh
pnpm install @vercel/ai-utils
```

**Table of Contents**

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Tutorial](#tutorial)
  - [Create a Next.js app](#create-a-nextjs-app)
  - [Add your OpenAI API Key to `.env`](#add-your-openai-api-key-to-env)
  - [Create a Route Handler](#create-a-route-handler)
  - [Wire up the UI](#wire-up-the-ui)
- [API Reference](#api-reference)
  - [`OpenAIStream(res: Response, cb: AIStreamCallbacks): ReadableStream`](#openaistreamres-response-cb-aistreamcallbacks-readablestream)
  - [`HuggingFaceStream(iter: AsyncGenerator<any>, cb?: AIStreamCallbacks): ReadableStream`](#huggingfacestreamiter-asyncgeneratorany-cb-aistreamcallbacks-readablestream)
  - [`StreamingTextResponse(res: ReadableStream, init?: ResponseInit)`](#streamingtextresponseres-readablestream-init-responseinit)
  - [`useChat(options: UseChatOptions): ChatHelpers`](#usechatoptions-usechatoptions-chathelpers)
    - [Types](#types)
      - [`Message`](#message)
    - [`UseChatOptions`](#usechatoptions)
      - [`UseChatHelpers`](#usechathelpers)
    - [Example](#example)
  - [`createLangChainAdapter(cb?: AIStreamCallbacks): { stream: ReadableStream; handlers: LangChainHandlers }`](#createlangchainadaptercb-aistreamcallbacks--stream-readablestream-handlers-langchainhandlers-)
    - [Example](#example-1)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

```tsx
// app/api/generate/route.ts
import { Configuration, OpenAIApi } from 'openai-edge'
import { OpenAIStream, StreamingTextResponse } from '@vercel/ai-utils'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export const runtime = 'edge'

export async function POST() {
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    stream: true,
    messages: [{ role: 'user', content: 'What is love?' }]
  })
  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

## Tutorial

For this example, we'll stream a chat completion text from OpenAI's `gpt-3.5-turbo` and render it in Next.js. This tutorial assumes you have

### Create a Next.js app

Create a Next.js application and install `@vercel/ai-utils` and `openai-edge`. We currently prefer the latter `openai-edge` library over the official OpenAI SDK because the official SDK uses `axios` which is not compatible with Vercel Edge Functions.

```sh
pnpx create-next-app my-ai-app
cd my-ai-app
pnpm install @vercel/ai-utils openai-edge
```

### Add your OpenAI API Key to `.env`

Create a `.env` file and add an OpenAI API Key called

```sh
touch .env
```

```env
OPENAI_API_KEY=xxxxxxxxx
```

### Create a Route Handler

Create a Next.js Route Handler that uses the Edge Runtime that we'll use to generate a chat completion via OpenAI that we'll then stream back to our Next.js.

```tsx
// ./app/api/chat/route.ts
import { Configuration, OpenAIApi } from 'openai-edge'
import { OpenAIStream, StreamingTextResponse } from '@vercel/ai-utils'

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { messages } = await req.json()

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages
  })
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)
  // Respond with the stream
  return new StreamingTextResponse(stream)
}
```

Vercel AI Utils provides 2 utility helpers to make the above seamless: First, we pass the streaming `response` we receive from OpenAI to `OpenAIStream`. This method decodes/extracts the text tokens in the response and then re-encodes them properly for simple consumption. We can then pass that new stream directly to `StreamingTextResponse`. This is another utility class that extends the normal Node/Edge Runtime `Response` class with the default headers you probably want (hint: `'Content-Type': 'text/plain; charset=utf-8'` is already set for you).

### Wire up the UI

Create a Client component with a form that we'll use to gather the prompt from the user and then stream back the completion from.

```tsx
// ./app/form.ts
'use client'

import { useChat } from '@vercel/ai-utils'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      {messages.length > 0
        ? messages.map(m => (
            <div key={m.id}>
              {m.role === 'user' ? 'User: ' : 'AI: '}
              {m.content}
            </div>
          ))
        : null}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}
```

## API Reference

### `OpenAIStream(res: Response, cb: AIStreamCallbacks): ReadableStream`

A transform that will extract the text from all chat and completion OpenAI models as returned as a `ReadableStream`.

```tsx
// app/api/generate/route.ts
import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from '@vercel/ai-utils';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export const runtime = 'edge';

export async function POST() {
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    stream: true,
    messages: [{ role: 'user', content: 'What is love?' }],
  });
  const stream = OpenAIStream(response, {
    async onStart() {
      console.log('streamin yo')
    },
    async onToken(token) {
      console.log('token: ' + token)
    },
    async onCompletion(content) {
      console.log('full text: ' + )
      // await prisma.messages.create({ content }) or something
    }
  });
  return new StreamingTextResponse(stream);
}
```

### `HuggingFaceStream(iter: AsyncGenerator<any>, cb?: AIStreamCallbacks): ReadableStream`

A transform that will extract the text from _most_ chat and completion HuggingFace models and return them as a `ReadableStream`.

```tsx
// app/api/generate/route.ts
import { HfInference } from '@huggingface/inference'
import { HuggingFaceStream, StreamingTextResponse } from '@vercel/ai-utils'

export const runtime = 'edge'

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

export async function POST() {
  const response = await Hf.textGenerationStream({
    model: 'OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5',
    inputs: `<|prompter|>What's the Earth total population?<|endoftext|><|assistant|>`,
    parameters: {
      max_new_tokens: 200,
      // @ts-ignore
      typical_p: 0.2, // you'll need this for OpenAssistant
      repetition_penalty: 1,
      truncate: 1000,
      return_full_text: false
    }
  })
  const stream = HuggingFaceStream(response)
  return new StreamingTextResponse(stream)
}
```

### `StreamingTextResponse(res: ReadableStream, init?: ResponseInit)`

This is a tiny wrapper around `Response` class that makes returning `ReadableStreams` of text a one liner. Status is automatically set to `200`, with `'Content-Type': 'text/plain; charset=utf-8'` set as `headers`.

```tsx
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from '@vercel/ai-utils'

export const runtime = 'edge'

export async function POST() {
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    stream: true,
    messages: { role: 'user', content: 'What is love?' }
  })
  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream, {
    'X-RATE-LIMIT': 'lol'
  }) // => new Response(stream, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-RATE-LIMIT': 'lol' }})
}
```

### `useChat(options: UseChatOptions): ChatHelpers`

An SWR-powered React hook for streaming text completion or chat messages and handling chat and prompt input state.

The `useChat` hook is designed to provide an intuitive interface for building ChatGPT-like UI's in React with streaming text responses. It leverages the [SWR](https://swr.vercel.app) library for efficient data fetching and state synchronization.

#### Types

##### `Message`

The Message type represents a chat message within your application.

```tsx
type Message = {
  id: string
  createdAt?: Date
  content: string
  role: 'system' | 'user' | 'assistant'
}
```

#### `UseChatOptions`

The UseChatOptions type defines the configuration options for the useChat hook.

```tsx
type UseChatOptions = {
  api?: string
  id?: string
  initialMessages?: Message[]
  initialInput?: string
}
```

##### `UseChatHelpers`

The `UseChatHelpers` type is the return type of the `useChat` hook. It provides various utilities to interact with and manipulate the chat.

```tsx
type UseChatHelpers = {
  messages: Message[]
  error: any
  append: (message: Message) => void
  reload: () => void
  stop: () => void
  set: (messages: Message[]) => void
  input: string
  setInput: react.Dispatch<react.SetStateAction<string>>
  handleInputChange: (e: any) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}
```

#### Example

Below is a basic example of the useChat hook in a component:

```tsx
// app/chat.tsx
'use client'

import { useChat } from '@vercel/ai-utils'

export default function Chat() {
  const { messages, input, stop, isLoading, handleInputChange, handleSubmit } =
    useChat({
      api: '/api/some-custom-endpoint',
      initialMessages: [
        {
          id: 'abc124',
          content: 'You are an AI assistant ...',
          role: 'system'
        }
      ]
    })

  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      {messages.length > 0
        ? messages.map(m => (
            <div key={m.id}>
              {m.role === 'user' ? 'User: ' : 'AI: '}
              {m.content}
            </div>
          ))
        : null}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
        <button type="button" onClick={stop}>
          Stop
        </button>
        <button disabled={isLoading} type="submit">
          Send
        </button>
      </form>
    </div>
  )
}
```

In this example, chat is an object of type `UseChatHelpers`, which contains various utilities to interact with and control the chat. You can use these utilities to render chat messages, handle input changes, submit messages, and manage the chat state in your UI.

### `createLangChainAdapter(cb?: AIStreamCallbacks): { stream: ReadableStream; handlers: LangChainHandlers }`

Returns a `stream` and bag of LangChain `BaseCallbackHandlerMethodsClass` that automatically implement streaming in such a way that you can use `useChat` and `useCompletion`.

#### Example

Here is a reference implementation of a chat endpoint that uses both AI Utils and LangChain together with Next.js App Router

```tsx
// app/api/chat/route.ts
import {
  StreamingTextResponse,
  createLangChainStreamingAdapter
} from '@vercel/ai-utils'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIChatMessage, HumanChatMessage } from 'langchain/schema'
import { CallbackManager } from 'langchain/callbacks'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()
  //
  const { stream, handlers } = createLangChainStreamingAdapter()

  const llm = new ChatOpenAI({
    streaming: true,
    callbackManager: CallbackManager.fromHandlers(handlers)
  })

  llm
    .call(
      messages.map(m =>
        m.role == 'user'
          ? new HumanChatMessage(m.content)
          : new AIChatMessage(m.content)
      )
    )
    .catch(console.error)

  return new StreamingTextResponse(stream)
}
```

```tsx
// app/page.tsx
'use client'

import { useChat } from '@vercel/ai-utils'

export default function Chat() {
  const { messages, input, isLoading, handleInputChange, handleSubmit } =
    useChat()

  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      {messages.length > 0
        ? messages.map(m => (
            <div key={m.id}>
              {m.role === 'user' ? 'User: ' : 'AI: '}
              {m.content}
            </div>
          ))
        : null}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed w-full max-w-md bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
        <button disabled={isLoading} type="submit">
          Send
        </button>
      </form>
    </div>
  )
}
```
