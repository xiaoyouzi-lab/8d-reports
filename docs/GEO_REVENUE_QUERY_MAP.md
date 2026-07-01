# GEO Revenue Query Map

## Purpose

This map turns Revenue Evidence into a content and GEO/SEO operating plan. It
does not invent search volume, AI citation rate, customer demand, revenue, or
rankings. Unless a row is later enriched from GSC/GA4, every query below is a
hypothesis based on product positioning, manufacturing quality workflows, and
high-intent user jobs.

Use this map to decide which pages, resources, demos, service offers, and
offsite answers should exist before writing content. Do not use it to publish
low-quality SEO pages or generic AI article batches.

## Field Definitions

- Intent type: informational, commercial, service, template, or comparison.
- Target page type: existing page, new resource, case page, offsite answer, or
  service page.
- CTA: Template Setup, Team Launch, Assisted First 8D, Signup, or Demo Download.
- Priority: P0 for revenue-near terms, P1 for core educational/commercial
  terms, P2 for useful supporting terms.
- Safe metadata / tracking event: only safe enums, page ids, priority, CTA,
  category, and format. Do not store full queries, customer names, product names,
  report text, root cause text, corrective action text, lessons learned, batch
  numbers, AI prompts, or uploaded file content.

## A. Core 8D Report Intent

| ID | Query | Intent | Target page type | CTA | Priority | Why it matters | Content angle | Internal link target | Safe metadata / tracking event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A01 | how to write an 8D report for customer complaint | informational | new resource | Assisted First 8D | P0 | Urgent customer response workflow | Answer-first D0-D8 checklist | `/resources/how-to-write-8d-report-customer-complaint` | `seo_page_view {category:core_8d, priority:P0}` |
| A02 | 8D report template for supplier quality | template | existing page | Template Setup | P0 | Template users can become setup leads | Compare template vs workflow | `/8d-report-template/supplier` | `seo_template_click {category:core_8d}` |
| A03 | best 8D report software for manufacturing | commercial | new resource | Signup | P0 | Software evaluation intent | Buyer checklist for small teams | `/pricing` | `marketing_cta_clicked {cta:signup, category:core_8d}` |
| A04 | 8D report example for automotive supplier | template | existing page | Demo Download | P0 | Example-driven high-intent visitor | Walk through automotive demo | `/demo-reports/automotive` | `demo_report_downloaded {demoType:automotive}` |
| A05 | 8D report vs corrective action report | comparison | new resource | Signup | P1 | Clarifies adjacent quality workflows | Use cases and fields compared | `/corrective-action-report-template` | `seo_page_view {category:core_8d}` |
| A06 | how to complete D4 root cause in 8D | informational | new resource | Demo Download | P0 | D4 is a high-friction report step | 5-Why plus evidence checklist | `/resources/8d-root-cause-d4-guide` | `seo_page_view {step:D4}` |
| A07 | how to complete D5 corrective action in 8D | informational | new resource | Assisted First 8D | P0 | D5 maps to delivery value | Action owner, due date, validation | `/resources/8d-corrective-action-d5-guide` | `seo_page_view {step:D5}` |
| A08 | 8D report software for customer complaints | commercial | new resource | Signup | P0 | Product-fit query | Complaint response workspace | `/` | `marketing_cta_clicked {cta:signup}` |
| A09 | 8D report format for manufacturing defects | template | new resource | Template Setup | P1 | Format-search users may need setup | D0-D8 structure and evidence | `/custom-8d-template-setup` | `marketing_cta_clicked {service:template_setup}` |
| A10 | 8D report checklist before customer submission | informational | new resource | Assisted First 8D | P1 | Pre-export readiness intent | Submission checklist and mistakes | `/sample-report` | `seo_page_view {category:core_8d}` |
| A11 | 8D report approval workflow | commercial | existing page | Team Launch | P1 | Team governance intent | Owner/editor/viewer and locking | `/pricing` | `pricing_service_cta_clicked {service:team_launch}` |
| A12 | 8D report evidence attachments best practices | informational | new resource | Signup | P1 | Evidence packaging is a product strength | Photos, logs, inspection evidence | `/demo-reports` | `seo_page_view {category:evidence}` |
| A13 | 8D report D0 D1 D2 D3 D4 D5 D6 D7 D8 explained | informational | new resource | Signup | P1 | Foundational search intent | Step-by-step primer | `/docs/create-report` | `docs_topic_opened {topic:d0_d8}` |
| A14 | customer ready 8D report example | template | existing page | Demo Download | P0 | Revenue-near proof search | Demo plus export package | `/demo-reports` | `demo_report_downloaded {format:pdf}` |
| A15 | 8D report with PDF Word Excel export | commercial | existing page | Signup | P0 | Export intent maps to paid value | Compare output formats | `/pricing` | `pricing_plan_clicked {plan:pro}` |
| A16 | 8D report workflow for small manufacturing team | commercial | service page | Team Launch | P0 | Team Launch audience | Lightweight workflow before QMS | `/custom-8d-template-setup?service=team_launch#request` | `pricing_service_cta_clicked {service:team_launch}` |
| A17 | 8D report review checklist | informational | new resource | Assisted First 8D | P1 | Users want quality review | Missing evidence and weak logic | `/8d-report-review-service` | `ai_report_review_clicked {source:resource}` |
| A18 | 8D report software with revision history | commercial | existing page | Signup | P1 | Team governance differentiator | Review, lock, revise | `/pricing` | `marketing_cta_clicked {feature:revision_history}` |
| A19 | 8D report root cause corrective action example | template | case page | Demo Download | P1 | D4/D5 example intent | Pair cause with action | `/demo-reports/electronics` | `demo_report_downloaded {demoType:electronics}` |
| A20 | 8D report for recurring defect | informational | new resource | Signup | P1 | Recurrence links to knowledge reuse | Search past causes and lessons | `/knowledge` | `knowledge_search_used {source:resource_link}` |

