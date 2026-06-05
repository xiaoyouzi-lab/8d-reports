"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { trackEvent } from "@/lib/analytics"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl")
  const callbackUrl = rawCallback && rawCallback.startsWith("/") ? rawCallback : "/dashboard"
  const oauthError = searchParams.get("error")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [step, setStep] = useState<"signup" | "otp">("signup")
  const [otp, setOtp] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
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
        setError(result.error.message || "Registration failed")
        setLoading(false)
        return
      }
      trackEvent("signup_success", { method: "email" })
      setStep("otp")
      setLoading(false)
    } catch {
      setError("An unexpected error occurred")
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
        setError(result.error.message || "Invalid verification code")
        setLoading(false)
        return
      }
      fetch("/api/notify/welcome", { method: "POST" }).catch(() => {})
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setError("")
    try {
      const callbackURL = new URL(callbackUrl, window.location.origin).toString()
      const errorCallbackURL = new URL(
        `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}&error=oauth`,
        window.location.origin
      ).toString()
      const result = await authClient.signIn.social({
        provider,
        callbackURL,
        newUserCallbackURL: callbackURL,
        errorCallbackURL,
        disableRedirect: true,
      })
      if (result.error || !result.data?.url) {
        setError(result.error?.message || "OAuth sign-up failed")
        return
      }
      trackEvent("signup_oauth_started", { method: provider })
      window.location.assign(result.data.url)
    } catch {
      setError("OAuth sign-up failed")
    }
  }

  if (step === "otp") {
    return (
      <Card className="shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">Verify your email</CardTitle>
          <CardDescription className="text-sm">
            A verification code has been generated for {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter the 6-digit code shown in the server logs
              </p>
            </div>
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || otp.length < 6} className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700">
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("signup")}
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign up
            </button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">Create an account</CardTitle>
        <CardDescription className="text-sm">Get started with 3 free 8D reports</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} required className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="8+ chars, upper, lower, digit, special" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-9" />
          </div>
          {(error || oauthError) && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error || "OAuth sign-up could not be completed. Please try again."}
            </p>
          )}
          <Button type="submit" disabled={loading} className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-muted-foreground">or continue with</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" type="button" onClick={() => handleOAuth("google")} className="h-9">
            <svg className="size-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </Button>
          <Button variant="outline" type="button" onClick={() => handleOAuth("github")} className="h-9">
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center border-t bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Sign in</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
