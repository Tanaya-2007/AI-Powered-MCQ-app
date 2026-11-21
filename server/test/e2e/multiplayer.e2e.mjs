// Real multiplayer test with socket.io clients: answers hidden until reveal, no point farming, no room takeover.
// Run: npm run e2e   (needs no API keys or database; requires root `npm install` for socket.io-client)
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(path.join(SERVER_DIR, '..', 'package.json'));
const { io } = require('socket.io-client');

// fake Supabase auth server: any bearer token "user-<id>" is user <id>
const auth = http.createServer((req, res) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!t.startsWith('user-')) { res.writeHead(401, {'content-type':'application/json'}); return res.end('{"msg":"bad"}'); }
  res.writeHead(200, {'content-type':'application/json'});
  res.end(JSON.stringify({ id: t, aud: 'authenticated', role: 'authenticated', email: t + '@x.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }));
}).listen(5198);

const srv = spawn('node', ['index.js'], { cwd: SERVER_DIR, env: { ...process.env, PORT: '5197', SUPABASE_URL: 'http://127.0.0.1:5198', SUPABASE_ANON_KEY: 'anon', NODE_ENV: 'development' }, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { await fetch('http://127.0.0.1:5197/api/status', { signal: AbortSignal.timeout(500) }); break; } catch { await new Promise(r => setTimeout(r, 250)); } }

const connect = (token) => new Promise((res) => { const s = io('http://127.0.0.1:5197', { auth: { token }, transports: ['polling','websocket'] }); s.on('connect', () => res(s)); });
const once = (s, ev, ms = 3000) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout ' + ev)), ms); s.once(ev, (d) => { clearTimeout(t); res(d); }); });
const results = [];
const check = (name, ok) => { results.push([name, ok]); console.log(ok ? 'PASS' : 'FAIL', name); };

const questions = [
  { question: 'Q1 what is two plus two?', options: ['3', '4', '5', '6'], correctAnswer: 1, explanation: 'EXPL-ONE' },
  { question: 'Q2 capital of France?', options: ['Rome', 'Paris', 'Berlin', 'Madrid'], correctAnswer: 1, explanation: 'EXPL-TWO' },
];
try {
  const host = await connect('user-host');
  const player = await connect('user-p1');
  const attacker = await connect('user-attacker');

  host.emit('create-room', { roomCode: 'ROOM42', quizTitle: 'T', questions, difficulty: 'easy', timePerQuestion: 30 });
  await once(host, 'room-created');

  // room takeover attempt by another account
  attacker.emit('create-room', { roomCode: 'ROOM42', quizTitle: 'evil', questions: [], timePerQuestion: 30 });
  const err = await once(attacker, 'join-error');
  check('room takeover by another user is rejected', /already in use/.test(err.message));

  player.emit('join-room', { roomCode: 'ROOM42', playerName: 'Pia', avatar: '🦊' });
  await once(player, 'join-success');

  const started = once(player, 'quiz-started');
  host.emit('start-quiz', { roomCode: 'ROOM42' });
  const qs = await started;
  const raw = JSON.stringify(qs);
  check('quiz-started has no correctAnswer', !raw.includes('correctAnswer'));
  check('quiz-started has no explanation', !raw.includes('EXPL-'));
  check('quiz-started still has question text + options', qs.questions.length === 2 && qs.questions[0].options.length === 4);

  // answer Q1 correctly, twice (point farming)
  player.emit('submit-answer', { roomCode: 'ROOM42', questionIndex: 0, selectedOption: 1, timeTaken: 3 });
  await once(player, 'scores-updated');
  player.emit('submit-answer', { roomCode: 'ROOM42', questionIndex: 0, selectedOption: 1, timeTaken: 3 });
  player.emit('submit-answer', { roomCode: 'ROOM42', questionIndex: 0, selectedOption: 1, timeTaken: 3 });
  await new Promise(r => setTimeout(r, 400));

  // reveal -> player gets the answer
  const revealed = once(player, 'results-revealed');
  host.emit('reveal-results', { roomCode: 'ROOM42' });
  const rev = await revealed;
  check('results-revealed carries correctAnswer + explanation', rev.correctAnswer === 1 && rev.explanation === 'EXPL-ONE' && rev.questionIndex === 0);

  // late answer after reveal must not score; get scores via another event
  const upd = once(host, 'scores-updated', 1500).catch(() => null);
  player.emit('submit-answer', { roomCode: 'ROOM42', questionIndex: 0, selectedOption: 1, timeTaken: 1 });
  await upd;

  host.emit('next-question', { roomCode: 'ROOM42', nextIndex: 1 });
  await once(player, 'show-question');
  const fin = once(host, 'quiz-finished');
  player.emit('submit-answer', { roomCode: 'ROOM42', questionIndex: 1, selectedOption: 1, timeTaken: 2 });
  await once(player, 'scores-updated');
  host.emit('end-quiz', { roomCode: 'ROOM42' });
  const lb = (await fin).leaderboard.find(p => p.name === 'Pia');
  check('final score = 20 (Q1 once + Q2 once; replays and post-reveal ignored)', lb.score === 20);
} catch (e) { console.log('ERROR', e.message); results.push(['no errors', false]); }
srv.kill(); auth.close();
console.log(results.every(r => r[1]) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(r => r[1]) ? 0 : 1);
