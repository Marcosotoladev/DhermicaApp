// src/components/custom/AppointmentForm.js
'use client'

import { useState, useEffect } from 'react'
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
  AlertTriangle,
  Loader2,
  DollarSign,
  Heart,
  MapPin
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ClientSearch } from './ClientSearch'
import { TimeSlotPicker } from './TimeSlotPicker'
import { professionalService, treatmentService, appointmentService } from '../../lib/firebase-services'
import { formatDate, formatTimeString, timeToMinutes, minutesToTime } from '../../lib/time-utils'

// Schema de validación
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
 * Formulario Principal de Citas - Wizard multi-paso
 * Integra: ClientSearch, TimeSlotPicker, y validaciones
 */
export function AppointmentForm({ 
  onSuccess, 
  editingAppointment = null,
  onCancel 
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [professionals, setProfessionals] = useState([])
  const [treatments, setTreatments] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [medicalWarnings, setMedicalWarnings] = useState([])
  const [calculatedEndTime, setCalculatedEndTime] = useState('')
  const [totalSteps] = useState(4)

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
    }
  })

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Cargar datos para edición
  useEffect(() => {
    if (editingAppointment) {
      loadEditingData()
    }
  }, [editingAppointment])

  const loadInitialData = async () => {
    try {
      const [professionalsData, treatmentsData] = await Promise.all([
        professionalService.getAll(),
        treatmentService.getAll()
      ])
      
      setProfessionals(professionalsData)
      setTreatments(treatmentsData)
      
      console.log('Datos cargados:', {
        professionals: professionalsData.length,
        treatments: treatmentsData.length
      })
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Error cargando datos iniciales')
    }
  }

  const loadEditingData = async () => {
    try {
      // TODO: Cargar datos de la cita para edición
      console.log('Cargando datos para edición:', editingAppointment)
    } catch (error) {
      console.error('Error loading editing data:', error)
    }
  }

  // Validar restricciones médicas
  const validateMedicalRestrictions = (client, treatment) => {
    if (!client?.medicalInfo || !treatment?.medicalRestrictions) {
      return []
    }

    const warnings = []
    const { medicalInfo } = client
    const { medicalRestrictions } = treatment

    if (medicalRestrictions.includes('diabetes') && medicalInfo.diabetes) {
      warnings.push('ATENCIÓN: Cliente tiene diabetes - Verificar protocolo especial')
    }
    if (medicalRestrictions.includes('cancer') && medicalInfo.cancer) {
      warnings.push('ATENCIÓN: Cliente tiene/tuvo cáncer - Requiere autorización médica')
    }
    if (medicalRestrictions.includes('tattoos') && medicalInfo.tattoos) {
      warnings.push('ATENCIÓN: Cliente tiene tatuajes - Verificar zona de tratamiento')
    }

    return warnings
  }

  // Manejar selección de cliente
  const handleClientSelect = (client) => {
    console.log('Cliente seleccionado:', client)
    setSelectedClient(client)
    form.setValue('clientId', client.id)
    
    // Validar restricciones médicas si ya hay tratamiento seleccionado
    if (selectedTreatment) {
      const warnings = validateMedicalRestrictions(client, selectedTreatment)
      setMedicalWarnings(warnings)
    }
  }

  // Manejar selección de tratamiento
  const handleTreatmentSelect = (treatmentId) => {
    const treatment = treatments.find(t => t.id === treatmentId)
    console.log('Tratamiento seleccionado:', treatment)
    
    setSelectedTreatment(treatment)
    form.setValue('treatmentId', treatmentId)
    
    if (treatment) {
      form.setValue('duration', treatment.duration || 60)
      form.setValue('price', treatment.basePrice || 0)
      
      // Validar restricciones médicas si ya hay cliente seleccionado
      if (selectedClient) {
        const warnings = validateMedicalRestrictions(selectedClient, treatment)
        setMedicalWarnings(warnings)
      }
    }
  }

  // Manejar selección de horario
  const handleTimeSelect = (time) => {
    console.log('Horario seleccionado:', time)
    form.setValue('startTime', time)
    
    // Calcular hora de fin
    const duration = form.getValues('duration')
    const startMinutes = timeToMinutes(time)
    const endTime = minutesToTime(startMinutes + duration)
    setCalculatedEndTime(endTime)
  }

  // Validar paso actual
  const validateCurrentStep = async () => {
    const values = form.getValues()
    
    switch (currentStep) {
      case 1: // Profesional y fecha
        return values.professionalId && values.date
      case 2: // Cliente
        return values.clientId && selectedClient
      case 3: // Tratamiento
        return values.treatmentId && selectedTreatment
      case 4: // Horario y confirmación
        return values.startTime
      default:
        return false
    }
  }

  // Navegar entre pasos
  const nextStep = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    
    setError('')
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setError('')
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Enviar formulario
  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      console.log('Enviando cita:', data)

      // Validar conflictos de horario
      const conflictCheck = await appointmentService.validateAppointmentTime(
        data.professionalId,
        data.date,
        data.startTime,
        data.duration,
        editingAppointment?.id
      )

      if (!conflictCheck.isValid) {
        setError('Conflicto de horario detectado. Por favor selecciona otro horario.')
        setCurrentStep(4) // Volver al paso de selección de horario
        return
      }

      // Preparar datos de la cita
      const appointmentData = {
        ...data,
        clientName: selectedClient.name,
        endTime: calculatedEndTime,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Crear o actualizar cita
      let appointmentId
      if (editingAppointment) {
        await appointmentService.update(editingAppointment.id, appointmentData)
        appointmentId = editingAppointment.id
      } else {
        appointmentId = await appointmentService.create(appointmentData)
      }

      console.log('Cita guardada:', appointmentId)
      
      // Callback de éxito
      onSuccess && onSuccess({
        id: appointmentId,
        ...appointmentData
      })

    } catch (error) {
      console.error('Error saving appointment:', error)
      setError('Error al guardar la cita. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // Obtener título del paso
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Profesional y Fecha'
      case 2: return 'Seleccionar Cliente'
      case 3: return 'Tratamiento'
      case 4: return 'Horario y Confirmación'
      default: return 'Nueva Cita'
    }
  }

  // Obtener icono del paso
  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return Calendar
      case 2: return User
      case 3: return Briefcase
      case 4: return Clock
      default: return Heart
    }
  }

  const StepIcon = getStepIcon()

  return (
    <div className="w-full max-w-4xl mx-auto">
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
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>

          {/* Indicador de progreso */}
          <div className="flex space-x-2 mt-4">
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full ${
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
                            {professionals.map((professional) => (
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
                            {treatments.map((treatment) => (
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

                  {/* Advertencias médicas */}
                  {medicalWarnings.length > 0 && (
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <h4 className="font-medium text-orange-800">Advertencias Médicas</h4>
                        </div>
                        <div className="space-y-1">
                          {medicalWarnings.map((warning, index) => (
                            <p key={index} className="text-sm text-orange-700">
                              • {warning}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
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
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Error general */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}