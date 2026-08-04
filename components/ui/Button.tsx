import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "spark" | "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold " +
  "transition-[transform,box-shadow,background-color,color] duration-200 " +
  "[transition-timing-function:var(--ease-out-expo)] " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 " +
  // 44px minimum touch target — mobile is the majority of this audience
  "min-h-11";

const VARIANTS: Record<Variant, string> = {
  /* The ignition CTA. Reserved for the single most important action on a
     page — webinar registration. If everything is spark, nothing is. */
  spark:
    "bg-spark text-ink shadow-[0_6px_24px_-6px_rgba(252,208,87,0.7)] " +
    "hover:bg-spark-deep hover:shadow-[0_10px_32px_-6px_rgba(240,180,41,0.75)]",
  solid:
    "bg-brand-gradient text-white shadow-[0_6px_24px_-8px_rgba(133,79,180,0.75)] " +
    "hover:brightness-110",
  outline:
    "border border-indigo/25 text-indigo bg-white/70 backdrop-blur-sm " +
    "hover:border-indigo/50 hover:bg-white",
  ghost: "text-slate hover:text-ink hover:bg-mist/70",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-[0.975rem]",
  lg: "px-8 py-4 text-base sm:text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps & {
  href: string;
  /** Set for outbound links (WhatsApp, Zoom) */
  external?: boolean;
} & Omit<React.ComponentPropsWithoutRef<"a">, "href" | "className" | "children">;

type ButtonAsButton = CommonProps &
  Omit<React.ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: never;
  };

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const {
    variant = "solid",
    size = "md",
    className,
    children,
    ...rest
  } = props;

  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if ("href" in rest && typeof rest.href === "string") {
    const { href, external, ...anchorProps } = rest as ButtonAsLink;

    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          // noreferrer alongside noopener: without it the destination can read
          // document.referrer, and older browsers leak window.opener.
          rel="noopener noreferrer"
          {...anchorProps}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  const { ...buttonProps } = rest as ButtonAsButton;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
