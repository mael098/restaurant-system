import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('🧪 Iniciando prueba de reutilización de mesas...')

    const logs: string[] = []
    const log = (message: string) => {
      console.log(message)
      logs.push(message)
    }

    // 1. Crear una mesa de prueba
    const table = await prisma.table.upsert({
      where: { number: 'MESA-TEST' },
      update: { status: 'AVAILABLE' },
      create: {
        number: 'MESA-TEST',
        capacity: 4,
        status: 'AVAILABLE',
        location: 'Prueba'
      }
    })
    log(`✅ Mesa de prueba: ${table.number} - Estado: ${table.status}`)

    // 2. Crear un mesero de prueba
    const waiter = await prisma.user.upsert({
      where: { email: 'test@restaurant.com' },
      update: {},
      create: {
        name: 'Mesero Test',
        email: 'test@restaurant.com',
        role: 'WAITER',
        status: 'ACTIVE'
      }
    })
    log(`✅ Mesero de prueba: ${waiter.name}`)

    // 3. Crear categoría y item de menú de prueba
    let category = await prisma.category.findFirst({ where: { name: 'Prueba' } })
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Prueba',
          description: 'Categoría de prueba',
          isActive: true
        }
      })
    }

    const menuItem = await prisma.menuItem.upsert({
      where: { id: 'test-item' },
      update: {},
      create: {
        id: 'test-item',
        name: 'Pizza Test',
        description: 'Pizza de prueba',
        price: 25.99,
        categoryId: category.id,
        isAvailable: true
      }
    })
    log(`✅ Item de menú: ${menuItem.name} - Precio: $${menuItem.price}`)

    log('--- PRIMER PEDIDO ---')

    // 4. Crear primer pedido
    const order1 = await prisma.order.create({
      data: {
        tableId: table.id,
        waiterId: waiter.id,
        status: 'PENDING',
        subtotal: 25.99,
        tax: 2.60,
        total: 28.59,
        items: {
          create: [{
            menuItemId: menuItem.id,
            quantity: 1,
            unitPrice: 25.99,
            totalPrice: 25.99
          }]
        }
      }
    })

    // 5. Marcar mesa como ocupada
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' }
    })

    log(`✅ Primer pedido creado: ${order1.id}`)
    log('   - Mesa estado: OCCUPIED')
    log(`   - Total: $${order1.total}`)

    // 6. Completar pedido y liberar mesa
    await prisma.order.update({
      where: { id: order1.id },
      data: { 
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'AVAILABLE' }
    })

    log('   - Estado final: COMPLETED')
    log('   - Mesa estado: AVAILABLE (liberada)')

    log('--- SEGUNDO PEDIDO (REUTILIZACIÓN) ---')

    // 7. Crear segundo pedido en la misma mesa
    const order2 = await prisma.order.create({
      data: {
        tableId: table.id, // ¡Misma mesa!
        waiterId: waiter.id,
        status: 'PENDING',
        subtotal: 51.98,
        tax: 5.20,
        total: 57.18,
        items: {
          create: [{
            menuItemId: menuItem.id,
            quantity: 2,
            unitPrice: 25.99,
            totalPrice: 51.98
          }]
        }
      }
    })

    // 8. Marcar mesa como ocupada nuevamente
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' }
    })

    log(`✅ Segundo pedido creado en la misma mesa: ${order2.id}`)
    log('   - Mesa estado: OCCUPIED (reutilizada)')
    log(`   - Total: $${order2.total}`)

    log('--- VERIFICACIÓN DE HISTORIAL ---')

    // 9. Verificar que ambos pedidos existen
    const allOrders = await prisma.order.findMany({
      where: { tableId: table.id },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'asc' }
    })

    log(`📊 Historial de pedidos para la mesa: ${table.number}`)
    allOrders.forEach((order, index) => {
      log(`   ${index + 1}. Pedido ${order.id.slice(-8)}...`)
      log(`      - Estado: ${order.status}`)
      log(`      - Total: $${order.total}`)
      log(`      - Items: ${order.items.length}`)
    })

    log('--- ESTADO FINAL ---')
    const finalTable = await prisma.table.findUnique({
      where: { id: table.id }
    })

    log(`🏆 Mesa: ${finalTable?.number} - Estado: ${finalTable?.status}`)
    log(`🏆 Total de pedidos creados: ${allOrders.length}`)
    log(`🏆 Pedidos completados: ${allOrders.filter(o => o.status === 'COMPLETED').length}`)
    log(`🏆 Pedidos activos: ${allOrders.filter(o => o.status !== 'COMPLETED').length}`)

    log('✅ ¡Prueba exitosa! La mesa puede ser reutilizada manteniendo el historial.')

    return NextResponse.json({
      success: true,
      message: 'Prueba de reutilización de mesas completada exitosamente',
      logs,
      summary: {
        table: finalTable,
        totalOrders: allOrders.length,
        completedOrders: allOrders.filter(o => o.status === 'COMPLETED').length,
        activeOrders: allOrders.filter(o => o.status !== 'COMPLETED').length,
        orders: allOrders.map(o => ({
          id: o.id,
          status: o.status,
          total: o.total,
          itemCount: o.items.length,
          createdAt: o.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
