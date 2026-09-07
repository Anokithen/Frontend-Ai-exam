import { Geist, Geist_Mono, Noto_Sans, Noto_Sans_Tamil, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/providers/auth-provider"
import { QueryProvider } from "@/providers/query-provider"
import { cn } from "@/lib/utils";

const robotoHeading = Roboto({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'})

// Noto Sans (Latin) has no Tamil glyphs, so Tamil-language exam content would
// fall back to whatever font the OS happens to have — load Tamil explicitly
// and put it first in the --font-sans stack (see globals.css) so it always wins.
const notoSansTamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "700"], variable: "--font-tamil" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        notoSans.variable,
        notoSansTamil.variable,
        robotoHeading.variable
      )}
    >
      <body>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
