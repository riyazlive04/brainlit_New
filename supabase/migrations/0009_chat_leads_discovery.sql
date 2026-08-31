-- =============================================================================
-- Chat leads — what the NEW conversation captures, and how much further that goes
--
-- Migration 0008 stored a phone number, a branch, and sometimes an age. This
-- one stores answers: why the parent is here, how their child uses AI, what
-- worries them, what they want developed, which resources they looked at, and
-- how warm the lead is. The chatbot became a discovery conversation instead of
-- a three-step funnel (brief section 11), and these columns are the part of it
-- that outlives the session.
--
-- WHY IT IS STORED AT ALL. The site's WhatsApp follow-up (brief section 14) is
-- meant to be relevant rather than generic, and "relevant" means somebody or
-- something has to know what was said. Holding it only in the client state
-- would mean the answers exist for the length of one tab and then the parent
-- gets the same broadcast as everyone else — which is the outcome the brief
-- asked us to stop producing.
--
-- -----------------------------------------------------------------------------
-- SAY WHAT THIS IS: IT IS A STEP TOWARD PROFILING.
--
-- 0008 held contact details. This holds a small behavioural profile of a child
-- — how they use AI, what they are weak at in their parent's eyes, what the
-- parent wants them to become — attached to a phone number, for the express
-- purpose of messaging that parent more persuasively later. Calling it
-- "personalisation" does not change what the row is.
--
-- WHERE THE LINE STILL IS, unchanged from 0008 and restated here so it cannot
-- be lost between files:
--
--   From the child there is an AGE and nothing else. No name, no contact, no
--   school, no class, no photograph, no device or account identifier. Do not
--   add child identifiers here without a verifiable parental consent flow.
--
-- The columns below are all ANSWERS THE PARENT CHOSE FROM A LIST — closed
-- option ids from content/chatbot.ts, not free text. That is deliberate: a
-- free-text box invites a parent to type a name, a diagnosis or a school, and
-- then this table is holding child identifiers that nobody decided to collect.
-- If a future step needs free text, it does not belong in these columns.
--
-- -----------------------------------------------------------------------------
-- THE CONSENT LINE WAS WIDENED TO MATCH.
--
-- 0008's consent was "you gave a number, we will message you". That no longer
-- covers keeping a profile, so the sentence shown to the parent immediately
-- above the number field was changed to say so. It is CHAT_PHONE_STEP.note in
-- content/chatbot.ts, and it currently reads, verbatim:
--
--   "We will message you here, and keep what you have told us so the messages
--    are relevant. No calls unless you ask for one."
--
-- "keep what you have told us so the messages are relevant" is the clause that
-- authorises every column in this migration. If that clause is edited away, the
-- basis for these columns goes with it. The number is also asked LATE and is
-- OPTIONAL now: a parent can answer every discovery question, take every
-- resource, and never be stored at all, because no row is written without a
-- phone number.
--
-- -----------------------------------------------------------------------------
-- IF THE RETARGETING GOES, THESE COLUMNS GO.
--
-- Stated plainly so nobody has to guess later: the only justification for
-- holding reason / ai_use / concern / goal / seen / intent is the follow-up
-- described in brief section 14. If that is dropped, descoped, or quietly never
-- built, these columns should be dropped with it rather than left accumulating
-- a profile nobody uses. Data kept "in case it is useful" is the whole failure
-- mode this comment exists to prevent.
--
-- -----------------------------------------------------------------------------
-- ADDITIVE AND NULLABLE, ALL OF IT.
--
-- Every column is `add column if not exists` and nullable (except `opted_in`,
-- which has a default), so the rows written by 0008 stay valid and readable.
-- The rejected alternative was a fresh `chat_leads_v2` table with the full
-- shape and a backfill: cleaner columns, but it splits "who contacted us"
-- across two tables forever, and every query and admin screen then has to
-- remember both. A few nulls on old rows is the cheaper truth.
-- =============================================================================

-- ── The discovery answers ────────────────────────────────────────────────────
--
-- Plain `text`, not enums and not check constraints, on purpose. These hold
-- option ids from content/chatbot.ts, and that list is edited by whoever is
-- rewriting the conversation — a constraint here would mean a copy-editing
-- change to a question breaks inserts in production. The ids are validated at
-- the door in app/api/chat/route.ts, which is where untrusted input belongs.
-- The cost is real and accepted: a typo'd id lands in the table silently.

