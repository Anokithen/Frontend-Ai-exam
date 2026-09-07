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
        className={cn("pr-8", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        // The label carries the state, so a screen reader hears which way the toggle goes.
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export { PasswordInput }
