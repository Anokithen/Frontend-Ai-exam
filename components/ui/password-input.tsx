"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"

/**
 * A password field with a reveal toggle.
 *
 * The visible state is deliberately local and starts hidden on every mount, so a revealed
 * password never survives a navigation back to the form.
 */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        // Room for the toggle, so a long password never runs underneath it.
        className={cn("pr-14", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        // The label carries the state, so a screen reader hears which way the toggle goes.
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-2.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-nm-xs transition-all outline-none hover:text-foreground active:shadow-nm-inset-sm focus-visible:ring-2 focus-visible:ring-ring/70"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export { PasswordInput }
