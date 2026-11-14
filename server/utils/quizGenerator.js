import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateGroqContent } from './groq.js';
import { generateOpenAIContent } from './openai.js';

/**
 * Production quiz generator.
 * - Tries every configured provider (Groq -> OpenAI -> Gemini), 2 attempts each.
 * - Two prompt modes: NOTES (strictly grounded in pasted/uploaded text) and
 *   TOPIC (short input like "Photosynthesis": model uses its own subject knowledge).
 * - Rejects templated / ungrounded questions.
 * - Shuffles options server-side (LLMs love putting the answer at index 0/1).
 * - Throws on failure. NEVER returns placeholder questions.
 */

export class QuizGenerationError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'QuizGenerationError';
    this.status = status;
  }
}

export const TOPIC_ONLY_MAX_CHARS = 400;

const GENERIC_PATTERNS = [
  /foundational definition/i,
  /educational curriculum/i,
  /industry-standard best practice/i,
  /common misconception when students/i,
  /primary challenge typically encountered/i,
  /based on your study notes, complete/i,
  /in the context of ["“].+["”], which operational consideration/i,
];

const STOPWORDS = new Set((
  'the a an and or of to in on for with by is are was were be been this that these those it its as at from ' +
  'which what who whom how why when where does do did not no yes can could should would will may might ' +
  'into than then them they their there about over under between during after before each any all most more'
).split(' '));

function tokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function shuffleOptions(q) {
  const correct = q.options[q.correctAnswer];
  const opts = [...q.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { ...q, options: opts, correctAnswer: opts.indexOf(correct) };
}

// ── Provider chain ──────────────────────────────────────────────────────────
function geminiModels() {
  const fromEnv = (process.env.GEMINI_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return fromEnv.length ? fromEnv : ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];
}

async function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let last;
  for (const name of geminiModels()) {
    try {
      const model = genAI.getGenerativeModel({
        model: name,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
      });
      const r = await model.generateContent(prompt);
      const text = r?.response?.text();
      if (text) return text;
    } catch (e) {
      last = e;
      console.warn(`⚠️ Gemini ${name} failed: ${e.message}`);
    }
  }
  throw last || new Error('All Gemini models failed');
}

function providers() {
  const list = [];
  if (process.env.GROQ_API_KEY) list.push({ name: 'groq', run: (p) => generateGroqContent(p, 'application/json') });
  if (process.env.OPENAI_API_KEY) list.push({ name: 'openai', run: (p) => generateOpenAIContent(p, 'application/json') });
  if (process.env.GEMINI_API_KEY) list.push({ name: 'gemini', run: callGemini });
  return list;
}

async function callLLM(prompt) {
  const chain = providers();
  if (!chain.length) throw new QuizGenerationError('No AI provider is configured on the server.', 500);
  const errors = [];
  for (const p of chain) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const text = await p.run(prompt);
        if (text && text.trim()) return text;
      } catch (e) {
        errors.push(`${p.name}#${attempt}: ${e.message}`);
        console.warn(`⚠️ ${p.name} attempt ${attempt} failed: ${e.message}`);
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
  }
  const joined = errors.join(' | ');
  const status = /429|quota/i.test(joined) ? 429 : /401|403|API_KEY|invalid/i.test(joined) ? 401 : 502;
  throw new QuizGenerationError(`All AI providers failed. ${joined}`.slice(0, 600), status);
}

function parseJson(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('LLM returned non-JSON output');
  }
}

