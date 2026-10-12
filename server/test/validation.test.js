import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeRoomCode,
  sanitizePlayerName,
  sanitizeAvatar,
  clampTimePerQuestion,
  clampQuestionCount,
  normalizeDifficulty,
  sanitizeQuestionsForRoom,
  isValidEmail,
  MAX_QUESTIONS_PER_REQUEST,
  MAX_ROOMS,
  MAX_PLAYERS_PER_ROOM,
} from '../utils/validation.js';

describe('sanitizeRoomCode', () => {
  it('uppercases and strips non-alphanumeric', () => {
    assert.equal(sanitizeRoomCode('ab12-cd'), 'AB12CD');
  });
  it('caps at 8 chars', () => {
    assert.equal(sanitizeRoomCode('ABCDEFGHIJK123').length, 8);
  });
  it('handles missing input', () => {
    assert.equal(sanitizeRoomCode(undefined), '');
    assert.equal(sanitizeRoomCode(null), '');
  });
});

describe('sanitizePlayerName', () => {
  it('trims and caps at 20 chars', () => {
    assert.equal(sanitizePlayerName('  Tanaya  '), 'Tanaya');
    assert.equal(sanitizePlayerName('x'.repeat(50)).length, 20);
  });
  it('handles missing input', () => {
    assert.equal(sanitizePlayerName(undefined), '');
  });
});

describe('sanitizeAvatar', () => {
  it('defaults to person emoji', () => {
    assert.equal(sanitizeAvatar(undefined), '🧑');
  });
  it('passes through chosen emoji', () => {
    assert.equal(sanitizeAvatar('🦊'), '🦊');
  });
});

describe('clampTimePerQuestion', () => {
  it('clamps to 5..300 with default 60', () => {
    assert.equal(clampTimePerQuestion(1), 5);
    assert.equal(clampTimePerQuestion(1000), 300);
    assert.equal(clampTimePerQuestion(90), 90);
    assert.equal(clampTimePerQuestion('abc'), 60);
    assert.equal(clampTimePerQuestion(undefined), 60);
  });
});

describe('clampQuestionCount', () => {
  it('clamps to 1..MAX', () => {
    assert.equal(clampQuestionCount(0), 1);
    assert.equal(clampQuestionCount(500), MAX_QUESTIONS_PER_REQUEST);
    assert.equal(clampQuestionCount(10), 10);
    assert.equal(clampQuestionCount('xyz'), 5);
  });
});

describe('normalizeDifficulty', () => {
  it('allowlists easy/medium/hard', () => {
    assert.equal(normalizeDifficulty('hard'), 'hard');
    assert.equal(normalizeDifficulty('HARD'), 'medium');
    assert.equal(normalizeDifficulty('"; DROP TABLE'), 'medium');
  });
});

describe('sanitizeQuestionsForRoom', () => {
  it('returns [] for non-arrays', () => {
    assert.deepEqual(sanitizeQuestionsForRoom(null), []);
    assert.deepEqual(sanitizeQuestionsForRoom('x'), []);
  });
  it('caps at 100 questions and fixes bad correctAnswer', () => {
    const input = Array.from({ length: 150 }, (_, i) => ({
      question: 'Q' + i,
      options: ['a', 'b', 'c', 'd'],
      correctAnswer: 9,
    }));
    const out = sanitizeQuestionsForRoom(input);
    assert.equal(out.length, 100);
    assert.equal(out[0].correctAnswer, 0);
  });
  it('keeps valid correctAnswer', () => {
    const out = sanitizeQuestionsForRoom([
      { question: 'Q', options: ['a', 'b', 'c', 'd'], correctAnswer: 2 },
    ]);
    assert.equal(out[0].correctAnswer, 2);
  });
});

describe('isValidEmail', () => {
  it('accepts normal emails, rejects junk', () => {
    assert.equal(isValidEmail('a@b.com'), true);
    assert.equal(isValidEmail('not-an-email'), false);
    assert.equal(isValidEmail('a@b'), false);
    assert.equal(isValidEmail(''), false);
    assert.equal(isValidEmail(null), false);
  });
});

describe('caps', () => {
  it('room/player caps are sane', () => {
    assert.ok(MAX_ROOMS > 0 && MAX_PLAYERS_PER_ROOM > 0);
  });
});
