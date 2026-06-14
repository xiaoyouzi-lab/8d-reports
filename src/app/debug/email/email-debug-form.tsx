"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SelfTestDebug = {
  route?: string;
  routeVersion?: string;
  providerMessageId?: string | null;
  emailDomain?: string;
  hasResendApiKey?: boolean;
  hasEmailFrom?: boolean;
  vercelEnv?: string;
};

type SelfTestResponse = {
  success?: boolean;
  error?: string;
  debug?: SelfTestDebug;
};

export function EmailDebugForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SelfTestResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/debug/email-self-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      setResult(data || { success: false, error: "Email self-test returned an unreadable response." });
    } catch {
      setResult({ success: false, error: "Email self-test request failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-lg border bg-card p-5 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="email-self-test">Test recipient email</Label>
        <Input
          id="email-self-test"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700">
        {loading ? "Sending..." : "Send test email"}
      </Button>

      {result && (
        <div
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            result.success ? "bg-emerald-50 text-emerald-800" : "bg-destructive/10 text-destructive"
          }`}
        >
          <p className="font-medium">{result.success ? "Self-test sent successfully." : result.error || "Self-test failed."}</p>
          {result.success && (
            <p className="mt-1 text-xs">
              Search the providerMessageId in Resend to confirm which workspace accepted the message.
            </p>
          )}
          {result.debug && (
            <dl className="mt-2 grid gap-1 text-xs">
              {Object.entries(result.debug).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-mono">{String(value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </form>
  );
}
