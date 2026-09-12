import type { Metadata } from "next"

// Shared reports are tokenized private content. They must not be indexable even
// if a share link is ever exposed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function SharedReportLayout({ children }: { children: React.ReactNode }) {
  return children
}
