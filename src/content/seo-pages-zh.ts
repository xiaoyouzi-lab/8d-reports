import {
  getSeoPathPrefix,
  type SeoPage,
  type SeoPageType,
} from "@/content/seo-pages";

// Simplified Chinese mirror of the programmatic SEO generator in
// src/content/seo-pages.ts (Batch 3). The English module stays untouched and
// remains the source of truth for slugs, types, and structure. This module
// translates the shared Scenario field values and the shared static templates
// once, then builds the zh pages mechanically with buildZhPage.
//
// Keep the public surface aligned with the English module: seoPagesZh,
// getSeoPageZh, getSeoPagesByTypeZh, getRelatedSeoPagesZh, and buildZhPage.

type Scenario = {
  slug: string;
  industry: string;
  problemType: string;
  audience: string;
  product: string;
  defect: string;
  evidence: string;
  containment: string;
  rootCause: string;
  corrective: string;
  preventive: string;
  affectedScope: string;
  metric: string;
  detection: string;
  escapePoint: string;
  customerImpact: string;
  verification: string;
};

// (a) Scenario field values, translated once for every shared scenario.

const exampleScenarios: Scenario[] = [
  {
    slug: "automotive",
    industry: "汽车行业",
    problemType: "涂层失效",
    audience: "质量工程师与供应商质量团队",
    product: "制动支架批次 B26-041",
    defect: "盐雾验证后出现涂层剥落",
    evidence: "盐雾照片、涂层厚度读数和换线记录",
    containment: "隔离该批次、启动100%外观检验，并通知客户疑似批次",
    rootCause: "换线后跳过了夹具验证步骤",
    corrective: "在恢复生产前增加夹具强制签核",
    preventive: "更新控制计划并培训操作员执行换线验证",
    affectedScope: "涂装线2的2,460件制动支架，日期码为2026-04-18至2026-04-21",
    metric: "125件盐雾样品中有18件在72小时后出现边缘剥落；涂层厚度仍保持在18-24微米",
    detection: "盐雾验证、划格附着力测试、涂层厚度检查以及客户线边外观复核",
    escapePoint: "换线放行在生产记录夹具接触点检查之前就已释放",
    customerImpact: "若疑似支架出货，可能引发腐蚀索赔和客户产线中断",
    verification: "连续三次夹具换型后重启，附着力零失效，并有经审核的签核记录",
  },
  {
    slug: "semiconductor",
    industry: "半导体",
    problemType: "测试良率损失",
    audience: "工艺工程师与质量经理",
    product: "传感器IC晶圆批次 W-8842",
    defect: "最终测试出现异常漏电流失效",
    evidence: "晶圆图、最终测试日志、探针卡维护记录以及SEM复核记录",
    containment: "暂扣受影响晶圆批次，并使用收紧后的漏电限值筛选成品库存",
    rootCause: "探针卡污染在最终测试前造成间歇性焊盘损伤",
    corrective: "缩短探针卡清洁周期并增加批次开始检验",
    preventive: "按探针卡统计漏电失效趋势，在异常前触发维护",
    affectedScope: "晶圆批次 W-8842 以及在探针卡 PC-17 上测试的两个相邻批次",
    metric: "最终测试良率从97.8%的基线降至91.4%，漏电失效集中在两个晶圆区域",
    detection: "晶圆图复核、最终测试漏电日志、探针卡检验以及失效焊盘的SEM复核",
    escapePoint: "探针卡维护由日历周期触发，而非漏电趋势或批次开始状态",
    customerImpact: "出货放行延迟，并存在潜在电气失效流入模块组装的风险",
    verification: "修订清洁周期后连续五个批次良率高于97%，且无焊盘损伤特征",
  },
  {
    slug: "electronics",
    industry: "电子",
    problemType: "焊点缺陷",
    audience: "电子制造质量团队",
    product: "控制器PCB组件 PCA-1048",
    defect: "焊点开裂导致CAN通信间歇中断",
    evidence: "X射线图像、AOI日志、回流焊曲线记录以及退回件照片",
    containment: "通过温度循环筛选成品，并隔离受影响日期码",
    rootCause: "回流焊保温区低于已批准的工艺窗口",
    corrective: "恢复回流焊曲线并增加曲线锁定审批",
    preventive: "每周审核回流焊配方，并对曲线编辑要求工程审批",
    affectedScope: "SMT 3线B班生产的PCA-1048组件，日期码2026-05-03",
    metric: "80件退回单元中有7件在-20°C至70°C温度循环中CAN通信失败",
    detection: "X射线检查、AOI趋势复核、回流焊曲线比对以及退回件焊点剖面分析",
    escapePoint: "配方编辑权限允许在未经工程评审的情况下修改保温区",
    customerImpact: "现场通信间歇性丢失，并导致客户现场重复维修",
    verification: "在曲线锁定和AOI限值更新后，对300件筛选组件进行温度循环，CAN零中断",
  },
  {
    slug: "medical-device",
    industry: "医疗器械",
    problemType: "标签不一致",
    audience: "医疗器械质量与法规团队",
    product: "无菌导管套件标签套件",
    defect: "客户发现包装袋与外箱标签的批号不一致",
    evidence: "器械历史记录、标签核对表以及包装线相机抓拍",
    containment: "停止出货、核对成品库存，并隔离所有在制工单",
    rootCause: "标签卷更换清单未要求两人核对批号",
    corrective: "在标签卷更换时增加独立批号核对",
    preventive: "修订包装SOP并增加相机系统异常复核",
    affectedScope: "P2线包装的无菌导管套件工单 WO-7721 和 WO-7722",
    metric: "客户发现1处确认不一致；4,800套组件被暂扣以进行核对",
    detection: "DHR复核、标签核对、包装相机图像以及成品批次追溯",
    escapePoint: "订单中途更换标签卷时，产线清场仅依赖一名操作员确认",
    customerImpact: "潜在的批次可追溯性混乱和法规投诉升级",
    verification: "暂扣库存100%核对完成，并连续30次标签卷更换均有双人核对记录",
  },
  {
    slug: "supplier-quality",
    industry: "供应商质量",
    problemType: "来料检验不合格",
    audience: "管理供应商纠正措施的SQE团队",
    product: "由供应商A17供应的机加工铝制壳体",
    defect: "来料零件螺纹深度低于规格",
    evidence: "来料检验记录、供应商SPC图表以及换刀记录",
    containment: "拒收受影响批次，并要求供应商提供认证库存",
    rootCause: "供应商刀具磨损检查的抽样频率相对于切削负载过低",
    corrective: "增加刀具磨损检查并增加首件螺纹深度确认",
    preventive: "更新供应商控制计划并要求每月提交SPC",
    affectedScope: "机加工铝制壳体的来料批次 A17-2405-11 和 A17-2405-12",
    metric: "500件抽样零件中有32件螺纹深度低于8.5毫米下限，最差为7.9毫米",
    detection: "来料检验量具记录、供应商SPC图表、螺纹塞规验证以及换刀记录",
    escapePoint: "刀具磨损趋势加速时，供应商抽样计划未收紧频率",
    customerImpact: "装配扭矩失效风险，以及不合格壳体入库后导致的生产停线",
    verification: "连续三个供应商批次Cpk高于1.33，且放行前附有首件记录",
  },
  {
    slug: "customer-complaint",
    industry: "客户投诉处理",
    problemType: "现场失效",
    audience: "客户质量工程师",
    product: "工业泵控制器",
    defect: "客户报告运行60小时后意外停机",
    evidence: "现场日志、退回件分析、固件版本记录以及应力测试结果",
    containment: "提供替换单元，并阻止受影响固件版本出货",
    rootCause: "固件看门狗时序未在高温负载下验证",
    corrective: "发布修补固件并扩大高温耐久测试",
    preventive: "将看门狗应力用例加入设计验证和发布检查表",
    affectedScope: "使用固件3.8.2并已发往两个现场位置的工业泵控制器",
    metric: "报告9起在高环境温度下运行55-70小时后发生的现场停机",
    detection: "现场日志、退回件分析、固件版本记录、应力测试结果以及热箱复现",
    escapePoint: "设计验证未包含持续高温负载下的看门狗时序",
    customerImpact: "泵意外停机、服务更换成本，以及客户对新固件版本信心的下降",
    verification: "使用修补固件进行500小时高温耐久运行，且无看门狗复位事件",
  },
  {
    slug: "led-failure",
    industry: "LED照明",
    problemType: "早期失效",
    audience: "照明产品质量团队",
    product: "LED驱动模块 LDM-22",
    defect: "客户老化测试中观察到早期闪烁",
    evidence: "老化日志、失效驱动拆解照片以及电容批次记录",
    containment: "暂扣受影响电容批次，并对模块进行延长老化筛选",
    rootCause: "来料电容ESR抽样遗漏了批次级差异",
    corrective: "收紧ESR接收标准并要求复核供应商批次证书",
    preventive: "将电容批次趋势复核加入供应商质量会议",
    affectedScope: "使用电容批次 C-4107 且在2026-04-29至2026-05-02期间生产的LED驱动模块",
    metric: "客户老化期间早期闪烁率升至3.2%，基线为0.4%",
    detection: "老化日志、失效驱动拆解照片、电容ESR数据以及供应商批次证书复核",
    escapePoint: "来料ESR抽样遗漏了接近规格上限的批次内差异",
    customerImpact: "客户老化中断，以及闪烁单元可能产生保修退货",
    verification: "使用收紧后的ESR限值对600个模块进行延长老化，闪烁事件为零",
  },
  {
    slug: "packaging-defect",
    industry: "包装",
    problemType: "密封失效",
    audience: "包装质量与运营团队",
    product: "替换滤芯的零售泡罩包装",
    defect: "分销模拟后发现密封开口",
    evidence: "剥离强度数据、封口钳温度记录以及分销测试照片",
    containment: "检查成品库存，并阻止受影响包装班次出货",
    rootCause: "交接班期间封口钳温度漂移至验证范围以下",
    corrective: "增加班次开始密封验证并设置温度漂移报警限值",
    preventive: "将封口钳校准复核纳入预防性维护",
    affectedScope: "交接班期间在包装1线密封的替换滤芯泡罩包装",
    metric: "60件验证样品中有14件剥离强度降至0.8牛，低于1.5牛下限",
    detection: "剥离强度测试数据、封口钳温度记录、分销模拟以及密封外观照片",
    escapePoint: "温度漂移报警仅为提示，未停止放行检验",
    customerImpact: "分销中出现开口包装的风险，以及客户收货检验拒收",
    verification: "报警限值更改后进行两次分销模拟和每小时剥离测试，均高于1.8牛",
  },
  {
    slug: "plastic-injection-molding",
    industry: "塑料注塑",
    problemType: "短射缺陷",
    audience: "制造质量工程师",
    product: "连接器壳体4号型腔",
    defect: "模具维护后锁扣特征出现短射",
    evidence: "模具维护记录、型腔趋势数据以及首件照片",
    containment: "分选受影响生产时间段并隔离4号型腔产出",
    rootCause: "模具维护后排气清洁不彻底",
    corrective: "重启前清洁并验证各型腔排气",
    preventive: "将排气检查照片加入模具维护清单",
    affectedScope: "模具维护后10:20至14:45期间4号型腔的连接器壳体产出",
    metric: "4号型腔短射率达到6.8%，其他型腔仍低于0.3%",
    detection: "首件照片、型腔趋势数据、模具维护记录以及操作员目视分选结果",
    escapePoint: "重启检查表确认了模具安装，但未要求按型腔提供排气清洁证据",
    customerImpact: "锁扣特征强度不足，可能导致装配时连接器保持力失效",
    verification: "重启后运行三小时，4号型腔在正常填充压力下锁扣短射为零",
  },
  {
    slug: "machining-defect",
    industry: "机加工",
    problemType: "尺寸超差",
    audience: "工厂质量与工艺工程师",
    product: "CNC机加工阀体",
    defect: "内孔直径漂移超出上限规格",
    evidence: "CMM报告、刀具补偿历史以及操作员交接记录",
    containment: "停止加工单元，并分选上次合格CMM检查后生产的零件",
    rootCause: "刀具补偿输入未经过第二人复核",
    corrective: "超出控制限的补偿变更要求电子审批",
    preventive: "统计CMM结果趋势，并在重复补偿时提醒主管",
    affectedScope: "机加工单元M4在13:10刀具补偿变更后生产的CNC阀体",
    metric: "内孔直径漂移至25.042毫米，规格为25.000 ± 0.025毫米",
    detection: "CMM报告、刀具补偿历史、过程中量具读数以及操作员交接记录",
    escapePoint: "超出控制限的补偿变更未要求第二人电子审批",
    customerImpact: "泄漏测试失效风险，以及总装环节的额外分选",
    verification: "连续五个批次的首件、中检和终检CMM结果均在公差内",
  },
  {
    slug: "battery-pack",
    industry: "电池包组装",
    problemType: "焊接强度失效",
    audience: "电动汽车与电池制造质量团队",
    product: "电池模组母排焊接",
    defect: "拉拔测试失效高于客户阈值",
    evidence: "拉拔测试数据、焊接电流日志、电极磨损照片以及班次记录",
    containment: "隔离疑似班次的模组，并对保留样品复测拉拔",
    rootCause: "电极更换后未重置电极磨损补偿",
    corrective: "每次电极更换后重置焊接补偿，并用拉拔测试验证",
    preventive: "将电极更换确认加入MES流转卡",
    affectedScope: "B2线电极更换事件 ER-55 之后的电池模组母排焊接",
    metric: "40件样品中有5件拉拔测试失效，而客户阈值为零失效",
    detection: "拉拔测试数据、焊接电流日志、电极磨损照片以及MES班次记录",
    escapePoint: "MES未在电极更换确认后强制重置焊接补偿",
    customerImpact: "高电阻接头风险，以及客户验证期间模组被拒收",
    verification: "100件保留焊接拉拔测试高于最低强度，且MES更改后焊接电流趋势稳定",
  },
  {
    slug: "aerospace",
    industry: "航空航天",
    problemType: "文档不符合",
    audience: "航空航天质量与合规团队",
    product: "飞控机加工支架",
    defect: "FAI包缺少材料证书可追溯性",
    evidence: "FAI记录、采购订单、收货日志以及材料证书档案",
    containment: "暂扣出货，并为受影响工单重建可追溯性",
    rootCause: "收货上传步骤在文档控制流程中为可选",
    corrective: "FAI放行前强制上传证书",
    preventive: "在最终检验放行前审核可追溯性记录",
    affectedScope: "客户源检验前工单 FC-226 的飞控支架FAI包",
    metric: "FAI包中12份必需材料证书记录缺少1份",
    detection: "FAI检查表复核、收货日志、采购订单追溯以及材料证书档案",
    escapePoint: "文档控制流程允许在证书上传标记为可选的情况下放行最终检验",
    customerImpact: "客户源检验延迟，以及AS9102包可能被拒收",
    verification: "出货放行前审核20份FAI包，材料证书可追溯性达到100%",
  },
];

