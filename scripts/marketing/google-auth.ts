import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

type ServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
};

const oauthTokenUrl = "https://oauth2.googleapis.com/token";

function base64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function signJwt(credentials: Required<ServiceAccountCredentials>, scopes: string[]) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: scopes.join(" "),
      aud: credentials.token_uri,
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsignedJwt = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsignedJwt).sign(credentials.private_key, "base64url");
  return `${unsignedJwt}.${signature}`;
}

function readCredentials(credentialsPath: string): Required<ServiceAccountCredentials> {
  let parsed: ServiceAccountCredentials;
  try {
    parsed = JSON.parse(readFileSync(credentialsPath, "utf8")) as ServiceAccountCredentials;
  } catch {
    throw new Error(`Could not read GOOGLE_APPLICATION_CREDENTIALS at ${credentialsPath}.`);
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Google credentials JSON must include client_email and private_key.");
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    token_uri: parsed.token_uri || oauthTokenUrl,
  };
}

export async function getGoogleAccessToken(credentialsPath: string, scopes: string[]) {
  const credentials = readCredentials(credentialsPath);
  const assertion = signJwt(credentials, scopes);
  const response = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const body = (await response.json().catch(() => null)) as { access_token?: string; error_description?: string } | null;
  if (!response.ok || !body?.access_token) {
    throw new Error(body?.error_description || `Google OAuth token request failed with HTTP ${response.status}.`);
  }

  return body.access_token;
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. See docs/MARKETING_WORKFLOW.md for setup.`);
  }
  return value;
}

export function explainGoogleCredentials() {
  return [
    "Required Google setup:",
    "- GOOGLE_APPLICATION_CREDENTIALS: local path to a Google service account JSON file",
    "- GSC_SITE_URL: exact Search Console property URL, such as https://www.8d-reports.com/",
    "- GA4_PROPERTY_ID: numeric GA4 property id for GA4 exports",
    "",
    "Grant the service account read access in Google Search Console and GA4 before running API exports.",
  ].join("\n");
}
