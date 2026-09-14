import { Suspense } from "react"
import SignupPage from "../../signup/signup-form"
import { getEmailDebugConfig, isEmailDebugAvailable } from "@/lib/email-debug"

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
