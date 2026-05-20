import type { QualityKnowledgeEntry } from "../quality-agent/types"

export const qualityKnowledgeBase: QualityKnowledgeEntry[] = [
  // ==================== QUALITY SYSTEMS ====================
  {
    id: "iso9001",
    category: "quality_system",
    title: "ISO 9001:2015 质量管理体系",
    description:
      "国际标准化组织发布的最广泛应用的质量管理体系标准。基于七项质量管理原则，采用PDCA循环和过程方法，强调风险思维和领导力。",
    purpose:
      "建立系统化的质量管理体系，确保组织能够持续提供满足客户要求和适用法律法规要求的产品与服务，同时增强客户满意度。",
    applicability: ["world_class", "medium", "small"],
    industries: [
      `汽车「, 」电子「, 」医疗器械「, 」食品「, 」航空航天「, 」通用制造「, 」服务`,
    ],
    countries: ["全球"],
    keyConcepts: [
      `过程方法「, 」PDCA循环「, 」风险思维「, 」领导力承诺`,
      `以客户为关注焦点「, 」持续改进「, 」循证决策「, 」关系管理`,
    ],
    practicalGuidance:
      "小企业可从核心条款入手（4-10章），不用一次性建立完整体系。关键是将质量目标与业务目标对齐，让体系成为经营工具而非负担。中型企业应建立文件化体系，培养内审员，通过管理评审驱动改进。大型企业应将ISO 9001作为基础，向上叠加行业特定标准如IATF 16949或AS9100。",
    relatedEntries: ["iatf16949", "as9100", "iso13485", "iso14001", "tqm"],
    maturityLevel: "foundational",
    tags: ["ISO", "质量管理体系", "认证", "过程方法", "PDCA"],
  },
  {
    id: "iatf16949",
    category: "quality_system",
    title: "IATF 16949:2016 汽车行业质量管理体系",
    description:
      "国际汽车工作组(IATF)制定的汽车行业专属质量管理体系标准，在ISO 9001基础上增加了汽车行业的特殊要求，包括客户特定要求(CSR)。",
    purpose:
      "统一全球汽车供应链的质量管理体系要求，减少重复认证，推动缺陷预防和减少变差与浪费，确保汽车零部件的质量和可靠性。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "汽车零部件", "汽车电子"],
    countries: ["全球（汽车供应链）"],
    keyConcepts: [
      `客户特定要求(CSR)「, 」产品安全「, 」嵌入式软件`,
      `供应商管理「, 」控制计划「, 」特殊特性管理`,
      `统计过程控制(SPC)「, 」测量系统分析(MSA)`,
      `生产件批准程序(PPAP)「, 」内部审核员能力要求`,
    ],
    practicalGuidance:
      "IATF 16949认证投入巨大（初次认证约20-50万人民币），不是所有企业都需要。如果60%以上业务来自汽车主机厂或Tier1，认证是必要的生意门槛。如果只是少量汽车业务，可先建立符合要求的体系但暂不认证，等业务量达到规模再申请认证。认证前必须完成12个月以上的运行记录。",
    relatedEntries: ["iso9001", "apqp", "ppap", "fmea", "spc", "msa", "control_plan"],
    maturityLevel: "advanced",
    tags: ["IATF", "汽车", "质量管理体系", "认证", "供应链"],
  },
  {
    id: "as9100",
    category: "quality_system",
    title: "AS9100D 航空航天质量管理体系",
    description:
      "基于ISO 9001的航空航天行业专属标准，增加了风险管理、配置管理、首件检验(FOD)、假冒零件预防等航空航天特殊要求。",
    purpose:
      "确保航空航天产品和服务的安全性、可靠性，满足全球航空航天产业对质量的极致要求。",
    applicability: ["world_class", "medium"],
    industries: ["航空航天", "国防", "军工"],
    countries: ["全球（航空航天供应链）"],
    keyConcepts: [
      `风险管理「, 」配置管理「, 」首件检验(FAI)`,
      `关键项管理「, 」假冒零件预防「, 」质量可追溯性`,
      `工艺验证「, 」特殊过程控制(Nadcap)「, 」项目风险管理`,
    ],
    practicalGuidance:
      "航空航天行业对质量的要求是零容忍。中型供应商需要从设计阶段就嵌入质量要求，确保全链条可追溯。小企业若想进入航空航天供应链，建议先从Nadcap特殊过程认证起步，再考虑AS9100认证。",
    relatedEntries: ["iso9001", "fmea", "spc", "msa", "nadcap"],
    maturityLevel: "advanced",
    tags: ["航空航天", "AS9100", "质量管理体系", "认证", "安全"],
  },
  {
    id: "iso13485",
    category: "quality_system",
    title: "ISO 13485:2016 医疗器械质量管理体系",
    description:
      "医疗器械行业专属质量管理体系标准，强调产品安全和有效性，要求建立完整的风险管理过程和法规符合性。",
    purpose:
      "确保医疗器械的设计、开发、生产、储存、分销、安装、服务和最终停用全过程的质量和安全性，满足全球医疗器械法规要求。",
    applicability: ["world_class", "medium", "small"],
    industries: ["医疗器械", "体外诊断", "医疗设备", "医疗耗材"],
    countries: ["全球（医疗器械行业）"],
    keyConcepts: [
      `风险管理(ISO 14971)「, 」设计控制「, 」过程确认`,
      `灭菌验证「, 」可追溯性(UDI)「, 」临床评价`,
      `上市后监督「, 」法规符合性「, 」供应商管理`,
    ],
    practicalGuidance:
      "医疗器械行业必须遵守当地法规（如中国NMPA、美国FDA、欧盟MDR）。小微企业可以从单一产品线开始建立体系，逐步扩大到全产品线。关键是要建立风险管理文档，这是认证审核的重中之重。",
    relatedEntries: ["iso9001", "fmea", "iso14971", "gmp", "fda"],
    maturityLevel: "advanced",
    tags: ["医疗器械", "ISO 13485", "质量管理体系", "认证", "法规"],
  },
  {
    id: "iso14001",
    category: "quality_system",
    title: "ISO 14001:2015 环境管理体系",
    description:
      "国际标准化组织的环境管理体系标准，帮助组织建立系统化方法管理环境影响，与质量管理密不可分。",
    purpose:
      "在质量管理和环境管理之间建立协同效应，减少浪费就是提高质量。帮助组织系统地识别和管理环境因素，实现可持续发展。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["全球"],
    keyConcepts: [
      `生命周期视角「, 」环境因素识别「, 」合规义务`,
      `环境目标「, 」应急准备与响应「, 」持续改进`,
    ],
    practicalGuidance:
      "质量与环境管理可以整合为一个综合管理体系。过程方法、PDCA、文件控制等机制可以共享，减少重复工作。中小企业可以将ISO 14001和ISO 9001整合审核，节省认证成本。",
    relatedEntries: ["iso9001", "iso45001", "lean"],
    maturityLevel: "foundational",
    tags: ["ISO", "环境管理", "认证", "可持续发展"],
  },
  {
    id: "iso45001",
    category: "quality_system",
    title: "ISO 45001:2018 职业健康安全管理体系",
    description:
      "替代OHSAS 18001的新标准，采用Annex SL高层结构，与ISO 9001和ISO 14001轻松整合。",
    purpose:
      "质量和安全不可分割——不良的工作环境会导致质量问题。确保安全的工作环境，同时减少因工伤和职业病导致的运营中断和质量风险。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["全球"],
    keyConcepts: [
      `危险源辨识「, 」风险评价(双重机制)`,
      `工作人员协商与参与「, 」变更管理「, 」采购及外包控制`,
    ],
    practicalGuidance:
      "将安全管理融入质量管理流程：每次质量问题分析时，同时评估是否有安全隐患；每次过程变更时，同时做质量风险评估和安全风险评估。",
    relatedEntries: ["iso9001", "iso14001", "pdca"],
    maturityLevel: "foundational",
    tags: ["ISO", "安全", "认证", "职业健康"],
  },
  {
    id: "vda6_3",
    category: "quality_system",
    title: "VDA 6.3 过程审核（德国汽车工业）",
    description:
      "德国汽车工业联合会(VDA)发布的过程审核标准，是德系汽车供应链进入的必备要求。采用打分制评估过程质量能力。",
    purpose:
      "评估产品实现过程的质量能力，识别过程风险和改进机会。与IATF 16949互补，更侧重于实际过程能力的验证而非体系符合性。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "汽车零部件"],
    countries: ["德国", "欧洲", "全球德系供应链"],
    keyConcepts: [
      `过程要素P1-P7「, 」乌龟图「, 」评分模型(0-10-8-6-4-0)`,
      `潜在供应商分析「, 」过程能力指数「, 」量产后审核`,
    ],
    practicalGuidance:
      `想要进入德系汽车供应链（大众、宝马、奔驰等），VDA 6.3是必需的。建议先取得IATF 16949认证，再请第三方做VDA 6.3过程审核预评估。过程审核不是「查文件」，而是现场看实物、问操作工、验证实际过程能力。`,
    relatedEntries: ["iatf16949", "iso9001", "spc", "fmea"],
    maturityLevel: "advanced",
    tags: ["VDA", "德国", "汽车", "过程审核", "供应链"],
  },
  {
    id: "iso17025",
    category: "quality_system",
    title: "ISO/IEC 17025:2017 实验室管理体系",
    description:
      "检测和校准实验室能力的通用要求，确保实验室的技术能力和结果的可靠性与有效性。",
    purpose:
      "保证检测和校准结果的准确性和可追溯性。对于质量人员而言，实验室数据的可靠性是所有质量决策的基础。",
    applicability: ["world_class", "medium", "small"],
    industries: ["汽车", "电子", "化工", "食品", "医疗器械", "第三方检测"],
    countries: ["全球"],
    keyConcepts: [
      `测量不确定度「, 」方法验证「, 」设备校准`,
      `能力验证「, 」质量控制「, 」报告要求`,
    ],
    practicalGuidance:
      "即使不申请认证，也可以参考ISO 17025建立内部实验室管理规范，确保检测数据的可靠性。中小企业应将校准和检测外包给已认证的实验室，降低自建成本。",
    relatedEntries: ["msa", "spc", "gmp"],
    maturityLevel: "intermediate",
    tags: ["实验室", "检测", "校准", "认证"],
  },

  // ==================== METHODOLOGIES ====================
  {
    id: "six_sigma",
    category: "methodology",
    title: "六西格玛 (Six Sigma)",
    description:
      "由摩托罗拉发明、通用电气发扬光大的数据驱动改善方法论。通过DMAIC（定义-测量-分析-改进-控制）五阶段，将过程能力提升到百万分之3.4的缺陷水平。",
    purpose:
      `用统计方法从根本上减少变异和缺陷，将质量从「检验把关」提升到「预防驱动」。核心量化指标：每百万机会缺陷数(DPMO)、过程能力指数(Cp/Cpk)、西格玛水平。`,
    applicability: ["world_class", "medium"],
    industries: ["汽车", "电子", "医疗", "通用制造", "服务业", "金融"],
    countries: ["美国", "全球"],
    keyConcepts: [
      `DMAIC「, 」DMADV(设计六西格玛)「, 」DPMO「, 」Cp/Cpk/Pp/Ppk`,
      `黑带/绿带带级体系「, 」Y=f(X)关键因子「, 」假设检验`,
      `回归分析「, 」实验设计(DOE)「, 」控制计划`,
    ],
    practicalGuidance:
      "中小企业不要盲目追求黑带认证。先培养1-2名绿带，用简单的统计工具解决实际问题，看到效果后再扩大。一个成功的中等规模六西格玛部署约需3-5年。关键不是工具复杂程度，而是找到合适的项目和培养数据驱动的文化。",
    relatedEntries: ["lean", "dmaic", "spc", "doe", "fmea", "pdca"],
    maturityLevel: "advanced",
    tags: ["六西格玛", "统计分析", "DMAIC", "过程能力"],
  },
  {
    id: "lean",
    category: "methodology",
    title: "精益生产 (Lean Manufacturing)",
    description:
      "源于丰田生产系统(TPS)，核心是消除七大浪费（过量生产、等待、搬运、加工本身、库存、动作、不良品），用最少的资源创造最多的客户价值。",
    purpose:
      "精益和质量是一体两面——消除浪费的过程就是提高质量的过程。通过价值流分析和标准化作业，从源头预防质量问题。",
    applicability: ["world_class", "medium", "small"],
    industries: ["汽车", "电子", "通用制造", "医疗", "服务业", "建筑"],
    countries: ["日本", "全球"],
    keyConcepts: [
      `价值流图(VSM)「, 」5S「, 」看板(Kanban)`,
      `准时化生产(JIT)「, 」自働化(Jidoka)「, 」标准作业`,
      `快速换模(SMED)「, 」防错法(Poka-Yoke)「, 」持续改善(Kaizen)`,
    ],
    practicalGuidance:
      "小作坊最适合先从5S和标准化作业开始，这两项零成本改进就能大幅提升质量和效率。中型企业可以做价值流分析，识别瓶颈工序。精益不需要巨额投资，最需要的是管理层的承诺和全员参与。",
    relatedEntries: ["tps", "kaizen", "5s", "pokayoke", "vsm", "pdca"],
    maturityLevel: "foundational",
    tags: ["精益生产", "丰田", "TPS", "5S", "消除浪费"],
  },
  {
    id: "tqm",
    category: "methodology",
    title: "全面质量管理 (TQM)",
    description:
      "以质量为中心、全员参与为基础的管理哲学。不是一种工具或体系，而是一种组织文化和管理理念。戴明、朱兰、克劳斯比三位大师奠定了理论基础。",
    purpose:
      "将质量从技术部门的职能提升为企业战略核心。通过全员参与和持续改善，实现客户满意、员工成长、企业发展的三赢。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["日本", "全球"],
    keyConcepts: [
      `戴明14点「, 」朱兰质量三部曲（策划-控制-改进）`,
      `克劳斯比零缺陷「, 」质量成本(COQ)「, 」全员参与(QC小组)`,
      `方针管理(Hoshin Kanri)「, 」日常管理「, 」跨职能管理`,
    ],
    practicalGuidance:
      "TQM不是证书，是文化。小企业推行TQM可以从三件事做起：(1)老板每天到现场看质量；(2)员工可以随时拉停生产线；(3)每周一次质量改善会。这三件事不花钱，但比任何体系都有效。",
    relatedEntries: ["iso9001", "lean", "six_sigma", "kaizen", "pdca"],
    maturityLevel: "foundational",
    tags: ["TQM", "全面质量管理", "戴明", "企业文化"],
  },
  {
    id: "kaizen",
    category: "methodology",
    title: "改善 (Kaizen)",
    description:
      `源自日本的持续改进哲学，强调每天一点小改进,积少成多。与西方「大变革」思维不同，Kaizen相信基层员工最了解如何改进自己的工作。`,
    purpose:
      "让持续改进成为每个员工的日常工作，而非管理层的专属工作。通过提案制度和改善活动，释放一线员工的智慧和创造力。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["日本", "全球"],
    keyConcepts: [
      `改善提案制度「, 」QC小组「, 」PDCA小循环`,
      `可视化看板「, 」消除Muda(浪费)「, 」标准作业改善`,
    ],
    practicalGuidance:
      "小企业实行Kaizen最容易也最有效——因为层级少、沟通快。关键是建立一个简单的机制：员工发现问题→提出建议→快速采纳并奖励。很多日本小企业每个月有上百条改善提案，每条都能立即实施。不需要复杂的流程和审批。",
    relatedEntries: ["lean", "pdca", "5s", "tqm"],
    maturityLevel: "foundational",
    tags: ["Kaizen", "改善", "持续改进", "日本"],
  },
  {
    id: "8d_methodology",
    category: "methodology",
    title: "8D问题解决法 (Eight Disciplines)",
    description:
      "由福特汽车开发的团队导向问题解决方法论。八个步骤从组建团队到表彰团队，形成完整的问题解决闭环。广泛应用于汽车行业质量管理中。",
    purpose:
      "系统化地识别根本原因，实施纠正和预防措施，防止问题重复发生。特别适合客户投诉处理和重大质量问题的系统解决。",
    applicability: ["world_class", "medium", "small"],
    industries: ["汽车", "电子", "通用制造", "医疗器械"],
    countries: ["全球"],
    keyConcepts: [
      `D0准备「, 」D1团队「, 」D2描述`,
      `D3遏制「, 」D4根因「, 」D5永久措施`,
      `D6验证「, 」D7预防「, 」D8结案`,
    ],
    practicalGuidance:
      "8D最容易被滥用——成了填表格的形式主义。小企业用8D的关键是：D2（问题描述）和D4（根本原因分析）要花80%的时间，其他步骤可以简化。D2一定要用数据说话（不是'螺丝松了'，而是'在3月设备#5上，M6螺丝的扭矩从25N·m掉到18N·m，发生频次为每100件3次'）。",
    relatedEntries: ["ishikawa", "five_whys", "pdca", "fmea", "dmaic"],
    maturityLevel: "intermediate",
    tags: ["8D", "问题解决", "福特", "根本原因", "纠正措施"],
  },
  {
    id: "dmaic",
    category: "methodology",
    title: "DMAIC 改善方法论",
    description:
      "六西格玛的核心方法论框架：Define(定义)、Measure(测量)、Analyze(分析)、Improve(改进)、Control(控制)。一套数据驱动的结构化改善流程。",
    purpose:
      "提供了从问题识别到成果固化的完整路线图。特别适合解决复杂的、跨部门的、需要数据分析的质量问题。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "电子", "医疗", "通用制造", "服务业"],
    countries: ["美国", "全球"],
    keyConcepts: [
      `项目章程「, 」SIPOC图「, 」CTQ树「, 」过程能力分析`,
      `图形化数据分析「, 」假设检验「, 」DOE「, 」控制计划`,
    ],
    practicalGuidance:
      "中小企业使用DMAIC要灵活：Define可以用一句话明确问题；Measure不需要昂贵设备，用现有数据即可；Analyze不一定用高级统计，鱼骨图和5Why就够了；Improve可以直接试改；Control可以用日常点检替代统计控制图。",
    relatedEntries: ["six_sigma", "pdca", "8d_methodology", "spc", "doe"],
    maturityLevel: "intermediate",
    tags: ["DMAIC", "六西格玛", "改善", "数据分析"],
  },
  {
    id: "pdca",
    category: "methodology",
    title: "PDCA 循环 (戴明环)",
    description:
      "Plan-Do-Check-Act，由休哈特提出、戴明推广的质量管理基本循环。是一切质量管理活动的最底层方法论。",
    purpose:
      "提供最简单、最通用的持续改进框架。任何质量改进活动都可以套用PDCA：计划→执行→检查效果→标准化或再改进。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["全球"],
    keyConcepts: [
      `Plan: 制定目标和计划「, 」Do: 按计划执行`,
      `Check: 检查结果与目标差异「, 」Act: 标准化或进入下一轮`,
    ],
    practicalGuidance:
      "PDCA看起来简单，但大多数人只做到了PD而忽略了CA。关键在Check和Act两个环节：Check是要诚实面对结果（包括失败），Act是要把成功的做法固化下来。小企业建议每个改进项目都用A3报告（一页纸）记录完整的PDCA。",
    relatedEntries: ["dmaic", "8d_methodology", "kaizen", "lean", "tqm"],
    maturityLevel: "foundational",
    tags: ["PDCA", "戴明", "持续改进", "休哈特"],
  },
  {
    id: "tps",
    category: "methodology",
    title: "丰田生产系统 (TPS)",
    description:
      `丰田汽车创立的革命性生产管理体系，以「自働化」和「准时化」为两大支柱，是全球制造业的标杆。`,
    purpose:
      "通过消除浪费、尊重员工、持续改善，实现最高质量、最低成本、最短交货期。TPS证明了一个道理：最高质量不一定意味着最高成本。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "通用制造"],
    countries: ["日本", "全球"],
    keyConcepts: [
      "自働化(Jidoka)——赋予机器人的智慧",
      "准时化(JIT)——只在需要时按需生产",
      "安灯(Andon)——发现问题立即停线",
      "看板(Kanban)——拉动式生产",
      `均衡化(Heijunka)「, 」标准化作业`,
      `防错法(Poka-Yoke)「, 」现地现物(Genchi Genbutsu)`,
    ],
    practicalGuidance:
      `TPS的精华不是看板、安灯这些工具，而是「现地现物」的思维方式——管理者必须亲自到现场去看、去理解问题。中小企业学习TPS从三件事做起：(1)管理者每天下现场1小时；(2)任何人发现问题可以停线或停设备；(3)把问题当作改善机会而非追责对象。`,
    relatedEntries: ["lean", "kaizen", "5s", "pokayoke", "pdca"],
    maturityLevel: "excellence",
    tags: ["TPS", "丰田", "精益", "自働化", "JIT"],
  },

  // ==================== QUALITY TOOLS ====================
  {
    id: "fmea",
    category: "tool",
    title: "FMEA 失效模式与影响分析",
    description:
      "预防性风险分析工具，分为DFMEA（设计FMEA）和PFMEA（过程FMEA）。新版AIAG-VDA FMEA采用七步法，使用行动优先级(AP)替代传统的RPN。",
    purpose:
      "在问题发生之前系统地识别潜在的失效模式、后果和原因，优先采取预防措施。FMEA是APQP和PPAP的核心输入。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "航空航天", "医疗器械", "电子", "通用制造"],
    countries: ["全球"],
    keyConcepts: [
      `功能分析「, 」失效模式/后果/原因「, 」严重度(S)/频度(O)/探测度(D)`,
      `行动优先级(AP: H/M/L)「, 」风险分析「, 」优化措施`,
      `DFMEA/PFMEA/MSR「, 」结构树/功能网/失效网`,
    ],
    practicalGuidance:
      "小企业不必全做新七步法FMEA。可以简化：列出关键工序→识别可能出错的地方→判断严重度→对高风险项制定预防措施→形成一张A3纸的表格。关键不是做完FMEA表格，而是通过讨论让团队对风险有共识。好的FMEA是活的文件，每次出问题都要回顾更新。",
    relatedEntries: ["control_plan", "apqp", "ppap", "spc", "ishikawa"],
    maturityLevel: "intermediate",
    tags: ["FMEA", "风险分析", "预防", "AIAG", "VDA"],
  },
  {
    id: "control_plan",
    category: "tool",
    title: "控制计划 (Control Plan)",
    description:
      "将FMEA的输出转化为生产过程中的控制手段。规定每个工序的监控项目、规格/公差、测量方法、样本量/频率、控制方法和反应计划。",
    purpose:
      "确保生产过程始终处于受控状态，当出现异常时能及时发现并采取纠正措施。控制计划是连接质量策划和生产执行的关键桥梁。",
    applicability: ["world_class", "medium", "small"],
    industries: ["汽车", "电子", "通用制造", "医疗器械"],
    countries: ["全球"],
    keyConcepts: [
      `样件控制计划「, 」试生产控制计划「, 」量产控制计划`,
      `产品特性 vs 过程特性「, 」特殊特性(SC/CC/KPC)`,
      `评价/测量技术「, 」控制方法「, 」反应计划`,
    ],
    practicalGuidance:
      "小微企业做控制计划不要追求AIAG的复杂表格。最简单的控制计划就是：每道工序→什么是好的/什么是坏的→怎么检查→多久检查一次→出了问题怎么办。写在纸上贴在工位上，培训操作工，这就已经有80分的效果了。",
    relatedEntries: ["fmea", "spc", "msa", "apqp", "ppap"],
    maturityLevel: "intermediate",
    tags: ["控制计划", "过程控制", "AIAG"],
  },
  {
    id: "spc",
    category: "tool",
    title: "SPC 统计过程控制",
    description:
      "使用统计方法监控和控制生产过程。通过控制图区分普通原因变差和特殊原因变差，在缺陷发生之前进行预防。",
    purpose:
      `将质量控制从「事后检验」转变为「事前预防」。通过统计信号（如判异准则）在过程出现异常趋势时就发出预警，不等到产生不良品才发现。`,
    applicability: ["world_class", "medium"],
    industries: ["汽车", "电子", "半导体", "化工", "制药"],
    countries: ["全球"],
    keyConcepts: [
      "变差（普通原因 vs 特殊原因）",
      "控制图（Xbar-R, X-MR, P, C, U等）",
      "过程能力指数(Cp, Cpk, Pp, Ppk)",
      `判异准则（西方电气规则）「, 」过程稳定 vs 过程能力`,
    ],
    practicalGuidance:
      "小企业不建议买昂贵的SPC软件。Excel就能做Xbar-R图和X-MR图。关键不是画图，而是学会读图：七个连续点在中心线同一侧→已经发生偏移；点出界→立即停线调查。培养班组长读图能力比买软件重要100倍。",
    relatedEntries: ["msa", "control_plan", "six_sigma", "fmea"],
    maturityLevel: "advanced",
    tags: ["SPC", "统计", "控制图", "过程能力"],
  },
  {
    id: "msa",
    category: "tool",
    title: "MSA 测量系统分析",
    description:
      "评估测量系统的变异程度，包括偏倚(Bias)、线性、稳定性、重复性(Repeatability)和再现性(Reproducibility)。Gage R&R是最常用的MSA方法。",
    purpose:
      "确保测量数据的可靠性。如果测量系统本身不可靠（如%GR&R>30%），所有基于数据做出的质量决策都可能是错的。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "电子", "精密制造", "医疗器械", "航空航天"],
    countries: ["全球"],
    keyConcepts: [
      `偏倚(Bias)「, 」线性(Linearity)「, 」稳定性(Stability)`,
      `重复性(EV)「, 」再现性(AV)「, 」Gage R&R(%GR&R)`,
      `计量型 vs 计数型「, 」NDC(可区分类别数)`,
    ],
    practicalGuidance:
      "小企业做MSA不需要复杂的实验设计。一个简单方法：拿同一个零件→同一人测量10次→看重复性；两个不同人各测5次→看再现性。如果两人测量结果差异大，先统一测量方法再做培训，这比买新量具更有效。",
    relatedEntries: ["spc", "control_plan", "fmea", "iso17025"],
    maturityLevel: "intermediate",
    tags: ["MSA", "测量系统", "GR&R", "量具"],
  },
  {
    id: "apqp",
    category: "tool",
    title: "APQP 先期产品质量策划",
    description:
      "AIAG发布的结构化产品开发流程，确保在产品量产之前完成所有的质量策划活动。涵盖五个阶段：策划、产品设计、过程设计、产品和过程确认、反馈评定与纠正。",
    purpose:
      "在开发阶段投入足够精力做质量预防，避免量产后出现重大质量问题。APQP的核心思想是：前期1小时的预防等于后期100小时的救火。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "航空航天", "医疗器械", "电子"],
    countries: ["全球"],
    keyConcepts: [
      `五阶段流程「, 」同步工程(CE)「, 」关键路径法`,
      `DFMEA/PFMEA「, 」控制计划「, 」PPAP「, 」SPC/MSA`,
      `各阶段评审(Gate Review)「, 」质量阀(Quality Gate)`,
    ],
    practicalGuidance:
      "中小企业可以采用简化的APQP流程：只保留概念评审→设计评审→试产评审→量产评审四个关键节点。每个节点必须回答三个问题：(1)设计方案能确保质量吗？(2)制造过程能力够吗？(3)测量方法可靠吗？三个问题都Yes才能通过评审。",
    relatedEntries: ["ppap", "fmea", "control_plan", "spc", "msa"],
    maturityLevel: "advanced",
    tags: ["APQP", "产品开发", "前期策划", "AIAG"],
  },
  {
    id: "ppap",
    category: "tool",
    title: "PPAP 生产件批准程序",
    description:
      "AIAG发布的供应商提交文件包，用于验证供应商的生产过程是否能够持续生产出符合要求的零件。包含18项元素，分为5个提交等级。",
    purpose:
      "确保供应商理解客户的设计和要求，验证生产过程能力满足客户要求，建立批量生产的质量基线。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "航空航天"],
    countries: ["全球"],
    keyConcepts: [
      `18项PPAP元素「, 」提交等级(1-5级)`,
      `设计记录「, 」工程变更文件「, 」DFMEA/PFMEA`,
      `尺寸结果「, 」材料/性能试验结果`,
      `初始过程能力研究「, 」测量系统分析`,
      "零件提交保证书(PSW)",
    ],
    practicalGuidance:
      `对供应商来说，PPAP不应是一次性提交，而应内化为自己的质量管理工具。小供应商可以先建立内部的「迷你PPAP」流程：每次新产品量产前，确保有完整的图纸→FMEA→控制计划→初始能力研究→首件检验报告，这几样东西齐全才能开始批量生产。`,
    relatedEntries: ["apqp", "fmea", "control_plan", "spc", "msa"],
    maturityLevel: "advanced",
    tags: ["PPAP", "供应商", "批准", "AIAG"],
  },
  {
    id: "ishikawa",
    category: "tool",
    title: "鱼骨图 (因果图/Ishikawa)",
    description:
      "石川馨发明的根本原因分析工具。将可能原因按6M（人、机器、材料、方法、测量、环境）分类，可视化地展示因果关系的全貌。",
    purpose:
      "帮助团队系统性地头脑风暴问题原因，避免遗漏关键因素，为后续的验证和根因确认提供完整框架。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["全球"],
    keyConcepts: [
      "6M: 人(Man)、机(Machine)、料(Material)、法(Method)、测(Measurement)、环(Environment/Mother Nature)",
      `问题陈述（鱼头）「, 」主骨和鱼刺（原因层级）`,
      "轻量原因→子原因→根本原因",
    ],
    practicalGuidance:
      "最简单的根因分析工具，所有规模的公司都应该会用。小作坊用白板纸、便签贴就能做。关键技巧：(1)问题描述要具体可测量；(2)每个6M分支至少想出3个原因；(3)用数据验证而不是靠感觉。最好和5Why结合使用。",
    relatedEntries: ["five_whys", "8d_methodology", "dmaic", "fmea"],
    maturityLevel: "foundational",
    tags: ["鱼骨图", "石川馨", "根因分析", "6M"],
  },
  {
    id: "five_whys",
    category: "tool",
    title: "5 Why 分析",
    description:
      `由丰田生产方式中最著名的根因分析方法。通过连续追问「为什么」5次（有时更多或更少），穿透表面现象找到根本原因。`,
    purpose:
      `避免「头痛医头、脚痛医脚」。5Why的力量在于揭示系统性原因而非停留在操作者失误的表面。`,
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["全球"],
    keyConcepts: [
      `每次只问一个为什么「, 」从现象→直接原因→更深层原因→根本原因`,
      `用数据验证每一步「, 」能否预防问题再发？「, 」避免归咎于人`,
    ],
    practicalGuidance:
      `5Why用得好是最强大的工具，用得不好就成了找借口。关键原则：(1)每一步必须基于事实/数据；(2)最后的根因必须能够通过「关闭这个原因就能预防问题再发」的测试；(3)如果答案最终指向「人」，说明你问得不够深——继续追问「为什么这个人会犯错？」直到找到系统原因。`,
    relatedEntries: ["ishikawa", "8d_methodology", "pdca", "dmaic"],
    maturityLevel: "foundational",
    tags: ["5Why", "根因分析", "丰田", "根本原因"],
  },
  {
    id: "pareto",
    category: "tool",
    title: "帕累托分析 (80/20法则)",
    description:
      `基于维尔弗雷多·帕累托发现的80/20分布原则的质量工具。用柱状图和累计折线图展示「少数关键问题造成大部分质量缺陷」的现象。`,
    purpose:
      "帮助质量团队将有限的资源聚焦在影响最大的问题上，用最小的努力获得最大的改善效果。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["全球"],
    keyConcepts: [
      "柱状图（降序排列）+ 累计百分比折线",
      "分类数据（缺陷类型、机器编号、班次等）",
      `80%线识别关键少数「, 」按频率、成本、严重度分析`,
    ],
    practicalGuidance:
      "任何规模的公司都能用。只用Excel就能做。每周/每月做一次缺陷帕累托图，重点解决前2-3类问题。一个简单公式：用缺陷数量×严重度权重来做加权帕累托，比单纯按数量排更合理。",
    relatedEntries: ["ishikawa", "spc", "8d_methodology", "dmaic"],
    maturityLevel: "foundational",
    tags: ["帕累托", "80/20", "缺陷分析", "优先级"],
  },
  {
    id: "pokayoke",
    category: "tool",
    title: "防错法 (Poka-Yoke)",
    description:
      `日语「ポカヨケ」，由新乡重夫发明。通过设计工具、夹具、工序或流程，使错误不可能发生或在发生前被立即检测出来。`,
    purpose:
      "从依赖人的注意力和技能转向依赖系统和装置来防错。防错的终极目标是：让正确的事最容易做，让错误的事不可能做。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["日本", "全球"],
    keyConcepts: [
      "预防型防错（让错误不可能发生）",
      "检测型防错（错误发生时立即发现并停止）",
      "接触法、固定值法、动作步骤法",
      `防错等级：防止>检测>警告「, 」低成本的简单装置往往最有效`,
    ],
    practicalGuidance:
      `不需要昂贵设备。很多防错措施成本为零：改变零件摆放方向迫使操作工正确放置、用颜色区分相似零件、在工装上开槽只允许正确方向放入。小企业最大的防错资源是一线员工的智慧——定期组织「防错风暴会」，每个改善建议奖励50-200元。`,
    relatedEntries: ["lean", "tps", "kaizen", "control_plan"],
    maturityLevel: "foundational",
    tags: ["防错", "Poka-Yoke", "新乡重夫", "错误预防"],
  },
  {
    id: "doe",
    category: "tool",
    title: "DOE 实验设计",
    description:
      "统计学方法用于系统地规划实验，同时研究多个因子对结果的影响及其交互作用。包括全因子实验、部分因子实验、响应曲面法等。",
    purpose:
      "用最少的实验次数找到最优参数组合，同时量化各因子的影响程度和交互效应。特别适合工艺优化和参数调优。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "电子", "半导体", "化工", "制药", "医疗器械"],
    countries: ["全球"],
    keyConcepts: [
      `因子(Factor)和水平(Level)「, 」主效应和交互效应`,
      `全因子/部分因子设计「, 」中心点和区组`,
      `响应曲面法(RSM)「, 」田口方法(Taguchi)`,
    ],
    practicalGuidance:
      "中小企业可以从简单的两水平因子实验开始。Minitab或JMP能自动生成实验方案并分析结果。关键是：(1)先筛选关键因子（用鱼骨图或经验判断）；(2)控制实验条件（每次只改变计划中规定变化的因子）；(3)先做筛选实验，再做优化实验。",
    relatedEntries: ["six_sigma", "dmaic", "spc", "fmea"],
    maturityLevel: "advanced",
    tags: ["DOE", "实验设计", "统计", "田口方法"],
  },
  {
    id: "5s",
    category: "tool",
    title: "5S 现场管理",
    description:
      "源自日本的现场管理方法：整理(Seiri)、整顿(Seiton)、清扫(Seiso)、清洁(Seiketsu)、素养(Shitsuke)。是精益生产的基础。",
    purpose:
      "创造整洁、有序、高效的工作环境，使异常能够一目了然，减少品质问题、安全隐患和效率损失。5S是实施所有质量改善的前提条件。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["日本", "全球"],
    keyConcepts: [
      "整理：区分要与不要，坚决清除不要的",
      "整顿：科学布局，物有其位，定位定量",
      "清扫：清除脏污，保持洁净",
      "清洁：制度化、规范化前面3S",
      "素养：养成习惯，内化为素质",
    ],
    practicalGuidance:
      "小作坊推行5S最有爆发力：(1)第一周大扫除，丢掉所有无用东西；(2)第二周每个工具/物料定位划线，画在地上的标记便宜但有效；(3)第三周定标准和检查表；(4)每个月一次5S评比。老板必须亲自参与第一次大扫除，这是建立5S文化的最关键一步。",
    relatedEntries: ["lean", "kaizen", "tps", "pokayoke"],
    maturityLevel: "foundational",
    tags: ["5S", "现场管理", "整理整顿", "可视化"],
  },

  // ==================== COUNTRY/REGION SPECIFIC PRACTICES ====================
  {
    id: "quality_japan",
    category: "country_practice",
    title: "日本质量管理实践",
    description:
      "日本是世界质量管理的发源地之一。从战后戴明思想的引入到丰田生产系统的诞生，日本创造了独特的质量文化和实践体系。",
    purpose:
      `理解日本质量哲学的精髓——质量是「用眼睛管理」的现场主义，而不是「用文件管理」的官僚主义。日本质量模式的三大支柱：5S+标准化+全员改善。`,
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["日本"],
    keyConcepts: [
      `现地现物(Genchi Genbutsu)「, 」方针管理(Hoshin Kanri)`,
      `QC小组活动「, 」戴明奖（全球最高质量荣誉）`,
      `JIS标准（日本工业标准）「, 」职人精神`,
      `持续改善而非大变革「, 」以过程为导向的管理`,
    ],
    practicalGuidance:
      `日本质量管理最值得学习的三点：(1)高管亲自下现场——不是视察而是学习和指导；(2)把问题当作「宝藏」——每个问题都是改善机会；(3)花80%时间在现场、20%时间在办公室。日本的中小企业质量水平普遍高于其他国家，原因是他们将质量管理融入了日常工作习惯而非依赖复杂体系。`,
    relatedEntries: ["tps", "lean", "kaizen", "5s", "tqm", "jis"],
    maturityLevel: "foundational",
    tags: ["日本", "品质管理", "丰田", "现场", "职人"],
  },
  {
    id: "quality_germany",
    category: "country_practice",
    title: "德国质量管理实践",
    description:
      "德国以精密制造和严格的标准化著称。VDA（德国汽车工业联合会）标准体系是全球汽车行业的标杆之一。德国质量模式融合了严谨的标准、严谨的执行和持续的技术创新。",
    purpose:
      `了解德国质量管理的双轨制：强制性的行业标准和自愿性的企业自我约束。德国模式的精髓在于「标准建立信任」，通过严格的第三方认证和审核维持高质量水平。`,
    applicability: ["world_class", "medium"],
    industries: ["汽车", "机械", "精密制造", "化工", "医疗器械"],
    countries: ["德国", "欧洲"],
    keyConcepts: [
      `VDA系列标准「, 」TÜV认证「, 」DGQ（德国质量协会）`,
      `双元制职业教育「, 」Meister（技师）制度`,
      `DIN标准（德国工业标准）「, 」严谨的文件化和可追溯性`,
      `过程审核(VDA 6.3)「, 」产品审核(VDA 6.5)`,
    ],
    practicalGuidance:
      `与德系供应链合作的质量人员必须理解：德国客户对文件和记录的完整性要求极高。每个质量决策都必须有记录——不是官僚主义，而是审计追溯。建议中小企业建立「一工序一档案」制度：每道工序有作业指导书+检验标准+历史记录，这在德系审核中是基本要求。`,
    relatedEntries: ["vda6_3", "iatf16949", "iso9001", "fmea", "spc"],
    maturityLevel: "advanced",
    tags: ["德国", "VDA", "TÜV", "精密制造", "标准化"],
  },
  {
    id: "quality_usa",
    category: "country_practice",
    title: "美国质量管理实践",
    description:
      "美国是六西格玛、波多里奇奖和众多统计方法的发源地。美国质量管理的特色是数据驱动和结果导向，强调用统计方法量化质量并驱动改进。",
    purpose:
      `了解美国质量管理中「用数据说话」的传统。ASQ（美国质量学会）是全球最大的质量专业组织，其认证体系是全球质量人才的黄金标准。`,
    applicability: ["world_class", "medium"],
    industries: ["汽车", "航空航天", "电子", "医疗器械", "制药", "国防"],
    countries: ["美国", "北美"],
    keyConcepts: [
      `六西格玛(Motorola/GE)「, 」ASQ认证体系(CQE/CQM/CMQ等)`,
      `AIAG标准体系「, 」波多里奇卓越绩效奖`,
      `FDA质量管理规范(cGMP/QSR)「, 」MIL军标体系`,
      `DOE和高级统计方法「, 」供应商质量工程(SQE)`,
    ],
    practicalGuidance:
      "美国客户最看重的是数据和证据。小供应商面向美国市场时，最应该投入的是计量设备（能用数据说话）和检验记录（有据可查）。CQE（认证质量工程师）证书在美国供应链中很有含金量，值得有条件的质量人员考取。",
    relatedEntries: ["six_sigma", "dmaic", "doe", "fda", "spc"],
    maturityLevel: "advanced",
    tags: ["美国", "ASQ", "六西格玛", "AIAG", "FDA"],
  },
  {
    id: "quality_china",
    category: "country_practice",
    title: "中国质量管理实践",
    description:
      `中国正在从「制造大国」向「质量强国」转型。GB/T标准体系对标国际标准，同时有自身的特色。近年来越来越多的中国企业在各行业达到世界级质量水平。`,
    purpose:
      "帮助中国企业理解质量提升的路径——不必照搬国外全套体系，而是找到适合自身发展阶段和业务特点的质量管理模式。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["中国"],
    keyConcepts: [
      `GB/T 19001(等同ISO 9001)「, 」CCC强制性产品认证`,
      `中国质量奖「, 」首席质量官制度「, 」CNAS认可`,
      `快速学习和迭代能力「, 」从代工到自主品牌的质量转型`,
    ],
    practicalGuidance:
      `中国企业的质量管理需要走自己的路：(1)小企业先做好「有标准、有检验、有记录」三项基础，比体系认证更实用；(2)中型企业引入关键工具（FMEA、SPC、控制计划），在核心工序先做到位；(3)将数字化作为质量管理的加速器——中国企业的数字化能力普遍强于同等规模的国外企业，可以低成本实现质量数据采集和分析。`,
    relatedEntries: ["iso9001", "iatf16949", "lean", "spc", "fmea"],
    maturityLevel: "foundational",
    tags: ["中国", "GB/T", "质量强国", "CCC", "CNAS"],
  },
  {
    id: "quality_korea",
    category: "country_practice",
    title: "韩国质量管理实践",
    description:
      "韩国质量管理的崛起伴随三星、现代等企业从跟随者到领导者的转型。韩国模式的特点是：在借鉴日美经验的基础上，形成了以财阀企业为核心的严苛质量管理体系。",
    purpose:
      "学习韩国企业如何通过严格的质量管理实现快速赶超。特别适合希望快速提升质量水平的成长型企业借鉴。",
    applicability: ["world_class", "medium"],
    industries: ["电子", "半导体", "汽车", "造船", "钢铁"],
    countries: ["韩国"],
    keyConcepts: [
      `韩国标准(KS)「, 」品质经营体系`,
      `三星质量体系（严于国际标准）「, 」六西格玛（韩国引进最早）`,
      `检验检测体系「, 」快速质量改善文化`,
    ],
    practicalGuidance:
      `韩国质量管理的核心特点是「严格」和「快速」。与韩国企业合作的质量人员要注意：(1)标准和规格必须精确到极致；(2)检验频率和样本量通常高于国际通用标准；(3)反应速度要求非常高——24小时内必须响应质量问题。`,
    relatedEntries: ["six_sigma", "spc", "msa", "iso9001"],
    maturityLevel: "advanced",
    tags: ["韩国", "三星", "品质经营", "KS"],
  },

  // ==================== INDUSTRY-SPECIFIC ====================
  {
    id: "fda_qsr",
    category: "industry_specific",
    title: "FDA 质量体系法规 (21 CFR Part 820)",
    description:
      "美国FDA对医疗器械制造商强制执行的质量体系法规(QSR)，涵盖了设计控制、采购控制、生产和过程控制、纠正预防措施等全方位要求。",
    purpose:
      "确保进入美国市场的医疗器械安全有效。FDA检查员会到工厂进行现场审核，不合规可导致警告信、进口禁令甚至刑事处罚。",
    applicability: ["world_class", "medium"],
    industries: ["医疗器械"],
    countries: ["美国", "全球（出口美国）"],
    keyConcepts: [
      `设计控制(Design Control)「, 」CAPA系统`,
      `设备验证(IQ/OQ/PQ)「, 」过程确认`,
      `供应商管理「, 」投诉处理和MDR报告`,
      `管理评审「, 」质量审核「, 」文档控制`,
    ],
    practicalGuidance:
      "FDA审核最关注两点：(1)CAPA系统是否有闭环——发现问题→根因分析→纠正措施→有效性验证→关闭；(2)投诉是否被认真对待和处理。中小企业建议先建立稳健的CAPA和投诉处理系统，这两项是FDA审核中发现问题最多的领域。",
    relatedEntries: ["iso13485", "fmea", "cap", "gmp"],
    maturityLevel: "advanced",
    tags: ["FDA", "医疗器械", "QSR", "21CFR820", "CAPA"],
  },
  {
    id: "gmp",
    category: "industry_specific",
    title: "GMP 药品生产质量管理规范",
    description:
      "药品、医疗器械、食品和化妆品等受监管行业必须遵守的生产质量管理规范。中国的GMP由药监局(NMPA)强制实施，美国、欧盟、日本等地也有各自的GMP法规。",
    purpose:
      "确保产品始终按照既定质量标准生产，保护患者和消费者安全。GMP的核心是防止污染、混淆和差错。",
    applicability: ["world_class", "medium"],
    industries: ["制药", "医疗器械", "食品", "化妆品"],
    countries: ["全球"],
    keyConcepts: [
      "验证（工艺验证、清洁验证、方法验证）",
      `变更控制「, 」偏差处理「, 」年度质量回顾`,
      `供应商审计「, 」洁净区管理「, 」批记录`,
      `无菌保证「, 」质量风险管理`,
    ],
    practicalGuidance:
      `GMP行业的新进入者面临的第一个挑战不是技术而是观念：GMP不是「把产品做出来就行」，而是「每一步都要被证明做对了」。建议中小企业从工艺验证和偏差处理两个核心模块开始建立GMP体系，逐步完善。`,
    relatedEntries: ["iso13485", "fda_qsr", "fmea", "iso9001"],
    maturityLevel: "advanced",
    tags: ["GMP", "制药", "医疗器械", "验证", "法规"],
  },
  {
    id: "nadcap",
    category: "industry_specific",
    title: "Nadcap 特殊过程认证（航空航天）",
    description:
      "国家航空航天和国防承包商认证计划，针对航空航天行业的特殊过程（热处理、焊接、表面处理、无损检测等）进行认证。",
    purpose:
      "确保航空航天供应链中特殊过程的可靠性和一致性。Nadcap认证是全球航空航天行业的准入门槛之一。",
    applicability: ["world_class", "medium"],
    industries: ["航空航天", "国防"],
    countries: ["全球（航空航天供应链）"],
    keyConcepts: [
      `特殊过程审核清单「, 」过程控制试验`,
      `设备校准和认证「, 」操作人员资格认证`,
      `标准作业程序「, 」过程监控和记录`,
    ],
    practicalGuidance:
      "进入航空航天供应链的第一步往往就是Nadcap认证。小微企业如果希望进入这一领域，建议选择一个核心特殊过程先做认证（如热处理或无损检测），建立口碑后再扩展。认证准备期通常需要6-12个月。",
    relatedEntries: ["as9100", "fmea", "spc", "iso17025"],
    maturityLevel: "advanced",
    tags: ["Nadcap", "航空航天", "特殊过程", "认证"],
  },

  // ==================== PRACTICES ====================
  {
    id: "quality_cost",
    category: "practice",
    title: "质量成本管理 (Cost of Quality)",
    description:
      "将质量相关的成本分为四类：预防成本、鉴定成本、内部失败成本和外部失败成本。通过管理质量成本结构，优化质量投资回报。",
    purpose:
      "用财务语言向管理层证明质量是投资而非成本。一般而言，增加预防投入可大幅减少失败成本，总质量成本呈U型曲线，最佳点是在预防和鉴定成本适度投入时。",
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["全球"],
    keyConcepts: [
      "预防成本（培训、体系维护、过程控制）",
      "鉴定成本（检验、测试、审核）",
      "内部失败成本（报废、返工、停机）",
      "外部失败成本（退货、赔偿、信誉损失）",
    ],
    practicalGuidance:
      `小企业哪怕只追踪报废和返工的成本，也能产生巨大的管理价值。建议每月统计：报废金额+返工工时×人工费率+客户退货金额。用这个数据说服团队和管理层：我们不是在「花钱建体系」，而是在「省钱——减少失败成本」。`,
    relatedEntries: ["tqm", "six_sigma", "pareto", "lean"],
    maturityLevel: "intermediate",
    tags: ["质量成本", "COQ", "报废", "返工", "ROI"],
  },
  {
    id: "supplier_quality",
    category: "practice",
    title: "供应商质量管理",
    description:
      "系统化管理供应商质量的方法。包括供应商准入评估、绩效监控、质量问题升级、辅导发展等全生命周期管理。",
    purpose:
      "确保外部提供的产品和服务满足质量要求。汽车行业的经验表明，60-70%的质量问题来源于供应链，供应商质量管理直接影响最终产品质量。",
    applicability: ["world_class", "medium"],
    industries: ["汽车", "电子", "航空航天", "医疗器械"],
    countries: ["全球"],
    keyConcepts: [
      `供应商准入审核「, 」供应商分级管理(A/B/C)`,
      `PPAP/FAI「, 」来料检验(IQC)「, 」供应商绩效评分(QCD)`,
      `质量协议「, 」8D报告要求「, 」供应商辅导与退出机制`,
    ],
    practicalGuidance:
      `中小企业的供应商质量管理可以从「三件套」入手：(1)新供应商必须做现场审核（至少去看一次）；(2)关键物料来料100%检验或加严抽样；(3)每季度给供应商发质量绩效报告。这三件事建立起来，供应商质量就能提升50%以上。`,
    relatedEntries: ["ppap", "8d_methodology", "fmea", "control_plan"],
    maturityLevel: "intermediate",
    tags: ["供应商", "SQE", "供应链", "来料检验"],
  },
  {
    id: "quality_culture",
    category: "practice",
    title: "质量文化建设",
    description:
      `质量体系是骨架，质量文化是灵魂。最先进的质量体系如果在「差不多就行」的文化中，也发挥不了作用。质量文化建设的核心是将质量价值观转化为每个人的行为习惯。`,
    purpose:
      `让「质量第一」不是口号而是行动。高质量文化的特征：员工发现问题主动报告而非隐瞒、管理者关注过程而非仅看结果、质量问题追责系统而非个人。`,
    applicability: ["world_class", "medium", "small"],
    industries: ["所有行业"],
    countries: ["全球"],
    keyConcepts: [
      `领导者示范行为「, 」心理安全（可以报告错误）`,
      `奖励发现问题和预防「, 」不惩罚学习性错误`,
      `质量故事和榜样「, 」可视化质量问题`,
    ],
    practicalGuidance:
      `建设质量文化最有效的方法：(1)老板每天亲自看5个产品，用手摸、用眼看——示范质量的重要性；(2)设立「质量发现奖」——第一个报告问题的人奖励而非惩罚；(3)每月全员质量会——用具体案例而非PPT讲质量；(4)客户投诉不是因为哪个人不行，是整个系统可以改进——这种归因方式是文化转变的关键。`,
    relatedEntries: ["tqm", "kaizen", "lean", "5s"],
    maturityLevel: "foundational",
    tags: ["质量文化", "领导力", "安全文化", "文化变革"],
  },
  {
    id: "digital_quality",
    category: "practice",
    title: "数字化质量管理",
    description:
      "利用信息技术和数据分析手段提升质量管理效率和效果。包括质量管理系统(QMS软件)、在线检测、SPC实时监控、质量大数据分析和AI辅助检测等。",
    purpose:
      `降低质量管理的执行成本，提高数据的及时性和准确性，使质量决策从「经验驱动」升级为「数据驱动」。数字化是实现全面质量管理的重要工具。`,
    applicability: ["world_class", "medium", "small"],
    industries: ["汽车", "电子", "通用制造", "医疗器械"],
    countries: ["全球"],
    keyConcepts: [
      `QMS软件系统「, 」SPC在线监控「, 」AI视觉检测`,
      `质量大数据分析「, 」数字化追溯系统「, 」无纸化质量管理`,
      `MES中的质量管理模块「, 」移动端质量数据采集`,
    ],
    practicalGuidance:
      "小企业数字化从低成本的工具开始：(1)用微信小程序或钉钉做质量巡检记录（替代纸质表单）；(2)用Excel+免费BI工具做质量数据可视化；(3)用现成的QMS SaaS工具（如8D Reports）替代自建系统。数字化不是买最贵的软件，而是找到最适合当前规模的工具。",
    relatedEntries: ["spc", "msa", "pareto", "quality_cost"],
    maturityLevel: "intermediate",
    tags: ["数字化", "质量管理系统", "AI", "大数据"],
  },

  // ==================== SMALL BUSINESS QUALITY PATH ====================
  {
    id: "small_business_quality_path",
    category: "practice",
    title: "小企业/小作坊质量提升路径",
    description:
      "针对10-100人规模的小企业和小作坊的实用质量提升路线图。不需要ISO认证、不需要黑带、不需要昂贵设备，用最简单的方法实现最大的质量改善。",
    purpose:
      "为资源有限的小企业提供切实可行的质量改善方法。关键原则：先做能立即见效的、不需要太多投入的、员工能理解并参与的改善。",
    applicability: ["small"],
    industries: ["通用制造", "食品加工", "五金", "纺织服装", "印刷包装"],
    countries: ["全球"],
    keyConcepts: [
      "第一阶段（1-3个月）：5S+标准化+首件检验",
      "第二阶段（3-6个月）：检验标准+不良品处理+简单记录",
      "第三阶段（6-12个月）：鱼骨图+5Why+基本统计",
      "第四阶段（12个月+）：客户投诉闭环+供应商管理+自动化检测",
    ],
    practicalGuidance:
      `给小企业老板的三条核心建议：(1)先把5S做好——这是零成本的质量提升，做好了能减少30%的质量问题；(2)建立「首件检验」制度——每班、每次换型、每次调机后必须做首件检验并记录，能减少50%的批量不良；(3)建立一个「不良品展示台」——把典型的不良品挂在车间入口，标注原因和对策，让每个人每天都看到质量的重要性。`,
    relatedEntries: ["5s", "quality_culture", "pokayoke", "kaizen", "8d_methodology"],
    maturityLevel: "foundational",
    tags: ["小企业", "创业", "质量提升", "实用方法", "低成本"],
  },
  {
    id: "medium_business_quality_path",
    category: "practice",
    title: "中型企业质量提升路径",
    description:
      `针对100-1000人规模的中型企业的质量体系建设路线图。这个阶段的关键是从「人治」走向「法治」，建立系统化的质量管理体系但不追求过度复杂。`,
    purpose:
      "帮助中型企业在不增加过多管理成本的前提下，建立适合自身业务特点的质量管理体系，为持续增长奠定质量基础。",
    applicability: ["medium"],
    industries: ["通用制造", "汽车零部件", "电子制造", "医疗器械"],
    countries: ["全球"],
    keyConcepts: [
      "核心体系搭建：ISO 9001为基础",
      "关键工具导入：FMEA+控制计划+SPC",
      "供应商管理：评估+分级+辅导",
      "人才培养：培养内部质量工程师+班组长",
      "数字化：QMS系统+MES质量模块",
    ],
    practicalGuidance:
      "中型企业最常见的错误是一次性上全套体系导致消化不良。建议分三步走：(1)先做ISO 9001基础体系（6个月）；(2)再针对核心产品做FMEA和控制计划（3个月）；(3)最后在关键工序导入SPC（3个月）。每个阶段看到效果后再推进下一个阶段。切记：体系是为业务服务的，不是为认证服务的。",
    relatedEntries: ["iso9001", "fmea", "spc", "control_plan", "supplier_quality"],
    maturityLevel: "intermediate",
    tags: ["中型企业", "体系搭建", "工具导入", "质量提升"],
  },
  {
    id: "world_class_quality_path",
    category: "practice",
    title: "世界级企业质量管理特征",
    description:
      `分析世界顶级公司（丰田、GE、三星、博世、华为等）在质量管理上的共同特征和最佳实践。这些企业已将质量从「管理功能」升级为「战略竞争力」。`,
    purpose:
      "为追求卓越的企业提供对标参考。理解世界级质量不是一套文件体系，而是一种深入骨髓的组织能力。",
    applicability: ["world_class"],
    industries: ["汽车", "电子", "航空航天", "医疗器械", "半导体"],
    countries: ["全球"],
    keyConcepts: [
      "质量战略与业务战略一体化",
      "全员质量：从CEO到一线操作工",
      "预防为主：设计质量和过程能力的极致追求",
      "数据文化：所有质量决策基于数据",
      "供应商伙伴关系而非买卖关系",
      "持续创新：质量工具的自主研发和迭代",
      "全球质量知识管理系统",
    ],
    practicalGuidance:
      `世界级质量的五个标志：(1)质量问题在客户发现之前已被识别和解决；(2)质量数据实时、透明、全员可见；(3)供应商被当作质量伙伴而非问题来源；(4)每一个人都能回答「我的工作如何影响质量」；(5)质量改善是日常工作，不是专项项目。`,
    relatedEntries: ["tqm", "six_sigma", "tps", "lean", "digital_quality"],
    maturityLevel: "excellence",
    tags: ["世界级", "卓越", "标杆", "质量战略", "最佳实践"],
  },
]
