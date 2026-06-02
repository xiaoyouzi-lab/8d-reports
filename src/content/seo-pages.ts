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
  professional: {
    affectedScope: string;
    metric: string;
    detection: string;
    escapePoint: string;
    customerImpact: string;
    verification: string;
    eightD: {
      step: string;
      title: string;
      content: string;
    }[];
    fiveWhy: {
      why: string;
      answer: string;
    }[];
    fishbone: {
      category: string;
      possibleCause: string;
      check: string;
    }[];
    actionPlan: {
      action: string;
      owner: string;
      due: string;
      verification: string;
    }[];
    preventionPlan: {
      control: string;
      frequency: string;
      owner: string;
      evidence: string;
    }[];
  };
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
  affectedScope: string;
  metric: string;
  detection: string;
  escapePoint: string;
  customerImpact: string;
  verification: string;
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
    affectedScope: "2,460 brake brackets from coating line 2, date codes 2026-04-18 to 2026-04-21",
    metric: "18 of 125 salt-spray samples showed edge peel after 72 hours; coating thickness remained within 18-24 um",
    detection: "salt spray validation, cross-hatch adhesion test, coating thickness checks, and customer line-side visual review",
    escapePoint: "line-change approval released production before the fixture contact-point check was recorded",
    customerImpact: "risk of corrosion claim and customer line disruption if suspect brackets were shipped",
    verification: "run three consecutive fixture-change restarts with zero adhesion failures and audited sign-off records",
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
    affectedScope: "wafer lot W-8842 and two adjacent lots tested on probe card PC-17",
    metric: "final-test yield dropped from 97.8% baseline to 91.4%, with leakage failures concentrated in two wafer zones",
    detection: "wafer-map review, final-test leakage logs, probe-card inspection, and SEM review of failed pads",
    escapePoint: "probe-card maintenance was triggered by calendar interval rather than leakage trend or lot-start condition",
    customerImpact: "delayed shipment release and risk of latent electrical failures reaching module assembly",
    verification: "five consecutive lots above 97% yield with no pad-damage signature after revised cleaning interval",
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
    affectedScope: "PCA-1048 assemblies built on SMT line 3 during shift B, date code 2026-05-03",
    metric: "7 of 80 returned units failed CAN communication during thermal cycling between -20 C and 70 C",
    detection: "X-ray inspection, AOI trend review, reflow profile comparison, and returned-unit solder cross-section",
    escapePoint: "recipe edit permission allowed an unapproved soak-zone change without engineering review",
    customerImpact: "intermittent field communication loss and repeat service calls at the customer site",
    verification: "thermal-cycle 300 screened assemblies with zero CAN dropouts after profile lock and AOI limit update",
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
    affectedScope: "sterile catheter kit work orders WO-7721 and WO-7722 packed on line P2",
    metric: "1 confirmed mismatch found by customer; 4,800 kits placed on hold for reconciliation",
    detection: "DHR review, label reconciliation, packaging camera images, and finished-goods lot trace",
    escapePoint: "line clearance relied on one operator confirmation when label rolls were changed mid-order",
    customerImpact: "potential lot traceability confusion and regulatory complaint escalation",
    verification: "100% reconciliation of held inventory and 30 consecutive label roll changes with dual verification records",
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
    affectedScope: "incoming lots A17-2405-11 and A17-2405-12 for machined aluminum housings",
    metric: "32 of 500 sampled parts measured thread depth below 8.5 mm minimum, worst case 7.9 mm",
    detection: "incoming inspection gauge records, supplier SPC charts, thread plug gauge verification, and tool-change logs",
    escapePoint: "supplier sampling plan did not tighten frequency when tool wear trend accelerated",
    customerImpact: "assembly torque failure risk and production stoppage if nonconforming housings entered stock",
    verification: "three clean supplier lots with Cpk above 1.33 and first-piece records attached before release",
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
    affectedScope: "industrial pump controllers using firmware 3.8.2 shipped to two field locations",
    metric: "9 field shutdowns reported after 55-70 operating hours under high ambient temperature",
    detection: "field logs, returned-unit analysis, firmware version records, stress-test results, and thermal chamber replay",
    escapePoint: "design verification did not include watchdog timing under sustained high-temperature load",
    customerImpact: "unplanned pump stoppage, service replacement cost, and loss of confidence in new firmware release",
    verification: "500-hour high-temperature endurance run with patched firmware and no watchdog reset events",
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
    affectedScope: "LED driver modules using capacitor lot C-4107 built between 2026-04-29 and 2026-05-02",
    metric: "early-life flicker rate increased to 3.2% during customer burn-in versus 0.4% baseline",
    detection: "burn-in logs, failed-driver teardown photos, capacitor ESR data, and supplier lot certificate review",
    escapePoint: "incoming ESR sampling missed within-lot variation near the upper specification limit",
    customerImpact: "customer burn-in interruption and potential warranty returns for flickering units",
    verification: "extended burn-in on 600 modules with tightened ESR limits and zero flicker events",
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
    affectedScope: "replacement filter blister packs sealed on packaging line 1 during shift change",
    metric: "peel strength fell to 0.8 N against 1.5 N minimum on 14 of 60 validation samples",
    detection: "peel-strength test data, seal-jaw temperature records, distribution simulation, and visual seal photos",
    escapePoint: "temperature drift alarm was advisory only and did not stop release inspection",
    customerImpact: "risk of open packages in distribution and customer rejection at receiving inspection",
    verification: "two distribution simulation runs and hourly peel tests above 1.8 N after alarm-limit change",
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
    affectedScope: "connector housing cavity 4 output from 10:20 to 14:45 after mold maintenance",
    metric: "short-shot rate reached 6.8% on cavity 4 while other cavities remained below 0.3%",
    detection: "first-piece photos, cavity trend data, mold maintenance record, and operator visual sort results",
    escapePoint: "restart checklist confirmed mold installation but did not require vent-cleaning evidence by cavity",
    customerImpact: "latch feature weakness could cause connector retention failure during assembly",
    verification: "three-hour restart run with cavity 4 at normal fill pressure and zero latch short shots",
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
    affectedScope: "CNC valve bodies produced after tool offset change at 13:10 on machining cell M4",
    metric: "bore diameter drifted to 25.042 mm against 25.000 +/- 0.025 mm specification",
    detection: "CMM reports, tool-offset history, in-process gauge readings, and operator handoff notes",
    escapePoint: "offset compensation above the control limit did not require second-person electronic approval",
    customerImpact: "leak-test failure risk and extra sorting at final assembly",
    verification: "first-off, mid-run, and final CMM checks within tolerance for five consecutive lots",
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
    affectedScope: "battery module busbar welds from electrode replacement event ER-55 on line B2",
    metric: "pull-test failures reached 5 of 40 samples against customer threshold of zero failures",
    detection: "pull-test data, weld-current logs, electrode wear photos, and MES shift records",
    escapePoint: "weld compensation reset was not forced in MES after electrode replacement confirmation",
    customerImpact: "risk of high-resistance joint and module rejection during customer validation",
    verification: "100 retained weld pull tests above minimum strength and stable weld-current trend after MES change",
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
    affectedScope: "flight-control bracket FAI package for job FC-226 before customer source inspection",
    metric: "1 of 12 required material certificate records missing from the FAI package",
    detection: "FAI checklist review, receiving log, purchase order trace, and material certificate archive",
    escapePoint: "document-control workflow allowed final inspection release with certificate upload marked optional",
    customerImpact: "customer source-inspection delay and potential AS9102 package rejection",
    verification: "audit 20 FAI packages with 100% material certificate traceability before shipment release",
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
    affectedScope: "outsourced spacer demand for build plan weeks 23-24 after forecast ramp",
    metric: "supplier shipped five days late, creating a projected 18-hour production planning shortage",
    detection: "purchase order history, supplier capacity plan, expedite emails, and MRP shortage report",
    escapePoint: "capacity review was not repeated when the forecast increased by more than 20%",
    customerImpact: "risk of missed assembly schedule and premium freight recovery cost",
    verification: "three monthly capacity confirmations completed before order release with no late constrained items",
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
    affectedScope: "final assembly torque station after work instruction revision WI-44",
    metric: "torque audit found 6 of 50 assemblies outside the verification window after process change",
    detection: "torque audit records, station program history, training logs, and work instruction revision history",
    escapePoint: "process-change checklist verified operator training but not torque-program checksum",
    customerImpact: "risk of loose fasteners and rework before shipment release",
    verification: "station checksum validation on every process release and 100% torque audit for first shift",
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
    affectedScope: "corrective action closure process across repeat NCRs in the last two management review cycles",
    metric: "4 repeat NCRs reopened within 90 days because prior lessons learned were not reused",
    detection: "repeat NCR history, audit findings, corrective action closure records, and management review minutes",
    escapePoint: "closure approval checked completion evidence but not recurrence-risk review across similar processes",
    customerImpact: "repeat escapes, audit findings, and weak confidence in CAPA effectiveness",
    verification: "audit ten closed corrective actions for recurrence-risk review and historical-search evidence",
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

