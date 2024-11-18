import { API, FileInfo } from 'jscodeshift';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let hasChanges = false;

  // Track if formatStreamPart is imported from 'ai'
  const targetImports = new Set<string>();

  // Find and update imports from 'ai'
  root
    .find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'ai')
    .forEach(path => {
      path.node.specifiers?.forEach(specifier => {
        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          specifier.imported.name === 'formatStreamPart'
        ) {
          hasChanges = true;
          targetImports.add(specifier.local?.name || specifier.imported.name);

          // Update import name
          specifier.imported.name = 'formatDataStreamPart';
          if (specifier.local) {
            specifier.local.name = 'formatDataStreamPart';
          }
        }
      });
    });

  root
    .find(j.CallExpression)
    .filter(
      path =>
        path.node.callee.type === 'Identifier' &&
        targetImports.has(path.node.callee.name),
    )
    .forEach(path => {
      if (path.node.callee.type === 'Identifier') {
        hasChanges = true;
        path.node.callee.name = 'formatDataStreamPart';
      }
    });

  return hasChanges ? root.toSource() : null;
}
