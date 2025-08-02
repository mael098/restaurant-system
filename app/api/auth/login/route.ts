import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { findWaiterByName, authenticateUser } from '@/lib/db/users'

export async function POST(request: NextRequest) {
  try {
    const { type, name, email, password } = await request.json()
    
    console.log('Login attempt:', { type, name, email })

    if (type === 'waiter') {
      // Autenticación de mesero por nombre
      if (!name) {
        console.log('Error: Nombre requerido')
        return NextResponse.json(
          { error: 'El nombre es requerido' },
          { status: 400 }
        )
      }

      console.log('Searching for waiter:', name.trim())
      const waiter = await findWaiterByName(name)
      
      console.log('Waiter found:', waiter)
      
      if (!waiter) {
        console.log('Error: Mesero no encontrado')
        return NextResponse.json(
          { error: 'Mesero no encontrado o inactivo' },
          { status: 401 }
        )
      }

      // Crear sesión
      const session = await prisma.userSession.create({
        data: {
          userId: waiter.id,
          token: `waiter_${Date.now()}_${Math.random()}`,
        },
      })

      // Crear respuesta con cookies
      const response = NextResponse.json({
        success: true,
        token: session.token,
        user: {
          id: waiter.id,
          name: waiter.name,
          role: waiter.role,
        },
        redirectTo: '/mesero'
      })

      // Establecer cookies manualmente para evitar URL-encoding
      const userDataString = JSON.stringify({
        id: waiter.id,
        name: waiter.name,
        role: waiter.role,
      })
      
      response.cookies.set('auth-token', session.token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })
      
      response.cookies.set('user-data', userDataString, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })

      return response
    }

    if (type === 'admin') {
      // Autenticación de administrador
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email y contraseña son requeridos' },
          { status: 400 }
        )
      }

      const admin = await authenticateUser(email, password)
      
      if (!admin || admin.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Credenciales incorrectas' },
          { status: 401 }
        )
      }

      // Crear sesión
      const session = await prisma.userSession.create({
        data: {
          userId: admin.id,
          token: `admin_${Date.now()}_${Math.random()}`,
        },
      })

      // Crear respuesta con cookies
      const response = NextResponse.json({
        success: true,
        token: session.token,
        user: {
          id: admin.id,
          name: admin.name,
          role: admin.role,
        },
        redirectTo: '/admin'
      })

      // Establecer cookies manualmente para evitar URL-encoding
      const userDataString = JSON.stringify({
        id: admin.id,
        name: admin.name,
        role: admin.role,
      })
      
      response.cookies.set('auth-token', session.token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })
      
      response.cookies.set('user-data', userDataString, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })

      return response
    }

    return NextResponse.json(
      { error: 'Tipo de usuario no válido' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
