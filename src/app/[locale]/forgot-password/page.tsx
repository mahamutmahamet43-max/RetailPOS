"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Store, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const t = useTranslations("auth")
  const app = useTranslations("app")
  const [isLoading, setIsLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState("")
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "An error occurred")
        return
      }

      setSent(true)
    } catch {
      setError("A network error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <Store className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">{app("name")}</span>
            </Link>
          </div>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{t("forgotPasswordTitle")}</CardTitle>
              <CardDescription>{t("forgotPasswordSent")}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" onClick={() => router.push(`/${locale}/login`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("signIn")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{app("name")}</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("forgotPasswordTitle")}</CardTitle>
            <CardDescription>{t("forgotPasswordSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("sendingResetLink") : t("sendResetLink")}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link
                href={`/${locale}/login`}
                className="underline underline-offset-4 hover:text-primary"
              >
                <ArrowLeft className="mr-1 inline h-3 w-3" />
                {t("signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
