export type SeoPageType =
  | "8d-example"
  | "8d-template"
  | "5why-example"
  | "fishbone-example"
  | "corrective-action"
  | "preventive-action";

export type SeoPage = {
  slug: string;
  type: SeoPageType;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  industry?: string;
  problemType?: string;
  audience?: string;
  intro: string;
  sections: {
    heading: string;
    body: string;
  }[];
  example?: {
    problemDescription?: string;
    containmentAction?: string;
    rootCause?: string;
    correctiveAction?: string;
    preventiveAction?: string;
  };
  faqs: {
    question: string;
    answer: string;
  }[];
  relatedSlugs: string[];
};

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
};

const exampleScenarios: Scenario[] = [
  {
    slug: "automotive",
    industry: "Automotive",
    problemType: "coating failure",
    audience: "quality engineers and supplier quality teams",
    product: "brake bracket batch B26-041",
    defect: "coating peel-off after salt spray validation",
    evidence: "salt spray photos, coating thickness readings, and line-change records",
    containment: "quarantine the batch, start 100% visual inspection, and notify the customer of suspect lots",
    rootCause: "the fixture verification step was skipped after a line change",
    corrective: "add mandatory fixture sign-off before production restart",
    preventive: "update the control plan and train operators on line-change verification",
  },
  {
    slug: "semiconductor",
    industry: "Semiconductor",
    problemType: "test yield loss",
    audience: "process engineers and quality managers",
    product: "sensor IC wafer lot W-8842",
    defect: "abnormal leakage current failures at final test",
    evidence: "wafer maps, final-test logs, probe-card maintenance records, and SEM review notes",
    containment: "hold affected wafer lots and screen finished inventory using tightened leakage limits",
    rootCause: "probe-card contamination created intermittent pad damage before final test",
    corrective: "shorten probe-card cleaning intervals and add lot-start inspection",
    preventive: "trend leakage failures by probe card and trigger maintenance before excursions",
  },
  {
    slug: "electronics",
    industry: "Electronics",
    problemType: "solder joint defect",
    audience: "electronics manufacturing quality teams",
    product: "controller PCB assembly PCA-1048",
    defect: "intermittent CAN communication caused by cracked solder joints",
    evidence: "X-ray images, AOI logs, reflow profile records, and returned-unit photos",
    containment: "screen finished goods with thermal cycling and isolate the affected date code",
    rootCause: "the reflow soak zone was below the approved process window",
    corrective: "restore the reflow profile and add automatic profile lock approval",
    preventive: "audit reflow recipes weekly and require engineering approval for profile edits",
  },
  {
    slug: "medical-device",
    industry: "Medical device",
    problemType: "label mismatch",
    audience: "medical device quality and regulatory teams",
    product: "sterile catheter kit label set",
    defect: "customer found a lot number mismatch between pouch and carton labels",
    evidence: "device history record, label reconciliation sheet, and packaging line camera captures",
    containment: "stop shipment, reconcile finished inventory, and segregate all open work orders",
    rootCause: "the label roll changeover checklist did not require two-person lot verification",
    corrective: "add independent lot verification at label roll changeover",
    preventive: "revise the packaging SOP and add camera-system exception review",
  },
  {
    slug: "supplier-quality",
    industry: "Supplier quality",
    problemType: "incoming inspection failure",
    audience: "SQE teams managing supplier corrective actions",
    product: "machined aluminum housing supplied by vendor A17",
    defect: "thread depth below specification on incoming parts",
    evidence: "incoming inspection records, supplier SPC charts, and tool-change logs",
    containment: "reject affected lots and require certified stock from the supplier",
    rootCause: "supplier tool wear checks used a sample frequency too low for the cutting load",
    corrective: "increase tool wear checks and add first-piece thread depth confirmation",
    preventive: "update supplier control plan and require monthly SPC submission",
  },
  {
    slug: "customer-complaint",
    industry: "Customer complaint handling",
    problemType: "field failure",
    audience: "customer quality engineers",
    product: "industrial pump controller",
    defect: "customer reported unexpected shutdown after 60 hours of operation",
    evidence: "field logs, returned-unit analysis, firmware version records, and stress-test results",
    containment: "provide replacement units and block shipment of the affected firmware version",
    rootCause: "firmware watchdog timing was not validated under high-temperature load",
    corrective: "release patched firmware and expand high-temperature endurance testing",
    preventive: "add watchdog stress cases to design verification and release checklist",
  },
  {
    slug: "led-failure",
    industry: "LED lighting",
    problemType: "early-life failure",
    audience: "lighting product quality teams",
    product: "LED driver module LDM-22",
    defect: "early-life flicker observed during customer burn-in",
    evidence: "burn-in logs, failed-driver teardown photos, and capacitor lot records",
    containment: "hold the affected capacitor lot and screen modules with extended burn-in",
    rootCause: "incoming capacitor ESR sampling missed lot-level variation",
    corrective: "tighten ESR acceptance criteria and require supplier lot certificate review",
    preventive: "add capacitor lot trend review to supplier quality meetings",
  },
  {
    slug: "packaging-defect",
    industry: "Packaging",
    problemType: "seal failure",
    audience: "packaging quality and operations teams",
    product: "retail blister package for replacement filters",
    defect: "open seals found after distribution simulation",
    evidence: "peel-strength data, seal-jaw temperature records, and distribution test photos",
    containment: "inspect finished inventory and block shipment from the affected packaging shift",
    rootCause: "seal-jaw temperature drifted below the validated range during shift change",
    corrective: "add shift-start seal verification and alarm limits for temperature drift",
    preventive: "include seal-jaw calibration review in preventive maintenance",
  },
  {
    slug: "plastic-injection-molding",
    industry: "Plastic injection molding",
    problemType: "short shot defect",
    audience: "manufacturing quality engineers",
    product: "connector housing cavity 4",
    defect: "short shot at the latch feature after mold maintenance",
    evidence: "mold maintenance record, cavity trend data, and first-piece photos",
    containment: "sort the affected production window and isolate cavity 4 output",
    rootCause: "vent cleaning was incomplete after mold maintenance",
    corrective: "clean and verify cavity vents before restart",
    preventive: "add vent inspection photos to the mold maintenance checklist",
  },
  {
    slug: "machining-defect",
    industry: "Machining",
    problemType: "dimension out of tolerance",
    audience: "plant quality and process engineers",
    product: "CNC-machined valve body",
    defect: "bore diameter drifted above upper specification limit",
    evidence: "CMM reports, tool-offset history, and operator handoff notes",
    containment: "stop the machining cell and sort parts produced after the last good CMM check",
    rootCause: "tool offset compensation was entered without second-person review",
    corrective: "require electronic approval for offset changes beyond the control limit",
    preventive: "trend CMM results and alert supervisors on repeated offset corrections",
  },
  {
    slug: "battery-pack",
    industry: "Battery pack assembly",
    problemType: "weld strength failure",
    audience: "EV and battery manufacturing quality teams",
    product: "battery module busbar weld",
    defect: "pull-test failures above the customer threshold",
    evidence: "pull-test data, weld-current logs, electrode wear photos, and shift records",
    containment: "quarantine modules from the suspect shift and repeat pull tests on retained samples",
    rootCause: "electrode wear compensation was not reset after electrode replacement",
    corrective: "reset weld compensation after every electrode replacement and verify with pull tests",
    preventive: "add electrode replacement confirmation to the MES traveler",
  },
  {
    slug: "aerospace",
    industry: "Aerospace",
    problemType: "documentation nonconformance",
    audience: "aerospace quality and compliance teams",
    product: "flight-control machined bracket",
    defect: "FAI package missing material certificate traceability",
    evidence: "FAI record, purchase order, receiving log, and material certificate archive",
    containment: "hold shipment and reconstruct traceability for the affected job",
    rootCause: "receiving upload step was optional in the document-control workflow",
    corrective: "make certificate upload mandatory before FAI release",
    preventive: "audit traceability records before final inspection release",
  },
];

