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

/**
 * Production-grade study material and quiz topic validation.
 * Uses NLP-like heuristics (no external packages required) to determine whether
 * user input is an actual substantive academic concept or study notes —
 * rather than conversational filler, vague meaningless words, emotions, or gibberish.
 */

// ─── Constants & Limits ─────────────────────────────────────────────────────

export const MAX_TEXT_INPUT_CHARS = 25000;

// ─── Blocklists & NLP Dictionaries ──────────────────────────────────────────

const COMMON_GREETINGS = new Set([
  'hi', 'hello', 'hey', 'heyy', 'heyyy', 'hiya', 'hola', 'bonjour', 'namaste',
  'howdy', 'sup', 'yo', 'wassup', 'whatsup', 'whats up', "what's up",
  'good morning', 'good afternoon', 'good evening', 'good day', 'good night',
  'how are you', 'how are u', 'how r u', 'how do you do',
  'bye', 'goodbye', 'cya', 'see you', 'see ya',
  'thanks', 'thank you', 'thank u', 'thx', 'welcome', 'youre welcome', "you're welcome",
  'ok', 'okay', 'k', 'cool', 'nice', 'great', 'fine', 'yes', 'no', 'yeah', 'nope'
]);

const PLACEHOLDER_WORDS = new Set([
  'test', 'testing', 'tester', 'test 123', 'test123', 'check', 'checking',
  'sample', 'example', 'demo', 'trial', 'temp', 'dummy', 'asdf', 'asdfgh',
  'qwerty', 'zxcv', 'foo', 'bar', 'baz', 'lorem ipsum', 'lorem', 'ipsum'
]);

const GENERIC_COMMANDS = new Set([
  'make a quiz', 'create a quiz', 'generate a quiz', 'make quiz', 'create quiz',
  'generate quiz', 'give me questions', 'test me', 'quiz me', 'start quiz',
  'create test', 'make test', 'can you make a quiz', 'i want a quiz', 'mcq app'
]);

const VAGUE_SINGLE_WORDS = new Set([
  'quiz', 'test', 'exam', 'question', 'questions', 'mcq', 'mcqs',
  'study', 'notes', 'topic', 'subject', 'anything', 'something', 'everything'
]);

/**
 * NLP Emotion, Mood, and Affective terms.
 * Bare emotions are not academic subjects unless qualified (e.g. "Positive Psychology").
 */
const EMOTION_AND_MOOD_WORDS = new Set([
  'happy', 'happiness', 'sad', 'sadness', 'angry', 'anger', 'joy', 'joyful',
  'fear', 'fearful', 'bored', 'boredom', 'love', 'loving', 'hate', 'hatred',
  'excited', 'excitement', 'crazy', 'funny', 'fun', 'tired', 'tiredness',
  'hungry', 'hunger', 'sleepy', 'pain', 'painful', 'feeling', 'feelings',
  'mood', 'moods', 'pleasure', 'depressed', 'depression', 'anxiety', 'anxious',
  'stress', 'stressed', 'lonely', 'loneliness', 'jealous', 'jealousy',
  'guilt', 'guilty', 'proud', 'pride', 'shame', 'envy', 'hope', 'hopeful',
  'calm', 'nervous', 'surprised', 'surprise', 'disgust', 'disgusted', 'grief',
  'emotion', 'emotions', 'emotional', 'romantic', 'romance', 'passionate', 'passion'
]);

/**
 * Common non-academic descriptive adjectives & adverbs that cannot stand alone as a curriculum topic.
 */
const NON_ACADEMIC_ADJECTIVES = new Set([
  'good', 'better', 'best', 'bad', 'worse', 'worst', 'nice', 'cool', 'ugly',
  'pretty', 'beautiful', 'fast', 'faster', 'fastest', 'slow', 'slower', 'slowest',
  'sweet', 'bitter', 'sour', 'hot', 'cold', 'warm', 'bright', 'dark',
  'heavy', 'light', 'soft', 'hard', 'loud', 'quiet', 'clean', 'dirty', 'rich',
  'poor', 'young', 'old', 'smart', 'dumb', 'stupid', 'weird', 'busy', 'lazy',
  'strong', 'weak', 'cheap', 'expensive', 'fresh', 'safe', 'dangerous', 'lucky',
  'simple', 'easy', 'boring', 'great', 'super', 'awesome', 'huge', 'tiny',
  'little', 'tall', 'short', 'fat', 'thin', 'thick', 'deep', 'shallow',
  'empty', 'full', 'dry', 'wet', 'clear', 'rough', 'smooth', 'fine', 'okay'
]);

