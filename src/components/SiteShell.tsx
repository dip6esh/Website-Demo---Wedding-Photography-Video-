import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, Moon, Sun, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { contactDetails } from "@/lib/site-content";
import { useTheme } from "@/hooks/use-theme";

const navItems = [
  { label: "About", to: "/about" as const },
  { label: "Services", to: "/services" as const },
  { label: "Our Works", to: "/works" as const },
  { label: "Contact", to: "/contact" as const },
];

function ThemeToggle() {
  const { actualTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? actualTheme === "dark" : false;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      suppressHydrationWarning
      className="grid size-10 shrink-0 place-items-center rounded-full border border-foreground/20 text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground hover:-translate-y-0.5 active:translate-y-0"
    >
      <span suppressHydrationWarning>
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </span>
    </button>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="grain min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-foreground/15 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-display text-lg font-bold tracking-tight" onClick={() => setMenuOpen(false)}>
            VESSEL<span className="text-primary">.</span>studio
          </Link>

          <nav className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.18em] md:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} activeProps={{ className: "text-foreground" }} className="text-foreground/55 transition-colors hover:text-primary">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/contact" className="hidden rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:inline-flex">
              Enquire
            </Link>
            <button type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} className="grid size-10 place-items-center rounded-full border border-foreground/20 md:hidden" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-foreground/15 px-5 py-3 md:hidden" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-foreground/10 py-4 font-mono text-xs uppercase tracking-[0.18em] last:border-0">
                {item.label}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        )}
      </header>

      {children}

      <footer className="border-t border-foreground/15 bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link to="/" className="font-display text-lg font-semibold">VESSEL<span className="text-primary">.</span>studio</Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-background/60">A photography and filmmaking studio for weddings, families and brands. We build archives, not just memories.</p>
          </div>
          <div className="font-mono text-[11px] uppercase leading-loose tracking-[0.15em] text-background/60">
            <p className="mb-2 text-primary">Direct line</p>
            <a className="block transition-colors hover:text-background" href={contactDetails.whatsappHref}>WhatsApp · {contactDetails.whatsapp}</a>
            <a className="block transition-colors hover:text-background" href={contactDetails.phoneHref}>Phone · {contactDetails.phone}</a>
            <a className="block transition-colors hover:text-background" href={contactDetails.emailHref}>Email · {contactDetails.email}</a>
          </div>
          <div className="font-mono text-[11px] uppercase leading-loose tracking-[0.15em] text-background/60">
            <p className="mb-2 text-primary">Site index</p>
            {navItems.map((item) => <Link key={item.to} to={item.to} className="block transition-colors hover:text-background">{item.label}</Link>)}
          </div>
        </div>
        <div className="border-t border-background/15">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-background/45">
            <span>© 2026 Vessel Studio</span>
            <span>Made for the unrepeatable</span>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-foreground/15 bg-background/95 md:hidden">
        <div className="flex items-stretch">
          <Link to="/works" className="flex flex-1 flex-col items-center justify-center py-3 text-foreground/65 active:bg-card"><span className="mb-1 text-sm">◌</span><span className="font-mono text-[10px] uppercase tracking-[0.14em]">Works</span></Link>
          <Link to="/services" className="flex flex-1 flex-col items-center justify-center py-3 text-foreground/65 active:bg-card"><span className="mb-1 text-sm">＋</span><span className="font-mono text-[10px] uppercase tracking-[0.14em]">Services</span></Link>
          <a href={contactDetails.whatsappHref} className="flex flex-1 flex-col items-center justify-center bg-primary py-3 text-primary-foreground active:bg-primary/85"><MessageCircle size={15} className="mb-1" /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">WhatsApp</span></a>
        </div>
      </div>
    </div>
  );
}