# Admin Dashboard Enquiries Implementation Plan

## Repository Research

### Current State
1. **Database Schema (contact_inquiries table** – defined in `supabase/migrations/0001_contact_inquiries.sql`
   - Fields: `id` (uuid), `name`, `phone`, `email`, `service`, `event_date`, `location`, `message`, `source`, `ip_address`, `status` (default 'new'), `created_at`, `updated_at`
   - RLS policies: anon can INSERT; service_role can SELECT/UPDATE
   - Indexes on `created_at` (desc) and `status`

2. **Submission Pipeline – already works end-to-end:**
   - Form in `src/routes/contact.tsx` collects 7 fields: name, phone, email, service, date, location, message
   - Validated server-side in `src/routes/-_contact.submit.ts` with Zod schema
   - Inserted via `insertContactInquiry()` in `src/lib/supabase-server.ts`
   - Service matches the 6 services from `site-content.ts` (Weddings, Pre-Weddings, Baby & Kids, Products, Corporate, Events)

3. **Existing Admin Panel** – currently a single-view "Albums manager" in `src/routes/admin.tsx`
   - Auth flow: login/signup screens → `adminMe()` check → `AdminScreen`
   - Pattern: header (ShieldCheck icon, `font-display` typography), banner toasts, loading skeletons with `Loader2`, card-based layout with `ring-1 ring-foreground/10`
   - `AdminScreen` renders inline without tabs — just an albums section directly
   - Server-side CRUD for albums/photos is mediated by `createServerFn` calls in `src/routes/-_admin.ts`
   - Auth gate pattern: `debugAuth(label, args)` → `isAdminFromCtx(args)` → unauth on fail

4. **Server Library** – missing pieces for enquiries:**
   - `supabase-server.ts` has `insertContactInquiry` but NO read/update/delete/list
   - `-_admin.ts` has NO admin-protected server functions for enquiries
   - `admin.tsx` has NO enquiries UI section

### Design System Conventions (must follow these exactly:
- Typography: `font-display` for headings, `font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55` for field labels
- Colors: `bg-card`, `bg-background`, `text-primary`, `ring-1 ring-foreground/10` for cards, `ring-2 ring-primary/20` for active
- Buttons: `rounded-full`, `bg-foreground` for primary CTA, `ring-1 ring-foreground/15 hover:bg-background` for secondary
- Badges: `rounded-full bg-primary/10 text-primary` with mono uppercase
- Status enum values: `new`, `contacted`, `archived` or similar – use existing `status` column default `'new'`

## Files and Modules
- `src/lib/supabase-server.ts`: Add `ContactInquiry` type, `listContactInquiries`, `updateContactInquiryStatus`
- `src/routes/-_admin.ts`: Add `listEnquiriesAdmin`, `updateEnquiryStatusAdmin` server functions (auth-gated, Zod validated)
- `src/routes/admin.tsx`: Add tab switcher (Albums / Enquiries), EnquiriesManager component with:
  - Summary stats (total, new, contacted
  - Filter/sort controls (status filter, service filter, date sort)
  - Enquiry cards list with expandable detail view
  - Status change controls per enquiry

## Implementation Steps

1. **Add enquiry library layer** – edit `supabase-server.ts`:
   1.1 Define exported `ContactInquiry` type mirroring the DB row
   1.2 Add `listContactInquiries()` returning rows ordered by `created_at DESC`
   1.3 Add `updateContactInquiryStatus(id, status)` updating row

2. **Add admin server functions** – edit `-_admin.ts`:
   2.1 Define `ListEnquiriesSchema` (optional status/service filters) and `UpdateEnquiryStatusSchema` (id + status enum)
   2.2 Add `listEnquiriesAdmin` createServerFn` (GET) – auth-gated, calls `listContactInquiries`
   2.3 Add `updateEnquiryStatusAdmin` createServerFn` (POST) – auth-gated, calls `updateContactInquiryStatus`

3. **Build Enquiries UI** – edit `admin.tsx`:
   3.1 Add tab state `activeTab: 'albums' | 'enquiries'`
   3.2 Render tab bar below header (switching between Albums manager and Enquiries inbox
   3.3 Create `EnquiriesManager` function componentsub-components:
     - Stats header with counts bytatus + total)
     - Filter row: status + service selects
     - enquiry cards list with: name, service badge, date, status badge
     - expand/collapse per card to show full message, email/phone/email clickable links (mailto:, tel:)
     - status update actions (new → contacted → archived)
     - empty state and loading state

4. **Wire everything** – import new server functions, add state, call `reloadEnquiries`

## Dependencies and Considerations
- **Auth**: Every enquiry server call must go through `isAdminFromCtx` / `unauth` pattern exactly like albums; include `debugAuth`
- **Zod status enum**: Restrict `status` values to `['new', 'contacted', 'archived']`
- **createServerFn validators wrap inputs in `{ data: ... }` as per project convention for callsite when validators are used
- **extractEvent H3 event**: Use recursive extractCookieFromAnywhere pattern already present in admin.ts; no assumptions about ctx.request
- **Service matchService values in filter should match the 6 services titles; NOT the shorter `portfolio categories (use `site-content.ts` services array `.title` or a subset
- **Click-to-copy/reply**: Render `tel:` links for phone; `mailto:` for email
- **Avoid** `exactOptionalPropertyTypes: Use conditional assignment for optional filter values (don't assign undefined)
- **RLS alreadycorrect: service_role can select/update; anon cannot read

## Validation
1. `npm run lint` – no ESLint/TS errors
2. `GetDiagnostics` – zero type diagnostics on edited files
3. Manual flow:
   - Submit test enquiry from /contact
   - Sign in /admin, switch to Enquiries tab
   - See enquiry appear with `new` status badge
   - Click status dropdown → `contacted` → persists on refresh
   - Filter by service + status
   - Expand card → see all fields
   - Click phone/email links open handlers

## Risks
- **Status enum mismatch**: If pre-existing rows have custom statuses outside the enum, filter still shows them but dropdown may not. Mitigation: Zod uses `z.enum([...]).or(z.string().min(1))` to accept arbitrary existing values while UI dropdown offers the 3 standard ones.
- **Enquiries volume**: Many rows may slow page. Mitigation: start without pagination, order by created_at DESC (newest first), add a limit note if needed later.
- **Tab state persistence** : Simple state only; no need route params. Mitigation; fine for MVP – switching tabs resets filters.
- **ip_address / source**: Show in advanced detail as muted metadata (not primary focus)
