# 8D Reports Team Sales Validation Playbook

This is the execution manual for validating whether the current Team workflow is worth `$99/month` and whether Team Launch can sell from `$999`.

## What We Are Selling Now

Core promise:

> Create, review, approve, lock, revise, and deliver customer-ready 8D reports with a small quality team.

Current offers:

| Offer | Price | Buyer |
| --- | ---: | --- |
| Free | `$0`, 3 lifetime reports | Evaluating the workflow |
| Pro | `$19/month` | Individual quality engineer |
| Team | `$99/month`, 5 seats | Small manufacturing quality team |
| Single report export | `$4.99/report` | Occasional customer complaint |
| Template Setup | From `$499` | Company with an existing Word/Excel/customer template |
| Team Launch | From `$999` | Team that wants a working online 8D process in 7 days |

Do not claim a full QMS, SSO, email reminders, complex approval matrices, automatic AI approval, or Customer Complaint Intake.

## Sales Proof Links

- Team workflow demos: `https://www.8d-reports.com/demo-reports`
- Automotive machining demo: `https://www.8d-reports.com/demo-reports/automotive`
- Injection molding demo: `https://www.8d-reports.com/demo-reports/molding`
- Electronics LED demo: `https://www.8d-reports.com/demo-reports/electronics`
- Pricing: `https://www.8d-reports.com/pricing`
- Team Launch: `https://www.8d-reports.com/team-launch`
- Template Setup: `https://www.8d-reports.com/custom-8d-template-setup`
- Security: `https://www.8d-reports.com/security`

Each demo provides an online report, PDF, Word, and ZIP delivery package with evidence attachments.
Each demo also includes a two-minute Team workflow validation form. Responses are stored with the `[team-workflow-validation]` marker and the `team_demo_feedback_submitted` event.

Release verification:

- Run `npm run test:production-smoke` after production deployment to confirm the public sales pages, demo pages, PDF samples, Word samples, and delivery ZIP packages are reachable on `https://www.8d-reports.com`.
- The smoke test also confirms each demo ZIP includes image evidence, non-image evidence, the generated PDF, the generated Word file, and an evidence README.
- Run `npm run test:auth-smoke` when Owner, Editor, and Viewer test sessions are available. Required environment variables:
  - `AUTH_SMOKE_REPORT_ID`: an unlocked draft/internal-review test report shared inside the Team workspace.
  - `AUTH_SMOKE_OWNER_COOKIE`, `AUTH_SMOKE_EDITOR_COOKIE`, `AUTH_SMOKE_VIEWER_COOKIE`: browser cookies copied from the three logged-in test accounts.
  - Optional `AUTH_SMOKE_BASE_URL`: defaults to `https://www.8d-reports.com`.
  - Optional `AUTH_SMOKE_MUTATE=true`: runs the approval/lock/unlock/revision Activity Log flow and should only be used on a disposable test report.
- Without `AUTH_SMOKE_MUTATE=true`, the authenticated smoke test verifies Team role visibility and Viewer denial paths without intentionally changing report state.

## Validation Question

The next product decision must answer:

> Do approval, locking, revisions, Activity Log, and role-based access make a small quality team willing to pay `$99/month` or buy a `$999` Team Launch?

Do not add Customer Complaint Intake or email reminders before collecting evidence on this question.

## Forum VOC Map

Use this section when reading quality forums and deciding what to post next. The goal is to identify recurring pain, not to force every discussion toward the product.

Initial Elsmar observations:

- People are not asking for another blank 8D form. They are asking how to control real corrective-action work after the form exists.
- Repeated pain appears around traceability: who found the issue, who owns the action, what evidence proves closure, and what changed after review.
- Spreadsheet and Word workflows are accepted for single events, but they become weak once multiple suppliers, audits, actions, due dates, and revisions must be tracked.
- Community members distinguish sharply between standards/process requirements and software convenience. Any post should respect the method first, then discuss tooling.
- Direct product links from a new account are blocked and also look promotional. Warm-up participation should be link-free, useful, and specific.

Recurring user problems to track:

