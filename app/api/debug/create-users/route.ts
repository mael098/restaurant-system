import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Crear admin
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@restaurant.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })

    // Crear meseros
    const mesero1 = await prisma.user.create({
      data: {
        name: 'Juan Pérez',
        role: 'WAITER',
        status: 'ACTIVE',
      },
    })

    const mesero2 = await prisma.user.create({
      data: {
        name: 'María García',
        role: 'WAITER',
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ 
      message: 'Usuarios creados',
      users: [admin, mesero1, mesero2]
    })
  } catch (error) {
    console.error('Error creating users:', error)
    return NextResponse.json({ error: 'Error creating users' }, { status: 500 })
  }
}
