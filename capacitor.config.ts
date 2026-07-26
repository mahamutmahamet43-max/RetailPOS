import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.retailpos.app",
  appName: "RetailPOS",
  webDir: "public",
  server: {
    url: "https://retailpos-sigma.vercel.app",
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
    },
  },
}

export default config