| Theme | What people ask | Product implication |
| --- | --- | --- |
| 8D / RCA trigger | When is a full 8D required versus a simpler corrective action? | Add clearer guidance in onboarding and sample reports: when to use full D0-D8. |
| Root-cause quality | How do we know the cause is not vague, repeated, or unsupported? | Keep AI Quality Check focused on logic risks, evidence gaps, and weak wording. |
| Corrective action ownership | How do we assign actions, due dates, and evidence without losing follow-up? | Team value should emphasize owners, due dates, evidence, and Activity Log. |
| Supplier responses | Supplier 8Ds often come back incomplete or generic. | Sample reports and review service should show what a customer-ready response looks like. |
| Audit trail / revision control | After a report is approved or submitted, how do we prevent uncontrolled edits? | This is the strongest Team wedge: approval, locking, unlock reason, revision number, Activity Log. |
| Attachments and evidence | Photos, test records, and non-image files need to be tied to the right step. | Export package must keep images in report and all files in ZIP with an attachment list. |
| Customer-specific templates | Customers often require a specific Word/Excel format. | Template Setup / Team Launch are likely easier to sell than generic subscription at first. |
| Spreadsheets vs software | Spreadsheets work until there are many suppliers, audits, actions, and overdue items. | Position as controlled workflow and delivery package, not as a full QMS replacement. |
| VDA / IATF / process audit linkage | Teams want to link audit findings to CAPA without duplicating work. | Future expansion can connect audit findings to corrective actions, but not before Team workflow validation. |

Community participation rule:

- Reply to the specific process question first.
- Do not mention 8D Reports unless someone asks for examples/tools or the post is explicitly a disclosed validation post.
- Avoid UTM links on strict forums.
- Prefer questions that invite practitioners to describe their real process: approval, locking, revision reason, evidence, customer format, supplier follow-up.

## Elsmar Warm-Up Reply Queue

Do not submit these while the first warm-up reply is still awaiting moderator approval. Use them as vetted candidates once the account is allowed to participate normally.

### Candidate 1: AS9100 document control cleanup

Thread:

`https://elsmar.com/elsmarqualityforum/threads/as9100-qa-intern-help.91922/`

Why it fits:

- The thread is about a small machining company trying to clean up controlled documents, forms, logs, revisions, approval signatures, ownership, and uncontrolled local copies.
- It maps directly to our broader Team positioning around ownership, revision control, and simple governance.
- It should not mention 8D Reports, demos, AI, pricing, or software.

Safe reply angle:

> I would start with risk and ownership before redesigning the whole folder tree. A simple master list with document title, owner, current revision, approval date, location, and obsolete location usually gives you control faster than a perfect numbering system. Then pick the highest-risk records first: customer-facing forms, inspection records, supplier records, nonconformance/CAPA records, and anything operators actually use on the floor. For employee adoption, involve the process owner before changing the document and publish read-only PDFs where possible so old editable copies do not keep circulating.

Product learning:

- Small manufacturers struggle with revision control because ownership is unclear, not because they lack a naming convention.
- Team features should emphasize document/report owner, approval date, current revision, and read-only delivery after approval.

### Candidate 2: Supplier change management

Thread:

`https://elsmar.com/elsmarqualityforum/threads/supplier-change-management.92188/`

Why it fits:

- The thread asks how suppliers should know when changes require customer notification and approval.
- It maps to future supplier-quality workflows, but also to current 8D/SCAR evidence and approval control.
- Keep reply focused on process and criteria, not tooling.

Safe reply angle:

> I would separate the problem into two parts: the contractual requirement to notify, and the practical trigger list that tells the supplier what "notify" means. The trigger list should include material source, manufacturing location, special process, equipment/method, sub-supplier, inspection/test method, packaging, labeling, and anything tied to CTQ or customer-specific requirements. If CTQ is not fully defined yet, start with a conservative interim rule: any change that could affect fit, form, function, reliability, regulatory/customer requirement, or validation status must be notified before implementation. Then review the list after a few real change requests so it becomes usable rather than theoretical.

Product learning:

- Supplier-facing workflows need a clear trigger list and approval status, not just a free-text note.
- Customer-ready reports should expose the decision basis: why the action/change was accepted, who approved it, and what evidence was reviewed.

### Candidate 3: Older supplier change notification clause

Thread:

`https://elsmar.com/elsmarqualityforum/threads/supplier-change-management.86083/`

Why it fits:

- The thread asks whether a PO statement is enough or whether a signed supplier quality agreement is needed.
- It can be answered with process advice and shows common small-business gaps.

Safe reply angle:

