// Simplified Chinese copy for the workflow demo reports (Batch 4).
//
// The English source of truth is src/lib/demo-reports.ts. That module keeps the
// full ReportData used by the download endpoints (PDF / Word / Excel / ZIP),
// which stay English/format assets. This module only provides the Chinese page
// metadata and the report fields displayed by
// src/app/zh/demo-reports/[type]/page.tsx, so the demo pages can be read in
// Chinese while the downloadable files remain the same assets.

export interface DemoReportContentZh {
  slug: string;
  title: string;
  industry: string;
  scenario: string;
  highlights: string;
  revision: string;
  workflowSummary: string;
  reportData: {
    reportNumber: string;
    customerName: string;
    productName: string;
    batchNumber: string;
    priority: string;
    teamLeader: string;
    teamMembers: string;
    problemDescription: string;
    containmentDescription: string;
    containmentVerification: string;
    rootCauseOccurrence: string;
    rootCauseEscape: string;
    rootCauseSystem: string;
    confirmedRootCause: string;
    selectedCorrectiveAction: string;
    correctiveRationale: string;
    implementationPlan: string;
    validationMethod: string;
    validationResults: string;
    systemChanges: string;
    horizontalDeployment: string;
    lessonsLearned: string;
    preparedBy: string;
    reviewedBy: string;
    approverName: string;
  };
  workflow: Array<{ title: string; detail: string }>;
}

