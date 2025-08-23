// src/app/layout.js - COMPLETO CON PWA BÁSICA

import { AuthProvider } from '../components/providers/auth-provider'
import { Toaster } from '../components/ui/sonner'
import './globals.css'

export const metadata = {
  title: {
    default: 'Dhermica Estética',
    template: '%s | Dhermica Estética'
  },
  description: 'Sistema de gestión de citas para tratamientos estéticos profesionales',
  keywords: 'estética, tratamientos, citas, belleza, spa, dermatología, wellness',
  authors: [{ name: 'Dhermica Team' }],
  creator: 'Dhermica',
  publisher: 'Dhermica',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),

  // PWA Metadata básica
  applicationName: 'Dhermica Estética',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dhermica',
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Dhermica Estética',
    title: 'DHérmica Estética - Gestión de Citas',
    description: 'Sistema profesional para la gestión de citas y tratamientos estéticos',
  },

  // Manifest y PWA
  manifest: '/manifest.json',

  // Iconos básicos
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
  },

  // Otros
  category: 'business',
}

export const viewport = {
  themeColor: '#484450',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Variables CSS para fuentes */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --font-geist-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              --font-geist-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            }
          `
        }} />

        {/* Preconnect básico */}
        <link rel="preconnect" href="https://firestore.googleapis.com" />

        {/* PWA Meta Tags básicos */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dhermica" />
        <meta name="application-name" content="Dhermica" />
        <meta name="theme-color" content="#484450" />

        {/* Structured Data básico */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              "name": "Dhermica Estética",
              "description": "Centro especializado en tratamientos estéticos profesionales",
              "url": process.env.NEXT_PUBLIC_APP_URL,
              "logo": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/icons/icon-512x512.png`,
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "AR"
              },
              "serviceType": ["Tratamientos Estéticos", "Cuidado de la Piel", "Wellness"],
            })
          }}
        />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        {/* Contenido principal */}
        <AuthProvider>
          <main className="min-h-screen bg-background">
            {children}
          </main>

          {/* Toaster para notificaciones */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              className: "shadow-md border",
              style: { opacity: 1 },
              success: {
                className: "bg-accent text-accent-foreground border-accent",
              },
              error: {
                className: "bg-destructive text-card-foreground border-destructive",
              },
              info: {
                className: "bg-secondary text-secondary-foreground border-secondary",
              },
              warning: {
                className: "bg-warning text-card-foreground border-warning",
              },
            }}
          />



        </AuthProvider>

        {/* Service Worker registration simple */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered successfully');
                    })
                    .catch(function(error) {
                      console.log('SW registration failed');
                    });
                });
              }
            `
          }}
        />
      </body>
    </html>
  )
}