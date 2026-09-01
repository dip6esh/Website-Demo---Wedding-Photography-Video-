import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { categories, films, portfolio as fallbackPortfolio } from "@/lib/site-content";
import { listPublicPortfolio, type PublicPortfolioItem } from "./-_works.list";

const STATIC_PORTFOLIO: PublicPortfolioItem[] = fallbackPortfolio.map((item, index) => ({
  id: `fallback-${index}`,
  category: item.category,
  title: item.title,
  location: item.location,
  image: item.image as string,
  alt: item.alt,
}));

export const Route = createFileRoute("/works")({
  head: () => ({ meta: [
    { title: "Our Works — Vessel Studio Portfolio" },
    { name: "description", content: "Browse Vessel Studio photography by category and watch selected wedding films on demand." },
    { property: "og:title", content: "Our Works — Vessel Studio Portfolio" },
    { property: "og:description", content: "A living archive of weddings, pre-weddings, families, products, events, and films." },
  ] }),
  loader: async () => {
    try {
      const res = await listPublicPortfolio();
      if (res.ok && res.items.length) return { items: res.items };
    } catch (err) {
      console.warn("[works loader] Using static fallback:", err);
    }
    return { items: STATIC_PORTFOLIO };
  },
  component: WorksPage,
});

function WorksPage() {
  const initial = Route.useLoaderData().items;
  const [items, setItems] = useState<PublicPortfolioItem[]>(initial);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [activeFilm, setActiveFilm] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void listPublicPortfolio().then((res) => {
      if (mounted && res.ok && res.items.length) {
        setItems(res.items);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredPortfolio = useMemo(
    () => (category === "All" ? items : items.filter((item) => item.category === category)),
    [category, items],
  );

  return (
    <main>
      <section className="border-b border-foreground/15"><div className="mx-auto max-w-6xl px-5 py-14 md:py-20"><p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Our works · 03</p><h1 className="max-w-[13ch] font-display text-5xl font-bold leading-[0.98] md:text-7xl">A living archive of the day.</h1><p className="mt-7 max-w-[42ch] text-base leading-relaxed text-foreground/70">Photographs to return to. Films to play when you want to be there again.</p></div></section>
      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20"><div className="mb-8 flex flex-wrap items-center gap-2" role="tablist" aria-label="Portfolio categories">{categories.map((item) => <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${category === item ? "bg-foreground text-background" : "ring-1 ring-foreground/20 hover:bg-card"}`}>{item}</button>)}</div><div className="grid grid-cols-2 gap-4 md:grid-cols-3">{filteredPortfolio.map((item, index) => <article key={`${item.id}-${index}`} className={index % 5 === 0 ? "md:row-span-2" : ""}><div className={`group relative overflow-hidden rounded-xl bg-card ${index % 5 === 0 ? "aspect-[3/4] md:h-full" : "aspect-[4/5]"}`}><img src={item.image} alt={item.alt} width={1024} height={1280} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent px-4 pb-4 pt-12 text-background"><p className="font-display text-sm font-semibold md:text-base">{item.title}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-background/70">{item.category} · {item.location}</p></div></div></article>)}</div></section>
      <section className="border-y border-foreground/15 bg-foreground text-background"><div className="mx-auto max-w-6xl px-5 py-14 md:py-20"><p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Films · on demand</p><h2 className="mb-8 font-display text-3xl font-semibold md:text-5xl">Press play when you&apos;re ready.</h2><div className="grid gap-5 md:grid-cols-3">{films.map((film) => <article key={film.title}><div className="relative aspect-video overflow-hidden rounded-xl bg-background/10">{activeFilm === film.videoId ? <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${film.videoId}?autoplay=1`} title={film.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <button type="button" onClick={() => setActiveFilm(film.videoId)} className="relative size-full text-left" aria-label={`Play ${film.title}`}><img src={typeof film.image === "string" ? film.image : (film.image as unknown as { src: string }).src} alt="" width={1024} height={1280} loading="lazy" className="size-full object-cover opacity-80 transition-transform duration-700 hover:scale-105" /><span className="absolute inset-0 grid place-items-center"><span className="rounded-full bg-background px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground">Play film</span></span></button>}</div><h3 className="mt-3 font-display text-base font-semibold">{film.title}</h3><p className="mt-1 text-sm text-background/60">{film.description} · {film.duration}</p></article>)}</div></div></section>
    </main>
  );
}
