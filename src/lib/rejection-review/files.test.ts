import assert from "node:assert/strict";
import JSZip from "jszip";
import {
  extractReviewSubmission,
  extractTextFromDocx,
  RejectionReviewInputError,
} from "@/lib/rejection-review/files";

async function main() {
  const zip = new JSZip();
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:r><w:t>D2 Problem &amp; Scope</w:t></w:r></w:p>
<w:p><w:r><w:t>Lot L-42 had 8 defects in 500 pieces.</w:t></w:r></w:p>
<w:p><w:r><w:t>D3 Containment: all warehouse stock was held and quality verified the sorting record before shipment.</w:t></w:r></w:p>
</w:body></w:document>`);
  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  const extracted = await extractTextFromDocx(buffer);
  assert.match(extracted, /D2 Problem & Scope/);
  assert.match(extracted, /8 defects in 500 pieces/);

  const file = new File([buffer], "customer report.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const submission = await extractReviewSubmission({ file });
  assert.equal(submission.sourceType, "docx");
  assert.equal(submission.sourceFilename, "customer report.docx");

  await assert.rejects(
    () => extractReviewSubmission({ file: new File(["%PDF"], "report.pdf", { type: "application/pdf" }) }),
    (error: unknown) => error instanceof RejectionReviewInputError && error.code === "unsupported_file_type",
  );

  await assert.rejects(
    () => extractReviewSubmission({ pastedText: "too short" }),
    (error: unknown) => error instanceof RejectionReviewInputError && error.code === "input_too_short",
  );

  console.log("8D Reject Check file extraction tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
