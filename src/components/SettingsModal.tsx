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
} from "lucide-react";
import { ThemePreference } from "../utils/useTheme";
import {
  DEFAULT_API_URL,
  getStoredApiUrl,
  setStoredApiUrl,
  resetStoredApiUrl,
  testApiConnection,
} from "../services/langtoolApi";

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
  const [apiUrl, setApiUrl] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setApiUrl(getStoredApiUrl());
      setTestResult(null);
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

  const handleSave = () => {
    setStoredApiUrl(apiUrl);
    onApiUrlChanged(apiUrl);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize theme and LanguageTool server connection
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

        {/* Content */}
        <div className="py-5 space-y-6">
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
                <Sun className="w-5 h-5" />
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
                <Moon className="w-5 h-5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* API Server Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                LanguageTool API URL
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
                Compatible with any LanguageTool v2 instance (e.g. self-hosted Docker, local instance).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
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
