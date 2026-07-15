import assert from "node:assert/strict";
import {
  generateQualityCaseWordDocument,
  qualityCaseDocumentFilename,
} from "./quality-case-word-export";

async function main() {
  assert.equal(
    qualityCaseDocumentFilename({ caseId: "12345678-1234-1234-1234-123456789012", outputType: "scar" }),
    "12345678_scar_response.docx",
  );
  const document = await generateQualityCaseWordDocument({
    title: "Connector plating issue",
    caseId: "12345678-1234-1234-1234-123456789012",
    outputType: "scar",
    status: "customer_review",
    waitingOn: "customer",
    assignee: "Quality coordinator",
    dueAt: "2026-07-18T00:00:00.000Z",
    languageMode: "en",
    fields: {
      problemDescription: "The customer identified plating variation in the affected lot.",
      selectedCorrectiveAction: "Quarantine the lot and replace the inspection fixture.",
    },
  });
  assert.equal(Buffer.isBuffer(document), true);
  assert.ok(document.length > 1_000, "DOCX should contain a real document package");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
