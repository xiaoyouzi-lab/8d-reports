"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReportStep } from "@/lib/report-steps"

interface ReportStepsNavProps {
  steps: ReportStep[]
  activeStepIndex: number
  completedSteps: Set<string>
  onStepClick: (index: number) => void
}

export function ReportStepsNav({
  steps,
  activeStepIndex,
  completedSteps,
  onStepClick,
}: ReportStepsNavProps) {
  const completedCount = completedSteps.size
  const totalSteps = steps.length
  const progressPercent = Math.round((completedCount / totalSteps) * 100)

  return (
    <>
      <nav className="hidden lg:block w-[220px] shrink-0">
        <div className="sticky top-[72px]">
          <div className="mb-5 px-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Progress
              </span>
              <span className="font-mono text-xs font-semibold text-indigo-600 tabular-nums">
                {completedCount}/{totalSteps}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            {steps.map((step, index) => {
              const isActive = index === activeStepIndex
              const isCompleted = completedSteps.has(step.id)
              const stepNumber = parseInt(step.id.replace("D", ""), 10)

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onStepClick(index)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    isActive &&
                      "border-l-[3px] border-indigo-500 bg-indigo-50/80 pl-[7px] font-medium text-indigo-700",
                    !isActive && !isCompleted && "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    isCompleted && !isActive && "text-foreground hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-[22px] shrink-0 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums transition-colors",
                      isCompleted &&
                        "bg-emerald-100 text-emerald-700",
                      isActive && !isCompleted &&
                        "bg-indigo-100 text-indigo-700",
                      !isActive && !isCompleted &&
                        "bg-muted text-muted-foreground group-hover:bg-muted-foreground/15",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-3" />
                    ) : (
                      stepNumber
                    )}
                  </span>
                  <span className="truncate">{step.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="flex gap-1.5 overflow-x-auto pb-2 lg:hidden">
        {steps.map((step, index) => {
          const isActive = index === activeStepIndex
          const isCompleted = completedSteps.has(step.id)

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(index)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive &&
                  "border-indigo-300 bg-indigo-50 text-indigo-700",
                isCompleted && !isActive &&
                  "border-emerald-200 bg-emerald-50 text-emerald-700",
                !isActive && !isCompleted &&
                  "border-border bg-white text-muted-foreground",
              )}
            >
              {isCompleted && <Check className="size-3" />}
              <span>{step.id}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
