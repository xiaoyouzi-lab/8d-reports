import { generateSeoMetadata, generateSeoStaticParams, renderSeoPage } from "@/lib/seo-route";

export const dynamicParams = false;

export function generateStaticParams() {
  return generateSeoStaticParams("8d-template");
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateSeoMetadata("8d-template", params);
}

export default function EightDTemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  return renderSeoPage("8d-template", params);
}

