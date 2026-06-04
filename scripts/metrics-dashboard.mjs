import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "metrics-dashboard.html");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(projectRoot, ".env"));
loadEnvFile(path.join(projectRoot, ".env.local"));

function html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function percent(numerator, denominator) {
  if (!denominator) return "0%";
  return `${Math.round((Number(numerator) / Number(denominator)) * 100)}%`;
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function openFile(filePath) {
  try {
    execFileSync("open", [filePath], { stdio: "ignore" });
  } catch {
    // Opening the file is a convenience. The report is still generated.
  }
}

async function queryMetrics() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to .env or .env.local.");
  }

  const sql = neon(process.env.DATABASE_URL);
  const [row] = await sql`
    WITH windows AS (
      SELECT
        now() - interval '1 day' AS since_1d,
        now() - interval '7 days' AS since_7d,
        now() - interval '30 days' AS since_30d
    ),
    test_users AS (
      SELECT id
      FROM users
      WHERE email ILIKE '%test%'
         OR email ILIKE '%@8d-reports.com'
         OR email ILIKE '%@8dreports.com'
         OR email IN ('466415716@qq.com', '19857345237@163.com')
    ),
    event_counts AS (
      SELECT
        event_name,
        count(*) FILTER (WHERE created_at >= (SELECT since_1d FROM windows))::int AS last_1d,
        count(*) FILTER (WHERE created_at >= (SELECT since_7d FROM windows))::int AS last_7d,
        count(*) FILTER (WHERE created_at >= (SELECT since_30d FROM windows))::int AS last_30d,
        count(DISTINCT user_id) FILTER (WHERE created_at >= (SELECT since_30d FROM windows) AND user_id IS NOT NULL)::int AS users_30d,
        count(*) FILTER (
          WHERE created_at >= (SELECT since_7d FROM windows)
            AND (user_id IS NULL OR user_id NOT IN (SELECT id FROM test_users))
        )::int AS market_7d,
        count(*) FILTER (
          WHERE created_at >= (SELECT since_30d FROM windows)
            AND (user_id IS NULL OR user_id NOT IN (SELECT id FROM test_users))
        )::int AS market_30d
      FROM analytics_events
      GROUP BY event_name
    ),
    user_counts AS (
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE created_at >= (SELECT since_1d FROM windows))::int AS last_1d,
        count(*) FILTER (WHERE created_at >= (SELECT since_7d FROM windows))::int AS last_7d,
        count(*) FILTER (WHERE created_at >= (SELECT since_30d FROM windows))::int AS last_30d,
        count(*) FILTER (
          WHERE created_at >= (SELECT since_7d FROM windows)
            AND id NOT IN (SELECT id FROM test_users)
        )::int AS market_7d,
        count(*) FILTER (
          WHERE created_at >= (SELECT since_30d FROM windows)
            AND id NOT IN (SELECT id FROM test_users)
        )::int AS market_30d
      FROM users
    ),
    report_counts AS (
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE created_at >= (SELECT since_30d FROM windows))::int AS last_30d,
        count(DISTINCT user_id) FILTER (WHERE created_at >= (SELECT since_30d FROM windows))::int AS creators_30d,
        count(*) FILTER (WHERE status = 'completed' AND updated_at >= (SELECT since_30d FROM windows))::int AS completed_30d,
        count(*) FILTER (
          WHERE created_at >= (SELECT since_30d FROM windows)
            AND user_id NOT IN (SELECT id FROM test_users)
        )::int AS market_30d,
        count(DISTINCT user_id) FILTER (
          WHERE created_at >= (SELECT since_30d FROM windows)
            AND user_id NOT IN (SELECT id FROM test_users)
        )::int AS market_creators_30d,
        count(*) FILTER (
          WHERE status = 'completed'
            AND updated_at >= (SELECT since_30d FROM windows)
            AND user_id NOT IN (SELECT id FROM test_users)
        )::int AS market_completed_30d
      FROM reports
    ),
    attachment_counts AS (
      SELECT
        count(*) FILTER (WHERE a.created_at >= (SELECT since_30d FROM windows))::int AS last_30d,
        count(*) FILTER (
          WHERE a.created_at >= (SELECT since_30d FROM windows)
            AND r.user_id NOT IN (SELECT id FROM test_users)
        )::int AS market_30d
      FROM attachments a
      INNER JOIN reports r ON r.id = a.report_id
    ),
    sub_counts AS (
      SELECT
        count(*) FILTER (WHERE s.status IN ('active', 'trialing', 'paid'))::int AS active,
        count(*) FILTER (WHERE s.created_at >= (SELECT since_30d FROM windows))::int AS new_30d,
        count(*) FILTER (
          WHERE s.status IN ('active', 'trialing', 'paid')
            AND s.user_id NOT IN (SELECT id FROM test_users)
        )::int AS market_active
      FROM subscriptions s
    ),
    daily AS (
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        event_name,
        count(*)::int AS count
      FROM analytics_events
      WHERE created_at >= now() - interval '14 days'
        AND (user_id IS NULL OR user_id NOT IN (SELECT id FROM test_users))
      GROUP BY 1, 2
    ),
    top_paths AS (
      SELECT coalesce(path, '(none)') AS path, count(*)::int AS count
      FROM analytics_events
      WHERE created_at >= (SELECT since_30d FROM windows)
        AND (user_id IS NULL OR user_id NOT IN (SELECT id FROM test_users))
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 12
    ),
    recent_events AS (
      SELECT event_name, coalesce(path, '') AS path, created_at
      FROM analytics_events
      WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM test_users)
      ORDER BY created_at DESC
      LIMIT 20
    )
    SELECT json_build_object(
      'generatedAt', now(),
      'users', (SELECT row_to_json(user_counts) FROM user_counts),
      'reports', (SELECT row_to_json(report_counts) FROM report_counts),
      'attachments', (SELECT row_to_json(attachment_counts) FROM attachment_counts),
      'subscriptions', (SELECT row_to_json(sub_counts) FROM sub_counts),
      'events', (SELECT coalesce(json_agg(event_counts ORDER BY last_30d DESC, event_name), '[]'::json) FROM event_counts),
      'daily', (SELECT coalesce(json_agg(daily ORDER BY day, event_name), '[]'::json) FROM daily),
      'topPaths', (SELECT coalesce(json_agg(top_paths), '[]'::json) FROM top_paths),
      'recentEvents', (SELECT coalesce(json_agg(recent_events), '[]'::json) FROM recent_events)
    ) AS data;
  `;

  const validationFeedback = await sql`
    SELECT id, text, email, created_at
    FROM feedback
    WHERE text LIKE '[team-workflow-validation]%'
    ORDER BY created_at DESC
    LIMIT 100
  `;

  return { ...row.data, validationFeedback };
}

