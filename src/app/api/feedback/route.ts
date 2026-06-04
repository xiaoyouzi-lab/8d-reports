import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { feedback } from "@/lib/db/schema"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { rating, feedback: text, email, locale } = body as {
      rating?: number
      feedback?: string
      email?: string
      locale?: string
    }

    const normalizedRating = typeof rating === "number" && Number.isFinite(rating)
      ? Math.min(5, Math.max(0, Math.round(rating)))
      : 0
    const normalizedText = typeof text === "string" ? text.trim().slice(0, 5000) : ""
    const normalizedEmail = typeof email === "string" ? email.trim().slice(0, 320) : ""
    const normalizedLocale = locale === "zh-CN" ? "zh-CN" : "en"

    if (!normalizedText && normalizedRating === 0) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 })
    }

    await db.insert(feedback).values({
      rating: normalizedRating,
      text: normalizedText,
      email: normalizedEmail || null,
      locale: normalizedLocale,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Feedback error:", error)
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    )
  }
}
