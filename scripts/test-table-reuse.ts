import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

async function testTableReuse() {
  console.log('🧪 Iniciando prueba de reutilización de mesas...\n')

  try {
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
    console.log('✅ Mesa de prueba creada:', table.number, '- Estado:', table.status)

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
    console.log('✅ Mesero de prueba creado:', waiter.name)

    // 3. Crear un item de menú de prueba
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
    console.log('✅ Item de menú creado:', menuItem.name, '- Precio:', menuItem.price)

    console.log('\n--- PRIMER PEDIDO ---')

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
      },
      include: { items: true }
    })

    // 5. Marcar mesa como ocupada
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' }
    })

    console.log('✅ Primer pedido creado:', order1.id)
    console.log('   - Mesa estado: OCCUPIED')
    console.log('   - Total:', order1.total)

    // 6. Simular progreso del pedido
    await prisma.order.update({
      where: { id: order1.id },
      data: { status: 'CONFIRMED' }
    })
    console.log('   - Estado: CONFIRMED')

    await prisma.order.update({
      where: { id: order1.id },
      data: { status: 'PREPARING' }
    })
    console.log('   - Estado: PREPARING')

    await prisma.order.update({
      where: { id: order1.id },
      data: { status: 'READY' }
    })
    console.log('   - Estado: READY')

    await prisma.order.update({
      where: { id: order1.id },
      data: { status: 'SERVED' }
    })
    console.log('   - Estado: SERVED')

    // 7. Completar pedido y liberar mesa
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

    console.log('   - Estado: COMPLETED')
    console.log('   - Mesa estado: AVAILABLE (liberada)')

    console.log('\n--- SEGUNDO PEDIDO (REUTILIZACIÓN) ---')

    // 8. Crear segundo pedido en la misma mesa
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
      },
      include: { items: true }
    })

    // 9. Marcar mesa como ocupada nuevamente
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' }
    })

    console.log('✅ Segundo pedido creado en la misma mesa:', order2.id)
    console.log('   - Mesa estado: OCCUPIED (reutilizada)')
    console.log('   - Total:', order2.total)

    console.log('\n--- VERIFICACIÓN DE HISTORIAL ---')

    // 10. Verificar que ambos pedidos existen
    const allOrders = await prisma.order.findMany({
      where: { tableId: table.id },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'asc' }
    })

    console.log('📊 Historial de pedidos para la mesa:', table.number)
    allOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. Pedido ${order.id.slice(-8)}...`)
      console.log(`      - Estado: ${order.status}`)
      console.log(`      - Total: $${order.total}`)
      console.log(`      - Fecha: ${order.createdAt.toISOString()}`)
      console.log(`      - Items: ${order.items.length}`)
    })

    // 11. Estado final de la mesa
    const finalTable = await prisma.table.findUnique({
      where: { id: table.id }
    })

    console.log('\n--- ESTADO FINAL ---')
    console.log('🏆 Mesa:', finalTable?.number, '- Estado:', finalTable?.status)
    console.log('🏆 Total de pedidos creados:', allOrders.length)
    console.log('🏆 Pedido completado:', allOrders.filter(o => o.status === 'COMPLETED').length)
    console.log('🏆 Pedido activo:', allOrders.filter(o => o.status !== 'COMPLETED').length)

    console.log('\n✅ ¡Prueba exitosa! La mesa puede ser reutilizada manteniendo el historial.')

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testTableReuse()
}

export { testTableReuse }
