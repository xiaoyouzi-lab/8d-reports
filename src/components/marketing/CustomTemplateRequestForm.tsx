"use client"

import { useState } from "react"
import { Loader2, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function CustomTemplateRequestForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      const form = new FormData(event.currentTarget)
      const res = await fetch("/api/custom-template-requests", { method: "POST", body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Request failed")
      setSubmitted(true)
      toast.success("Template request submitted")
      event.currentTarget.reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Submit your template for setup</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Upload the Word, Excel, PDF, screenshots, or customer instructions you use today. We will review the structure and confirm the setup scope.
        </p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" name="companyName" required placeholder="Company Inc." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required placeholder="name@company.com" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="templateUseCase">Template use case</Label>
          <Input id="templateUseCase" name="templateUseCase" required placeholder="Customer 8D, supplier SCAR, internal corrective action..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="languageRequirement">Language requirement</Label>
          <Input id="languageRequirement" name="languageRequirement" placeholder="English, Chinese, bilingual..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expectedExportFormat">Expected export format</Label>
          <Input id="expectedExportFormat" name="expectedExportFormat" placeholder="PDF, Word, customer portal format..." />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="customerRequirements">Customer-specific requirements</Label>
          <Textarea id="customerRequirements" name="customerRequirements" rows={4} placeholder="Required fields, approval wording, logo/header/footer, evidence requirements..." />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="files">Template files</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:bg-slate-100">
            <UploadCloud className="h-6 w-6 text-indigo-600" />
            <span className="mt-2 text-sm font-medium text-slate-950">Upload Word, Excel, PDF, image, or ZIP files</span>
            <span className="mt-1 text-xs text-slate-500">Up to 5 files, 15MB each</span>
            <input id="files" name="files" type="file" multiple required className="hidden" accept=".doc,.docx,.xls,.xlsx,.pdf,.zip,.png,.jpg,.jpeg,.webp" />
          </label>
        </div>
      </div>
      <Button type="submit" className="mt-5 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit setup request
      </Button>
      {submitted && (
        <p className="mt-3 text-sm text-emerald-700">
          Request received. We will review the template and confirm next steps by email.
        </p>
      )}
    </form>
  )
}
