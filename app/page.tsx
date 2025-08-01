"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, ChefHat, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [meseroName, setMeseroName] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Credenciales de admin (en producción esto debería estar en una base de datos)
  const ADMIN_PASSWORD = "admin123"

  const handleMeseroLogin = async () => {
    if (!meseroName.trim()) {
      alert("Por favor ingresa tu nombre")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'waiter',
          name: meseroName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Error en el login')
        setLoading(false)
        return
      }

      // Guardar sesión
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          type: "mesero",
          user: data.user,
          token: data.token,
          loginTime: new Date().toISOString(),
        }),
      )

      router.push("/mesero")
    } catch (error) {
      console.error('Error en login:', error)
      alert('Error de conexión')
      setLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    if (!adminPassword) {
      alert("Por favor ingresa la contraseña")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'admin',
          email: 'admin@restaurant.com',
          password: adminPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Contraseña incorrecta')
        setLoading(false)
        return
      }

      // Guardar sesión
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          type: "admin",
          user: data.user,
          token: data.token,
          loginTime: new Date().toISOString(),
        }),
      )

      router.push("/admin")
    } catch (error) {
      console.error('Error en login:', error)
      alert('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema Restaurante</h1>
          <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Iniciar Sesión
            </CardTitle>
            <CardDescription>Selecciona tu tipo de usuario e ingresa tus credenciales</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mesero" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mesero" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Mesero
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mesero" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mesero-name">Nombre del Mesero</Label>
                  <Input
                    id="mesero-name"
                    type="text"
                    placeholder="Ingresa tu nombre completo"
                    value={meseroName}
                    onChange={(e) => setMeseroName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleMeseroLogin()}
                  />
                  <p className="text-xs text-gray-500">Debe ser un mesero registrado y activo en el sistema</p>
                </div>
                <Button onClick={handleMeseroLogin} className="w-full" disabled={loading}>
                  {loading ? "Verificando..." : "Ingresar como Mesero"}
                </Button>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Contraseña de Administrador</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Ingresa la contraseña"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                  />
                  <p className="text-xs text-gray-500">
                    Contraseña por defecto: <code className="bg-gray-100 px-1 rounded">admin123</code>
                  </p>
                </div>
                <Button onClick={handleAdminLogin} className="w-full" disabled={loading}>
                  {loading ? "Verificando..." : "Ingresar como Admin"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>¿Problemas para acceder? Contacta al administrador</p>
        </div>
      </div>
    </div>
  )
}
