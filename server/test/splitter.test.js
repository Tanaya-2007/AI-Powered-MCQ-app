import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { splitText } from '../utils/textSplitter.js';

describe('splitText', () => {
  it('returns [] for empty input', () => {
    assert.deepEqual(splitText(''), []);
    assert.deepEqual(splitText('   '), []);
    assert.deepEqual(splitText(null), []);
  });

  it('returns short text as a single chunk', () => {
    const out = splitText('Photosynthesis converts light into energy.');
    assert.equal(out.length, 1);
  });

  it('splits long text into overlapping chunks', () => {
    const text = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
    const out = splitText(text, 100, 20);
    assert.ok(out.length > 1);
    assert.ok(out.every((c) => c.length > 0));
  });

  it('rejects invalid window sizes', () => {
    assert.throws(() => splitText('abc', 0, 0), /chunkSize/);
    assert.throws(() => splitText('abc', 100, 100), /verlap/);
    assert.throws(() => splitText('abc', 100, -1), /verlap/);
  });
});
