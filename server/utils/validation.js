/**
 * Shared input validation + sanitization helpers for HTTP routes and Socket.io events.
 * Pure functions (no I/O) so they are unit-testable with node:test.
 */

export const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
export const MAX_QUESTIONS_PER_REQUEST = 50;
export const MAX_ROOMS = 500;
export const MAX_PLAYERS_PER_ROOM = 200;

export function sanitizeRoomCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export function sanitizePlayerName(name) {
  return String(name || '').trim().slice(0, 20);
}

export function sanitizeAvatar(avatar) {
  return String(avatar || '🧑').slice(0, 8);
}

export function clampTimePerQuestion(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 60;
  return Math.min(300, Math.max(5, Math.floor(n)));
}

export function clampQuestionCount(v) {
  const n = Number(v);
  const safe = Number.isFinite(n) ? Math.floor(n) : 5;
  return Math.min(MAX_QUESTIONS_PER_REQUEST, Math.max(1, safe));
}

export function normalizeDifficulty(difficulty) {
  return ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';
}

export function sanitizeQuestionsForRoom(questions) {
  if (!Array.isArray(questions)) return [];
  return questions.slice(0, 100).map((q, idx) => ({
    id: q?.id || idx + 1,
    question: String(q?.question || '').slice(0, 1000),
    options: Array.isArray(q?.options) ? q.options.slice(0, 4).map((o) => String(o).slice(0, 500)) : [],
    correctAnswer:
      typeof q?.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
        ? q.correctAnswer
        : 0,
    explanation: String(q?.explanation || '').slice(0, 2000),
  }));
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
