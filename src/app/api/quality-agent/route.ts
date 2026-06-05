import { NextRequest, NextResponse } from "next/server"
import { processQuery } from "@/lib/quality-agent"
import type { ChatMessage } from "@/lib/quality-agent/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      history = [],
      companySize,
      industry,
      country,
    } = body as {
      query: string
      history?: ChatMessage[]
      companySize?: string
      industry?: string
      country?: string
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )
    }

    if (query.length > 2000) {
      return NextResponse.json(
        { error: "Query too long" },
        { status: 400 }
      )
    }

    const result = processQuery(query.trim(), history, {
      companySize: companySize as "world_class" | "medium" | "small" | undefined,
      industry,
      country,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Quality agent error:", error)
    return NextResponse.json(
      { error: "Quality Expert is temporarily unavailable. Please try again later." },
      { status: 503 }
    )
  }
}
