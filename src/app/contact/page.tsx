import Link from "next/link"
import { Mail, MessageSquare, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const supportEmail = "support@8d-reports.com"

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Contact 8D Reports
        </h1>
        <p className="mt-3 text-muted-foreground">
          For product questions, billing, account support, privacy requests, or
          feedback about your 8D workflow.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Mail,
            title: "Email",
            text: supportEmail,
          },
          {
            icon: MessageSquare,
            title: "Feedback",
            text: "Send product feedback from the in-app feedback button.",
          },
          {
            icon: ShieldCheck,
            title: "Privacy",
            text: "Use the same address for data or account deletion requests.",
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
            Support email
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            You can reach us at{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-700"
            >
              {supportEmail}
            </a>
            . If your browser does not open an email app, use this address
            directly from your mailbox.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
