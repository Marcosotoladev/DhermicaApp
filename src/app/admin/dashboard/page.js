// src/app/admin/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../../lib/firebase'
import { 
  Calendar, 
  Users, 
  Briefcase, 
  Plus, 
  LogOut, 
  Clock, 
  TrendingUp,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Activity,
  DollarSign,
  UserCheck,
  AlertCircle
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Skeleton } from '../../../components/ui/skeleton'
import { appointmentService, clientService, treatmentService } from '../../../lib/firebase-services'
import { formatDate, formatTime, formatTimeString, combineDateAndTime } from '../../../lib/time-utils'

/**
 * Dashboard de administración mobile-first
 * Optimizado para gestión móvil de la clínica
 */
export default function AdminDashboard() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalClients: 0,
    totalTreatments: 0,
    todayRevenue: 0,
    pendingAppointments: 0,
    completedToday: 0
  })
  const [todayAppointments, setTodayAppointments] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    setLoadingData(true)
    setDataError('')
    
    try {
      const today = new Date()
      
      // Cargar citas del día con manejo de errores
      let appointments = []
      try {
        appointments = await appointmentService.getByDate(today)
        setTodayAppointments(appointments)
      } catch (aptError) {
        console.warn('Error cargando citas:', aptError)
        setDataError('Error cargando citas del día')
      }
      
      // Cargar estadísticas básicas
      let clients = []
      let treatments = []
      
      try {
        const [clientsData, treatmentsData] = await Promise.all([
          clientService.search('').catch(() => []),
          treatmentService.getAll().catch(() => [])
        ])
        clients = clientsData
        treatments = treatmentsData
      } catch (statsError) {
        console.warn('Error cargando estadísticas:', statsError)
      }
      
      // Calcular métricas del día
      const todayRevenue = appointments.reduce((total, apt) => {
        return total + (apt.price || 0)
      }, 0)
      
      const now = new Date()
      const completedToday = appointments.filter(apt => {
        const appointmentTime = new Date(`${formatDate(today)} ${apt.startTime}`)
        return appointmentTime < now
      }).length
      
      const pendingAppointments = appointments.length - completedToday
      
      setStats({
        todayAppointments: appointments.length,
        totalClients: clients.length,
        totalTreatments: treatments.length,
        todayRevenue,
        pendingAppointments,
        completedToday
      })
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setDataError('Error cargando datos del dashboard')
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

  const getTimeStatus = (appointment) => {
    const now = new Date()
    const appointmentDateTime = new Date(`${formatDate(new Date())} ${appointment.startTime}`)
    
    if (appointmentDateTime < now) {
      return { status: 'completed', label: 'Completada', color: 'bg-green-100 text-green-800' }
    } else if (appointmentDateTime <= new Date(now.getTime() + 30 * 60000)) {
      return { status: 'next', label: 'Próxima', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { status: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' }
    }
  }

  const quickActions = [
    {
      title: 'Nueva Cita',
      description: 'Agendar cita',
      icon: Plus,
      href: '/admin/appointments/new',
      color: 'bg-primary text-primary-foreground',
      urgent: true
    },
    {
      title: 'Ver Citas',
      description: 'Agenda completa',
      icon: Calendar,
      href: '/admin/appointments',
      color: 'bg-blue-500 text-white'
    },
    {
      title: 'Clientes',
      description: 'Gestionar clientes',
      icon: Users,
      href: '/admin/clients',
      color: 'bg-green-500 text-white'
    },
    {
      title: 'Tratamientos',
      description: 'Configurar servicios',
      icon: Briefcase,
      href: '/admin/treatments',
      color: 'bg-purple-500 text-white'
    }
  ]

  // Loading state
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          
          {/* Actions skeleton */}
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">
              {error ? `Error: ${error.message}` : 'Acceso no autorizado'}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      {/* Header mobile-optimized */}
      <div className=" border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Panel Admin 👨‍⚕️
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatDate(new Date(), 'EEEE d \'de\' MMMM')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* User info compacto */}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <UserCheck className="h-3 w-3" />
            <span>{user?.email}</span>
            <Badge variant="secondary" className="text-xs">Admin</Badge>
          </div>

          {/* Error banner */}
          {dataError && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-3">
              <p className="text-orange-800 text-sm">{dataError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4 space-y-6">
        
        {/* Métricas destacadas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Citas de hoy */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-xs font-medium mb-1">
                    Citas Hoy
                  </p>
                  <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                  <p className="text-xs text-primary-foreground/80">
                    {stats.pendingAppointments} pendientes
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary-foreground/60" />
              </div>
            </CardContent>
          </Card>

          {/* Ingresos del día */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium mb-1">
                    Ingresos Hoy
                  </p>
                  <p className="text-lg font-bold">
                    ${stats.todayRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/80">
                    {stats.completedToday} completadas
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.totalClients}</p>
                  <p className="text-xs text-muted-foreground">Clientes totales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.totalTreatments}</p>
                  <p className="text-xs text-muted-foreground">Tratamientos</p>
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
                  className={`h-auto p-4 flex flex-col items-center space-y-2 border-2 transition-all ${
                    action.urgent ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'
                  }`}
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

        {/* Citas del día */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Agenda de Hoy</CardTitle>
                <CardDescription>
                  {todayAppointments.length} citas programadas
                </CardDescription>
              </div>
              {todayAppointments.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/appointments')}>
                  Ver todas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((appointment) => {
                  const timeStatus = getTimeStatus(appointment)
                  
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-primary">
                            {formatTimeString(appointment.startTime)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.duration || 60}min
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{appointment.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.treatmentId || 'Tratamiento'}
                          </p>
                          {appointment.price && (
                            <p className="text-xs font-medium text-green-600">
                              ${appointment.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs ${timeStatus.color} border-0`}>
                          {timeStatus.label}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-2">No hay citas para hoy</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comienza agendando la primera cita del día
                </p>
                <Button onClick={() => router.push('/admin/appointments/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cita
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón de acceso rápido flotante */}
        <div className="fixed bottom-6 right-6">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={() => router.push('/admin/appointments/new')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Espaciado inferior para el botón flotante */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}