import Link from "next/link"
import type { ReactNode } from "react"
import { ExternalLink, Image as ImageIcon, Video } from "lucide-react"
import { cn } from "@/lib/utils"

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (!match) return part
    const [, label, href] = match
    const isExternal = href.startsWith("http://") || href.startsWith("https://")
    if (isExternal) {
      return (
        <a
          key={`${href}-${index}`}
          href={href}
          className="font-medium text-indigo-700 underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {label}
        </a>
      )
    }
    return (
      <Link
        key={`${href}-${index}`}
        href={href}
        className="font-medium text-indigo-700 underline-offset-4 hover:underline"
      >
        {label}
      </Link>
    )
  })
}

function renderBlock(block: string, index: number) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) return null
  const first = lines[0]

  if (first.startsWith("## ")) {
    const title = first.replace(/^##\s+/, "")
    return (
      <h2
        key={`${title}-${index}`}
        id={slugify(title)}
        className="scroll-mt-24 text-2xl font-semibold tracking-tight text-slate-950"
      >
        {title}
      </h2>
    )
  }

  if (first.startsWith("### ")) {
    const title = first.replace(/^###\s+/, "")
    return (
      <h3 key={`${title}-${index}`} className="text-lg font-semibold text-slate-950">
        {title}
      </h3>
    )
  }

  if (lines.every((line) => line.startsWith("- "))) {
    return (
      <ul key={`ul-${index}`} className="space-y-2 text-base leading-7 text-slate-700">
        {lines.map((line) => (
          <li key={line} className="flex gap-3">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            <span>{renderInline(line.replace(/^-\s+/, ""))}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return (
      <ol key={`ol-${index}`} className="space-y-3 text-base leading-7 text-slate-700">
        {lines.map((line) => {
          const item = line.replace(/^\d+\.\s+/, "")
          return (
            <li key={line} className="grid gap-3 sm:grid-cols-[32px_1fr]">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 font-mono text-xs font-semibold text-indigo-700">
                {line.match(/^\d+/)?.[0]}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <p key={`p-${index}`} className="text-base leading-8 text-slate-700">
      {renderInline(lines.join(" "))}
    </p>
  )
}

export function MarkdownArticleBody({ body }: { body: string }) {
  return (
    <div className="space-y-7">
      {body
        .split(/\n{2,}/)
        .map((block, index) => renderBlock(block, index))}
    </div>
  )
}

export function ArticleMediaReferences({
  screenshots,
  videos,
  className,
}: {
  screenshots: string[]
  videos: string[]
  className?: string
}) {
  if (screenshots.length === 0 && videos.length === 0) return null

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-slate-50 p-5", className)}>
      <h2 className="text-base font-semibold text-slate-950">Screenshot or video reference</h2>
      <div className="mt-4 grid gap-3">
        {screenshots.map((src) => (
          <a
            key={src}
            href={src}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-indigo-700 hover:ring-indigo-200"
          >
            <ImageIcon className="h-4 w-4 text-indigo-600" />
            {src}
            <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-400" />
          </a>
        ))}
        {videos.map((src) => (
          <a
            key={src}
            href={src}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-indigo-700 hover:ring-indigo-200"
          >
            <Video className="h-4 w-4 text-indigo-600" />
            {src}
            <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-400" />
          </a>
        ))}
      </div>
    </div>
  )
}