// ── Prompt ──────────────────────────────────────────────────────────────────
function buildPrompt({ topic, contextText, needed, difficulty, avoid, topicOnly }) {
  const difficultyGuide = {
    easy: 'direct recall of key terms and definitions',
    medium: 'understanding and application; plausible distractors that need real knowledge to rule out',
    hard: 'multi-step reasoning, edge cases, comparisons, and "why/what happens if" scenarios; distractors that are subtly wrong',
  }[difficulty] || 'understanding and application';

  const source = topicOnly
    ? `The learner typed only a subject: "${contextText.trim()}".
Write questions from your own expert knowledge of this subject. Cover DIFFERENT subtopics, facts, mechanisms, formulas, examples, people, dates or cases. Every question must test a concrete, verifiable fact.`
    : `Use ONLY the study material below as the source of facts. Every question must be answerable from it, and must name or test specific details (terms, numbers, names, steps, causes) that appear in it. Spread questions across the whole material, not just the opening.

STUDY MATERIAL:
"""
${contextText}
"""`;

  return `You are a senior exam-setter writing a production-quality MCQ quiz.

${source}

Difficulty: ${difficulty} (${difficultyGuide}).
Number of questions: exactly ${needed}.
${topic ? `Topic focus: "${topic}".` : ''}
${avoid.length ? `Do NOT repeat or paraphrase these existing questions:\n${avoid.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

HARD RULES:
- NEVER write meta questions such as "what is the foundational definition/role of X", "which best practice applies to X", "what is a common misconception about studying X". Each question must test a specific fact or concept.
- Exactly 4 options, one unambiguously correct, three plausible but clearly wrong. No "all/none of the above". Options must be similar in length and style.
- Vary where the correct answer sits (do not default to the first option).
- Explanation: 1-3 sentences saying why the answer is right and why the main distractor is wrong.
- sourceReference: the specific sentence/idea from the material (or the subtopic if topic-only).

Return ONLY JSON:
{"detectedTopic":"specific topic title","questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":0,"explanation":"...","sourceReference":"..."}]}`;
}

// ── Validation ──────────────────────────────────────────────────────────────
function validate(q, { contextTokens, topicOnly }) {
  if (!q || typeof q.question !== 'string' || q.question.trim().split(/\s+/).length < 5) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3) return false;
  if (typeof q.explanation !== 'string' || q.explanation.trim().length < 10) return false;
  const opts = q.options.map((o) => String(o).trim());
  if (opts.some((o) => !o) || new Set(opts.map((o) => o.toLowerCase())).size !== 4) return false;
  if (GENERIC_PATTERNS.some((p) => p.test(q.question))) return false;
  if (!topicOnly) {
    const qt = new Set(tokens(`${q.question} ${q.explanation} ${q.sourceReference || ''} ${opts.join(' ')}`));
    let overlap = 0;
    for (const t of qt) if (contextTokens.has(t)) overlap++;
    if (overlap < 3) return false; // not grounded in the supplied material
  }
  return true;
}

// ── Public API ──────────────────────────────────────────────────────────────
export async function generateQuiz({ topic = '', contextText, count, difficulty = 'medium' }) {
  const topicOnly = contextText.trim().length < TOPIC_ONLY_MAX_CHARS;
  const contextTokens = new Set(tokens(contextText));
  const accepted = [];
  const acceptedTokens = [];
  let detectedTopic = topic;
  let lastErr;

  for (let round = 1; round <= 4 && accepted.length < count; round++) {
    const needed = count - accepted.length;
    const batch = Math.min(needed + (round === 1 ? 2 : 0), 30);
    try {
      const raw = await callLLM(buildPrompt({
        topic, contextText, needed: batch, difficulty, topicOnly,
        avoid: accepted.map((q) => q.question),
      }));
      const payload = parseJson(raw);
      if (payload.detectedTopic && !detectedTopic) detectedTopic = String(payload.detectedTopic).slice(0, 120);

      for (const q of payload.questions || []) {
        if (!validate(q, { contextTokens, topicOnly })) continue;
        const t = tokens(q.question);
        if (acceptedTokens.some((a) => jaccard(a, t) > 0.6)) continue;
        accepted.push(shuffleOptions({
          id: accepted.length + 1,
          question: q.question.trim(),
          options: q.options.map((o) => String(o).trim()),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation.trim(),
          difficulty,
          topic: detectedTopic || topic,
          sourceReference: String(q.sourceReference || '').slice(0, 300),
        }));
        acceptedTokens.push(t);
        if (accepted.length >= count) break;
      }
    } catch (e) {
      lastErr = e;
      console.warn(`⚠️ Generation round ${round} failed: ${e.message}`);
      if (e instanceof QuizGenerationError && (e.status === 401 || e.status === 429 || e.status === 500)) break;
    }
  }

  if (accepted.length === 0) {
    if (lastErr instanceof QuizGenerationError) throw lastErr;
    throw new QuizGenerationError(
      'The AI could not produce good questions from this input. Try adding more detail or pasting more of your notes.',
      422
    );
  }
  return {
    questions: accepted.slice(0, count).map((q, i) => ({ ...q, id: i + 1 })),
    detectedTopic: detectedTopic || topic || 'Study Quiz',
    partial: accepted.length < count,
    topicOnly,
  };
}