> I would not rely on the purchase order alone if the change control requirement is important to product performance or customer commitments. A PO clause helps, but a supplier quality agreement or signed quality clause gives a clearer baseline, especially for changes to process, location, material source, test method, packaging, labeling, or sub-suppliers. I would also define the advance notice period, the approval route, and what evidence is expected with the request. Without those three pieces, suppliers may technically "notify" but still not give enough information for a real risk review.

Product learning:

- Buyers want evidence and approval routing, not only a policy statement.
- Template Setup and Team Launch can include standard quality-clause workflows as future service material.

### Candidate 4: Internal supplier control

Thread:

`https://elsmar.com/elsmarqualityforum/threads/how-to-control-internal-supplier.35796/`

Why it fits:

- The thread is older, but the theme is useful: internal handoffs can create the same risks as external suppliers.
- Only use if recent/newer threads are scarce; avoid reviving very old threads unless the forum culture allows it.

Safe reply angle:

> For internal suppliers, I would keep the control proportional to the risk of the handoff rather than creating a separate supplier system. The receiving process still needs defined requirements, acceptance criteria, nonconformance feedback, and evidence of correction when problems repeat. The difference is that the corrective path is usually through process ownership and management review rather than purchasing leverage.

Product learning:

- Internal handoffs can justify future complaint/intake or internal CAPA features, but they are not the current Team validation priority.

## Target Interview Mix

The first validation batch is 60 relevant people:

| Segment | Count | Where to reach them without cold DMs |
| --- | ---: | --- |
| Quality managers at small manufacturers | 20 | Quality forums, manufacturing communities, local industry groups, webinars |
| SQE / supplier quality engineers | 20 | r/Quality, r/manufacturing, myASQ, Elsmar, supplier-quality discussions |
| IATF / ISO consultants | 10 | Consultant forums, public posts, webinar comments, referral introductions |
| Small manufacturing owners / operations leaders | 10 | Manufacturing owner groups, local chambers, public discussion threads |

Do not pretend to be an unrelated customer. From the owner account, use honest language such as “I built”, “I am testing”, or “I am looking for feedback”.

## Distribution Channel Map

Use channels in this order. Do not paste the same message everywhere.

