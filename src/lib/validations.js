// src/lib/validations.js
import { z } from 'zod'

/**
 * Esquemas de validación usando Zod para todas las entidades de Dhermica
 * Estos esquemas validan los datos antes de enviarlos a Firebase
 */

// =============================================================================
// VALIDACIONES PARA TRATAMIENTOS
// =============================================================================

export const treatmentSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  duration: z.number()
    .min(15, 'La duración mínima es 15 minutos')
    .max(480, 'La duración máxima es 8 horas'),
  
  basePrice: z.number()
    .min(0, 'El precio debe ser mayor o igual a 0')
    .max(999999, 'El precio es demasiado alto')
    .optional(),
  
  category: z.string()
    .min(1, 'Selecciona una categoría'),
  
  medicalRestrictions: z.array(z.string())
    .default([]),
  
  active: z.boolean()
    .default(true)
})

// =============================================================================
// VALIDACIONES PARA PROFESIONALES
// =============================================================================

const dayScheduleSchema = z.object({
  start: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  end: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  active: z.boolean()
})

export const professionalSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  specialties: z.array(z.string())
    .min(1, 'Selecciona al menos una especialidad'),
  
  workingHours: z.object({
    monday: dayScheduleSchema,
    tuesday: dayScheduleSchema,
    wednesday: dayScheduleSchema,
    thursday: dayScheduleSchema,
    friday: dayScheduleSchema,
    saturday: dayScheduleSchema,
    sunday: dayScheduleSchema
  }),
  
  available: z.boolean()
    .default(true)
})

// =============================================================================
// VALIDACIONES PARA CLIENTES
// =============================================================================

export const medicalInfoSchema = z.object({
  Diabetes: z.boolean().default(false),
  Cancer: z.boolean().default(false),
  Tatuajes: z.boolean().default(false),
  Alergias: z.boolean().default(false),
  Embarazo: z.boolean().default(false),
  Cirugias: z.boolean().default(false),
  Otro: z.boolean().default(false),
  observations: z.string().max(300, 'Máximo 300 caracteres').default('')
})

export const clientSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email demasiado largo'),
  
  phone: z.string()
    .min(10, 'Teléfono debe tener al menos 10 dígitos')
    .max(20, 'Teléfono demasiado largo')
    .regex(/^[\+]?[\d\s\-\(\)]+$/, 'Formato de teléfono inválido'),
  
  dateOfBirth: z.date({
    required_error: 'Fecha de nacimiento requerida',
    invalid_type_error: 'Fecha inválida'
  }).refine(
    (date) => {
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      return age >= 16 && age <= 120
    },
    'Edad debe estar entre 16 y 120 años'
  ),
  
  medicalInfo: medicalInfoSchema
})

// =============================================================================
// VALIDACIONES PARA CITAS
// =============================================================================

export const appointmentSchema = z.object({
  clientId: z.string()
    .min(1, 'Cliente requerido'),
  
  clientName: z.string()
    .min(1, 'Nombre del cliente requerido'),
  
  // Soporte para múltiples tratamientos
  treatments: z.array(z.object({
    id: z.string().min(1, 'ID del tratamiento requerido'),
    name: z.string().min(1, 'Nombre del tratamiento requerido'),
    duration: z.number().min(1, 'Duración requerida'),
    price: z.number().min(0, 'El precio debe ser mayor o igual a 0')
  })).min(1, 'Debe seleccionar al menos un tratamiento'),
  
  professionalId: z.string()
    .min(1, 'Profesional requerido'),
  
  date: z.date({
    required_error: 'Fecha requerida',
    invalid_type_error: 'Fecha inválida'
  }).refine(
    (date) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today
    },
    'La fecha no puede ser en el pasado'
  ),
  
  startTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  
  endTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  
  duration: z.number()
    .min(1, 'Duración requerida')
    .max(480, 'Duración máxima 8 horas'),
  
  totalPrice: z.number()
    .min(0, 'El precio total debe ser mayor o igual a 0'),
  
  status: z.enum(['Programado', 'Completado', 'Anulado'])
    .default('Programado'),
  
  // Campos para compatibilidad con formato legacy
  treatmentId: z.string().optional(),
  price: z.number().optional()
}).refine(
  (data) => {
    // Validar que la hora de fin sea después de la hora de inicio
    const [startHour, startMin] = data.startTime.split(':').map(Number)
    const [endHour, endMin] = data.endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    return endMinutes > startMinutes
  },
  {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['endTime']
  }
).refine(
  (data) => {
    // Validar que la duración total coincida con la suma de tratamientos
    const totalDuration = data.treatments.reduce((sum, treatment) => sum + treatment.duration, 0)
    return data.duration === totalDuration
  },
  {
    message: 'La duración total debe coincidir con la suma de los tratamientos',
    path: ['duration']
  }
).refine(
  (data) => {
    // Validar que el precio total coincida con la suma de tratamientos
    const totalPrice = data.treatments.reduce((sum, treatment) => sum + treatment.price, 0)
    return data.totalPrice === totalPrice
  },
  {
    message: 'El precio total debe coincidir con la suma de los tratamientos',
    path: ['totalPrice']
  }
)

// =============================================================================
// VALIDACIONES PARA AUTENTICACIÓN
// =============================================================================

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido'),
  
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  email: z.string()
    .email('Email inválido'),
  
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(50, 'La contraseña no puede exceder 50 caracteres'),
  
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  }
)

// =============================================================================
// FUNCIONES AUXILIARES DE VALIDACIÓN
// =============================================================================

/**
 * Validar restricciones médicas entre cliente y tratamiento
 */
export function validateMedicalRestrictions(clientMedicalInfo, treatmentRestrictions) {
  const warnings = []
  
  if (!clientMedicalInfo || !treatmentRestrictions || treatmentRestrictions.length === 0) {
    return { isValid: true, warnings: [] }
  }
  
  treatmentRestrictions.forEach(restriction => {
    if (clientMedicalInfo[restriction] === true) {
      warnings.push(`Atención: El cliente tiene ${restriction}`)
    }
  })
  
  return {
    isValid: warnings.length === 0,
    warnings
  }
}

/**
 * Validar formato de teléfono argentino
 */
export function validateArgentinePhone(phone) {
  // Formatos válidos: +54911234567, 011234567, 1123456789, etc.
  const phoneRegex = /^(?:\+54|0)?(?:11|[2-9]\d{1,3})\d{6,8}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

/**
 * Validar horarios de trabajo (que el fin sea después del inicio)
 */
export function validateWorkingHours(start, end) {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return endMinutes > startMinutes
}

// =============================================================================
// CONSTANTES PARA VALIDACIONES
// =============================================================================

export const MEDICAL_RESTRICTIONS = [
  'Diabetes',
  'Cancer',
  'Tatuajes',
  'Alergias',
  'Embarazo',
  'Cirugias',
  'Otro'
]

export const TREATMENT_CATEGORIES = [
  'Aparatologia',
  'Cejas',
  'Corporales',
  'Depilacion',
  'Faciales',
  'Manos',
  'Pestañas',
  'Pies',
  'HiFu',
  'Liposonix',
  'Definitiva',
  'Otro'
]

export const PROFESSIONAL_SPECIALTIES = [
  'Tratamientos Faciales',
  'Tratamientos Corporales', 
  'Depilación Láser',
  'Microdermoabrasión',
  'Radiofrecuencia',
  'Mesoterapia',
  'Masajes Terapéuticos',
  'Aparatología',
  'Cejas y Pestañas',
  'HiFu',
  'Liposonix'
]