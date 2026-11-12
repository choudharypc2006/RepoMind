import * as geminiService from '../services/geminiService.js';

/**
 * Controller: Explain source code of a file
 * POST /api/ai/explain
 * Body: { repoName, filePath, language, code }
 */
export async function explainFile(req, res, next) {
  try {
    const { repoName, filePath, language, code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: code. Please provide source code to analyze.',
      });
    }

    const analysis = await geminiService.explainCode({
      repoName,
      filePath,
      language,
      code,
    });

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Interactive chat about a file
 * POST /api/ai/chat
 * Body: { filePath, code, messages, question }
 */
export async function chatFile(req, res, next) {
  try {
    const { filePath, code, messages, question } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: question.',
      });
    }

    const response = await geminiService.chatAboutCode({
      filePath,
      code,
      messages: Array.isArray(messages) ? messages : [],
      question: question.trim(),
    });

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
}

