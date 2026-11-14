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

/**
 * List of supported high-token Gemini models active on this API tier
 */
export const SUPPORTED_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    contextTokens: '1,048,576 tokens (1M)',
    speed: 'Ultra Fast',
    description: 'Active primary model with 1M token context window. Excellent for rapid, in-depth code reviews.',
    isDefault: true,
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    contextTokens: '1,048,576 tokens (1M)',
    speed: 'Blazing Fast',
    description: 'Latest high-throughput model with 1M token context window and ultra-low latency.',
  },
];

// Default model to use (supported across standard Gemini API keys)
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

/**
 * Validate or fallback model ID
 */
export function resolveModel(modelId) {
  if (modelId && SUPPORTED_MODELS.some((m) => m.id === modelId)) {
    return modelId;
  }
  return DEFAULT_MODEL;
}

/**
 * Helper to safely parse raw error objects from Google Gen AI SDK
 */
function parseGeminiError(error) {
  let code = error.status || error.code || error.statusCode;
  let statusText = '';
  let message = error.message || '';

  // Handle case where error.message is a raw JSON string from Google
  if (typeof message === 'string' && message.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.error) {
        code = parsed.error.code || code;
        statusText = parsed.error.status || statusText;
        message = parsed.error.message || message;
      }
    } catch (_) {}
  }

  // Handle case where error.error is an object
  if (error.error && typeof error.error === 'object') {
    code = error.error.code || code;
    statusText = error.error.status || statusText;
    message = error.error.message || message;
  }

  const numericCode = typeof code === 'number' ? code : parseInt(code, 10) || null;

  return {
    code: numericCode,
    statusText: String(statusText || error.status || '').toUpperCase(),
    message: String(message || '').trim(),
  };
}

/**
 * Handle and format Gemini SDK errors into clean user-facing errors
 */
