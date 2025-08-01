import { NextRequest, NextResponse } from 'next/server'
import { getAllWaiters, createUser } from '@/lib/db/users'

export async function GET() {
  try {
    const waiters = await getAllWaiters()
    return NextResponse.json(waiters)
  } catch (error) {
    console.error('Error obteniendo meseros:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const waiter = await createUser({
      name,
      role: 'WAITER',
    })

    return NextResponse.json(waiter, { status: 201 })
  } catch (error) {
    console.error('Error creando mesero:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
