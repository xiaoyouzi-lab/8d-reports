import type { Metadata } from "next"
import { Suspense } from "react"
import SignupPage from "../../signup/signup-form"
import { getEmailDebugConfig, isEmailDebugAvailable } from "@/lib/email-debug"

// Chinese title/description for the URL-driven zh locale. The (auth) layout
// still supplies the noindex robots directive; these private pages are not a
// canonical/hreflang pair.
export const metadata: Metadata = {
  title: "创建账号",
  description: "免费创建 8D Reports 账号，包含 3 份终身报告，无需信用卡。",
}

// Chinese URL for the same signup form; preview debug stays identical.
export default function ZhSignupPage() {
  const previewDebug = isEmailDebugAvailable()
    ? { commitSha: getEmailDebugConfig().commitSha }
    : undefined

  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
      <SignupPage previewDebug={previewDebug} />
    </Suspense>
  )
}
