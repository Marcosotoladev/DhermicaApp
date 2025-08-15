// src/components/forms/login-form.js
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { auth, db } from '../../lib/firebase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida')
})

/**
 * Formulario de inicio de sesión con redirección por rol
 * Permite login con email y contraseña usando Firebase Auth
 */
export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    
    try {
      console.log('Intentando login con email:', data.email)

      // 1. Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user
      
      console.log('Usuario autenticado:', user.uid)

      // 2. Obtener rol del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (!userDoc.exists()) {
        console.error('Documento de usuario no encontrado')
        setError('Perfil de usuario no encontrado. Contacta al administrador.')
        return
      }

      const userData = userDoc.data()
      const userRole = userData.role

      console.log('Rol del usuario:', userRole)

      // 3. Redirigir según el rol
      let redirectUrl = '/login' // fallback

      if (userRole === 'admin') {
        redirectUrl = '/admin/dashboard'
        console.log('Redirigiendo a dashboard de admin')
      } else if (userRole === 'client') {
        redirectUrl = '/client/dashboard'
        console.log('Redirigiendo a dashboard de cliente')
      } else if (userRole === 'professional') {
        redirectUrl = '/admin/dashboard' // Los profesionales van al panel admin por ahora
        console.log('Redirigiendo a dashboard de profesional')
      } else {
        console.error('Rol no reconocido:', userRole)
        setError(`Rol de usuario no válido: ${userRole}`)
        return
      }

      // 4. Redirigir
      console.log('Redirigiendo a:', redirectUrl)
      window.location.href = redirectUrl
      
    } catch (error) {
      console.error('Login error:', error)
      
      // Manejar diferentes tipos de errores
      if (error.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email')
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta')
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido')
      } else if (error.code === 'auth/invalid-credential') {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde.')
      } else {
        setError('Error al iniciar sesión. Verifica tus credenciales.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder a Dhermica</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        placeholder="tu@email.com" 
                        type="email"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        className="pl-10 pr-10"
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

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            {/* Información para testing */}
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <a href="/register" className="text-primary hover:underline">
                  Regístrate aquí
                </a>
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}