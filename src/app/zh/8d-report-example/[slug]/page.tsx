import { generateSeoZhMetadata, generateSeoZhStaticParams, renderSeoZhPage } from "@/lib/seo-route-zh";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoZhStaticParams("8d-example");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoZhMetadata("8d-example", params);
}

export default function ChineseEightDExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoZhPage("8d-example", params);
}
