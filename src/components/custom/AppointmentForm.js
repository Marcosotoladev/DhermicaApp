// src/components/custom/AppointmentForm.js
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Clock, User, Briefcase, AlertTriangle, Plus, X, DollarSign } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { ClientSearch } from './ClientSearch'
import { TimeSlotPicker } from './TimeSlotPicker'
import { appointmentService, professionalService, treatmentService } from '../../lib/firebase-services'
import { formatDate, formatTime } from '../../lib/time-utils'

// Función utilitaria para sumar minutos a una hora
const addMinutesToTime = (timeString, minutes) => {
  const [hours, mins] = timeString.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

// Función utilitaria para validaciones médicas básicas
const validateMedicalRestrictions = (clientMedicalInfo, treatmentRestrictions) => {
  if (!clientMedicalInfo || !treatmentRestrictions || treatmentRestrictions.length === 0) {
    return { isValid: true, warnings: [] }
  }

  const warnings = []
  
  treatmentRestrictions.forEach(restriction => {
    if (clientMedicalInfo[restriction]) {
      warnings.push(`Atención: El cliente tiene ${restriction}. Revisar antes de proceder.`)
    }
  })

  return {
    isValid: warnings.length === 0,
    warnings
  }
}

const appointmentSchema = z.object({
  professionalId: z.string().min(1, 'Selecciona un profesional'),
  date: z.date({ required_error: 'Selecciona una fecha' }),
  clientId: z.string().min(1, 'Selecciona un cliente'),
  startTime: z.string().min(1, 'Selecciona una hora'),
  status: z.enum(['Programado', 'Completado', 'Anulado']).default('Programado')
})

const STEPS = [
  'select_professional',
  'select_date', 
  'search_client',
  'select_treatments',
  'select_time',
  'confirm'
]

/**
 * Formulario principal para crear/editar citas
 * Wizard multi-paso con soporte para múltiples tratamientos
 */
export function AppointmentForm({ 
  onSuccess, 
  onCancel,
  initialData = null,
  isSubmitting = false,
  mode = 'create' // 'create' | 'edit'
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [professionals, setProfessionals] = useState([])
  const [treatments, setTreatments] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedTreatments, setSelectedTreatments] = useState([]) // Array de tratamientos
  const [loading, setLoading] = useState(false)
  const [medicalWarnings, setMedicalWarnings] = useState([])

  const form = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      professionalId: initialData?.professionalId || '',
      clientId: initialData?.clientId || '',
      date: initialData?.date?.toDate?.() || initialData?.date || new Date(),
      startTime: initialData?.startTime || '',
      status: initialData?.status || 'Programado'
    }
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (initialData && mode === 'edit') {
      loadEditingData()
    }
  }, [initialData, mode])

  useEffect(() => {
    validateMedicalCompatibility()
  }, [selectedClient, selectedTreatments])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [professionalsData, treatmentsData] = await Promise.all([
        professionalService.getAll(),
        treatmentService.getAll()
      ])
      setProfessionals(professionalsData)
      setTreatments(treatmentsData)
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEditingData = async () => {
    if (!initialData) return
    
    try {
      // Cargar cliente si existe
      if (initialData.clientId) {
        const client = { 
          id: initialData.clientId, 
          name: initialData.clientName,
        }
        setSelectedClient(client)
      }

      // Cargar tratamientos (convertir de formato legacy si es necesario)
      if (initialData.treatments && Array.isArray(initialData.treatments)) {
        // Nuevo formato con múltiples tratamientos
        setSelectedTreatments(initialData.treatments)
      } else if (initialData.treatmentId) {
        // Formato legacy con un solo tratamiento
        const treatment = treatments.find(t => t.id === initialData.treatmentId)
        if (treatment) {
          setSelectedTreatments([{
            id: treatment.id,
            name: treatment.name,
            duration: treatment.duration,
            basePrice: treatment.basePrice,
            price: initialData.price || treatment.basePrice || 0
          }])
        }
      }

      // Ir directamente al paso de confirmación si estamos editando
      setCurrentStep(STEPS.length - 1)
      
    } catch (error) {
      console.error('Error loading editing data:', error)
    }
  }

  const validateMedicalCompatibility = () => {
    if (!selectedClient || selectedTreatments.length === 0) {
      setMedicalWarnings([])
      return
    }

    const allWarnings = []
    selectedTreatments.forEach(selectedTreatment => {
      const treatment = treatments.find(t => t.id === selectedTreatment.id)
      if (treatment && selectedClient.medicalInfo) {
        const validation = validateMedicalRestrictions(
          selectedClient.medicalInfo, 
          treatment.medicalRestrictions || []
        )
        allWarnings.push(...validation.warnings)
      }
    })
    
    setMedicalWarnings([...new Set(allWarnings)]) // Eliminar duplicados
  }

  const addTreatment = (treatmentId) => {
    const treatment = treatments.find(t => t.id === treatmentId)
    if (treatment && !selectedTreatments.find(st => st.id === treatmentId)) {
      const newTreatment = {
        id: treatment.id,
        name: treatment.name,
        duration: treatment.duration,
        basePrice: treatment.basePrice || 0,
        price: treatment.basePrice || 0
      }
      setSelectedTreatments([...selectedTreatments, newTreatment])
    }
  }

  const removeTreatment = (treatmentId) => {
    setSelectedTreatments(selectedTreatments.filter(t => t.id !== treatmentId))
  }

  const updateTreatmentPrice = (treatmentId, newPrice) => {
    setSelectedTreatments(selectedTreatments.map(t => 
      t.id === treatmentId ? { ...t, price: newPrice } : t
    ))
  }

  const getTotalDuration = () => {
    return selectedTreatments.reduce((total, treatment) => total + treatment.duration, 0)
  }

  const getTotalPrice = () => {
    return selectedTreatments.reduce((total, treatment) => total + (treatment.price || 0), 0)
  }

  const onSubmit = async (data) => {
    if (!selectedClient || selectedTreatments.length === 0) {
      console.error('Missing client or treatments data')
      return
    }

    try {
      const totalDuration = getTotalDuration()
      const endTime = addMinutesToTime(data.startTime, totalDuration)

      const appointmentData = {
        clientId: data.clientId,
        clientName: selectedClient.name,
        treatments: selectedTreatments, // Array de tratamientos
        professionalId: data.professionalId,
        date: data.date,
        startTime: data.startTime,
        endTime,
        duration: totalDuration,
        totalPrice: getTotalPrice(),
        status: data.status,
        // Mantener compatibilidad con formato legacy
        treatmentId: selectedTreatments[0]?.id, 
        price: getTotalPrice()
      }

      if (onSuccess) {
        await onSuccess(appointmentData)
      }

    } catch (error) {
      console.error('Error in form submission:', error)
      throw error
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (STEPS[currentStep]) {
      case 'select_professional':
        return form.watch('professionalId')
      case 'select_date':
        return form.watch('date')
      case 'search_client':
        return selectedClient
      case 'select_treatments':
        return selectedTreatments.length > 0
      case 'select_time':
        return form.watch('startTime')
      default:
        return true
    }
  }

  const getCurrentStepTitle = () => {
    const titles = {
      select_professional: 'Seleccionar Profesional',
      select_date: 'Seleccionar Fecha',
      search_client: 'Buscar Cliente',
      select_treatments: 'Seleccionar Tratamientos', 
      select_time: 'Seleccionar Horario',
      confirm: 'Confirmar Cita'
    }
    return titles[STEPS[currentStep]]
  }

  const selectedProfessional = professionals.find(p => p.id === form.watch('professionalId'))

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {mode === 'edit' ? 'Editar Cita' : 'Nueva Cita'}
            </span>
            <Badge variant="outline">
              Paso {currentStep + 1} de {STEPS.length}
            </Badge>
          </CardTitle>
          
          {/* Progress bar */}
          <div className="flex items-center space-x-2 mt-4">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            {getCurrentStepTitle()}
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Paso 1: Seleccionar Profesional */}
              {STEPS[currentStep] === 'select_professional' && (
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
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{professional.name}</span>
                                {professional.specialties && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {professional.specialties.length} especialidades
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Paso 2: Seleccionar Fecha */}
              {STEPS[currentStep] === 'select_date' && (
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
                                formatDate(field.value, 'EEEE d \'de\' MMMM \'de\' yyyy')
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
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
                      {selectedProfessional && (
                        <p className="text-xs text-muted-foreground">
                          Profesional seleccionado: <span className="font-medium">{selectedProfessional.name}</span>
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              )}

              {/* Paso 3: Buscar Cliente */}
              {STEPS[currentStep] === 'search_client' && (
                <div>
                  <FormLabel>Cliente</FormLabel>
                  <div className="mt-2">
                    <ClientSearch
                      onSelectClient={(client) => {
                        setSelectedClient(client)
                        form.setValue('clientId', client?.id || '')
                      }}
                      selectedClient={selectedClient}
                      allowNew={true}
                    />
                  </div>
                </div>
              )}

              {/* Paso 4: Seleccionar Tratamientos */}
              {STEPS[currentStep] === 'select_treatments' && (
                <div className="space-y-4">
                  <div>
                    <FormLabel>Agregar Tratamiento</FormLabel>
                    <Select onValueChange={addTreatment}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecciona un tratamiento para agregar" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments
                          .filter(treatment => !selectedTreatments.find(st => st.id === treatment.id))
                          .map((treatment) => (
                            <SelectItem key={treatment.id} value={treatment.id}>
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <p className="font-medium">{treatment.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {treatment.category}
                                  </p>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                  <Badge variant="outline" className="text-xs">
                                    {treatment.duration} min
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    ${treatment.basePrice || 0}
                                  </Badge>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lista de tratamientos seleccionados */}
                  {selectedTreatments.length > 0 && (
                    <div className="space-y-3">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Tratamientos Seleccionados</h4>
                        <Badge variant="outline">
                          {selectedTreatments.length} tratamiento{selectedTreatments.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      {selectedTreatments.map((treatment, index) => (
                        <Card key={treatment.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h5 className="font-medium">{treatment.name}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {treatment.duration} min
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Precio:</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="100"
                                      value={treatment.price || 0}
                                      onChange={(e) => updateTreatmentPrice(treatment.id, Number(e.target.value) || 0)}
                                      className="w-24 h-8 text-sm"
                                    />
                                  </div>
                                  {treatment.basePrice && treatment.price !== treatment.basePrice && (
                                    <span className="text-xs text-muted-foreground">
                                      (Base: ${treatment.basePrice})
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTreatment(treatment.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Resumen totales */}
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Duración total:</span>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{getTotalDuration()} min</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Precio total:</span>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">${getTotalPrice()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {/* Alertas médicas */}
                  {medicalWarnings.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <h4 className="font-medium text-yellow-800 mb-2">⚠️ Advertencias Médicas</h4>
                        <ul className="space-y-1">
                          {medicalWarnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700">
                              • {warning}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Paso 5: Seleccionar Hora */}
              {STEPS[currentStep] === 'select_time' && selectedTreatments.length > 0 && (
                <div>
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Duración total de la cita:</p>
                    <p className="font-medium">{getTotalDuration()} minutos</p>
                  </div>
                  <TimeSlotPicker
                    professionalId={form.watch('professionalId')}
                    date={form.watch('date')}
                    duration={getTotalDuration()}
                    onSelectTime={(time) => form.setValue('startTime', time)}
                    selectedTime={form.watch('startTime')}
                    excludeAppointmentId={initialData?.id}
                  />
                </div>
              )}

              {/* Paso 6: Confirmar */}
              {STEPS[currentStep] === 'confirm' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Check className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Confirmar Cita</h3>
                    <p className="text-muted-foreground">
                      Revisa los detalles antes de confirmar
                    </p>
                  </div>
                  
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cliente</p>
                          <p className="font-medium">{selectedClient?.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Profesional</p>
                          <p className="font-medium">{selectedProfessional?.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fecha</p>
                          <p className="font-medium">
                            {form.watch('date') && formatDate(form.watch('date'), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Horario</p>
                          <p className="font-medium">
                            {form.watch('startTime')} - {form.watch('startTime') && 
                              addMinutesToTime(form.watch('startTime'), getTotalDuration())}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Tratamientos */}
                      <div>
                        <p className="text-muted-foreground mb-2">Tratamientos</p>
                        <div className="space-y-2">
                          {selectedTreatments.map((treatment, index) => (
                            <div key={treatment.id} className="flex items-center justify-between text-sm">
                              <span>{treatment.name}</span>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {treatment.duration} min
                                </Badge>
                                <span className="font-medium">${treatment.price}</span>
                              </div>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex items-center justify-between font-medium">
                            <span>Total ({getTotalDuration()} min)</span>
                            <span>${getTotalPrice()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Estado de la cita */}
                      {mode === 'edit' && (
                        <div>
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado de la Cita</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Programado">
                                      <Badge variant="default">Programado</Badge>
                                    </SelectItem>
                                    <SelectItem value="Completado">
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">Completado</Badge>
                                    </SelectItem>
                                    <SelectItem value="Anulado">
                                      <Badge variant="destructive">Anulado</Badge>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {medicalWarnings.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <h4 className="font-medium text-yellow-800 mb-2">⚠️ Recordatorio</h4>
                        <ul className="space-y-1">
                          {medicalWarnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700">
                              • {warning}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex justify-between pt-6 border-t border-border">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0 || isSubmitting}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  
                  {onCancel && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onCancel}
                      disabled={isSubmitting}
                      className="hidden sm:flex"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>

                {currentStep === STEPS.length - 1 ? (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      mode === 'edit' ? 'Actualizar Cita' : 'Crear Cita'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed() || isSubmitting}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
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