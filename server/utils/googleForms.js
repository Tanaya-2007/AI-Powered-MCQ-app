import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Google Cloud Service Account Credentials key file
const CREDENTIALS_PATH = path.join(__dirname, '../google-credentials.json');

/**
 * Checks if the Google credentials JSON file exists.
 * @returns {boolean}
 */
export function hasGoogleCredentials() {
  return fs.existsSync(CREDENTIALS_PATH);
}

/**
 * Automatically authenticates and exports a list of MCQs directly into a Google Form.
 * Configures the form as a graded quiz, sets 1 point per question, registers correct answers, 
 * and attaches AI explanations as submission feedback.
 * 
 * @param {string} quizTitle - Title of the Google Form.
 * @param {Object[]} questions - Array of MCQ objects.
 * @param {string} questions[].question - The question text.
 * @param {string[]} questions[].options - Array of 4 option strings.
 * @param {number} questions[].correctAnswer - Index of the correct option (0-3).
 * @param {string} [questions[].explanation] - Explanation of the answer.
 * @returns {Promise<{formId: string, formUrl: string}>} The generated Form ID and Responder URL.
 */
export async function createGoogleForm(quizTitle, questions) {
  if (!hasGoogleCredentials()) {
    throw new Error(
      'Google service account key file (google-credentials.json) is missing in the server root. ' +
      'Please see setup instructions to enable Google Forms exports.'
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No questions provided to export to Google Forms.');
  }

  try {
    // 1. Authenticate with Google API using Service Account JSON file
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: [
        'https://www.googleapis.com/auth/forms.body',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    const forms = google.forms({ version: 'v1', auth });

    // 2. Step 1: Create an empty Google Form
    console.log(`📋 Creating new Google Form: "${quizTitle}"`);
    const createRes = await forms.forms.create({
      requestBody: {
        info: {
          title: quizTitle,
          documentTitle: quizTitle
        }
      }
    });

    const formId = createRes.data.formId;
    const formUrl = createRes.data.responderUri; // Public url students use to fill out form
    console.log(`✅ Google Form created. ID: ${formId}`);

    // 3. Step 2: Build batch update requests to convert form to graded Quiz & append questions
    const requests = [];

    // Request A: Configure Form to be a graded Quiz
    requests.push({
      updateSettings: {
        settings: {
          quizSettings: {
            isQuiz: true // Converts Form to a Quiz!
          }
        },
        updateMask: 'quizSettings.isQuiz'
      }
    });

    // Request B: Generate item creation requests for each MCQ
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const correctOptionText = q.options[q.correctAnswer];

      if (!correctOptionText) {
        throw new Error(`Invalid correct answer index (${q.correctAnswer}) for question: "${q.question}"`);
      }

      requests.push({
        createItem: {
          item: {
            title: q.question,
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'RADIO', // standard multiple choice radio buttons
                  options: q.options.map(opt => ({ value: opt }))
                },
                grading: {
                  pointValue: 1, // 1 point per question
                  correctAnswers: {
                    answers: [correctOptionText] // register the exact correct option string
                  },
                  whenRight: {
                    generalFeedback: {
                      text: q.explanation || 'Correct answer!'
                    }
                  },
                  whenWrong: {
                    generalFeedback: {
                      text: q.explanation || 'Incorrect. See textbook references.'
                    }
                  }
                }
              }
            }
          },
          location: {
            index: i // Position order in the form
          }
        }
      });
    }

    // 4. Step 3: Dispatch batch update to Google API
    console.log(`📤 Dispatching batch update with ${requests.length} operations...`);
    await forms.forms.batchUpdate({
      formId,
      requestBody: {
        requests
      }
    });

    console.log('🎉 Google Form Quiz populated successfully.');
    return {
      formId,
      formUrl
    };

  } catch (error) {
    console.error('Error creating Google Form:', error);
    throw error;
  }
}
