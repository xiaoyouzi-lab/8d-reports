"use client"

import { useState, useEffect } from "react"
import { FeedbackButton } from "./FeedbackButton"

export function FeedbackWrapper() {
  const [locale, setLocale] = useState("en")

  useEffect(() => {
    if (document.cookie.includes("NEXT_LOCALE=zh")) {
      setLocale("zh-CN")
    }
  }, [])

  return <FeedbackButton locale={locale} />
}
