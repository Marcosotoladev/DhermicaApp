// src/app/client/profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, User, Mail, Phone, Calendar as CalendarIcon, Heart, Save, Edit } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Checkbox } from '../../../components/ui/checkbox'
import { Textarea } from '../../../components/ui/textarea'
import { Separator } from '../../../components/ui/separator'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { useAuthStore } from '../../../store/auth'
import { clientService } from '../../../lib/firebase-services'
import { clientSchema } from '../../../lib/validations'
import { formatDate } from '../../../lib/time-utils'

/**
 * Página de perfil del cliente
 * Permite ver y editar información personal y médica
 */
export default function ClientProfilePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    if (user) {
      loadClientData()
    }
  }, [user])

  const loadClientData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const client = await clientService.getById(user.uid)
      if (client) {
        setClientData(client)
        
        // Cargar datos en el formulario
        form.reset({
          name: client.name,
          email: client.email,
          phone: client.phone,
          dateOfBirth: client.dateOfBirth instanceof Date ? client.dateOfBirth : client.dateOfBirth.toDate(),
          medicalInfo: {
            diabetes: client.medicalInfo?.diabetes || false,
            cancer: client.medicalInfo?.cancer || false,
            tattoos: client.medicalInfo?.tattoos || false,
            allergies: client.medicalInfo?.allergies || '',
            medications: client.medicalInfo?.medications || '',
            other: client.medicalInfo?.other || ''
          }
        })
      }
    } catch (error) {
      console.error('Error loading client data:', error)
      setError('Error al cargar los datos del perfil')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await clientService.update(user.uid, data)
      setSuccess('Perfil actualizado correctamente')
      setIsEditing(false)
      await loadClientData() // Recargar datos
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const hasMedicalInfo = (medicalInfo) => {
    if (!medicalInfo) return false
    return medicalInfo.diabetes || 
           medicalInfo.cancer || 
           medicalInfo.tattoos || 
           medicalInfo.allergies || 
           medicalInfo.medications || 
           medicalInfo.other
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="space-y-4">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/client/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
              <p className="text-muted-foreground">
                Gestiona tu información personal y médica
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {clientData && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Información básica */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Información Personal</span>
                      </CardTitle>
                      <CardDescription>
                        Datos básicos de tu cuenta
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={!isEditing}
                                className={!isEditing ? 'bg-muted' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  className={`pl-10 ${!isEditing ? 'bg-muted' : ''}`}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de nacimiento</FormLabel>
                            {isEditing ? (
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
                                        <span>Selecciona fecha</span>
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
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(field.value)} ({calculateAge(field.value)} años)</span>
                              </div>
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
                        <Heart className="h-5 w-5" />
                        <span>Información Médica</span>
                      </CardTitle>
                      <CardDescription>
                        Información importante para tus tratamientos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {/* Checkboxes de condiciones */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="medicalInfo.diabetes"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Diabetes</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  ¿Tienes diabetes o problemas de azúcar en sangre?
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="medicalInfo.cancer"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Cáncer</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  ¿Has tenido o tienes actualmente cáncer?
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="medicalInfo.tattoos"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Tatuajes</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  ¿Tienes tatuajes en las zonas a tratar?
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <FormField
                        control={form.control}
                        name="medicalInfo.allergies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alergias</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describe cualquier alergia conocida..."
                                disabled={!isEditing}
                                className={`resize-none ${!isEditing ? 'bg-muted' : ''}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="medicalInfo.medications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medicamentos</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Lista los medicamentos que tomas actualmente..."
                                disabled={!isEditing}
                                className={`resize-none ${!isEditing ? 'bg-muted' : ''}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="medicalInfo.other"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Otra información relevante</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Cualquier otra información médica relevante..."
                                disabled={!isEditing}
                                className={`resize-none ${!isEditing ? 'bg-muted' : ''}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar con resumen */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="text-center">
                      <Avatar className="h-24 w-24 mx-auto">
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {clientData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle>{clientData.name}</CardTitle>
                      <CardDescription>
                        Cliente desde {formatDate(clientData.createdAt?.toDate() || new Date(), 'MMMM yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Estado del perfil</p>
                        <div className="flex items-center justify-center space-x-2 mt-1">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          <span className="text-sm font-medium text-success">Completo</span>
                        </div>
                      </div>
                      
                      {hasMedicalInfo(clientData.medicalInfo) && (
                        <div className="text-center p-3 bg-warning/10 border border-warning/20 rounded-md">
                          <Heart className="h-4 w-4 mx-auto text-warning mb-1" />
                          <p className="text-xs text-warning">
                            Información médica registrada
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {isEditing && (
                    <Button type="submit" disabled={saving} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  )
}