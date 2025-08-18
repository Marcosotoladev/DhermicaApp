// src/lib/firebase-services.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Cache en memoria para optimizar consultas frecuentes
 */
class FirebaseCache {
  constructor() {
    this.cache = new Map()
    this.cacheTTL = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5 minutos
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value)
    this.cacheTTL.set(key, Date.now() + ttl)
  }

  get(key) {
    const expiry = this.cacheTTL.get(key)
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key)
      this.cacheTTL.delete(key)
      return null
    }
    return this.cache.get(key)
  }

  clear() {
    this.cache.clear()
    this.cacheTTL.clear()
  }

  delete(key) {
    this.cache.delete(key)
    this.cacheTTL.delete(key)
  }
}

const cache = new FirebaseCache()

/**
 * Utilidades para optimización
 */
const optimizationUtils = {
  /**
   * Ejecutar consulta con caché
   */
  async withCache(key, queryFn, ttl) {
    const cached = cache.get(key)
    if (cached) {
      console.log(`Cache hit: ${key}`)
      return cached
    }

    const result = await queryFn()
    cache.set(key, result, ttl)
    console.log(`Cache miss: ${key}`)
    return result
  },

  /**
   * Invalidar caché relacionado
   */
  invalidateCache(patterns) {
    const keys = Array.from(cache.cache.keys())
    patterns.forEach(pattern => {
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.delete(key)
        }
      })
    })
  },

  /**
   * Retry con backoff exponencial
   */
  async withRetry(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        if (attempt === maxRetries) throw error
        
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
}

/**
 * Función utilitaria para conversión de tiempo
 */
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * SERVICIOS PARA TRATAMIENTOS - OPTIMIZADOS
 */
export const treatmentService = {
  /**
   * Obtener todos los tratamientos con caché
   */
  async getAll(useCache = true) {
    const cacheKey = 'treatments:all'
    
    if (!useCache) {
      cache.delete(cacheKey)
    }

    return optimizationUtils.withCache(
      cacheKey,
      async () => {
        try {
          const querySnapshot = await getDocs(
            query(
              collection(db, 'treatments'),
              where('active', '==', true),
              orderBy('name')
            )
          )
          
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        } catch (error) {
          console.error('Error getting treatments:', error)
          throw error
        }
      },
      10 * 60 * 1000 // 10 minutos TTL
    )
  },

  /**
   * Obtener tratamiento por ID con caché
   */
  async getById(id, useCache = true) {
    const cacheKey = `treatment:${id}`
    
    if (!useCache) {
      cache.delete(cacheKey)
    }

    return optimizationUtils.withCache(
      cacheKey,
      async () => {
        try {
          const docRef = doc(db, 'treatments', id)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() }
          } else {
            return null
          }
        } catch (error) {
          console.error('Error getting treatment:', error)
          throw error
        }
      },
      15 * 60 * 1000 // 15 minutos TTL
    )
  },

  /**
   * Crear tratamiento con invalidación de caché
   */
  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'treatments'), {
        ...data,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché
      optimizationUtils.invalidateCache(['treatments:'])
      
      return docRef.id
    } catch (error) {
      console.error('Error creating treatment:', error)
      throw error
    }
  },

  /**
   * Actualizar tratamiento con invalidación de caché
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'treatments', id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché específico y general
      optimizationUtils.invalidateCache(['treatments:', `treatment:${id}`])
    } catch (error) {
      console.error('Error updating treatment:', error)
      throw error
    }
  },

  /**
   * Eliminar tratamiento con invalidación de caché
   */
  async delete(id) {
    try {
      const docRef = doc(db, 'treatments', id)
      await updateDoc(docRef, {
        active: false,
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché
      optimizationUtils.invalidateCache(['treatments:', `treatment:${id}`])
    } catch (error) {
      console.error('Error deleting treatment:', error)
      throw error
    }
  }
}

/**
 * SERVICIOS PARA PROFESIONALES - OPTIMIZADOS
 */
export const professionalService = {
  /**
   * Obtener todos los profesionales con caché
   */
  async getAll(useCache = true) {
    const cacheKey = 'professionals:all'
    
    if (!useCache) {
      cache.delete(cacheKey)
    }

    return optimizationUtils.withCache(
      cacheKey,
      async () => {
        try {
          const querySnapshot = await getDocs(
            query(
              collection(db, 'professionals'),
              where('available', '==', true),
              orderBy('name')
            )
          )
          
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        } catch (error) {
          console.error('Error getting professionals:', error)
          throw error
        }
      },
      10 * 60 * 1000 // 10 minutos TTL
    )
  },

  /**
   * Obtener profesional por ID con caché
   */
  async getById(id, useCache = true) {
    const cacheKey = `professional:${id}`
    
    if (!useCache) {
      cache.delete(cacheKey)
    }

    return optimizationUtils.withCache(
      cacheKey,
      async () => {
        try {
          const docRef = doc(db, 'professionals', id)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() }
          } else {
            return null
          }
        } catch (error) {
          console.error('Error getting professional:', error)
          throw error
        }
      },
      15 * 60 * 1000 // 15 minutos TTL
    )
  },

  /**
   * Crear profesional con invalidación de caché
   */
  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'professionals'), {
        ...data,
        available: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché
      optimizationUtils.invalidateCache(['professionals:'])
      
      return docRef.id
    } catch (error) {
      console.error('Error creating professional:', error)
      throw error
    }
  },

  /**
   * Actualizar profesional con invalidación de caché
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'professionals', id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché
      optimizationUtils.invalidateCache(['professionals:', `professional:${id}`])
    } catch (error) {
      console.error('Error updating professional:', error)
      throw error
    }
  },


  /**
 * Eliminar profesional con invalidación de caché
 */