## B. SCAR / Supplier Corrective Action

| ID | Query | Intent | Target page type | CTA | Priority | Why it matters | Content angle | Internal link target | Safe metadata / tracking event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B01 | supplier corrective action request template | template | new resource | Template Setup | P0 | Direct SCAR template intent | Request fields and response package | `/resources/supplier-corrective-action-request-template` | `seo_page_view {category:scar, priority:P0}` |
| B02 | how to respond to SCAR from customer | informational | new resource | Assisted First 8D | P0 | Urgent paid-assist fit | Response sequence and evidence | `/custom-8d-template-setup?service=assisted_8d#request` | `marketing_cta_clicked {service:assisted_8d}` |
| B03 | SCAR report example for manufacturing | template | case page | Demo Download | P0 | Example-driven SCAR search | Manufacturing SCAR as 8D workflow | `/demo-reports/molding` | `demo_report_downloaded {demoType:molding}` |
| B04 | 8D vs SCAR | comparison | new resource | Signup | P0 | Important category comparison | When to use each | `/resources/8d-vs-scar` | `seo_page_view {category:scar}` |
| B05 | supplier quality corrective action tracking | commercial | new resource | Team Launch | P0 | Team workflow query | Track owner, due date, closure | `/pricing` | `pricing_service_cta_clicked {service:team_launch}` |
| B06 | SCAR corrective action response template | template | new resource | Template Setup | P0 | Format setup opportunity | Map SCAR fields to D0-D8 | `/custom-8d-template-setup#request` | `marketing_cta_clicked {service:template_setup}` |
| B07 | supplier corrective action form Excel | template | new resource | Template Setup | P1 | Excel replacement intent | Why Excel gets scattered | `/resources/excel-8d-template-vs-8d-software` | `seo_template_click {category:scar}` |
| B08 | supplier nonconformance corrective action report | informational | new resource | Assisted First 8D | P1 | Adjacent supplier workflow | Nonconformance to action closure | `/corrective-action-report-template` | `seo_page_view {category:scar}` |
| B09 | supplier 8D response template | template | existing page | Template Setup | P0 | Strong ICP fit | Supplier response sections | `/8d-report-template/supplier` | `seo_template_click {category:scar}` |
| B10 | how to review supplier corrective action | informational | new resource | Team Launch | P1 | Manager/SQE review query | Evidence and validation criteria | `/8d-report-review-service` | `ai_report_review_clicked {source:scar_resource}` |
| B11 | supplier corrective action due date tracking | commercial | new resource | Team Launch | P1 | Operational pain | Dashboard, roles, reminders later | `/dashboard` | `dashboard_feature_entry_clicked {entry:team}` |
| B12 | SCAR root cause analysis example | template | case page | Demo Download | P1 | Root-cause example intent | Occurrence vs escape cause | `/demo-reports/automotive` | `demo_report_downloaded {format:pdf}` |
| B13 | SCAR containment action example | informational | new resource | Assisted First 8D | P1 | D3 urgency | Immediate containment checklist | `/sample-report` | `seo_page_view {step:D3}` |
| B14 | SCAR closure criteria | informational | new resource | Signup | P2 | Closure/readiness fit | D6 validation and D8 closure | `/resources/8d-validation-d6-guide` | `seo_page_view {step:D6}` |
| B15 | supplier corrective action evidence package | commercial | new resource | Demo Download | P1 | Export package value | Attachments and audit trail | `/demo-reports` | `demo_report_downloaded {format:zip}` |
| B16 | supplier corrective action software for small teams | commercial | service page | Team Launch | P0 | Team Launch prospect | Lightweight workflow vs full QMS | `/custom-8d-template-setup?service=team_launch#request` | `pricing_service_cta_clicked {service:team_launch}` |
| B17 | customer SCAR response due this week | service | service page | Assisted First 8D | P0 | Urgent services intent | Assisted first response | `/custom-8d-template-setup?service=assisted_8d#request` | `marketing_cta_clicked {service:assisted_8d}` |
| B18 | SCAR preventive action examples | informational | new resource | Demo Download | P1 | D7 maps to prevention | System change examples | `/resources/8d-lessons-learned-d8-guide` | `seo_page_view {category:prevention}` |
| B19 | supplier corrective action request workflow | commercial | new resource | Team Launch | P1 | Workflow design intent | Request, review, closure | `/team-launch` | `pricing_service_cta_clicked {service:team_launch}` |
| B20 | SCAR response checklist for suppliers | informational | new resource | Assisted First 8D | P0 | Submission readiness | Evidence and approval checklist | `/resources/supplier-corrective-action-request-template` | `seo_page_view {category:scar}` |

