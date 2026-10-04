import { CheckResponse, Language, Match, IssueCategoryType } from "../types/langtool";

export const DEFAULT_API_URL = "https://langtool.ysnirix.xyz/v2";
const STORAGE_KEY = "langtool_api_url";

export function normalizeApiUrl(url: string): string {
  let cleaned = url.trim().replace(/\/+$/, "");
  if (!cleaned) return DEFAULT_API_URL;
  // If user didn't include /v2, check or append if needed, but allow whatever they entered
  return cleaned;
}

export function getStoredApiUrl(): string {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? normalizeApiUrl(saved) : DEFAULT_API_URL;
}

export function setStoredApiUrl(url: string): void {
  const normalized = normalizeApiUrl(url);
  localStorage.setItem(STORAGE_KEY, normalized);
  cachedLanguages = null; // Clear cached languages so they reload from new endpoint
}

export function resetStoredApiUrl(): string {
  localStorage.removeItem(STORAGE_KEY);
  cachedLanguages = null;
  return DEFAULT_API_URL;
}

export async function testApiConnection(
  testUrl: string
): Promise<{ success: boolean; message: string; count?: number }> {
  const normalized = normalizeApiUrl(testUrl);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${normalized}/languages`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        message: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return {
        success: true,
        message: `Successfully connected (${data.length} languages supported)`,
        count: data.length,
      };
    }

    return {
      success: false,
      message: "Server responded, but response format was unexpected",
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { success: false, message: "Connection timed out (after 6s)" };
    }
    return {
      success: false,
      message: err.message || "Failed to connect to the server",
    };
  }
}

export function categorizeMatch(match: {
  rule?: { issueType?: string; category?: { id?: string } };
  type?: { typeName?: string };
}): IssueCategoryType {
  const issueType = match.rule?.issueType?.toLowerCase() || "";
  const catId = match.rule?.category?.id?.toUpperCase() || "";
  const typeName = match.type?.typeName?.toLowerCase() || "";

  if (
    issueType === "misspelling" ||
    catId === "TYPOS" ||
    typeName === "unknownword" ||
    issueType.includes("spell")
  ) {
    return "spelling";
  }

  if (
    issueType === "grammar" ||
    catId === "GRAMMAR" ||
    catId === "PUNCTUATION" ||
    issueType.includes("grammar")
  ) {
    return "grammar";
  }

  return "style";
}

let cachedLanguages: Language[] | null = null;

export async function getLanguages(baseUrl?: string): Promise<Language[]> {
  const url = baseUrl ? normalizeApiUrl(baseUrl) : getStoredApiUrl();
  if (cachedLanguages && cachedLanguages.length > 0 && !baseUrl) {
    return cachedLanguages;
  }

  try {
    const res = await fetch(`${url}/languages`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const data: Language[] = await res.json();
    if (!baseUrl) {
      cachedLanguages = data;
    }
    return data;
  } catch (err) {
    console.error("Failed to fetch languages:", err);
    // Fallback common languages in case of offline/network glitch
    return [
      { name: "English (US)", code: "en-US", longCode: "en-US" },
      { name: "English (GB)", code: "en-GB", longCode: "en-GB" },
      { name: "French", code: "fr", longCode: "fr" },
      { name: "German", code: "de", longCode: "de" },
      { name: "Spanish", code: "es", longCode: "es" },
      { name: "Arabic", code: "ar", longCode: "ar" },
    ];
  }
}

export async function checkText(
  text: string,
  language: string = "auto",
  signal?: AbortSignal,
  baseUrl?: string
): Promise<CheckResponse> {
  if (!text.trim()) {
    return {
      software: { name: "LanguageTool", version: "", apiVersion: 2 },
      language: { name: "Auto", code: "auto" },
      matches: [],
    };
  }

  const url = baseUrl ? normalizeApiUrl(baseUrl) : getStoredApiUrl();
  const params = new URLSearchParams();
  params.append("text", text);
  params.append("language", language);

  const response = await fetch(`${url}/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  const formattedMatches: Match[] = (data.matches || []).map(
    (m: any, index: number) => ({
      ...m,
      id: `match-${index}-${m.offset}-${m.length}`,
      categoryType: categorizeMatch(m),
    })
  );

  return {
    ...data,
    matches: formattedMatches,
  };
}
