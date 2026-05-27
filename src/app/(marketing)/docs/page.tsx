import { getTranslations } from "next-intl/server"
import Link from "next/link"

export default async function DocsPage() {
  const t = await getTranslations({ locale: "en", namespace: "docs" })

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("version")} · {t("lastUpdated")}
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-12">
        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("section1.title")}</h2>
          <p>{t("section1.intro")}</p>
          <h3 className="text-lg font-medium mt-4">{t("section1.scenariosTitle")}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("section1.scenario1")}</li>
            <li>{t("section1.scenario2")}</li>
            <li>{t("section1.scenario3")}</li>
            <li>{t("section1.scenario4")}</li>
          </ul>
          <h3 className="text-lg font-medium mt-4">{t("section1.requirementsTitle")}</h3>
          <p>{t("section1.requirements")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("section2.title")}</h2>

          <h3 className="text-lg font-medium mt-4">{t("section2.signupTitle")}</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li><Link href="/login" className="text-indigo-600 hover:underline">{t("section2.signupLink")}</Link></li>
            <li>{t("section2.signupStep2")}</li>
            <li>{t("section2.signupStep3")}</li>
            <li>{t("section2.signupStep4")}</li>
            <li>{t("section2.signupStep5")}</li>
          </ol>

          <h3 className="text-lg font-medium mt-4">{t("section2.createTitle")}</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>{t("section2.createStep1")}</li>
            <li>{t("section2.createStep2")}</li>
            <li>{t("section2.createStep3")}</li>
            <li>{t("section2.createStep4")}</li>
          </ol>

          <h3 className="text-lg font-medium mt-4">{t("section2.typesTitle")}</h3>
          <table className="w-full border-collapse border text-sm mt-2">
            <thead>
              <tr className="bg-muted">
                <th className="border px-3 py-2 text-left">{t("section2.tableType")}</th>
                <th className="border px-3 py-2 text-left">{t("section2.tableScenario")}</th>
                <th className="border px-3 py-2 text-left">{t("section2.tableFlow")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2 font-medium">{t("section2.typeCustomer")}</td>
                <td className="border px-3 py-2">{t("section2.typeCustomerDesc")}</td>
                <td className="border px-3 py-2">{t("section2.typeCustomerFlow")}</td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-medium">{t("section2.typeInternal")}</td>
                <td className="border px-3 py-2">{t("section2.typeInternalDesc")}</td>
                <td className="border px-3 py-2">{t("section2.typeInternalFlow")}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("section3.title")}</h2>

          <h3 className="text-lg font-medium mt-4">{t("section3.navTitle")}</h3>
          <p>{t("section3.navDesc")}</p>

          <h3 className="text-lg font-medium mt-4">{t("section3.stepsTitle")}</h3>
          <table className="w-full border-collapse border text-sm mt-2">
            <thead>
              <tr className="bg-muted">
                <th className="border px-3 py-2 text-left w-20">{t("section3.tableStep")}</th>
                <th className="border px-3 py-2 text-left">{t("section3.tableName")}</th>
                <th className="border px-3 py-2 text-left">{t("section3.tableFields")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "D0", name: t("step.D0.name"), fields: t("step.D0.fields") },
                { id: "D1", name: t("step.D1.name"), fields: t("step.D1.fields") },
                { id: "D2", name: t("step.D2.name"), fields: t("step.D2.fields") },
                { id: "D3", name: t("step.D3.name"), fields: t("step.D3.fields") },
                { id: "D4", name: t("step.D4.name"), fields: t("step.D4.fields") },
                { id: "D5", name: t("step.D5.name"), fields: t("step.D5.fields") },
                { id: "D6", name: t("step.D6.name"), fields: t("step.D6.fields") },
                { id: "D7", name: t("step.D7.name"), fields: t("step.D7.fields") },
                { id: "D8", name: t("step.D8.name"), fields: t("step.D8.fields") },
              ].map((step) => (
                <tr key={step.id}>
                  <td className="border px-3 py-2 font-medium">{step.id}</td>
                  <td className="border px-3 py-2">{step.name}</td>
                  <td className="border px-3 py-2">{step.fields}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-lg font-medium mt-4">{t("section3.attachmentTitle")}</h3>
          <p>{t("section3.attachmentDesc")}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{t("section3.photoBtn")}</strong></li>
            <li><strong>{t("section3.libraryBtn")}</strong></li>
            <li><strong>{t("section3.fileBtn")}</strong></li>
          </ul>
          <p className="text-sm text-muted-foreground">{t("section3.attachmentLimit")}</p>
          <h4 className="font-medium mt-2">{t("section3.previewTitle")}</h4>
          <p>{t("section3.previewDesc")}</p>

          <h3 className="text-lg font-medium mt-4">{t("section3.saveTitle")}</h3>
          <p>{t("section3.saveDesc")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("section4.title")}</h2>

          <h3 className="text-lg font-medium mt-4">{t("section4.exportTitle")}</h3>
          <p>{t("section4.exportIntro")}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>PDF:</strong> {t("section4.pdfDesc")}</li>
            <li><strong>Word:</strong> {t("section4.wordDesc")}</li>
            <li><strong>{t("section4.attachment")}</strong></li>
          </ul>
          <p className="text-sm text-muted-foreground">{t("section4.watermarkNote")}</p>

          <h3 className="text-lg font-medium mt-4">{t("section4.shareTitle")}</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>{t("section4.shareStep1")}</li>
            <li>{t("section4.shareStep2")}</li>
            <li>{t("section4.shareStep3")}</li>
            <li>{t("section4.shareStep4")}</li>
            <li>{t("section4.shareStep5")}</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("section5.title")}</h2>
          <p>{t("section5.intro")}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("section5.item1")}</li>
            <li>{t("section5.item2")}</li>
            <li>{t("section5.item3")}</li>
            <li>{t("section5.item4")}</li>
            <li>{t("section5.item5")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("section6.title")}</h2>

          <h3 className="text-lg font-medium mt-4">{t("section6.comparisonTitle")}</h3>
          <table className="w-full border-collapse border text-sm mt-2">
            <thead>
              <tr className="bg-muted">
                <th className="border px-3 py-2 text-left">{t("section6.tableFeature")}</th>
                <th className="border px-3 py-2 text-center">Free</th>
                <th className="border px-3 py-2 text-center">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                { f: t("section6.rowReports"), free: t("section6.free5"), pro: t("section6.unlimited") },
                { f: t("section6.rowWorkflow"), free: "✓", pro: "✓" },
                { f: t("section6.rowPdf"), free: t("section6.withWatermark"), pro: t("section6.noWatermark") },
                { f: t("section6.rowWord"), free: t("section6.withWatermark"), pro: t("section6.noWatermark") },
                { f: t("section6.rowAttach"), free: "✓", pro: "✓" },
                { f: t("section6.rowAi"), free: "✓", pro: "✓" },
                { f: t("section6.rowAudit"), free: "—", pro: "✓" },
                { f: t("section6.rowSupport"), free: "—", pro: "✓" },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="border px-3 py-2">{row.f}</td>
                  <td className="border px-3 py-2 text-center">{row.free}</td>
                  <td className="border px-3 py-2 text-center">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-lg font-medium mt-4">{t("section6.upgradeTitle")}</h3>
          <p><Link href="/pricing" className="text-indigo-600 hover:underline">{t("section6.upgradeLink")}</Link></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("section7.title")}</h2>
          <dl className="space-y-4">
            {["q1", "q2", "q3", "q4", "q5"].map((key) => (
              <div key={key}>
                <dt className="font-medium">{t(`section7.${key}Q`)}</dt>
                <dd className="text-muted-foreground mt-1">{t(`section7.${key}A`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-12 border-t pt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </div>
  )
}
