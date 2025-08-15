// src/components/providers/auth-provider.js
'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useAuthStore } from '../../store/auth'

/**
 * AuthProvider - Maneja el estado de autenticación global
 * Escucha cambios en Firebase Auth y actualiza el store
 */
export function AuthProvider({ children }) {
  const { setUser, setUserProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        try {
          // Obtener perfil del usuario desde Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const profileData = userDoc.data()
            setUserProfile({ 
              id: userDoc.id, 
              ...profileData 
            })
          } else {
            console.log('No user profile found in Firestore')
            setUserProfile(null)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [setUser, setUserProfile, setLoading])

  return <>{children}</>
}