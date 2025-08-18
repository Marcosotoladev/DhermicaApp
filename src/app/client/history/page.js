// src/app/client/history/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ArrowLeft, 
  BarChart3, 
  Filter,
  MoreVertical,
  X,
  AlertCircle,
  Star,
  Award,
  Plus
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Skeleton } from '../../../components/ui/skeleton'
import { useAuthStore } from '../../../store/auth'
import { appointmentService, treatmentService, professionalService } from '../../../lib/firebase-services'
import { formatDate, formatDateTime } from '../../../lib/time-utils'

/**
 * Página de historial de tratamientos del cliente - Optimizada para móvil
 * Muestra estadísticas y análisis de tratamientos pasados
 */
export default function ClientHistoryPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState('all') // 'all', 'year', '6months', '3months'
  const [filterTreatment, setFilterTreatment] = useState('all')
  const [treatments, setTreatments] = useState([])
  const [showStats, setShowStats] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalSpent: 0,
    averageSpent: 0,
    favoriteMonth: '',
    treatmentStats: [],
    yearlySpending: []
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    filterAppointments()
    calculateStats()
  }, [appointments, filterPeriod, filterTreatment])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Cargar tratamientos para el filtro
      const treatmentsData = await treatmentService.getAll()
      setTreatments(Array.isArray(treatmentsData) ? treatmentsData : [])

      // Cargar todas las citas pasadas del cliente
      const appointmentsData = await appointmentService.getByClient(user.uid)
      
      // VALIDAR QUE SEA UN ARRAY
      if (!Array.isArray(appointmentsData)) {
        console.log('No appointments found or invalid data format')
        setAppointments([])
        return
      }
      
      // Filtrar solo citas pasadas y enriquecer con datos
      const pastAppointments = await Promise.all(
        appointmentsData
          .filter(apt => apt.date && new Date(apt.date.toDate()) < new Date())
          .map(async (appointment) => {
            let treatment = null
            let professional = null
            
            try {
              if (appointment.treatmentId) {
                treatment = await treatmentService.getById(appointment.treatmentId)
              }
            } catch (e) {
              console.warn('Error loading treatment:', e)
            }
            
            try {
              if (appointment.professionalId) {
                professional = await professionalService.getById(appointment.professionalId)
              }
            } catch (e) {
              console.warn('Error loading professional:', e)
            }
            
            return {
              ...appointment,
              treatment,
              professional,
              dateObj: appointment.date?.toDate() || new Date()
            }
          })
      )

      // Ordenar por fecha más reciente primero
      pastAppointments.sort((a, b) => b.dateObj - a.dateObj)
      
      setAppointments(pastAppointments)
    } catch (error) {
      console.error('Error loading history data:', error)
      setAppointments([]) // ASEGURAR QUE SIEMPRE SEA UN ARRAY
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = appointments
    const now = new Date()

    // Filtrar por período
    if (filterPeriod !== 'all') {
      const monthsAgo = filterPeriod === 'year' ? 12 : 
                       filterPeriod === '6months' ? 6 : 3
      const cutoffDate = new Date()
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo)
      
      filtered = filtered.filter(apt => apt.dateObj >= cutoffDate)
    }

    // Filtrar por tratamiento
    if (filterTreatment !== 'all') {
      filtered = filtered.filter(apt => apt.treatmentId === filterTreatment)
    }

    setFilteredAppointments(filtered)
  }

  const calculateStats = () => {
    const totalSpent = filteredAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0)
    const averageSpent = filteredAppointments.length > 0 ? totalSpent / filteredAppointments.length : 0

    // Estadísticas de tratamientos
    const treatmentCounts = {}
    const treatmentSpending = {}
    
    filteredAppointments.forEach(apt => {
      const treatmentName = apt.treatment?.name || 'Tratamiento eliminado'
      treatmentCounts[treatmentName] = (treatmentCounts[treatmentName] || 0) + 1
      treatmentSpending[treatmentName] = (treatmentSpending[treatmentName] || 0) + (apt.price || 0)
    })

    const treatmentStats = Object.keys(treatmentCounts).map(name => ({
      name,
      count: treatmentCounts[name],
      totalSpent: treatmentSpending[name],
      averagePrice: treatmentSpending[name] / treatmentCounts[name]
    })).sort((a, b) => b.count - a.count)

    // Mes favorito (más citas)
    const monthCounts = {}
    filteredAppointments.forEach(apt => {
      const month = apt.dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      monthCounts[month] = (monthCounts[month] || 0) + 1
    })
    
    const favoriteMonth = Object.keys(monthCounts).reduce((a, b) => 
      monthCounts[a] > monthCounts[b] ? a : b, 'Ninguno')

    // Gasto por año
    const yearlySpending = {}
    filteredAppointments.forEach(apt => {
      const year = apt.dateObj.getFullYear()
      yearlySpending[year] = (yearlySpending[year] || 0) + (apt.price || 0)
    })

    const yearlySpendingArray = Object.keys(yearlySpending).map(year => ({
      year: parseInt(year),
      amount: yearlySpending[year]
    })).sort((a, b) => b.year - a.year)

    setStats({
      totalAppointments: filteredAppointments.length,
      totalSpent,
      averageSpent,
      favoriteMonth: Object.keys(monthCounts).length > 0 ? favoriteMonth : 'Ninguno',
      treatmentStats,
      yearlySpending: yearlySpendingArray
    })
  }

  const getPeriodLabel = (period) => {
    const labels = {
      'all': 'Todo el tiempo',
      'year': 'Último año',
      '6months': 'Últimos 6 meses',
      '3months': 'Últimos 3 meses'
    }
    return labels[period]
  }

  const clearFilters = () => {
    setFilterPeriod('all')
    setFilterTreatment('all')
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
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
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
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">Mi Historial</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Análisis completo de tus tratamientos en Dhermica
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Mobile Stats */}
              <Sheet open={showStats} onOpenChange={setShowStats}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh]">
                  <SheetHeader>
                    <SheetTitle>Análisis Detallado</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    {/* Stats principales */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                          <p className="text-xs text-muted-foreground">Tratamientos</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                          <p className="text-lg font-bold">${stats.totalSpent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total invertido</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Top tratamientos */}
                    <div>
                      <h4 className="font-medium mb-3">Tratamientos Favoritos</h4>
                      <div className="space-y-2">
                        {stats.treatmentStats.slice(0, 3).map((treatment, index) => (
                          <div key={treatment.name} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </div>
                              <span className="text-sm font-medium truncate">{treatment.name}</span>
                            </div>
                            <span className="text-sm font-medium">{treatment.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Mobile Filters */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>
                      Personaliza la vista de tu historial
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Período</label>
                      <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todo el tiempo</SelectItem>
                          <SelectItem value="year">Último año</SelectItem>
                          <SelectItem value="6months">Últimos 6 meses</SelectItem>
                          <SelectItem value="3months">Últimos 3 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tratamiento</label>
                      <Select value={filterTreatment} onValueChange={setFilterTreatment}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los tratamientos</SelectItem>
                          {treatments.map(treatment => (
                            <SelectItem key={treatment.id} value={treatment.id}>
                              {treatment.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(filterPeriod !== 'all' || filterTreatment !== 'all') && (
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={clearFilters}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpiar filtros
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/treatments')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva cita
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/client/appointments')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver próximas citas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Filtros móviles compactos */}
        <div className="sm:hidden">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">
                    {getPeriodLabel(filterPeriod)}
                  </span>
                  {filterTreatment !== 'all' && (
                    <span className="text-muted-foreground">
                      {' • '}{treatments.find(t => t.id === filterTreatment)?.name || 'Tratamiento'}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros desktop */}
        <Card className="hidden sm:block">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo el tiempo</SelectItem>
                    <SelectItem value="year">Último año</SelectItem>
                    <SelectItem value="6months">Últimos 6 meses</SelectItem>
                    <SelectItem value="3months">Últimos 3 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Tratamiento</label>
                <Select value={filterTreatment} onValueChange={setFilterTreatment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tratamientos</SelectItem>
                    {treatments.map(treatment => (
                      <SelectItem key={treatment.id} value={treatment.id}>
                        {treatment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(filterPeriod !== 'all' || filterTreatment !== 'all') && (
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas principales - Mobile */}
        <div className="grid grid-cols-2 gap-4 sm:hidden">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold">{stats.totalAppointments}</p>
              <p className="text-xs text-muted-foreground">Tratamientos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-lg font-bold">${stats.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Invertido</p>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas principales - Desktop */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tratamientos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                {getPeriodLabel(filterPeriod)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invertido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                en tu bienestar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Cita</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                ${Math.round(stats.averageSpent).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                inversión promedio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Favorito</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-secondary truncate">
                {stats.favoriteMonth}
              </div>
              <p className="text-xs text-muted-foreground">
                más activo
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Tratamientos más frecuentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span>Tratamientos Favoritos</span>
              </CardTitle>
              <CardDescription>
                Tus tratamientos más frecuentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.treatmentStats.length > 0 ? (
                <div className="space-y-4">
                  {stats.treatmentStats.slice(0, 5).map((treatment, index) => (
                    <div key={treatment.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{treatment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {treatment.count} {treatment.count === 1 ? 'vez' : 'veces'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium">${treatment.totalSpent.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          ${Math.round(treatment.averagePrice).toLocaleString()} prom.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No hay datos para mostrar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gasto por año */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Inversión Anual</span>
              </CardTitle>
              <CardDescription>
                Tu inversión en bienestar por año
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.yearlySpending.length > 0 ? (
                <div className="space-y-4">
                  {stats.yearlySpending.map((yearData) => (
                    <div key={yearData.year} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-8 rounded bg-secondary/10 text-secondary text-sm font-bold">
                          {yearData.year}
                        </div>
                        <div>
                          <p className="font-medium">${yearData.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {filteredAppointments.filter(apt => apt.dateObj.getFullYear() === yearData.year).length} tratamientos
                          </p>
                        </div>
                      </div>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (yearData.amount / Math.max(...stats.yearlySpending.map(y => y.amount))) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No hay datos para mostrar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista detallada de tratamientos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Historial Detallado</span>
                </CardTitle>
                <CardDescription>
                  Cronología completa de tus tratamientos ({filteredAppointments.length} registros)
                </CardDescription>
              </div>
              {filteredAppointments.length > 0 && (filterPeriod !== 'all' || filterTreatment !== 'all') && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="hidden sm:flex">
                  <X className="h-4 w-4 mr-2" />
                  Ver todo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="text-center flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold">
                          {formatDate(appointment.dateObj, 'dd')}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {formatDate(appointment.dateObj, 'MMM yyyy')}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {appointment.treatment?.name || 'Tratamiento eliminado'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          con {appointment.professional?.name || 'Profesional no asignado'}
                        </p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {formatDate(appointment.dateObj, 'EEEE d \'de\' MMMM \'de\' yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1 flex-shrink-0">
                      {appointment.price && (
                        <Badge variant="secondary" className="text-green-600 bg-green-100">
                          ${appointment.price.toLocaleString()}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {appointment.duration} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Clock className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No hay registros</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {appointments.length === 0 
                    ? 'Aún no tienes tratamientos completados'
                    : 'No se encontraron tratamientos para los filtros seleccionados'
                  }
                </p>
                {appointments.length === 0 ? (
                  <Button onClick={() => router.push('/treatments')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Explorar Tratamientos
                  </Button>
                ) : (
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Espaciado inferior */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}