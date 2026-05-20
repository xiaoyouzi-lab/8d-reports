import { NextRequest, NextResponse } from "next/server"
import { processQuery } from "@/lib/social-account-agent"
import type { ChatMessage, SocialPlatform, AgentResponse } from "@/lib/social-account-agent/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      history = [],
      platform,
      taskType,
      brandName,
      targetRegion,
      targetAudience,
    } = body as {
      query: string
      history?: ChatMessage[]
      platform?: SocialPlatform
      taskType?: string
      brandName?: string
      targetRegion?: string
      targetAudience?: string
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )
    }

    if (query.length > 5000) {
      return NextResponse.json(
        { error: "Query too long" },
        { status: 400 }
      )
    }

    const result: AgentResponse = processQuery(query.trim(), history, {
      platform,
      taskType,
      brandName,
      targetRegion,
      targetAudience,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Social account agent error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
