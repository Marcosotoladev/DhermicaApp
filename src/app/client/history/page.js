// src/app/client/history/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, TrendingUp, Calendar, DollarSign, ArrowLeft, BarChart3, Filter } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useAuthStore } from '../../../store/auth'
import { appointmentService, treatmentService, professionalService } from '../../../lib/firebase-services'
import { formatDate, formatDateTime } from '../../../lib/time-utils'

/**
 * Página de historial de tratamientos del cliente
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
      setTreatments(treatmentsData)

      // Cargar todas las citas pasadas del cliente
      const appointmentsData = await appointmentService.getByClient(user.uid)
      
      // Filtrar solo citas pasadas y enriquecer con datos
      const pastAppointments = await Promise.all(
        appointmentsData
          .filter(apt => apt.date && new Date(apt.date.toDate()) < new Date())
          .map(async (appointment) => {
            const [treatment, professional] = await Promise.all([
              treatmentService.getById(appointment.treatmentId),
              professionalService.getById(appointment.professionalId)
            ])
            
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/client/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Historial</h1>
              <p className="text-muted-foreground">
                Análisis completo de tus tratamientos en Dhermica
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card>
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
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="text-2xl font-bold text-success">
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
              <CardTitle>Tratamientos Favoritos</CardTitle>
              <CardDescription>
                Tus tratamientos más frecuentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.treatmentStats.length > 0 ? (
                <div className="space-y-4">
                  {stats.treatmentStats.slice(0, 5).map((treatment, index) => (
                    <div key={treatment.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium truncate">{treatment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {treatment.count} {treatment.count === 1 ? 'vez' : 'veces'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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
              <CardTitle>Inversión Anual</CardTitle>
              <CardDescription>
                Tu inversión en bienestar por año
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.yearlySpending.length > 0 ? (
                <div className="space-y-4">
                  {stats.yearlySpending.map((yearData) => (
                    <div key={yearData.year} className="flex items-center justify-between">
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
            <CardTitle>Historial Detallado</CardTitle>
            <CardDescription>
              Cronología completa de tus tratamientos ({filteredAppointments.length} registros)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          {formatDate(appointment.dateObj, 'dd')}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {formatDate(appointment.dateObj, 'MMM yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {appointment.treatment?.name || 'Tratamiento eliminado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          con {appointment.professional?.name || 'Profesional no asignado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(appointment.dateObj, 'EEEE d \'de\' MMMM \'de\' yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {appointment.price && (
                        <Badge variant="secondary" className="text-success">
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
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay registros</h3>
                <p className="text-muted-foreground mb-4">
                  No se encontraron tratamientos para los filtros seleccionados
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterPeriod('all')
                    setFilterTreatment('all')
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}