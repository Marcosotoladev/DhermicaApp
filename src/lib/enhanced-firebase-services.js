// src/lib/enhanced-firebase-services.js

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Servicio mejorado para profesionales
 * Incluye: fotos, horarios avanzados, excepciones, tratamientos
 */
export const enhancedProfessionalService = {
  
  // Crear profesional con estructura mejorada
  async create(professionalData) {
    try {
      const docRef = await addDoc(collection(db, 'professionals'), {
        ...professionalData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating professional:', error)
      throw error
    }
  },

  // Obtener profesional por ID con datos completos
  async getById(professionalId) {
    try {
      const docSnap = await getDoc(doc(db, 'professionals', professionalId))
      
      if (docSnap.exists()) {
        const professional = { id: docSnap.id, ...docSnap.data() }
        
        // Obtener reviews del profesional
        const reviews = await reviewService.getByProfessionalId(professionalId)
        
        return {
          ...professional,
          reviews: reviews.filter(r => r.status === 'active'),
          averageRating: this.calculateAverageRating(reviews),
          totalReviews: reviews.filter(r => r.status === 'active').length
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting professional:', error)
      throw error
    }
  },

  // Obtener todos los profesionales
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, 'professionals'))
      const professionals = []
      
      for (const docSnap of querySnapshot.docs) {
        const professional = { id: docSnap.id, ...docSnap.data() }
        
        // Obtener reviews para cada profesional
        const reviews = await reviewService.getByProfessionalId(professional.id)
        
        professionals.push({
          ...professional,
          reviews: reviews.filter(r => r.status === 'active'),
          averageRating: this.calculateAverageRating(reviews),
          totalReviews: reviews.filter(r => r.status === 'active').length
        })
      }
      
      return professionals
    } catch (error) {
      console.error('Error getting professionals:', error)
      throw error
    }
  },

  // Actualizar profesional
  async update(professionalId, updates) {
    try {
      const docRef = doc(db, 'professionals', professionalId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating professional:', error)
      throw error
    }
  },

  // Eliminar profesional
  async delete(professionalId) {
    try {
      await deleteDoc(doc(db, 'professionals', professionalId))
    } catch (error) {
      console.error('Error deleting professional:', error)
      throw error
    }
  },

  // Buscar profesionales por tratamiento y fecha
  async searchByTreatmentAndDate(treatmentId, date) {
    try {
      const professionals = await this.getAll()
      
      return professionals.filter(professional => {
        const availableTreatments = this.getAvailableTreatmentsForDate(professional, date)
        const schedule = this.getEffectiveScheduleForDate(professional, date)
        
        return availableTreatments.includes(treatmentId) && 
               schedule.available && 
               professional.available
      })
    } catch (error) {
      console.error('Error searching professionals:', error)
      throw error
    }
  },

  // Obtener horarios efectivos para una fecha
  getEffectiveScheduleForDate(professional, date) {
    const dayOfWeek = this.getDayOfWeek(date)
    const exception = professional.scheduleExceptions?.find(exc => exc.date === date)
    
    if (exception) {
      if (exception.type === 'unavailable') {
        return { available: false, reason: exception.reason }
      }
      return { available: true, blocks: exception.blocks, reason: exception.reason }
    }
    
    return { 
      available: professional.baseSchedule?.[dayOfWeek]?.active || false,
      blocks: professional.baseSchedule?.[dayOfWeek]?.blocks || []
    }
  },

  // Obtener tratamientos disponibles para una fecha
  getAvailableTreatmentsForDate(professional, date) {
    const dayOfWeek = this.getDayOfWeek(date)
    const exception = professional.scheduleExceptions?.find(exc => exc.date === date)
    
    // Si hay override para esta fecha específica
    if (exception?.availableTreatmentsOverride) {
      return exception.availableTreatmentsOverride
    }
    
    // Usar configuración del día de la semana
    const dayConfig = professional.treatmentAvailability?.[dayOfWeek]
    if (!dayConfig) {
      return professional.availableTreatments?.map(t => t.treatmentId) || []
    }
    
    if (dayConfig.availableTreatments.includes('all')) {
      // Todos los tratamientos menos los restringidos
      return professional.availableTreatments
        ?.filter(t => !dayConfig.restrictedTreatments.includes(t.treatmentId))
        .map(t => t.treatmentId) || []
    }
    
    return dayConfig.availableTreatments
  },

  // Calcular slots de tiempo disponibles
  getAvailableTimeSlots(professional, date, treatmentDuration) {
    const schedule = this.getEffectiveScheduleForDate(professional, date)
    if (!schedule.available) return []
    
    const workBlocks = schedule.blocks.filter(block => block.type === 'work')
    const slots = []
    
    workBlocks.forEach(block => {
      const blockSlots = this.generateSlotsForBlock(block, treatmentDuration)
      slots.push(...blockSlots)
    })
    
    return slots
  },

  // Utilidades
  getDayOfWeek(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date(date).getDay()]
  },

  generateSlotsForBlock(block, duration) {
    const slots = []
    const startMinutes = this.timeToMinutes(block.start)
    const endMinutes = this.timeToMinutes(block.end)
    
    for (let time = startMinutes; time + duration <= endMinutes; time += 15) {
      slots.push(this.minutesToTime(time))
    }
    
    return slots
  },

  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  },

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  },

  calculateAverageRating(reviews) {
    const activeReviews = reviews.filter(r => r.status === 'active')
    if (activeReviews.length === 0) return 0
    
    const sum = activeReviews.reduce((acc, review) => acc + review.rating, 0)
    return Math.round((sum / activeReviews.length) * 10) / 10
  }
}

