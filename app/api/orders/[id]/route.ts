import { NextRequest, NextResponse } from 'next/server'
import { getOrderById, updateOrder } from '@/lib/db/orders'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    
    const order = await getOrderById(id)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    // Validar que cada item tenga menuItemId y quantity
    for (const item of items) {
      if (!item.menuItemId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have menuItemId and positive quantity' },
          { status: 400 }
        )
      }
    }

    const updatedOrder = await updateOrder(id, items)
    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      if (error.message === 'Cannot update order that is not pending') {
        return NextResponse.json(
          { error: 'Cannot update order that is not pending' },
          { status: 400 }
        )
      }
      if (error.message.includes('Menu item not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
