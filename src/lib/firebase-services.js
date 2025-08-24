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
      return cached
    }

    const result = await queryFn()
    cache.set(key, result, ttl)
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
  },


  /**
   * Crear cita con soporte para múltiples tratamientos
   */
  async create(data) {
    try {
      // Calcular duración total si hay múltiples tratamientos
      const totalDuration = data.treatments 
        ? data.treatments.reduce((sum, treatment) => sum + treatment.duration, 0)
        : data.duration

      // Calcular precio total si hay múltiples tratamientos
      const totalPrice = data.treatments
        ? data.treatments.reduce((sum, treatment) => sum + (treatment.price || 0), 0)
        : (data.totalPrice || data.price || 0)

      // Validar conflictos antes de crear
      const validation = await this.validateAppointmentTime(
        data.professionalId,
        data.date,
        data.startTime,
        totalDuration
      )

      if (!validation.isValid) {
        throw new Error('Conflicto de horario detectado')
      }

      // Preparar datos para guardar
      const appointmentData = {
        ...data,
        duration: totalDuration,
        totalPrice: totalPrice,
        status: data.status || 'Programado',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Mantener compatibilidad con formato legacy
      if (data.treatments && data.treatments.length > 0) {
        appointmentData.treatmentId = data.treatments[0].id // Primer tratamiento para compatibilidad
        appointmentData.price = totalPrice
      }

      const docRef = await addDoc(collection(db, 'appointments'), appointmentData)
      
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
   * Actualizar cita con soporte para múltiples tratamientos
   */
  async update(id, data) {
    try {
      // Calcular duración total si se actualizan tratamientos
      if (data.treatments) {
        data.duration = data.treatments.reduce((sum, treatment) => sum + treatment.duration, 0)
        data.totalPrice = data.treatments.reduce((sum, treatment) => sum + (treatment.price || 0), 0)
        
        // Mantener compatibilidad legacy
        data.treatmentId = data.treatments[0]?.id
        data.price = data.totalPrice
      }

      // Si se cambia fecha/hora/duración, validar conflictos
      if (data.date || data.startTime || data.duration || data.treatments) {
        // Obtener datos actuales de la cita para validación
        const currentAppointment = await this.getById(id)
        
        const validation = await this.validateAppointmentTime(
          data.professionalId || currentAppointment.professionalId,
          data.date || currentAppointment.date,
          data.startTime || currentAppointment.startTime,
          data.duration || currentAppointment.duration,
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
   * Validar conflictos de horario con duración dinámica
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
          // Usar duración de múltiples tratamientos si existe
          const existingDuration = apt.duration || 60
          const existingEnd = existingStart + existingDuration
          
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


  
}

// src/lib/firebase-services.js
// EXTENSIONES PARA TU ARCHIVO EXISTENTE - AGREGAR AL FINAL

/**
 * SERVICIO PARA VALORACIONES/REVIEWS - NUEVO
 */
// Reemplazar o extender el reviewService en tu firebase-services.js

export const reviewService = {
  /**
   * Crear nueva valoración
   */
  async create(reviewData) {
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        status: reviewData.status || 'approved', // Por defecto aprobado
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Invalidar caché del profesional
      optimizationUtils.invalidateCache([
        `professional:${reviewData.professionalId}`,
        `reviews:professional:${reviewData.professionalId}`
      ])
      
      return docRef.id
    } catch (error) {
      console.error('Error creating review:', error)
      throw error
    }
  },

  /**
   * Obtener valoraciones por profesional (método original)
   */
  async getByProfessionalId(professionalId, status = 'approved', useCache = true) {
    const cacheKey = `reviews:professional:${professionalId}:${status}`
    
    if (!useCache) {
      cache.delete(cacheKey)
    }

    return optimizationUtils.withCache(
      cacheKey,
      async () => {
        try {
          let q = query(
            collection(db, 'reviews'),
            where('professionalId', '==', professionalId),
            orderBy('createdAt', 'desc')
          )

          if (status !== 'all') {
            q = query(
              collection(db, 'reviews'),
              where('professionalId', '==', professionalId),
              where('status', '==', status),
              orderBy('createdAt', 'desc')
            )
          }

          const querySnapshot = await getDocs(q)
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        } catch (error) {
          console.error('Error getting reviews by professional:', error)
          throw error
        }
      },
      5 * 60 * 1000 // 5 minutos TTL
    )
  },

  /**
   * Método alias para compatibilidad - el que tu componente necesita
   */
  async getByProfessional(professionalId, filters = {}) {
    try {
      const status = filters.status || 'approved'
      return await this.getByProfessionalId(professionalId, status)
    } catch (error) {
      console.error('Error getting reviews by professional:', error)
      throw error
    }
  },

  /**
   * Obtener valoraciones de un cliente
   */
  async getByClientId(clientId) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'reviews'),
          where('clientId', '==', clientId),
          orderBy('createdAt', 'desc')
        )
      )
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error getting reviews by client:', error)
      throw error
    }
  },

  /**
   * Obtener review por ID
   */
  async getById(reviewId, useCache = true) {
    const cacheKey = `review:${reviewId}`
    
    if (!useCache) {
      cache.delete(cacheKey)
    }

    return optimizationUtils.withCache(
      cacheKey,
      async () => {
        try {
          const docRef = doc(db, 'reviews', reviewId)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() }
          }
          return null
        } catch (error) {
          console.error('Error getting review:', error)
          throw error
        }
      },
      10 * 60 * 1000
    )
  },

  /**
   * Actualizar valoración
   */
  async update(reviewId, updates) {
    try {
      const docRef = doc(db, 'reviews', reviewId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
      
      // Obtener el review para invalidar caché del profesional
      const review = await this.getById(reviewId, false)
      if (review) {
        optimizationUtils.invalidateCache([
          `professional:${review.professionalId}`,
          `reviews:professional:${review.professionalId}`
        ])
      }
    } catch (error) {
      console.error('Error updating review:', error)
      throw error
    }
  },

  /**
   * Eliminar valoración
   */
  async delete(reviewId) {
    try {
      const docRef = doc(db, 'reviews', reviewId)
      await deleteDoc(docRef)
      
      optimizationUtils.invalidateCache(['reviews:'])
    } catch (error) {
      console.error('Error deleting review:', error)
      throw error
    }
  },

  /**
   * Calcular rating promedio
   */
  calculateAverageRating(reviews) {
    const activeReviews = reviews.filter(r => r.status === 'approved')
    if (activeReviews.length === 0) return 0
    
    const sum = activeReviews.reduce((acc, review) => acc + review.rating, 0)
    return Math.round((sum / activeReviews.length) * 10) / 10
  }
}
/**
 * EXTENSIÓN DEL PROFESSIONAL SERVICE - AGREGAR ESTOS MÉTODOS
 */

