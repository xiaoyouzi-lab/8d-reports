import { ExternalTaskPage } from "@/components/quality-cases/ExternalTaskPage";
export default async function CustomerReviewPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <ExternalTaskPage token={token} view="customer" />; }
