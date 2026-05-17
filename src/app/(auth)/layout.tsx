import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB] px-4 py-8">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">
          8D
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          8D Reports
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
