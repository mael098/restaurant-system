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

 
  // Crear categorías y menú usando la función actualizada
  const { categories, menuItemsCount } = await seedMenuData()
  console.log('✅ Categorías creadas:', categories.map(c => c.name).join(', '))
  console.log('✅ Items del menú creados:', menuItemsCount)

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
