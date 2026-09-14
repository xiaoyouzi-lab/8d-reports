import type { Metadata } from "next"
import { Suspense } from "react"
import LoginPage from "../../login/login-form"

// Chinese title/description for the URL-driven zh locale. The (auth) layout
// still supplies the noindex robots directive; these private pages are not a
// canonical/hreflang pair.
export const metadata: Metadata = {
  title: "登录",
  description: "登录你的 8D Reports 账号，继续编辑、评审和导出结构化的 D0-D8 报告。",
}

// Chinese URL for the same login form. The (auth) layout provides the language
// switcher and the noindex robots directive.
export default function ZhLoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
      <LoginPage />
    </Suspense>
  )
}
