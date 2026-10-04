import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  Sun,
  Moon,
  Laptop,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { ThemePreference } from "../utils/useTheme";
import {
  DEFAULT_API_URL,
  getStoredApiUrl,
  setStoredApiUrl,
  resetStoredApiUrl,
  testApiConnection,
} from "../services/langtoolApi";
import {
  getGroqConfig,
  setGroqConfig,
  testGroqConnection,
  AVAILABLE_GROQ_MODELS,
  DEFAULT_GROQ_MODEL,
} from "../services/rephraseService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemePreference;
  onSelectTheme: (theme: ThemePreference) => void;
  onApiUrlChanged: (newUrl: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  onApiUrlChanged,
}) => {
  // LanguageTool API State
  const [apiUrl, setApiUrl] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Groq Cloud AI State
  const [groqApiKey, setGroqApiKey] = useState<string>("");
  const [groqModel, setGroqModel] = useState<string>(DEFAULT_GROQ_MODEL);
  const [showGroqKey, setShowGroqKey] = useState<boolean>(false);
  const [isTestingGroq, setIsTestingGroq] = useState<boolean>(false);
  const [groqTestResult, setGroqTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setApiUrl(getStoredApiUrl());
      setTestResult(null);

      const groqCfg = getGroqConfig();
      setGroqApiKey(groqCfg.apiKey);
      setGroqModel(groqCfg.model);
      setGroqTestResult(null);

      setSavedSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testApiConnection(apiUrl);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestGroq = async () => {
    setIsTestingGroq(true);
    setGroqTestResult(null);
    try {
      const result = await testGroqConnection(groqApiKey, groqModel);
      setGroqTestResult(result);
    } finally {
      setIsTestingGroq(false);
    }
  };

  const handleSave = () => {
    // Save LanguageTool settings
    setStoredApiUrl(apiUrl);
    onApiUrlChanged(apiUrl);

    // Save Groq Cloud settings
    setGroqConfig({
      apiKey: groqApiKey.trim(),
      model: groqModel,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    const defaultUrl = resetStoredApiUrl();
    setApiUrl(defaultUrl);
    setTestResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize theme, LanguageTool server, and Groq Cloud AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Theme Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* System */}
              <button
                type="button"
                onClick={() => onSelectTheme("system")}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  currentTheme === "system"
                    ? "border-sky-500 bg-sky-50/60 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Laptop className="w-5 h-5" />
                <span>System</span>
              </button>

              {/* Light */}
              <button
                type="button"
                onClick={() => onSelectTheme("light")}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  currentTheme === "light"
                    ? "border-sky-500 bg-sky-50/60 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Light</span>
              </button>

              {/* Dark */}
              <button
                type="button"
                onClick={() => onSelectTheme("dark")}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  currentTheme === "dark"
                    ? "border-sky-500 bg-sky-50/60 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Moon className="w-5 h-5 text-sky-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Groq Cloud AI Rephraser Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Sentence Rephraser (Groq Cloud)</span>
              </label>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                100% Free
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              Powers instant sentence rewriting with natural, professional, and concise tones using Groq's high-speed LPUs.
            </p>

            <div className="space-y-3">
              {/* API Key Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span>Groq API Key</span>
                  </span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <span>Get free key (no card required)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showGroqKey ? "text" : "password"}
                      value={groqApiKey}
                      onChange={(e) => {
                        setGroqApiKey(e.target.value);
                        setGroqTestResult(null);
                      }}
                      placeholder="gsk_..."
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestGroq}
                    disabled={isTestingGroq || !groqApiKey.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingGroq ? "animate-spin text-amber-500" : ""}`} />
                    <span>Test</span>
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Model</span>
                <select
                  value={groqModel}
                  onChange={(e) => {
                    setGroqModel(e.target.value);
                    setGroqTestResult(null);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                >
                  {AVAILABLE_GROQ_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test status banner */}
              {groqTestResult && (
                <div
                  className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs animate-in fade-in duration-150 ${
                    groqTestResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {groqTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">
                    <p className="font-medium">{groqTestResult.message}</p>
                    {groqTestResult.latencyMs && (
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Latency: <span className="font-mono font-semibold">{groqTestResult.latencyMs}ms</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LanguageTool Server Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>LanguageTool API Server</span>
              </label>
              {apiUrl !== DEFAULT_API_URL && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to default</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => {
                    setApiUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="https://langtool.ysnirix.xyz/v2"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiUrl.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-sky-500" : ""}`} />
                  <span>Test</span>
                </button>
              </div>

              {/* Test status banner */}
              {testResult && (
                <div
                  className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs animate-in fade-in duration-150 ${
                    testResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">
                    <p className="font-medium">{testResult.message}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Endpoint tested: <span className="font-mono">{apiUrl}/languages</span>
                    </p>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Default: <span className="font-mono text-slate-600 dark:text-slate-300">{DEFAULT_API_URL}</span>. 
                Compatible with any LanguageTool v2 instance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition-all"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
