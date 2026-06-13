"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"request" | "reset" | "done">("request")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  function validateNewPassword() {
    if (password !== confirmPassword) return "Passwords do not match"
    if (password.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter"
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter"
    if (!/[0-9]/.test(password)) return "Password must contain at least one digit"
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character"
    return null
  }

  const handleRequestCode = async () => {
    if (!email) return
    setLoading(true)
    try {
      const response = await fetch("/api/auth/email-otp/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error("Request failed")
      setStep("reset")
    } catch {
      toast.error("Failed to send reset code. Please try again.")
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
        throw new Error(data?.error || "Reset failed")
      }
      setStep("done")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === "done" ? (
            <div className="space-y-4 text-center py-4">
              <div className="text-sm text-muted-foreground">
                Your password has been updated. You can now sign in with the new password.
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="size-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : step === "reset" ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                If an account exists with that email, we&apos;ve sent a 6-digit reset code. Please check your inbox.
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="otp">Reset code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ chars, upper, lower, digit, special"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9"
                />
              </div>
              <Button
                className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleResetPassword}
                disabled={loading || otp.length < 6}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full text-center text-sm text-muted-foreground hover:text-indigo-600"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-9"
                />
              </div>
              <Button
                className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleRequestCode}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-indigo-600">
                  <ArrowLeft className="inline size-3.5" />
                  {" "}Back to sign in
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
