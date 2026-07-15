import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { qualityCaseTaskLinks } from "@/lib/db/schema";
import { isEmailDebugAvailable } from "@/lib/email-debug";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isEmailDebugAvailable())
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const [task] = await db.select({ id: qualityCaseTaskLinks.id, caseId: qualityCaseTaskLinks.caseId })
    .from(qualityCaseTaskLinks)
    .where(eq(qualityCaseTaskLinks.id, id))
    .limit(1);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  const access = await getQualityCaseAccess(task.caseId, user.id);
  if (!access?.canAssignExternalTasks)
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  const [expired] = await db.update(qualityCaseTaskLinks)
    .set({ expiresAt: new Date(Date.now() - 60000), updatedAt: new Date() })
    .where(and(eq(qualityCaseTaskLinks.id, task.id), eq(qualityCaseTaskLinks.caseId, task.caseId)))
    .returning({ id: qualityCaseTaskLinks.id });
  return expired
    ? NextResponse.json({ expired: true })
    : NextResponse.json({ error: "Task not found." }, { status: 404 });
}
