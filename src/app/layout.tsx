import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { KonnectClerkProvider } from "@/components/auth/clerk-provider";
import { DebugAuthBeacon } from "@/components/auth/debug-auth-beacon";
import { getAppBaseUrl } from "@/lib/app-url";
import { brand } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "Konnect™ — Directorio de negocios hispanos en Atlanta",
    template: "%s | Konnect™",
  },
  description:
    "Encuentra negocios hispanos en Atlanta metro: remodelación, restaurantes, salud, legal y más. Contacta directo en español.",
  // Favicon / PWA icons — un solo archivo en public/brand/iso.png (ver src/lib/brand.ts)
  icons: {
    icon: [{ url: brand.isoSrc, type: "image/png" }],
    apple: [{ url: brand.isoSrc }],
    shortcut: brand.isoSrc,
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
          <DebugAuthBeacon />
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster richColors position="top-center" />
          </NextIntlClientProvider>
        </KonnectClerkProvider>
      </body>
    </html>
  );
}