function buildEightDSteps(type: SeoPageType, scenario: Scenario) {
  const reportTone =
    type === "8d-template"
      ? "Template field"
      : type === "corrective-action"
        ? "Corrective action focus"
        : type === "preventive-action"
          ? "Prevention focus"
          : "Example entry";

  return [
    {
      step: "D0",
      title: "Prepare and scope",
      content: `${reportTone}: open the investigation for ${scenario.product}, define the suspect population as ${scenario.affectedScope}, and assign quality, process, and owner representatives before analysis starts.`,
    },
    {
      step: "D1",
      title: "Team",
      content: `Include quality engineering, the process owner, production or supplier owner, and a reviewer who can approve ${scenario.verification}.`,
    },
    {
      step: "D2",
      title: "Problem description",
      content: `${scenario.defect}. Quantify it as ${scenario.metric}. Capture where it was detected, when it started, and which lots or customers are exposed.`,
    },
    {
      step: "D3",
      title: "Interim containment",
      content: `${scenario.containment}. Containment is not closure; it protects the customer while permanent correction is verified.`,
    },
    {
      step: "D4",
      title: "Root cause and escape point",
      content: `Root cause: ${scenario.rootCause}. Escape point: ${scenario.escapePoint}. Both need evidence, otherwise the report can look complete while the system failure remains open.`,
    },
    {
      step: "D5",
      title: "Permanent corrective action",
      content: `${scenario.corrective}. The action should remove the verified cause, not only sort or rework the affected material.`,
    },
    {
      step: "D6",
      title: "Validate and implement",
      content: `Implementation is acceptable only after ${scenario.verification}. Attach before-and-after evidence, updated records, and approval notes.`,
    },
    {
      step: "D7",
      title: "Prevent recurrence",
      content: `${scenario.preventive}. Add the new control to the control plan, checklist, supplier requirement, or release workflow so the same issue is harder to repeat.`,
    },
    {
      step: "D8",
      title: "Close and reuse learning",
      content: `Close after effectiveness evidence is reviewed and tag the report with ${scenario.industry}, ${scenario.problemType}, ${scenario.rootCause}, and ${scenario.preventive} for future search.`,
    },
  ];
}