## C. Customer Complaint Response

| ID | Query | Intent | Target page type | CTA | Priority | Why it matters | Content angle | Internal link target | Safe metadata / tracking event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | how to respond to customer complaint with 8D | informational | new resource | Assisted First 8D | P0 | Core urgent job | Response timeline and D0-D8 | `/resources/how-to-write-8d-report-customer-complaint` | `seo_page_view {category:complaint}` |
| C02 | customer complaint 8D example | template | case page | Demo Download | P0 | Proof and example intent | Complete example walkthrough | `/demo-reports/automotive` | `demo_report_downloaded {demoType:automotive}` |
| C03 | customer rejected parts corrective action report | informational | case page | Assisted First 8D | P0 | Customer pressure | Defect, containment, evidence | `/custom-8d-template-setup?service=assisted_8d#request` | `marketing_cta_clicked {service:assisted_8d}` |
| C04 | customer complaint root cause analysis template | template | new resource | Template Setup | P0 | Template setup prospect | D4 fields and evidence | `/resources/8d-root-cause-d4-guide` | `seo_template_click {category:complaint}` |
| C05 | how to write containment action for customer complaint | informational | new resource | Assisted First 8D | P1 | D3 urgent step | Containment owner and verification | `/sample-report` | `seo_page_view {step:D3}` |
| C06 | customer complaint corrective action response | informational | new resource | Assisted First 8D | P0 | D5 response fit | Corrective action structure | `/resources/8d-corrective-action-d5-guide` | `seo_page_view {step:D5}` |
| C07 | customer complaint 8D due date tracking | commercial | service page | Team Launch | P1 | Team workflow pain | Review and closure cadence | `/team-launch` | `pricing_service_cta_clicked {service:team_launch}` |
| C08 | customer complaint report format manufacturing | template | new resource | Template Setup | P1 | Format conversion intent | Convert report format to workflow | `/custom-8d-template-setup#request` | `marketing_cta_clicked {service:template_setup}` |
| C09 | customer quality complaint response software | commercial | new resource | Signup | P0 | Product discovery | Lightweight complaint response workspace | `/` | `marketing_cta_clicked {cta:signup}` |
| C10 | customer 8D report validation results example | template | new resource | Demo Download | P1 | D6 example need | Validation table and evidence | `/resources/8d-validation-d6-guide` | `demo_report_downloaded {format:xlsx}` |
| C11 | how to prevent repeat customer complaints | informational | new resource | Signup | P1 | D7 prevention value | System changes and lessons | `/resources/8d-lessons-learned-d8-guide` | `seo_page_view {step:D7}` |
| C12 | customer complaint escalation 8D workflow | commercial | new resource | Team Launch | P1 | Manager workflow intent | Roles, review, approval | `/pricing` | `pricing_plan_clicked {plan:team}` |
| C13 | customer complaint 5 why example | informational | existing page | Demo Download | P1 | Root cause education | 5-Why inside 8D | `/5-why-example/customer-complaint` | `seo_page_view {category:5why}` |
| C14 | customer complaint corrective action checklist | informational | new resource | Assisted First 8D | P1 | Checklist intent | Before sending to customer | `/8d-report-review-service` | `ai_report_review_clicked {source:complaint}` |
| C15 | customer complaint closure report example | template | case page | Demo Download | P1 | D8 closure example | Approval and lessons learned | `/demo-reports/electronics` | `demo_report_downloaded {format:pdf}` |
| C16 | customer complaint response template Word Excel | template | service page | Template Setup | P0 | Template conversion target | Upload current format | `/custom-8d-template-setup#request` | `template_setup_form_started {requestType:template_setup}` |
| C17 | customer complaint quality report for supplier | informational | new resource | Signup | P1 | Supplier-facing response | Supplier quality response path | `/supplier-8d-report` | `seo_page_view {category:supplier}` |
| C18 | urgent customer 8D report help | service | service page | Assisted First 8D | P0 | Paid service signal | Assisted delivery scope | `/custom-8d-template-setup?service=assisted_8d#request` | `pricing_service_cta_clicked {service:assisted_8d}` |
| C19 | customer complaint evidence checklist | informational | new resource | Demo Download | P1 | Evidence packaging intent | Photos, logs, measurements | `/demo-reports` | `demo_report_downloaded {format:zip}` |
| C20 | customer 8D report rejection reasons | informational | new resource | Assisted First 8D | P1 | Quality review value | Weak evidence and vague causes | `/8d-report-review-service` | `ai_report_review_clicked {source:complaint}` |