export const DEMO_REPORTS_ZH: Record<string, DemoReportContentZh> = {
  automotive: {
    slug: "automotive",
    title: "汽车行业 8D - 客户来料检验发现 CNC 壳体毛刺",
    industry: "汽车机加工",
    scenario: "客户来料检验发现 CNC 铝制壳体毛刺。",
    highlights: "D0-D8、证据、内部评审、审批锁定、Rev.1、活动日志",
    revision: "Rev.1",
    workflowSummary: "已审批，为客户要求的验证证据解锁，随后作为 Rev.1 审批。",
    reportData: {
      reportNumber: "8D-2026-AUTO-001",
      customerName: "Northstar Automotive Systems",
      productName: "铝制阀体，零件 VH-4421",
      batchNumber: "AH-260418",
      priority: "高",
      teamLeader: "Maria Chen，质量经理",
      teamMembers: "CNC 工艺工程师；生产主管；计量技术员；客户质量工程师",
      problemDescription:
        "客户在批次 AH-260418 的 7 件 CNC 加工铝制壳体上发现油道交叉孔有尖锐毛刺。毛刺超出约定的目视和触感验收标准，并可能在装配过程中脱落。",
      containmentDescription:
        "停止发货，隔离四个相关批次的 1,920 件产品，引入 100% 内窥镜检验，并发出经认证的替换库存。",
      containmentVerification:
        "两名检验员独立复核了首批 300 件筛选产品；未发现额外的流出。",
      rootCauseOccurrence:
        "去毛刺刷在计划更换周期之前达到寿命终点，因为实际交叉孔负载高于周期研究假设。",
      rootCauseEscape:
        "最终目视检验仅使用顶部照明，未包含能够发现交叉孔毛刺的内窥镜角度。",
      rootCauseSystem:
        "刀具寿命变更基于名义循环次数，没有针对毛刺测量值上升的触发规则。",
      confirmedRootCause:
        "毛刺由刷子寿命控制不足造成；最终检验角度不足导致其流出。",
      selectedCorrectiveAction:
        "将刷子更换设定为 7,500 次循环，增加毛刺高度触发限值，并要求对交叉孔进行内窥镜检验。",
      correctiveRationale: "该措施消除了发生机理，并关闭了已证实的流出点。",
      implementationPlan:
        "更新刀具寿命计数器、控制计划、作业指导书、检验夹具和分层审核检查清单。",
      validationMethod: "连续三个生产批次，加上种子缺陷检出挑战。",
      validationResults:
        "批次 AH-260503、AH-260506 和 AH-260509 通过；1,440 件中零毛刺缺陷，且所有种子缺陷均被检出。",
      systemChanges: "修订 PFMEA 的发生和检测控制；增加刀具寿命触发规则。",
      horizontalDeployment: "将相同的刀具寿命研究应用到六个类似的交叉孔加工工序。",
      lessonsLearned:
        "刀具寿命间隔必须有实测磨损趋势支撑，并配合有效的检测方法。",
      preparedBy: "Maria Chen",
      reviewedBy: "David Ruiz",
      approverName: "Elena Morris",
    },
    workflow: [
      { title: "内部评审", detail: "质量和工艺工程评审了刀具寿命研究和种子缺陷挑战。" },
      { title: "审批并锁定", detail: "初始客户包已审批，并受到防编辑保护。" },
      { title: "为 Rev.1 解锁", detail: "负责人在解锁前记录了客户对更新验证证据的要求。" },
      { title: "审批 Rev.1", detail: "加入三批次验证证据，报告再次锁定。" },
    ],
  },
  molding: {
    slug: "molding",
    title: "注塑成型 8D - 客户壳体出现外观缩痕",
    industry: "注塑成型",
    scenario: "注塑客户壳体上发现可见缩痕。",
    highlights: "5Why、鱼骨图 6M、围堵、工艺纠正、审批",
    revision: "Rev.0",
    workflowSummary: "内部评审完成，报告在审批后锁定。",
    reportData: {
      reportNumber: "8D-2026-MOLD-002",
      customerName: "Arbor Medical Controls",
      productName: "控制器前壳，零件 CFH-118",
      batchNumber: "M260316-C2",
      priority: "高",
      teamLeader: "Sofia Patel，质量工程师",
      teamMembers: "成型工程师；模具工程师；班长；客户质量",
      problemDescription:
        "2 号型腔的两个内部加强筋上方出现可见缩痕，涉及 23 件前壳。该缺陷在客户标准的 800 lux 外观检验下可见。",
      containmentDescription:
        "隔离 2 号型腔产出，在 800 lux 照明下分选客户和仓库库存，并提供经认证的 1 号型腔替换库存。",
      containmentVerification: "质量团队使用客户缺陷边界样本复核了分选标准。",
      rootCauseOccurrence:
        "2 号型腔附近的冷却受限提高了局部模具温度，而未记录的设置调整后保压压力被降低。",
      rootCauseEscape: "过程外观检验在零件完成模后收缩之前进行。",
      rootCauseSystem: "设置参数变更未进行电子锁定或独立审批。",
      confirmedRootCause:
        "保压降低与 2 号型腔冷却受限共同造成缺陷；过早检验导致流出。",
      selectedCorrectiveAction:
        "清洁并流量测试冷却水道，锁定已批准的配方，并将外观检验移至成型后 30 分钟。",
      correctiveRationale: "措施针对已确认的工艺原因和基于时机的流出点。",
      implementationPlan:
        "维修冷却回路，验证配方，更新控制计划和检验标准，培训所有设置技术员。",
      validationMethod: "在客户照明标准下进行三个 400 件、来自 2 号型腔的生产批次。",
      validationResults: "1,200 件验证产品零缩痕；尺寸和飞边保持在限值内。",
      systemChanges: "锁定配方权限，并增加参数变更审批。",
      horizontalDeployment: "复核了 14 套外观壳模具的冷却流量和检验时机控制。",
      lessonsLearned: "外观验收时机必须反映模后收缩，配方变更需要治理。",
      preparedBy: "Sofia Patel",
      reviewedBy: "Andre Lewis",
      approverName: "Grace Kim",
    },
    workflow: [
      { title: "内部评审", detail: "成型、模具和质量评审了 DOE 和客户外观边界样本。" },
      { title: "审批并锁定", detail: "已批准的配方、冷却流量结果和验证证据被冻结为 Rev.0。" },
    ],
  },
  electronics: {
    slug: "electronics",
    title: "电子 8D - 老化测试中 LED 模块间歇性失效",
    industry: "电子制造",
    scenario: "LED 模块在客户老化测试中间歇性失效。",
    highlights: "失效证据、根本原因验证、修订历史、最终交付",
    revision: "Rev.2",
    workflowSummary: "经过两次证据修订后提交客户；最终报告已锁定。",
    reportData: {
      reportNumber: "8D-2026-LED-003",
      customerName: "Lumina Industrial Controls",
      productName: "LED 驱动模块 LDM-24V",
      batchNumber: "LD-260501",
      priority: "严重",
      teamLeader: "Noah Williams，电子质量负责人",
      teamMembers: "SMT 工程师；测试工程师；供应商质量工程师；客户质量",
      problemDescription:
        "批次 LD-260501 的 9 件 LED 驱动模块在客户老化 6-14 小时后间歇性失效。断电重启可暂时恢复功能。",
      containmentDescription:
        "停止发货，隔离相关日期码，使用热循环加 24 小时老化筛选模块，并发出经认证的替换件。",
      containmentVerification:
        "筛选复现了全部九件已知失效，仅放行合格模块。",
      rootCauseOccurrence:
        "一处未经授权的回流焊保温区编辑降低了连接器 J4 的润湿裕度，产生微裂纹，并在热暴露期间张开。",
      rootCauseEscape:
        "AOI 判据检验了焊料面积，但未检测与间歇性焊点相关的焊跟圆角几何。",
      rootCauseSystem: "配方编辑权限和变更评审未限制在工艺工程范围。",
      confirmedRootCause:
        "未经授权的回流焊配方变更导致 J4 润湿不足；AOI 判据不完整导致流出。",
      selectedCorrectiveAction:
        "恢复并密码锁定配方，要求工程变更审批，并更新 AOI 焊跟圆角判据。",
      correctiveRationale: "措施同时控制发生原因和已证实的流出机理。",
      implementationPlan:
        "锁定烤箱配方，修订变更控制流程，更新 AOI 程序，验证三个生产批次。",
      validationMethod: "三个生产批次、热循环、48 小时老化以及切片取样。",
      validationResults:
        "1,800 件模块通过老化；60 件热循环样品和 12 件切片符合验收标准。",
      systemChanges: "限制配方权限，并要求电子化变更审批。",
      horizontalDeployment: "审核所有六条 SMT 产线的配方访问和 AOI 判据。",
      lessonsLearned:
        "共享工艺凭据会造成不受控的变更；检测判据必须针对真实的失效几何。",
      preparedBy: "Noah Williams",
      reviewedBy: "Ava Brooks",
      approverName: "Priya Raman",
    },
    workflow: [
      { title: "内部评审", detail: "SMT 工程和质量评审了切片、AOI 判据和老化结果。" },
      { title: "审批 Rev.1", detail: "第一份证据包已审批并锁定。" },
      { title: "为 Rev.2 解锁", detail: "客户要求扩展热循环证据；负责人记录了原因。" },
      { title: "提交客户", detail: "Rev.2 已审批、提交，并作为最终交付包锁定。" },
    ],
  },
};

export const demoReportZhSlugs = Object.keys(DEMO_REPORTS_ZH);

export function getDemoReportZh(type: string): DemoReportContentZh | undefined {
  return DEMO_REPORTS_ZH[type];
}
