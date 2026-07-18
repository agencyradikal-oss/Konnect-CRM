import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/**
 * Redirects 301 desde URLs típicas del WordPress anterior.
 * Ajusta/añade paths cuando tengas el export de slugs del WP.
 */
const wordpressRedirects = [
  { source: "/home", destination: "/", permanent: true },
  { source: "/inicio", destination: "/", permanent: true },
  { source: "/directory", destination: "/directorio", permanent: true },
  { source: "/negocios", destination: "/directorio", permanent: true },
  { source: "/businesses", destination: "/directorio", permanent: true },
  { source: "/pricing", destination: "/precios", permanent: true },
  { source: "/planes", destination: "/precios", permanent: true },
  { source: "/register", destination: "/registrar-empresa", permanent: true },
  { source: "/registro", destination: "/registrar-empresa", permanent: true },
  { source: "/wp-admin/:path*", destination: "/", permanent: true },
  { source: "/wp-login.php", destination: "/login", permanent: true },
  { source: "/category/:slug", destination: "/categoria/:slug", permanent: true },
  { source: "/categories/:slug", destination: "/categoria/:slug", permanent: true },
  { source: "/listing/:slug", destination: "/negocio/:slug", permanent: true },
  { source: "/listings/:slug", destination: "/negocio/:slug", permanent: true },
  { source: "/business/:slug", destination: "/negocio/:slug", permanent: true },
  { source: "/empresa/:slug", destination: "/negocio/:slug", permanent: true },
];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return wordpressRedirects;
  },
};

export default withNextIntl(nextConfig);
