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
  Gift,
  MoreVertical,
  TrendingUp,
  Award,
  Zap,
  AlertCircle,
  X,
  Users,
  Briefcase,
  Tag
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { formatDate, formatTime, isToday, isFuture } from '../../../lib/time-utils'
import { Skeleton } from '../../../components/ui/skeleton'

export default function ClientDashboard() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [clientData, setClientData] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState({
    totalAppointments: 0,
    nextAppointment: null,
    favoriteService: 'Ninguno',
    memberSince: null,
    completedThisMonth: 0,
    totalSpent: 0
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

      // Cargar citas
      try {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('clientId', '==', user.uid),
          orderBy('date', 'asc'),
          limit(20)
        )

        const appointmentsSnapshot = await getDocs(appointmentsQuery)
        const appointments = []
        let totalSpent = 0
        
        for (const docSnap of appointmentsSnapshot.docs) {
          const appointmentData = docSnap.data()
          
          if (appointmentData.date && appointmentData.startTime) {
            let treatmentName = 'Tratamiento'
            let professionalName = 'Profesional'
            let price = 0
            
            if (appointmentData.treatmentId) {
              try {
                const treatmentDoc = await getDoc(doc(db, 'treatments', appointmentData.treatmentId))
                if (treatmentDoc.exists()) {
                  const treatmentData = treatmentDoc.data()
                  treatmentName = treatmentData.name
                  price = treatmentData.basePrice || 0
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

            const appointmentDate = appointmentData.date.toDate ? appointmentData.date.toDate() : new Date(appointmentData.date)
            if (appointmentDate < new Date()) {
              totalSpent += appointmentData.price || price
            }

            appointments.push({
              id: docSnap.id,
              ...appointmentData,
              treatmentName,
              professionalName,
              calculatedPrice: price
            })
          }
        }

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
        }).slice(0, 5)

        setUpcomingAppointments(upcoming)
        setRecentAppointments(recent)

        const nextAppointment = upcoming.length > 0 ? upcoming[0] : null
        const thisMonth = new Date()
        const completedThisMonth = recent.filter(apt => {
          const aptDate = apt.date.toDate ? apt.date.toDate() : new Date(apt.date)
          return aptDate.getMonth() === thisMonth.getMonth() && 
                 aptDate.getFullYear() === thisMonth.getFullYear()
        }).length

        const treatmentCounts = {}
        recent.forEach(apt => {
          treatmentCounts[apt.treatmentName] = (treatmentCounts[apt.treatmentName] || 0) + 1
        })
        const favoriteService = Object.keys(treatmentCounts).length > 0 
          ? Object.keys(treatmentCounts).reduce((a, b) => treatmentCounts[a] > treatmentCounts[b] ? a : b)
          : 'Ninguno'

        setStats({
          totalAppointments: appointments.length,
          nextAppointment,
          favoriteService,
          memberSince: clientData?.createdAt,
          completedThisMonth,
          totalSpent
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

  const getMembershipDuration = () => {
    if (!stats.memberSince) return 'Nuevo'
    
    const now = new Date()
    const memberDate = stats.memberSince.toDate ? stats.memberSince.toDate() : new Date(stats.memberSince)
    const months = Math.floor((now - memberDate) / (1000 * 60 * 60 * 24 * 30))
    
    if (months < 1) return 'Nuevo miembro'
    if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`
    const years = Math.floor(months / 12)
    return `${years} ${years === 1 ? 'año' : 'años'}`
  }

  const quickActions = [
    {
      title: 'Agendar Cita',
      icon: Plus,
      href: '/treatments',
      color: 'bg-primary text-primary-foreground',
      description: 'Nueva cita',
      featured: true
    },
    {
      title: 'Mis Citas',
      icon: Calendar,
      href: '/client/appointments',
      color: 'bg-blue-500 text-white',
      description: 'Ver agenda'
    },
    {
      title: 'Promociones',
      icon: Tag,
      href: '/promotions',
      color: 'bg-orange-500 text-white',
      description: 'Ofertas especiales'
    },
    {
      title: 'Tratamientos',
      icon: Briefcase,
      href: '/treatments',
      color: 'bg-purple-500 text-white',
      description: 'Ver servicios'
    },
    {
      title: 'Profesionales',
      icon: Users,
      href: '/client/professionals',
      color: 'bg-green-500 text-white',
      description: 'Conoce el equipo'
    },
    {
      title: 'Mi Perfil',
      icon: User,
      href: '/client/profile',
      color: 'bg-gray-500 text-white',
      description: 'Editar datos'
    }
  ]

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
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
      
      {/* Header - MANTENIDO ORIGINAL */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-medium">
                  {clientData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-foreground truncate">
                  {getGreeting()}, {getFirstName()}! 👋
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {clientData?.nickname ? `"${clientData.nickname}"` : 'Bienvenido a Dhermica'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Sheet open={showStats} onOpenChange={setShowStats}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh]">
                  <SheetHeader>
                    <SheetTitle>Mis Estadísticas</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                          <p className="text-xs text-muted-foreground">Total citas</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
                          <p className="text-xs text-muted-foreground">Este mes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Heart className="h-6 w-6 text-rose-600 mx-auto mb-2" />
                          <p className="text-lg font-bold">${stats.totalSpent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total invertido</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                          <p className="text-lg font-bold">{getMembershipDuration()}</p>
                          <p className="text-xs text-muted-foreground">Miembro desde</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Servicio Favorito</h4>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="font-medium text-primary">{stats.favoriteService}</p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push('/client/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Mi perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/client/appointments')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Mis citas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/client/history')}>
                    <Clock className="h-4 w-4 mr-2" />
                    Historial
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowStats(true)} className="sm:hidden">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Estadísticas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {dataError && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <p className="text-orange-800 text-sm">{dataError}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDataError('')}
                className="text-orange-600 hover:text-orange-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* 1. MIS PRÓXIMAS VISITAS - Primera sección */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Mis Próximas Visitas</span>
              </CardTitle>
              {upcomingAppointments.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/client/appointments')}
                >
                  Ver todas
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Próxima cita destacada */}
            {stats.nextAppointment && (
              <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative mb-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <CardContent className="p-4 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0 text-xs">
                          Próxima cita
                        </Badge>
                        <Zap className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 truncate">
                        {stats.nextAppointment.treatmentName}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-primary-foreground/90">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {formatDate(stats.nextAppointment.date.toDate ? stats.nextAppointment.date.toDate() : stats.nextAppointment.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{stats.nextAppointment.startTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{stats.nextAppointment.professionalName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => router.push('/client/appointments')}
                        className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de próximas citas */}
            {upcomingAppointments.length > 1 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(1, 4).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => router.push('/client/appointments')}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{appointment.treatmentName}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(appointment.date.toDate ? appointment.date.toDate() : appointment.date)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{appointment.startTime}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{appointment.professionalName}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No tienes citas programadas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ¡Es hora de cuidarte! Agenda tu próximo tratamiento
                </p>
                <Button onClick={() => router.push('/treatments')} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Cita
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* 2. ACCIONES RÁPIDAS - Segunda sección */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Acciones Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center space-y-2 border-2 hover:border-primary/50 transition-all ${
                    action.featured ? 'border-primary/30 bg-primary/5' : ''
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

        {/* Tip motivacional */}
        <Card className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">¿Sabías que...?</h3>
                  <p className="text-sm text-secondary-foreground/90">
                    Los tratamientos regulares mejoran 3x más los resultados
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => router.push('/treatments')}
                className="bg-white/20 hover:bg-white/30 text-secondary-foreground border-0"
              >
                Ver más
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="h-20"></div>
      </div>
    </div>
  )
}34