const templateScenarios: Scenario[] = [
  { ...exampleScenarios[0], slug: "automotive", problemType: "汽车行业8D报告" },
  { ...exampleScenarios[4], slug: "supplier", problemType: "供应商纠正措施" },
  { ...exampleScenarios[8], slug: "manufacturing", problemType: "制造缺陷调查" },
  { ...exampleScenarios[5], slug: "pdf", problemType: "PDF客户提交" },
  { ...exampleScenarios[2], slug: "word", problemType: "可编辑Word客户报告" },
  { ...exampleScenarios[9], slug: "excel", problemType: "Excel模板替代" },
  { ...exampleScenarios[3], slug: "medical-device", problemType: "受监管投诉文档" },
  { ...exampleScenarios[1], slug: "semiconductor", problemType: "半导体8D模板" },
  { ...exampleScenarios[10], slug: "battery", problemType: "电池制造8D模板" },
  { ...exampleScenarios[11], slug: "aerospace", problemType: "航空航天可追溯性8D模板" },
];

const lateDeliveryScenario: Scenario = {
  slug: "late-delivery",
  industry: "供应商质量",
  problemType: "交付延迟",
  audience: "SQE与采购质量团队",
  product: "外包机加工隔套",
  defect: "供应商出货延迟五天，导致生产计划停滞",
  evidence: "采购订单历史、供应商产能计划以及催货邮件",
  containment: "将短期需求转移到安全库存，并升级催货出货",
  rootCause: "供应商产能评审未包含新的预测爬坡",
  corrective: "订单释放前增加预测变更评审",
  preventive: "要求受限供应商每月确认产能",
  affectedScope: "预测爬坡后第23-24周建造计划的外包隔套需求",
  metric: "供应商延迟五天出货，造成预计18小时的生产计划短缺",
  detection: "采购订单历史、供应商产能计划、催货邮件以及MRP短缺报告",
  escapePoint: "预测增长超过20%时未重新进行产能评审",
  customerImpact: "装配计划延误风险以及高价运费恢复成本",
  verification: "订单释放前完成三次月度产能确认，且受限物料无延迟",
};

