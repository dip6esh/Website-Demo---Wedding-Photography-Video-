import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { categories, films } from "@/lib/site-content";
import { listPublicAlbums, type PublicAlbum } from "./-_albums.list";

const FALLBACK: PublicAlbum[] = [
  {
    id: "fallback-1",
    category: "Weddings",
    title: "The Ceremony",
    location: "Alibaug · 2025",
    cover_image: "/assets/service-wedding-BZurNPet.jpg",
    description:
      "A quiet morning ceremony framed by the people who knew them longest. Documentary coverage, natural light.",
    photo_count: 1,
  },
  {
    id: "fallback-2",
    category: "Weddings",
    title: "Golden Hour",
    location: "Udaipur · 2025",
    cover_image: "/assets/wedding-hero-Br79cHkN.jpg",
    description:
      "Portraits and quiet moments at golden hour on the palace steps before the reception.",
    photo_count: 1,
  },
  {
    id: "fallback-3",
    category: "Pre-Weddings",
    title: "Before The Vows",
    location: "Goa · 2025",
    cover_image: "/assets/prewedding-dusk-BF_f7_Q6.jpg",
    description:
      "A relaxed pre-wedding session by the sea. Sunsets, wind in hair, and no rushed timelines.",
    photo_count: 1,
  },
  {
    id: "fallback-4",
    category: "Pre-Weddings",
    title: "The In-Between",
    location: "Lonavala · 2024",
    cover_image: "/assets/wedding-hero-DSQ3HUHK.jpg",
    description:
      "The moments between posed shots — when everyone forgets the camera is there.",
    photo_count: 1,
  },
  {
    id: "fallback-5",
    category: "Products",
    title: "Quiet Objects",
    location: "Mumbai · 2025",
    cover_image: "/assets/service-product-BBqJ_b8-.jpg",
    description: "Minimal product stills for a fragrance line. Studio work, warm north light.",
    photo_count: 1,
  },
  {
    id: "fallback-6",
    category: "Events",
    title: "After Dark",
    location: "Delhi · 2024",
    cover_image: "/assets/reception-night-DmPA3Zc5.jpg",
    description:
      "A private reception after midnight. String lights, live music, and a very full dance floor.",
    photo_count: 1,
  },
  {
    id: "fallback-7",
    category: "Corporate",
    title: "The Gathering",
    location: "Bengaluru · 2024",
    cover_image: "/assets/service-wedding-BZurNPet.jpg",
    description:
      "A product launch for a consumer tech brand. Coverage of keynote, audience, and after-party.",
    photo_count: 1,
  },
  {
    id: "fallback-8",
    category: "Baby & Kids",
    title: "The Little Years",
    location: "Pune · 2024",
    cover_image: "/assets/rings-detail-Cp0BQSVQ.jpg",
    description:
      "An at-home family session with a toddler and grandparents. Natural light, no props.",
    photo_count: 1,
  },
];

export const Route = createFileRoute("/works")({
  head: () => ({ meta: [
    { title: "Our Works — Vessel Studio Portfolio" },
    { name: "description", content: "Browse Vessel Studio photography albums by category. Click any project to explore the full gallery." },
    { property: "og:title", content: "Our Works — Vessel Studio Portfolio" },
    { property: "og:description", content: "A living archive of weddings, pre-weddings, families, products, events, and films." },
  ] }),
  loader: async () => {
    try {
      const res = await listPublicAlbums();
      if (res.ok && res.albums.length) return { albums: res.albums };
    } catch (err) {
      console.warn("[works loader] Using static fallback:", err);
    }
    return { albums: FALLBACK };
  },
  component: WorksPage,
});

function WorksPage() {
  const { albums: items } = Route.useLoaderData();
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [activeFilm, setActiveFilm] = useState<string | null>(null);

  const filtered = useMemo(
    () => (category === "All" ? items : items.filter((a) => a.category === category)),
    [category, items],
  );

  return (
    <main>
      <section className="border-b border-foreground/15">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            Our works · 03
          </p>
          <h1 className="max-w-[13ch] font-display text-5xl font-bold leading-[0.98] md:text-7xl">
            A living archive of the day.
          </h1>
          <p className="mt-7 max-w-[42ch] text-base leading-relaxed text-foreground/70">
            Albums grouped by story. Click any project to open the full gallery. Photographs to return to.
            Films to play when you want to be there again.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div
          className="mb-8 flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Portfolio categories"
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                category === item
                  ? "bg-foreground text-background"
                  : "ring-1 ring-foreground/20 hover:bg-card"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-foreground/20 p-14 text-center ring-1 ring-foreground/5">
            <p className="font-display text-xl font-semibold text-foreground/60">
              No albums in this category yet.
            </p>
            <p className="mt-2 text-sm text-foreground/45">
              Check back soon — the team is usually editing something.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((album) => (
              <Link
                key={album.id}
                to="/albums/$albumId"
                params={{ albumId: album.id }}
                className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/25"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-foreground/5">
                  <img
                    src={album.cover_image}
                    alt={album.title}
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/85">
                      View album · {album.photo_count} photo{album.photo_count === 1 ? "" : "s"} →
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between px-5 py-4">
                  <div>
                    <p className="font-display text-lg font-semibold leading-tight">
                      {album.title}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">
                      {album.location}
                    </p>
                    {album.description ? (
                      <p className="mt-3 line-clamp-2 text-sm text-foreground/60">
                        {album.description}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1 self-start rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary/90">
                    {album.category}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-foreground/15 bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Films · on demand
          </p>
          <h2 className="mb-8 font-display text-3xl font-semibold md:text-5xl">
            Press play when you&apos;re ready.
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {films.map((film) => (
              <article key={film.title}>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-background/10">
                  {activeFilm === film.videoId ? (
                    <iframe
                      className="size-full"
                      src={`https://www.youtube-nocookie.com/embed/${film.videoId}?autoplay=1`}
                      title={film.title}
                      loading="lazy"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveFilm(film.videoId)}
                      className="relative size-full text-left"
                      aria-label={`Play ${film.title}`}
                    >
                      <img
                        src={
                          typeof film.image === "string"
                            ? film.image
                            : ((film.image as unknown as { src?: string }).src ?? "")
                        }
                        alt=""
                        width={1024}
                        height={1280}
                        loading="lazy"
                        className="size-full object-cover opacity-80 transition-transform duration-700 hover:scale-105"
                      />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="rounded-full bg-background px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground">
                          Play film
                        </span>
                      </span>
                    </button>
                  )}
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">{film.title}</h3>
                <p className="mt-1 text-sm text-background/60">
                  {film.description} · {film.duration}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
