# BrainLIT

Marketing site and webinar funnel for **BrainLIT** — an AI Thinking Academy for
children aged 10–14.

> We don't teach children to depend on AI.
> We teach them to think so they can lead AI.

Production domain: **brainlit.in**

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS v4 (tokens in `app/globals.css`) |
| 3D | React Three Fiber + drei, procedural geometry and custom GLSL only |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll |
| Backend | Supabase (Postgres, Auth, RLS) |
| Forms | react-hook-form + zod |
| Hosting | Vercel |

## Getting started

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
```

`npm run build` typechecks as part of the build — run it, plus `npx eslint .`,
before pushing.

## Project layout

```
app/
  (marketing)/       shared header + footer shell
    page.tsx         home — the 3D scrollytelling page
  layout.tsx         fonts, base metadata, <html>/<body>
  globals.css        design tokens + base styles
components/
  brand/             Wordmark (placeholder — see below)
  layout/            SiteHeader, SiteFooter
  ui/                Button, Container
  three/             3D scene (M1)
lib/
  brand.ts           colour tokens shared with the shaders
  site.ts            nav, pillars, contact config
  schemas.ts         zod validation, shared client + server
  supabase/          client / server / admin
supabase/
  migrations/        SQL schema and RLS policies
docs/                plan and client discovery documents
```

## Database

Apply `supabase/migrations/0001_init.sql` to the Supabase project (SQL editor,
or `supabase db push` with the CLI linked).

Security posture worth knowing before you touch it:

- RLS is **enabled and forced** on every table. Enabled-but-not-forced leaves the
  owner role exempt, so the policies look protective while doing nothing for
  owner-role connections.
- `anon` has **no access at all** to `leads` or `webinar_registrations` — not
  even INSERT. Public form submissions go through `/api` route handlers using
  the service role, so the server can rate-limit, drop honeypot hits and
  attribute UTM parameters a browser could forge.
- `webinar_sessions.zoom_url` is withheld from `anon` by a **column grant**, not
  a policy — RLS filters rows, not columns. An exposed join link would let
  unvetted adults into a live session with children.

## Children's data — read before adding any field

India's **DPDP Act 2023** requires verifiable parental consent to process a
child's personal data and prohibits behavioural advertising directed at
children. The schema reflects this:

- The **parent** is the data subject. We store their name, email and phone.
- From the child we store **only a first name and an age**. Do not add a child
  email, phone, photo or full name without a consent flow.
- The student-projects showcase needs **recorded per-child parental consent**
  (`testimonials.consent_ref` exists for this).
- Meta Pixel and GA4 must load **behind cookie consent**, not merely be
  disclosed in the policy.

## Known placeholders

- **`components/brand/Wordmark.tsx` is a stand-in.** The supplied logo is an
  800×800 poster mockup (framed print, drop shadows, scenery) — artwork, not a
  usable asset. Replace with the real transparent SVG when supplied.
- Home page copy is written, but the hero currently shows the static
  `bg-canvas-fallback` poster; the 3D scene lands in M1.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset, so WhatsApp CTAs stay hidden.

## Milestones

Full detail in [`docs/PLAN.md`](docs/PLAN.md).

- **M0 — Foundation** ✅ scaffold, tokens, fonts, layout shell, schema, RLS
- **M1 — 3D core** particle system, brain-bulb shader, scroll wiring, fallbacks
- **M2 — Home** all sections, copy, responsive and motion polish
- **M3 — Funnel** `/webinar`, lead + registration APIs, email, WhatsApp
- **M4 — Content pages** About, Courses, Contact, FAQ, legal
- **M5 — Growth** GTM/GA4/Pixel + consent, schema markup, sitemap, OG images
- **M6 — Hardening** Lighthouse, real-device testing, a11y, RLS audit, launch
