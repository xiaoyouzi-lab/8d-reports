import { generateSeoZhMetadata, generateSeoZhStaticParams, renderSeoZhPage } from "@/lib/seo-route-zh";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoZhStaticParams("preventive-action");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoZhMetadata("preventive-action", params);
}

export default function ChinesePreventiveActionExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoZhPage("preventive-action", params);
}
