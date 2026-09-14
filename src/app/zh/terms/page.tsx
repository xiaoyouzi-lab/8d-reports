import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "服务条款",
  description:
    "8D Reports 服务条款：接受条款、服务说明、免费与 Pro/Team 套餐、用户责任、责任限制、终止与联系方式。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/terms",
    languages: {
      en: "https://www.8d-reports.com/terms",
      "zh-CN": "https://www.8d-reports.com/zh/terms",
    },
  },
}

export default function ChineseTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">服务条款</h1>
      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-4">
          <p><strong>最后更新：</strong>2026 年 5 月 20 日</p>

          <h2>1. 接受条款</h2>
          <p>使用 8D Reports（以下简称“本服务”）即表示你同意本服务条款。</p>

          <h2>2. 服务说明</h2>
          <p>8D Reports 是一款用于创建、管理和导出 8D 问题解决报告的 SaaS 应用。本服务按“原样”提供，不附带任何保证。</p>

          <h2>3. 免费与 Pro 套餐</h2>
          <p><strong>免费套餐：</strong>3 份终身报告，带水印 PDF 导出和基础检索。<strong>Pro 套餐：</strong>每月 19 美元，供个人使用，包含不限数量的个人报告、无水印 PDF 导出、Word 导出、公司 Logo、可编辑分享链接和深度历史检索。Pro 订阅会自动续订，除非取消。<strong>Team 套餐：</strong>每月 99 美元，包含 5 个席位、共享工作区、角色、审批状态、报告锁定、修订版本和活动日志。</p>

          <h2>4. 用户责任</h2>
          <p>你需对你输入的报告数据的准确性负责。你不得将本服务用于非法目的。你保留对报告数据的全部所有权。</p>

          <h2>5. 责任限制</h2>
          <p>对于因使用本服务而产生的任何间接、附带或后果性损害，8D Reports 不承担责任。</p>

          <h2>6. 终止</h2>
          <p>你可以随时停止使用本服务。我们保留终止违反这些条款的账号的权利。</p>

          <h2>7. 联系方式</h2>
          <p>如对法律事宜、账单问题或账号支持有疑问：19857345237@163.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
