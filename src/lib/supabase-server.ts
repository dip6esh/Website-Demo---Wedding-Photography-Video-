import { createClient } from "@supabase/supabase-js";

export type ServerEnv = NodeJS.ProcessEnv & Record<string, string | undefined>;

export function getServerEnv(): ServerEnv {
  return process.env as ServerEnv;
}

function firstNonEmpty(values: Array<string | undefined>): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

export function readSupabaseUrl(env?: ServerEnv): string | undefined {
  const e = env ?? getServerEnv();
  return firstNonEmpty([
    e["SUPABASE_URL"],
    e["VITE_SUPABASE_URL"],
    e["PUBLIC_SUPABASE_URL"],
    e["NEXT_PUBLIC_SUPABASE_URL"],
    e["REACT_APP_SUPABASE_URL"],
    e["EXPO_PUBLIC_SUPABASE_URL"],
  ]);
}

export function readSupabaseAnonKey(env?: ServerEnv): string | undefined {
  const e = env ?? getServerEnv();
  return firstNonEmpty([
    e["SUPABASE_ANON_KEY"],
    e["VITE_SUPABASE_ANON_KEY"],
    e["PUBLIC_SUPABASE_ANON_KEY"],
    e["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    e["REACT_APP_SUPABASE_ANON_KEY"],
    e["EXPO_PUBLIC_SUPABASE_ANON_KEY"],
  ]);
}

export function readSupabaseServiceRoleKey(env?: ServerEnv): string | undefined {
  const e = env ?? getServerEnv();
  return firstNonEmpty([
    e["SUPABASE_SERVICE_ROLE_KEY"],
    e["SUPABASE_SERVICE_KEY"],
    e["VITE_SUPABASE_SERVICE_ROLE_KEY"],
    e["VITE_SUPABASE_SERVICE_KEY"],
  ]);
}

let _bootWarnedUrl = false;
let _bootWarnedKey = false;

function bootCheck(env: ServerEnv) {
  const url = readSupabaseUrl(env);
  const key = readSupabaseServiceRoleKey(env);
  if (!url && !_bootWarnedUrl) {
    _bootWarnedUrl = true;
    console.warn(
      "[supabase-server] SUPABASE_URL (or VITE_SUPABASE_URL) is not set. Server-side Supabase features will be disabled.",
    );
  }
  if (url && !key && !_bootWarnedKey) {
    _bootWarnedKey = true;
    console.warn(
      "[supabase-server] SUPABASE_SERVICE_ROLE_KEY is not set. Server-side Supabase writes and admin sign-up will fail.",
    );
  }
}

try {
  bootCheck(getServerEnv());
} catch {
  // env access can be restricted in some edge runtimes; ignore at module level
}

type SupabaseServerClient = ReturnType<typeof createClient> | null;

let _serviceClient: SupabaseServerClient | undefined;

export function getSupabaseServerClient(): SupabaseServerClient {
  if (_serviceClient !== undefined) return _serviceClient;
  const env = getServerEnv();
  const url = readSupabaseUrl(env);
  const key = readSupabaseServiceRoleKey(env);
  if (!url || !key) {
    bootCheck(env);
    _serviceClient = null;
    return null;
  }
  try {
    _serviceClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error("[supabase-server] Failed to create service-role client:", err);
    _serviceClient = null;
  }
  return _serviceClient;
}

let _anonClient: SupabaseServerClient | undefined;

export function getSupabaseAnonServerClient(): SupabaseServerClient {
  if (_anonClient !== undefined) return _anonClient;
  const env = getServerEnv();
  const url = readSupabaseUrl(env);
  const key = readSupabaseAnonKey(env);
  if (!url || !key) {
    _anonClient = null;
    return null;
  }
  try {
    _anonClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error("[supabase-server] Failed to create anon server client:", err);
    _anonClient = null;
  }
  return _anonClient;
}

function getSupabaseReadClient(): SupabaseServerClient {
  return getSupabaseServerClient() ?? getSupabaseAnonServerClient();
}

export type ContactInquiryInsert = {
  name: string;
  phone: string;
  email: string;
  service: string;
  event_date: string;
  location: string;
  message: string;
  source?: string | null;
  ip_address?: string | null;
};

export async function insertContactInquiry(
  data: ContactInquiryInsert,
): Promise<{ id: string } | { error: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return { error: "Supabase is not configured on this server." };
  }
  type Row = { id: unknown };
  const anyClient = client as unknown as {
    from(table: string): {
      insert(row: unknown): {
        select(cols: string): {
          limit(n: number): {
            maybeSingle(): Promise<{ data: Row | null; error: { message?: string } | null }>;
          };
        };
      };
    };
  };
  const { data: rows, error } = await anyClient
    .from("contact_inquiries")
    .insert(data)
    .select("id")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[supabase] insertContactInquiry failed:", error);
    return { error: error.message || "Failed to save inquiry." };
  }
  if (!rows || rows.id === undefined || rows.id === null) {
    return { error: "No row returned on insert." };
  }
  return { id: String(rows.id) };
}

