import React from "react";
import { CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";

interface StatusBarProps {
  words: number;
  chars: number;
  sentences: number;
  readingTimeSec: number;
  isChecking: boolean;
  issueCount: number;
  apiConnected: boolean;
  detectedLanguageName?: string;
  apiUrl: string;
  onOpenSettings: () => void;
  onRephrase?: () => void;
  isRtl?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  words,
  chars,
  sentences,
  readingTimeSec,
  isChecking,
  issueCount,
  apiConnected,
  detectedLanguageName,
  apiUrl,
  onOpenSettings,
  onRephrase,
  isRtl = false,
}) => {
  // Extract hostname for clean pill display
  let displayHost = "API Server";
  try {
    const parsed = new URL(apiUrl);
    displayHost = parsed.hostname;
  } catch {
    displayHost = apiUrl.replace(/https?:\/\//, "").split("/")[0] || "API";
  }

  return (
    <footer className="h-8 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 select-none z-30 transition-colors">
      {/* Left: Text Statistics */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>
            <strong className="text-slate-800 dark:text-slate-300 font-medium">{words}</strong> words
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>
            <strong className="text-slate-800 dark:text-slate-300 font-medium">{chars}</strong> chars
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>
            <strong className="text-slate-800 dark:text-slate-300 font-medium">{sentences}</strong> sentences
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <Clock className="w-3 h-3" />
          <span>~{readingTimeSec}s read</span>
        </div>

        {detectedLanguageName && (
          <div className="hidden md:flex items-center gap-1 text-sky-600 dark:text-sky-400/90 font-medium">
            <span>Lang: {detectedLanguageName}</span>
          </div>
        )}

        {isRtl && (
          <span
            title="Right-to-Left (RTL) writing direction active"
            className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-bold border border-amber-300/80 dark:border-amber-700/60"
          >
            RTL
          </span>
        )}
      </div>

      {/* Center: Status indication */}
      <div className="flex items-center gap-2">
        {isChecking ? (
          <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
            Analyzing text...
          </span>
        ) : issueCount === 0 ? (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clean (no issues)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{issueCount} issue{issueCount > 1 ? "s" : ""}</span>
          </span>
        )}
      </div>

      {/* Right: API Server & Shortcuts hint */}
      <div className="flex items-center gap-3">
        <span className="hidden lg:flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-mono text-[10px]">
          <span>Ctrl+Enter check •</span>
          {onRephrase ? (
            <button
              onClick={onRephrase}
              title="Click to rephrase active sentence (Ctrl+Shift+R)"
              className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer"
            >
              Ctrl+Shift+R rephrase
            </button>
          ) : (
            <span>Ctrl+Shift+R rephrase</span>
          )}
          <span>• Ctrl+Shift+C copy</span>
        </span>

        {/* Clickable API Server pill */}
        <button
          onClick={onOpenSettings}
          title={`Connected to ${apiUrl} (Click to change)`}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span className={`w-2 h-2 rounded-full ${apiConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono underline decoration-dotted underline-offset-2">
            {displayHost}
          </span>
        </button>
      </div>
    </footer>
  );
};
