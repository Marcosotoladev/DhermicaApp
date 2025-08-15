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
  UserCheck
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Switch } from '../../../components/ui/switch'
import { Skeleton } from '../../../components/ui/skeleton'
import { professionalService } from '../../../lib/firebase-services'
import { formatTime } from '../../../lib/time-utils'

/**
 * Página de gestión de profesionales - Mobile First
 * Consistente con el diseño del dashboard y tratamientos
 */
export default function ProfessionalsPage() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [professionals, setProfessionals] = useState([])
  const [filteredProfessionals, setFilteredProfessionals] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid | list

  useEffect(() => {
    if (user) {
      loadProfessionals()
    }
  }, [user])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm])

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
        professional.specialties.some(specialty =>
          specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
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

  // Loading state
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
          <div className="p-4">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-20 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
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
      
      {/* Header mobile-optimized - Consistente con dashboard */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Profesionales 👨‍⚕️
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredProfessionals.length} de {professionals.length} profesionales
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Búsqueda móvil */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4 space-y-6">
        
        {/* Estadísticas en cards compactas */}
        <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-xl font-bold">
                    {professionals.filter(p => p.available).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {Math.round(professionals.reduce((sum, p) => sum + (p.specialties?.length || 0), 0) / professionals.length) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Especialidades promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {professionals.filter(p => 
                      Object.values(p.workingHours || {}).some(day => day?.active)
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Con horarios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de profesionales */}
        {filteredProfessionals.length > 0 ? (
          viewMode === 'grid' ? (
            /* Vista de grilla mobile */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProfessionals.map((professional) => (
                <Card key={professional.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm mb-1">
                            {professional.name}
                          </h3>
                          <Badge 
                            variant={professional.available ? "default" : "secondary"}
                            className={`text-xs ${professional.available 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-600"
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
                      />
                    </div>
                    
                    {/* Especialidades */}
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Especialidades</p>
                      <div className="flex flex-wrap gap-1">
                        {(professional.specialties || []).slice(0, 2).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
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
                    
                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
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
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que quieres eliminar este profesional?')) {
                              console.log('Delete professional:', professional.id)
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Vista de lista mobile */
            <div className="space-y-3">
              {filteredProfessionals.map((professional) => (
                <Card key={professional.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{professional.name}</h3>
                            <Badge 
                              variant={professional.available ? "default" : "secondary"}
                              className={`text-xs ${professional.available 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-600"
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
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/professionals/${professional.id}`)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron profesionales</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm 
                  ? 'Prueba ajustando el término de búsqueda'
                  : 'Comienza agregando tu primer profesional'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => router.push('/admin/professionals/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Profesional
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botón flotante para nuevo profesional */}
        <div className="fixed bottom-6 right-6">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
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