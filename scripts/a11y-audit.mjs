/**
 * Static accessibility and SEO audit against the running server.
 *
 *   node scripts/a11y-audit.mjs [baseUrl]
 *
 * Deliberately checks the SERVER-RENDERED HTML. Anything broken here is broken
 * for a crawler and for a user on a slow connection before hydration — the two
 * audiences that matter most for this site and the two that a browser-based
 * audit tool, running after JavaScript, will happily tell you are fine.
 *
 * Not a replacement for axe or a manual screen-reader pass. It catches the
 * mechanical mistakes, which is most of them.
 */

const base = process.argv[2] ?? "http://localhost:3000";

const PAGES = [
  "/",
  "/about",
  "/courses",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/refund",
  "/webinar",
  "/this-page-does-not-exist",
];

let failures = 0;
let warnings = 0;

function fail(page, message) {
  failures++;
  console.log(`  [31mFAIL[0m ${page} — ${message}`);
}

function warn(page, message) {
  warnings++;
  console.log(`  [33mWARN[0m ${page} — ${message}`);
}

function tagsOf(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "gi"))].map(
    (m) => m[0],
  );
}

function audit(page, html, status) {
  // --- document basics -----------------------------------------------------
  if (!/<html[^>]*\blang=/i.test(html)) {
    fail(page, "<html> has no lang attribute");
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    fail(page, "missing or empty <title>");
  } else if (titleMatch[1].length > 65) {
    warn(page, `title is ${titleMatch[1].length} chars (>65 truncates in SERP)`);
  }

  const desc = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
  );
  if (!desc || !desc[1].trim()) {
    warn(page, "no meta description");
  }

  // --- headings ------------------------------------------------------------
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((m) =>
    Number(m[1]),
  );
  const h1Count = headings.filter((level) => level === 1).length;

  if (h1Count === 0) fail(page, "no <h1>");
  if (h1Count > 1) fail(page, `${h1Count} <h1> elements — there must be one`);

  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) {
      warn(
        page,
        `heading level jumps h${headings[i - 1]} → h${headings[i]} (skipped a level)`,
      );
      break;
    }
  }

  // --- landmarks -----------------------------------------------------------
  if (!/<main\b/i.test(html)) fail(page, "no <main> landmark");

  // --- images --------------------------------------------------------------
  for (const img of tagsOf(html, "img")) {
    if (!/\balt=/i.test(img)) {
      fail(page, `<img> without alt: ${img.slice(0, 80)}`);
    }
  }

  // --- links ---------------------------------------------------------------
  for (const a of tagsOf(html, "a")) {
    if (/target=["']_blank["']/i.test(a) && !/rel=["'][^"']*noopener/i.test(a)) {
      fail(page, `target="_blank" without rel="noopener": ${a.slice(0, 80)}`);
    }
  }

  // --- form controls -------------------------------------------------------
  const inputs = [
    ...tagsOf(html, "input"),
    ...tagsOf(html, "select"),
    ...tagsOf(html, "textarea"),
  ];

  for (const control of inputs) {
    const type = control.match(/type=["']([^"']+)["']/i)?.[1] ?? "text";
    if (["hidden", "submit", "button"].includes(type)) continue;

    const id = control.match(/\bid=["']([^"']+)["']/i)?.[1];
    const labelled =
      /aria-label=/i.test(control) ||
      /aria-labelledby=/i.test(control) ||
      (id && new RegExp(`<label[^>]*for=["']${id}["']`, "i").test(html)) ||
      // A control wrapped directly inside its own <label> is also labelled.
      new RegExp(`<label\\b[^>]*>(?:(?!</label>)[\\s\\S]){0,400}?${
        id ? `id=["']${id}["']` : "<input"
      }`, "i").test(html);

    if (!labelled) {
      warn(page, `control may be unlabelled: ${control.slice(0, 90)}`);
    }
  }

  // --- viewport / zoom -----------------------------------------------------
  const viewport = html.match(
    /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/i,
  );
  if (viewport && /user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b/i.test(viewport[1])) {
    fail(page, "viewport disables pinch zoom (WCAG 1.4.4)");
  }

  // --- 404 must actually be a 404 ------------------------------------------
  if (page.includes("does-not-exist") && status !== 404) {
    fail(page, `unknown URL returned ${status}, expected 404`);
  }
}

console.log(`\nAuditing ${base}\n`);

for (const page of PAGES) {
  const response = await fetch(`${base}${page}`);
  const html = await response.text();
  audit(page, html, response.status);
}

console.log(
  `\n${failures} failure(s), ${warnings} warning(s) across ${PAGES.length} pages\n`,
);

process.exit(failures > 0 ? 1 : 0);
