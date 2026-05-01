import type { Metadata, Viewport } from "next";
import { AuthProvider } from '@/contexts/AuthContext';
import "./globals.css";

export const metadata: Metadata = {
  title: "SkardKey | Identidad Digital & Beneficios",
  description:
    "Plataforma SaaS para la gestión de identidad digital y beneficios para organizaciones sociales. Sindicatos, consejos vecinales, departamentos de asistencia social y fondos de compensación.",
  keywords: [
    "tarjetas digitales",
    "identificación",
    "organizaciones sociales",
    "sindicatos",
    "QR",
    "beneficios",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased min-h-screen bg-surface-950 text-slate-200">
        <AuthProvider>
          <div className="animated-bg" />
          {children}
          <div id="modal-root" />
        </AuthProvider>
      </body>
    </html>
  );
}
