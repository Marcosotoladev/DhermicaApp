// src/app/admin/appointments/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Clock, User, Briefcase, ArrowLeft, Edit, Trash2, Filter, X, Eye } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Calendar } from '../../../components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { appointmentService, professionalService, treatmentService } from '../../../lib/firebase-services'
import { formatDate, formatTime, formatDateTime } from '../../../lib/time-utils'

/**
 * Página de gestión de citas
 * Vista de calendario y lista de todas las citas - Optimizada para móvil
 */
export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('list') // Cambiado a 'list' por defecto para móvil
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [showCalendar, setShowCalendar] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Carga inicial de profesionales y tratamientos
useEffect(() => {
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [professionalsData, treatmentsData] = await Promise.all([
        professionalService.getAll(),
        treatmentService.getAll()
      ])
      setProfessionals(professionalsData)
      setTreatments(treatmentsData)
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  loadInitialData()
}, [])

// Carga de citas, depende también de profesionales y tratamientos
useEffect(() => {
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

      // 👀 Debug en consola para ver qué trae Firestore
      console.log("📅 Citas crudas desde Firestore:", appointmentsData)

      const enrichedAppointments = appointmentsData.map(appointment => ({
        ...appointment,
        professional: professionals.find(p => p.id === appointment.professionalId),
        treatment: treatments.find(t => t.id === appointment.treatmentId)
      }))

      // 👀 Debug en consola para ver las citas ya enriquecidas
      console.log("✨ Citas enriquecidas:", enrichedAppointments)

      setAppointments(enrichedAppointments)
    } catch (error) {
      console.error('❌ Error loading appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  // ⚡ Solo carga si ya tenemos profesionales y tratamientos
  if (professionals.length > 0 && treatments.length > 0) {
    loadAppointments()
  }
}, [selectedDate, selectedProfessional, professionals, treatments])



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
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-muted rounded w-1/2 sm:w-1/4"></div>
            <div className="h-64 sm:h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - Mobile Optimized */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="px-2 sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-foreground">Citas</h1>
                <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
                  Gestiona las citas de Dhermica
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/admin/appointments/new')}
              size="sm"
              className="px-3 sm:px-4"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Cita</span>
            </Button>
          </div>

          {/* Mobile Controls */}
          <div className="flex flex-col space-y-3 sm:hidden">
            {/* Date Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center flex-1 mx-2">
                <p className="font-semibold text-sm">
                  {formatDate(selectedDate, 'EEEE d \'de\' MMMM')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={navigateToToday} className="flex-1">
                Hoy
              </Button>
              
              <Sheet open={showCalendar} onOpenChange={setShowCalendar}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Calendario
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Seleccionar Fecha</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date)
                          setShowCalendar(false)
                        }
                      }}
                      className="rounded-md border"
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Personaliza la vista de citas
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Profesional
                      </label>
                      <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                        <SelectTrigger>
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
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Vista
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="justify-start"
                        >
                          <List className="h-4 w-4 mr-2" />
                          Lista
                        </Button>
                        <Button
                          variant={viewMode === 'calendar' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('calendar')}
                          className="justify-start"
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Horarios
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Desktop Controls */}
          <Card className="hidden sm:block mt-4">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                
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
                      Horarios
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
        </div>

        {/* Contenido principal */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Mini calendario - Solo desktop */}
            <Card className="hidden lg:block lg:col-span-1">
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
            <div className="col-span-1 lg:col-span-3">
              {viewMode === 'calendar' ? (
                // Vista de calendario/horarios
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-lg sm:text-xl">
                        Citas del {formatDate(selectedDate, 'dd/MM/yyyy')}
                      </CardTitle>
                      <Badge variant="outline">
                        {appointments.length} citas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    {appointments.length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(appointmentsByHour).map(([hour, hourAppointments]) => (
                          <div key={hour} className="flex border-b border-border pb-2 mb-2 last:border-b-0">
                            <div className="w-12 sm:w-16 text-xs sm:text-sm text-muted-foreground font-medium py-2 flex-shrink-0">
                              {formatTime(hour)}
                            </div>
                            <div className="flex-1 space-y-2 ml-2 sm:ml-0">
                              {hourAppointments.length > 0 ? (
                                hourAppointments.map(appointment => (
                                  <div
                                    key={appointment.id}
                                    className="bg-card border border-border rounded-lg p-2 sm:p-3 hover:shadow-sm transition-shadow"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                          <Badge variant="outline" className="text-xs w-fit">
                                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                          </Badge>
                                          <span className="font-medium text-sm sm:text-base truncate">
                                            {appointment.clientName}
                                          </span>
                                        </div>
                                        <div className="space-y-1 sm:flex sm:items-center sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                                          <div className="flex items-center space-x-1">
                                            <Briefcase className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{appointment.treatment?.name || 'Tratamiento eliminado'}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <User className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{appointment.professional?.name || 'Profesional eliminado'}</span>
                                          </div>
                                          {appointment.price && (
                                            <Badge variant="secondary" className="text-xs w-fit">
                                              ${appointment.price.toLocaleString()}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex space-x-1 flex-shrink-0">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => router.push(`/admin/appointments/${appointment.id}`)}
                                          className="px-2"
                                          title="Ver detalles"
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => router.push(`/admin/appointments/editar/${appointment.id}`)}
                                          className="px-2"
                                          title="Editar cita"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteAppointment(appointment.id)}
                                          className="text-destructive hover:text-destructive px-2"
                                          title="Eliminar cita"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground text-xs sm:text-sm py-2">
                                  Sin citas
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <CalendarIcon className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-base sm:text-lg font-medium mb-2">No hay citas programadas</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          No hay citas para {formatDate(selectedDate, 'dd/MM/yyyy')}
                        </p>
                        <Button onClick={() => router.push('/admin/appointments/new')} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Primera Cita
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                // Vista de lista - Optimizada para móvil
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">
                          Lista de Citas
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {formatDate(selectedDate, 'dd/MM/yyyy')} • {appointments.length} citas
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    {appointments.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {appointments
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(appointment => (
                            <div
                              key={appointment.id}
                              className="border border-border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                  <div className="text-center flex-shrink-0">
                                    <p className="font-medium text-sm sm:text-base">
                                      {formatTime(appointment.startTime)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {appointment.duration}m
                                    </p>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm sm:text-base mb-1 truncate">
                                      {appointment.clientName}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">
                                      {appointment.treatment?.name || 'Tratamiento eliminado'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      con {appointment.professional?.name || 'Profesional eliminado'}
                                    </p>
                                    {appointment.price && (
                                      <Badge variant="secondary" className="text-xs mt-2">
                                        ${appointment.price.toLocaleString()}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-1 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/admin/appointments/${appointment.id}`)}
                                    className="px-2 sm:px-3"
                                    title="Ver detalles"
                                  >
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/admin/appointments/editar/${appointment.id}`)}
                                    className="px-2 sm:px-3"
                                    title="Editar cita"
                                  >
                                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAppointment(appointment.id)}
                                    className="text-destructive hover:text-destructive px-2 sm:px-3"
                                    title="Eliminar cita"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <List className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-base sm:text-lg font-medium mb-2">Lista vacía</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          No hay citas para mostrar en esta fecha
                        </p>
                        <Button onClick={() => router.push('/admin/appointments/new')} size="sm">
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
    </div>
  )
}