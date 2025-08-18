// src/components/custom/AppointmentForm.js
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Calendar,
  Clock, 
  User, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Loader2,
  DollarSign,
  Heart,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Separator } from '../ui/separator'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ClientSearch } from './ClientSearch'
import { TimeSlotPicker } from './TimeSlotPicker'
import { MedicalValidation, useMedicalValidation } from './MedicalValidation'

// Servicios optimizados
import { 
  professionalServiceOptimized, 
  treatmentServiceOptimized, 
  appointmentServiceOptimized 
} from '../../lib/firebase-services-optimized'

// Hooks de performance
import { 
  useDebounce, 
  useOnlineStatus, 
  usePerformanceMonitor,
  useErrorHandler,
  useLazyLoad 
} from '../../hooks/use-performance'

// Servicio de notificaciones
import notificationService, { useNotifications } from '../../lib/notification-service'

import { formatDate, formatTimeString, timeToMinutes, minutesToTime } from '../../lib/time-utils'

// Schema de validación optimizado
const appointmentSchema = z.object({
  professionalId: z.string().min(1, 'Profesional requerido'),
  clientId: z.string().min(1, 'Cliente requerido'),
  treatmentId: z.string().min(1, 'Tratamiento requerido'),
  date: z.date({ required_error: 'Fecha requerida' }),
  startTime: z.string().min(1, 'Horario requerido'),
  duration: z.number().min(15, 'Duración mínima 15 minutos'),
  price: z.number().optional(),
  notes: z.string().optional()
})

/**
 * Formulario de Citas Optimizado con Performance y PWA
 */
