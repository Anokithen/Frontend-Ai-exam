"use client"

/**
 * Replaces the whole document when the root layout itself fails, so it cannot use any of the app
 * shell — including the theme provider or the font variables — and ships its own minimal styles.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100svh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", fontSize: "0.875rem", opacity: 0.7 }}>
          The application failed to load. Please reload the page.
        </p>
        {error.digest && <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>Reference: {error.digest}</p>}
        <button
          onClick={reset}
          style={{
            cursor: "pointer",
            borderRadius: "0.5rem",
            border: "1px solid currentColor",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            background: "transparent",
            color: "inherit",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
