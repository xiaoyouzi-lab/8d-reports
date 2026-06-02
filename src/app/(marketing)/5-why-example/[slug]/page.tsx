import { generateSeoMetadata, generateSeoStaticParams, renderSeoPage } from "@/lib/seo-route";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoStaticParams("5why-example");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoMetadata("5why-example", params);
}

export default function FiveWhyExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoPage("5why-example", params);
}

