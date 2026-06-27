"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  Store,
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Check,
  X,
  Eye,
  EyeOff,
  LogOut,
  Smartphone,
  Laptop,
  Globe,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { useParams } from "next/navigation"

const TIMEZONES = [
  "UTC",
  "Africa/Mogadishu",
  "Africa/Nairobi",
  "Africa/Addis_Ababa",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
]

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SOS", symbol: "S", name: "Somali Shilling" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
]

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
]

export default function SettingsPage() {
  const t = useTranslations("settings")
  const tc = useTranslations("common")
  const tt = useTranslations("theme")
  const tl = useTranslations("language")
  const { data: session, update } = useSession()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = React.useState("general")
  const [saving, setSaving] = React.useState(false)
  const [successMsg, setSuccessMsg] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState("")

  const [storeName, setStoreName] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [storePhone, setStorePhone] = React.useState("")
  const [storeEmail, setStoreEmail] = React.useState("")
  const [currency, setCurrency] = React.useState("USD")
  const [timezone, setTimezone] = React.useState("UTC")
  const [dateFormat, setDateFormat] = React.useState("MM/DD/YYYY")
  const [lowStockAlert, setLowStockAlert] = React.useState(true)
  const [salesNotification, setSalesNotification] = React.useState(true)
  const [emailNotification, setEmailNotification] = React.useState(true)
  const [logoUrl, setLogoUrl] = React.useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false)
  const [enablePharmacyModule, setEnablePharmacyModule] = React.useState(false)

  const [profileName, setProfileName] = React.useState("")
  const [profileEmail, setProfileEmail] = React.useState("")
  const [profileImage, setProfileImage] = React.useState("")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showCurrentPw, setShowCurrentPw] = React.useState(false)
  const [showNewPw, setShowNewPw] = React.useState(false)

  const [sessions, setSessions] = React.useState<Array<{ id: string; expires: string }>>([])

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/store")
        if (res.ok) {
          const data = await res.json()
          setStoreName(data.name || "")
          setAddress(data.settings?.address || "")
          setStorePhone(data.settings?.phone || "")
          setStoreEmail(data.settings?.email || "")
          setCurrency(data.settings?.currency || "USD")
          setTimezone(data.settings?.timezone || "UTC")
          setDateFormat(data.settings?.dateFormat || "MM/DD/YYYY")
          setLowStockAlert(data.settings?.lowStockAlert ?? true)
          setSalesNotification(data.settings?.salesNotification ?? true)
          setEmailNotification(data.settings?.emailNotification ?? true)
          setLogoUrl(data.settings?.logoUrl || "")
          setTwoFactorEnabled(data.settings?.twoFactorEnabled ?? false)
        }
      } catch {}
      try {
        fetch("/api/pharmacy/settings")
          .then((r) => r.json())
          .then((d) => setEnablePharmacyModule(d.enabled === true))
          .catch(() => {})
      } catch {}
      try {
        const res = await fetch("/api/settings/sessions")
        if (res.ok) {
          const data = await res.json()
          setSessions(data.sessions || [])
        }
      } catch {}
    }
    load()
  }, [])

  React.useEffect(() => {
    if (session?.user) {
      setProfileName(session.user.name || "")
      setProfileEmail(session.user.email || "")
      setProfileImage(session.user.image || "")
    }
  }, [session])

  async function saveStoreSettings() {
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")
    try {
      const res = await fetch("/api/settings/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: storeName,
            address,
            phone: storePhone,
            email: storeEmail,
            currency,
            timezone,
            dateFormat,
            lowStockAlert,
            salesNotification,
            emailNotification,
            logoUrl,
            enablePharmacyModule,
          }),
      })
      if (res.ok) {
        setSuccessMsg(t("saved"))
        setTimeout(() => setSuccessMsg(""), 3000)
      } else {
        const data = await res.json()
        setErrorMsg(data.error || tc("error"))
      }
    } catch {
      setErrorMsg(tc("error"))
    } finally {
      setSaving(false)
    }
  }

  async function saveProfile() {
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail, image: profileImage }),
      })
      if (res.ok) {
        setSuccessMsg(t("saved"))
        await update()
        setTimeout(() => setSuccessMsg(""), 3000)
      } else {
        const data = await res.json()
        setErrorMsg(data.error || tc("error"))
      }
    } catch {
      setErrorMsg(tc("error"))
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      setErrorMsg(t("passwordsDontMatch"))
      return
    }
    if (newPassword.length < 8) {
      setErrorMsg(t("passwordTooShort"))
      return
    }
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setSuccessMsg(t("passwordChanged"))
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setSuccessMsg(""), 3000)
      } else {
        const data = await res.json()
        setErrorMsg(data.error || tc("error"))
      }
    } catch {
      setErrorMsg(tc("error"))
    } finally {
      setSaving(false)
    }
  }

  async function revokeSession(sessionId: string) {
    try {
      const res = await fetch(`/api/settings/sessions/${sessionId}`, { method: "DELETE" })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      }
    } catch {}
  }

  async function saveNotificationSettings() {
    await saveStoreSettings()
  }

  const TABS = [
    { value: "general", icon: Store, label: t("general") },
    { value: "profile", icon: User, label: t("profile") },
    { value: "security", icon: Shield, label: t("security") },
    { value: "notifications", icon: Bell, label: t("notifications") },
    { value: "appearance", icon: Palette, label: t("appearance") },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
          <Check className="h-4 w-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          <X className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("storeInfo")}</CardTitle>
              <CardDescription>{t("storeInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">{t("storeName")}</Label>
                  <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">{t("phone")}</Label>
                  <Input id="storePhone" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">{t("email")}</Label>
                  <Input id="storeEmail" type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("currency")}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} - {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t("timezone")}</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">{t("dateFormat")}</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((df) => (
                        <SelectItem key={df.value} value={df.value}>
                          {df.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("address")}</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 mt-4">
                <div className="space-y-0.5">
                  <Label>Pharmacy Module</Label>
                  <p className="text-sm text-muted-foreground">Enable medicine inventory, batch tracking, FEFO, and prescription management</p>
                </div>
                <Switch
                  checked={enablePharmacyModule}
                  onCheckedChange={async (checked) => {
                    setEnablePharmacyModule(checked)
                    try {
                      await fetch("/api/pharmacy/settings", { method: "PUT" })
                    } catch {}
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveStoreSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? tc("loading") : tc("save")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("profileInfo")}</CardTitle>
              <CardDescription>{t("profileInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profileName">{t("fullName")}</Label>
                  <Input id="profileName" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileEmail">{t("emailAddress")}</Label>
                  <Input id="profileEmail" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileImage">{t("avatarUrl")}</Label>
                <Input id="profileImage" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} placeholder="https://example.com/avatar.jpg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("changePassword")}</CardTitle>
              <CardDescription>{t("changePasswordDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
                <div className="relative">
                  <Input id="currentPassword" type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("newPassword")}</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={saveProfile} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? tc("loading") : t("updateProfile")}
            </Button>
            <Button onClick={changePassword} disabled={saving || !currentPassword || !newPassword}>
              {t("changePassword")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("twoFactor")}</CardTitle>
              <CardDescription>{t("twoFactorDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("twoFactorLabel")}</Label>
                <p className="text-sm text-muted-foreground">{t("twoFactorLabelDesc")}</p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={async (v) => {
                  setTwoFactorEnabled(v)
                  await fetch("/api/settings/store", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ twoFactorEnabled: v }),
                  })
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("activeSessions")}</CardTitle>
              <CardDescription>{t("activeSessionsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noSessions")}</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t("activeSession")}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("expires")}: {new Date(s.expires).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => revokeSession(s.id)}>
                        <LogOut className="h-4 w-4 mr-1" />
                        {t("revoke")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("notificationPrefs")}</CardTitle>
              <CardDescription>{t("notificationPrefsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{t("emailNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("emailNotificationsDesc")}</p>
                </div>
                <Switch checked={emailNotification} onCheckedChange={setEmailNotification} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{t("lowStockAlerts")}</Label>
                  <p className="text-sm text-muted-foreground">{t("lowStockAlertsDesc")}</p>
                </div>
                <Switch checked={lowStockAlert} onCheckedChange={setLowStockAlert} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{t("salesNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("salesNotificationsDesc")}</p>
                </div>
                <Switch checked={salesNotification} onCheckedChange={setSalesNotification} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveNotificationSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? tc("loading") : tc("save")}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("themeSettings")}</CardTitle>
              <CardDescription>{t("themeSettingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{tt("light")}</Label>
                  <p className="text-sm text-muted-foreground">{t("lightThemeDesc")}</p>
                </div>
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{tt("dark")}</Label>
                  <p className="text-sm text-muted-foreground">{t("darkThemeDesc")}</p>
                </div>
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{tt("system")}</Label>
                  <p className="text-sm text-muted-foreground">{t("systemThemeDesc")}</p>
                </div>
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={theme === "system"}
                  onChange={() => setTheme("system")}
                  className="h-4 w-4"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("languageSettings")}</CardTitle>
              <CardDescription>{t("languageSettingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{tl("en")}</p>
                    <p className="text-xs text-muted-foreground">{tl("so")}</p>
                  </div>
                </div>
                <Select
                  value={locale}
                  onValueChange={(v) => {
                    router.push(`/${v}/dashboard/settings`)
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{tl("en")}</SelectItem>
                    <SelectItem value="so">{tl("so")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("logoUpload")}</CardTitle>
              <CardDescription>{t("logoUploadDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">{t("logoUrl")}</Label>
                <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
              </div>
              {logoUrl && (
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <img src={logoUrl} alt="Logo preview" className="h-16 w-16 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-medium">{t("logoPreview")}</p>
                    <p className="text-xs text-muted-foreground">{logoUrl}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveStoreSettings} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? tc("loading") : tc("save")}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
