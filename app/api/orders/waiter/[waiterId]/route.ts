import { NextRequest, NextResponse } from 'next/server'
import { getOrdersByWaiter } from '@/lib/db/orders'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ waiterId: string }> }
) {
  try {
    const { waiterId } = await params

    if (!waiterId) {
      return NextResponse.json(
        { error: 'waiterId is required' },
        { status: 400 }
      )
    }

    const orders = await getOrdersByWaiter(waiterId)

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching waiter orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
