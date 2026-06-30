import { and, desc, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { getAccessibleUserIds } from "@/lib/report-access";
import {
  KNOWLEDGE_SCAN_LIMIT,
  normalizeKnowledgeQuery,
  searchKnowledgeEntries,
  type KnowledgeEntry,
} from "@/lib/report-knowledge";

const QUALITY_CHECK_KNOWLEDGE_CONTEXT_LIMIT = 3;
const MAX_CONTEXT_FIELD_LENGTH = 360;
const MAX_QUERY_SEEDS = 24;

type ReportRow = Pick<
  typeof reports.$inferSelect,
  "id" | "userId" | "title" | "status" | "workflowStatus" | "revision" | "lockedAt" | "reportType" | "priority" | "source" | "data" | "updatedAt" | "createdAt"
>;

export interface QualityCheckKnowledgeContextItem {
  reportId: string;
  title: string;
  trustLabel: string;
  problemSummary: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  lessonsLearned: string | null;
  validation: string | null;
  prevention: string | null;
}

const QUERY_STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "before",
  "between",
  "could",
  "during",
  "from",
  "into",
  "issue",
  "problem",
  "quality",
  "report",
  "should",
  "smoke",
  "that",
  "their",
  "there",
  "this",
  "through",
  "test",
  "under",
  "were",
  "with",
  "without",
]);

function normalizeData(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function compactText(value: string | null) {
  if (!value) return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > MAX_CONTEXT_FIELD_LENGTH
    ? `${text.slice(0, MAX_CONTEXT_FIELD_LENGTH - 1).trim()}...`
    : text;
}

function addSeed(seeds: string[], value: unknown) {
  const seed = normalizeKnowledgeQuery(value);
  if (seed.length >= 2 && !seeds.some((existing) => existing.toLowerCase() === seed.toLowerCase())) {
    seeds.push(seed);
  }
}

function addKeywordSeeds(seeds: string[], value: string) {
  const words = value
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9-]{2,}/g)
    ?.filter((word) => word.length >= 4 && !QUERY_STOPWORDS.has(word)) || [];

  for (const word of words) {
    addSeed(seeds, word);
    if (seeds.length >= MAX_QUERY_SEEDS) return;
  }

  for (let index = 0; index < words.length - 1; index += 1) {
    addSeed(seeds, `${words[index]} ${words[index + 1]}`);
    if (seeds.length >= MAX_QUERY_SEEDS) return;
  }
}

function buildKnowledgeQuerySeeds(report: Pick<ReportRow, "title" | "data">) {
  const data = normalizeData(report.data);
  const sourceValues = [
    report.title,
    data.problemDescription,
    data.productName,
    data.customerName,
    data.confirmedRootCause,
    data.selectedCorrectiveAction,
  ].map(stringValue).filter(Boolean);

  const seeds: string[] = [];
  for (const value of sourceValues) addSeed(seeds, value);
  for (const value of sourceValues) {
    addKeywordSeeds(seeds, value);
    if (seeds.length >= MAX_QUERY_SEEDS) break;
  }

  return seeds.slice(0, MAX_QUERY_SEEDS);
}

function toContextItem(entry: KnowledgeEntry): QualityCheckKnowledgeContextItem {
  return {
    reportId: entry.id,
    title: compactText(entry.title) || "Untitled report",
    trustLabel: entry.trustLabel,
    problemSummary: compactText(entry.problem),
    rootCause: compactText(entry.rootCause),
    correctiveAction: compactText(entry.correctiveAction),
    lessonsLearned: compactText(entry.lessonsLearned),
    validation: compactText(entry.validation),
    prevention: compactText(entry.prevention),
  };
}

export async function buildKnowledgeContextForQualityCheck(
  report: ReportRow,
  user: { id: string },
): Promise<QualityCheckKnowledgeContextItem[]> {
  const accessibleUserIds = await getAccessibleUserIds(user.id);
  const candidateRows = await db
    .select({
      id: reports.id,
      userId: reports.userId,
      title: reports.title,
      status: reports.status,
      workflowStatus: reports.workflowStatus,
      revision: reports.revision,
      lockedAt: reports.lockedAt,
      reportType: reports.reportType,
      priority: reports.priority,
      source: reports.source,
      data: reports.data,
      createdAt: reports.createdAt,
      updatedAt: reports.updatedAt,
    })
    .from(reports)
    .where(and(inArray(reports.userId, accessibleUserIds), ne(reports.id, report.id)))
    .orderBy(desc(reports.updatedAt))
    .limit(KNOWLEDGE_SCAN_LIMIT);

  const rows = candidateRows.filter((candidate) => candidate.id !== report.id);
  const seeds = buildKnowledgeQuerySeeds(report);
  const byId = new Map<string, KnowledgeEntry>();

  for (const seed of seeds) {
    const matches = searchKnowledgeEntries(rows, {
      query: seed,
      filter: "all",
      reportType: "all",
      priority: "all",
      limit: QUALITY_CHECK_KNOWLEDGE_CONTEXT_LIMIT,
    });

    for (const match of matches) {
      if (match.id === report.id || byId.has(match.id)) continue;
      byId.set(match.id, match);
      if (byId.size >= QUALITY_CHECK_KNOWLEDGE_CONTEXT_LIMIT) break;
    }
    if (byId.size >= QUALITY_CHECK_KNOWLEDGE_CONTEXT_LIMIT) break;
  }

  return Array.from(byId.values()).slice(0, QUALITY_CHECK_KNOWLEDGE_CONTEXT_LIMIT).map(toContextItem);
}
