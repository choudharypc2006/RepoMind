import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Cpu,
  Code2,
  Key,
  Save,
  Check,
  Shield,
  Sliders,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const Settings = () => {
  const { userSettings, updateSettings, resetDefaultData } = useRepo();
  const [formData, setFormData] = useState({ ...userSettings });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    resetDefaultData();
    setFormData({
      theme: 'charcoal',
      aiModel: 'gemini-1.5-pro',
      analysisDepth: 'deep',
      autoExplain: true,
      fontSize: 14,
      showLineNumbers: true,
      wordWrap: true,
      tabSize: 2,
      githubToken: '',
      defaultBranch: 'main',
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-charcoal-700/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Settings & Preferences
            </h1>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Configure your code inspection workspace, Gemini AI model preferences, and viewer layout.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: AI Model & Analysis Engine */}
        <div className="p-6 rounded-xl bg-charcoal-900 border border-charcoal-700/70 space-y-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-charcoal-100 border-b border-charcoal-800 pb-3">
            <Cpu className="w-4 h-4 text-brand-400" />
            <span>AI Code Intelligence Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal-300">
                Active Gemini Model
              </label>
              <select
                value={formData.aiModel}
                onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-charcoal-200 focus:outline-none focus:border-brand-500"
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended - Deep Reasoning)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Fast Latency)</option>
                <option value="gemini-ultra-experimental">Gemini Ultra (Experimental Complex AST)</option>
              </select>
              <p className="text-[11px] text-charcoal-500">
                Gemini 1.5 Pro delivers the most balanced syntax comprehension and security audits.
              </p>
            </div>

            {/* Analysis Depth */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal-300">
                Default Analysis Depth
              </label>
              <select
                value={formData.analysisDepth}
                onChange={(e) => setFormData({ ...formData, analysisDepth: e.target.value })}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-charcoal-200 focus:outline-none focus:border-brand-500"
              >
                <option value="standard">Standard (Overview & Key Insights)</option>
                <option value="deep">Deep Architectural & Complexity Profile</option>
                <option value="security">Security & CVE Vulnerability Focus</option>
              </select>
              <p className="text-[11px] text-charcoal-500">
                Controls the depth of insights generated when selecting any file.
              </p>
            </div>
          </div>

          {/* Auto Explain Toggle */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-charcoal-200 block">
                Automatic File Explanation
              </span>
              <span className="text-[11px] text-charcoal-400">
                Automatically generate Gemini summary when a file is opened in explorer.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoExplain}
                onChange={(e) => setFormData({ ...formData, autoExplain: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-charcoal-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-charcoal-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>

        {/* Section 2: Appearance & Theme */}
        <div className="p-6 rounded-xl bg-charcoal-900 border border-charcoal-700/70 space-y-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-charcoal-100 border-b border-charcoal-800 pb-3">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Theme & Workspace Appearance</span>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-charcoal-300 block">
              Color Palette
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'charcoal', name: 'Dark Charcoal', desc: 'Linear & GitHub dark inspired (Default)', color: 'bg-[#0d0f12]' },
                { id: 'midnight', name: 'Midnight OLED', desc: 'Pitch black pure OLED contrast', color: 'bg-black' },
                { id: 'slate', name: 'Slate Minimal', desc: 'Cool blue-grey tone balance', color: 'bg-[#0f172a]' },
              ].map((themeOption) => (
                <div
                  key={themeOption.id}
                  onClick={() => setFormData({ ...formData, theme: themeOption.id })}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    formData.theme === themeOption.id
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-charcoal-750 bg-charcoal-950/60 hover:border-charcoal-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-charcoal-200">{themeOption.name}</span>
                    <div className={`w-3.5 h-3.5 rounded-full border border-charcoal-600 ${themeOption.color}`} />
                  </div>
                  <p className="text-[11px] text-charcoal-400 leading-tight">
                    {themeOption.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Code Viewer Customization */}
        <div className="p-6 rounded-xl bg-charcoal-900 border border-charcoal-700/70 space-y-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-charcoal-100 border-b border-charcoal-800 pb-3">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Code Viewer Typography & Behavior</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal-300">
                Font Size ({formData.fontSize}px)
              </label>
              <input
                type="range"
                min="11"
                max="18"
                value={formData.fontSize}
                onChange={(e) => setFormData({ ...formData, fontSize: Number(e.target.value) })}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal-300">
                Tab Indentation
              </label>
              <select
                value={formData.tabSize}
                onChange={(e) => setFormData({ ...formData, tabSize: Number(e.target.value) })}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-charcoal-200 focus:outline-none focus:border-brand-500"
              >
                <option value={2}>2 Spaces (Modern JS/TS)</option>
                <option value={4}>4 Spaces (Python/Go)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-charcoal-300">
                Line Numbers
              </label>
              <select
                value={formData.showLineNumbers ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, showLineNumbers: e.target.value === 'true' })}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-charcoal-200 focus:outline-none focus:border-brand-500"
              >
                <option value="true">Show Line Numbers</option>
                <option value="false">Hide Line Numbers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: GitHub Token Integration (Optional) */}
        <div className="p-6 rounded-xl bg-charcoal-900 border border-charcoal-700/70 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-charcoal-100 border-b border-charcoal-800 pb-3">
            <Key className="w-4 h-4 text-amber-400" />
            <span>GitHub Personal Access Token (Optional)</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-charcoal-300">
              Personal Access Token (Classic or Fine-Grained)
            </label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.githubToken}
              onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-lg px-3 py-2 text-xs text-charcoal-200 placeholder-charcoal-600 focus:outline-none focus:border-brand-500 font-mono"
            />
            <p className="text-[11px] text-charcoal-500">
              Only required if you want to inspect private repositories or bypass GitHub public rate limits (60 req/hour).
            </p>
          </div>
        </div>

        {/* Save Footer */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            icon={RotateCcw}
          >
            Reset All Defaults
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            className="shadow-glow-brand"
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