async delete(id) {
  try {
    const docRef = doc(db, 'professionals', id)
    await updateDoc(docRef, {
      available: false,
      updatedAt: serverTimestamp()
    })
    
    // Invalidar caché
    optimizationUtils.invalidateCache(['professionals:', `professional:${id}`])
  } catch (error) {
    console.error('Error deleting professional:', error)
    throw error
  }
}
}

/**
 * SERVICIOS PARA CLIENTES - OPTIMIZADOS
 */
export const clientService = {
  /**
   * Búsqueda de clientes con debounce y caché
   */
  async search(searchTerm, useCache = true) {
    // No cachear búsquedas vacías o muy cortas
    if (!searchTerm || searchTerm.length < 2) {
      return []
    }

    const cacheKey = `clients:search:${searchTerm.toLowerCase()}`
    
    if (!useCache) {
      cache.delete(cacheKey)
    }

    return optimizationUtils.withCache(
      cacheKey,
      async () => {
        try {
          // Obtener todos los clientes (con límite)
          const querySnapshot = await getDocs(
            query(
              collection(db, 'clients'),
              orderBy('name'),
              limit(100) // Limitar para performance
            )
          )
          
          const clients = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          
          // Filtrar en el cliente para mejor performance
          const searchLower = searchTerm.toLowerCase()
          return clients.filter(client =>
            client.name.toLowerCase().includes(searchLower) ||
            client.phone.includes(searchTerm) ||
            client.email.toLowerCase().includes(searchLower)
          )
        } catch (error) {
          console.error('Error searching clients:', error)
          throw error
        }
      },
      2 * 60 * 1000 // 2 minutos TTL para búsquedas
    )
  },

  /**
   * Obtener cliente por ID con caché
   */
  async getById(id, useCache = true) {
    const cacheKey = `client:${id}`
    
    if (!useCache) {
      cache.delete(cacheKey)
    }

    return optimizationUtils.withCache(
      cacheKey,
      async () => {
        try {
          const docRef = doc(db, 'clients', id)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() }
          } else {
            return null
          }
        } catch (error) {
          console.error('Error getting client:', error)
          throw error
        }
      },
      10 * 60 * 1000 // 10 minutos TTL
    )
  },

  /**
   * Crear cliente con invalidación de caché
   */
  async create(data) {
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché de búsquedas
      optimizationUtils.invalidateCache(['clients:search'])
      
      return docRef.id
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  },

  /**
   * Actualizar cliente con invalidación de caché
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'clients', id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché
      optimizationUtils.invalidateCache(['clients:', `client:${id}`])
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  },


  // AÑADE ESTE MÉTODO AL clientService en firebase-services.js
// Agregar después del método search() existente:

/**
 * Obtener todos los clientes con caché
 */
