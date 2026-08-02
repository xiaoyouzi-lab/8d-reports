import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type {
  RejectionRiskFinding,
  RejectionRiskReview,
  ReviewSection,
} from "@/lib/rejection-review/schema";

const BRAND_BLUE = "1E40AF";
const TEXT_MUTED = "64748B";

export interface CustomerReadableRewrite {
  section: ReviewSection;
  sourceExcerpt: string;
  suggestedEnglish: string;
  requiredPlaceholders: string[];
}

export interface RejectionReviewWordPackage {
  reviewId: string;
  generatedAt: Date;
  review: RejectionRiskReview;
  rewrites?: CustomerReadableRewrite[];
}

const STATUS_LABEL: Record<RejectionRiskReview["status"], string> = {
  not_suitable_to_submit: "Not suitable to submit",
  high_risk: "High rejection risk",
  submittable_with_risk: "Submittable, with remaining risk",
};

function safeFilenameSegment(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "_").slice(0, 36) || "review";
}

export function rejectionReviewFilename(reviewId: string) {
  return `${safeFilenameSegment(reviewId)}_rejection_risk_review.docx`;
}

function heading(text: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 320 : 220, after: 100 },
    children: [new TextRun({ text, bold: true, color: BRAND_BLUE })],
  });
}

function labelLine(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 90 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: TEXT_MUTED, size: 20 }),
      new TextRun({ text: value, size: 20 }),
    ],
  });
}

function bullet(value: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 70 },
    children: [new TextRun({ text: value, size: 20 })],
  });
}

function findingParagraphs(finding: RejectionRiskFinding) {
  const source = finding.source.excerpt
    ? `Supplied report excerpt: ${finding.source.excerpt}`
    : `Missing information detected by rule: ${finding.source.ruleId}`;
  return [
    heading(`${finding.section} · ${finding.title}`, HeadingLevel.HEADING_2),
    labelLine("Risk", finding.severity.toUpperCase()),
    labelLine("Why it may be rejected", finding.explanation),
    labelLine("Evidence source", source),
    labelLine("Likely customer question", finding.likelyCustomerQuestion),
    new Paragraph({
      spacing: { before: 80, after: 60 },
      children: [new TextRun({ text: "Facts or evidence to add", bold: true, size: 20 })],
    }),
    ...(finding.factsNeeded.length
      ? finding.factsNeeded.map(bullet)
      : [bullet("No additional fact category was identified by the supplied material.")]),
  ];
}

export async function generateRejectionReviewWordPackage(
  input: RejectionReviewWordPackage,
): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ spacing: { before: 500 }, children: [] }),
    new Paragraph({
      children: [new TextRun({ text: "Complete Rejection Risk Review", bold: true, color: BRAND_BLUE, size: 42 })],
    }),
    new Paragraph({
      spacing: { before: 100, after: 260 },
      children: [
        new TextRun({
          text: "Pre-submission review of an 8D, SCAR, or corrective-action response",
          size: 24,
          color: TEXT_MUTED,
        }),
      ],
    }),
    labelLine("Review ID", input.reviewId),
    labelLine("Generated", input.generatedAt.toISOString()),
    labelLine("Overall status", STATUS_LABEL[input.review.status]),
    heading("Most likely reasons for customer rejection", HeadingLevel.HEADING_1),
  ];

  if (input.review.topRejectionRisks.length) {
    input.review.topRejectionRisks.forEach((finding) => {
      children.push(bullet(`${finding.section} · ${finding.title} — ${finding.explanation}`));
    });
  } else {
    children.push(new Paragraph({
      children: [new TextRun({
        text: "No material high-risk issue was detected from the supplied report. This is not customer approval.",
        italics: true,
        size: 20,
      })],
    }));
  }

  children.push(heading("Section-by-section findings and modification advice", HeadingLevel.HEADING_1));
  if (input.review.findings.length) {
    input.review.findings.forEach((finding) => children.push(...findingParagraphs(finding)));
  } else {
    children.push(new Paragraph({
      children: [new TextRun({
        text: "No material issue was detected by the deterministic rules. Do not add unsupported facts merely to expand the report.",
        italics: true,
        size: 20,
      })],
    }));
  }

  children.push(heading("Customer-readable English rewrite", HeadingLevel.HEADING_1));
  if (input.rewrites?.length) {
    for (const rewrite of input.rewrites) {
      children.push(
        heading(rewrite.section, HeadingLevel.HEADING_2),
        labelLine("Source excerpt", rewrite.sourceExcerpt),
        labelLine("Suggested wording", rewrite.suggestedEnglish),
      );
      if (rewrite.requiredPlaceholders.length) {
        children.push(labelLine(
          "Verified facts still required",
          rewrite.requiredPlaceholders.join("; "),
        ));
      }
    }
  } else {
    children.push(new Paragraph({
      children: [new TextRun({
        text: "No safe rewrite was produced. Keep the original wording until verified facts are available; never replace missing facts with invented dates, quantities, evidence, approvals, root causes, or results.",
        italics: true,
        color: TEXT_MUTED,
        size: 20,
      })],
    }));
  }

  children.push(
    heading("Evidence policy and limitations", HeadingLevel.HEADING_1),
    bullet("Every finding must point to supplied text or a named category of missing information."),
    bullet("Placeholders must be replaced only with verified facts before customer submission."),
    bullet("This review does not confirm root cause, prove effectiveness, certify compliance, or guarantee customer acceptance."),
    new Paragraph({
      spacing: { before: 220 },
      children: [new TextRun({ text: input.review.disclaimer, italics: true, color: TEXT_MUTED, size: 18 })],
    }),
  );

  return Packer.toBuffer(new Document({
    creator: "8D Reject Check",
    title: "Complete Rejection Risk Review",
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children,
    }],
  }));
}
