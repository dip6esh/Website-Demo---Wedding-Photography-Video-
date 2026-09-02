import { createServerFn } from "@tanstack/react-start";
import weddingHero from "@/assets/wedding-hero.jpg";
import preweddingDusk from "@/assets/prewedding-dusk.jpg";
import ringsDetail from "@/assets/rings-detail.jpg";
import receptionNight from "@/assets/reception-night.jpg";
import serviceWedding from "@/assets/service-wedding.jpg";
import serviceProduct from "@/assets/service-product.jpg";
import { categories, portfolio as fallbackPortfolio } from "../lib/site-content";
import {
  getAlbum,
  getSupabaseServerClient,
  getSupabaseAnonServerClient,
  listAlbumPhotos,
  listAlbums,
} from "../lib/supabase-server";

function getSupabaseReadClient() {
  return getSupabaseServerClient() ?? getSupabaseAnonServerClient();
}

export type PublicAlbum = {
  id: string;
  category: (typeof categories)[number] | (string & {});
  title: string;
  location: string;
  cover_image: string;
  description: string;
  photo_count: number;
  photos?: PublicAlbumPhoto[];
};

export type PublicAlbumPhoto = {
  id: string;
  image: string;
  alt: string;
  caption: string;
};

type FallbackAlbum = PublicAlbum & { photos: PublicAlbumPhoto[] };

function importedSrc(imp: string | { src?: string }): string {
  return typeof imp === "string" ? imp : imp.src ?? "";
}

const KNOWN_SEED_ASSETS: ReadonlyArray<{ basename: string; url: string }> = [
  { basename: "service-wedding", url: importedSrc(serviceWedding) },
  { basename: "wedding-hero", url: importedSrc(weddingHero) },
  { basename: "prewedding-dusk", url: importedSrc(preweddingDusk) },
  { basename: "rings-detail", url: importedSrc(ringsDetail) },
  { basename: "reception-night", url: importedSrc(receptionNight) },
  { basename: "service-product", url: importedSrc(serviceProduct) },
];

function normalizeSeedUrl(raw: string): string {
  if (!raw) return "";
  if (!/^\/assets\//.test(raw)) return raw;
  const fileName = raw.slice("/assets/".length);
  const stem = fileName.split(".").shift() ?? fileName;
  const base = stem.replace(/-[A-Za-z0-9_-]{6,}$/, "");
  if (!base) return raw;
  const hit = KNOWN_SEED_ASSETS.find((a) => a.basename === base);
  return hit ? hit.url : raw;
}

const FALLBACK_ALBUMS: FallbackAlbum[] = fallbackPortfolio.map((item, index) => {
  const image = importedSrc(item.image);
  const descriptions: Record<number, string> = {
    0: "A quiet morning ceremony framed by the people who knew them longest. Documentary coverage, natural light.",
    1: "Portraits and quiet moments at golden hour on the palace steps before the reception.",
    2: "A relaxed pre-wedding session by the sea. Sunsets, wind in hair, and no rushed timelines.",
    3: "The moments between posed shots — when everyone forgets the camera is there.",
    4: "Minimal product stills for a fragrance line. Studio work, warm north light.",
    5: "A private reception after midnight. String lights, live music, and a very full dance floor.",
    6: "A product launch for a consumer tech brand. Coverage of keynote, audience, and after-party.",
    7: "An at-home family session with a toddler and grandparents. Natural light, no props.",
  };
  return {
    id: `fallback-${index}`,
    category: item.category,
    title: item.title,
    location: item.location,
    cover_image: image,
    description: descriptions[index] ?? "",
    photo_count: 1,
    photos: [
      {
        id: `fallback-photo-${index}`,
        image,
        alt: item.alt,
        caption: "",
      },
    ],
  };
});

export const listPublicAlbums = createServerFn({ method: "GET" }).handler(async () => {
  const client = getSupabaseReadClient();
  if (!client) {
    return { ok: true as const, albums: FALLBACK_ALBUMS, source: "fallback" as const };
  }
  try {
    const albumsRes = await listAlbums();
    if ("error" in albumsRes || albumsRes.albums.length === 0) {
      return { ok: true as const, albums: FALLBACK_ALBUMS, source: "fallback" as const };
    }
    const anyClient = client as unknown as {
      from(t: string): {
        select(cols: string): Promise<{
          data: { album_id: string; id: string }[] | null;
          error?: { message?: string } | null;
        }>;
      };
    };
    const allPhotosRes = await anyClient.from("album_photos").select("album_id,id");
    const counts = new Map<string, number>();
    if (!allPhotosRes.error && Array.isArray(allPhotosRes.data)) {
      for (const row of allPhotosRes.data) {
        const albumId = row.album_id;
        counts.set(albumId, (counts.get(albumId) ?? 0) + 1);
      }
    } else {
      for (const a of albumsRes.albums) {
        try {
          const ph = await listAlbumPhotos(a.id);
          counts.set(a.id, "photos" in ph ? ph.photos.length : 0);
        } catch {
          counts.set(a.id, 0);
        }
      }
    }
    const out: PublicAlbum[] = albumsRes.albums.map((a) => ({
      id: a.id,
      category: a.category,
      title: a.title,
      location: a.location,
      cover_image: normalizeSeedUrl(a.cover_image_url || ""),
      description: a.description || "",
      photo_count: counts.get(a.id) ?? 0,
    }));
    return { ok: true as const, albums: out, source: "database" as const };
  } catch (err) {
    console.warn("[albums] Falling back to static albums:", err);
    return { ok: true as const, albums: FALLBACK_ALBUMS, source: "fallback" as const };
  }
});

function extractStringId(data: unknown): string {
  if (typeof data === "string") return data;
  if (typeof data === "number" && Number.isFinite(data)) return String(data);
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const directKeys = ["id", "albumId", "album_id", "albumID", "album", "slug"] as const;
    for (const k of directKeys) {
      const v = rec[k];
      if (typeof v === "string" && v.length > 0) return v;
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
    }
    if ("data" in rec) {
      const inner = extractStringId(rec["data"]);
      if (inner) return inner;
    }
    if ("input" in rec) {
      const inner = extractStringId(rec["input"]);
      if (inner) return inner;
    }
    for (const val of Object.values(rec)) {
      if (typeof val === "string" && val.length > 0) return val;
    }
    for (const val of Object.values(rec)) {
      if (val && typeof val === "object") {
        const inner = extractStringId(val);
        if (inner) return inner;
      }
    }
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const inner = extractStringId(item);
      if (inner) return inner;
    }
  }
  return "";
}

