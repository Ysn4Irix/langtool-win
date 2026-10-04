import React, { useRef, useEffect, useState, useMemo, useImperativeHandle } from "react";
import { Match } from "../types/langtool";
import { RephraseSentenceInfo } from "../types/rephrase";
import { SuggestionPopover } from "./SuggestionPopover";
import { RephraseModal } from "./RephraseModal";
import { getCurrentSentence, replaceSentenceInText } from "../utils/sentenceUtils";

export interface EditorHandle {
  triggerRephrase: () => void;
}

interface EditorProps {
  text: string;
  onChangeText: (text: string) => void;
  matches: Match[];
  selectedMatch: Match | null;
  onSelectMatch: (match: Match | null) => void;
  onApplyReplacement: (match: Match, replacement: string) => void;
  onIgnoreMatch: (matchId: string) => void;
  isChecking: boolean;
  onOpenSettings: () => void;
  languageName?: string;
  isRtl?: boolean;
}

export const Editor = React.forwardRef<EditorHandle, EditorProps>(
  (
    {
      text,
      onChangeText,
      matches,
      selectedMatch,
      onSelectMatch,
      onApplyReplacement,
      onIgnoreMatch,
      onOpenSettings,
      languageName,
      isRtl = false,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const [caretPosition, setCaretPosition] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);

    // Rephrase Modal State
    const [isRephraseModalOpen, setIsRephraseModalOpen] = useState<boolean>(false);
    const [activeSentenceInfo, setActiveSentenceInfo] = useState<RephraseSentenceInfo | null>(null);

    // Sync scrolling between textarea and backdrop
    const handleScroll = () => {
      if (textareaRef.current && backdropRef.current) {
        backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    };

    // Update caret & selection positions
    const updateCaret = () => {
      if (textareaRef.current) {
        setCaretPosition(textareaRef.current.selectionStart);
        setSelectionEnd(textareaRef.current.selectionEnd);
      }
    };

    // Detect current sentence under cursor or selection
    const currentSentence = useMemo(() => {
      return getCurrentSentence(text, caretPosition, selectionEnd);
    }, [text, caretPosition, selectionEnd]);

    // Expose triggerRephrase imperative handle to parent (Header / shortcuts)
    useImperativeHandle(ref, () => ({
      triggerRephrase: () => {
        if (!text.trim()) return;
        const target = currentSentence || getCurrentSentence(text, 0);
        if (target) {
          setActiveSentenceInfo(target);
          setIsRephraseModalOpen(true);
        }
      },
    }));

    // Check if caret clicked into an existing match
    const handleTextareaClick = () => {
      updateCaret();
      if (!textareaRef.current) return;

      const clickOffset = textareaRef.current.selectionStart;
      const clickedMatch = matches.find(
        (m) => clickOffset >= m.offset && clickOffset <= m.offset + m.length
      );

      if (clickedMatch) {
        onSelectMatch(clickedMatch);
      } else {
        onSelectMatch(null);
      }
    };

    // Position the popover based on selectedMatch's DOM span
    useEffect(() => {
      if (!selectedMatch) {
        setPopoverPosition(null);
        return;
      }

      const timer = setTimeout(() => {
        const spanEl = document.getElementById(`match-span-${selectedMatch.id}`);
        if (spanEl) {
          const rect = spanEl.getBoundingClientRect();
          const screenHeight = window.innerHeight;

          // Position below if space permits, otherwise above
          const top = rect.bottom + 10 + 200 > screenHeight ? rect.top - 210 : rect.bottom + 8;
          const left = Math.max(160, Math.min(window.innerWidth - 170, rect.left + rect.width / 2));

          setPopoverPosition({ top, left });
        }
      }, 20);

      return () => clearTimeout(timer);
    }, [selectedMatch, text]);

    // Global hotkey: Ctrl+Shift+R triggers rephrase for active sentence
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && (e.key === "r" || e.key === "R")) {
          e.preventDefault();
          if (!text.trim()) return;
          const target = currentSentence || getCurrentSentence(text, 0);
          if (target) {
            setActiveSentenceInfo(target);
            setIsRephraseModalOpen(true);
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentSentence, text]);

    // Edge Case 1: When user is actively typing inside an existing match,
    // temporarily suppress its wavy underline so it doesn't drift or look jarring.
    const activeMatches = useMemo(() => {
      if (caretPosition === null) return matches;
      return matches.filter(
        (m) => caretPosition < m.offset || caretPosition > m.offset + m.length
      );
    }, [matches, caretPosition]);

    // Build the backdrop layer with colored squiggles
    const renderedBackdrop = useMemo(() => {
      const sortedMatches = [...activeMatches].sort((a, b) => a.offset - b.offset);

      let lastIndex = 0;
      const elements: React.ReactNode[] = [];

      sortedMatches.forEach((m) => {
        if (m.offset < lastIndex) return;

        if (m.offset > lastIndex) {
          elements.push(
            <span key={`text-${lastIndex}`}>{text.substring(lastIndex, m.offset)}</span>
          );
        }

        const matchText = text.substring(m.offset, m.offset + m.length);
        const isSelected = selectedMatch?.id === m.id;
        const squiggleClass =
          m.categoryType === "spelling"
            ? "squiggle-spelling"
            : m.categoryType === "grammar"
            ? "squiggle-grammar"
            : "squiggle-style";

        elements.push(
          <span
            key={m.id}
            id={`match-span-${m.id}`}
            className={`${squiggleClass} ${isSelected ? "squiggle-selected" : ""}`}
          >
            {matchText}
          </span>
        );

        lastIndex = m.offset + m.length;
      });

      if (lastIndex < text.length) {
        elements.push(
          <span key={`text-end-${lastIndex}`}>{text.substring(lastIndex)}</span>
        );
      }

      return elements;
    }, [text, activeMatches, selectedMatch]);

    const handleApplyRephrase = (newSentence: string) => {
      if (!activeSentenceInfo) return;
      const updated = replaceSentenceInText(text, activeSentenceInfo, newSentence);
      onChangeText(updated);
      setActiveSentenceInfo(null);
    };

    const handleRephraseFromPopover = (sentenceText: string) => {
      const info = getCurrentSentence(text, selectedMatch?.offset ?? 0);
      if (info) {
        setActiveSentenceInfo(info);
      } else {
        const idx = text.indexOf(sentenceText);
        if (idx !== -1) {
          setActiveSentenceInfo({
            text: sentenceText,
            start: idx,
            end: idx + sentenceText.length,
          });
        }
      }
      setIsRephraseModalOpen(true);
    };

    return (
      <div className="relative flex-1 h-full w-full bg-white dark:bg-slate-900 overflow-hidden flex flex-col transition-colors">
        {/* Editor Container - Unobstructed text area without floating badge masking lines */}
        <div className="relative flex-1 h-full w-full overflow-hidden">
          {/* Underlying Highlight Layer */}
          <div
            ref={backdropRef}
            dir={isRtl ? "rtl" : "ltr"}
            aria-hidden="true"
            className={`absolute inset-0 p-6 md:p-8 font-sans text-base leading-relaxed tracking-normal whitespace-pre-wrap break-words overflow-y-auto pointer-events-none select-none text-transparent z-0 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            {renderedBackdrop}
            {text.endsWith("\n") && <br />}
          </div>

          {/* Top Textarea Layer */}
          <textarea
            ref={textareaRef}
            dir={isRtl ? "rtl" : "ltr"}
            value={text}
            onChange={(e) => {
              onChangeText(e.target.value);
              updateCaret();
            }}
            onScroll={handleScroll}
            onClick={handleTextareaClick}
            onKeyUp={updateCaret}
            onSelect={updateCaret}
            placeholder={
              isRtl
                ? "اكتب أو الصق النص هنا للتحقق من الأخطاء الإملائية والنحوية والأسلوب..."
                : "Paste or write your text here to check spelling, grammar, and style with LanguageTool..."
            }
            spellCheck={false}
            autoFocus
            className={`absolute inset-0 w-full h-full p-6 md:p-8 font-sans text-base leading-relaxed tracking-normal whitespace-pre-wrap break-words overflow-y-auto bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 resize-none outline-none caret-sky-600 dark:caret-sky-400 z-10 selection:bg-sky-500/20 dark:selection:bg-sky-500/30 selection:text-slate-900 dark:selection:text-white ${
              isRtl ? "text-right" : "text-left"
            }`}
          />
        </div>

        {/* Floating Error Suggestion Popover */}
        {selectedMatch && popoverPosition && (
          <SuggestionPopover
            match={selectedMatch}
            position={popoverPosition}
            isRtl={isRtl}
            onApplyReplacement={(rep) => {
              onApplyReplacement(selectedMatch, rep);
              onSelectMatch(null);
            }}
            onIgnore={(id) => {
              onIgnoreMatch(id);
              onSelectMatch(null);
            }}
            onClose={() => onSelectMatch(null)}
            onRephraseSentence={handleRephraseFromPopover}
          />
        )}

        {/* AI Sentence Rephrase Modal */}
        <RephraseModal
          isOpen={isRephraseModalOpen}
          onClose={() => setIsRephraseModalOpen(false)}
          sentenceInfo={activeSentenceInfo}
          languageName={languageName}
          isRtl={isRtl}
          onApply={handleApplyRephrase}
          onOpenSettings={onOpenSettings}
        />
      </div>
    );
  }
);