## D. Industry Examples

| ID | Query | Intent | Target page type | CTA | Priority | Why it matters | Content angle | Internal link target | Safe metadata / tracking event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | automotive 8D report example | template | existing page | Demo Download | P0 | Existing demo fit | Automotive supplier report | `/demo-reports/automotive` | `demo_report_downloaded {demoType:automotive}` |
| D02 | electronics 8D report example | template | existing page | Demo Download | P0 | Existing demo fit | Electronics complaint workflow | `/demo-reports/electronics` | `demo_report_downloaded {demoType:electronics}` |
| D03 | semiconductor 8D report example | template | case page | Demo Download | P1 | High-compliance industry | Traceability and evidence | `/8d-report-example/semiconductor` | `seo_page_view {industry:semiconductor}` |
| D04 | medical device corrective action report example | informational | case page | Assisted First 8D | P1 | Regulated quality audience | Conservative non-QMS positioning | `/corrective-action-example/manufacturing` | `seo_page_view {industry:medical_device}` |
| D05 | injection molding defect 8D example | template | existing page | Demo Download | P0 | Existing demo fit | Molding defect 8D package | `/demo-reports/molding` | `demo_report_downloaded {demoType:molding}` |
| D06 | machining defect 8D report | template | case page | Demo Download | P1 | Common manufacturing ICP | Tool wear and measurement evidence | `/8d-report-example/manufacturing` | `seo_page_view {industry:machining}` |
| D07 | battery pack failure 8D report | template | case page | Assisted First 8D | P1 | Complex failure analysis | Safety-sensitive evidence checklist | `/sample-report` | `seo_page_view {industry:battery}` |
| D08 | packaging defect 8D report | template | case page | Demo Download | P1 | Supplier/customer complaint fit | Handling, labeling, containment | `/8d-report-example/customer-complaint` | `demo_report_downloaded {format:pdf}` |
| D09 | welding defect 8D report example | template | case page | Demo Download | P2 | Manufacturing defect example | Process parameters and inspection | `/8d-report-example/manufacturing` | `seo_page_view {industry:welding}` |
| D10 | coating failure 8D report example | template | case page | Demo Download | P1 | Matches common fixture | Adhesion, cure, humidity | `/demo-reports/automotive` | `demo_report_downloaded {demoType:automotive}` |
| D11 | assembly defect 8D report example | template | existing page | Demo Download | P1 | Common defect category | Assembly error containment | `/corrective-action-example/assembly-defect` | `seo_page_view {industry:assembly}` |
| D12 | plastic injection short shot 8D example | template | case page | Demo Download | P1 | Molding audience | Process window and validation | `/demo-reports/molding` | `demo_report_downloaded {demoType:molding}` |
| D13 | PCB solder defect 8D report | template | case page | Demo Download | P1 | Electronics audience | Solder process evidence | `/demo-reports/electronics` | `demo_report_downloaded {demoType:electronics}` |
| D14 | automotive supplier SCAR response example | template | case page | Assisted First 8D | P0 | Paid service fit | Customer SCAR response | `/resources/supplier-corrective-action-request-template` | `marketing_cta_clicked {service:assisted_8d}` |
| D15 | aerospace corrective action 8D example | informational | case page | Assisted First 8D | P2 | High rigor but avoid AS9100 overclaim | Evidence-first response | `/8d-report-review-service` | `seo_page_view {industry:aerospace}` |
| D16 | food packaging corrective action report example | informational | case page | Demo Download | P2 | Adjacent manufacturing | Containment and prevention | `/corrective-action-example/customer-complaint` | `seo_page_view {industry:packaging}` |
| D17 | metal stamping defect 8D report example | template | case page | Demo Download | P1 | Automotive supplier fit | Die wear and inspection | `/8d-report-example/automotive` | `demo_report_downloaded {format:xlsx}` |
| D18 | supplier late delivery 8D example | informational | existing page | Signup | P2 | Non-quality delivery issue | 8D for delivery failures | `/5-why-example/late-delivery` | `seo_page_view {industry:supplier}` |
| D19 | paint peel off 8D report example | template | case page | Demo Download | P1 | Strong root-cause example | Occurrence and escape causes | `/demo-reports/automotive` | `demo_report_downloaded {format:pdf}` |
| D20 | manufacturing customer complaint 8D example | template | case page | Demo Download | P0 | High-intent broad industry term | Complete D0-D8 example | `/demo-reports` | `demo_report_downloaded {format:zip}` |

