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

    await db.insert(feedback).values({
      rating: rating || 0,
      text: text?.trim() || "",
      email: email?.trim() || null,
      locale: locale || "en",
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
