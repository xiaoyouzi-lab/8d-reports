"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  LoaderCircle,
  MessageSquareMore,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PackageAnswer = {
  answerId: string;
  revision: number;
  stage: string;
  text: string;
};

type EvidenceFile = {
  id: string;
  filename: string;
  associations: Array<{
    stage: string | null;
    relatedAnswerId: string | null;
    relatedInsightId: string | null;
  }>;
};

type ReviewFinding = {
  id: string;
  area: string;
  status: "complete" | "attention" | "needs_confirmation" | "missing_evidence";
  title: string;
  reason: string;
  sourceAnswerIds: string[];
  evidenceIds: string[];
};

type Mapping = {
  id: string;
  persisted: boolean;
  answerId: string;
  qualityConcept: string;
  semanticKey: string;
  targetReference: { legacy8dFields?: string[] };
  decision: string;
  answerText: string;
  answerRevision: number;
  stage: string;
  confirmed: {
    confirmationId: string | null;
    confirmedText: string;
    language: string;
    approvedEvidenceIds: string[];
  };
};

type Workspace = {
  qualityCase: {
    id: string;
    title: string;
    status: string;
  };
  context?: {
    product: string;
    customer: string;
    supplier: { name: string; organization: string | null };
    problemSummary: string;
  };
  package: {
    packageId: string;
    investigation: {
      currentAnswers: PackageAnswer[];
      aiInterpretations: Array<{
        aiRunId: string;
        answerId: string;
        summary: string;
        confidence: string;
        status: "unconfirmed";
      }>;
      insights: Array<{
        id: string;
        kind: string;
        message: string;
        confidence: string;
        requiresConfirmation: true;
      }>;
      missingInformation: Array<{
        key: string;
        reason: string;
        stage: string | null;
      }>;
    };
    evidence: {
      files: EvidenceFile[];
      requirements: Array<{
        id: string;
        requirement: string;
        reason: string;
        status: string;
      }>;
    };
  } | null;
  review: {
    advisoryOnly: true;
    findings: ReviewFinding[];
    risks: string[];
    missingEvidence: Array<{
      requirementId: string;
      requirement: string;
      reason: string;
    }>;
    suggestedQuestions: string[];
    recommendedNextAction:
      | "request_supplier_update"
      | "accept_for_customer_preparation"
      | "review_manually";
    generatedBy: string;
  } | null;
  reviewPersisted?: boolean;
  mappings: Mapping[];
  permissions: {
    canReview: boolean;
    canConfirmMapping: boolean;
    canRequestSupplierUpdate: boolean;
    canBuildCustomerDraft: boolean;
  };
};

const STAGE_LABELS: Record<string, string> = {
  problem_description: "发生了什么",
  containment: "当前怎样控制风险",
  occurrence_cause: "为什么有机会发生",
  escape_cause: "为什么没有提前发现",
  corrective_action: "准备怎样改善",
  verification_and_prevention: "怎样证明改善有效",
};

const AREA_LABELS: Record<string, string> = {
  problem_definition: "问题事实",
  containment: "当前控制",
  root_cause: "发生与未发现原因",
  corrective_action: "改善措施",
  verification: "验证证据",
};

const SEMANTIC_LABELS: Record<string, string> = {
  complaint_summary: "问题摘要",
  containment: "临时控制",
  occurrence_analysis: "发生原因分析",
  escape_analysis: "未发现原因分析",
  corrective_action: "改善措施",
  implementation_plan: "实施计划",
  effectiveness_verification: "有效性验证",
  preventive_action: "防止再发",
  lessons_learned: "经验总结",
};

const SEMANTIC_KEYS = Object.keys(SEMANTIC_LABELS);

