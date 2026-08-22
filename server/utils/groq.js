import dotenv from 'dotenv';

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;

/**
 * Dynamically queries the Groq API to retrieve available models
 * and selects the best matching active model based on user permissions.
 * @param {string} apiKey 
 * @returns {Promise<string>} Model ID to use.
 */
async function getActiveGroqModel(apiKey) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      const activeIds = (data.data || []).map(m => m.id);
      
      const preferences = [
        'llama-3.3-70b-versatile',
        'llama-3.3-70b-specdec',
        'llama3-70b-8192',
        'openai/gpt-oss-20b',
        'openai/gpt-oss-120b',
        'qwen/qwen3.6-27b',
        'groq/compound',
        'groq/compound-mini'
      ];
      
      for (const pref of preferences) {
        if (activeIds.includes(pref)) {
          return pref;
        }
      }
      
      // Look for any model that is not a transcription/prompt-guard model
      const fallback = activeIds.find(id => !id.includes('whisper') && !id.includes('guard'));
      if (fallback) return fallback;
    }
  } catch (err) {
    console.error('⚠️ Failed to retrieve active Groq models:', err.message);
  }
  return 'llama-3.3-70b-versatile'; // fallback default
}

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

  // Auto-detect which model is supported by this API key
  const selectedModel = await getActiveGroqModel(groqApiKey);
  console.log(`🤖 Utilizing Groq Model: ${selectedModel}`);

  const payload = {
    model: selectedModel,
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