async getAll(useCache = true) {
  const cacheKey = 'clients:all'
  
  if (!useCache) {
    cache.delete(cacheKey)
  }

  return optimizationUtils.withCache(
    cacheKey,
    async () => {
      try {
        const querySnapshot = await getDocs(
          query(
            collection(db, 'clients'),
            orderBy('name'),
            limit(200) // Limitar para performance
          )
        )
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Error getting all clients:', error)
        throw error
      }
    },
    10 * 60 * 1000 // 10 minutos TTL
  )
},


/**
 * Búsqueda de clientes con debounce y caché
 */
async search(searchTerm, useCache = true) {
  // Si no hay término de búsqueda, obtener todos los clientes
  if (!searchTerm || searchTerm.trim() === '') {
    return this.getAll(useCache)
  }

  // No cachear búsquedas muy cortas
  if (searchTerm.length < 2) {
    return []
  }

  const cacheKey = `clients:search:${searchTerm.toLowerCase()}`
  
  if (!useCache) {
    cache.delete(cacheKey)
  }

  return optimizationUtils.withCache(
    cacheKey,
    async () => {
      try {
        // Obtener todos los clientes (con límite)
        const querySnapshot = await getDocs(
          query(
            collection(db, 'clients'),
            orderBy('name'),
            limit(200) // Limitar para performance
          )
        )
        
        const clients = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Filtrar en el cliente para mejor performance
        const searchLower = searchTerm.toLowerCase()
        return clients.filter(client =>
          client.name?.toLowerCase().includes(searchLower) ||
          client.phone?.includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchLower)
        )
      } catch (error) {
        console.error('Error searching clients:', error)
        throw error
      }
    },
    2 * 60 * 1000 // 2 minutos TTL para búsquedas
  )
},
}

/**
 * SERVICIOS PARA CITAS - OPTIMIZADOS
 */
