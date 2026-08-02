export function safeCallbackUrl(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

export function authPathWithCallback(path: "/login" | "/signup", callbackUrl: string) {
  return `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
