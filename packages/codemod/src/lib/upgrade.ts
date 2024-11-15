import debug from 'debug';
import fs from 'fs';
import path from 'path';
import semver from 'semver';
import { transform } from './transform';
import { TransformOptions } from './transform-options';

const bundle = [
  'remove-ai-stream-methods-from-stream-text-result',
  'remove-anthropic-facade',
  'remove-deprecated-provider-registry-exports',
  'remove-experimental-ai-fn-exports',
  'remove-experimental-message-types',
  'remove-experimental-tool',
  'remove-google-facade',
  'remove-mistral-facade',
  'remove-openai-facade',
  'rename-format-stream-part',
  'rename-parse-stream-part',
  'replace-baseurl',
  'replace-continuation-steps',
  'replace-langchain-toaistream',
  'replace-nanoid',
  'replace-roundtrips-with-maxsteps',
  'replace-token-usage-types',
  'rewrite-framework-imports',
];

const log = debug('codemod:upgrade');

function validatePreconditions(cwd: string) {
  const pkgPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error('No package.json found in current directory');
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const aiVersion = pkg.dependencies?.ai || pkg.devDependencies?.ai;

  if (!aiVersion) {
    throw new Error('No ai package found in dependencies');
  }

  const version = semver.clean(aiVersion.replace(/^[\^~]/, ''));
  if (!version || !semver.gte(version, '3.4.0')) {
    throw new Error('ai package must be at least version 3.4.0');
  }
}

export function upgrade(options: TransformOptions) {
  const cwd = process.cwd();
  log('Starting upgrade...');
  validatePreconditions(cwd);
  log('Applying codemods...');
  for (const [index, codemod] of bundle.entries()) {
    log(`Applying codemod ${index + 1}/${bundle.length}: ${codemod}`);
    transform(codemod, cwd, options);
  }
  log('Upgrade complete.');
}
