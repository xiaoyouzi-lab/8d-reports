import { STEPS, type ReportData } from "@/lib/report-steps";

export function summarizeReportForAi(reportData: ReportData, reportTitle: string) {
  return JSON.stringify({
    title: reportTitle,
    report: reportData,
    steps: STEPS.map((step) => ({
      id: step.id,
      label: step.label,
      fields: step.fields.map((field) => ({
        name: field.name,
        label: field.label,
        value: reportData[field.name as keyof ReportData] || "",
      })),
    })),
  });
}

export function summarizeMaterialsForAi(materials: string, reportData?: Partial<ReportData>) {
  return JSON.stringify({
    materials,
    currentReportData: reportData || {},
  });
}
