// src/app/client/appointments/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '../../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Briefcase, 
  MapPin, 
  Phone, 
  Mail,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Info,
  Navigation,
  CalendarPlus,
  MessageSquare,
  Heart,
  Star,
  FileText
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Separator } from '../../../../components/ui/separator'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Skeleton } from '../../../../components/ui/skeleton'
import { formatDate, formatTime } from '../../../../lib/time-utils'

export default function ClientAppointmentDetail() {
  const router = useRouter()
  const params = useParams()
  const [user, loading, error] = useAuthState(auth)
  const [appointment, setAppointment] = useState(null)
  const [professional, setProfessional] = useState(null)
  const [treatment, setTreatment] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    if (user && params?.id) {
      loadAppointmentDetails()
    }
  }, [user, params?.id])

  const loadAppointmentDetails = async () => {
    if (!user || !params?.id) return

    setLoadingData(true)
    setDataError('')

    try {
      // Cargar la cita
      const appointmentDoc = await getDoc(doc(db, 'appointments', params.id))
      
      if (!appointmentDoc.exists()) {
        setDataError('Cita no encontrada')
        return
      }

      const appointmentData = { id: appointmentDoc.id, ...appointmentDoc.data() }
      
      // Verificar que la cita pertenezca al usuario
      if (appointmentData.clientId !== user.uid) {
        setDataError('No tienes permisos para ver esta cita')
        return
      }

      setAppointment(appointmentData)

      // Cargar datos del profesional
      if (appointmentData.professionalId) {
        try {
          const professionalDoc = await getDoc(doc(db, 'professionals', appointmentData.professionalId))
          if (professionalDoc.exists()) {
            setProfessional(professionalDoc.data())
          }
        } catch (e) {
          console.warn('Error cargando profesional:', e)
        }
      }

      // Cargar datos del tratamiento
      if (appointmentData.treatmentId) {
        try {
          const treatmentDoc = await getDoc(doc(db, 'treatments', appointmentData.treatmentId))
          if (treatmentDoc.exists()) {
            setTreatment(treatmentDoc.data())
          }
        } catch (e) {
          console.warn('Error cargando tratamiento:', e)
        }
      }

    } catch (error) {
      console.error('Error cargando detalles de la cita:', error)
      setDataError('Error cargando los detalles de la cita')
    } finally {
      setLoadingData(false)
    }
  }

  const getAppointmentStatus = () => {
    if (!appointment) return { status: 'unknown', label: 'Desconocido', color: 'bg-gray-100 text-gray-800' }
    
    const now = new Date()
    const appointmentDate = appointment.date.toDate ? appointment.date.toDate() : new Date(appointment.date)
    
    if (appointmentDate.toDateString() === now.toDateString()) {
      const appointmentTime = new Date(`${appointmentDate.toDateString()} ${appointment.startTime}`)
      if (appointmentTime > now) {
        return { status: 'today', label: 'Hoy', color: 'bg-blue-100 text-blue-800', icon: Calendar }
      } else {
        return { status: 'completed', label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      }
    } else if (appointmentDate > now) {
      return { status: 'upcoming', label: 'Próxima', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    } else {
      return { status: 'past', label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
  }

  const handleAddToCalendar = () => {
    if (!appointment) return
    
    const appointmentDate = appointment.date.toDate ? appointment.date.toDate() : new Date(appointment.date)
    const startTime = new Date(`${appointmentDate.toDateString()} ${appointment.startTime}`)
    const endTime = new Date(startTime.getTime() + (appointment.duration || 60) * 60000)
    
    const title = `${appointment.treatmentName || 'Cita'} - Dhermica`
    const details = `Profesional: ${professional?.name || 'Por asignar'}${treatment?.name ? `\nTratamiento: ${treatment.name}` : ''}`
    
    // Generar URL de Google Calendar
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(details)}`
    
    window.open(googleCalendarUrl, '_blank')
  }

  const handleCallProfessional = () => {
    if (professional?.phone) {
      window.location.href = `tel:${professional.phone}`
    }
  }

  const handleEmailProfessional = () => {
    if (professional?.email) {
      window.location.href = `mailto:${professional.email}`
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="p-4 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user || dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">
              {dataError || 'Error de autenticación'}
            </p>
            <Button onClick={() => router.push('/client/appointments')}>
              Volver a Mis Citas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  const status = getAppointmentStatus()
  const appointmentDate = appointment.date.toDate ? appointment.date.toDate() : new Date(appointment.date)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Detalles de la Cita</h1>
                <p className="text-sm text-muted-foreground">
                  {formatDate(appointmentDate, 'EEEE d \'de\' MMMM')}
                </p>
              </div>
            </div>
            
            <Badge className={`${status.color} border-0`}>
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        
        {/* Resumen principal */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    {treatment?.name || appointment.treatmentName || 'Tratamiento'}
                  </h2>
                  <p className="text-muted-foreground">
                    Dr. {professional?.name || 'Profesional por asignar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">
                  {formatDate(appointmentDate, 'dd/MM/yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">Fecha</p>
              </div>
              <div className="p-3 bg-white/50 rounded-lg">
                <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">{appointment.startTime}</p>
                <p className="text-xs text-muted-foreground">Hora</p>
              </div>
              <div className="p-3 bg-white/50 rounded-lg">
                <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">{appointment.duration || 60}min</p>
                <p className="text-xs text-muted-foreground">Duración</p>
              </div>
              <div className="p-3 bg-white/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">
                  ${(appointment.price || treatment?.basePrice || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Precio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Información del Profesional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Tu Profesional</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {professional ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{professional?.name || 'Por asignar'}</h3>
                      <p className="text-sm text-muted-foreground">Profesional a cargo</p>
                    </div>
                  </div>

                  {professional.specialties && professional.specialties.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Especialidades</p>
                      <div className="flex flex-wrap gap-1">
                        {professional.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    {professional.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCallProfessional}
                        className="w-full justify-start"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {professional.phone}
                      </Button>
                    )}
                    {professional.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEmailProfessional}
                        className="w-full justify-start"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {professional.email}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Profesional por asignar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Tratamiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span>Sobre el Tratamiento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatment ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{treatment.name}</h3>
                    <p className="text-sm text-muted-foreground">{treatment.category}</p>
                  </div>

                  {treatment.description && (
                    <p className="text-sm text-muted-foreground">{treatment.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-medium">{treatment.duration}min</p>
                      <p className="text-xs text-muted-foreground">Duración</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-medium">${treatment.basePrice}</p>
                      <p className="text-xs text-muted-foreground">Precio base</p>
                    </div>
                  </div>

                  {treatment.benefits && treatment.benefits.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Beneficios</p>
                      <ul className="text-sm space-y-1">
                        {treatment.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Información del tratamiento no disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preparación y cuidados */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-primary" />
                <span>Preparación y Cuidados</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Antes del Tratamiento</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Llega 10 minutos antes de tu cita</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Evita usar maquillaje en la zona a tratar</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Hidrátate bien el día anterior</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Informa sobre medicamentos o alergias</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Después del Tratamiento</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Aplica protector solar diariamente</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Evita exposición solar directa por 48h</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Mantén la piel hidratada</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Contacta si hay molestias inusuales</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación y contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Ubicación</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Dhermica Centro Estético</p>
                <p className="text-sm text-muted-foreground">Av. Principal 123, Ciudad</p>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://maps.google.com', '_blank')}
                  className="w-full justify-start"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Cómo llegar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = 'tel:+1234567890'}
                  className="w-full justify-start"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar a recepción
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarPlus className="h-5 w-5 text-primary" />
                <span>Acciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleAddToCalendar}
                className="w-full justify-start"
                variant="outline"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Agregar a mi calendario
              </Button>
              
              <Button
                onClick={() => router.push('/treatments')}
                className="w-full justify-start"
                variant="outline"
              >
                <Heart className="h-4 w-4 mr-2" />
                Agendar siguiente cita
              </Button>

              {professional?.phone && (
                <Button
                  onClick={handleCallProfessional}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contactar profesional
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notas de la cita */}
        {appointment.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Notas Especiales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm">{appointment.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recordatorio importante */}
        {status.status === 'upcoming' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Recordatorio:</strong> Si necesitas reagendar o cancelar tu cita, 
              contacta con nosotros con al menos 24 horas de anticipación.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}