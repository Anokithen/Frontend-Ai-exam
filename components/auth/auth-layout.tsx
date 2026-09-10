import Link from "next/link"

import { LogoMark } from "@/components/dashboard/logo-mark"

/**
 * The centred card both auth screens sit in: brand lockup above, one raised slab, a way home
 * below. Shared so Sign in and Register stay identical down to the shadow.
 */
export function AuthLayout({ children, showBackHome = false }: { children: React.ReactNode; showBackHome?: boolean }) {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-[470px]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <LogoMark className="size-10 rounded-2xl shadow-nm-md" chipClassName="size-3.5" />
          <span className="font-heading text-base font-semibold">AI Teacher Exam Platform</span>
        </div>

        <div className="rounded-[30px] bg-background p-8 shadow-nm-lg sm:px-9 sm:py-10">{children}</div>

        {showBackHome && (
          <div className="mt-6 text-center text-[13px]">
            <Link href="/" className="text-nm-faint hover:text-nm-accent-soft">
              ← Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