/**
 * Everyday conversational nouns & verbs that are not educational subjects when entered as single words.
 */
const EVERYDAY_COMMON_WORDS = new Set([
  'eat', 'eating', 'food', 'drink', 'drinking', 'sleep', 'sleeping', 'walk', 'walking',
  'run', 'running', 'jump', 'jumping', 'play', 'playing', 'game', 'games',
  'song', 'songs', 'movie', 'movies', 'car', 'cars', 'bus', 'bike', 'dog', 'dogs',
  'cat', 'cats', 'bird', 'birds', 'fish', 'table', 'chair', 'bed', 'room',
  'house', 'home', 'door', 'window', 'wall', 'clothes', 'shirt', 'pants', 'shoe', 'shoes',
  'friend', 'friends', 'family', 'baby', 'kid', 'kids', 'boy', 'girl'
]);

/**
 * Non-academic, context-free words that are too vague to constitute an educational concept on their own.
 */
const VAGUE_GENERIC_WORDS = new Set([
  // Extremely broad / all-encompassing nouns
  'world', 'life', 'time', 'thing', 'things', 'stuff', 'matter', 'way', 'ways',
  'place', 'places', 'people', 'person', 'man', 'woman', 'men', 'women',
  'day', 'days', 'year', 'years', 'week', 'weeks', 'month', 'months',
  'part', 'parts', 'type', 'types', 'kind', 'kinds', 'form', 'forms',
  'idea', 'ideas', 'fact', 'facts', 'point', 'points', 'case', 'cases',
  'it', 'this', 'that', 'these', 'those', 'here', 'there',
  // Broad umbrella domain words requiring a specific qualifier (e.g. "design", "system")
  'design', 'designs', 'system', 'systems', 'structure', 'structures',
  'code', 'coding', 'program', 'programs', 'programming',
  'app', 'apps', 'application', 'applications', 'software', 'hardware',
  'science', 'sciences', 'art', 'arts', 'study', 'studies',
  'concept', 'concepts', 'theory', 'theories', 'principle', 'principles',
  'project', 'projects', 'model', 'models', 'method', 'methods', 'process', 'processes',
  'lesson', 'lessons', 'chapter', 'chapters', 'course', 'courses', 'class', 'classes',
  'topic', 'topics', 'subject', 'subjects', 'content', 'contents',
  'management', 'business', 'tech', 'technology', 'technologies',
  // Generic action verbs as a noun
  'work', 'works', 'use', 'used', 'know', 'make', 'get', 'go', 'come',
  // Common English filler / linking words used as nouns
  'information', 'data', 'details', 'general', 'specific', 'various', 'different',
  'important', 'useful', 'common', 'basic', 'simple', 'complex',
  // Pure interjections / expressions
  'wow', 'oh', 'ah', 'um', 'uh', 'hmm', 'hm', 'err', 'right', 'well',
  // Random / meaningless
  'random', 'anything', 'everything', 'something', 'nothing', 'all', 'any',
]);

const VAGUE_ADJECTIVES = new Set([
  'good', 'bad', 'new', 'old', 'big', 'small', 'large', 'long', 'short',
  'high', 'low', 'hot', 'cold', 'fast', 'slow', 'hard', 'easy',
  'real', 'true', 'false', 'main', 'key', 'other', 'same', 'next', 'last'
]);

/**
 * Recognized single-word academic disciplines that can stand alone as valid curriculum subjects.
 */
const RECOGNIZED_ACADEMIC_DISCIPLINES = new Set([
  'physics', 'chemistry', 'biology', 'mathematics', 'math', 'algebra', 'calculus',
  'geometry', 'trigonometry', 'statistics', 'probability', 'astronomy', 'geology',
  'meteorology', 'ecology', 'genetics', 'biochemistry', 'thermodynamics',
  'electromagnetism', 'optics', 'kinematics', 'neurology', 'neuroscience',
  'immunology', 'microbiology', 'virology', 'botany', 'zoology', 'anatomy',
  'physiology', 'pathology', 'pharmacology', 'cryptography', 'algorithms',
  'microprocessors', 'robotics', 'cybersecurity', 'history', 'geography',
  'economics', 'microeconomics', 'macroeconomics', 'sociology', 'psychology',
  'philosophy', 'anthropology', 'linguistics', 'archaeology', 'jurisprudence',
  'criminology', 'ethics', 'epistemology', 'metaphysics', 'literature',
  'paleontology', 'histology', 'embryology', 'cytology', 'biomechanics',
  'astrophysics', 'civics', 'politics', 'government', 'epidemiology'
]);

