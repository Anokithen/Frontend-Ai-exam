import { cn } from "@/lib/utils"

/**
 * The brand mark: a raised rounded square with a lit accent chip pressed into the middle.
 * It is the one place in the design that emits light, so it carries the glow rather than a logo.
 */
export function LogoMark({ className, chipClassName }: { className?: string; chipClassName?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-background shadow-nm-sm",
        className
      )}
    >
      <span className={cn("nm-glow size-3 rounded-[4px]", chipClassName)} />
    </span>
  )
}
