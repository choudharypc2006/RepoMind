import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI SDK instance using the API key from environment
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error(
      'Gemini API key is missing. Please add GEMINI_API_KEY in your backend/.env file.'
    );
    error.statusCode = 400;
    throw error;
  }
  return new GoogleGenAI({ apiKey });
}

// Default model to use (supported across standard Gemini API keys)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

/**
 * Handle and format Gemini SDK errors into clean user-facing errors
 */
function handleGeminiError(error) {
  console.error('[Gemini Service Error]:', error);

  if (error.statusCode) {
    throw error;
  }

  const message = error.message || '';
  const status = error.status || error.code;

  if (status === 429 || message.toLowerCase().includes('resource has been exhausted') || message.toLowerCase().includes('rate limit')) {
    const err = new Error('Gemini API rate limit exceeded. Please wait a moment and try again.');
    err.statusCode = 429;
    throw err;
  }

  if (status === 400 || message.toLowerCase().includes('api_key') || message.toLowerCase().includes('api key not valid')) {
    const err = new Error('Invalid Gemini API Key. Please verify your GEMINI_API_KEY in backend/.env.');
    err.statusCode = 401;
    throw err;
  }

  if (message.toLowerCase().includes('safety') || message.toLowerCase().includes('blocked')) {
    const err = new Error('The request was flagged by Gemini content safety filters.');
    err.statusCode = 400;
    throw err;
  }

  const err = new Error(message || 'Failed to communicate with Google Gemini API.');
  err.statusCode = status && typeof status === 'number' ? status : 500;
  throw err;
}

/**
 * Analyze a source code file using Gemini
 * Returns structured JSON with summary, detailed explanation, functions, key concepts, issues, and improvements.
 */
export async function explainCode({ repoName, filePath, language, code }) {
  if (!code || typeof code !== 'string') {
    const err = new Error('Source code is required for AI analysis.');
    err.statusCode = 400;
    throw err;
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are a Principal Software Engineer and Staff Code Reviewer analyzing code in a GitHub repository analysis platform named RepoMind.
Your goals:
1. Provide accurate, clean, and insightful technical analysis of the supplied file.
2. Clearly distinguish between confirmed issues and potential or speculative issues.
3. NEVER claim code is definitely buggy unless there is definitive mathematical, syntax, or logical proof in the provided snippet.
4. Reference real function names, imports, variables, and logic from the provided code.
5. NEVER hallucinate or invent code that is not present in the provided snippet.
6. Return the response as valid, parseable JSON conforming EXACTLY to the requested schema.`;

  const prompt = `Analyze this source code file:
- Repository: ${repoName || 'Unknown Repository'}
- File Path: ${filePath || 'Unknown Path'}
- Language: ${language || 'Auto-detected'}

\`\`\`${language || ''}
${code}
\`\`\`

Respond with a strictly valid JSON object matching this exact structure:
{
  "summary": "A concise 2-3 sentence overview of what this file does and its role in the project.",
  "detailedExplanation": "A thorough paragraph explaining how the code functions and coordinates responsibilities.",
  "functions": [
    {
      "name": "functionName or className",
      "purpose": "What this function does and why it exists.",
      "parameters": "Short summary of parameters or inputs.",
      "returnVal": "Description of return value or output."
    }
  ],
  "importantConcepts": [
    "A notable architectural pattern, library usage, or design concept used here."
  ],
  "potentialIssues": [
    "A potential edge case, race condition, missing validation, or performance concern (clearly framed as potential, not definitive bugs unless certain)."
  ],
  "suggestions": [
    "Actionable, concrete advice to improve readability, performance, testability, or typing."
  ],
  "metrics": {
    "maintainabilityIndex": 85,
    "complexity": "Low"
  }
}
Do not wrap the response with markdown code blocks if possible, or use standard raw JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';

    // Parse the JSON safely
    try {
      // Remove any accidental markdown backticks if returned despite json mime type
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (parseErr) {
      console.warn('Failed to parse Gemini response as pure JSON, returning raw text fallback:', parseErr);
      return {
        summary: responseText.slice(0, 300),
        detailedExplanation: responseText,
        functions: [],
        importantConcepts: [],
        potentialIssues: [],
        suggestions: [],
        metrics: {
          maintainabilityIndex: 80,
          complexity: 'Normal',
        },
      };
    }
  } catch (error) {
    handleGeminiError(error);
  }
}

/**
 * Chat with Gemini about the selected source code file
 * Maintains context of the file and prior chat messages
 */
export async function chatAboutCode({ filePath, code, messages = [], question }) {
  if (!question || !question.trim()) {
    const err = new Error('Question is required for AI chat.');
    err.statusCode = 400;
    throw err;
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are an expert AI code assistant inside RepoMind. You are helping a developer understand a specific file in a GitHub repository.
Selected File Path: ${filePath || 'Unknown'}
Source Code Context:
\`\`\`
${code || '// No code content available'}
\`\`\`

Rules:
1. Ground all answers strictly in the provided file.
2. Be concise, direct, and technically accurate.
3. Use markdown for code snippets, bullet points, and emphasis.
4. Reference exact lines, variables, and function names where appropriate.
5. If the user asks something that cannot be answered from this file, explain that clearly.`;

  // Build the message history
  // Format for Gemini API contents
  const contents = [];

  // Add previous conversation turns
  for (const msg of messages) {
    if (msg.role === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.text }],
      });
    } else if (msg.role === 'assistant' || msg.role === 'model') {
      contents.push({
        role: 'model',
        parts: [{ text: msg.text }],
      });
    }
  }

  // Add the current user question
  contents.push({
    role: 'user',
    parts: [{ text: question }],
  });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text?.trim() || 'No response generated.';
    return {
      reply,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    handleGeminiError(error);
  }
}

