import { prisma } from './prisma'
import { CreateUserData } from './types'
import bcrypt from 'bcryptjs'

// Funciones para usuarios
export async function createUser(data: CreateUserData) {
  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null
  
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

export async function getAllWaiters() {
  return prisma.user.findMany({
    where: {
      role: 'WAITER',
    },
    orderBy: {
      name: 'asc',
    },
  })
}

export async function updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
  return prisma.user.update({
    where: { id },
    data: { status },
  })
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email)
  
  if (!user || !user.password) {
    return null
  }
  
  const isValid = await bcrypt.compare(password, user.password)
  
  if (!isValid) {
    return null
  }
  
  return user
}

export async function findWaiterByName(name: string) {
  return prisma.user.findFirst({
    where: {
      name: {
        equals: name,
      },
      role: 'WAITER',
      status: 'ACTIVE',
    },
  })
}
