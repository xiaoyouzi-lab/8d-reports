"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consented = document.cookie.includes("cookie-consent=true")
    if (!consented) setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies for authentication and language preferences. No tracking or advertising cookies.
          See our <a href="/privacy" className="underline text-indigo-600">Privacy Policy</a>.
        </p>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
          onClick={() => {
            document.cookie = "cookie-consent=true;path=/;max-age=31536000;sameSite=lax"
            setVisible(false)
          }}
        >
          Got it
        </Button>
      </div>
    </div>
  )
}