// ------------------- Portfolio items ---------------------------

export type PortfolioItem = {
  id: string;
  category: string;
  title: string;
  location: string;
  image_url: string;
  alt: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PortfolioItemInput = {
  category: string;
  title: string;
  location: string;
  image_url: string;
  alt: string;
  sort_order?: number;
};

function configError(): { error: string } {
  return { error: "Supabase is not configured on this server." };
}

function notConfiguredCheck(client: unknown): { error: string } | null {
  return client ? null : configError();
}

export async function listPortfolioItems(): Promise<
  { items: PortfolioItem[] } | { error: string }
> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
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
  const { data, error } = await anyClient
    .from("portfolio_items")
    .select("id,category,title,location,image_url,alt,sort_order,created_at,updated_at")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[supabase] listPortfolioItems failed:", error);
    return { error: error.message || "Failed to load portfolio." };
  }
  return { items: data ?? [] };
}

export async function getPortfolioItem(
  id: string,
): Promise<{ item: PortfolioItem } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      select(cols: string): {
        eq(col: string, val: unknown): {
          maybeSingle(): Promise<{
            data: PortfolioItem | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
  const { data, error } = await anyClient
    .from("portfolio_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[supabase] getPortfolioItem failed:", error);
    return { error: error.message || "Failed to load item." };
  }
  if (!data) return { error: "Portfolio item not found." };
  return { item: data };
}

export async function insertPortfolioItem(
  input: PortfolioItemInput,
): Promise<{ id: string } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const row = {
    category: input.category,
    title: input.title,
    location: input.location,
    image_url: input.image_url,
    alt: input.alt,
  } as {
    category: string;
    title: string;
    location: string;
    image_url: string;
    alt: string;
    sort_order: number;
  };
  if (typeof input.sort_order === "number") row.sort_order = input.sort_order;
  else row.sort_order = 0;
  const anyClient = client as unknown as {
    from(table: string): {
      insert(r: unknown): {
        select(c: string): {
          maybeSingle(): Promise<{
            data: { id: unknown } | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
  const { data, error } = await anyClient
    .from("portfolio_items")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[supabase] insertPortfolioItem failed:", error);
    return { error: error.message || "Failed to create item." };
  }
  if (!data || !data.id) return { error: "No id returned." };
  return { id: String(data.id) };
}

export async function updatePortfolioItem(
  id: string,
  patch: Partial<PortfolioItemInput>,
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      update(p: unknown): {
        eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
      };
    };
  };
  const clean: Record<string, unknown> = {};
  if (patch.category !== undefined) clean["category"] = patch.category;
  if (patch.title !== undefined) clean["title"] = patch.title;
  if (patch.location !== undefined) clean["location"] = patch.location;
  if (patch.image_url !== undefined) clean["image_url"] = patch.image_url;
  if (patch.alt !== undefined) clean["alt"] = patch.alt;
  if (patch.sort_order !== undefined) clean["sort_order"] = patch.sort_order;
  const { error } = await anyClient.from("portfolio_items").update(clean).eq("id", id);
  if (error) {
    console.error("[supabase] updatePortfolioItem failed:", error);
    return { error: error.message || "Failed to update item." };
  }
  return { ok: true };
}

export async function reorderPortfolioItems(
  orderedIds: string[],
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  type Updater = {
    update(p: unknown): {
      eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
    };
  };
  const anyClient = client as unknown as {
    from(t: string): Updater;
  };
  const ids = orderedIds.filter(Boolean);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (!id) continue;
    const { error } = await anyClient.from("portfolio_items").update({ sort_order: i }).eq("id", id);
    if (error) {
      console.error("[supabase] reorderPortfolioItems failed:", error);
      return { error: error.message || "Failed to save order." };
    }
  }
  return { ok: true };
}

export async function deletePortfolioItem(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      delete(): {
        eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
      };
    };
  };
  const { error } = await anyClient.from("portfolio_items").delete().eq("id", id);
  if (error) {
    console.error("[supabase] deletePortfolioItem failed:", error);
    return { error: error.message || "Failed to delete item." };
  }
  return { ok: true };
}

