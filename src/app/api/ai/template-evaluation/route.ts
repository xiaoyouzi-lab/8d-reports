import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiTasks } from "@/lib/db/schema";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { callDeepSeekJson, isAiBetaUser } from "@/lib/ai/deepseek";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  if (!isAiBetaUser(user.email)) {
    return NextResponse.json({ error: "AI template evaluation is currently available to beta test accounts only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const templateText = typeof body.templateText === "string" ? body.templateText.trim() : "";
  if (!templateText) return NextResponse.json({ error: "templateText is required" }, { status: 400 });
  if (templateText.length > 10000) return NextResponse.json({ error: "Template text is too long" }, { status: 400 });

  try {
    const output = await callDeepSeekJson("template_evaluation", templateText);
    await db.insert(aiTasks).values({
      userId: user.id,
      taskType: "template_evaluation",
      inputSummary: templateText.slice(0, 500),
      output,
      status: "completed",
    }).catch(() => {});
    return NextResponse.json({ output });
  } catch (err) {
    await db.insert(aiTasks).values({
      userId: user.id,
      taskType: "template_evaluation",
      inputSummary: templateText.slice(0, 500),
      status: "failed",
      error: err instanceof Error ? err.message : "AI failed",
    }).catch(() => {});
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI failed" }, { status: 502 });
  }
}
