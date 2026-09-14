"use client"

import { useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

type PasswordResetDebug = {
  route?: string
  providerMessageId?: string | null
  emailDomain?: string
  hasResendApiKey?: boolean
  hasEmailFrom?: boolean
  vercelEnv?: string
}

// Shared by /reset-password (English) and /zh/reset-password (Chinese). The
// active language comes from the URL through LocaleProvider, so the same
// component renders either catalog without any locale prop.
export function ResetPasswordForm() {
  const t = useTranslations("auth")
  const locale = useLocale()
  // Keep the sign-in links in the language of the current URL.
  const zhPrefix = locale === "zh-CN" ? "/zh" : ""
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"request" | "reset" | "done">("request")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [debug, setDebug] = useState<PasswordResetDebug | null>(null)

  function validateNewPassword() {
    if (password !== confirmPassword) return t("passwordMismatch")
    if (password.length < 8) return t("passwordLength")
    if (!/[A-Z]/.test(password)) return t("passwordUppercase")
    if (!/[a-z]/.test(password)) return t("passwordLowercase")
    if (!/[0-9]/.test(password)) return t("passwordDigit")
    if (!/[^A-Za-z0-9]/.test(password)) return t("passwordSpecial")
    return null
  }

  const handleRequestCode = async () => {
    if (!email) return
    setLoading(true)
    setDebug(null)
    try {
      const response = await fetch("/api/auth-email/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || t("resetCodeSendFailed"))
      }
      if (data.debug) setDebug(data.debug)
      setStep("reset")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("resetCodeSendError"))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email || otp.length < 6) return
    const passwordError = validateNewPassword()
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/email-otp/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || t("resetFailed"))
      }
      setStep("done")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("resetPasswordError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold tracking-tight">
          {t("resetPasswordTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === "done" ? (
          <div className="space-y-4 text-center py-4">
            <div className="text-sm text-muted-foreground">
              {t("resetSuccess")}
            </div>
            <Link href={`${zhPrefix}/login`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="size-4" />
                {t("backToSignIn")}
              </Button>
            </Link>
          </div>
        ) : step === "reset" ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {t("resetCodeSent")}
            </div>
            {debug && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500">
                <div>{t("resetEmailDebug")}</div>
                <div>route: {debug.route || "unknown"}</div>
                <div>emailDomain: {debug.emailDomain || "unknown"}</div>
                <div>hasResendApiKey: {String(Boolean(debug.hasResendApiKey))}</div>
                <div>hasEmailFrom: {String(Boolean(debug.hasEmailFrom))}</div>
                <div>providerMessageId: {debug.providerMessageId || "none"}</div>
                <div>vercelEnv: {debug.vercelEnv || "local"}</div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="otp">{t("resetCode")}</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder={t("codePlaceholder")}
                className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("newPassword")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPlaceholder")}
                className="h-9"
              />
            </div>
            <Button
              className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleResetPassword}
              disabled={loading || otp.length < 6}
            >
              {loading ? t("updating") : t("updatePassword")}
            </Button>
            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full text-center text-sm text-muted-foreground hover:text-indigo-600"
            >
              {t("differentEmail")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="h-9"
              />
            </div>
            <Button
              className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleRequestCode}
              disabled={loading}
            >
              {loading ? t("sending") : t("sendResetCode")}
            </Button>
            <div className="text-center">
              <Link href={`${zhPrefix}/login`} className="text-sm text-muted-foreground hover:text-indigo-600">
                <ArrowLeft className="inline size-3.5" />
                {" "}{t("backToSignIn")}
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
