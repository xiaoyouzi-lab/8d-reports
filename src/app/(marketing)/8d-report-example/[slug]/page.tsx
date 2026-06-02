import { generateSeoMetadata, generateSeoStaticParams, renderSeoPage } from "@/lib/seo-route";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoStaticParams("8d-example");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoMetadata("8d-example", params);
}

export default function EightDExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoPage("8d-example", params);
}