function buildFiveWhy(scenario: Scenario) {
  return [
    {
      why: "Why was the defect found?",
      answer: `${scenario.defect} was detected through ${scenario.detection}, with measured evidence showing ${scenario.metric}.`,
    },
    {
      why: "Why did the process create or allow the defect?",
      answer: scenario.rootCause,
    },
    {
      why: "Why was the cause not controlled earlier?",
      answer: scenario.escapePoint,
    },
    {
      why: "Why did the existing quality system not prevent recurrence?",
      answer: `The control plan, checklist, or release gate did not require evidence strong enough for ${scenario.verification}.`,
    },
    {
      why: "Why is the selected corrective action sufficient?",
      answer: `${scenario.corrective}, then confirm effectiveness through ${scenario.verification}.`,
    },
  ];
}

function buildFishbone(scenario: Scenario) {
  return [
    {
      category: "Man",
      possibleCause: `Operator or reviewer did not have a forced check for ${scenario.problemType}.`,
      check: "Review training records, shift handoff notes, approval logs, and who signed the release.",
    },
    {
      category: "Machine",
      possibleCause: `Equipment, tooling, or software condition contributed to ${scenario.defect}.`,
      check: `Compare maintenance history, setup parameters, alarms, and trend data against ${scenario.detection}.`,
    },
    {
      category: "Method",
      possibleCause: scenario.rootCause,
      check: "Audit the actual work instruction and release workflow against the approved control plan.",
    },
    {
      category: "Material",
      possibleCause: `Material, component, supplier lot, or firmware version may have narrowed the affected scope to ${scenario.affectedScope}.`,
      check: "Trace lot, date code, supplier, revision, and certificate records before expanding containment.",
    },
    {
      category: "Measurement",
      possibleCause: `Detection relied on ${scenario.detection}, but the trigger may not have been sensitive enough before escape.`,
      check: "Confirm gauge capability, sampling frequency, test limits, and whether the metric would catch early drift.",
    },
    {
      category: "Environment",
      possibleCause: "Shift timing, temperature, workload, maintenance window, or release pressure may have increased risk.",
      check: "Compare defect timing with shift change, maintenance activity, ramp-up, and environmental records.",
    },
  ];
}

