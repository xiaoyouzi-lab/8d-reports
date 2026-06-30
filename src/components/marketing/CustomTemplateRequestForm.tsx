"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { trackEvent } from "@/lib/analytics"

interface CustomTemplateRequestFormProps {
  initialRequestType?: "template_setup" | "team_launch" | "assisted_8d"
}

export function CustomTemplateRequestForm({ initialRequestType = "template_setup" }: CustomTemplateRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [fileError, setFileError] = useState("")
  const [formError, setFormError] = useState("")
  const [uploadWarning, setUploadWarning] = useState("")
  const [hasStarted, setHasStarted] = useState(false)
  const requestType = initialRequestType

  const startForm = () => {
    if (hasStarted) return
    setHasStarted(true)
    trackEvent("template_setup_form_started", {
      requestType,
      source: "template_setup",
    })
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setFormError("")
    setUploadWarning("")
    try {
      const form = new FormData(event.currentTarget)
      const files = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0)
      form.set("sourcePath", window.location.pathname)
      form.set("referrer", document.referrer)
      setFileError("")
      const res = await fetch("/api/custom-template-requests", { method: "POST", body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Request failed")
      setSubmitted(true)
      setUploadWarning(typeof data?.fileUploadWarning === "string" ? data.fileUploadWarning : "")
      setFileNames([])
      trackEvent("template_setup_form_submitted", {
        requestType,
        source: "template_setup",
        hasFile: files.length > 0,
        fileCount: files.length,
        fileUploadWarning: Boolean(data?.fileUploadWarning),
      })
      toast.success("Template request submitted")
      event.currentTarget.reset()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      setFormError(message)
      trackEvent("template_setup_form_failed", {
        requestType,
        source: "template_setup",
        reason: "submit_failed",
      })
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        <h2 className="mt-4 text-xl font-semibold text-emerald-950">
          Request received.
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          We received your template setup request. We will review your current
          format and follow up with setup options.
        </p>
        {uploadWarning ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            {uploadWarning}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="mt-5 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100"
          onClick={() => {
            setSubmitted(false)
            setUploadWarning("")
          }}
        >
          Submit another request
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} onFocusCapture={startForm} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          {requestType === "team_launch"
            ? "Request Team Launch"
            : requestType === "assisted_8d"
              ? "Request assisted first 8D / SCAR delivery"
              : "Submit your template for setup"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {requestType === "team_launch"
            ? "Upload the template you use today. We will review the format, confirm scope, and outline the 7-day launch steps."
            : requestType === "assisted_8d"
              ? "Share the format and deadline for the first customer-ready 8D or SCAR you need to deliver."
            : "Upload the Word, Excel, PDF, screenshots, or customer instructions you use today. We will review the structure and confirm the setup scope."}
        </p>
      </div>
      <input type="hidden" name="requestType" value={requestType} />
      <input type="hidden" name="sourcePath" value="" />
      <input type="hidden" name="referrer" value="" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Name</Label>
          <Input id="contactName" name="contactName" required placeholder="Jane Smith" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" name="companyName" required placeholder="Company Inc." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">Work email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required placeholder="name@company.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" required placeholder="Quality Manager, SQE, Operations..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentProcess">Current process</Label>
          <select id="currentProcess" name="currentProcess" required className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">Select current process</option>
            <option value="Word/Excel">Word/Excel</option>
            <option value="Email/shared files">Email/shared files</option>
            <option value="Existing QMS">Existing QMS</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="templateUseCase">Use case</Label>
          <select id="templateUseCase" name="templateUseCase" required className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">Select use case</option>
            <option value="Customer complaint">Customer complaint</option>
            <option value="Supplier 8D">Supplier 8D</option>
            <option value="SCAR">SCAR</option>
            <option value="Internal CAPA">Internal CAPA</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timeline">Timeline</Label>
          <select id="timeline" name="timeline" required className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">Select timeline</option>
            <option value="This week">This week</option>
            <option value="This month">This month</option>
            <option value="Exploring">Exploring</option>
          </select>
        </div>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-sm font-medium text-slate-950">Required export</legend>
          <div className="grid gap-2 sm:grid-cols-4">
            {["PDF", "Word", "Excel", "ZIP"].map((format) => (
              <label key={format} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" name="requiredExport" value={format} className="h-4 w-4" />
                {format}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" rows={4} placeholder="Required fields, approval wording, logo/header/footer, evidence requirements, customer deadline..." />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="files">Template files</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:bg-slate-100">
            <UploadCloud className="h-6 w-6 text-indigo-600" />
            <span className="mt-2 text-sm font-medium text-slate-950">Upload Word, Excel, PDF, image, or ZIP files</span>
            <span className="mt-1 text-xs text-slate-500">Up to 5 files, 15MB each</span>
            <input
              id="files"
              name="files"
              type="file"
              multiple
              className="hidden"
              accept=".doc,.docx,.xls,.xlsx,.pdf,.zip,.png,.jpg,.jpeg,.webp"
              onChange={(event) => {
                const names = Array.from(event.target.files || []).map((file) => file.name)
                setFileNames(names)
                if (names.length > 0) setFileError("")
              }}
            />
          </label>
          {fileNames.length > 0 && (
            <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Selected: {fileNames.join(", ")}
            </div>
          )}
          {fileError && (
            <p className="text-sm text-red-600">{fileError}</p>
          )}
        </div>
      </div>
      {formError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <Button type="submit" className="mt-5 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {requestType === "team_launch"
          ? "Submit Team Launch request"
          : requestType === "assisted_8d"
            ? "Submit assisted delivery request"
            : "Submit setup request"}
      </Button>
    </form>
  )
}
