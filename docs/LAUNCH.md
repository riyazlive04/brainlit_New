# BrainLIT — launch checklist

Ordered by what blocks what. Nothing below the first section can be verified
until the first section is done.

---

## 1. Blocked on the client — nothing works without these

### Supabase
- [x] Project created — `awtlporhufkubsjtxvbc`
- [x] `0001_init.sql` applied
- [ ] Apply **`0002_registration_dedupe.sql`** — without it, duplicate
      registrations are possible when two submissions race
- [ ] Apply **`0003_student_projects.sql`** — the student work section and its
      admin page do not function until this exists
- [ ] Apply **`0004_testimonial_video.sql`** — until then every page build logs
      `column testimonials.video_path does not exist` and the testimonials
      section renders nothing
- [ ] Apply **`0005_newsletter.sql`** — the newsletter box on the homepage and
      in the footer returns a 500 until the table exists
- [ ] Run `supabase/verify-rls.sql` — 24 rows, **every one PASS**

### Admin access
- [ ] Create the team's users in the dashboard (Authentication → Users)
- [ ] Grant the role with **`supabase/create-admin.sql`** — deliberately manual,
      because a trigger that promoted every signup would make anyone who found
      the endpoint an administrator of the parent lead database
- [ ] **Turn OFF public signups** (Authentication → Providers → Email). Nothing
      here needs them; leaving it on is an open door with no purpose.
- [ ] **Rotate the service role key** — it was shared in chat during
      development. Rolling the JWT secret invalidates the anon key too, so
      update BOTH env vars afterwards.
- [ ] Manually confirm the anon key cannot read `leads` (curl command at the
      bottom of `verify-rls.sql`)
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`

Until this is done **every registration returns 503**. That is deliberate — an
honest "message us on WhatsApp" beats silently dropping a lead — but it means
the funnel captures nothing.

### Email
- [ ] Resend account, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- [ ] **SPF and DKIM on brainlit.in.** Without them confirmations land in spam,
      which is worse than not sending — a parent who never sees the joining
      link is a lost enrolment and a support ticket.
- [ ] Send one real registration end to end and confirm the email arrives in a
      Gmail inbox, not Promotions or Spam

### Content that cannot be invented

Everything here has a home in `content/home.ts` marked **NEEDS INPUT**. Each one
is a section that is built, styled and wired — and renders nothing, or renders a
weaker version, until it is filled in.

- [ ] Programs: names, age bands, duration, session count, **price** →
      `content/courses.ts`
- [ ] Next webinar session row in `webinar_sessions` (title, `starts_at`,
      `zoom_url`, capacity)
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp CTAs are hidden without it,
      including the fallback shown when registration fails
- [ ] Parent testimonials, with consent → managed in `/admin`
- [ ] 3–4 student projects, **with written parental consent** → `/admin`
- [ ] **Founder story** (`FOUNDER.story`) — the highest-value missing item on
      the homepage. In his own voice: what he saw that made him start this, and
      why a parent should trust him with their child's thinking. A quote cannot
      do that work, and the section stays in its compact form without it.
- [ ] Founder photograph and credentials
- [ ] **`PROOF_STATS`** — parents attended, projects built, rating. Ships empty
      and the whole band is hidden. Each figure must be one we can substantiate
      if asked: Meta and Google both treat these as advertising claims.
- [ ] **`PRICING.startingFromInr`** — until set, the fees section shows an
      honest "we go through it in the free session" panel instead of a number.
      `hasScholarships` must stay false unless a scholarship actually exists.
- [ ] **`CURRICULUM`** — the four weekly themes currently come from the
      homepage brief, where they were an example. Confirm against the real
      syllabus; a parent who enrols on that section will expect it.
- [ ] `PODCAST.channelUrl` and episodes → section and footer link hidden
- [ ] `RESOURCES` — the guides themselves, as real files. A listed guide that
      404s is the first promise we make to a parent, broken.
- [ ] `NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL` → community section hidden
- [ ] `TRUST_MARKS` — featured in, partner schools, talks, awards. Ships empty.
      Every entry is a claim about a third party, so nothing goes in unverified.
- [ ] `ARTICLES` — there is **no blog engine**; these are hand-listed. A real
      blog with categories is a separate build, not a homepage section.

---

## 2. Legal — required before the first ad runs

Meta rejects education and lead-gen ad accounts without these live.

- [ ] Privacy, Terms and Refund reviewed by a qualified professional
- [ ] Confirm the refund terms in `lib/legal.ts` — the cooling-off window,
      sessions-attended limit and processing time are **placeholders**
- [ ] Confirm the Grievance Officer name and address. The DPDP Act 2023
      requires a reachable named contact; a generic inbox does not satisfy it.
- [ ] Confirm `privacy@brainlit.in` and `hello@brainlit.in` actually exist
- [ ] Set `IS_DRAFT = false` in `lib/legal.ts` to remove the draft banner
- [ ] Set `EFFECTIVE_DATE` to the real date

---

## 3. Analytics

- [ ] GTM container created; `NEXT_PUBLIC_GTM_ID` set
- [ ] GA4 and Meta Pixel configured **inside the container**, not in code
- [ ] Every tag set to fire only on consent
- [ ] Verify with the banner: decline, then confirm no `googletagmanager.com`
      request appears in the Network tab
- [ ] Conversion events wired: `webinar_register`, `lead_submit`,
      `whatsapp_click`
- [ ] **Meta Pixel must not run behavioural advertising aimed at children** —
      DPDP prohibits it and the Privacy Policy states we do not

---

## 4. Deploy

### Where it is now

- [x] Deployed as a **separate** Vercel project, `brainlit-2026`, at
      **https://brainlit-2026.vercel.app**
- [x] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [x] Crawling blocked and canonicals self-referencing on every non-production
      host, so this copy cannot compete with the live site in search
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — **deliberately not set.** Until it is,
      every registration returns an honest 503 with the WhatsApp fallback
      rather than a compromised key sitting in production.

**The existing site is untouched.** `brain-lit-webinar-09-may` still serves
https://www.brainlit.in. Nothing a real visitor sees has changed.

### Going live on brainlit.in

Do these together, not piecemeal — the domain and the flags have to move at the
same time or the live site briefly serves draft legal pages, or serves correct
pages that tell Google not to index them.

1. Everything in sections 1–3 above is done, especially the legal review
2. `IS_DRAFT = false` in `lib/legal.ts`, and set `EFFECTIVE_DATE`
3. Add `NEXT_PUBLIC_SITE_URL=https://brainlit.in` in Vercel
4. Deploy, and check `/robots.txt` now allows crawling and `/sitemap.xml`
   lists brainlit.in URLs
