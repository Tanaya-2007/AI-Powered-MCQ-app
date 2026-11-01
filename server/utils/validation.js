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

// Normalized set of conversational greetings and filler
export const MAX_TEXT_INPUT_CHARS = 25000;

const COMMON_GREETINGS = new Set([
  'hi', 'hello', 'hey', 'heyy', 'heyyy', 'hiya', 'hola', 'bonjour', 'namaste',
  'howdy', 'sup', 'yo', 'wassup', 'whatsup', 'whats up', "what's up",
  'good morning', 'good afternoon', 'good evening', 'good day', 'good night',
  'how are you', 'how are u', 'how r u', 'how do you do',
  'bye', 'goodbye', 'cya', 'see you', 'see ya',
  'thanks', 'thank you', 'thank u', 'thx', 'welcome', 'youre welcome', "you're welcome",
  'ok', 'okay', 'k', 'cool', 'nice', 'great', 'fine', 'yes', 'no', 'yeah', 'nope'
]);

// Common placeholder / testing words
const PLACEHOLDER_WORDS = new Set([
  'test', 'testing', 'tester', 'test 123', 'test123', 'check', 'checking',
  'sample', 'example', 'demo', 'trial', 'temp', 'dummy', 'asdf', 'asdfgh',
  'qwerty', 'zxcv', 'foo', 'bar', 'baz', 'lorem ipsum', 'lorem', 'ipsum'
]);

// Generic commands without any actual academic subject
const GENERIC_COMMANDS = new Set([
  'make a quiz', 'create a quiz', 'generate a quiz', 'make quiz', 'create quiz',
  'generate quiz', 'give me questions', 'test me', 'quiz me', 'start quiz',
  'create test', 'make test', 'can you make a quiz', 'i want a quiz', 'mcq app'
]);

// Generic single academic words that are too broad to generate questions alone without context
const VAGUE_SINGLE_WORDS = new Set([
  'quiz', 'test', 'exam', 'question', 'questions', 'mcq', 'mcqs',
  'study', 'notes', 'topic', 'subject', 'anything', 'something', 'everything'
]);

/**
 * Non-academic, context-free words that are too vague to constitute an educational concept
 * on their own. (e.g. "world" — which world? what aspect?).
 */
const VAGUE_GENERIC_WORDS = new Set([
  'world', 'life', 'time', 'thing', 'things', 'stuff', 'matter', 'way', 'ways',
  'place', 'places', 'people', 'person', 'man', 'woman', 'men', 'women',
  'day', 'days', 'year', 'years', 'week', 'weeks', 'month', 'months',
  'part', 'parts', 'type', 'types', 'kind', 'kinds', 'form', 'forms',
  'idea', 'ideas', 'fact', 'facts', 'point', 'points', 'case', 'cases',
  'it', 'this', 'that', 'these', 'those', 'here', 'there',
  'work', 'works', 'use', 'used', 'know', 'make', 'get', 'go', 'come',
  'information', 'data', 'details', 'general', 'specific', 'various', 'different',
  'important', 'useful', 'common', 'basic', 'simple', 'complex',
  'wow', 'oh', 'ah', 'um', 'uh', 'hmm', 'hm', 'err', 'right', 'well',
  'random', 'anything', 'everything', 'something', 'nothing', 'all', 'any'
]);

const VAGUE_ADJECTIVES = new Set([
  'good', 'bad', 'new', 'old', 'big', 'small', 'large', 'long', 'short',
  'high', 'low', 'hot', 'cold', 'fast', 'slow', 'hard', 'easy',
  'real', 'true', 'false', 'main', 'key', 'other', 'same', 'next', 'last'
]);

const ACADEMIC_PATTERNS = [
  /\b(theorem|lemma|algorithm|equation|formula|hypothesis|theory|principle|law|model)\b/i,
  /\b(photosynthesis|mitosis|meiosis|osmosis|diffusion|evolution|respiration)\b/i,
  /\b(calculus|algebra|geometry|trigonometry|statistics|probability)\b/i,
  /\b(physics|chemistry|biology|ecology|astronomy|geology|genetics|botany|zoology)\b/i,
  /\b(programming|algorithm|database|networking|operating\s+system|machine\s+learning|ai|neural\s+network)\b/i,
  /\b(history|geography|economics|sociology|psychology|philosophy|anthropology)\b/i,
  /\b(french|american|industrial|world\s+war|cold\s+war|civil\s+war|revolution)\b/i,
  /\b(newton|einstein|darwin|freud|plato|socrates|aristotle|shakespeare)\b/i,
  /\b(dna|rna|atp|nadh|mrna|trna|protein|enzyme|hormone|neuron|synapse|nucleus)\b/i,
  /\b(force|energy|momentum|velocity|acceleration|gravity|electromagnetism|quantum)\b/i,
  /\b\d{4}\b/,
  /[A-Z][a-z]+\s+[A-Z][a-z]+/,
  /\b[A-Z]{2,}\b/
];

/**
 * Validates whether text input has sufficient academic / topical substance
 * to generate a quiz, filtering out greetings, placeholders, gibberish, and vague words.
 */