export const getPublicAlbum = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const rawData = data;
    const id = extractStringId(data);
    console.warn("[getPublicAlbum] raw data shape:", typeof rawData, "-> extracted id:", JSON.stringify(id));
    const client = getSupabaseReadClient();
    const matchedFallback = id ? FALLBACK_ALBUMS.find((a) => a.id === id) : undefined;
    if (!client || !id) {
      if (matchedFallback) return { ok: true as const, found: true as const, album: matchedFallback, source: "fallback" as const, debug: { id, hasClient: !!client } };
      return { ok: true as const, found: false as const, album: null, source: "fallback" as const, debug: { id, hasClient: !!client, why: !id ? "empty-id" : "no-supabase-client" } };
    }
    try {
      const albumRes = await getAlbum(id);
      if ("error" in albumRes) {
        console.warn("[getPublicAlbum] getAlbum error:", albumRes.error, "for id:", id);
        if (matchedFallback) return { ok: true as const, found: true as const, album: matchedFallback, source: "fallback" as const, debug: { id, hasClient: true } };
        return { ok: true as const, found: false as const, album: null, source: "fallback" as const, debug: { id, hasClient: true, why: "getAlbum-error", errorMsg: albumRes.error } };
      }
      const photosRes = await listAlbumPhotos(id);
      const photos: PublicAlbumPhoto[] = "photos" in photosRes
        ? photosRes.photos.map((p) => ({
            id: p.id,
            image: normalizeSeedUrl(p.image_url),
            alt: p.alt || p.caption || albumRes.album.title,
            caption: p.caption,
          }))
        : [];
      const coverFromPhotos = photos[0] ? photos[0].image : "";
      const album: PublicAlbum = {
        id: albumRes.album.id,
        category: albumRes.album.category,
        title: albumRes.album.title,
        location: albumRes.album.location,
        cover_image: normalizeSeedUrl(albumRes.album.cover_image_url) || coverFromPhotos,
        description: albumRes.album.description || "",
        photo_count: photos.length,
        photos,
      };
      return { ok: true as const, found: true as const, album, source: "database" as const, debug: { id, hasClient: true, photoCount: photos.length } };
    } catch (err) {
      console.warn("[album] Falling back to static:", err, "for id:", id);
      if (matchedFallback) return { ok: true as const, found: true as const, album: matchedFallback, source: "fallback" as const, debug: { id, hasClient: true } };
      return { ok: true as const, found: false as const, album: null, source: "fallback" as const, debug: { id, hasClient: true, why: "exception", errorMsg: err instanceof Error ? err.message : String(err) } };
    }
  });
