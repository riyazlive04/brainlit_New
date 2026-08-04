# BrainLIT — Website Build Plan

**Domain:** brainlit.in · **Approver:** Haja Najmudeen (Founder & CEO)
**Source docs:** `BrainLIT_Product_Requirements_and_Website_Discovery.md`, `BrainLIT_Website_Discovery_Answers.md`

---

## 1. Decisions locked

| Area | Decision |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| 3D | React Three Fiber + drei, **procedural geometry & custom shaders only** (no model files) |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll |
| Styling | Tailwind v4 |
| 3D reach | **Full 3D on every device**, desktop and mobile |
| Content | **Supabase Postgres + custom `/admin` panel** |
| Backend | Supabase (Postgres, Auth, Storage, RLS) |
| Host | Vercel |
| Phase 1 | Marketing site + webinar funnel |
| Home page | Single long scrollytelling page driven by one persistent 3D scene |

### Resolved conflict: page count

The discovery docs specify **12 pages**, a CMS, admin roles and an LMS roadmap — not a one-page site.
The earlier "one long page" choice is preserved as: **the site is multi-page; the Home page is the
one-long-page 3D scrollytelling experience.** Every other page is conventional, fast and content-led.

### Standing risk (your call, recorded not re-argued)

Full WebGL on every device was chosen over progressive enhancement. Your primary audience is parents
in Chennai on mid-range Android over 4G, and your own success criteria include Core Web Vitals and
mobile experience. Section 8 is the engineering response: the scene is built to a hard performance
budget so this decision costs as little as possible. Two fallbacks remain regardless, because they are
correctness and law, not aesthetic downgrades:

- **WebGL unavailable / context lost** → static gradient poster. Without this the page is simply broken
  on devices that refuse a WebGL context.
- **`prefers-reduced-motion`** → motion reduced to near-static. This is a WCAG 2.1 accessibility
  requirement and a vestibular-safety issue.

---

## 2. Brand system

Colours sampled directly from `Brainlit LOGO 800 800px.png`:

| Token | Hex | Role |
|---|---|---|
| `spark` | `#FCD057` | Idea/ignition accent — CTAs, highlights, the "LIT" moment |
| `cyan` | `#7ACEEB` | Left-hemisphere light, top of gradient |
| `blue` | `#5EAEDD` | Primary brand blue |
| `indigo` | `#3F5BA6` | Deep blue, bulb base, headings on light |
| `periwinkle` | `#8777C8` | Mid gradient bridge |
| `violet` | `#854FB4` | Right-hemisphere / primary purple |
| `lilac` | `#C68EDC` | Soft purple, backgrounds, particle tint |
| `ink` | `#0B1020` | Near-black canvas for the dark 3D sections |

**Signature gradient:** `#7ACEEB → #5EAEDD → #8777C8 → #854FB4` (cyan → blue → periwinkle → violet).
This is the logo wordmark's own gradient and should be the visual spine of the whole site.

> **Note:** the **green** (`#88A201`) and sky blue in the logo file are the *poster mockup scene*, not
> brand colours. They are excluded. Please confirm — if green is genuinely brand, the palette changes.

**Left = blue = logic/critical thinking. Right = purple = creativity.** The logo already encodes
BrainLIT's core duality; the whole design system leans on it.

**Typography**
- Headings: `Outfit` — rounded geometric sans, closest to the wordmark; warm without being childish.
- Body: `Inter` — neutral, excellent small-size legibility on Android.
- Tamil: `Noto Sans Tamil` loaded from day one. Your audience is explicitly English- *and*
  Tamil-speaking, and multi-language is on the roadmap. Choosing a Tamil-capable pairing now avoids
  re-typesetting the entire site later.

**Tone:** minimalist, generous whitespace, one idea per screen. The logo's own instruction —
*"KEEP IT SIMPLE"* — is the design brief. The 3D provides the wonder; the typography stays calm.

---

## 3. The 3D concept

One persistent particle system, ~ the whole Home page. Not decoration — it *is* the pitch.

**Core object:** a cloud of glowing points that assembles into the brain-bulb from the logo. Points
only (`THREE.Points`), animated entirely in a GLSL vertex shader. No meshes, no textures, no model
downloads.

