// src/app/admin/professionals/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Eye, Clock, Users, Star, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Switch } from '../../../components/ui/switch'
import { professionalService } from '../../../lib/firebase-services'
import { formatTime } from '../../../lib/time-utils'

/**
 * Página de gestión de profesionales
 * Lista, busca y gestiona todos los profesionales de Dhermica
 */
export default function ProfessionalsPage() {
  const router = useRouter()
  const [professionals, setProfessionals] = useState([])
  const [filteredProfessionals, setFilteredProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadProfessionals()
  }, [])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm])

  const loadProfessionals = async () => {
    setLoading(true)
    try {
      const data = await professionalService.getAll()
      setProfessionals(data)
    } catch (error) {
      console.error('Error loading professionals:', error)
    } finally {
      setLoading(false)
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

  const getWorkingDays = (workingHours) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    return dayKeys
      .map((key, index) => workingHours[key]?.active ? days[index] : null)
      .filter(Boolean)
  }

  const getWorkingHoursRange = (workingHours) => {
    const activeDays = Object.values(workingHours).filter(day => day.active)
    if (activeDays.length === 0) return 'Sin horarios'
    
    const earliestStart = activeDays.reduce((earliest, day) => 
      day.start < earliest ? day.start : earliest, '23:59')
    const latestEnd = activeDays.reduce((latest, day) => 
      day.end > latest ? day.end : latest, '00:00')
    
    return `${formatTime(earliestStart)} - ${formatTime(latestEnd)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profesionales</h1>
              <p className="text-muted-foreground">
                Gestiona el equipo de profesionales de Dhermica
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/professionals/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Profesional
          </Button>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold">
                    {professionals.filter(p => p.available).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(professionals.reduce((sum, p) => sum + p.specialties.length, 0) / professionals.length) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Especialidades promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">
                    {professionals.filter(p => 
                      Object.values(p.workingHours || {}).some(day => day.active)
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Con horarios activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de profesionales */}
        {filteredProfessionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessionals.map((professional) => (
              <Card key={professional.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {professional.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{professional.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={professional.available ? "default" : "secondary"}
                            className={professional.available 
                              ? "bg-success text-success-foreground" 
                              : "bg-muted text-muted-foreground"
                            }
                          >
                            {professional.available ? 'Disponible' : 'No disponible'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={professional.available}
                      onCheckedChange={() => handleToggleAvailability(professional.id, professional.available)}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Especialidades */}
                  <div>
                    <p className="text-sm font-medium mb-2">Especialidades</p>
                    <div className="flex flex-wrap gap-1">
                      {professional.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {professional.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{professional.specialties.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Horarios */}
                  <div>
                    <p className="text-sm font-medium mb-2">Horarios</p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{getWorkingHoursRange(professional.workingHours || {})}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getWorkingDays(professional.workingHours || {}).map((day) => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/professionals/${professional.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/professionals/${professional.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de que quieres eliminar este profesional?')) {
                            // handleDelete(professional.id)
                            console.log('Delete professional:', professional.id)
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron profesionales</h3>
              <p className="text-muted-foreground mb-4">
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
      </div>
    </div>
  )
}