function eventCount(metrics, eventName, key = "last_30d") {
  return metrics.events.find((event) => event.event_name === eventName)?.[key] || 0;
}

function buildHtml(metrics) {
  const registrations = metrics.users.market_30d;
  const creators = metrics.reports.market_creators_30d;
  const exportsSucceeded = eventCount(metrics, "export_succeeded", "market_30d");
  const upgradeClicks = eventCount(metrics, "upgrade_clicked", "market_30d");
  const checkoutStarted = eventCount(metrics, "checkout_started", "market_30d");
  const checkoutCompleted = eventCount(metrics, "checkout_completed", "market_30d");
  const reportCreated = metrics.reports.market_30d;
  const attachmentUploaded = metrics.attachments.market_30d;
  const completedReports = metrics.reports.market_completed_30d;
  const demoViews = eventCount(metrics, "demo_report_viewed", "market_30d");
  const feedbackRows = metrics.validationFeedback.map((item) => {
    const fields = Object.fromEntries(
      item.text.split("\n").slice(1).map((line) => {
        const index = line.indexOf(":");
        return index === -1 ? [line, ""] : [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
    );
    return { ...item, fields };
  });
  const countByField = (field) => Object.entries(feedbackRows.reduce((counts, row) => {
    const value = row.fields[field] || "Not provided";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]);

  const cards = [
    ["Market signups", registrations, "30d, test accounts excluded"],
    ["Market report creators", creators, "30d, goal: 15"],
    ["Market reports created", reportCreated, "30d, test accounts excluded"],
    ["Market exports", exportsSucceeded, "30d, goal: 8"],
    ["Demo views", demoViews, "30d Team workflow demos"],
    ["Demo feedback", feedbackRows.length, `${percent(feedbackRows.length, demoViews)} of demo views`],
    ["Upgrade clicks", upgradeClicks, "30d market intent"],
    ["Checkout started", checkoutStarted, "30d market intent"],
    ["Checkout completed", checkoutCompleted, "30d market purchases"],
    ["Active paid users", metrics.subscriptions.market_active, "Test accounts excluded"],
    ["Reports completed", completedReports, "30d market reports"],
    ["Attachments uploaded", attachmentUploaded, "30d market evidence"],
  ];

  const gates = [
    ["quota_limit_seen", "Quota limit seen"],
    ["word_export_gate_clicked", "Word export gate"],
    ["logo_upload_gate_clicked", "Logo upload gate"],
    ["deep_search_gate_clicked", "Deep search gate"],
    ["ai_draft_interest_clicked", "AI draft interest"],
    ["watermark_exported", "Watermarked PDF"],
  ];

  const dailyByDay = new Map();
  for (const item of metrics.daily) {
    if (!dailyByDay.has(item.day)) dailyByDay.set(item.day, {});
    dailyByDay.get(item.day)[item.event_name] = item.count;
  }
  const dailyRows = [...dailyByDay.entries()].slice(-14);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>8D Reports Metrics</title>
  <style>
    :root { color-scheme: light; --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc; --brand:#4f46e5; --good:#059669; --warn:#b45309; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--bg); }
    main { width: min(1180px, calc(100% - 32px)); margin: 32px auto 56px; }
    header { display:flex; align-items:flex-end; justify-content:space-between; gap: 16px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 42px); letter-spacing: -0.02em; }
    h2 { margin: 0 0 14px; font-size: 18px; }
    p { margin: 0; color: var(--muted); line-height: 1.6; }
    .pill { display:inline-flex; align-items:center; border:1px solid var(--line); background:white; border-radius:999px; padding: 7px 11px; color: var(--muted); font-size: 13px; white-space: nowrap; }
    .grid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .card, section { background:white; border:1px solid var(--line); border-radius:10px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
    .card { padding: 16px; min-height: 118px; }
    .label { color: var(--muted); font-size: 13px; }
    .value { margin-top: 10px; font: 700 34px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: -.04em; }
    .note { margin-top: 8px; color: var(--muted); font-size: 12px; }
    section { margin-top: 16px; padding: 18px; }
    .funnel { display:grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; align-items: stretch; }
    .step { border:1px solid var(--line); border-radius:10px; padding:14px; background:#fbfdff; position:relative; }
    .step:not(:last-child)::after { content:""; position:absolute; right:-8px; top:50%; width: 14px; height: 1px; background: var(--line); }
    table { width:100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom:1px solid var(--line); text-align:left; vertical-align: top; }
    th { color: var(--muted); font-weight:600; }
    .columns { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
    .bar { height:8px; background:#eef2ff; border-radius:999px; overflow:hidden; margin-top:10px; }
    .bar span { display:block; height:100%; background:var(--brand); border-radius:999px; }
    .ok { color: var(--good); }
    .warn { color:var(--warn); }
    .quote { white-space:pre-wrap; max-width:680px; line-height:1.55; }
    @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .columns, .funnel { grid-template-columns:1fr; } header { align-items:flex-start; flex-direction:column; } }
    @media (max-width: 560px) { main { width:min(100% - 20px, 1180px); margin-top:20px; } .grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>8D Reports Metrics</h1>
        <p>Market validation dashboard. Test accounts are excluded from the primary metrics.</p>
      </div>
      <div class="pill">Generated ${html(new Date(metrics.generatedAt).toLocaleString())}</div>
    </header>

    <div class="grid">
      ${cards
        .map(
          ([label, value, note]) => `<article class="card">
        <div class="label">${html(label)}</div>
        <div class="value">${number(value)}</div>
        <div class="note">${html(note)}</div>
      </article>`
        )
        .join("")}
    </div>

    <section>
      <h2>30-Day Market Funnel</h2>
      <div class="funnel">
        <div class="step"><div class="label">Signups</div><div class="value">${number(registrations)}</div><div class="note">Target 30</div></div>
        <div class="step"><div class="label">Created report</div><div class="value">${number(creators)}</div><div class="note">${percent(creators, registrations)} of signups</div></div>
        <div class="step"><div class="label">Exported</div><div class="value">${number(exportsSucceeded)}</div><div class="note">${percent(exportsSucceeded, creators)} of creators</div></div>
        <div class="step"><div class="label">Upgrade clicked</div><div class="value">${number(upgradeClicks)}</div><div class="note">${percent(upgradeClicks, exportsSucceeded)} vs exports</div></div>
        <div class="step"><div class="label">Paid</div><div class="value">${number(checkoutCompleted)}</div><div class="note">${percent(checkoutCompleted, checkoutStarted)} checkout completion</div></div>
      </div>
    </section>

    <section>
      <h2>Team Workflow Validation</h2>
      <div class="funnel">
        <div class="step"><div class="label">Demo views</div><div class="value">${number(demoViews)}</div><div class="note">Target quality-team visits</div></div>
        <div class="step"><div class="label">Feedback responses</div><div class="value">${number(feedbackRows.length)}</div><div class="note">${percent(feedbackRows.length, demoViews)} response rate</div></div>
        <div class="step"><div class="label">Work emails</div><div class="value">${number(feedbackRows.filter((row) => row.email).length)}</div><div class="note">Requested follow-up</div></div>
        <div class="step"><div class="label">Team checkout starts</div><div class="value">${number(checkoutStarted)}</div><div class="note">All market checkout starts</div></div>
        <div class="step"><div class="label">Evidence gate</div><div class="value">${number(Math.min(10, feedbackRows.length))}/10</div><div class="note">10 interviews or 1 qualified request</div></div>
      </div>
    </section>

    <section>
      <h2>Market Signal vs Internal Validation Activity</h2>
      <p>Primary metrics exclude owner, QA, security, plan, and role-test accounts. Anonymous visits remain market signals unless they later identify as an internal account.</p>
      <table>
        <thead><tr><th>Metric</th><th>Market 30d</th><th>All activity 30d</th></tr></thead>
        <tbody>
          <tr><td>Signups</td><td>${number(metrics.users.market_30d)}</td><td>${number(metrics.users.last_30d)}</td></tr>
          <tr><td>Reports created</td><td>${number(metrics.reports.market_30d)}</td><td>${number(metrics.reports.last_30d)}</td></tr>
          <tr><td>Report creators</td><td>${number(metrics.reports.market_creators_30d)}</td><td>${number(metrics.reports.creators_30d)}</td></tr>
          <tr><td>Successful exports</td><td>${number(exportsSucceeded)}</td><td>${number(eventCount(metrics, "export_succeeded"))}</td></tr>
          <tr><td>Checkout starts</td><td>${number(checkoutStarted)}</td><td>${number(eventCount(metrics, "checkout_started"))}</td></tr>
          <tr><td>Active subscriptions</td><td>${number(metrics.subscriptions.market_active)}</td><td>${number(metrics.subscriptions.active)}</td></tr>
        </tbody>
      </table>
    </section>

    <div class="columns">
      <section>
        <h2>Most Valuable Capabilities</h2>
        <table>
          <thead><tr><th>Capability</th><th>Responses</th></tr></thead>
          <tbody>${countByField("Most valuable").map(([value, count]) => `<tr><td>${html(value)}</td><td>${number(count)}</td></tr>`).join("") || `<tr><td colspan="2" class="warn">No market feedback yet</td></tr>`}</tbody>
        </table>
      </section>
      <section>
        <h2>Respondent Roles</h2>
        <table>
          <thead><tr><th>Role</th><th>Responses</th></tr></thead>
          <tbody>${countByField("Role").map(([value, count]) => `<tr><td>${html(value)}</td><td>${number(count)}</td></tr>`).join("") || `<tr><td colspan="2" class="warn">No market feedback yet</td></tr>`}</tbody>
        </table>
      </section>
    </div>

    <section>
      <h2>Latest Team Workflow Feedback</h2>
      <table>
        <thead><tr><th>Time</th><th>Demo / Role</th><th>Current process</th><th>Main concern</th><th>Follow-up</th></tr></thead>
        <tbody>
          ${feedbackRows.map((row) => `<tr>
            <td>${html(new Date(row.created_at).toLocaleString())}</td>
            <td>${html(row.fields.Demo)}<br>${html(row.fields.Role)}</td>
            <td>${html(row.fields["Current tool"])}</td>
            <td class="quote">${html(row.fields["Main concern"])}</td>
            <td>${row.email ? html(row.email) : "No email"}</td>
          </tr>`).join("") || `<tr><td colspan="5" class="warn">No Team workflow validation responses yet. Publish one honest discussion and send visitors to a workflow demo.</td></tr>`}
        </tbody>
      </table>
    </section>

    <div class="columns">
      <section>
        <h2>Pro Gates</h2>
        <table>
          <thead><tr><th>Gate</th><th>30d</th><th>7d</th></tr></thead>
          <tbody>
            ${gates
              .map(([eventName, label]) => {
                const event = metrics.events.find((item) => item.event_name === eventName) || {};
                return `<tr><td>${html(label)}</td><td>${number(event.market_30d)}</td><td>${number(event.market_7d)}</td></tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Top Event Paths</h2>
        <table>
          <thead><tr><th>Path</th><th>Events</th></tr></thead>
          <tbody>
            ${metrics.topPaths
              .map((item) => `<tr><td>${html(item.path)}</td><td>${number(item.count)}</td></tr>`)
              .join("")}
          </tbody>
        </table>
      </section>
    </div>

    <section>
      <h2>Last 14 Days</h2>
      <table>
        <thead><tr><th>Date</th><th>Signups</th><th>Created</th><th>Saved</th><th>Exports</th><th>Upgrade</th><th>Checkout</th></tr></thead>
        <tbody>
          ${dailyRows
            .map(([day, events]) => `<tr>
              <td>${html(day)}</td>
              <td>${number(events.signup_success)}</td>
              <td>${number(events.report_created)}</td>
              <td>${number(events.report_saved)}</td>
              <td>${number(events.export_succeeded)}</td>
              <td>${number(events.upgrade_clicked)}</td>
              <td>${number(events.checkout_completed)}</td>
            </tr>`)
            .join("")}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Recent Events</h2>
      <table>
        <thead><tr><th>Time</th><th>Event</th><th>Path</th></tr></thead>
        <tbody>
          ${metrics.recentEvents
            .map(
              (item) => `<tr>
                <td>${html(new Date(item.created_at).toLocaleString())}</td>
                <td>${html(item.event_name)}</td>
                <td>${html(item.path)}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}

try {
  const metrics = await queryMetrics();
  fs.writeFileSync(outputPath, buildHtml(metrics));
  console.log(`Metrics dashboard generated: ${outputPath}`);
  openFile(outputPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
