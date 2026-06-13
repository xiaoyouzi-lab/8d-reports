# Product Decisions

## AI Quality Check Must Be Conservative

AI Quality Check should identify gaps, weak reasoning, missing evidence, and possible customer rejection risks. It must not invent facts, approvals, measurements, test results, standards compliance, or evidence. If evidence is missing, use "No relevant data" or equivalent wording.

## The Product Is Broader Than Only 8D Editing

8D editing is the core workflow, but the product direction includes complaint handling, corrective action management, supplier collaboration, report review, historical search, approval/locking, and export-ready quality records.

## Do Not Silently Change Core Infrastructure

Auth, payment, database schema, environment variables, export logic, and production configuration are high-risk areas. Change them only when explicitly required, and call out the risk in the completion report.

## SEO Pages Are Part Of The Product Strategy

SEO pages, examples, templates, demo reports, and educational pages are not disposable marketing extras. They are part of acquisition, validation, and customer education. Preserve routes and page intent unless a task explicitly changes them.

## Maintainability Matters For A Solo Developer

The codebase should remain understandable and maintainable by a solo developer. Prefer small, reviewable changes; reuse existing helpers and patterns; avoid unnecessary abstractions; and keep documentation close to the product behavior.
