import "dotenv/config";
import { getDb } from "./index";
import { plans, templates, blockedEmailDomains } from "./schema";

async function seed() {
  const db = getDb();
  if (!db) {
    console.error("Database not configured");
    process.exit(1);
  }

  const existingPlans = await db.select().from(plans).limit(1);
  if (existingPlans.length > 0) {
    console.log("Already seeded. Skipping.");
    process.exit(0);
  }

  await db.insert(plans).values([
    {
      creemProductId: "plan_free",
      name: "Free",
      description: "5 reports, watermarked PDF",
      priceMonthly: "0",
      priceYearly: "0",
      reportsPerMonth: 5,
      maxTeamMembers: 1,
      features: ["basic_templates", "photo_upload", "pdf_export", "sharing"],
    },
    {
      creemProductId: "plan_pro_monthly",
      name: "Pro Monthly",
      description: "Unlimited reports, no watermark",
      priceMonthly: "9.99",
      priceYearly: null,
      reportsPerMonth: -1,
      maxTeamMembers: 1,
      features: ["all_templates", "unlimited_photos", "pdf_export_no_watermark", "priority_support"],
    },
    {
      creemProductId: "plan_pro_yearly",
      name: "Pro Yearly",
      description: "Unlimited reports, save 34%",
      priceMonthly: null,
      priceYearly: "79.00",
      reportsPerMonth: -1,
      maxTeamMembers: 1,
      features: ["all_templates", "unlimited_photos", "pdf_export_no_watermark", "priority_support"],
    },
  ]);
  console.log("✅ Plans inserted");

  await db.insert(templates).values({
    name: "General 8D Report",
    description: "Universal 8D problem-solving template for all industries",
    type: "general",
    category: "quality",
    isDefault: true,
    isPublic: true,
    structure: {
      version: "3.0",
      steps: [
        { id: "d0", title: "D0: Preparation", description: "Assess and initiate 8D process", fields: [{ id: "report_number", type: "generated_text", label: "Report Number", required: true }, { id: "report_type", type: "select", label: "Report Type", options: ["Customer 8D", "Internal 8D"], required: true }, { id: "problem_source", type: "text", label: "Problem Source", required: true }, { id: "customer_name", type: "text", label: "Customer Name", required: false }, { id: "priority", type: "select", label: "Priority", options: ["Low", "Medium", "High", "Critical"], required: true }] },
        { id: "d1", title: "D1: Team Members", description: "Assemble cross-functional team", fields: [{ id: "team_leader", type: "text", label: "Team Leader", required: true }, { id: "team_members", type: "textarea", label: "Team Members", required: true }] },
        { id: "d2", title: "D2: Problem Description", description: "Describe the problem in measurable terms", fields: [{ id: "problem_description", type: "textarea", label: "Problem Description", required: true }, { id: "problem_where", type: "text", label: "Where Found", required: true }, { id: "problem_when", type: "datetime", label: "When Found", required: true }, { id: "problem_who", type: "text", label: "Who Found", required: false }, { id: "product_name", type: "text", label: "Product Name/Model", required: true }, { id: "batch_number", type: "text", label: "Batch Number", required: false }, { id: "problem_quantity", type: "number", label: "Defect Quantity", required: true }, { id: "total_quantity", type: "number", label: "Total Quantity", required: false }, { id: "problem_photos", type: "photo", label: "Problem Photos", required: false }] },
        { id: "d3", title: "D3: Containment Actions", description: "Immediate actions to protect the customer", fields: [{ id: "ica_description", type: "textarea", label: "Containment Description", required: true }, { id: "ica_scope", type: "textarea", label: "Scope", required: true }, { id: "ica_responsible", type: "text", label: "Responsible Person", required: true }, { id: "ica_due_date", type: "date", label: "Due Date", required: true }, { id: "ica_valid_until", type: "date", label: "Valid Until", required: true }, { id: "ica_effectiveness", type: "textarea", label: "Verification Method", required: true }, { id: "ica_photos", type: "photo", label: "Containment Photos", required: false }] },
        { id: "d4", title: "D4: Root Cause Analysis", description: "Identify and verify the true root cause", fields: [{ id: "occurrence_cause", type: "textarea", label: "Occurrence Cause", required: true, description: "Why did the problem occur?" }, { id: "escape_cause", type: "textarea", label: "Escape Cause", required: true, description: "Why was it not detected?" }, { id: "system_cause", type: "textarea", label: "System Cause", required: true, description: "Why did the process fail to prevent it?" }, { id: "five_whys", type: "table", label: "5-Why Analysis", required: false, columns: ["Level", "Why", "Answer", "Verification"] }, { id: "testing_plan", type: "textarea", label: "Testing Plan", required: true }, { id: "testing_results", type: "textarea", label: "Testing Results", required: true }, { id: "confirmed_root_cause", type: "textarea", label: "Confirmed Root Cause", required: true }, { id: "rca_evidence", type: "file", label: "Supporting Evidence", required: false }] },
        { id: "d5", title: "D5: Corrective Actions", description: "Select and plan permanent corrective actions", fields: [{ id: "pca_selected", type: "textarea", label: "Selected Corrective Action", required: true }, { id: "pca_rationale", type: "textarea", label: "Rationale", required: true }, { id: "cost_estimate", type: "number", label: "Cost Estimate", required: false }, { id: "pca_responsible", type: "text", label: "Responsible Person", required: true }, { id: "pca_due_date", type: "date", label: "Target Completion Date", required: true }, { id: "pca_documents", type: "file", label: "Supporting Documents", required: false }] },
        { id: "d6", title: "D6: Implementation & Validation", description: "Implement and validate permanent corrective actions", fields: [{ id: "implementation_plan", type: "textarea", label: "Implementation Plan", required: true }, { id: "actual_completion_date", type: "date", label: "Actual Completion Date", required: false }, { id: "validation_method", type: "textarea", label: "Validation Method", required: true }, { id: "validation_results", type: "textarea", label: "Validation Results", required: true }, { id: "validation_photos", type: "photo", label: "Validation Photos", required: false }, { id: "validation_documents", type: "file", label: "Validation Documents", required: false }] },
        { id: "d7", title: "D7: Prevention", description: "Prevent recurrence of similar issues", fields: [{ id: "system_changes", type: "textarea", label: "System Changes Required", required: true }, { id: "process_updates", type: "textarea", label: "Process/Control Plan Updates", required: true }, { id: "horizontal_deployment", type: "textarea", label: "Horizontal Deployment", required: false, description: "Apply to similar products/lines" }, { id: "training_needs", type: "textarea", label: "Training Needs", required: false }, { id: "preventive_measures", type: "textarea", label: "Other Preventive Measures", required: false }] },
        { id: "d8", title: "D8: Closure & Recognition", description: "Close the 8D and recognize team contributions", fields: [{ id: "closure_date", type: "date", label: "Closure Date", required: true }, { id: "lessons_learned", type: "textarea", label: "Lessons Learned", required: false }, { id: "team_acknowledgment", type: "textarea", label: "Team Acknowledgment", required: false }, { id: "approver_name", type: "text", label: "Approver Name", required: true }, { id: "approver_date", type: "date", label: "Approval Date", required: true }] }
      ],
    },
  });
  console.log("✅ Template inserted");

  await db.insert(blockedEmailDomains).values([
    { domain: "mailinator.com", reason: "Disposable email" },
    { domain: "guerrillamail.com", reason: "Disposable email" },
    { domain: "tempmail.com", reason: "Disposable email" },
    { domain: "10minutemail.com", reason: "Disposable email" },
  ]);
  console.log("✅ Blocked domains inserted");

  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
