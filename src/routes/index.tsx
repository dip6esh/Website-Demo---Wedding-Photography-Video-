import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Play } from "lucide-react";
import { useState } from "react";

import { contactDetails, films, services } from "@/lib/site-content";
import heroImage from "@/assets/wedding-hero.jpg";
import preweddingImage from "@/assets/prewedding-dusk.jpg";
import ringsImage from "@/assets/rings-detail.jpg";
import receptionImage from "@/assets/reception-night.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vessel Studio — Cinematic Wedding Photography" },
      { name: "description", content: "Vessel Studio frames the unrepeatable hour through cinematic wedding photography, films, and honest visual storytelling." },
      { property: "og:title", content: "Vessel Studio — Cinematic Wedding Photography" },
      { property: "og:description", content: "Cinematic wedding photography, films, and visual stories for the unrepeatable moments." },
    ],
  }),
  component: HomePage,
});

const heroFrames = [
  { image: heroImage, label: "01 — Wedding", alt: "Bride in a flowing dress at golden hour" },
  { image: preweddingImage, label: "02 — Film", alt: "Couple silhouetted against a coastal sunset" },
  { image: ringsImage, label: "03 — Detail", alt: "Wedding ring held in warm light" },
  { image: receptionImage, label: "04 — Reception", alt: "Guests dancing beneath string lights" },
];

function HomePage() {
  const [activeFilm, setActiveFilm] = useState<string | null>(null);

  return (
    <main>
      <section className="border-b border-foreground/15">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <div className="mb-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
            <span className="size-2 rounded-full bg-primary" />
            <span>Now booking 2026 — 04</span>
            <span className="hidden text-foreground/30 sm:inline">/ Cinematic wedding atelier</span>
          </div>
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
                <img src={frame.image} alt={frame.alt} width={1024} height={1280} loading={frame.label.startsWith("01") ? "eager" : "lazy"} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/45">What we do</p>
              <h2 className="font-display text-2xl font-semibold md:text-4xl">Six ways to work with us</h2>
            </div>
            <Link to="/services" className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/60 transition-colors hover:text-primary sm:inline">All services ↗</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <article key={service.number} className="flex flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10">
                <img src={service.image} alt={service.alt} width={1024} height={640} loading="lazy" className="mb-5 aspect-[3/2] w-full rounded-lg object-cover" />
                <div className="mb-2 flex items-start gap-3"><span className="font-mono text-[10px] text-primary">{service.number}</span><h3 className="font-display text-base font-semibold leading-snug">{service.title}</h3></div>
                <p className="flex-1 text-sm leading-relaxed text-foreground/65">{service.description}</p>
                <Link to="/contact" className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary transition-colors hover:text-foreground">Enquire <ArrowUpRight size={13} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 bg-card/60">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/45">Selected films</p>
          <h2 className="mb-8 max-w-[30ch] font-display text-2xl font-semibold md:text-4xl">Reels that outlast the day</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {films.map((film) => (
              <article key={film.title} className="group">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-foreground ring-1 ring-foreground/20">
                  {activeFilm === film.videoId ? (
                    <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${film.videoId}?autoplay=1`} title={film.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  ) : (
                    <button type="button" onClick={() => setActiveFilm(film.videoId)} className="relative size-full text-left" aria-label={`Play ${film.title}`}>
                      <img src={film.image} alt="" width={1024} height={1280} loading="lazy" className="size-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105" />
                      <span className="absolute inset-0 grid place-items-center"><span className="grid size-14 place-items-center rounded-full bg-background/90 text-foreground shadow-lg transition-transform group-hover:scale-105"><Play size={17} fill="currentColor" /></span></span>
                      <span className="absolute bottom-3 right-3 rounded bg-foreground/70 px-2 py-1 font-mono text-[10px] text-background">{film.duration}</span>
                    </button>
                  )}
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">{film.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground/60">{film.description}</p>
              </article>
            ))}
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