## E. Role-Based Intent

| ID | Query | Intent | Target page type | CTA | Priority | Why it matters | Content angle | Internal link target | Safe metadata / tracking event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | SQE 8D report workflow | commercial | new resource | Team Launch | P0 | Core user role | Supplier quality workflow | `/team-launch` | `pricing_service_cta_clicked {service:team_launch}` |
| E02 | quality manager complaint response software | commercial | new resource | Signup | P0 | Buyer role | Team visibility and exports | `/pricing` | `pricing_plan_clicked {plan:team}` |
| E03 | supplier quality engineer corrective action template | template | existing page | Template Setup | P0 | Template + role fit | SQE field checklist | `/8d-report-template/supplier` | `seo_template_click {role:sqe}` |
| E04 | quality team 8D collaboration tool | commercial | service page | Team Launch | P0 | Team feature fit | Roles, review, approval | `/pricing` | `pricing_service_cta_clicked {service:team_launch}` |
| E05 | manufacturing quality engineer 8D software | commercial | new resource | Signup | P0 | ICP product search | Engineer workflow | `/` | `marketing_cta_clicked {cta:signup}` |
| E06 | plant quality manager 8D dashboard | commercial | new resource | Team Launch | P1 | Manager visibility | Metrics, status, workflow | `/dashboard` | `dashboard_feature_entry_clicked {entry:workflow}` |
| E07 | supplier quality corrective action tracker for SQE | commercial | new resource | Team Launch | P1 | Tracker replacement | Reports, evidence, status | `/team-launch` | `pricing_service_cta_clicked {service:team_launch}` |
| E08 | quality supervisor customer complaint checklist | informational | new resource | Assisted First 8D | P1 | Frontline complaint handling | Daily checklist | `/resources/how-to-write-8d-report-customer-complaint` | `seo_page_view {role:supervisor}` |
| E09 | operations manager corrective action follow up | informational | offsite answer | Team Launch | P2 | Adjacent role | Ownership and due dates | `/pricing` | `marketing_cta_clicked {role:operations}` |
| E10 | supplier portal alternative for 8D reports | comparison | new resource | Team Launch | P1 | Lightweight alternative positioning | Share links vs full portal | `/supplier-8d-report` | `seo_page_view {role:sqe}` |
| E11 | quality auditor 8D evidence checklist | informational | new resource | Demo Download | P1 | Audit-ready evidence | Evidence package checklist | `/demo-reports` | `demo_report_downloaded {format:zip}` |
| E12 | CAPA coordinator 8D report workflow | commercial | new resource | Signup | P1 | CAPA-adjacent role | Corrective action tracking | `/corrective-action-report-template` | `seo_page_view {role:capa}` |
| E13 | supplier development engineer SCAR workflow | commercial | new resource | Team Launch | P1 | Supplier development users | SCAR review and closure | `/resources/supplier-corrective-action-request-template` | `pricing_service_cta_clicked {service:team_launch}` |
| E14 | quality director 8D reporting system small business | commercial | service page | Team Launch | P1 | Decision maker | Before full QMS rollout | `/custom-8d-template-setup?service=team_launch#request` | `pricing_service_cta_clicked {service:team_launch}` |
| E15 | production engineer root cause 8D template | template | new resource | Demo Download | P2 | Contributor role | D4 input guidance | `/resources/8d-root-cause-d4-guide` | `seo_template_click {role:production_engineer}` |
| E16 | quality technician containment action form | template | new resource | Signup | P2 | D3 contributor | Containment evidence form | `/sample-report` | `seo_page_view {role:technician}` |
| E17 | supplier quality manager team 8D workflow | commercial | service page | Team Launch | P0 | Clear Team Launch fit | Multi-user approval workflow | `/team-launch` | `pricing_service_cta_clicked {service:team_launch}` |
| E18 | customer quality engineer 8D response review | informational | new resource | Assisted First 8D | P1 | Review intent | What customers look for | `/8d-report-review-service` | `ai_report_review_clicked {role:customer_quality}` |
| E19 | small quality team corrective action software | commercial | new resource | Signup | P0 | Product positioning | Lightweight workspace | `/` | `marketing_cta_clicked {cta:signup}` |
| E20 | quality engineer report export PDF Word Excel | commercial | existing page | Signup | P1 | Export value | Delivery formats | `/pricing` | `export_attempted {source:resource}` |

