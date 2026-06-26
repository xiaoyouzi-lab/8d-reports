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
          background: "#EEF2FF",
          color: "#111827",
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
            <div style={{ fontSize: 34, fontWeight: 800 }}>8D Reports</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 72, fontWeight: 850, lineHeight: 1.02 }}>
              Customer-ready 8D reports
            </div>
            <div style={{ marginTop: "24px", color: "#475569", fontSize: 30, lineHeight: 1.35 }}>
              D0-D8 workflow, evidence, sharing, review, and PDF / Word / Excel export.
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px" }}>
            {["D0-D8", "Evidence", "Review", "Export"].map((label) => (
              <div
                key={label}
                style={{
                  borderRadius: "12px",
                  background: "#EEF2FF",
                  color: "#3730A3",
                  padding: "14px 18px",
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                {label}
              </div>
            ))}
            <div
              style={{
                marginLeft: "auto",
                color: "#64748B",
                fontSize: 22,
                fontWeight: 700,
                padding: "14px 0",
              }}
            >
              8d-reports.com
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
