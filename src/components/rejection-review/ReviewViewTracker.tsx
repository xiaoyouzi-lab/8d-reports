"use client"

import { useEffect } from "react"

const SESSION_KEY = "8d_reject_check_session"

export function ReviewViewTracker({ taskToken }: { taskToken: string }) {
  useEffect(() => {
    let sessionId = window.localStorage.getItem(SESSION_KEY)
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      window.localStorage.setItem(SESSION_KEY, sessionId)
    }
    fetch("/api/rejection-review-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "review_free_result_viewed",
        anonymousSessionId: sessionId,
        taskToken,
        locale: "en",
      }),
      keepalive: true,
    }).catch(() => {})
  }, [taskToken])
  return null
}
