import * as geminiService from '../services/geminiService.js';

/**
 * Controller: Get list of available Gemini models with token info
 * GET /api/ai/models
 */
export async function getModels(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      defaultModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      data: geminiService.SUPPORTED_MODELS,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Explain source code of a file
 * POST /api/ai/explain
 * Body: { repoName, filePath, language, code, model }
 */
export async function explainFile(req, res, next) {
  try {
    const { repoName, filePath, language, code, model } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: code. Please provide source code to analyze.',
      });
    }

    if (code.length > 200000) {
      return res.status(400).json({
        success: false,
        error: 'Source code exceeds maximum limit of 200,000 characters. Please select a smaller module.',
      });
    }

    const analysis = await geminiService.explainCode({
      repoName: typeof repoName === 'string' ? repoName.trim() : 'Repository',
      filePath: typeof filePath === 'string' ? filePath.trim() : 'Unknown',
      language: typeof language === 'string' ? language.trim() : 'text',
      code,
      model: typeof model === 'string' ? model.trim() : null,
    });

    return res.status(200).json({
      success: true,
      modelUsed: analysis.modelUsed,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Interactive chat about a file
 * POST /api/ai/chat
 * Body: { filePath, code, messages, question, model }
 */
export async function chatFile(req, res, next) {
  try {
    const { filePath, code, messages, question, model } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: question.',
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Question is too long (maximum 2,000 characters).',
      });
    }

    const response = await geminiService.chatAboutCode({
      filePath: typeof filePath === 'string' ? filePath.trim() : 'Unknown',
      code: typeof code === 'string' ? code : '',
      messages: Array.isArray(messages) ? messages.slice(-10) : [], // Keep last 10 messages for context safety
      question: question.trim(),
      model: typeof model === 'string' ? model.trim() : null,
    });

    return res.status(200).json({
      success: true,
      modelUsed: response.modelUsed,
      data: response,
    });
  } catch (error) {
    next(error);
  }
}
