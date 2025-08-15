// src/app/client/appointments/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, User, MapPin, ArrowLeft, Filter, ChevronDown } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useAuthStore } from '../../../store/auth'
import { appointmentService, treatmentService, professionalService } from '../../../lib/firebase-services'
import { formatDate, formatTime, formatDateTime } from '../../../lib/time-utils'

/**
 * Página de citas del cliente
 * Muestra todas las citas (pasadas y futuras) del cliente
 */
export default function ClientAppointmentsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'upcoming', 'past'

  useEffect(() => {
    if (user) {
      loadAppointments()
    }
  }, [user])

  useEffect(() => {
    filterAppointments()
  }, [appointments, filter])

  const loadAppointments = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Cargar todas las citas del cliente
      const appointmentsData = await appointmentService.getByClient(user.uid)
      
      // Enriquecer con datos de tratamientos y profesionales
      const enrichedAppointments = await Promise.all(
        appointmentsData.map(async (appointment) => {
          const [treatment, professional] = await Promise.all([
            treatmentService.getById(appointment.treatmentId),
            professionalService.getById(appointment.professionalId)
          ])
          
          return {
            ...appointment,
            treatment,
            professional,
            isPast: new Date(appointment.date.toDate()) < new Date()
          }
        })
      )

      // Ordenar por fecha (más recientes primero)
      enrichedAppointments.sort((a, b) => b.date.toDate() - a.date.toDate())
      
      setAppointments(enrichedAppointments)
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    if (filter === 'upcoming') {
      filtered = appointments.filter(apt => !apt.isPast)
    } else if (filter === 'past') {
      filtered = appointments.filter(apt => apt.isPast)
    }

    setFilteredAppointments(filtered)
  }

  const getAppointmentStatus = (appointment) => {
    if (appointment.isPast) {
      return { 
        label: 'Completada', 
        variant: 'secondary',
        color: 'text-muted-foreground'
      }
    } else {
      const appointmentDate = new Date(appointment.date.toDate())
      const today = new Date()
      const diffTime = appointmentDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return { 
          label: 'Hoy', 
          variant: 'default',
          color: 'text-primary'
        }
      } else if (diffDays === 1) {
        return { 
          label: 'Mañana', 
          variant: 'outline',
          color: 'text-warning'
        }
      } else if (diffDays <= 7) {
        return { 
          label: `En ${diffDays} días`, 
          variant: 'outline',
          color: 'text-success'
        }
      } else {
        return { 
          label: 'Próxima', 
          variant: 'outline',
          color: 'text-muted-foreground'
        }
      }
    }
  }

  const upcomingCount = appointments.filter(apt => !apt.isPast).length
  const pastCount = appointments.filter(apt => apt.isPast).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/client/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mis Citas</h1>
              <p className="text-muted-foreground">
                Historial completo de tus citas en Dhermica
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas y filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{appointments.length}</p>
                  <p className="text-xs text-muted-foreground">Total citas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold">{upcomingCount}</p>
                  <p className="text-xs text-muted-foreground">Próximas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{pastCount}</p>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las citas</SelectItem>
                      <SelectItem value="upcoming">Próximas</SelectItem>
                      <SelectItem value="past">Completadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de citas */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const status = getAppointmentStatus(appointment)
              
              return (
                <Card key={appointment.id} className={`hover:shadow-md transition-shadow ${
                  appointment.isPast ? 'opacity-75' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        
                        {/* Header de la cita */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <p className="text-lg font-bold">
                                {formatDate(appointment.date.toDate(), 'dd')}
                              </p>
                              <p className="text-xs text-muted-foreground uppercase">
                                {formatDate(appointment.date.toDate(), 'MMM')}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {appointment.treatment?.name || 'Tratamiento eliminado'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(appointment.date.toDate(), 'EEEE d \'de\' MMMM \'de\' yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge variant={status.variant} className={status.color}>
                            {status.label}
                          </Badge>
                        </div>

                        {/* Detalles de la cita */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Horario</p>
                              <p className="font-medium">
                                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Profesional</p>
                              <p className="font-medium">
                                {appointment.professional?.name || 'No asignado'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Duración</p>
                              <p className="font-medium">{appointment.duration} minutos</p>
                            </div>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center space-x-4">
                            {appointment.treatment?.category && (
                              <Badge variant="outline" className="text-xs">
                                {appointment.treatment.category}
                              </Badge>
                            )}
                            {appointment.price && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Precio: </span>
                                <span className="font-medium text-success">
                                  ${appointment.price.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {!appointment.isPast && (
                            <div className="text-xs text-muted-foreground">
                              ID: {appointment.id.slice(-6)}
                            </div>
                          )}
                        </div>

                        {/* Descripción del tratamiento */}
                        {appointment.treatment?.description && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                              {appointment.treatment.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {filter === 'upcoming' ? 'No tienes citas próximas' :
                 filter === 'past' ? 'No tienes historial de citas' :
                 'No tienes citas registradas'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'upcoming' ? 'Agenda tu próxima cita para seguir cuidando tu bienestar' :
                 filter === 'past' ? 'Una vez que completes tu primera cita aparecerá aquí' :
                 'Comienza tu experiencia en Dhermica agendando tu primera cita'}
              </p>
              <Button onClick={() => router.push('/treatments')}>
                Explorar Tratamientos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}