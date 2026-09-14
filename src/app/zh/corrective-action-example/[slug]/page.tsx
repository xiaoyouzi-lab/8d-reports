import { generateSeoZhMetadata, generateSeoZhStaticParams, renderSeoZhPage } from "@/lib/seo-route-zh";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoZhStaticParams("corrective-action");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoZhMetadata("corrective-action", params);
}

export default function ChineseCorrectiveActionExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoZhPage("corrective-action", params);
}
