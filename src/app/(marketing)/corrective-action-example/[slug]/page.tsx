import { generateSeoMetadata, generateSeoStaticParams, renderSeoPage } from "@/lib/seo-route";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoStaticParams("corrective-action");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoMetadata("corrective-action", params);
}

export default function CorrectiveActionExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoPage("corrective-action", params);
}

