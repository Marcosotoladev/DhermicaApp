// src/lib/time-utils.js
import { format, parseISO, isValid, isDate } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea una fecha de manera segura
 * @param {Date|string|any} date - Fecha a formatear
 * @param {string} formatString - Formato deseado
 * @returns {string} Fecha formateada o string vacío si es inválida
 */
export function formatDate(date, formatString = 'dd/MM/yyyy') {
  if (!date) {
    return ''
  }

  try {
    let dateToFormat

    // Si es un Timestamp de Firestore
    if (date && typeof date.toDate === 'function') {
      dateToFormat = date.toDate()
    }
    // Si es un string, intentar parsearlo
    else if (typeof date === 'string') {
      dateToFormat = parseISO(date)
    }
    // Si ya es una fecha
    else if (isDate(date)) {
      dateToFormat = date
    }
    // Si no es nada reconocible
    else {
      console.warn('Formato de fecha no reconocido:', date)
      return ''
    }

    // Verificar que la fecha sea válida
    if (!isValid(dateToFormat)) {
      console.warn('Fecha inválida:', date)
      return ''
    }

    return format(dateToFormat, formatString, { locale: es })
  } catch (error) {
    console.warn('Error al formatear fecha:', error, 'Fecha original:', date)
    return ''
  }
}

/**
 * Formatea una fecha para mostrar de manera amigable
 * @param {Date|string|any} date 
 * @returns {string}
 */
export function formatDateFriendly(date) {
  return formatDate(date, 'dd \'de\' MMMM \'de\' yyyy')
}

/**
 * Formatea una fecha y hora
 * @param {Date|string|any} date 
 * @returns {string}
 */
export function formatDateTime(date) {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Formatea solo la hora de una fecha
 * @param {Date|string|any} date 
 * @returns {string}
 */
export function formatTime(date) {
  return formatDate(date, 'HH:mm')
}

/**
 * Formatea hora desde string (ej: "14:30")
 * @param {string} timeString 
 * @returns {string}
 */
export function formatTimeString(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return '00:00'
  }
  
  // Si ya está en formato HH:MM, devolverlo tal como está
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    return timeString
  }
  
  return '00:00'
}

/**
 * Convierte minutos a formato HH:MM
 * @param {number} minutes 
 * @returns {string}
 */
export function minutesToTime(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes)) {
    return '00:00'
  }
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Convierte formato HH:MM a minutos
 * @param {string} timeString 
 * @returns {number}
 */
export function timeToMinutes(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return 0
  }

  const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10))
  
  if (isNaN(hours) || isNaN(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns {string}
 */
export function getCurrentDateString() {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Verifica si una fecha es hoy
 * @param {Date|string|any} date 
 * @returns {boolean}
 */
export function isToday(date) {
  if (!date) return false
  
  try {
    let dateToCheck
    
    if (date && typeof date.toDate === 'function') {
      dateToCheck = date.toDate()
    } else if (typeof date === 'string') {
      dateToCheck = parseISO(date)
    } else if (isDate(date)) {
      dateToCheck = date
    } else {
      return false
    }

    if (!isValid(dateToCheck)) {
      return false
    }

    const today = new Date()
    return format(dateToCheck, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  } catch (error) {
    console.warn('Error al verificar si es hoy:', error)
    return false
  }
}

/**
 * Combina fecha y hora para crear un datetime completo
 * @param {Date|string|any} date 
 * @param {string} timeString - Formato "HH:MM"
 * @returns {string}
 */
export function combineDateAndTime(date, timeString) {
  try {
    const formattedDate = formatDate(date)
    const formattedTime = formatTimeString(timeString)
    
    if (formattedDate && formattedTime) {
      return `${formattedDate} ${formattedTime}`
    }
    
    return formatDate(date) || 'Fecha no disponible'
  } catch (error) {
    console.warn('Error combinando fecha y hora:', error)
    return 'Fecha no disponible'
  }
}

/**
 * Verifica si una fecha es futura
 * @param {Date|string|any} date 
 * @returns {boolean}
 */
export function isFuture(date) {
  if (!date) return false
  
  try {
    let dateToCheck
    
    if (date && typeof date.toDate === 'function') {
      dateToCheck = date.toDate()
    } else if (typeof date === 'string') {
      dateToCheck = parseISO(date)
    } else if (isDate(date)) {
      dateToCheck = date
    } else {
      return false
    }

    if (!isValid(dateToCheck)) {
      return false
    }

    return dateToCheck > new Date()
  } catch (error) {
    console.warn('Error al verificar si es futura:', error)
    return false
  }
}

/**
 * Formatea duración en minutos a formato legible
 * @param {number} minutes - Duración en minutos
 * @returns {string} Duración formateada (ej: "1h 30min", "45min", "2h")
 */
export function formatDuration(minutes) {
  if (!minutes || typeof minutes !== 'number' || isNaN(minutes)) {
    return '0 min'
  }
  
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}min`
}

/**
 * Sumar minutos a una hora string
 * @param {string} timeString - Hora en formato "HH:MM"
 * @param {number} minutes - Minutos a agregar
 * @returns {string} Nueva hora en formato "HH:MM"
 */
export function addMinutesToTime(timeString, minutes) {
  const [hours, mins] = timeString.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}