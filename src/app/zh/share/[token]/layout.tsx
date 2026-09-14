import type { Metadata } from "next"

// Shared reports are tokenized private content. The Chinese rendering must be
// noindex exactly like /share/[token], so it gets its own layout.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ZhSharedReportLayout({ children }: { children: React.ReactNode }) {
  return children
}
