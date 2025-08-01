import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    // Intentar obtener el token del body si existe, sino simplemente proceder
    let token = null
    try {
      const body = await request.json()
      token = body.token
    } catch {
      // Si no hay body JSON válido, continúa sin token
    }

    // Si hay token, buscar y desactivar la sesión en la base de datos
    if (token) {
      const session = await prisma.userSession.findUnique({
        where: { token },
      })

      if (session) {
        await prisma.userSession.update({
          where: { id: session.id },
          data: {
            isActive: false,
            logoutTime: new Date(),
          },
        })
      }
    }

    // El logout siempre es exitoso (el frontend limpia localStorage)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
