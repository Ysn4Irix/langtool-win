import { RephraseSentenceInfo } from "../types/rephrase";

/**
 * Detect the current sentence under the user's cursor or currently selected text.
 */
export function getCurrentSentence(
  fullText: string,
  cursorOffset: number | null,
  selectionEnd?: number | null
): RephraseSentenceInfo | null {
  if (!fullText || fullText.trim().length === 0) {
    return null;
  }

  // Case 1: User has actively selected a text range
  if (
    cursorOffset !== null &&
    selectionEnd !== null &&
    selectionEnd !== undefined &&
    selectionEnd > cursorOffset
  ) {
    const raw = fullText.slice(cursorOffset, selectionEnd);
    const trimmed = raw.trim();
    if (trimmed.length >= 3) {
      const leadingSpaces = raw.length - raw.trimStart().length;
      const trailingSpaces = raw.length - raw.trimEnd().length;
      return {
        text: trimmed,
        start: cursorOffset + leadingSpaces,
        end: selectionEnd - trailingSpaces,
      };
    }
  }

  // Case 2: Cursor is positioned inside the text
  const pos = cursorOffset !== null ? Math.min(Math.max(cursorOffset, 0), fullText.length) : 0;

  // Search backwards for the sentence start
  let start = 0;
  for (let i = Math.min(pos, fullText.length - 1); i >= 0; i--) {
    const ch = fullText[i];
    if (ch === "\n") {
      start = i + 1;
      break;
    }
    if ((ch === "." || ch === "!" || ch === "?") && i < pos) {
      // If punctuation followed by space or newline, next character is start of sentence
      if (i + 1 < fullText.length && /\s/.test(fullText[i + 1])) {
        start = i + 1;
        break;
      }
    }
  }

  // Search forwards for sentence end
  let end = fullText.length;
  for (let i = pos; i < fullText.length; i++) {
    const ch = fullText[i];
    if (ch === "\n") {
      end = i;
      break;
    }
    if (ch === "." || ch === "!" || ch === "?") {
      // Include the punctuation in the sentence
      end = i + 1;
      break;
    }
  }

  const rawSlice = fullText.slice(start, end);
  const trimmed = rawSlice.trim();

  if (trimmed.length < 4) {
    return null;
  }

  const leading = rawSlice.length - rawSlice.trimStart().length;
  const trailing = rawSlice.length - rawSlice.trimEnd().length;

  return {
    text: trimmed,
    start: start + leading,
    end: end - trailing,
  };
}

/**
 * Replace the sentence safely in full text.
 */
export function replaceSentenceInText(
  fullText: string,
  sentenceInfo: RephraseSentenceInfo,
  newSentence: string
): string {
  const before = fullText.slice(0, sentenceInfo.start);
  const after = fullText.slice(sentenceInfo.end);
  return `${before}${newSentence}${after}`;
}
