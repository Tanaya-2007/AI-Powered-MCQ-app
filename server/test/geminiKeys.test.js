import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geminiKeys, isKeyError, withGeminiKey, geminiOcrModels } from '../utils/geminiKeys.js';

test('merges and dedupes GEMINI_API_KEYS and GEMINI_API_KEY', () => {
  process.env.GEMINI_API_KEYS = 'a, b ,c';
  process.env.GEMINI_API_KEY = 'b';
  assert.deepEqual(geminiKeys().sort(), ['a', 'b', 'c']);
});

test('classifies quota/auth errors as key errors but not model-404s', () => {
  assert.ok(isKeyError(new Error('429 Too Many Requests: quota exceeded')));
  assert.ok(isKeyError(new Error('API key not valid')));
  assert.ok(!isKeyError(new Error('404 model not found')));
});

test('rotates to the next key when one is out of quota', async () => {
  process.env.GEMINI_API_KEYS = 'k1,k2,k3';
  delete process.env.GEMINI_API_KEY;
  let calls = 0;
  const result = await withGeminiKey(async () => {
    calls++;
    if (calls < 3) throw new Error('429 quota exceeded');
    return 'ok';
  });
  assert.equal(result, 'ok');
  assert.equal(calls, 3);
});

test('does not rotate on non-key errors', async () => {
  process.env.GEMINI_API_KEYS = 'k4,k5';
  let calls = 0;
  await assert.rejects(() => withGeminiKey(async () => { calls++; throw new Error('bad request body'); }));
  assert.equal(calls, 1);
});

test('OCR model list is env-overridable', () => {
  process.env.GEMINI_OCR_MODELS = 'my-model';
  assert.deepEqual(geminiOcrModels(), ['my-model']);
  delete process.env.GEMINI_OCR_MODELS;
  assert.ok(geminiOcrModels().length > 1);
});
