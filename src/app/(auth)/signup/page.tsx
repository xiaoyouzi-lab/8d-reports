import { Suspense } from "react";
import SignupPage from "./signup-form";

export default function SignupPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
      <SignupPage />
    </Suspense>
  );
}
