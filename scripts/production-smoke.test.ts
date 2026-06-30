import assert from "node:assert/strict";
import JSZip from "jszip";

const baseUrl = (process.env.PRODUCTION_BASE_URL || "https://www.8d-reports.com").replace(/\/$/, "");
const demoTypes = ["automotive", "molding", "electronics"] as const;

async function fetchOk(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "follow",
    headers: { "User-Agent": "8D-Reports-production-smoke/1.0" },
  });
  assert.equal(response.ok, true, `${path} should return 2xx, got ${response.status}`);
  return response;
}

function hasContentType(response: Response, expected: string) {
  const contentType = response.headers.get("content-type") || "";
  assert.match(contentType, new RegExp(expected, "i"), `Expected ${expected}, got ${contentType}`);
}

async function expectHtml(path: string, markers: string[]) {
  const response = await fetchOk(path);
  hasContentType(response, "text/html");
  const html = await response.text();
  for (const marker of markers) {
    assert.equal(html.includes(marker), true, `${path} should include ${marker}`);
  }
}

async function expectPdf(type: string) {
  const response = await fetchOk(`/api/sample-reports/${type}`);
  hasContentType(response, "application/pdf");
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 4).toString("utf8"), "%PDF", `${type} PDF should start with %PDF`);
  assert.ok(bytes.byteLength > 10_000, `${type} PDF should not be an empty placeholder`);
}

async function expectDocx(type: string) {
  const response = await fetchOk(`/api/sample-reports/${type}?format=docx`);
  hasContentType(response, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 2).toString("utf8"), "PK", `${type} DOCX should be a zip-based Word file`);
  assert.ok(bytes.byteLength > 10_000, `${type} DOCX should not be an empty placeholder`);
}

async function expectXlsx(type: string) {
  const response = await fetchOk(`/api/sample-reports/${type}?format=xlsx`);
  hasContentType(response, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 2).toString("utf8"), "PK", `${type} XLSX should be a zip-based Excel file`);
  assert.ok(bytes.byteLength > 5_000, `${type} XLSX should not be an empty placeholder`);
}

async function expectZip(type: string) {
  const response = await fetchOk(`/api/sample-reports/${type}?format=zip`);
  hasContentType(response, "application/zip");
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const names = Object.keys(zip.files);
  assert.ok(names.some((name) => name.endsWith(`${type}-8d-demo.pdf`)), `${type} ZIP should include the PDF report`);
  assert.ok(names.some((name) => name.endsWith(`${type}-8d-demo.docx`)), `${type} ZIP should include the Word report`);
  assert.ok(names.some((name) => name.endsWith(`${type}-8d-demo.xlsx`)), `${type} ZIP should include the Excel report`);
  assert.ok(names.some((name) => name.startsWith("attachments/") && /\.(jpg|jpeg|png|webp)$/i.test(name)), `${type} ZIP should include image evidence`);
  assert.ok(names.some((name) => name.startsWith("attachments/") && /\.(txt|csv)$/i.test(name)), `${type} ZIP should include non-image evidence`);
  assert.ok(names.includes("attachments/README.txt"), `${type} ZIP should include the evidence README`);
}

async function main() {
  await expectHtml("/", ["Need to submit a customer-ready 8D or SCAR this week?", "Upload your 8D template", "Turn your Word / Excel 8D template into a reusable online workflow."]);
  await expectHtml("/pricing", ["8D Template Setup", "From $499", "Assisted First 8D / SCAR Delivery", "From $799"]);
  await expectHtml("/team-launch", ["Launch your online 8D workflow in 7 days", "From $999"]);
  await expectHtml("/custom-8d-template-setup", ["reusable online workflow", "Current process", "Required export"]);
  await expectHtml("/demo-reports", ["Team workflow demos", "Download Excel", "Want this in your company format?"]);
  await expectHtml("/security", ["Security", "not used to train"]);

  for (const type of demoTypes) {
    await expectHtml(`/demo-reports/${type}`, ["Complete D0-D8 report content", "Workflow activity", "Evidence package", "Want this in your company format?"]);
    await expectPdf(type);
    await expectDocx(type);
    await expectXlsx(type);
    await expectZip(type);
  }

  console.log(`Production smoke verification passed for ${baseUrl}`);
}

void main();
