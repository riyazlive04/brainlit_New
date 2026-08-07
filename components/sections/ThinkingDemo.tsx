"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CHALLENGES } from "@/content/home";

/**
 * A playable sample of the lesson.
 *
 * Everything else on this page describes what we teach. This is the only place
 * a parent can experience it, in about forty seconds, before giving us an email
 * address — which makes it the strongest proof on the page and the only client
 * component among the new sections.
 *
 * It costs one small useState and no libraries. All three challenges are in the
 * server-rendered HTML, so the questions and the AI answers are readable and
 * indexable before hydration; only the scoring interaction needs JavaScript.
 *
 * Accessibility notes, since this is the one interactive piece:
 * - Options are real radio inputs in a fieldset, so arrow keys work and the
 *   group is announced with its question. A row of divs with click handlers
 *   would give up both.
 * - The result region is aria-live, because the feedback appears somewhere
 *   other than where the focus is.
 * - Correctness is never signalled by colour alone — every state has a word.
 */
export function ThinkingDemo() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const challenge = CHALLENGES[index];
  const answered = picked !== null;
  const isRight = picked === challenge.correct;
  const isLast = index === CHALLENGES.length - 1;

  function next() {
    setPicked(null);
    setIndex((i) => (i + 1) % CHALLENGES.length);
  }

  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <Container size="default">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            Try it yourself
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            Can you spot what the AI got wrong?
          </h2>
          <p className="mt-6 text-[0.975rem] leading-relaxed text-slate">
            This is a real exercise from the program, shortened. Every answer
            below sounds completely convincing. Each one has something wrong
            with it.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-3xl border border-mist">
          {/* ------------------------------------------------- Progress rail */}
          <div className="flex items-center gap-3 border-b border-mist bg-mist/25 px-6 py-4 sm:px-8">
            <p className="font-display text-sm font-semibold text-ink">
              Challenge {index + 1}
              <span className="font-normal text-slate">
                {" "}
                of {CHALLENGES.length}
              </span>
            </p>
            <ul aria-hidden="true" className="ml-auto flex gap-1.5">
              {CHALLENGES.map((item, i) => (
                <li
                  key={item.prompt}
                  className={
                    "h-1.5 w-6 rounded-full " +
                    (i === index ? "bg-brand-gradient" : "bg-mist")
                  }
                />
              ))}
            </ul>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {/* ------------------------------------------------ The exchange */}
            <p className="text-sm text-slate">
              <span className="font-display font-semibold text-ink">
                A child asks:
              </span>{" "}
              {challenge.prompt}
            </p>

            <blockquote className="mt-5 rounded-2xl bg-mist/40 p-6">
              <p className="font-display text-xs font-semibold tracking-[0.14em] text-slate uppercase">
                The AI replies
              </p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink">
                {challenge.answer}
              </p>
            </blockquote>

            {/* -------------------------------------------------- The options */}
            <fieldset className="mt-8" disabled={answered}>
              <legend className="font-display text-[1.0625rem] font-semibold text-ink">
                What is wrong with it?
              </legend>

              <div className="mt-5 space-y-3">
                {challenge.options.map((option, i) => {
                  const chosen = picked === i;
                  const correct = i === challenge.correct;

                  return (
                    <label
                      key={option}
                      className={
                        "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-colors " +
                        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 " +
                        "has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet " +
                        (answered
                          ? correct
                            ? "border-indigo/45 bg-indigo/[0.04]"
                            : chosen
                              ? "border-slate/30 bg-mist/40"
                              : "border-mist opacity-60"
                          : "border-mist hover:border-violet/40 hover:bg-mist/25")
                      }
                    >
                      <input
                        type="radio"
                        name={`challenge-${index}`}
                        className="mt-1 size-4 shrink-0 accent-[var(--color-violet)]"
                        checked={chosen}
                        onChange={() => setPicked(i)}
                      />
                      <span className="text-[0.975rem] leading-relaxed text-ink">
                        {option}
                      </span>
                      {answered && correct && (
                        <span className="ml-auto shrink-0 self-center font-display text-xs font-semibold tracking-wide text-indigo uppercase">
                          Correct
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* --------------------------------------------------- The reveal */}
            <div aria-live="polite">
              {answered && (
                <div className="success-rise mt-8 border-t border-mist pt-8">
                  <p className="font-display text-[1.0625rem] font-semibold text-ink">
                    {isRight ? "That's it." : "Not quite - and that's the point."}
                  </p>
                  <p className="mt-3 text-[0.975rem] leading-relaxed text-slate">
                    {challenge.explanation}
                  </p>

                  <p className="mt-6 rounded-2xl bg-mist/40 p-5 text-[0.975rem] leading-relaxed text-ink">
                    <span className="font-display font-semibold">
                      The habit:{" "}
                    </span>
                    {challenge.lesson}
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button onClick={next} variant="outline">
                      {isLast ? "Start again" : "Next challenge"}
                    </Button>
                    {isLast && (
                      <Button href="/webinar" variant="spark">
                        See how we teach this
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate">
          Children work through versions of this every week, on harder problems,
          arguing with each other about the answer.
        </p>
      </Container>
    </section>
  );
}
