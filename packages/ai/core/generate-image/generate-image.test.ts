import { ImageModelV1 } from '@ai-sdk/provider';
import { MockImageModelV1 } from '../test/mock-image-model-v1';
import { generateImage } from './generate-image';

const prompt = 'sunny day at the beach';

describe('generateImage', () => {
  it('should send args to doGenerate', async () => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    let capturedArgs!: Parameters<ImageModelV1['doGenerate']>[0];

    await generateImage({
      model: new MockImageModelV1({
        doGenerate: async args => {
          capturedArgs = args;
          return { images: [] };
        },
      }),
      prompt,
      size: '1024x1024',
      headers: { 'custom-request-header': 'request-header-value' },
      abortSignal,
    });

    expect(capturedArgs).toStrictEqual({
      n: 1,
      prompt,
      size: '1024x1024',
      headers: { 'custom-request-header': 'request-header-value' },
      abortSignal,
    });
  });

  it('should return generated images', async () => {
    const result = await generateImage({
      model: new MockImageModelV1({
        doGenerate: async () => ({
          images: ['base64-image-1', 'base64-image-2'],
        }),
      }),
      prompt,
    });

    expect(result.images).toStrictEqual(['base64-image-1', 'base64-image-2']);
  });

  it('should return the first image as a Uint8Array', async () => {
    const base64Image = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64

    const result = await generateImage({
      model: new MockImageModelV1({
        doGenerate: async () => ({ images: [base64Image, 'base64-image-2'] }),
      }),
      prompt,
    });

    expect(result.imageAsUint8Array).toStrictEqual(
      new Uint8Array(Buffer.from(base64Image, 'base64')),
    );
  });

  it('should return the first image', async () => {
    const result = await generateImage({
      model: new MockImageModelV1({
        doGenerate: async () => ({
          images: ['base64-image-1', 'base64-image-2'],
        }),
      }),
      prompt,
    });

    expect(result.image).toStrictEqual('base64-image-1');
  });

  it('should return the images as Uint8Arrays', async () => {
    const base64Images = [
      'SGVsbG8gV29ybGQ=', // "Hello World" in base64
      'VGVzdGluZw==', // "Testing" in base64
    ];

    const result = await generateImage({
      model: new MockImageModelV1({
        doGenerate: async () => ({ images: base64Images }),
      }),
      prompt,
    });

    expect(result.imagesAsUint8Arrays).toStrictEqual([
      new Uint8Array(Buffer.from(base64Images[0], 'base64')),
      new Uint8Array(Buffer.from(base64Images[1], 'base64')),
    ]);
  });
});
