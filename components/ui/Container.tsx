import { cn } from "@/lib/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** `narrow` for prose, `default` for sections, `wide` for full-bleed layouts */
  size?: "narrow" | "default" | "wide";
  as?: "div" | "section" | "header" | "footer" | "main" | "article";
};

const SIZES = {
  narrow: "max-w-2xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

export function Container({
  children,
  className,
  size = "default",
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-5 sm:px-8", SIZES[size], className)}>
      {children}
    </Tag>
  );
}
