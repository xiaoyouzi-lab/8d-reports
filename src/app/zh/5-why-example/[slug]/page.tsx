import { generateSeoZhMetadata, generateSeoZhStaticParams, renderSeoZhPage } from "@/lib/seo-route-zh";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoZhStaticParams("5why-example");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoZhMetadata("5why-example", params);
}

export default function ChineseFiveWhyExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoZhPage("5why-example", params);
}
