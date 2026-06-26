import { ImageResponse } from "next/og"

export const alt = "8D Reports customer-ready 8D reports"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#F8FAFC",
          color: "#0F172A",
          fontFamily: "Arial, sans-serif",
          padding: "64px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            border: "2px solid #CBD5E1",
            borderRadius: "28px",
            background: "#FFFFFF",
            padding: "48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "#4F46E5",
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              8D
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>8D Reports</div>
              <div style={{ color: "#64748B", fontSize: 22 }}>8d-reports.com</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "42px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", width: "56%" }}>
              <div style={{ fontSize: 68, fontWeight: 850, lineHeight: 1.02 }}>
                Customer-ready 8D reports
              </div>
              <div style={{ marginTop: "24px", color: "#475569", fontSize: 28, lineHeight: 1.35 }}>
                Structured D0-D8 workflow, evidence, review, and export delivery.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                width: "38%",
                border: "1px solid #E2E8F0",
                borderRadius: "20px",
                background: "#F8FAFC",
                padding: "26px",
              }}
            >
              {["D2 Problem", "D4 Root cause", "D5 Action", "D6 Validation"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderRadius: "12px",
                    background: "#FFFFFF",
                    padding: "16px 18px",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: "#10B981" }}>Ready</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
