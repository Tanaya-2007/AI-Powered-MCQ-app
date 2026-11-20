import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { corsOrigin } from '../utils/corsOrigin.js';

async function withServer(origin, fn) {
  const app = express();
  app.use(cors({ origin, credentials: true }));
  app.get('/ping', (_req, res) => res.send('pong'));
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try { await fn(`http://127.0.0.1:${server.address().port}`); } finally { server.close(); }
}

const allowCheck = (o) => !o || o === 'https://good.app';

test('requests complete (do not hang) and allowed origins get CORS headers', async () => {
  await withServer(corsOrigin(allowCheck), async (base) => {
    const ok = await fetch(`${base}/ping`, { headers: { Origin: 'https://good.app' }, signal: AbortSignal.timeout(3000) });
    assert.equal(await ok.text(), 'pong');
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://good.app');

    const noOrigin = await fetch(`${base}/ping`, { signal: AbortSignal.timeout(3000) });
    assert.equal(noOrigin.status, 200);
  });
});

test('disallowed origins still get a response but no CORS header', async () => {
  await withServer(corsOrigin(allowCheck), async (base) => {
    const bad = await fetch(`${base}/ping`, { headers: { Origin: 'https://evil.com' }, signal: AbortSignal.timeout(3000) });
    assert.equal(bad.headers.get('access-control-allow-origin'), null);
  });
});

test('REGRESSION: a bare boolean function passed to cors hangs (why corsOrigin exists)', async () => {
  await withServer(allowCheck, async (base) => {
    await assert.rejects(() => fetch(`${base}/ping`, { headers: { Origin: 'https://good.app' }, signal: AbortSignal.timeout(800) }));
  });
});
