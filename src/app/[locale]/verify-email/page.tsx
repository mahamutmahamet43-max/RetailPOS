"use client"

import * as React from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Store, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function VerifyEmailPage() {
  const t = useTranslations("auth")
  const common = useTranslations("common")
  const app = useTranslations("app")
  const [status, setStatus] = React.useState<"loading" | "success" | "error" | "idle">("idle")
  const [error, setError] = React.useState("")
  const [resending, setResending] = React.useState(false)
  const [resendSent, setResendSent] = React.useState(false)
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  React.useEffect(() => {
    if (token && email) {
      setStatus("loading")
      fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      })
        .then(async (res) => {
          const data = await res.json()
          if (res.ok) {
            setStatus("success")
          } else {
            setStatus("error")
            setError(data.error || t("verificationTokenInvalid"))
          }
        })
        .catch(() => {
          setStatus("error")
          setError("A network error occurred.")
        })
    }
  }, [token, email, t])

  async function handleResend() {
    setResending(true)
    setResendSent(false)
    try {
      const res = await fetch("/api/auth/verify-email/send", { method: "POST" })
      if (res.ok) {
        setResendSent(true)
      } else {
        const data = await res.json()
        setError(data.error || "An error occurred")
      }
    } catch {
      setError("A network error occurred.")
    } finally {
      setResending(false)
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
            <CardTitle>{t("verifyEmailTitle")}</CardTitle>
            <CardDescription>
              {status === "loading" && common("loading")}
              {status === "success" && t("verifyEmailSuccess")}
              {status === "error" && (error || t("verificationTokenInvalid"))}
              {status === "idle" && t("verifyEmailSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "loading" && (
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <Button onClick={() => router.push(`/${locale}/dashboard`)}>
                  {t("signIn")}
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="mx-auto h-12 w-12 text-destructive" />
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${locale}/login`)}
                  >
                    {t("signIn")}
                  </Button>
                </div>
              </>
            )}

            {status === "idle" && (
              <>
                {resendSent ? (
                  <p className="text-sm text-green-600">{t("verifyEmailSent")}</p>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? common("loading") : t("verifyEmailResend")}
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={`/${locale}/login`}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("signIn")}
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
