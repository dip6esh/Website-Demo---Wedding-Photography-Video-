import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { FormEvent, useState } from "react";

import { contactDetails, services } from "@/lib/site-content";
import { submitContactInquiry } from "./-_contact.submit";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact Vessel Studio — Begin an Enquiry" },
    { name: "description", content: "Tell Vessel Studio about your date, location, and the story you want photographed or filmed." },
    { property: "og:title", content: "Contact Vessel Studio — Begin an Enquiry" },
    { property: "og:description", content: "Start a conversation about your wedding, event, family, product, or brand story." },
  ] }),
  component: ContactPage,
});

type FormErrors = Record<string, string[]>;

function extractFormErrorText(errors: FormErrors | undefined): string | undefined {
  if (!errors) return undefined;
  const first = Object.values(errors)[0];
  return first?.[0];
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors | undefined>();
  const [globalError, setGlobalError] = useState<string | undefined>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      service: String(data.get("service") ?? ""),
      date: String(data.get("date") ?? ""),
      location: String(data.get("location") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    setSubmitting(true);
    setErrors(undefined);
    setGlobalError(undefined);

    try {
      const result = await submitContactInquiry({ data: payload });
      if (result.ok) {
        setSent(true);
        form.reset();
      } else if (result.code === "VALIDATION") {
        setErrors(result.errors);
        setGlobalError(extractFormErrorText(result.errors));
      } else {
        setGlobalError(
          result.message ??
            "We couldn't send your enquiry right now. Please try again or reach out directly.",
        );
      }
    } catch (err) {
      console.error("Contact submission failed:", err);
      setGlobalError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="border-b border-foreground/15">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Contact · 04</p>
          <h1 className="max-w-[13ch] font-display text-5xl font-bold leading-[0.98] md:text-7xl">Tell us the date. We&apos;ll handle the light.</h1>
          <p className="mt-7 max-w-[43ch] text-base leading-relaxed text-foreground/70">Share a few details and we&apos;ll get back to you within two working days with availability and next steps.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-[1fr_0.7fr] md:py-20">
        <div>
          {sent ? (
            <div className="rounded-xl bg-card p-8 ring-1 ring-foreground/10">
              <div className="mb-5 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check size={22} />
              </div>
              <h2 className="font-display text-3xl font-semibold">Enquiry received.</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/65">
                Thank you for trusting us with the first details. We&apos;ll be in touch shortly.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-7 font-mono text-[11px] uppercase tracking-[0.16em] text-primary"
              >
                Send another enquiry ↗
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {globalError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {globalError}
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Name</span>
                  <input
                    required
                    name="name"
                    className="w-full border-b border-foreground/25 bg-transparent px-0 py-3 outline-none transition-colors placeholder:text-foreground/35 focus:border-primary"
                    placeholder="Your name"
                    disabled={submitting}
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Phone</span>
                  <input
                    required
                    name="phone"
                    type="tel"
                    className="w-full border-b border-foreground/25 bg-transparent px-0 py-3 outline-none transition-colors placeholder:text-foreground/35 focus:border-primary"
                    placeholder="+91 ..."
                    disabled={submitting}
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Email</span>
                  <input
                    required
                    name="email"
                    type="email"
                    className="w-full border-b border-foreground/25 bg-transparent px-0 py-3 outline-none transition-colors placeholder:text-foreground/35 focus:border-primary"
                    placeholder="you@example.com"
                    disabled={submitting}
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Service</span>
                  <select
                    required
                    name="service"
                    defaultValue=""
                    className="w-full border-b border-foreground/25 bg-background py-3 outline-none focus:border-primary"
                    disabled={submitting}
                  >
                    <option value="" disabled>Select a service</option>
                    {services.map((service) => (
                      <option key={service.number}>{service.title}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Event date</span>
                  <input
                    required
                    name="date"
                    type="date"
                    className="w-full border-b border-foreground/25 bg-transparent px-0 py-3 outline-none focus:border-primary"
                    disabled={submitting}
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Location</span>
                  <input
                    required
                    name="location"
                    className="w-full border-b border-foreground/25 bg-transparent px-0 py-3 outline-none transition-colors placeholder:text-foreground/35 focus:border-primary"
                    placeholder="City or venue"
                    disabled={submitting}
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">Message</span>
                <textarea
                  required
                  name="message"
                  rows={5}
                  className="w-full resize-y border-b border-foreground/25 bg-transparent px-0 py-3 outline-none transition-colors placeholder:text-foreground/35 focus:border-primary"
                  placeholder="Tell us a little about what you are planning..."
                  disabled={submitting}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 font-medium text-background transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send enquiry
                    <Send size={15} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <aside className="h-fit border-t border-foreground/15 pt-6 md:border-t-0 md:border-l md:pl-8">
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Direct contact</p>
          <div className="space-y-5">
            <a href={contactDetails.whatsappHref} className="flex items-start gap-3">
              <MessageCircle size={17} className="mt-0.5 text-primary" />
              <span>
                <strong className="block font-medium">WhatsApp</strong>
                <span className="text-sm text-foreground/60">{contactDetails.whatsapp}</span>
              </span>
            </a>
            <a href={contactDetails.phoneHref} className="flex items-start gap-3">
              <Phone size={17} className="mt-0.5 text-primary" />
              <span>
                <strong className="block font-medium">Phone</strong>
                <span className="text-sm text-foreground/60">{contactDetails.phone}</span>
              </span>
            </a>
            <a href={contactDetails.emailHref} className="flex items-start gap-3">
              <Mail size={17} className="mt-0.5 text-primary" />
              <span>
                <strong className="block font-medium">Email</strong>
                <span className="text-sm text-foreground/60">{contactDetails.email}</span>
              </span>
            </a>
            <div className="flex items-start gap-3">
              <MapPin size={17} className="mt-0.5 text-primary" />
              <span>
                <strong className="block font-medium">Based in</strong>
                <span className="text-sm text-foreground/60">Mumbai · available worldwide</span>
              </span>
            </div>
          </div>
          <div className="mt-10 border-t border-foreground/15 pt-6">
            <p className="text-sm leading-relaxed text-foreground/60">Prefer to start with a quick hello?</p>
            <a
              href={contactDetails.whatsappHref}
              className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary"
            >
              Open WhatsApp ↗
            </a>
          </div>
        </aside>
      </section>

      <section className="border-t border-foreground/15 bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-10">
          <p className="font-display text-xl font-semibold">Or browse a few stories first.</p>
          <Link to="/works" className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            View the works ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
