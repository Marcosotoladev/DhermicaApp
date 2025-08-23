// src/app/professionals/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../../lib/firebase'
import { 
  ArrowLeft, 
  Search, 
  Star, 
  Clock, 
  Calendar,
  User,
  Heart,
  Award,
  MapPin,
  Phone,
  Mail,
  Users,
  Filter,
  X,
  Grid3X3,
  List,
  CheckCircle,
  Briefcase
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Skeleton } from '../../../components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { professionalService } from '../../../lib/firebase-services'

export default function ProfessionalsPage() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [professionals, setProfessionals] = useState([])
  const [filteredProfessionals, setFilteredProfessionals] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [specialtyFilter, setSpecialtyFilter] = useState('all')

  useEffect(() => {
    loadProfessionals()
  }, [])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm, specialtyFilter])

  const loadProfessionals = async () => {
    setLoadingData(true)
    try {
      const data = await professionalService.getAll()
      // Solo mostrar profesionales disponibles a los clientes
      const availableProfessionals = data.filter(prof => prof.available !== false)
      setProfessionals(availableProfessionals)
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

    if (specialtyFilter !== 'all') {
      filtered = filtered.filter(professional =>
        (professional.specialties || []).includes(specialtyFilter)
      )
    }

    setFilteredProfessionals(filtered)
  }

  const getAllSpecialties = () => {
    const specialties = new Set()
    professionals.forEach(prof => {
      (prof.specialties || []).forEach(spec => specialties.add(spec))
    })
    return Array.from(specialties).sort()
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
    if (!workingHours) return 'Consultar horarios'
    
    const activeDays = Object.values(workingHours).filter(day => day && day.active)
    if (activeDays.length === 0) return 'Consultar horarios'
    
    const earliestStart = activeDays.reduce((earliest, day) => 
      day.start < earliest ? day.start : earliest, '23:59')
    const latestEnd = activeDays.reduce((latest, day) => 
      day.end > latest ? day.end : latest, '00:00')
    
    return `${earliestStart} - ${latestEnd}`
  }

  const handleBookAppointment = (professional) => {
    // Redirigir a agendar cita con el profesional seleccionado
    router.push(`/treatments?professionalId=${professional.id}`)
  }

  const handleViewProfile = (professional) => {
    // Redirigir a perfil del profesional
    router.push(`/professionals/${professional.id}`)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-8 w-8" />
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      
      {/* Header */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="p-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-foreground">
                  Nuestro Equipo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Conoce a nuestros {filteredProfessionals.length} profesionales
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
              
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
                      Encuentra el profesional ideal
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Especialidad
                      </label>
                      <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las especialidades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las especialidades</SelectItem>
                          {getAllSpecialties().map((specialty) => (
                            <SelectItem key={specialty} value={specialty}>
                              {specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(searchTerm || specialtyFilter !== 'all') && (
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('')
                            setSpecialtyFilter('all')
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
            </div>
          </div>

          {/* Búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="hidden sm:block w-48">
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {getAllSpecialties().map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        
        {/* Información destacada */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-primary">Equipo Profesional</h3>
                  <p className="text-sm text-muted-foreground">
                    Especialistas certificados en tratamientos estéticos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{professionals.length}</p>
                <p className="text-xs text-muted-foreground">Profesionales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de profesionales */}
        {filteredProfessionals.length > 0 ? (
          viewMode === 'grid' ? (
            /* Vista de grilla */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfessionals.map((professional) => (
                <Card key={professional.id} className="hover:shadow-lg transition-all duration-200 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header con avatar y info básica */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
                      <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-white shadow-lg">
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                          {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-lg text-primary mb-1">
                        Dr. {professional.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Profesional en Estética
                      </p>
                    </div>

                    <div className="p-6">
                      {/* Especialidades */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Especialidades</p>
                        <div className="flex flex-wrap gap-2">
                          {(professional.specialties || []).map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Horarios de atención */}
                      {professional.workingHours && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Horarios</p>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{getWorkingHoursRange(professional.workingHours)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {getWorkingDays(professional.workingHours).map((day) => (
                                <Badge key={day} variant="outline" className="text-xs">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Descripción si existe */}
                      {professional.description && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {professional.description}
                          </p>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex flex-col gap-2 pt-4 border-t">
                        <Button
                          onClick={() => handleBookAppointment(professional)}
                          className="w-full"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar Cita
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleViewProfile(professional)}
                          className="w-full"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Vista de lista */
            <div className="space-y-4">
              {filteredProfessionals.map((professional) => (
                <Card key={professional.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <Avatar className="h-16 w-16 flex-shrink-0 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                            {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-bold text-lg text-primary">
                              Dr. {professional.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Disponible
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            Profesional en Tratamientos Estéticos
                          </p>

                          {/* Especialidades */}
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {(professional.specialties || []).slice(0, 4).map((specialty) => (
                                <Badge key={specialty} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {(professional.specialties || []).length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{professional.specialties.length - 4} más
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Horarios */}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{getWorkingHoursRange(professional.workingHours)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{getWorkingDays(professional.workingHours).length} días</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                        <Button
                          onClick={() => handleBookAppointment(professional)}
                          size="sm"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleViewProfile(professional)}
                          size="sm"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Perfil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron profesionales</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || specialtyFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Actualmente no hay profesionales disponibles'
                }
              </p>
              {(searchTerm || specialtyFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setSpecialtyFilter('all')
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Call to action */}
        <Card className="mt-8 bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-6 text-center">
            <Heart className="h-8 w-8 text-secondary mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">¿No encuentras lo que buscas?</h3>
            <p className="text-muted-foreground mb-4">
              Nuestro equipo está aquí para ayudarte a encontrar el tratamiento perfecto
            </p>
            <Button onClick={() => router.push('/treatments')}>
              <Briefcase className="h-4 w-4 mr-2" />
              Ver Tratamientos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}