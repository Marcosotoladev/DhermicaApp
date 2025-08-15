// src/app/admin/appointments/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Clock, User, Briefcase, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Calendar } from '../../../components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { appointmentService, professionalService, treatmentService } from '../../../lib/firebase-services'
import { formatDate, formatTime, formatDateTime } from '../../../lib/time-utils'

/**
 * Página de gestión de citas
 * Vista de calendario y lista de todas las citas
 */
export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' | 'list'
  const [selectedProfessional, setSelectedProfessional] = useState('all')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [selectedDate, selectedProfessional])

  const loadInitialData = async () => {
    try {
      const [professionalsData, treatmentsData] = await Promise.all([
        professionalService.getAll(),
        treatmentService.getAll()
      ])
      setProfessionals(professionalsData)
      setTreatments(treatmentsData)
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const loadAppointments = async () => {
    setLoading(true)
    try {
      let appointmentsData
      
      if (selectedProfessional === 'all') {
        appointmentsData = await appointmentService.getByDate(selectedDate)
      } else {
        appointmentsData = await appointmentService.getByProfessionalAndDate(
          selectedProfessional, 
          selectedDate
        )
      }
      
      // Enriquecer con datos de profesionales y tratamientos
      const enrichedAppointments = appointmentsData.map(appointment => ({
        ...appointment,
        professional: professionals.find(p => p.id === appointment.professionalId),
        treatment: treatments.find(t => t.id === appointment.treatmentId)
      }))
      
      setAppointments(enrichedAppointments)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      try {
        await appointmentService.delete(id)
        await loadAppointments()
      } catch (error) {
        console.error('Error deleting appointment:', error)
      }
    }
  }

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const navigateToToday = () => {
    setSelectedDate(new Date())
  }

  const getAppointmentsByHour = () => {
    const hourlyAppointments = {}
    
    // Crear slots de hora de 8 AM a 8 PM
    for (let hour = 8; hour <= 20; hour++) {
      const timeKey = `${hour.toString().padStart(2, '0')}:00`
      hourlyAppointments[timeKey] = []
    }
    
    // Agrupar citas por hora de inicio
    appointments.forEach(appointment => {
      const hour = appointment.startTime.split(':')[0]
      const timeKey = `${hour}:00`
      if (hourlyAppointments[timeKey]) {
        hourlyAppointments[timeKey].push(appointment)
      }
    })
    
    return hourlyAppointments
  }

  const appointmentsByHour = getAppointmentsByHour()

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Citas</h1>
              <p className="text-muted-foreground">
                Gestiona las citas de Dhermica
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/appointments/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>

        {/* Controles */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              {/* Navegación de fecha */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center min-w-[200px]">
                    <p className="font-semibold">
                      {formatDate(selectedDate, 'EEEE d \'de\' MMMM')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedDate, 'yyyy')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={navigateToToday}>
                  Hoy
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex items-center space-x-4">
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos los profesionales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los profesionales</SelectItem>
                    {professionals.map(professional => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex border border-border rounded-md">
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="rounded-r-none"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Calendario
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Lista
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Mini calendario */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendario</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Vista principal */}
          <div className="lg:col-span-3">
            {viewMode === 'calendar' ? (
              // Vista de calendario
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Citas del {formatDate(selectedDate, 'dd/MM/yyyy')}
                    </CardTitle>
                    <Badge variant="outline">
                      {appointments.length} citas
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {appointments.length > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(appointmentsByHour).map(([hour, hourAppointments]) => (
                        <div key={hour} className="flex border-b border-border pb-2 mb-2 last:border-b-0">
                          <div className="w-16 text-sm text-muted-foreground font-medium py-2">
                            {formatTime(hour)}
                          </div>
                          <div className="flex-1 space-y-2">
                            {hourAppointments.length > 0 ? (
                              hourAppointments.map(appointment => (
                                <div
                                  key={appointment.id}
                                  className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <Badge variant="outline" className="text-xs">
                                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                        </Badge>
                                        <span className="font-medium">{appointment.clientName}</span>
                                      </div>
                                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                        <div className="flex items-center space-x-1">
                                          <Briefcase className="h-3 w-3" />
                                          <span>{appointment.treatment?.name || 'Tratamiento eliminado'}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <User className="h-3 w-3" />
                                          <span>{appointment.professional?.name || 'Profesional eliminado'}</span>
                                        </div>
                                        {appointment.price && (
                                          <Badge variant="secondary" className="text-xs">
                                            ${appointment.price.toLocaleString()}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex space-x-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/admin/appointments/${appointment.id}/edit`)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteAppointment(appointment.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted-foreground text-sm py-2">
                                Sin citas
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay citas programadas</h3>
                      <p className="text-muted-foreground mb-4">
                        No hay citas para {formatDate(selectedDate, 'dd/MM/yyyy')}
                      </p>
                      <Button onClick={() => router.push('/admin/appointments/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Primera Cita
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Vista de lista
              <Card>
                <CardHeader>
                  <CardTitle>
                    Lista de Citas - {formatDate(selectedDate, 'dd/MM/yyyy')}
                  </CardTitle>
                  <CardDescription>
                    {appointments.length} citas programadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.length > 0 ? (
                    <div className="space-y-4">
                      {appointments
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map(appointment => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="font-medium">{formatTime(appointment.startTime)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {appointment.duration} min
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">{appointment.clientName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.treatment?.name || 'Tratamiento eliminado'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  con {appointment.professional?.name || 'Profesional eliminado'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {appointment.price && (
                                <Badge variant="secondary">
                                  ${appointment.price.toLocaleString()}
                                </Badge>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/appointments/${appointment.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Lista vacía</h3>
                      <p className="text-muted-foreground mb-4">
                        No hay citas para mostrar en esta fecha
                      </p>
                      <Button onClick={() => router.push('/admin/appointments/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Cita
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}