import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { StepForm } from "../src/components/report/StepForm";
import { DEFAULT_REPORT_DATA, STEPS } from "../src/lib/report-steps";
import en from "../src/messages/en.json";
import zh from "../src/messages/zh-CN.json";

// Batch 8 render guard. The six Fishbone prompt labels/placeholders and the nine
// D-step descriptions now live in the catalogs; this renders StepForm through
// next-intl in both locales so the markup the server actually emits is checked,
// not just the catalog JSON. It also pins the English rendering to the exact
// report-steps strings so localizing the UI cannot rewrite the English copy.

const enEditor = en.editor as Record<string, string>;
const zhEditor = zh.editor as Record<string, string>;
const enStepDocs = en.docs.step as Record<string, { name: string; description: string }>;
const zhStepDocs = zh.docs.step as Record<string, { name: string; description: string }>;

const FISHBONE_FIELDS = [
  "fishboneMan",
  "fishboneMachine",
  "fishboneMaterial",
  "fishboneMethod",
  "fishboneMeasurement",
  "fishboneEnvironment",
] as const;

function renderStep(locale: "en" | "zh-CN", stepId: string) {
  const step = STEPS.find((candidate) => candidate.id === stepId);
  assert.ok(step, "STEPS must contain " + stepId);
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "zh-CN" ? zh : en}
      timeZone="UTC"
    >
      <StepForm
        step={step}
        data={{ ...DEFAULT_REPORT_DATA }}
        onChange={() => {}}
        reportId="i18n-report-strings"
        canEdit={false}
      />
    </NextIntlClientProvider>,
  );
}

// 1. Every D-step description renders from the catalog. English stays
//    byte-identical to src/lib/report-steps.ts and Chinese never falls back to it.
let descriptionChecks = 0;
for (const step of STEPS) {
  const enHtml = renderStep("en", step.id);
  const zhHtml = renderStep("zh-CN", step.id);
  const enDescription = step.description;
  const zhDescription = zhStepDocs[step.id].description;

  assert.ok(
    enHtml.includes(enDescription),
    "en " + step.id + " markup must keep the exact English step description",
  );
  assert.ok(
    zhHtml.includes(zhDescription),
    "zh " + step.id + " markup must include the translated description",
  );
  assert.ok(
    !zhHtml.includes(enDescription),
    "zh " + step.id + " markup must not include the English step description",
  );
  assert.ok(
    enStepDocs[step.id].description === enDescription,
    "en docs.step." + step.id + ".description must match the report definition",
  );
  descriptionChecks += 1;
}

// 2. The six Fishbone labels and placeholder sentences render localized in Chinese
//    and keep their exact English text in English.
const enD4 = renderStep("en", "D4");
const zhD4 = renderStep("zh-CN", "D4");
const d4 = STEPS.find((step) => step.id === "D4");
assert.ok(d4, "STEPS must contain D4");

let fishboneChecks = 0;
for (const name of FISHBONE_FIELDS) {
  const field = d4.fields.find((candidate) => candidate.name === name);
  assert.ok(field, "D4 must define the fishbone field " + name);
  const enLabel = enEditor[name];
  const zhLabel = zhEditor[name];
  const enPlaceholder = enEditor[name + "Placeholder"];
  const zhPlaceholder = zhEditor[name + "Placeholder"];

  assert.ok(
    enD4.includes(enLabel),
    "en D4 markup must include the English label " + name,
  );
  assert.ok(
    enD4.includes(enPlaceholder),
    "en D4 markup must include the English placeholder for " + name,
  );
  assert.ok(
    zhD4.includes(zhLabel),
    "zh D4 markup must include the translated label " + name,
  );
  assert.ok(
    zhD4.includes(zhPlaceholder),
    "zh D4 markup must include the translated placeholder for " + name,
  );
  assert.ok(
    !zhD4.includes(enLabel),
    "zh D4 markup must not include the English label " + name,
  );
  fishboneChecks += 1;
}

console.log(
  "i18n report-string render checks passed: " +
    descriptionChecks +
    " step descriptions rendered in both locales, " +
    fishboneChecks +
    " fishbone labels + placeholders localized.",
);
