import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Play } from "lucide-react";
import { useState } from "react";

import { contactDetails, films as staticFilms, services } from "@/lib/site-content";
import { extractYouTubeId } from "@/lib/utils";
import { listFeaturedVideosPublic, listHeroTilesPublic } from "./-_albums.list";
import type { FeaturedVideo, HeroTileRow } from "../lib/supabase-server";

// Static fallback images per service key
import heroImage from "@/assets/wedding-hero.jpg";
import preweddingImage from "@/assets/prewedding-dusk.jpg";
import ringsImage from "@/assets/rings-detail.jpg";
import receptionImage from "@/assets/reception-night.jpg";
import serviceWedding from "@/assets/service-wedding.jpg";
import serviceProduct from "@/assets/service-product.jpg";

// Fallback image per service key
function serviceKeyFallback(key: string): string {
  const map: Record<string, string> = {
    "01": heroImage as unknown as string,
    "02": preweddingImage as unknown as string,
    "03": ringsImage as unknown as string,
    "04": serviceProduct as unknown as string,
    "05": serviceWedding as unknown as string,
    "06": receptionImage as unknown as string,
  };
  return map[key] ?? (heroImage as unknown as string);
}

export const Route = createFileRoute("/")({
  staleTime: 1000 * 60 * 5,
  preloadStaleTime: 1000 * 60 * 5,
  head: () => ({
    meta: [
      { title: "Vessel Studio — Cinematic Wedding Photography" },
      { name: "description", content: "Vessel Studio frames the unrepeatable hour through cinematic wedding photography, films, and honest visual storytelling." },
      { property: "og:title", content: "Vessel Studio — Cinematic Wedding Photography" },
      { property: "og:description", content: "Cinematic wedding photography, films, and visual stories for the unrepeatable moments." },
    ],
  }),
  loader: async () => {
    const [videosRes, tilesRes] = await Promise.allSettled([
      listFeaturedVideosPublic(),
      listHeroTilesPublic(),
    ]);
    const featuredVideos =
      videosRes.status === "fulfilled" && "videos" in videosRes.value
        ? (videosRes.value.videos as FeaturedVideo[])
        : ([] as FeaturedVideo[]);
    const heroTiles =
      tilesRes.status === "fulfilled" && "tiles" in tilesRes.value
        ? (tilesRes.value.tiles as HeroTileRow[])
        : ([] as HeroTileRow[]);
    return { featuredVideos, heroTiles };
  },
  component: HomePage,
});

// Exactly 3 static placeholder films
const STATIC_3 = staticFilms.slice(0, 3);


