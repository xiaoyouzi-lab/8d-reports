"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function CheckoutButton({
  planType,
  className,
  children,
  variant = "default",
  size = "lg",
}: {
  planType: "monthly" | "yearly";
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs";
}) {
  const [loading, setLoading] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleClick = async () => {
    if (loading) return
    setLoading(true);
    try {
      if (!session?.user && !isPending) {
        router.push(`/signup?plan=pro&billing=${planType}`);
        return;
      }
      if (isPending) {
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Checkout failed");
      }

      const session_data = await res.json();
      if (session_data.checkout_url) {
        window.location.href = session_data.checkout_url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
