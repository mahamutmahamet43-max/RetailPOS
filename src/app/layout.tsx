import type { Metadata } from "next"
import { ServiceWorkerRegister } from "@/components/service-worker-register"

export const metadata: Metadata = {
  title: {
    default: "RetailPOS",
    template: "%s | RetailPOS",
  },
  description: "Modern point of sale for your business",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "RetailPOS",
    "mobile-web-app-capable": "yes",
    "theme-color": "#18181b",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <ServiceWorkerRegister />
    </>
  )
}
