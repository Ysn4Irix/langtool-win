export interface Language {
  name: string;
  code: string;
  longCode: string;
}

export interface Replacement {
  value: string;
}

export interface RuleCategory {
  id: string;
  name: string;
}

export interface Rule {
  id: string;
  subId?: string;
  description: string;
  issueType?: string;
  category: RuleCategory;
}

export interface MatchContext {
  text: string;
  offset: number;
  length: number;
}

export type IssueCategoryType = "spelling" | "grammar" | "style";

export interface Match {
  id: string;
  message: string;
  shortMessage?: string;
  replacements: Replacement[];
  offset: number;
  length: number;
  context: MatchContext;
  sentence: string;
  rule: Rule;
  type?: { typeName: string };
  categoryType: IssueCategoryType;
}

export interface DetectedLanguage {
  name: string;
  code: string;
  confidence: number;
}

export interface CheckResponse {
  software: {
    name: string;
    version: string;
    apiVersion: number;
  };
  language: {
    name: string;
    code: string;
    detectedLanguage?: DetectedLanguage;
  };
  matches: Match[];
}