const fiveWhyScenarios: Scenario[] = [
  exampleScenarios[5],
  { ...exampleScenarios[4], slug: "supplier-defect" },
  lateDeliveryScenario,
  { ...exampleScenarios[2], slug: "assembly-defect" },
  exampleScenarios[6],
  { ...exampleScenarios[1], slug: "semiconductor-defect" },
  { ...exampleScenarios[8], slug: "injection-molding-short-shot" },
  { ...exampleScenarios[9], slug: "machining-tolerance" },
  { ...exampleScenarios[10], slug: "weld-strength" },
  { ...exampleScenarios[7], slug: "packaging-seal" },
];

const processFailureScenario: Scenario = {
  slug: "process-failure",
  industry: "制造流程",
  problemType: "流程失效",
  audience: "跨职能质量团队",
  product: "总装扭矩工位",
  defect: "工艺变更后扭矩验证失败",
  evidence: "扭矩审核记录、作业指导书修订历史以及操作员培训日志",
  containment: "停止工位，复查疑似装配，并恢复先前的扭矩程序",
  rootCause: "工艺变更检查表未包含扭矩程序验证",
  corrective: "在每次工艺变更放行时增加扭矩程序验证",
  preventive: "放行工位程序变更前要求质量签核",
  affectedScope: "作业指导书修订 WI-44 之后的总装扭矩工位",
  metric: "工艺变更后扭矩审核发现50件装配中有6件超出验证窗口",
  detection: "扭矩审核记录、工位程序历史、培训日志以及作业指导书修订历史",
  escapePoint: "工艺变更检查表验证了操作员培训，但未验证扭矩程序校验和",
  customerImpact: "紧固件松动风险，以及出货放行前的返工",
  verification: "每次工艺放行时验证工位校验和，首班100%扭矩审核",
};

