import { NextRequest, NextResponse } from 'next/server'
import { getAllMenuItems } from '@/lib/db/menu'

export async function GET() {
  try {
    const menuItems = await getAllMenuItems()
    return NextResponse.json(menuItems)        
  } catch (error) {
    console.error('Error obteniendo menú:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
