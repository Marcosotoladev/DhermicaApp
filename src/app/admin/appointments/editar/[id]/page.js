// src/app/admin/appointments/editar/[id]/page.js
'use client'

import { use, useState, useEffect } from 'react'   // 👈 agregado use
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { AppointmentForm } from '../../../../../components/custom/AppointmentForm'
import { appointmentService } from '../../../../../lib/firebase-services'
import { toast } from 'sonner'

/**
 * Página para editar cita existente
 * Ruta: /admin/appointments/editar/[id]
 */
export default function EditAppointmentPage({ params }) {
  const router = useRouter()

  // ✅ resolver params correctamente
  const { id } = use(params)

  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAppointment()
  }, [id])

  const loadAppointment = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const appointmentData = await appointmentService.getById(id)
      
      if (!appointmentData) {
        setError('Cita no encontrada')
        return
      }
      
      setAppointment(appointmentData)
      
    } catch (error) {
      console.error('Error loading appointment:', error)
      setError('Error al cargar la cita')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = async (appointmentData) => {
    setIsSubmitting(true)
    setValidationErrors([])

    try {
      await appointmentService.update(id, appointmentData)
      
      toast.success('Cita actualizada exitosamente', {
        description: `Cita de ${appointmentData.clientName} actualizada`
      })

      // Redirigir a la vista de detalles
      router.push(`/admin/appointments/${id}`)
      
    } catch (error) {
      console.error('Error updating appointment:', error)
      
      if (error.message.includes('Conflicto de horario')) {
        setValidationErrors(['Ya existe una cita en ese horario'])
        toast.error('Conflicto de horario', {
          description: 'Ya hay una cita programada en ese horario'
        })
      } else {
        toast.error('Error al actualizar la cita', {
          description: 'Ocurrió un error inesperado. Intenta nuevamente.'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.')) {
      router.push(`/admin/appointments/${id}`)
    }
  }

  const viewDetails = () => {
    router.push(`/admin/appointments/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando cita...</p>
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
          <div className="mt-6 flex space-x-2">
            <Button onClick={() => router.push('/admin/appointments')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Citas
            </Button>
            {id && (
              <Button variant="outline" onClick={viewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalles
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={viewDetails}
              className="px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Editar Cita
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Modifica los detalles de la cita de {appointment.clientName}
              </p>
            </div>
          </div>
          
          {/* Botón ver detalles - Desktop */}
          <div className="hidden sm:block">
            <Button
              variant="outline"
              onClick={viewDetails}
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalles
            </Button>
          </div>
        </div>

        {/* Errores de validación */}
        {validationErrors.length > 0 && (
          <Alert className="mb-6 border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Información importante */}
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Editando Cita Existente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="font-medium text-muted-foreground">Cliente actual:</span>
                <p className="font-medium">{appointment.clientName}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Fecha actual:</span>
                <p className="font-medium">
                  {appointment.date?.toDate?.()?.toLocaleDateString() || 
                   new Date(appointment.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Horario actual:</span>
                <p className="font-medium">{appointment.startTime} - {appointment.endTime}</p>
              </div>
            </div>
            <p className="text-xs text-amber-700 mt-3">
              Los cambios de horario se validarán automáticamente para evitar conflictos.
            </p>
          </CardContent>
        </Card>

        {/* Formulario de edición */}
        <AppointmentForm
          initialData={appointment}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          mode="edit"
        />

        {/* Acciones adicionales - Solo móvil */}
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={viewDetails}
              className="flex-1"
              disabled={isSubmitting}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalles
            </Button>
          </div>
        </div>

        {/* Espacio adicional en móvil para los botones fijos */}
        <div className="h-20 sm:hidden"></div>
      </div>
    </div>
  )
}
