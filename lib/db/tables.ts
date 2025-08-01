import { prisma } from './prisma'
import { CreateTableData } from './types'

// Funciones para mesas
export async function createTable(data: CreateTableData) {
  return prisma.table.create({
    data,
  })
}

export async function getAllTables() {
  return prisma.table.findMany({
    orderBy: {
      number: 'asc',
    },
  })
}

export async function getTableById(id: string) {
  return prisma.table.findUnique({
    where: { id },
  })
}

export async function getTableByNumber(number: string) {
  return prisma.table.findUnique({
    where: { number },
  })
}

export async function updateTableStatus(id: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE') {
  return prisma.table.update({
    where: { id },
    data: { status },
  })
}

export async function getAvailableTables() {
  return prisma.table.findMany({
    where: {
      status: 'AVAILABLE',
    },
    orderBy: {
      number: 'asc',
    },
  })
}

// Función para inicializar datos de mesas
export async function seedTablesData() {
  const tables = []
  
  // Crear 20 mesas de ejemplo
  for (let i = 1; i <= 20; i++) {
    const table = await createTable({
      number: i.toString().padStart(2, '0'),
      capacity: i <= 10 ? 4 : i <= 15 ? 6 : 8, // Mesas de diferentes capacidades
      location: i <= 10 ? 'Planta Baja' : 'Planta Alta',
    })
    tables.push(table)
  }
  
  return tables
}
