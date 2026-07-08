import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import LandingPage from "@/app/(marketing)/page";
import { P0PlusPreviewPageContent } from "@/components/p0-plus/P0PlusPreviewContent";
import { injectionMoldingFlashFixture } from "@/lib/p0-plus/__fixtures__/injection-molding-flash";
import { P0_PLUS_PREVIEW_MAX_INPUT_CHARS } from "@/lib/p0-plus/limits";
import { getP0PlusContinuePath } from "@/lib/p0-plus/paths";
import {
  submitP0PlusIntake,
  validateP0PlusIntakeInput,
  type P0PlusPreviewFetch,
} from "@/lib/p0-plus/preview-ui";

const validRawInput = [
  "Production line found flash and excess material on injection molded part A.",
  "Supplier is mentioned, photos are available, but lot and defect quantity are missing.",
].join(" ");

function makeResponse(status: number, body: Record<string, unknown>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

function firstHeroSection(html: string) {
  const sectionStart = html.indexOf("<section");
  const sectionEnd = html.indexOf("</section>", sectionStart);
  assert.notEqual(sectionStart, -1, "Rendered homepage should include a hero section");
  assert.notEqual(sectionEnd, -1, "Rendered homepage hero section should close");
  return html.slice(sectionStart, sectionEnd);
}

async function main() {
  const originalFeatureFlag = process.env.P0_PLUS_PREVIEW_ENABLED;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalVercelGitCommitRef = process.env.VERCEL_GIT_COMMIT_REF;

  function restoreEnv() {
    if (originalFeatureFlag === undefined) {
      delete process.env.P0_PLUS_PREVIEW_ENABLED;
    } else {
      process.env.P0_PLUS_PREVIEW_ENABLED = originalFeatureFlag;
    }
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    if (originalVercelGitCommitRef === undefined) {
      delete process.env.VERCEL_GIT_COMMIT_REF;
    } else {
      process.env.VERCEL_GIT_COMMIT_REF = originalVercelGitCommitRef;
    }
  }

  try {
    delete process.env.P0_PLUS_PREVIEW_ENABLED;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_GIT_COMMIT_REF;
    const disabledHomeHtml = renderToStaticMarkup(<LandingPage />);
    assert.equal(
      disabledHomeHtml.includes("Finish customer-ready 8D reports without rebuilding them in Excel."),
      true,
      "Feature flag disabled homepage should preserve the existing hero title",
    );
    assert.equal(
      disabledHomeHtml.includes("Need to submit a customer-ready 8D or SCAR this week?"),
      true,
      "Feature flag disabled homepage should preserve the existing hero description",
    );
    assert.equal(
      disabledHomeHtml.includes("Turn messy quality notes into structured 8D reports."),
      false,
      "Feature flag disabled homepage should not show the P0+ hero title",
    );
    assert.equal(
      disabledHomeHtml.includes("Turn messy quality notes into a structured 8D report."),
      false,
      "Homepage should not show P0+ intake when feature flag is disabled",
    );
    assert.equal(
      disabledHomeHtml.includes("Generate 8D Draft"),
      false,
      "Homepage should not show preview submit button when feature flag is disabled",
    );

    process.env.P0_PLUS_PREVIEW_ENABLED = "true";
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_GIT_COMMIT_REF;
    const enabledHomeHtml = renderToStaticMarkup(<LandingPage />);
    const enabledHeroHtml = firstHeroSection(enabledHomeHtml);
    assert.equal(
      enabledHomeHtml.includes("Turn messy quality notes into structured 8D reports."),
      true,
      "Feature flag enabled homepage should show the P0+ hero title",
    );
    assert.equal(
      enabledHomeHtml.includes("Paste complaint emails, production feedback, inspection notes, supplier updates, or rough case details."),
      true,
      "Feature flag enabled homepage should show the P0+ hero description",
    );
    assert.equal(
      enabledHomeHtml.includes("Turn messy quality notes into a structured 8D report."),
      true,
      "Homepage should show P0+ intake when feature flag is enabled",
    );
    assert.equal(
      enabledHomeHtml.includes("Generate 8D Draft"),
      true,
      "Homepage should show preview submit button when feature flag is enabled",
    );
    assert.equal(
      enabledHeroHtml.includes("Upload your 8D template"),
      false,
      "Feature flag enabled hero should not promote template upload as a first-screen CTA",
    );
    assert.equal(
      enabledHeroHtml.includes("Start free with 3 reports"),
      false,
      "Feature flag enabled hero should not promote signup as the first-screen main CTA",
    );

    delete process.env.P0_PLUS_PREVIEW_ENABLED;
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_REF = "validation/p0-plus-preview-smoke";
    const validationHomeHtml = renderToStaticMarkup(<LandingPage />);
    assert.equal(
      validationHomeHtml.includes("Turn messy quality notes into structured 8D reports."),
      true,
      "Validation Preview branch fallback should show the P0+ hero title",
    );
    assert.equal(
      validationHomeHtml.includes("Generate 8D Draft"),
      true,
      "Validation Preview branch fallback should show the P0+ intake",
    );
    assert.equal(
      validationHomeHtml.includes("Validation preview mode. This temporary PR is for testing only and must not be merged."),
      true,
      "Validation Preview branch fallback should show the warning banner",
    );

    delete process.env.P0_PLUS_PREVIEW_ENABLED;
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_GIT_COMMIT_REF = "validation/p0-plus-preview-smoke";
    const productionFallbackHtml = renderToStaticMarkup(<LandingPage />);
    assert.equal(
      productionFallbackHtml.includes("Finish customer-ready 8D reports without rebuilding them in Excel."),
      true,
      "Production should preserve the old homepage without an explicit flag",
    );
    assert.equal(
      productionFallbackHtml.includes("Generate 8D Draft"),
      false,
      "Production must not show P0+ intake from validation branch fallback",
    );
    assert.equal(
      productionFallbackHtml.includes("Validation preview mode. This temporary PR is for testing only and must not be merged."),
      false,
      "Production must not show the validation fallback banner",
    );

    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_REF = "main";
    const mainPreviewHtml = renderToStaticMarkup(<LandingPage />);
    assert.equal(
      mainPreviewHtml.includes("Generate 8D Draft"),
      false,
      "Main branch Preview deployments must not show P0+ intake from validation fallback",
    );
  } finally {
    restoreEnv();
  }

  let fetchCalls = 0;
  const shouldNotFetch: P0PlusPreviewFetch = async () => {
    fetchCalls += 1;
    throw new Error("Fetch should not be called for invalid input");
  };

  assert.equal(validateP0PlusIntakeInput("").ok, false, "Empty input should be invalid");
  const shortResult = await submitP0PlusIntake({
    rawInput: "too short",
    outputLanguage: "en",
    fetchImpl: shouldNotFetch,
  });
  assert.equal(shortResult.ok, false, "Short input should fail before API");
  assert.equal(fetchCalls, 0, "Short input must not call preview API");

  const oversizedResult = await submitP0PlusIntake({
    rawInput: "x".repeat(P0_PLUS_PREVIEW_MAX_INPUT_CHARS + 1),
    outputLanguage: "en",
    fetchImpl: shouldNotFetch,
  });
  assert.equal(oversizedResult.ok, false, "Oversized input should fail before API");
  assert.equal(fetchCalls, 0, "Oversized input must not call preview API");

  const successFetch: P0PlusPreviewFetch = async (url, init) => {
    fetchCalls += 1;
    assert.equal(url, "/api/p0-plus/preview");
    assert.equal(init.method, "POST");
    const body = JSON.parse(init.body) as Record<string, unknown>;
    assert.equal(body.rawInput, validRawInput);
    assert.equal(body.outputLanguage, "bilingual");
    return makeResponse(201, { token: "preview-token-123" });
  };
  const successResult = await submitP0PlusIntake({
    rawInput: `  ${validRawInput}  `,
    outputLanguage: "bilingual",
    fetchImpl: successFetch,
  });
  assert.equal(successResult.ok, true, "Valid input should submit to preview API");
  if (successResult.ok) {
    assert.equal(successResult.redirectPath, "/p0-plus/preview/preview-token-123");
  }

  const disabledResult = await submitP0PlusIntake({
    rawInput: validRawInput,
    outputLanguage: "en",
    fetchImpl: async () => makeResponse(404, { code: "p0_plus_preview_disabled" }),
  });
  assert.equal(disabledResult.ok, false, "Feature disabled API response should be surfaced");
  if (!disabledResult.ok) {
    assert.match(disabledResult.message, /not available/i);
  }

  const limitedResult = await submitP0PlusIntake({
    rawInput: validRawInput,
    outputLanguage: "en",
    fetchImpl: async () => makeResponse(429, { code: "rate_limited" }),
  });
  assert.equal(limitedResult.ok, false, "Rate limit API response should be surfaced");
  if (!limitedResult.ok) {
    assert.match(limitedResult.message, /too many preview requests/i);
  }

  const failedResult = await submitP0PlusIntake({
    rawInput: validRawInput,
    outputLanguage: "en",
    fetchImpl: async () => makeResponse(502, { code: "preview_generation_failed" }),
  });
  assert.equal(failedResult.ok, false, "Preview generation failure should be surfaced");
  if (!failedResult.ok) {
    assert.match(failedResult.message, /failed/i);
  }

  const previewHtml = renderToStaticMarkup(
    <P0PlusPreviewPageContent
      preview={injectionMoldingFlashFixture.response}
      tokenExpiresAt="2026-07-04T00:00:00.000Z"
      outputLanguage="en"
      continuePath={getP0PlusContinuePath("preview-token-123")}
      validationMode
    />,
  );

  for (const expected of [
    "Case Summary",
    "D0-D8 Draft Preview",
    "Readiness Check",
    "Missing Information",
    "Required Evidence",
    "Clarification Questions",
    "Next Actions",
    "provided",
    "extracted",
    "inferred",
    "missing",
    "needs confirmation",
    "conflicting",
    "not applicable",
    "Confirm affected lot or batch",
    "Owner: quality",
    "Priority: high",
    "Linked step: D2",
    "Validation preview mode. This temporary PR is for testing only and must not be merged.",
    "After signing in, you can save this preview as an editable report.",
    "/login?callbackUrl=%2Fp0-plus%2Fcontinue%2Fpreview-token-123",
  ]) {
    assert.equal(previewHtml.includes(expected), true, `Preview page should include ${expected}`);
  }

  for (const forbidden of [
    "reportId",
    "shareToken",
    "exportUrl",
    "Save Changes",
    "Upload attachment",
    "Share report",
    "Export PDF",
    "Export Word",
    "Export Excel",
  ]) {
    assert.equal(previewHtml.includes(forbidden), false, `Preview page must not include ${forbidden}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
