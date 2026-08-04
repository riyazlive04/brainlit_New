# BrainLIT — launch checklist

Ordered by what blocks what. Nothing below the first section can be verified
until the first section is done.

---

## 1. Blocked on the client — nothing works without these

### Supabase
- [ ] Create the project (or share the existing one)
- [ ] Apply `supabase/migrations/0001_init.sql` in the SQL editor
- [ ] Run `supabase/verify-rls.sql` — **it must print `ALL RLS CHECKS PASSED`**
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
- [ ] Programs: names, age bands, duration, session count, **price** →
      `content/courses.ts`
- [ ] Next webinar session row in `webinar_sessions` (title, `starts_at`,
      `zoom_url`, capacity)
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` — WhatsApp CTAs are hidden without it,
      including the fallback shown when registration fails
- [ ] Parent testimonials, with consent → `content/home.ts`
- [ ] 3–4 student projects, **with written parental consent** → `content/home.ts`
- [ ] Founder bio and photograph → `content/home.ts`

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
