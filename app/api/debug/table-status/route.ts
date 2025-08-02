import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' }
    })

    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED']
        }
      },
      include: {
        table: true
      }
    })

    return NextResponse.json({
      tables: tables.map(table => ({
        id: table.id,
        number: table.number,
        status: table.status,
        hasActiveOrder: orders.some(order => order.tableId === table.id)
      })),
      activeOrders: orders.length
    })
  } catch (error) {
    console.error('Error getting table status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
