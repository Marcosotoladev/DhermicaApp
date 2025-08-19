// src/app/admin/treatments/new/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../components/ui/form'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Checkbox } from '../../../../components/ui/checkbox'
import { Badge } from '../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { treatmentService } from '../../../../lib/firebase-services'
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
 * Página para crear nuevo tratamiento
 * Formulario simplificado con solo nombre, duración, precio opcional y categoría
 */
export default function NewTreatmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const treatmentData = {
        ...data,
        duration: Number(data.duration),
        basePrice: data.basePrice ? Number(data.basePrice) : null
      }

      const treatmentId = await treatmentService.create(treatmentData)
      
      toast.success('Tratamiento creado exitosamente')
      router.push('/admin/treatments')
      
    } catch (error) {
      console.error('Error creating treatment:', error)
      toast.error('Error al crear el tratamiento')
    } finally {
      setLoading(false)
    }
  }

  const medicalRestrictions = form.watch('medicalRestrictions') || []

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
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Nuevo Tratamiento
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Agrega un nuevo servicio a Dhermica Estética
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
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
                            placeholder="60"
                            value={field.value === 0 ? '' : field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '') {
                                field.onChange('')
                              } else {
                                const numValue = parseInt(value) || 0
                                field.onChange(numValue)
                              }
                            }}
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
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Dejar vacío si no aplica"
                            value={field.value === undefined || field.value === null ? '' : String(field.value)}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '') // Solo números
                              if (value === '') {
                                field.onChange(undefined)
                              } else {
                                const numValue = parseInt(value, 10)
                                field.onChange(numValue)
                              }
                            }}
                            onBlur={(e) => {
                              // Forzar actualización al perder foco
                              const value = e.target.value.replace(/[^0-9]/g, '')
                              if (value === '') {
                                field.onChange(undefined)
                              } else {
                                const numValue = parseInt(value, 10)
                                field.onChange(numValue)
                              }
                            }}
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

            {/* Botones de acción */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/treatments')}
                    disabled={loading}
                    className="order-2 sm:order-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="order-1 sm:order-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear Tratamiento'
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