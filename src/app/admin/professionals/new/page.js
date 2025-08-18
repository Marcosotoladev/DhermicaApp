// src/app/admin/professionals/new/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, User, Clock, Star, Plus, X, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../components/ui/form'
import { Input } from '../../../../components/ui/input'
import { Switch } from '../../../../components/ui/switch'
import { Badge } from '../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { professionalSchema, PROFESSIONAL_SPECIALTIES } from '../../../../lib/validations'
import { professionalService } from '../../../../lib/firebase-services'
import { toast } from 'sonner'

/**
 * Página para crear nuevo profesional
 * Incluye horarios de trabajo y especialidades
 */
export default function NewProfessionalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [specialtyInput, setSpecialtyInput] = useState('')

  const form = useForm({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: '',
      specialties: [],
      workingHours: {
        monday: { start: '09:00', end: '18:00', active: true },
        tuesday: { start: '09:00', end: '18:00', active: true },
        wednesday: { start: '09:00', end: '18:00', active: true },
        thursday: { start: '09:00', end: '18:00', active: true },
        friday: { start: '09:00', end: '18:00', active: true },
        saturday: { start: '09:00', end: '14:00', active: false },
        sunday: { start: '09:00', end: '14:00', active: false }
      },
      available: true
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const professionalId = await professionalService.create(data)
      
      toast.success('Profesional creado exitosamente')
      router.push(`/admin/professionals/${professionalId}`)
      
    } catch (error) {
      console.error('Error creating professional:', error)
      toast.error('Error al crear el profesional')
    } finally {
      setLoading(false)
    }
  }

  const addSpecialty = (specialty) => {
    const currentSpecialties = form.getValues('specialties')
    if (!currentSpecialties.includes(specialty)) {
      form.setValue('specialties', [...currentSpecialties, specialty])
    }
    setSpecialtyInput('')
  }

  const removeSpecialty = (specialtyToRemove) => {
    const currentSpecialties = form.getValues('specialties')
    form.setValue('specialties', currentSpecialties.filter(s => s !== specialtyToRemove))
  }

  const addCustomSpecialty = () => {
    if (specialtyInput.trim()) {
      addSpecialty(specialtyInput.trim())
    }
  }

  const copySchedule = (fromDay) => {
    const schedule = form.getValues(`workingHours.${fromDay}`)
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    days.forEach(day => {
      if (day !== fromDay) {
        form.setValue(`workingHours.${day}`, { ...schedule })
      }
    })
    
    toast.success('Horario copiado a todos los días')
  }

  const specialties = form.watch('specialties')
  const workingHours = form.watch('workingHours')

  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes', 
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  const activeDays = Object.keys(workingHours).filter(day => workingHours[day]?.active).length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/professionals')}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Nuevo Profesional
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Agrega un nuevo profesional a Dhermica Estética
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Básica</span>
                </CardTitle>
                <CardDescription>
                  Datos principales del profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Dr. Juan Pérez"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estado disponible */}
                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Profesional Disponible
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Si está habilitado, aparecerá en la lista para agendar citas
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Especialidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Especialidades</span>
                </CardTitle>
                <CardDescription>
                  Servicios y tratamientos que puede realizar este profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Especialidades predefinidas */}
                <div>
                  <FormLabel className="text-base font-medium mb-3 block">
                    Especialidades Disponibles
                  </FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROFESSIONAL_SPECIALTIES.map((specialty) => (
                      <Button
                        key={specialty}
                        type="button"
                        variant={specialties.includes(specialty) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (specialties.includes(specialty)) {
                            removeSpecialty(specialty)
                          } else {
                            addSpecialty(specialty)
                          }
                        }}
                        className="justify-start"
                      >
                        {specialties.includes(specialty) && (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {specialty}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Agregar especialidad personalizada */}
                <div>
                  <FormLabel className="text-base font-medium mb-3 block">
                    Agregar Especialidad Personalizada
                  </FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ej: Microdermoabrasión Avanzada"
                      value={specialtyInput}
                      onChange={(e) => setSpecialtyInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomSpecialty()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addCustomSpecialty}
                      disabled={!specialtyInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Especialidades seleccionadas */}
                {specialties.length > 0 && (
                  <div>
                    <FormLabel className="text-base font-medium mb-3 block">
                      Especialidades Seleccionadas ({specialties.length})
                    </FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty) => (
                        <Badge key={specialty} variant="default" className="px-3 py-1">
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(specialty)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {specialties.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Selecciona al menos una especialidad para que el profesional pueda aparecer en los tratamientos correspondientes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Horarios de trabajo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Horarios de Trabajo</span>
                </CardTitle>
                <CardDescription>
                  Configura los días y horarios disponibles para citas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {Object.entries(dayNames).map(([dayKey, dayName]) => (
                  <div key={dayKey} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormField
                        control={form.control}
                        name={`workingHours.${dayKey}.active`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-base font-medium">
                              {dayName}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      {workingHours[dayKey]?.active && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copySchedule(dayKey)}
                          className="text-xs"
                        >
                          Copiar a todos
                        </Button>
                      )}
                    </div>

                    {workingHours[dayKey]?.active && (
                      <div className="grid grid-cols-2 gap-4 ml-6 pl-4 border-l-2 border-border">
                        <FormField
                          control={form.control}
                          name={`workingHours.${dayKey}.start`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de inicio</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`workingHours.${dayKey}.end`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de fin</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Resumen de horarios */}
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Resumen:</strong> {activeDays} {activeDays === 1 ? 'día' : 'días'} laborales configurados.
                    {activeDays === 0 && (
                      <span className="text-destructive ml-2">
                        ⚠️ Debes activar al menos un día para que el profesional pueda recibir citas.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/professionals')}
                    disabled={loading}
                    className="order-2 sm:order-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || specialties.length === 0}
                    className="order-1 sm:order-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear Profesional'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}