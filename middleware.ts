import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedRoutes = ['/admin', '/mesero']
const publicRoutes = ['/']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Si es una ruta de API, dejar pasar
    if (pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    // Si es archivos estáticos, dejar pasar
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
        return NextResponse.next()
    }

    // Obtener cookies de autenticación
    const token = request.cookies.get('auth-token')?.value
    const userData = request.cookies.get('user-data')?.value

    console.log('Middleware - pathname:', pathname)
    console.log('Middleware - token:', token ? 'presente' : 'ausente')
    console.log('Middleware - userData:', userData ? 'presente' : 'ausente')

    // Si no hay token y está intentando acceder a rutas protegidas
    if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
        console.log('Middleware - Redirigiendo a login (sin token)')
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Si hay token, verificar el usuario y redirigir según el rol
    if (token && userData) {
        try {
            // Parsear datos del usuario de la cookie
            const user = JSON.parse(userData)
            const userRole = user.role
            
            console.log('Middleware - userRole:', userRole)

            // Redirigir según el rol si está en la página principal
            if (pathname === '/') {
                if (userRole === 'ADMIN') {
                    console.log('Middleware - Redirigiendo admin a /admin')
                    return NextResponse.redirect(new URL('/admin', request.url))
                } else if (userRole === 'WAITER') {
                    console.log('Middleware - Redirigiendo mesero a /mesero')
                    return NextResponse.redirect(new URL('/mesero', request.url))
                }
            }

            // Verificar acceso a rutas protegidas según rol
            if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
                return NextResponse.redirect(new URL('/mesero', request.url))
            }

            if (pathname.startsWith('/mesero') && userRole !== 'WAITER') {
                return NextResponse.redirect(new URL('/admin', request.url))
            }

        } catch (error) {
            console.error('Error parsing user data in middleware:', error)
            // En caso de error, limpiar cookies y redirigir
            const response = NextResponse.redirect(new URL('/', request.url))
            response.cookies.delete('auth-token')
            response.cookies.delete('user-data')
            return response
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
}