function HomePage() {
  const { featuredVideos, heroTiles } = Route.useLoaderData();
  const [activeFilm, setActiveFilm] = useState<string | null>(null);

  // Build hero frames: use DB tiles (slots 1-4), fill blanks from service defaults
  const heroFrames = Array.from({ length: 4 }, (_, i) => {
    const slot = i + 1;
    const tile = heroTiles.find((t) => t.slot === slot);
    const svc = services[i];
    const image = tile?.photo_url || serviceKeyFallback(tile?.service_key ?? String(slot).padStart(2, "0"));
    const label = tile?.label || `0${slot} — ${svc?.title?.split(" ")[0] ?? "Service"}`;
    const alt = svc?.alt ?? label;
    return { image, label, alt };
  });

  // Build exactly 3 slots: DB featured videos first, then static placeholders
  type FilmSlot =
    | { kind: "db"; video: FeaturedVideo }
    | { kind: "static"; film: (typeof STATIC_3)[number] };

  const slots: FilmSlot[] = [];
  for (const v of featuredVideos.slice(0, 3)) {
    slots.push({ kind: "db", video: v });
  }
  for (const f of STATIC_3) {
    if (slots.length >= 3) break;
    slots.push({ kind: "static", film: f });
  }

  return (
    <main>
      <section className="border-b border-foreground/15">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">

          <h1 className="max-w-[20ch] font-display text-4xl font-bold leading-[0.98] tracking-tight sm:text-6xl md:text-7xl">
            We frame the <span className="chrome">unrepeatable</span> hour of your life.
          </h1>
          <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
            <p className="max-w-[42ch] text-pretty text-base leading-relaxed text-foreground/70 md:col-span-5 md:text-lg">
              Vessel. is a two-person studio turning weddings into film. No templates, no filters — just light, patience, and the grain of a genuine day.
            </p>
            <div className="flex flex-wrap items-center gap-3 md:col-span-7">
              <Link to="/works" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0">
                <span className="grid size-4 place-items-center rounded-full bg-primary-foreground/25"><ArrowUpRight size={11} /></span>
                View portfolio
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full ring-1 ring-foreground/25 px-4 py-2 font-medium transition-colors hover:bg-card">
                <span className="grid size-4 place-items-center rounded-full ring-1 ring-foreground/40"><span className="size-1.5 rounded-full bg-foreground/40" /></span>
                Begin an enquiry
              </Link>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {heroFrames.map((frame) => (
              <div key={frame.label} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                <img
                  src={frame.image}
                  alt={frame.alt}
                  width={1024}
                  height={1280}
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.12em] text-background drop-shadow-sm">{frame.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-background/15 bg-foreground py-3 text-background">
        <div className="marquee-track flex w-max whitespace-nowrap font-display text-sm tracking-wide">
          {["Weddings", "Pre-Weddings", "Films", "Baby & Kids", "Product", "Corporate", "Events", "Weddings", "Pre-Weddings", "Films", "Baby & Kids", "Product", "Corporate", "Events"].map((item, index) => (
            <span key={`${item}-${index}`} className="mx-6"><span>{item}</span><span className="ml-12 text-primary">/</span></span>
          ))}
        </div>
      </div>

      <section className="border-b border-foreground/15">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/45">What we do</p>
              <h2 className="font-display text-2xl font-semibold md:text-4xl">Six ways to work with us</h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/60 transition-colors hover:text-primary"
            >
              All services <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-foreground/15 border-y border-foreground/15">
            {services.slice(0, 6).map((service) => (
              <Link
                key={service.number}
                to="/contact"
                className="group -mx-4 block rounded-xl px-4 py-6 transition-colors hover:bg-card/70 md:grid md:grid-cols-12 md:items-center md:gap-8 md:py-7"
              >
                <div className="flex items-baseline gap-4 md:col-span-5">
                  <span className="font-mono text-xs font-semibold text-primary">{service.number}</span>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-xl">
                    {service.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/65 md:col-span-5 md:mt-0 md:text-sm">
                  {service.description}
                </p>
                <div className="mt-4 flex items-center justify-start md:col-span-2 md:mt-0 md:justify-end">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-primary transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground">
                    Enquire <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Selected films — 3 slots: DB featured videos + static fallback */}
      <section className="border-b border-foreground/15 bg-card/60">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/45">Selected films</p>
          <h2 className="mb-8 max-w-[30ch] font-display text-2xl font-semibold md:text-4xl">Reels that outlast the day</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot, i) => {
              if (slot.kind === "db") {
                const { video } = slot;
                const vid = extractYouTubeId(video.youtube_url) ?? "";
                const thumb = vid ? `https://img.youtube.com/vi/${vid}/maxresdefault.jpg` : "";
                const key = `db-${video.id}`;
                return (
                  <article key={key} className="group">
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-foreground ring-1 ring-foreground/20">
                      {activeFilm === key ? (
                        <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`} title={video.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                      ) : (
                        <button type="button" onClick={() => setActiveFilm(key)} className="relative size-full text-left" aria-label={`Play ${video.title}`}>
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              if (img.src.includes("maxresdefault")) {
                                img.src = img.src.replace("maxresdefault", "hqdefault");
                              } else if (video.album_cover_image_url) {
                                img.src = video.album_cover_image_url;
                              }
                            }}
                          />
                          <span className="absolute inset-0 grid place-items-center"><span className="grid size-14 place-items-center rounded-full bg-background/90 text-foreground shadow-lg transition-transform group-hover:scale-105"><Play size={17} fill="currentColor" /></span></span>
                        </button>
                      )}
                    </div>
                    <h3 className="mt-3 font-display text-base font-semibold">{video.title || video.album_title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/60">{video.album_location}</p>
                  </article>
                );
              }

              // Static placeholder
              const { film } = slot;
              const key = `static-${i}`;
              return (
                <article key={key} className="group">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-foreground ring-1 ring-foreground/20">
                    {activeFilm === key ? (
                      <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${film.videoId}?autoplay=1`} title={film.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                    ) : (
                      <button type="button" onClick={() => setActiveFilm(key)} className="relative size-full text-left" aria-label={`Play ${film.title}`}>
                        <img src={film.image} alt="" width={1024} height={1280} loading="lazy" className="size-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105" />
                        <span className="absolute inset-0 grid place-items-center"><span className="grid size-14 place-items-center rounded-full bg-background/90 text-foreground shadow-lg transition-transform group-hover:scale-105"><Play size={17} fill="currentColor" /></span></span>
                        <span className="absolute bottom-3 right-3 rounded bg-foreground/70 px-2 py-1 font-mono text-[10px] text-background">{film.duration}</span>
                      </button>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold">{film.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/60">{film.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-24">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Begin the conversation</p>
          <h2 className="mx-auto max-w-[24ch] font-display text-3xl font-bold leading-tight md:text-5xl">Tell us the date. We&apos;ll handle the light.</h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={contactDetails.whatsappHref} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0"><span className="size-2.5 rounded-full bg-primary-foreground/45" /> Start on WhatsApp</a>
            <Link to="/contact" className="inline-flex items-center rounded-full ring-1 ring-background/30 px-5 py-3 font-medium transition-colors hover:bg-background/10">Request the portfolio</Link>
          </div>
        </div>
      </section>
    </main>
  );
}