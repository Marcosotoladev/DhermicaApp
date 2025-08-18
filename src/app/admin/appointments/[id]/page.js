// src/app/admin/appointments/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, User, Clock, Briefcase, DollarSign, Phone, Mail, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Separator } from '../../../../components/ui/separator'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { appointmentService, clientService, professionalService, treatmentService } from '../../../../lib/firebase-services'
import { formatDate, formatDuration } from '../../../../lib/time-utils'
import { toast } from 'sonner'

/**
 * Página para ver detalles de una cita (solo lectura)
 * Vista completa con toda la información de la cita
 */
export default function AppointmentDetailPage() {
  const router = useRouter()
  const params = useParams() // 👈 Importante: obtener el id desde aquí
  const [appointment, setAppointment] = useState(null)
  const [client, setClient] = useState(null)
  const [professional, setProfessional] = useState(null)
  const [treatment, setTreatment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (params?.id) {
      loadAppointmentDetails(params.id)
    }
  }, [params?.id])

  const loadAppointmentDetails = async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      // Cargar la cita
      const appointmentData = await appointmentService.getById(id)
      
      if (!appointmentData) {
        setError('Cita no encontrada')
        return
      }
      
      setAppointment(appointmentData)

      // Cargar datos relacionados en paralelo
      const [clientData, professionalData, treatmentData] = await Promise.all([
        appointmentData.clientId ? clientService.getById(appointmentData.clientId) : null,
        appointmentData.professionalId ? professionalService.getById(appointmentData.professionalId) : null,
        appointmentData.treatmentId ? treatmentService.getById(appointmentData.treatmentId) : null
      ])

      setClient(clientData)
      setProfessional(professionalData)
      setTreatment(treatmentData)
      
    } catch (error) {
      console.error('Error loading appointment details:', error)
      setError('Error al cargar los detalles de la cita')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/admin/appointments/editar/${params.id}`)
  }

  const handleDelete = async () => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar la cita de ${appointment?.clientName}?\n\nEsta acción no se puede deshacer.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)

    try {
      await appointmentService.delete(params.id)
      
      toast.success('Cita eliminada exitosamente', {
        description: 'La cita ha sido eliminada del sistema'
      })

      router.push('/admin/appointments')
      
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error('Error al eliminar la cita', {
        description: 'Ocurrió un error inesperado. Intenta nuevamente.'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando detalles de la cita...</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error || 'No se pudo cargar la cita'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push('/admin/appointments')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Citas
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const appointmentDate = appointment.date?.toDate?.() || appointment.date

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/appointments')}
              className="px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Detalles de la Cita
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Información completa de la cita programada
              </p>
            </div>
          </div>
          
          {/* Acciones - Desktop */}
          <div className="hidden sm:flex space-x-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              size="sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resumen de la Cita */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Información de la Cita</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                    <p className="text-lg font-semibold">
                      {formatDate(appointmentDate, "EEEE d 'de' MMMM 'de' yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Horario</p>
                    <p className="text-lg font-semibold">
                      {appointment.startTime} - {appointment.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duración</p>
                    <p className="text-lg font-semibold">
                      {formatDuration(appointment.duration)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <Badge variant="default" className="text-sm">
                      Programada
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Información del Cliente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-lg font-semibold">{client.name}</p>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{client.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    </div>
                    
                    {/* Información médica */}
                    {client.medicalInfo && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Información Médica</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {client.medicalInfo.diabetes && <Badge variant="outline">Diabetes</Badge>}
                          {client.medicalInfo.cancer && <Badge variant="outline">Cáncer</Badge>}
                          {client.medicalInfo.tattoos && <Badge variant="outline">Tatuajes</Badge>}
                        </div>
                        {client.medicalInfo.allergies && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <strong>Alergias:</strong> {client.medicalInfo.allergies}
                          </p>
                        )}
                        {client.medicalInfo.medications && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Medicamentos:</strong> {client.medicalInfo.medications}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Cliente: {appointment.clientName}</p>
                    <p className="text-xs text-muted-foreground">Información detallada no disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tratamiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span>Tratamiento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {treatment ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-lg font-semibold">{treatment.name}</p>
                      <p className="text-sm text-muted-foreground">{treatment.category}</p>
                    </div>
                    
                    {treatment.description && (
                      <p className="text-sm">{treatment.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{treatment.duration} minutos</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Precio base: ${treatment.basePrice}</span>
                      </div>
                    </div>

                    {treatment.medicalRestrictions && treatment.medicalRestrictions.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Restricciones Médicas</p>
                        <div className="flex flex-wrap gap-1">
                          {treatment.medicalRestrictions.map((restriction, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Tratamiento no disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profesional */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profesional</CardTitle>
              </CardHeader>
              <CardContent>
                {professional ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">{professional.name}</p>
                      <p className="text-sm text-muted-foreground">Profesional a cargo</p>
                    </div>
                    
                    {professional.specialties && professional.specialties.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Especialidades</p>
                        <div className="flex flex-wrap gap-1">
                          {professional.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Información no disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Precio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Precio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Precio base:</span>
                    <span className="text-sm">${treatment?.basePrice || 0}</span>
                  </div>
                  {appointment.price && appointment.price !== treatment?.basePrice && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Precio acordado:</span>
                      <span className="text-sm font-medium">${appointment.price}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">
                      ${appointment.price || treatment?.basePrice || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadatos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <strong>ID:</strong> {appointment.id}
                </div>
                <div>
                  <strong>Creado:</strong> {appointment.createdAt ? formatDate(appointment.createdAt.toDate?.() || appointment.createdAt, 'dd/MM/yyyy HH:mm') : 'N/A'}
                </div>
                {appointment.updatedAt && (
                  <div>
                    <strong>Actualizado:</strong> {formatDate(appointment.updatedAt.toDate?.() || appointment.updatedAt, 'dd/MM/yyyy HH:mm')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Acciones móvil */}
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </Button>
          </div>
        </div>

        {/* Espacio para botones móviles */}
        <div className="h-20 sm:hidden"></div>
      </div>
    </div>
  )
}
