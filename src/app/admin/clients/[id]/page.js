// src/app/admin/clients/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Mail, 
  Phone, 
  User, 
  Heart, 
  AlertTriangle, 
  History, 
  Clock,
  MapPin,
  Gift,
  Activity
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Skeleton } from '../../../../components/ui/skeleton'
import { Separator } from '../../../../components/ui/separator'
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { clientService, appointmentService } from '../../../../lib/firebase-services'
import { formatDate } from '../../../../lib/time-utils'
import { toast } from 'sonner'

/**
 * Página de detalle del cliente
 * Muestra información completa y historial de citas
 */
export default function ClientDetailPage({ params }) {
  const router = useRouter()
  const [client, setClient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)

  // Unwrap params Promise
  const resolvedParams = use(params)
  const clientId = resolvedParams.id

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    try {
      // Cargar cliente y citas en paralelo
      const [clientData, appointmentsData] = await Promise.all([
        clientService.getById(clientId),
        appointmentService.getByClient(clientId, null, 50) // Últimas 50 citas
      ])
      
      if (!clientData) {
        toast.error('Cliente no encontrado')
        router.push('/admin/clients')
        return
      }

      setClient(clientData)
      setAppointments(appointmentsData.appointments || [])
    } catch (error) {
      console.error('Error loading client data:', error)
      toast.error('Error al cargar la información del cliente')
      router.push('/admin/clients')
    } finally {
      setLoading(false)
      setAppointmentsLoading(false)
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0
    const today = new Date()
    const birthDate = dateOfBirth.toDate ? dateOfBirth.toDate() : new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const hasMedicalInfo = (medicalInfo) => {
    if (!medicalInfo) return false
    return medicalInfo.diabetes || 
           medicalInfo.cancer || 
           medicalInfo.tattoos || 
           medicalInfo.allergies || 
           medicalInfo.medications || 
           medicalInfo.other
  }

  const getMedicalBadges = (medicalInfo) => {
    const badges = []
    if (medicalInfo?.diabetes) badges.push('Diabetes')
    if (medicalInfo?.cancer) badges.push('Cáncer')
    if (medicalInfo?.tattoos) badges.push('Tatuajes')
    if (medicalInfo?.allergies) badges.push('Alergias')
    if (medicalInfo?.medications) badges.push('Medicamentos')
    return badges
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

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cliente no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El cliente que buscas no existe o ha sido eliminado
            </p>
            <Button onClick={() => router.push('/admin/clients')}>
              Volver a Clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const age = calculateAge(client.dateOfBirth)
  const clientInitials = client.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/clients')}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Clientes</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {clientInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {client.name}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {age} años • Cliente desde {formatDate(client.createdAt?.toDate() || new Date(), 'MMM yyyy')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/appointments/new?clientId=${clientId}`)}
              className="text-primary hover:text-primary"
            >
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Cita</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/clients/editar/${clientId}`)}
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información médica */}
            {hasMedicalInfo(client.medicalInfo) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Información Médica</span>
                  </CardTitle>
                  <CardDescription>
                    Datos importantes para la seguridad de los tratamientos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Condiciones médicas */}
                  <div className="flex flex-wrap gap-2">
                    {getMedicalBadges(client.medicalInfo).map((badge) => (
                      <Badge 
                        key={badge} 
                        variant="outline" 
                        className="border-yellow-300 text-yellow-800 bg-yellow-50"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  {/* Detalles médicos */}
                  <div className="space-y-3">
                    {client.medicalInfo.allergies && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Alergias:</h4>
                        <p className="text-sm text-muted-foreground">{client.medicalInfo.allergies}</p>
                      </div>
                    )}
                    
                    {client.medicalInfo.medications && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Medicamentos:</h4>
                        <p className="text-sm text-muted-foreground">{client.medicalInfo.medications}</p>
                      </div>
                    )}
                    
                    {client.medicalInfo.other && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Otra información:</h4>
                        <p className="text-sm text-muted-foreground">{client.medicalInfo.other}</p>
                      </div>
                    )}
                  </div>

                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Esta información se revisa automáticamente al agendar tratamientos 
                      para garantizar la seguridad del cliente.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Historial de citas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Historial de Citas</span>
                  </div>
                  <Badge variant="outline">
                    {appointments.length} {appointments.length === 1 ? 'cita' : 'citas'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Últimas citas y tratamientos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appointment, index) => (
                      <div key={appointment.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">
                              {appointment.treatmentName || 'Tratamiento'}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              ${appointment.price || 0}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(appointment.date?.toDate?.() || appointment.date, 'dd/MM/yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{appointment.startTime}</span>
                            </div>
                            {appointment.professionalName && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{appointment.professionalName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {appointments.length >= 10 && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/admin/appointments?clientId=${clientId}`)}
                        >
                          Ver todas las citas
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Sin citas registradas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Este cliente aún no tiene citas en el historial
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/admin/appointments/new?clientId=${params.id}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Primera Cita
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            
            {/* Información de contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{client.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-3">
                  <Gift className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                    <p className="font-medium">
                      {formatDate(client.dateOfBirth?.toDate?.() || client.dateOfBirth, 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total de citas</span>
                  </div>
                  <span className="font-bold text-lg">{appointments.length}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Última cita</span>
                  </div>
                  <span className="text-sm font-medium">
                    {appointments.length > 0 
                      ? formatDate(appointments[0]?.date?.toDate?.() || appointments[0]?.date, 'dd/MM/yyyy')
                      : 'Nunca'
                    }
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Info médica</span>
                  </div>
                  <Badge variant={hasMedicalInfo(client.medicalInfo) ? "default" : "secondary"}>
                    {hasMedicalInfo(client.medicalInfo) ? 'Sí' : 'No'}
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
                  onClick={() => router.push(`/admin/appointments/new?clientId=${clientId}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Cita
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/admin/clients/editar/${clientId}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Cliente
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/admin/appointments?clientId=${clientId}`)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Ver Historial Completo
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
                    {formatDate(client.createdAt?.toDate?.() || new Date(), 'dd/MM/yyyy \'a las\' HH:mm')}
                  </p>
                </div>
                
                {client.updatedAt && (
                  <div>
                    <p className="text-muted-foreground">Última actualización:</p>
                    <p className="font-medium">
                      {formatDate(client.updatedAt?.toDate?.() || new Date(), 'dd/MM/yyyy \'a las\' HH:mm')}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-muted-foreground">ID del cliente:</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {client.id}
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