import {
  docsTopics as docsTopicsEn,
  docsTopicUrl as docsTopicUrlEn,
  getDocsTopic as getDocsTopicEn,
  siteUrl,
} from "@/lib/marketing-content";
import type { DocsTopic } from "@/lib/marketing-content";

// Simplified Chinese translations for the 10 /docs topics (Batch 2c).
//
// Each entry mirrors the English source of truth in
// src/lib/marketing-content.ts (docsTopics): same slug, same number of steps,
// and the same callout intent. The copy is tool-only and only describes live
// product behavior: D0-D8 editing, evidence / attachments, PDF / Word / Excel
// and ZIP export, share links, Team roles / approval / locking / activity,
// Knowledge Base reuse, and the automated AI Quality Check. It never mentions
// the removed case-management, supplier-collaboration, manual-review, or
// custom-service positioning, and it makes no certainty claims.
//
// The slug list is registered in src/lib/i18n-routes.ts as ZH_DOCS_SLUGS so the
// language switcher can resolve /docs/<slug> <-> /zh/docs/<slug>.
// scripts/i18n-docs.test.ts keeps the two in sync.

export type DocsLocale = "en" | "zh";

export const docsTopicsZh: DocsTopic[] = [
  {
    slug: "getting-started",
    title: "快速开始",
    summary:
      "从产品真正支持的工作流开始：打开一条客户投诉或供应商问题，按顺序完成 D0-D8，附加证据，并导出正式交付物。免费版包含 3 份终身报告，所以第一次有价值的试用是完整做完一份真实报告，而不是浏览设置。",
    steps: [
      "从「免费开始」创建免费账户。",
      "打开仪表盘并新建 8D 报告。",
      "填写报告标题、产品、客户或供应商背景以及初始负责人。",
      "按 D0-D8 顺序推进，并随时保存证据与决策。",
      "只在报告可供评审后，再使用导出或分享。",
    ],
    callout: "注册验证邮件由 Resend 发送。验证码不会从服务器日志中读取。",
  },
  {
    slug: "create-report",
    title: "创建报告",
    summary:
      "报告应当从真实的投诉、缺陷、供应商问题或反复出现的内部问题开始。8D Reports 让报告保持结构化，使最终的 PDF、Word 或 Excel 文件在存在附件时能与附件一起交付。",
    steps: [
      "在仪表盘选择「新建报告」。",
      "输入简洁的标题，并在可用时填写报告编号或客户参考号。",
      "补充产品、批次、客户、供应商、优先级和负责人信息。",
      "保存报告，然后先完成 D0 和 D1，再撰写完整的问题描述。",
    ],
    callout: "除非客户或供应商要求单独回复，否则避免为同一问题重复开报告。",
  },
  {
    slug: "edit-d0-d8",
    title: "编辑 D0-D8",
    summary:
      "编辑器是为质量推理而设计，而不只是填表。请把围堵措施与纠正措施分开，并确保每一项 D5 措施都能追溯到经验证的 D4 原因。",
    steps: [
      "用 D0 确认范围与准备情况。",
      "用 D1 指定跨职能团队。",
      "用 D2 撰写可测量的问题描述。",
      "用 D3 制定临时围堵与客户保护措施。",
      "用 D4-D7 完成经验证的原因、纠正措施、验证与预防。",
      "在评审和客户接受后，用 D8 关闭报告。",
    ],
    callout: "如果缺少证据，就如实写明。不要编造测量数据、测试结果或批准记录。",
  },
  {
    slug: "attachments",
    title: "附件",
    summary:
      "附件让证据与其所支持的步骤保持关联。当照片、检验记录、测试文件和客户文件留在报告中，而不是散落在邮件往来里时，评审会更轻松。",
    steps: [
      "在编辑器中打开相关的 D 步骤。",
      "上传照片、检验表、日志或其他支持文件。",
      "清晰命名证据，让评审者知道每个文件证明了什么。",
      "在导出打包前检查附件列表。",
    ],
    callout: "不要上传无关的私人文件。附件应支持这份特定的 8D 报告。",
  },
  {
    slug: "export-and-zip",
    title: "导出与 ZIP 打包",
    summary:
      "导出用于正式交付。免费版报告可以导出带水印的 PDF，而 Pro、Team 以及单次导出可为所选报告解锁无水印 PDF、Word 和 Excel。",
    steps: [
      "导出前检查 D0-D8 内容与附件。",
      "当接收方需要固定的最终记录时，选择 PDF。",
      "当接收方需要可编辑文档时，选择 Word。",
      "当客户期望表格格式时，选择 Excel。",
      "存在附件时，使用按所选报告格式生成的 ZIP 包。",
    ],
    callout: "存在附件时，所选报告格式与附件文件会一起作为 ZIP 包下载。",
  },
  {
    slug: "sharing",
    title: "分享",
    summary:
      "分享让内部评审者、供应商或客户无需通过邮件传来传去不断变化的文件版本，就能查看报告。免费版分享为只读；可编辑分享在 Pro 和 Team 上提供。",
    steps: [
      "打开报告的分享设置。",
      "为客户或管理层评审选择只读分享。",
      "只有在协作者需要参与报告时才使用可编辑分享。",
      "撤销不再需要的链接。",
    ],
    callout: "除非接收方必须编辑报告，否则正式评审请使用只读链接。",
  },
  {
    slug: "team-workflow",
    title: "团队工作流",
    summary:
      "Team 面向需要共享报告控制权的小型质量团队，包含 5 个席位、共享工作区、角色、审批与锁定、修订版本以及活动历史。",
    steps: [
      "创建团队工作区并邀请成员。",
      "分配 Owner、Editor 或 Viewer 角色。",
      "在正式导出前使用评审与审批状态。",
      "当报告不应再被随意编辑时，将其锁定。",
      "通过修订版本和活动历史了解发生了什么变化。",
    ],
    callout: "Team 是一个轻量的 8D 响应与交付工作区，用于共享评审和控制。",
  },
  {
    slug: "plans-and-billing",
    title: "套餐与计费",
    summary:
      "免费版用于评估，Pro 用于日常个人交付，Team 用于共享质量管控，单次导出用于一份选定的报告。4.99 美元的单次导出可为一份报告解锁无水印 PDF、Word 和 Excel。",
    steps: [
      "用免费版创建最多 3 份终身报告。",
      "升级到 Pro 以获得不限数量的个人报告和正式导出。",
      "当多人需要共享工作区控制时选择 Team。",
      "只交付一份正式报告时使用单次导出。",
    ],
    callout: "定价金额与结账行为由产品计费流程处理，不因公开站点调整而改变。",
  },
  {
    slug: "security-and-data",
    title: "安全与数据",
    summary:
      "8D Reports 作为报告工作流与交付工作区，对产品表述保持谨慎。在更大范围推行到团队之前，应先审阅安全细节、分享行为、数据删除问题以及 AI 处理方式。",
    steps: [
      "使用角色与分享控制来限制谁可以查看或编辑报告。",
      "避免在报告中放入不必要的机密数据。",
      "在团队推行前审阅安全页面。",
      "账户级或工作区级的删除问题请联系支持。",
    ],
    callout: "不要把 AI 输出当作批准、认证或经验证的证据。",
  },
  {
    slug: "ai-quality-check",
    title: "AI 质量检查",
    summary:
      "AI 质量检查是用于保守评审报告的测试版助手。它可以标记可能的缺口、薄弱的推理或缺失的证据，但不会批准报告，也不会创造证据。",
    steps: [
      "在可用时，从报告中打开 AI 质量检查。",
      "结合实际证据审阅建议的缺口或风险。",
      "只有当建议有事实支持时才更新报告。",
      "最终决定仍由人工复核与批准负责。",
    ],
    callout: "如果缺少证据，正确的做法就是说明这一点。助手不得编造事实。",
  },
];

export const docsTopicsZhBySlug: Record<string, DocsTopic> = Object.fromEntries(
  docsTopicsZh.map((topic) => [topic.slug, topic]),
);

export const docsTopicZhSlugs: string[] = docsTopicsZh.map((topic) => topic.slug);

export function getDocsTopicZh(slug: string): DocsTopic | undefined {
  return docsTopicsZhBySlug[slug];
}

// Locale-aware accessors. The default locale stays "en" so existing English
// callers keep working unchanged.
export function getDocsTopics(locale: DocsLocale = "en"): DocsTopic[] {
  return locale === "zh" ? docsTopicsZh : docsTopicsEn;
}

export function getDocsTopic(
  slug: string,
  locale: DocsLocale = "en",
): DocsTopic | undefined {
  return locale === "zh" ? getDocsTopicZh(slug) : getDocsTopicEn(slug);
}

export function docsTopicUrl(slug: string, locale: DocsLocale = "en"): string {
  return locale === "zh" ? `${siteUrl}/zh/docs/${slug}` : docsTopicUrlEn(slug);
}