## F. Excel Replacement Intent

| ID | Query | Intent | Target page type | CTA | Priority | Why it matters | Content angle | Internal link target | Safe metadata / tracking event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | Excel 8D template vs 8D software | comparison | new resource | Signup | P0 | Strong replacement intent | Spreadsheet limits vs workspace | `/resources/excel-8d-template-vs-8d-software` | `seo_page_view {category:excel_replacement}` |
| F02 | best alternative to Excel 8D report template | commercial | new resource | Signup | P0 | Product comparison | Evidence, review, export | `/pricing` | `marketing_cta_clicked {cta:signup}` |
| F03 | convert Excel 8D template to online workflow | service | service page | Template Setup | P0 | Direct paid setup intent | Upload and map fields | `/custom-8d-template-setup#request` | `template_setup_form_started {requestType:template_setup}` |
| F04 | custom 8D report template setup | service | service page | Template Setup | P0 | Core service query | Setup scope and deliverables | `/custom-8d-template-setup` | `pricing_service_cta_clicked {service:template_setup}` |
| F05 | online 8D report template with attachments | commercial | new resource | Signup | P0 | Product capability match | Evidence by step | `/sample-report` | `marketing_cta_clicked {feature:attachments}` |
| F06 | Word 8D template to web app | service | service page | Template Setup | P1 | Template conversion | Word sections to workflow | `/custom-8d-template-setup#request` | `marketing_cta_clicked {service:template_setup}` |
| F07 | Excel corrective action tracker alternative | comparison | new resource | Signup | P1 | Adjacent tracker replacement | Corrective action workflow | `/corrective-action-report-template` | `seo_page_view {category:excel_replacement}` |
| F08 | 8D report template with PDF export | commercial | existing page | Signup | P1 | Export intent | Draft to PDF | `/pricing` | `pricing_plan_clicked {plan:pro}` |
| F09 | 8D report template with Word export | commercial | existing page | Signup | P1 | Word export value | Editable customer deliverable | `/pricing` | `pricing_plan_clicked {plan:pro}` |
| F10 | 8D report template with Excel export | commercial | existing page | Signup | P1 | Excel export value | Workbook export | `/pricing` | `pricing_plan_clicked {plan:pro}` |
| F11 | fill out 8D report online | commercial | existing page | Signup | P0 | Product activation | Online D0-D8 workflow | `/signup` | `signup_started {source:resource}` |
| F12 | online 8D report generator no Excel | commercial | new resource | Signup | P1 | Spreadsheet replacement | Structured report creation | `/reports/new` | `report_created {source:resource}` |
| F13 | 8D template version control alternative | commercial | new resource | Team Launch | P1 | Team governance pain | Revision and lock workflow | `/pricing` | `pricing_service_cta_clicked {service:team_launch}` |
| F14 | replace shared Excel 8D tracker | comparison | new resource | Team Launch | P1 | Team collaboration pain | Shared files vs workspace | `/team-launch` | `pricing_service_cta_clicked {service:team_launch}` |
| F15 | upload company 8D template online | service | service page | Template Setup | P0 | Direct upload intent | File upload optional and safe | `/custom-8d-template-setup#request` | `template_setup_form_started {requestType:template_setup}` |
| F16 | customer specific 8D template setup | service | service page | Template Setup | P0 | Customer format pain | Setup scope and review | `/custom-8d-template-setup` | `pricing_service_cta_clicked {service:template_setup}` |
| F17 | Excel 8D template with evidence photos alternative | comparison | new resource | Signup | P1 | Evidence packaging pain | Photo evidence in report flow | `/demo-reports` | `demo_report_downloaded {format:zip}` |
| F18 | 8D report template approval workflow | commercial | new resource | Team Launch | P1 | Team approval query | Owner review and locking | `/pricing` | `pricing_plan_clicked {plan:team}` |
| F19 | online supplier corrective action template | commercial | new resource | Template Setup | P0 | SCAR + online template | Supplier response workflow | `/resources/supplier-corrective-action-request-template` | `seo_template_click {category:scar}` |
| F20 | 8D report form builder for manufacturing | commercial | service page | Template Setup | P1 | Setup/build intent | Convert existing form | `/custom-8d-template-setup#request` | `marketing_cta_clicked {service:template_setup}` |

## G. AI / Knowledge Reuse Intent

