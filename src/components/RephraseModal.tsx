import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  X,
  Copy,
  RefreshCw,
  Key,
  ExternalLink,
  Briefcase,
  Zap,
  Leaf,
  AlertCircle,
  ArrowRight,
  Globe,
} from "lucide-react";
import { RephraseSentenceInfo, RephraseSuggestion } from "../types/rephrase";
import {
  rephraseSentence,
  isGroqConfigured,
  setGroqConfig,
} from "../services/rephraseService";
import { useToast } from "../context/ToastContext";

interface RephraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentenceInfo: RephraseSentenceInfo | null;
  languageName?: string;
  isRtl?: boolean;
  onApply: (replacement: string) => void;
  onOpenSettings: () => void;
}

export const RephraseModal: React.FC<RephraseModalProps> = ({
  isOpen,
  onClose,
  sentenceInfo,
  languageName,
  isRtl = false,
  onApply,
  onOpenSettings,
}) => {
  const toast = useToast();
  const [suggestions, setSuggestions] = useState<RephraseSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Key Input state if not yet configured
  const [quickApiKey, setQuickApiKey] = useState<string>("");
  const [hasKey, setHasKey] = useState<boolean>(isGroqConfigured);

  const fetchSuggestions = useCallback(
    async (targetSentence: string) => {
      setIsLoading(true);
      setError(null);
      setSuggestions([]);

      try {
        const results = await rephraseSentence(targetSentence, {
          language: languageName,
        });
        setSuggestions(results);
      } catch (err: any) {
        if (err.message === "GROQ_API_KEY_REQUIRED") {
          setHasKey(false);
        } else {
          setError(err.message || "Failed to generate rephrased suggestions.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [languageName]
  );

  // When modal opens, check config and fetch if key present
  useEffect(() => {
    if (!isOpen || !sentenceInfo) return;
    const configured = isGroqConfigured();
    setHasKey(configured);

    if (configured) {
      fetchSuggestions(sentenceInfo.text);
    }
  }, [isOpen, sentenceInfo, fetchSuggestions]);

  // Handle saving API key directly inside modal
  const handleSaveQuickKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickApiKey.trim()) return;
    setGroqConfig({ apiKey: quickApiKey.trim() });
    setHasKey(true);
    toast.success("Groq API key saved");
    if (sentenceInfo) {
      fetchSuggestions(sentenceInfo.text);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Sentence copied to clipboard");
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Failed to copy sentence");
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sentenceInfo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 text-slate-800 dark:text-slate-100 animate-modal-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Sentence Rephraser</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  Groq Cloud LPU
                </span>
                {languageName && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-sky-500" />
                    <span>{languageName}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate clearer, more natural phrasing with one-click replacements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original Sentence Bar */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
            Original Sentence
          </div>
          <p
            dir={isRtl ? "rtl" : "auto"}
            className={`text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            "{sentenceInfo.text}"
          </p>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {/* Case 1: Needs API Key setup */}
          {!hasKey && (
            <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Free Groq API Key Required
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Groq Cloud provides ultra-fast LPU inference (under 250ms) completely free with no credit card needed.
                </p>
              </div>

              <form onSubmit={handleSaveQuickKey} className="space-y-2.5 max-w-md mx-auto pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={quickApiKey}
                    onChange={(e) => setQuickApiKey(e.target.value)}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="submit"
                    disabled={!quickApiKey.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Save & Rephrase
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    <span>Get free key at console.groq.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="hover:underline text-slate-500 dark:text-slate-400"
                  >
                    Open Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Case 2: Loading State */}
          {hasKey && isLoading && (
            <div className="py-8 space-y-3">
              <div className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs font-medium">
                  Crafting 3 natural variations with Groq Cloud...
                </span>
              </div>
              <div className="space-y-2.5 pt-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-800/40 animate-pulse space-y-2"
                  >
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Case 3: Error State */}
          {hasKey && !isLoading && error && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Could not generate suggestions</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">{error}</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => fetchSuggestions(sentenceInfo.text)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                >
                  Check Settings
                </button>
              </div>
            </div>
          )}

          {/* Case 4: Results (3 Variations) */}
          {hasKey && !isLoading && !error && suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((item, idx) => {
                const isNatural = item.tone === "natural";
                const isProfessional = item.tone === "professional";
                const isConcise = item.tone === "concise";

                return (
                  <div
                    key={idx}
                    className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400/80 dark:hover:border-amber-500/60 bg-white dark:bg-slate-850 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 space-y-2.5 animate-card-in"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isNatural && (
                          <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Leaf className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isProfessional && (
                          <div className="p-1 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {isConcise && (
                          <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {item.label}
                        </span>
                        {item.note && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                            {item.note}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(item.text)}
                          title="Copy rephrased sentence"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-all duration-150 active:scale-90"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            onApply(item.text);
                            toast.success("Sentence applied");
                            onClose();
                          }}
                          className="group/apply flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium shadow-sm hover:shadow transition-all duration-150 active:scale-95"
                        >
                          <span>Apply</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/apply:translate-x-0.5 rtl:group-hover/apply:-translate-x-0.5" />
                        </button>
                      </div>
                    </div>

                    {/* Rewritten Text */}
                    <p
                      dir={isRtl ? "rtl" : "auto"}
                      className={`text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed ${
                        isRtl ? "text-right" : "text-left"
                      }`}
                    >
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasKey && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <button
              onClick={() => fetchSuggestions(sentenceInfo.text)}
              disabled={isLoading}
              className="group flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45 ${isLoading ? "animate-spin text-amber-500" : ""}`} />
              <span>Regenerate variations</span>
            </button>
            <span className="text-[11px] text-slate-400">Esc to close</span>
          </div>
        )}
      </div>
    </div>
  );
};
