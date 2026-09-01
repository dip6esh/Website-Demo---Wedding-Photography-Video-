import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import heroImage from "@/assets/wedding-hero.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About Vessel Studio — Our Approach" },
    { name: "description", content: "Meet the people behind Vessel Studio and discover our patient, cinematic approach to wedding photography and filmmaking." },
    { property: "og:title", content: "About Vessel Studio — Our Approach" },
    { property: "og:description", content: "A small visual studio with a patient, cinematic approach to weddings, families, and brands." },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main>
      <section className="border-b border-foreground/15">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-12 md:items-end md:py-20">
          <div className="md:col-span-7"><p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">About the studio · 01</p><h1 className="max-w-[14ch] font-display text-5xl font-bold leading-[0.98] md:text-7xl">A small team for the big, unrepeatable things.</h1></div>
          <p className="max-w-[38ch] text-base leading-relaxed text-foreground/70 md:col-span-5 md:pb-1">We photograph with the patience of a long take and edit with the care of a printed album. The result is honest, tactile, and completely yours.</p>
        </div>
        <img src={heroImage} alt="Bride in a flowing dress at golden hour" width={1024} height={1280} className="mx-auto block aspect-[16/8] w-full max-w-6xl object-cover object-center px-5 pb-5 md:aspect-[16/7] md:px-5 md:pb-8" />
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4"><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/45">Our point of view</p></div>
        <div className="space-y-8 text-lg leading-relaxed text-foreground/75 md:col-span-7 md:col-start-6"><p>Vessel began with a simple belief: the best wedding photographs should feel like memory, not performance. We look for the glance across a crowded room, the hands that reach without thinking, the quiet five minutes before everyone arrives.</p><p>Our process is calm, collaborative, and deliberately human. We make space for the day to unfold, then shape what we find into photographs and films with a strong sense of place.</p><div className="border-l-2 border-primary pl-5 font-display text-2xl leading-snug text-foreground">“The frame is only the beginning. The feeling has to make it all the way through.”</div></div>
      </section>
      <section className="border-y border-foreground/15 bg-card/60"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2 md:py-20"><div><p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">The people</p><h2 className="max-w-[13ch] font-display text-3xl font-semibold md:text-5xl">Two eyes. One shared language.</h2></div><div className="space-y-5 text-sm leading-relaxed text-foreground/65"><p>Vessel is led by Arjun and Mira — a photographer and filmmaker who have spent the last decade working between celebrations, portraits, and brand stories.</p><p>We keep the crew small so the experience stays personal. You’ll know who is in the room, why they’re there, and what we’re looking for.</p><Link to="/contact" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Meet us over a coffee <ArrowUpRight size={13} /></Link></div></div></section>
      <section className="mx-auto max-w-6xl px-5 py-16 text-center md:py-24"><p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Your story, next</p><h2 className="mx-auto max-w-[18ch] font-display text-4xl font-bold leading-tight md:text-6xl">Let&apos;s make something that feels like you.</h2><Link to="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 font-medium text-background">Start a conversation <ArrowUpRight size={16} /></Link></section>
    </main>
  );
}