**Scroll beats** (ScrollTrigger drives a single normalised `uProgress` uniform):

| # | Section | 3D behaviour | Message |
|---|---|---|---|
| 0 | Hero | Particles drift, unformed. Cursor gently attracts them. | Scattered potential |
| 1 | The problem | Particles begin converging toward the brain silhouette | "AI answers everything. So what's left to learn?" |
| 2 | The ignition | Form completes; filament **ignites** in `spark` yellow; rays fire outward | "Think before you use AI" — the LIT moment |
| 3 | Two hemispheres | Brain splits — left glows blue, right violet | Critical thinking + Creativity |
| 4 | The 7 pillars | Neural pathways light up node to node, one per pillar | The curriculum |
| 5 | Student work | Particles disperse upward into a constellation of project cards | Proof |
| 6 | CTA | Reassembles into a single steady, glowing bulb | "Join the free webinar" |

Why this concept: it's literally the logo, it dramatises the exact philosophy in the docs
("we teach them to think so they can lead AI"), it needs zero art assets, and points-with-additive-
blending is one of the cheapest things a GPU can draw — which matters given the full-3D-everywhere
decision.

---

## 4. Information architecture

### Phase 1 — ships first (the revenue path)

| Route | Purpose |
|---|---|
| `/` | 3D scrollytelling home → webinar CTA |
| `/about` | Philosophy, founder, why not-a-coding-academy |
| `/courses` | Programs, age bands, curriculum, pricing |
| `/courses/[slug]` | Individual program detail + enrol CTA |
| `/webinar` | **Dedicated ad landing page.** Standalone, minimal nav, single conversion goal |
| `/contact` | Form + WhatsApp + location |
| `/faq` | Parent objection handling (schema-marked-up) |
| `/privacy`, `/terms`, `/refund` | Legal (required before running Meta ads) |

### Phase 2
`/blog`, `/blog/[slug]`, `/podcast`, `/projects`, `/admin` (full CMS UI)

### Phase 3+
Student dashboard, parent dashboard, LMS, certificates, payments, community, school portal.

---

## 5. Home page, section by section

1. **Hero** — logo mark, headline *"Teach your child to think before they use AI."*, subhead, primary
   CTA "Join the free webinar", secondary "Explore programs". 3D beat 0 behind it.
2. **The problem** — three calm statements about AI doing homework and what that costs a 12-year-old.
3. **The ignition** — the philosophy line, full bleed, the filament fires. The emotional peak.
4. **What BrainLIT is** — "An AI *Thinking* Academy, not another coding academy." Explicit contrast.
5. **The 7 pillars** — critical thinking, creativity, problem solving, entrepreneurial mindset,
   communication, ethical AI, portfolio building. Each lights a node.
6. **How it works** — live online, ages 10–14, batch size, weekly rhythm, what a session looks like.
7. **Student projects** — proof constellation. (Phase 1: 3–4 curated; Phase 2: CMS-driven.)
8. **Testimonials** — parent quotes. Parents buy on trust from other parents.
9. **Founder** — Haja Najmudeen, credibility, the origin story.
10. **FAQ preview** — top 5 objections, link to `/faq`.
11. **Final CTA** — webinar registration form inline, plus WhatsApp.
12. **Footer** — nav, legal, social, contact.

Sticky slim CTA bar appears after the hero on mobile so the webinar signup is never more than one tap away.

---

## 6. Technical architecture

```
brainlit/
├─ app/
│  ├─ (marketing)/            # shared header/footer
│  │  ├─ page.tsx             # Home — server component, 3D lazily mounted
│  │  ├─ about/ courses/ contact/ faq/
│  │  └─ privacy/ terms/ refund/
│  ├─ webinar/page.tsx        # standalone, no global nav
│  ├─ api/
│  │  ├─ lead/route.ts        # POST → Supabase, rate-limited, honeypot
│  │  └─ webinar/route.ts     # POST → registration + confirmation email
│  ├─ sitemap.ts  robots.ts  opengraph-image.tsx
├─ components/
│  ├─ three/
│  │  ├─ Scene.tsx            # <Canvas>, single instance
│  │  ├─ BrainParticles.tsx   # the points system
│  │  ├─ shaders/brain.vert|frag
│  │  ├─ useScrollProgress.ts # ScrollTrigger → uniform
│  │  ├─ QualityManager.tsx   # adaptive DPR + particle count
│  │  └─ CanvasFallback.tsx   # WebGL-unavailable poster
│  ├─ sections/               # one component per home section
│  ├─ forms/LeadForm.tsx WebinarForm.tsx
│  └─ ui/                     # buttons, inputs, containers
├─ lib/
│  ├─ supabase/{client,server,admin}.ts
│  ├─ analytics.ts            # GA4 + Meta Pixel + GTM, consent-gated
│  └─ schemas.ts              # zod
└─ content/                   # Phase 1 hardcoded copy → migrates to DB
```

