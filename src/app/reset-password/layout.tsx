import type { Metadata } from "next"

// Password reset is a private utility page; keep it out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
