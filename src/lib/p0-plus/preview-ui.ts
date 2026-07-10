import {
  P0_PLUS_PREVIEW_MAX_INPUT_CHARS,
  P0_PLUS_PREVIEW_MIN_VISIBLE_CHARS,
} from "@/lib/p0-plus/limits";

export type P0PlusOutputLanguage = "en" | "zh-CN" | "bilingual";

export const P0_PLUS_OUTPUT_LANGUAGE_OPTIONS: ReadonlyArray<{
  label: string;
  value: P0PlusOutputLanguage;
}> = [
  { label: "English", value: "en" },
  { label: "Chinese", value: "zh-CN" },
  { label: "Bilingual", value: "bilingual" },
];

export type P0PlusIntakeErrorCode =
  | "input_too_short"
  | "input_too_large"
  | "p0_plus_preview_disabled"
  | "rate_limited"
  | "preview_generation_failed"
  | "preview_schema_invalid"
  | "preview_response_invalid"
  | "network_error";

export interface P0PlusIntakeValidationResult {
  ok: boolean;
  code?: Extract<P0PlusIntakeErrorCode, "input_too_short" | "input_too_large">;
  message?: string;
  normalizedInput?: string;
}

export interface P0PlusPreviewFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type P0PlusPreviewFetch = (
  input: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
  },
) => Promise<P0PlusPreviewFetchResponse>;

export type P0PlusIntakeSubmitResult =
  | {
      ok: true;
      token: string;
      redirectPath: string;
    }
  | {
      ok: false;
      code: P0PlusIntakeErrorCode;
      message: string;
    };

export function validateP0PlusIntakeInput(rawInput: string): P0PlusIntakeValidationResult {
  const normalizedInput = rawInput.trim();
  if (normalizedInput.length > P0_PLUS_PREVIEW_MAX_INPUT_CHARS) {
    return {
      ok: false,
      code: "input_too_large",
      message: `Keep the preview input under ${P0_PLUS_PREVIEW_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    };
  }

  const visibleLength = normalizedInput.replace(/\s+/g, "").length;
  if (visibleLength < P0_PLUS_PREVIEW_MIN_VISIBLE_CHARS) {
    return {
      ok: false,
      code: "input_too_short",
      message: "Add a few more concrete details before generating a draft.",
    };
  }

  return { ok: true, normalizedInput };
}

export function getP0PlusPreviewRedirectPath(token: string) {
  return `/p0-plus/preview/${encodeURIComponent(token)}`;
}

export function getP0PlusPreviewErrorMessage(status: number, code: unknown) {
  if (code === "p0_plus_preview_disabled" || status === 404) {
    return "Preview generation is not available right now.";
  }
  if (code === "rate_limited" || status === 429) {
    return "Too many preview requests. Wait a bit before trying again.";
  }
  if (code === "input_too_short" || status === 400) {
    return "Add a few more concrete details before generating a draft.";
  }
  if (code === "body_too_large" || code === "input_too_long" || status === 413) {
    return `Keep the preview input under ${P0_PLUS_PREVIEW_MAX_INPUT_CHARS.toLocaleString()} characters.`;
  }
  if (code === "preview_schema_invalid") {
    return "The AI returned an incomplete report structure. Please try again shortly.";
  }
  if (code === "preview_generation_failed" || status >= 500) {
    return "Preview generation failed. Try again with clearer notes.";
  }
  return "Preview generation failed. Try again with clearer notes.";
}

function readCode(body: unknown) {
  return typeof body === "object" && body !== null && "code" in body
    ? (body as { code?: unknown }).code
    : undefined;
}

function readToken(body: unknown) {
  return typeof body === "object" && body !== null && typeof (body as { token?: unknown }).token === "string"
    ? (body as { token: string }).token
    : null;
}

export async function submitP0PlusIntake({
  rawInput,
  outputLanguage,
  fetchImpl = (input, init) => fetch(input, init),
}: {
  rawInput: string;
  outputLanguage: P0PlusOutputLanguage;
  fetchImpl?: P0PlusPreviewFetch;
}): Promise<P0PlusIntakeSubmitResult> {
  const validation = validateP0PlusIntakeInput(rawInput);
  if (!validation.ok || !validation.normalizedInput) {
    return {
      ok: false,
      code: validation.code || "input_too_short",
      message: validation.message || "Add a few more concrete details before generating a draft.",
    };
  }

  let response: P0PlusPreviewFetchResponse;
  try {
    response = await fetchImpl("/api/p0-plus/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawInput: validation.normalizedInput,
        outputLanguage,
      }),
    });
  } catch {
    return {
      ok: false,
      code: "network_error",
      message: "Preview generation failed. Check your connection and try again.",
    };
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = readCode(body);
    return {
      ok: false,
      code: typeof code === "string" ? (code as P0PlusIntakeErrorCode) : "preview_generation_failed",
      message: getP0PlusPreviewErrorMessage(response.status, code),
    };
  }

  const token = readToken(body);
  if (!token) {
    return {
      ok: false,
      code: "preview_response_invalid",
      message: "Preview generation failed. Try again with clearer notes.",
    };
  }

  return {
    ok: true,
    token,
    redirectPath: getP0PlusPreviewRedirectPath(token),
  };
}