const fishboneScenarios: Scenario[] = [
  { ...exampleScenarios[8], slug: "manufacturing-defect" },
  { ...exampleScenarios[5], slug: "customer-complaint" },
  { ...exampleScenarios[4], slug: "supplier-quality" },
  processFailureScenario,
  { ...exampleScenarios[2], slug: "electronics-assembly" },
  { ...exampleScenarios[7], slug: "packaging-seal-failure" },
];

const correctiveScenarios: Scenario[] = [
  { ...exampleScenarios[4], slug: "supplier-defect" },
  { ...exampleScenarios[5], slug: "customer-complaint" },
  { ...exampleScenarios[2], slug: "assembly-defect" },
  { ...exampleScenarios[9], slug: "machining-defect" },
  { ...exampleScenarios[3], slug: "labeling-error" },
  { ...exampleScenarios[10], slug: "battery-weld-failure" },
];

const qualitySystemScenario: Scenario = {
  slug: "quality-system",
  industry: "质量体系",
  problemType: "防止再发",
  audience: "质量经理与审核员",
  product: "纠正措施管理流程",
  defect: "类似问题反复出现，因为经验教训未被复用",
  evidence: "重复NCR历史、审核发现以及纠正措施关闭记录",
  containment: "复核未关闭的纠正措施是否存在类似失效模式",
  rootCause: "关闭准则未要求系统性预防或知识复用",
  corrective: "在关闭审批前增加再发风险评审",
  preventive: "在新问题接收和管理评审中检索历史8D",
  affectedScope: "最近两个管理评审周期内重复NCR的纠正措施关闭流程",
  metric: "90天内因未复用先前经验教训而重新开启4个重复NCR",
  detection: "重复NCR历史、审核发现、纠正措施关闭记录以及管理评审纪要",
  escapePoint: "关闭审批检查了完成证据，但未跨类似流程检查再发风险",
  customerImpact: "重复逃逸、审核发现，以及对CAPA有效性信心不足",
  verification: "审核十项已关闭纠正措施的再发风险评审和历史检索证据",
};

