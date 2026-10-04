export type RephraseTone = "natural" | "professional" | "concise";

export interface RephraseSuggestion {
  tone: RephraseTone;
  label: string;
  text: string;
  note?: string;
}

export interface RephraseSentenceInfo {
  text: string;
  start: number;
  end: number;
}

export interface GroqConfig {
  apiKey: string;
  model: string;
}
