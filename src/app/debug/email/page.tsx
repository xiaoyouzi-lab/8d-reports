import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailDebugForm } from "./email-debug-form";
import { getEmailDebugConfig, isEmailDebugAvailable } from "@/lib/email-debug";

export const dynamic = "force-dynamic";

function getOrigin(host: string, protocol: string) {
  return host ? `${protocol}://${host}` : "unknown";
}

export default async function EmailDebugPage() {
  if (!isEmailDebugAvailable()) {
    notFound();
  }

  const headerList = await headers();
  const host = headerList.get("host") || "unknown";
  const protocol = headerList.get("x-forwarded-proto") || "https";
  const config = getEmailDebugConfig();
  const diagnostics = {
    routeVersion: config.routeVersion,
    commitSha: config.commitSha,
    vercelEnv: config.vercelEnv,
    host,
    origin: getOrigin(host, protocol),
    hasResendApiKey: config.hasResendApiKey,
    hasEmailFrom: config.hasEmailFrom,
    hasBetterAuthUrl: config.hasBetterAuthUrl,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium text-indigo-600">Preview/local diagnostics</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Email delivery debug</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This temporary page confirms which deployment is running and whether the server can send a direct Resend test email.
          It does not show secrets, OTP codes, or full email logs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Safe deployment diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            {Object.entries(diagnostics).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 border-b pb-2 last:border-b-0">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="break-all text-right font-mono">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <EmailDebugForm />

      <Card className="mt-6">
        <CardContent className="pt-6 text-sm leading-6 text-muted-foreground">
          <p>
            If the self-test succeeds, Resend should show a new record for this time window. If signup still has no Resend
            record after that, the signup page is likely stale or not calling the wrapper route.
          </p>
          <p className="mt-3">
            If the self-test fails, check Preview runtime configuration, sender domain verification, and Resend provider status.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
