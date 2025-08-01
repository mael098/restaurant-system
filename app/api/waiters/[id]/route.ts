import { NextRequest, NextResponse } from 'next/server'
import { updateUserStatus, deleteUser } from '@/lib/db/users'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Aceptar tanto 'status' como 'isActive' para compatibilidad
    const isActive = body.status !== undefined ? body.status : body.isActive
    
    // Convertir el boolean a UserStatus enum
    const status = isActive ? 'ACTIVE' : 'INACTIVE'

    const updatedUser = await updateUserStatus(id, status)
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error actualizando mesero:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    await deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando mesero:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
