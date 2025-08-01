import { prisma } from './prisma'
import { CreateOrderData, UpdateOrderStatusData, OrderWithDetails } from './types'

// Funciones para órdenes
export async function createOrder(data: CreateOrderData) {
  // Calcular el total de la orden
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: data.items.map(item => item.menuItemId),
      },
    },
  })

  let subtotal = 0
  const orderItems = data.items.map(item => {
    const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItemId}`)
    }
    const totalPrice = menuItem.price * item.quantity
    subtotal += totalPrice
    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      totalPrice,
      notes: item.notes,
    }
  })

  const total = subtotal // Sin impuestos

  // Crear la orden
  const order = await prisma.order.create({
    data: {
      tableId: data.tableId,
      waiterId: data.waiterId,
      subtotal,
      tax: 0, // Sin impuestos
      total,
      notes: data.notes,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      table: true,
      waiter: true,
    },
  })

  // Actualizar estado de la mesa a ocupada
  await prisma.table.update({
    where: { id: data.tableId },
    data: { status: 'OCCUPIED' },
  })

  return order
}

export async function getAllOrders() {
  return prisma.order.findMany({
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  }) as Promise<OrderWithDetails[]>
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: true,
        },
      },
      payment: true,
    },
  }) as Promise<OrderWithDetails | null>
}

export async function getOrdersByWaiter(waiterId: string) {
  return prisma.order.findMany({
    where: { waiterId },
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  }) as Promise<OrderWithDetails[]>
}

export async function updateOrderStatus(data: UpdateOrderStatusData) {
  const updateData: any = {
    status: data.status,
    updatedAt: new Date(),
  }

  if (data.status === 'COMPLETED') {
    updateData.completedAt = new Date()
    
    // Si la orden se completa, liberar la mesa
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    })
    
    if (order) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      })
    }
  }

  return prisma.order.update({
    where: { id: data.orderId },
    data: updateData,
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  })
}

export async function addTipToOrder(orderId: string, tip: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      tip,
      total: order.subtotal + tip, // Sin impuestos
    },
  })
}

export async function getTodaysOrders() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.order.findMany({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  }) as Promise<OrderWithDetails[]>
}

export async function updateOrder(orderId: string, newItems: { menuItemId: string; quantity: number; notes?: string }[]) {
  // Obtener la orden actual
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  })

  if (!existingOrder) {
    throw new Error('Order not found')
  }

  if (existingOrder.status !== 'PENDING') {
    throw new Error('Cannot update order that is not pending')
  }

  // Obtener los precios de los nuevos items del menú
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: newItems.map(item => item.menuItemId),
      },
    },
  })

  // Calcular los nuevos items
  let additionalSubtotal = 0
  const orderItemsToAdd = newItems.map(item => {
    const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItemId}`)
    }
    const totalPrice = menuItem.price * item.quantity
    additionalSubtotal += totalPrice
    return {
      orderId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      totalPrice,
      notes: item.notes,
    }
  })

  // Crear los nuevos items de la orden
  await prisma.orderItem.createMany({
    data: orderItemsToAdd,
  })

  // Actualizar totales de la orden
  const newSubtotal = existingOrder.subtotal + additionalSubtotal
  const newTotal = newSubtotal + (existingOrder.tip || 0) // Sin impuestos

  // Actualizar la orden con nuevos totales
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: newSubtotal,
      tax: 0, // Sin impuestos
      total: newTotal,
      updatedAt: new Date(),
    },
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  })

  return updatedOrder
}

export async function getOrdersByDateRange(startDate: Date, endDate: Date) {
  return prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  }) as Promise<OrderWithDetails[]>
}
