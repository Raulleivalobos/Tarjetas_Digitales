import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import "./globals.css";

// next/font: self-hosted, preloaded, zero layout shift, zero render-blocking
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "SkardKey | Identidad Digital & Beneficios",
  description:
    "Plataforma SaaS gratuita para Juntas de Vecinos y organizaciones sociales en Chile. Credenciales digitales con QR, gestión de beneficios y cumplimiento Ley N° 21.180 (Cero Papel). Sindicatos, corporaciones municipales y departamentos de bienestar.",
  keywords: [
    "tarjetas digitales",
    "credenciales digitales Chile",
    "identidad digital",
    "junta de vecinos digital",
    "Ley 21180 Cero Papel",
    "organizaciones sociales",
    "sindicatos",
    "QR verificación",
    "beneficios sociales",
    "municipalidad digital",
    "SaaS credenciales",
    "carnets digitales",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "SkardKey | Identidad Digital & Beneficios",
    description: "Plataforma SaaS de credenciales digitales con QR. Gratuita para Juntas de Vecinos en Chile. Alineada a Ley N° 21.180.",
    url: "https://skardkey.cl",
    siteName: "SkardKey",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkardKey | Identidad Digital & Beneficios",
    description: "Plataforma SaaS de credenciales digitales con QR. Gratuita para Juntas de Vecinos en Chile.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* DNS prefetch and preconnect for Supabase to reduce latency */}
        <link rel="dns-prefetch" href="https://idadoqaekgeunztslgfm.supabase.co" />
        <link rel="preconnect" href="https://idadoqaekgeunztslgfm.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen bg-surface-950 text-slate-200 font-sans">
        <AuthProvider>
          <div className="animated-bg" />
          {children}
          <div id="modal-root" />
        </AuthProvider>
      </body>
    </html>
  );
}
