// src/app/admin/treatments/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowLeft, Edit, Trash2, Search, Grid, List, Clock, DollarSign, Tag, Eye } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Switch } from '../../../components/ui/switch'
import { Separator } from '../../../components/ui/separator'
import { treatmentService } from '../../../lib/firebase-services'
import { formatDuration } from '../../../lib/time-utils'
import { toast } from 'sonner'

/**
 * Página de gestión de tratamientos
 * Lista completa con filtros y búsqueda
 */
export default function TreatmentsPage() {
  const router = useRouter()
  const [treatments, setTreatments] = useState([])
  const [filteredTreatments, setFilteredTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [showInactive, setShowInactive] = useState(false)

  // Categorías disponibles
  const categories = [
    'Aparatologia',
    'Cejas',
    'Corporales',
    'Depilacion',
    'Faciales',
    'Manos',
    'Pestañas',
    'Pies',
    'HiFu',
    'Liposonix',
    'Definitiva',
    'Otro'
  ]

  useEffect(() => {
    loadTreatments()
  }, [showInactive])

  useEffect(() => {
    filterTreatments()
  }, [treatments, searchTerm, categoryFilter])

  const loadTreatments = async () => {
    setLoading(true)
    try {
      const treatmentsData = await treatmentService.getAll()
      
      // Filtrar por estado activo/inactivo
      const filtered = showInactive 
        ? treatmentsData 
        : treatmentsData.filter(t => t.active !== false)
      
      setTreatments(filtered)
    } catch (error) {
      console.error('Error loading treatments:', error)
      toast.error('Error al cargar tratamientos')
    } finally {
      setLoading(false)
    }
  }

  const filterTreatments = () => {
    let filtered = [...treatments]

    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(treatment =>
        treatment.name.toLowerCase().includes(search) ||
        treatment.category.toLowerCase().includes(search)
      )
    }

    // Filtro por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(treatment => treatment.category === categoryFilter)
    }

    setFilteredTreatments(filtered)
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el tratamiento "${name}"?`)) {
      try {
        await treatmentService.delete(id)
        toast.success('Tratamiento eliminado exitosamente')
        await loadTreatments()
      } catch (error) {
        console.error('Error deleting treatment:', error)
        toast.error('Error al eliminar el tratamiento')
      }
    }
  }

  const toggleActive = async (id, currentStatus) => {
    try {
      await treatmentService.update(id, { active: !currentStatus })
      toast.success(`Tratamiento ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`)
      await loadTreatments()
    } catch (error) {
      console.error('Error updating treatment status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
              className="px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Tratamientos
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gestiona los servicios de Dhermica
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => router.push('/admin/treatments/new')}
            size="sm"
            className="px-3 sm:px-4"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Tratamiento</span>
          </Button>
        </div>

        {/* Filtros y controles */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              
              {/* Búsqueda y filtros */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tratamientos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Controles de vista */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                    id="show-inactive"
                  />
                  <label htmlFor="show-inactive" className="text-sm">
                    Mostrar inactivos
                  </label>
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                <div className="flex border border-border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none px-3"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Total: {treatments.length}</span>
                <span>Mostrados: {filteredTreatments.length}</span>
                <span>Activos: {treatments.filter(t => t.active !== false).length}</span>
                {showInactive && (
                  <span>Inactivos: {treatments.filter(t => t.active === false).length}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de tratamientos */}
        {filteredTreatments.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredTreatments.map(treatment => (
              viewMode === 'grid' ? (
                // Vista de tarjetas
                <Card key={treatment.id} className={`hover:shadow-md transition-shadow ${treatment.active === false ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{treatment.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {treatment.category}
                          </Badge>
                          {treatment.active === false && (
                            <Badge variant="destructive" className="text-xs">
                              Inactivo
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Detalles */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDuration(treatment.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{treatment.basePrice ? `$${treatment.basePrice}` : 'Sin precio'}</span>
                      </div>
                    </div>
                    
                    {/* Restricciones médicas */}
                    {treatment.medicalRestrictions && treatment.medicalRestrictions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {treatment.medicalRestrictions.slice(0, 2).map((restriction, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {restriction}
                          </Badge>
                        ))}
                        {treatment.medicalRestrictions.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{treatment.medicalRestrictions.length - 2} más
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Acciones */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/treatments/${treatment.id}`)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/treatments/editar/${treatment.id}`)}
                        className="px-3"
                        title="Editar tratamiento"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(treatment.id, treatment.name)}
                        className="text-destructive hover:text-destructive px-3"
                        title="Eliminar tratamiento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Vista de lista
                <Card key={treatment.id} className={`hover:shadow-sm transition-shadow ${treatment.active === false ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{treatment.name}</h3>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {treatment.category}
                              </Badge>
                              {treatment.active === false && (
                                <Badge variant="destructive" className="text-xs">
                                  Inactivo
                                </Badge>
                              )}
                              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDuration(treatment.duration)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span>{treatment.basePrice ? `$${treatment.basePrice}` : 'Sin precio'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex space-x-1 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/treatments/${treatment.id}`)}
                              className="px-2"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/treatments/editar/${treatment.id}`)}
                              className="px-2"
                              title="Editar tratamiento"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(treatment.id, treatment.name)}
                              className="text-destructive hover:text-destructive px-2"
                              title="Eliminar tratamiento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        ) : (
          // Estado vacío
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Tag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'No se encontraron tratamientos'
                  : 'No hay tratamientos'
                }
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'Comienza agregando tu primer tratamiento para ofrecer servicios a tus clientes'
                }
              </p>
              {(!searchTerm && categoryFilter === 'all') && (
                <Button onClick={() => router.push('/admin/treatments/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Tratamiento
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}