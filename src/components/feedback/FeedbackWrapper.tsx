"use client"

import { useState, useEffect } from "react"
import { FeedbackButton } from "./FeedbackButton"

export function FeedbackWrapper() {
  const [locale, setLocale] = useState("en")

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
    if (match?.[1] === "zh-CN") {
      setLocale("zh-CN")
    }
  }, [])

  return <FeedbackButton locale={locale} />
}
