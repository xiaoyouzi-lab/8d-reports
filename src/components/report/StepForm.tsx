"use client"

import { Upload } from "lucide-react"
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
import type { ReportStep, ReportField, ReportData } from "@/lib/report-steps"

interface StepFormProps {
  step: ReportStep
  data: ReportData
  onChange: (name: string, value: string) => void
}

function PhotoUpload({ label }: { label: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-indigo-300 hover:text-indigo-500">
        <Upload className="size-5" />
        <span className="text-xs">Click to upload or drag and drop</span>
        <span className="text-[11px] text-muted-foreground/60">
          SVG, PNG, JPG or GIF (max. 5MB)
        </span>
      </div>
    </div>
  )
}

function renderField(
  field: ReportField,
  value: string,
  onChange: (name: string, value: string) => void,
) {
  if (field.type === "photo") {
    return <PhotoUpload label={field.label} />
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
    return (
      <div className="space-y-1.5">
        <Label>
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        <Select
          value={value || undefined}
          onValueChange={(val) => onChange(field.name, val ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
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

  const isReadonly = field.name === "reportNumber"

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
        readOnly={isReadonly}
        className={cn(
          inputType === "date" && "font-mono text-sm",
          inputType === "datetime-local" && "font-mono text-sm",
          inputType === "number" && "font-mono tabular-nums",
          isReadonly && "cursor-not-allowed bg-muted/50 text-muted-foreground",
        )}
      />
      {field.hint && (
        <p className="text-[11px] text-muted-foreground">{field.hint}</p>
      )}
    </div>
  )
}

export function StepForm({ step, data, onChange }: StepFormProps) {
  const hasFiveWhys = step.id === "D4"
  const fiveWhyFields = step.fields.filter((f) => f.name.startsWith("why"))
  const otherFields = step.fields.filter((f) => !f.name.startsWith("why"))

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
              (field.type === "textarea" || field.type === "photo") &&
                "sm:col-span-2",
            )}
          >
            {renderField(field, data[field.name as keyof ReportData] as string, onChange)}
          </div>
        ))}
      </div>

      {hasFiveWhys && fiveWhyFields.length > 0 && (
        <div className="space-y-3">
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              5-Why Analysis
            </h3>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
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
    </div>
  )
}
