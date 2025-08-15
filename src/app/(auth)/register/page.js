// src/app/(auth)/register/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { z } from 'zod'
import { User, Mail, Phone, Heart, Eye, EyeOff, UserCheck } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Checkbox } from '../../../components/ui/checkbox'
import { Textarea } from '../../../components/ui/textarea'
import { Separator } from '../../../components/ui/separator'
import { BirthDatePicker } from '../../../components/ui/birth-date-picker'
import { auth, db } from '../../../lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const registerSchema = z.object({
  // Datos básicos
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  nickname: z.string().min(2, 'El apodo debe tener al menos 2 caracteres').optional().or(z.literal('')),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  dateOfBirth: z.date({ required_error: 'Fecha de nacimiento requerida' }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  
  // Información médica
  medicalInfo: z.object({
    diabetes: z.boolean().default(false),
    cancer: z.boolean().default(false),
    tattoos: z.boolean().default(false),
    allergies: z.string().default(''),
    medications: z.string().default(''),
    other: z.string().default('')
  })
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  }
)

/**
 * Página de registro para nuevos clientes
 * Incluye información personal y médica
 */
export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: datos básicos, 2: info médica
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      nickname: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
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

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      console.log('Iniciando registro...', { email: data.email })
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      )

      console.log('Usuario creado en Auth:', userCredential.user.uid)

      // Preparar datos del cliente
      const clientData = {
        name: data.name,
        nickname: data.nickname || '', // Apodo opcional
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        medicalInfo: data.medicalInfo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      console.log('Creando documento de usuario primero...')

      // IMPORTANTE: Crear documento de usuario PRIMERO
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: data.email,
        role: 'client',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      })

      console.log('Documento de usuario creado, ahora creando perfil de cliente...')

      // Luego crear perfil de cliente
      await setDoc(doc(db, 'clients', userCredential.user.uid), clientData)

      console.log('Perfil de cliente creado exitosamente')

      // Redirigir al dashboard del cliente
      console.log('Redirigiendo a dashboard...')
      router.push('/client/dashboard')

    } catch (error) {
      console.error('Registration error:', error)
      
      if (error.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con este email')
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña es muy débil')
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido')
      } else if (error.code === 'permission-denied') {
        setError('Error de permisos. Verifica la configuración de Firestore.')
      } else {
        setError(`Error al crear la cuenta: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const nextStep = async () => {
    // Validar campos del paso 1
    const fieldsToValidate = ['name', 'email', 'phone', 'dateOfBirth', 'password', 'confirmPassword']
    
    // Trigger validación
    const results = await Promise.all(
      fieldsToValidate.map(field => form.trigger(field))
    )
    
    // Si todos los campos son válidos, continuar al paso 2
    if (results.every(result => result)) {
      setStep(2)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Únete a Dhermica
          </h1>
          <p className="text-muted-foreground">
            Crea tu cuenta para agendar citas y acceder a tu historial
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {step === 1 ? 'Información Personal' : 'Información Médica'}
                </CardTitle>
                <CardDescription>
                  {step === 1 
                    ? 'Completa tus datos básicos'
                    : 'Ayúdanos a brindarte el mejor servicio'
                  }
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Paso 1: Datos básicos */}
                {step === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input placeholder="Tu nombre completo" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apodo <span className="text-muted-foreground text-sm">(opcional)</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input placeholder="¿Cómo te gusta que te llamen?" className="pl-10" {...field} />
                            </div>
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
                                type="email" 
                                placeholder="tu@email.com" 
                                className="pl-10" 
                                {...field} 
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
                              <Input placeholder="+54 11 1234 5678" className="pl-10" {...field} />
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
                          <FormControl>
                            <BirthDatePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecciona tu fecha de nacimiento"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                className="pr-10"
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                className="pr-10"
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="button" onClick={nextStep} className="w-full">
                      Continuar
                    </Button>
                  </>
                )}

                {/* Paso 2: Información médica */}
                {step === 2 && (
                  <>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Condiciones médicas</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Esta información nos ayuda a recomendarte los tratamientos más adecuados
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="medicalInfo.diabetes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
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

                      <Separator />

                      <FormField
                        control={form.control}
                        name="medicalInfo.allergies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alergias</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe cualquier alergia conocida..."
                                className="resize-none"
                                {...field}
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
                                placeholder="Lista los medicamentos que tomas actualmente..."
                                className="resize-none"
                                {...field}
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
                                placeholder="Cualquier otra información médica relevante..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {error && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                        {error}
                      </div>
                    )}

                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1"
                      >
                        Anterior
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Link a login */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => router.push('/login')}
            >
              Inicia sesión aquí
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}