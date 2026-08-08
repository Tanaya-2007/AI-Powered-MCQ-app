import dotenv from 'dotenv';

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

/**
 * Sends a chat completion request to the OpenAI API using native fetch.
 * 
 * @param {string} prompt - The input instruction for the model.
 * @param {string} [responseMimeType='text/plain'] - Expected response format. Use 'application/json' for JSON mode.
 * @returns {Promise<string>} The generated content.
 */
export async function generateOpenAIContent(prompt, responseMimeType = 'text/plain') {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not defined in server/.env');
  }

  const payload = {
    model: 'gpt-4o-mini', // high-quality, cost-efficient default
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (data && data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }

  throw new Error('Unexpected empty response structure from OpenAI API');
}

/**
 * Generates a 768-dimensional vector embedding using OpenAI's text-embedding-3-small model.
 * 
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} The 768-dimensional float array embedding vector.
 */
export async function generateOpenAIEmbedding(text) {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not defined in server/.env');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 768 // Truncates 1536 dimensions down to 768 to match database schema
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI Embedding API request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (data && data.data && data.data[0] && data.data[0].embedding) {
    return data.data[0].embedding;
  }

  throw new Error('Unexpected empty response structure from OpenAI Embedding API');
}
