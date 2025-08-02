// Utility functions para manejar cookies sin dependencias externas

export interface UserData {
  id: string
  name: string
  role: string
}

export interface AuthSession {
  token: string
  user: UserData
}

// Función para establecer una cookie
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure=${window.location.protocol === 'https:'}`
}

// Función para obtener una cookie
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) {
      let value = c.substring(nameEQ.length, c.length)
      
      // Limpiar valor de caracteres problemáticos
      value = value.trim()
      
      // Intentar decodificar URL-encoding múltiples veces si es necesario
      try {
        let decodedValue = value
        let prevValue = ''
        
        // Decodificar hasta que no cambie más (para casos de doble encoding)
        while (decodedValue !== prevValue) {
          prevValue = decodedValue
          try {
            decodedValue = decodeURIComponent(decodedValue)
          } catch {
            break
          }
        }
        
        return decodedValue
      } catch (error) {
        console.warn('Error decoding cookie value:', error, 'Raw value:', value)
        return value // Si falla la decodificación, devolver el valor original
      }
    }
  }
  return null
}

// Función para eliminar una cookie
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

// Función para guardar la sesión de autenticación
export function setAuthSession(session: AuthSession) {
  setCookie('auth-token', session.token, 7) // 7 días
  setCookie('user-data', JSON.stringify(session.user), 7)
}

// Función para obtener la sesión de autenticación
export function getAuthSession(): AuthSession | null {
  const token = getCookie('auth-token')
  const userData = getCookie('user-data')
  
  if (!token || !userData) return null
  
  try {
    // Verificar que userData no esté vacío o corrupto
    if (userData.trim() === '' || userData === 'undefined' || userData === 'null') {
      console.warn('Empty or invalid user data in cookie')
      return null
    }
    
    // Limpiar userData de posibles caracteres problemáticos
    let cleanUserData = userData.trim()
    
    // Remover comillas dobles al inicio y final si existen
    if (cleanUserData.startsWith('"') && cleanUserData.endsWith('"')) {
      cleanUserData = cleanUserData.slice(1, -1)
    }
    
    // Verificar que comience con { y termine con }
    if (!cleanUserData.startsWith('{') || !cleanUserData.endsWith('}')) {
      console.warn('User data does not appear to be JSON:', cleanUserData)
      return null
    }
    
    const user = JSON.parse(cleanUserData)
    
    // Validar que el usuario tiene las propiedades necesarias
    if (!user || !user.id || !user.name || !user.role) {
      console.warn('Invalid user object structure:', user)
      return null
    }
    
    return { token, user }
  } catch (error) {
    console.error('Error parsing user data from cookie:', error)
    console.error('Raw userData:', userData)
    console.error('Token exists:', !!token)
    // Limpiar cookies corruptas
    clearAuthSession()
    return null
  }
}

// Función para limpiar la sesión
export function clearAuthSession() {
  deleteCookie('auth-token')
  deleteCookie('user-data')
}

// Función para verificar si el usuario está autenticado
export function isAuthenticated(): boolean {
  return getAuthSession() !== null
}

// Función para obtener el rol del usuario
export function getUserRole(): string | null {
  const session = getAuthSession()
  return session?.user.role || null
}
