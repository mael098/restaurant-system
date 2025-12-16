import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sistema de Restaurante',
  description: 'Sistema de gestión de pedidos para restaurantes',
  generator: 'v0.dev',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// Preconnect para optimizar carga de fuentes
const fontOptimizations = `
  @font-face {
    font-display: swap;
  }
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#f97316" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}

/* CSS Crítico para prevenir CLS */
.min-h-screen {
  min-height: 100vh;
  min-height: 100dvh;
}

/* Optimización de animaciones */
.animate-blob {
  will-change: transform;
  contain: layout style paint;
}

/* Reservar espacio para prevenir CLS */
.line-clamp-2 {
  min-height: 2.5rem;
}

/* Optimización de renderizado */
body {
  content-visibility: auto;
}
        `}</style>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
