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
  validateStudyText,
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

describe('validateStudyText', () => {
  it('rejects empty and whitespace inputs', () => {
    assert.equal(validateStudyText('').isValid, false);
    assert.equal(validateStudyText('   ').isValid, false);
    assert.equal(validateStudyText(null).isValid, false);
  });

  it('rejects conversational greetings and filler (hi, hello, etc.)', () => {
    assert.equal(validateStudyText('hi').isValid, false);
    assert.equal(validateStudyText('hello').isValid, false);
    assert.equal(validateStudyText('Hello!').isValid, false);
    assert.equal(validateStudyText('good morning').isValid, false);
    assert.equal(validateStudyText('hi hello hey').isValid, false);
    assert.equal(validateStudyText('thanks').isValid, false);
  });

  it('rejects testing placeholders and commands without topic', () => {
    assert.equal(validateStudyText('test').isValid, false);
    assert.equal(validateStudyText('make a quiz').isValid, false);
    assert.equal(validateStudyText('create test').isValid, false);
    assert.equal(validateStudyText('quiz').isValid, false);
  });

  it('rejects gibberish, repetitive chars and keyboard mash', () => {
    assert.equal(validateStudyText('aaaaaa').isValid, false);
    assert.equal(validateStudyText('asdfghjkl').isValid, false);
    assert.equal(validateStudyText('qwertyuiop').isValid, false);
    assert.equal(validateStudyText('12345678').isValid, false);
  });

  it('accepts valid academic topics', () => {
    const res1 = validateStudyText('Photosynthesis');
    assert.equal(res1.isValid, true);
    assert.equal(res1.type, 'TOPIC');

    const res2 = validateStudyText('Newton laws of motion');
    assert.equal(res2.isValid, true);
    assert.equal(res2.type, 'TOPIC');

    const res3 = validateStudyText('Binary Search Trees in C++');
    assert.equal(res3.isValid, true);
    assert.equal(res3.type, 'TOPIC');
  });

  it('accepts comprehensive lecture notes', () => {
    const notes = 'Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism activities.';
    const res = validateStudyText(notes);
    assert.equal(res.isValid, true);
    assert.equal(res.type, 'NOTES');
  });
});
