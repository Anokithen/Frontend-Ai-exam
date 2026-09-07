import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Administration",
    template: "%s · Admin",
  },
  // Signed-in pages have nothing to offer a crawler, and the proxy redirects it to /login anyway.
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
