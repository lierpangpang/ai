import { describe, it } from 'vitest';
import transformer from '../codemods/remove-google-facade';
import { testTransform } from './test-utils';

describe('remove-google-facade', () => {
  it('transforms correctly', () => {
    testTransform(transformer, 'remove-google-facade');
  });
});
