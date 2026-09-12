"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AcceptState = "loading" | "success" | "error" | "unauthenticated"

export default function AcceptInviteForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  // Missing-token state is derived at initialization so the effect never has
  // to call setState synchronously on mount.
  const [state, setState] = useState<AcceptState>(() => (token ? "loading" : "error"))
  const [message, setMessage] = useState(() =>
    token ? "" : "This invitation link is missing its token."
  )

  useEffect(() => {
    if (!token) return

    let cancelled = false

    void (async () => {
      try {
        const res = await fetch("/api/team/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await res.json().catch(() => null)
        if (cancelled) return

        if (res.status === 401) {
          setState("unauthenticated")
          return
        }
        if (!res.ok) {
          setState("error")
          setMessage(data?.error || "This invitation could not be accepted.")
          return
        }

        setState("success")
        setMessage(data?.team?.name ? `You have joined ${data.team.name}.` : "You have joined the team.")
      } catch {
        if (!cancelled) {
          setState("error")
          setMessage("An unexpected error occurred. Please try again.")
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  const callbackUrl = `/team/accept?token=${encodeURIComponent(token)}`

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">Team invitation</CardTitle>
        <CardDescription className="text-sm">
          {state === "success"
            ? "Your team access is active."
            : "Accept your invitation to join this team workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-center">
        {state === "loading" && (
          <p className="text-sm text-muted-foreground">Checking your invitation...</p>
        )}

        {state === "success" && (
          <>
            <p className="text-sm text-emerald-700">{message}</p>
            <Link href="/dashboard">
              <Button className="w-full">Go to dashboard</Button>
            </Link>
          </>
        )}

        {state === "unauthenticated" && (
          <>
            <p className="text-sm text-muted-foreground">
              Sign in with the email address this invitation was sent to.
            </p>
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              <Button className="w-full">Sign in to accept</Button>
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <p className="text-sm text-destructive">{message}</p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">Back to dashboard</Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
