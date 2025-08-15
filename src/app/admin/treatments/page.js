// src/app/admin/treatments/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Eye, Clock, DollarSign, Tag, ArrowLeft } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { treatmentService } from '../../../lib/firebase-services'
import { formatDuration } from '../../../lib/time-utils'
import { TREATMENT_CATEGORIES } from '../../../lib/validations'

/**
 * Página de gestión de tratamientos
 * Lista, busca y gestiona todos los tratamientos de Dhermica
 */
export default function TreatmentsPage() {
  const router = useRouter()
  const [treatments, setTreatments] = useState([])
  const [filteredTreatments, setFilteredTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadTreatments()
  }, [])

  useEffect(() => {
    filterTreatments()
  }, [treatments, searchTerm, selectedCategory])

  const loadTreatments = async () => {
    setLoading(true)
    try {
      const data = await treatmentService.getAll()
      setTreatments(data)
    } catch (error) {
      console.error('Error loading treatments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTreatments = () => {
    let filtered = treatments

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(treatment =>
        treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por categoría
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
              <h1 className="text-3xl font-bold text-foreground">Tratamientos</h1>
              <p className="text-muted-foreground">
                Gestiona los tratamientos de Dhermica
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/treatments/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tratamiento
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar tratamientos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filtro por categoría */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
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
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <DollarSign className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold">
                    ${treatments.reduce((sum, t) => sum + t.basePrice, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Valor total servicios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(treatments.reduce((sum, t) => sum + t.duration, 0) / treatments.length) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Duración promedio (min)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(treatments.map(t => t.category)).size}
                  </p>
                  <p className="text-xs text-muted-foreground">Categorías activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de tratamientos */}
        {filteredTreatments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTreatments.map((treatment) => (
              <Card key={treatment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{treatment.name}</CardTitle>
                      <Badge className={getCategoryColor(treatment.category)}>
                        {treatment.category}
                      </Badge>
                    </div>
                    {treatment.imageUrl && (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={treatment.imageUrl} alt={treatment.name} />
                        <AvatarFallback>
                          {treatment.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {treatment.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDuration(treatment.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">${treatment.basePrice.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {treatment.medicalRestrictions && treatment.medicalRestrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {treatment.medicalRestrictions.slice(0, 3).map((restriction) => (
                        <Badge key={restriction} variant="outline" className="text-xs">
                          ⚠️ {restriction}
                        </Badge>
                      ))}
                      {treatment.medicalRestrictions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{treatment.medicalRestrictions.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/treatments/${treatment.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/treatments/${treatment.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(treatment.id)}
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
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron tratamientos</h3>
              <p className="text-muted-foreground mb-4">
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
      </div>
    </div>
  )
}