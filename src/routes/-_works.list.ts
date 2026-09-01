import { createServerFn } from "@tanstack/react-start";
import { categories, portfolio as fallbackPortfolio } from "../lib/site-content";
import { getSupabaseServerClient, type PortfolioItem } from "../lib/supabase-server";

export type PublicPortfolioItem = {
  id: string;
  category: (typeof categories)[number] | (string & {});
  title: string;
  location: string;
  image: string;
  alt: string;
};

export const listPublicPortfolio = createServerFn({ method: "GET" }).handler(async () => {
  const client = getSupabaseServerClient();
  const fallback: PublicPortfolioItem[] = fallbackPortfolio.map((item, index) => ({
    id: `fallback-${index}`,
    category: item.category,
    title: item.title,
    location: item.location,
    image: typeof item.image === "string" ? item.image : (item.image as unknown as { src?: string }).src ?? "",
    alt: item.alt,
  }));
  if (!client) {
    return { ok: true as const, items: fallback, source: "fallback" as const };
  }
  const anyClient = client as unknown as {
    from(t: string): {
      select(cols: string): {
        order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): {
          order(col2: string, opts2?: { ascending?: boolean }): Promise<{
            data: PortfolioItem[] | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
  try {
    const { data, error } = await anyClient
      .from("portfolio_items")
      .select("id,category,title,location,image_url,alt,sort_order,created_at")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) {
      return { ok: true as const, items: fallback, source: "fallback" as const };
    }
    const items: PublicPortfolioItem[] = data.map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      location: row.location,
      image: row.image_url,
      alt: row.alt || row.title,
    }));
    return { ok: true as const, items, source: "database" as const };
  } catch (err) {
    console.warn("[works] Falling back to static portfolio:", err);
    return { ok: true as const, items: fallback, source: "fallback" as const };
  }
});
