import { STEPS, type ReportData } from "@/lib/report-steps";
import type { QualityCheckKnowledgeContextItem } from "@/lib/ai/knowledge-context";

export function summarizeReportForAi(
  reportData: ReportData,
  reportTitle: string,
  knowledgeContext: QualityCheckKnowledgeContextItem[] = [],
) {
  return JSON.stringify({
    title: reportTitle,
    steps: STEPS.map((step) => ({
      id: step.id,
      label: step.label,
      fields: step.fields.map((field) => ({
        name: field.name,
        label: field.label,
        value: reportData[field.name as keyof ReportData] || "",
      })).filter((field) => String(field.value).trim() !== ""),
    })),
    knowledgeContext,
    knowledgeContextStatus: knowledgeContext.length > 0
      ? `${knowledgeContext.length} historical completed report(s) provided as reference context.`
      : "No comparable historical completed reports were found.",
  });
}

export function summarizeMaterialsForAi(materials: string, reportData?: Partial<ReportData>) {
  return JSON.stringify({
    materials,
    currentReportData: reportData || {},
  });
}
