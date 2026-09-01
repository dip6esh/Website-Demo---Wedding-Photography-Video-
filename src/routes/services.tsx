import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { services } from "@/lib/site-content";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [
    { title: "Services — Vessel Studio" },
    { name: "description", content: "Explore Vessel Studio services for weddings, pre-weddings, families, products, corporate stories, and events." },
    { property: "og:title", content: "Services — Vessel Studio" },
    { property: "og:description", content: "Photography and filmmaking services shaped around the people, products, and celebrations that matter." },
  ] }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <main>
      <section className="border-b border-foreground/15"><div className="mx-auto max-w-6xl px-5 py-14 md:py-20"><p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Services · 02</p><h1 className="max-w-[13ch] font-display text-5xl font-bold leading-[0.98] md:text-7xl">Six ways to work with us.</h1><p className="mt-7 max-w-[45ch] text-base leading-relaxed text-foreground/70">From a full wedding weekend to a single product frame, we bring the same care: thoughtful direction, beautiful light, and a finish that lasts.</p></div></section>
      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20"><div className="divide-y divide-foreground/15 border-y border-foreground/15">{services.map((service) => <article key={service.number} className="grid gap-6 py-8 md:grid-cols-[5rem_1fr_1fr_auto] md:items-center"><span className="font-mono text-xs text-primary">{service.number}</span><h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">{service.title}</h2><p className="max-w-md text-sm leading-relaxed text-foreground/65">{service.description}</p><Link to="/contact" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Enquire <ArrowUpRight size={14} /></Link></article>)}</div></section>
      <section className="border-y border-foreground/15 bg-card/60"><div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 md:flex-row md:items-end md:justify-between md:py-20"><div><p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Not sure what fits?</p><h2 className="max-w-[16ch] font-display text-3xl font-semibold md:text-5xl">Tell us what you&apos;re planning.</h2></div><Link to="/contact" className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground">Talk it through <ArrowUpRight size={16} /></Link></div></section>
    </main>
  );
}