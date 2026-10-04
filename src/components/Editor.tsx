import React, { useRef, useEffect, useState, useMemo } from "react";
import { Match } from "../types/langtool";
import { SuggestionPopover } from "./SuggestionPopover";

interface EditorProps {
  text: string;
  onChangeText: (text: string) => void;
  matches: Match[];
  selectedMatch: Match | null;
  onSelectMatch: (match: Match | null) => void;
  onApplyReplacement: (match: Match, replacement: string) => void;
  onIgnoreMatch: (matchId: string) => void;
  isChecking: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  text,
  onChangeText,
  matches,
  selectedMatch,
  onSelectMatch,
  onApplyReplacement,
  onIgnoreMatch,
  isChecking,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [caretPosition, setCaretPosition] = useState<number | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);

  // Sync scrolling between textarea and backdrop
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Update caret position on selection change / clicks / keystrokes
  const updateCaret = () => {
    if (textareaRef.current) {
      setCaretPosition(textareaRef.current.selectionStart);
    }
  };

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

  // Edge Case 1: When user is actively typing inside an existing match,
  // hide its underline to avoid misaligned jitter while typing.
  const activeMatches = useMemo(() => {
    return matches.filter((m) => {
      if (caretPosition !== null && isChecking) {
        // If actively typing within this word, omit until check completes
        if (caretPosition >= m.offset && caretPosition <= m.offset + m.length) {
          return false;
        }
      }
      return true;
    });
  }, [matches, caretPosition, isChecking]);

  // Render backdrop text with highlighted/underlined spans
  const renderedBackdrop = useMemo(() => {
    if (!text) return null;

    // Filter out out-of-bound matches and sort by offset ascending
    const validMatches = activeMatches
      .filter((m) => m.offset >= 0 && m.offset + m.length <= text.length)
      .sort((a, b) => a.offset - b.offset);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    validMatches.forEach((m) => {
      // Overlap prevention
      if (m.offset < lastIndex) return;

      // Plain text before match
      if (m.offset > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>{text.substring(lastIndex, m.offset)}</span>
        );
      }

      // Match text with wavy underline
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

    // Remainder of text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-end-${lastIndex}`}>{text.substring(lastIndex)}</span>
      );
    }

    return elements;
  }, [text, activeMatches, selectedMatch]);

  return (
    <div className="relative flex-1 h-full w-full bg-slate-900 overflow-hidden flex flex-col">
      {/* Editor Container */}
      <div className="relative flex-1 h-full w-full overflow-hidden">
        {/* Underlying Highlight Layer */}
        <div
          ref={backdropRef}
          aria-hidden="true"
          className="absolute inset-0 p-6 md:p-8 font-sans text-base leading-relaxed tracking-normal whitespace-pre-wrap break-words overflow-y-auto pointer-events-none select-none text-transparent z-0"
        >
          {renderedBackdrop}
          {/* Add trailing line break so scroll heights match perfectly */}
          {text.endsWith("\n") && <br />}
        </div>

        {/* Top Textarea Layer */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            onChangeText(e.target.value);
            updateCaret();
          }}
          onScroll={handleScroll}
          onClick={handleTextareaClick}
          onKeyUp={updateCaret}
          onKeyDown={(e) => {
            // Hotkey: Ctrl+Enter to trigger manual check
            if (e.ctrlKey && e.key === "Enter") {
              e.preventDefault();
              // Bubbles up to parent
            }
          }}
          placeholder="Paste or write your text here to check spelling, grammar, and style with LanguageTool..."
          spellCheck={false}
          autoFocus
          className="absolute inset-0 w-full h-full p-6 md:p-8 font-sans text-base leading-relaxed tracking-normal whitespace-pre-wrap break-words overflow-y-auto bg-transparent text-slate-100 placeholder-slate-600 resize-none outline-none caret-sky-400 z-10 selection:bg-sky-500/30 selection:text-white"
        />
      </div>

      {/* Floating Suggestion Popover */}
      {selectedMatch && popoverPosition && (
        <SuggestionPopover
          match={selectedMatch}
          position={popoverPosition}
          onApplyReplacement={(rep) => {
            onApplyReplacement(selectedMatch, rep);
            onSelectMatch(null);
          }}
          onIgnore={(id) => {
            onIgnoreMatch(id);
            onSelectMatch(null);
          }}
          onClose={() => onSelectMatch(null)}
        />
      )}
    </div>
  );
};
