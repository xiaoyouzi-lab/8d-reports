import { QualityCaseDetail } from "@/components/quality-cases/QualityCaseDetail";

export default async function QualityCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QualityCaseDetail caseId={id} />;
}
