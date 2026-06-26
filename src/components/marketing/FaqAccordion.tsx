"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"

export type FaqItem = {
  question: string
  answer: string
}

export type FaqGroup = {
  title: string
  items: FaqItem[]
}

export function FaqAccordion({
  groups,
  defaultGroup = 0,
}: {
  groups: FaqGroup[]
  defaultGroup?: number
}) {
  const [openGroup, setOpenGroup] = useState(defaultGroup)
  const [openQuestion, setOpenQuestion] = useState<Record<string, boolean>>(() => ({
    [`${defaultGroup}-0`]: true,
  }))

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => {
        const isGroupOpen = openGroup === groupIndex

        return (
          <section
            key={group.title}
            className="rounded-lg border border-slate-200 bg-white"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isGroupOpen}
              onClick={() => setOpenGroup(isGroupOpen ? -1 : groupIndex)}
            >
              <span className="text-base font-semibold text-slate-950">
                {group.title}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                  isGroupOpen ? "rotate-180" : "",
                )}
              />
            </button>
            {isGroupOpen ? (
              <div className="border-t border-slate-200 px-5 py-2">
                {group.items.map((item, itemIndex) => {
                  const key = `${groupIndex}-${itemIndex}`
                  const isOpen = !!openQuestion[key]

                  return (
                    <div
                      key={item.question}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 py-4 text-left"
                        aria-expanded={isOpen}
                        onClick={() => {
                          setOpenQuestion((current) => ({
                            ...current,
                            [key]: !current[key],
                          }))
                          trackEvent("marketing_cta_clicked", {
                            page: "faq",
                            location: "faq_accordion",
                            destination: item.question,
                          })
                        }}
                      >
                        <span className="text-sm font-semibold text-slate-900">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                            isOpen ? "rotate-180" : "",
                          )}
                        />
                      </button>
                      {isOpen ? (
                        <p className="pb-4 text-sm leading-6 text-slate-600">
                          {item.answer}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

export function StepAccordion({
  items,
  defaultOpen = [],
  page,
}: {
  items: Array<{
    id: string
    title: string
    body: string
    details?: string
  }>
  defaultOpen?: string[]
  page: string
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(defaultOpen.map((id) => [id, true])),
  )

  return (
    <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {items.map((item) => {
        const isOpen = !!open[item.id]

        return (
          <section key={item.id}>
            <button
              type="button"
              className="grid w-full grid-cols-[56px_1fr_auto] items-center gap-4 px-4 py-4 text-left sm:px-5"
              aria-expanded={isOpen}
              onClick={() => {
                setOpen((current) => ({ ...current, [item.id]: !current[item.id] }))
                trackEvent("marketing_cta_clicked", {
                  page,
                  location: "step_accordion",
                  destination: item.id,
                })
              }}
            >
              <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-center font-mono text-sm font-semibold text-indigo-700">
                {item.id}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-950">
                  {item.title}
                </span>
                {!isOpen && item.details ? (
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {item.details}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-slate-400 transition-transform",
                  isOpen ? "rotate-180" : "",
                )}
              />
            </button>
            {isOpen ? (
              <div className="px-4 pb-5 pl-[88px] sm:px-5 sm:pl-[96px]">
                <p className="text-sm leading-6 text-slate-600">{item.body}</p>
                {item.details ? (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {item.details}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
