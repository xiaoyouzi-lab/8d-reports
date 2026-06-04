"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { trackEvent } from "@/lib/analytics"

const roles = ["Quality Manager", "SQE / Supplier Quality", "Quality Engineer", "Consultant", "Owner / Operations", "Other"]
const tools = ["Word / Excel", "Email and shared files", "Existing QMS", "Other"]
const values = ["Approval and report locking", "Revision history and Activity Log", "Customer-ready exports", "Role-based team access", "Template Setup service"]

export function TeamWorkflowFeedbackForm({ demoType }: { demoType: string }) {
  const [role, setRole] = useState("")
  const [currentTool, setCurrentTool] = useState("")
  const [mostValuable, setMostValuable] = useState("")
  const [concern, setConcern] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    trackEvent("demo_report_viewed", { demoType })
  }, [demoType])

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!role || !currentTool || !mostValuable) {
      setError("Please select your role, current process, and most valuable capability.")
      return
    }

    setSubmitting(true)
    try {
      const structuredFeedback = [
        "[team-workflow-validation]",
        `Demo: ${demoType}`,
        `Role: ${role}`,
        `Current tool: ${currentTool}`,
        `Most valuable: ${mostValuable}`,
        `Main concern: ${concern.trim() || "Not provided"}`,
      ].join("\n")

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: 0,
          feedback: structuredFeedback,
          email: email.trim() || undefined,
          locale: "en",
        }),
      })

      if (!response.ok) throw new Error("Feedback could not be submitted")

      trackEvent("team_demo_feedback_submitted", {
        demoType,
        role,
        currentTool,
        mostValuable,
        providedEmail: Boolean(email.trim()),
      })
      setSubmitted(true)
    } catch {
      setError("Feedback could not be submitted. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-left">
        <CheckCircle2 className="size-6 text-emerald-600" />
        <h3 className="mt-4 text-lg font-semibold text-emerald-950">Thank you. This directly shapes the next release.</h3>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          We are validating whether controlled approval, locking, revisions, and delivery are valuable enough for small quality teams before building more features.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submitFeedback} className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm sm:p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Two-minute validation</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Would this workflow fit your quality team?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your answer helps us improve the workflow before adding more features.</p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`role-${demoType}`}>Your role</Label>
          <select id={`role-${demoType}`} value={role} onChange={(event) => setRole(event.target.value)} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">Select role</option>
            {roles.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`tool-${demoType}`}>How do you manage 8D reports today?</Label>
          <select id={`tool-${demoType}`} value={currentTool} onChange={(event) => setCurrentTool(event.target.value)} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">Select current process</option>
            {tools.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor={`value-${demoType}`}>Which capability is most valuable?</Label>
        <select id={`value-${demoType}`} value={mostValuable} onChange={(event) => setMostValuable(event.target.value)} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">Select one capability</option>
          {values.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor={`concern-${demoType}`}>What would stop you from using this for your next customer complaint?</Label>
        <Textarea id={`concern-${demoType}`} value={concern} onChange={(event) => setConcern(event.target.value)} rows={3} maxLength={1200} placeholder="For example: exact customer template, security review, export format, or team adoption..." />
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor={`email-${demoType}`}>Work email (optional)</Label>
        <Input id={`email-${demoType}`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={200} placeholder="Only if you want a short workflow review" />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <Button type="submit" size="lg" disabled={submitting} className="mt-6 w-full bg-indigo-600 text-white hover:bg-indigo-700">
        {submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting...</> : "Share feedback"}
      </Button>
      <p className="mt-3 text-center text-xs text-slate-500">No sales call is required. We only follow up if you provide an email.</p>
    </form>
  )
}
