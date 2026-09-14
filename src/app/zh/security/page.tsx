import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck, Trash2, UploadCloud } from "lucide-react";

export const metadata: Metadata = {
  title: "安全与数据隐私",
  description:
    "8D Reports 如何处理报告数据、附件、AI 处理、分享链接、账号删除以及面向客户的质量文档。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/security",
    languages: {
      en: "https://www.8d-reports.com/security",
      "zh-CN": "https://www.8d-reports.com/zh/security",
    },
  },
};

const sections = [
  {
    icon: ShieldCheck,
    title: "报告数据存储在哪里",
    text: "8D 报告文本、日期、状态和账号记录存储在应用数据库中。文件附件、公司 Logo、模板文件和签名图片存储在对象存储中。",
  },
  {
    icon: Lock,
    title: "加密与访问",
    text: "生产站点通过 HTTPS 提供服务。除非你主动创建分享链接，否则报告需要账号访问。分享链接可以在报告分享弹窗中撤销。",
  },
  {
    icon: UploadCloud,
    title: "AI 处理",
    text: "只有当你主动运行 AI 功能（例如报告评审、草稿生成或模板评估）时，报告内容才会发送给 DeepSeek。报告数据不会用于训练 8D Reports 模型。",
  },
  {
    icon: Trash2,
    title: "删除与导出",
    text: "用户可以导出报告和附件。账号或数据删除请求可以发送给支持；已撤销的分享链接不再暴露报告。",
  },
];

export default function ChineseSecurityPage() {
  return (
    <div className="bg-white font-sans">
      <section className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            安全 / 数据隐私
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            面向客户交付的 8D 报告，数据边界清晰。
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            质量报告可能包含客户、供应商、产品、批次、缺陷和证据信息。本页说明在你将产品用于付费交付之前，8D Reports 如何处理这些数据。
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <section.icon className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            关于 AI 与签名的重要说明
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              AI 功能是可选的，用于帮助起草或评审措辞，不会批准报告、认证合规或替代合格的质量负责人。
            </p>
            <p>
              上传的签名图片仅用于 PDF、Word 和分享视图中的报告展示，不是具有法律效力的电子签名系统。
            </p>
            <p>
              如果你的公司需要 SOC2、SSO、数据驻留承诺或正式 DPA 条款，请在将产品用于受监管或合同工作流之前联系我们。
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            需要数据删除或导出帮助？
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            请联系 <a href="mailto:19857345237@163.com" className="font-medium text-indigo-600">19857345237@163.com</a>，并附上你的账号邮箱和请求详情。
          </p>
          <Link href="/privacy" className="mt-5 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700">
            阅读隐私政策
          </Link>
        </div>
      </section>
    </div>
  );
}
