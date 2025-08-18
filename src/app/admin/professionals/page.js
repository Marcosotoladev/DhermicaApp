// src/app/admin/professionals/page.js
'use client'

import { useState, useEffect } from 'react'
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
  UserX
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Switch } from '../../../components/ui/switch'
import { Skeleton } from '../../../components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { professionalService } from '../../../lib/firebase-services'
import { formatTime } from '../../../lib/time-utils'

/**
 * Página de gestión de profesionales - Enhanced Mobile First
 * Consistente con el diseño optimizado de otras páginas
 */
export default function ProfessionalsPage() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [professionals, setProfessionals] = useState([])
  const [filteredProfessionals, setFilteredProfessionals] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // all | available | unavailable

  useEffect(() => {
    if (user) {
      loadProfessionals()
    }
  }, [user])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm, statusFilter])

  const loadProfessionals = async () => {
    setLoadingData(true)
    try {
      const data = await professionalService.getAll()
      setProfessionals(data)
    } catch (error) {
      console.error('Error loading professionals:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const filterProfessionals = () => {
    let filtered = professionals

    if (searchTerm) {
      filtered = filtered.filter(professional =>
        professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (professional.specialties || []).some(specialty =>
          specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(professional =>
        statusFilter === 'available' ? professional.available : !professional.available
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
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${name}?`)) {
      try {
        await professionalService.delete(id)
        await loadProfessionals()
      } catch (error) {
        console.error('Error deleting professional:', error)
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

  const getWorkingDays = (workingHours) => {
    if (!workingHours) return []
    
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    return dayKeys
      .map((key, index) => workingHours[key]?.active ? days[index] : null)
      .filter(Boolean)
  }

  const getWorkingHoursRange = (workingHours) => {
    if (!workingHours) return 'Sin horarios'
    
    const activeDays = Object.values(workingHours).filter(day => day && day.active)
    if (activeDays.length === 0) return 'Sin horarios'
    
    const earliestStart = activeDays.reduce((earliest, day) => 
      day.start < earliest ? day.start : earliest, '23:59')
    const latestEnd = activeDays.reduce((latest, day) => 
      day.end > latest ? day.end : latest, '00:00')
    
    return `${earliestStart} - ${latestEnd}`
  }

  const getAllSpecialties = () => {
    const specialties = new Set()
    professionals.forEach(prof => {
      (prof.specialties || []).forEach(spec => specialties.add(spec))
    })
    return Array.from(specialties)
  }

  const getAverageSpecialties = () => {
    if (professionals.length === 0) return 0
    return Math.round(professionals.reduce((sum, p) => sum + (p.specialties?.length || 0), 0) / professionals.length)
  }

  const getProfessionalsWithSchedule = () => {
    return professionals.filter(p => 
      Object.values(p.workingHours || {}).some(day => day?.active)
    ).length
  }

  // Cálculos de estadísticas
  const availableProfessionals = professionals.filter(p => p.available).length
  const totalSpecialties = getAllSpecialties().length
  const averageSpecialties = getAverageSpecialties()
  const professionalsWithSchedule = getProfessionalsWithSchedule()

  // Loading state
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-6 w-40 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
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
      
      {/* Header mobile-optimized - Enhanced */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-foreground truncate">
                  Profesionales 👨‍⚕️
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredProfessionals.length} de {professionals.length} profesionales
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
                    <SheetTitle>Estadísticas de Profesionales</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold">{professionals.length}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{availableProfessionals}</p>
                          <p className="text-xs text-muted-foreground">Disponibles</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{totalSpecialties}</p>
                          <p className="text-xs text-muted-foreground">Especialidades</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{professionalsWithSchedule}</p>
                          <p className="text-xs text-muted-foreground">Con horarios</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Estado Actual</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Disponibles</span>
                          </div>
                          <span className="text-lg font-bold text-green-800">{availableProfessionals}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-800">No disponibles</span>
                          </div>
                          <span className="text-lg font-bold text-gray-800">{professionals.length - availableProfessionals}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

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
                    <SheetDescription>
                      Personaliza la vista de profesionales
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Estado
                      </label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="available">Disponibles</SelectItem>
                          <SelectItem value="unavailable">No disponibles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Vista
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="justify-start"
                        >
                          <Grid3X3 className="h-4 w-4 mr-2" />
                          Grilla
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="justify-start"
                        >
                          <List className="h-4 w-4 mr-2" />
                          Lista
                        </Button>
                      </div>
                    </div>

                    {(searchTerm || statusFilter !== 'all') && (
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('')
                            setStatusFilter('all')
                          }}
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
                  <DropdownMenuItem>
                    <Bell className="h-4 w-4 mr-2" />
                    Notificaciones
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="space-y-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar profesionales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex space-y-3">
            <div className="flex space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-background">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="unavailable">No disponibles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4 space-y-6">
        
        {/* Estadísticas compactas - Mobile */}
        <div className="grid grid-cols-2 gap-4 sm:hidden">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{professionals.length}</p>
                  <p className="text-xs text-muted-foreground">Profesionales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{availableProfessionals}</p>
                  <p className="text-xs text-muted-foreground">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Statistics */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{professionals.length}</p>
                  <p className="text-xs text-muted-foreground">Total profesionales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{availableProfessionals}</p>
                  <p className="text-xs text-muted-foreground">Disponibles ahora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{totalSpecialties}</p>
                  <p className="text-xs text-muted-foreground">Especialidades únicas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{professionalsWithSchedule}</p>
                  <p className="text-xs text-muted-foreground">Con horarios definidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de profesionales */}
        {filteredProfessionals.length > 0 ? (
          viewMode === 'grid' ? (
            /* Vista de grilla mobile enhanced */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfessionals.map((professional) => (
                <Card key={professional.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm mb-1 truncate">
                            {professional.name}
                          </h3>
                          <Badge 
                            variant={professional.available ? "default" : "secondary"}
                            className={`text-xs border ${professional.available 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {professional.available ? 'Disponible' : 'No disponible'}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={professional.available}
                        onCheckedChange={() => handleToggleAvailability(professional.id, professional.available)}
                        size="sm"
                        className="flex-shrink-0"
                      />
                    </div>
                    
                    {/* Especialidades */}
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Especialidades</p>
                      <div className="flex flex-wrap gap-1">
                        {(professional.specialties || []).slice(0, 2).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs border">
                            {specialty}
                          </Badge>
                        ))}
                        {(professional.specialties || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{professional.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Horarios */}
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Horarios</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{getWorkingHoursRange(professional.workingHours || {})}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {getWorkingDays(professional.workingHours || {}).slice(0, 4).map((day) => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {day}
                            </Badge>
                          ))}
                          {getWorkingDays(professional.workingHours || {}).length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{getWorkingDays(professional.workingHours || {}).length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center justify-between pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => router.push(`/admin/professionals/${professional.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/professionals/${professional.id}/edit`)}
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
                    </div>

                    {/* Mobile Actions */}
                    <div className="sm:hidden pt-3 border-t border-border">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <MoreVertical className="h-4 w-4 mr-2" />
                            Acciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/admin/professionals/${professional.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/professionals/${professional.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/appointments/new?professionalId=${professional.id}`)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Nueva cita
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(professional.id, professional.name)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Vista de lista mobile enhanced */
            <div className="space-y-3">
              {filteredProfessionals.map((professional) => (
                <Card key={professional.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{professional.name}</h3>
                            <Badge 
                              variant={professional.available ? "default" : "secondary"}
                              className={`text-xs border flex-shrink-0 ${professional.available 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              {professional.available ? '●' : '○'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3" />
                              <span>{(professional.specialties || []).length} esp.</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{getWorkingDays(professional.workingHours || {}).length} días</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span className="truncate">{getWorkingHoursRange(professional.workingHours || {})}</span>
                            </div>
                          </div>
                          
                          {/* Especialidades en vista lista */}
                          {(professional.specialties || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {professional.specialties.slice(0, 3).map((specialty) => (
                                <Badge key={specialty} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {professional.specialties.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{professional.specialties.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Switch
                          checked={professional.available}
                          onCheckedChange={() => handleToggleAvailability(professional.id, professional.available)}
                          size="sm"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/admin/professionals/${professional.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/professionals/${professional.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/appointments/new?professionalId=${professional.id}`)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Nueva cita
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(professional.id, professional.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No se encontraron profesionales</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm || statusFilter !== 'all'
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'Comienza agregando tu primer profesional'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Button onClick={() => router.push('/admin/professionals/new')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Profesional
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botón flotante para nuevo profesional */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0 bg-primary hover:bg-primary/90"
            onClick={() => router.push('/admin/professionals/new')}
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