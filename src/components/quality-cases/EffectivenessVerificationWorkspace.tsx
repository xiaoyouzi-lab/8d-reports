"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Workspace = {
  access: { role: string; canManageWorkflow: boolean; qualityCase: { status: string; title: string; currentVersion: number } };
  cycles: Array<{ id: string; cycleNumber: number; status: string; createdAt: string }>;
  active: { id: string; cycleNumber: number; status: string } | null;
  plan: Record<string, unknown> | null;
  execution: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  evidence: Array<{ evidence: { id: string; filename: string; fileSize: number | null }; link: { evidenceType: string; description: string } }>;
  reviews: Array<{ review: { id: string; decision: string; comment: string; createdAt: string } }>;
};

const VERIFICATION_STATUSES = new Set(["customer_accepted", "effectiveness_verification", "verification_planning", "verification_in_progress", "verification_submitted", "internal_verification_review", "verified_effective", "closed", "reopened"]);
const label: Record<string, string> = {
  customer_accepted: "客户已接受方案", effectiveness_verification: "旧版有效性验证", verification_planning: "验证计划", verification_in_progress: "验证执行中",
  verification_submitted: "验证已提交", internal_verification_review: "内部验证审核", verified_effective: "已确认有效", verification_failed: "验证失败", closed: "已关闭", reopened: "验证失败，已重开",
};
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => typeof value === "number" ? value : 0;
const day = (value: unknown) => text(value).slice(0, 10);