/**
 * Servicio para reviews/valoraciones
 */
export const reviewService = {
  
  // Crear nueva review
  async create(reviewData) {
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating review:', error)
      throw error
    }
  },

  // Obtener review por ID
  async getById(reviewId) {
    try {
      const docSnap = await getDoc(doc(db, 'reviews', reviewId))
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error getting review:', error)
      throw error
    }
  },

  // Obtener reviews de un profesional
  async getByProfessionalId(professionalId, status = null) {
    try {
      let q = query(
        collection(db, 'reviews'),
        where('professionalId', '==', professionalId),
        orderBy('createdAt', 'desc')
      )

      if (status) {
        q = query(q, where('status', '==', status))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting reviews by professional:', error)
      throw error
    }
  },

  // Obtener reviews de un cliente
  async getByClientId(clientId) {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting reviews by client:', error)
      throw error
    }
  },

  // Actualizar review
  async update(reviewId, updates) {
    try {
      const docRef = doc(db, 'reviews', reviewId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating review:', error)
      throw error
    }
  },

  // Eliminar review
  async delete(reviewId) {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId))
    } catch (error) {
      console.error('Error deleting review:', error)
      throw error
    }
  },

  // Moderar review (cambiar estado)
  async moderate(reviewId, status, reason, moderatorId) {
    try {
      await this.update(reviewId, {
        status,
        moderationReason: reason,
        moderatedBy: moderatorId,
        moderatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error moderating review:', error)
      throw error
    }
  },

  // Verificar si un cliente puede hacer una review
  async canClientReview(clientId, professionalId) {
    try {
      // Verificar si el cliente tuvo al menos una cita completada con el profesional
      const q = query(
        collection(db, 'appointments'),
        where('clientId', '==', clientId),
        where('professionalId', '==', professionalId),
        where('status', '==', 'completed')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.size > 0
    } catch (error) {
      console.error('Error checking if client can review:', error)
      return false
    }
  },

  // Obtener reviews pendientes de moderación
  async getPendingReviews() {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting pending reviews:', error)
      throw error
    }
  }
}

/**
 * Servicio para gestión de fotos de perfil
 */
export const photoService = {
  
  // Validar foto antes de guardar
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

  // Comprimir imagen base64 (función utilitaria)
  async compressBase64Image(base64, maxWidth = 400, quality = 0.8) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calcular nuevas dimensiones manteniendo aspect ratio
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

  // Obtener tamaño de imagen base64
  getBase64Size(base64String) {
    // Remover data:image/jpeg;base64, prefix si existe
    const base64 = base64String.split(',')[1] || base64String
    
    // Calcular tamaño aproximado
    const sizeInBytes = (base64.length * 3) / 4
    
    // Ajustar por padding
    const padding = (base64.match(/=/g) || []).length
    return sizeInBytes - padding
  }
}

/**
 * Servicio para gestión de horarios avanzados
 */
export const scheduleService = {
  
  // Validar horarios
  validateSchedule(schedule) {
    const errors = []
    
    Object.entries(schedule).forEach(([day, daySchedule]) => {
      if (!daySchedule.active) return
      
      if (!daySchedule.blocks || daySchedule.blocks.length === 0) {
        errors.push(`${day}: Debe tener al menos un bloque de tiempo`)
        return
      }
      
      // Validar que no haya solapamientos
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
      
      // Validar que las horas sean válidas
      daySchedule.blocks.forEach(block => {
        if (block.start >= block.end) {
          errors.push(`${day}: La hora de inicio debe ser menor que la de fin`)
        }
      })
    })
    
    return errors
  },

  // Obtener resumen de horarios
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
            const start = enhancedProfessionalService.timeToMinutes(block.start)
            const end = enhancedProfessionalService.timeToMinutes(block.end)
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

/**
 * Servicio para gestión de tratamientos del profesional
 */
export const professionalTreatmentService = {
  
  // Obtener tratamientos disponibles para un profesional en una fecha específica
  async getAvailableTreatmentsForDate(professionalId, date) {
    try {
      const professional = await enhancedProfessionalService.getById(professionalId)
      if (!professional) return []
      
      return enhancedProfessionalService.getAvailableTreatmentsForDate(professional, date)
    } catch (error) {
      console.error('Error getting available treatments for date:', error)
      throw error
    }
  },

  // Verificar si un profesional puede realizar un tratamiento en una fecha
  async canPerformTreatment(professionalId, treatmentId, date) {
    try {
      const availableTreatments = await this.getAvailableTreatmentsForDate(professionalId, date)
      return availableTreatments.includes(treatmentId)
    } catch (error) {
      console.error('Error checking if professional can perform treatment:', error)
      return false
    }
  }
}

/**
 * Utilidades generales
 */
export const enhancedUtils = {
  
  // Generar ID único
  generateId(prefix = '') {
    return prefix + '_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  },

  // Formatear fecha para España
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }
    
    return new Date(date).toLocaleDateString('es-ES', defaultOptions)
  },

  // Validar email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Sanitizar texto (remover HTML y caracteres peligrosos)
  sanitizeText(text) {
    return text
      .replace(/<[^>]*>/g, '') // Remover HTML
      .replace(/[<>'"&]/g, '') // Remover caracteres peligrosos
      .trim()
  }
}