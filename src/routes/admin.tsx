import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Album as AlbumIcon,
  Archive,
  ArrowBigDown,
  ArrowBigUp,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  GripVertical,
  Image as ImageIcon,
  ImagePlus,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { categories, services } from "@/lib/site-content";
import {
  addAlbumPhoto,
  adminLogin,
  adminLogout,
  adminMe,
  adminSignUp,
  createAlbum as createAlbumFn,
  deleteAlbumAdmin,
  deleteAlbumPhotoAdmin,
  listAlbumsAdmin,
  listEnquiriesAdmin,
  listPhotosForAlbum,
  reorderAlbumPhotosAdmin,
  reorderAlbumsAdmin,
  updateAlbumAdmin,
  updateAlbumPhotoAdmin,
  updateEnquiryStatusAdmin,
  uploadPortfolioImageFn,
} from "./-_admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Vessel Studio" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Private admin panel for Vessel Studio owners and team." },
    ],
  }),
  component: AdminRoute,
});

const CATEGORIES = (categories as readonly string[]).filter((c) => c !== "All");

type AlbumRow = {
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

type PhotoRow = {
  id: string;
  album_id: string;
  image_url: string;
  alt: string;
  caption: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type EnquiryRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  event_date: string;
  location: string;
  message: string;
  source: string | null;
  ip_address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type AdminTab = "albums" | "enquiries";

function AdminRoute() {
  const [authed, setAuthed] = useState<boolean | "loading">("loading");

  useEffect(() => {
    let mounted = true;
    void adminMe().then((r) => {
      if (mounted) setAuthed(r.ok === true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (authed === "loading") return <CenteredLoading />;
  if (authed === false) return <LoginScreen onLoggedIn={() => setAuthed(true)} />;
  return <AdminScreen onLoggedOut={() => setAuthed(false)} />;
}

function CenteredLoading() {
  return (
    <main className="min-h-screen grid place-items-center bg-card">
      <Loader2 size={22} className="animate-spin text-primary" />
    </main>
  );
}

// --------------------------- LOGIN ---------------------------

type Mode = "signin" | "signup";

function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      const r =
        mode === "signin"
          ? await adminLogin({ data: { email, password } })
          : await adminSignUp({
              data: {
                email,
                password,
                fullName: fullName.trim() || undefined,
              },
            });
      if (r.ok) {
        if (r.cookie) document.cookie = r.cookie;
        const verified = await adminMe();
        if (verified.ok) {
          onLoggedIn();
        } else {
          setError(
            "Sign-in credentials were accepted, but the server session could not be re-verified. Please try again (this usually means your browser rejected the session cookie — check third-party / same-site cookie settings for this domain).",
          );
        }
      } else {
        setError(r.message ?? (mode === "signin" ? "Sign in failed." : "Sign up failed."));
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "signin" ? "Admin sign in" : "Create admin account";
  const submitLabel = mode === "signin" ? "Sign in" : "Create account & sign in";
  const submitBusyLabel = mode === "signin" ? "Signing in..." : "Creating account...";
  const switchLabel = mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in";
  const switchTo = mode === "signin" ? "signup" : "signin";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-card p-8 ring-1 ring-foreground/10 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="grid size-11 place-items-center rounded-full bg-primary/15 text-primary">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">Vessel Studio</p>
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
          </div>
        </div>
        <div className="flex rounded-full bg-foreground/5 p-1 mb-5">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(undefined);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
                mode === m ? "bg-background text-foreground shadow-sm" : "text-foreground/55 hover:text-foreground/80"
              }`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>
        {mode === "signup" ? (
          <label className="block space-y-2 mb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              placeholder="Your name (optional)"
            />
          </label>
        ) : null}
        <label className="block space-y-2 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Email address</span>
          <input
            required
            type="email"
            autoComplete={mode === "signin" ? "username" : "email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            placeholder="you@studio.com"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Password</span>
          <input
            required
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            placeholder="At least 6 characters"
          />
        </label>
        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 font-medium text-background transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {submitting ? submitBusyLabel : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(switchTo);
            setError(undefined);
          }}
          className="mt-4 text-xs text-foreground/55 hover:text-primary transition-colors text-center w-full"
        >
          {switchLabel}
        </button>
        <p className="mt-4 pt-4 border-t border-foreground/10 text-xs leading-relaxed text-foreground/55">
          This panel is for owners and team only. If you&apos;re a visitor, you&apos;re looking for the{" "}
          <a href="/works" className="underline underline-offset-2 text-primary">public works page</a>.
        </p>
      </form>
    </main>
  );
}

// --------------------------- ADMIN SCREEN ---------------------------

function AdminScreen({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("albums");
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | undefined>();
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reorderDirty, setReorderDirty] = useState(false);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(true);
  const [enquiriesError, setEnquiriesError] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [expandedEnquiryId, setExpandedEnquiryId] = useState<string | null>(null);
  const [enquiryBusyId, setEnquiryBusyId] = useState<string | null>(null);
  const router = useRouter();

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    setLoadError(undefined);
    const r = await listAlbumsAdmin();
    if (!silent) setLoading(false);
    if ("albums" in r) {
      setAlbums(r.albums as AlbumRow[]);
    } else {
      setLoadError(r.message ?? "Could not load albums.");
    }
  }

  async function reloadEnquiries(silent = false) {
    if (!silent) setEnquiriesLoading(true);
    setEnquiriesError(undefined);
    const payload: { status?: string; service?: string } = {};
    if (statusFilter) payload.status = statusFilter;
    if (serviceFilter) payload.service = serviceFilter;
    const r = await listEnquiriesAdmin({ data: payload });
    if (!silent) setEnquiriesLoading(false);
    if ("inquiries" in r) {
      setEnquiries(r.inquiries as unknown as EnquiryRow[]);
    } else if ("ok" in r && r.ok === false) {
      setEnquiriesError((r as { message?: string }).message ?? "Could not load enquiries.");
    } else {
      setEnquiriesError("Could not load enquiries.");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    void reloadEnquiries();
  }, [statusFilter, serviceFilter]);

  function toastBanner(kind: "ok" | "err", text: string) {
    setBanner({ kind, text });
    window.setTimeout(() => setBanner((b) => (b && b.text === text ? undefined : b)), 3500);
  }

  async function move(index: number, dir: -1 | 1) {
    const next = albums.slice();
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const [row] = next.splice(index, 1);
    if (row) next.splice(target, 0, row);
    setAlbums(next);
    setReorderDirty(true);
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const r = await reorderAlbumsAdmin({ data: { ids: albums.map((i) => i.id) } });
      if (r.ok) {
        setReorderDirty(false);
        toastBanner("ok", "Album order saved.");
        await reload(true);
      } else {
        toastBanner("err", r.message ?? "Failed to save order.");
      }
    } catch {
      toastBanner("err", "Network error saving order.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAlbum(id: string) {
    if (!window.confirm("Delete this album? All its photos and uploaded images will be removed permanently.")) return;
    setSaving(true);
    try {
      const r = await deleteAlbumAdmin({ data: { id } });
      if (r.ok) {
        toastBanner("ok", "Album deleted.");
        setExpandedAlbumId((cur) => (cur === id ? null : cur));
        setEditingAlbumId((cur) => (cur === id ? null : cur));
        await reload(true);
      } else {
        toastBanner("err", r.message ?? "Failed to delete.");
      }
    } catch {
      toastBanner("err", "Network error deleting album.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-foreground/15 sticky top-0 z-10 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">Admin · Vessel Studio</p>
              <h1 className="font-display text-lg font-semibold">
                {activeTab === "albums" ? "Albums manager" : "Enquiries inbox"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/works"
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-3 py-2 text-xs font-medium text-foreground/75 ring-1 ring-foreground/15 hover:bg-card"
            >
              View public site ↗
            </a>
            <button
              type="button"
              onClick={async () => {
                const r = await adminLogout();
                if (r.cookie) document.cookie = r.cookie;
                router.invalidate();
                onLoggedOut();
              }}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-card"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-foreground/10 bg-background/60">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex items-center gap-1">
            {(
              [
                { id: "albums", label: "Albums", icon: AlbumIcon, hint: "Portfolio projects" },
                { id: "enquiries", label: "Enquiries", icon: Inbox, hint: "Visitor submissions" },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`group relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    active ? "text-primary" : "text-foreground/55 hover:text-foreground/85"
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                  {active ? (
                    <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {banner ? (
        <div
          className={`mx-auto max-w-7xl px-5 pt-5 ${
            banner.kind === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
          }`}
        >
          <div
            className={`rounded-lg border px-4 py-2.5 text-sm ${
              banner.kind === "ok"
                ? "border-emerald-700/30 bg-emerald-500/10"
                : "border-destructive/40 bg-destructive/10"
            }`}
          >
            {banner.text}
          </div>
        </div>
      ) : null}

      {activeTab === "albums" ? (
        <section className="mx-auto max-w-7xl px-5 py-8 md:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold md:text-3xl">Albums</h2>
              <p className="mt-1 text-sm text-foreground/60 max-w-[56ch]">
                Create an album per project (e.g. &ldquo;Ankit and Urvi&rdquo;) under a service category, then add multiple photos,
                a cover image, and a brief description. Visitors click albums on /works to see the full gallery.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {reorderDirty ? (
                <button
                  type="button"
                  onClick={saveOrder}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary/30 disabled:opacity-60"
                >
                  <Save size={14} /> {saving ? "Saving order..." : "Save order"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setExpandedAlbumId(null);
                  setEditingAlbumId(null);
                  setCreating(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:-translate-y-0.5 transition-transform active:translate-y-0"
              >
                <Plus size={14} /> New album
              </button>
            </div>
          </div>

          {loadError ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl bg-card p-10 ring-1 ring-foreground/10 text-center">
              <Loader2 size={20} className="mx-auto animate-spin text-primary" />
              <p className="mt-3 text-sm text-foreground/60">Loading albums…</p>
            </div>
          ) : albums.length === 0 && !creating ? (
            <EmptyAlbumsState onAdd={() => setCreating(true)} />
          ) : null}

          {!loading && albums.length ? (
            <div className="space-y-4">
              {albums.map((album, index) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  index={index}
                  total={albums.length}
                  expanded={expandedAlbumId === album.id}
                  editing={editingAlbumId === album.id}
                  saving={saving}
                  onToggleExpand={() =>
                    setExpandedAlbumId((cur) => (cur === album.id ? null : album.id))
                  }
                  onEdit={() => {
                    setCreating(false);
                    setExpandedAlbumId(album.id);
                    setEditingAlbumId((cur) => (cur === album.id ? null : album.id));
                  }}
                  onMoveUp={() => move(index, -1)}
                  onMoveDown={() => move(index, 1)}
                  onSave={(patch) =>
                    handleAlbumSave(album.id, patch, (t) => toastBanner(t.kind, t.text))
                  }
                  onDelete={() => removeAlbum(album.id)}
                  onSavedReload={() => reload(true)}
                  onSetCover={(photoId, url) =>
                    handleSetCover(album.id, photoId, url, (t) => toastBanner(t.kind, t.text))
                  }
                  categories={CATEGORIES}
                  onBanner={(k, t) => toastBanner(k, t)}
                />
              ))}
            </div>
          ) : null}

          {creating ? (
            <CreateAlbumForm
              categories={CATEGORIES}
              defaults={{
                category: "Weddings",
                title: "",
                location: "",
                cover_image_url: "",
                description: "",
              }}
              saving={saving}
              onCancel={() => setCreating(false)}
              onSubmit={async (input) => {
                setSaving(true);
                try {
                  const r = await createAlbumFn({ data: input });
                  if (r.ok) {
                    toastBanner("ok", "Album created. Now add your photos below.");
                    setCreating(false);
                    await reload(true);
                    setTimeout(() => {
                      setAlbums((cur) => {
                        const last = cur[cur.length - 1];
                        if (last) setExpandedAlbumId(last.id);
                        return cur;
                      });
                    }, 100);
                  } else {
                    toastBanner("err", r.message ?? "Failed to create.");
                  }
                } catch {
                  toastBanner("err", "Network error creating album.");
                } finally {
                  setSaving(false);
                }
              }}
            />
          ) : null}
        </section>
      ) : (
        <section className="mx-auto max-w-7xl px-5 py-8 md:py-10">
          <EnquiriesManager
            enquiries={enquiries}
            loading={enquiriesLoading}
            loadError={enquiriesError}
            statusFilter={statusFilter}
            serviceFilter={serviceFilter}
            expandedId={expandedEnquiryId}
            busyId={enquiryBusyId}
            onToggleExpand={(id) =>
              setExpandedEnquiryId((cur) => (cur === id ? null : id))
            }
            onStatusChange={async (id, newStatus) => {
              setEnquiryBusyId(id);
              try {
                const r = await updateEnquiryStatusAdmin({ data: { id, status: newStatus } });
                if ("ok" in r && r.ok) {
                  toastBanner("ok", "Enquiry status updated.");
                  setEnquiries((cur) =>
                    cur.map((e) =>
                      e.id === id ? { ...e, status: newStatus } : e,
                    ),
                  );
                } else {
                  toastBanner(
                    "err",
                    (r as { message?: string }).message ?? "Failed to update status.",
                  );
                }
              } catch {
                toastBanner("err", "Network error updating status.");
              } finally {
                setEnquiryBusyId(null);
              }
            }}
            onRefresh={() => reloadEnquiries(true)}
            onStatusFilterChange={(v) => setStatusFilter(v)}
            onServiceFilterChange={(v) => setServiceFilter(v)}
          />
        </section>
      )}
    </main>
  );
}

type AlbumPatch = {
  category: string;
  title: string;
  location: string;
  cover_image_url: string;
  description: string;
};

async function handleAlbumSave(
  id: string,
  patch: AlbumPatch,
  toast: (t: { kind: "ok" | "err"; text: string }) => void,
) {
  const r = await updateAlbumAdmin({ data: { id, ...patch } });
  if (r.ok) {
    toast({ kind: "ok", text: "Album details saved." });
  } else {
    toast({ kind: "err", text: r.message ?? "Failed to save changes." });
  }
  return r.ok;
}

async function handleSetCover(
  albumId: string,
  photoId: string,
  url: string,
  toast: (t: { kind: "ok" | "err"; text: string }) => void,
) {
  void photoId;
  const r = await updateAlbumAdmin({ data: { id: albumId, cover_image_url: url } });
  if (r.ok) {
    toast({ kind: "ok", text: "Cover image updated." });
  } else {
    toast({ kind: "err", text: r.message ?? "Failed to set cover." });
  }
  return r.ok;
}

function EmptyAlbumsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-foreground/20 p-10 text-center ring-1 ring-foreground/5">
      <AlbumIcon size={26} className="mx-auto text-foreground/40" />
      <h3 className="mt-4 font-display text-xl font-semibold">No albums yet</h3>
      <p className="mt-2 text-sm text-foreground/60">
        Create your first album (e.g. a wedding project) and add photos inside. Run the SQL migration file
        <code className="mx-1 rounded bg-foreground/5 px-1.5 py-0.5 text-[11px]">supabase/migrations/0003_albums_and_photos.sql</code>
        in the Supabase SQL editor to enable storage and seed default albums.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        <Plus size={14} /> Add first album
      </button>
    </div>
  );
}

// --------------------------- ALBUM CARD + PHOTO MANAGER ---------------------------

function AlbumCard(props: {
  album: AlbumRow;
  index: number;
  total: number;
  expanded: boolean;
  editing: boolean;
  saving: boolean;
  categories: readonly string[];
  onToggleExpand: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (patch: AlbumPatch) => Promise<boolean> | boolean;
  onDelete: () => void;
  onSavedReload: () => Promise<void> | void;
  onSetCover: (photoId: string, url: string) => Promise<boolean> | boolean;
  onBanner: (k: "ok" | "err", t: string) => void;
}) {
  const { album, expanded, editing, saving, categories } = props;
  const [form, setForm] = useState<AlbumPatch>({
    category: album.category,
    title: album.title,
    location: album.location,
    cover_image_url: album.cover_image_url,
    description: album.description,
  });
  const [rowBusy, setRowBusy] = useState(false);
  const coverFileRef = useRef<HTMLInputElement | null>(null);

  // Photos state
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosDirty, setPhotosDirty] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [addingPhoto, setAddingPhoto] = useState(false);
  const photoFileRef = useRef<HTMLInputElement | null>(null);
  const editingPhotoIdRef = useRef<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      category: album.category,
      title: album.title,
      location: album.location,
      cover_image_url: album.cover_image_url,
      description: album.description,
    });
  }, [
    album.id,
    album.category,
    album.title,
    album.location,
    album.cover_image_url,
    album.description,
  ]);

  useEffect(() => {
    editingPhotoIdRef.current = editingPhotoId;
  }, [editingPhotoId]);

  // Load photos when expanded
  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    setPhotosLoading(true);
    void listPhotosForAlbum({ data: { album_id: album.id } }).then((r) => {
      if (cancelled) return;
      setPhotosLoading(false);
      if ("photos" in r) setPhotos(r.photos as PhotoRow[]);
    });
    return () => {
      cancelled = true;
    };
  }, [expanded, album.id]);

  async function saveAlbumInline() {
    setRowBusy(true);
    try {
      const ok = await props.onSave(form);
      if (ok) await props.onSavedReload();
    } finally {
      setRowBusy(false);
    }
  }

  async function uploadCover(file: File) {
    setRowBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const r = await uploadPortfolioImageFn({
        data: { filename: file.name, contentType: file.type, bytes },
      });
      if (r.ok) {
        setForm((f) => ({ ...f, cover_image_url: r.url }));
      } else {
        window.alert(r.message ?? "Upload failed.");
      }
    } finally {
      setRowBusy(false);
    }
  }

  // -- Photo helpers

  async function reloadPhotos(silent = false) {
    if (!silent) setPhotosLoading(true);
    const r = await listPhotosForAlbum({ data: { album_id: album.id } });
    if (!silent) setPhotosLoading(false);
    if ("photos" in r) setPhotos(r.photos as PhotoRow[]);
  }

  async function movePhoto(index: number, dir: -1 | 1) {
    const next = photos.slice();
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const [row] = next.splice(index, 1);
    if (row) next.splice(target, 0, row);
    setPhotos(next);
    setPhotosDirty(true);
  }

  async function savePhotoOrder() {
    setRowBusy(true);
    try {
      const r = await reorderAlbumPhotosAdmin({ data: { ids: photos.map((p) => p.id) } });
      if (r.ok) {
        setPhotosDirty(false);
        props.onBanner("ok", "Photo order saved.");
        await reloadPhotos(true);
      } else {
        props.onBanner("err", r.message ?? "Failed to save photo order.");
      }
    } catch {
      props.onBanner("err", "Network error saving photo order.");
    } finally {
      setRowBusy(false);
    }
  }

  async function addPhotoByUrl(url: string) {
    if (!url.trim()) return;
    setAddingPhoto(true);
    try {
      const r = await addAlbumPhoto({
        data: { album_id: album.id, image_url: url.trim() },
      });
      if (r.ok) {
        setNewPhotoUrl("");
        props.onBanner("ok", "Photo added.");
        await reloadPhotos(true);
      } else {
        props.onBanner("err", r.message ?? "Failed to add photo.");
      }
    } catch {
      props.onBanner("err", "Network error adding photo.");
    } finally {
      setAddingPhoto(false);
    }
  }

  async function uploadPhoto(file: File) {
    setAddingPhoto(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const up = await uploadPortfolioImageFn({
        data: { filename: file.name, contentType: file.type, bytes },
      });
      if (!up.ok) {
        window.alert(up.message ?? "Upload failed.");
        return;
      }
      const r = await addAlbumPhoto({
        data: { album_id: album.id, image_url: up.url },
      });
      if (r.ok) {
        props.onBanner("ok", "Photo uploaded and added.");
        await reloadPhotos(true);
      } else {
        props.onBanner("err", r.message ?? "Failed to save photo.");
      }
    } catch {
      props.onBanner("err", "Network error uploading photo.");
    } finally {
      setAddingPhoto(false);
    }
  }

  async function savePhoto(p: PhotoRow, patch: { image_url: string; alt: string; caption: string }) {
    const r = await updateAlbumPhotoAdmin({ data: { id: p.id, ...patch } });
    if (r.ok) {
      props.onBanner("ok", "Photo details saved.");
      await reloadPhotos(true);
    } else {
      props.onBanner("err", r.message ?? "Failed to save photo.");
    }
    return r.ok;
  }

  async function deletePhoto(p: PhotoRow) {
    if (!window.confirm("Delete this photo from the album?")) return;
    setRowBusy(true);
    try {
      const r = await deleteAlbumPhotoAdmin({ data: { id: p.id } });
      if (r.ok) {
        props.onBanner("ok", "Photo removed.");
        // if this was the cover, clear cover on the album
        if (album.cover_image_url === p.image_url) {
          setForm((f) => ({ ...f, cover_image_url: "" }));
        }
        await reloadPhotos(true);
      } else {
        props.onBanner("err", r.message ?? "Failed to delete photo.");
      }
    } catch {
      props.onBanner("err", "Network error deleting photo.");
    } finally {
      setRowBusy(false);
    }
  }

  return (
    <article
      className={`rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden ${
        expanded ? "ring-2 ring-primary/20" : ""
      }`}
    >
      {/* Album header row */}
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start">
        {/* Order controls */}
        <div className="flex items-center gap-2 md:w-10 md:flex-col md:justify-between md:h-36">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5"
            aria-label="Drag handle"
          >
            <GripVertical size={16} />
          </button>
          <div className="flex flex-col md:mt-auto">
            <button
              type="button"
              onClick={props.onMoveUp}
              disabled={props.index === 0 || saving}
              className="grid size-8 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/5 disabled:opacity-40"
              aria-label="Move up"
            >
              <ArrowBigUp size={18} />
            </button>
            <button
              type="button"
              onClick={props.onMoveDown}
              disabled={props.index >= props.total - 1 || saving}
              className="grid size-8 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/5 disabled:opacity-40"
              aria-label="Move down"
            >
              <ArrowBigDown size={18} />
            </button>
          </div>
        </div>

        {/* Cover thumbnail */}
        <div className="w-28 shrink-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-foreground/5 ring-1 ring-foreground/10">
            {form.cover_image_url || album.cover_image_url ? (
              <img
                src={form.cover_image_url || album.cover_image_url}
                alt={`${album.title} cover`}
                className="size-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
            ) : (
              <div className="size-full grid place-items-center text-foreground/30">
                <ImageIcon size={22} />
              </div>
            )}
            {!form.cover_image_url && !album.cover_image_url && photos[0] ? (
              <span className="absolute inset-x-0 bottom-0 bg-background/80 text-[10px] px-1 py-0.5 text-center font-mono uppercase tracking-wider">
                Uses first photo
              </span>
            ) : null}
          </div>
        </div>

        {/* Meta or edit form */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Category</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Title</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Ankit and Urvi"
                  className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Location / year</span>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Alibaug · 2025"
                  className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Cover image URL</span>
                <input
                  value={form.cover_image_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                  placeholder="Optional — uses first photo if blank"
                  className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="md:col-span-2 space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">
                  Brief / description
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="A paragraph about this project for the visitor-facing album page."
                  className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-y"
                />
              </label>
              <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadCover(f);
                    if (coverFileRef.current) coverFileRef.current.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  disabled={rowBusy}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-background disabled:opacity-60"
                >
                  {rowBusy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                  Upload cover
                </button>
                <button
                  type="button"
                  onClick={saveAlbumInline}
                  disabled={rowBusy || saving}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
                >
                  <Save size={13} /> Save changes
                </button>
                <button
                  type="button"
                  onClick={props.onEdit}
                  className="rounded-full px-3 py-2 text-xs font-medium text-foreground/70 ring-1 ring-foreground/15 hover:bg-background"
                >
                  <X size={13} className="mr-1 inline" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  {album.category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-foreground/50">
                  <ImageIcon size={11} />
                  {photos.length || "—"} photos · Sort {props.index + 1}
                </span>
              </div>
              <h3 className="mt-2 font-display text-base font-semibold md:text-lg">{album.title}</h3>
              <p className="text-sm text-foreground/65">{album.location}</p>
              {album.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-foreground/55">{album.description}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={props.onEdit}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-background"
                >
                  <Pencil size={13} /> Edit details
                </button>
                <button
                  type="button"
                  onClick={props.onToggleExpand}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-background"
                >
                  <BookOpen size={13} />
                  {expanded ? (
                    <>
                      Close photos <ChevronUp size={13} />
                    </>
                  ) : (
                    <>
                      Manage photos <ChevronDown size={13} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={props.onDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-destructive/90 ring-1 ring-destructive/20 hover:bg-destructive/5 disabled:opacity-60"
                >
                  <Trash2 size={13} /> Delete album
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded: photo manager */}
      {expanded ? (
        <div className="border-t border-foreground/10 bg-background/40 p-4 md:p-6 space-y-5">
          {/* Add photo bar */}
          <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="font-display text-sm font-semibold">Add photos to this album</h4>
                <p className="text-xs text-foreground/55 mt-0.5">
                  Paste a public URL or upload images directly (JPG, PNG, WebP, GIF, AVIF · max 10MB each).
                </p>
              </div>
              {photosDirty ? (
                <button
                  type="button"
                  onClick={savePhotoOrder}
                  disabled={rowBusy}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground ring-1 ring-primary/30 disabled:opacity-60"
                >
                  <Save size={12} /> Save photo order
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Paste image URL and press Add…"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPhotoUrl.trim()) {
                    e.preventDefault();
                    void addPhotoByUrl(newPhotoUrl);
                  }
                }}
                disabled={addingPhoto}
                className="flex-1 min-w-[240px] rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void addPhotoByUrl(newPhotoUrl)}
                disabled={addingPhoto || !newPhotoUrl.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-xs font-medium ring-1 ring-foreground/15 hover:bg-background disabled:opacity-60"
              >
                {addingPhoto ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add URL
              </button>
              <input
                ref={photoFileRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                hidden
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  for (const f of files) await uploadPhoto(f);
                  if (photoFileRef.current) photoFileRef.current.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => photoFileRef.current?.click()}
                disabled={addingPhoto}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background disabled:opacity-60"
              >
                {addingPhoto ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                {addingPhoto ? "Uploading..." : "Upload images"}
              </button>
            </div>
          </div>

          {/* Photo grid */}
          {photosLoading ? (
            <div className="text-center py-8 text-sm text-foreground/55">
              <Loader2 size={16} className="mx-auto animate-spin text-primary" />
              <p className="mt-2">Loading photos…</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-foreground/15 p-8 text-center text-sm text-foreground/50">
              <ImagePlus size={22} className="mx-auto text-foreground/30" />
              <p className="mt-3">No photos yet. Use the bar above to add them.</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {photos.map((p, idx) => (
                <PhotoCard
                  key={p.id}
                  photo={p}
                  index={idx}
                  total={photos.length}
                  isCover={(form.cover_image_url || album.cover_image_url || photos[0]?.image_url || "") === p.image_url}
                  editing={editingPhotoId === p.id}
                  disabled={rowBusy || addingPhoto}
                  onToggleEdit={() => {
                    const cur = editingPhotoIdRef.current;
                    setEditingPhotoId(cur === p.id ? null : p.id);
                  }}
                  onMoveUp={() => movePhoto(idx, -1)}
                  onMoveDown={() => movePhoto(idx, 1)}
                  onSave={(patch) => savePhoto(p, patch)}
                  onSetCover={async () => {
                    const ok = await props.onSetCover(p.id, p.image_url);
                    if (ok) {
                      setForm((f) => ({ ...f, cover_image_url: p.image_url }));
                    }
                    return !!ok;
                  }}
                  onDelete={() => deletePhoto(p)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

// --------------------------- PHOTO CARD ---------------------------

function PhotoCard(props: {
  photo: PhotoRow;
  index: number;
  total: number;
  isCover: boolean;
  editing: boolean;
  disabled: boolean;
  onToggleEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (patch: { image_url: string; alt: string; caption: string }) => Promise<boolean> | boolean;
  onSetCover: () => Promise<boolean> | boolean;
  onDelete: () => void;
}) {
  const { photo, editing, disabled, isCover } = props;
  const [form, setForm] = useState({
    image_url: photo.image_url,
    alt: photo.alt,
    caption: photo.caption,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({ image_url: photo.image_url, alt: photo.alt, caption: photo.caption });
  }, [photo.id, photo.image_url, photo.alt, photo.caption]);

  async function save() {
    setBusy(true);
    try {
      await props.onSave(form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`group relative rounded-xl overflow-hidden bg-card ring-1 transition-all ${
        isCover ? "ring-2 ring-primary shadow-md" : "ring-foreground/10"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-foreground/5">
        <img
          src={editing ? form.image_url : photo.image_url}
          alt={photo.alt || photo.caption || "album photo"}
          className="size-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
        {isCover ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary-foreground shadow">
            <Star size={9} /> Cover
          </span>
        ) : null}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={props.onMoveUp}
            disabled={props.index === 0 || disabled}
            className="grid size-6 place-items-center rounded-md bg-background/85 text-foreground/70 backdrop-blur hover:bg-background disabled:opacity-30"
            aria-label="Move photo up"
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            onClick={props.onMoveDown}
            disabled={props.index >= props.total - 1 || disabled}
            className="grid size-6 place-items-center rounded-md bg-background/85 text-foreground/70 backdrop-blur hover:bg-background disabled:opacity-30"
            aria-label="Move photo down"
          >
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="p-2.5 space-y-2 bg-background/50 border-t border-foreground/10">
          <label className="block space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-foreground/50">Image URL</span>
            <input
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              className="w-full rounded-md border border-foreground/15 bg-background px-2 py-1.5 text-[11px] outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-foreground/50">Alt text</span>
            <input
              value={form.alt}
              onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
              placeholder="accessibility"
              className="w-full rounded-md border border-foreground/15 bg-background px-2 py-1.5 text-[11px] outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-foreground/50">Caption</span>
            <input
              value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              placeholder="(optional)"
              className="w-full rounded-md border border-foreground/15 bg-background px-2 py-1.5 text-[11px] outline-none focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={save}
              disabled={busy || disabled}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-medium text-background disabled:opacity-60"
            >
              {busy ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Save
            </button>
            <button
              type="button"
              onClick={props.onToggleEdit}
              className="rounded-full px-2.5 py-1 text-[10px] font-medium text-foreground/70 ring-1 ring-foreground/15 hover:bg-background"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {photo.caption ? (
            <p className="line-clamp-2 text-[11px] text-foreground/75">{photo.caption}</p>
          ) : photo.alt ? (
            <p className="line-clamp-1 text-[11px] text-foreground/50 italic">{photo.alt}</p>
          ) : (
            <p className="text-[11px] text-foreground/30 italic">No caption</p>
          )}
          <div className="flex flex-wrap gap-1 pt-0.5">
            <button
              type="button"
              onClick={props.onToggleEdit}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium text-foreground/70 ring-1 ring-foreground/15 hover:bg-background disabled:opacity-50"
            >
              <Pencil size={9} /> Edit
            </button>
            {!isCover ? (
              <button
                type="button"
                onClick={() => void props.onSetCover()}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium text-primary/90 ring-1 ring-primary/25 hover:bg-primary/5 disabled:opacity-50"
              >
                <Star size={9} /> Set cover
              </button>
            ) : null}
            <button
              type="button"
              onClick={props.onDelete}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium text-destructive/85 ring-1 ring-destructive/20 hover:bg-destructive/5 disabled:opacity-50"
            >
              <Trash2 size={9} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------- CREATE ALBUM FORM ---------------------------

function CreateAlbumForm(props: {
  categories: readonly string[];
  defaults: Omit<AlbumPatch, "sort_order">;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: AlbumPatch & { sort_order?: number }) => void;
}) {
  const [form, setForm] = useState<AlbumPatch>({ ...props.defaults });
  const [busy, setBusy] = useState(false);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const canSubmit = useMemo(
    () =>
      form.category.trim().length >= 2 &&
      form.title.trim().length >= 2 &&
      form.location.trim().length >= 2,
    [form],
  );

  async function upload(file: File) {
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const r = await uploadPortfolioImageFn({
        data: { filename: file.name, contentType: file.type, bytes },
      });
      if (r.ok) {
        setForm((f) => ({ ...f, cover_image_url: r.url }));
      } else {
        window.alert(r.message ?? "Upload failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || props.saving || busy) return;
        props.onSubmit({ ...form });
      }}
      className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 ring-2 ring-primary/20"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">New album</h3>
        <button
          type="button"
          onClick={props.onCancel}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 ring-1 ring-foreground/15 hover:bg-background"
        >
          Cancel
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {props.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Ankit and Urvi"
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Location / year</span>
          <input
            required
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Alibaug · 2025"
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">
            Cover image URL (optional)
          </span>
          <input
            value={form.cover_image_url}
            onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
            placeholder="Leave blank to use the first photo you add"
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="md:col-span-2 space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">
            Brief / description
          </span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Tell the story of this project — appears on the visitor-facing album page."
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-y"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={coverFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            if (coverFileRef.current) coverFileRef.current.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => coverFileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-background disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          {busy ? "Uploading..." : "Upload cover"}
        </button>
        {form.cover_image_url ? (
          <span className="text-xs text-foreground/55">Cover is set.</span>
        ) : (
          <span className="text-xs text-foreground/55">
            Optional — if left blank, the first photo added to the album becomes the cover.
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={props.onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 ring-1 ring-foreground/15 hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || props.saving || busy}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {props.saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {props.saving ? "Creating..." : "Create album"}
          </button>
        </div>
      </div>
    </form>
  );
}

// --------------------------- ENQUIRIES MANAGER ---------------------------

const ENQUIRY_STATUS_OPTIONS = ["new", "contacted", "archived"] as const;

function statusBadgeClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-primary/12 text-primary ring-primary/25";
    case "contacted":
      return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 ring-emerald-500/25";
    case "archived":
      return "bg-foreground/10 text-foreground/60 ring-foreground/15";
    default:
      return "bg-foreground/10 text-foreground/60 ring-foreground/15";
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatEventDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type EnquiriesManagerProps = {
  enquiries: readonly EnquiryRow[];
  loading: boolean;
  loadError: string | undefined;
  statusFilter: string;
  serviceFilter: string;
  expandedId: string | null;
  busyId: string | null;
  onToggleExpand: (id: string) => void;
  onStatusChange: (id: string, newStatus: string) => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
  onStatusFilterChange: (value: string) => void;
  onServiceFilterChange: (value: string) => void;
};

function EnquiriesManager(props: EnquiriesManagerProps) {
  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      new: 0,
      contacted: 0,
      archived: 0,
    };
    for (const e of props.enquiries) {
      if (e.status === "new" || e.status === "contacted" || e.status === "archived") {
        counts[e.status] = counts[e.status] ?? 0;
        counts[e.status] += 1;
      }
    }
    return {
      total: props.enquiries.length,
      new: counts.new,
      contacted: counts.contacted,
      archived: counts.archived,
    };
  }, [props.enquiries]);

  const [refreshing, setRefreshing] = useState(false);
  async function handleRefresh() {
    setRefreshing(true);
    try {
      await props.onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats + Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Enquiries</h2>
          <p className="mt-1 text-sm text-foreground/60 max-w-[56ch]">
            Messages submitted by visitors through the contact form. Mark an enquiry as contacted after you&apos;ve replied,
            or archive it when the conversation is complete.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing || props.loading}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-card disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={Inbox} tone="default" />
        <StatCard label="New" value={stats.new} icon={MessageSquare} tone="primary" />
        <StatCard label="Contacted" value={stats.contacted} icon={CheckCircle2} tone="success" />
        <StatCard label="Archived" value={stats.archived} icon={Archive} tone="muted" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/55">
          <Filter size={13} /> Filters
        </div>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Status</span>
          <select
            value={props.statusFilter}
            onChange={(e) => props.onStatusFilterChange(e.target.value)}
            className="rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All statuses</option>
            {ENQUIRY_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Service</span>
          <select
            value={props.serviceFilter}
            onChange={(e) => props.onServiceFilterChange(e.target.value)}
            className="rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.title} value={s.title}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        {(props.statusFilter || props.serviceFilter) ? (
          <button
            type="button"
            onClick={() => {
              props.onStatusFilterChange("");
              props.onServiceFilterChange("");
            }}
            className="ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 ring-1 ring-foreground/15 hover:bg-background"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* Error */}
      {props.loadError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {props.loadError}
        </div>
      ) : null}

      {/* Loading */}
      {props.loading ? (
        <div className="rounded-xl bg-card p-10 ring-1 ring-foreground/10 text-center">
          <Loader2 size={20} className="mx-auto animate-spin text-primary" />
          <p className="mt-3 text-sm text-foreground/60">Loading enquiries…</p>
        </div>
      ) : props.enquiries.length === 0 ? (
        <EmptyEnquiriesState hasFilter={!!(props.statusFilter || props.serviceFilter)} />
      ) : (
        <div className="space-y-3">
          {props.enquiries.map((e) => (
            <EnquiryCard
              key={e.id}
              enquiry={e}
              expanded={props.expandedId === e.id}
              busy={props.busyId === e.id}
              onToggle={() => props.onToggleExpand(e.id)}
              onStatusChange={(ns) => props.onStatusChange(e.id, ns)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard(props: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "default" | "primary" | "success" | "muted";
}) {
  const Icon = props.icon;
  const toneClass =
    props.tone === "primary"
      ? "bg-primary/12 text-primary ring-primary/25"
      : props.tone === "success"
        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 ring-emerald-500/25"
        : props.tone === "muted"
          ? "bg-foreground/10 text-foreground/60 ring-foreground/15"
          : "bg-foreground/8 text-foreground/75 ring-foreground/15";
  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">
          {props.label}
        </span>
        <span className={`grid size-8 place-items-center rounded-full ring-1 ${toneClass}`}>
          <Icon size={14} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{props.value}</p>
    </div>
  );
}

function EmptyEnquiriesState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-foreground/20 p-10 text-center ring-1 ring-foreground/5">
      <Inbox size={26} className="mx-auto text-foreground/40" />
      <h3 className="mt-4 font-display text-xl font-semibold">
        {hasFilter ? "No enquiries match these filters" : "No enquiries yet"}
      </h3>
      <p className="mt-2 text-sm text-foreground/60 max-w-[48ch] mx-auto">
        {hasFilter
          ? "Try clearing the filters above to see all submissions."
          : "Enquiries submitted by visitors through the /contact page will appear here. To test it, visit the contact page and submit the form."}
      </p>
    </div>
  );
}

function EnquiryCard(props: {
  enquiry: EnquiryRow;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onStatusChange: (newStatus: string) => Promise<void> | void;
}) {
  const e = props.enquiry;
  const busy = props.busy;
  return (
    <article
      className={`rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden transition-all ${
        props.expanded ? "ring-2 ring-primary/20" : ""
      }`}
    >
      <button
        type="button"
        onClick={props.onToggle}
        className="w-full text-left p-4 md:p-5 flex flex-col gap-4 md:flex-row md:items-center"
      >
        {/* Avatar / indicator */}
        <div className="shrink-0 flex md:flex-col items-center md:items-start gap-3 md:gap-1">
          <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-primary">
            <MessageSquare size={16} />
          </span>
          <span className="md:hidden text-[11px] font-mono uppercase tracking-wider text-foreground/50">
            {formatDate(e.created_at)}
          </span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold truncate">{e.name}</h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ring-1 ${
                statusBadgeClass(e.status)
              }`}
            >
              {(e.status ?? "new").charAt(0).toUpperCase() + (e.status ?? "new").slice(1)}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
              {e.service}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/60">
            <span className="inline-flex items-center gap-1">
              <Mail size={11} /> {e.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone size={11} /> {e.phone}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-foreground/45">
              <CalendarDays size={11} /> {formatDate(e.created_at)}
            </span>
          </div>
        </div>

        {/* Event date + chevron */}
        <div className="flex items-center justify-between md:justify-end md:gap-4 gap-3 shrink-0">
          <div className="text-right">
            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/45">
              Event date
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80">
              <CalendarDays size={12} className="text-foreground/45" />
              {formatEventDate(e.event_date)}
            </span>
          </div>
          <span
            className={`grid size-8 place-items-center rounded-full text-foreground/50 transition-transform ${
              props.expanded ? "rotate-180" : ""
            }`}
          >
            <ChevronDown size={16} />
          </span>
        </div>
      </button>

      {props.expanded ? (
        <div className="border-t border-foreground/10 bg-background/40 p-4 md:p-6 space-y-5">
          {/* Contact actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent(
                `Re: ${e.service} enquiry — Vessel Studio`,
              )}&body=${encodeURIComponent(`Hi ${e.name},\n\nThanks for reaching out about your ${e.service} on ${e.event_date} in ${e.location}.\n\nRegarding your message:\n"${e.message}"\n\n`)}`}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              <Mail size={13} /> Reply via email
            </a>
            <a
              href={`tel:${encodeURIComponent(e.phone)}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-card"
            >
              <Phone size={13} /> Call {e.phone}
            </a>
            <div className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">
                Mark as
              </span>
              {ENQUIRY_STATUS_OPTIONS.map((opt) => {
                const selected = (e.status ?? "new") === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={busy || selected}
                    onClick={() => void props.onStatusChange(opt)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors disabled:opacity-50 ${
                      selected
                        ? "bg-foreground text-background ring-foreground/30"
                        : "text-foreground/70 ring-foreground/15 hover:bg-card"
                    }`}
                  >
                    {opt === "new" ? (
                      <MessageSquare size={11} />
                    ) : opt === "contacted" ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <Archive size={11} />
                    )}
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    {busy ? <Loader2 size={10} className="animate-spin" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full detail grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <DetailField label="Name" value={e.name} icon={MessageSquare} />
            <DetailField
              label="Service requested"
              value={e.service}
              icon={Star}
              highlight
            />
            <DetailField
              label="Email"
              value={e.email}
              icon={Mail}
              href={`mailto:${encodeURIComponent(e.email)}`}
            />
            <DetailField
              label="Phone"
              value={e.phone}
              icon={Phone}
              href={`tel:${encodeURIComponent(e.phone)}`}
            />
            <DetailField
              label="Event date"
              value={formatEventDate(e.event_date)}
              icon={CalendarDays}
            />
            <DetailField label="Location" value={e.location} icon={MapPin} />
          </div>

          {/* Message */}
          <div className="rounded-xl bg-background/60 ring-1 ring-foreground/10 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="grid size-7 place-items-center rounded-full bg-primary/12 text-primary">
                <MessageSquare size={13} />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">
                Visitor&apos;s message
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
              {e.message}
            </p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-[11px] text-foreground/45">
            <span>
              Submitted: <span className="text-foreground/60">{formatDate(e.created_at)}</span>
            </span>
            {e.updated_at && e.updated_at !== e.created_at ? (
              <span>
                Updated: <span className="text-foreground/60">{formatDate(e.updated_at)}</span>
              </span>
            ) : null}
            {e.source ? (
              <span className="max-w-[40ch] truncate">
                Source: <span className="text-foreground/60">{e.source}</span>
              </span>
            ) : null}
            {e.ip_address ? (
              <span>
                IP: <span className="font-mono text-foreground/60">{e.ip_address}</span>
              </span>
            ) : null}
            <span className="font-mono">id: {e.id.slice(0, 8)}…</span>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DetailField(props: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  highlight?: boolean;
}) {
  const Icon = props.icon;
  const inner = (
    <div className="flex items-start gap-3 rounded-xl bg-card/70 ring-1 ring-foreground/8 px-4 py-3">
      <span
        className={`grid size-8 place-items-center rounded-full shrink-0 ${
          props.highlight ? "bg-primary/12 text-primary" : "bg-foreground/8 text-foreground/60"
        }`}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/50">
          {props.label}
        </span>
        <span
          className={`block text-sm font-medium text-foreground/85 truncate ${
            props.href ? "hover:text-primary transition-colors" : ""
          }`}
        >
          {props.value}
        </span>
      </div>
    </div>
  );
  return props.href ? (
    <a href={props.href} className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}
