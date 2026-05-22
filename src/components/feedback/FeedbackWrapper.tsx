"use client"

import { useLocale } from "next-intl"
import { FeedbackButton } from "./FeedbackButton"

export function FeedbackWrapper() {
  const locale = useLocale()
  return <FeedbackButton locale={locale} />
}
