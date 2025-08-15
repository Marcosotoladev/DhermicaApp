// src/components/forms/time-slot-picker.js
'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, Calendar } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { appointmentService, professionalService } from '../../lib/firebase-services'
import { generateAvailableSlots, formatDate, getDayKey, formatTime } from '../../lib/time-utils'

/**
 * Componente selector de horarios disponibles
 * Muestra slots de tiempo considerando horarios laborales y citas existentes
 */
export function TimeSlotPicker({
  professionalId,
  date,
  duration,
  onSelectTime,
  selectedTime,
  excludeAppointmentId
}) {
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [professional, setProfessional] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTimeSlots()
  }, [professionalId, date, duration, excludeAppointmentId])

  const loadTimeSlots = async () => {
    if (!professionalId || !date || !duration) return

    setLoading(true)
    setError('')

    try {
      // Obtener información del profesional
      const prof = await professionalService.getById(professionalId)
      if (!prof) {
        setError('Profesional no encontrado')
        return
      }
      setProfessional(prof)

      // Obtener día de la semana
      const dayKey = getDayKey(date)
      const daySchedule = prof.workingHours[dayKey]

      if (!daySchedule || !daySchedule.active) {
        setTimeSlots([])
        return
      }

      // Obtener citas existentes del día
      const existingAppointments = await appointmentService.getByProfessionalAndDate(
        professionalId,
        date
      )

      // Filtrar la cita que estamos editando (si existe)
      const filteredAppointments = excludeAppointmentId
        ? existingAppointments.filter(apt => apt.id !== excludeAppointmentId)
        : existingAppointments

      // Generar slots disponibles
      const slots = generateAvailableSlots(
        daySchedule.start,
        daySchedule.end,
        duration,
        filteredAppointments,
        15 // Intervalos de 15 minutos
      )

      setTimeSlots(slots)
    } catch (error) {
      console.error('Error loading time slots:', error)
      setError('Error al cargar horarios disponibles')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Horarios Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!professional) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error al cargar información del profesional</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const dayKey = getDayKey(date)
  const daySchedule = professional.workingHours[dayKey]
  const dayName = formatDate(date, 'EEEE d \'de\' MMMM')

  if (!daySchedule || !daySchedule.active) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Horarios Disponibles
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {professional.name} • {dayName}
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              No hay atención este día
            </p>
            <p className="text-sm text-muted-foreground">
              {professional.name} no trabaja los {formatDate(date, 'EEEE')}s
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const availableSlots = timeSlots.filter(slot => slot.available)
  const unavailableSlots = timeSlots.filter(slot => !slot.available)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Horarios Disponibles
        </CardTitle>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <strong>{professional.name}</strong> • {dayName}
          </p>
          <p className="text-xs text-muted-foreground">
            Duración: {duration} min • Horario: {formatTime(daySchedule.start)} - {formatTime(daySchedule.end)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Slots disponibles */}
        {availableSlots.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-success flex items-center">
                <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                Disponibles ({availableSlots.length})
              </h4>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {availableSlots.map(slot => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectTime(slot.time)}
                  className={`text-xs h-9 ${
                    selectedTime === slot.time 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-success/10 hover:border-success'
                  }`}
                >
                  {formatTime(slot.time)}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-1">
              No hay horarios disponibles
            </p>
            <p className="text-sm text-muted-foreground">
              Prueba con otro día o reduce la duración del tratamiento
            </p>
          </div>
        )}

        {/* Slots ocupados (opcional, para referencia) */}
        {unavailableSlots.length > 0 && availableSlots.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-muted-foreground flex items-center">
                <div className="w-2 h-2 bg-muted-foreground rounded-full mr-2"></div>
                No disponibles ({unavailableSlots.length})
              </h4>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {unavailableSlots.slice(0, 12).map(slot => ( // Mostrar solo los primeros 12
                <div key={slot.time} className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-xs h-9 w-full opacity-50 cursor-not-allowed"
                  >
                    {formatTime(slot.time)}
                  </Button>
                  {slot.reason && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 text-[10px]"
                    >
                      {slot.reason === 'Ocupado' ? '🚫' : '⏰'}
                    </Badge>
                  )}
                </div>
              ))}
              {unavailableSlots.length > 12 && (
                <div className="text-xs text-muted-foreground flex items-center justify-center">
                  +{unavailableSlots.length - 12} más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
            Disponible
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
            Seleccionado
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-muted-foreground rounded-full mr-2"></div>
            Ocupado
          </div>
        </div>
      </CardContent>
    </Card>
  )
}