import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Cpu,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Code2,
  AlertCircle,
  MessageSquare,
  FileText,
  ListChecks,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useRepo } from '../../context/RepoContext';

const AVAILABLE_GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', tag: '1M tokens', badge: 'Ultra Fast' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Lite', tag: '1M tokens', badge: 'High Throughput' },
];

export const AIAnalysisPanel = ({
  file,
  isAnalyzing = false,
  explainError = null,
  onTriggerExplain,
}) => {
  const { askGeminiAboutFile, activeAiModel, setActiveAiModel } = useRepo();
  const [activeTab, setActiveTab] = useState('explanation'); // explanation | functions | complexity | chat
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Sync / reset chat when file changes
  React.useEffect(() => {
    if (file) {
      setChatMessages([
        {
          role: 'assistant',
          text: `Hello! I'm Gemini. I have loaded \`${file.name}\`. You can review the architectural summary or ask me any question about its functions, data flow, or logic.`,
        },
      ]);
      setChatError(null);
    }
  }, [file?.path]);

  const analysis = file?.analysis || {
    summary: 'No AI analysis generated yet for this file. Click "Explain Code" to run deep analysis using Google Gemini.',
    detailedExplanation: '',
    keyInsights: [
      'File selected in file explorer.',
      'Click Explain Code to generate module breakdown, function documentation, and bug analysis.',
    ],
    functions: [],
    potentialIssues: [],
    suggestions: ['Click "Explain Code" to request analysis from Gemini.'],
    complexity: {
      time: 'Pending',
      space: 'Pending',
      maintainabilityIndex: 90,
      cyclomaticComplexity: 'Normal',
    },
    security: {
      score: 'A',
      status: 'Ready',
      details: 'Ready for Gemini AI code review.',
    },
  };

  const handleCopyAnalysis = () => {
    const markdown = `# RepoMind AI Analysis: ${file?.name}
## Summary
${analysis.summary}

${analysis.detailedExplanation ? `## Detailed Explanation\n${analysis.detailedExplanation}\n` : ''}

## Key Concepts & Insights
${(analysis.keyInsights || []).map((k) => `- ${k}`).join('\n')}

${analysis.functions && analysis.functions.length > 0 ? `## Functions & Methods\n${analysis.functions.map(f => `### ${f.name}\n- **Purpose**: ${f.purpose}\n- **Parameters**: ${f.parameters || 'None'}\n- **Returns**: ${f.returnVal || 'void'}`).join('\n\n')}\n` : ''}

${analysis.potentialIssues && analysis.potentialIssues.length > 0 ? `## Potential Issues / Edge Cases\n${analysis.potentialIssues.map(p => `- ${p}`).join('\n')}\n` : ''}

## Suggestions & Improvements
${(analysis.suggestions || []).map((s) => `- ${s}`).join('\n')}
`;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskQuestion = async (customQuestion) => {
    const q = customQuestion || inputQuestion;
    if (!q.trim() || isAnswering) return;

    const userMsg = { role: 'user', text: q.trim() };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setInputQuestion('');
    setIsAnswering(true);
    setChatError(null);

    try {
      // Pass previous messages (excluding the welcome message)
      const previousMessages = updatedHistory.slice(1, -1);
      const res = await askGeminiAboutFile(userMsg.text, previousMessages);

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.reply },
      ]);
    } catch (err) {
      setChatError(err.message || 'Failed to get answer from Gemini.');
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Error communicating with Gemini**: ${err.message}\n\n*Tip: Check that GEMINI_API_KEY is configured in backend/.env.*`,
        },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  const sampleQuestions = [
    'Explain the main purpose of this file',
    'Are there any potential bugs or edge cases?',
    'What do the parameters of the main functions do?',
    'How can I write a unit test for this code?',
  ];

  return (
    <div className="flex flex-col h-full bg-charcoal-900 border-l border-charcoal-700/70 select-none">
      {/* Header */}
      <div className="p-3 border-b border-charcoal-700/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-200">
            Gemini Code Intelligence
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Interactive Model Switcher with High-Token indicator */}
          <div className="relative flex items-center">
            <select
              value={activeAiModel || 'gemini-3.8-flash'}
              onChange={(e) => setActiveAiModel(e.target.value)}
              className="bg-charcoal-850 hover:bg-charcoal-800 text-brand-300 border border-brand-500/30 rounded-md text-[11px] font-mono py-1 pl-2 pr-5 appearance-none cursor-pointer focus:outline-none focus:border-brand-500 transition-colors shadow-sm"
              title="Switch between high-token Gemini models"
            >
              {AVAILABLE_GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-charcoal-900 text-charcoal-200">
                  {m.label} ({m.tag})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-brand-400/80 absolute right-1.5 pointer-events-none" />
          </div>

          <button
            onClick={handleCopyAnalysis}
            className="p-1 rounded text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors cursor-pointer"
            title="Copy Analysis Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-charcoal-700/60 bg-charcoal-950/40 text-xs font-medium shrink-0">
        <button
          onClick={() => setActiveTab('explanation')}
          className={`flex-1 py-2 px-2 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'explanation'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850/60'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850/30'
          }`}
        >
          Explanation
        </button>
        <button
          onClick={() => setActiveTab('functions')}
          className={`flex-1 py-2 px-2 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'functions'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850/60'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850/30'
          }`}
        >
          Functions
        </button>
        <button
          onClick={() => setActiveTab('complexity')}
          className={`flex-1 py-2 px-2 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'complexity'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850/60'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850/30'
          }`}
        >
          Audit & Issues
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-2 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850/60'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850/30'
          }`}
        >
          <span>Ask Gemini</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {/* Error Notification Banner if Explain failed */}
        {explainError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Gemini Analysis Error</p>
              <p className="mt-0.5 text-[11px] text-rose-300/90">{explainError}</p>
            </div>
          </div>
        )}

        {isAnalyzing ? (
          <div className="space-y-4 animate-pulse">
            <div className="p-4 rounded-xl bg-charcoal-850 border border-brand-500/30 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand-400 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-semibold text-brand-200">Gemini AI is reviewing code...</p>
                <p className="text-[11px] text-charcoal-400 mt-0.5">Analyzing functions, logic, potential bugs, and architecture.</p>
              </div>
            </div>
            <div className="h-4 bg-charcoal-800 rounded w-3/4"></div>
            <div className="h-16 bg-charcoal-800/60 rounded"></div>
            <div className="space-y-2">
              <div className="h-3 bg-charcoal-800 rounded"></div>
              <div className="h-3 bg-charcoal-800 rounded w-5/6"></div>
              <div className="h-3 bg-charcoal-800 rounded w-2/3"></div>
            </div>
          </div>
        ) : activeTab === 'explanation' ? (
          <div className="space-y-4 text-xs">
            {/* Quick Action Trigger if not analyzed */}
            {!analysis.detailedExplanation && (
              <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-between">
                <div>
                  <span className="font-medium text-brand-200 block">Run Real Gemini Analysis</span>
                  <span className="text-[11px] text-charcoal-400">
                    Inspect this file with {AVAILABLE_GEMINI_MODELS.find((m) => m.id === activeAiModel)?.label || 'Gemini'} ({AVAILABLE_GEMINI_MODELS.find((m) => m.id === activeAiModel)?.tag || 'High Token Context'})
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={onTriggerExplain}
                  isLoading={isAnalyzing}
                  icon={Sparkles}
                >
                  Analyze
                </Button>
              </div>
            )}

            {/* Summary Block */}
            <div className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/70">
              <div className="flex items-center gap-1.5 text-charcoal-200 font-semibold mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Summary</span>
              </div>
              <p className="text-charcoal-300 leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Detailed Explanation */}
            {analysis.detailedExplanation && (
              <div className="p-3 rounded-lg bg-charcoal-850/80 border border-charcoal-700/60 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block">
                  Detailed Architectural Breakdown
                </span>
                <p className="text-charcoal-300 leading-relaxed whitespace-pre-line">
                  {analysis.detailedExplanation}
                </p>
              </div>
            )}

            {/* Key Insights / Important Concepts */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Key Logic & Architectural Concepts
              </span>
              <div className="space-y-2">
                {analysis.keyInsights && analysis.keyInsights.length > 0 ? (
                  analysis.keyInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md bg-charcoal-850/60 border border-charcoal-700/50 flex items-start gap-2 text-charcoal-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{insight}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-charcoal-500 italic">No key concepts generated yet.</p>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                  Suggestions for Improvement
                </span>
                <div className="space-y-2">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md bg-brand-500/5 border border-brand-500/20 flex items-start gap-2 text-charcoal-300"
                    >
                      <Zap className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'functions' ? (
          /* Functions & Methods Tab */
          <div className="space-y-3 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block">
              Functions & Components ({analysis.functions?.length || 0})
            </span>

            {analysis.functions && analysis.functions.length > 0 ? (
              analysis.functions.map((fn, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/70 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono font-semibold text-charcoal-100">{fn.name}</span>
                  </div>
                  <p className="text-charcoal-300 leading-relaxed">{fn.purpose}</p>
                  {(fn.parameters || fn.returnVal) && (
                    <div className="pt-1.5 border-t border-charcoal-800 text-[11px] font-mono text-charcoal-400 space-y-0.5">
                      {fn.parameters && <div><span className="text-charcoal-500">Params:</span> {fn.parameters}</div>}
                      {fn.returnVal && <div><span className="text-charcoal-500">Returns:</span> {fn.returnVal}</div>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-charcoal-500 bg-charcoal-850/40 rounded-lg border border-dashed border-charcoal-700">
                <Code2 className="w-8 h-8 text-charcoal-600 mx-auto mb-2" />
                <p>No functions mapped yet.</p>
                <p className="text-[11px] mt-1">Click "Explain Code" to parse and document all functions.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'complexity' ? (
          /* Potential Issues & Audit Tab */
          <div className="space-y-4 text-xs">
            {/* Potential Bugs / Edge Cases */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Potential Bugs & Edge Cases</span>
              </span>

              {analysis.potentialIssues && analysis.potentialIssues.length > 0 ? (
                analysis.potentialIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-charcoal-200 leading-relaxed"
                  >
                    <span className="font-semibold text-amber-300 block mb-0.5">Issue #{idx + 1}</span>
                    {issue}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No glaring bugs or severe edge cases detected in provided code.</span>
                </div>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/60">
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                  Maintainability Score
                </span>
                <span className="text-sm font-semibold text-brand-300 mt-1 block">
                  {analysis.complexity.maintainabilityIndex} / 100
                </span>
              </div>
              <div className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/60">
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                  Cyclomatic Complexity
                </span>
                <span className="text-sm font-semibold text-charcoal-200 mt-1 block">
                  {analysis.complexity.cyclomaticComplexity}
                </span>
              </div>
            </div>

            {/* Security Audit Card */}
            <div className="p-3.5 rounded-lg bg-charcoal-850 border border-charcoal-700/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-charcoal-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security & Vulnerability Audit</span>
                </div>
                <Badge variant={analysis.security.score === 'A' ? 'success' : 'warning'}>
                  Score: {analysis.security.score}
                </Badge>
              </div>
              <p className="text-charcoal-300 leading-relaxed">
                {analysis.security.details}
              </p>
            </div>
          </div>
        ) : (
          /* Interactive Chat Tab */
          <div className="flex flex-col h-full space-y-3">
            {/* Suggested Chips */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {sampleQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleAskQuestion(sq)}
                  disabled={isAnswering}
                  className="text-[11px] px-2 py-1 rounded bg-charcoal-800 hover:bg-charcoal-750 text-charcoal-300 hover:text-brand-300 border border-charcoal-700 transition-colors text-left cursor-pointer disabled:opacity-50"
                >
                  {sq}
                </button>
              ))}
            </div>

            {/* Messages stream */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600/15 border border-brand-500/30 text-brand-100 ml-4'
                      : 'bg-charcoal-850 border border-charcoal-700/60 text-charcoal-300 mr-2 whitespace-pre-line'
                  }`}
                >
                  <div className="font-semibold text-[10px] uppercase tracking-wider mb-1 opacity-60">
                    {msg.role === 'user' ? 'You' : 'Gemini AI'}
                  </div>
                  {msg.text}
                </div>
              ))}

              {isAnswering && (
                <div className="p-2.5 rounded-lg bg-charcoal-850 border border-charcoal-700/60 text-xs text-charcoal-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-400" />
                  <span>Gemini is analyzing {file?.name}...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-2 border-t border-charcoal-700/60 flex items-center gap-1.5">
              <input
                type="text"
                placeholder={`Ask Gemini about ${file?.name || 'this file'}...`}
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                disabled={isAnswering}
                className="flex-1 bg-charcoal-950 border border-charcoal-700/80 rounded-md px-2.5 py-1.5 text-xs text-charcoal-200 placeholder-charcoal-500 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={() => handleAskQuestion()}
                disabled={!inputQuestion.trim() || isAnswering}
                className="p-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-md transition-colors cursor-pointer"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