function buildActionPlan(scenario: Scenario) {
  return [
    {
      action: scenario.containment,
      owner: "Quality engineer",
      due: "Within 24 hours",
      verification: `Hold list, sort records, customer notification status, and affected scope: ${scenario.affectedScope}.`,
    },
    {
      action: scenario.corrective,
      owner: "Process owner",
      due: "Within 10 working days",
      verification: scenario.verification,
    },
    {
      action: `Update release criteria to address escape point: ${scenario.escapePoint}`,
      owner: "Quality manager",
      due: "Before next production or supplier release",
      verification: "Approved checklist, control-plan revision, and first completed audit record.",
    },
  ];
}

function buildPreventionPlan(scenario: Scenario) {
  return [
    {
      control: scenario.preventive,
      frequency: "Every release or affected production restart",
      owner: "Process owner",
      evidence: "Updated control plan, checklist record, or system approval log.",
    },
    {
      control: `Trend ${scenario.problemType} using evidence from ${scenario.detection}`,
      frequency: "Weekly until stable, then monthly",
      owner: "Quality engineer",
      evidence: "Trend chart with reaction limits and escalation notes.",
    },
    {
      control: `Search closed 8D reports for ${scenario.industry} and similar root causes during new issue intake`,
      frequency: "At every new complaint, NCR, or supplier corrective action",
      owner: "Quality manager",
      evidence: "Linked historical report IDs and lessons-learned review.",
    },
  ];
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
    intro: `This page gives ${scenario.audience} a practical ${actionLabel} for handling ${scenario.defect} on ${scenario.product}. It includes affected scope, quantitative evidence, escape-point thinking, D0-D8 wording, action ownership, and verification criteria so the page reads like a usable quality record rather than a generic outline.`,
    sections: [
      {
        heading: "When to use this page",
        body: `Use this ${actionLabel} when the team needs to document ${scenario.defect}, define the suspect scope as ${scenario.affectedScope}, preserve evidence such as ${scenario.evidence}, and produce a report that can be reviewed by customers, suppliers, or internal quality leaders.`,
      },
      {
        heading: "How the investigation should read",
        body: `The report should keep D3 containment separate from D5 corrective action. Containment is to ${scenario.containment}. The permanent action should focus on the verified root cause: ${scenario.rootCause}. The escape point is also explicit: ${scenario.escapePoint}.`,
      },
      {
        heading: "What evidence to attach",
        body: `Attach the evidence that proves both the defect and the fix. For this case, useful evidence includes ${scenario.evidence}. The measured signal is ${scenario.metric}. The strongest report links each attachment to the relevant D-step instead of leaving files scattered in email threads.`,
      },
      {
        heading: "How to turn it into reusable knowledge",
        body: `After closure, search value comes from clear wording around the product, failure mode, root cause, escape point, corrective action, and prevention. A future team investigating a similar issue should be able to find this report before starting from zero and compare the new case against ${scenario.verification}.`,
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
      problemDescription: `${scenario.product} showed ${scenario.defect}. Affected scope: ${scenario.affectedScope}. Quantified evidence: ${scenario.metric}.`,
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
  const related: SeoPage[] = [];
  const push = (candidate: SeoPage | undefined) => {
    if (!candidate) return;
    if (candidate.slug === page.slug) return;
    if (related.some((item) => item.slug === candidate.slug)) return;
    related.push(candidate);
  };
  const pageWords = new Set(
    `${page.industry || ""} ${page.problemType || ""} ${page.title}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
  );

  page.relatedSlugs.forEach((slug) => push(getSeoPage(slug)));

  seoPages
    .filter((candidate) => candidate.industry === page.industry)
    .forEach(push);

  seoPages
    .filter((candidate) => {
      const candidateWords = `${candidate.industry || ""} ${candidate.problemType || ""} ${candidate.title}`
        .toLowerCase()
        .split(/[^a-z0-9]+/);
      return candidateWords.some((word) => pageWords.has(word));
    })
    .forEach(push);

  if (page.type === "8d-example") {
    seoPages.filter((candidate) => candidate.type === "5why-example").forEach(push);
  }
  if (page.type === "5why-example") {
    seoPages.filter((candidate) => candidate.type === "corrective-action").forEach(push);
  }
  if (page.type === "8d-template") {
    seoPages.filter((candidate) => candidate.type === "8d-example").forEach(push);
  }

  seoPages.forEach(push);

  return related.slice(0, 8);
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
