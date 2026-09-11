import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
  listAlbumVideos,
  listAlbums,
  listFeaturedVideos,
  listHeroTiles,
  type FeaturedVideo,
  type HeroTileRow,
} from "../lib/supabase-server";

export type { HeroTileRow };

function getSupabaseReadClient() {
  return getSupabaseServerClient() ?? getSupabaseAnonServerClient();
}

export type PublicAlbumVideo = {
  id: string;
  youtube_url: string;
  title: string;
  is_featured: boolean;
  sort_order: number;
};

export type PublicAlbumPhoto = {
  id: string;
  image: string;
  alt: string;
  caption: string;
};

export type PublicAlbum = {
  id: string;
  category: (typeof categories)[number] | (string & {});
  title: string;
  location: string;
  cover_image: string;
  description: string;
  youtube_url?: string;
  photo_count: number;
  photos?: PublicAlbumPhoto[];
  videos?: PublicAlbumVideo[];
};

type FallbackAlbum = PublicAlbum & { photos: PublicAlbumPhoto[]; videos: PublicAlbumVideo[] };

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

export const FALLBACK_ALBUMS: FallbackAlbum[] = fallbackPortfolio.map((item, index) => {
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
    videos: [],
  };
});

// In-memory server-side cache for instant public loading
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

let publicAlbumsCache: CacheEntry<PublicAlbum[]> | null = null;
const albumDetailCache = new Map<string, CacheEntry<PublicAlbum>>();
const albumPhotosCache = new Map<string, CacheEntry<PublicAlbumPhoto[]>>();

const ALBUMS_CACHE_TTL = 1000 * 60 * 10; // 10 minutes (invalidated on admin mutations)
const ALBUM_DETAIL_CACHE_TTL = 1000 * 60 * 10; // 10 minutes (invalidated on admin mutations)

export function invalidatePublicAlbumsCache() {
  publicAlbumsCache = null;
  albumDetailCache.clear();
  albumPhotosCache.clear();
}

export const listPublicAlbums = createServerFn({ method: "GET" }).handler(async () => {
  if (publicAlbumsCache && Date.now() < publicAlbumsCache.expiresAt) {
    return { ok: true as const, albums: publicAlbumsCache.data, source: "database" as const };
  }

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
        select(cols: string): {
          order(col: string, opts?: { ascending: boolean }): Promise<{
            data: unknown[] | null;
            error?: { message?: string } | null;
          }>;
        };
      };
    };

    const [allPhotosRes, allVideosRes] = await Promise.all([
      (anyClient.from("album_photos") as unknown as { select(cols: string): Promise<{ data: { album_id: string; id: string }[] | null; error?: unknown }> }).select("album_id,id"),
      anyClient.from("album_videos").select("id,album_id,youtube_url,title,is_featured,sort_order").order("sort_order", { ascending: true }),
    ]);

    const counts = new Map<string, number>();
    if (allPhotosRes && !("error" in allPhotosRes) && Array.isArray(allPhotosRes.data)) {
      for (const row of allPhotosRes.data) {
        const albumId = row.album_id;
        counts.set(albumId, (counts.get(albumId) ?? 0) + 1);
      }
    }

    const videosByAlbum = new Map<string, PublicAlbumVideo[]>();
    if (allVideosRes && !allVideosRes.error && Array.isArray(allVideosRes.data)) {
      for (const row of allVideosRes.data as Array<{ id: string; album_id: string; youtube_url: string; title: string; is_featured: boolean; sort_order: number }>) {
        const list = videosByAlbum.get(row.album_id) ?? [];
        list.push({
          id: row.id,
          youtube_url: row.youtube_url,
          title: row.title,
          is_featured: row.is_featured,
          sort_order: row.sort_order,
        });
        videosByAlbum.set(row.album_id, list);
      }
    }

    const out: PublicAlbum[] = albumsRes.albums.map((a) => {
      const vids = videosByAlbum.get(a.id) ?? [];
      const featVid = vids.find((v) => v.is_featured) ?? vids[0];
      const effectiveYoutubeUrl = featVid?.youtube_url || a.youtube_url || "";
      return {
        id: a.id,
        category: a.category,
        title: a.title,
        location: a.location,
        cover_image: normalizeSeedUrl(a.cover_image_url || ""),
        description: a.description || "",
        youtube_url: effectiveYoutubeUrl,
        photo_count: counts.get(a.id) ?? 0,
        videos: vids,
      };
    });

    publicAlbumsCache = { data: out, expiresAt: Date.now() + ALBUMS_CACHE_TTL };
    return { ok: true as const, albums: out, source: "database" as const };
  } catch (err) {
    console.warn("[albums] Falling back to static albums:", err);
    return { ok: true as const, albums: FALLBACK_ALBUMS, source: "fallback" as const };
  }
});

function extractStringId(data: unknown): string {
  if (typeof data === "string") return data.trim();
  if (typeof data === "number" && Number.isFinite(data)) return String(data);
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const directKeys = ["id", "albumId", "album_id", "albumID", "album", "slug"] as const;
    for (const k of directKeys) {
      const v = rec[k];
      if (typeof v === "string" && v.length > 0) return v.trim();
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
  }
  return "";
}