5. Move the domain from `brain-lit-webinar-09-may` to `brainlit-2026` in the
   Vercel dashboard
6. Keep the old project for a week as a rollback, then remove it
7. Resubmit the sitemap in Google Search Console

### Redeploying

`vercel deploy --prod` from the project root. The repo is not connected to
GitHub, so **deploys are manual and come from this machine** — worth fixing
before anyone else needs to ship.


- [ ] Vercel project connected to the repo
- [ ] All environment variables set in Vercel (not just `.env.local`)
- [ ] `NEXT_PUBLIC_SITE_URL=https://brainlit.in`
- [ ] brainlit.in DNS pointed at Vercel; HTTPS confirmed
- [ ] `www` redirects to apex, or the reverse — pick one and be consistent
- [ ] Delete `.env.local` (it currently holds a **test** GTM id)
- [ ] Consider deleting `/lab` — it is `noindex` and `robots`-disallowed, so it
      is harmless, but it is internal

---

## 5. Verify on the real domain

- [ ] `/sitemap.xml` and `/robots.txt` resolve and reference the live domain
- [ ] Submit the sitemap in Google Search Console
- [ ] OG image renders — check with the Facebook Sharing Debugger and X's
      Card Validator, not by eye
- [ ] Rich Results Test passes for `FAQPage`, `Event` and
      `EducationalOrganization`
- [ ] Register a real lead and confirm the row lands in `leads`
- [ ] Confirm a duplicate submission does **not** create a second lead or a
      second email (registration is idempotent — verify it in production)
- [ ] `node scripts/a11y-audit.mjs https://brainlit.in` → 0 failures

---

## 6. Known limitations to accept or fix

### Rate limiting is per-instance
`lib/rateLimit.ts` uses an in-memory Map. Serverless scales horizontally, so
two requests on two instances each see an empty bucket. It stops double-submits
and casual abuse; it is **not** a defence against a determined attacker.

Move to Upstash Redis or Vercel KV before running paid traffic at scale. Only
the body of `checkRateLimit` changes — no call site does.

### Mobile performance is below the original target
Measured with Lighthouse, mobile, simulated throttling, three runs:

| | |
|---|---|
| Performance | **78 / 83 / 82** — target was ≥90 |
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |
| LCP | **3.6s** simulated — target was <2.5s |
| CLS | **0** |

The LCP element is the hero paragraph — plain text, present in the HTML from
the first byte. Its *observed* paint is **159ms**; the 3.6s figure is
Lighthouse's simulated slow-4G number, and almost all of it is render delay
from JavaScript on the main thread.

The dominant cost is the 3D scene: three.js and drei are ~234KB gzipped. It is
already deferred until the browser is idle after load, which cut blocking time
meaningfully, but it is still the largest thing the page does.

**The remaining lever is a decision, not a code change.** Loading the 3D only
on fast connections (`navigator.connection.effectiveType`) would move mobile
performance close to 90. That partially revisits the earlier "full 3D
everywhere" decision, so it is the client's call — it is not being done
silently.

Also worth knowing: these numbers come from `next start` on a laptop. Vercel's
edge network, Brotli and real CDN caching will improve TTFB, though not the
render delay.

### Scroll reveals need a modern browser
CSS scroll-driven animations are Chromium-only at time of writing. Elsewhere
content simply renders visible — no script, nothing lost but the flourish.
