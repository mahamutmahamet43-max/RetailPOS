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

export default function RegisterPage() {
  const t = useTranslations("auth")
  const app = useTranslations("app")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [registeredEmail, setRegisteredEmail] = React.useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t("emailInUse"))
        return
      }

      if (data.emailSent === false) {
        setError(data.message || "Account created but verification email could not be sent.")
        return
      }

      setRegisteredEmail(email)
    } catch {
      setError("A network error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (registeredEmail) {
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
              <CardTitle>{t("verifyEmailTitle")}</CardTitle>
              <CardDescription>
                {t("registerVerifyPrompt") || "We sent a verification link to {email}. Please check your inbox and click the link to activate your account.".replace("{email}", registeredEmail)}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("registerVerifyResend") || "Didn't receive the email? Check your spam folder or"}
              </p>
              <Button
                variant="outline"
                  onClick={async () => {
                    const res = await fetch("/api/auth/verify-email/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: registeredEmail }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      alert("Verification email sent!")
                    } else {
                      alert(data.error || "Failed to send verification email")
                    }
                  }}
              >
                {t("verifyEmailResend") || "Resend email"}
              </Button>
              <p className="text-sm">
                <Link
                  href={`/${locale}/login`}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {t("signIn")}
                </Link>
              </p>
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
            <CardTitle>{t("registerTitle")}</CardTitle>
            <CardDescription>{t("registerSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                />
              </div>
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
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("creatingAccount") : t("createAccount")}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link
                href={`/${locale}/login`}
                className="underline underline-offset-4 hover:text-primary"
              >
                {t("signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
