"use client"

import { BookOpen } from "lucide-react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AttachmentArea } from "@/components/report/AttachmentArea"
import { SignatureApprovalArea } from "@/components/report/SignatureApprovalArea"
import type { ReportStep, ReportField, ReportData } from "@/lib/report-steps"
import type { KnowledgeReuseLocation } from "@/components/knowledge/KnowledgeReusePanel"

interface StepFormProps {
  step: ReportStep
  data: ReportData
  onChange: (name: string, value: string) => void
  reportId: string
  isPro?: boolean
  canEdit?: boolean
  onOpenKnowledgeReuse?: (location: KnowledgeReuseLocation) => void
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

// The editor catalog reuses the report-steps field names as keys wherever a
// translated label exists. Field names without a catalog entry (the six
// fishbone prompts and the photo inputs) keep their English report-steps label
// rather than inventing 8D terminology.
const OPTION_LABEL_KEYS: Record<string, Record<string, string>> = {
  reportType: { customer_8d: "customer8d", internal_8d: "internal8d" },
  priority: { low: "priorityLow", medium: "priorityMedium", high: "priorityHigh" },
}

const KNOWLEDGE_HINTS: Partial<Record<ReportStep["id"], {
  location: KnowledgeReuseLocation
  key: string
}>> = {
  D4: { location: "d4", key: "knowledgeHintD4" },
  D5: { location: "d5", key: "knowledgeHintD5" },
  D7: { location: "d7", key: "knowledgeHintD7" },
  D8: { location: "d8", key: "knowledgeHintD8" },
}

export function StepForm({
  step,
  data,
  onChange,
  reportId,
  isPro = false,
  canEdit = true,
  onOpenKnowledgeReuse,
}: StepFormProps) {
  const t = useTranslations("editor")
  const tStep = useTranslations("docs.step")

  const fieldLabel = (field: ReportField) => (t.has(field.name) ? t(field.name) : field.label)
  const optionLabel = (field: ReportField, value: string, fallback: string) => {
    const key = OPTION_LABEL_KEYS[field.name]?.[value]
    return key ? t(key) : fallback
  }

  function renderField(field: ReportField, value: string) {
    if (field.type === "photo") {
      return null
    }

    const label = fieldLabel(field)

    if (field.type === "textarea") {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={field.name}>
            {label}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            value={value}
            readOnly={!canEdit}
            onChange={(e) => onChange(field.name, e.target.value)}
            rows={4}
            className={cn(!canEdit && "bg-slate-50 text-slate-700")}
          />
          {field.hint && (
            <p className="text-[11px] text-muted-foreground">{field.hint}</p>
          )}
        </div>
      )
    }

    if (field.type === "select" && field.options) {
      const selectId = `select-${field.name}`
      const displayValue = optionLabel(
        field,
        value,
        field.options.find((opt) => opt.value === value)?.label || "",
      ) || t("selectField", { field: label })
      return (
        <div className="space-y-1.5">
          <Label htmlFor={selectId}>
            {label}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Select
            value={value || undefined}
            onValueChange={(val) => onChange(field.name, val ?? "")}
            name={field.name}
            disabled={!canEdit}
          >
            <SelectTrigger id={selectId} className="w-full">
              <SelectValue className="sr-only" />
              <span className={cn("truncate", !value && "text-muted-foreground")}>
                {displayValue}
              </span>
            </SelectTrigger>
            <SelectContent align="start" sideOffset={8} className="max-h-60 z-[100]">
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {optionLabel(field, opt.value, opt.label)}
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
          {label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
        <Input
          id={field.name}
          type={inputType}
          placeholder={field.placeholder}
          value={value}
          readOnly={!canEdit}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={cn(
            inputType === "date" && "font-mono text-sm",
            inputType === "datetime-local" && "font-mono text-sm",
            inputType === "number" && "font-mono tabular-nums",
            field.name === "reportNumber" && "font-mono tabular-nums",
            !canEdit && "bg-slate-50 text-slate-700",
          )}
        />
        {field.hint && (
          <p className="text-[11px] text-muted-foreground">{field.hint}</p>
        )}
      </div>
    )
  }

  const isRootCauseStep = step.id === "D4"
  const fiveWhyFields = step.fields.filter((f) => f.name.startsWith("why"))
  const fishboneFields = step.fields.filter((f) => FISHBONE_FIELDS.has(f.name))
  const otherFields = step.fields.filter((f) => !f.name.startsWith("why") && !FISHBONE_FIELDS.has(f.name))
  const showAttachments = ATTACHMENT_STEPS.has(step.id)
  const knowledgeHint = KNOWLEDGE_HINTS[step.id]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {tStep(`${step.id}.name`)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step.description}
        </p>
      </div>

      {knowledgeHint && onOpenKnowledgeReuse && (
        <div className="flex flex-col gap-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <BookOpen className="mt-0.5 size-4 shrink-0 text-indigo-600" />
            <p className="text-indigo-900">{t(knowledgeHint.key)}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100"
            onClick={() => onOpenKnowledgeReuse(knowledgeHint.location)}
          >
            {t("searchPastReports")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {otherFields.map((field) => (
          <div
            key={field.name}
            className={cn(
              (field.type === "textarea") &&
                "sm:col-span-2",
            )}
          >
            {renderField(field, data[field.name as keyof ReportData] as string)}
          </div>
        ))}
      </div>

      {isRootCauseStep && fishboneFields.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("fishboneTitle")}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("fishboneDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fishboneFields.map((field) => (
              <div key={field.name}>
                {renderField(field, data[field.name as keyof ReportData] as string)}
              </div>
            ))}
          </div>
        </div>
      )}

      {isRootCauseStep && fiveWhyFields.length > 0 && (
        <div className="space-y-3">
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {t("fiveWhy")}
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-[520px] w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-[80px] px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      {t("stepColumn")}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      {t("stepQuestion")}
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
                        {t("whyQuestion", { n: idx + 1 })}
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          id={field.name}
                          aria-label={t("whyQuestion", { n: idx + 1 })}
                          placeholder={field.placeholder}
                          value={data[field.name as keyof ReportData] as string}
                          readOnly={!canEdit}
                          onChange={(e) => onChange(field.name, e.target.value)}
                          className={cn(
                            "border-0 bg-transparent shadow-none focus-visible:ring-0",
                            !canEdit && "text-slate-700",
                          )}
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
        <AttachmentArea reportId={reportId} stepId={step.id} isPro={isPro} canEdit={canEdit} />
      )}

      {step.id === "D8" && (
        <SignatureApprovalArea reportId={reportId} data={data} onChange={onChange} canEdit={canEdit} />
      )}
    </div>
  )
}