// Agregar estos métodos al objeto professionalService existente:

professionalService.getWithReviews = async function(professionalId, useCache = true) {
  const cacheKey = `professional:withReviews:${professionalId}`
  
  if (!useCache) {
    cache.delete(cacheKey)
  }

  return optimizationUtils.withCache(
    cacheKey,
    async () => {
      try {
        // Obtener profesional
        const professional = await this.getById(professionalId, useCache)
        if (!professional) return null

        // Obtener valoraciones
        const reviews = await reviewService.getByProfessionalId(professionalId, 'active', useCache)
        
        return {
          ...professional,
          reviews,
          averageRating: reviewService.calculateAverageRating(reviews),
          totalReviews: reviews.length
        }
      } catch (error) {
        console.error('Error getting professional with reviews:', error)
        throw error
      }
    },
    8 * 60 * 1000 // 8 minutos TTL
  )
}

professionalService.getAllWithReviews = async function(useCache = true) {
  const cacheKey = 'professionals:allWithReviews'
  
  if (!useCache) {
    cache.delete(cacheKey)
  }

  return optimizationUtils.withCache(
    cacheKey,
    async () => {
      try {
        const professionals = await this.getAll(useCache)
        const professionalsWithReviews = []
        
        for (const professional of professionals) {
          const reviews = await reviewService.getByProfessionalId(professional.id, 'active', useCache)
          
          professionalsWithReviews.push({
            ...professional,
            reviews,
            averageRating: reviewService.calculateAverageRating(reviews),
            totalReviews: reviews.length
          })
        }
        
        return professionalsWithReviews
      } catch (error) {
        console.error('Error getting all professionals with reviews:', error)
        throw error
      }
    },
    12 * 60 * 1000 // 12 minutos TTL
  )
}

