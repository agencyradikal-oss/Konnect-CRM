import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { KonnectClerkProvider } from "@/components/auth/clerk-provider";
import { getAppBaseUrl } from "@/lib/app-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "Konnect™ — Directorio de negocios hispanos en Atlanta";
const siteDescription =
  "Encuentra negocios hispanos en Atlanta metro: remodelación, restaurantes, salud, legal y más. Contacta directo en español.";

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: siteTitle,
    template: "%s | Konnect™",
  },
  description: siteDescription,
  // Favicon / apple: src/app/icon.tsx + apple-icon.tsx (ImageResponse KN)
  openGraph: {
    type: "website",
    locale: "es_US",
    siteName: "Konnect™",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <KonnectClerkProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster richColors position="top-center" />
          </NextIntlClientProvider>
        </KonnectClerkProvider>
      </body>
    </html>
  );
}
