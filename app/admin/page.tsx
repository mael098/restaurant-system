"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Trash2, Eye, DollarSign, LogOut, Shield } from "lucide-react"

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Gestión completa del restaurante</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        <Tabs defaultValue="meseros" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="meseros">Gestión de Meseros</TabsTrigger>
            <TabsTrigger value="pedidos">Historial de Pedidos</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas y Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="meseros" className="space-y-6">
            {/* Agregar nuevo mesero */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Registrar Nuevo Mesero
                </CardTitle>
                <CardDescription>Agrega un nuevo mesero al sistema para que pueda tomar pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="mesero-name">Nombre Completo del Mesero</Label>
                    <Input
                      id="mesero-name"
                      value={newMeseroName}
                      onChange={(e) => setNewMeseroName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      onKeyPress={(e) => e.key === "Enter" && addMesero()}
                    />
                  </div>
                  <Button onClick={addMesero} className="mt-6">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrar Mesero
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de meseros */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Registrado</CardTitle>
                <CardDescription>
                  Gestiona el personal del restaurante - {meseros.filter((m) => m.status === "active").length} activos
                  de {meseros.length} totales
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Fecha de Registro</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Pedidos Realizados</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meseros.map((mesero) => (
                        <TableRow key={mesero.id}>
                          <TableCell className="font-medium">{mesero.name}</TableCell>
                          <TableCell>{mesero.createdAt}</TableCell>
                          <TableCell>
                            <Badge variant={mesero.status === "active" ? "default" : "secondary"}>
                              {mesero.status === "active" ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getOrdersByMesero(mesero.name).length} pedidos</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => toggleMeseroStatus(mesero.id)}>
                                {mesero.status === "active" ? "Desactivar" : "Activar"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteMesero(mesero.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mesa</TableHead>
                        <TableHead>Mesero</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">Mesa {order.tableNumber}</TableCell>
                          <TableCell>{order.waiterName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.items.length} items</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${Number(order.total).toLocaleString('es-MX')}
                          </TableCell>
                          <TableCell className="text-sm">{order.createdAt}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Detalle del Pedido</DialogTitle>
                                  <DialogDescription>
                                    Mesa {selectedOrder?.tableNumber} - Atendido por {selectedOrder?.waiterName}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedOrder && (
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Items del Pedido:</h4>
                                      <div className="space-y-1">
                                        {selectedOrder.items.map((item) => (
                                          <div key={item.id} className="flex justify-between text-sm">
                                            <span>
                                              {item.name} x{item.quantity}
                                            </span>
                                            <span>${(Number(item.price) * item.quantity).toLocaleString('es-MX')}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="border-t pt-2">
                                      <div className="flex justify-between font-semibold text-lg">
                                        <span>Total:</span>
                                        <span className="text-green-600">
                                          ${Number(selectedOrder.total).toLocaleString('es-MX')}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                      <p>
                                        <strong>Fecha:</strong> {selectedOrder.createdAt}
                                      </p>
                                      <p>
                                        <strong>Mesa:</strong> {selectedOrder.tableNumber}
                                      </p>
                                      <p>
                                        <strong>Mesero:</strong> {selectedOrder.waiterName}
                                      </p>
                                      <p>
                                        <strong>Estado:</strong> {selectedOrder.status}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${getTotalSales().toLocaleString('es-MX')}
                  </div>
                  <p className="text-xs text-muted-foreground">{orders.length} pedidos procesados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Personal Activo</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{meseros.filter((m) => m.status === "active").length}</div>
                  <p className="text-xs text-muted-foreground">de {meseros.length} meseros registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${orders.length > 0 ? Math.round(getTotalSales() / orders.length).toLocaleString('es-MX') : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">por pedido</p>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mesero</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Pedidos</TableHead>
                        <TableHead>Ventas Totales</TableHead>
                        <TableHead>Promedio por Pedido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meseros.map((mesero) => {
                        const meseroOrders = getOrdersByMesero(mesero.name)
                        const totalSales = meseroOrders.reduce((sum, order) => sum + Number(order.total), 0)
                        const avgSale = meseroOrders.length > 0 ? Math.round(totalSales / meseroOrders.length) : 0

                        return (
                          <TableRow key={mesero.id}>
                            <TableCell className="font-medium">{mesero.name}</TableCell>
                            <TableCell>
                              <Badge variant={mesero.status === "active" ? "default" : "secondary"}>
                                {mesero.status === "active" ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>{meseroOrders.length}</TableCell>
                            <TableCell className="font-semibold">
                              ${totalSales.toLocaleString('es-MX')}
                            </TableCell>
                            <TableCell>
                              ${avgSale.toLocaleString('es-MX')}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
