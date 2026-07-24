import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.retailpos.app",
  appName: "RetailPOS",
  webDir: "public",
  server: {
    url: "https://retailpos-sigma.vercel.app",
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
    },
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
    },
  },
}

export default config