const preventiveScenarios: Scenario[] = [
  { ...exampleScenarios[8], slug: "manufacturing" },
  qualitySystemScenario,
  { ...exampleScenarios[4], slug: "supplier-quality" },
  { ...exampleScenarios[2], slug: "electronics-assembly" },
  { ...exampleScenarios[3], slug: "medical-device" },
  { ...exampleScenarios[11], slug: "aerospace-documentation" },
];

function fullSlug(type: SeoPageType, slug: string) {
  return `${getSeoPathPrefix(type)}/${slug}`;
}

// (b) Static template strings used by buildRelated / buildEightDSteps / buildPage.

function exampleTitlePrefixZh(type: SeoPageType) {
  switch (type) {
    case "8d-example":
      return "8D报告示例";
    case "8d-template":
      return "8D报告模板";
    case "5why-example":
      return "5Why示例";
    case "fishbone-example":
      return "鱼骨图示例";
    case "corrective-action":
      return "纠正措施示例";
    case "preventive-action":
      return "预防措施示例";
  }
}

function buildRelated(type: SeoPageType, scenario: Scenario): string[] {
  const base = [
    fullSlug("8d-example", scenario.slug),
    fullSlug("5why-example", scenario.slug),
    fullSlug("corrective-action", scenario.slug),
    fullSlug("8d-template", scenario.slug),
    "sample-report",
    "8d-report-template",
    "8d-report-example",
  ].filter((slug) => slug !== fullSlug(type, scenario.slug));

  const fallback = [
    "8d-report-example/automotive",
    "8d-report-example/supplier-quality",
    "5-why-example/customer-complaint",
    "fishbone-diagram-example/manufacturing-defect",
    "corrective-action-example/supplier-defect",
    "preventive-action-example/quality-system",
  ];

  return [...new Set([...base, ...fallback])].slice(0, 6);
}

