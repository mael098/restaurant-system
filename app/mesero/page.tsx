"use client"

import { useState, useEffect } from "react"
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

  const categories = ["Todos", ...Array.from(new Set(menuItems.map((item) => item.category.name)))]

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
      // Cargar menú
      const menuResponse = await fetch('/api/menu')
      if (menuResponse.ok) {
        const menuData = await menuResponse.json()
        setMenuItems(menuData)
      }

      // Cargar mesas
      const tablesResponse = await fetch('/api/tables')
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

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "Todos" || item.category.name === selectedCategory
    const matchesSearch = searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch
  })

  const addToOrder = (item: MenuItem) => {
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
  }

  const removeFromOrder = (menuItemId: string) => {
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
  }

  const getTotalPrice = () => {
    return orderItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Pedidos</h1>
            <p className="text-gray-600">Bienvenido, {userSession?.user.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-order" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {editingOrder ? "Agregar Items" : "Nuevo Pedido"}
            </TabsTrigger>
            <TabsTrigger value="my-orders" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Mis Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-order" className="space-y-6">
            {editingOrder && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-orange-800">Editando Pedido</CardTitle>
                      <CardDescription className="text-orange-600">
                        Mesa {editingOrder.table.number} - Agregando nuevos items
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={cancelEdit} size="sm">
                      Cancelar Edición
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Información del pedido */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      {editingOrder ? "Nuevos Items" : "Pedido Actual"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!editingOrder && (
                      <div>
                        <Label htmlFor="mesa">Mesa</Label>
                        <Select value={selectedTable} onValueChange={setSelectedTable}>
                          <SelectTrigger>
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
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">
                        {editingOrder ? "Items a Agregar" : "Items del Pedido"}
                      </h3>
                      {orderItems.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          {editingOrder ? "No hay items nuevos para agregar" : "No hay items en el pedido"}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {orderItems.map((item) => (
                            <div key={item.menuItemId} className="flex justify-between items-center text-sm">
                              <span>
                                {item.name} x{item.quantity}
                              </span>
                              <div className="flex items-center gap-2">
                                <span>${item.price * item.quantity}</span>
                                <Button size="sm" variant="outline" onClick={() => removeFromOrder(item.menuItemId)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex justify-between font-semibold text-lg">
                            <span>{editingOrder ? "Subtotal adicional:" : "Total:"}</span>
                            <span className="text-green-600">${getTotalPrice()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={saveOrder}
                      className="w-full mt-4"
                      disabled={!selectedTable || orderItems.length === 0 || submitting}
                      size="lg"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      {submitting
                        ? "Guardando..."
                        : editingOrder
                          ? "Agregar Items al Pedido"
                          : "Guardar Pedido"
                      }
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Menú */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Menú del Restaurante</CardTitle>
                    <CardDescription>Selecciona los items para agregar al pedido</CardDescription>

                    {/* Buscador */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar platillos, bebidas, etc..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Filtros por categoría */}
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((category) => (
                        <Badge
                          key={category}
                          variant={selectedCategory === category ? "default" : "outline"}
                          className="cursor-pointer"
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredItems.map((item) => {
                          const orderItem = orderItems.find(orderItem => orderItem.menuItemId === item.id)
                          const quantity = orderItem ? orderItem.quantity : 0
                          
                          return (
                            <Card key={item.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <p className="text-sm text-gray-600">{item.category.name}</p>
                                    {item.description && (
                                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="text-lg font-semibold">
                                    ${item.price}
                                  </Badge>
                                </div>
                                
                                {quantity === 0 ? (
                                  <Button onClick={() => addToOrder(item)} className="w-full" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar al Pedido
                                  </Button>
                                ) : (
                                  <div className="flex items-center justify-between bg-orange-50 p-2 rounded-lg">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => removeFromOrder(item.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <div className="text-center">
                                      <p className="text-sm font-medium text-orange-800">Cantidad: {quantity}</p>
                                      <p className="text-xs text-orange-600">Subtotal: ${item.price * quantity}</p>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => addToOrder(item)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="my-orders" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Mi Historial de Pedidos
                  </CardTitle>
                  <CardDescription>
                    Tus pedidos realizados recientemente
                  </CardDescription>
                </div>
                <Button onClick={loadMyOrders} variant="outline" size="sm">
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
                  <div className="space-y-4">
                    {myOrders.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">Mesa {order.table.number}</h3>
                                <Badge
                                  variant={
                                    order.status === 'PENDING' ? 'destructive' :
                                      order.status === 'PREPARING' ? 'default' :
                                        order.status === 'READY' ? 'secondary' :
                                          'outline'
                                  }
                                >
                                  {order.status === 'PENDING' ? 'Pendiente' :
                                    order.status === 'PREPARING' ? 'Preparando' :
                                      order.status === 'READY' ? 'Listo' :
                                        order.status === 'SERVED' ? 'Servido' :
                                          'Completado'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-green-600">${order.total}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                {order.status === 'PENDING' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditingOrder(order)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Agregar Items
                                  </Button>
                                )}
                                {getNextStatus(order.status) && (
                                  <Button
                                    size="sm"
                                    variant={getNextStatus(order.status) === 'COMPLETED' ? 'default' : 'outline'}
                                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                                    className={getNextStatus(order.status) === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
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
                            <p className="text-sm font-medium text-gray-700">Items:</p>
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                                <span>{item.menuItem.name} x{item.quantity}</span>
                                <span>${item.totalPrice}</span>
                              </div>
                            ))}
                          </div>

                          <Separator className="my-2" />
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>${order.subtotal}</span>
                          </div>
                          {order.tip && (
                            <div className="flex justify-between text-sm">
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
