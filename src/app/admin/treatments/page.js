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
  MoreVertical,
  X,
  TrendingUp,
  Award,
  AlertTriangle
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { treatmentService } from '../../../lib/firebase-services'
import { formatDuration } from '../../../lib/time-utils'
import { TREATMENT_CATEGORIES } from '../../../lib/validations'

/**
 * Página de gestión de tratamientos - Enhanced Mobile First
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
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)

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
      'Facial': 'bg-blue-100 text-blue-800 border-blue-200',
      'Corporal': 'bg-green-100 text-green-800 border-green-200',
      'Depilación': 'bg-purple-100 text-purple-800 border-purple-200',
      'Rejuvenecimiento': 'bg-pink-100 text-pink-800 border-pink-200',
      'Limpieza': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Hidratación': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Masajes': 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getCategoryStats = () => {
    const stats = {}
    treatments.forEach(treatment => {
      stats[treatment.category] = (stats[treatment.category] || 0) + 1
    })
    return stats
  }

  const calculateAveragePrice = () => {
    if (treatments.length === 0) return 0
    return Math.round(treatments.reduce((sum, t) => sum + t.basePrice, 0) / treatments.length)
  }

  const getTreatmentsWithRestrictions = () => {
    return treatments.filter(t => t.medicalRestrictions && t.medicalRestrictions.length > 0).length
  }

  const getMostExpensive = () => {
    if (treatments.length === 0) return null
    return treatments.reduce((max, treatment) => 
      treatment.basePrice > max.basePrice ? treatment : max
    )
  }

  const categoryStats = getCategoryStats()
  const averagePrice = calculateAveragePrice()
  const treatmentsWithRestrictions = getTreatmentsWithRestrictions()
  const mostExpensive = getMostExpensive()

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
            <Skeleton className="h-10 w-full mb-3" />
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
                  Tratamientos 💆‍♀️
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredTreatments.length} de {treatments.length} tratamientos
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
                    <SheetTitle>Estadísticas de Tratamientos</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Tag className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold">{treatments.length}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                          <p className="text-lg font-bold">${averagePrice.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Precio promedio</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
                          <p className="text-2xl font-bold">{treatmentsWithRestrictions}</p>
                          <p className="text-xs text-muted-foreground">Con restricciones</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                          <p className="text-lg font-bold">${mostExpensive?.basePrice?.toLocaleString() || '0'}</p>
                          <p className="text-xs text-muted-foreground">Más caro</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Por Categoría</h4>
                      <div className="space-y-2">
                        {Object.entries(categoryStats).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between p-2 bg-muted rounded">
                            <Badge className={`${getCategoryColor(category)} text-xs`}>
                              {category}
                            </Badge>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        ))}
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
                      Personaliza la vista de tratamientos
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Categoría
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
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

                    {(searchTerm || selectedCategory !== 'all') && (
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('')
                            setSelectedCategory('all')
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
                placeholder="Buscar tratamientos..."
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
                  placeholder="Buscar tratamientos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 bg-background">
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
      </div>

      {/* Contenido principal */}
      <div className="p-4 space-y-6">
        
        {/* Estadísticas compactas - Mobile */}
        <div className="grid grid-cols-2 gap-4 sm:hidden">
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
                    ${averagePrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Precio promedio</p>
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
                <Tag className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{treatments.length}</p>
                  <p className="text-xs text-muted-foreground">Total tratamientos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">${averagePrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Precio promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{treatmentsWithRestrictions}</p>
                  <p className="text-xs text-muted-foreground">Con restricciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">${mostExpensive?.basePrice?.toLocaleString() || '0'}</p>
                  <p className="text-xs text-muted-foreground">Más costoso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de tratamientos */}
        {filteredTreatments.length > 0 ? (
          viewMode === 'grid' ? (
            /* Vista de grilla mobile enhanced */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTreatments.map((treatment) => (
                <Card key={treatment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                          {treatment.name}
                        </h3>
                        <Badge className={`${getCategoryColor(treatment.category)} text-xs border`}>
                          {treatment.category}
                        </Badge>
                      </div>
                      {treatment.imageUrl && (
                        <Avatar className="h-12 w-12 ml-3 flex-shrink-0">
                          <AvatarImage src={treatment.imageUrl} alt={treatment.name} />
                          <AvatarFallback className="text-sm">
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
                        <span className="font-semibold text-green-600">${treatment.basePrice.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {treatment.medicalRestrictions && treatment.medicalRestrictions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {treatment.medicalRestrictions.slice(0, 2).map((restriction) => (
                          <Badge key={restriction} variant="outline" className="text-xs border-warning text-warning">
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
                    
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center justify-between pt-3 border-t border-border">
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
                          <DropdownMenuItem onClick={() => router.push(`/admin/treatments/${treatment.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/treatments/${treatment.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(treatment.id)}
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
              {filteredTreatments.map((treatment) => (
                <Card key={treatment.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {treatment.imageUrl && (
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage src={treatment.imageUrl} alt={treatment.name} />
                            <AvatarFallback className="text-sm">
                              {treatment.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{treatment.name}</h3>
                            <Badge className={`${getCategoryColor(treatment.category)} text-xs border flex-shrink-0`}>
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
                              <span className="font-semibold text-green-600">${treatment.basePrice.toLocaleString()}</span>
                            </div>
                          </div>
                          {treatment.medicalRestrictions && treatment.medicalRestrictions.length > 0 && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-warning text-warning">
                                ⚠️ {treatment.medicalRestrictions.length} restricción{treatment.medicalRestrictions.length > 1 ? 'es' : ''}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/admin/treatments/${treatment.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/treatments/${treatment.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(treatment.id)}
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
          )
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Tag className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No se encontraron tratamientos</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'Comienza agregando tu primer tratamiento'
                }
              </p>
              {(!searchTerm && selectedCategory === 'all') && (
                <Button onClick={() => router.push('/admin/treatments/new')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Tratamiento
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botón flotante para nuevo tratamiento */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0 bg-primary hover:bg-primary/90"
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