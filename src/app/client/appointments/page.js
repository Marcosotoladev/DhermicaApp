// src/app/client/appointments/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '../../../lib/firebase'
import { doc, getDoc, query, collection, where, orderBy, getDocs } from 'firebase/firestore'
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft, 
  Plus, 
  Filter,
  Search,
  Edit,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Skeleton } from '../../../components/ui/skeleton'
import { formatDate, formatTime, isToday, isFuture } from '../../../lib/time-utils'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"

export default function ClientAppointments() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc') // desc = más recientes primero

  useEffect(() => {
    if (user) {
      loadAppointments()
    }
  }, [user])

  useEffect(() => {
    filterAndSortAppointments()
  }, [appointments, searchTerm, statusFilter, sortOrder])

  const loadAppointments = async () => {
    if (!user) return

    setLoadingData(true)
    
    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('clientId', '==', user.uid),
        orderBy('date', 'desc')
      )

      const appointmentsSnapshot = await getDocs(appointmentsQuery)
      const appointmentsList = []
      
      for (const docSnap of appointmentsSnapshot.docs) {
        const appointmentData = docSnap.data()
        
        if (appointmentData.date && appointmentData.startTime) {
          let treatmentName = 'Tratamiento'
          let professionalName = 'Profesional'
          let professionalPhone = ''
          let treatmentPrice = 0
          
          // Cargar información del tratamiento
          if (appointmentData.treatmentId) {
            try {
              const treatmentDoc = await getDoc(doc(db, 'treatments', appointmentData.treatmentId))
              if (treatmentDoc.exists()) {
                const treatmentData = treatmentDoc.data()
                treatmentName = treatmentData.name
                treatmentPrice = treatmentData.basePrice || 0
              }
            } catch (e) {
              console.warn('Error cargando tratamiento:', e)
            }
          }
          
          // Cargar información del profesional
          if (appointmentData.professionalId) {
            try {
              const professionalDoc = await getDoc(doc(db, 'professionals', appointmentData.professionalId))
              if (professionalDoc.exists()) {
                const professionalData = professionalDoc.data()
                professionalName = professionalData.name
                professionalPhone = professionalData.phone || ''
              }
            } catch (e) {
              console.warn('Error cargando profesional:', e)
            }
          }

          appointmentsList.push({
            id: docSnap.id,
            ...appointmentData,
            treatmentName,
            professionalName,
            professionalPhone,
            treatmentPrice
          })
        }
      }

      setAppointments(appointmentsList)
    } catch (error) {
      console.error('Error cargando citas:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const filterAndSortAppointments = () => {
    let filtered = appointments.filter(appointment => {
      const matchesSearch = appointment.treatmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.professionalName.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false
      
      const now = new Date()
      const appointmentDate = appointment.date.toDate ? appointment.date.toDate() : new Date(appointment.date)
      
      switch (statusFilter) {
        case 'upcoming':
          return appointmentDate >= now
        case 'past':
          return appointmentDate < now
        case 'today':
          return isToday(appointmentDate)
        default:
          return true
      }
    })

    // Ordenar por fecha
    filtered.sort((a, b) => {
      const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date)
      const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date)
      
      if (sortOrder === 'desc') {
        return dateB - dateA // Más recientes primero
      } else {
        return dateA - dateB // Más antiguos primero
      }
    })

    setFilteredAppointments(filtered)
  }

  const getAppointmentStatus = (appointment) => {
    const now = new Date()
    const appointmentDate = appointment.date.toDate ? appointment.date.toDate() : new Date(appointment.date)
    
    if (isToday(appointmentDate)) {
      const appointmentTime = new Date(`${appointmentDate.toDateString()} ${appointment.startTime}`)
      if (appointmentTime > now) {
        return { status: 'today', label: 'Hoy', color: 'bg-blue-100 text-blue-800', icon: CalendarIcon }
      } else {
        return { status: 'completed', label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      }
    } else if (appointmentDate > now) {
      return { status: 'upcoming', label: 'Próxima', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    } else {
      return { status: 'past', label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
  }

  // Los clientes no pueden cancelar citas - función removida

  const handleViewDetails = (appointment) => {
    // Navegación a una página de detalles dedicada (por implementar)
    router.push(`/client/appointments/${appointment.id}`)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
          <div className="p-4 max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>
        
        <div className="p-4 max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
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
            <p className="text-destructive mb-4">Error de autenticación</p>
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
      
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Mis Citas</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredAppointments.length} citas encontradas
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/treatments')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        
        {/* Filtros y búsqueda */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por tratamiento o profesional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filtro por estado */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las citas</SelectItem>
                  <SelectItem value="upcoming">Próximas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="past">Completadas</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Ordenar */}
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="w-full lg:w-auto"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Más recientes
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Más antiguos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de citas */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const status = getAppointmentStatus(appointment)
              
              return (
                <Card key={appointment.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    {/* Header con título y badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <status.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base lg:text-lg leading-tight mb-1">
                            {appointment.treatmentName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {appointment.professionalName}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${status.color} border-0 flex-shrink-0 ml-2`}>
                        {status.label}
                      </Badge>
                    </div>
                    
                    {/* Información de la cita */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          {formatDate(appointment.date.toDate ? appointment.date.toDate() : appointment.date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{appointment.startTime}</span>
                        {appointment.duration && (
                          <span className="text-muted-foreground">
                            ({appointment.duration}min)
                          </span>
                        )}
                      </div>
                      {appointment.treatmentPrice > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-green-600">
                            ${appointment.treatmentPrice.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    {appointment.notes && (
                      <div className="mb-4 p-2 bg-muted/30 rounded text-sm">
                        <p className="text-muted-foreground">{appointment.notes}</p>
                      </div>
                    )}
                    
                    {/* Botones de acción */}
                    <div className="flex pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(appointment)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No se encontraron citas</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'No tienes citas programadas aún'
                }
              </p>
              <Button onClick={() => router.push('/treatments')}>
                <Plus className="h-4 w-4 mr-2" />
                Agendar Primera Cita
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}