import { create } from 'zustand'

/**
 * Store de autenticación usando Zustand
 * Maneja el estado del usuario autenticado y su perfil
 */
export const useAuthStore = create((set, get) => ({
  // Estado
  user: null,              // Usuario de Firebase Auth
  userProfile: null,       // Perfil del usuario desde Firestore
  loading: true,          // Estado de carga inicial
  
  // Acciones
  setUser: (user) => set({ user }),
  
  setUserProfile: (userProfile) => set({ userProfile }),
  
  setLoading: (loading) => set({ loading }),
  
  // Función de logout
  signOut: async () => {
    try {
      const { signOut } = await import('firebase/auth')
      const { auth } = await import('../lib/firebase')
      
      await signOut(auth)
      set({ user: null, userProfile: null })
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  },
  
  // Función para obtener datos del usuario actual
  getCurrentUser: () => {
    const { user, userProfile } = get()
    return { user, userProfile }
  },
  
  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    const { user } = get()
    return !!user
  },
  
  // Verificar rol del usuario
  hasRole: (role) => {
    const { userProfile } = get()
    return userProfile?.role === role
  }
}))