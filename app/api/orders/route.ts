import { NextRequest, NextResponse } from 'next/server'
import { getAllOrders, createOrder } from '@/lib/db/orders'

export async function GET() {
  try {
    const orders = await getAllOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error obteniendo órdenes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    const order = await createOrder(orderData)
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creando orden:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