**Key rules**
- One `<Canvas>` for the entire Home page. Never two.
- All copy lives in `content/` as typed objects in Phase 1, so the Phase 2 CMS migration is a swap of
  the data source, not a rewrite of every component.
- Forms: `react-hook-form` + `zod`, validated again server-side. Never trust the client.
- Lead writes go through an API route with the service role — never expose service keys to the browser.

---

## 7. Supabase data model (Phase 1)

```sql
-- Leads: every form submission on the site
leads(
  id uuid pk, name text, email text, phone text,
  child_age int, child_name text,          -- first name only, see §10
  message text, source text,               -- 'home' | 'webinar' | 'contact' | 'course'
  utm_source, utm_medium, utm_campaign, utm_content text,
  status text default 'new',               -- new | contacted | registered | enrolled | lost
  created_at timestamptz default now()
)

webinar_sessions(id, title, starts_at timestamptz, zoom_url, capacity int, is_active bool)
webinar_registrations(id, session_id fk, lead_id fk, attended bool, reminder_sent_at, created_at)

courses(id, slug unique, title, summary, age_min, age_max, duration_weeks,
        price_inr int, curriculum jsonb, hero_copy text, is_published bool, sort_order int)

testimonials(id, parent_name, child_first_name, city, quote, rating, is_published, sort_order)
faqs(id, question, answer, category, is_published, sort_order)
site_settings(key text pk, value jsonb)     -- WhatsApp number, next webinar, etc.

profiles(id → auth.users, role text)        -- 'super_admin' | 'admin'  (Phase 2 admin)
```

**RLS from day one — not deferred.**
- `leads`, `webinar_registrations`: anon may `INSERT` only. **No anon `SELECT`.** If reads are open,
  your entire parent lead list is publicly scrapable.
- `courses`, `testimonials`, `faqs`: anon may `SELECT` only `where is_published = true`.
- Everything else: authenticated admin only.
- Writes that need elevated rights go through server-side API routes using the service role key.

---

## 8. Performance plan (making full-3D-everywhere viable)

Hard budget: **LCP < 2.5s on a mid-range Android over 4G**, steady **50–60fps**, JS under **250KB gz**
excluding the three.js chunk.

| Technique | Effect |
|---|---|
| Points geometry, no meshes/textures/models | Nothing to download; GPU draws it almost free |
| All motion in the vertex shader | Zero per-frame CPU work regardless of particle count |
| Adaptive particle count — 15k desktop → 4k low-end, chosen at runtime | Scene scales to the device instead of dying on it |
| `PerformanceMonitor` + `AdaptiveDpr`, DPR capped at 1.5 | Auto-degrades resolution before frames drop |
| **No postprocessing bloom.** Glow faked with additive blending in the fragment shader | Bloom is the single most common cause of mobile WebGL jank; the fake is ~free |
| `frameloop="demand"`; canvas paused via IntersectionObserver when offscreen | No GPU burn on other sections, saves battery |
| Canvas `dynamic(..., {ssr:false})`, text and CTA server-rendered | HTML paints first — required for LCP *and* for Google to index the copy at all |
| three.js in its own route chunk | Other pages never pay for it |
| `next/font` self-hosted, `next/image` AVIF/WebP | Standard wins |

Verification gates before launch: Lighthouse mobile ≥ 90 performance, and a real-device test on a
mid-range Android. If the budget is missed, the fix is fewer particles and lower DPR — the scene
degrades gracefully rather than being cut.

---

## 9. SEO, analytics, integrations

