import type { NextConfig } from "next"

/**
 * Sent on every response. The app is a pure client of a separate API, so these are the headers
 * a CDN can't infer for us: no framing, no MIME sniffing, no referrer leakage to the API host,
 * and HSTS so a bookmarked http:// link never makes a plaintext round trip.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
]

const nextConfig: NextConfig = {
  // Nothing here is server-rendered against the API, so there is no reason to advertise the stack.
  poweredByHeader: false,
  reactStrictMode: true,

  experimental: {
    // lucide-react is optimized by default; Base UI is not, and every icon-heavy page imports it.
    optimizePackageImports: ["@base-ui/react"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
