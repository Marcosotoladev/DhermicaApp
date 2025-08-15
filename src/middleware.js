// src/middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/',
    '/login', 
    '/register', 
    '/treatments'
  ]
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/treatments/')
  )
  
  // Permitir acceso a rutas públicas sin verificación
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Permitir acceso a archivos estáticos y API
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Por ahora, permitir acceso a todas las rutas protegidas
  // TODO: Implementar validación de token cuando tengas el AuthProvider funcionando
  console.log('Middleware: Permitiendo acceso a ruta protegida:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}