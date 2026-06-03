const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

export type AiTaskType = "report_review" | "draft_generation" | "template_evaluation";

export function isAiBetaUser(email?: string | null) {
  const allowed = (process.env.AI_BETA_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return Boolean(email && allowed.includes(email.toLowerCase()));
}

const JSON_RULES = `
Return valid JSON only. Do not wrap the JSON in markdown. Do not invent evidence, dates, names, test results, customer approvals, standard certifications, or legal conclusions. If information is missing, put it in "missingInformation" or "assumptions".
`;

export const AI_PROMPTS: Record<AiTaskType, string> = {
  report_review: `You are a senior quality engineer reviewing an 8D report before customer submission.
Evaluate whether the report can be accepted by a customer reviewer. Check problem clarity, containment, root cause evidence, corrective action linkage, verification evidence, preventive action, attachments, approval readiness, and wording professionalism.
${JSON_RULES}
Schema:
{
  "overallScore": 0,
  "readiness": "not_ready | needs_revision | customer_ready",
  "sectionScores": [{"step":"D0","score":0,"comment":""}],
  "criticalIssues": [""],
  "improvementSuggestions": [""],
  "customerRejectionRisks": [""],
  "revisedWordingSuggestions": [{"field":"","suggestedText":"","reason":""}],
  "missingInformation": [""],
  "assumptions": [""]
}`,
  draft_generation: `You are a senior quality engineer drafting an editable 8D report from user-provided source materials.
Create a practical draft for later human review. Do not approve the report. Do not invent evidence. Mark assumptions clearly.
${JSON_RULES}
Schema:
{
  "draftFields": {
    "problemDescription": "",
    "containmentDescription": "",
    "containmentScope": "",
    "rootCauseOccurrence": "",
    "rootCauseEscape": "",
    "rootCauseSystem": "",
    "why1": "",
    "why2": "",
    "why3": "",
    "why4": "",
    "why5": "",
    "selectedCorrectiveAction": "",
    "correctiveRationale": "",
    "implementationPlan": "",
    "validationMethod": "",
    "systemChanges": "",
    "processUpdates": "",
    "horizontalDeployment": "",
    "lessonsLearned": ""
  },
  "customerFacingEnglishResponse": "",
  "missingInformation": [""],
  "assumptions": [""],
  "qualityWarnings": [""]
}`,
  template_evaluation: `You are a senior quality engineer evaluating whether a company 8D template is complete, professional, and suitable for conversion into an online workflow.
Check D0-D8 coverage, customer/supplier/product/batch/date fields, approval/signature area, attachments/evidence, bilingual needs, export readiness, and customer-specific fields.
${JSON_RULES}
Schema:
{
  "completenessScore": 0,
  "exportReadiness": "not_ready | needs_revision | ready",
  "missingSections": [""],
  "recommendedOnlineFields": [""],
  "bilingualTemplateNotes": [""],
  "formatRisks": [""],
  "qualityExpertSummary": "",
  "assumptions": [""]
}`,
};

export async function callDeepSeekJson<T>(taskType: AiTaskType, input: string): Promise<T> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");
  if (input.length > 12000) throw new Error("AI input is too long");

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: AI_PROMPTS[taskType] },
        { role: "user", content: input },
      ],
      max_tokens: 2200,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI service temporarily unavailable${errText ? `: ${errText.slice(0, 160)}` : ""}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("AI response was empty");
  return JSON.parse(content) as T;
}
