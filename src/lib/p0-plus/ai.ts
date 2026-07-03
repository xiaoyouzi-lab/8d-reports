import { P0_PLUS_AI_CONTRACT_PROMPT } from "@/lib/p0-plus/prompts";
import { validateP0PlusPreviewResponse, type P0PlusPreviewResponse } from "@/lib/p0-plus/schema";

const PREVIEW_AI_URL = "https://api.deepseek.com/v1/chat/completions";
const PREVIEW_AI_MODEL = "deepseek-chat";

export interface P0PlusPreviewAiInput {
  rawInput: string;
  outputLanguage: string;
}

export interface P0PlusPreviewAiClient {
  generatePreview(input: P0PlusPreviewAiInput): Promise<P0PlusPreviewResponse>;
}

export class P0PlusPreviewAiError extends Error {
  constructor(message = "P0+ preview AI failed") {
    super(message);
    this.name = "P0PlusPreviewAiError";
  }
}

function buildPreviewUserPrompt(input: P0PlusPreviewAiInput) {
  return [
    `Output language: ${input.outputLanguage}`,
    "",
    "Use only the submitted text below. Do not use private reports, team data, historical reports, knowledge context, authenticated report data, attachments, or account data.",
    "",
    "Submitted text:",
    input.rawInput,
  ].join("\n");
}

export class DeepSeekP0PlusPreviewAiClient implements P0PlusPreviewAiClient {
  async generatePreview(input: P0PlusPreviewAiInput): Promise<P0PlusPreviewResponse> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new P0PlusPreviewAiError("P0+ preview AI is not configured");
    }

    let response: Response;
    try {
      response = await fetch(PREVIEW_AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          model: PREVIEW_AI_MODEL,
          messages: [
            { role: "system", content: P0_PLUS_AI_CONTRACT_PROMPT },
            { role: "user", content: buildPreviewUserPrompt(input) },
          ],
          max_tokens: 4_000,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
    } catch (error) {
      console.error("P0+ preview AI request failed", { error });
      throw new P0PlusPreviewAiError();
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("P0+ preview AI returned an error", { status: response.status, detail: detail.slice(0, 300) });
      throw new P0PlusPreviewAiError();
    }

    const data = await response.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new P0PlusPreviewAiError("P0+ preview AI returned no JSON content");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error("P0+ preview AI returned invalid JSON", { error });
      throw new P0PlusPreviewAiError("P0+ preview AI returned invalid JSON");
    }

    const validation = validateP0PlusPreviewResponse(parsed);
    if (!validation.success || !validation.data) {
      console.error("P0+ preview AI failed schema validation", { issues: validation.issues.slice(0, 12) });
      throw new P0PlusPreviewAiError("P0+ preview AI failed schema validation");
    }

    return validation.data;
  }
}

export const p0PlusPreviewAiClient = new DeepSeekP0PlusPreviewAiClient();
