import { generateSeoMetadata, generateSeoStaticParams, renderSeoPage } from "@/lib/seo-route";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoStaticParams("preventive-action");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoMetadata("preventive-action", params);
}

export default function PreventiveActionExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoPage("preventive-action", params);
}

