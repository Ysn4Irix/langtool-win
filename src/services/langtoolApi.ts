import { CheckResponse, Language, Match, IssueCategoryType } from "../types/langtool";

const BASE_URL = "https://langtool.ysnirix.xyz/v2";

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

export async function getLanguages(): Promise<Language[]> {
  if (cachedLanguages && cachedLanguages.length > 0) {
    return cachedLanguages;
  }

  try {
    const res = await fetch(`${BASE_URL}/languages`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const data: Language[] = await res.json();
    cachedLanguages = data;
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
  signal?: AbortSignal
): Promise<CheckResponse> {
  if (!text.trim()) {
    return {
      software: { name: "LanguageTool", version: "", apiVersion: 2 },
      language: { name: "Auto", code: "auto" },
      matches: [],
    };
  }

  const params = new URLSearchParams();
  params.append("text", text);
  params.append("language", language);

  const response = await fetch(`${BASE_URL}/check`, {
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
