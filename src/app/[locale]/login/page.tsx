"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Store } from "lucide-react"
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

export default function LoginPage() {
  const t = useTranslations("auth")
  const app = useTranslations("app")
  const [isLoading, setIsLoading] = React.useState(false)
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
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t("invalidCredentials"))
        return
      }

      router.push(`/${locale}/dashboard`)
      router.refresh()
    } catch {
      setError(t("invalidCredentials"))
    } finally {
      setIsLoading(false)
    }
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
            <CardTitle>{t("loginTitle")}</CardTitle>
            <CardDescription>{t("loginSubtitle")}</CardDescription>
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
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("signingIn") : t("signIn")}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link
                href={`/${locale}/register`}
                className="underline underline-offset-4 hover:text-primary"
              >
                {t("createAccount")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
