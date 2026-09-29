import { notFound } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { customTemplateRequests } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/api-helpers";
import { isServiceAdmin, SERVICE_REQUEST_STATUSES } from "@/lib/service-requests";
import { ServiceRequestsAdmin } from "@/components/admin/ServiceRequestsAdmin";
import { getAppTranslator } from "@/lib/app-i18n";

export default async function ServiceRequestsAdminPage() {
  const user = await getSessionUser();
  if (!user || !isServiceAdmin(user.email)) notFound();

  const requests = await db
    .select()
    .from(customTemplateRequests)
    .orderBy(desc(customTemplateRequests.createdAt))
    .limit(100);

  const { t } = await getAppTranslator("admin");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">{t("admin")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t("serviceRequests")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {t("serviceRequestsDesc")}
        </p>
      </div>
      <ServiceRequestsAdmin requests={requests} statuses={SERVICE_REQUEST_STATUSES} />
    </main>
  );
}
