import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";

import { categories, films as staticFilms } from "@/lib/site-content";
import { extractYouTubeId } from "@/lib/utils";
import { FALLBACK_ALBUMS, listPublicAlbums, type PublicAlbum } from "./-_albums.list";

export const Route = createFileRoute("/works")({
  staleTime: 1000 * 60 * 5,
  preloadStaleTime: 1000 * 60 * 5,
  head: () => ({
    meta: [
      { title: "Our Works — Vessel Studio Portfolio" },
      { name: "description", content: "Browse Vessel Studio photography albums by category. Click any project to explore the full gallery." },
      { property: "og:title", content: "Our Works — Vessel Studio Portfolio" },
      { property: "og:description", content: "A living archive of weddings, pre-weddings, families, products, events, and films." },
    ],
  }),
  loader: async () => {
    try {
      const res = await listPublicAlbums();
      if (res.ok && res.albums.length) return { albums: res.albums };
    } catch (err) {
      console.warn("[works loader] Using static fallback:", err);
    }
    return { albums: FALLBACK_ALBUMS };
  },
  component: WorksPage,
});

function WorksPage() {
  const { albums: items } = Route.useLoaderData();
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [activeFilmId, setActiveFilmId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (category === "All" ? items : items.filter((a) => a.category === category)),
    [category, items],
  );

  // Collect all valid films from albums (all album.videos + legacy youtube_url fallback)
  const filmEntries = useMemo(() => {
    const list: Array<{
      id: string;
      albumId: string;
      title: string;
      albumTitle: string;
      location: string;
      description: string;
      coverImage: string;
      videoId: string;
    }> = [];

    for (const album of items) {
      if (album.videos && album.videos.length > 0) {
        for (const v of album.videos) {
          const vid = extractYouTubeId(v.youtube_url);
          if (vid) {
            list.push({
              id: v.id,
              albumId: album.id,
              title: v.title || album.title,
              albumTitle: album.title,
              location: album.location,
              description: album.description,
              coverImage: album.cover_image,
              videoId: vid,
            });
          }
        }
      } else if (album.youtube_url) {
        const vid = extractYouTubeId(album.youtube_url);
        if (vid) {
          list.push({
            id: `legacy-${album.id}`,
            albumId: album.id,
            title: album.title,
            albumTitle: album.title,
            location: album.location,
            description: album.description,
            coverImage: album.cover_image,
            videoId: vid,
          });
        }
      }
    }
    return list;
  }, [items]);

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
            {filtered.map((album, index) => (
              <Link
                key={album.id}
                to="/albums/$albumId"
                params={{ albumId: album.id }}
                preload="intent"
                className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/25 transition-[box-shadow,ring-color,transform] duration-200"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-foreground/5">
                  <img
                    src={album.cover_image}
                    alt={album.title}
                    width={1024}
                    height={1280}
                    loading={index < 6 ? "eager" : "lazy"}
                    fetchPriority={index < 3 ? "high" : "auto"}
                    decoding="async"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Film badge */}
                  {((album.videos && album.videos.length > 0) || extractYouTubeId(album.youtube_url ?? "")) ? (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/80 backdrop-blur px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-background">
                      <Play size={8} fill="currentColor" /> Film
                    </span>
                  ) : null}
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

      {/* Films section — dynamic from albums with videos, fallback to static */}
      <section className="border-y border-foreground/15 bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Films · on demand
          </p>
          <h2 className="mb-8 font-display text-3xl font-semibold md:text-5xl">
            Press play when you&apos;re ready.
          </h2>
          {filmEntries.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {filmEntries.map((film) => {
                const videoId = film.videoId;
                const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                return (
                  <article key={film.id}>
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-background/10">
                      {activeFilmId === film.id ? (
                        <iframe
                          className="size-full"
                          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                          title={film.title}
                          loading="lazy"
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveFilmId(film.id)}
                          className="relative size-full text-left"
                          aria-label={`Play ${film.title}`}
                        >
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover opacity-80 transition-transform duration-700 hover:scale-105"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              if (img.src.includes("maxresdefault")) {
                                img.src = img.src.replace("maxresdefault", "hqdefault");
                              } else if (film.coverImage) {
                                img.src = film.coverImage;
                              }
                            }}
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
                      {film.description ? film.description.slice(0, 90) + (film.description.length > 90 ? "…" : "") : ""} · {film.location}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            // Static fallback when no albums have youtube_url set
            <div className="grid gap-5 md:grid-cols-3">
              {staticFilms.map((film) => (
                <article key={film.title}>
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-background/10">
                    {activeFilmId === film.videoId ? (
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
                        onClick={() => setActiveFilmId(film.videoId)}
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
          )}
        </div>
      </section>
    </main>
  );
}
