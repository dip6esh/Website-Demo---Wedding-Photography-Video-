import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicAlbum, listPublicAlbums } from "./-_albums.list";

export const Route = createFileRoute("/albums/$albumId")({
  head: (ctx) => {
    const album = (ctx.loaderData as { album: { title?: string; description?: string; cover_image?: string } } | undefined)?.album;
    const title = album?.title ? `${album.title} — Vessel Studio` : "Album — Vessel Studio";
    const desc = album?.description?.slice(0, 160) || "A project gallery from Vessel Studio.";
    const ogImage = album?.cover_image;
    const meta: Array<{ name?: string; property?: string; content: string }> = [
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
    ];
    if (ogImage) meta.push({ property: "og:image", content: ogImage });
    return { title, meta };
  },
  loader: async ({ params }) => {
    const albumIdArg = params.albumId as unknown as Parameters<typeof getPublicAlbum>[0];
    const res = await getPublicAlbum(albumIdArg);
    const listRes = await listPublicAlbums();
    const siblings = "albums" in listRes ? listRes.albums : [];
    return {
      album: res.album,
      siblings,
      source: res.source,
    } as const;
  },
  component: AlbumDetailPage,
  notFoundComponent: () => {
    const router = useRouter();
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">404</p>
          <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl">Album not found</h1>
          <p className="mt-4 text-foreground/65 max-w-md mx-auto">
            This album may have been moved or no longer exists.
          </p>
          <button
            type="button"
            onClick={() => router.navigate({ to: "/works" })}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:-translate-y-0.5 transition-transform"
          >
            <ArrowLeft size={14} /> Back to all works
          </button>
        </div>
      </main>
    );
  },
});

type LoaderAlbum = {
  id: string;
  category: string;
  title: string;
  location: string;
  cover_image: string;
  description: string;
  photo_count: number;
  photos?: LoaderPhoto[];
};
type LoaderPhoto = {
  id: string;
  image: string;
  alt: string;
  caption: string;
};
type LoaderData = {
  album: LoaderAlbum;
  siblings: LoaderAlbum[];
  source: "fallback" | "database";
};

