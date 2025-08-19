// src/app/admin/treatments/editar/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, AlertTriangle, Loader2, Eye } from 'lucide-react'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../../components/ui/form'
import { Input } from '../../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Checkbox } from '../../../../../components/ui/checkbox'
import { Badge } from '../../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { Switch } from '../../../../../components/ui/switch'
import { Skeleton } from '../../../../../components/ui/skeleton'
import { treatmentService } from '../../../../../lib/firebase-services'
import { toast } from 'sonner'
import * as z from 'zod'

// Schema simplificado para tratamientos
const treatmentSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  duration: z.number().min(15, 'Duración mínima: 15 minutos').max(480, 'Duración máxima: 8 horas'),
  basePrice: z.number().min(0, 'El precio no puede ser negativo').optional(),
  category: z.string().min(1, 'La categoría es obligatoria'),
  medicalRestrictions: z.array(z.string()).optional(),
  active: z.boolean().default(true)
})

// Categorías actualizadas
const TREATMENT_CATEGORIES = [
  'Aparatologia',
  'Cejas',
  'Corporales',
  'Depilacion',
  'Faciales',
  'Manos',
  'Pestañas',
  'Pies',
  'HiFu',
  'Liposonix',
  'Definitiva',
  'Otro'
]

// Restricciones médicas actualizadas
const MEDICAL_RESTRICTIONS = [
  'Diabetes',
  'Cancer',
  'Tatuajes',
  'Alergias',
  'Embarazo',
  'Cirugias',
  'Otro'
]

/**
 * Página para editar tratamiento existente
 * Carga datos iniciales y permite modificar todos los campos
 */
export default function EditTreatmentPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [treatment, setTreatment] = useState(null)

  // Unwrap params Promise
  const resolvedParams = use(params)
  const treatmentId = resolvedParams.id

  const form = useForm({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      name: '',
      duration: 60,
      basePrice: undefined,
      category: '',
      medicalRestrictions: [],
      active: true
    }
  })

  useEffect(() => {
    loadTreatment()
  }, [treatmentId])

  const loadTreatment = async () => {
    try {
      const treatmentData = await treatmentService.getById(treatmentId)
      
      if (!treatmentData) {
        toast.error('Tratamiento no encontrado')
        router.push('/admin/treatments')
        return
      }

      setTreatment(treatmentData)
      
      // Cargar datos en el formulario
      form.reset({
        name: treatmentData.name || '',
        duration: treatmentData.duration || 60,
        basePrice: treatmentData.basePrice || undefined,
        category: treatmentData.category || '',
        medicalRestrictions: treatmentData.medicalRestrictions || [],
        active: treatmentData.active !== false
      })
      
    } catch (error) {
      console.error('Error loading treatment:', error)
      toast.error('Error al cargar el tratamiento')
      router.push('/admin/treatments')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const treatmentData = {
        ...data,
        duration: Number(data.duration),
        basePrice: data.basePrice ? Number(data.basePrice) : null
      }

      await treatmentService.update(treatmentId, treatmentData)
      
      toast.success('Tratamiento actualizado exitosamente')
      router.push('/admin/treatments')
      
    } catch (error) {
      console.error('Error updating treatment:', error)
      toast.error('Error al actualizar el tratamiento')
    } finally {
      setSaving(false)
    }
  }

  const medicalRestrictions = form.watch('medicalRestrictions') || []
  const isActive = form.watch('active')

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
            
            {[...Array(3)].map((_, i) => (
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

  if (!treatment) {
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
              onClick={() => router.push('/admin/treatments')}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Editar Tratamiento
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Modifica la información de "{treatment.name}"
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Estado del tratamiento */}
            <Card>
              <CardHeader>
                <CardTitle>Estado del Tratamiento</CardTitle>
                <CardDescription>
                  Controla la disponibilidad del tratamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {isActive ? 'Tratamiento Activo' : 'Tratamiento Inactivo'}
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {isActive 
                            ? 'El tratamiento está disponible para agendar citas'
                            : 'El tratamiento no aparecerá en la lista de servicios disponibles'
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

            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Tratamiento</CardTitle>
                <CardDescription>
                  Datos principales del servicio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Tratamiento *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Limpieza Facial"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoría */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TREATMENT_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Duración */}
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (minutos) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="15"
                            max="480"
                            step="15"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Precio */}
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio ($) - Opcional</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            step="100"
                            placeholder="Dejar vacío si no aplica"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Restricciones médicas */}
            <Card>
              <CardHeader>
                <CardTitle>Restricciones Médicas</CardTitle>
                <CardDescription>
                  Selecciona las condiciones que requieren atención especial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <FormField
                  control={form.control}
                  name="medicalRestrictions"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {MEDICAL_RESTRICTIONS.map((restriction) => (
                          <FormField
                            key={restriction}
                            control={form.control}
                            name="medicalRestrictions"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={restriction}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(restriction)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, restriction])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== restriction
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {restriction}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {medicalRestrictions.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Restricciones seleccionadas:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {medicalRestrictions.map((restriction) => (
                          <Badge key={restriction} variant="outline" className="border-yellow-300 text-yellow-800">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-yellow-700 mt-2">
                        Se mostrará una advertencia al agendar citas para clientes con estas condiciones.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
                <CardDescription>
                  Datos automáticos del tratamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Creado el:</p>
                    <p className="font-medium">
                      {treatment.createdAt?.toDate?.()?.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última modificación:</p>
                    <p className="font-medium">
                      {treatment.updatedAt?.toDate?.()?.toLocaleDateString('es-ES', {
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
                    onClick={() => router.push('/admin/treatments')}
                    disabled={saving}
                    className="order-2 sm:order-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="order-1 sm:order-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Tratamiento'
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