- Per-route `metadata`, canonical URLs, OpenGraph + Twitter cards, dynamic `opengraph-image.tsx`.
- Schema.org JSON-LD: `Organization`, `EducationalOrganization`, `Course`, `FAQPage`, `Event` (webinar),
  `BreadcrumbList`. `Course` and `FAQPage` markup earn rich results — high-leverage for your queries.
- `sitemap.ts` + `robots.ts` generated, not hand-written.
- GTM as the single container; GA4 and Meta Pixel loaded through it and **gated behind cookie consent**.
- Conversion events: `webinar_register`, `lead_submit`, `whatsapp_click`, `course_view`, `enroll_click`.
- WhatsApp: `wa.me` deep link with a prefilled message, number stored in `site_settings` so it's
  editable without a deploy.
- Zoom: Phase 1 stores the join link on `webinar_sessions` and emails it on registration. Full API
  automation is Phase 2.
- Email: Resend (transactional confirmations + reminders). Needs SPF/DKIM on brainlit.in.

---

## 10. Legal & children's data — needs attention early

Your docs list "protection of children's data" as a requirement. In India this is now statutory:
the **DPDP Act 2023** requires **verifiable parental consent** before processing a child's personal
data, and prohibits behavioural advertising directed at children. Design consequences:

- **Collect the parent's contact details, never the child's.** From the child, store only first name
  and age — enough to personalise, not enough to identify or contact.
- **Student project showcase requires written parental consent per child**, especially for photos,
  video or full names. Recommend display as *"Aarav, 12, Chennai"* only. A consent record should be
  stored against each showcased project.
- **Cookie consent banner must gate Meta Pixel and GA4**, not just announce them.
- Privacy Policy must state what is collected about children, why, retention period, and how a parent
  withdraws consent or requests deletion.
- Privacy, Terms and Refund pages must be live **before** the first Meta ad runs — Meta rejects ad
  accounts for education/lead-gen without them.

I am not your lawyer; have the final policy text reviewed before launch.

---

## 11. Build sequence

| Milestone | Contents |
|---|---|
| **M0 — Foundation** | Next.js + TS + Tailwind scaffold, brand tokens, fonts, layout shell, Supabase project + schema + RLS, Vercel + domain, GitHub |
| **M1 — 3D core** | Canvas, particle system, brain-bulb formation shader, ScrollTrigger wiring, quality manager, fallbacks. *Reviewed with you before content is layered on.* |
| **M2 — Home** | All 12 sections, copy, responsive pass, motion polish |
| **M3 — Funnel** | `/webinar` landing page, lead + registration forms, API routes, Resend confirmations, WhatsApp CTA |
| **M4 — Content pages** | About, Courses + detail, Contact, FAQ, three legal pages |
| **M5 — Growth wiring** | GTM/GA4/Pixel + consent, schema markup, sitemap, OG images, conversion events |
| **M6 — Hardening & launch** | Lighthouse + real-device testing, accessibility pass, RLS audit, 404/500, analytics smoke test, go live |
| **Phase 2** | `/admin` CMS, blog, podcast, student projects |
| **Phase 3+** | Payments, student/parent portals, LMS |

M1 is the highest-risk milestone and gets a checkpoint: you see and approve the 3D feel before we
build content around it.

---

## 12. What I need from you

**Blocking M2 (copy and proof):**
1. Course names, age bands, duration, batch size, **pricing**.
2. Real parent testimonials — name, city, quote, consent to publish.
3. 3–4 student projects for the showcase, with parental consent.
4. Founder bio + photo for the About page.
5. Next webinar date/time + Zoom link.
6. WhatsApp business number.

**Blocking M0/M5 (access):**
7. Supabase project URL + keys (or invite me to the project).
8. Vercel + GitHub repo access; confirm brainlit.in DNS control.
9. GA4 Measurement ID, GTM container ID, Meta Pixel ID.
10. Domain for transactional email (SPF/DKIM setup on brainlit.in).

**Confirmations:**
11. Is **green** a brand colour, or only the poster mockup? (Plan currently excludes it.)
12. Logo source file — SVG or AI/Figma? The 800×800 PNG is a mockup poster, not a usable asset. A
    transparent SVG mark is needed for the header, favicon and OG images.
13. Is Tamil content in scope for Phase 1, or English-only at launch with Tamil in Phase 2?