export function AppointmentFormOptimized({ 
  onSuccess, 
  editingAppointment = null,
  onCancel 
}) {
  // Estados principales
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [professionals, setProfessionals] = useState([])
  const [treatments, setTreatments] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [calculatedEndTime, setCalculatedEndTime] = useState('')
  const [totalSteps] = useState(4)

  // Hooks de optimización
  const { isOnline, isFirebaseOnline } = useOnlineStatus()
  const { executeWithRetry, error: retryError, retryCount } = useErrorHandler()
  const { notify } = useNotifications()
  const { elementRef: formRef, shouldRender } = useLazyLoad()
  
  // Performance monitoring
  usePerformanceMonitor('AppointmentFormOptimized')

  // Validación médica optimizada
  const {
    validation: medicalValidation,
    loading: medicalLoading,
    hasWarnings: hasMedicalWarnings
  } = useMedicalValidation(selectedClient?.id, selectedTreatment?.id)

  // Form con validación optimizada
  const form = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      professionalId: '',
      clientId: '',
      treatmentId: '',
      date: new Date(),
      startTime: '',
      duration: 60,
      price: 0,
      notes: ''
    },
    mode: 'onChange' // Validación en tiempo real
  })

  // Debounce de los valores del formulario para validación
  const formValues = form.watch()
  const debouncedFormValues = useDebounce(formValues, 300)

  // Datos memoizados para performance
  const availableProfessionals = useMemo(() => {
    return professionals.filter(p => p.available)
  }, [professionals])

  const availableTreatments = useMemo(() => {
    return treatments.filter(t => t.active)
  }, [treatments])

  // Efectos optimizados
  useEffect(() => {
    if (shouldRender) {
      loadInitialData()
    }
  }, [shouldRender])

  useEffect(() => {
    if (editingAppointment) {
      loadEditingData()
    }
  }, [editingAppointment])

  // Notificar cambios de conexión
  useEffect(() => {
    if (!isOnline) {
      notificationService.notifyConnectionError()
    } else if (isOnline && !isFirebaseOnline) {
      notify('warning', 'Conectando con el servidor...', { duration: 2000 })
    } else if (isOnline && isFirebaseOnline && retryCount > 0) {
      notificationService.notifyConnectionRestored()
    }
  }, [isOnline, isFirebaseOnline, retryCount])

  const loadInitialData = async () => {
    try {
      const [professionalsData, treatmentsData] = await executeWithRetry(async () => {
        return Promise.all([
          professionalServiceOptimized.getAll(true), // usar caché
          treatmentServiceOptimized.getAll(true)
        ])
      })
      
      setProfessionals(professionalsData)
      setTreatments(treatmentsData)
      
      console.log('Datos cargados desde caché:', {
        professionals: professionalsData.length,
        treatments: treatmentsData.length
      })
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Error cargando datos. Verificando conexión...')
      
      if (!isOnline) {
        notify('error', 'Sin conexión a internet', {
          description: 'Verifica tu conexión y reintenta'
        })
      }
    }
  }

  const loadEditingData = async () => {
    try {
      if (editingAppointment.clientId) {
        const client = await executeWithRetry(() => 
          clientServiceOptimized.getById(editingAppointment.clientId)
        )
        setSelectedClient(client)
        form.setValue('clientId', client.id)
      }

      if (editingAppointment.treatmentId) {
        const treatment = await executeWithRetry(() =>
          treatmentServiceOptimized.getById(editingAppointment.treatmentId)
        )
        setSelectedTreatment(treatment)
        form.setValue('treatmentId', treatment.id)
      }

      // Cargar otros valores
      Object.keys(editingAppointment).forEach(key => {
        if (form.getValues()[key] !== undefined) {
          form.setValue(key, editingAppointment[key])
        }
      })

      console.log('Datos de edición cargados:', editingAppointment)
    } catch (error) {
      console.error('Error loading editing data:', error)
      notify('error', 'Error cargando datos de la cita')
    }
  }

  // Handlers optimizados
  const handleClientSelect = (client) => {
    console.log('Cliente seleccionado:', client)
    setSelectedClient(client)
    form.setValue('clientId', client.id)
    
    // Trigger para validación médica
    if (selectedTreatment) {
      notify('info', 'Validando restricciones médicas...', { duration: 2000 })
    }
  }

  const handleTreatmentSelect = (treatmentId) => {
    const treatment = treatments.find(t => t.id === treatmentId)
    console.log('Tratamiento seleccionado:', treatment)
    
    setSelectedTreatment(treatment)
    form.setValue('treatmentId', treatmentId)
    
    if (treatment) {
      form.setValue('duration', treatment.duration || 60)
      form.setValue('price', treatment.basePrice || 0)
      
      // Mostrar información del tratamiento
      notify('success', `Tratamiento seleccionado: ${treatment.name}`, {
        description: `Duración: ${treatment.duration}min - Precio: $${treatment.basePrice}`,
        duration: 3000
      })
    }
  }

  const handleTimeSelect = (time) => {
    console.log('Horario seleccionado:', time)
    form.setValue('startTime', time)
    
    // Calcular hora de fin
    const duration = form.getValues('duration')
    const startMinutes = timeToMinutes(time)
    const endTime = minutesToTime(startMinutes + duration)
    setCalculatedEndTime(endTime)

    notify('info', `Horario: ${formatTimeString(time)} - ${endTime}`, {
      duration: 2000
    })
  }

  // Validación de pasos optimizada
  const validateCurrentStep = async () => {
    const values = form.getValues()
    
    switch (currentStep) {
      case 1: // Profesional y fecha
        return values.professionalId && values.date
      case 2: // Cliente
        return values.clientId && selectedClient
      case 3: // Tratamiento
        if (!values.treatmentId || !selectedTreatment) return false
        
        // Verificar advertencias médicas críticas
        if (hasMedicalWarnings && medicalValidation && !medicalValidation.isValid) {
          const criticalWarnings = medicalValidation.warnings.filter(w => 
            w.includes('CÁNCER') || w.includes('contraindicado')
          )
          
          if (criticalWarnings.length > 0) {
            setError('Este tratamiento tiene restricciones médicas críticas. Revisa las advertencias.')
            return false
          }
        }
        
        return true
      case 4: // Horario y confirmación
        return values.startTime
      default:
        return false
    }
  }

  // Navegación optimizada
  const nextStep = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    
    setError('')
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      
      // Precargar datos del siguiente paso
      if (currentStep === 1) {
        // Precargar clientes si es necesario
        console.log('Precargando datos de clientes...')
      }
    }
  }

  const prevStep = () => {
    setError('')
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Envío optimizado con retry y validaciones
  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      console.log('Enviando cita:', data)

      // Verificar conexión antes de enviar
      if (!isFirebaseOnline) {
        throw new Error('Sin conexión al servidor. Los datos se guardarán cuando se restablezca la conexión.')
      }

      // Validar conflictos con retry
      const conflictCheck = await executeWithRetry(async () => {
        return appointmentServiceOptimized.validateAppointmentTime(
          data.professionalId,
          data.date,
          data.startTime,
          data.duration,
          editingAppointment?.id
        )
      })

      if (!conflictCheck.isValid) {
        setError('Conflicto de horario detectado. Por favor selecciona otro horario.')
        setCurrentStep(4)
        notify('error', 'Conflicto de horario', {
          description: 'Ya existe una cita en ese horario'
        })
        return
      }

      // Preparar datos con validación médica
      const appointmentData = {
        ...data,
        clientName: selectedClient.name,
        treatmentName: selectedTreatment.name,
        endTime: calculatedEndTime,
        medicalWarnings: medicalValidation?.warnings || [],
        hasWarnings: hasMedicalWarnings,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Crear o actualizar con retry
      let appointmentId
      if (editingAppointment) {
        await executeWithRetry(async () => {
          return appointmentServiceOptimized.update(editingAppointment.id, appointmentData)
        })
        appointmentId = editingAppointment.id
        
        notify('success', 'Cita actualizada correctamente')
      } else {
        appointmentId = await executeWithRetry(async () => {
          return appointmentServiceOptimized.create(appointmentData)
        })
        
        // Notificación de cita creada
        notificationService.notifyAppointmentCreated({
          id: appointmentId,
          ...appointmentData
        })
      }

      console.log('Cita guardada:', appointmentId)
      
      // Callback de éxito
      onSuccess && onSuccess({
        id: appointmentId,
        ...appointmentData
      })

    } catch (error) {
      console.error('Error saving appointment:', error)
      const errorMessage = error.message || 'Error al guardar la cita. Intenta nuevamente.'
      setError(errorMessage)
      
      notify('error', 'Error al guardar', {
        description: errorMessage,
        duration: 6000
      })
    } finally {
      setLoading(false)
    }
  }

  // Indicadores de estado
  const getStepTitle = () => {
    const titles = {
      1: 'Profesional y Fecha',
      2: 'Seleccionar Cliente',
      3: 'Tratamiento',
      4: 'Horario y Confirmación'
    }
    return titles[currentStep] || 'Nueva Cita'
  }

  const getStepIcon = () => {
    const icons = {
      1: Calendar,
      2: User,
      3: Briefcase,
      4: Clock
    }
    return icons[currentStep] || Heart
  }

  const StepIcon = getStepIcon()

  // Estado de conexión en la UI
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-1 text-xs">
      {isFirebaseOnline ? (
        <Wifi className="h-3 w-3 text-green-500" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-500" />
      )}
      <span className={isFirebaseOnline ? 'text-green-600' : 'text-red-600'}>
        {isFirebaseOnline ? 'Online' : 'Offline'}
      </span>
      {retryCount > 0 && (
        <span className="text-orange-600">
          (Reintento {retryCount})
        </span>
      )}
    </div>
  )

  if (!shouldRender) {
    return (
      <div ref={formRef} className="w-full max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div ref={formRef} className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
                </CardTitle>
                <CardDescription>
                  Paso {currentStep} de {totalSteps}: {getStepTitle()}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ConnectionStatus />
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Indicador de progreso */}
          <div className="flex space-x-2 mt-4">
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index + 1 <= currentStep
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Paso 1: Profesional y Fecha */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="professionalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profesional</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un profesional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableProfessionals.map((professional) => (
                              <SelectItem key={professional.id} value={professional.id}>
                                {professional.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de la cita</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  formatDate(field.value)
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Paso 2: Cliente */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Cliente</label>
                    <ClientSearch
                      onSelectClient={handleClientSelect}
                      selectedClient={selectedClient}
                      allowNew={true}
                    />
                  </div>
                </div>
              )}

              {/* Paso 3: Tratamiento */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="treatmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tratamiento</FormLabel>
                        <Select onValueChange={handleTreatmentSelect} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tratamiento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTreatments.map((treatment) => (
                              <SelectItem key={treatment.id} value={treatment.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{treatment.name}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {treatment.duration}min • ${treatment.basePrice}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Información del tratamiento seleccionado */}
                  {selectedTreatment && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">{selectedTreatment.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {selectedTreatment.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{selectedTreatment.duration} minutos</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${selectedTreatment.basePrice}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Validación médica automática */}
                  {selectedClient && selectedTreatment && (
                    <MedicalValidation
                      clientId={selectedClient.id}
                      treatmentId={selectedTreatment.id}
                      onValidationChange={(validation) => {
                        console.log('Medical validation updated:', validation)
                      }}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración (minutos)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="15"
                              step="15"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Paso 4: Horario y Confirmación */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {form.getValues('professionalId') && form.getValues('date') && (
                    <TimeSlotPicker
                      professionalId={form.getValues('professionalId')}
                      date={form.getValues('date')}
                      duration={form.getValues('duration')}
                      onSelectTime={handleTimeSelect}
                      selectedTime={form.getValues('startTime')}
                      excludeAppointmentId={editingAppointment?.id}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas adicionales (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observaciones, preparación especial, etc..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Resumen de la cita */}
                  {form.getValues('startTime') && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <h4 className="font-medium text-green-800">Resumen de la Cita</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><strong>Cliente:</strong> {selectedClient?.name}</div>
                          <div><strong>Tratamiento:</strong> {selectedTreatment?.name}</div>
                          <div><strong>Fecha:</strong> {formatDate(form.getValues('date'))}</div>
                          <div><strong>Horario:</strong> {formatTimeString(form.getValues('startTime'))} - {calculatedEndTime}</div>
                          <div><strong>Duración:</strong> {form.getValues('duration')} minutos</div>
                          <div><strong>Precio:</strong> ${form.getValues('price')}</div>
                          {hasMedicalWarnings && (
                            <div className="text-orange-700">
                              <strong>⚠️ Advertencias médicas:</strong> Revisar antes de confirmar
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Error general */}
              {(error || retryError) && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error || retryError}
                  {!isFirebaseOnline && (
                    <div className="mt-2 text-xs">
                      Los datos se guardarán automáticamente cuando se restablezca la conexión.
                    </div>
                  )}
                </div>
              )}

              {/* Botones de navegación optimizados */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                {currentStep < totalSteps ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={loading || medicalLoading}
                  >
                    {medicalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={loading || !isFirebaseOnline || (hasMedicalWarnings && !medicalValidation?.isValid)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      editingAppointment ? 'Actualizar Cita' : 'Crear Cita'
                    )}
                  </Button>
                )}
              </div>

              {/* Indicadores adicionales */}
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                <div>
                  {!isFirebaseOnline && (
                    <span className="text-orange-600">
                      ⚠️ Trabajando offline - Los cambios se sincronizarán automáticamente
                    </span>
                  )}
                </div>
                <div>
                  {hasMedicalWarnings && (
                    <span className="text-orange-600">
                      ⚠️ Revisa las advertencias médicas
                    </span>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}