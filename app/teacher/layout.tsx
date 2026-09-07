import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Teacher workspace",
    template: "%s · Teacher",
  },
  // Signed-in pages have nothing to offer a crawler, and the proxy redirects it to /login anyway.
  robots: { index: false, follow: false },
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return children
}
