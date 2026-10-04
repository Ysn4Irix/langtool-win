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
}) => {
  return (
    <footer className="h-8 border-t border-slate-800 bg-slate-950 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none z-30">
      {/* Left: Text Statistics */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>
            <strong className="text-slate-300 font-medium">{words}</strong> words
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-slate-300 font-medium">{chars}</strong> chars
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-slate-300 font-medium">{sentences}</strong> sentences
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-slate-500">
          <Clock className="w-3 h-3" />
          <span>~{readingTimeSec}s read</span>
        </div>

        {detectedLanguageName && (
          <div className="hidden md:flex items-center gap-1 text-sky-400/80">
            <span>Lang: {detectedLanguageName}</span>
          </div>
        )}
      </div>

      {/* Center: Status indication */}
      <div className="flex items-center gap-2">
        {isChecking ? (
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            Analyzing text...
          </span>
        ) : issueCount === 0 ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clean (no issues)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{issueCount} issue{issueCount > 1 ? "s" : ""}</span>
          </span>
        )}
      </div>

      {/* Right: API Server & Shortcuts hint */}
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-slate-500 font-mono text-[10px]">
          Ctrl+Enter check • Ctrl+Shift+C copy
        </span>

        <div className="flex items-center gap-1.5 text-slate-400" title="Connected to https://langtool.ysnirix.xyz/v2">
          <span className={`w-2 h-2 rounded-full ${apiConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className="text-[10px] text-slate-500 font-mono">langtool.ysnirix.xyz</span>
        </div>
      </div>
    </footer>
  );
};
