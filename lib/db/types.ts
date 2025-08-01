// Tipos para el sistema de restaurante
export interface CreateUserData {
  name: string
  email?: string
  password?: string
  role: 'ADMIN' | 'WAITER' | 'KITCHEN' | 'CASHIER'
}

export interface CreateOrderData {
  tableId: string
  waiterId: string
  items: {
    menuItemId: string
    quantity: number
    notes?: string
  }[]
  notes?: string
}

export interface UpdateOrderStatusData {
  orderId: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED'
}

export interface CreateMenuItemData {
  name: string
  description?: string
  price: number
  categoryId: string
  image?: string
}

export interface CreateTableData {
  number: string
  capacity: number
  location?: string
}

export interface OrderWithDetails {
  id: string
  tableId: string
  waiterId: string
  status: string
  total: number
  subtotal: number
  tax: number
  tip: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  table: {
    id: string
    number: string
  }
  waiter: {
    id: string
    name: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    notes?: string
    menuItem: {
      id: string
      name: string
      price: number
    }
  }>
}
