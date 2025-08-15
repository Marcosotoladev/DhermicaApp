// src/app/admin/treatments/page.js
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
  DollarSign, 
  Tag, 
  ArrowLeft,
  Filter,
  Grid3X3,
  List,
  Bell,
  LogOut,
  AlertCircle,
  MoreVertical
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
import { treatmentService } from '../../../lib/firebase-services'
import { formatDuration } from '../../../lib/time-utils'
import { TREATMENT_CATEGORIES } from '../../../lib/validations'

/**
 * Página de gestión de tratamientos - Mobile First
 * Consistente con el diseño del dashboard admin
 */
export default function TreatmentsPage() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [treatments, setTreatments] = useState([])
  const [filteredTreatments, setFilteredTreatments] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // grid | list

  useEffect(() => {
    if (user) {
      loadTreatments()
    }
  }, [user])

  useEffect(() => {
    filterTreatments()
  }, [treatments, searchTerm, selectedCategory])

  const loadTreatments = async () => {
    setLoadingData(true)
    try {
      const data = await treatmentService.getAll()
      setTreatments(data)
    } catch (error) {
      console.error('Error loading treatments:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const filterTreatments = () => {
    let filtered = treatments

    if (searchTerm) {
      filtered = filtered.filter(treatment =>
        treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(treatment => treatment.category === selectedCategory)
    }

    setFilteredTreatments(filtered)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este tratamiento?')) {
      try {
        await treatmentService.delete(id)
        await loadTreatments()
      } catch (error) {
        console.error('Error deleting treatment:', error)
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

  const getCategoryColor = (category) => {
    const colors = {
      'Facial': 'bg-blue-100 text-blue-800',
      'Corporal': 'bg-green-100 text-green-800',
      'Depilación': 'bg-purple-100 text-purple-800',
      'Rejuvenecimiento': 'bg-pink-100 text-pink-800',
      'Limpieza': 'bg-yellow-100 text-yellow-800',
      'Hidratación': 'bg-cyan-100 text-cyan-800',
      'Masajes': 'bg-orange-100 text-orange-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
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
                  Tratamientos 💆‍♀️
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredTreatments.length} de {treatments.length} tratamientos
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

          {/* Filtros móviles */}
          <div className="space-y-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar tratamientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            
            {/* Filtro por categoría */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {TREATMENT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{treatments.length}</p>
                  <p className="text-xs text-muted-foreground">Tratamientos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    ${treatments.reduce((sum, t) => sum + t.basePrice, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Valor total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de tratamientos */}
        {filteredTreatments.length > 0 ? (
          viewMode === 'grid' ? (
            /* Vista de grilla mobile */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredTreatments.map((treatment) => (
                <Card key={treatment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                          {treatment.name}
                        </h3>
                        <Badge className={`${getCategoryColor(treatment.category)} text-xs`}>
                          {treatment.category}
                        </Badge>
                      </div>
                      {treatment.imageUrl && (
                        <Avatar className="h-10 w-10 ml-2">
                          <AvatarImage src={treatment.imageUrl} alt={treatment.name} />
                          <AvatarFallback className="text-xs">
                            {treatment.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {treatment.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDuration(treatment.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">${treatment.basePrice.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {treatment.medicalRestrictions && treatment.medicalRestrictions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {treatment.medicalRestrictions.slice(0, 2).map((restriction) => (
                          <Badge key={restriction} variant="outline" className="text-xs">
                            ⚠️ {restriction}
                          </Badge>
                        ))}
                        {treatment.medicalRestrictions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{treatment.medicalRestrictions.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => router.push(`/admin/treatments/${treatment.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/treatments/${treatment.id}/edit`)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(treatment.id)}
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
              {filteredTreatments.map((treatment) => (
                <Card key={treatment.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {treatment.imageUrl && (
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={treatment.imageUrl} alt={treatment.name} />
                            <AvatarFallback className="text-sm">
                              {treatment.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{treatment.name}</h3>
                            <Badge className={`${getCategoryColor(treatment.category)} text-xs`}>
                              {treatment.category}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(treatment.duration)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">${treatment.basePrice.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/treatments/${treatment.id}`)}
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
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron tratamientos</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'Comienza agregando tu primer tratamiento'
                }
              </p>
              {(!searchTerm && selectedCategory === 'all') && (
                <Button onClick={() => router.push('/admin/treatments/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Tratamiento
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botón flotante para nuevo tratamiento */}
        <div className="fixed bottom-6 right-6">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={() => router.push('/admin/treatments/new')}
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