// ------------------- Storage uploads ---------------------------

export type UploadedImage = {
  url: string;
  path: string;
};

const PORTFOLIO_BUCKET = "portfolio-images";

export async function uploadPortfolioImage(opts: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<UploadedImage | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  if (!opts.filename || !opts.contentType || !opts.bytes || opts.bytes.length === 0) {
    return { error: "Invalid file payload." };
  }
  const ext = (opts.filename.split(".").pop() ?? "jpg").toLowerCase();
  const safeExt = /^(jpe?g|png|webp|gif|avif)$/.test(ext) ? (ext === "jpeg" ? "jpg" : ext) : "jpg";
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const path = `${stamp}.${safeExt}`;

  const anyClient = client as unknown as {
    storage: {
      from(bucket: string): {
        upload(
          path: string,
          body: Uint8Array,
          opts: { contentType: string; upsert: boolean; cacheControl: string },
        ): Promise<{
          data: { path: string } | null;
          error: { message?: string } | null;
        }>;
        getPublicUrl(path: string): { data: { publicUrl: string } };
        remove(paths: string[]): Promise<{ error: { message?: string } | null }>;
      };
    };
  };
  const { data, error } = await anyClient.storage
    .from(PORTFOLIO_BUCKET)
    .upload(path, opts.bytes, {
      contentType: opts.contentType,
      upsert: true,
      cacheControl: "public, max-age=31536000, immutable",
    });
  if (error || !data) {
    console.error("[supabase] uploadPortfolioImage failed:", error);
    return { error: error?.message || "Upload failed." };
  }
  const { data: urlData } = anyClient.storage.from(PORTFOLIO_BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl, path: data.path };
}

export async function deleteStorageObject(
  path: string,
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  if (!path) return { ok: true };
  const anyClient = client as unknown as {
    storage: {
      from(bucket: string): {
        remove(paths: string[]): Promise<{ error: { message?: string } | null }>;
      };
    };
  };
  const { error } = await anyClient.storage.from(PORTFOLIO_BUCKET).remove([path]);
  if (error) {
    console.error("[supabase] deleteStorageObject failed:", error);
    return { error: error.message || "Failed to delete file." };
  }
  return { ok: true };
}

// ------------------- Albums ---------------------------

