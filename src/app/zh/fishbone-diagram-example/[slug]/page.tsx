import { generateSeoZhMetadata, generateSeoZhStaticParams, renderSeoZhPage } from "@/lib/seo-route-zh";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoZhStaticParams("fishbone-example");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoZhMetadata("fishbone-example", params);
}

export default function ChineseFishboneDiagramExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoZhPage("fishbone-example", params);
}
