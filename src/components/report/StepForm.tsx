"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AttachmentArea } from "@/components/report/AttachmentArea"
import type { ReportStep, ReportField, ReportData } from "@/lib/report-steps"

interface StepFormProps {
  step: ReportStep
  data: ReportData
  onChange: (name: string, value: string) => void
  reportId: string
  isPro?: boolean
}

function renderField(
  field: ReportField,
  value: string,
  onChange: (name: string, value: string) => void,
) {
  if (field.type === "photo") {
    return null
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        <Textarea
          id={field.name}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          rows={4}
        />
        {field.hint && (
          <p className="text-[11px] text-muted-foreground">{field.hint}</p>
        )}
      </div>
    )
  }

  if (field.type === "select" && field.options) {
    const selectId = `select-${field.name}`
    return (
      <div className="space-y-1.5">
        <Label htmlFor={selectId}>
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        <Select
          value={value || undefined}
          onValueChange={(val) => onChange(field.name, val ?? "")}
          name={field.name}
        >
          <SelectTrigger id={selectId} className="w-full">
            <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent align="start" sideOffset={8} className="max-h-60 z-[100]">
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  const inputType = field.type === "number"
    ? "number"
    : field.type === "date"
      ? "date"
      : field.type === "datetime-local"
        ? "datetime-local"
        : "text"

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <Input
        id={field.name}
        type={inputType}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
        className={cn(
          inputType === "date" && "font-mono text-sm",
          inputType === "datetime-local" && "font-mono text-sm",
          inputType === "number" && "font-mono tabular-nums",
          field.name === "reportNumber" && "font-mono tabular-nums",
        )}
      />
      {field.hint && (
        <p className="text-[11px] text-muted-foreground">{field.hint}</p>
      )}
    </div>
  )
}

const ATTACHMENT_STEPS = new Set(["D2", "D3", "D4", "D5", "D6", "D7"])
const FISHBONE_FIELDS = new Set([
  "fishboneMan",
  "fishboneMachine",
  "fishboneMaterial",
  "fishboneMethod",
  "fishboneMeasurement",
  "fishboneEnvironment",
])

export function StepForm({ step, data, onChange, reportId, isPro = false }: StepFormProps) {
  const isRootCauseStep = step.id === "D4"
  const fiveWhyFields = step.fields.filter((f) => f.name.startsWith("why"))
  const fishboneFields = step.fields.filter((f) => FISHBONE_FIELDS.has(f.name))
  const otherFields = step.fields.filter((f) => !f.name.startsWith("why") && !FISHBONE_FIELDS.has(f.name))
  const showAttachments = ATTACHMENT_STEPS.has(step.id)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {step.label}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {otherFields.map((field) => (
          <div
            key={field.name}
            className={cn(
              (field.type === "textarea") &&
                "sm:col-span-2",
            )}
          >
            {renderField(field, data[field.name as keyof ReportData] as string, onChange)}
          </div>
        ))}
      </div>

      {isRootCauseStep && fishboneFields.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Fishbone / Ishikawa 6M Analysis
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Use these prompts to check competing causes before confirming the
              final root cause. Attach a whiteboard photo or analysis file below
              if the team used a separate fishbone diagram.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fishboneFields.map((field) => (
              <div key={field.name}>
                {renderField(field, data[field.name as keyof ReportData] as string, onChange)}
              </div>
            ))}
          </div>
        </div>
      )}

      {isRootCauseStep && fiveWhyFields.length > 0 && (
        <div className="space-y-3">
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              5-Why Analysis
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-[520px] w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-[80px] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Step
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Question / Answer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fiveWhyFields.map((field, idx) => (
                    <tr
                      key={field.name}
                      className={cn(
                        "border-b last:border-b-0",
                        idx % 2 === 0 && "bg-white",
                        idx % 2 !== 0 && "bg-muted/20",
                      )}
                    >
                      <td className="px-3 py-2 font-mono text-xs font-semibold tabular-nums text-indigo-600">
                        Why {idx + 1}
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          id={field.name}
                          aria-label={`Why ${idx + 1}`}
                          placeholder={field.placeholder}
                          value={data[field.name as keyof ReportData] as string}
                          onChange={(e) => onChange(field.name, e.target.value)}
                          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAttachments && (
        <AttachmentArea reportId={reportId} stepId={step.id} isPro={isPro} />
      )}
    </div>
  )
}
