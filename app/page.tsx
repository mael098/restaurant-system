"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Users, ChefHat, Lock, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { setAuthSession } from "@/lib/auth/cookies"

export default function LoginPage() {
  const [meseroName, setMeseroName] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Credenciales de admin (en producción esto debería estar en una base de datos)
  const ADMIN_PASSWORD = "admin123"

  // Memoizar elementos decorativos para evitar re-renders innecesarios
  const decorativeBlobs = useMemo(() => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: 'strict' }}>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ willChange: 'transform' }}></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" style={{ willChange: 'transform' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" style={{ willChange: 'transform' }}></div>
    </div>
  ), [])

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

      // Las cookies ya se establecen en el servidor
      // Redirigir directamente a la ruta del mesero
      window.location.href = "/mesero"
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

      // Las cookies ya se establecen en el servidor
      // Redirigir directamente a la ruta del admin
      window.location.href = "/admin"
    } catch (error) {
      console.error('Error en login:', error)
      alert('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-red-50 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Decorative elements - Memoized */}
      {decorativeBlobs}

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-4 sm:mb-8">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300" style={{ contain: 'layout' }}>
            <ChefHat className="h-8 w-8 sm:h-10 sm:w-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Sistema Restaurante
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Gestión profesional de pedidos</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-orange-100">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Lock className="h-5 w-5 text-white" />
              </div>
              Iniciar Sesión
            </CardTitle>
            <CardDescription>Selecciona tu rol e ingresa tus credenciales</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mesero" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
                <TabsTrigger 
                  value="mesero" 
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  Mesero
                </TabsTrigger>
                <TabsTrigger 
                  value="admin" 
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all"
                >
                  <ChefHat className="h-3 w-3 sm:h-4 sm:w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mesero" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mesero-name" className="text-sm font-medium">Nombre del Mesero</Label>
                  <Input
                    id="mesero-name"
                    type="text"
                    placeholder="Ingresa tu nombre completo"
                    value={meseroName}
                    onChange={(e) => setMeseroName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleMeseroLogin()}
                    className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1" style={{ minHeight: '1.25rem' }}>
                    <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full" aria-hidden="true"></span>
                    Debe ser un mesero registrado y activo
                  </p>
                </div>
                <Button 
                  onClick={handleMeseroLogin} 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Ingresar como Mesero
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm font-medium">Contraseña de Administrador</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Ingresa la contraseña"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                    className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                  {/* <p className="text-xs text-gray-500 bg-orange-50 px-2 py-1 rounded" style={{ minHeight: '2rem' }}>
                    💡 Contraseña por defecto: <code className="bg-white px-2 py-0.5 rounded font-mono text-orange-600">admin123</code>
                  </p> */}
                </div>
                <Button
                  onClick={handleAdminLogin}
                  className="w-full bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Ingresar como Admin
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600 backdrop-blur-sm bg-white/50 rounded-lg p-3">
          <p className="flex items-center justify-center gap-2">
            {/* <span className="text-orange-500">🔒</span> */}
            ¿Problemas para acceder? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  )
}
