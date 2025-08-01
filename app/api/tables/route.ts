import { NextRequest, NextResponse } from 'next/server'
import { getAllTables } from '@/lib/db/tables'

export async function GET() {
  try {
    const tables = await getAllTables()
    return NextResponse.json(tables)
  } catch (error) {
    console.error('Error obteniendo mesas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
