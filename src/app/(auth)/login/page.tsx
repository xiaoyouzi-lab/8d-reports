import { Suspense } from "react";
import LoginPage from "./login-form";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
