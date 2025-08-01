import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { findWaiterByName, authenticateUser } from '@/lib/db/users'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { type, name, email, password } = await request.json()

    if (type === 'waiter') {
      // Autenticación de mesero por nombre
      if (!name) {
        return NextResponse.json(
          { error: 'El nombre es requerido' },
          { status: 400 }
        )
      }

      const waiter = await findWaiterByName(name)
      
      if (!waiter) {
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

      return NextResponse.json({
        success: true,
        user: {
          id: waiter.id,
          name: waiter.name,
          role: waiter.role,
        },
        token: session.token,
      })
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

      return NextResponse.json({
        success: true,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        token: session.token,
      })
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
