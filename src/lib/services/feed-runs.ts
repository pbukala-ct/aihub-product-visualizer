import { createAdminClient } from "@/lib/supabase-admin";
import type {
  FeedRun,
  FeedRunSummary,
  FeedDiffResult,
  ProductDiffRow,
  DiffStatus,
  ChangedField,
  Source,
  SourceSummary,
  Product,
} from "@/types";

export interface DeltaSummary {
  added: number;
  removed: number;
  changed: number;
}

export interface AnnotatedDeltaRun extends FeedRunSummary {
  summary: DeltaSummary;
}

export async function getSourceBySlug(slug: string): Promise<Source | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("sources").select("*").eq("slug", slug).single();
  return data ?? null;
}

export async function getAllSources(): Promise<SourceSummary[]> {
  const supabase = createAdminClient();
  const { data: sources } = await supabase.from("sources").select("*").order("created_at", { ascending: true });

  if (!sources?.length) return [];

  // Fetch latest run per source
  const results: SourceSummary[] = await Promise.all(
    sources.map(async (source) => {
      const { data: run } = await supabase
        .from("feed_runs")
        .select("id, received_at, type, product_count, source_id, created_at")
        .eq("source_id", source.id)
        .order("received_at", { ascending: false })
        .limit(1)
        .single();

      return { ...source, latest_run: (run as FeedRunSummary) ?? null };
    })
  );

  return results;
}

export async function getLatestFullFeedRun(sourceId: string): Promise<FeedRun | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("feed_runs")
    .select("*, products(*)")
    .eq("source_id", sourceId)
    .eq("type", "full")
    .order("received_at", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

export async function getDeltaRunsSince(sourceId: string, afterTimestamp: string): Promise<FeedRun[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("feed_runs")
    .select("*, products(*)")
    .eq("source_id", sourceId)
    .eq("type", "delta")
    .gt("received_at", afterTimestamp)
    .order("received_at", { ascending: true });
  return (data ?? []) as FeedRun[];
}

export function computeDeltaSummary(fullRunProducts: Product[], deltaRunProducts: Product[]): DeltaSummary {
  const baseMap = new Map(fullRunProducts.map((p) => [p.item_id ?? p.id, p]));
  const headMap = new Map(deltaRunProducts.map((p) => [p.item_id ?? p.id, p]));
  const allKeys = new Set([...baseMap.keys(), ...headMap.keys()]);

  let added = 0;
  let removed = 0;
  let changed = 0;

  for (const key of allKeys) {
    const base = baseMap.get(key);
    const head = headMap.get(key);

    if (!base) {
      added++;
    } else if (!head) {
      removed++;
    } else {
      const baseAttrs = base.attributes ?? {};
      const headAttrs = head.attributes ?? {};
      const allFields = new Set([...Object.keys(baseAttrs), ...Object.keys(headAttrs)]);
      const hasChange = [...allFields].some((f) => (baseAttrs[f] ?? "") !== (headAttrs[f] ?? ""));
      if (hasChange) changed++;
    }
  }

  return { added, removed, changed };
}

export async function getLatestFeedRun(sourceId?: string): Promise<FeedRun | null> {
  const supabase = createAdminClient();
  let query = supabase.from("feed_runs").select("*, products(*)").order("received_at", { ascending: false }).limit(1);

  if (sourceId) query = query.eq("source_id", sourceId);

  const { data } = await query.single();
  return data ?? null;
}

export async function getFeedRunById(id: string): Promise<FeedRun | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("feed_runs").select("*, products(*)").eq("id", id).single();
  return data ?? null;
}

export async function getAllFeedRuns(sourceId?: string): Promise<FeedRunSummary[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("feed_runs")
    .select("id, received_at, type, product_count, source_id, created_at, sources(slug, display_name)")
    .order("received_at", { ascending: false });

  if (sourceId) query = query.eq("source_id", sourceId);

  const { data } = await query;
  return (data ?? []) as FeedRunSummary[];
}

export async function getRunsBySource(sourceId: string): Promise<FeedRunSummary[]> {
  return getAllFeedRuns(sourceId);
}

export async function diffFeedRuns(baseId: string, headId: string): Promise<FeedDiffResult | null> {
  const [base, head] = await Promise.all([getFeedRunById(baseId), getFeedRunById(headId)]);
  if (!base || !head) return null;

  const baseMap = new Map(base.products.map((p) => [p.item_id ?? p.id, p]));
  const headMap = new Map(head.products.map((p) => [p.item_id ?? p.id, p]));

  const allKeys = new Set([...baseMap.keys(), ...headMap.keys()]);
  const rows: ProductDiffRow[] = [];
  const summary: Record<DiffStatus, number> = { added: 0, removed: 0, changed: 0, unchanged: 0 };

  for (const key of allKeys) {
    const baseProduct = baseMap.get(key);
    const headProduct = headMap.get(key);

    if (!baseProduct) {
      rows.push({ item_id: key, title: headProduct?.title ?? null, status: "added", changedFields: [] });
      summary.added++;
    } else if (!headProduct) {
      rows.push({ item_id: key, title: baseProduct.title, status: "removed", changedFields: [] });
      summary.removed++;
    } else {
      const baseAttrs = baseProduct.attributes ?? {};
      const headAttrs = headProduct.attributes ?? {};
      const allFields = new Set([...Object.keys(baseAttrs), ...Object.keys(headAttrs)]);
      const changedFields: ChangedField[] = [];

      for (const field of allFields) {
        const oldValue = baseAttrs[field] ?? "";
        const newValue = headAttrs[field] ?? "";
        if (oldValue !== newValue) {
          changedFields.push({ field, oldValue, newValue });
        }
      }

      if (changedFields.length > 0) {
        rows.push({ item_id: key, title: headProduct.title, status: "changed", changedFields });
        summary.changed++;
      } else {
        rows.push({ item_id: key, title: headProduct.title, status: "unchanged", changedFields: [] });
        summary.unchanged++;
      }
    }
  }

  const order: DiffStatus[] = ["added", "removed", "changed", "unchanged"];
  rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return { base, head, summary, rows };
}
