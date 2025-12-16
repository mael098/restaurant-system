"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, LogOut, Calculator, Search, History, ShoppingCart, Edit, Clock, Check, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthSession, clearAuthSession } from "@/lib/auth/cookies"

// Componente memoizado para items del menú - Optimiza re-renders
const MenuItemCard = memo(({ 
  item, 
  quantity, 
  onAdd, 
  onRemove 
}: { 
  item: MenuItem
  quantity: number
  onAdd: (item: MenuItem) => void
  onRemove: (id: string) => void
}) => (
  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-orange-100 bg-gradient-to-br from-white to-orange-50/20">
    <CardContent className="p-3 sm:p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 mr-2" style={{ contain: 'layout' }}>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-1 text-gray-900">{item.name}</h3>
          <p className="text-xs text-orange-600 font-medium">{item.category.name}</p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 hidden sm:block" style={{ minHeight: '2.5rem', contain: 'layout' }}>
              {item.description}
            </p>
          )}
        </div>
        <Badge className="text-sm sm:text-base font-bold shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          ${Number(item.price).toFixed(2)}
        </Badge>
      </div>
      
      {quantity === 0 ? (
        <Button 
          onClick={() => onAdd(item)} 
          className="w-full text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg transition-all duration-300" 
          size="sm"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Agregar
        </Button>
      ) : (
        <div className="flex items-center justify-between bg-orange-50 p-1.5 sm:p-2 rounded-lg">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onRemove(item.id)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <div className="text-center px-1">
            <p className="text-xs sm:text-sm font-medium text-orange-800">Cant: {quantity}</p>
            <p className="text-xs text-orange-600">${(Number(item.price) * quantity).toFixed(2)}</p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAdd(item)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
))

MenuItemCard.displayName = 'MenuItemCard'

interface Order {
  id: string
  tableId: string
  status: string
  subtotal: number
  tax: number
  total: number
  tip?: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  table: {
    id: string
    number: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    menuItem: {
      id: string
      name: string
    }
  }>
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: {
    id: string
    name: string
  }
}

interface Table {
  id: string
  number: string
  capacity: number
  status: string
}

interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface UserSession {
  token: string
  user: {
    id: string
    name: string
    role: string
  }
}

