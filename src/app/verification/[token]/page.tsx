import { SupplierVerificationTask } from "@/components/quality-cases/SupplierVerificationTask";
export default async function SupplierVerificationPage({ params }: { params: Promise<{ token: string }> }) { return <SupplierVerificationTask token={(await params).token} />; }
