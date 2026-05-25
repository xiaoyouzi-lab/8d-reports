import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { reports, userQuotas } from "@/lib/db/schema";
import { isUserPro } from "@/lib/subscription";
import { eq } from "drizzle-orm";

const SAMPLE_DATA = {
  d1_team: [
    { name: "Sarah Chen", role: "Quality Manager", department: "QA" },
    { name: "Mike Johnson", role: "Process Engineer", department: "Engineering" },
    { name: "Lisa Wang", role: "Production Supervisor", department: "Manufacturing" },
  ],
  d2_problemDescription: "Customer reported intermittent power failure in Model XR-2000 units shipped in batch #2025-0417. Approximately 12% of units exhibit shutdown within the first 48 hours of operation. Issue first detected on 2025-04-15 during customer incoming inspection.",
  d3_rootCause: "Root cause identified as a cold solder joint on the power management IC (U12) caused by insufficient reflow temperature in Zone 3 of the SMT line. Contributing factor: temperature sensor calibration drift of +3.2°C, resulting in actual peak temperature 8°C below specification.",
  d4_escapePoint: "Current ICT (In-Circuit Test) does not include a power-cycling stress test. The intermittent nature of the fault (thermal-dependent) means it passes room-temperature functional test but fails after thermal cycling.",
  d5_correctiveActions: [
    { action: "Recalibrate Zone 3 temperature sensors on SMT Line 2", owner: "Mike Johnson", dueDate: "2025-04-22", status: "completed" },
    { action: "Add X-ray inspection for BGA/U12 solder joints after reflow", owner: "Lisa Wang", dueDate: "2025-04-25", status: "in_progress" },
    { action: "Implement power-cycle stress test (10 cycles, -10°C to +60°C) in ICT", owner: "Sarah Chen", dueDate: "2025-05-01", status: "planned" },
  ],
  d6_verification: "After recalibration and implementation of X-ray inspection, 500 units from batch #2025-0425 were tested with zero failures after 72-hour burn-in. Power-cycle stress test successfully detected 3 pre-existing defects in the pilot run, preventing shipment of faulty units.",
  d7_prevention: "1. Added daily SMT temperature profile verification to morning checklist\n2. Implemented SPC (Statistical Process Control) monitoring with ±3σ alert limits on all SMT zones\n3. Updated PFMEA document #PF-2025-042 with new detection controls for U12 solder quality\n4. Revised supplier quality agreement for solder paste to include thermal profiling data",
  d8_closure: "All corrective actions verified. Customer notified and accepted resolution plan. Batch #2025-0417 units to be recalled and reworked. Closure date: 2025-05-10. Team recognition: Process improvement team awarded 'Quality Excellence' for quick containment and root cause analysis.",
};

export async function POST(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const isPro = await isUserPro(user.id);
  const [quota] = await db
    .select()
    .from(userQuotas)
    .where(eq(userQuotas.userId, user.id))
    .limit(1);

  const totalQuota = quota?.totalQuota ?? 5;
  const usedQuota = quota?.usedQuota ?? 0;
  if (!isPro && usedQuota >= totalQuota) {
    return NextResponse.json({ error: "Quota exhausted" }, { status: 403 });
  }

  const [report] = await db
    .insert(reports)
    .values({
      userId: user.id,
      title: "Sample: XR-2000 Power Failure — 8D Report",
      reportType: "customer_8d",
      priority: "high",
      status: "in_progress",
      data: SAMPLE_DATA,
      stepStatus: {
        d1: "completed",
        d2: "completed",
        d3: "completed",
        d4: "completed",
        d5: "completed",
        d6: "completed",
        d7: "completed",
        d8: "completed",
      },
      hasConsumedQuota: !isPro,
    })
    .returning();

  if (!isPro && !quota) {
    await db.insert(userQuotas).values({ userId: user.id, totalQuota: 5, usedQuota: 1 });
  } else if (!isPro) {
    await db
      .update(userQuotas)
      .set({ usedQuota: usedQuota + 1, updatedAt: new Date() })
      .where(eq(userQuotas.userId, user.id));
  }

  return NextResponse.json(report, { status: 201 });
}
