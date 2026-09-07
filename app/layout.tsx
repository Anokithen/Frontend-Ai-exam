import type { Metadata, Viewport } from "next"
import { Geist_Mono, Noto_Sans, Noto_Sans_Tamil, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/providers/auth-provider"
import { QueryProvider } from "@/providers/query-provider"
import { cn } from "@/lib/utils"

const robotoHeading = Roboto({ subsets: ["latin"], variable: "--font-heading" })

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })

// Noto Sans (Latin) has no Tamil glyphs, so Tamil-language exam content would
// fall back to whatever font the OS happens to have — load Tamil explicitly
// and put it first in the --font-sans stack (see globals.css) so it always wins.
const notoSansTamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "700"], variable: "--font-tamil" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  // Only the odd numeric readout uses mono, so it does not compete for bandwidth on first paint.
  preload: false,
})

// Vercel sets the deployment host at build time; without it, absolute URLs in metadata would
// resolve against localhost and social previews would break.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  "http://localhost:3000"

const description =
  "Generate exam questions from your notes with AI, run timed online exams, and get instant analytics."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Teacher Exam Platform",
    template: "%s · AI Teacher Exam Platform",
  },
  description,
  applicationName: "AI Teacher Exam Platform",
  openGraph: {
    type: "website",
    siteName: "AI Teacher Exam Platform",
    title: "AI Teacher Exam Platform",
    description,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "AI Teacher Exam Platform",
    description,
  },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

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
