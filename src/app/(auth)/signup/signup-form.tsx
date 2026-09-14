"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { trackEvent } from "@/lib/analytics"

type PreviewDebug = {
  commitSha: string
}

type SignupOtpDebug = {
  route?: string
  routeVersion?: string
  providerMessageId?: string | null
  emailDomain?: string
  hasResendApiKey?: boolean
  hasEmailFrom?: boolean
  vercelEnv?: string
}

type SignupVerificationResponse = {
  success?: boolean
  error?: string
  debug?: SignupOtpDebug
}

export default function SignupPage({ previewDebug }: { previewDebug?: PreviewDebug }) {
  const t = useTranslations("auth")
  const locale = useLocale()
  // Keep signup <-> login links in the language of the current URL.
  const zhPrefix = locale === "zh-CN" ? "/zh" : ""
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl")
  const callbackUrl = rawCallback && rawCallback.startsWith("/") ? rawCallback : "/dashboard"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [step, setStep] = useState<"signup" | "otp">("signup")
  const [otp, setOtp] = useState("")
  const [otpDebug, setOtpDebug] = useState<SignupOtpDebug | null>(null)

  useEffect(() => {
    trackEvent("signup_started", {
      source: searchParams.get("source") || "direct",
      intent: searchParams.get("intent") || "account",
    })
  }, [searchParams])

  async function requestVerificationCode() {
    const response = await fetch("/api/auth-email/signup-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await response.json().catch(() => null) as SignupVerificationResponse | null

    if (!response.ok) {
      throw new Error(data?.error || t("verificationSendFailed"))
    }
    setOtpDebug(data?.debug || null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"))
      return
    }
    if (password.length < 8) {
      setError(t("passwordLength"))
      return
    }

    setLoading(true)
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      })
      if (result.error) {
        setError(result.error.message || t("registrationFailed"))
        setLoading(false)
        return
      }
      // Land on the verification step before sending so a failed send still
      // reaches the OTP screen, where "Resend code" is available.
      setStep("otp")
      try {
        await requestVerificationCode()
      } catch (error) {
        setError(error instanceof Error ? error.message : t("verificationSendFailedHint"))
      }
      // Account created. GA4 sign_up fires after verification in handleVerifyOtp.
      trackEvent("signup_success", { method: "email" })
      setLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : t("unexpectedError"))
      setLoading(false)
    }
  }

  async function handleResendCode() {
    setError("")
    setLoading(true)
    try {
      await requestVerificationCode()
    } catch (error) {
      setError(error instanceof Error ? error.message : t("resendFailed"))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      })
      if (result.error) {
        setError(result.error.message || t("invalidCode"))
        setLoading(false)
        return
      }
      fetch("/api/notify/welcome", { method: "POST" }).catch(() => {})
      trackEvent("signup_completed", { method: "email" })
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError(t("unexpectedError"))
      setLoading(false)
    }
  }

  if (step === "otp") {
    return (
      <Card className="shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">{t("verifyEmail")}</CardTitle>
          <CardDescription className="text-sm">
            {t("verificationSent", { email })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="otp">{t("verificationCode")}</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder={t("codePlaceholder")}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("verificationHint")}
              </p>
            </div>
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || otp.length < 6} className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700">
              {loading ? t("verifying") : t("verifyContinue")}
            </Button>
            <button
              type="button"
              onClick={() => setStep("signup")}
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t("backToSignUp")}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="text-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {loading ? t("sending") : t("resendCode")}
            </button>
            {otpDebug && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground/80">{t("signupEmailDebug")}</p>
                <dl className="mt-1 grid gap-1">
                  {Object.entries(otpDebug).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <dt>{key}</dt>
                      <dd className="font-mono">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {previewDebug && (
              <p className="text-center text-xs text-muted-foreground">
                {t("previewBuild")} <span className="font-mono">{previewDebug.commitSha}</span>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">{t("createAccount")}</CardTitle>
        <CardDescription className="text-sm">{t("getStarted")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" placeholder={t("namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} required className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" placeholder={t("emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" placeholder={t("passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input id="confirmPassword" type="password" placeholder={t("confirmPlaceholder")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-9" />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700">
            {loading ? t("creating") : t("createBtn")}
          </Button>
          {previewDebug && (
            <p className="text-center text-xs text-muted-foreground">
              {t("previewBuild")} <span className="font-mono">{previewDebug.commitSha}</span>
            </p>
          )}
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          {t("hasAccount")} <Link href={`${zhPrefix}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-indigo-600 hover:text-indigo-700">{t("signInBtn")}</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
