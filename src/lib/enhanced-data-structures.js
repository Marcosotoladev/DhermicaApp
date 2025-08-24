// src/lib/enhanced-data-structures.js

/**
 * Estructura de datos mejorada para profesionales
 * Incluye: fotos, horarios flexibles, pausas, disponibilidad de tratamientos
 */

// 1. ESTRUCTURA DE PROFESIONAL MEJORADA
export const ENHANCED_PROFESSIONAL_STRUCTURE = {
  id: 'string',
  name: 'string',
  
  // FOTO DE PERFIL
  profilePhoto: {
    base64: 'string', // Imagen en base64 (max 200KB)
    mimeType: 'string', // image/jpeg, image/png
    uploadedAt: 'timestamp',
    size: 'number' // bytes
  },
  
  // INFORMACIÓN BÁSICA
  description: 'string', // Descripción general del profesional
  phone: 'string',
  email: 'string',
  
  // ESPECIALIDADES/TRATAMIENTOS QUE PUEDE REALIZAR
  availableTreatments: [
    {
      treatmentId: 'string',
      name: 'string',
      certified: 'boolean', // Si está certificado para este tratamiento
      experience: 'string', // Años de experiencia en este tratamiento
      notes: 'string' // Notas específicas
    }
  ],
  
  // HORARIOS BASE (PLANTILLA SEMANAL)
  baseSchedule: {
    monday: {
      active: true,
      blocks: [
        {
          id: 'block_1',
          start: '09:00',
          end: '12:00',
          type: 'work' // work, break, lunch
        },
        {
          id: 'block_2', 
          start: '12:00',
          end: '13:00',
          type: 'break',
          description: 'Almuerzo'
        },
        {
          id: 'block_3',
          start: '13:00', 
          end: '18:00',
          type: 'work'
        }
      ]
    },
    // ... resto de días
  },
  
  // EXCEPCIONES/OVERRIDES POR FECHA ESPECÍFICA
  scheduleExceptions: [
    {
      date: '2025-03-15', // YYYY-MM-DD
      type: 'custom', // custom, unavailable, partial
      reason: 'Alquiler de equipo láser',
      blocks: [
        {
          start: '14:00',
          end: '18:00',
          type: 'work'
        }
      ],
      // Tratamientos disponibles solo este día
      availableTreatmentsOverride: ['laser_definitivo']
    },
    {
      date: '2025-03-20',
      type: 'unavailable',
      reason: 'Día libre'
    }
  ],
  
  // RESTRICCIONES DE TRATAMIENTOS POR DÍA DE SEMANA
  treatmentAvailability: {
    monday: {
      availableTreatments: ['all'], // 'all' o array de IDs específicos
      restrictedTreatments: [], // Tratamientos no disponibles este día
      notes: ''
    },
    tuesday: {
      availableTreatments: ['laser_definitivo', 'liposonix'], // Solo estos tratamientos
      restrictedTreatments: [],
      notes: 'Día de alquiler de equipos especiales'
    }
    // ... resto de días
  },
  
  // CONFIGURACIÓN GENERAL
  available: true,
  acceptsOnlineBooking: true,
  advanceBookingDays: 30, // Días de anticipación máxima para reservar
  
  // METADATA
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  createdBy: 'userId'
}

// 2. ESTRUCTURA DE REVIEWS/VALORACIONES
export const REVIEW_STRUCTURE = {
  id: 'string',
  professionalId: 'string',
  clientId: 'string',
  appointmentId: 'string', // Referencia a la cita que generó la review
  
  // VALORACIÓN
  rating: 5, // 1-5 estrellas
  comment: 'string', // Comentario opcional
  
  // MODERACIÓN
  status: 'active', // active, pending, hidden, deleted
  moderationReason: 'string', // Razón si fue moderada
  moderatedBy: 'userId',
  moderatedAt: 'timestamp',
  
  // METADATA
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  
  // INFORMACIÓN DEL CLIENTE (desnormalizada para mostrar)
  clientName: 'string',
  clientInitials: 'string'
}

// 3. UTILIDADES PARA TRABAJAR CON HORARIOS
export class ScheduleManager {
  
