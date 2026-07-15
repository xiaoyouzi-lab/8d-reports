import { ExternalTaskPage } from "@/components/quality-cases/ExternalTaskPage";
export default async function SupplierTaskPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <ExternalTaskPage token={token} view="supplier" />; }
