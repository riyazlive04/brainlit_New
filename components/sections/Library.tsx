import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ARTICLES, PODCAST } from "@/content/home";

/**
 * Podcast episodes and written articles, in one band.
 *
 * Kept together deliberately. They are the same offer to a parent — "here is us
 * being useful before you pay us anything" — and two half-empty sections
 * stacked would read as a site padding itself out, which is precisely the
 * clutter the brief warns against.
 *
 * Renders nothing while both are empty, which is how it ships. There is no blog
 * engine behind ARTICLES yet; see docs/LAUNCH.md.
 */
export function Library() {
  const hasPodcast = PODCAST.episodes.length > 0;
  const hasArticles = ARTICLES.length > 0;
  if (!hasPodcast && !hasArticles) return null;

  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            Before you decide anything
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            Things worth reading and listening to.
          </h2>
        </Reveal>

        {/* --------------------------------------------------------- Podcast */}
        {hasPodcast && (
          <div className="mt-14">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h3 className="font-display text-[length:var(--text-h3)] text-ink">
                The BrainLIT Podcast
              </h3>
              {PODCAST.channelUrl && (
                <a
                  href={PODCAST.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-[0.95rem] font-semibold text-violet hover:underline"
                >
                  All episodes on YouTube →
                </a>
              )}
            </div>

            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PODCAST.episodes.map((episode, i) => (
                <Reveal as="li" key={episode.url} delay={i * 70}>
                  <a
                    href={episode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full flex-col rounded-2xl border border-mist p-6 transition-colors hover:border-violet/40"
                  >
                    <h4 className="font-display text-[1.0625rem] font-semibold text-ink group-hover:text-indigo">
                      {episode.title}
                    </h4>
                    <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-slate">
                      {episode.blurb}
                    </p>
                    {episode.duration && (
                      <p className="mt-5 text-sm text-slate">
                        {episode.duration}
                      </p>
                    )}
                  </a>
                </Reveal>
              ))}
            </ul>
          </div>
        )}

        {/* -------------------------------------------------------- Articles */}
        {hasArticles && (
          <div className={hasPodcast ? "mt-20" : "mt-14"}>
            <h3 className="font-display text-[length:var(--text-h3)] text-ink">
              Writing for parents
            </h3>

            <ul className="mt-8 divide-y divide-mist border-y border-mist">
              {ARTICLES.map((article, i) => (
                <Reveal as="li" key={article.href} delay={i * 60}>
                  <a
                    href={article.href}
                    className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:gap-8"
                  >
                    <time
                      dateTime={article.date}
                      className="shrink-0 text-sm text-slate sm:w-32"
                    >
                      {new Date(article.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                    <span>
                      <span className="block font-display text-[1.0625rem] font-semibold text-ink group-hover:text-indigo">
                        {article.title}
                      </span>
                      <span className="mt-1.5 block text-[0.95rem] leading-relaxed text-slate">
                        {article.blurb}
                      </span>
                    </span>
                  </a>
                </Reveal>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
