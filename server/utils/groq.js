import dotenv from 'dotenv';

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;

/**
 * Sends a chat completion request to the Groq API.
 * Uses native fetch to avoid extra dependencies.
 * 
 * @param {string} prompt - The input instruction for the model.
 * @param {string} [responseMimeType='text/plain'] - Expected response format. Use 'application/json' for JSON mode.
 * @returns {Promise<string>} The generated content.
 */
export async function generateGroqContent(prompt, responseMimeType = 'text/plain') {
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is not defined in server/.env');
  }

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1
  };

  if (responseMimeType === 'application/json') {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (data && data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }

  throw new Error('Unexpected empty response structure from Groq API');
}
