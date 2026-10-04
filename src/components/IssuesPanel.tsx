import React, { useState } from "react";
import { Check, X, Wand2, AlertCircle } from "lucide-react";
import { Match, IssueCategoryType } from "../types/langtool";

interface IssuesPanelProps {
  matches: Match[];
  selectedMatchId?: string;
  onSelectIssue: (match: Match) => void;
  onApplyReplacement: (match: Match, replacement: string) => void;
  onApplyAll: () => void;
  onIgnore: (matchId: string) => void;
  onClose: () => void;
  isRtl?: boolean;
  apiConnected?: boolean;
  onOpenSettings?: () => void;
  isMiniMode?: boolean;
}

export const IssuesPanel: React.FC<IssuesPanelProps> = ({
  matches,
  selectedMatchId,
  onSelectIssue,
  onApplyReplacement,
  onApplyAll,
  onIgnore,
  onClose,
  isRtl = false,
  apiConnected = true,
  onOpenSettings,
  isMiniMode = false,
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
    <aside
      className={
        isMiniMode
          ? "w-full h-full bg-white dark:bg-slate-900 flex flex-col select-none z-20 transition-colors overflow-hidden"
          : "w-80 md:w-96 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex flex-col h-full select-none shrink-0 z-20 transition-colors animate-sidebar-in"
      }
    >
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Review & Fixes</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700/60 transition-colors">
            {matches.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {fixableCount > 1 && (
            <button
              onClick={onApplyAll}
              title="Apply top suggestion for all issues"
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all duration-150 shadow-sm hover:shadow active:scale-95"
            >
              <Wand2 className="w-3 h-3 transition-transform duration-200 group-hover:rotate-12" />
              <span>Fix All ({fixableCount})</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-md transition-all duration-150 active:scale-95 ${
            filter === "all"
              ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white font-medium shadow-inner"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          All ({matches.length})
        </button>

        <button
          onClick={() => setFilter("spelling")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-150 active:scale-95 ${
            filter === "spelling"
              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 font-medium border border-rose-500/30"
              : "text-rose-600/80 dark:text-rose-400/80 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Spelling ({spellingCount})</span>
        </button>

        <button
          onClick={() => setFilter("grammar")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-150 active:scale-95 ${
            filter === "grammar"
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium border border-amber-500/30"
              : "text-amber-600/80 dark:text-amber-400/80 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Grammar ({grammarCount})</span>
        </button>

        {styleCount > 0 && (
          <button
            onClick={() => setFilter("style")}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-150 active:scale-95 ${
              filter === "style"
                ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 font-medium border border-sky-500/30"
                : "text-sky-600/80 dark:text-sky-400/80 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-500/10"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Style ({styleCount})</span>
          </button>
        )}
      </div>

      {/* Issue Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {!apiConnected ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-5 text-slate-500 dark:text-slate-400 space-y-3 animate-modal-in">
            <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-900/60 shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                LanguageTool Offline
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                Could not connect to the proofreading server. Check your connection or verify endpoint in Settings.
              </p>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="mt-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
              >
                Open Server Settings
              </button>
            )}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500 animate-modal-in">
            <Check className="w-8 h-8 text-emerald-500/70 mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-400">Everything looks great!</p>
            <p className="text-[11px] text-slate-500 mt-1">No issues detected in this category.</p>
          </div>
        ) : (
          filteredMatches.map((m) => {
            const isSelected = selectedMatchId === m.id;
            const badgeColor =
              m.categoryType === "spelling"
                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                : m.categoryType === "grammar"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                : "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";

            return (
              <div
                key={m.id}
                onClick={() => onSelectIssue(m)}
                className={`p-3.5 rounded-xl border transition-all duration-150 text-xs cursor-pointer animate-card-in ${
                  isSelected
                    ? "bg-sky-50/80 dark:bg-slate-800 border-sky-500 shadow-md ring-1 ring-sky-500/40"
                    : "bg-slate-50 hover:bg-slate-100/90 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow hover:-translate-y-0.5"
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
                    className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-150 active:scale-90"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Explanation */}
                <p dir="auto" className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed my-1.5 font-normal">
                  {m.message}
                </p>

                {/* Context snippet */}
                {m.context?.text && (
                  <div
                    dir={isRtl ? "rtl" : "auto"}
                    className={`my-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 text-[11px] text-slate-700 dark:text-slate-300 font-mono truncate border border-slate-200 dark:border-slate-800 ${
                      isRtl ? "text-right" : "text-left"
                    }`}
                  >
                    {m.context.text}
                  </div>
                )}

                {/* Suggestion pills */}
                {m.replacements && m.replacements.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/70 flex flex-wrap gap-1.5">
                    {m.replacements.slice(0, 4).map((rep, idx) => (
                      <button
                        key={idx}
                        dir="auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyReplacement(m, rep.value);
                        }}
                        className="group/rep flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium transition-all duration-150 text-xs active:scale-95 hover:scale-[1.02] shadow-xs"
                      >
                        <span dir="auto">{rep.value}</span>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover/rep:opacity-100 transition-opacity" />
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
