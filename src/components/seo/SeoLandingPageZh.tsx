import Link from "next/link";
import { ClipboardCheck, FileText, Paperclip, Search, ShieldCheck } from "lucide-react";
import type { SeoPage } from "@/content/seo-pages";
import { getRelatedSeoPagesZh } from "@/content/seo-pages-zh";
import { SeoPageViewTracker, SeoPrimaryCta, SeoTemplateCta } from "./SeoTracking";

const baseUrl = "https://www.8d-reports.com";

function displayPath(slug: string) {
  return `/zh/${slug}`;
}

function pageTypeLabel(page: SeoPage) {
  switch (page.type) {
    case "8d-example":
      return "完整8D示例";
    case "8d-template":
      return "模板指引";
    case "5why-example":
      return "5Why链";
    case "fishbone-example":
      return "鱼骨图分析";
    case "corrective-action":
      return "纠正措施计划";
    case "preventive-action":
      return "预防措施计划";
  }
}

function buildJsonLd(page: SeoPage) {
  const pageUrl = `${baseUrl}/zh/${page.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: page.h1,
        description: page.metaDescription,
        inLanguage: "zh-CN",
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        author: {
          "@type": "Organization",
          name: "8D Reports",
          url: baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "8D Reports",
          url: baseUrl,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

function evidenceForStep(page: SeoPage, step: string) {
  switch (step) {
    case "D0":
      return `案例开启记录、范围清单、${page.professional.affectedScope}`;
    case "D1":
      return "团队名册、角色、联系人清单、复核人分配";
    case "D2":
      return `${page.professional.detection}；量化为${page.professional.metric}`;
    case "D3":
      return "遏制记录、冻结库存清单、分选记录、客户通知";
    case "D4":
      return `5Why、鱼骨图、过程证据、逃逸点：${page.professional.escapePoint}`;
    case "D5":
      return "已批准的行动计划、更新后的程序、放行门变更";
    case "D6":
      return page.professional.verification;
    case "D7":
      return "控制计划更新、分层审核、经验教训、再发监控";
    case "D8":
      return "关闭审批、客户确认、最终导出的报告包";
    default:
      return "步骤对应的支持证据";
  }
}

function ownerForStep(step: string) {
  switch (step) {
    case "D0":
    case "D2":
    case "D8":
      return "质量工程师";
    case "D1":
      return "质量经理";
    case "D3":
      return "生产/SQE责任人";
    case "D4":
      return "跨职能团队";
    case "D5":
    case "D6":
      return "流程责任人";
    case "D7":
      return "质量体系责任人";
    default:
      return "质量团队";
  }
}

export function SeoLandingPageZh({ page }: { page: SeoPage }) {
  const relatedPages = getRelatedSeoPagesZh(page);
  const jsonLd = buildJsonLd(page);

  return (
    <div className="bg-white text-slate-950">
      <SeoPageViewTracker page={page} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              {page.industry || "8D Reports"} / {page.problemType || page.type}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {page.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <SeoPrimaryCta page={page} label="免费创建8D报告" />
              <Link
                href="/zh/resources"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-50"
              >
                浏览资源
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-xs font-medium text-slate-500">完整报告快照</p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  {page.example?.problemDescription || page.title}
                </p>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["编号", "报告编号", "8D-2026-014"],
                  ["范围", "影响范围", page.professional.affectedScope],
                  ["风险", "客户影响", page.professional.customerImpact],
                  ["验证", "关闭证据", page.professional.verification],
                ].map(([step, label, text]) => (
                  <div key={step} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                        {step}
                      </span>
                      <span className="text-sm font-semibold text-slate-950">{label}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              为实际质量工作而设计
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              这些页面面向需要证据、责任、验证，以及能够导出或分享而无需每次重建模板的质量团队。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "结构化报告",
                text: "D0-D8分区让调查清晰可读。",
              },
              {
                icon: ShieldCheck,
                title: "证据已附件",
                text: "照片与文件绑定到相关步骤。",
              },
              {
                icon: Search,
                title: "知识库复用",
                text: "检索类似历史问题，减少从零开始。",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 p-5">
                <item.icon className="h-5 w-5 text-indigo-600" />
                <h3 className="mt-4 text-base font-semibold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              本场景的示例内容
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              措辞应具体到能够支撑一次真实的纠正措施评审，而不只是通用模板标题。
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {page.sections.map((section) => (
              <article key={section.heading} className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  {section.heading}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              如何使用本页
            </h2>
            <div className="mt-6 space-y-4">
              {[
                "用产品、批次、时间、客户影响和可量化的缺陷证据描述问题。",
                "加入在永久纠正完成前保护客户的遏制措施。",
                "使用5Why、鱼骨图、过程证据和逃逸原因复核来分析根本原因。",
                "定义纠正和预防措施，明确责任人、截止日期和验证方法。",
                "导出或分享报告，让复核人同时看到叙述和支持性附件。",
              ].map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-mono text-xs font-semibold text-indigo-700">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              免费创建第一份报告
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              免费版包含3份终身报告和完整编辑器。当无水印导出、Word导出、公司Logo、可编辑分享或深度历史检索变得有价值时，可随时升级。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <SeoPrimaryCta page={page} label="创建你的8D报告" />
              <SeoTemplateCta page={page} label="使用此模板" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              完整8D样例
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              一份完整报告示例，而不是只有标题的模板
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              真正的8D不只是D步骤标签。本示例包含报告元数据、D0-D8内容、责任人、证据、遏制、根本原因、纠正措施、预防控制、验证和关闭预期。
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid bg-slate-50 text-sm md:grid-cols-4">
              {[
                ["报告编号", "8D-2026-014"],
                ["报告类型", page.type === "8d-template" ? "模板化8D" : "客户可用8D"],
                ["状态", "已完成样例"],
                ["评审级别", "客户/SQE评审"],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-200 p-4 md:border-r md:last:border-r-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 font-medium text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-200">
              {page.professional.eightD.map((item) => (
                <article
                  key={item.step}
                  className="grid gap-4 bg-white p-5 lg:grid-cols-[72px_1fr_180px_1.1fr]"
                >
                  <div>
                    <span className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.content}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      责任人
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {ownerForStep(item.step)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      所需证据
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {evidenceForStep(page, item.step)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-950">
                  需要准备的附件包
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                复核人应能打开导出的文件包，看到结论背后的证据。对于本案例，请附上：
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                {[
                  page.professional.detection,
                  page.professional.metric,
                  page.example?.containmentAction || "遏制记录和疑似库存清单",
                  page.professional.verification,
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-950">
                  关闭检查清单
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                在报告中能看到以下内容之前，不要关闭8D：
              </p>
              <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                {[
                  "问题已用量化的日期、批次、产品和风险描述。",
                  "遏制措施同时保护客户和内部库存。",
                  "发生原因和逃逸点都已解释清楚。",
                  "纠正措施消除已验证的流程原因。",
                  "验证证据证明修复有效。",
                  "预防已加入控制系统，而不只是写在报告里。",
                ].map((item) => (
                  <div key={item} className="rounded-md bg-white p-3 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              专业质量细节
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              质量复核人期望看到的证据
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              这份{pageTypeLabel(page)}
              包含了可量化范围、检测方法、逃逸点、客户风险和验证准则，这些通常决定了8D是被接受还是被退回返工。
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["影响范围", page.professional.affectedScope],
              ["量化证据", page.professional.metric],
              ["检测方法", page.professional.detection],
              ["逃逸点", page.professional.escapePoint],
              ["客户影响", page.professional.customerImpact],
              ["验证准则", page.professional.verification],
            ].map(([label, text]) => (
              <article key={label} className="rounded-lg border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              D0-D8示例措辞
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              专业的8D应将遏制与永久纠正分开，同时展示根本原因和逃逸点，并且只在验证证据附上后才关闭。
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {page.professional.eightD.map((item) => (
              <article key={item.step} className="rounded-lg bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                    {item.step}
                  </span>
                  <h3 className="text-base font-semibold text-slate-950">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.content}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {(page.type === "5why-example" || page.type === "8d-example") && (
        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                5Why链
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                下面的逻辑链让推理可见，避免从症状直接跳到措施，而不说明所选纠正为何针对真正的流程薄弱点。
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
              {page.professional.fiveWhy.map((item, index) => (
                <article
                  key={item.why}
                  className="grid gap-3 border-b border-slate-200 bg-white p-5 last:border-b-0 md:grid-cols-[160px_1fr]"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-indigo-700">
                      为什么 {index + 1}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-950">
                      {item.why}
                    </h3>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {(page.type === "fishbone-example" || page.type === "8d-example") && (
        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                鱼骨图6M分析
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                鱼骨图页面不应只展示最终根本原因。以下6M提示帮助团队在锁定8D结论前检查相互竞争的成因。
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {page.professional.fishbone.map((item) => (
                <article key={item.category} className="rounded-lg border border-slate-200 p-5">
                  <h3 className="text-base font-semibold text-slate-950">
                    {item.category}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.possibleCause}
                  </p>
                  <p className="mt-3 rounded bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                    检查：{item.check}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {(page.type === "corrective-action" ||
        page.type === "preventive-action" ||
        page.type === "8d-template") && (
        <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                措施责任与有效性检查
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                纠正和预防措施需要责任人、截止日期和证据。否则报告只是一份意向声明。
              </p>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-50 px-5 py-3">
                  <h3 className="text-base font-semibold text-slate-950">
                    纠正措施计划
                  </h3>
                </div>
                {page.professional.actionPlan.map((item) => (
                  <article key={item.action} className="border-t border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-950">
                      {item.action}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-3">
                      <p>责任人：{item.owner}</p>
                      <p>截止：{item.due}</p>
                      <p>验证：{item.verification}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-50 px-5 py-3">
                  <h3 className="text-base font-semibold text-slate-950">
                    预防控制
                  </h3>
                </div>
                {page.professional.preventionPlan.map((item) => (
                  <article key={item.control} className="border-t border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-950">
                      {item.control}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-3">
                      <p>频率：{item.frequency}</p>
                      <p>责任人：{item.owner}</p>
                      <p>证据：{item.evidence}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            常见问题
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {page.faqs.map((item) => (
              <article key={item.question} className="rounded-lg bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-950">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                相关资源
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                继续查看相关示例、模板、根本原因页面和措施页面，让本页不是孤立的SEO入口。
              </p>
            </div>
            <Link href="/zh/sample-report" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">
              查看完整示例报告
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedPages.map((related) => (
              <Link
                key={related.slug}
                href={`/zh/${related.slug}`}
                className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                  {displayPath(related.slug)}
                </p>
                <h3 className="mt-3 text-base font-semibold text-slate-950">
                  {related.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {related.metaDescription}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              把这份示例变成你自己的8D报告。
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              使用结构化编辑器，附上证据，然后导出或分享一份客户可以评审的报告。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SeoPrimaryCta page={page} label="创建你的8D报告" />
            <SeoTemplateCta page={page} label="使用此模板" />
          </div>
        </div>
      </section>
    </div>
  );
}
