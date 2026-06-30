"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { trackEvent } from "@/lib/analytics"

export function ContactLeadForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") || "").trim()
    const company = String(form.get("company") || "").trim()
    const email = String(form.get("email") || "").trim()
    const topic = String(form.get("topic") || "").trim()
    const message = String(form.get("message") || "").trim()

    try {
      const feedback = [
        "[contact-form]",
        `Name: ${name || "Not provided"}`,
        `Company: ${company || "Not provided"}`,
        `Topic: ${topic || "General"}`,
        "",
        message,
      ].join("\n")

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: 0,
          feedback,
          email,
          locale: "en",
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "Message could not be sent")

      trackEvent("contact_form_submitted", {
        source: "contact",
        topic: topic || "general",
        providedEmail: Boolean(email),
      })
      setSubmitted(true)
      toast.success("Message sent")
      event.currentTarget.reset()
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Message could not be sent"
      setError(messageText)
      toast.error(messageText)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <h2 className="mt-3 text-lg font-semibold text-emerald-950">Message received.</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          Thanks for reaching out. Your message has been recorded.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" required placeholder="Jane Smith" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-company">Company</Label>
          <Input id="contact-company" name="company" placeholder="Company Inc." />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-email">Work email</Label>
        <Input id="contact-email" name="email" type="email" required placeholder="name@company.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-topic">Topic</Label>
        <select id="contact-topic" name="topic" className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="template_setup">Template setup</option>
          <option value="team_launch">Team launch</option>
          <option value="assisted_8d">Assisted 8D / SCAR delivery</option>
          <option value="product_question">Product question</option>
          <option value="support">Support</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" name="message" rows={4} required placeholder="What are you trying to deliver or validate?" />
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-700">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send message"}
      </Button>
    </form>
  )
}