export const appointmentService = {
  /**
   * Obtener citas por fecha con caché inteligente
   */
  async getByDate(date, useCache = true) {
    const dateStr = date.toISOString().split('T')[0]
    const cacheKey = `appointments:date:${dateStr}`
    
    // Solo cachear fechas futuras y el día actual
    const today = new Date().toISOString().split('T')[0]
    const shouldCache = dateStr >= today && useCache
    
    if (!shouldCache) {
      cache.delete(cacheKey)
    }

    const queryFn = async () => {
      try {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const querySnapshot = await getDocs(
          query(
            collection(db, 'appointments'),
            where('date', '>=', Timestamp.fromDate(startOfDay)),
            where('date', '<=', Timestamp.fromDate(endOfDay)),
            orderBy('date'),
            orderBy('startTime')
          )
        )
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Error getting appointments by date:', error)
        throw error
      }
    }

    if (shouldCache) {
      return optimizationUtils.withCache(
        cacheKey,
        queryFn,
        5 * 60 * 1000 // 5 minutos TTL
      )
    }

    return queryFn()
  },

  /**
   * Obtener citas por profesional y fecha con caché
   */
  async getByProfessionalAndDate(professionalId, date, useCache = true) {
    const dateStr = date.toISOString().split('T')[0]
    const cacheKey = `appointments:professional:${professionalId}:date:${dateStr}`
    
    const today = new Date().toISOString().split('T')[0]
    const shouldCache = dateStr >= today && useCache
    
    if (!shouldCache) {
      cache.delete(cacheKey)
    }

    const queryFn = async () => {
      try {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const querySnapshot = await getDocs(
          query(
            collection(db, 'appointments'),
            where('professionalId', '==', professionalId),
            where('date', '>=', Timestamp.fromDate(startOfDay)),
            where('date', '<=', Timestamp.fromDate(endOfDay)),
            orderBy('date'),
            orderBy('startTime')
          )
        )
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Error getting appointments by professional and date:', error)
        throw error
      }
    }

    if (shouldCache) {
      return optimizationUtils.withCache(
        cacheKey,
        queryFn,
        3 * 60 * 1000 // 3 minutos TTL
      )
    }

    return queryFn()
  },

  /**
   * Obtener citas de un cliente con paginación
   */
  async getByClient(clientId, lastDoc = null, limitCount = 20) {
    try {
      let q = query(
        collection(db, 'appointments'),
        where('clientId', '==', clientId),
        orderBy('date', 'desc'),
        limit(limitCount)
      )

      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(q)
      
      return {
        appointments: querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === limitCount
      }
    } catch (error) {
      console.error('Error getting appointments by client:', error)
      throw error
    }
  },

  /**
   * Validar conflictos de horario optimizado
   */
  async validateAppointmentTime(professionalId, date, startTime, duration, excludeId = null) {
    try {
      // Usar servicio optimizado para obtener citas
      const appointments = await this.getByProfessionalAndDate(professionalId, date)
      
      const newStartMinutes = timeToMinutes(startTime)
      const newEndMinutes = newStartMinutes + duration
      
      const conflicts = appointments
        .filter(apt => apt.id !== excludeId)
        .filter(apt => {
          const existingStart = timeToMinutes(apt.startTime)
          const existingEnd = existingStart + apt.duration
          
          // Verificar solapamiento
          return !(newEndMinutes <= existingStart || newStartMinutes >= existingEnd)
        })
      
      return {
        isValid: conflicts.length === 0,
        conflicts
      }
    } catch (error) {
      console.error('Error validating appointment time:', error)
      throw error
    }
  },

  /**
   * Crear cita con validación automática e invalidación de caché
   */
  async create(data) {
    try {
      // Validar conflictos antes de crear
      const validation = await this.validateAppointmentTime(
        data.professionalId,
        data.date,
        data.startTime,
        data.duration
      )

      if (!validation.isValid) {
        throw new Error('Conflicto de horario detectado')
      }

      const docRef = await addDoc(collection(db, 'appointments'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché relacionado
      const dateStr = data.date.toISOString().split('T')[0]
      optimizationUtils.invalidateCache([
        `appointments:date:${dateStr}`,
        `appointments:professional:${data.professionalId}`
      ])
      
      return docRef.id
    } catch (error) {
      console.error('Error creating appointment:', error)
      throw error
    }
  },

  /**
   * Actualizar cita con validación e invalidación de caché
   */
  async update(id, data) {
    try {
      // Si se cambia fecha/hora, validar conflictos
      if (data.date || data.startTime || data.duration) {
        const validation = await this.validateAppointmentTime(
          data.professionalId,
          data.date,
          data.startTime,
          data.duration,
          id
        )

        if (!validation.isValid) {
          throw new Error('Conflicto de horario detectado')
        }
      }

      const docRef = doc(db, 'appointments', id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché relacionado
      if (data.date) {
        const dateStr = data.date.toISOString().split('T')[0]
        optimizationUtils.invalidateCache([
          `appointments:date:${dateStr}`,
          `appointments:professional:`
        ])
      } else {
        optimizationUtils.invalidateCache(['appointments:'])
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      throw error
    }
  },


  /**
 * Obtener cita por ID con caché
 */
async getById(id, useCache = true) {
  const cacheKey = `appointment:${id}`
  
  if (!useCache) {
    cache.delete(cacheKey)
  }

  return optimizationUtils.withCache(
    cacheKey,
    async () => {
      try {
        const docRef = doc(db, 'appointments', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() }
        } else {
          return null
        }
      } catch (error) {
        console.error('Error getting appointment:', error)
        throw error
      }
    },
    10 * 60 * 1000 // 10 minutos TTL
  )
},

  /**
   * Eliminar cita con invalidación de caché
   */
  async delete(id) {
    try {
      const docRef = doc(db, 'appointments', id)
      await deleteDoc(docRef)
      
      // Invalidar todo el caché de citas
      optimizationUtils.invalidateCache(['appointments:'])
    } catch (error) {
      console.error('Error deleting appointment:', error)
      throw error
    }
  }
}