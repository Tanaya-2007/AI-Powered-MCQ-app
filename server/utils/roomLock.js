/**
 * Per-room async mutex. Room state is read → modified → written back (Redis is not atomic across
 * those steps), so concurrent socket events for the same room would overwrite each other
 * (e.g. two players answering at the same instant → one score lost). Serialising handlers per
 * room code fixes that on a single server instance.
 */
const tails = new Map();

export function withRoomLock(roomCode, fn) {
  const key = String(roomCode || '');
  const prev = tails.get(key) || Promise.resolve();
  const run = prev.catch(() => {}).then(fn);
  tails.set(key, run);
  const cleanup = () => { if (tails.get(key) === run) tails.delete(key); };
  run.then(cleanup, cleanup);
  return run;
}