export const listPublicAlbumPhotos = createServerFn({ method: "GET" })
  .validator((body: unknown) => extractStringId(body))
  .handler(async (args) => {
    const id = typeof args?.data === "string" ? args.data : extractStringId(args?.data);
    if (!id) {
      return { ok: true as const, photos: [], source: "fallback" as const };
    }

    const cached = albumPhotosCache.get(id);
    if (cached && Date.now() < cached.expiresAt) {
      return { ok: true as const, photos: cached.data, source: "database" as const };
    }
    const cachedDetail = albumDetailCache.get(id);
    if (cachedDetail?.data?.photos && cachedDetail.data.photos.length > 0) {
      return { ok: true as const, photos: cachedDetail.data.photos, source: "database" as const };
    }

    const client = getSupabaseReadClient();
    if (!client) {
      return { ok: true as const, photos: [], source: "fallback" as const };
    }
    try {
      const photosRes = await listAlbumPhotos(id);
      const photos: PublicAlbumPhoto[] = "photos" in photosRes
        ? photosRes.photos.map((p) => ({
            id: p.id,
            image: normalizeSeedUrl(p.image_url),
            alt: p.alt || p.caption || "",
            caption: p.caption,
          }))
        : [];
      albumPhotosCache.set(id, { data: photos, expiresAt: Date.now() + ALBUM_DETAIL_CACHE_TTL });
      return { ok: true as const, photos, source: "database" as const };
    } catch (err) {
      console.warn("[listPublicAlbumPhotos] Falling back to empty:", err, "for id:", id);
      return { ok: true as const, photos: [], source: "fallback" as const };
    }
  });

export const getPublicAlbum = createServerFn({ method: "GET" })
  .validator((body: unknown) => extractStringId(body))
  .handler(async (args) => {
    const id = typeof args?.data === "string" ? args.data : extractStringId(args?.data);
    const matchedFallback = id ? FALLBACK_ALBUMS.find((a) => a.id === id) : undefined;

    if (!id) {
      if (matchedFallback) return { ok: true as const, found: true as const, album: matchedFallback, source: "fallback" as const };
      return { ok: true as const, found: false as const, album: null, source: "fallback" as const };
    }

    // 1. Check in-memory cache
    const cached = albumDetailCache.get(id);
    if (cached && Date.now() < cached.expiresAt) {
      return { ok: true as const, found: true as const, album: cached.data, source: "database" as const };
    }

    const client = getSupabaseReadClient();
    if (!client) {
      if (matchedFallback) return { ok: true as const, found: true as const, album: matchedFallback, source: "fallback" as const };
      return { ok: true as const, found: false as const, album: null, source: "fallback" as const };
    }

    try {
      // Parallel fetch for speed
      const [albumRes, photosRes, videosRes] = await Promise.all([
        getAlbum(id),
        listAlbumPhotos(id),
        listAlbumVideos(id),
      ]);

      if ("error" in albumRes) {
        console.warn("[getPublicAlbum] getAlbum error:", albumRes.error, "for id:", id);
        if (matchedFallback) return { ok: true as const, found: true as const, album: matchedFallback, source: "fallback" as const };
        return { ok: true as const, found: false as const, album: null, source: "fallback" as const };
      }

      const photos: PublicAlbumPhoto[] = "photos" in photosRes
        ? photosRes.photos.map((p) => ({
            id: p.id,
            image: normalizeSeedUrl(p.image_url),
            alt: p.alt || p.caption || albumRes.album.title,
            caption: p.caption,
          }))
        : [];
      const coverFromPhotos = photos[0] ? photos[0].image : "";

      const rawVideos: PublicAlbumVideo[] = "videos" in videosRes
        ? videosRes.videos.map((v) => ({
            id: v.id,
            youtube_url: v.youtube_url,
            title: v.title,
            is_featured: v.is_featured,
            sort_order: v.sort_order,
          }))
        : [];

      const featVid = rawVideos.find((v) => v.is_featured) ?? rawVideos[0];
      const effectiveYoutubeUrl = featVid?.youtube_url || albumRes.album.youtube_url || "";

      const album: PublicAlbum = {
        id: albumRes.album.id,
        category: albumRes.album.category,
        title: albumRes.album.title,
        location: albumRes.album.location,
        cover_image: normalizeSeedUrl(albumRes.album.cover_image_url) || coverFromPhotos,
        description: albumRes.album.description || "",
        youtube_url: effectiveYoutubeUrl,
        photo_count: photos.length,
        photos,
        videos: rawVideos,
      };

      albumDetailCache.set(id, { data: album, expiresAt: Date.now() + ALBUM_DETAIL_CACHE_TTL });
      return { ok: true as const, found: true as const, album, source: "database" as const };
    } catch (err) {
      console.warn("[getPublicAlbum] Error loading id:", id, err);
      if (matchedFallback) return { ok: true as const, found: true as const, album: matchedFallback, source: "fallback" as const };
      return { ok: true as const, found: false as const, album: null, source: "fallback" as const };
    }
  });

export const listFeaturedVideosPublic = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await listFeaturedVideos(3);
    if ("videos" in res) return { ok: true as const, videos: res.videos as FeaturedVideo[] };
  } catch (err) {
    console.warn("[listFeaturedVideosPublic] failed:", err);
  }
  return { ok: true as const, videos: [] as FeaturedVideo[] };
});

export const listHeroTilesPublic = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await listHeroTiles();
    if ("tiles" in res) return { ok: true as const, tiles: res.tiles };
  } catch (err) {
    console.warn("[listHeroTilesPublic] failed:", err);
  }
  return { ok: true as const, tiles: [] as HeroTileRow[] };
});

// Pre-warm cache in background on server boot
if (typeof process !== "undefined") {
  setTimeout(() => {
    listPublicAlbums().catch(() => {});
  }, 100);
}
