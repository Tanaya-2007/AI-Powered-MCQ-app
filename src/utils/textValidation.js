/**
 * Production-grade study material and quiz topic validation.
 * Checks whether user input is an actual substantive academic concept or study notes,
 * rather than conversational greetings ("hi", "hello"), filler, commands, or gibberish.
 */

// Normalized list of common conversational greetings and filler
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
  'qwerty', 'zxcv', 'foo', 'bar', 'baz', 'lorem ipsum'
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
 * Validates text provided by the user for quiz generation.
 * @param {string} text - Raw input string from textarea or voice.
 * @returns {{
 *   isValid: boolean,
 *   reason: string,
 *   message: string,
 *   type?: 'TOPIC' | 'NOTES',
 *   wordCount?: number,
 *   charCount?: number
 * }}
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
  const lower = trimmed.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, ''); // strip leading/trailing punctuation

  // 1. Length check: Must be at least 3 characters
  if (lower.length < 3) {
    return {
      isValid: false,
      reason: 'TOO_SHORT',
      message: 'Input is too short. Please enter an educational topic (e.g. "Photosynthesis") or paste study notes.'
    };
  }

  // 2. Exact match against greetings
  if (COMMON_GREETINGS.has(lower)) {
    return {
      isValid: false,
      reason: 'GREETING',
      message: `"${trimmed}" is a conversational greeting, not an educational concept. Please enter a subject topic (e.g. "Photosynthesis", "Binary Search Trees", "World War II") or paste your study notes.`
    };
  }

  // 3. Exact match against placeholders / testing words
  if (PLACEHOLDER_WORDS.has(lower)) {
    return {
      isValid: false,
      reason: 'PLACEHOLDER',
      message: `"${trimmed}" is a placeholder or test string. Please provide actual study material or a real subject topic to generate quiz questions.`
    };
  }

  // 4. Generic commands without subject
  if (GENERIC_COMMANDS.has(lower)) {
    return {
      isValid: false,
      reason: 'GENERIC_COMMAND',
      message: `Please specify the subject or topic you want to be quizzed on (e.g. "Operating Systems", "Calculus", "Organic Chemistry").`
    };
  }

  // 5. Vague single words
  if (VAGUE_SINGLE_WORDS.has(lower)) {
    return {
      isValid: false,
      reason: 'VAGUE_SINGLE_WORD',
      message: `"${trimmed}" is too generic. Please specify an educational concept or topic (e.g. "Photosynthesis", "Machine Learning", "French Revolution").`
    };
  }

  // 6. Gibberish / keyboard mash detection
  // 6a. Single character repeated 4+ times (e.g. "aaaaa", ".....", "11111")
  if (/(.)\1{3,}/.test(lower)) {
    return {
      isValid: false,
      reason: 'REPEATED_CHARS',
      message: 'The entered text contains repetitive characters. Please provide meaningful study notes or a concept topic.'
    };
  }

  // 6b. Common keyboard mash patterns
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

  // 6c. Words analysis
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  const alphabeticWords = words.filter(w => /[a-zA-Z]/.test(w));

  // If text contains no letters at all (e.g., pure numbers/symbols)
  if (alphabeticWords.length === 0) {
    return {
      isValid: false,
      reason: 'NO_ALPHABETIC_WORDS',
      message: 'Please provide a valid text topic or notes containing words.'
    };
  }

  // 6d. Check if all words are greetings (e.g. "hi hello hey")
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

  // 7. Successful validation: Classify as TOPIC (short concept) or NOTES (longer text)
  const isNotes = words.length >= 15 || trimmed.length >= 100;

  return {
    isValid: true,
    reason: 'VALID',
    type: isNotes ? 'NOTES' : 'TOPIC',
    wordCount: words.length,
    charCount: trimmed.length,
    message: isNotes
      ? 'Comprehensive study notes detected.'
      : `Concept topic "${trimmed}" detected.`
  };
}
