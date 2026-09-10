import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/** Status pills read as stamped into the surface — a small inset pair, colour carried by the text. */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border-0 bg-background px-3.5 py-1.5 text-xs font-medium tracking-wide whitespace-nowrap shadow-nm-inset-sm [&_svg]:pointer-events-none [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "text-nm-accent-soft",
        secondary: "text-nm-warning",
        success: "text-nm-success",
        destructive: "text-destructive",
        outline: "text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