// ─── Named-Entity Patterns (fast regex, NLP pattern matcher) ──────────────────
const ACADEMIC_PATTERNS = [
  /\b(theorem|lemma|algorithm|equation|formula|hypothesis|theory|principle|law|model)\b/i,
  /\b(photosynthesis|mitosis|meiosis|osmosis|diffusion|evolution|respiration)\b/i,
  /\b(calculus|algebra|geometry|trigonometry|statistics|probability)\b/i,
  /\b(physics|chemistry|biology|ecology|astronomy|geology|genetics|botany|zoology)\b/i,
  /\b(system\s+design|compiler\s+design|database\s+design|software\s+engineering|computer\s+architecture)\b/i,
  /\b(distributed\s+systems|operating\s+system|machine\s+learning|deep\s+learning|ai|neural\s+network|data\s+structures)\b/i,
  /\b(cyber\s*security|cryptography|cloud\s+computing|computer\s+networks)\b/i,
  /\b(history|geography|economics|sociology|psychology|philosophy|anthropology)\b/i,
  /\b(french|american|industrial|world\s+war|cold\s+war|civil\s+war|revolution)\b/i,
  /\b(newton|einstein|darwin|freud|plato|socrates|aristotle|shakespeare)\b/i,
  /\b(dna|rna|atp|nadh|mrna|trna|protein|enzyme|hormone|neuron|synapse|nucleus)\b/i,
  /\b(force|energy|momentum|velocity|acceleration|gravity|electromagnetism|quantum)\b/i,
  /\b\d{4}\b/,                // Four-digit year (e.g. "World War 1939")
  /[A-Z][a-z]+\s+[A-Z][a-z]+/,  // Proper noun phrase like "Charles Darwin"
  /\b[A-Z]{2,}\b/,            // Acronym like "DNA", "CPU", "WWI"
];

// ─── Main Validator ────────────────────────────────────────────────────────────

