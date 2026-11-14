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
