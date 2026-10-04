import { Match } from "../types/langtool";

export function applyReplacement(
  text: string,
  match: Match,
  replacementValue: string
): string {
  if (match.offset < 0 || match.offset + match.length > text.length) {
    return text;
  }
  return (
    text.slice(0, match.offset) +
    replacementValue +
    text.slice(match.offset + match.length)
  );
}

export function applyAllReplacements(text: string, matches: Match[]): string {
  // Filter matches that have at least one replacement
  const validMatches = matches.filter((m) => m.replacements && m.replacements.length > 0);

  // Sort descending by offset so that replacing earlier offsets doesn't invalidate later ones
  const sorted = [...validMatches].sort((a, b) => b.offset - a.offset);

  let updatedText = text;
  for (const m of sorted) {
    if (m.offset >= 0 && m.offset + m.length <= updatedText.length) {
      const topReplacement = m.replacements[0].value;
      updatedText =
        updatedText.slice(0, m.offset) +
        topReplacement +
        updatedText.slice(m.offset + m.length);
    }
  }

  return updatedText;
}

export function getStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;
  const sentences = trimmed
    ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
    : 0;
  const readingTimeSec = Math.ceil((words / 200) * 60);

  return { words, chars, sentences, readingTimeSec };
}

export function getWordRangeAtOffset(text: string, offset: number) {
  if (offset < 0 || offset >= text.length) return null;

  let start = offset;
  let end = offset;

  // find start of word
  while (start > 0 && /\w/.test(text[start - 1])) {
    start--;
  }
  // find end of word
  while (end < text.length && /\w/.test(text[end])) {
    end++;
  }

  return { start, end };
}
