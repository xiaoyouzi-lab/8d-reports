"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Eye, EyeOff } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { trackEvent } from "@/lib/analytics"

export default function LoginPage() {
  const t = useTranslations("auth")
  const locale = useLocale()
  // Keep login <-> signup <-> reset links in the language of the current URL.
  const zhPrefix = locale === "zh-CN" ? "/zh" : ""
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl")
  const billing = searchParams.get("billing")
  const plan = searchParams.get("plan")
  const legacyPlanCallback =
    plan === "pro" && billing === "monthly"
      ? "/pricing?checkout=pro_monthly"
      : plan === "team" && billing === "monthly"
        ? "/pricing?checkout=team_monthly"
      : null
  const callbackUrl = rawCallback && rawCallback.startsWith("/")
    ? rawCallback
    : legacyPlanCallback ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message || t("invalidCredentials"))
        setLoading(false)
        return
      }
      trackEvent("login_success", { method: "email" })
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError(t("unexpectedErrorRetry"))
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          {t("welcomeBack")}
        </CardTitle>
        <CardDescription className="text-sm">
          {t("signInDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordMask")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <div className="flex justify-end">
              <Link
                href={`${zhPrefix}/reset-password`}
                className="text-xs text-muted-foreground hover:text-indigo-600"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {loading ? t("signingIn") : t("signInBtn")}
          </Button>
        </form>

      </CardContent>
      <CardFooter className="justify-center border-t bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href={`${zhPrefix}/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t("signUp")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