function buildEightDSteps(type: SeoPageType, scenario: Scenario) {
  const reportTone =
    type === "8d-template"
      ? "模板字段"
      : type === "corrective-action"
        ? "纠正措施重点"
        : type === "preventive-action"
          ? "预防重点"
          : "示例条目";

  return [
    {
      step: "D0",
      title: "准备与界定范围",
      content: `${reportTone}：为${scenario.product}启动调查，将疑似范围界定为${scenario.affectedScope}，并在分析开始前指定质量、工艺和责任人代表。`,
    },
    {
      step: "D1",
      title: "团队",
      content: `纳入质量工程、流程责任人、生产或供应商责任人，以及能够批准${scenario.verification}的复核人。`,
    },
    {
      step: "D2",
      title: "问题描述",
      content: `${scenario.defect}。用量化方式描述为${scenario.metric}。记录发现地点、开始时间，以及哪些批次或客户受到影响。`,
    },
    {
      step: "D3",
      title: "临时遏制",
      content: `${scenario.containment}。遏制不是关闭；它在永久纠正得到验证期间保护客户。`,
    },
    {
      step: "D4",
      title: "根本原因与逃逸点",
      content: `根本原因：${scenario.rootCause}。逃逸点：${scenario.escapePoint}。两者都需要证据，否则报告看起来完整，但系统性失效仍然未关闭。`,
    },
    {
      step: "D5",
      title: "永久纠正措施",
      content: `${scenario.corrective}。措施应消除已验证的原因，而不只是分选或返工受影响物料。`,
    },
    {
      step: "D6",
      title: "验证与实施",
      content: `只有在${scenario.verification}之后，实施才可接受。附上前后对比证据、更新后的记录和审批说明。`,
    },
    {
      step: "D7",
      title: "防止再发",
      content: `${scenario.preventive}。将新控制加入控制计划、检查表、供应商要求或放行流程，使同类问题更难再发。`,
    },
    {
      step: "D8",
      title: "关闭并复用经验",
      content: `在复核有效性证据后关闭，并用${scenario.industry}、${scenario.problemType}、${scenario.rootCause}和${scenario.preventive}标记报告，便于未来检索。`,
    },
  ];
}

function buildFiveWhy(scenario: Scenario) {
  return [
    {
      why: "为什么发现该缺陷？",
      answer: `${scenario.defect}通过${scenario.detection}被发现，量化证据显示${scenario.metric}。`,
    },
    {
      why: "为什么流程会产生或允许该缺陷？",
      answer: scenario.rootCause,
    },
    {
      why: "为什么该原因没有更早被控制？",
      answer: scenario.escapePoint,
    },
    {
      why: "为什么现有质量体系未能防止再发？",
      answer: `控制计划、检查表或放行门未要求足够强的证据来满足${scenario.verification}。`,
    },
    {
      why: "为什么所选纠正措施是充分的？",
      answer: `${scenario.corrective}，然后通过${scenario.verification}确认有效性。`,
    },
  ];
}

