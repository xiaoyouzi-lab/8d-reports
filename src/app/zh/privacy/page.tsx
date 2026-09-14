import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "隐私政策",
  description:
    "8D Reports 收集哪些信息、如何使用信息、数据存储与安全、Cookie、你的权利以及联系方式。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/privacy",
    languages: {
      en: "https://www.8d-reports.com/privacy",
      "zh-CN": "https://www.8d-reports.com/zh/privacy",
    },
  },
}

export default function ChinesePrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-4">
          <p><strong>最后更新：</strong>2026 年 9 月 12 日</p>

          <h2>1. 我们收集的信息</h2>
          <p>当你创建账号时，我们会收集你的姓名、电子邮箱地址和身份验证凭据。当你创建 8D 报告时，我们会存储你提供的报告数据，包括文本、日期和文件附件。</p>

          <h2>2. 我们如何使用你的信息</h2>
          <p>我们仅将你的信息用于提供 8D Reports 服务——展示你的报告、支持分享以及处理你的订阅。我们不会将你的数据出售给第三方。</p>

          <h2>3. 数据存储与安全</h2>
          <p>你的数据存储在 Neon（PostgreSQL）和 Cloudflare R2（文件存储）上。所有数据在传输中（TLS 1.3）和静态存储时均加密。身份验证使用行业标准的 JWT 令牌，并配合 HttpOnly、Secure 和 SameSite Cookie。</p>

          <h2>4. Cookie</h2>
          <p>我们使用必要的 Cookie 用于身份验证（会话令牌）和语言偏好。当某个部署启用了分析功能时，我们也会使用 Google Analytics 了解汇总的产品使用情况，Google Analytics 可能会设置分析 Cookie。我们不使用广告或跨站跟踪 Cookie，也不会出售你的数据。</p>

          <h2>5. 你的权利</h2>
          <p>你可以随时导出你的报告数据（PDF/Word 导出）。你可以通过联系支持来请求删除账号。根据 GDPR，你有权访问、更正和删除你的个人数据。</p>

          <h2>6. 联系方式</h2>
          <p>如对隐私有疑问，请通过 19857345237@163.com 与我们联系。</p>
        </CardContent>
      </Card>
    </div>
  )
}
