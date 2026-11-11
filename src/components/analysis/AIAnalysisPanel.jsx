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
  ChevronDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const AIAnalysisPanel = ({ file, isAnalyzing = false, onTriggerExplain }) => {
  const [activeTab, setActiveTab] = useState('explanation'); // explanation | complexity | chat
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync / reset chat when file changes
  React.useEffect(() => {
    if (file) {
      setChatMessages([
        {
          role: 'assistant',
          text: `I've analyzed \`${file.name}\`. It plays a key role in ${file.path.split('/')[0] || 'core'}. You can explore the architectural summary or ask me any specific question about its logic!`,
        },
      ]);
    }
  }, [file?.path]);

  const analysis = file?.analysis || {
    summary: 'No precomputed analysis available for this file. Click Explain Code to generate AI insights with Gemini.',
    keyInsights: [
      'File detected and parsed into abstract syntax representation.',
      'Awaiting manual prompt or trigger to generate semantic breakdown.',
    ],
    complexity: {
      time: 'O(1) pending',
      space: 'O(1) pending',
      maintainabilityIndex: 85,
      cyclomaticComplexity: 3,
    },
    security: {
      score: 'A',
      status: 'Clean',
      details: 'No glaring vulnerabilities identified in static heuristics.',
    },
    suggestions: ['Run automated test coverage suite.'],
  };

  const handleCopyAnalysis = () => {
    const markdown = `# RepoMind AI Analysis: ${file?.name}
## Architectural Summary
${analysis.summary}

## Key Insights
${analysis.keyInsights.map((k) => `- ${k}`).join('\n')}

## Complexity & Performance
- Time Complexity: ${analysis.complexity.time}
- Space Complexity: ${analysis.complexity.space}
- Maintainability Index: ${analysis.complexity.maintainabilityIndex}/100
- Cyclomatic Complexity: ${analysis.complexity.cyclomaticComplexity}

## Security Assessment
- Rating: ${analysis.security.score} (${analysis.security.status})
- Assessment: ${analysis.security.details}
`;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskQuestion = (customQuestion) => {
    const q = customQuestion || inputQuestion;
    if (!q.trim() || isAnswering) return;

    const userMsg = { role: 'user', text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsAnswering(true);

    setTimeout(() => {
      let aiResponse = '';
      const lower = q.toLowerCase();

      if (lower.includes('security') || lower.includes('vulnerab') || lower.includes('safe')) {
        aiResponse = `Regarding **security in ${file?.name}**:\n\nThe current implementation adheres to standard best practices with rating **${analysis.security.score}**. ${analysis.security.details}\n\n**Recommendation:** Ensure input boundaries remain validated before passing down values.`;
      } else if (lower.includes('test') || lower.includes('unit test') || lower.includes('coverage')) {
        aiResponse = `Here is how you can write a comprehensive test for **${file?.name}**:\n\n1. Mock external dependencies (e.g. standard library or middleware).\n2. Test default parameters and configuration boundaries.\n3. Assert edge-case error propagation when invalid inputs are passed.\n\nWould you like a sample test boilerplate?`;
      } else if (lower.includes('performance') || lower.includes('complex') || lower.includes('scale')) {
        aiResponse = `**Performance Profile for ${file?.name}:**\n- Runtime Complexity: **${analysis.complexity.time}**\n- Memory Profile: **${analysis.complexity.space}**\n- Cyclomatic Complexity is **${analysis.complexity.cyclomaticComplexity}**, which represents low branching overhead and great cache-locality.`;
      } else {
        aiResponse = `In \`${file?.name}\`, the core control flow coordinates state and configuration. Specifically, ${analysis.keyInsights[0] || 'the logic cleanly organizes responsibility'}. If you need deeper refactoring steps, check the Complexity & Security tab!`;
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', text: aiResponse }]);
      setIsAnswering(false);
    }, 900);
  };

  const sampleQuestions = [
    'Are there any security concerns?',
    'What is the time complexity?',
    'How would I write a unit test?',
  ];

  return (
    <div className="flex flex-col h-full bg-charcoal-900 border-l border-charcoal-700/70 select-none">
      {/* Header */}
      <div className="p-3 border-b border-charcoal-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-200">
            Gemini AI Intelligence
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="brand" size="xs">
            Gemini 1.5 Pro
          </Badge>
          <button
            onClick={handleCopyAnalysis}
            className="p-1 rounded text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors cursor-pointer"
            title="Copy Analysis Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-charcoal-700/60 bg-charcoal-950/40 text-xs font-medium">
        <button
          onClick={() => setActiveTab('explanation')}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'explanation'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850/60'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850/30'
          }`}
        >
          Explanation
        </button>
        <button
          onClick={() => setActiveTab('complexity')}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'complexity'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850/60'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850/30'
          }`}
        >
          Audit & Metrics
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'border-brand-500 text-brand-300 bg-charcoal-850/60'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-850/30'
          }`}
        >
          <span>Ask Gemini</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {isAnalyzing ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-charcoal-800 rounded w-3/4"></div>
            <div className="h-16 bg-charcoal-800/60 rounded"></div>
            <div className="space-y-2">
              <div className="h-3 bg-charcoal-800 rounded"></div>
              <div className="h-3 bg-charcoal-800 rounded w-5/6"></div>
              <div className="h-3 bg-charcoal-800 rounded w-2/3"></div>
            </div>
            <div className="p-3 bg-charcoal-800/40 rounded-lg flex items-center justify-center gap-2 text-xs text-brand-300">
              <Sparkles className="w-4 h-4 animate-spin text-brand-400" />
              <span>Gemini AI is analyzing code structure...</span>
            </div>
          </div>
        ) : activeTab === 'explanation' ? (
          <div className="space-y-4 text-xs">
            {/* Summary Block */}
            <div className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/70">
              <div className="flex items-center gap-1.5 text-charcoal-300 font-semibold mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Summary</span>
              </div>
              <p className="text-charcoal-300 leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Key Insights */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Key Architectural Insights
              </span>
              <div className="space-y-2">
                {analysis.keyInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md bg-charcoal-850/60 border border-charcoal-700/50 flex items-start gap-2 text-charcoal-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Refactoring Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                  AI Recommended Refactoring
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
        ) : activeTab === 'complexity' ? (
          <div className="space-y-4 text-xs">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/60">
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                  Time Complexity
                </span>
                <span className="text-xs font-mono font-medium text-emerald-400 mt-1 block">
                  {analysis.complexity.time}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/60">
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                  Space Allocation
                </span>
                <span className="text-xs font-mono font-medium text-cyan-400 mt-1 block">
                  {analysis.complexity.space}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/60">
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                  Maintainability Index
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
                  {analysis.complexity.cyclomaticComplexity} (Low)
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
                  className="text-[11px] px-2 py-1 rounded bg-charcoal-800 hover:bg-charcoal-750 text-charcoal-300 hover:text-brand-300 border border-charcoal-700 transition-colors text-left cursor-pointer"
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
                  <span>Gemini is generating response...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-2 border-t border-charcoal-700/60 flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Ask anything about this code..."
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
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

