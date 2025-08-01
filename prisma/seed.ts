import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'
import { seedMenuData } from '../lib/db/menu'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Comenzando seed de la base de datos...')

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@restaurant.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })
  console.log('✅ Usuario administrador creado:', admin.name)

  // Crear meseros de ejemplo
  const waiters = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Juan Pérez',
        role: 'WAITER',
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'María González',
        role: 'WAITER',
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Carlos Rodríguez',
        role: 'WAITER',
        status: 'ACTIVE',
      },
    }),
  ])
  console.log('✅ Meseros creados:', waiters.map(w => w.name).join(', '))

  // Crear categorías y menú usando la función actualizada
  const { categories, menuItemsCount } = await seedMenuData()
  console.log('✅ Categorías creadas:', categories.map(c => c.name).join(', '))
  console.log('✅ Items del menú creados:', menuItemsCount)

  // Obtener los items del menú creados para poder referenciarlos
  const allMenuItems = await prisma.menuItem.findMany()

  // Crear mesas
  const tables = []
  for (let i = 1; i <= 15; i++) {
    const table = await prisma.table.create({
      data: {
        number: i.toString().padStart(2, '0'),
        capacity: i <= 8 ? 4 : i <= 12 ? 6 : 8,
        location: i <= 8 ? 'Planta Baja' : 'Planta Alta',
        status: 'AVAILABLE',
      },
    })
    tables.push(table)
  }
  console.log('✅ Mesas creadas:', tables.length)

  // Crear algunas órdenes de ejemplo
  const orderTotal = allMenuItems[0].price + (allMenuItems[1].price * 2) + allMenuItems[2].price
  const orderSubtotal = orderTotal
  const orderFinalTotal = orderSubtotal // Sin impuestos

  const sampleOrder = await prisma.order.create({
    data: {
      tableId: tables[0].id,
      waiterId: waiters[0].id,
      status: 'COMPLETED',
      subtotal: orderSubtotal,
      tax: 0, // Sin impuestos
      total: orderFinalTotal,
      completedAt: new Date(),
      items: {
        create: [
          {
            menuItemId: allMenuItems[0].id, // Primer item del menú
            quantity: 1,
            unitPrice: allMenuItems[0].price,
            totalPrice: allMenuItems[0].price,
          },
          {
            menuItemId: allMenuItems[1].id, // Segundo item del menú
            quantity: 2,
            unitPrice: allMenuItems[1].price,
            totalPrice: allMenuItems[1].price * 2,
          },
          {
            menuItemId: allMenuItems[2].id, // Tercer item del menú
            quantity: 1,
            unitPrice: allMenuItems[2].price,
            totalPrice: allMenuItems[2].price,
          },
        ],
      },
    },
  })
  console.log('✅ Orden de ejemplo creada:', sampleOrder.id)

  // Crear items de inventario
  const inventoryItems = [
    { itemName: 'Carne de Res', currentStock: 50, minStock: 10, unit: 'kg', cost: 180 },
    { itemName: 'Lechuga', currentStock: 20, minStock: 5, unit: 'kg', cost: 25 },
    { itemName: 'Tomate', currentStock: 30, minStock: 8, unit: 'kg', cost: 30 },
    { itemName: 'Queso', currentStock: 15, minStock: 3, unit: 'kg', cost: 120 },
    { itemName: 'Refrescos', currentStock: 100, minStock: 20, unit: 'pz', cost: 12 },
    { itemName: 'Cerveza', currentStock: 48, minStock: 12, unit: 'pz', cost: 25 },
  ]

  const createdInventory = await Promise.all(
    inventoryItems.map(item => prisma.inventory.create({ data: item }))
  )
  console.log('✅ Items de inventario creados:', createdInventory.length)

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