| ID | Query | Intent | Target page type | CTA | Priority | Why it matters | Content angle | Internal link target | Safe metadata / tracking event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G01 | AI 8D report checker | commercial | new resource | Signup | P0 | AI Quality Check intent | Conservative review assistant | `/resources/ai-8d-report-checker` | `ai_report_review_clicked {source:resource}` |
| G02 | AI quality check for 8D report | commercial | new resource | Signup | P0 | Direct AI feature query | Gap review, not approval | `/8d-report-review-service` | `ai_report_review_clicked {source:resource}` |
| G03 | reuse past root causes in 8D reports | informational | new resource | Signup | P0 | Knowledge reuse positioning | Copy proven patterns safely | `/knowledge` | `knowledge_reuse_panel_opened {source:resource}` |
| G04 | 8D knowledge base software | commercial | new resource | Signup | P0 | KB product category | Completed reports as assets | `/knowledge` | `knowledge_search_used {source:resource}` |
| G05 | search historical corrective actions | commercial | new resource | Signup | P0 | Knowledge Base value | Search actions by problem | `/knowledge` | `knowledge_search_used {source:resource}` |
| G06 | AI review customer 8D report before submission | service | service page | Assisted First 8D | P0 | Urgent review intent | AI plus human responsibility | `/custom-8d-template-setup?service=assisted_8d#request` | `ai_report_review_clicked {source:assisted}` |
| G07 | 8D report root cause reuse | informational | new resource | Signup | P1 | D4 reuse intent | Similar causes and caveats | `/resources/8d-root-cause-d4-guide` | `knowledge_reuse_root_cause_copied {source:resource}` |
| G08 | corrective action knowledge base manufacturing | commercial | new resource | Team Launch | P1 | Team knowledge value | Reuse by team | `/pricing` | `pricing_plan_clicked {plan:team}` |
| G09 | AI corrective action report review | commercial | new resource | Signup | P1 | Adjacent AI review query | Weak action detection | `/8d-report-review-service` | `ai_report_review_clicked {source:resource}` |
| G10 | 8D lessons learned database | informational | new resource | Signup | P1 | D8 knowledge asset value | Lessons reuse | `/knowledge` | `knowledge_lesson_copied {source:resource}` |
| G11 | search past 8D reports by root cause | commercial | new resource | Signup | P1 | Direct KB search | Root-cause search | `/knowledge` | `knowledge_search_used {source:resource}` |
| G12 | AI root cause analysis checker | informational | new resource | Signup | P1 | D4 quality intent | Conservative root-cause review | `/resources/8d-root-cause-d4-guide` | `ai_report_review_clicked {source:d4}` |
| G13 | quality knowledge base for corrective actions | commercial | new resource | Team Launch | P1 | Team asset positioning | Completed reports as reusable knowledge | `/knowledge` | `pricing_plan_clicked {plan:team}` |
| G14 | 8D report AI assistant manufacturing | commercial | new resource | Signup | P1 | Product discovery | AI assistant boundaries | `/docs` | `ai_report_review_clicked {source:resource}` |
| G15 | compare new 8D report with previous reports | informational | new resource | Signup | P1 | Context-aware review | Similar report references | `/knowledge` | `ai_quality_check_knowledge_context_used {source:resource}` |
| G16 | AI SCAR response checker | commercial | new resource | Assisted First 8D | P1 | SCAR + AI review | Check response gaps | `/custom-8d-template-setup?service=assisted_8d#request` | `ai_report_review_clicked {source:scar}` |
| G17 | quality report knowledge reuse software | commercial | new resource | Signup | P1 | Broad KB query | From documents to assets | `/knowledge` | `knowledge_reuse_panel_opened {source:resource}` |
| G18 | historical 8D report search | commercial | existing page | Signup | P1 | Search/history value | Search completed reports | `/knowledge` | `knowledge_search_used {source:resource}` |
| G19 | AI find missing evidence in 8D report | informational | new resource | Signup | P1 | AI review value | Evidence gap checklist | `/8d-report-review-service` | `ai_report_review_clicked {source:evidence}` |
| G20 | AI check D4 D5 D6 8D report | informational | new resource | Signup | P1 | Step-specific review | Root cause, action, validation | `/resources/ai-8d-report-checker` | `ai_report_review_clicked {source:resource}` |

## H. Service / Paid Intent