function AlbumDetailPage() {
  const loader = Route.useLoaderData() as unknown as LoaderData;
  const album = loader.album;
  const siblings = loader.siblings;
  const photos = album.photos ?? [];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (activeIndex === null) return;
      if (e.key === "Escape") setActiveIndex(null);
      else if (e.key === "ArrowLeft") {
        setActiveIndex((i) => (typeof i === "number" ? (i - 1 + photos.length) % photos.length : i));
      } else if (e.key === "ArrowRight") {
        setActiveIndex((i) => (typeof i === "number" ? (i + 1) % photos.length : i));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, photos.length]);

  const nextAlbum = (() => {
    const idx = siblings.findIndex((a: LoaderAlbum) => a.id === album.id);
    if (idx === -1) return undefined;
    return siblings[(idx + 1) % siblings.length];
  })();
  const prevAlbum = (() => {
    const idx = siblings.findIndex((a: LoaderAlbum) => a.id === album.id);
    if (idx === -1) return undefined;
    return siblings[(idx - 1 + siblings.length) % siblings.length];
  })();

  const effectiveCover = album.cover_image || photos[0]?.image || "";

  return (
    <main className="min-h-screen bg-background">
      {/* Back link */}
      <section className="border-b border-foreground/10">
        <div className="mx-auto max-w-6xl px-5 py-5">
          <Link
            to="/works"
            className="inline-flex items-center gap-2 text-sm text-foreground/65 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to all works
          </Link>
        </div>
      </section>

      {/* Hero / cover */}
      {effectiveCover ? (
        <section className="border-b border-foreground/10">
          <div className="mx-auto max-w-7xl px-5 py-10 md:py-14">
            <div className="relative overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[21/9] bg-foreground/5 ring-1 ring-foreground/10">
              <img
                src={effectiveCover}
                alt={album.title}
                className="size-full object-cover"
                loading="eager"
                width={1920}
                height={1080}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 backdrop-blur px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ring-1 ring-white/20">
                    {album.category}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
                    {album.photo_count} photos
                  </span>
                </div>
                <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
                  {album.title}
                </h1>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75 md:text-sm">
                  {album.location}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Description */}
      <section className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        {!effectiveCover ? (
          <div className="mb-8">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
              {album.category}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold md:text-6xl">{album.title}</h1>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/55">
              {album.location} · {album.photo_count} photos
            </p>
          </div>
        ) : null}
        {album.description ? (
          <div className="prose prose-neutral max-w-none">
            <p className="text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {album.description}
            </p>
          </div>
        ) : null}
      </section>

      {/* Gallery */}
      {photos.length ? (
        <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55">
              Gallery
            </p>
            <p className="text-xs text-foreground/45">
              Click a photo to open it · use ← → keys to navigate
            </p>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [column-fill:_balance] space-y-3">
            {photos.map((p: LoaderPhoto, i: number) => (
              <GalleryPhoto key={p.id} index={i} photo={p} onOpen={() => setActiveIndex(i)} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Prev / Next album navigation */}
      {(prevAlbum || nextAlbum) && photos.length ? (
        <section className="border-t border-foreground/10 bg-card/40">
          <div className="mx-auto max-w-6xl px-5 py-10 grid gap-4 md:grid-cols-2">
            {prevAlbum ? (
              <Link
                to="/albums/$albumId"
                params={{ albumId: prevAlbum.id }}
                className="group relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 hover:ring-foreground/20 transition-all"
              >
                <div className="flex items-stretch">
                  <div className="w-1/3 aspect-[4/5] shrink-0 bg-foreground/5 overflow-hidden">
                    <img
                      src={prevAlbum.cover_image}
                      alt={prevAlbum.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/45 flex items-center gap-1">
                      <ChevronLeft size={12} /> Previous
                    </span>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary/85">
                      {prevAlbum.category}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                      {prevAlbum.title}
                    </h3>
                    <p className="text-xs text-foreground/55 mt-0.5">{prevAlbum.location}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextAlbum ? (
              <Link
                to="/albums/$albumId"
                params={{ albumId: nextAlbum.id }}
                className="group relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 hover:ring-foreground/20 transition-all"
              >
                <div className="flex items-stretch flex-row-reverse">
                  <div className="w-1/3 aspect-[4/5] shrink-0 bg-foreground/5 overflow-hidden">
                    <img
                      src={nextAlbum.cover_image}
                      alt={nextAlbum.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center text-right">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/45 flex items-center gap-1 justify-end">
                      Next <ChevronRight size={12} />
                    </span>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary/85">
                      {nextAlbum.category}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                      {nextAlbum.title}
                    </h3>
                    <p className="text-xs text-foreground/55 mt-0.5">{nextAlbum.location}</p>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Lightbox */}
      {activeIndex !== null && photos[activeIndex] ? (
        <Lightbox
          photos={photos}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onPrev={() =>
            setActiveIndex((i) => (typeof i === "number" ? (i - 1 + photos.length) % photos.length : i))
          }
          onNext={() =>
            setActiveIndex((i) => (typeof i === "number" ? (i + 1) % photos.length : i))
          }
        />
      ) : null}
    </main>
  );
}

function GalleryPhoto({
  photo,
  onOpen,
  index,
}: {
  photo: LoaderPhoto;
  onOpen: () => void;
  index: number;
}) {
  // Show a mix of aspect ratios for a masonry feel; prefer 4:5 for most, 1:1, 3:4, 16:9 sprinkled
  const patterns = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/5]", "aspect-[3/2]"];
  const cls = patterns[index % patterns.length];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative block w-full overflow-hidden rounded-xl bg-foreground/5 ring-1 ring-foreground/10 hover:ring-foreground/25 transition-all break-inside-avoid ${cls}`}
      aria-label={`Open ${photo.alt || photo.caption || `photo ${index + 1}`}`}
    >
      <img
        src={photo.image}
        alt={photo.alt || photo.caption || ""}
        loading="lazy"
        className="size-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
      />
      {photo.caption ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-left text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {photo.caption}
        </span>
      ) : null}
    </button>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: LoaderPhoto[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = photos[index];
  if (!photo) {
    return null;
  }
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm grid place-items-center p-4 md:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 grid size-10 md:size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
        aria-label="Previous photo"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 grid size-10 md:size-12 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
        aria-label="Next photo"
      >
        <ChevronRight size={20} />
      </button>

      <figure
        className="max-h-[88vh] max-w-[96vw] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.image}
          alt={photo.alt || photo.caption || ""}
          className="max-h-[80vh] max-w-full rounded-md object-contain"
        />
        {photo.caption ? (
          <figcaption className="mt-3 text-center text-sm text-white/80">
            {photo.caption}
          </figcaption>
        ) : null}
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          {index + 1} / {photos.length}
        </p>
      </figure>
    </div>
  );
}
