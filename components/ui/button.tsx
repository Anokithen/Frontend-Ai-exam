import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Neumorphic button. Every variant is the page colour; what separates them is depth —
 * `default` is a lit accent slab, `outline`/`secondary` are raised, `ghost` is flush until
 * hovered, and pressing any of them sinks it into the page (active:shadow-nm-inset).
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border-0 text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/70 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-nm-accent hover:brightness-110 active:shadow-nm-inset",
        outline:
          "bg-background text-secondary-foreground shadow-nm-sm hover:text-foreground active:shadow-nm-inset aria-expanded:shadow-nm-inset",
        secondary:
          "bg-background text-secondary-foreground shadow-nm-sm hover:text-foreground active:shadow-nm-inset aria-expanded:shadow-nm-inset",
        ghost:
          "bg-transparent text-muted-foreground shadow-none hover:bg-background hover:text-foreground hover:shadow-nm-xs active:shadow-nm-inset aria-expanded:shadow-nm-inset",
        destructive:
          "bg-background text-destructive shadow-nm-sm hover:brightness-110 active:shadow-nm-inset",
        link: "text-nm-accent-soft shadow-none underline-offset-4 hover:text-nm-accent-bright hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5",
        xs: "h-8 gap-1 rounded-xl px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-xl px-4 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-11",
        "icon-xs": "size-8 rounded-xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