export default function MeseroPage() {
  const [selectedTable, setSelectedTable] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [userSession, setUserSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState("new-order")
  const router = useRouter()

  // Memoizar categories para evitar recalcular en cada render
  const categories = useMemo(() => 
    ["Todos", ...Array.from(new Set(menuItems.map((item) => item.category.name)))],
    [menuItems]
  )

  useEffect(() => {
    // Verificar autenticación desde cookies
    const session = getAuthSession()
    if (!session) {
      router.push("/")
      return
    }

    // El middleware ya se encarga de verificar el rol
    setUserSession(session)
    loadData()
  }, [router])

  useEffect(() => {
    // Cargar pedidos cuando el usuario esté disponible
    if (userSession) {
      loadMyOrders()
    }
  }, [userSession])

  const loadData = async () => {
    try {
      // Cargar menú y mesas en paralelo para mejorar LCP
      const [menuResponse, tablesResponse] = await Promise.all([
        fetch('/api/menu', { priority: 'high' } as any),
        fetch('/api/tables', { priority: 'high' } as any)
      ])

      if (menuResponse.ok) {
        const menuData = await menuResponse.json()
        setMenuItems(menuData)
      }

      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json()
        setTables(tablesData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error cargando datos:', error)
      setLoading(false)
    }
  }

  const loadMyOrders = async () => {
    if (!userSession) return

    setLoadingOrders(true)
    try {
      const response = await fetch(`/api/orders/waiter/${userSession.user.id}`)
      if (response.ok) {
        const orders = await response.json()
        setMyOrders(orders)
      }
    } catch (error) {
      console.error('Error cargando mis pedidos:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleLogout = async () => {
    if (userSession) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: userSession.token }),
        })
      } catch (error) {
        console.error('Error en logout:', error)
      }
    }

    // Limpiar cookies
    clearAuthSession()
    router.push("/")
  }

  // Memoizar filteredItems para evitar filtrado en cada render
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === "Todos" || item.category.name === selectedCategory
      const matchesSearch = searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesCategory && matchesSearch
    })
  }, [menuItems, selectedCategory, searchTerm])

  // Memoizar funciones con useCallback
  const addToOrder = useCallback((item: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((orderItem) => orderItem.menuItemId === item.id)
      if (existing) {
        return prev.map((orderItem) =>
          orderItem.menuItemId === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem,
        )
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]
    })
  }, [])

  const removeFromOrder = useCallback((menuItemId: string) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItemId)
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      }
      return prev.filter((item) => item.menuItemId !== menuItemId)
    })
  }, [])

  // Memoizar cálculo del total
  const totalPrice = useMemo(() => {
    return orderItems.reduce((total, item) => total + Number(item.price) * item.quantity, 0)
  }, [orderItems])

  const saveOrder = async () => {
    if (!selectedTable || orderItems.length === 0 || !userSession) {
      alert("Por favor selecciona una mesa y agrega al menos un item")
      return
    }

    setSubmitting(true)

    try {
      let response
      let orderData

      if (editingOrder) {
        // Actualizando pedido existente
        orderData = {
          items: orderItems.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
        }

        response = await fetch(`/api/orders/${editingOrder.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        })
      } else {
        // Creando nuevo pedido
        orderData = {
          tableId: selectedTable,
          waiterId: userSession.user.id,
          items: orderItems.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
        }

        response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar la orden')
      }

      const order = await response.json()

      // Limpiar formulario
      setOrderItems([])
      setSelectedTable("")
      setEditingOrder(null)

      const action = editingOrder ? "actualizado" : "guardado"
      alert(`¡Pedido ${action} exitosamente!`)

      // Recargar datos
      loadData()
      loadMyOrders()

      // Volver al tab de pedidos si estaba editando
      if (editingOrder) {
        setActiveTab("my-orders")
      }
    } catch (error) {
      console.error('Error guardando orden:', error)
      alert('Error al guardar la orden')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditingOrder = (order: Order) => {
    // Solo permitir editar pedidos pendientes
    if (order.status !== 'PENDING') {
      alert('Solo se pueden editar pedidos pendientes')
      return
    }

    setEditingOrder(order)
    setSelectedTable(order.tableId)
    setOrderItems([]) // Empezar con items vacíos para agregar nuevos
    setActiveTab("new-order")
  }

  const cancelEdit = () => {
    setEditingOrder(null)
    setOrderItems([])
    setSelectedTable("")
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar estado')
      }

      // Recargar pedidos para ver el cambio
      loadMyOrders()
      
      // Si se completó el pedido, también recargar las mesas para que se liberen
      if (newStatus === 'COMPLETED') {
        loadData()
        alert('¡Pedido completado! La mesa ha sido liberada.')
      } else {
        alert(`Estado del pedido actualizado a: ${getStatusText(newStatus)}`)
      }
    } catch (error) {
      console.error('Error actualizando estado:', error)
      alert('Error al actualizar el estado del pedido')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente'
      case 'PREPARING': return 'Preparando'
      case 'READY': return 'Listo'
      case 'SERVED': return 'Servido'
      case 'COMPLETED': return 'Completado'
      default: return status
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING': return 'PREPARING'
      case 'PREPARING': return 'READY'
      case 'READY': return 'SERVED'
      case 'SERVED': return 'COMPLETED'
      default: return null
    }
  }

  const getStatusButtonText = (currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus)
    if (!nextStatus) return null
    
    switch (nextStatus) {
      case 'PREPARING': return 'Preparando'
      case 'READY': return 'Listo'
      case 'SERVED': return 'Servido'
      case 'COMPLETED': return 'Completar'
      default: return getStatusText(nextStatus)
    }
  }

  const getStatusIcon = (currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus)
    switch (nextStatus) {
      case 'PREPARING': return <Clock className="h-3 w-3" />
      case 'READY': return <Check className="h-3 w-3" />
      case 'SERVED': return <CheckCircle className="h-3 w-3" />
      case 'COMPLETED': return <CheckCircle className="h-3 w-3" />
      default: return null
    }
  }

  // Skeleton Loader optimizado para prevenir CLS
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/30 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="glass rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-orange-100 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-200 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-orange-200 rounded"></div>
                  <div className="h-4 w-32 bg-orange-100 rounded"></div>
                </div>
              </div>
              <div className="h-9 w-24 bg-orange-100 rounded"></div>
            </div>
          </div>
          
          {/* Tabs skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <div className="h-10 w-32 bg-white rounded-lg"></div>
              <div className="h-10 w-32 bg-white rounded-lg"></div>
            </div>
            
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="flex justify-between mb-2">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-100 rounded w-full" style={{ minHeight: '2.5rem' }}></div>
                      </div>
                      <div className="h-6 w-16 bg-green-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg p-4 h-96 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded"></div>
                  <div className="h-4 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/30 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header mejorado */}
        <div className="glass rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-orange-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Sistema de Pedidos
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  👋 Bienvenido, <span className="font-semibold text-orange-600">{userSession?.user.name}</span>
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="gap-2 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs sm:text-sm transition-all duration-300"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-orange-100">
            <TabsTrigger 
              value="new-order" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{editingOrder ? "Agregar Items" : "Nuevo Pedido"}</span>
              <span className="sm:hidden">Pedido</span>
            </TabsTrigger>
            <TabsTrigger 
              value="my-orders" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mis Pedidos</span>
              <span className="sm:hidden">Historial</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-order" className="space-y-6">
            {editingOrder && (
              <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Edit className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-orange-800 text-base sm:text-lg flex items-center gap-2">
                          Editando Pedido
                          <Badge className="bg-orange-600 text-white">Mesa {editingOrder.table.number}</Badge>
                        </CardTitle>
                        <CardDescription className="text-orange-600 text-xs sm:text-sm">
                          Agregando nuevos items al pedido
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={cancelEdit} 
                      size="sm" 
                      className="text-xs sm:text-sm w-full sm:w-auto border-orange-300 hover:bg-orange-100"
                    >
                      ✕ Cancelar
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Información del pedido */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <Card className="lg:sticky lg:top-2 border-orange-100 shadow-lg bg-gradient-to-br from-white to-orange-50/30">
                  <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                        <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      {editingOrder ? "Nuevos Items" : "Pedido Actual"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {!editingOrder && (
                      <div>
                        <Label htmlFor="mesa" className="text-sm">Mesa</Label>
                        <Select value={selectedTable} onValueChange={setSelectedTable}>
                          <SelectTrigger className="text-xs sm:text-sm h-9">
                            <SelectValue placeholder="Selecciona una mesa" />
                          </SelectTrigger>
                          <SelectContent>
                            {tables
                              .filter(table => table.status === 'AVAILABLE')
                              .map((table) => (
                                <SelectItem key={table.id} value={table.id}>
                                  Mesa {table.number} (Cap. {table.capacity})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {editingOrder && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Mesa seleccionada:</p>
                        <p className="font-semibold">Mesa {editingOrder.table.number}</p>
                      </div>
                    )}

                    {/* Resumen del pedido */}
                    <div className="mt-4 sm:mt-6">
                      <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                        {editingOrder ? "Items a Agregar" : "Items del Pedido"}
                      </h3>
                      {orderItems.length === 0 ? (
                        <p className="text-gray-500 text-xs sm:text-sm">
                          {editingOrder ? "No hay items nuevos" : "No hay items"}
                        </p>
                      ) : (
                        <div className="space-y-1.5 sm:space-y-2">
                          {orderItems.map((item) => (
                            <div key={item.menuItemId} className="flex justify-between items-center text-xs sm:text-sm gap-2">
                              <span className="line-clamp-1 flex-1">
                                {item.name} x{item.quantity}
                              </span>
                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <span className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                                <Button size="sm" variant="outline" onClick={() => removeFromOrder(item.menuItemId)} className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Separator className="my-2" />
                          <div className="flex justify-between font-semibold text-sm sm:text-base">
                            <span className="text-xs sm:text-sm">{editingOrder ? "Subtotal:" : "Total:"}</span>
                            <span className="text-green-600">${totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={saveOrder}
                      className="w-full mt-3 sm:mt-4 text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={!selectedTable || orderItems.length === 0 || submitting}
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          {editingOrder ? "✓ Agregar Items" : "✓ Guardar Pedido"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Menú */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <Card className="border-orange-100 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3 sm:pb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                        <ShoppingCart className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">Menú del Restaurante</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Selecciona los items para agregar al pedido</CardDescription>
                      </div>
                    </div>

                    {/* Buscador mejorado */}
                    <div className="relative mt-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 h-3 w-3 sm:h-4 sm:w-4" />
                      <Input
                        placeholder="🔍 Buscar platillos, bebidas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 sm:pl-10 text-xs sm:text-sm border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    {/* Filtros por categoría mejorados */}
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap mt-3">
                      {categories.map((category) => (
                        <Badge
                          key={category}
                          variant={selectedCategory === category ? "default" : "outline"}
                          className={`cursor-pointer text-xs px-3 py-1 transition-all duration-300 ${
                            selectedCategory === category 
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg" 
                              : "border-orange-300 hover:bg-orange-50"
                          }`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Mostrar número de resultados */}
                    {searchTerm && (
                      <div className="mb-4 text-sm text-gray-600">
                        {filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''} para "{searchTerm}"
                      </div>
                    )}

                    {filteredItems.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {searchTerm
                            ? `No se encontraron resultados para "${searchTerm}"`
                            : "No hay elementos en esta categoría"
                          }
                        </p>
                        {searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setSearchTerm("")}
                            className="mt-2"
                          >
                            Limpiar búsqueda
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {filteredItems.map((item) => {
                          const orderItem = orderItems.find(orderItem => orderItem.menuItemId === item.id)
                          const quantity = orderItem ? orderItem.quantity : 0
                          
                          return (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              quantity={quantity}
                              onAdd={addToOrder}
                              onRemove={removeFromOrder}
                            />
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="my-orders" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <History className="h-4 w-4 sm:h-5 sm:w-5" />
                    Mi Historial de Pedidos
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Tus pedidos realizados recientemente
                  </CardDescription>
                </div>
                <Button onClick={loadMyOrders} variant="outline" size="sm" className="text-xs sm:text-sm">
                  Actualizar
                </Button>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p>Cargando pedidos...</p>
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tienes pedidos registrados aún</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {myOrders.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-sm sm:text-base">Mesa {order.table.number}</h3>
                                <Badge
                                  variant={
                                    order.status === 'PENDING' ? 'destructive' :
                                      order.status === 'PREPARING' ? 'default' :
                                        order.status === 'READY' ? 'secondary' :
                                          'outline'
                                  }
                                  className="text-xs"
                                >
                                  {order.status === 'PENDING' ? 'Pendiente' :
                                    order.status === 'PREPARING' ? 'Preparando' :
                                      order.status === 'READY' ? 'Listo' :
                                        order.status === 'SERVED' ? 'Servido' :
                                          'Completado'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right sm:text-left flex sm:flex-col items-center sm:items-end gap-2">
                              <p className="text-base sm:text-lg font-semibold text-green-600">${order.total}</p>
                              <div className="flex flex-row sm:flex-col gap-1 sm:gap-1.5">
                                {order.status === 'PENDING' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditingOrder(order)}
                                    className="text-xs px-2 h-7 sm:h-8"
                                  >
                                    <Edit className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline ml-1">Agregar Items</span>
                                  </Button>
                                )}
                                {getNextStatus(order.status) && (
                                  <Button
                                    size="sm"
                                    variant={getNextStatus(order.status) === 'COMPLETED' ? 'default' : 'outline'}
                                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                                    className={`text-xs px-2 h-7 sm:h-8 ${getNextStatus(order.status) === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                  >
                                    {getStatusIcon(order.status)}
                                    <span className="ml-1">
                                      {getStatusButtonText(order.status)}
                                    </span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-700">Items:</p>
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-xs text-gray-600">
                                <span className="line-clamp-1">{item.menuItem.name} x{item.quantity}</span>
                                <span className="shrink-0 ml-2">${item.totalPrice}</span>
                              </div>
                            ))}
                          </div>

                          <Separator className="my-2" />
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span>Subtotal:</span>
                            <span>${order.subtotal}</span>
                          </div>
                          {order.tip && (
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span>Propina:</span>
                              <span>${order.tip}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