| ID | Query | Intent | Target page type | CTA | Priority | Why it matters | Content angle | Internal link target | Safe metadata / tracking event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H01 | custom 8D report template setup | service | service page | Template Setup | P0 | Core paid service query | Upload current format | `/custom-8d-template-setup` | `template_setup_form_started {requestType:template_setup}` |
| H02 | help writing first 8D report | service | service page | Assisted First 8D | P0 | Direct assisted service | First customer deliverable | `/custom-8d-template-setup?service=assisted_8d#request` | `pricing_service_cta_clicked {service:assisted_8d}` |
| H03 | assisted 8D report service | service | service page | Assisted First 8D | P0 | Direct paid intent | Assisted delivery scope | `/custom-8d-template-setup?service=assisted_8d#request` | `template_setup_form_started {requestType:assisted_8d}` |
| H04 | team launch for 8D reporting | service | service page | Team Launch | P0 | Direct Team Launch query | Setup team workflow | `/custom-8d-template-setup?service=team_launch#request` | `pricing_service_cta_clicked {service:team_launch}` |
| H05 | setup 8D report workflow for supplier quality team | service | service page | Team Launch | P0 | Strong ICP paid service | Roles and first workflow | `/team-launch` | `template_setup_form_started {requestType:team_launch}` |
| H06 | convert company 8D template to software | service | service page | Template Setup | P0 | Template Setup fit | Field mapping and export review | `/custom-8d-template-setup#request` | `pricing_service_cta_clicked {service:template_setup}` |
| H07 | 8D report setup service for manufacturer | service | service page | Template Setup | P0 | Paid setup search | Setup deliverables | `/custom-8d-template-setup` | `template_setup_form_submitted {requestType:template_setup}` |
| H08 | urgent 8D report support | service | service page | Assisted First 8D | P0 | Urgent service query | Due date and evidence intake | `/contact` | `contact_form_submitted {topic:assisted_8d}` |
| H09 | SCAR response help for supplier | service | service page | Assisted First 8D | P0 | SCAR paid intent | Customer response assistance | `/custom-8d-template-setup?service=assisted_8d#request` | `pricing_service_cta_clicked {service:assisted_8d}` |
| H10 | paid 8D report review service | service | service page | Assisted First 8D | P1 | Review service intent | Gap review before export | `/8d-report-review-service` | `ai_report_review_clicked {source:service}` |
| H11 | customize 8D report export format | service | service page | Template Setup | P0 | Customer format pain | Export format review | `/custom-8d-template-setup` | `template_setup_form_started {requestType:template_setup}` |
| H12 | 8D report workflow implementation help | service | service page | Team Launch | P1 | Team Launch adjacent | Implementation checklist | `/team-launch` | `pricing_service_cta_clicked {service:team_launch}` |
| H13 | supplier quality team setup 8D software | service | service page | Team Launch | P0 | Service + software fit | Team setup deliverables | `/custom-8d-template-setup?service=team_launch#request` | `template_setup_form_started {requestType:team_launch}` |
| H14 | customer complaint 8D report help this week | service | service page | Assisted First 8D | P0 | High urgency | Assisted first response | `/custom-8d-template-setup?service=assisted_8d#request` | `pricing_service_cta_clicked {service:assisted_8d}` |
| H15 | 8D template setup pricing | service | service page | Template Setup | P0 | Pricing validation | From $499 scope | `/pricing` | `pricing_service_cta_clicked {service:template_setup}` |
| H16 | team 8D workflow launch pricing | service | service page | Team Launch | P0 | Pricing validation | From $999 scope | `/pricing` | `pricing_service_cta_clicked {service:team_launch}` |
| H17 | assisted SCAR delivery pricing | service | service page | Assisted First 8D | P0 | Pricing validation | From $799 scope | `/pricing` | `pricing_service_cta_clicked {service:assisted_8d}` |
| H18 | 8D report consultant alternative software | comparison | new resource | Signup | P1 | Alternative evaluation | Software plus assisted service | `/pricing` | `marketing_cta_clicked {cta:signup}` |
| H19 | first customer 8D report package | service | service page | Assisted First 8D | P1 | Delivery package intent | PDF/Word/Excel/ZIP outputs | `/demo-reports` | `demo_report_downloaded {format:zip}` |
| H20 | manufacturing quality service for 8D launch | service | service page | Team Launch | P1 | Broader service discovery | Launch before full QMS | `/team-launch` | `pricing_service_cta_clicked {service:team_launch}` |

## Measurement Notes

- Treat this map as hypothesis until enriched by real GSC/GA4 or first-party
  analytics data.
- Safe event metadata should use `category`, `priority`, `cta`, `service`,
  `demoType`, `format`, `page`, or `source`.
- Forbidden analytics metadata includes full queries, customer names, product names, report text, root cause text, corrective action text, lessons learned, batch numbers, AI prompts, and uploaded file content.
- Do not store full search query strings from users as analytics metadata.
- Do not use this map to create hundreds of thin pages. Prioritize P0 pages that
  connect directly to Template Setup, Team Launch, Assisted First 8D, Signup, or
  Demo Download.
- If GSC/GA4 scripts are available later, enrich rows with real impressions and
  clicks in a separate evidence column. Until then, keep all search-volume
  assumptions out of the document.
