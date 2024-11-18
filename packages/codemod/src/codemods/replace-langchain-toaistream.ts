import { API, FileInfo, JSCodeshift } from 'jscodeshift';

export default function transformer(fileInfo: FileInfo, api: API) {
  const j: JSCodeshift = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasChanges = false;

  // Replace LangChainAdapter.toAIStream with LangChainAdapter.toDataStream
  root
    .find(j.MemberExpression, {
      object: {
        type: 'Identifier',
        name: 'LangChainAdapter',
      },
      property: {
        type: 'Identifier',
        name: 'toAIStream',
      },
    })
    .forEach(path => {
      if (path.node.property.type === 'Identifier') {
        hasChanges = true;
        path.node.property.name = 'toDataStream';
      }
    });

  return hasChanges ? root.toSource({ quote: 'single' }) : null;
}