// Buscar profesionales por tratamiento y disponibilidad
professionalService.searchByTreatmentAndDate = async function(treatmentId, date) {
  try {
    const professionals = await this.getAllWithReviews()
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
    
    return professionals.filter(professional => {
      // Verificar si está disponible
      if (!professional.available) return false
      
      // Verificar si el tratamiento está en su lista
      const hasTreatment = professional.availableTreatments?.some(
        treatment => treatment.treatmentId === treatmentId
      )
      if (!hasTreatment) return false
      
      // Verificar horarios para la fecha (lógica simplificada)
      const dayOfWeek = this.getDayOfWeek(new Date(dateStr))
      const hasSchedule = professional.baseSchedule?.[dayOfWeek]?.active
      
      // Verificar excepciones
      const hasException = professional.scheduleExceptions?.find(exc => exc.date === dateStr)
      if (hasException) {
        return hasException.type !== 'unavailable' &&
               (!hasException.availableTreatmentsOverride?.length || 
                hasException.availableTreatmentsOverride.includes(treatmentId))
      }
      
      return hasSchedule
    })
  } catch (error) {
    console.error('Error searching professionals by treatment and date:', error)
    throw error
  }
}

// Utilidad para obtener día de la semana
professionalService.getDayOfWeek = function(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date(date).getDay()]
}

// Obtener horarios efectivos para una fecha
professionalService.getEffectiveSchedule = function(professional, date) {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const dayOfWeek = this.getDayOfWeek(new Date(dateStr))
  
  // Buscar excepción para esta fecha
  const exception = professional.scheduleExceptions?.find(exc => exc.date === dateStr)
  
  if (exception) {
    if (exception.type === 'unavailable') {
      return { available: false, reason: exception.reason }
    }
    return { 
      available: true, 
      blocks: exception.blocks || [], 
      reason: exception.reason,
      isException: true
    }
  }
  
  // Usar horario base
  const baseSchedule = professional.baseSchedule?.[dayOfWeek]
  return { 
    available: baseSchedule?.active || false,
    blocks: baseSchedule?.blocks || [],
    isException: false
  }
}

// Obtener tratamientos disponibles para una fecha
professionalService.getAvailableTreatmentsForDate = function(professional, date) {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const exception = professional.scheduleExceptions?.find(exc => exc.date === dateStr)
  
  // Si hay restricción específica para esta fecha
  if (exception?.availableTreatmentsOverride?.length > 0) {
    return exception.availableTreatmentsOverride
  }
  
  // Retornar todos los tratamientos del profesional
  return professional.availableTreatments?.map(t => t.treatmentId) || []
}

// Calcular slots de tiempo disponibles
professionalService.getAvailableTimeSlots = function(professional, date, treatmentDuration = 60) {
  const schedule = this.getEffectiveSchedule(professional, date)
  if (!schedule.available) return []
  
  const workBlocks = schedule.blocks.filter(block => block.type === 'work')
  const slots = []
  
  workBlocks.forEach(block => {
    const blockSlots = this.generateSlotsForBlock(block, treatmentDuration)
    slots.push(...blockSlots)
  })
  
  return slots
}

