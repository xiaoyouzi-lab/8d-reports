import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { P0PlusPreviewPageContent } from "@/components/p0-plus/P0PlusPreviewContent";
import { isP0PlusPreviewEnabled } from "@/lib/p0-plus/config";
import { getP0PlusPreview } from "@/lib/p0-plus/preview-service";
import { validateP0PlusPreviewResponse } from "@/lib/p0-plus/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "8D Draft Preview",
  description: "Read-only P0+ 8D draft and readiness preview.",
  robots: { index: false, follow: false },
};

export default async function P0PlusPreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  if (!isP0PlusPreviewEnabled()) notFound();

  const { token } = await params;
  const result = await getP0PlusPreview({ token });
  if (result.status !== 200) notFound();

  const validation = validateP0PlusPreviewResponse(result.body.preview);
  if (!validation.success || !validation.data) notFound();

  return (
    <P0PlusPreviewPageContent
      preview={validation.data}
      tokenExpiresAt={String(result.body.tokenExpiresAt || "")}
      outputLanguage={String(result.body.outputLanguage || "en")}
    />
  );
}
