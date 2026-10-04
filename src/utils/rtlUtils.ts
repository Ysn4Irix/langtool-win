/**
 * Utility functions for detecting and handling Right-to-Left (RTL) writing directions.
 */

// ISO 639 language codes known to use Right-to-Left scripts
export const RTL_LANGUAGE_CODES = new Set([
  "ar", // Arabic
  "he", // Hebrew
  "iw", // Hebrew (legacy ISO code)
  "fa", // Persian / Farsi
  "ur", // Urdu
  "yi", // Yiddish
  "ji", // Yiddish (legacy)
  "ps", // Pashto
  "sd", // Sindhi
  "ug", // Uyghur
  "ckb", // Central Kurdish (Sorani)
  "ku", // Kurdish
  "arc", // Aramaic
  "syc", // Syriac
  "dv", // Divehi / Maldivian
]);

// Unicode ranges for RTL characters (Hebrew, Arabic, Syriac, Thaana, etc.)
const RTL_CHAR_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

/**
 * Check if a language code (e.g. "ar", "ar-SA", "he", "fa-IR") is an RTL language.
 */
export function isRtlLanguage(langCode?: string | null): boolean {
  if (!langCode || langCode === "auto") return false;
  const normalized = langCode.toLowerCase().trim();
  const baseCode = normalized.split(/[-_]/)[0];
  return RTL_LANGUAGE_CODES.has(normalized) || RTL_LANGUAGE_CODES.has(baseCode);
}

/**
 * Check if the provided text string contains RTL characters.
 */
export function hasRtlCharacters(text: string): boolean {
  if (!text) return false;
  return RTL_CHAR_REGEX.test(text);
}

/**
 * Computes whether RTL writing direction should be active based on:
 * 1. Selected language code from the dropdown (e.g., "ar", "he", "fa")
 * 2. Detected language code from LanguageTool
 * 3. Text content heuristic (if in "auto" mode)
 */
export function computeIsRtl(
  selectedLanguage: string,
  detectedLanguageCode?: string | null,
  text?: string
): boolean {
  // If explicitly selected language is RTL, always use RTL
  if (isRtlLanguage(selectedLanguage)) {
    return true;
  }

  // If in auto mode and LanguageTool detected an RTL language
  if (selectedLanguage === "auto" && isRtlLanguage(detectedLanguageCode)) {
    return true;
  }

  // If in auto mode and text has RTL characters
  if (selectedLanguage === "auto" && text && text.trim().length > 0) {
    const sample = text.trim().slice(0, 300);
    return hasRtlCharacters(sample);
  }

  return false;
}
