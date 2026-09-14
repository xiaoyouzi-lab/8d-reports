import { generateSeoZhMetadata, generateSeoZhStaticParams, renderSeoZhPage } from "@/lib/seo-route-zh";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoZhStaticParams("8d-template");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoZhMetadata("8d-template", params);
}

export default function ChineseEightDTemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoZhPage("8d-template", params);
}
