//// src/app/admin/appointments/all/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Filter, X, Calendar, User, Clock, Search, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../../components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table'
import { appointmentService, professionalService, treatmentService } from '../../../../lib/firebase-services'
import { formatDate, formatTime, formatDateTime } from '../../../../lib/time-utils'
import { toast } from 'sonner'

/**
 * Página de todos los appointments
 * Vista de tabla con filtros, búsqueda y paginación
 */
export default function AllAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [allFilteredAppointments, setAllFilteredAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const ITEMS_PER_PAGE = 50

  // Carga inicial
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [professionalsData, treatmentsData] = await Promise.all([
          professionalService.getAll(),
          treatmentService.getAll()
        ])
        setProfessionals(professionalsData)
        setTreatments(treatmentsData)
        
        // Cargar primeros appointments
        await loadAppointments(true)
      } catch (error) {
        toast.error('Error al cargar los datos iniciales')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Recargar cuando cambian los filtros
  useEffect(() => {
    if (professionals.length > 0 && treatments.length > 0) {
      loadAppointments(true)
      setCurrentPage(1)
    }
  }, [selectedProfessional, selectedStatus, dateFrom, dateTo, searchTerm, professionals, treatments])

  const loadAppointments = async (reset = false) => {
    if (reset) {
      setLoadingMore(true)
    } else {
      setLoadingMore(true)
    }

    try {

      let allAppointments = []
      
      // Estrategia simplificada: obtener citas de los últimos 30 días y próximos 30 días
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 30) // 30 días atrás
      
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 30) // 30 días adelante

      // Si hay filtros de fecha específicos, usarlos
      if (dateFrom) {
        startDate.setTime(new Date(dateFrom).getTime())
      }
      if (dateTo) {
        endDate.setTime(new Date(dateTo).getTime())
      }

      // Obtener citas día por día (limitamos a máximo 60 días)
      const maxDays = 60
      let daysProcessed = 0
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate && daysProcessed < maxDays) {
        try {
          let dailyAppointments = []
          
          if (selectedProfessional !== 'all') {
            dailyAppointments = await appointmentService.getByProfessionalAndDate(
              selectedProfessional,
              new Date(currentDate)
            )
          } else {
            dailyAppointments = await appointmentService.getByDate(new Date(currentDate))
          }
          
          if (dailyAppointments && dailyAppointments.length > 0) {
            allAppointments = [...allAppointments, ...dailyAppointments]
          }
        } catch (error) {
          console.error('Error al obtener citas del dia', error)
        }
        
        // Avanzar al siguiente día
        currentDate.setDate(currentDate.getDate() + 1)
        daysProcessed++
      }

      // Aplicar filtros adicionales
      let filteredAppointments = allAppointments

      // Filtrar por estado
      if (selectedStatus !== 'all') {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.status === selectedStatus
        )
      }

      // Filtrar por búsqueda de cliente
      if (searchTerm && searchTerm.trim()) {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.clientName && 
          appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Eliminar duplicados basados en ID
      const uniqueAppointments = []
      const seenIds = new Set()
      
      filteredAppointments.forEach(appointment => {
        if (!seenIds.has(appointment.id)) {
          seenIds.add(appointment.id)
          uniqueAppointments.push(appointment)
        }
      })
      
      filteredAppointments = uniqueAppointments

      // Ordenar por fecha y hora (más recientes primero)
      filteredAppointments.sort((a, b) => {
        const dateA = new Date(a.date?.toDate ? a.date.toDate() : a.date)
        const dateB = new Date(b.date?.toDate ? b.date.toDate() : b.date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB - dateA
        }
        return b.startTime.localeCompare(a.startTime)
      })

      // Aplicar paginación manual
      const startIndex = reset ? 0 : appointments.length
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedAppointments = filteredAppointments.slice(
        reset ? 0 : startIndex,
        reset ? ITEMS_PER_PAGE : endIndex
      )
      

      
      // Enriquecer con datos de profesionales y tratamientos
      const enrichedAppointments = paginatedAppointments.map(appointment => ({
        ...appointment,
        // Convertir Timestamp de Firestore a Date si es necesario
        date: appointment.date?.toDate ? appointment.date.toDate() : appointment.date,
        professional: professionals.find(p => p.id === appointment.professionalId),
        treatment: treatments.find(t => t.id === appointment.treatmentId),
        treatmentsList: appointment.treatments || (appointment.treatmentId ? [{
          id: appointment.treatmentId,
          name: treatments.find(t => t.id === appointment.treatmentId)?.name || 'Tratamiento eliminado'
        }] : [])
      }))


      if (reset) {
        setAppointments(enrichedAppointments)
        setAllFilteredAppointments(filteredAppointments)
      } else {
        setAppointments(prev => [...prev, ...enrichedAppointments])
      }

      // Verificar si hay más elementos para cargar
      if (reset) {
        setHasMore(filteredAppointments.length > ITEMS_PER_PAGE)
      } else {
        setHasMore(appointments.length + enrichedAppointments.length < filteredAppointments.length)
      }

    } catch (error) {
      console.error('❌ Error loading appointments:', error)
      toast.error('Error al cargar las citas')
      if (reset) {
        setAppointments([])
      }
    } finally {
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore && allFilteredAppointments.length > 0) {
      setCurrentPage(prev => prev + 1)
      loadAppointments(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completado':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Completado</Badge>
      case 'Anulado':
        return <Badge variant="destructive">Anulado</Badge>
      default:
        return <Badge variant="default">Programado</Badge>
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedProfessional('all')
    setSelectedStatus('all')
    setDateFrom('')
    setDateTo('')
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (searchTerm) count++
    if (selectedProfessional !== 'all') count++
    if (selectedStatus !== 'all') count++
    if (dateFrom || dateTo) count++
    return count
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-muted rounded w-1/2 sm:w-1/4"></div>
            <div className="h-64 sm:h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/appointments')}
                className="px-2 sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-foreground">Todas las Citas</h1>
                <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
                  Vista completa de todas las citas registradas
                </p>
              </div>
            </div>
          </div>

          {/* Filtros Mobile */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Filter className="h-4 w-4" />
                    {getActiveFiltersCount() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-6">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Filtra las citas según tus criterios
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-3 block">Profesional</label>
                      <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los profesionales" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los profesionales</SelectItem>
                          {professionals.map(professional => (
                            <SelectItem key={professional.id} value={professional.id}>
                              {professional.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-3 block">Estado</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="Programado">Programado</SelectItem>
                          <SelectItem value="Completado">Completado</SelectItem>
                          <SelectItem value="Anulado">Anulado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">Fecha desde</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">Fecha hasta</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>

                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      <X className="h-4 w-4 mr-2" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Filtros Desktop */}
          <Card className="hidden sm:block">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div className="lg:col-span-2">
                  <Input
                    placeholder="Buscar por nombre de cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los profesionales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los profesionales</SelectItem>
                    {professionals.map(professional => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Programado">Programado</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                    <SelectItem value="Anulado">Anulado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha desde</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha hasta</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="p-4 sm:p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    Registro de Citas
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {appointments.length} citas cargadas
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {getActiveFiltersCount()} filtros activos
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {appointments.length > 0 ? (
                <>
                  {/* Tabla con scroll horizontal en mobile */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Fecha</TableHead>
                          <TableHead className="min-w-[80px]">Hora</TableHead>
                          <TableHead className="min-w-[150px]">Cliente</TableHead>
                          <TableHead className="min-w-[150px]">Profesional</TableHead>
                          <TableHead className="min-w-[120px]">Estado</TableHead>
                          <TableHead className="min-w-[180px]">Tratamiento</TableHead>
                          <TableHead className="min-w-[100px]">Precio</TableHead>
                          <TableHead className="min-w-[80px] text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((appointment) => (
                          <TableRow key={appointment.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {formatDate(
                                    appointment.date?.toDate ? appointment.date.toDate() : appointment.date, 
                                    'dd/MM/yyyy'
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">
                                  {formatTime(appointment.startTime)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">
                                  {appointment.clientName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-blue-700">
                                {appointment.professional?.name || 'Profesional eliminado'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(appointment.status)}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[180px]">
                                {appointment.treatmentsList && appointment.treatmentsList.length > 0 ? (
                                  <div className="space-y-1">
                                    {appointment.treatmentsList.slice(0, 2).map((treatment, idx) => (
                                      <div key={treatment.id || idx} className="text-sm">
                                        {treatment.name}
                                      </div>
                                    ))}
                                    {appointment.treatmentsList.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{appointment.treatmentsList.length - 2} más
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {appointment.treatment?.name || 'Tratamiento eliminado'}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {(appointment.totalPrice || appointment.price) && (
                                <Badge variant="secondary" className="font-mono">
                                  ${(appointment.totalPrice || appointment.price).toLocaleString()}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/appointments/${appointment.id}`)}
                                className="px-2"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Botón cargar más */}
                  {hasMore && (
                    <div className="p-6 text-center border-t">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="min-w-[200px]"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Cargar más citas
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No se encontraron citas</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {getActiveFiltersCount() > 0
                      ? 'Prueba ajustando los filtros de búsqueda'
                      : 'No hay citas registradas en el sistema'
                    }
                  </p>
                  {getActiveFiltersCount() > 0 && (
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}