import React, { useEffect, useRef } from "react";
import { Check, X, Sparkles, Ban } from "lucide-react";
import { Match, IssueCategoryType } from "../types/langtool";

interface SuggestionPopoverProps {
  match: Match;
  position: { top: number; left: number };
  onApplyReplacement: (replacement: string) => void;
  onIgnore: (matchId: string) => void;
  onClose: () => void;
}

export const SuggestionPopover: React.FC<SuggestionPopoverProps> = ({
  match,
  position,
  onApplyReplacement,
  onIgnore,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const categoryStyles: Record<
    IssueCategoryType,
    { badgeBg: string; badgeBorder: string; badgeText: string; label: string }
  > = {
    spelling: {
      badgeBg: "bg-rose-500/10",
      badgeBorder: "border-rose-500/30",
      badgeText: "text-rose-600 dark:text-rose-400",
      label: "Spelling Mistake",
    },
    grammar: {
      badgeBg: "bg-amber-500/10",
      badgeBorder: "border-amber-500/30",
      badgeText: "text-amber-600 dark:text-amber-400",
      label: "Grammar Issue",
    },
    style: {
      badgeBg: "bg-sky-500/10",
      badgeBorder: "border-sky-500/30",
      badgeText: "text-sky-600 dark:text-sky-400",
      label: "Style & Clarity",
    },
  };

  const currentStyle = categoryStyles[match.categoryType] || categoryStyles.style;

  return (
    <div
      ref={popoverRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 w-80 max-w-[90vw] -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md p-3.5 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${currentStyle.badgeBg} ${currentStyle.badgeBorder} ${currentStyle.badgeText}`}
          >
            {match.shortMessage || currentStyle.label}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
            {match.rule?.category?.name || match.rule?.id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Explanation */}
      <p className="py-2.5 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
        {match.message}
      </p>

      {/* Suggested Replacements */}
      {match.replacements && match.replacements.length > 0 ? (
        <div className="mt-1">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-500" />
            Suggestions
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto py-0.5">
            {match.replacements.slice(0, 6).map((rep, idx) => (
              <button
                key={idx}
                onClick={() => onApplyReplacement(rep.value)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium transition-all shadow-sm active:scale-95 text-left"
              >
                <span>{rep.value}</span>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-1 text-[11px] text-slate-400 italic">
          No automatic replacement available.
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <button
          onClick={() => onIgnore(match.id)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Ban className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <span>Ignore this rule</span>
        </button>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          pos {match.offset}–{match.offset + match.length}
        </span>
      </div>
    </div>
  );
};
