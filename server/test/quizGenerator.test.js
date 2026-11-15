import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateQuiz, QuizGenerationError } from '../utils/quizGenerator.js';

test('throws (never returns placeholder questions) when no provider is configured', async () => {
  for (const k of ['GROQ_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY']) delete process.env[k];
  await assert.rejects(
    () => generateQuiz({ topic: 'Photosynthesis', contextText: 'Photosynthesis', count: 5 }),
    (e) => e instanceof QuizGenerationError && e.status === 500
  );
});

import { capContext, MAX_CONTEXT_CHARS } from '../utils/quizGenerator.js';

test('capContext leaves short text alone and bounds long text across the whole document', () => {
  assert.equal(capContext('short'), 'short');
  const segs = Array.from({ length: 50 }, (_, i) => `segment-${i} ` + 'x'.repeat(800));
  const out = capContext(segs.join('\n\n---\n\n'));
  assert.ok(out.length <= MAX_CONTEXT_CHARS + 200);
  assert.ok(out.includes('segment-0') && out.includes('segment-4')); // spread, not just the opening
  assert.ok(/segment-(2|3)\d/.test(out));
});