export type Album = {
  id: string;
  category: string;
  title: string;
  location: string;
  cover_image_url: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AlbumInput = {
  category: string;
  title: string;
  location: string;
  cover_image_url?: string;
  description?: string;
  sort_order?: number;
};

export type AlbumPhoto = {
  id: string;
  album_id: string;
  image_url: string;
  alt: string;
  caption: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AlbumPhotoInput = {
  album_id: string;
  image_url: string;
  alt?: string;
  caption?: string;
  sort_order?: number;
};

// -- Album CRUD

export async function listAlbums(): Promise<
  { albums: Album[] } | { error: string }
> {
  const client = getSupabaseReadClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      select(cols: string): {
        order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): {
          order(col2: string, opts2?: { ascending?: boolean }): Promise<{
            data: Album[] | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
  const { data, error } = await anyClient
    .from("albums")
    .select("id,category,title,location,cover_image_url,description,sort_order,created_at,updated_at")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[supabase] listAlbums failed:", error);
    return { error: error.message || "Failed to load albums." };
  }
  return { albums: data ?? [] };
}

export async function getAlbum(
  id: string,
): Promise<{ album: Album } | { error: string }> {
  const client = getSupabaseReadClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      select(cols: string): {
        eq(col: string, val: unknown): {
          maybeSingle(): Promise<{
            data: Album | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
  const { data, error } = await anyClient
    .from("albums")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[supabase] getAlbum failed:", error, "for id:", id);
    return { error: error.message || "Failed to load album." };
  }
  if (!data) return { error: "Album not found." };
  return { album: data };
}

export async function insertAlbum(
  input: AlbumInput,
): Promise<{ id: string } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const row = {
    category: input.category,
    title: input.title,
    location: input.location,
  } as {
    category: string;
    title: string;
    location: string;
    cover_image_url: string;
    description: string;
    sort_order: number;
  };
  if (input.cover_image_url !== undefined) row.cover_image_url = input.cover_image_url;
  else row.cover_image_url = "";
  if (input.description !== undefined) row.description = input.description;
  else row.description = "";
  if (typeof input.sort_order === "number") row.sort_order = input.sort_order;
  else row.sort_order = 0;
  const anyClient = client as unknown as {
    from(table: string): {
      insert(r: unknown): {
        select(c: string): {
          maybeSingle(): Promise<{
            data: { id: unknown } | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
  const { data, error } = await anyClient
    .from("albums")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[supabase] insertAlbum failed:", error);
    return { error: error.message || "Failed to create album." };
  }
  if (!data || !data.id) return { error: "No id returned." };
  return { id: String(data.id) };
}

export async function updateAlbum(
  id: string,
  patch: Partial<AlbumInput>,
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      update(p: unknown): {
        eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
      };
    };
  };
  const clean: Record<string, unknown> = {};
  if (patch.category !== undefined) clean["category"] = patch.category;
  if (patch.title !== undefined) clean["title"] = patch.title;
  if (patch.location !== undefined) clean["location"] = patch.location;
  if (patch.cover_image_url !== undefined) clean["cover_image_url"] = patch.cover_image_url;
  if (patch.description !== undefined) clean["description"] = patch.description;
  if (patch.sort_order !== undefined) clean["sort_order"] = patch.sort_order;
  const { error } = await anyClient.from("albums").update(clean).eq("id", id);
  if (error) {
    console.error("[supabase] updateAlbum failed:", error);
    return { error: error.message || "Failed to update album." };
  }
  return { ok: true };
}

export async function reorderAlbums(
  orderedIds: string[],
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  type Updater = {
    update(p: unknown): {
      eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
    };
  };
  const anyClient = client as unknown as {
    from(t: string): Updater;
  };
  const ids = orderedIds.filter(Boolean);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (!id) continue;
    const { error } = await anyClient.from("albums").update({ sort_order: i }).eq("id", id);
    if (error) {
      console.error("[supabase] reorderAlbums failed:", error);
      return { error: error.message || "Failed to save order." };
    }
  }
  return { ok: true };
}

export async function deleteAlbum(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      delete(): {
        eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
      };
    };
  };
  const { error } = await anyClient.from("albums").delete().eq("id", id);
  if (error) {
    console.error("[supabase] deleteAlbum failed:", error);
    return { error: error.message || "Failed to delete album." };
  }
  return { ok: true };
}

// -- Album Photo CRUD

export async function listAlbumPhotos(
  albumId: string,
): Promise<{ photos: AlbumPhoto[] } | { error: string }> {
  const client = getSupabaseReadClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      select(cols: string): {
        eq(col: string, val: unknown): {
          order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): {
            order(col2: string, opts2?: { ascending?: boolean }): Promise<{
              data: AlbumPhoto[] | null;
              error: { message?: string } | null;
            }>;
          };
        };
      };
    };
  };
  const { data, error } = await anyClient
    .from("album_photos")
    .select("id,album_id,image_url,alt,caption,sort_order,created_at,updated_at")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[supabase] listAlbumPhotos failed:", error, "for albumId:", albumId);
    return { error: error.message || "Failed to load photos." };
  }
  return { photos: data ?? [] };
}

