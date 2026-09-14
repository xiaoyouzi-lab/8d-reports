import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContactLeadForm } from "@/components/marketing/ContactLeadForm";

const supportEmail = "19857345237@163.com";

export const metadata: Metadata = {
  title: "联系我们",
  description:
    "就产品问题、账单、账号支持、隐私请求或 8D 工作流反馈联系 8D Reports。",
  alternates: {
    canonical: "https://www.8d-reports.com/zh/contact",
    languages: {
      en: "https://www.8d-reports.com/contact",
      "zh-CN": "https://www.8d-reports.com/zh/contact",
    },
  },
};

export default function ChineseContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          联系 8D Reports
        </h1>
        <p className="mt-3 text-muted-foreground">
          产品问题、账单、账号支持、隐私请求，或关于你的 8D 工作流的反馈。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Mail,
            title: "邮件",
            text: supportEmail,
          },
          {
            icon: MessageSquare,
            title: "反馈",
            text: "使用应用内的反馈按钮提交产品反馈。",
          },
          {
            icon: ShieldCheck,
            title: "隐私",
            text: "数据或账号删除请求也请发送到同一邮箱。",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="pt-6">
              <item.icon className="size-5 text-indigo-600" />
              <h2 className="mt-4 text-sm font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-foreground">
            发送消息
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            使用此表单提交产品问题、账单、账号支持或反馈。你也可以直接发送邮件到{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-700"
            >
              {supportEmail}
            </a>
            。
          </p>
          <div className="mt-6">
            <ContactLeadForm />
          </div>
          <div className="mt-6 border-t pt-4">
            <Link
              href="/zh"
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              返回首页
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
