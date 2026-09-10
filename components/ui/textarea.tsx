import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-2xl border-0 bg-background px-4 py-3 text-base text-foreground shadow-nm-inset transition-shadow outline-none placeholder:text-muted-foreground focus-visible:shadow-[var(--shadow-nm-inset),0_0_0_1.5px_var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:shadow-[var(--shadow-nm-inset),0_0_0_1.5px_var(--nm-danger)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