export function validateStudyText(text) {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      reason: 'EMPTY',
      message: 'Please enter your study notes or a quiz topic.'
    };
  }

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');

  if (lower.length < 3) {
    return {
      isValid: false,
      reason: 'TOO_SHORT',
      message: 'Input is too short. Please enter an educational topic (e.g. "Photosynthesis") or paste study notes.'
    };
  }

  if (trimmed.length > MAX_TEXT_INPUT_CHARS) {
    return {
      isValid: false,
      reason: 'TOO_LONG',
      message: `Input exceeds the maximum limit of ${MAX_TEXT_INPUT_CHARS.toLocaleString()} characters. Please shorten your study notes or paste a chapter summary.`
    };
  }

  if (COMMON_GREETINGS.has(lower)) {
    return {
      isValid: false,
      reason: 'GREETING',
      message: `"${trimmed}" is a conversational greeting, not an educational concept. Please enter a subject topic (e.g. "Photosynthesis", "Binary Search Trees", "World War II") or paste your study notes.`
    };
  }

  if (PLACEHOLDER_WORDS.has(lower)) {
    return {
      isValid: false,
      reason: 'PLACEHOLDER',
      message: `"${trimmed}" is a placeholder or test string. Please provide actual study material or a real subject topic to generate quiz questions.`
    };
  }

  if (GENERIC_COMMANDS.has(lower)) {
    return {
      isValid: false,
      reason: 'GENERIC_COMMAND',
      message: 'Please specify the subject or topic you want to be quizzed on (e.g. "Operating Systems", "Calculus", "Organic Chemistry").'
    };
  }

  if (VAGUE_SINGLE_WORDS.has(lower)) {
    return {
      isValid: false,
      reason: 'VAGUE_SINGLE_WORD',
      message: `"${trimmed}" is too generic. Please specify an educational concept or topic (e.g. "Photosynthesis", "Machine Learning", "French Revolution").`
    };
  }

  if (/(.)\1{3,}/.test(lower)) {
    return {
      isValid: false,
      reason: 'REPEATED_CHARS',
      message: 'The entered text contains repetitive characters. Please provide meaningful study notes or a concept topic.'
    };
  }

  const mashPatterns = [
    /^(?:asdf|asdfgh|asdfghjkl|qwerty|qwertyuiop|zxcv|zxcvbnm|123456|abcdef)+$/i
  ];
  if (mashPatterns.some(pat => pat.test(lower))) {
    return {
      isValid: false,
      reason: 'KEYBOARD_MASH',
      message: 'The entered text appears to be keyboard mash. Please provide a real topic or study notes.'
    };
  }

  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const alphabeticWords = words.filter(w => /[a-zA-Z]/.test(w));

  if (alphabeticWords.length === 0) {
    return {
      isValid: false,
      reason: 'NO_ALPHABETIC_WORDS',
      message: 'Please provide a valid text topic or notes containing words.'
    };
  }

  const allGreetings = words.every(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    return COMMON_GREETINGS.has(cleanWord) || cleanWord === '';
  });
  if (allGreetings && words.length <= 4) {
    return {
      isValid: false,
      reason: 'GREETING_PHRASE',
      message: `"${trimmed}" is a greeting phrase. Please provide an educational topic or study notes instead.`
    };
  }

  // Fast-pass for recognized academic patterns
  if (ACADEMIC_PATTERNS.some(pat => pat.test(trimmed))) {
    const isNotes = words.length >= 15 || trimmed.length >= 100;
    return {
      isValid: true,
      reason: 'VALID',
      type: isNotes ? 'NOTES' : 'TOPIC',
      wordCount: words.length,
      charCount: trimmed.length,
      message: isNotes
        ? `Comprehensive study material ready (${words.length} words).`
        : `Valid academic topic ready: "${trimmed}".`
    };
  }

  // Single vague generic word check (e.g. "world")
  if (words.length === 1) {
    const singleWord = lower.replace(/[^a-z]/g, '');
    if (VAGUE_GENERIC_WORDS.has(singleWord)) {
      return {
        isValid: false,
        reason: 'VAGUE_GENERIC_WORD',
        message: `"${trimmed}" is too vague to generate a quiz on. It has no specific academic or educational domain. Please be more specific — for example, enter "World War II", "World History", "World Geography", or paste your actual study notes.`
      };
    }
  }

  // Short phrase where all words are vague
  if (words.length >= 2 && words.length <= 3) {
    const cleanWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
    const allVague = cleanWords.every(w =>
      VAGUE_GENERIC_WORDS.has(w) || VAGUE_ADJECTIVES.has(w) || VAGUE_SINGLE_WORDS.has(w) || COMMON_GREETINGS.has(w)
    );
    if (allVague && cleanWords.every(w => w.length > 0)) {
      return {
        isValid: false,
        reason: 'VAGUE_PHRASE',
        message: `"${trimmed}" is too vague to generate quiz questions on. Please provide a specific educational topic (e.g. "World War II", "Newton's Laws of Motion", "Data Structures") or paste your actual study notes.`
      };
    }
  }

  // Minimum information density check for very short inputs
  if (trimmed.length < 40 && words.length < 3) {
    const hasSubstantialWord = alphabeticWords.some(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      return (
        clean.length >= 5 &&
        !VAGUE_GENERIC_WORDS.has(clean) &&
        !VAGUE_ADJECTIVES.has(clean) &&
        !COMMON_GREETINGS.has(clean) &&
        !PLACEHOLDER_WORDS.has(clean)
      );
    });
    if (!hasSubstantialWord) {
      return {
        isValid: false,
        reason: 'LOW_INFORMATION_DENSITY',
        message: `"${trimmed}" doesn't contain a specific enough concept to generate quiz questions. Please enter an educational topic or subject (e.g. "Photosynthesis", "Operating Systems", "French Revolution").`
      };
    }
  }

  const isNotes = words.length >= 15 || trimmed.length >= 100;

  return {
    isValid: true,
    reason: 'VALID',
    type: isNotes ? 'NOTES' : 'TOPIC',
    wordCount: words.length,
    charCount: trimmed.length,
    message: isNotes
      ? `Comprehensive study material ready (${words.length} words).`
      : `Valid academic topic ready: "${trimmed}".`
  };
}