const templateScenarios: Scenario[] = [
  { ...exampleScenarios[0], slug: "automotive", problemType: "automotive 8D reporting" },
  { ...exampleScenarios[4], slug: "supplier", problemType: "supplier corrective action" },
  { ...exampleScenarios[8], slug: "manufacturing", problemType: "manufacturing defect investigation" },
  { ...exampleScenarios[5], slug: "pdf", problemType: "PDF customer submission" },
  { ...exampleScenarios[2], slug: "word", problemType: "editable Word customer report" },
  { ...exampleScenarios[9], slug: "excel", problemType: "Excel template replacement" },
  { ...exampleScenarios[3], slug: "medical-device", problemType: "regulated complaint documentation" },
  { ...exampleScenarios[1], slug: "semiconductor", problemType: "semiconductor 8D template" },
  { ...exampleScenarios[10], slug: "battery", problemType: "battery manufacturing 8D template" },
  { ...exampleScenarios[11], slug: "aerospace", problemType: "aerospace traceability 8D template" },
];

const fiveWhyScenarios: Scenario[] = [
  exampleScenarios[5],
  { ...exampleScenarios[4], slug: "supplier-defect" },
  {
    slug: "late-delivery",
    industry: "Supplier quality",
    problemType: "late delivery",
    audience: "SQE and procurement quality teams",
    product: "outsourced machined spacer",
    defect: "supplier shipment arrived five days late and stopped production planning",
    evidence: "purchase order history, supplier capacity plan, and expedite emails",
    containment: "move short-term demand to safety stock and escalate recovery shipment",
    rootCause: "supplier capacity review did not include the new forecast ramp",
    corrective: "add forecast-change review before order release",
    preventive: "require monthly capacity confirmation for constrained suppliers",
  },
  { ...exampleScenarios[2], slug: "assembly-defect" },
  exampleScenarios[6],
  { ...exampleScenarios[1], slug: "semiconductor-defect" },
  { ...exampleScenarios[8], slug: "injection-molding-short-shot" },
  { ...exampleScenarios[9], slug: "machining-tolerance" },
  { ...exampleScenarios[10], slug: "weld-strength" },
  { ...exampleScenarios[7], slug: "packaging-seal" },
];

