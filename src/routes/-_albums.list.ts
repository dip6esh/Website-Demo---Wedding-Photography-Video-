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
  listAlbumPhotos,
  listAlbums,
} from "../lib/supabase-server";

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
  const client = getSupabaseServerClient();
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

export const getPublicAlbum = createServerFn({ method: "GET" })
  .validator((body: unknown) => {
    if (typeof body === "string" && body.length > 0) return { success: true as const, data: body };
    return { success: false as const, error: { issues: [{ message: "Missing album id" }] } };
  })
  .handler(async (args) => {
    const raw = args?.data as unknown;
    let id = "";
    if (typeof raw === "string") {
      id = raw;
    } else if (raw && typeof raw === "object" && "success" in raw) {
      const safe = raw as { success: boolean; data?: string };
      if (safe.success && typeof safe.data === "string") id = safe.data;
    }
    const client = getSupabaseServerClient();
    const fallback = FALLBACK_ALBUMS.find((a) => a.id === id) ?? FALLBACK_ALBUMS[0];
    if (!client || !id) {
      return { ok: true as const, album: fallback, source: "fallback" as const };
    }
    try {
      const albumRes = await getAlbum(id);
      if ("error" in albumRes) {
        return { ok: true as const, album: fallback, source: "fallback" as const };
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
      return { ok: true as const, album, source: "database" as const };
    } catch (err) {
      console.warn("[album] Falling back to static:", err);
      return { ok: true as const, album: fallback, source: "fallback" as const };
    }
  });