| Priority | Channel | Fit | How to participate |
| --- | --- | --- | --- |
| 1 | [Elsmar Quality Software Tools](https://elsmar.com/elsmarqualityforum/forums/quality-assurance-and-compliance-software-tools-and-solutions.36/) | Quality practitioners explicitly discussing software tools | Publish the founder-style workflow question below; ask for critique rather than a purchase |
| 2 | [myASQ Discussions](https://communityasq.prod.pcomm.net/discuss) | Broad professional quality community with active general, standards, and quality-management discussions | Join relevant discussions first; post a question about approval and revision control only after understanding community expectations |
| 3 | [Elsmar Nonconformance and Corrective Action](https://elsmar.com/elsmarqualityforum/forums/nonconformance-and-corrective-action.40/) | Strong problem-fit, but higher self-promotion risk | Ask about the process problem; link the demo only when members request an example |
| 4 | [CR4 Quality Assurance / Control](https://cr4.globalspec.com/forum/quality-assurance) | Engineering audience discussing practical QA/QC issues | Use a technical discussion about controlled revisions; do not lead with pricing |
| 5 | Reddit `r/Quality`, `r/manufacturing`, or `r/SixSigma` | Useful for candid feedback, but each subreddit has different self-promotion rules | Review current rules after login; publish to one subreddit only and disclose that you built the workflow |

ASQ describes myASQ as an online community of practice for quality professionals. Treat it as a professional discussion space, not a launch directory. Elsmar and CR4 are also discussion communities; useful participation and clear disclosure matter more than link volume.

## Seven-Day Execution

### Day 1: Publish the Team workflow demo

Publish one public discussion:

Recommended first channel:

- Elsmar Cove — `Quality Assurance and Compliance Software Tools and Solutions`:
  `https://elsmar.com/elsmarqualityforum/forums/quality-assurance-and-compliance-software-tools-and-solutions.36/`

This forum is the best first fit because the post is explicitly about evaluating a quality software workflow. Use the founder voice below, ask for critique, and do not frame the post as an unrelated customer recommendation.

Alternative after the first discussion produces useful engagement:

- Elsmar Cove — `Nonconformance and Corrective Action`:
  `https://elsmar.com/elsmarqualityforum/forums/nonconformance-and-corrective-action.40/`
- Reddit `r/Quality`, after reviewing the current community rules and logging in:
  `https://www.reddit.com/r/Quality/submit`

**Title**

> After an 8D is approved and sent to the customer, how do you stop uncontrolled edits?

**Post**

> I am testing a lightweight 8D workflow for small manufacturing quality teams. The part I am trying to validate is not the D0-D8 form itself, but what happens after the report is reviewed: approval, locking, revision reasons, Activity Log, and formal PDF/Word/ZIP delivery.
>
> Here is an automotive example showing the intended workflow:
> https://www.8d-reports.com/demo-reports/automotive?utm_source=community&utm_medium=discussion&utm_campaign=team_workflow_validation
>
> In your current process, once an 8D is approved and sent to the customer, how do you control later edits and prove who changed what?

Publish to one channel first, not several simultaneously. Record the live URL and wait for initial responses before adapting the post for a second channel.

### Day 2: Ask consultants about approval and template requirements

Publish or ask through a warm introduction:

> When helping a small manufacturer improve its 8D process, which creates more risk: weak root-cause content, uncontrolled document revisions, or customer-specific template requirements?
>
> Would a 7-day setup service that converts the existing template and configures roles/approval be useful, or would clients still prefer Word and email?

Link only when useful:

`https://www.8d-reports.com/team-launch?utm_source=consultant&utm_medium=discussion&utm_campaign=team_launch_validation`

### Day 3: Run five 20-minute interviews

Use this sequence:

1. How are customer 8Ds created today?
2. Who reviews and approves them?
3. After submission, can people still edit the file?
4. How do you track revisions and who changed what?
5. Does the customer require an exact Word/Excel template?
6. Review one relevant demo.
7. Ask: “What would stop you from using this for the next real complaint?”
8. Ask: “Would `$99/month` or a `$999` launch service be easier to approve?”

Do not demo every feature. Focus on their current process and objections.

### Day 4: Test the Template Setup offer

Publish a template-focused discussion:

> For teams still using customer-specific Word or Excel 8D files: would you consider moving the workflow online if the final export preserved the required customer format?
>
> I am testing a service that converts an existing template, maps the fields, configures roles, and helps complete the first real report. I am trying to understand whether exact export formatting or internal approval control matters more.

CTA:

`https://www.8d-reports.com/custom-8d-template-setup?utm_source=community&utm_medium=discussion&utm_campaign=template_setup_validation`

### Day 5: Follow up only with engaged people

Do not cold-message strangers. Follow up with people who commented, requested a demo, submitted a template, or accepted an introduction.

Suggested reply:

> Your point about [specific issue] is useful. I have a working demo for [relevant scenario]. Would you be open to a 15-minute review focused only on whether the approval and delivery workflow would fit your team?

### Day 6: Review evidence

Count:

- Demo visits
- PDF / Word / ZIP downloads
- Pricing visits
- Team checkout starts
- Template submissions
- Team Launch requests
- Interview objections
- Explicit willingness to try or pay

### Day 7: Make one decision

Use these rules:

- If buyers value locking and revisions: improve Team onboarding and sell Team Launch.
- If exact customer formats dominate: prioritize paid Template Setup delivery.
- If content quality dominates: prioritize Human Review and AI Quality Check reliability.
- If nobody values Team governance: do not add more governance features; revisit buyer segment.

## Qualification Scorecard

Record each conversation:

| Field | Values |
| --- | --- |
| Role | Quality Manager / SQE / Consultant / Owner |
| Company size | 1-20 / 21-100 / 101-500 / 500+ |
| Current tool | Word / Excel / Email / QMS / Other |
| 8D frequency | Rare / Monthly / Weekly / Daily |
| Customer-specific template | Yes / No |
| Approval pain | Low / Medium / High |
| Revision-control pain | Low / Medium / High |
| Most valuable offer | Pro / Team / Template Setup / Team Launch / Human Review |
| Price reaction | Too high / Reasonable / Easy approval |
| Next step | None / Demo / Trial / Template submitted / Purchase |

## Success Gate Before New Feature Development

Proceed to Customer Complaint Intake only after at least one of these is true:

- 3 teams actively test the Team workflow;
- 1 Team subscription is paid;
- 1 Team Launch or Template Setup request is qualified;
- 10 interviews consistently identify complaint intake as the next blocking problem.

Until then, the correct work is production reliability, demos, interviews, and sales follow-up.
