/**
 * Production-grade study material and quiz topic validation.
 * Uses NLP-like heuristics (no external packages required) to determine whether
 * user input is an actual substantive academic concept or study notes —
 * rather than conversational filler, vague meaningless words, or gibberish.
 */

// ─── Constants & Limits ─────────────────────────────────────────────────────

export const MAX_TEXT_INPUT_CHARS = 25000;

// ─── Blocklists ─────────────────────────────────────────────────────────────

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
 * Non-academic, context-free words that are too vague to constitute an educational concept
 * on their own. A word is "non-academic" if a student could not be meaningfully tested on it
 * without additional context (e.g. "world" — which world? what aspect?).
 *
 * NLP heuristic: these are common English words with zero domain-specificity.
 * They belong to closed grammatical categories (prepositions, articles, conjunctions,
 * generic nouns) or are so broad they encompass all possible subjects simultaneously.
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

/**
 * Words that, while real English, have no subject-matter specificity.
 * If user enters a two-word phrase where BOTH words are vague, it is still rejected.
 * Example: "world things" → both are vague → rejected.
 * "world war" → "war" is a valid historical concept → accepted.
 */
const VAGUE_ADJECTIVES = new Set([
  'good', 'bad', 'new', 'old', 'big', 'small', 'large', 'long', 'short',
  'high', 'low', 'hot', 'cold', 'fast', 'slow', 'hard', 'easy',
  'real', 'true', 'false', 'main', 'key', 'other', 'same', 'next', 'last'
]);

// ─── Named-Entity Patterns (fast regex, no external NLP library) ──────────────
// Words matching these patterns are almost always valid academic concepts.
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
  /\b\d{4}\b/,         // Four-digit year (e.g. "World War 1939")
  /[A-Z][a-z]+\s+[A-Z][a-z]+/,  // Proper noun phrase like "Charles Darwin"
  /\b[A-Z]{2,}\b/,     // Acronym like "DNA", "CPU", "WWI"
];

// ─── Main Validator ────────────────────────────────────────────────────────────

/**
 * Validates whether text input has sufficient academic/topical substance
 * to generate a quiz. Returns a structured result with isValid, reason, and message.
 *
 * @param {string} text - Raw user input from textarea or voice.
 * @returns {{ isValid: boolean, reason: string, message: string, type?: 'TOPIC'|'NOTES', wordCount?: number, charCount?: number }}
 */
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

  // ── 9. NLP heuristic: Detect academic patterns early (fast-pass) ──────────
  //    If any known academic pattern matches, accept immediately
  if (ACADEMIC_PATTERNS.some(pat => pat.test(trimmed))) {
    const isNotes = words.length >= 15 || trimmed.length >= 100;
    return {
      isValid: true, reason: 'VALID',
      type: isNotes ? 'NOTES' : 'TOPIC',
      wordCount: words.length, charCount: trimmed.length,
      message: isNotes ? `Comprehensive study material ready (${words.length} words).` : `Valid academic topic ready: "${trimmed}".`
    };
  }

  // ── 10. NLP heuristic: Single vague generic word ─────────────────────────
  //    A single word that is too broad to constitute a testable concept
  if (words.length === 1) {
    const singleWord = lower.replace(/[^a-z]/g, '');
    if (VAGUE_GENERIC_WORDS.has(singleWord)) {
      return {
        isValid: false, reason: 'VAGUE_GENERIC_WORD',
        message: `"${trimmed}" is too vague to generate a quiz on. It has no specific academic or educational domain. Please be more specific — for example, enter "World War II", "World History", "World Geography", or paste your actual study notes.`
      };
    }
  }

  // ── 11. NLP heuristic: Short phrase (2–3 words) where all words are vague ─
  if (words.length >= 2 && words.length <= 3) {
    const cleanWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
    const allVague = cleanWords.every(w =>
      VAGUE_GENERIC_WORDS.has(w) || VAGUE_ADJECTIVES.has(w) || VAGUE_SINGLE_WORDS.has(w) || COMMON_GREETINGS.has(w)
    );
    if (allVague && cleanWords.every(w => w.length > 0)) {
      return {
        isValid: false, reason: 'VAGUE_PHRASE',
        message: `"${trimmed}" is too vague to generate quiz questions on. Please provide a specific educational topic (e.g. "World War II", "Newton's Laws of Motion", "Data Structures") or paste your actual study notes.`
      };
    }
  }

  // ── 12. Minimum information density check for very short inputs ───────────
  //    Inputs under 40 chars with fewer than 3 words are borderline; a meaningful
  //    academic topic must contain at least one non-trivial word.
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
