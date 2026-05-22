export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header style={{ background: "#4F46E5", color: "white", padding: "12px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" style={{ color: "white", fontWeight: "bold", fontSize: "16px", textDecoration: "none" }}>
            <span style={{ background: "white", color: "#4F46E5", padding: "2px 6px", borderRadius: "4px", marginRight: "8px" }}>8D</span>
            8D Reports — FIX TEST v2
          </a>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <a href="/login" style={{ color: "white", fontSize: "14px", textDecoration: "none" }}>Sign in</a>
            <a href="/signup" style={{ background: "white", color: "#4F46E5", padding: "6px 16px", borderRadius: "6px", fontSize: "14px", textDecoration: "none", fontWeight: 600 }}>Start free</a>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
