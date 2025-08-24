// src/app/admin/professionals/page.js
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../../lib/firebase'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Users, 
  Star, 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  Bell,
  LogOut,
  AlertCircle,
  MoreVertical,
  Grid3X3,
  List,
  Calendar,
  UserCheck,
  Filter,
  X,
  TrendingUp,
  Award,
  UserX,
  Camera,
  MessageSquare,
  Shield
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Switch } from '../../../components/ui/switch'
import { Skeleton } from '../../../components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Separator } from '../../../components/ui/separator'
import { professionalService, reviewService } from '../../../lib/firebase-services'

export default function EnhancedProfessionalsPage() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [professionals, setProfessionals] = useState([])
  const [filteredProfessionals, setFilteredProfessionals] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [pendingReviews, setPendingReviews] = useState(0)

  useEffect(() => {
    if (user) {
      loadProfessionals()
      loadPendingReviews()
    }
  }, [user])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm, statusFilter, ratingFilter])

  const loadProfessionals = async () => {
    setLoadingData(true)
    try {
      const data = await professionalService.getAllWithReviews()
      setProfessionals(data)
    } catch (error) {
      console.error('Error loading professionals:', error)
      // Fallback al método original si falla
      try {
        const fallbackData = await professionalService.getAll()
        setProfessionals(fallbackData)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setProfessionals([])
      }
    } finally {
      setLoadingData(false)
    }
  }

  const loadPendingReviews = async () => {
    try {
      if (reviewService && reviewService.getPendingReviews) {
        const pending = await reviewService.getPendingReviews()
        setPendingReviews(pending.length)
      }
    } catch (error) {
      console.error('Error loading pending reviews:', error)
      setPendingReviews(0)
    }
  }

  const filterProfessionals = () => {
    let filtered = professionals

    if (searchTerm) {
      filtered = filtered.filter(professional =>
        professional.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professional.availableTreatments?.some(treatment =>
          treatment.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        professional.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (professional.specialties && professional.specialties.some(specialty =>
          specialty.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(professional =>
        statusFilter === 'available' ? professional.available : !professional.available
      )
    }

    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter)
      filtered = filtered.filter(professional =>
        (professional.averageRating || 0) >= minRating
      )
    }

    setFilteredProfessionals(filtered)
  }

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      await professionalService.update(id, { available: !currentStatus })
      await loadProfessionals()
    } catch (error) {
      console.error('Error updating professional availability:', error)
      alert('Error al actualizar la disponibilidad')
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      try {
        await professionalService.delete(id)
        await loadProfessionals()
      } catch (error) {
        console.error('Error deleting professional:', error)
        alert('Error al eliminar el profesional')
      }
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

  const getWorkingDaysCount = (professional) => {
    if (!professional.baseSchedule) {
      // Compatibilidad con formato antiguo
      if (professional.workingHours) {
        return Object.values(professional.workingHours).filter(day => day?.active).length
      }
      return 0
    }
    return Object.values(professional.baseSchedule).filter(day => day?.active).length
  }

  const getTreatmentsCount = (professional) => {
    if (professional.availableTreatments) {
      return professional.availableTreatments.length
    }
    // Compatibilidad con formato antiguo
    if (professional.specialties) {
      return professional.specialties.length
    }
    return 0
  }

  const getScheduleSummary = (professional) => {
    const activeDays = getWorkingDaysCount(professional)
    const exceptions = professional.scheduleExceptions?.length || 0
    return { activeDays, exceptions }
  }

  // Estadísticas
  const availableProfessionals = professionals.filter(p => p.available !== false).length
  const totalTreatments = new Set(
    professionals.flatMap(p => {
      if (p.availableTreatments) {
        return p.availableTreatments.map(t => t.treatmentId)
      }
      if (p.specialties) {
        return p.specialties
      }
      return []
    })
  ).size
  const averageRating = professionals.length > 0 
    ? Math.round((professionals.reduce((sum, p) => sum + (p.averageRating || 0), 0) / professionals.length) * 10) / 10
    : 0
  const professionalsWithReviews = professionals.filter(p => (p.totalReviews || 0) > 0).length

  // Estados de carga y error
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

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
      
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Profesionales</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredProfessionals.length} de {professionals.length} profesionales
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              
              {/* Notification badge for pending reviews */}
              {pendingReviews > 0 && (
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {pendingReviews}
                  </Badge>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>

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
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Estado</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="available">Disponibles</SelectItem>
                          <SelectItem value="unavailable">No disponibles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating mínimo</label>
                      <Select value={ratingFilter} onValueChange={setRatingFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="4">4+ ★</SelectItem>
                          <SelectItem value="3">3+ ★</SelectItem>
                          <SelectItem value="2">2+ ★</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar profesionales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold">{professionals.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-xl font-bold">{availableProfessionals}</p>
              <p className="text-xs text-muted-foreground">Disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-xl font-bold">{averageRating}</p>
              <p className="text-xs text-muted-foreground">Rating promedio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xl font-bold">{professionalsWithReviews}</p>
              <p className="text-xs text-muted-foreground">Con valoraciones</p>
            </CardContent>
          </Card>
        </div>

        {/* Professional List */}
        {filteredProfessionals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfessionals.map((professional) => {
              const scheduleInfo = getScheduleSummary(professional)
              
              return (
                <Card key={professional.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="h-12 w-12">
                          {professional.profilePhoto?.base64 ? (
                            <AvatarImage 
                              src={professional.profilePhoto.base64} 
                              alt={professional.name}
                            />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {professional.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{professional.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={professional.available !== false ? "default" : "secondary"}
                              className={professional.available !== false
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-600"
                              }
                            >
                              {professional.available !== false ? 'Disponible' : 'No disponible'}
                            </Badge>
                            {professional.totalReviews > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{professional.averageRating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={professional.available !== false}
                        onCheckedChange={() => handleToggleAvailability(professional.id, professional.available)}
                        size="sm"
                      />
                    </div>
                    
                    {/* Info adicional */}
                    <div className="mb-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>{getTreatmentsCount(professional)} tratamientos</span>
                        <span>{scheduleInfo.activeDays} días activos</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/admin/professionals/${professional.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/professionals/editar/${professional.id}`)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(professional.id, professional.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
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
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {professionals.length === 0 ? 'No hay profesionales' : 'No se encontraron profesionales'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' 
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'Comienza agregando tu primer profesional'
                }
              </p>
              <Button onClick={() => router.push('/admin/professionals/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {professionals.length === 0 ? 'Crear Primer Profesional' : 'Crear Profesional'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Floating Button */}
        <div className="fixed bottom-6 right-6">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={() => router.push('/admin/professionals/new')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

