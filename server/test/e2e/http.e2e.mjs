// Real-server smoke test: spawns server/index.js with a fake Supabase + fake OpenAI-compatible LLM.
// Run: npm run e2e   (needs no API keys or database)
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
import { spawn } from 'node:child_process';

let mode = 'good'; // fake LLM behaviour
const llm = http.createServer((req, res) => {
  let body = '';
  req.on('data', d => (body += d));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    if (mode === '429') { res.statusCode = 429; return res.end('{"error":"quota exceeded 429"}'); }
    const prompt = JSON.parse(body || '{}').messages?.[0]?.content || '';
    const n = Number((prompt.match(/exactly (\d+)\./) || [])[1] || 3);
    let questions;
    if (mode === 'generic') {
      questions = Array.from({ length: n }, (_, i) => ({ question: `What is the primary foundational definition or role of "Study Material" in educational curriculum? ${i}`, options: ['a1','b1','c1','d1'].map(x=>x+i), correctAnswer: 0, explanation: 'generic explanation text', sourceReference: 'x' }));
    } else {
      const bank = [
        ['Which organelle produces most cellular ATP?', 'Mitochondria', 'Ribosome', 'Golgi body', 'Lysosome'],
        ['Which structure drives ATP synthase activity?', 'Electron transport chain', 'Cell wall', 'Nuclear pore', 'Centriole'],
        ['Where do ribosomes carry out their main job?', 'Protein synthesis', 'Lipid storage', 'DNA replication', 'Photosynthesis'],
        ['Which organelle packages proteins for secretion?', 'Golgi body', 'Vacuole', 'Chloroplast', 'Nucleolus'],
        ['Oxidative phosphorylation occurs across which membrane?', 'Inner mitochondrial membrane', 'Plasma membrane', 'Outer nuclear envelope', 'Thylakoid lumen'],
        ['Eukaryotic cells differ from prokaryotes because they have?', 'Membrane bound organelles', 'No ribosomes', 'No genetic material', 'Only a cell wall'],
        ['What molecule is the main energy currency here?', 'ATP', 'DNA', 'Cellulose', 'Keratin'],
      ];
      questions = Array.from({ length: n }, (_, i) => { const b = bank[i % bank.length]; return { question: b[0] + (i >= bank.length ? ' (variant ' + i + ' of the idea)' : ''), options: [b[1], b[2], b[3], b[4]], correctAnswer: 0, explanation: b[1] + ' is the correct answer because it matches the study notes.', sourceReference: 'Mitochondria produce ATP' }; });
    }
    res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ detectedTopic: 'Cell biology', questions }) } }] }));
  });
}).listen(5401);

const auth = http.createServer((req, res) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  res.setHeader('content-type', 'application/json');
  if (!t.startsWith('user-')) { res.statusCode = 401; return res.end('{}'); }
  res.end(JSON.stringify({ id: t, aud: 'authenticated', role: 'authenticated', email: t + '@x.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }));
}).listen(5402);

const srv = spawn('node', ['index.js'], { cwd: SERVER_DIR, stdio: ['ignore', 'ignore', 'inherit'],
  env: { PATH: process.env.PATH, HOME: process.env.HOME, PORT: '5400', NODE_ENV: 'development', SUPABASE_URL: 'http://127.0.0.1:5402', SUPABASE_ANON_KEY: 'a', OPENAI_API_KEY: 'sk-test', OPENAI_BASE_URL: 'http://127.0.0.1:5401' } });
for (let i = 0; i < 40; i++) { try { await fetch('http://127.0.0.1:5400/api/status', { signal: AbortSignal.timeout(500) }); break; } catch { await new Promise(r => setTimeout(r, 250)); } }

const base = 'http://127.0.0.1:5400';
const post = (path, body, token = 'user-a') => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) }).then(async r => ({ status: r.status, json: await r.json().catch(() => null) }));
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : extra); };

const notes = 'Mitochondria are organelles found in eukaryotic cells. They produce ATP through oxidative phosphorylation. The inner membrane contains the electron transport chain which drives ATP synthase. Ribosomes synthesize proteins while the Golgi body packages them.';

let r = await post('/api/generate-quiz', { directText: notes, count: 5 }, null);
check('no token -> 401', r.status === 401);

mode = 'good';
r = await post('/api/generate-quiz', { directText: notes, count: 5, difficulty: 'medium' });
check('notes -> 200 with 5 questions', r.status === 200 && r.json?.questions?.length === 5, JSON.stringify(r).slice(0, 300));
const qs = r.json?.questions || [];
check('questions have 4 options, explanation, valid answer', qs.every(q => q.options.length === 4 && q.explanation && q.correctAnswer >= 0 && q.correctAnswer <= 3));
check('correct answer index is shuffled (not always 0)', new Set(qs.map(q => q.correctAnswer)).size > 1 || qs.length < 3, JSON.stringify(qs.map(q => q.correctAnswer)));
check('shuffle keeps the right option marked correct', qs.every(q => ['Mitochondria','Electron transport chain','Protein synthesis','Golgi body','Inner mitochondrial membrane','Membrane bound organelles','ATP'].includes(q.options[q.correctAnswer])));
check('metadata grounded + not fallback', r.json?.fallback === false && r.json?.metadata?.grounded === true);

r = await post('/api/generate-quiz', { directText: 'Photosynthesis', count: 3 });
check('short topic -> 200 (topic-only mode)', r.status === 200 && r.json?.metadata?.grounded === false, JSON.stringify(r).slice(0, 200));

r = await post('/api/generate-quiz', { directText: notes, count: 500 });
check('count clamped to <=50', r.status === 200 && r.json.questions.length <= 50);

mode = 'generic';
r = await post('/api/generate-quiz', { directText: notes, count: 4 });
check('generic template questions are REJECTED -> 422, no fake questions', r.status === 422 && !r.json?.questions, JSON.stringify(r).slice(0, 250));

mode = '429';
r = await post('/api/generate-quiz', { directText: notes, count: 4 });
check('provider quota -> 429 with message', r.status === 429 && r.json?.success === false, JSON.stringify(r).slice(0, 250));

mode = 'good';
r = await post('/api/generate-quiz', { directText: 'hi', count: 4 });
check('greeting rejected -> 400', r.status === 400, JSON.stringify(r).slice(0, 200));

// uploads
const fd = new FormData(); fd.append('file', new Blob(['MZ binary'], { type: 'application/x-msdownload' }), 'evil.exe');
let u = await fetch(base + '/api/ingest', { method: 'POST', headers: { authorization: 'Bearer user-a' }, body: fd });
check('unsupported file -> 400 JSON', u.status === 400 && (await u.json()).success === false);
const big = new FormData(); big.append('file', new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'application/pdf' }), 'big.pdf');
u = await fetch(base + '/api/ingest', { method: 'POST', headers: { authorization: 'Bearer user-a' }, body: big });
check('oversize file -> 413 JSON', u.status === 413 && (await u.json()).success === false);

// materialId of another user w/o DB: standard path should error cleanly, not crash
r = await post('/api/generate-quiz', { materialId: 999, count: 3 });
check('materialId without DB -> clean JSON error (no hang/crash)', r.json && r.json.success === false, JSON.stringify(r).slice(0, 200));

srv.kill(); llm.close(); auth.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
