const requiredEnvVars = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
] as const

const optionalEnvVars = [
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "NEXT_PUBLIC_APP_URL",
  "LOG_LEVEL",
] as const

export type EnvVar = (typeof requiredEnvVars)[number] | (typeof optionalEnvVars)[number]

function getEnvVar(key: string): string | undefined {
  return process.env[key]
}

export function validateEnv(): void {
  const missing: string[] = []

  for (const key of requiredEnvVars) {
    if (!getEnvVar(key)) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        "Please check your .env file or environment configuration."
    )
  }
}

export function getEnv(key: EnvVar, defaultValue?: string): string {
  const value = getEnvVar(key) || defaultValue
  if (!value) {
    throw new Error(`Environment variable ${key} is not set and no default value provided`)
  }
  return value
}

export function getEnvOrDefault(key: EnvVar, defaultValue: string): string {
  return getEnvVar(key) || defaultValue
}

export function isProduction(): boolean {
  return getEnvVar("NODE_ENV") === "production"
}

export function isDevelopment(): boolean {
  return getEnvVar("NODE_ENV") !== "production"
}