function buildFishbone(scenario: Scenario) {
  return [
    {
      category: "人员",
      possibleCause: `操作员或复核人没有针对${scenario.problemType}的强制检查。`,
      check: "复核培训记录、交接班记录、审批日志，以及谁签署了放行。",
    },
    {
      category: "设备",
      possibleCause: `设备、工装或软件状态导致了${scenario.defect}。`,
      check: `将维护历史、设置参数、报警和趋势数据与${scenario.detection}进行比对。`,
    },
    {
      category: "方法",
      possibleCause: scenario.rootCause,
      check: "对照已批准的控制计划审核实际作业指导书和放行流程。",
    },
    {
      category: "物料",
      possibleCause: `物料、组件、供应商批次或固件版本可能将影响范围缩小至${scenario.affectedScope}。`,
      check: "在扩大遏制前追溯批次、日期码、供应商、版本和证书记录。",
    },
    {
      category: "测量",
      possibleCause: `检测依赖${scenario.detection}，但触发灵敏度可能在逃逸前不足。`,
      check: "确认量具能力、抽样频率、测试限值，以及该指标是否能捕捉早期漂移。",
    },
    {
      category: "环境",
      possibleCause: "班次时间、温度、工作量、维护窗口或放行压力可能增加了风险。",
      check: "将缺陷发生时间与交接班、维护活动、爬坡和环境记录进行比对。",
    },
  ];
}

function buildActionPlan(scenario: Scenario) {
  return [
    {
      action: scenario.containment,
      owner: "质量工程师",
      due: "24小时内",
      verification: `暂扣清单、分选记录、客户通知状态，以及影响范围：${scenario.affectedScope}。`,
    },
    {
      action: scenario.corrective,
      owner: "流程责任人",
      due: "10个工作日内",
      verification: scenario.verification,
    },
    {
      action: `更新放行准则以处理逃逸点：${scenario.escapePoint}`,
      owner: "质量经理",
      due: "下次生产或供应商放行前",
      verification: "已批准的检查表、控制计划修订，以及首份完成的审核记录。",
    },
  ];
}

function buildPreventionPlan(scenario: Scenario) {
  return [
    {
      control: scenario.preventive,
      frequency: "每次放行或受影响生产重启",
      owner: "流程责任人",
      evidence: "更新后的控制计划、检查表记录或系统审批日志。",
    },
    {
      control: `利用${scenario.detection}的证据跟踪${scenario.problemType}趋势`,
      frequency: "每周直至稳定，之后每月",
      owner: "质量工程师",
      evidence: "带反应限值和升级说明的趋势图。",
    },
    {
      control: `在新问题接收时检索${scenario.industry}及类似根本原因的已关闭8D报告`,
      frequency: "每次新投诉、NCR或供应商纠正措施",
      owner: "质量经理",
      evidence: "关联的历史报告ID和经验教训评审。",
    },
  ];
}

