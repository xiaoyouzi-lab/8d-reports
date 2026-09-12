import { Suspense } from "react";
import AcceptInviteForm from "./accept-invite-form";

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
