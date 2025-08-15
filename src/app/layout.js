// src/app/layout.js
import { Inter } from 'next/font/google'
import { AuthProvider } from '../components/providers/auth-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dhermica Estética',
  description: 'Sistema de gestión de citas para tratamientos estéticos',
  keywords: 'estética, tratamientos, citas, belleza, spa',
}

/**
 * Layout principal de la aplicación
 * Incluye providers globales y configuración base
 */
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}