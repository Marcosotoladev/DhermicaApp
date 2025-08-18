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
  AlertCircle,
  Eye,
  BarChart3,
  Zap,
  CheckCircle,
  AlertTriangle,
  Star,
  Map,
  Phone,
  Mail
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Skeleton } from '../../../components/ui/skeleton'
import { appointmentService, clientService, treatmentService } from '../../../lib/firebase-services'
import { formatDate, formatTime, formatTimeString, combineDateAndTime } from '../../../lib/time-utils'

/**
 * Dashboard de administración responsivo
 * Mobile-first con optimizaciones para escritorio
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
    completedToday: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    nextAppointment: null
  })
  const [todayAppointments, setTodayAppointments] = useState([])
  const [recentClients, setRecentClients] = useState([])
  const [topTreatments, setTopTreatments] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

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
      
      // Cargar citas del día
      let appointments = []
      try {
        appointments = await appointmentService.getByDate(today)
        setTodayAppointments(appointments)
        
        // Encontrar próxima cita
        const now = new Date()
        const upcomingAppointments = appointments
          .filter(apt => {
            const appointmentTime = new Date(`${formatDate(today)} ${apt.startTime}`)
            return appointmentTime > now
          })
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
        
        const nextAppointment = upcomingAppointments[0] || null
        
        setStats(prev => ({ ...prev, nextAppointment }))
        
      } catch (aptError) {
        console.warn('Error cargando citas:', aptError)
        setDataError('Error cargando citas del día')
      }
      
      // Cargar datos adicionales
      let clients = []
      let treatments = []
      
      try {
        const [clientsData, treatmentsData] = await Promise.all([
          clientService.search('').catch(() => []),
          treatmentService.getAll().catch(() => [])
        ])
        clients = clientsData
        treatments = treatmentsData
        
        // Clientes recientes (últimos 5)
        const sortedClients = clients
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
        setRecentClients(sortedClients)
        
        // Tratamientos más populares (simulado por ahora)
        const popularTreatments = treatments
          .slice(0, 4)
          .map(treatment => ({
            ...treatment,
            bookings: Math.floor(Math.random() * 50) + 10 // Simulado
          }))
          .sort((a, b) => b.bookings - a.bookings)
        setTopTreatments(popularTreatments)
        
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
      
      // Simulación de ingresos semanales y mensuales
      const weekRevenue = todayRevenue * 5.2 // Promedio semanal
      const monthRevenue = todayRevenue * 22 // Promedio mensual
      
      setStats(prev => ({
        ...prev,
        todayAppointments: appointments.length,
        totalClients: clients.length,
        totalTreatments: treatments.length,
        todayRevenue,
        pendingAppointments,
        completedToday,
        weekRevenue,
        monthRevenue
      }))
      
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
      title: 'Ver Agenda',
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
    },
    {
      title: 'Profesionales',
      description: 'Gestionar equipo',
      icon: UserCheck,
      href: '/admin/professionals',
      color: 'bg-orange-500 text-white'
    },
    {
      title: 'Reportes',
      description: 'Ver estadísticas',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-indigo-500 text-white'
    }
  ]

  // Loading state
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="bg-card rounded-2xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 lg:h-8 lg:w-64" />
                <Skeleton className="h-4 w-32 lg:w-40" />
              </div>
              <Skeleton className="h-8 w-20 lg:h-10 lg:w-24" />
            </div>
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 lg:h-32 rounded-xl" />
            ))}
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
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
      
      {/* Header responsivo */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl lg:text-3xl font-bold text-foreground">
                Panel Administrativo 👨‍⚕️
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                {formatDate(new Date(), 'EEEE d \'de\' MMMM')} • {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Próxima cita - Solo desktop */}
              {stats.nextAppointment && (
                <div className="hidden lg:flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Próxima: {stats.nextAppointment.startTime}</p>
                    <p className="text-blue-700">{stats.nextAppointment.clientName}</p>
                  </div>
                </div>
              )}
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs lg:text-sm text-muted-foreground">
              <UserCheck className="h-3 w-3 lg:h-4 lg:w-4" />
              <span>{user?.email}</span>
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 hidden lg:inline">Sistema activo</span>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {dataError && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <p className="text-orange-800 text-sm">{dataError}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        
        {/* Métricas principales - Grid responsivo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Citas de hoy */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-xs lg:text-sm font-medium mb-1">
                    Citas Hoy
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold">{stats.todayAppointments}</p>
                  <p className="text-xs lg:text-sm text-primary-foreground/80">
                    {stats.pendingAppointments} pendientes
                  </p>
                </div>
                <Calendar className="h-8 w-8 lg:h-10 lg:w-10 text-primary-foreground/60" />
              </div>
            </CardContent>
          </Card>

          {/* Ingresos del día */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs lg:text-sm font-medium mb-1">
                    Ingresos Hoy
                  </p>
                  <p className="text-xl lg:text-2xl font-bold">
                    ${stats.todayRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs lg:text-sm text-white/80">
                    {stats.completedToday} completadas
                  </p>
                </div>
                <DollarSign className="h-8 w-8 lg:h-10 lg:w-10 text-white/60" />
              </div>
            </CardContent>
          </Card>

          {/* Total clientes */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs lg:text-sm font-medium mb-1">
                    Clientes
                  </p>
                  <p className="text-xl lg:text-2xl font-bold">{stats.totalClients}</p>
                  <p className="text-xs lg:text-sm text-white/80">
                    Total registrados
                  </p>
                </div>
                <Users className="h-8 w-8 lg:h-10 lg:w-10 text-white/60" />
              </div>
            </CardContent>
          </Card>

          {/* Tratamientos */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs lg:text-sm font-medium mb-1">
                    Servicios
                  </p>
                  <p className="text-xl lg:text-2xl font-bold">{stats.totalTreatments}</p>
                  <p className="text-xs lg:text-sm text-white/80">
                    Disponibles
                  </p>
                </div>
                <Briefcase className="h-8 w-8 lg:h-10 lg:w-10 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout responsivo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna principal - 2/3 en desktop */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Acciones rápidas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg lg:text-xl">Acciones Rápidas</CardTitle>
                <CardDescription>Funciones principales del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {quickActions.map((action) => (
                    <Button
                      key={action.title}
                      variant="outline"
                      className={`h-auto p-4 lg:p-6 flex flex-col items-center space-y-2 lg:space-y-3 border-2 transition-all ${
                        action.urgent ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'
                      }`}
                      onClick={() => router.push(action.href)}
                    >
                      <div className={`p-2 lg:p-3 rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm lg:text-base">{action.title}</p>
                        <p className="text-xs lg:text-sm text-muted-foreground">{action.description}</p>
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
                    <CardTitle className="text-lg lg:text-xl">Agenda de Hoy</CardTitle>
                    <CardDescription>
                      {todayAppointments.length} citas programadas
                    </CardDescription>
                  </div>
                  {todayAppointments.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => router.push('/admin/appointments')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver todas
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {todayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {todayAppointments.slice(0, 6).map((appointment) => {
                      const timeStatus = getTimeStatus(appointment)
                      
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 lg:p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/appointments/${appointment.id}`)}
                        >
                          <div className="flex items-center space-x-3 lg:space-x-4">
                            <div className="text-center">
                              <p className="text-lg lg:text-xl font-bold text-primary">
                                {formatTimeString(appointment.startTime)}
                              </p>
                              <p className="text-xs lg:text-sm text-muted-foreground">
                                {appointment.duration || 60}min
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-sm lg:text-base">{appointment.clientName}</p>
                              <p className="text-xs lg:text-sm text-muted-foreground">
                                {appointment.treatmentId || 'Tratamiento'}
                              </p>
                              {appointment.price && (
                                <p className="text-xs lg:text-sm font-medium text-green-600">
                                  ${appointment.price.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${timeStatus.color} border-0 mb-2`}>
                              {timeStatus.label}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 lg:py-12">
                    <Calendar className="h-12 w-12 lg:h-16 lg:w-16 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-medium mb-2 lg:text-lg">No hay citas para hoy</h3>
                    <p className="text-sm lg:text-base text-muted-foreground mb-4">
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
          </div>

          {/* Sidebar derecho - 1/3 en desktop */}
          <div className="space-y-6">
            
            {/* Métricas adicionales - Solo desktop */}
            <div className="hidden lg:block">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Resumen Financiero</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ingresos Semana</span>
                    <span className="font-medium">${stats.weekRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ingresos Mes</span>
                    <span className="font-medium">${stats.monthRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Promedio por Cita</span>
                    <span className="font-medium">
                      ${stats.todayAppointments > 0 ? Math.round(stats.todayRevenue / stats.todayAppointments).toLocaleString() : '0'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Clientes recientes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Clientes Recientes</CardTitle>
                <CardDescription>Últimos registros</CardDescription>
              </CardHeader>
              <CardContent>
                {recentClients.length > 0 ? (
                  <div className="space-y-3">
                    {recentClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/clients/${client.id}`)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {client.name?.charAt(0)?.toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay clientes recientes
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tratamientos populares */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Servicios Populares</CardTitle>
              </CardHeader>
              <CardContent>
                {topTreatments.length > 0 ? (
                  <div className="space-y-3">
                    {topTreatments.map((treatment, index) => (
                      <div
                        key={treatment.id}
                        className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full">
                          <span className="text-xs font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{treatment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {treatment.bookings} reservas • ${treatment.basePrice}
                          </p>
                        </div>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Cargando estadísticas...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botón flotante - Solo móvil */}
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={() => router.push('/admin/appointments/new')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Espaciado inferior */}
        <div className="h-20 lg:h-8"></div>
      </div>
    </div>
  )
}