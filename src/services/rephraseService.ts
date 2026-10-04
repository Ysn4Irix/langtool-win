import { GroqConfig, RephraseSuggestion } from "../types/rephrase";

const STORAGE_KEY = "langtool_groq_config";
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export const AVAILABLE_GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Recommended — Best Quality)" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Instant — Fastest)" },
];

export function getGroqConfig(): GroqConfig {
  if (typeof window === "undefined") {
    return { apiKey: "", model: DEFAULT_GROQ_MODEL };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        apiKey: parsed.apiKey || "",
        model: parsed.model || DEFAULT_GROQ_MODEL,
      };
    }
  } catch {}
  return { apiKey: "", model: DEFAULT_GROQ_MODEL };
}

export function setGroqConfig(config: Partial<GroqConfig>): void {
  const current = getGroqConfig();
  const updated: GroqConfig = {
    apiKey: config.apiKey !== undefined ? config.apiKey.trim() : current.apiKey,
    model: config.model || current.model || DEFAULT_GROQ_MODEL,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function isGroqConfigured(): boolean {
  const config = getGroqConfig();
  return Boolean(config.apiKey && config.apiKey.trim().length > 0);
}

/**
 * Test Groq Cloud API connection with a rapid ping test.
 */
export async function testGroqConnection(
  apiKey: string,
  model: string = DEFAULT_GROQ_MODEL
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: "Please provide a Groq API key." };
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cleanKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word 'OK'." }],
        max_tokens: 5,
        temperature: 0,
      }),
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, message: "Invalid Groq API key. Please check your key." };
      }
      if (res.status === 429) {
        return { success: false, message: "Rate limit reached on Groq Cloud." };
      }
      const errBody = await res.text();
      return { success: false, message: `HTTP ${res.status}: ${errBody.slice(0, 100)}` };
    }

    return {
      success: true,
      message: `Connected successfully (${latencyMs}ms)`,
      latencyMs,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { success: false, message: "Connection timed out after 8s." };
    }
    return { success: false, message: err.message || "Failed to reach Groq Cloud." };
  }
}

/**
 * Rephrase a sentence using Groq Cloud into 3 natural variations:
 * 1) Natural & Fluent
 * 2) Professional / Formal
 * 3) Concise
 */
export async function rephraseSentence(
  sentence: string,
  configOverride?: Partial<GroqConfig>
): Promise<RephraseSuggestion[]> {
  const config = { ...getGroqConfig(), ...configOverride };
  if (!config.apiKey) {
    throw new Error("GROQ_API_KEY_REQUIRED");
  }

  const promptSystem = `You are a world-class stylistic writing editor. For the provided sentence, generate exactly 3 natural rephrased versions:
1. "natural": Fluent, conversational, native English cadence, sounds effortless and human.
2. "professional": Articulate, refined, formal business/academic tone.
3. "concise": Direct, tight, eliminates unnecessary fluff or filler while preserving full meaning.

Output strictly valid JSON with this exact schema:
{
  "suggestions": [
    {
      "tone": "natural",
      "label": "Natural & Fluent",
      "text": "Rewritten sentence here",
      "note": "Brief 3-6 word summary of enhancement"
    },
    {
      "tone": "professional",
      "label": "Professional",
      "text": "Rewritten sentence here",
      "note": "Brief 3-6 word summary of enhancement"
    },
    {
      "tone": "concise",
      "label": "Concise",
      "text": "Rewritten sentence here",
      "note": "Brief 3-6 word summary of enhancement"
    }
  ]
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_GROQ_MODEL,
      messages: [
        { role: "system", content: promptSystem },
        { role: "user", content: `Original sentence:\n"${sentence}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Invalid Groq API key. Please update your key in Settings.");
    }
    if (res.status === 429) {
      throw new Error("Groq Cloud rate limit exceeded. Please wait a few seconds and try again.");
    }
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText.slice(0, 150)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("No response received from Groq model.");
  }

  const parsed = JSON.parse(rawContent);
  if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
    throw new Error("Invalid response structure from Groq model.");
  }

  return parsed.suggestions.map((s: any) => ({
    tone: (s.tone || "natural") as "natural" | "professional" | "concise",
    label: s.label || (s.tone === "professional" ? "Professional" : s.tone === "concise" ? "Concise" : "Natural & Fluent"),
    text: s.text || "",
    note: s.note || "",
  }));
}
