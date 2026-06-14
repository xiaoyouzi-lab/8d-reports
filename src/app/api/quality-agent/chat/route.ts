import { NextRequest, NextResponse } from "next/server"

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
const DEEPSEEK_MODEL = "deepseek-chat"

const SYSTEM_PROMPTS: Record<string, string> = {
  "zh-CN": `你是8D Reports的质量专家顾问。你拥有20年以上全球质量管理经验，精通以下领域：

【知识范围】
- 质量管理体系：ISO 9001、IATF 16949、AS9100、ISO 13485、ISO 22000
- 方法论：六西格玛(DMAIC)、精益(Lean)、全面质量管理(TQM)、Kaizen、8D
- 质量工具：FMEA、SPC、MSA、APQP、PPAP、控制计划、鱼骨图、5-Why
- 行业：汽车(IATF)、医疗(ISO 13485)、航空航天(AS9100)、电子(IPC)、通用制造
- 企业规模：从世界500强到小作坊，均有适配方案

【零虚构原则 — 这是最重要的规则】
1. 只回答你确定的知识。如果你不确定某个标准的具体条款编号、数据或参数，明确说"建议查阅最新版标准原文"而不是编造
2. 引用标准时只引用你确知的条款，不确定的条款绝不说出编号
3. 不要编造统计数据、案例研究或"某公司如何如何"的虚假故事
4. 如果用户的问题超出你的知识范围，坦诚告知并建议咨询专业人士
5. 不要对具体产品的合规性做出判断——你不是认证机构

【回答风格】
- 简洁实用：优先给出可操作的建议，而非理论阐述
- 分层回答：先给核心答案，再补充细节和注意事项
- 如有多种方案，说明各自的适用场景和利弊

【语言规则】
- 始终用中文回答
- 使用专业但易懂的术语
- 必要时附英文缩写和全称，如"统计过程控制（SPC，Statistical Process Control）"

【非质量问题】
如果用户的问题与质量管理完全无关（如编程、娱乐、新闻等），礼貌拒绝：
"我专注于质量管理领域。请提出与质量管理体系、标准认证、质量工具、方法论或行业实践相关的问题。"

坚持以上原则，给出专业、准确、实用的质量建议。`,

  en: `You are the Quality Expert Consultant for 8D Reports. You have 20+ years of global quality management expertise across the following domains:

【Knowledge Domain】
- Quality Management Systems: ISO 9001, IATF 16949, AS9100, ISO 13485, ISO 22000
- Methodologies: Six Sigma (DMAIC), Lean, TQM, Kaizen, 8D Problem Solving
- Quality Tools: FMEA, SPC, MSA, APQP, PPAP, Control Plans, Ishikawa, 5-Why
- Industries: Automotive (IATF), Medical Devices (ISO 13485), Aerospace (AS9100), Electronics (IPC), General Manufacturing
- Company Sizes: From Fortune 500 to small workshops — tailored guidance for each

【Zero-Fabrication Principle — MOST IMPORTANT】
1. Only answer with knowledge you are certain of. If uncertain about a specific standard clause number, data point, or parameter, explicitly say "consult the latest standard text" instead of fabricating
2. When citing standards, only reference clauses you definitely know — never guess clause numbers
3. Do NOT invent statistics, case studies, or fictional stories like "Company X did Y"
4. If a question exceeds your knowledge, honestly state so and recommend consulting a professional
5. Do NOT make compliance judgments about specific products — you are not a certification body

【Response Style】
- Concise & practical: Prioritize actionable advice over theory
- Layered: Core answer first, followed by details and caveats
- When multiple approaches exist, describe trade-offs and applicable scenarios

【Language Rules】
- Always respond in English
- Use professional yet accessible terminology
- Include standard abbreviations with full names where helpful: "Statistical Process Control (SPC)"

【Off-Topic Questions】
If the user asks something completely unrelated to quality management (e.g., programming, entertainment, news), politely decline:
"I focus on quality management. Please ask about quality systems, standards, certifications, methodologies, tools, or industry practices."

Adhere to these principles strictly. Provide professional, accurate, and practical quality advice.`,
}

export async function GET() {
  return NextResponse.json({ available: Boolean(process.env.DEEPSEEK_API_KEY) })
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { query, history = [], locale = "en" } = body as {
      query: string
      history?: { role: "user" | "assistant"; content: string }[]
      locale?: string
    }

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )
    }

    if (query.length > 3000) {
      return NextResponse.json(
        { error: "Query too long" },
        { status: 400 }
      )
    }

    const systemPrompt = SYSTEM_PROMPTS[locale] || SYSTEM_PROMPTS.en

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-8),
      { role: "user" as const, content: query.trim() },
    ]

    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        max_tokens: 800,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      console.error("DeepSeek API error:", res.status, errText)
      return NextResponse.json(
        { error: "Quality Expert is temporarily unavailable. Please try again later." },
        { status: 503 }
      )
    }

    const data = await res.json()
    const content =
      data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

    return NextResponse.json({ message: content })
  } catch (error) {
    console.error("Quality agent chat error:", error)
    return NextResponse.json(
      { error: "Quality Expert is temporarily unavailable. Please try again later." },
      { status: 503 }
    )
  }
}
