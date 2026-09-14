import type { SeoPage } from "@/lib/seo-pages";

// Simplified Chinese mirror of the legacy SEO landing pages that render through
// src/components/marketing/SeoLandingPage.tsx (Batch 4). The English source of
// truth stays in src/lib/seo-pages.ts: same slugs, same section/checklist/FAQ
// structure. The live English /8d-report-template page is a bespoke landing page
// (src/app/(marketing)/8d-report-template/page.tsx), so its legacy data entry is
// intentionally not mirrored here; the custom zh page lives at
// src/app/zh/8d-report-template/page.tsx.
//
// Copy is tool-only: it describes live D0-D8 editing, evidence / attachments,
// PDF / Word / Excel + ZIP export, share links, Team roles / approval / locking
// / activity, Knowledge Base reuse, and the automated AI Quality Check. It never
// mentions removed manual-service or case-management positioning.

export const seoPagesZh: SeoPage[] = [
  {
    slug: "8d-report-example",
    title: "8D 报告示例 | 引导式质量报告样例",
    description:
      "查看一份完整 8D 报告应包含的内容，从问题描述、围堵到根本原因和纠正措施。",
    eyebrow: "8D 报告示例",
    h1: "面向质量工程师的实用 8D 报告示例",
    intro:
      "有用的 8D 示例不只是一份完成的文档。它展示逻辑如何连接：问题陈述、围堵、根本原因证据、纠正措施、验证和经验教训。",
    sections: [
      {
        title: "从可测量的问题开始",
        body:
          "D2 问题描述应回答发生了什么、在哪里发生、何时发生、发生频率，以及受影响的产品或批次。",
      },
      {
        title: "把围堵与纠正分开",
        body:
          "D3 围堵立即保护客户。D5 纠正措施解决经验证的根本原因。把两者混为一谈是 8D 报告中最常见的薄弱点之一。",
      },
      {
        title: "以预防收尾",
        body:
          "D7 应展示流程、控制计划、培训、检查清单或体系中发生了什么变化，使同一问题更不容易再发。",
      },
    ],
    checklist: [
      "具体的问题陈述",
      "临时围堵措施",
      "5Why 或根本原因分析证据",
      "带责任人和截止日期的纠正措施",
      "验证结果",
      "预防与经验教训",
    ],
    faq: [
      {
        question: "我可以在应用里生成示例报告吗？",
        answer:
          "可以。仪表盘提供示例报告入口，让你快速看到一份完成的 8D 报告如何组织。",
      },
      {
        question: "8D 示例需要包含附件吗？",
        answer:
          "通常需要。照片、检验记录、测试结果和过程证据会让报告更可信。",
      },
    ],
  },
  {
    slug: "supplier-8d-report",
    title: "供应商 8D 报告 | 纠正措施工作流",
    description:
      "通过结构化的 D0-D8 步骤、证据上传、导出、分享和 Pro 可编辑链接创建供应商 8D 报告。",
    eyebrow: "供应商 8D 报告",
    h1: "更易完成、分享和评审的供应商 8D 报告",
    intro:
      "供应商质量团队需要既足够完整以供客户评审，又足够简单让供应商无需与文档模板较劲就能填写的 8D 报告。",
    sections: [
      {
        title: "客户通常需要什么",
        body:
          "客户通常需要清晰的问题描述、立即围堵、经验证的根本原因、永久纠正措施、实施证据和预防控制。",
      },
      {
        title: "在线分享如何帮助",
        body:
          "只读链接让相关方无需邮件发送文件即可评审报告。在协作合适时，Pro 可编辑链接可以帮助供应商直接参与。",
      },
      {
        title: "何时需要 Word 导出",
        body:
          "许多客户仍然要求正式文档。Pro Word 导出支持这一工作流，同时把结构化的报告历史保留在系统中。",
      },
    ],
    checklist: [
      "供应商名称与联系人",
      "客户投诉或审核发现",
      "围堵措施与受影响范围",
      "根本原因与流出原因",
      "纠正措施证据",
      "预防与再发控制",
    ],
    faq: [
      {
        question: "供应商可以不用 Pro 使用吗？",
        answer:
          "供应商可以在免费版的 3 份报告限额内完成报告。对于管理反复出现的供应商报告的团队，Pro 更合适。",
      },
      {
        question: "供应商可以编辑共享的 8D 报告吗？",
        answer: "可编辑分享需要 Pro 或 Team。免费版分享为只读。",
      },
    ],
  },
  {
    slug: "corrective-action-report-template",
    title: "纠正措施报告模板 | 8D 与 CAPA 工作流",
    description:
      "使用结构化的纠正措施报告模板，记录围堵、根本原因、纠正措施、验证和预防。",
    eyebrow: "纠正措施报告",
    h1: "面向真实质量问题的纠正措施报告模板",
    intro:
      "当纠正措施报告把证据与决策连接起来时最为有力。8D 格式为质量团队提供了实现这一点的实用结构。",
    sections: [
      {
        title: "从问题到行动",
        body:
          "好的纠正措施报告记录问题、立即围堵、原因分析、永久措施、验证和预防措施。",
      },
      {
        title: "为什么 8D 好用",
        body:
          "8D 结构对客户投诉、供应商问题、反复出现的流程缺陷和跨职能质量调查尤其有用。",
      },
      {
        title: "让历史可检索",
        body:
          "Pro 深度检索帮助团队在再次从零开始之前，找到类似的历史问题、根本原因、纠正措施和经验教训。",
      },
    ],
    checklist: [
      "问题陈述",
      "立即围堵",
      "根本原因分析",
      "纠正措施计划",
      "实施证据",
      "有效性验证",
      "预防控制",
    ],
    faq: [
      {
        question: "8D 报告和纠正措施报告是一样的吗？",
        answer:
          "8D 报告是纠正措施报告的一种结构化类型。它常用于客户投诉和供应商质量问题。",
      },
      {
        question: "我可以导出纠正措施报告吗？",
        answer:
          "可以。免费版可导出带水印 PDF。Pro 用户可导出无水印版本并使用 Word 导出。",
      },
    ],
  },
  {
    slug: "5-why-root-cause-template",
    title: "5Why 根本原因模板 | 根本原因分析",
    description:
      "在 8D 报告中记录 5Why 根本原因分析，把原因与纠正和预防措施连接起来。",
    eyebrow: "5Why 根本原因",
    h1: "与你的 8D 报告相连的 5Why 根本原因模板",
    intro:
      "当 5Why 分析不止于猜测时才有用。它应把每个 why 连接到证据，并导向针对经验证原因的纠正措施。",
    sections: [
      {
        title: "在 D4 中使用 5Why",
        body:
          "D4 是团队识别并验证根本原因的地方。5Why 表格有助于组织思路，尤其适用于过程和体系原因。",
      },
      {
        title: "区分发生与流出",
        body:
          "发生原因解释缺陷为何发生。流出原因解释为何它在到达下一道工序或客户之前未被发现。",
      },
      {
        title: "把原因转化为预防",
        body:
          "只有当由此产生的 D5 和 D7 措施改变了流程、控制计划、培训或体系行为时，5Why 分析才有用。",
      },
    ],
    checklist: [
      "清晰定义问题",
      "追问问题为何发生",
      "追问为何未被检出",
      "用证据验证答案",
      "把最终原因链接到纠正措施",
      "记录预防与经验教训",
    ],
    faq: [
      {
        question: "5Why 对每份 8D 报告都足够吗？",
        answer:
          "不一定。复杂问题可能还需要鱼骨图、FMEA、测试数据或过程研究。5Why 是一个实用的起点。",
      },
      {
        question: "我可以在根本原因步骤附加证据吗？",
        answer:
          "可以。附件可以上传到相关的 D 步骤，使导出的报告保留支持性证据。",
      },
    ],
  },
];

export function getSeoPageZh(slug: string) {
  return seoPagesZh.find((page) => page.slug === slug);
}
