from playwright.sync_api import sync_playwright

results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # ====== TEST 1: Homepage content ======
    print("=== TEST 1: Homepage ===")
    page.goto("https://8d-reports.vercel.app", timeout=30000, wait_until="networkidle")
    page.wait_for_timeout(3000)
    
    html = page.content()
    results["new3_coming_soon"] = "coming soon" in html.lower()
    results["new1_yearly_btn"] = "79 / year" in html or "79/year" in html.lower()
    results["new1_monthly_btn"] = "9.99 / month" in html or "9.99/month" in html
    
    fb_btn = page.locator('button:has-text("Feedback")')
    results["p0_7_feedback_btn"] = fb_btn.count() > 0

    has_lang_switcher = "中文" in html or page.locator('button:has-text("中文")').count() > 0
    results["new4_lang_switcher"] = has_lang_switcher
    
    has_signin_btn = page.locator('a:has-text("Sign in")').count() > 0
    results["p0_1_2_signin_button"] = has_signin_btn

    pricing_section = page.locator('section:has-text("$9.99")')
    results["pricing_visible"] = pricing_section.count() > 0

    print(f"new3 coming_soon: {results['new3_coming_soon']}")
    print(f"new1 yearly_btn: {results['new1_yearly_btn']}")
    print(f"new1 monthly_btn: {results['new1_monthly_btn']}")
    print(f"p0_7 feedback_btn: {results['p0_7_feedback_btn']}")
    print(f"new4 lang_switcher: {results['new4_lang_switcher']}")
    print(f"p0_1_2 signin_button: {results['p0_1_2_signin_button']}")

    # ====== TEST 2: Login page ======
    print("\n=== TEST 2: Login page ===")
    page.goto("https://8d-reports.vercel.app/login", timeout=30000, wait_until="networkidle")
    page.wait_for_timeout(3000)
    login_html = page.content()
    results["p0_5_login_form"] = page.locator('input[type="email"]').count() > 0
    results["p0_5_signin_text"] = page.locator('button:has-text("Sign in")').count() > 0
    print(f"p0_5 login_form: {results['p0_5_login_form']}")
    print(f"p0_5 signin_text: {results['p0_5_signin_text']}")

    # ====== TEST 3: Signup page ======
    print("\n=== TEST 3: Signup page ===")
    page.goto("https://8d-reports.vercel.app/signup", timeout=30000, wait_until="networkidle")
    page.wait_for_timeout(3000)
    signup_html = page.content()
    results["new5_signup_form"] = "Create an account" in signup_html
    print(f"new5 signup_form: {results['new5_signup_form']}")

    # ====== TEST 4: Login and check dashboard ======
    print("\n=== TEST 4: Dashboard (authenticated) ===")
    page.goto("https://8d-reports.vercel.app/login", timeout=30000, wait_until="networkidle")
    page.wait_for_timeout(2000)
    
    email_input = page.locator('input[type="email"]')
    password_input = page.locator('input[type="password"]')
    if email_input.count() > 0:
        email_input.fill("secure@8dreports.com")
        password_input.fill("Secure#Pass1")
        signin_btn = page.locator('button:has-text("Sign in")')
        if signin_btn.count() > 0:
            signin_btn.click()
            page.wait_for_timeout(5000)
    
    dashboard_html = page.content()
    results["p0_6_quota_badge"] = "Free" in dashboard_html
    results["p0_1_2_dashboard_loaded"] = "My Reports" in dashboard_html
    print(f"p0_6 quota_badge: {results['p0_6_quota_badge']}")
    print(f"p0_1_2 dashboard_loaded: {results['p0_1_2_dashboard_loaded']}")

    # ====== TEST 5: Navigate to report, check share + export ======
    print("\n=== TEST 5: Report detail page ===")
    report_links = page.locator('a[href*="/reports/"]')
    if report_links.count() > 0:
        report_links.first.click()
        page.wait_for_timeout(3000)
        report_html = page.content()
        share_btn = page.locator('button:has-text("Share")')
        results["p0_4_share_button"] = share_btn.count() > 0
        if share_btn.count() > 0:
            share_btn.click()
            page.wait_for_timeout(2000)
            dialog_html = page.content()
            results["p0_4_share_dialog_has_edit_option"] = "Can edit" in dialog_html or "View only" in dialog_html
            # Close dialog
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
        
        export_btn = page.locator('button:has-text("Export"), button:has-text("导出")')
        results["p1_6_7_export_button"] = export_btn.count() > 0
    else:
        results["p0_4_share_button"] = False
        results["p0_4_share_dialog_has_edit_option"] = "no reports"
        results["p1_6_7_export_button"] = "no reports"
    print(f"p0_4 share_button: {results['p0_4_share_button']}")
    print(f"p0_4 share_dialog_edit: {results['p0_4_share_dialog_has_edit_option']}")
    print(f"p1_6_7 export_button: {results['p1_6_7_export_button']}")

    # ====== TEST 6: Language switching + LLM chat ======
    print("\n=== TEST 6: LLM Chat language ===")
    page.goto("https://8d-reports.vercel.app/dashboard", timeout=30000, wait_until="networkidle")
    page.wait_for_timeout(2000)
    quality_btn = page.locator('button:has-text("Quality"), button:has-text("质量")')
    if quality_btn.count() > 0:
        quality_btn.click()
        page.wait_for_timeout(2500)
        results["p0_3_chat_opens"] = page.locator('textarea, input[type="text"]').count() > 0
    else:
        results["p0_3_chat_opens"] = "no quality button"
    print(f"p0_3 chat_opens: {results['p0_3_chat_opens']}")

    browser.close()

# Print summary
print("\n\n" + "=" * 70)
print("BUG VERIFICATION REPORT")
print("=" * 70)

tests = [
    ("P0 #1-2 Sign-in btn", results.get("p0_1_2_signin_button"), "Sign in button visible on homepage"),
    ("P0 #1-2 Dashboard", results.get("p0_1_2_dashboard_loaded"), "Dashboard loads after login"),
    ("P0 #3 Chat opens", results.get("p0_3_chat_opens"), "LLM chat dialog opens"),
    ("P0 #4 Share edit", results.get("p0_4_share_dialog_has_edit_option"), "Edit/View toggle in share dialog"),
    ("P0 #5 Login form", results.get("p0_5_login_form"), "Login page has email+password fields"),
    ("P0 #6 Quota badge", results.get("p0_6_quota_badge"), "Quota 'Free' badge visible in dashboard"),
    ("P0 #7 Feedback btn", results.get("p0_7_feedback_btn"), "Feedback button on homepage"),
    ("new #1 Month btn", results.get("new1_monthly_btn"), "$9.99/month payment button"),
    ("new #1 Year btn", results.get("new1_yearly_btn"), "$79/year payment button"),
    ("new #3 Coming soon", results.get("new3_coming_soon"), "Coming soon labels on features"),
    ("new #4 Lang switch", results.get("new4_lang_switcher"), "Language switcher on homepage"),
    ("new #5 Signup form", results.get("new5_signup_form"), "Signup page shows create account form"),
    ("P1 #6-7 Export btn", results.get("p1_6_7_export_button"), "Export button on report page"),
]

passed = 0
failed = 0
skipped = 0
for name, result, detail in tests:
    if result is True:
        status = "[PASS]"
        passed += 1
    elif result is False:
        status = "[FAIL]"
        failed += 1
    else:
        status = "[SKIP]"
        skipped += 1
    print(f"  {status} {name:<25} | {detail}")

print(f"\nPassed: {passed} | Failed: {failed} | Skipped: {skipped}")
print("=" * 70)
