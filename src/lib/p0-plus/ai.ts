import {
  buildP0PlusSchemaRepairPrompt,
  P0_PLUS_AI_CONTRACT_PROMPT,
} from "@/lib/p0-plus/prompts";
import { validateP0PlusPreviewResponse, type P0PlusPreviewResponse } from "@/lib/p0-plus/schema";

const PREVIEW_AI_URL = "https://api.deepseek.com/v1/chat/completions";
const DEFAULT_PREVIEW_AI_MODEL = "deepseek-v4-flash";
export const P0_PLUS_PREVIEW_MAX_TOKENS = 10_000;

type PreviewAiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type P0PlusPreviewAiFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

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

export class P0PlusPreviewAiSchemaError extends P0PlusPreviewAiError {
  constructor(readonly issues: string[]) {
    super("P0+ preview AI failed schema validation");
    this.name = "P0PlusPreviewAiSchemaError";
  }
}

function getPreviewAiModel() {
  return process.env.DEEPSEEK_PREVIEW_MODEL || DEFAULT_PREVIEW_AI_MODEL;
}

function buildPreviewUserPrompt(input: P0PlusPreviewAiInput) {
  return [
    `Output language: ${input.outputLanguage}`,
    `Set generatedAt to this request timestamp: ${new Date().toISOString()}`,
    "",
    "Use only the submitted text below. Do not use private reports, team data, historical reports, knowledge context, authenticated report data, attachments, or account data.",
    "",
    "Submitted text:",
    input.rawInput,
  ].join("\n");
}

export class DeepSeekP0PlusPreviewAiClient implements P0PlusPreviewAiClient {
  constructor(private readonly fetchImpl: P0PlusPreviewAiFetch = fetch) {}

  private async requestCompletion(model: string, messages: PreviewAiMessage[], apiKey: string) {
    let response: Response;
    try {
      response = await this.fetchImpl(PREVIEW_AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify({
          model,
          messages,
          max_tokens: P0_PLUS_PREVIEW_MAX_TOKENS,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
    } catch (error) {
      console.error("P0+ preview AI request failed", {
        model,
        errorName: error instanceof Error ? error.name : "unknown",
      });
      throw new P0PlusPreviewAiError();
    }

    if (!response.ok) {
      console.error("P0+ preview AI returned an error", { model, status: response.status });
      throw new P0PlusPreviewAiError();
    }

    const data = await response.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new P0PlusPreviewAiError("P0+ preview AI returned no JSON content");
    }
    return content;
  }

  async generatePreview(input: P0PlusPreviewAiInput): Promise<P0PlusPreviewResponse> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new P0PlusPreviewAiError("P0+ preview AI is not configured");
    }

    const model = getPreviewAiModel();
    const initialMessages: PreviewAiMessage[] = [
      { role: "system", content: P0_PLUS_AI_CONTRACT_PROMPT },
      { role: "user", content: buildPreviewUserPrompt(input) },
    ];
    let messages = initialMessages;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const content = await this.requestCompletion(model, messages, apiKey);
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("P0+ preview AI returned invalid JSON", { model, contentLength: content.length });
        throw new P0PlusPreviewAiError("P0+ preview AI returned invalid JSON");
      }

      const validation = validateP0PlusPreviewResponse(parsed);
      if (validation.success && validation.data) {
        return validation.data;
      }

      const topLevelKeys = parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? Object.keys(parsed).slice(0, 30)
        : [];
      console.error("P0+ preview AI failed schema validation", {
        model,
        contentLength: content.length,
        topLevelKeys,
        validatorIssues: validation.issues.slice(0, 30),
      });

      if (attempt === 1) {
        throw new P0PlusPreviewAiSchemaError(validation.issues);
      }

      messages = [
        ...initialMessages,
        { role: "assistant", content },
        { role: "user", content: buildP0PlusSchemaRepairPrompt(validation.issues) },
      ];
    }

    throw new P0PlusPreviewAiSchemaError(["repair attempt limit reached"]);
  }
}

export const p0PlusPreviewAiClient = new DeepSeekP0PlusPreviewAiClient();
