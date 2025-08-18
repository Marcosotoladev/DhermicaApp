// src/app/admin/professionals/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Clock, 
  Star, 
  User, 
  CheckCircle, 
  XCircle,
  Activity,
  BarChart3,
  Settings
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Skeleton } from '../../../../components/ui/skeleton'
import { Separator } from '../../../../components/ui/separator'
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { Switch } from '../../../../components/ui/switch'
import { professionalService, appointmentService } from '../../../../lib/firebase-services'
import { formatTime } from '../../../../lib/time-utils'
import { toast } from 'sonner'

/**
 * Página de detalle del profesional
 * Muestra información completa y estadísticas
 */
export default function ProfessionalDetailPage({ params }) {
  const router = useRouter()
  const [professional, setProfessional] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)

  // Unwrap params Promise
  const resolvedParams = use(params)
  const professionalId = resolvedParams.id

  useEffect(() => {
    loadProfessionalData()
  }, [professionalId])

  const loadProfessionalData = async () => {
    try {
      // Cargar profesional
      const professionalData = await professionalService.getById(professionalId)
      
      if (!professionalData) {
        toast.error('Profesional no encontrado')
        router.push('/admin/professionals')
        return
      }

      setProfessional(professionalData)
      
      // Cargar citas recientes (últimos 30 días)
      try {
        // Simulamos obtener citas del profesional
        // En tu implementación real podrías tener un método específico
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))
        
        // Por ahora usamos un array vacío, pero aquí cargarías las citas reales
        setAppointments([])
      } catch (error) {
        console.error('Error loading appointments:', error)
        setAppointments([])
      }
      
    } catch (error) {
      console.error('Error loading professional data:', error)
      toast.error('Error al cargar la información del profesional')
      router.push('/admin/professionals')
    } finally {
      setLoading(false)
      setAppointmentsLoading(false)
    }
  }

  const toggleAvailability = async () => {
    if (!professional) return
    
    try {
      await professionalService.update(professionalId, { available: !professional.available })
      toast.success(`Profesional ${!professional.available ? 'activado' : 'desactivado'} exitosamente`)
      await loadProfessionalData()
    } catch (error) {
      console.error('Error updating professional availability:', error)
      toast.error('Error al actualizar la disponibilidad')
    }
  }

  const getWorkingDays = (workingHours) => {
    if (!workingHours) return []
    
    const dayNames = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles', 
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    }
    
    return Object.entries(workingHours)
      .filter(([_, schedule]) => schedule?.active)
      .map(([day, schedule]) => ({
        day: dayNames[day],
        schedule: `${schedule.start} - ${schedule.end}`
      }))
  }

  const getWorkingHoursRange = (workingHours) => {
    if (!workingHours) return 'Sin horarios'
    
    const activeDays = Object.values(workingHours).filter(day => day && day.active)
    if (activeDays.length === 0) return 'Sin horarios'
    
    const earliestStart = activeDays.reduce((earliest, day) => 
      day.start < earliest ? day.start : earliest, '23:59')
    const latestEnd = activeDays.reduce((latest, day) => 
      day.end > latest ? day.end : latest, '00:00')
    
    return `${earliestStart} - ${latestEnd}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-20" />
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
            
            {/* Content skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(2)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profesional no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El profesional que buscas no existe o ha sido eliminado
            </p>
            <Button onClick={() => router.push('/admin/professionals')}>
              Volver a Profesionales
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const professionalInitials = professional.name.split(' ').map(n => n[0]).join('').toUpperCase()
  const workingDays = getWorkingDays(professional.workingHours || {})

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/professionals')}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Profesionales</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {professionalInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {professional.name}
                  </h1>
                  <Badge 
                    variant={professional.available !== false ? "default" : "secondary"}
                    className={professional.available !== false 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-gray-100 text-gray-600 border-gray-200"
                    }
                  >
                    {professional.available !== false ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Disponible
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        No disponible
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {professional.specialties?.length || 0} especialidades • {workingDays.length} días laborales
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Disponible</span>
              <Switch
                checked={professional.available !== false}
                onCheckedChange={toggleAvailability}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/appointments/new?professionalId=${professionalId}`)}
              className="text-primary hover:text-primary"
            >
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Cita</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/professionals/editar/${professionalId}`)}
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Especialidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Especialidades</span>
                </CardTitle>
                <CardDescription>
                  Tratamientos que puede realizar este profesional
                </CardDescription>
              </CardHeader>
              <CardContent>
                {professional.specialties && professional.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {professional.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="px-3 py-1">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay especialidades definidas</p>
                )}
              </CardContent>
            </Card>

            {/* Horarios de trabajo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Horarios de Trabajo</span>
                </CardTitle>
                <CardDescription>
                  Días y horarios disponibles para citas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workingDays.length > 0 ? (
                  <div className="space-y-3">
                    {workingDays.map((workingDay, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="font-medium">{workingDay.day}</span>
                        <Badge variant="outline">{workingDay.schedule}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay horarios de trabajo configurados</p>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas de citas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Estadísticas Recientes</span>
                </CardTitle>
                <CardDescription>
                  Actividad de los últimos 30 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{appointments.length}</p>
                      <p className="text-sm text-muted-foreground">Citas este mes</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">-</p>
                      <p className="text-sm text-muted-foreground">Horas trabajadas</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">-</p>
                      <p className="text-sm text-muted-foreground">Rating promedio</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            
            {/* Información rápida */}
            <Card>
              <CardHeader>
                <CardTitle>Información Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Especialidades</span>
                  </div>
                  <span className="font-medium">
                    {professional.specialties?.length || 0}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Días laborales</span>
                  </div>
                  <span className="font-medium">
                    {workingDays.length} días
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Horario general</span>
                  </div>
                  <span className="font-medium text-sm">
                    {getWorkingHoursRange(professional.workingHours || {})}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Estado</span>
                  </div>
                  <Badge variant={professional.available !== false ? "default" : "secondary"}>
                    {professional.available !== false ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/admin/appointments/new?professionalId=${professionalId}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Cita
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/admin/professionals/editar/${professionalId}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Profesional
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/admin/appointments?professionalId=${professionalId}`)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Todas las Citas
                </Button>
              </CardContent>
            </Card>

            {/* Configuración rápida */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configuración</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Disponible para citas</span>
                  <Switch
                    checked={professional.available !== false}
                    onCheckedChange={toggleAvailability}
                  />
                </div>
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push(`/admin/professionals/editar/${professionalId}`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Horarios
                </Button>
              </CardContent>
            </Card>

            {/* Información del sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Registrado el:</p>
                  <p className="font-medium">
                    {professional.createdAt?.toDate?.()?.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) || 'No disponible'}
                  </p>
                </div>
                
                {professional.updatedAt && (
                  <div>
                    <p className="text-muted-foreground">Última actualización:</p>
                    <p className="font-medium">
                      {professional.updatedAt?.toDate?.()?.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || 'No disponible'}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-muted-foreground">ID del profesional:</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {professional.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}