// Generar slots para un bloque específico
professionalService.generateSlotsForBlock = function(block, duration) {
  const slots = []
  const startMinutes = timeToMinutes(block.start)
  const endMinutes = timeToMinutes(block.end)
  
  // Generar slots cada 15 minutos
  for (let time = startMinutes; time + duration <= endMinutes; time += 15) {
    slots.push(this.minutesToTime(time))
  }
  
  return slots
}

// Utilidad para convertir tiempo a minutos
professionalService.minutesToTime = function(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * SERVICIO PARA VALIDACIÓN DE FOTOS - NUEVO
 */
export const photoService = {
  /**
   * Validar foto antes de guardar
   */
  validatePhoto(photoData) {
    const maxSize = 200 * 1024 // 200KB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    if (photoData.size > maxSize) {
      throw new Error('La imagen debe ser menor a 200KB')
    }
    
    if (!allowedTypes.includes(photoData.mimeType)) {
      throw new Error('Solo se permiten archivos JPG, PNG o WebP')
    }
    
    return true
  },

  /**
   * Comprimir imagen base64
   */
  async compressBase64Image(base64, maxWidth = 400, quality = 0.8) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calcular nuevas dimensiones
        const aspectRatio = img.width / img.height
        let newWidth = maxWidth
        let newHeight = maxWidth / aspectRatio
        
        if (newHeight > maxWidth) {
          newHeight = maxWidth
          newWidth = maxWidth * aspectRatio
        }
        
        canvas.width = newWidth
        canvas.height = newHeight
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      
      img.src = base64
    })
  },

  /**
   * Obtener tamaño de imagen base64
   */
  getBase64Size(base64String) {
    const base64 = base64String.split(',')[1] || base64String
    const sizeInBytes = (base64.length * 3) / 4
    const padding = (base64.match(/=/g) || []).length
    return sizeInBytes - padding
  }
}

/**
 * SERVICIO PARA GESTIÓN DE HORARIOS - NUEVO
 */
export const scheduleService = {
  /**
   * Validar horarios
   */
  validateSchedule(schedule) {
    const errors = []
    
    Object.entries(schedule).forEach(([day, daySchedule]) => {
      if (!daySchedule.active) return
      
      if (!daySchedule.blocks || daySchedule.blocks.length === 0) {
        errors.push(`${day}: Debe tener al menos un bloque de tiempo`)
        return
      }
      
      // Validar solapamientos
      const workBlocks = daySchedule.blocks
        .filter(block => block.type === 'work')
        .sort((a, b) => a.start.localeCompare(b.start))
      
      for (let i = 0; i < workBlocks.length - 1; i++) {
        const current = workBlocks[i]
        const next = workBlocks[i + 1]
        
        if (current.end > next.start) {
          errors.push(`${day}: Los bloques de trabajo se solapan`)
        }
      }
      
      // Validar horas válidas
      daySchedule.blocks.forEach(block => {
        if (block.start >= block.end) {
          errors.push(`${day}: La hora de inicio debe ser menor que la de fin`)
        }
      })
    })
    
    return errors
  },

  /**
   * Obtener resumen de horarios
   */
  getScheduleSummary(schedule) {
    const activeDays = Object.entries(schedule)
      .filter(([_, daySchedule]) => daySchedule.active)
      .length
    
    const totalWorkHours = Object.entries(schedule)
      .filter(([_, daySchedule]) => daySchedule.active)
      .reduce((total, [_, daySchedule]) => {
        const workMinutes = daySchedule.blocks
          .filter(block => block.type === 'work')
          .reduce((dayTotal, block) => {
            const start = timeToMinutes(block.start)
            const end = timeToMinutes(block.end)
            return dayTotal + (end - start)
          }, 0)
        
        return total + workMinutes
      }, 0)
    
    return {
      activeDays,
      totalWorkHours: Math.round(totalWorkHours / 60 * 10) / 10,
      averageHoursPerDay: activeDays > 0 ? Math.round((totalWorkHours / 60) / activeDays * 10) / 10 : 0
    }
  }
}

