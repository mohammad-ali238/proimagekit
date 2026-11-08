import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LatestArticles } from "@/components/blog/latest-articles";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ServiceWorker } from "@/components/layout/service-worker";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { ProModal } from "@/components/pro/pro-modal";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          Analytics stub (disabled). To enable privacy-friendly, cookie-free analytics:
          1. Uncomment the script below (Plausible shown; Umami works the same way).
          2. In next.config.ts, add the analytics host to `script-src` and `connect-src`,
             e.g. "https://plausible.io". The CSP blocks it otherwise.
          3. Update the "Cookies and tracking" section of /privacy.
          <script defer data-domain="example.com" src="https://plausible.io/js/script.js" />
        */}
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ServiceWorker>
            <TooltipProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
              >
                Skip to content
              </a>
              <Navbar />
              <main id="main" className="flex-1 pb-16">
                {children}
                <Analytics />
              </main>
              <LatestArticles />
              <Footer />
              <Toaster />
              <ProModal />
            </TooltipProvider>
          </ServiceWorker>
        </ThemeProvider>
      </body>
    </html>
  );
}