function findingPresentation(status: ReviewFinding["status"]) {
  if (status === "complete")
    return {
      icon: CheckCircle2,
      label: "已找到信息",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  if (status === "missing_evidence")
    return {
      icon: ShieldAlert,
      label: "缺少证据",
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  return {
    icon: AlertTriangle,
    label: status === "needs_confirmation" ? "需要人工确认" : "建议关注",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  };
}

function recommendationText(value: Workspace["review"]) {
  if (!value) return "先运行质量审核，系统会整理风险和建议问题。";
  if (value.recommendedNextAction === "request_supplier_update")
    return "建议先向供应商补充提问或索取证据，再准备客户回复。";
  if (value.recommendedNextAction === "accept_for_customer_preparation")
    return "当前没有发现明确缺口，可以由你确认关键信息并准备客户草稿。";
  return "当前信息需要人工判断；AI 不会替你接受供应商回复。";
}

export function InternalQualityReviewWorkspace({
  caseId,
  onChanged,
}: {
  caseId: string;
  onChanged: () => void;
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [mappingText, setMappingText] = useState("");
  const [mappingLanguage, setMappingLanguage] = useState<"zh-CN" | "en">(
    "zh-CN",
  );
  const [mappingSemanticKey, setMappingSemanticKey] = useState("");
  const [mappingEvidenceIds, setMappingEvidenceIds] = useState<string[]>([]);
  const [followUpMode, setFollowUpMode] = useState<
    "supplement" | "reinvestigate" | null
  >(null);
  const [followUpReason, setFollowUpReason] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState("");
  const [followUpFields, setFollowUpFields] = useState("");
  const [followUpDueAt, setFollowUpDueAt] = useState("");
  const [supplierLink, setSupplierLink] = useState("");
  const [draftFormat, setDraftFormat] = useState("english_email");
  const [customerDraft, setCustomerDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/quality-cases/${caseId}/internal-review`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "无法加载内部审核工作台",
        );
      setWorkspace(payload as Workspace);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "无法加载内部审核工作台",
      );
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    const response = await fetch(
      `/api/quality-cases/${caseId}/internal-review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        typeof payload.error === "string" ? payload.error : "操作失败",
      );
    return payload as Record<string, unknown>;
  };

  const runReview = async () => {
    setBusyAction("review");
    try {
      await post({ action: "run_review" });
      toast.success("质量审核已更新", {
        description: "结果仅作为建议，不会自动接受供应商回复。",
      });
      await load();
    } catch (reviewError) {
      toast.error("审核未完成", {
        description:
          reviewError instanceof Error ? reviewError.message : undefined,
      });
    } finally {
      setBusyAction("");
    }
  };

  const workflowAction = async (
    action: "start_internal_review" | "accept_for_customer_preparation",
  ) => {
    setBusyAction(action);
    try {
      await post({ action });
      toast.success(
        action === "start_internal_review"
          ? "已进入内部审核"
          : "已进入客户沟通准备",
      );
      onChanged();
      await load();
    } catch (workflowError) {
      toast.error("状态未更新", {
        description:
          workflowError instanceof Error ? workflowError.message : undefined,
      });
    } finally {
      setBusyAction("");
    }
  };

  const chooseMapping = (mapping: Mapping) => {
    setSelectedMappingId(mapping.id);
    setMappingText(
      mapping.confirmed.confirmedText || mapping.answerText || "",
    );
    setMappingLanguage(
      mapping.confirmed.language === "en" ? "en" : "zh-CN",
    );
    setMappingSemanticKey(mapping.semanticKey);
    setMappingEvidenceIds(mapping.confirmed.approvedEvidenceIds || []);
  };

  const confirmMapping = async () => {
    if (!selectedMappingId || !mappingText.trim() || !mappingSemanticKey) return;
    setBusyAction("mapping");
    try {
      await post({
        action: "confirm_mapping",
        mappingId: selectedMappingId,
        semanticKey: mappingSemanticKey,
        confirmedText: mappingText,
        language: mappingLanguage,
        approvedEvidenceIds: mappingEvidenceIds,
        comment: "Coordinator confirmed this mapping for customer preparation.",
      });
      toast.success("映射已由人工确认", {
        description: "该操作不会写入最终 Report 字段。",
      });
      setSelectedMappingId("");
      await load();
    } catch (mappingError) {
      toast.error("映射确认失败", {
        description:
          mappingError instanceof Error ? mappingError.message : undefined,
      });
    } finally {
      setBusyAction("");
    }
  };

  const requestUpdate = async () => {
    if (!followUpMode) return;
    setBusyAction("supplier-update");
    try {
      const payload = await post({
        action:
          followUpMode === "reinvestigate"
            ? "reject_supplier_response"
            : "request_supplier_update",
        reason: followUpReason,
        questions: followUpQuestions
          .split("\n")
          .map((question) => question.trim())
          .filter(Boolean),
        requestedFieldIds: followUpFields
          .split(",")
          .map((field) => field.trim())
          .filter(Boolean),
        dueAt: followUpDueAt,
      });
      const token = typeof payload.token === "string" ? payload.token : "";
      if (token)
        setSupplierLink(`${window.location.origin}/supplier/${token}`);
      toast.success("供应商补充任务已创建");
      setFollowUpMode(null);
      onChanged();
    } catch (updateError) {
      toast.error("未能创建供应商补充任务", {
        description:
          updateError instanceof Error ? updateError.message : undefined,
      });
    } finally {
      setBusyAction("");
    }
  };

  const buildDraft = async () => {
    setBusyAction("draft");
    try {
      const payload = await post({
        action: "build_customer_draft",
        format: draftFormat,
      });
      setCustomerDraft(
        typeof payload.draft === "string" ? payload.draft : "",
      );
      toast.success("客户沟通草稿已生成", {
        description: "草稿未发送，仍需人工检查。",
      });
    } catch (draftError) {
      toast.error("无法生成客户草稿", {
        description:
          draftError instanceof Error ? draftError.message : undefined,
      });
    } finally {
      setBusyAction("");
    }
  };

  if (loading)
    return (
      <div className="mt-6 flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
        <LoaderCircle className="mr-2 size-4 animate-spin" />
        正在准备内部审核工作台…
      </div>
    );
  if (error || !workspace)
    return (
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <CardContent className="p-5">
          <h2 className="font-semibold text-amber-950">内部审核暂不可用</h2>
          <p className="mt-2 text-sm text-amber-900">{error}</p>
        </CardContent>
      </Card>
    );
  if (!workspace.package || !workspace.context)
    return (
      <Card className="mt-6 border-slate-200">
        <CardContent className="p-5">
          <h2 className="font-semibold text-slate-950">尚无供应商响应包</h2>
          <p className="mt-2 text-sm text-slate-600">
            供应商完成提交后，这里会显示原始回答、AI 风险提示和证据。
          </p>
        </CardContent>
      </Card>
    );

  const packageValue = workspace.package;
  const selectedMapping = workspace.mappings.find(
    (mapping) => mapping.id === selectedMappingId,
  );
  const confirmedMappings = workspace.mappings.filter(
    (mapping) => mapping.decision === "confirmed",
  );
  const nextQuestions = workspace.review?.suggestedQuestions || [];

  return (
    <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 sm:p-5">
      <div className="flex flex-col gap-4 border-b border-indigo-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
            <ClipboardCheck className="size-4" />
            Internal Quality Coordinator Workspace
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            供应商已提交整改，等待内部判断下一步
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            你不需要判断专业体系是否“正确”。请核对事实、查看风险，并决定接受、追问或重新调查。AI 只提供建议。
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-indigo-200 bg-white text-indigo-800"
        >
          {workspace.qualityCase.status === "supplier_submitted"
            ? "Waiting for Internal Review"
            : "Internal Review"}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">产品</p>
          <p className="mt-1 text-sm font-medium text-slate-950">
            {workspace.context.product}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">客户</p>
          <p className="mt-1 text-sm font-medium text-slate-950">
            {workspace.context.customer}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">供应商</p>
          <p className="mt-1 text-sm font-medium text-slate-950">
            {workspace.context.supplier.organization ||
              workspace.context.supplier.name}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">问题摘要</p>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-950">
            {workspace.context.problemSummary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_1fr_0.78fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <MessageSquareMore className="size-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-950">
                  供应商原始回答
                </h3>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                原始回答不可在此修改；修订记录保留在调查账本中。
              </p>
              <div className="mt-4 space-y-3">
                {packageValue.investigation.currentAnswers.map((answer) => (
                  <div
                    key={answer.answerId}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-indigo-700">
                        {STAGE_LABELS[answer.stage] || answer.stage}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        revision {answer.revision}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                      {answer.text}
                    </p>
                    {packageValue.investigation.aiInterpretations
                      .filter(
                        (interpretation) =>
                          interpretation.answerId === answer.answerId,
                      )
                      .map((interpretation) => (
                        <div
                          key={interpretation.aiRunId}
                          className="mt-3 rounded-md border border-violet-200 bg-violet-50 p-2.5"
                        >
                          <div className="flex items-center gap-2 text-xs font-medium text-violet-800">
                            <Bot className="size-3.5" /> AI 理解 · 未确认
                          </div>
                          <p className="mt-1 text-xs leading-5 text-violet-900">
                            {interpretation.summary}
                          </p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <FileCheck2 className="size-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-950">证据与缺失信息</h3>
              </div>
              <div className="mt-4 space-y-2">
                {packageValue.evidence.files.length ? (
                  packageValue.evidence.files.map((file) => (
                    <a
                      key={file.id}
                      href={`/api/quality-case-evidence/${file.id}`}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                    >
                      <span className="truncate">{file.filename}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {file.associations
                          .map(
                            (association) =>
                              STAGE_LABELS[association.stage || ""] ||
                              association.stage,
                          )
                          .filter(Boolean)
                          .join("、") || "未关联阶段"}
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">没有供应商证据。</p>
                )}
              </div>
              {packageValue.investigation.missingInformation.length ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-900">仍缺少</p>
                  <ul className="mt-2 space-y-1 text-sm leading-5 text-amber-900">
                    {packageValue.investigation.missingInformation.map(
                      (item, index) => (
                        <li key={`${item.key}-${index}`}>• {item.reason}</li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-violet-600" />
                    <h3 className="font-semibold text-slate-950">
                      AI Quality Review
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Review Findings，不使用分数，也不替代人工判断。
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    busyAction === "review" ||
                    !workspace.permissions.canReview
                  }
                  onClick={() => void runReview()}
                >
                  {busyAction === "review" ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Bot className="size-3.5" />
                  )}
                  {workspace.reviewPersisted ? "重新审核" : "运行审核"}
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {(workspace.review?.findings || []).map((finding) => {
                  const presentation = findingPresentation(finding.status);
                  const Icon = presentation.icon;
                  return (
                    <div
                      key={finding.id}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          {AREA_LABELS[finding.area] || finding.area}
                        </span>
                        <Badge
                          variant="outline"
                          className={presentation.className}
                        >
                          <Icon className="size-3" /> {presentation.label}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        {finding.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {finding.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
              {workspace.review?.risks.length ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-950">
                    客户可能关注
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-5 text-amber-900">
                    {workspace.review.risks.map((risk) => (
                      <li key={risk}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-950">人工确认信息映射</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                AI 只提出“这段话可能属于什么”。由你确认、修改客户可用文本并选择证据；不会自动写 Report。
              </p>
              <div className="mt-4 space-y-2">
                {workspace.mappings.map((mapping) => (
                  <button
                    key={mapping.id}
                    type="button"
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedMappingId === mapping.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"}`}
                    onClick={() => chooseMapping(mapping)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-950">
                        {SEMANTIC_LABELS[mapping.semanticKey] ||
                          mapping.semanticKey}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          mapping.decision === "confirmed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {mapping.decision === "confirmed"
                          ? "已人工确认"
                          : "AI 建议"}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                      {mapping.answerText}
                    </p>
                  </button>
                ))}
              </div>
              {selectedMapping ? (
                <div className="mt-4 space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
                  <div className="space-y-1">
                    <Label htmlFor="mapping-target">确认用途</Label>
                    <select
                      id="mapping-target"
                      value={mappingSemanticKey}
                      onChange={(event) =>
                        setMappingSemanticKey(event.target.value)
                      }
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                    >
                      {SEMANTIC_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {SEMANTIC_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mapping-language">确认文本语言</Label>
                    <select
                      id="mapping-language"
                      value={mappingLanguage}
                      onChange={(event) =>
                        setMappingLanguage(event.target.value as "zh-CN" | "en")
                      }
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                    >
                      <option value="zh-CN">中文确认文本</option>
                      <option value="en">客户可用英文</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mapping-text">人工确认内容</Label>
                    <Textarea
                      id="mapping-text"
                      value={mappingText}
                      onChange={(event) => setMappingText(event.target.value)}
                      rows={5}
                    />
                    <p className="text-xs text-slate-500">
                      客户英文草稿只会使用选择“客户可用英文”并已确认的内容。
                    </p>
                  </div>
                  {packageValue.evidence.files.length ? (
                    <fieldset>
                      <legend className="text-xs font-medium text-slate-700">
                        允许此确认内容引用的证据
                      </legend>
                      <div className="mt-2 space-y-1">
                        {packageValue.evidence.files.map((file) => (
                          <label
                            key={file.id}
                            className="flex items-center gap-2 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={mappingEvidenceIds.includes(file.id)}
                              onChange={(event) =>
                                setMappingEvidenceIds((current) =>
                                  event.target.checked
                                    ? [...current, file.id]
                                    : current.filter((id) => id !== file.id),
                                )
                              }
                            />
                            {file.filename}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                  <Button
                    size="sm"
                    disabled={
                      busyAction === "mapping" ||
                      !mappingText.trim() ||
                      !workspace.permissions.canConfirmMapping
                    }
                    onClick={() => void confirmMapping()}
                  >
                    {busyAction === "mapping" ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    保存人工确认
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="border-indigo-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <ChevronRight className="size-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-950">
                  下一步应该做什么
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {recommendationText(workspace.review)}
              </p>
              {nextQuestions.length ? (
                <div className="mt-4 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-900">
                    建议追问
                  </p>
                  <ul className="mt-2 space-y-2 text-xs leading-5 text-amber-900">
                    {nextQuestions.map((question) => (
                      <li key={question}>• {question}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {workspace.qualityCase.status === "supplier_submitted" ? (
                <Button
                  className="mt-4 w-full"
                  disabled={
                    busyAction === "start_internal_review" ||
                    !workspace.permissions.canReview
                  }
                  onClick={() => void workflowAction("start_internal_review")}
                >
                  {busyAction === "start_internal_review" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ClipboardCheck className="size-4" />
                  )}
                  开始内部审核
                </Button>
              ) : (
                <div className="mt-4 space-y-2">
                  <Button
                    className="w-full"
                    disabled={
                      busyAction === "accept_for_customer_preparation" ||
                      !workspace.permissions.canReview
                    }
                    onClick={() =>
                      void workflowAction("accept_for_customer_preparation")
                    }
                  >
                    <CheckCircle2 className="size-4" />
                    接受并准备客户沟通
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={!workspace.permissions.canRequestSupplierUpdate}
                    onClick={() => {
                      setFollowUpMode("supplement");
                      setFollowUpQuestions(nextQuestions.join("\n"));
                    }}
                  >
                    <Send className="size-4" /> 要求供应商补充
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={!workspace.permissions.canRequestSupplierUpdate}
                    onClick={() => {
                      setFollowUpMode("reinvestigate");
                      setFollowUpQuestions(nextQuestions.join("\n"));
                    }}
                  >
                    <RotateCcw className="size-4" /> 要求重新调查
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {followUpMode ? (
            <Card className="border-amber-200">
              <CardContent className="p-5">
                <h3 className="font-semibold text-slate-950">
                  {followUpMode === "reinvestigate"
                    ? "要求供应商重新调查"
                    : "要求供应商补充"}
                </h3>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="follow-up-reason">为什么需要补充 *</Label>
                    <Textarea
                      id="follow-up-reason"
                      value={followUpReason}
                      onChange={(event) => setFollowUpReason(event.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="follow-up-questions">
                      需要供应商回答的问题 *
                    </Label>
                    <Textarea
                      id="follow-up-questions"
                      value={followUpQuestions}
                      onChange={(event) =>
                        setFollowUpQuestions(event.target.value)
                      }
                      rows={5}
                      placeholder="每行一个问题"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="follow-up-fields">关联区域</Label>
                    <Input
                      id="follow-up-fields"
                      value={followUpFields}
                      onChange={(event) => setFollowUpFields(event.target.value)}
                      placeholder="例如 root_cause, verification"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="follow-up-due">供应商截止时间 *</Label>
                    <Input
                      id="follow-up-due"
                      type="datetime-local"
                      value={followUpDueAt}
                      onChange={(event) => setFollowUpDueAt(event.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFollowUpMode(null)}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      disabled={
                        busyAction === "supplier-update" ||
                        !followUpReason.trim() ||
                        !followUpQuestions.trim() ||
                        !followUpDueAt
                      }
                      onClick={() => void requestUpdate()}
                    >
                      {busyAction === "supplier-update" ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      创建补充任务
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {supplierLink ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-emerald-950">
                  供应商补充链接已创建
                </h3>
                <Input
                  className="mt-3 bg-white"
                  value={supplierLink}
                  readOnly
                  aria-label="Supplier follow-up link"
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-950">客户回复准备</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                只使用人工确认的英文映射和被选择的供应商证据。不会发送邮件或生成最终报告。
              </p>
              <select
                className="mt-3 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={draftFormat}
                onChange={(event) => setDraftFormat(event.target.value)}
              >
                <option value="english_email">英文客户邮件</option>
                <option value="8d_draft">8D Draft</option>
                <option value="corrective_action_summary">
                  Corrective Action Summary
                </option>
              </select>
              <p className="mt-2 text-xs text-slate-500">
                已确认映射：{confirmedMappings.length}
              </p>
              <Button
                className="mt-3 w-full"
                variant="outline"
                disabled={
                  busyAction === "draft" ||
                  !workspace.permissions.canBuildCustomerDraft
                }
                onClick={() => void buildDraft()}
              >
                {busyAction === "draft" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                生成客户草稿
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {customerDraft ? (
        <Card className="mt-5 border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-emerald-900">
              <FileText className="size-4" />
              <h3 className="font-semibold">客户沟通草稿 · 未发送</h3>
            </div>
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-emerald-200 bg-white p-4 font-sans text-sm leading-6 text-slate-800">
              {customerDraft}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
