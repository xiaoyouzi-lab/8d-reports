import { generateSeoMetadata, generateSeoStaticParams, renderSeoPage } from "@/lib/seo-route";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoStaticParams("fishbone-example");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoMetadata("fishbone-example", params);
}

export default function FishboneDiagramExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoPage("fishbone-example", params);
}

