import "server-only";

import { CHAT_WHATSAPP, CHAT_BRANCHES, type ChatBranchId } from "@/content/chatbot";
import { toInternational } from "@/lib/phone";

/**
 * Outbound WhatsApp, through a self-hosted Evolution GO.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WRITTEN AGAINST THE SOURCE, NOT THE DOCS.
 *
 * The published Evolution API v2 documentation describes
 * `POST /message/sendText/{instance}`. Evolution GO is a different codebase and
 * that route does not exist in it. From `pkg/routes/routes.go` and
 * `pkg/sendMessage/handler/send_handler.go`:
 *
 *   POST {base}/send/text
 *   header  apikey: <instance token>
 *   body    { "number": "919876543210", "text": "..." }
 *   200     { "message": "success", "data": { Info: { ID, ... }, ... } }
 *   4xx/5xx { "error": "..." }
 *
 * THE TOKEN IS THE INSTANCE. `pkg/middleware/auth_middleware.go` resolves the
 * instance with `GetInstanceByToken(apikey)` - there is no instance name in the
 * path, the query or the body. An instance-name setting would be a variable
 * that silently does nothing, so there is not one.
 *
 * `number` is passed as plain digits with the country code. The route runs
 * `ValidateNumberFieldWithFormatJid()`, whose `formatJid` defaults to TRUE, so
 * the server normalises to a full JID itself. Sending a pre-built
 * `...@s.whatsapp.net` would be normalising it twice.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * NOTE ON "TEMPLATES". Evolution GO talks the WhatsApp Web protocol through
 * whatsmeow - it is a logged-in personal session, not the Business Cloud API.
 * There is no template registry and nothing to get approved; the text in
 * content/chatbot.ts is sent verbatim. The flip side is that the account is a
 * real one that can be rate-limited or banned for unsolicited bulk sending, so
 * the message must read like a reply to someone who just asked for it.
 *
 * `server-only` is load-bearing: this module reads an API key, and importing it
 * from a client component must fail the BUILD rather than ship the key.
 */

/** Why a send did not happen, or that it did. Stored against the lead. */
export type WhatsAppResult =
  | { status: "sent"; providerId: string | null }
  | { status: "not_configured" }
  | { status: "template_missing" }
  | { status: "failed"; error: string };

type Env = { baseUrl: string; apiKey: string };

/**
 * Read at call time, not at module load. A missing key must not stop the app
 * booting - it must stop THIS SEND, loudly, and leave the rest working.
 */
function readEnv(): Env | null {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/+$/, "") ?? "";
  const apiKey = process.env.EVOLUTION_API_KEY ?? "";

  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

/**
 * Fills {{age}} and {{branch}}.
 *
 * An absent value collapses to an empty string rather than leaving `{{age}}` in
 * the message. A parent reading a template placeholder in their WhatsApp is
 * worse than a slightly clumsy sentence.
 */
function fill(
  body: string,
  vars: { childAge: number | null; branch: ChatBranchId },
): string {
  const branchLabel =
    CHAT_BRANCHES.find((b) => b.id === vars.branch)?.label ?? "";

  return body
    .replace(/\{\{\s*age\s*\}\}/g, vars.childAge ? String(vars.childAge) : "")
    .replace(/\{\{\s*branch\s*\}\}/g, branchLabel)
    // Substitution can leave doubled spaces where a placeholder was a whole
    // clause. Cheaper to tidy here than to make every template defensive.
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** The bits of Evolution GO's 200 response this code reads. */
type SendOk = {
  message?: string;
  data?: { Info?: { ID?: string } };
};

async function postToEvolution(
  env: Env,
  number: string,
  text: string,
): Promise<WhatsAppResult> {
  const controller = new AbortController();
  // Generous, because Evolution GO reconnects the whatsmeow client on demand
  // (`ensureClientConnectedWithRetry`) and retries a send three times before it
  // gives up. A 10s ceiling would abort a send that was about to succeed. Still
  // bounded, because a parent is waiting on this turn of the conversation.
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${env.baseUrl}/send/text`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        apikey: env.apiKey,
      },
      body: JSON.stringify({ number, text }),
    });

    if (!response.ok) {
      // The body carries the reason - "not authorized" for a bad token, "no
      // active session found" when the WhatsApp pairing has dropped. A bare
      // status is undebuggable, and those two need completely different fixes.
      const detail = await response.text().catch(() => "");
      return {
        status: "failed",
        error: `${response.status} ${detail.slice(0, 300)}`.trim(),
      };
    }

    const payload = (await response.json().catch(() => null)) as SendOk | null;
    return { status: "sent", providerId: payload?.data?.Info?.ID ?? null };
  } catch (error) {
    return {
      status: "failed",
      error:
        error instanceof Error
          ? error.name === "AbortError"
            ? "timeout after 20s"
            : error.message
          : "unknown transport error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sends the message for a completed branch.
 *
 * NEVER THROWS. The caller is a chat turn: a parent who has just handed over
 * their number must see the conversation continue whatever the provider did.
 * The failure is returned so it can be STORED against the lead and chased by a
 * person, which is the only recovery that actually works.
 */
export async function sendBranchMessage(args: {
  phone: string;
  branch: ChatBranchId;
  childAge: number | null;
}): Promise<WhatsAppResult> {
  const body = fill(CHAT_WHATSAPP[args.branch].body, {
    childAge: args.childAge,
    branch: args.branch,
  });

  // Checked before the env, so an unwritten message reports as itself rather
  // than hiding behind a missing key.
  if (!body) return { status: "template_missing" };

  const env = readEnv();
  if (!env) return { status: "not_configured" };

  return postToEvolution(env, toInternational(args.phone), body);
}
