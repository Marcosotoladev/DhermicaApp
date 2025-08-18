// src/app/admin/treatments/new/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload, X, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../components/ui/form'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Checkbox } from '../../../../components/ui/checkbox'
import { Badge } from '../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { treatmentSchema, TREATMENT_CATEGORIES, MEDICAL_RESTRICTIONS } from '../../../../lib/validations'
import { treatmentService } from '../../../../lib/firebase-services'
import { toast } from 'sonner'

/**
 * Página para crear nuevo tratamiento
 * Formulario completo con validaciones y subida de imagen
 */
export default function NewTreatmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const form = useForm({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      name: '',
      description: '',
      duration: 60,
      basePrice: 0,
      category: '',
      imageUrl: '',
      medicalRestrictions: [],
      active: true
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      let imageUrl = ''
      
      // Subir imagen si existe
      if (imageFile) {
        // Aquí integrarías con Cloudinary
        // Por ahora simulamos la URL
        imageUrl = imagePreview
      }

      const treatmentData = {
        ...data,
        imageUrl,
        duration: Number(data.duration),
        basePrice: Number(data.basePrice)
      }

      const treatmentId = await treatmentService.create(treatmentData)
      
      toast.success('Tratamiento creado exitosamente')
      router.push(`/admin/treatments/${treatmentId}`)
      
    } catch (error) {
      console.error('Error creating treatment:', error)
      toast.error('Error al crear el tratamiento')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('La imagen no puede superar los 5MB')
        return
      }
      
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result || '')
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    form.setValue('imageUrl', '')
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
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>
                  Datos principales del tratamiento
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
                          placeholder="Ej: Limpieza Facial Profunda"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe los beneficios y el proceso del tratamiento..."
                          className="min-h-[100px]"
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
              </CardContent>
            </Card>

            {/* Duración y Precio */}
            <Card>
              <CardHeader>
                <CardTitle>Duración y Precio</CardTitle>
                <CardDescription>
                  Configura el tiempo y costo del tratamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
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
                            max="240"
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
                        <FormLabel>Precio Base ($) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            step="100"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Imagen del tratamiento */}
            <Card>
              <CardHeader>
                <CardTitle>Imagen del Tratamiento</CardTitle>
                <CardDescription>
                  Agrega una imagen representativa (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Haz clic para subir una imagen o arrastra aquí
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Seleccionar Imagen
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tamaño máximo: 5MB. Formatos: JPG, PNG, GIF
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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
                                  <FormLabel className="text-sm font-normal capitalize">
                                    {restriction.replace('_', ' ')}
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
                            {restriction.replace('_', ' ')}
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