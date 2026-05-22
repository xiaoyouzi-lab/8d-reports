import { MarketingHeader } from "@/components/marketing/MarketingHeader"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">{children}</main>
    </>
  )
}
