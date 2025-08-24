// src/app/client/professionals/page.js
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../../lib/firebase'
import { 
  Search, 
  Star, 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft,
  Filter,
  Award,
  CheckCircle,
  Phone,
  Mail,
  MessageSquare,
  Heart,
  X,
  ChevronDown,
  MapPin
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Skeleton } from '../../../components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Separator } from '../../../components/ui/separator'
import { professionalService, reviewService, appointmentService } from '../../../lib/firebase-services'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Switch } from '../../../components/ui/switch'

// 🔥 IMPORTAR NUEVA ESTRUCTURA DE TRATAMIENTOS
import { AVAILABLE_TREATMENTS, getTreatmentNameById } from '../../../constants/treatments'

export default function ClientProfessionalsPage() {
  const router = useRouter()
  const [user, loading, error] = useAuthState(auth)
  const [professionals, setProfessionals] = useState([])
  const [filteredProfessionals, setFilteredProfessionals] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [treatmentFilter, setTreatmentFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '', anonymous: false })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [userAppointments, setUserAppointments] = useState([])

  useEffect(() => {
    if (user) {
      loadProfessionals()
      loadUserAppointments()
    }
  }, [user])

  useEffect(() => {
    filterProfessionals()
  }, [professionals, searchTerm, treatmentFilter, genderFilter, ratingFilter, availabilityFilter])

  const loadProfessionals = async () => {
    setLoadingData(true)
    try {
      const data = await professionalService.getAllWithReviews()
      setProfessionals(data.filter(prof => prof.available !== false))
    } catch (error) {
      console.error('Error loading professionals:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadUserAppointments = async () => {
    try {
      if (appointmentService && appointmentService.getUserAppointments) {
        const appointments = await appointmentService.getUserAppointments(user.uid)
        setUserAppointments(appointments)
      }
    } catch (error) {
      console.error('Error loading user appointments:', error)
    }
  }

  // 🔥 FUNCIÓN PARA OBTENER TRATAMIENTOS ÚNICOS CON GÉNEROS
  const getAvailableTreatments = () => {
    const treatmentSet = new Set()
    
    professionals.forEach(prof => {
      if (prof.availableTreatments) {
        prof.availableTreatments.forEach(treatment => {
          treatmentSet.add(treatment.treatmentId)
        })
      }
    })
    
    return Array.from(treatmentSet)
  }

  const filterProfessionals = () => {
    let filtered = [...professionals]

    if (searchTerm) {
      filtered = filtered.filter(professional =>
        professional.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professional.availableTreatments?.some(treatment =>
          treatment.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        professional.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (treatmentFilter !== 'all') {
      filtered = filtered.filter(professional =>
        professional.availableTreatments?.some(treatment =>
          treatment.treatmentId?.includes(treatmentFilter)
        )
      )
    }

    if (genderFilter !== 'all') {
      filtered = filtered.filter(professional =>
        professional.availableTreatments?.some(treatment =>
          treatment.genderSpecific === genderFilter
        )
      )
    }

    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter)
      filtered = filtered.filter(professional =>
        (professional.averageRating || 0) >= minRating
      )
    }

    if (availabilityFilter === 'online') {
      filtered = filtered.filter(professional => professional.acceptsOnlineBooking)
    }

    setFilteredProfessionals(filtered)
  }

  const handleSubmitReview = async () => {
    if (!selectedProfessional || reviewData.rating === 0) return

    setSubmittingReview(true)
    try {
      const review = {
        professionalId: selectedProfessional.id,
        clientId: user.uid,
        clientName: reviewData.anonymous ? 'Usuario anónimo' : user.displayName || user.email,
        rating: reviewData.rating,
        comment: reviewData.comment,
        anonymous: reviewData.anonymous,
        createdAt: new Date(),
        status: 'pending'
      }

      await reviewService.create(review)
      
      setShowReviewModal(false)
      setReviewData({ rating: 0, comment: '', anonymous: false })
      setSelectedProfessional(null)
      
      alert('Reseña enviada. Será visible tras revisión por el administrador.')
      
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error al enviar la reseña')
    } finally {
      setSubmittingReview(false)
    }
  }

  const canReviewProfessional = (professionalId) => {
    return userAppointments.some(apt => 
      apt.professionalId === professionalId && 
      apt.status === 'completed' &&
      new Date(apt.date) < new Date()
    )
  }

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            disabled={!interactive}
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {!interactive && rating > 0 && (
          <span className="text-sm text-muted-foreground ml-1">
            ({rating})
          </span>
        )}
      </div>
    )
  }

  const getScheduleSummary = (professional) => {
    if (!professional.baseSchedule) return 'Horarios disponibles'
    
    const activeDays = Object.entries(professional.baseSchedule)
      .filter(([_, schedule]) => schedule.active)
      .map(([day]) => {
        const dayNames = {
          monday: 'L', tuesday: 'M', wednesday: 'X', 
          thursday: 'J', friday: 'V', saturday: 'S', sunday: 'D'
        }
        return dayNames[day] || day
      })
    
    return activeDays.length > 0 ? activeDays.join('-') : 'Sin horarios'
  }

  // 🔥 FUNCIÓN PARA AGRUPAR TRATAMIENTOS POR GÉNERO
  const groupTreatmentsByGender = (treatments) => {
    const grouped = { hombre: [], mujer: [] }
    
    treatments?.forEach(treatment => {
      if (treatment.genderSpecific === 'hombre') {
        grouped.hombre.push(treatment)
      } else if (treatment.genderSpecific === 'mujer') {
        grouped.mujer.push(treatment)
      }
    })
    
    return grouped
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <User className="h-12 w-12 text-destructive mx-auto mb-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      
      {/* Header Mobile-First */}
      <div className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/client/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Profesionales</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {filteredProfessionals.length} disponibles
                </p>
              </div>
            </div>
            
            {/* Filtros Mobile */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoría</label>
                    <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {AVAILABLE_TREATMENTS.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Género</label>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los géneros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los géneros</SelectItem>
                        <SelectItem value="hombre">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1">H</Badge>
                            <span>Hombre</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="mujer">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs px-1">M</Badge>
                            <span>Mujer</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rating mínimo</label>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquier rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquier rating</SelectItem>
                        <SelectItem value="4">4+ ★</SelectItem>
                        <SelectItem value="3">3+ ★</SelectItem>
                        <SelectItem value="2">2+ ★</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Disponibilidad</label>
                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="online">Reserva online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setTreatmentFilter('all')
                      setGenderFilter('all')
                      setRatingFilter('all')
                      setAvailabilityFilter('all')
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar profesionales o tratamientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {filteredProfessionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProfessionals.map((professional) => {
              const treatmentGroups = groupTreatmentsByGender(professional.availableTreatments)
              
              return (
                <Card key={professional.id} className="hover:shadow-md transition-all duration-300">
                  <CardContent className="p-0">
                    
                    {/* Header */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/10">
                          {professional.profilePhoto?.base64 ? (
                            <AvatarImage 
                              src={professional.profilePhoto.base64} 
                              alt={professional.name}
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-sm">
                              {professional.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg mb-1">
                            {professional.name}
                          </h3>
                          
                          {/* Rating */}
                          <div className="flex items-center space-x-2 mb-2">
                            {professional.totalReviews > 0 ? (
                              <div className="flex items-center space-x-1">
                                {renderStars(professional.averageRating)}
                                <span className="text-xs text-muted-foreground">
                                  ({professional.totalReviews})
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Sin reseñas
                              </span>
                            )}
                          </div>
                          
                          {/* Badges */}
                          <div className="flex items-center space-x-1">
                            {professional.acceptsOnlineBooking && (
                              <Badge variant="secondary" className="text-xs px-2 py-0">
                                <Calendar className="h-3 w-3 mr-1" />
                                Online
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              <Clock className="h-3 w-3 mr-1" />
                              {getScheduleSummary(professional)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {professional.description && (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {professional.description}
                        </p>
                      </div>
                    )}

                    {/* 🔥 TRATAMIENTOS AGRUPADOS POR GÉNERO */}
                    <div className="px-4 pb-3 space-y-2">
                      {treatmentGroups.hombre.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1 py-0">H</Badge>
                            <span className="text-xs font-medium text-muted-foreground">Hombre</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {treatmentGroups.hombre.slice(0, 3).map((treatment, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {treatment.name.replace(' (Hombre)', '')}
                                {treatment.certified && <Award className="h-3 w-3 ml-1" />}
                              </Badge>
                            ))}
                            {treatmentGroups.hombre.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{treatmentGroups.hombre.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {treatmentGroups.mujer.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs px-1 py-0">M</Badge>
                            <span className="text-xs font-medium text-muted-foreground">Mujer</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {treatmentGroups.mujer.slice(0, 3).map((treatment, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {treatment.name.replace(' (Mujer)', '')}
                                {treatment.certified && <Award className="h-3 w-3 ml-1" />}
                              </Badge>
                            ))}
                            {treatmentGroups.mujer.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{treatmentGroups.mujer.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="p-4 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => router.push(`/client/professionals/${professional.id}`)}
                        >
                          Ver Detalles
                        </Button>
                        
                        {professional.acceptsOnlineBooking ? (
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => router.push(`/client/appointments/new?professional=${professional.id}`)}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Reservar
                          </Button>
                        ) : (
                          <Button
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={() => professional.phone && window.open(`tel:${professional.phone}`, '_self')}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Contactar
                          </Button>
                        )}
                      </div>
                      
                      {canReviewProfessional(professional.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 text-xs"
                          onClick={() => {
                            setSelectedProfessional(professional)
                            setShowReviewModal(true)
                          }}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Escribir Reseña
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No se encontraron profesionales
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Prueba ajustando los filtros de búsqueda
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setTreatmentFilter('all')
                  setGenderFilter('all')
                  setRatingFilter('all')
                  setAvailabilityFilter('all')
                }}
              >
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Modal Mobile-Optimized */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Escribir Reseña</DialogTitle>
            <DialogDescription className="text-sm">
              Comparte tu experiencia con {selectedProfessional?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Calificación *
              </label>
              <div className="flex justify-center py-2">
                {renderStars(reviewData.rating, true, (rating) => 
                  setReviewData(prev => ({ ...prev, rating }))
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comentario
              </label>
              <Textarea
                placeholder="Describe tu experiencia..."
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                rows={3}
                className="text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={reviewData.anonymous}
                onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, anonymous: checked }))}
              />
              <label className="text-sm">
                Publicar de forma anónima
              </label>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Tu reseña será revisada antes de publicarse.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowReviewModal(false)}
              disabled={submittingReview}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitReview}
              disabled={reviewData.rating === 0 || submittingReview}
            >
              {submittingReview ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}