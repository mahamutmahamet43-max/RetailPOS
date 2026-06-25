"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", marginBottom: "2rem" }}>
            Our team has been notified. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  )
}