async function request(caseId: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/quality-cases/${caseId}/verification`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "操作失败，请稍后重试。");
  return payload;
}

export function EffectivenessVerificationWorkspace({ caseId, status, owner, dueAt, product, onChanged }: { caseId: string; status: string; owner: string; dueAt: string | null; product: string; onChanged: () => void }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [coach, setCoach] = useState<{ missing: string[]; warnings: string[]; suggestions: string[] } | null>(null);
  const [comment, setComment] = useState("");
  const [supplierLink, setSupplierLink] = useState("");
  const load = useCallback(async () => {
    if (!VERIFICATION_STATUSES.has(status)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/quality-cases/${caseId}/verification`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "无法加载有效性验证。");
      setWorkspace(payload);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "无法加载有效性验证。"); }
    finally { setLoading(false); }
  }, [caseId, status]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (!VERIFICATION_STATUSES.has(status)) return null;
  if (loading) return <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" />正在加载有效性验证…</div>;
  if (!workspace) return <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>;
  const plan = workspace.plan || {};
  const execution = workspace.execution || {};
  const result = workspace.result || {};
  const canManage = workspace.access.canManageWorkflow;
  const run = async (name: string, body: Record<string, unknown>) => {
    setBusy(name); setError("");
    try { await request(caseId, body); await load(); onChanged(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "操作失败。"); }
    finally { setBusy(""); }
  };
  return (
    <section className="mt-6 space-y-5" aria-label="Effectiveness Verification">
      <Card className="overflow-hidden border-indigo-200 bg-gradient-to-r from-indigo-950 to-slate-900 text-white">
        <CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-end">
          <div><div className="flex items-center gap-2 text-indigo-200"><ShieldCheck className="size-5" />Effectiveness Verification</div><h2 className="mt-2 text-2xl font-semibold">距离关闭，还需要证明整改持续有效</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">客户接受的是整改方案。Case 只有在执行验证、关联证据并由授权人员确认后才能关闭。</p></div>
          <div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-400">状态</span><div className="mt-1 font-medium">{label[status] || status}</div></div><div><span className="text-slate-400">Case</span><div className="mt-1 font-mono">{caseId.slice(0, 8)}</div></div><div><span className="text-slate-400">负责人</span><div className="mt-1">{owner}</div></div><div><span className="text-slate-400">截止</span><div className="mt-1">{dueAt?.slice(0, 10) || "未设置"}</div></div></div>
        </CardContent>
      </Card>
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)]">
        <div className="space-y-5">
          <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold">如何证明改善有效</h3><p className="mt-1 text-sm text-slate-600">产品：{product || "未记录"}。计划必须可测量，不能只写“确认有效”。</p></div>{workspace.active ? <Badge variant="outline">Cycle {workspace.active.cycleNumber}</Badge> : null}</div>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void run("plan", { action: "save_plan", plan: Object.fromEntries([...data].map(([key, value]) => [key, key === "sampleSize" ? Number(value) : value])) }); }}>
              <label className="text-sm">验证方法<Input name="method" required defaultValue={text(plan.method)} placeholder="例如：泄漏测试与末检记录复核" /></label>
              <label className="text-sm">负责人<Input name="ownerName" required defaultValue={text(plan.ownerName) || owner} /></label>
              <label className="text-sm sm:col-span-2">计划说明<Textarea name="description" required defaultValue={text(plan.description)} placeholder="说明验证对象、频次和执行方式" /></label>
              <label className="text-sm">组织<Input name="organization" required defaultValue={text(plan.organization)} /></label>
              <label className="text-sm">样本数量<Input name="sampleSize" type="number" min="1" required defaultValue={number(plan.sampleSize) || 100} /></label>
              <label className="text-sm sm:col-span-2">样本范围<Textarea name="sampleScope" required defaultValue={text(plan.sampleScope)} placeholder="例如：连续3批，每批500件，覆盖两条生产线" /></label>
              <label className="text-sm sm:col-span-2">接受标准<Textarea name="acceptanceCriteria" required defaultValue={text(plan.acceptanceCriteria)} placeholder="例如：连续3批泄漏测试通过率100%，无同类缺陷" /></label>
              <label className="text-sm">计划开始<Input name="plannedStartAt" type="date" required defaultValue={day(plan.plannedStartAt)} /></label><label className="text-sm">计划结束<Input name="plannedEndAt" type="date" required defaultValue={day(plan.plannedEndAt)} /></label><label className="text-sm">截止日期<Input name="dueAt" type="date" required defaultValue={day(plan.dueAt) || dueAt?.slice(0, 10)} /></label>
              {canManage && ["customer_accepted", "effectiveness_verification", "verification_planning"].includes(status) ? <div className="flex items-end gap-2"><Button type="submit" disabled={!!busy}>{busy === "plan" ? "保存中…" : "保存验证计划"}</Button>{status === "verification_planning" && workspace.plan ? <Button type="button" variant="outline" onClick={() => void run("start", { action: "start_execution" })}>开始执行</Button> : null}</div> : null}
            </form></CardContent></Card>
          {status === "verification_in_progress" || workspace.execution ? <Card><CardContent className="p-5"><h3 className="font-semibold">实际执行与结果</h3><p className="mt-1 text-sm text-slate-600">记录真实执行范围，并对照预先定义的接受标准。</p>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void run("execution", { action: "save_execution", execution: Object.fromEntries([...data].map(([key, value]) => [key, key === "actualSampleSize" ? Number(value) : value])) }); }}>
              <label className="text-sm">执行人<Input name="executorName" required defaultValue={text(execution.executorName) || owner} /></label><label className="text-sm">执行组织<Input name="executorOrganization" required defaultValue={text(execution.executorOrganization) || text(plan.organization)} /></label>
              <label className="text-sm">实际开始<Input name="executionStartAt" type="date" required defaultValue={day(execution.executionStartAt)} /></label><label className="text-sm">实际结束<Input name="executionEndAt" type="date" required defaultValue={day(execution.executionEndAt)} /></label>
              <label className="text-sm sm:col-span-2">实际范围<Textarea name="actualScope" required defaultValue={text(execution.actualScope)} /></label><label className="text-sm sm:col-span-2">执行说明<Textarea name="executionNotes" required defaultValue={text(execution.executionNotes)} /></label>
              <label className="text-sm">实际样本数<Input name="actualSampleSize" type="number" min="1" required defaultValue={number(result.actualSampleSize) || number(plan.sampleSize)} /></label><label className="text-sm">结果<select name="passFail" defaultValue={text(result.passFail) || "pass"} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="pass">符合标准</option><option value="fail">不符合标准</option><option value="inconclusive">证据不足</option></select></label>
              <label className="text-sm sm:col-span-2">结果摘要<Textarea name="resultSummary" required defaultValue={text(result.resultSummary)} /></label><label className="text-sm sm:col-span-2">与接受标准对比<Textarea name="criteriaComparison" required defaultValue={text(result.criteriaComparison)} /></label>
              {status === "verification_in_progress" ? <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={!!busy}>{busy === "execution" ? "保存中…" : "保存执行结果"}</Button>{workspace.result ? <Button type="button" variant="outline" onClick={() => void run("submit", { action: "submit" })}>提交内部审核</Button> : null}</div> : null}
            </form></CardContent></Card> : null}
          <Card><CardContent className="p-5"><div className="flex items-center gap-2"><FileUp className="size-4 text-indigo-600" /><h3 className="font-semibold">结果证据</h3></div><p className="mt-1 text-sm text-slate-600">每个附件都直接关联当前 Verification Result，不会成为孤立附件。</p>
            {status === "verification_in_progress" && workspace.result ? <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={async (event) => { event.preventDefault(); setBusy("evidence"); setError(""); const response = await fetch(`/api/quality-cases/${caseId}/verification/evidence`, { method: "POST", body: new FormData(event.currentTarget) }); const payload = await response.json().catch(() => ({})); if (!response.ok) setError(payload.error || "上传失败"); else await load(); setBusy(""); }}><label className="text-sm">文件<Input name="file" type="file" required /></label><input type="hidden" name="evidenceType" value="verification_record" /><Button type="submit" variant="outline" disabled={!!busy}>{busy === "evidence" ? "上传中…" : "上传并关联"}</Button></form> : null}
            <div className="mt-4 space-y-2">{workspace.evidence.length ? workspace.evidence.map(({ evidence, link }) => <a key={evidence.id} href={`/api/quality-case-evidence/${evidence.id}`} className="flex justify-between rounded-md border p-3 text-sm hover:bg-slate-50"><span>{evidence.filename}</span><span className="text-slate-500">{link.evidenceType}</span></a>) : <p className="text-sm text-amber-700">尚无证据。可以提交审核，但不能批准为有效。</p>}</div>
          </CardContent></Card>
        </div>
        <aside className="space-y-5"><Card className="border-amber-200"><CardContent className="p-5"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-600" /><h3 className="font-semibold">AI Verification Coach</h3></div><p className="mt-2 text-xs leading-5 text-slate-500">仅提供建议，不是审批结果，不会改变工作流。</p><Button className="mt-4 w-full" variant="outline" onClick={async () => { setBusy("coach"); try { setCoach(await request(caseId, { action: "coach" })); } catch (reason) { setError(reason instanceof Error ? reason.message : "检查失败"); } finally { setBusy(""); } }}>{busy === "coach" ? "检查中…" : "检查验证准备情况"}</Button>{coach ? <div className="mt-4 space-y-3 text-sm">{coach.missing.length ? <div><b>缺少</b><ul className="mt-1 list-disc pl-5">{coach.missing.map((item) => <li key={item}>{item}</li>)}</ul></div> : <p className="text-emerald-700">计划必填信息已齐全。</p>}{coach.warnings.map((item) => <p key={item} className="rounded bg-amber-50 p-2 text-amber-900">{item}</p>)}{coach.suggestions.map((item) => <p key={item} className="text-slate-600">建议：{item}</p>)}</div> : null}</CardContent></Card>
          {canManage && ["customer_accepted", "effectiveness_verification", "verification_planning"].includes(status) ? <Card><CardContent className="p-5"><h3 className="font-semibold">邀请供应商执行验证</h3><p className="mt-1 text-sm text-slate-600">安全链接仅授权当前 Case 的验证内容。</p><form className="mt-4 space-y-3" onSubmit={async (event) => { event.preventDefault(); setBusy("invite"); setError(""); try { const form = new FormData(event.currentTarget); const payload = await request(caseId, { action: "create_supplier_task", participantName: form.get("participantName"), organization: form.get("organization"), expiresAt: form.get("expiresAt") }); setSupplierLink(`${window.location.origin}/verification/${payload.token}`); await load(); onChanged(); } catch (reason) { setError(reason instanceof Error ? reason.message : "邀请失败"); } finally { setBusy(""); } }}><label className="text-sm">供应商联系人<Input name="participantName" required /></label><label className="text-sm">供应商组织<Input name="organization" required /></label><label className="text-sm">链接有效期<Input name="expiresAt" type="date" required /></label><Button type="submit" variant="outline" className="w-full" disabled={!!busy}>{busy === "invite" ? "创建中…" : "创建安全验证链接"}</Button></form>{supplierLink ? <div className="mt-3 rounded bg-indigo-50 p-3 text-xs break-all text-indigo-800">{supplierLink}</div> : null}</CardContent></Card> : null}
          {canManage && ["verification_submitted", "internal_verification_review"].includes(status) ? <Card><CardContent className="p-5"><div className="flex items-center gap-2"><ClipboardCheck className="size-4 text-indigo-600" /><h3 className="font-semibold">内部人工审核</h3></div><p className="mt-2 text-sm text-slate-600">AI 无权执行以下动作。审核意见会写入永久审计记录。</p><Textarea className="mt-4" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="填写审核依据或补充要求" /><div className="mt-3 grid gap-2"><Button disabled={!comment.trim() || !!busy} onClick={() => void run("approve", { action: "review", decision: "approved", comment })}><CheckCircle2 className="mr-2 size-4" />Approve Verification</Button><Button variant="outline" disabled={!comment.trim() || !!busy} onClick={() => void run("request", { action: "review", decision: "requested_changes", comment })}>Request Evidence</Button><Button variant="destructive" disabled={!comment.trim() || !!busy} onClick={() => void run("fail", { action: "review", decision: "failed", comment })}>Mark Failed & Reopen</Button></div></CardContent></Card> : null}
          {canManage && status === "verified_effective" ? <Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-5"><div className="flex gap-2"><CheckCircle2 className="mt-0.5 size-5 text-emerald-700" /><div><h3 className="font-semibold text-emerald-950">人工审核已确认有效</h3><p className="mt-1 text-sm text-emerald-900">关闭仍是一个独立的人工动作。</p></div></div><Textarea className="mt-4 bg-white" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="填写关闭依据" /><Button className="mt-3 w-full" disabled={!comment.trim() || !!busy} onClick={() => void run("close", { action: "close", comment })}>正式关闭 Case</Button></CardContent></Card> : null}
          {workspace.cycles.length > 1 ? <Card><CardContent className="p-5"><h3 className="font-semibold">历史验证周期</h3><div className="mt-3 space-y-2">{workspace.cycles.map((cycle) => <div key={cycle.id} className="flex justify-between rounded border p-2 text-sm"><span>Cycle {cycle.cycleNumber}</span><span>{label[cycle.status] || cycle.status}</span></div>)}</div></CardContent></Card> : null}
        </aside>
      </div>
    </section>
  );
}
