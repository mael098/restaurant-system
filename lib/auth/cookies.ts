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
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
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
    // Decodificar URL antes de parsear JSON
    const decodedUserData = decodeURIComponent(userData)
    const user = JSON.parse(decodedUserData)
    return { token, user }
  } catch (error) {
    console.error('Error parsing user data:', error)
    console.error('Raw userData:', userData)
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
