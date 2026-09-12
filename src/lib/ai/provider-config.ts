export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
export const DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const MODEL_IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,99}$/i;

type ProviderEnvironment = Record<string, string | undefined>;

export function getDeepSeekModel(env: ProviderEnvironment = process.env) {
  const configured = env.DEEPSEEK_MODEL?.trim();
  return configured && MODEL_IDENTIFIER_PATTERN.test(configured)
    ? configured
    : DEFAULT_DEEPSEEK_MODEL;
}

export function getDeepSeekApiUrl(env: ProviderEnvironment = process.env) {
  const configured = env.DEEPSEEK_API_URL?.trim();
  if (!configured) return DEFAULT_DEEPSEEK_API_URL;

  try {
    const url = new URL(configured);
    return url.protocol === "https:" ? url.toString() : DEFAULT_DEEPSEEK_API_URL;
  } catch {
    return DEFAULT_DEEPSEEK_API_URL;
  }
}

export function getDeepSeekJsonRequestDefaults(env: ProviderEnvironment = process.env) {
  return {
    model: getDeepSeekModel(env),
    thinking: { type: "disabled" as const },
    response_format: { type: "json_object" as const },
  };
}
