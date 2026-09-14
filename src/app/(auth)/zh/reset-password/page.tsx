import type { Metadata } from "next"
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form"

// Chinese title/description for the URL-driven zh locale. The (auth) layout
// still supplies the noindex robots directive; these private pages are not a
// canonical/hreflang pair.
export const metadata: Metadata = {
  title: "重置密码",
  description: "通过邮箱验证码为你的 8D Reports 账号设置新密码。",
}

// Chinese URL for the same reset form. The (auth) layout provides the language
// switcher, the centered card shell, and the noindex robots directive.
export default function ZhResetPasswordPage() {
  return <ResetPasswordForm />
}