export async function insertAlbumPhoto(
  input: AlbumPhotoInput,
): Promise<{ id: string } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const row = {
    album_id: input.album_id,
    image_url: input.image_url,
  } as {
    album_id: string;
    image_url: string;
    alt: string;
    caption: string;
    sort_order: number;
  };
  if (input.alt !== undefined) row.alt = input.alt;
  else row.alt = "";
  if (input.caption !== undefined) row.caption = input.caption;
  else row.caption = "";
  if (typeof input.sort_order === "number") row.sort_order = input.sort_order;
  else row.sort_order = 0;
  const anyClient = client as unknown as {
    from(table: string): {
      insert(r: unknown): {
        select(c: string): {
          maybeSingle(): Promise<{
            data: { id: unknown } | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
  const { data, error } = await anyClient
    .from("album_photos")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[supabase] insertAlbumPhoto failed:", error);
    return { error: error.message || "Failed to add photo." };
  }
  if (!data || !data.id) return { error: "No id returned." };
  return { id: String(data.id) };
}

export async function updateAlbumPhoto(
  id: string,
  patch: Partial<Omit<AlbumPhotoInput, "album_id">>,
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      update(p: unknown): {
        eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
      };
    };
  };
  const clean: Record<string, unknown> = {};
  if (patch.image_url !== undefined) clean["image_url"] = patch.image_url;
  if (patch.alt !== undefined) clean["alt"] = patch.alt;
  if (patch.caption !== undefined) clean["caption"] = patch.caption;
  if (patch.sort_order !== undefined) clean["sort_order"] = patch.sort_order;
  const { error } = await anyClient.from("album_photos").update(clean).eq("id", id);
  if (error) {
    console.error("[supabase] updateAlbumPhoto failed:", error);
    return { error: error.message || "Failed to update photo." };
  }
  return { ok: true };
}

export async function reorderAlbumPhotos(
  orderedIds: string[],
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  type Updater = {
    update(p: unknown): {
      eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
    };
  };
  const anyClient = client as unknown as {
    from(t: string): Updater;
  };
  const ids = orderedIds.filter(Boolean);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (!id) continue;
    const { error } = await anyClient.from("album_photos").update({ sort_order: i }).eq("id", id);
    if (error) {
      console.error("[supabase] reorderAlbumPhotos failed:", error);
      return { error: error.message || "Failed to save photo order." };
    }
  }
  return { ok: true };
}

export async function deleteAlbumPhoto(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const client = getSupabaseServerClient();
  const cfgErr = notConfiguredCheck(client);
  if (cfgErr) return cfgErr;
  const anyClient = client as unknown as {
    from(table: string): {
      delete(): {
        eq(col: string, val: unknown): Promise<{ error: { message?: string } | null }>;
      };
    };
  };
  const { error } = await anyClient.from("album_photos").delete().eq("id", id);
  if (error) {
    console.error("[supabase] deleteAlbumPhoto failed:", error);
    return { error: error.message || "Failed to delete photo." };
  }
  return { ok: true };
}

export function extractStoragePath(url: string): string {
  if (!url) return "";
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/([^?]+)/);
  return match ? decodeURIComponent(match[1] ?? "") : "";
}


