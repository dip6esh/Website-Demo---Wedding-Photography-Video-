import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  ArrowBigDown,
  ArrowBigUp,
  Check,
  GripVertical,
  ImagePlus,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { categories } from "@/lib/site-content";
import {
  adminLogin,
  adminLogout,
  adminMe,
  adminSignUp,
  createPortfolioItem,
  deletePortfolio,
  listPortfolio,
  reorderPortfolio,
  updatePortfolio,
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

type Item = {
  id: string;
  category: string;
  title: string;
  location: string;
  image_url: string;
  alt: string;
  sort_order: number;
};

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

  if (authed === "loading") {
    return <CenteredLoading />;
  }

  if (authed === false) {
    return <LoginScreen onLoggedIn={() => setAuthed(true)} />;
  }

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
        if (r.cookie) {
          document.cookie = r.cookie;
        }
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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reorderDirty, setReorderDirty] = useState(false);
  const router = useRouter();

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    setLoadError(undefined);
    const r = await listPortfolio();
    if (!silent) setLoading(false);
    if ("items" in r) {
      setItems(r.items as Item[]);
    } else {
      setLoadError(r.message ?? "Could not load works.");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function toastBanner(kind: "ok" | "err", text: string) {
    setBanner({ kind, text });
    window.setTimeout(() => setBanner((b) => (b && b.text === text ? undefined : b)), 3500);
  }

  async function move(index: number, dir: -1 | 1) {
    const next = items.slice();
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const [row] = next.splice(index, 1);
    if (row) next.splice(target, 0, row);
    setItems(next);
    setReorderDirty(true);
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const r = await reorderPortfolio({ data: { ids: items.map((i) => i.id) } });
      if (r.ok) {
        setReorderDirty(false);
        toastBanner("ok", "Order saved.");
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

  async function removeItem(id: string) {
    if (!window.confirm("Delete this portfolio item? Its image (if uploaded through this panel) will also be removed from storage.")) return;
    setSaving(true);
    try {
      const r = await deletePortfolio({ data: { id } });
      if (r.ok) {
        toastBanner("ok", "Item deleted.");
        setEditingId((cur) => (cur === id ? null : cur));
        await reload(true);
      } else {
        toastBanner("err", r.message ?? "Failed to delete.");
      }
    } catch {
      toastBanner("err", "Network error deleting item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-foreground/15 sticky top-0 z-10 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">Admin · Vessel Studio</p>
              <h1 className="font-display text-lg font-semibold">Works manager</h1>
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

      {banner ? (
        <div
          className={`mx-auto max-w-6xl px-5 pt-5 ${
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

      <section className="mx-auto max-w-6xl px-5 py-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Portfolio items</h2>
            <p className="mt-1 text-sm text-foreground/60 max-w-[52ch]">
              Order, edit images and titles. Drag isn&apos;t wired yet — use the arrow buttons to reorder, then
              click Save order. Changes appear on the public <a href="/works" className="text-primary underline-offset-2 hover:underline">/works</a> page immediately.
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
                setEditingId(null);
                setCreating(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:-translate-y-0.5 transition-transform active:translate-y-0"
            >
              <Plus size={14} /> New item
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
          <p className="mt-3 text-sm text-foreground/60">Loading works…</p>
        </div>
        ) : items.length === 0 && !creating ? (
          <EmptyState onAdd={() => setCreating(true)} />
        ) : null}

        {!loading && items.length ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <ItemRow
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                editing={editingId === item.id}
                saving={saving}
                onEdit={() => {
                  setCreating(false);
                  setEditingId((cur) => (cur === item.id ? null : item.id));
                }}
                onMoveUp={() => move(index, -1)}
                onMoveDown={() => move(index, 1)}
                onSave={(patch) =>
                  handlePatch(item.id, patch, (t) => toastBanner(t.kind, t.text))
                }
                onDelete={() => removeItem(item.id)}
                onSavedReload={() => reload(true)}
                categories={CATEGORIES}
              />
            ))}
          </div>
        ) : null}

        {creating ? (
          <CreateItemForm
            categories={CATEGORIES}
            defaults={{
              category: "Weddings",
              title: "",
              location: "",
              image_url: "",
              alt: "",
            }}
            saving={saving}
            onCancel={() => setCreating(false)}
            onSubmit={async (input) => {
              setSaving(true);
              try {
                const r = await createPortfolioItem({ data: input });
                if (r.ok) {
                  toastBanner("ok", "Item created.");
                  setCreating(false);
                  await reload(true);
                } else {
                  toastBanner("err", r.message ?? "Failed to create.");
                }
              } catch {
                toastBanner("err", "Network error creating item.");
              } finally {
                setSaving(false);
              }
            }}
          />
        ) : null}
      </section>
    </main>
  );
}

type ItemPatch = {
  category: string;
  title: string;
  location: string;
  image_url: string;
  alt: string;
};

async function handlePatch(
  id: string,
  patch: ItemPatch,
  toast: (t: { kind: "ok" | "err"; text: string }) => void,
) {
  const r = await updatePortfolio({ data: { id, ...patch } });
  if (r.ok) {
    toast({ kind: "ok", text: "Changes saved." });
  } else {
    toast({ kind: "err", text: r.message ?? "Failed to save changes." });
  }
  return r.ok;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-foreground/20 p-10 text-center ring-1 ring-foreground/5">
      <ImagePlus size={26} className="mx-auto text-foreground/40" />
      <h3 className="mt-4 font-display text-xl font-semibold">No portfolio items yet</h3>
      <p className="mt-2 text-sm text-foreground/60">
        The 8 default items in Supabase should appear here automatically after you ran the SQL script.
        If they don&apos;t, press Refresh, or add a new item to get started.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        <Plus size={14} /> Add first item
      </button>
    </div>
  );
}

// --------------------------- EDIT ROW ---------------------------

function ItemRow(props: {
  item: Item;
  index: number;
  total: number;
  editing: boolean;
  saving: boolean;
  categories: readonly string[];
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (patch: ItemPatch) => Promise<boolean> | boolean;
  onDelete: () => void;
  onSavedReload: () => Promise<void> | void;
}) {
  const { item, index, total, editing, saving, categories } = props;

  const [form, setForm] = useState<ItemPatch>({
    category: item.category,
    title: item.title,
    location: item.location,
    image_url: item.image_url,
    alt: item.alt,
  });
  const [rowBusy, setRowBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm({
      category: item.category,
      title: item.title,
      location: item.location,
      image_url: item.image_url,
      alt: item.alt,
    });
  }, [item.id, item.category, item.title, item.location, item.image_url, item.alt]);

  async function saveInlineSave() {
    setRowBusy(true);
    try {
      const ok = await props.onSave(form);
      if (ok) await props.onSavedReload();
    } finally {
      setRowBusy(false);
    }
  }

  async function handleUpload(file: File) {
    setRowBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const r = await uploadPortfolioImageFn({
        data: { filename: file.name, contentType: file.type, bytes },
      });
      if (r.ok) {
        setForm((f) => ({ ...f, image_url: r.url }));
      } else {
        window.alert(r.message ?? "Upload failed.");
      }
    } finally {
      setRowBusy(false);
    }
  }

  return (
    <article
      className={`rounded-xl bg-card ring-1 ring-foreground/10 ${editing ? "ring-2 ring-primary/30" : ""}`}
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start">
        <div className="flex items-center gap-2 md:w-10 md:flex-col md:justify-between md:h-36">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5"
            title="Drag (not wired yet)"
            aria-label="Drag handle"
          >
            <GripVertical size={16} />
          </button>
          <div className="flex flex-col md:mt-auto">
            <button
              type="button"
              onClick={props.onMoveUp}
              disabled={index === 0 || saving}
              className="grid size-8 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/5 disabled:opacity-40"
              aria-label="Move up"
            >
              <ArrowBigUp size={18} />
            </button>
            <button
              type="button"
              onClick={props.onMoveDown}
              disabled={index >= total - 1 || saving}
              className="grid size-8 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/5 disabled:opacity-40"
              aria-label="Move down"
            >
              <ArrowBigDown size={18} />
            </button>
          </div>
        </div>

        <div className="w-28 shrink-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-foreground/5 ring-1 ring-foreground/10">
            <img
              src={form.image_url || item.image_url}
              alt={form.alt || item.title}
              className="size-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          </div>
        </div>

        {editing ? (
          <div className="flex-1 grid gap-3 md:grid-cols-2">
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
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Image URL</span>
              <input
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="md:col-span-2 space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Alt text</span>
              <input
                value={form.alt}
                onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
                placeholder="Brief description for accessibility"
                className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={rowBusy}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-background disabled:opacity-60"
              >
                {rowBusy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                {rowBusy ? "Uploading..." : "Upload new image"}
              </button>
              <button
                type="button"
                onClick={saveInlineSave}
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
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                {item.category}
              </span>
              <span className="text-xs text-foreground/50">Sort {index + 1} · DB {item.sort_order}</span>
            </div>
            <h3 className="mt-2 font-display text-base font-semibold md:text-lg">{item.title}</h3>
            <p className="text-sm text-foreground/65">{item.location}</p>
            {item.alt ? (
              <p className="mt-2 line-clamp-1 text-xs text-foreground/45">
                Alt: {item.alt}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={props.onEdit}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-background"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={props.onDelete}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-destructive/90 ring-1 ring-destructive/20 hover:bg-destructive/5 disabled:opacity-60"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// --------------------------- CREATE FORM ---------------------------

function CreateItemForm(props: {
  categories: readonly string[];
  defaults: Omit<ItemPatch, "sort_order">;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (input: ItemPatch & { sort_order?: number }) => void;
}) {
  const [form, setForm] = useState<ItemPatch>({ ...props.defaults });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const canSubmit = useMemo(
    () =>
      form.category.trim().length >= 2 &&
      form.title.trim().length >= 2 &&
      form.location.trim().length >= 2 &&
      form.image_url.trim().length >= 4,
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
        setForm((f) => ({ ...f, image_url: r.url }));
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
      className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 ring-2 ring-primary/20"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">New portfolio item</h3>
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
            placeholder="e.g. The Ceremony"
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
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Image URL</span>
          <input
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            placeholder="https://... or upload below"
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="md:col-span-2 space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/55">Alt text</span>
          <input
            value={form.alt}
            onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
            placeholder="Describe the image for screen readers"
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-foreground/80 ring-1 ring-foreground/15 hover:bg-background disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          {busy ? "Uploading..." : "Upload image"}
        </button>
        {form.image_url ? (
          <span className="text-xs text-foreground/55">
            Image is set. The preview above shows it live when you save.
          </span>
        ) : (
          <span className="text-xs text-foreground/55">
            Upload a file or paste a URL above.
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
            {props.saving ? "Creating..." : "Create item"}
          </button>
        </div>
      </div>
    </form>
  );
}
