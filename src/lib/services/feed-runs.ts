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

  const results: SourceSummary[] = await Promise.all(
    sources.map(async (source) => {
      const [{ data: latestRun }, { data: latestFullRun }] = await Promise.all([
        supabase
          .from("feed_runs")
          .select("id, received_at, type, product_count, source_id, created_at")
          .eq("source_id", source.id)
          .order("received_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("feed_runs")
          .select("id, received_at, type, product_count, source_id, created_at")
          .eq("source_id", source.id)
          .eq("type", "full")
          .order("received_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

      let delta_run_count = 0;
      if (latestFullRun) {
        const { count } = await supabase
          .from("feed_runs")
          .select("id", { count: "exact", head: true })
          .eq("source_id", source.id)
          .eq("type", "delta")
          .gt("received_at", latestFullRun.received_at);
        delta_run_count = count ?? 0;
      }

      return {
        ...source,
        latest_run: (latestRun as FeedRunSummary) ?? null,
        latest_full_run: (latestFullRun as FeedRunSummary) ?? null,
        delta_run_count,
      };
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

  let added = 0;
  let changed = 0;

  for (const deltaProduct of deltaRunProducts) {
    const key = deltaProduct.item_id ?? deltaProduct.id;
    const base = baseMap.get(key);

    if (!base) {
      added++;
    } else {
      const baseAttrs = base.attributes ?? {};
      const headAttrs = deltaProduct.attributes ?? {};
      const allFields = new Set([...Object.keys(baseAttrs), ...Object.keys(headAttrs)]);
      const hasChange = [...allFields].some((f) => (baseAttrs[f] ?? "") !== (headAttrs[f] ?? ""));
      if (hasChange) changed++;
    }
  }

  return { added, changed };
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

  const rows: ProductDiffRow[] = [];
  const summary: Record<DiffStatus, number> = { added: 0, removed: 0, changed: 0, unchanged: 0 };

  if (head.type === "delta") {
    // Delta diff: only iterate products present in the delta.
    // Absence from the delta means unchanged, never removed.
    for (const [key, headProduct] of headMap) {
      const baseProduct = baseMap.get(key);

      if (!baseProduct) {
        rows.push({ item_id: key, title: headProduct.title ?? null, status: "added", changedFields: [] });
        summary.added++;
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
  } else {
    // Full vs full diff: union of both key sets; absence in head means removed.
    const allKeys = new Set([...baseMap.keys(), ...headMap.keys()]);

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
  }

  const order: DiffStatus[] = ["added", "removed", "changed", "unchanged"];
  rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return { base, head, summary, rows };
}