const fishboneScenarios: Scenario[] = [
  { ...exampleScenarios[8], slug: "manufacturing-defect" },
  { ...exampleScenarios[5], slug: "customer-complaint" },
  { ...exampleScenarios[4], slug: "supplier-quality" },
  {
    slug: "process-failure",
    industry: "Manufacturing process",
    problemType: "process failure",
    audience: "cross-functional quality teams",
    product: "final assembly torque station",
    defect: "torque verification failed after a process change",
    evidence: "torque audit records, work instruction revision history, and operator training logs",
    containment: "stop the station, recheck suspect assemblies, and restore the prior torque program",
    rootCause: "the process-change checklist did not include torque-program validation",
    corrective: "add torque-program validation to every process-change release",
    preventive: "require quality sign-off before releasing station programming changes",
  },
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

const preventiveScenarios: Scenario[] = [
  { ...exampleScenarios[8], slug: "manufacturing" },
  {
    slug: "quality-system",
    industry: "Quality system",
    problemType: "recurrence prevention",
    audience: "quality managers and auditors",
    product: "corrective action management process",
    defect: "similar issues recur because lessons learned are not reused",
    evidence: "repeat NCR history, audit findings, and corrective action closure records",
    containment: "review open corrective actions for similar failure modes",
    rootCause: "closure criteria did not require systemic prevention or knowledge reuse",
    corrective: "add recurrence-risk review before closure approval",
    preventive: "search historical 8Ds during new problem intake and management review",
  },
  { ...exampleScenarios[4], slug: "supplier-quality" },
  { ...exampleScenarios[2], slug: "electronics-assembly" },
  { ...exampleScenarios[3], slug: "medical-device" },
  { ...exampleScenarios[11], slug: "aerospace-documentation" },
];

function fullSlug(type: SeoPageType, slug: string) {
  const prefix: Record<SeoPageType, string> = {
    "8d-example": "8d-report-example",
    "8d-template": "8d-report-template",
    "5why-example": "5-why-example",
    "fishbone-example": "fishbone-diagram-example",
    "corrective-action": "corrective-action-example",
    "preventive-action": "preventive-action-example",
  };
  return `${prefix[type]}/${slug}`;
}

function exampleTitlePrefix(type: SeoPageType) {
  switch (type) {
    case "8d-example":
      return "8D Report Example";
    case "8d-template":
      return "8D Report Template";
    case "5why-example":
      return "5 Why Example";
    case "fishbone-example":
      return "Fishbone Diagram Example";
    case "corrective-action":
      return "Corrective Action Example";
    case "preventive-action":
      return "Preventive Action Example";
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

function buildPage(type: SeoPageType, scenario: Scenario): SeoPage {
  const label = exampleTitlePrefix(type);
  const titleSubject = `${scenario.industry} ${label}`;
  const actionLabel = type.includes("template") ? "template" : "example";
  const pathSlug = fullSlug(type, scenario.slug);

  return {
    slug: pathSlug,
    type,
    title: `${titleSubject} for ${scenario.problemType}`,
    metaTitle: `${titleSubject} | ${scenario.problemType} | 8D Reports`,
    metaDescription: `Use this ${scenario.industry.toLowerCase()} ${actionLabel} for ${scenario.problemType}: problem description, containment, root cause, corrective action, prevention, export, and sharing.`,
    h1: `${titleSubject} for ${scenario.problemType}`,
    industry: scenario.industry,
    problemType: scenario.problemType,
    audience: scenario.audience,
    intro: `This page gives ${scenario.audience} a practical ${actionLabel} for handling ${scenario.defect} on ${scenario.product}. It connects the quality problem to containment, root cause analysis, corrective action, and recurrence prevention.`,
    sections: [
      {
        heading: "When to use this page",
        body: `Use this ${actionLabel} when the team needs to document ${scenario.defect}, preserve evidence such as ${scenario.evidence}, and produce a report that can be reviewed by customers, suppliers, or internal quality leaders.`,
      },
      {
        heading: "How the investigation should read",
        body: `The report should keep D3 containment separate from D5 corrective action. In this scenario, containment is to ${scenario.containment}. The permanent action should focus on the verified root cause: ${scenario.rootCause}.`,
      },
      {
        heading: "What evidence to attach",
        body: `Attach the evidence that proves both the defect and the fix. For this case, useful evidence includes ${scenario.evidence}. The strongest report links each attachment to the relevant D-step instead of leaving files scattered in email threads.`,
      },
      {
        heading: "How to turn it into reusable knowledge",
        body: `After closure, search value comes from clear wording around the product, failure mode, root cause, and prevention. A future team investigating a similar issue should be able to find this report before starting from zero.`,
      },
    ],
    example: {
      problemDescription: `${scenario.product} showed ${scenario.defect}. The affected scope should be defined by lot, date code, supplier, station, shift, or customer exposure before the team moves into root cause analysis.`,
      containmentAction: scenario.containment,
      rootCause: scenario.rootCause,
      correctiveAction: scenario.corrective,
      preventiveAction: scenario.preventive,
    },
    faqs: [
      {
        question: `Can this ${actionLabel} be used for ${scenario.industry.toLowerCase()} quality issues?`,
        answer: `Yes. It is written for ${scenario.audience} and focuses on ${scenario.problemType}, but the same D0-D8 structure can be adapted to similar manufacturing or supplier quality problems.`,
      },
      {
        question: "What should be included before exporting the report?",
        answer: `At minimum, include a measurable problem description, immediate containment, evidence, verified root cause, corrective action, owner, due date, verification result, and prevention plan.`,
      },
      {
        question: "Should attachments be included in the report package?",
        answer: `Yes. Attachments such as ${scenario.evidence} make the investigation easier to review and help customers verify that the response is evidence-based.`,
      },
      {
        question: "How does this connect to Pro historical search?",
        answer: `Clear fields for product, problem type, root cause, corrective action, and lessons learned make completed reports searchable when similar defects appear later.`,
      },
    ],
    relatedSlugs: buildRelated(type, scenario),
  };
}

export const seoPages: SeoPage[] = [
  ...exampleScenarios.map((scenario) => buildPage("8d-example", scenario)),
  ...templateScenarios.map((scenario) => buildPage("8d-template", scenario)),
  ...fiveWhyScenarios.map((scenario) => buildPage("5why-example", scenario)),
  ...fishboneScenarios.map((scenario) => buildPage("fishbone-example", scenario)),
  ...correctiveScenarios.map((scenario) => buildPage("corrective-action", scenario)),
  ...preventiveScenarios.map((scenario) => buildPage("preventive-action", scenario)),
];

export function getSeoPage(slug: string) {
  return seoPages.find((page) => page.slug === slug);
}

export function getSeoPagesByType(type: SeoPageType) {
  return seoPages.filter((page) => page.type === type);
}

export function getRelatedSeoPages(page: SeoPage) {
  return page.relatedSlugs
    .map((slug) => seoPages.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is SeoPage => Boolean(candidate))
    .slice(0, 8);
}

export function getSeoPathPrefix(type: SeoPageType) {
  const prefix: Record<SeoPageType, string> = {
    "8d-example": "8d-report-example",
    "8d-template": "8d-report-template",
    "5why-example": "5-why-example",
    "fishbone-example": "fishbone-diagram-example",
    "corrective-action": "corrective-action-example",
    "preventive-action": "preventive-action-example",
  };
  return prefix[type];
}
