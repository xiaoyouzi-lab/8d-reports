"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { trackEvent } from "@/lib/analytics"

export default function SignupPage() {
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

  async function requestVerificationCode() {
    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    })

    if (result.error) {
      throw new Error(result.error.message || "Failed to send verification code")
    }
  }

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
      await requestVerificationCode()
      trackEvent("signup_success", { method: "email" })
      setStep("otp")
      setLoading(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      setLoading(false)
    }
  }

  async function handleResendCode() {
    setError("")
    setLoading(true)
    try {
      await requestVerificationCode()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to resend verification code")
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

  if (step === "otp") {
    return (
      <Card className="shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">Verify your email</CardTitle>
          <CardDescription className="text-sm">
            We sent a verification code to {email}
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
                Enter the 6-digit code from your inbox. It expires in 5 minutes.
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
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="text-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {loading ? "Sending..." : "Resend code"}
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
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Sign in</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
