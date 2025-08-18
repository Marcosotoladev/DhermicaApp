// src/app/admin/professionals/editar/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, User, Clock, Star, Plus, X, Loader2, CheckCircle, Eye } from 'lucide-react'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../../components/ui/form'
import { Input } from '../../../../../components/ui/input'
import { Switch } from '../../../../../components/ui/switch'
import { Badge } from '../../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { Skeleton } from '../../../../../components/ui/skeleton'
import { professionalSchema, PROFESSIONAL_SPECIALTIES } from '../../../../../lib/validations'
import { professionalService } from '../../../../../lib/firebase-services'
import { toast } from 'sonner'

/**
 * Página para editar profesional existente
 * Carga datos iniciales y permite modificar toda la información
 */
export default function EditProfessionalPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [professional, setProfessional] = useState(null)
  const [specialtyInput, setSpecialtyInput] = useState('')

  // Unwrap params Promise
  const resolvedParams = use(params)
  const professionalId = resolvedParams.id

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

  useEffect(() => {
    loadProfessional()
  }, [professionalId])

  const loadProfessional = async () => {
    try {
      const professionalData = await professionalService.getById(professionalId)
      
      if (!professionalData) {
        toast.error('Profesional no encontrado')
        router.push('/admin/professionals')
        return
      }

      setProfessional(professionalData)
      
      // Cargar datos en el formulario
      form.reset({
        name: professionalData.name || '',
        specialties: professionalData.specialties || [],
        workingHours: professionalData.workingHours || {
          monday: { start: '09:00', end: '18:00', active: true },
          tuesday: { start: '09:00', end: '18:00', active: true },
          wednesday: { start: '09:00', end: '18:00', active: true },
          thursday: { start: '09:00', end: '18:00', active: true },
          friday: { start: '09:00', end: '18:00', active: true },
          saturday: { start: '09:00', end: '14:00', active: false },
          sunday: { start: '09:00', end: '14:00', active: false }
        },
        available: professionalData.available !== false
      })
      
    } catch (error) {
      console.error('Error loading professional:', error)
      toast.error('Error al cargar el profesional')
      router.push('/admin/professionals')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await professionalService.update(professionalId, data)
      
      toast.success('Profesional actualizado exitosamente')
      router.push(`/admin/professionals/${professionalId}`)
      
    } catch (error) {
      console.error('Error updating professional:', error)
      toast.error('Error al actualizar el profesional')
    } finally {
      setSaving(false)
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
  const isAvailable = form.watch('available')

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!professional) {
    return null
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
              onClick={() => router.push('/admin/professionals')}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Editar Profesional
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Modifica la información de "{professional.name}"
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/professionals/${professionalId}`)}
              disabled={saving}
            >
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ver</span>
            </Button>
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
                          {isAvailable ? 'Profesional Disponible' : 'Profesional No Disponible'}
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {isAvailable 
                            ? 'El profesional aparece en la lista para agendar citas'
                            : 'El profesional no aparecerá disponible para nuevas citas'
                          }
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

            {/* Información del sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
                <CardDescription>
                  Datos automáticos del profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Registrado el:</p>
                    <p className="font-medium">
                      {professional.createdAt?.toDate?.()?.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última actualización:</p>
                    <p className="font-medium">
                      {professional.updatedAt?.toDate?.()?.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || 'No disponible'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/professionals/${professionalId}`)}
                    disabled={saving}
                    className="order-2 sm:order-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving || specialties.length === 0}
                    className="order-1 sm:order-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Profesional'
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