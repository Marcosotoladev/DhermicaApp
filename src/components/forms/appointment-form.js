// src/components/forms/appointment-form.js
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { ClientSearch } from './client-search'
import { TimeSlotPicker } from './time-slot-picker'
import { appointmentService, professionalService, treatmentService } from '../../lib/firebase-services'
import { addMinutesToTime, formatDate, formatDateTime } from '../../lib/time-utils'
import { validateMedicalRestrictions } from '../../lib/validations'

const appointmentSchema = z.object({
  professionalId: z.string().min(1, 'Selecciona un profesional'),
  date: z.date({ required_error: 'Selecciona una fecha' }),
  clientId: z.string().min(1, 'Selecciona un cliente'),
  treatmentId: z.string().min(1, 'Selecciona un tratamiento'),
  startTime: z.string().min(1, 'Selecciona una hora'),
  price: z.number().optional()
})

const STEPS = [
  'select_professional',
  'select_date', 
  'search_client',
  'select_treatment',
  'select_time',
  'confirm'
]

/**
 * Formulario principal para crear/editar citas
 * Wizard multi-paso con validaciones en tiempo real
 */
export function AppointmentForm({ onSuccess, editingAppointment }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [professionals, setProfessionals] = useState([])
  const [treatments, setTreatments] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [medicalWarnings, setMedicalWarnings] = useState([])

  const form = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      professionalId: '',
      clientId: '',
      treatmentId: '',
      startTime: '',
      price: undefined
    }
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (editingAppointment) {
      loadEditingData()
    }
  }, [editingAppointment])

  useEffect(() => {
    validateMedicalCompatibility()
  }, [selectedClient, selectedTreatment])

  const loadInitialData = async () => {
    try {
      const [professionalsData, treatmentsData] = await Promise.all([
        professionalService.getAll(),
        treatmentService.getAll()
      ])
      setProfessionals(professionalsData)
      setTreatments(treatmentsData)
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const loadEditingData = async () => {
    if (!editingAppointment) return
    
    // TODO: Cargar datos para edición
    console.log('Loading editing data for:', editingAppointment)
  }

  const validateMedicalCompatibility = () => {
    if (!selectedClient || !selectedTreatment) {
      setMedicalWarnings([])
      return
    }

    const validation = validateMedicalRestrictions(
      selectedClient.medicalInfo, 
      selectedTreatment.medicalRestrictions
    )
    
    setMedicalWarnings(validation.warnings)
  }

  const onSubmit = async (data) => {
    if (!selectedClient || !selectedTreatment) return

    setLoading(true)
    try {
      const endTime = addMinutesToTime(data.startTime, selectedTreatment.duration)

      const appointmentData = {
        clientId: data.clientId,
        clientName: selectedClient.name,
        treatmentId: data.treatmentId,
        professionalId: data.professionalId,
        date: data.date,
        startTime: data.startTime,
        endTime,
        duration: selectedTreatment.duration,
        price: data.price
      }

      if (editingAppointment) {
        await appointmentService.update(editingAppointment.id, appointmentData)
      } else {
        await appointmentService.create(appointmentData)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving appointment:', error)
    } finally {
      setLoading(false)
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
      case 'select_treatment':
        return selectedTreatment
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
      select_treatment: 'Seleccionar Tratamiento', 
      select_time: 'Seleccionar Horario',
      confirm: 'Confirmar Cita'
    }
    return titles[STEPS[currentStep]]
  }

  const selectedProfessional = professionals.find(p => p.id === form.watch('professionalId'))

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
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
              className={`h-2 flex-1 rounded-full ${
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
                              <span>{professional.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {professional.specialties.length} especialidades
                              </Badge>
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
                        Profesional seleccionado: {selectedProfessional.name}
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

            {/* Paso 4: Seleccionar Tratamiento */}
            {STEPS[currentStep] === 'select_treatment' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="treatmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tratamiento</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          const treatment = treatments.find(t => t.id === value)
                          setSelectedTreatment(treatment || null)
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tratamiento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {treatments.map((treatment) => (
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
                                    ${treatment.basePrice}
                                  </Badge>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Alertas médicas */}
                {medicalWarnings.length > 0 && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <h4 className="font-medium text-warning mb-2">⚠️ Advertencias Médicas</h4>
                    <ul className="space-y-1">
                      {medicalWarnings.map((warning, index) => (
                        <li key={index} className="text-sm text-warning">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Paso 5: Seleccionar Hora */}
            {STEPS[currentStep] === 'select_time' && selectedTreatment && (
              <TimeSlotPicker
                professionalId={form.watch('professionalId')}
                date={form.watch('date')}
                duration={selectedTreatment.duration}
                onSelectTime={(time) => form.setValue('startTime', time)}
                selectedTime={form.watch('startTime')}
                excludeAppointmentId={editingAppointment?.id}
              />
            )}

            {/* Paso 6: Confirmar */}
            {STEPS[currentStep] === 'confirm' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Check className="h-12 w-12 mx-auto text-success mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Confirmar Cita</h3>
                  <p className="text-muted-foreground">
                    Revisa los detalles antes de confirmar
                  </p>
                </div>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cliente</p>
                        <p className="font-medium">{selectedClient?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tratamiento</p>
                        <p className="font-medium">{selectedTreatment?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha y Hora</p>
                        <p className="font-medium">
                          {form.watch('date') && formatDateTime(
                            form.watch('date'), 
                            form.watch('startTime')
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duración</p>
                        <p className="font-medium">{selectedTreatment?.duration} minutos</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Profesional</p>
                        <p className="font-medium">{selectedProfessional?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Precio Base</p>
                        <p className="font-medium">${selectedTreatment?.basePrice}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Precio final */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Final (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={`${selectedTreatment?.basePrice || 0}`}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Deja vacío para usar el precio base (${selectedTreatment?.basePrice})
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {medicalWarnings.length > 0 && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <h4 className="font-medium text-warning mb-2">⚠️ Recordatorio</h4>
                    <ul className="space-y-1">
                      {medicalWarnings.map((warning, index) => (
                        <li key={index} className="text-sm text-warning">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              {currentStep === STEPS.length - 1 ? (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : editingAppointment ? 'Actualizar Cita' : 'Crear Cita'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
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
  )
}