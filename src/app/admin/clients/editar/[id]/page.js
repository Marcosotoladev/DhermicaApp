// src/app/admin/clients/editar/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, User, Mail, Phone, Heart, AlertTriangle, Loader2, Eye } from 'lucide-react'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../../components/ui/form'
import { Input } from '../../../../../components/ui/input'
import { Textarea } from '../../../../../components/ui/textarea'
import { Checkbox } from '../../../../../components/ui/checkbox'
import { Badge } from '../../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { Skeleton } from '../../../../../components/ui/skeleton'
import { BirthDatePicker } from '../../../../../components/ui/birth-date-picker'
import { clientSchema } from '../../../../../lib/validations'
import { clientService } from '../../../../../lib/firebase-services'
import { toast } from 'sonner'

/**
 * Página para editar cliente existente
 * Carga datos iniciales y permite modificar toda la información
 */
export default function EditClientPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState(null)

  // Unwrap params Promise
  const resolvedParams = use(params)
  const clientId = resolvedParams.id

  const form = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: new Date(),
      medicalInfo: {
        diabetes: false,
        cancer: false,
        tattoos: false,
        allergies: '',
        medications: '',
        other: ''
      }
    }
  })

  useEffect(() => {
    loadClient()
  }, [clientId])

  const loadClient = async () => {
    try {
      const clientData = await clientService.getById(clientId)
      
      if (!clientData) {
        toast.error('Cliente no encontrado')
        router.push('/admin/clients')
        return
      }

      setClient(clientData)
      
      // Cargar datos en el formulario
      form.reset({
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        dateOfBirth: clientData.dateOfBirth?.toDate?.() || clientData.dateOfBirth || new Date(),
        medicalInfo: {
          diabetes: clientData.medicalInfo?.diabetes || false,
          cancer: clientData.medicalInfo?.cancer || false,
          tattoos: clientData.medicalInfo?.tattoos || false,
          allergies: clientData.medicalInfo?.allergies || '',
          medications: clientData.medicalInfo?.medications || '',
          other: clientData.medicalInfo?.other || ''
        }
      })
      
    } catch (error) {
      console.error('Error loading client:', error)
      toast.error('Error al cargar el cliente')
      router.push('/admin/clients')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await clientService.update(clientId, data)
      
      toast.success('Cliente actualizado exitosamente')
      router.push(`/admin/clients/${clientId}`)
      
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Error al actualizar el cliente')
    } finally {
      setSaving(false)
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const medicalInfo = form.watch('medicalInfo')
  const dateOfBirth = form.watch('dateOfBirth')
  const age = calculateAge(dateOfBirth)

  const hasMedicalConditions = medicalInfo?.diabetes || 
                               medicalInfo?.cancer || 
                               medicalInfo?.tattoos ||
                               medicalInfo?.allergies ||
                               medicalInfo?.medications ||
                               medicalInfo?.other

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
                    <Skeleton className="h-24 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
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
              onClick={() => router.push('/admin/clients')}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Editar Cliente
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Modifica la información de "{client.name}"
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/clients/${clientId}`)}
              disabled={saving}
            >
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ver</span>
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Información personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Personal</span>
                </CardTitle>
                <CardDescription>
                  Datos básicos de contacto y personales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Nombre completo */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: María González"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                              type="email"
                              placeholder="maria@email.com"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Teléfono */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                              type="tel"
                              placeholder="+54 11 1234-5678"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fecha de nacimiento */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento *</FormLabel>
                      <FormControl>
                        <BirthDatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                        />
                      </FormControl>
                      {age > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Edad: {age} años
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Información médica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Información Médica</span>
                </CardTitle>
                <CardDescription>
                  Datos importantes para la seguridad de los tratamientos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Condiciones médicas */}
                <div>
                  <FormLabel className="text-base font-medium">
                    Condiciones Médicas
                  </FormLabel>
                  <p className="text-sm text-muted-foreground mb-4">
                    Marca las condiciones que apliquen al cliente
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Diabetes */}
                    <FormField
                      control={form.control}
                      name="medicalInfo.diabetes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Diabetes
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Diabetes tipo 1 o 2
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Cáncer */}
                    <FormField
                      control={form.control}
                      name="medicalInfo.cancer"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Cáncer
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Actual o en remisión
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Tatuajes */}
                    <FormField
                      control={form.control}
                      name="medicalInfo.tattoos"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Tatuajes
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              En zona de tratamiento
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Alergias */}
                <FormField
                  control={form.control}
                  name="medicalInfo.allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alergias</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe cualquier alergia conocida (medicamentos, cosméticos, alimentos, etc.)"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Medicamentos */}
                <FormField
                  control={form.control}
                  name="medicalInfo.medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicamentos Actuales</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Lista todos los medicamentos que toma actualmente"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Otra información médica */}
                <FormField
                  control={form.control}
                  name="medicalInfo.other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otra Información Médica</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Cualquier otra información médica relevante (cirugías recientes, embarazo, etc.)"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumen de condiciones médicas */}
                {hasMedicalConditions && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <h4 className="font-medium text-yellow-800 mb-2">
                        ⚠️ Información Médica Registrada
                      </h4>
                      <div className="space-y-2">
                        {medicalInfo.diabetes && (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-800 mr-2">
                            Diabetes
                          </Badge>
                        )}
                        {medicalInfo.cancer && (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-800 mr-2">
                            Cáncer
                          </Badge>
                        )}
                        {medicalInfo.tattoos && (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-800 mr-2">
                            Tatuajes
                          </Badge>
                        )}
                        {medicalInfo.allergies && (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-800 mr-2">
                            Alergias
                          </Badge>
                        )}
                        {medicalInfo.medications && (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-800 mr-2">
                            Medicamentos
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-yellow-700 mt-2">
                        Se mostrarán advertencias automáticas al agendar tratamientos que puedan requerir precauciones especiales.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Información del sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
                <CardDescription>
                  Datos automáticos del cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliente desde:</p>
                    <p className="font-medium">
                      {client.createdAt?.toDate?.()?.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última actualización:</p>
                    <p className="font-medium">
                      {client.updatedAt?.toDate?.()?.toLocaleDateString('es-ES', {
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
                    onClick={() => router.push(`/admin/clients/${clientId}`)}
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
                      'Actualizar Cliente'
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