import { Suspense } from "react"
import LoginPage from "../../login/login-form"

// Chinese URL for the same login form. The (auth) layout provides the language
// switcher and the noindex robots directive.
export default function ZhLoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
      <LoginPage />
    </Suspense>
  )
}
