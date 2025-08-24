// src/app/admin/professionals/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Clock,
  Star,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Award,
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Settings,
  Plus,
  AlertCircle,
  Camera,
  Save,
  CalendarX,
  CalendarPlus
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar'
import { Skeleton } from '../../../../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Switch } from '../../../../components/ui/switch'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Separator } from '../../../../components/ui/separator'
import { professionalService } from '../../../../lib/firebase-services'
import ProfessionalReviewsSystem from '../../../../components/reviews/ProfessionalReviewsSystem'
import ScheduleExceptionsManager from '../../../../components/admin/ScheduleExceptionsManager'
import { toast } from "sonner" // si ya usas toasts
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../../../lib/firebase" // ajustá el path según tu proyecto

export default function AdminProfessionalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const id = params.id

  useEffect(() => {
    if (params.id) {
      loadProfessional()
    }
  }, [params.id])

  const handleUpdateExceptions = async (updatedExceptions) => {
    try {
      const professionalRef = doc(db, "professionals", id)
      await updateDoc(professionalRef, { exceptions: updatedExceptions })
      
      // Actualizar el estado local para que se reflejen los cambios inmediatamente
      setProfessional(prev => ({
        ...prev,
        exceptions: updatedExceptions
      }))
      
      console.log("Excepciones actualizadas en Firestore")
      // Opcional: mostrar toast de éxito
      // toast.success("Excepciones actualizadas correctamente")
    } catch (error) {
      console.error("Error al actualizar excepciones:", error)
      // Opcional: mostrar toast de error
      // toast.error("Error al actualizar las excepciones")
    }
  }

  const loadProfessional = async () => {
    setLoading(true)
    try {
      const data = await professionalService.getWithReviews(params.id)
      setProfessional(data)
      console.log('Professional loaded:', data) // Debug log
      console.log('Exceptions:', data?.exceptions) // Debug log específico para excepciones
    } catch (error) {
      console.error('Error loading professional:', error)
      // Fallback
      try {
        const fallbackData = await professionalService.getById(params.id)
        setProfessional(fallbackData)
        console.log('Professional loaded (fallback):', fallbackData) // Debug log
        console.log('Exceptions (fallback):', fallbackData?.exceptions) // Debug log
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        alert('Error al cargar el profesional')
        router.push('/admin/professionals')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAvailability = async () => {
    setUpdating(true)
    try {
      const newStatus = !professional.available
      await professionalService.update(params.id, { available: newStatus })
      setProfessional(prev => ({ ...prev, available: newStatus }))
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Error al actualizar la disponibilidad')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${professional.name}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await professionalService.delete(params.id)
      alert('Profesional eliminado exitosamente')
      router.push('/admin/professionals')
    } catch (error) {
      console.error('Error deleting professional:', error)
      alert('Error al eliminar el profesional')
    }
  }

  const getWorkingDaysCount = (professional) => {
    if (!professional?.baseSchedule) return 0
    return Object.values(professional.baseSchedule).filter(day => day?.active).length
  }

  const getScheduleSummary = (professional) => {
    if (!professional?.baseSchedule) return 'Sin horarios configurados'

    const dayNames = {
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
      thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom'
    }

    const activeDays = Object.entries(professional.baseSchedule)
      .filter(([_, schedule]) => schedule.active)
      .map(([day, schedule]) => {
        const workBlocks = schedule.blocks?.filter(b => b.type === 'work') || []
        if (workBlocks.length > 0) {
          const firstBlock = workBlocks[0]
          const lastBlock = workBlocks[workBlocks.length - 1]
          return `${dayNames[day]}: ${firstBlock.start}-${lastBlock.end}`
        }
        return `${dayNames[day]}: Sin horarios`
      })

    return activeDays.length > 0 ? activeDays : ['Sin días activos']
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
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
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profesional no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El profesional que buscas no existe o fue eliminado.
            </p>
            <Button onClick={() => router.push('/admin/professionals')}>
              Volver a Profesionales
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/professionals')}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{professional.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground flex items-center space-x-2">
                <Badge variant={professional.available ? "default" : "secondary"}>
                  {professional.available ? 'Disponible' : 'No disponible'}
                </Badge>
                {professional.totalReviews > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{professional.averageRating} ({professional.totalReviews} reseñas)</span>
                    </div>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={professional.available}
              onCheckedChange={handleToggleAvailability}
              disabled={updating}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/professionals/editar/${params.id}`)}
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Professional Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <Avatar className="h-24 w-24">
                    {professional.profilePhoto?.base64 ? (
                      <AvatarImage
                        src={professional.profilePhoto.base64}
                        alt={professional.name}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {professional.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {professional.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{professional.phone}</span>
                        </div>
                      )}
                      {professional.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{professional.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Reservas hasta {professional.advanceBookingDays || 30} días
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getWorkingDaysCount(professional)} días laborales
                        </span>
                      </div>
                    </div>

                    {professional.description && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          {professional.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for detailed content */}
            <Tabs defaultValue="treatments" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-auto">
                <TabsTrigger value="treatments" className="text-xs sm:text-sm px-1 sm:px-3">
                  <span className="truncate">Tratamientos</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-xs sm:text-sm px-1 sm:px-3">
                  <span className="truncate">Horarios</span>
                </TabsTrigger>
                <TabsTrigger value="exceptions" className="text-xs sm:text-sm px-1 sm:px-3 relative">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="truncate">Excepciones</span>
                    {professional.exceptions && professional.exceptions.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 min-w-0">
                        {professional.exceptions.length}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs sm:text-sm px-1 sm:px-3">
                  <span className="truncate">Reseñas</span>
                </TabsTrigger>
              </TabsList>

              {/* Treatments Tab */}
              <TabsContent value="treatments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span>Tratamientos Disponibles ({professional.availableTreatments?.length || 0})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {professional.availableTreatments?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {professional.availableTreatments.map((treatment, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{treatment.name}</h4>
                              {treatment.certified && (
                                <Badge variant="secondary">
                                  <Award className="h-3 w-3 mr-1" />
                                  Certificado
                                </Badge>
                              )}
                            </div>
                            {treatment.experience && (
                              <p className="text-sm text-muted-foreground mb-1">
                                <strong>Experiencia:</strong> {treatment.experience}
                              </p>
                            )}
                            {treatment.notes && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Notas:</strong> {treatment.notes}
                              </p>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Este profesional no tiene tratamientos configurados.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Horarios Base</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {professional.baseSchedule ? (
                      <div className="space-y-3">
                        {getScheduleSummary(professional).map((daySchedule, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                            <span className="text-sm">{daySchedule}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No hay horarios base configurados.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Exceptions Tab */}
              <TabsContent value="exceptions" className="space-y-4">
                <ScheduleExceptionsManager
                  professionalId={params.id}
                  exceptions={professional.exceptions || []} // 🔥 CLAVE: Pasar las excepciones del profesional
                  onUpdate={handleUpdateExceptions}
                />
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-4">
                <ProfessionalReviewsSystem
                  professionalId={params.id}
                  isAdmin={true}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Stats & Quick Actions */}
          <div className="space-y-6">

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {professional.totalReviews || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Reseñas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {professional.averageRating || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {professional.availableTreatments?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Tratamientos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {getWorkingDaysCount(professional)}
                    </div>
                    <div className="text-xs text-muted-foreground">Días activos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/professionals/editar/${params.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Información
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/appointments/new?professional=${params.id}`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cita
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleToggleAvailability}
                  disabled={updating}
                >
                  {professional.available ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {professional.available ? 'Marcar No Disponible' : 'Marcar Disponible'}
                </Button>
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuraciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reserva Online</span>
                  <Badge variant={professional.acceptsOnlineBooking ? "default" : "secondary"}>
                    {professional.acceptsOnlineBooking ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Días de Anticipación</span>
                  <Badge variant="outline">
                    {professional.advanceBookingDays || 30} días
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Foto de Perfil</span>
                  <Badge variant={professional.profilePhoto ? "default" : "secondary"}>
                    {professional.profilePhoto ? 'Configurada' : 'Sin foto'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Excepciones de Horario</span>
                  <Badge variant={professional.exceptions?.length > 0 ? "default" : "secondary"}>
                    {professional.exceptions?.length || 0} configuradas
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}