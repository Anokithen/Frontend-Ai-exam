"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * The neumorphic palette is a single dark theme — a raised surface only reads as raised when its
 * shadow pair sits against that one navy — so there is no light variant to switch to, and the
 * theme is forced rather than followed from the system.
 */
function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
