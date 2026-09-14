import type { RevenueGeoResource } from "./revenue-geo-resources";

// Simplified Chinese translations for the 10 revenue GEO resources under
// /resources/* (Batch 2a). Each entry mirrors the English source of truth in
// src/content/revenue-geo-resources.ts: same slug, same intent, same number of
// proof points / checklist items / mistakes / table rows / sections / related
// links / FAQ items. targetQuery stays in English on purpose because it records
// the search query the page targets.
//
// CTA and related hrefs point at the Chinese route when one exists in
// ZH_ROUTE_MAP (/pricing, /sample-report, /ai-8d-report-check) or at the
// dynamic /zh/resources/<slug> route. Product routes without a Chinese version
// (/signup, /knowledge, /8d-report-template, demo reports, and so on) stay in
// English. No metrics, customer stories, or certainty claims are invented here.
//
// The slug list is registered in src/lib/i18n-routes.ts as ZH_RESOURCE_SLUGS so
// the language switcher can resolve /resources/<slug> <-> /zh/resources/<slug>.
// scripts/i18n-resources.test.ts keeps the two in sync.

export const revenueGeoResourcesZhBySlug: Record<string, RevenueGeoResource> = {
  "how-to-write-8d-report-customer-complaint": {
    slug: "how-to-write-8d-report-customer-complaint",
    title: "如何为客户投诉编写 8D 报告",
    metaTitle: "如何为客户投诉编写 8D 报告",
    metaDescription:
      "使用 D0-D8 结构编写客户投诉 8D 报告：围堵、根本原因、纠正措施、验证、预防以及常见错误。",
    h1: "如何为客户投诉编写 8D 报告",
    targetQuery: "how to write an 8D report for customer complaint",
    intent: "informational",
    category: "客户投诉",
    answer:
      "为客户投诉编写 8D 报告时，先写清可测量的问题描述，用围堵措施保护客户，验证发生原因与流出原因，选择与这些原因匹配的纠正措施，验证措施有效性，更新预防控制，最后以经验教训收尾。",
    proofElements: [
      "投诉编号、产品、批次、日期和受影响数量",
      "围堵范围与验证方法",
      "根本原因证据、措施责任人、验证结果和关闭记录",
    ],
    checklist: [
      "用可测量的方式记录客户反馈的现象。",
      "界定可疑产品、库存、发货批次和生产时间窗口。",
      "将立即围堵与永久纠正措施分开记录。",
      "用证据验证发生原因和流出原因。",
      "让每条 D5 措施对应到已验证的 D4 原因。",
      "写明 D6 的验证方法、样本、结果和监控周期。",
      "更新 D7 控制并沉淀 D8 经验，方便下一个团队复用。",
    ],
    mistakes: [
      "现象描述笼统，缺少数量、地点、时间或规格。",
      "把挑选或返工当作永久纠正措施。",
      "跳过流出原因，只解释缺陷为什么发生。",
      "验证只写日期，没有结果或样本量。",
    ],
    table: {
      title: "客户投诉 8D 结构",
      columns: ["步骤", "写什么", "附什么证据"],
      rows: [
        ["D2", "发生了什么、在哪里、何时、多少数量、由谁发现。", "投诉、照片、检验数据"],
        ["D3", "在调查原因期间如何保护客户。", "挑选记录、库存冻结清单"],
        ["D4", "经证据验证的发生原因和流出原因。", "5 Why、测试记录、过程记录"],
        ["D5-D6", "永久措施与有效性验证。", "措施计划、审核或测试结果"],
        ["D7-D8", "体系更新、经验教训、关闭与认可。", "控制计划、培训、关闭说明"],
      ],
    },
    sections: [
      {
        title: "先讲清客户风险",
        body:
          "客户投诉 8D 应先说明客户影响，再讨论原因。记录客户发现了什么、涉及哪些产品或发货批次，以及团队将如何保护在途货物。",
      },
      {
        title: "围堵与纠正要分开",
        body:
          "围堵是临时保护，纠正措施改变的是产生问题的过程或体系。把两者混在一起，报告看起来很快，但底气不足。",
      },
      {
        title: "把响应放进共享工作区",
        body:
          "每个投诉都用同一套 D0-D8 结构，评审人比较的是证据，而不是反复调整文档格式。免费创建报告，并在团队推进围堵、原因、措施和验证的过程中持续补充证据。",
      },
    ],
    primaryCta: {
      label: "免费创建报告",
      href: "/signup",
      eventName: "marketing_cta_clicked",
      eventData: { cta: "signup" },
    },
    secondaryCta: { label: "查看报告示例", href: "/zh/sample-report" },
    relatedLinks: [
      { label: "客户投诉 8D 示例", href: "/8d-report-example/customer-complaint" },
      { label: "演示报告", href: "/demo-reports" },
      { label: "8D 报告模板", href: "/8d-report-template" },
    ],
    faq: [
      {
        question: "客户投诉 8D 开头 80 个字应该回答什么？",
        answer:
          "应回答发生了什么、由谁发现、涉及哪个产品或批次、当前启用了哪些围堵措施，以及团队接下来要验证什么。",
      },
      {
        question: "AI 能帮我写 8D 响应吗？",
        answer:
          "AI 可以帮助检查缺口，但不应编造证据、批准报告或替代工程判断。",
      },
    ],
  },
  "supplier-corrective-action-request-template": {
    slug: "supplier-corrective-action-request-template",
    title: "供应商纠正措施请求（SCAR）模板",
    metaTitle: "供应商纠正措施请求模板 | SCAR 响应",
    metaDescription:
      "使用实用的供应商纠正措施请求模板：SCAR 字段、8D 映射、围堵、根本原因、纠正措施和关闭标准。",
    h1: "面向客户级 SCAR 响应的供应商纠正措施请求模板",
    targetQuery: "supplier corrective action request template",
    intent: "template",
    category: "SCAR",
    answer:
      "供应商纠正措施请求应要求供应商说明缺陷描述、影响范围、立即围堵、根本原因、纠正措施、有效性验证、预防更新、责任人、截止日期和关闭证据。对于严重问题，响应可以采用 8D 结构。",
    proofElements: [
      "供应商批次、采购订单、图纸或规格编号",
      "围堵记录与合格库存判定",
      "措施责任人、验证数据和关闭标准",
    ],
    checklist: [
      "写明不合格项和要求的回复日期。",
      "要求供应商识别受影响库存和已发货批次。",
      "在永久措施完成前先要求围堵。",
      "把发生原因与流出或检测原因分开。",
      "要求提供措施责任人、截止日期和验证证据。",
      "在接收响应前先定义关闭标准。",
    ],
    mistakes: [
      "缺陷定义不清就要求提交纠正措施。",
      "没有验证证据就接受供应商的承诺。",
      "过程原因仍在，却把增加检验步骤当作预防。",
      "受影响库存尚未核对就关闭 SCAR。",
    ],
    table: {
      title: "SCAR 字段与 8D 逻辑的映射",
      columns: ["SCAR 字段", "对应的 8D 步骤", "评审问题"],
      rows: [
        ["问题描述", "D2", "缺陷是否可测量且范围清晰？"],
        ["围堵", "D3", "客户现在是否得到保护？"],
        ["根本原因", "D4", "原因是否经过验证，而不是猜测？"],
        ["纠正措施", "D5-D6", "验证是否证明措施有效？"],
        ["预防", "D7-D8", "供应商能否防止再次发生？"],
      ],
    },
    sections: [
      {
        title: "用请求来控制响应",
        body:
          "SCAR 模板不只是一张空白表格。它应明确告诉供应商，在响应被接受前必须提供哪些证据。",
      },
      {
        title: "让评审标准保持可见",
        body:
          "质量团队应事先定义什么算合格的围堵、根本原因、验证和关闭。这样可以避免供应商提交薄弱响应后反复返工。",
      },
      {
        title: "在一个地方跟踪 SCAR 响应",
        body:
          "把请求、围堵、根本原因、措施、验证和关闭证据关联到同一条记录，而不是一串群发邮件。当需要共享评审或 SCAR 数量增加时，可以对比不同方案。",
      },
    ],
    primaryCta: {
      label: "对比方案",
      href: "/zh/pricing",
      eventName: "marketing_cta_clicked",
      eventData: { cta: "pricing" },
    },
    secondaryCta: { label: "下载演示报告", href: "/demo-reports/automotive" },
    relatedLinks: [
      { label: "供应商 8D 报告", href: "/supplier-8d-report" },
      { label: "汽车行业演示报告", href: "/demo-reports/automotive" },
      { label: "定价与方案", href: "/zh/pricing" },
    ],
    faq: [
      {
        question: "SCAR 和 8D 是一回事吗？",
        answer:
          "不一定。SCAR 是要求供应商采取纠正措施的请求；8D 是一种结构化响应格式，可以满足许多 SCAR 请求。",
      },
      {
        question: "供应商需要附上附件吗？",
        answer:
          "通常需要。检验记录、照片、测试数据和更新后的控制文件，能帮助评审人判断响应是否可信。",
      },
    ],
  },
  "8d-vs-scar": {
    slug: "8d-vs-scar",
    title: "8D 与 SCAR：何时使用哪种纠正措施格式",
    metaTitle: "8D 与 SCAR | 纠正措施与供应商响应",
    metaDescription:
      "对比 8D 与 SCAR 流程、各自适用场景，以及在提交客户前响应中应包含哪些证据。",
    h1: "8D 与 SCAR：供应商请求何时升级为完整的 8D 响应",
    targetQuery: "8D vs SCAR",
    intent: "comparison",
    category: "对比",
    answer:
      "SCAR 是供应商纠正措施请求，8D 是结构化的问题解决报告。用 SCAR 发起并跟踪供应商响应；当问题需要围堵、根本原因分析、纠正措施、验证、预防和关闭证据时，使用 8D。",
    proofElements: [
      "请求范围与截止日期",
      "D0-D8 证据包或供应商响应表",
      "关闭标准与评审决定",
    ],
    checklist: [
      "要求供应商回应缺陷或审核发现时，使用 SCAR。",
      "响应需要结构化围堵和根本原因证据时，使用 8D。",
      "明确客户期望的是特定表格还是完整的 8D 材料包。",
      "跟踪责任人、截止日期、评审状态和关闭证据。",
      "保留经验教训，用于后续供应商质量问题。",
    ],
    mistakes: [
      "把 SCAR 当作没有关闭标准的笼统邮件请求。",
      "对简单问题也要求完整 8D，而更简单的纠正已经足够。",
      "把围堵当作最终纠正措施接受。",
      "关闭后忘记更新供应商控制。",
    ],
    table: {
      title: "8D 与 SCAR 对比",
      columns: ["决策点", "SCAR", "8D"],
      rows: [
        ["主要目的", "要求供应商采取纠正措施", "记录完整的问题解决逻辑"],
        ["适用场景", "供应商不合格或审核发现", "客户投诉或重复性缺陷"],
        ["证据", "供应商响应与关闭证明", "D0-D8 证据与验证"],
        ["评审", "SQE 或客户质量评审", "跨职能报告评审"],
        ["输出", "被接受或退回的供应商响应", "可直接提交客户的纠正措施报告"],
      ],
    },
    sections: [
      {
        title: "SCAR 是请求，8D 往往是响应",
        body:
          "客户可能发出 SCAR，并要求供应商用 8D 格式回复。把两者区分清楚，有助于团队同时管理请求流程和响应内容。",
      },
      {
        title: "用与风险匹配的格式",
        body:
          "当问题存在客户影响、复发风险、原因不明或需要验证时，完整的 8D 更有价值。较简单的问题可能只需有针对性的纠正措施响应。",
      },
      {
        title: "先选工作流，再导出响应",
        body:
          "请求格式和响应格式是两个独立决定。在结构化编辑器中搭建响应，并先查看报告示例，确认所需细节再开始。",
      },
    ],
    primaryCta: {
      label: "查看报告示例",
      href: "/zh/sample-report",
      eventName: "marketing_cta_clicked",
      eventData: { cta: "sample_report" },
    },
    secondaryCta: { label: "查看供应商 8D", href: "/supplier-8d-report" },
    relatedLinks: [
      { label: "供应商纠正措施模板", href: "/zh/resources/supplier-corrective-action-request-template" },
      { label: "纠正措施报告模板", href: "/corrective-action-report-template" },
      { label: "定价", href: "/zh/pricing" },
    ],
    faq: [
      {
        question: "8D 报告可以作为 SCAR 响应吗？",
        answer: "可以，前提是客户或 SQE 接受以 8D 作为供应商纠正措施响应。",
      },
      {
        question: "8D Reports 是否声称能替代完整的 QMS？",
        answer:
          "不能。它聚焦于 8D、SCAR 响应、证据、工作流和导出，并不是完整的 QMS。",
      },
    ],
  },
  "excel-8d-template-vs-8d-software": {
    slug: "excel-8d-template-vs-8d-software",
    title: "Excel 8D 模板与在线 8D 软件对比",
    metaTitle: "Excel 8D 模板与 8D 软件对比 | 何时迁移到在线",
    metaDescription:
      "从证据、版本控制、导出、团队协作和可复用的质量知识等方面，对比 Excel 8D 模板与在线 8D 软件。",
    h1: "Excel 8D 模板与在线 8D 软件对比",
    targetQuery: "Excel 8D template vs 8D software",
    intent: "comparison",
    category: "Excel 替代",
    answer:
      "对于单份报告，Excel 8D 模板上手快、也熟悉；当报告需要证据附件、受控共享、修订历史、可直接导出的交付、团队评审，以及复用以往根本原因或纠正措施时，在线 8D 软件更合适。",
    proofElements: [
      "文件控制风险对比",
      "导出与附件工作流",
      "复用与知识库工作流",
    ],
    checklist: [
      "一次性的内部工作表、评审风险低时，继续用 Excel。",
      "当附件、版本和客户级导出变得重要时，迁移到在线。",
      "当多人评审或更新报告时，迁移到在线。",
      "当类似问题反复出现、以往措施需要可检索时，迁移到在线。",
      "从完成的报告直接导出 PDF、Word 或 Excel，而不是重新排版。",
    ],
    mistakes: [
      "多份电子表格通过邮件传来传去，丢失唯一可信版本。",
      "照片和测试数据散落在不同文件夹，报告无法追溯。",
      "因为客户要求特殊格式，就干脆放弃工作流。",
      "直到重复缺陷出现，才想到历史检索。",
    ],
    table: {
      title: "Excel 模板与在线工作流对比",
      columns: ["需求", "Excel 模板", "在线 8D 软件"],
      rows: [
        ["单份草稿", "快速、熟悉", "同样可用，但结构更清晰"],
        ["附件", "常常分散", "按报告步骤存储"],
        ["评审", "依赖人工文件管理", "角色、工作流和活动历史"],
        ["导出", "可定制但脆弱", "PDF、Word、Excel 和 ZIP 输出"],
        ["复用", "难以检索", "完成的报告成为知识资产"],
      ],
    },
    sections: [
      {
        title: "Excel 不是敌人",
        body:
          "许多团队从 Excel 开始，因为它随手可得、足够灵活。问题往往出现在文件、证据、修订和客户导出被拆散到邮件和共享文件夹之后。",
      },
      {
        title: "当质量知识重要时，在线工作流更有价值",
        body:
          "报告完成后，它的根本原因、纠正措施、验证、预防和经验教训，能帮助下一位同事不必从零开始。",
      },
      {
        title: "从静态文件转向受控工作流",
        body:
          "当附件、修订、评审和导出变得重要时，使用在线编辑器。对比不同方案，看看哪个版本包含用于日常交付的 Word 和 Excel 导出。",
      },
    ],
    primaryCta: {
      label: "对比方案",
      href: "/zh/pricing",
      eventName: "marketing_cta_clicked",
      eventData: { cta: "pricing" },
    },
    secondaryCta: { label: "对比方案", href: "/zh/pricing" },
    relatedLinks: [
      { label: "演示报告下载", href: "/demo-reports" },
      { label: "8D 报告模板", href: "/8d-report-template" },
      { label: "知识库", href: "/knowledge" },
    ],
    faq: [
      {
        question: "我还能从 8D Reports 导出 Excel 吗？",
        answer:
          "可以。演示报告包含 Excel 下载，正式报告导出可按方案权限包含 Excel。",
      },
      {
        question: "能否支持公司特定的 Excel 版式？",
        answer:
          "把所需字段映射到 D0-D8 结构中，再从完成的报告导出 Excel。标准 Word 和 Excel 输出按方案提供。",
      },
    ],
  },
  "custom-8d-template-setup-guide": {
    slug: "custom-8d-template-setup-guide",
    title: "自定义 8D 报告格式指南",
    metaTitle: "自定义 8D 报告格式指南 | Word、Excel 与 PDF 输出",
    metaDescription:
      "利用内置的 D0-D8 结构、按步骤附件，以及 PDF、Word 或 Excel 导出选项，规划自定义 8D 报告格式。",
    h1: "自定义 8D 报告格式指南",
    targetQuery: "custom 8D report format",
    intent: "template",
    category: "报告格式",
    answer:
      "自定义 8D 报告格式从客户期望的字段、每个步骤需要的证据，以及你交付的文件类型开始。使用内置的 D0-D8 编辑器搭建结构，把证据附在相关步骤，再从完成的报告导出 PDF、Word 或 Excel。",
    proofElements: [
      "客户要求的字段和审批措辞",
      "每个 D0-D8 步骤需要的证据",
      "交付格式：PDF、Word、Excel 或 ZIP 压缩包",
    ],
    checklist: [
      "列出客户要求的字段、签字和审批措辞。",
      "把每个必填字段映射到对应的 D0-D8 章节。",
      "确定哪些证据应放在 D3、D4、D6 和 D7。",
      "选择交付格式：PDF、Word、Excel，或带附件的 ZIP。",
      "用一个真实的过往问题检验结构是否易读。",
      "让完成的报告保持可检索，使格式长期保持一致。",
    ],
    mistakes: [
      "照搬客户表格，却没有逐一核对必填字段是否覆盖。",
      "把证据留在单独的文件夹里，而没有附到它支撑的步骤。",
      "在 D0-D8 内容完成前就开始排版。",
      "以为通用导出无需核对就能匹配每个客户的版式。",
    ],
    table: {
      title: "规划报告格式",
      columns: ["输入", "为什么重要", "示例"],
      rows: [
        ["客户字段", "体现必需的章节和措辞", "SCAR 抬头与审批区块"],
        ["按步骤的证据", "让附件可追溯", "D3 的照片、D6 的测试数据"],
        ["交付格式", "决定导出路径", "客户 PDF 加 Excel 措施表"],
        ["工作流角色", "界定谁评审、谁导出", "负责人、编辑者、查看者"],
        ["示例问题", "用真实内容检验结构", "最近一次客户投诉"],
      ],
    },
    sections: [
      {
        title: "先结构，后排版",
        body:
          "可读的 8D 需要先有完整的 D0-D8 内容，再考虑版式。先填写结构化字段，然后选择与客户期望一致的导出格式。",
      },
      {
        title: "让证据紧跟它支撑的步骤",
        body:
          "附件放在所支撑的 D 步骤下，比放在单独文件夹里更容易评审。ZIP 交付包会把报告和附件放在一起。",
      },
      {
        title: "对比方案以确认导出权限",
        body:
          "标准 PDF、Word 和 Excel 输出取决于你的方案。对比方案，看看哪个版本包含客户要求的交付格式，或者先免费创建报告，体验一下工作流。",
      },
    ],
    primaryCta: {
      label: "免费创建报告",
      href: "/signup",
      eventName: "marketing_cta_clicked",
      eventData: { cta: "signup" },
    },
    secondaryCta: { label: "对比方案", href: "/zh/pricing" },
    relatedLinks: [
      { label: "导出帮助", href: "/help/export-pdf-word-excel-zip" },
      { label: "Excel 与在线软件对比", href: "/zh/resources/excel-8d-template-vs-8d-software" },
      { label: "报告示例", href: "/zh/sample-report" },
    ],
    faq: [
      {
        question: "我可以用客户要求的格式吗？",
        answer:
          "把客户要求的字段映射到 D0-D8 章节，附上相应证据，再按方案将完成的报告导出为 PDF、Word 或 Excel。",
      },
      {
        question: "开始前需要上传文件吗？",
        answer:
          "不需要。先使用内置的 D0-D8 结构，在处理真实报告的过程中补充所需字段和证据。",
      },
    ],
  },
  "ai-8d-report-checker": {
    slug: "ai-8d-report-checker",
    title: "AI 8D 报告检查器",
    metaTitle: "AI 8D 报告检查器 | 保守的质量评审",
    metaDescription:
      "保守地使用 AI 8D 报告检查器，发现根本原因、纠正措施、验证、预防和证据中的缺口，而不编造事实。",
    h1: "用于保守质量评审的 AI 8D 报告检查器",
    targetQuery: "AI 8D report checker",
    intent: "commercial",
    category: "AI 质量检查",
    answer:
      "AI 8D 报告检查器应帮助识别缺口、薄弱证据、缺失的验证、不清晰的根本原因和预防风险。它不应批准报告、认证响应、编造证据，也不应替代质量工程师的评审。",
    proofElements: [
      "已保存的报告内容和可见的证据摘要",
      "针对 D4-D7 的评审问题清单",
      "标记缺口而非编造答案的安全输出",
    ],
    checklist: [
      "检查 D2 是否可测量。",
      "检查 D4 是否区分发生原因与流出原因。",
      "检查 D5 措施是否可追溯到已验证的原因。",
      "检查 D6 验证是否包含方法、样本和结果。",
      "检查 D7 预防是否更新了体系，而不只是零件。",
      "把 AI 发现当作评审提示，而不是最终批准。",
    ],
    mistakes: [
      "让 AI 编造缺失的根本原因证据。",
      "把 AI 输出当作客户批准。",
      "因为 AI 摘要读起来通顺，就忽略附件或测试记录。",
      "用 AI 掩盖薄弱的验证，而不是改进它。",
    ],
    table: {
      title: "安全的 AI 评审边界",
      columns: ["AI 可以帮助", "AI 不可以做", "人工负责人"],
      rows: [
        ["找出缺失字段", "编造测量数据", "质量工程师"],
        ["标记薄弱的原因/措施逻辑", "批准根本原因", "过程负责人"],
        ["提示评审问题", "认证客户接受", "报告负责人"],
        ["对照可复用知识进行比较", "盲目照搬历史", "团队评审人"],
        ["汇总缺口", "替代证据", "质量经理"],
      ],
    },
    sections: [
      {
        title: "把 AI 当评审者，而不是证据作者",
        body:
          "有用的 AI 检查应让报告更难被糊弄，而不是更容易注水。它应指出缺失的证据和不清晰的推理。",
      },
      {
        title: "知识上下文可以提升评审质量",
        body:
          "历史完成的报告能揭示重复出现的模式和预防思路，但它们只是参考上下文。当前报告仍然需要自己的证据。",
      },
      {
        title: "在报告编辑器内运行检查",
        body:
          "AI 质量检查会针对已保存的报告内容，查找缺失证据、薄弱的原因/措施关联和不清晰的验证。免费创建报告，即可对草稿运行检查。",
      },
    ],
    primaryCta: {
      label: "免费开始",
      href: "/signup",
      eventName: "marketing_cta_clicked",
      eventData: { cta: "signup" },
    },
    secondaryCta: { label: "查看 AI 报告检查", href: "/zh/ai-8d-report-check" },
    relatedLinks: [
      { label: "AI 8D 报告检查", href: "/zh/ai-8d-report-check" },
      { label: "知识库", href: "/knowledge" },
      { label: "报告示例", href: "/zh/sample-report" },
    ],
    faq: [
      {
        question: "AI 能批准 8D 报告吗？",
        answer:
          "不能。AI 可以标记评审问题，但批准始终是质量人员和客户的决定。",
      },
      {
        question: "AI 应该补写缺失的验证结果吗？",
        answer: "不应该。缺失的验证应显示为数据缺失，而不是编造文本。",
      },
    ],
  },
  "8d-root-cause-d4-guide": {
    slug: "8d-root-cause-d4-guide",
    title: "8D 报告的 D4 根本原因指南",
    metaTitle: "D4 根本原因指南 | 8D 中的发生原因与流出原因",
    metaDescription:
      "通过区分发生原因、流出原因、证据、5 Why 逻辑和纠正措施可追溯性，写出更有力的 D4 根本原因章节。",
    h1: "8D 报告的 D4 根本原因指南",
    targetQuery: "how to complete D4 root cause in 8D",
    intent: "informational",
    category: "D4 根本原因",
    answer:
      "D4 应识别并验证缺陷为什么发生，以及现有控制为什么没有检测到。有力的 D4 会把发生原因与流出原因分开，让每个原因都有证据支撑，并为 D5 纠正措施做好准备。",
    proofElements: [
      "5 Why 或鱼骨图分析",
      "过程记录、检验数据、测试结果和照片",
      "原因验证方法与已排除的备选原因",
    ],
    checklist: [
      "在分析原因前，先复述 D2 的问题描述。",
      "分别识别发生原因和流出原因。",
      "按需使用 5 Why、鱼骨图、数据回顾或过程审核。",
      "记录哪些证据确认了每个原因。",
      "列出已核查并排除的备选原因。",
      "确保 D5 措施可追溯到 D4 原因。",
    ],
    mistakes: [
      "只停留在操作员失误，没有体系或过程证据。",
      "写出的原因只是重复现象。",
      "忽略流出原因。",
      "在原因验证之前就选定纠正措施。",
    ],
    table: {
      title: "发生原因与流出原因",
      columns: ["原因类型", "问题", "示例证据"],
      rows: [
        ["发生", "缺陷为什么会发生？", "设置记录、过程审核、测试数据"],
        ["流出", "为什么没有被检测到？", "检验清单、控制限、审核缺口"],
        ["体系", "为什么这个薄弱点会重复？", "控制计划或培训缺口"],
        ["备选", "排除了什么？", "测试结果或过程对比"],
        ["关联 D5", "什么措施针对这个原因？", "措施计划可追溯性"],
      ],
    },
    sections: [
      {
        title: "只有发生原因还不够",
        body:
          "面向客户的 8D 报告如果只解释缺陷为什么发生，却不解释为什么流出，往往显得薄弱。当检测失效时，D4 需要同时说明两者。",
      },
      {
        title: "证据胜过流畅的措辞",
        body:
          "一条简短但有真实过程证据的原因，比没有验证的长篇叙述更有力。让推理过程可追溯。",
      },
      {
        title: "先验证原因，再写措施",
        body:
          "当每个原因都关联到证据时，D4 章节才更有力。查看报告示例，对比发生原因、流出原因和确认方式是如何呈现的。",
      },
    ],
    primaryCta: {
      label: "查看完整示例",
      href: "/zh/sample-report",
      eventName: "demo_report_downloaded",
      eventData: { source: "d4_resource" },
    },
    secondaryCta: { label: "搜索知识库", href: "/knowledge" },
    relatedLinks: [
      { label: "5 Why 模板", href: "/5-why-root-cause-template" },
      { label: "5 Why 示例", href: "/5-why-example/customer-complaint" },
      { label: "D5 纠正措施指南", href: "/zh/resources/8d-corrective-action-d5-guide" },
    ],
    faq: [
      {
        question: "D4 是否应同时包含发生原因和流出原因？",
        answer:
          "当缺陷到达客户或下游工序时，通常是的。发生原因解释为什么发生，流出原因解释控制为什么漏掉。",
      },
      {
        question: "必须使用 5 Why 吗？",
        answer:
          "不一定，但报告应展示一种可追溯的方法来验证根本原因。",
      },
    ],
  },
  "8d-corrective-action-d5-guide": {
    slug: "8d-corrective-action-d5-guide",
    title: "8D 报告的 D5 纠正措施指南",
    metaTitle: "D5 纠正措施指南 | 让措施对应根本原因",
    metaDescription:
      "通过把每条措施关联到已验证的根本原因、责任人、截止日期、风险和验证计划，写出更有力的 D5 纠正措施。",
    h1: "8D 报告的 D5 纠正措施指南",
    targetQuery: "how to complete D5 corrective action in 8D",
    intent: "informational",
    category: "D5 纠正措施",
    answer:
      "D5 应选择针对已验证 D4 根本原因的永久纠正措施。每条措施都需要责任人、截止日期、预期效果、风险评审，以及 D6 验证计划。",
    proofElements: [
      "D4 原因到措施的可追溯性",
      "责任人、截止日期和实施计划",
      "风险评审与验证方法",
    ],
    checklist: [
      "把已验证的 D4 原因带入措施评审。",
      "定义一条或多条直接针对该原因的措施。",
      "指定责任人和截止日期。",
      "说明预期的过程变更或控制改进。",
      "评审副作用和实施风险。",
      "定义 D6 将如何证明措施有效。",
    ],
    mistakes: [
      "所有问题都靠培训解决，却不修复过程薄弱点。",
      "列出的措施无法追溯到已验证的根本原因。",
      "责任人或截止日期留空。",
      "拖到实施之后才考虑验证计划。",
    ],
    table: {
      title: "D5 措施选择表",
      columns: ["根本原因", "纠正措施", "验证思路"],
      rows: [
        ["夹具检查被跳过", "换线必须签核", "审核三次重启"],
        ["检验清单缺少边缘检查", "增加边缘附着力检查", "复查出货检验记录"],
        ["刀具磨损取样太少", "提高取样频率", "连续三个批次 Cpk 高于目标"],
        ["配方未经批准被更改", "锁定配方编辑", "30 天内无未批准编辑"],
        ["供应商控制计划缺口", "更新供应商控制计划", "每月 SPC 证据"],
      ],
    },
    sections: [
      {
        title: "纠正措施应改变体系",
        body:
          "有力的 D5 措施会消除或控制原因。除非已验证的真正原因只是行为问题且有相应控制支撑，否则它不应只是一句笼统的提醒。",
      },
      {
        title: "在结束 D5 前先规划 D6",
        body:
          "如果团队说不清措施将如何验证，这条措施可能过于笼统，或与原因脱节。",
      },
      {
        title: "让每条措施对应已验证的原因",
        body:
          "把 D5 措施与已确认的原因、责任人和截止日期绑定，并在报告进入评审前规划 D6 验证。免费创建报告，搭建措施和验证字段。",
      },
    ],
    primaryCta: {
      label: "免费创建报告",
      href: "/signup",
      eventName: "marketing_cta_clicked",
      eventData: { cta: "signup" },
    },
    secondaryCta: { label: "查看 D4 指南", href: "/zh/resources/8d-root-cause-d4-guide" },
    relatedLinks: [
      { label: "报告示例", href: "/zh/sample-report" },
      { label: "纠正措施模板", href: "/corrective-action-report-template" },
      { label: "D6 验证指南", href: "/zh/resources/8d-validation-d6-guide" },
    ],
    faq: [
      {
        question: "围堵可以作为 D5 纠正措施吗？",
        answer:
          "围堵属于 D3。D5 应针对已验证的永久原因，除非围堵正在转化为受控的过程变更。",
      },
      {
        question: "一份 8D 应该有多少条 D5 措施？",
        answer:
          "以覆盖已验证的发生原因和流出原因为准，够用即可，但避免无关的措施清单。",
      },
    ],
  },
  "8d-validation-d6-guide": {
    slug: "8d-validation-d6-guide",
    title: "8D 报告的 D6 验证指南",
    metaTitle: "D6 验证指南 | 证明纠正措施有效",
    metaDescription:
      "用实施证据、方法、样本量、结果、监控周期和剩余风险，记录面向客户的 8D 报告中的 D6 验证。",
    h1: "8D 报告的 D6 验证指南",
    targetQuery: "D6 validation in 8D report",
    intent: "informational",
    category: "D6 验证",
    answer:
      "D6 应表明纠正措施已经实施且有效。要写明改了什么、何时改的、由谁验证、验证方法、样本量或周期、实际结果，以及任何剩余风险或后续监控。",
    proofElements: [
      "实施记录与责任人",
      "验证方法、样本量、日期范围和结果",
      "后续监控或审核记录",
    ],
    checklist: [
      "确认纠正措施已按计划实施。",
      "在宣布成功之前先记录验证方法。",
      "写明样本量、日期范围或监控周期。",
      "展示实际结果，而不仅是完成状态。",
      "说明是否还有后续监控尚未结束。",
      "附上测试、审核、检验或生产证据。",
    ],
    mistakes: [
      "只写已实施，却不展示有效性。",
      "用一个已检查的零件，证明整个过程的变更。",
      "验证周期含糊不清。",
      "忘记同时验证发生控制和流出控制。",
    ],
    table: {
      title: "D6 验证证据",
      columns: ["措施类型", "验证方法", "更有力的证据"],
      rows: [
        ["过程检查表", "分层审核", "三次审核重启均无遗漏"],
        ["检验更新", "记录复查", "针对受影响特征的出货检查"],
        ["供应商控制", "来料批次复查", "三个合格批次加 SPC 数据"],
        ["设备设置", "能力运行", "Cpk 或缺陷率趋势"],
        ["培训", "现场观察", "操作员签核加审核结果"],
      ],
    },
    sections: [
      {
        title: "验证不只是实施",
        body:
          "实施说明团队做了这条措施，验证说明措施在真实条件下确实有效。",
      },
      {
        title: "为措施匹配恰当的证据",
        body:
          "培训类措施可能需要观察和审核；过程变更可能需要缺陷率趋势或能力证据。让证据与风险相匹配。",
      },
      {
        title: "展示证据，而不只是完成",
        body:
          "记录每条措施的方法、样本或周期和实际结果，让评审人能够判断有效性。查看报告示例，了解简洁的 D6 证据应如何呈现。",
      },
    ],
    primaryCta: {
      label: "下载演示材料包",
      href: "/demo-reports",
      eventName: "demo_report_downloaded",
      eventData: { source: "d6_resource" },
    },
    secondaryCta: { label: "查看报告示例", href: "/zh/sample-report" },
    relatedLinks: [
      { label: "D5 纠正措施指南", href: "/zh/resources/8d-corrective-action-d5-guide" },
      { label: "汽车行业演示报告", href: "/demo-reports/automotive" },
      { label: "8D 报告模板", href: "/8d-report-template" },
    ],
    faq: [
      {
        question: "D5 和 D6 有什么区别？",
        answer: "D5 选择纠正措施，D6 实施并验证这些措施确实有效。",
      },
      {
        question: "D6 需要样本量吗？",
        answer:
          "对许多制造问题来说需要。如果样本量不适用，就改为记录监控周期或审核范围。",
      },
    ],
  },
  "8d-lessons-learned-d8-guide": {
    slug: "8d-lessons-learned-d8-guide",
    title: "8D 报告的 D8 经验教训指南",
    metaTitle: "D8 经验教训指南 | 预防与知识复用",
    metaDescription:
      "用 D7 预防和 D8 经验教训关闭 8D 报告，为未来的根本原因和纠正措施工作保留可复用的知识。",
    h1: "面向可复用 8D 知识的 D8 经验教训指南",
    targetQuery: "D8 lessons learned in 8D report",
    intent: "informational",
    category: "D8 经验教训",
    answer:
      "D8 应通过确认措施、沉淀经验教训、认可团队，并让完成的 8D 对未来的类似问题有用，来关闭报告。有力的 D8 记录会说明改了什么、团队学到了什么，以及未来团队应优先检查什么。",
    proofElements: [
      "已关闭的措施与最终评审决定",
      "控制计划、检查表、培训或过程更新",
      "可复用于未来质量问题的经验教训",
    ],
    checklist: [
      "确认 D5/D6 措施已关闭或明确跟踪。",
      "记录 D7 预防控制中改了什么。",
      "用另一位工程师能够复用的方式撰写经验教训。",
      "指出应检查的类似产品、过程或供应商。",
      "认可贡献者，但不要把报告写成故事。",
      "让完成的报告可检索，供未来根本原因和措施复用。",
    ],
    mistakes: [
      "只写团队已认可，却没有经验教训。",
      "重复纠正措施，而不是说明未来的学习点。",
      "跳过对类似过程的预防更新。",
      "在可复用知识被记录前就关闭报告。",
    ],
    table: {
      title: "D7 预防与 D8 经验",
      columns: ["关闭项", "薄弱措辞", "更有力的措辞"],
      rows: [
        ["预防", "已更新检查表", "换线检查表增加夹具清洁照片证据"],
        ["经验", "需要更好的培训", "换线控制需要在重启前独立验证"],
        ["复用", "检查类似产线", "下次夹具更换前先检索涂装线启动问题"],
        ["关闭", "措施已完成", "三个批次经出货边缘附着力检查验证"],
        ["认可", "谢谢团队", "认可过程、检验和 SQE 责任人在证据周转上的贡献"],
      ],
    },
    sections: [
      {
        title: "经验教训应帮助下一份报告",
        body:
          "完成的 8D 不只是一份文档。当根本原因、纠正措施、验证、预防和经验可以被再次找到时，它就是一项质量知识资产。",
      },
      {
        title: "D7 为 D8 提供输入",
        body:
          "D7 的预防变更给 D8 提供了可以沉淀的具体内容。没有体系变更，经验教训往往只会变成笼统的提醒。",
      },
      {
        title: "让经验可复用",
        body:
          "沉淀预防和经验教训，让下一个类似问题从证据出发，而不是凭记忆。查看报告示例，对比已关闭报告的 D7/D8 可复用内容。",
      },
    ],
    primaryCta: {
      label: "检索可复用知识",
      href: "/knowledge",
      eventName: "knowledge_search_used",
      eventData: { source: "d8_resource" },
    },
    secondaryCta: { label: "免费创建报告", href: "/signup" },
    relatedLinks: [
      { label: "知识库", href: "/knowledge" },
      { label: "D6 验证指南", href: "/zh/resources/8d-validation-d6-guide" },
      { label: "演示报告", href: "/demo-reports" },
    ],
    faq: [
      {
        question: "经验教训应包含什么？",
        answer:
          "应描述可复用的学习点、相关的过程或产品领域，以及未来团队在重现问题前应先检查什么。",
      },
      {
        question: "完成的报告会成为可复用知识吗？",
        answer:
          "会。已完成并关闭的报告可以成为可检索的知识资产，供未来复用根本原因、纠正措施、预防和经验教训。",
      },
    ],
  },
};

export const revenueGeoResourcesZh: RevenueGeoResource[] = Object.values(
  revenueGeoResourcesZhBySlug,
);

export const revenueGeoResourceZhSlugs: string[] = Object.keys(
  revenueGeoResourcesZhBySlug,
);

export function getRevenueGeoResourceZh(
  slug: string,
): RevenueGeoResource | undefined {
  return revenueGeoResourcesZhBySlug[slug];
}
