"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Trash2, Eye, DollarSign, LogOut, Shield, Printer, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthSession, clearAuthSession } from "@/lib/auth/cookies"

interface Mesero {
  id: number
  name: string
  createdAt: string
  status: "active" | "inactive"
}

interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface Order {
  id: number
  tableNumber: number
  waiterName: string
  items: OrderItem[]
  total: number
  createdAt: string
  status: string
}

export default function AdminPage() {
  const [meseros, setMeseros] = useState<Mesero[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [newMeseroName, setNewMeseroName] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación desde cookies
    const session = getAuthSession()
    if (!session) {
      router.push("/")
      return
    }

    // El middleware ya se encarga de verificar el rol
    
    // Cargar datos desde la API
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar meseros desde la API
      const waitersResponse = await fetch('/api/waiters')
      if (waitersResponse.ok) {
        const waitersData = await waitersResponse.json()
        const formattedMeseros = waitersData.map((waiter: any) => ({
          id: waiter.id,
          name: waiter.name,
          createdAt: new Date(waiter.createdAt).toLocaleDateString(),
          status: waiter.isActive ? "active" : "inactive"
        }))
        setMeseros(formattedMeseros)
      }

      // Cargar órdenes desde la API
      const ordersResponse = await fetch('/api/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const formattedOrders = ordersData.map((order: any) => ({
          id: order.id,
          tableNumber: order.table?.number || order.tableNumber,
          waiterName: order.waiter.name,
          items: order.items.map((item: any) => ({
            id: item.id,
            name: item.menuItem.name,
            price: Number(item.unitPrice || item.menuItem.price),
            quantity: item.quantity
          })),
          total: Number(order.total),
          createdAt: new Date(order.createdAt).toLocaleString(),
          status: order.status
        }))
        setOrders(formattedOrders)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Obtener la sesión del usuario para enviar el token
      const session = getAuthSession()
      if (session) {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: session.token }),
        })
      } else {
        // Si no hay sesión, solo llamar al endpoint sin token
        await fetch('/api/auth/logout', { method: 'POST' })
      }
    } catch (error) {
      console.error('Error logging out:', error)
    }
    // Limpiar cookies
    clearAuthSession()
    router.push("/")
  }

  const addMesero = async () => {
    if (!newMeseroName.trim()) {
      alert("Por favor ingresa un nombre")
      return
    }

    try {
      const response = await fetch('/api/waiters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMeseroName.trim(),
          isActive: true
        }),
      })

      if (response.ok) {
        setNewMeseroName("")
        await loadData() // Recargar datos
        alert(`Mesero ${newMeseroName.trim()} agregado exitosamente`)
      } else {
        const error = await response.json()
        alert(error.error || "Error al agregar mesero")
      }
    } catch (error) {
      console.error('Error adding waiter:', error)
      alert("Error al agregar mesero")
    }
  }

  const toggleMeseroStatus = async (id: number) => {
    try {
      const mesero = meseros.find(m => m.id === id)
      if (!mesero) return

      const response = await fetch(`/api/waiters/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: mesero.status === "inactive"
        }),
      })

      if (response.ok) {
        await loadData() // Recargar datos
      } else {
        alert("Error al actualizar estado del mesero")
      }
    } catch (error) {
      console.error('Error updating waiter status:', error)
      alert("Error al actualizar estado del mesero")
    }
  }

  const deleteMesero = async (id: number) => {
    const mesero = meseros.find((m) => m.id === id)
    if (confirm(`¿Estás seguro de eliminar a ${mesero?.name}?`)) {
      try {
        const response = await fetch(`/api/waiters/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await loadData() // Recargar datos
        } else {
          alert("Error al eliminar mesero")
        }
      } catch (error) {
        console.error('Error deleting waiter:', error)
        alert("Error al eliminar mesero")
      }
    }
  }

  const getTotalSales = () => {
    return orders.reduce((total, order) => total + Number(order.total), 0)
  }

  const getOrdersByMesero = (meseroName: string) => {
    return orders.filter((order) => order.waiterName === meseroName)
  }

  const printTicket = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir')
      return
    }

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket #${order.id}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            padding: 10px;
            max-width: 80mm;
            margin: 0 auto;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          .restaurant-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .ticket-info {
            margin-bottom: 15px;
            font-size: 11px;
          }
          .ticket-info div {
            margin: 3px 0;
          }
          .items {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            margin: 0 10px;
          }
          .item-price {
            text-align: right;
            min-width: 60px;
          }
          .totals {
            margin-top: 15px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .total-final {
            font-size: 16px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            border-top: 2px dashed #000;
            padding-top: 10px;
          }
          .print-button {
            text-align: center;
            margin: 20px 0;
          }
          .print-button button {
            background: #f97316;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            border-radius: 5px;
            cursor: pointer;
          }
          .print-button button:hover {
            background: #ea580c;
          }
          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-button">
          <button onclick="window.print(); setTimeout(() => window.close(), 100);">🖨️ Imprimir Ticket</button>
        </div>
        
        <div class="header">
          <div class="restaurant-name">RESTAURANTE</div>
          <div>Sistema de Pedidos</div>
        </div>
        
        <div class="ticket-info">
          <div><strong>Ticket #:</strong> ${order.id}</div>
          <div><strong>Mesa:</strong> ${order.tableNumber}</div>
          <div><strong>Mesero:</strong> ${order.waiterName}</div>
          <div><strong>Fecha:</strong> ${order.createdAt}</div>
          <div><strong>Estado:</strong> ${order.status}</div>
        </div>
        
        <div class="items">
          ${order.items.map(item => `
            <div class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">x${item.quantity}</span>
              <span class="item-price">$${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>$${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div>¡Gracias por su preferencia!</div>
          <div>Vuelva pronto</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(ticketHTML)
    printWindow.document.close()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Verificando acceso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header mejorado */}
        <div className="glass rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-orange-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Panel de Administración
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Gestión completa del restaurante
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

        <Tabs defaultValue="meseros" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-orange-100">
            <TabsTrigger 
              value="meseros" 
              className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Meseros
            </TabsTrigger>
            <TabsTrigger 
              value="pedidos" 
              className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger 
              value="estadisticas" 
              className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meseros" className="space-y-6">
            {/* Agregar nuevo mesero */}
            <Card className="border-orange-100 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  Registrar Nuevo Mesero
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Agrega un nuevo mesero al sistema para que pueda tomar pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <Label htmlFor="mesero-name" className="text-sm">Nombre Completo del Mesero</Label>
                    <Input
                      id="mesero-name"
                      value={newMeseroName}
                      onChange={(e) => setNewMeseroName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      onKeyPress={(e) => e.key === "Enter" && addMesero()}
                      className="text-sm"
                    />
                  </div>
                  <Button 
                    onClick={addMesero} 
                    className="sm:mt-6 w-full sm:w-auto text-sm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de meseros */}
            <Card className="border-orange-100 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Personal Registrado
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    {meseros.filter((m) => m.status === "active").length} activos
                  </span>
                  <span className="text-gray-400">de</span>
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {meseros.length} totales
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {meseros.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay meseros registrados</p>
                    <p className="text-sm text-gray-400">Agrega el primer mesero para comenzar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Nombre</TableHead>
                          <TableHead className="hidden md:table-cell text-xs sm:text-sm">Fecha de Registro</TableHead>
                          <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                          <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Pedidos</TableHead>
                          <TableHead className="text-xs sm:text-sm">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {meseros.map((mesero) => (
                        <TableRow key={mesero.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">{mesero.name}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs sm:text-sm">{mesero.createdAt}</TableCell>
                          <TableCell>
                            <Badge variant={mesero.status === "active" ? "default" : "secondary"} className="text-xs">
                              {mesero.status === "active" ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="outline" className="text-xs">{getOrdersByMesero(mesero.name).length}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <Button size="sm" variant="outline" onClick={() => toggleMeseroStatus(mesero.id)} className="text-xs px-2">
                                {mesero.status === "active" ? "Desactivar" : "Activar"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteMesero(mesero.id)} className="px-2">
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial Completo de Pedidos</CardTitle>
                <CardDescription>
                  Todos los pedidos realizados por el personal - {orders.length} pedidos totales
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay pedidos registrados</p>
                    <p className="text-sm text-gray-400">
                      Los pedidos aparecerán aquí cuando los meseros los registren
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Mesa</TableHead>
                          <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Mesero</TableHead>
                          <TableHead className="text-xs sm:text-sm">Items</TableHead>
                          <TableHead className="text-xs sm:text-sm">Total</TableHead>
                          <TableHead className="hidden md:table-cell text-xs sm:text-sm">Fecha</TableHead>
                          <TableHead className="text-xs sm:text-sm">Detalles</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">Mesa {order.tableNumber}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{order.waiterName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{order.items.length}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600 text-xs sm:text-sm">
                            ${Number(order.total).toLocaleString('es-MX')}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs">{order.createdAt}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md mx-4 sm:mx-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-base sm:text-lg">Detalle del Pedido</DialogTitle>
                                  <DialogDescription className="text-xs sm:text-sm">
                                    Mesa {selectedOrder?.tableNumber} - {selectedOrder?.waiterName}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedOrder && (
                                  <div className="space-y-3 sm:space-y-4">
                                    <div>
                                      <h4 className="font-semibold mb-2 text-sm sm:text-base">Items del Pedido:</h4>
                                      <div className="space-y-1">
                                        {selectedOrder.items.map((item) => (
                                          <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                                            <span className="line-clamp-1 flex-1">
                                              {item.name} x{item.quantity}
                                            </span>
                                            <span className="shrink-0 ml-2">${(Number(item.price) * item.quantity).toLocaleString('es-MX')}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="border-t pt-2">
                                      <div className="flex justify-between font-semibold text-base sm:text-lg">
                                        <span>Total:</span>
                                        <span className="text-green-600">
                                          ${Number(selectedOrder.total).toLocaleString('es-MX')}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                      <p className="break-words">
                                        <strong>Fecha:</strong> {selectedOrder.createdAt}
                                      </p>
                                      <p>
                                        <strong>Mesa:</strong> {selectedOrder.tableNumber}
                                      </p>
                                      <p className="break-words">
                                        <strong>Mesero:</strong> {selectedOrder.waiterName}
                                      </p>
                                      <p>
                                        <strong>Estado:</strong> {selectedOrder.status}
                                      </p>
                                    </div>
                                    <Button 
                                      onClick={() => printTicket(selectedOrder)} 
                                      className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
                                    >
                                      <Printer className="h-4 w-4" />
                                      Imprimir Ticket
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <Card className="border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-900">Ventas Totales</CardTitle>
                  <div className="p-2 bg-green-500 rounded-lg">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ${getTotalSales().toLocaleString('es-MX')}
                  </div>
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    {orders.length} pedidos procesados
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900">Personal Activo</CardTitle>
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <UserPlus className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {meseros.filter((m) => m.status === "active").length}
                  </div>
                  <p className="text-xs text-blue-700 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    de {meseros.length} meseros registrados
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-900">Ticket Promedio</CardTitle>
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    ${orders.length > 0 ? Math.round(getTotalSales() / orders.length).toLocaleString('es-MX') : 0}
                  </div>
                  <p className="text-xs text-purple-700 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    por pedido
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Rendimiento por mesero */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento del Personal</CardTitle>
                <CardDescription>Estadísticas de ventas por mesero</CardDescription>
              </CardHeader>
              <CardContent>
                {meseros.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay meseros registrados para mostrar estadísticas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Mesero</TableHead>
                          <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Estado</TableHead>
                          <TableHead className="text-xs sm:text-sm">Pedidos</TableHead>
                          <TableHead className="text-xs sm:text-sm">Ventas</TableHead>
                          <TableHead className="hidden md:table-cell text-xs sm:text-sm">Promedio</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {meseros.map((mesero) => {
                        const meseroOrders = getOrdersByMesero(mesero.name)
                        const totalSales = meseroOrders.reduce((sum, order) => sum + Number(order.total), 0)
                        const avgSale = meseroOrders.length > 0 ? Math.round(totalSales / meseroOrders.length) : 0

                        return (
                          <TableRow key={mesero.id}>
                            <TableCell className="font-medium text-xs sm:text-sm">{mesero.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant={mesero.status === "active" ? "default" : "secondary"} className="text-xs">
                                {mesero.status === "active" ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">{meseroOrders.length}</TableCell>
                            <TableCell className="font-semibold text-xs sm:text-sm">
                              ${totalSales.toLocaleString('es-MX')}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                              ${avgSale.toLocaleString('es-MX')}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
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
