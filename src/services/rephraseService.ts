import { GroqConfig, RephraseSuggestion } from "../types/rephrase";

const STORAGE_KEY = "langtool_groq_config";
export const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

export const AVAILABLE_GROQ_MODELS = [
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Recommended — Fast & Free)" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (High Quality — Versatile)" },
  { id: "llama3-70b-8192", name: "Llama 3 70B (8k context)" },
  { id: "llama3-8b-8192", name: "Llama 3 8B (8k context)" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (32k context)" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B (Google)" },
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
 * Fetch available text/chat models dynamically for the given Groq API key.
 */
export async function fetchGroqModels(apiKey: string): Promise<string[]> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${cleanKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json.data)) return [];

    // Filter out audio (whisper) and guard/embedding models
    const excluded = ["whisper", "guard", "embed", "distil-whisper"];
    const models: string[] = json.data
      .map((m: any) => m.id as string)
      .filter((id: string) => {
        if (!id) return false;
        const lower = id.toLowerCase();
        return !excluded.some((p) => lower.includes(p));
      });

    const priority = [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "llama3-70b-8192",
      "llama3-8b-8192",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ];

    models.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return models;
  } catch {
    return [];
  }
}

/**
 * Test Groq Cloud API connection with a rapid ping test.
 * If the selected model returns 404, queries available models and suggests a working fallback.
 */
export async function testGroqConnection(
  apiKey: string,
  model: string = DEFAULT_GROQ_MODEL
): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
  suggestedModel?: string;
  availableModels?: string[];
}> {
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
        return { success: false, message: "Invalid Groq API key. Please check your key at console.groq.com." };
      }
      if (res.status === 429) {
        return { success: false, message: "Rate limit reached on Groq Cloud." };
      }
      if (res.status === 404) {
        const liveModels = await fetchGroqModels(cleanKey);
        const fallback =
          liveModels.find((m) => m === "llama-3.1-8b-instant") ||
          liveModels[0] ||
          "llama-3.1-8b-instant";

        return {
          success: false,
          message: `Model '${model}' does not exist or is not enabled for your account.`,
          suggestedModel: fallback !== model ? fallback : undefined,
          availableModels: liveModels.length > 0 ? liveModels : undefined,
        };
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

  const sendRequest = async (modelToUse: string) => {
    return await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: promptSystem },
          { role: "user", content: `Original sentence:\n"${sentence}"` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 512,
      }),
    });
  };

  let activeModel = config.model || DEFAULT_GROQ_MODEL;
  let res = await sendRequest(activeModel);

  // Auto-recovery: if 404 model not accessible and not already using default, fall back to DEFAULT_GROQ_MODEL
  if (res.status === 404 && activeModel !== DEFAULT_GROQ_MODEL) {
    activeModel = DEFAULT_GROQ_MODEL;
    res = await sendRequest(activeModel);
    if (res.ok) {
      setGroqConfig({ model: DEFAULT_GROQ_MODEL });
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Invalid Groq API key. Please update your key in Settings.");
    }
    if (res.status === 429) {
      throw new Error("Groq Cloud rate limit exceeded. Please wait a few seconds and try again.");
    }
    if (res.status === 404) {
      throw new Error(`Model '${activeModel}' is not accessible on your account. Please choose a supported model in Settings.`);
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
