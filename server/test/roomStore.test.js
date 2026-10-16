import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  setRoom,
  getRoom,
  hasRoom,
  deleteRoom,
  getRoomCount,
  getAllRooms,
} from '../db/roomStore.js';

describe('RoomStore (In-Memory & Redis Interface)', () => {
  const testRoomCode = 'TEST99';
  const testRoomData = {
    quizTitle: 'Unit Test Quiz',
    status: 'LOBBY',
    players: [{ id: 'sock-1', name: 'Tanaya', score: 0 }],
  };

  it('sets and retrieves a room', async () => {
    const saved = await setRoom(testRoomCode, testRoomData, 60);
    assert.equal(saved, true);

    const fetched = await getRoom(testRoomCode);
    assert.ok(fetched);
    assert.equal(fetched.quizTitle, 'Unit Test Quiz');
    assert.equal(fetched.players.length, 1);
  });

  it('checks if a room exists', async () => {
    assert.equal(await hasRoom(testRoomCode), true);
    assert.equal(await hasRoom('NONEXISTENT'), false);
  });

  it('lists active rooms in getAllRooms', async () => {
    const all = await getAllRooms();
    assert.ok(Array.isArray(all));
    assert.ok(all.some(([code]) => code === testRoomCode));
  });

  it('deletes a room', async () => {
    await deleteRoom(testRoomCode);
    assert.equal(await hasRoom(testRoomCode), false);
    assert.equal(await getRoom(testRoomCode), null);
  });

  it('handles empty inputs safely', async () => {
    assert.equal(await getRoom(''), null);
    assert.equal(await hasRoom(null), false);
    assert.equal(await setRoom('', null), false);
    assert.equal(await deleteRoom(''), false);
  });
});
