import React, { useState } from "react";
import {
  Check,
  X,
  Wand2,
} from "lucide-react";
import { Match, IssueCategoryType } from "../types/langtool";

interface IssuesPanelProps {
  matches: Match[];
  selectedMatchId?: string;
  onSelectIssue: (match: Match) => void;
  onApplyReplacement: (match: Match, replacement: string) => void;
  onApplyAll: () => void;
  onIgnore: (matchId: string) => void;
  onClose: () => void;
}

export const IssuesPanel: React.FC<IssuesPanelProps> = ({
  matches,
  selectedMatchId,
  onSelectIssue,
  onApplyReplacement,
  onApplyAll,
  onIgnore,
  onClose,
}) => {
  const [filter, setFilter] = useState<"all" | IssueCategoryType>("all");

  const spellingCount = matches.filter((m) => m.categoryType === "spelling").length;
  const grammarCount = matches.filter((m) => m.categoryType === "grammar").length;
  const styleCount = matches.filter((m) => m.categoryType === "style").length;

  const filteredMatches = matches.filter((m) => {
    if (filter === "all") return true;
    return m.categoryType === filter;
  });

  const fixableCount = matches.filter((m) => m.replacements && m.replacements.length > 0).length;

  return (
    <aside className="w-80 md:w-96 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full select-none shrink-0 z-20">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-100">Review & Fixes</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60">
            {matches.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {fixableCount > 1 && (
            <button
              onClick={onApplyAll}
              title="Apply top suggestion for all issues"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Wand2 className="w-3 h-3" />
              <span>Fix All ({fixableCount})</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filter === "all"
              ? "bg-slate-800 text-white font-medium shadow-inner"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          All ({matches.length})
        </button>

        <button
          onClick={() => setFilter("spelling")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            filter === "spelling"
              ? "bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30"
              : "text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Spelling ({spellingCount})</span>
        </button>

        <button
          onClick={() => setFilter("grammar")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
            filter === "grammar"
              ? "bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30"
              : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Grammar ({grammarCount})</span>
        </button>

        {styleCount > 0 && (
          <button
            onClick={() => setFilter("style")}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              filter === "style"
                ? "bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30"
                : "text-sky-400/80 hover:text-sky-300 hover:bg-sky-500/10"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Style ({styleCount})</span>
          </button>
        )}
      </div>

      {/* Issue Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredMatches.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <Check className="w-8 h-8 text-emerald-500/60 mb-2" />
            <p className="text-xs font-medium text-slate-400">Everything looks great!</p>
            <p className="text-[11px] text-slate-500 mt-1">No issues detected in this category.</p>
          </div>
        ) : (
          filteredMatches.map((m) => {
            const isSelected = selectedMatchId === m.id;
            const badgeColor =
              m.categoryType === "spelling"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : m.categoryType === "grammar"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-sky-500/10 text-sky-400 border-sky-500/20";

            return (
              <div
                key={m.id}
                onClick={() => onSelectIssue(m)}
                className={`p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? "bg-slate-800/90 border-sky-500/60 shadow-lg ring-1 ring-sky-500/30"
                    : "bg-slate-850/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700/80"
                }`}
              >
                {/* Card Top */}
                <div className="flex items-center justify-between pb-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
                    {m.shortMessage || m.categoryType.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIgnore(m.id);
                    }}
                    title="Ignore this issue"
                    className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Explanation */}
                <p className="text-slate-300 text-xs leading-relaxed my-1.5 font-normal">
                  {m.message}
                </p>

                {/* Context snippet */}
                {m.context?.text && (
                  <div className="my-2 px-2 py-1 rounded bg-slate-950/60 text-[11px] text-slate-400 font-mono truncate border border-slate-800/60">
                    {m.context.text}
                  </div>
                )}

                {/* Suggestion pills */}
                {m.replacements && m.replacements.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex flex-wrap gap-1.5">
                    {m.replacements.slice(0, 4).map((rep, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyReplacement(m, rep.value);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-medium transition-all text-xs active:scale-95"
                      >
                        <span>{rep.value}</span>
                        <Check className="w-3 h-3 text-emerald-400 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