function handleGeminiError(error) {
  const safeMsg = error?.message || 'Unknown Gemini error';
  console.error(`[Gemini Service Error]: ${safeMsg.slice(0, 200)}`);

  if (error.statusCode) {
    throw error;
  }

  const { code, statusText, message } = parseGeminiError(error);
  const msgLower = message.toLowerCase();

  // 503 / High demand / Overloaded
  if (
    code === 503 ||
    statusText === 'UNAVAILABLE' ||
    msgLower.includes('high demand') ||
    msgLower.includes('temporary') ||
    msgLower.includes('overloaded') ||
    msgLower.includes('unavailable')
  ) {
    const err = new Error(
      'Google Gemini is currently experiencing temporary high demand on this model. Please wait a few moments or switch to Gemini 2.0 Flash Lite.'
    );
    err.statusCode = 503;
    throw err;
  }

  // 429 / Rate Limit
  if (
    code === 429 ||
    statusText === 'RESOURCE_EXHAUSTED' ||
    msgLower.includes('resource has been exhausted') ||
    msgLower.includes('rate limit') ||
    msgLower.includes('quota')
  ) {
    const err = new Error(
      'Gemini API rate limit reached. Please wait a moment or switch to another free model.'
    );
    err.statusCode = 429;
    throw err;
  }

  // 400 / 401 / Invalid API Key
  if (
    code === 400 ||
    code === 401 ||
    msgLower.includes('api_key') ||
    msgLower.includes('api key not valid')
  ) {
    const err = new Error(
      'Invalid Gemini API Key. Please verify your GEMINI_API_KEY in backend/.env.'
    );
    err.statusCode = 401;
    throw err;
  }

  // Content Safety Filter
  if (msgLower.includes('safety') || msgLower.includes('blocked')) {
    const err = new Error('The request was flagged by Gemini content safety filters.');
    err.statusCode = 400;
    throw err;
  }

  const err = new Error(message || 'Failed to communicate with Google Gemini API.');
  err.statusCode = code || 500;
  throw err;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a Gemini request with automatic fallback to alternative high-token models
 * if the chosen model hits rate limits (429), high demand (503), or is not found (404).
 */
async function executeWithModelFallback(requestFn, preferredModel) {
  let primary = resolveModel(preferredModel);

  // If user selected an outdated or deprecated model, sanitize to corresponding modern model
  if (primary.includes('lite') || primary.includes('flash-lite')) {
    primary = 'gemini-3.5-flash-lite';
  } else if (
    primary.includes('1.5') ||
    primary.includes('2.0') ||
    primary.includes('2.5') ||
    !SUPPORTED_MODELS.some((m) => m.id === primary)
  ) {
    primary = DEFAULT_MODEL; // gemini-3.8-flash
  }

  // Active high-token models candidate chain:
  const candidateChain = [
    primary,
    DEFAULT_MODEL,
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
  ];

  // Filter unique models while preserving order
  const uniqueChain = Array.from(new Set(candidateChain));

  let lastError = null;

  for (let i = 0; i < uniqueChain.length; i++) {
    const currentModel = uniqueChain[i];
    try {
      const response = await requestFn(currentModel);
      return { response, modelUsed: currentModel };
    } catch (err) {
      lastError = err;
      const { code, statusText, message } = parseGeminiError(err);
      const msgLower = message.toLowerCase();

      // Check if error is recoverable by switching models
      const canSwitch =
        code === 503 ||
        code === 429 ||
        code === 404 ||
        code === 500 ||
        statusText === 'UNAVAILABLE' ||
        statusText === 'RESOURCE_EXHAUSTED' ||
        statusText === 'NOT_FOUND' ||
        statusText === 'DEADLINE_EXCEEDED' ||
        msgLower.includes('503') ||
        msgLower.includes('429') ||
        msgLower.includes('404') ||
        msgLower.includes('high demand') ||
        msgLower.includes('temporary') ||
        msgLower.includes('overloaded') ||
        msgLower.includes('rate limit') ||
        msgLower.includes('resource has been exhausted') ||
        msgLower.includes('unavailable') ||
        msgLower.includes('not found') ||
        msgLower.includes('not supported') ||
        msgLower.includes('is no longer available') ||
        msgLower.includes('try again later');

      if (canSwitch && i < uniqueChain.length - 1) {
        console.warn(
          `[Gemini Auto-Switch]: Model "${currentModel}" unavailable (${code || statusText}: ${message.slice(0, 80)}...). Switching to "${uniqueChain[i + 1]}"...`
        );
        await sleep(350);
        continue;
      }

      // Non-recoverable error (e.g. invalid API key, prompt safety violation)
      break;
    }
  }

  handleGeminiError(lastError);
}

/**
 * Analyze a source code file using Gemini with model switching support.
 */
export async function explainCode({ repoName, filePath, language, code, model }) {
  if (!code || typeof code !== 'string') {
    const err = new Error('Source code is required for AI analysis.');
    err.statusCode = 400;
    throw err;
  }

  // Safe truncation for very large source code files to protect token limits & latency
  let sanitizedCode = code;
  if (sanitizedCode.length > 50000) {
    sanitizedCode = sanitizedCode.slice(0, 50000) + '\n\n// ... [Code truncated for AI analysis: exceeding 50,000 characters] ...\n';
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
${sanitizedCode}
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

  const { response, modelUsed } = await executeWithModelFallback(async (activeModel) => {
    return await ai.models.generateContent({
      model: activeModel,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });
  }, model);

  const responseText = response.text?.trim() || '';

  // Parse the JSON safely
  let parsed;
  try {
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.warn('Failed to parse Gemini response as pure JSON, returning raw text fallback:', parseErr);
    parsed = {
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

  // Attach which model fulfilled the request
  parsed.modelUsed = modelUsed;
  return parsed;
}

/**
 * Chat with Gemini about the selected source code file with model switching support.
 */
export async function chatAboutCode({ filePath, code, messages = [], question, model }) {
  if (!question || !question.trim()) {
    const err = new Error('Question is required for AI chat.');
    err.statusCode = 400;
    throw err;
  }

  const ai = getGeminiClient();

  // Safe truncation for file context in chat
  let sanitizedCode = code || '// No code content available';
  if (sanitizedCode.length > 50000) {
    sanitizedCode = sanitizedCode.slice(0, 50000) + '\n\n// ... [Code context truncated: exceeding 50,000 characters] ...\n';
  }

  const systemInstruction = `You are an expert AI code assistant inside RepoMind. You are helping a developer understand a specific file in a GitHub repository.
Selected File Path: ${filePath || 'Unknown'}
Source Code Context:
\`\`\`
${sanitizedCode}
\`\`\`

Rules:
1. Ground all answers strictly in the provided file.
2. Be concise, direct, and technically accurate.
3. Use markdown for code snippets, bullet points, and emphasis.
4. Reference exact lines, variables, and function names where appropriate.
5. If the user asks something that cannot be answered from this file, explain that clearly.`;

  // Build the message history
  const contents = [];
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

  contents.push({
    role: 'user',
    parts: [{ text: question }],
  });

  const { response, modelUsed } = await executeWithModelFallback(async (activeModel) => {
    return await ai.models.generateContent({
      model: activeModel,
      contents,
      config: {
        systemInstruction,
      },
    });
  }, model);

  const reply = response.text?.trim() || 'No response generated.';
  return {
    reply,
    modelUsed,
    timestamp: new Date().toISOString(),
  };
}