export function buildZhPage(type: SeoPageType, scenario: Scenario): SeoPage {
  const label = exampleTitlePrefixZh(type);
  const titleSubject = `${scenario.industry}${label}`;
  const actionLabel = type.includes("template") ? "模板" : "示例";
  const pathSlug = fullSlug(type, scenario.slug);

  return {
    slug: pathSlug,
    type,
    title: `${titleSubject}：${scenario.problemType}`,
    metaTitle: `${titleSubject}｜${scenario.problemType}`,
    metaDescription: `使用这份${scenario.industry}${actionLabel}处理${scenario.problemType}：问题描述、遏制、根本原因、纠正措施、预防、导出与分享。`,
    h1: `${titleSubject}：${scenario.problemType}`,
    industry: scenario.industry,
    problemType: scenario.problemType,
    audience: scenario.audience,
    intro: `本页为${scenario.audience}提供一份实用的${actionLabel}，用于处理${scenario.product}上的${scenario.defect}。内容包含影响范围、量化证据、逃逸点思路、D0-D8措辞、责任分配和验证准则，使其读起来像一份可用的质量记录，而不是通用提纲。`,
    sections: [
      {
        heading: "何时使用本页",
        body: `当团队需要记录${scenario.defect}、将疑似范围界定为${scenario.affectedScope}、保存证据（如${scenario.evidence}），并产出一份可供客户、供应商或内部质量负责人评审的报告时，使用这份${actionLabel}。`,
      },
      {
        heading: "调查内容应如何呈现",
        body: `报告应将D3遏制与D5纠正措施分开。遏制用于${scenario.containment}。永久措施应聚焦于已验证的根本原因：${scenario.rootCause}。逃逸点也应明确：${scenario.escapePoint}。`,
      },
      {
        heading: "应附上哪些证据",
        body: `附上既能证明缺陷、又能证明修复有效的证据。对于本案例，有用证据包括${scenario.evidence}。量化信号为${scenario.metric}。最强的报告会把每份附件关联到相应的D步骤，而不是让文件散落在邮件往来中。`,
      },
      {
        heading: "如何转化为可复用知识",
        body: `关闭后，检索价值来自围绕产品、失效模式、根本原因、逃逸点、纠正措施和预防的清晰措辞。未来调查类似问题的团队应能在从零开始前找到这份报告，并将新案例与${scenario.verification}进行比对。`,
      },
    ],
    professional: {
      affectedScope: scenario.affectedScope,
      metric: scenario.metric,
      detection: scenario.detection,
      escapePoint: scenario.escapePoint,
      customerImpact: scenario.customerImpact,
      verification: scenario.verification,
      eightD: buildEightDSteps(type, scenario),
      fiveWhy: buildFiveWhy(scenario),
      fishbone: buildFishbone(scenario),
      actionPlan: buildActionPlan(scenario),
      preventionPlan: buildPreventionPlan(scenario),
    },
    example: {
      problemDescription: `${scenario.product}出现${scenario.defect}。影响范围：${scenario.affectedScope}。量化证据：${scenario.metric}。`,
      containmentAction: scenario.containment,
      rootCause: scenario.rootCause,
      correctiveAction: scenario.corrective,
      preventiveAction: scenario.preventive,
    },
    faqs: [
      {
        question: `这份${actionLabel}可用于${scenario.industry}质量问题吗？`,
        answer: `可以。它面向${scenario.audience}，聚焦${scenario.problemType}，但相同的D0-D8结构可适用于类似的制造或供应商质量问题。`,
      },
      {
        question: "导出报告前应包含哪些内容？",
        answer: `至少应包含可量化的问题描述、即时遏制、证据、已验证的根本原因、纠正措施、责任人、截止日期、验证结果和预防计划。`,
      },
      {
        question: "报告包中是否应包含附件？",
        answer: `应包含。诸如${scenario.evidence}等附件能让调查更易评审，并帮助客户确认响应基于证据。`,
      },
      {
        question: "这与历史检索如何关联？",
        answer: `针对产品、问题类型、根本原因、纠正措施和经验教训的清晰字段，能让已完成的报告在以后出现类似缺陷时可被检索。`,
      },
    ],
    relatedSlugs: buildRelated(type, scenario),
  };
}

// (c) seoPagesZh mirrors the English array order, slugs, types, and structure.
export const seoPagesZh: SeoPage[] = [
  ...exampleScenarios.map((scenario) => buildZhPage("8d-example", scenario)),
  ...templateScenarios.map((scenario) => buildZhPage("8d-template", scenario)),
  ...fiveWhyScenarios.map((scenario) => buildZhPage("5why-example", scenario)),
  ...fishboneScenarios.map((scenario) => buildZhPage("fishbone-example", scenario)),
  ...correctiveScenarios.map((scenario) => buildZhPage("corrective-action", scenario)),
  ...preventiveScenarios.map((scenario) => buildZhPage("preventive-action", scenario)),
];

export function getSeoPageZh(slug: string) {
  return seoPagesZh.find((page) => page.slug === slug);
}

export function getSeoPagesByTypeZh(type: SeoPageType) {
  return seoPagesZh.filter((page) => page.type === type);
}

export function getRelatedSeoPagesZh(page: SeoPage) {
  const related: SeoPage[] = [];
  const push = (candidate: SeoPage | undefined) => {
    if (!candidate) return;
    if (candidate.slug === page.slug) return;
    if (related.some((item) => item.slug === candidate.slug)) return;
    related.push(candidate);
  };

  page.relatedSlugs.forEach((slug) => push(getSeoPageZh(slug)));

  seoPagesZh
    .filter((candidate) => candidate.industry === page.industry)
    .forEach(push);

  if (page.type === "8d-example") {
    seoPagesZh.filter((candidate) => candidate.type === "5why-example").forEach(push);
  }
  if (page.type === "5why-example") {
    seoPagesZh.filter((candidate) => candidate.type === "corrective-action").forEach(push);
  }
  if (page.type === "8d-template") {
    seoPagesZh.filter((candidate) => candidate.type === "8d-example").forEach(push);
  }

  seoPagesZh.forEach(push);

  return related.slice(0, 8);
}
