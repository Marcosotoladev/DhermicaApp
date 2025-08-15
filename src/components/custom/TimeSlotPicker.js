// src/components/custom/TimeSlotPicker.js
'use client'

import { useState, useEffect } from 'react'
import { Clock, Calendar, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { appointmentService, professionalService } from '../../lib/firebase-services'
import { formatDate, formatTimeString, timeToMinutes, minutesToTime } from '../../lib/time-utils'

/**
 * Componente Selector de Horarios
 * Características:
 * - Mostrar horarios disponibles/ocupados
 * - Validar horarios laborales del profesional
 * - Calcular slots según duración del tratamiento
 * - Mobile-first design con grid responsive
 */
export function TimeSlotPicker({
  professionalId,
  date,
  duration = 60, // Duración en minutos
  onSelectTime,
  selectedTime = null,
  excludeAppointmentId = null
}) {
  const [availableSlots, setAvailableSlots] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])
  const [professionalInfo, setProfessionalInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cargar datos cuando cambian las props
  useEffect(() => {
    if (professionalId && date) {
      loadTimeSlots()
    }
  }, [professionalId, date, duration, excludeAppointmentId])

  const loadTimeSlots = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('Cargando horarios para:', { professionalId, date: formatDate(date), duration })

      // 1. Cargar información del profesional
      const professional = await professionalService.getById(professionalId)
      if (!professional) {
        setError('Profesional no encontrado')
        return
      }
      setProfessionalInfo(professional)

      // 2. Cargar citas existentes del día
      const appointments = await appointmentService.getByProfessionalAndDate(professionalId, date)
      
      // Filtrar la cita que estamos editando si existe
      const filteredAppointments = excludeAppointmentId 
        ? appointments.filter(apt => apt.id !== excludeAppointmentId)
        : appointments

      console.log('Citas existentes:', filteredAppointments.length)

      // 3. Obtener horarios laborales del día
      const dayOfWeek = getDayOfWeek(date)
      const workingHours = professional.workingHours[dayOfWeek]

      if (!workingHours || !workingHours.active) {
        setError(`El profesional no trabaja los ${dayOfWeek}s`)
        setAvailableSlots([])
        setBookedSlots([])
        return
      }

      // 4. Generar todos los slots posibles
      const allSlots = generateTimeSlots(workingHours.start, workingHours.end, 30) // Slots cada 30 min
      
      // 5. Marcar slots ocupados
      const occupiedSlots = getOccupiedSlots(filteredAppointments)
      
      // 6. Filtrar slots disponibles según duración
      const availableSlots = allSlots.filter(slot => 
        isSlotAvailable(slot, duration, occupiedSlots, workingHours.end)
      )

      console.log('Slots disponibles:', availableSlots.length)
      console.log('Slots ocupados:', occupiedSlots.length)

      setAvailableSlots(availableSlots)
      setBookedSlots(occupiedSlots)

    } catch (error) {
      console.error('Error loading time slots:', error)
      setError('Error cargando horarios disponibles')
    } finally {
      setLoading(false)
    }
  }

  // Obtener día de la semana en español
  const getDayOfWeek = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayIndex = new Date(date).getDay()
    return days[dayIndex]
  }

  // Generar slots de tiempo cada X minutos
  const generateTimeSlots = (startTime, endTime, interval = 30) => {
    const slots = []
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)

    for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
      slots.push(minutesToTime(minutes))
    }

    return slots
  }

  // Obtener slots ocupados por citas existentes
  const getOccupiedSlots = (appointments) => {
    const occupied = []

    appointments.forEach(appointment => {
      const startMinutes = timeToMinutes(appointment.startTime)
      const appointmentDuration = appointment.duration || 60
      
      // Marcar todos los slots de 30 min que cubre esta cita
      for (let i = 0; i < appointmentDuration; i += 30) {
        const slotTime = minutesToTime(startMinutes + i)
        if (!occupied.includes(slotTime)) {
          occupied.push(slotTime)
        }
      }
    })

    return occupied
  }

  // Verificar si un slot está disponible para la duración requerida
  const isSlotAvailable = (slotTime, requiredDuration, occupiedSlots, endTime) => {
    const slotMinutes = timeToMinutes(slotTime)
    const endMinutes = timeToMinutes(endTime)

    // Verificar que el slot no termine después del horario laboral
    if (slotMinutes + requiredDuration > endMinutes) {
      return false
    }

    // Verificar que todos los slots de 30 min necesarios estén libres
    for (let i = 0; i < requiredDuration; i += 30) {
      const checkTime = minutesToTime(slotMinutes + i)
      if (occupiedSlots.includes(checkTime)) {
        return false
      }
    }

    return true
  }

  // Verificar si un slot está en el pasado
  const isSlotInPast = (slotTime) => {
    const now = new Date()
    const slotDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    slotDate.setHours(0, 0, 0, 0)

    // Si no es hoy, no está en el pasado
    if (slotDate.getTime() !== today.getTime()) {
      return false
    }

    // Si es hoy, verificar la hora
    const slotMinutes = timeToMinutes(slotTime)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    return slotMinutes <= currentMinutes
  }

  // Obtener estado del slot
  const getSlotStatus = (slotTime) => {
    if (isSlotInPast(slotTime)) {
      return { type: 'past', label: 'Pasado', disabled: true, color: 'bg-gray-100 text-gray-400' }
    }
    
    if (bookedSlots.includes(slotTime)) {
      return { type: 'booked', label: 'Ocupado', disabled: true, color: 'bg-red-100 text-red-700 border-red-200' }
    }
    
    if (availableSlots.includes(slotTime)) {
      return { type: 'available', label: 'Disponible', disabled: false, color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' }
    }
    
    return { type: 'unavailable', label: 'No disponible', disabled: true, color: 'bg-gray-100 text-gray-500' }
  }

  // Manejar selección de horario
  const handleSelectTime = (slotTime) => {
    const status = getSlotStatus(slotTime)
    if (status.disabled) return

    console.log('Horario seleccionado:', slotTime)
    onSelectTime(slotTime)
  }

  // Obtener horarios para mostrar (combinar disponibles y ocupados para vista completa)
  const getAllSlots = () => {
    if (!professionalInfo) return []

    const dayOfWeek = getDayOfWeek(date)
    const workingHours = professionalInfo.workingHours[dayOfWeek]
    
    if (!workingHours || !workingHours.active) return []

    return generateTimeSlots(workingHours.start, workingHours.end, 30)
  }

  // Calcular hora de fin para el slot seleccionado
  const getEndTime = (startTime) => {
    const startMinutes = timeToMinutes(startTime)
    return minutesToTime(startMinutes + duration)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Horarios Disponibles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Horarios Disponibles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div>
              <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const allSlots = getAllSlots()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Horarios Disponibles</span>
        </CardTitle>
        <CardDescription>
          {formatDate(date)} • Duración: {duration} minutos
          {professionalInfo && (
            <> • {professionalInfo.name}</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        
        {/* Leyenda */}
        <div className="flex flex-wrap gap-2 mb-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Ocupado</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>No disponible</span>
          </div>
        </div>

        {/* Grid de horarios */}
        {allSlots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {allSlots.map((slotTime) => {
              const status = getSlotStatus(slotTime)
              const isSelected = selectedTime === slotTime

              return (
                <Button
                  key={slotTime}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={status.disabled}
                  className={`h-12 flex flex-col items-center justify-center p-1 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : status.color
                  }`}
                  onClick={() => handleSelectTime(slotTime)}
                >
                  <span className="text-xs font-medium">
                    {formatTimeString(slotTime)}
                  </span>
                  {!status.disabled && (
                    <span className="text-xs opacity-75">
                      {formatTimeString(getEndTime(slotTime))}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              No hay horarios laborales configurados para este día
            </p>
          </div>
        )}

        {/* Información del slot seleccionado */}
        {selectedTime && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Horario seleccionado: {formatTimeString(selectedTime)} - {formatTimeString(getEndTime(selectedTime))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Duración: {duration} minutos
            </p>
          </div>
        )}

        {/* Advertencia si no hay slots disponibles */}
        {allSlots.length > 0 && availableSlots.length === 0 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                No hay horarios disponibles para la duración seleccionada ({duration} min)
              </span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Intenta seleccionar una duración menor o elige otro día.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Versión compacta del selector de horarios para espacios reducidos
 */
export function TimeSlotPickerCompact({ professionalId, date, duration, onSelectTime, selectedTime }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Seleccionar horario</span>
      </div>
      <TimeSlotPicker
        professionalId={professionalId}
        date={date}
        duration={duration}
        onSelectTime={onSelectTime}
        selectedTime={selectedTime}
      />
    </div>
  )
}