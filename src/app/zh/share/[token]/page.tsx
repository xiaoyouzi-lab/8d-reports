"use client"

import { use } from "react"
import { ShareViewer } from "@/components/share/ShareViewer"

// Chinese URL for the same tokenized viewer. The token is arbitrary, so this
// route stays dynamic and renders the shared component used by /share/[token].
export default function ZhSharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  return <ShareViewer token={token} />
}
