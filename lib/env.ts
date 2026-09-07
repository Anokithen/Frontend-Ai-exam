/**
 * Public runtime configuration, resolved once at module load.
 *
 * The API lives on a different host in production (Railway) than the app does (Vercel), so the
 * URL can only come from the environment. A missing or http:// value fails the build rather than
 * shipping a bundle that quietly calls localhost — the browser would block it as mixed content
 * and every request would fail with nothing pointing at the real cause.
 */

const isProduction = process.env.NODE_ENV === "production"

const SETUP_HINT =
  "Set it in the Vercel project (Settings -> Environment Variables) to the Railway backend, " +
  "e.g. https://your-app.up.railway.app/api, then redeploy."

function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()

  if (!configured) {
    if (isProduction) {
      throw new Error(`NEXT_PUBLIC_API_URL is not set. ${SETUP_HINT}`)
    }
    return "http://localhost:5000/api"
  }

  const url = configured.replace(/\/+$/, "")

  if (isProduction && url.startsWith("http://") && !url.startsWith("http://localhost")) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must use https in production (got "${url}"). ` +
        `Browsers block plain-http requests from an https page. ${SETUP_HINT}`
    )
  }

  // Every route on the backend is registered under /api. Without the suffix each call lands
  // on a path Flask does not serve and comes back 404, which reads like the API is missing
  // rather than like a typo in one variable.
  if (!url.endsWith("/api")) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must end in /api (got "${url}"). ` +
        `Every backend route lives under /api, e.g. https://your-app.up.railway.app/api.`
    )
  }

  return url
}

/** Base URL of the backend API, with no trailing slash. */
export const API_URL = resolveApiUrl()
