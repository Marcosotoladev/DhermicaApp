// src/app/admin/appointments/new/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Calendar, User, Briefcase, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { AppointmentForm } from '../../../../components/custom/AppointmentForm'
import { appointmentService } from '../../../../lib/firebase-services'
import { toast } from 'sonner'

/**
 * Página para crear nueva cita
 * Formulario completo con validación de horarios y restricciones médicas
 */
export default function NewAppointmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  const handleSuccess = async (appointmentData) => {
    setIsSubmitting(true)
    setValidationErrors([])

    try {
      // Crear la cita
      const appointmentId = await appointmentService.create(appointmentData)
      
      toast.success('Cita creada exitosamente', {
        description: `Cita programada para ${appointmentData.clientName}`
      })

      // Redirigir a la lista de citas
      router.push('/admin/appointments')
      
    } catch (error) {
      console.error('Error creating appointment:', error)
      
      if (error.message.includes('Conflicto de horario')) {
        setValidationErrors(['Ya existe una cita en ese horario'])
        toast.error('Conflicto de horario', {
          description: 'Ya hay una cita programada en ese horario'
        })
      } else {
        toast.error('Error al crear la cita', {
          description: 'Ocurrió un error inesperado. Intenta nuevamente.'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar? Se perderán los datos ingresados.')) {
      router.push('/admin/appointments')
    }
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
              onClick={() => router.push('/admin/appointments')}
              className="px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Nueva Cita
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Programa una nueva cita para un cliente
              </p>
            </div>
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
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Información Importante</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start space-x-2">
                <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>El cliente debe estar registrado en el sistema</span>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Los horarios se validarán automáticamente</span>
              </div>
              <div className="flex items-start space-x-2">
                <Briefcase className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Se verificarán las restricciones médicas</span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Los conflictos se mostrarán antes de guardar</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario principal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Detalles de la Cita
            </CardTitle>
            <CardDescription>
              Completa todos los campos para programar la cita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              mode="create"
            />
          </CardContent>
        </Card>

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
              onClick={() => {
                // Trigger submit del formulario
                const form = document.querySelector('form')
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
                }
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cita
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Espacio adicional en móvil para los botones fijos */}
        <div className="h-20 sm:hidden"></div>
      </div>
    </div>
  )
}