export function validateStudyText(text) {
  if (!text || typeof text !== 'string') {
    return { isValid: false, reason: 'EMPTY', message: 'Please enter your study notes or a quiz topic.' };
  }

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');

  // ── 1. Minimum and Maximum length ───────────────────────────────────────
  if (lower.length < 3) {
    return {
      isValid: false, reason: 'TOO_SHORT',
      message: 'Input is too short. Please enter an educational topic (e.g. "Photosynthesis") or paste study notes.'
    };
  }

  if (trimmed.length > MAX_TEXT_INPUT_CHARS) {
    return {
      isValid: false, reason: 'TOO_LONG',
      message: `Input exceeds the maximum limit of ${MAX_TEXT_INPUT_CHARS.toLocaleString()} characters. Please shorten your study notes or paste a chapter summary.`
    };
  }

  // ── 2. Blocklist: greetings ───────────────────────────────────────────────
  if (COMMON_GREETINGS.has(lower)) {
    return {
      isValid: false, reason: 'GREETING',
      message: `"${trimmed}" is a conversational greeting, not an educational concept. Please enter a subject topic (e.g. "Photosynthesis", "Binary Search Trees", "World War II") or paste your study notes.`
    };
  }

  // ── 3. Blocklist: placeholders ────────────────────────────────────────────
  if (PLACEHOLDER_WORDS.has(lower)) {
    return {
      isValid: false, reason: 'PLACEHOLDER',
      message: `"${trimmed}" is a placeholder or test string. Please provide actual study material or a real subject topic.`
    };
  }

  // ── 4. Blocklist: generic commands ───────────────────────────────────────
  if (GENERIC_COMMANDS.has(lower)) {
    return {
      isValid: false, reason: 'GENERIC_COMMAND',
      message: 'Please specify the subject or topic you want to be quizzed on (e.g. "Operating Systems", "Calculus", "Organic Chemistry").'
    };
  }

  // ── 5. Blocklist: vague single words ─────────────────────────────────────
  if (VAGUE_SINGLE_WORDS.has(lower)) {
    return {
      isValid: false, reason: 'VAGUE_SINGLE_WORD',
      message: `"${trimmed}" is too generic. Please specify an educational concept or topic (e.g. "Photosynthesis", "Machine Learning", "French Revolution").`
    };
  }

  // ── 6. Character pattern checks (gibberish / mash) ────────────────────────
  if (/(.)\1{3,}/.test(lower)) {
    return {
      isValid: false, reason: 'REPEATED_CHARS',
      message: 'The entered text contains repetitive characters. Please provide meaningful study notes or a concept topic.'
    };
  }
  const mashPatterns = [/^(?:asdf|asdfgh|asdfghjkl|qwerty|qwertyuiop|zxcv|zxcvbnm|123456|abcdef)+$/i];
  if (mashPatterns.some(pat => pat.test(lower))) {
    return {
      isValid: false, reason: 'KEYBOARD_MASH',
      message: 'The entered text appears to be keyboard mash. Please provide a real topic or study notes.'
    };
  }

  // ── 7. Word-level analysis ────────────────────────────────────────────────
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const alphabeticWords = words.filter(w => /[a-zA-Z]/.test(w));

  if (alphabeticWords.length === 0) {
    return {
      isValid: false, reason: 'NO_ALPHABETIC_WORDS',
      message: 'Please provide a valid text topic or notes containing words.'
    };
  }

  // ── 8. All words are greetings ────────────────────────────────────────────
  const allGreetings = words.every(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    return COMMON_GREETINGS.has(cleanWord) || cleanWord === '';
  });
  if (allGreetings && words.length <= 4) {
    return {
      isValid: false, reason: 'GREETING_PHRASE',
      message: `"${trimmed}" is a greeting phrase. Please provide an educational topic or study notes instead.`
    };
  }

  // ── 9. NLP heuristic: Detect multi-word academic patterns early (fast-pass) ─
  //    Only fast-pass if either words > 1 or single word is in recognized academic corpus
  if (words.length > 1 && ACADEMIC_PATTERNS.some(pat => pat.test(trimmed))) {
    const isNotes = words.length >= 15 || trimmed.length >= 100;
    return {
      isValid: true, reason: 'VALID',
      type: isNotes ? 'NOTES' : 'TOPIC',
      wordCount: words.length, charCount: trimmed.length,
      message: isNotes ? `Comprehensive study material ready (${words.length} words).` : `Valid academic topic ready: "${trimmed}".`
    };
  }

  // ── 10. NLP Single Word Analysis (Strict Semantic Categorization) ─────────
  if (words.length === 1) {
    const singleWord = lower.replace(/[^a-z0-9]/g, '');

    // 10a. Emotion & Mood words (e.g. happy, sad, angry)
    if (EMOTION_AND_MOOD_WORDS.has(singleWord)) {
      return {
        isValid: false,
        reason: 'EMOTION_OR_MOOD_WORD',
        message: `"${trimmed}" is an emotion or mood descriptor, not an educational subject. Please specify an academic concept (e.g. "Positive Psychology", "Cognitive Psychology", "Sociology of Emotion") or paste your study notes.`
      };
    }

    // 10b. Non-academic adjectives (e.g. good, cool, hot, smart)
    if (NON_ACADEMIC_ADJECTIVES.has(singleWord)) {
      return {
        isValid: false,
        reason: 'NON_ACADEMIC_ADJECTIVE',
        message: `"${trimmed}" is a general adjective and not a testable educational topic. Please enter a specific curriculum subject (e.g. "Thermodynamics", "French Revolution", "Linear Algebra") or paste your notes.`
      };
    }

    // 10c. Everyday non-educational objects/actions (e.g. food, eat, car)
    if (EVERYDAY_COMMON_WORDS.has(singleWord)) {
      return {
        isValid: false,
        reason: 'EVERYDAY_COMMON_WORD',
        message: `"${trimmed}" is a common everyday word. Please specify an educational discipline or subject (e.g. "Animal Physiology", "Nutrition and Metabolism", "Automotive Engineering") or paste your notes.`
      };
    }

    // 10d. Vague generic nouns (e.g. design, system, code)
    if (VAGUE_GENERIC_WORDS.has(singleWord)) {
      let suggestion = 'Please be more specific — for example, enter "World War II", "World History", or paste your study notes.';
      if (singleWord === 'design') {
        suggestion = 'Please specify a focused subject (e.g. "System Design", "Compiler Design", "Graphic Design Principles", "Database Design").';
      } else if (singleWord === 'system' || singleWord === 'systems') {
        suggestion = 'Please specify a focused topic (e.g. "Operating Systems", "Distributed Systems", "Nervous System", "Solar System").';
      } else if (singleWord === 'code' || singleWord === 'coding' || singleWord === 'program') {
        suggestion = 'Please specify a programming domain or language (e.g. "Object-Oriented Programming in Java", "Python Data Structures", "C++ Algorithms").';
      }
      return {
        isValid: false,
        reason: 'VAGUE_GENERIC_WORD',
        message: `"${trimmed}" is too vague and ambiguous to generate a quiz on. ${suggestion}`
      };
    }

    // 10e. NLP Morphological & Entity Classifier for Isolated Words:
    // Recognized academic disciplines (physics, biology, etc.)
    const isRecognizedDiscipline = RECOGNIZED_ACADEMIC_DISCIPLINES.has(singleWord);

    // Academic morphology suffixes: -ology, -onomy, -metry, -ics, -synthesis, -genesis, -lysis, -itis, -osis, -ism
    const hasAcademicSuffix = /(?:ology|ologies|onomy|metry|ics|synthesis|genesis|lysis|itis|osis|ism)$/i.test(singleWord);

    // Academic pattern match (e.g. mitosis, calculus, photosynthesis)
    const matchesAcademicPattern = ACADEMIC_PATTERNS.some(pat => pat.test(singleWord));

    if (!isRecognizedDiscipline && !hasAcademicSuffix && !matchesAcademicPattern) {
      return {
        isValid: false,
        reason: 'SINGLE_NON_ACADEMIC_WORD',
        message: `"${trimmed}" does not appear to be an educational or academic subject. Please enter a valid study topic (e.g. "Photosynthesis", "Operating Systems", "World History") or paste your study notes.`
      };
    }

    return {
      isValid: true,
      reason: 'VALID',
      type: 'TOPIC',
      wordCount: 1,
      charCount: trimmed.length,
      message: `Valid academic topic ready: "${trimmed}".`
    };
  }

  // ── 11. NLP heuristic: Short phrase (2–3 words) where all words are vague ─
  if (words.length >= 2 && words.length <= 3) {
    const cleanWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
    const allVague = cleanWords.every(w =>
      VAGUE_GENERIC_WORDS.has(w) ||
      VAGUE_ADJECTIVES.has(w) ||
      VAGUE_SINGLE_WORDS.has(w) ||
      COMMON_GREETINGS.has(w) ||
      EMOTION_AND_MOOD_WORDS.has(w) ||
      NON_ACADEMIC_ADJECTIVES.has(w) ||
      EVERYDAY_COMMON_WORDS.has(w)
    );
    if (allVague && cleanWords.every(w => w.length > 0)) {
      return {
        isValid: false, reason: 'VAGUE_PHRASE',
        message: `"${trimmed}" is too generic or conversational to generate quiz questions on. Please provide a specific educational topic (e.g. "World War II", "Newton's Laws of Motion", "Data Structures") or paste your actual study notes.`
      };
    }
  }

  // ── 12. Minimum information density check for short inputs ───────────────
  if (trimmed.length < 40 && words.length < 3) {
    const hasSubstantialWord = alphabeticWords.some(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      return (
        clean.length >= 4 &&
        !VAGUE_GENERIC_WORDS.has(clean) &&
        !VAGUE_ADJECTIVES.has(clean) &&
        !COMMON_GREETINGS.has(clean) &&
        !PLACEHOLDER_WORDS.has(clean) &&
        !EMOTION_AND_MOOD_WORDS.has(clean) &&
        !NON_ACADEMIC_ADJECTIVES.has(clean) &&
        !EVERYDAY_COMMON_WORDS.has(clean)
      );
    });
    if (!hasSubstantialWord) {
      return {
        isValid: false, reason: 'LOW_INFORMATION_DENSITY',
        message: `"${trimmed}" doesn't contain a specific enough concept to generate quiz questions. Please enter an educational topic or subject (e.g. "Photosynthesis", "Operating Systems", "French Revolution").`
      };
    }
  }

  // ── 13. Accept: classify as TOPIC or NOTES ───────────────────────────────
  const isNotes = words.length >= 15 || trimmed.length >= 100;
  return {
    isValid: true, reason: 'VALID',
    type: isNotes ? 'NOTES' : 'TOPIC',
    wordCount: words.length, charCount: trimmed.length,
    message: isNotes
      ? `Comprehensive study material ready (${words.length} words).`
      : `Valid academic topic ready: "${trimmed}".`
  };
}
