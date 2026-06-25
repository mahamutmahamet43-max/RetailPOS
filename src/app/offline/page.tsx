import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl font-bold text-muted-foreground">!</div>
        <h1 className="text-2xl font-bold">You are offline</h1>
        <p className="text-muted-foreground">
          Please check your internet connection and try again.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}