  /**
   * Obtiene horarios efectivos para una fecha específica
   */
  static getEffectiveSchedule(professional, date) {
    const dayOfWeek = this.getDayOfWeek(date)
    const exception = professional.scheduleExceptions?.find(exc => exc.date === date)
    
    if (exception) {
      if (exception.type === 'unavailable') {
        return { available: false, reason: exception.reason }
      }
      return { available: true, blocks: exception.blocks, reason: exception.reason }
    }
    
    return { 
      available: professional.baseSchedule[dayOfWeek]?.active || false,
      blocks: professional.baseSchedule[dayOfWeek]?.blocks || []
    }
  }
  
  /**
   * Obtiene tratamientos disponibles para una fecha específica
   */
  static getAvailableTreatments(professional, date) {
    const dayOfWeek = this.getDayOfWeek(date)
    const exception = professional.scheduleExceptions?.find(exc => exc.date === date)
    
    // Si hay override para esta fecha específica
    if (exception?.availableTreatmentsOverride) {
      return exception.availableTreatmentsOverride
    }
    
    // Usar configuración del día de la semana
    const dayConfig = professional.treatmentAvailability?.[dayOfWeek]
    if (!dayConfig) return []
    
    if (dayConfig.availableTreatments.includes('all')) {
      // Todos los tratamientos menos los restringidos
      return professional.availableTreatments
        .filter(t => !dayConfig.restrictedTreatments.includes(t.treatmentId))
        .map(t => t.treatmentId)
    }
    
    return dayConfig.availableTreatments
  }
  
  /**
   * Calcula slots de tiempo disponibles considerando pausas
   */
  static getAvailableTimeSlots(professional, date, treatmentDuration) {
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
  
  static getDayOfWeek(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date(date).getDay()]
  }
  
  static generateSlotsForBlock(block, duration) {
    // Lógica para generar slots de tiempo dentro de un bloque
    // considerando la duración del tratamiento
    const slots = []
    const startMinutes = this.timeToMinutes(block.start)
    const endMinutes = this.timeToMinutes(block.end)
    
    for (let time = startMinutes; time + duration <= endMinutes; time += 15) {
      slots.push(this.minutesToTime(time))
    }
    
    return slots
  }
  
  static timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
}

// 4. VALIDACIONES MEJORADAS
export const PHOTO_VALIDATION = {
  maxSizeBytes: 200 * 1024, // 200KB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxWidth: 800,
  maxHeight: 800
}

export const SCHEDULE_VALIDATION = {
  maxBlocksPerDay: 10,
  minBlockDuration: 15, // minutos
  maxBlockDuration: 12 * 60, // 12 horas
  maxAdvanceDays: 365
}

// 5. UTILIDADES PARA REVIEWS
export class ReviewManager {
  
  static calculateAverageRating(reviews) {
    const activeReviews = reviews.filter(r => r.status === 'active')
    if (activeReviews.length === 0) return 0
    
    const sum = activeReviews.reduce((acc, review) => acc + review.rating, 0)
    return Math.round((sum / activeReviews.length) * 10) / 10 // Redondear a 1 decimal
  }
  
  static getRatingDistribution(reviews) {
    const activeReviews = reviews.filter(r => r.status === 'active')
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    
    activeReviews.forEach(review => {
      distribution[review.rating]++
    })
    
    return distribution
  }
  
  static canClientReview(clientId, professionalId, appointments) {
    // Un cliente puede reseñar si tuvo al menos una cita completada
    return appointments.some(apt => 
      apt.clientId === clientId && 
      apt.professionalId === professionalId && 
      apt.status === 'completed'
    )
  }
}

// 6. QUERIES OPTIMIZADAS
export const ENHANCED_QUERIES = {
  
  // Obtener profesional con sus reviews
  getProfessionalWithReviews: async (professionalId) => {
    const professional = await professionalService.getById(professionalId)
    const reviews = await reviewService.getByProfessionalId(professionalId)
    
    return {
      ...professional,
      reviews: reviews.filter(r => r.status === 'active'),
      averageRating: ReviewManager.calculateAverageRating(reviews),
      totalReviews: reviews.filter(r => r.status === 'active').length
    }
  },
  
  // Buscar profesionales por tratamiento y fecha
  searchProfessionalsByTreatmentAndDate: async (treatmentId, date) => {
    const professionals = await professionalService.getAll()
    
    return professionals.filter(professional => {
      const availableTreatments = ScheduleManager.getAvailableTreatments(professional, date)
      const schedule = ScheduleManager.getEffectiveSchedule(professional, date)
      
      return availableTreatments.includes(treatmentId) && 
             schedule.available && 
             professional.available
    })
  }
}