import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { insertContactInquiry } from "../lib/supabase-server";

const ContactInquirySchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120, "Name is too long"),
  phone: z.string().trim().min(5, "Phone is too short").max(40, "Phone is too long"),
  email: z.string().trim().email("Enter a valid email").max(200),
  service: z.string().trim().min(2, "Choose a service").max(120),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .refine(
      (s) => {
        const d = new Date(s + "T00:00:00Z");
        return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
      },
      "Invalid calendar date",
    ),
  location: z.string().trim().min(2, "Location is too short").max(200),
  message: z.string().trim().min(10, "Message is too short").max(5000, "Message is too long"),
});

type FormResult =
  | { ok: true; id: string }
  | { ok: false; code: "VALIDATION" | "SERVER" | "CONFIG"; errors?: Record<string, string[]>; message?: string };

function extractIp(request: Request): string | undefined {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",").at(0);
      if (first) return first.trim();
    }
    const real = request.headers.get("x-real-ip");
    if (real) return real.trim();
  } catch {
    /* ignore */
  }
  return undefined;
}

export const submitContactInquiry = createServerFn({ method: "POST" })
  .validator((body: unknown) => ContactInquirySchema.safeParse(body))
  .handler(async (args) => {
    const ctx = (args?.context ?? undefined) as { request?: Request } | undefined;
    const request = ctx?.request;
    const parseResult = (args?.data ?? undefined) as ReturnType<typeof ContactInquirySchema.safeParse>;

    if (!parseResult) {
      const res: FormResult = { ok: false, code: "SERVER", message: "Submission payload was missing." };
      return res;
    }

    if (!parseResult.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const key = issue.path.join(".") || "_";
        const bucket = errors[key] ?? (errors[key] = []);
        bucket.push(issue.message);
      }
      const res: FormResult = { ok: false, code: "VALIDATION", errors };
      return res;
    }

    const payload = parseResult.data;

    const result = await insertContactInquiry({
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      service: payload.service,
      event_date: payload.date,
      location: payload.location,
      message: payload.message,
      source: request?.headers.get("referer") ?? request?.url ?? null,
      ip_address: request ? extractIp(request) ?? null : null,
    });

    if ("error" in result) {
      const isConfig = result.error.includes("not configured");
      const res: FormResult = {
        ok: false,
        code: isConfig ? "CONFIG" : "SERVER",
        message: isConfig
          ? "This site is not yet configured to accept enquiries. Please contact us directly."
          : "We couldn't save your enquiry right now. Please try again in a few minutes or reach out directly.",
      };
      return res;
    }

    const res: FormResult = { ok: true, id: result.id };
    return res;
  });