-- Why they are here. Written from whichever branch asked first:
-- exploring_reason, literacy_interest, or future_priority.
alter table public.chat_leads add column if not exists reason text;

-- How the child uses AI. Homework, questions, creating, images, coding, unsure.
alter table public.chat_leads add column if not exists ai_use text;

-- What worries the parent. Copying, wrong information, dependency, losing the
-- habit of thinking - or "nothing", which is an answer worth having.
alter table public.chat_leads add column if not exists concern text;

-- What they want developed. The `develop` / `followup` answer.
alter table public.chat_leads add column if not exists goal text;

-- ── Engagement ───────────────────────────────────────────────────────────────
--
-- Which resources were actually taken: the testimonial, workshop photos or
-- videos, Instagram, YouTube, the community, the explainer. An array rather
-- than a join table because it is append-only, short, never queried across
-- leads, and read as a set. A join table would be three more objects and a
-- policy each to answer a question nobody has asked yet.
alter table public.chat_leads add column if not exists seen text[];

-- ── Lead temperature ─────────────────────────────────────────────────────────
--
-- Computed in lib/chat/flow.ts by `leadIntent`, never shown to the visitor.
-- Constrained, unlike the answer columns above, because these three values are
-- a decision this codebase makes rather than content somebody edits - and the
-- partial index below is meaningless if a fourth value can appear.
--
--   cold — default; barely engaged
--   warm — two or more discovery answers, or looked at any resource
--   hot  — ASKED for contact: pressed "Continue on WhatsApp", asked for a
--          person, or typed a fees/enrol/call question
--
-- `hot` deliberately requires an action, not enthusiasm. Filing a chatty
-- browser as a call request is how a follow-up becomes a cold call.
alter table public.chat_leads add column if not exists intent text
  check (intent in ('cold','warm','hot'));

-- ── The consent flag ─────────────────────────────────────────────────────────
--
-- True only if "Continue on WhatsApp" was pressed. In 0008 reaching the end of
-- the funnel WAS the consent; the funnel now ends in a hub a parent can sit in
-- indefinitely, so the press had to become its own recorded fact.
--
-- NOT NULL DEFAULT FALSE, which backfills every 0008 row to `false`. Those rows
-- were opted in under the old flow, so this is understating them - and that is
-- the right direction to be wrong in. A flag that over-reports consent is the
-- one that gets somebody messaged who did not ask.
alter table public.chat_leads
  add column if not exists opted_in boolean not null default false;

-- ── Legacy ───────────────────────────────────────────────────────────────────
--
-- `readiness` is DEAD. The AI-literacy branch no longer asks "ready to enrol or
-- want more details" - the whole readiness step was cut when the conversation
-- was rebuilt around the resource hub, and nothing writes this column any more.
--
-- Kept, not dropped, because historical rows carry real answers in it and
-- dropping the column deletes them. Read it as "answered before <this
-- migration>"; do not add it to any new query, form or export.
comment on column public.chat_leads.readiness is
  'LEGACY. From the removed AI-literacy readiness step (migration 0008). Nothing writes this any more; historical rows only. Do not use in new code.';

comment on column public.chat_leads.intent is
  'Lead temperature computed by leadIntent() in lib/chat/flow.ts. Never shown to the visitor. hot means the parent ASKED for contact.';

comment on column public.chat_leads.opted_in is
  'True only if "Continue on WhatsApp" was pressed. Pre-0009 rows are false, which understates them on purpose.';

comment on column public.chat_leads.seen is
  'Resource ids the visitor actually took. Append-only, read as a set.';

-- -----------------------------------------------------------------------------
-- The index
--
-- "Who wants a call" is the question this table will actually be asked, every
-- day, by a person with a phone in their hand. PARTIAL on intent = 'hot'
-- because that is a small minority of rows and a full index on (intent,
-- created_at) would be mostly cold and warm rows nobody paginates through.
--
-- created_at desc inside it so the newest hot lead is the first row read: a
-- request for a call is worth the most in the hour it was made.
-- -----------------------------------------------------------------------------
create index if not exists chat_leads_hot_idx
  on public.chat_leads (intent, created_at desc)
  where intent = 'hot';

-- Restated on the table itself, because this is the sentence that shows up in
-- a schema dump when nobody has this file open.
comment on table public.chat_leads is
  'Phone numbers and discovery answers captured by the website chatbot. Parent is the data subject; from the child only an age is held - no name, no school, no identifiers. The discovery columns exist to make the WhatsApp follow-up relevant; if that follow-up is dropped, drop them.';
