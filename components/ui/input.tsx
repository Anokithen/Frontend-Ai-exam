import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

/** Fields are sunken: the inset shadow pair is what reads as "you can type in here". */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border-0 bg-background px-4 py-1 text-base text-foreground shadow-nm-inset transition-shadow outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:shadow-[var(--shadow-nm-inset),0_0_0_1.5px_var(--nm-accent)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:shadow-[var(--shadow-nm-inset),0_0_0_1.5px_var(--nm-danger)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
