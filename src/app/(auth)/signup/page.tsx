import { Suspense } from "react";
import SignupPage from "./signup-form";
import { getEmailDebugConfig, isEmailDebugAvailable } from "@/lib/email-debug";

export default function SignupPageWrapper() {
  const previewDebug = isEmailDebugAvailable()
    ? { commitSha: getEmailDebugConfig().commitSha }
    : undefined;

  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
      <SignupPage previewDebug={previewDebug} />
    </Suspense>
  );
}
