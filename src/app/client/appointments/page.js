// src/app/client/appointments/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  ArrowLeft,
  Filter,
  ChevronDown,
  TrendingUp,
  MoreVertical,
  X,
  AlertCircle,
  Plus,
  CheckCircle,
  Star
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Skeleton } from '../../../components/ui/skeleton'
import { useAuthStore } from '../../../store/auth'
import { appointmentService, treatmentService, professionalService } from '../../../lib/firebase-services'
import { formatDate, formatTime, formatDateTime } from '../../../lib/time-utils'

/**
 * Página de citas del cliente - Optimizada para móvil
 * Muestra todas las citas (pasadas y futuras) del cliente
 */
export default function ClientAppointmentsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'upcoming', 'past'
  const [showStats, setShowStats] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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

      // VALIDAR QUE SEA UN ARRAY
      if (!Array.isArray(appointmentsData)) {
        console.log('No appointments found or invalid data format')
        setAppointments([])
        return
      }

      // Enriquecer con datos de tratamientos y profesionales
      const enrichedAppointments = await Promise.all(
        appointmentsData.map(async (appointment) => {
          let treatment = null
          let professional = null

          try {
            if (appointment.treatmentId) {
              treatment = await treatmentService.getById(appointment.treatmentId)
            }
          } catch (e) {
            console.warn('Error loading treatment:', e)
          }

          try {
            if (appointment.professionalId) {
              professional = await professionalService.getById(appointment.professionalId)
            }
          } catch (e) {
            console.warn('Error loading professional:', e)
          }

          const appointmentDate = appointment.date.toDate ? appointment.date.toDate() : new Date(appointment.date)

          return {
            ...appointment,
            treatment,
            professional,
            appointmentDate,
            isPast: appointmentDate < new Date()
          }
        })
      )

      // Ordenar por fecha (más recientes primero)
      enrichedAppointments.sort((a, b) => b.appointmentDate - a.appointmentDate)

      setAppointments(enrichedAppointments)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([]) // ASEGURAR QUE SIEMPRE SEA UN ARRAY
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
        color: 'text-muted-foreground',
        bgColor: 'bg-green-100 text-green-800'
      }
    } else {
      const today = new Date()
      const diffTime = appointment.appointmentDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return {
          label: 'Hoy',
          variant: 'default',
          color: 'text-primary',
          bgColor: 'bg-primary text-primary-foreground'
        }
      } else if (diffDays === 1) {
        return {
          label: 'Mañana',
          variant: 'outline',
          color: 'text-warning',
          bgColor: 'bg-yellow-100 text-yellow-800'
        }
      } else if (diffDays <= 7) {
        return {
          label: `En ${diffDays} días`,
          variant: 'outline',
          color: 'text-success',
          bgColor: 'bg-blue-100 text-blue-800'
        }
      } else {
        return {
          label: 'Próxima',
          variant: 'outline',
          color: 'text-muted-foreground',
          bgColor: 'bg-gray-100 text-gray-600'
        }
      }
    }
  }

  const upcomingCount = appointments.filter(apt => !apt.isPast).length
  const pastCount = appointments.filter(apt => apt.isPast).length
  const totalSpent = appointments
    .filter(apt => apt.isPast && apt.price)
    .reduce((sum, apt) => sum + apt.price, 0)

  // Loading state optimizado
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">

      {/* Header optimizado para móvil y desktop */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/client/dashboard')}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">Mis Citas</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Historial completo de tus citas en Dhermica
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Mobile Stats */}
              <Sheet open={showStats} onOpenChange={setShowStats}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[60vh]">
                  <SheetHeader>
                    <SheetTitle>Estadísticas de Citas</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold">{appointments.length}</p>
                          <p className="text-xs text-muted-foreground">Total citas</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{upcomingCount}</p>
                          <p className="text-xs text-muted-foreground">Próximas</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{pastCount}</p>
                          <p className="text-xs text-muted-foreground">Completadas</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                          <p className="text-lg font-bold">${totalSpent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total invertido</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Mobile Filters */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Personaliza la vista de tus citas
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Mostrar citas
                      </label>
                      <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las citas</SelectItem>
                          <SelectItem value="upcoming">Próximas</SelectItem>
                          <SelectItem value="past">Completadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filter !== 'all' && (
                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setFilter('all')}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Mostrar todas
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/treatments')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva cita
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/client/dashboard')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al dashboard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* Estadísticas compactas - Mobile */}
        <div className="grid grid-cols-2 gap-4 sm:hidden">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold">{appointments.length}</p>
              <p className="text-xs text-muted-foreground">Total citas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xl font-bold">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Próximas</p>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Statistics and Filter */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <Clock className="h-5 w-5 text-blue-600" />
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
                <CheckCircle className="h-5 w-5 text-green-600" />
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

        {/* Mobile Filter */}
        <div className="sm:hidden">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {filter === 'all' ? 'Todas las citas' :
                    filter === 'upcoming' ? 'Próximas' : 'Completadas'}
                </span>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de citas optimizada */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const status = getAppointmentStatus(appointment)

              return (
                <Card key={appointment.id} className={`hover:shadow-md transition-shadow ${appointment.isPast ? 'opacity-75' : ''
                  }`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">

                        {/* Header de la cita - Mobile optimized */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="text-center flex-shrink-0">
                              <p className="text-lg font-bold">
                                {formatDate(appointment.appointmentDate, 'dd')}
                              </p>
                              <p className="text-xs text-muted-foreground uppercase">
                                {formatDate(appointment.appointmentDate, 'MMM')}
                              </p>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-semibold truncate">
                                {appointment.treatment?.name || 'Tratamiento eliminado'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(appointment.appointmentDate, 'EEEE d \'de\' MMMM')}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${status.bgColor} text-xs flex-shrink-0`}>
                            {status.label}
                          </Badge>
                        </div>

                        {/* Detalles de la cita - Mobile grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-muted-foreground text-xs">Horario</p>
                              <p className="font-medium truncate">
                                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-muted-foreground text-xs">Profesional</p>
                              <p className="font-medium truncate">
                                {appointment.professional?.name || 'No asignado'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-muted-foreground text-xs">Duración</p>
                              <p className="font-medium">{appointment.duration} min</p>
                            </div>
                          </div>
                        </div>

                        {/* Información adicional - Mobile optimized */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-border">
                          <div className="flex flex-wrap items-center gap-2">
                            {appointment.treatment?.category && (
                              <Badge variant="outline" className="text-xs">
                                {appointment.treatment.category}
                              </Badge>
                            )}
                            {appointment.price && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">$</span>
                                <span className="font-medium text-green-600">
                                  {appointment.price.toLocaleString()}
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

                        {/* Descripción del tratamiento - Solo desktop o si es importante */}
                        {appointment.treatment?.description && (
                          <div className="pt-2 border-t border-border hidden sm:block">
                            <p className="text-sm text-muted-foreground line-clamp-2">
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
            <CardContent className="p-8 sm:p-12 text-center">
              <Calendar className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {filter === 'upcoming' ? 'No tienes citas próximas' :
                  filter === 'past' ? 'No tienes historial de citas' :
                    'No tienes citas registradas'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filter === 'upcoming' ? 'Agenda tu próxima cita para seguir cuidando tu bienestar' :
                  filter === 'past' ? 'Una vez que completes tu primera cita aparecerá aquí' :
                    'Comienza tu experiencia en Dhermica agendando tu primera cita'}
              </p>
              <Button onClick={() => router.push('/treatments')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Explorar Tratamientos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Espaciado inferior */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}