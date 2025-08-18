// src/app/client/profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Heart, 
  Save, 
  Edit,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  X,
  Shield,
  Info
} from 'lucide-react'
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
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Skeleton } from '../../../components/ui/skeleton'
import { Badge } from '../../../components/ui/badge'
import { useAuthStore } from '../../../store/auth'
import { clientService } from '../../../lib/firebase-services'
import { clientSchema } from '../../../lib/validations'
import { formatDate } from '../../../lib/time-utils'

/**
 * Página de perfil del cliente - Optimizada para móvil
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
  const [showMedicalInfo, setShowMedicalInfo] = useState(false)

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
      
      // Auto-hide success message
      setTimeout(() => setSuccess(''), 3000)
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

  const getMedicalConditionsCount = (medicalInfo) => {
    if (!medicalInfo) return 0
    let count = 0
    if (medicalInfo.diabetes) count++
    if (medicalInfo.cancer) count++
    if (medicalInfo.tattoos) count++
    if (medicalInfo.allergies) count++
    if (medicalInfo.medications) count++
    if (medicalInfo.other) count++
    return count
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError('')
    setSuccess('')
    loadClientData() // Recargar datos originales
  }

  // Loading state optimizado
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      
      {/* Header optimizado para móvil y desktop */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/client/dashboard')}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">Mi Perfil</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Gestiona tu información personal y médica
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                variant={isEditing ? "outline" : "default"}
                size="sm"
              >
                {isEditing ? <X className="h-4 w-4 sm:mr-2" /> : <Edit className="h-4 w-4 sm:mr-2" />}
                <span className="hidden sm:inline">{isEditing ? 'Cancelar' : 'Editar'}</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/client/appointments')}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Mis citas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/client/history')}>
                    <User className="h-4 w-4 mr-2" />
                    Mi historial
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="ghost" size="sm" onClick={() => setError('')}>
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between text-green-800">
                {success}
                <Button variant="ghost" size="sm" onClick={() => setSuccess('')}>
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {clientData && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Resumen del perfil - Mobile */}
              <Card className="sm:hidden">
                <CardContent className="p-4 text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-3">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {clientData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{clientData.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Cliente desde {formatDate(clientData.createdAt?.toDate() || new Date(), 'MMM yyyy')}
                  </p>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">Perfil completo</span>
                  </div>
                  {hasMedicalInfo(clientData.medicalInfo) && (
                    <Badge variant="outline" className="mt-2 text-orange-600 border-orange-200">
                      <Heart className="h-3 w-3 mr-1" />
                      Información médica registrada
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Información básica */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <User className="h-5 w-5 text-primary" />
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
                                className={!isEditing ? 'bg-muted/50 border-0' : ''}
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
                                  className={`pl-10 ${!isEditing ? 'bg-muted/50 border-0' : ''}`}
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
                                  className={`pl-10 ${!isEditing ? 'bg-muted/50 border-0' : ''}`}
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
                              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md border-0">
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <Heart className="h-5 w-5 text-primary" />
                            <span>Información Médica</span>
                          </CardTitle>
                          <CardDescription>
                            Información importante para tus tratamientos
                          </CardDescription>
                        </div>
                        
                        {/* Mobile medical info sheet */}
                        <Sheet open={showMedicalInfo} onOpenChange={setShowMedicalInfo}>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="sm:hidden">
                              <Info className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="bottom" className="h-[80vh]">
                            <SheetHeader>
                              <SheetTitle>¿Por qué necesitamos esta información?</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-4 text-sm">
                              <p>La información médica nos ayuda a:</p>
                              <ul className="space-y-2 list-disc pl-4">
                                <li>Seleccionar los tratamientos más seguros para ti</li>
                                <li>Evitar complicaciones durante los procedimientos</li>
                                <li>Personalizar los cuidados según tus necesidades</li>
                                <li>Cumplir con protocolos de seguridad</li>
                              </ul>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-blue-800 font-medium">
                                  <Shield className="h-4 w-4 inline mr-2" />
                                  Tu información está protegida
                                </p>
                                <p className="text-blue-700 text-xs mt-1">
                                  Cumplimos con todas las normativas de privacidad médica
                                </p>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {/* Checkboxes de condiciones */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="medicalInfo.diabetes"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none flex-1">
                                <FormLabel className="font-medium">Diabetes</FormLabel>
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
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none flex-1">
                                <FormLabel className="font-medium">Cáncer</FormLabel>
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
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none flex-1">
                                <FormLabel className="font-medium">Tatuajes</FormLabel>
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
                                className={`resize-none ${!isEditing ? 'bg-muted/50 border-0' : ''}`}
                                rows={3}
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
                                className={`resize-none ${!isEditing ? 'bg-muted/50 border-0' : ''}`}
                                rows={3}
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
                                className={`resize-none ${!isEditing ? 'bg-muted/50 border-0' : ''}`}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar con resumen - Desktop only */}
                <div className="hidden lg:block space-y-6">
                  <Card>
                    <CardHeader className="text-center">
                      <Avatar className="h-24 w-24 mx-auto">
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {clientData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="truncate">{clientData.name}</CardTitle>
                      <CardDescription>
                        Cliente desde {formatDate(clientData.createdAt?.toDate() || new Date(), 'MMMM yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Estado del perfil</p>
                        <div className="flex items-center justify-center space-x-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-600">Completo</span>
                        </div>
                      </div>
                      
                      {hasMedicalInfo(clientData.medicalInfo) && (
                        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <Heart className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                          <p className="text-xs text-orange-800 font-medium">
                            Información médica registrada
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            {getMedicalConditionsCount(clientData.medicalInfo)} elemento(s)
                          </p>
                        </div>
                      )}

                      <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <Shield className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                        <p className="text-xs text-blue-800 font-medium">
                          Datos protegidos
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Tu información está segura
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Botón de guardar - Mobile sticky */}
              {isEditing && (
                <div className="sticky bottom-4 z-10">
                  <Button 
                    type="submit" 
                    disabled={saving} 
                    className="w-full shadow-lg"
                    size="lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              )}

              {/* Botón de guardar - Desktop sidebar */}
              {isEditing && (
                <div className="hidden lg:block fixed right-6 bottom-6">
                  <Button type="submit" disabled={saving} className="shadow-lg">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        )}

        {/* Espaciado inferior */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}