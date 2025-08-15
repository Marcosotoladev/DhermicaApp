// src/app/(client)/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '../../../lib/firebase'
import { doc, getDoc, query, collection, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { 
  Calendar, 
  Clock, 
  User, 
  Heart, 
  LogOut, 
  Plus, 
  ChevronRight, 
  Phone, 
  Mail,
  MapPin,
  Star,
  Activity,
  Bell,
  Settings,
  CreditCard,
  Gift
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { formatDate, formatTime, isToday, isFuture } from '../../../lib/time-utils'
import { Skeleton } from '../../../components/ui/skeleton'

/**
 * Dashboard móvil-first para cliente
 * Optimizado para experiencia móvil con diseño moderno
 */
export default function ClientDashboard() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [clientData, setClientData] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState('')
  const [stats, setStats] = useState({
    totalAppointments: 0,
    nextAppointment: null,
    favoriteService: 'Ninguno',
    memberSince: null
  })

  useEffect(() => {
    if (user) {
      loadClientData()
    }
  }, [user])

  const loadClientData = async () => {
    if (!user) return

    setLoadingData(true)
    setDataError('')
    
    try {
      // Cargar datos del cliente
      const clientDoc = await getDoc(doc(db, 'clients', user.uid))
      
      if (clientDoc.exists()) {
        const clientInfo = { id: clientDoc.id, ...clientDoc.data() }
        setClientData(clientInfo)
      } else {
        setDataError('No se encontró tu perfil')
        return
      }

      // Cargar citas (con manejo de índice faltante)
      try {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('clientId', '==', user.uid),
          orderBy('date', 'asc'),
          limit(10)
        )

        const appointmentsSnapshot = await getDocs(appointmentsQuery)
        const appointments = []
        
        for (const docSnap of appointmentsSnapshot.docs) {
          const appointmentData = docSnap.data()
          
          if (appointmentData.date && appointmentData.startTime) {
            // Cargar información adicional del tratamiento y profesional
            let treatmentName = 'Tratamiento'
            let professionalName = 'Profesional'
            
            if (appointmentData.treatmentId) {
              try {
                const treatmentDoc = await getDoc(doc(db, 'treatments', appointmentData.treatmentId))
                if (treatmentDoc.exists()) {
                  treatmentName = treatmentDoc.data().name
                }
              } catch (e) {
                console.warn('Error cargando tratamiento:', e)
              }
            }
            
            if (appointmentData.professionalId) {
              try {
                const professionalDoc = await getDoc(doc(db, 'professionals', appointmentData.professionalId))
                if (professionalDoc.exists()) {
                  professionalName = professionalDoc.data().name
                }
              } catch (e) {
                console.warn('Error cargando profesional:', e)
              }
            }

            appointments.push({
              id: docSnap.id,
              ...appointmentData,
              treatmentName,
              professionalName
            })
          }
        }

        // Separar citas futuras y pasadas
        const now = new Date()
        const upcoming = appointments.filter(apt => {
          try {
            const appointmentDate = apt.date.toDate ? apt.date.toDate() : new Date(apt.date)
            return appointmentDate >= now
          } catch {
            return false
          }
        })

        const recent = appointments.filter(apt => {
          try {
            const appointmentDate = apt.date.toDate ? apt.date.toDate() : new Date(apt.date)
            return appointmentDate < now
          } catch {
            return false
          }
        }).slice(0, 3)

        setUpcomingAppointments(upcoming)
        setRecentAppointments(recent)

        // Calcular estadísticas
        const nextAppointment = upcoming.length > 0 ? upcoming[0] : null
        setStats({
          totalAppointments: appointments.length,
          nextAppointment,
          favoriteService: 'Limpieza Facial', // Placeholder
          memberSince: clientData?.createdAt
        })

      } catch (appointmentsError) {
        if (appointmentsError.message.includes('index')) {
          setDataError('Configurando base de datos... Las citas estarán disponibles pronto.')
        } else {
          setDataError('Error cargando citas')
        }
      }

    } catch (error) {
      console.error('Error loading client data:', error)
      setDataError('Error cargando datos')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '¡Buenos días'
    if (hour < 18) return '¡Buenas tardes'
    return '¡Buenas noches'
  }

  const getFirstName = () => {
    if (!clientData?.name) return 'Cliente'
    return clientData.name.split(' ')[0]
  }

  const quickActions = [
    {
      title: 'Agendar Cita',
      icon: Plus,
      href: '/treatments',
      color: 'bg-primary text-primary-foreground',
      description: 'Nueva cita'
    },
    {
      title: 'Mis Citas',
      icon: Calendar,
      href: '/client/appointments',
      color: 'bg-blue-500 text-white',
      description: 'Ver agenda'
    },
    {
      title: 'Mi Perfil',
      icon: User,
      href: '/client/profile',
      color: 'bg-green-500 text-white',
      description: 'Editar datos'
    },
    {
      title: 'Historial',
      icon: Clock,
      href: '/client/history',
      color: 'bg-purple-500 text-white',
      description: 'Ver historial'
    }
  ]

  // Loading state
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
          
          {/* Quick actions skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          
          {/* Cards skeleton */}
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">
              {error ? `Error: ${error.message}` : 'No autenticado'}
            </p>
            <Button onClick={() => router.push('/login')}>
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      
      {/* Header con diseño móvil-first */}
      <div className=" border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-medium">
                  {clientData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {getGreeting()}, {getFirstName()}! 👋
                </h1>
                <p className="text-sm text-muted-foreground">
                  {clientData?.nickname ? `"${clientData.nickname}"` : 'Bienvenido a Dhermica'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Error banner */}
          {dataError && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-orange-800 text-sm">{dataError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4 space-y-6">
        
        {/* Próxima cita destacada */}
        {stats.nextAppointment && (
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium mb-1">
                    Tu próxima cita
                  </p>
                  <h3 className="text-lg font-bold mb-2">
                    {stats.nextAppointment.treatmentName}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-primary-foreground/90">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(stats.nextAppointment.date.toDate ? stats.nextAppointment.date.toDate() : stats.nextAppointment.date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{stats.nextAppointment.startTime}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => router.push('/client/appointments')}
                  >
                    Ver detalles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalAppointments}</p>
                  <p className="text-xs text-muted-foreground">Citas realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-green-100 rounded-full">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{upcomingAppointments.length}</p>
                  <p className="text-xs text-muted-foreground">Próximas citas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 border-2 hover:border-primary/50 transition-all"
                  onClick={() => router.push(action.href)}
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximas citas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Mis Próximas Citas</CardTitle>
              {upcomingAppointments.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/client/appointments')}
                >
                  Ver todas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Heart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{appointment.treatmentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(appointment.date.toDate ? appointment.date.toDate() : appointment.date)} • {appointment.startTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Con {appointment.professionalName}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-2">No tienes citas programadas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ¡Es hora de cuidarte! Agenda tu próximo tratamiento
                </p>
                <Button onClick={() => router.push('/treatments')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Cita
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial reciente */}
        {recentAppointments.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Historial Reciente</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/client/history')}
                >
                  Ver todo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{appointment.treatmentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(appointment.date.toDate ? appointment.date.toDate() : appointment.date)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Completado
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información personal compacta */}
        {clientData && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Mi Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Email</span>
                  </div>
                  <span className="text-sm font-medium">{clientData.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Teléfono</span>
                  </div>
                  <span className="text-sm font-medium">{clientData.phone}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push('/client/profile')}
                  className="w-full mt-3"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Actualizar perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Espaciado inferior para navegación móvil */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}