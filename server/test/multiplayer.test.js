import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withRoomLock } from '../utils/roomLock.js';
import { canScoreAnswer } from '../utils/validation.js';

const room = (over = {}) => ({ status: 'PLAYING', currentQuestionIndex: 1, questions: [{}, {}, {}], ...over });

test('canScoreAnswer blocks duplicates, future questions, bad index and non-playing rooms', () => {
  const player = { answered: [0] };
  assert.equal(canScoreAnswer(room(), player, 1).ok, true);
  assert.equal(canScoreAnswer(room(), player, 0).reason, 'already-answered');
  assert.equal(canScoreAnswer(room(), player, 2).reason, 'future-question');
  assert.equal(canScoreAnswer(room(), player, 9).reason, 'bad-index');
  assert.equal(canScoreAnswer(room(), player, 'x').reason, 'bad-index');
  assert.equal(canScoreAnswer(room({ status: 'LOBBY' }), player, 1).reason, 'not-playing');
  assert.equal(canScoreAnswer(room(), null, 1).ok, false);
});

test('withRoomLock serialises read-modify-write so no update is lost', async () => {
  let stored = 0;
  const bump = () => withRoomLock('ROOM1', async () => {
    const read = stored;
    await new Promise((r) => setTimeout(r, 5)); // simulates a Redis round trip
    stored = read + 1;
  });
  await Promise.all(Array.from({ length: 20 }, bump));
  assert.equal(stored, 20);
});

test('withRoomLock keeps going after a handler throws', async () => {
  await assert.rejects(() => withRoomLock('ROOM2', async () => { throw new Error('boom'); }));
  assert.equal(await withRoomLock('ROOM2', async () => 'ok'), 'ok');
});
