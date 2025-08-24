// src/app/client/professionals/[id]/page.js
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../../../lib/firebase'
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Award,
  MessageSquare,
  Heart,
  Share,
  MapPin,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Send
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar'
import { Skeleton } from '../../../../components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Textarea } from '../../../../components/ui/textarea'
import { Separator } from '../../../../components/ui/separator'
import { Switch } from '../../../../components/ui/switch'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../../../../components/ui/collapsible'
import { professionalService, reviewService, appointmentService } from '../../../../lib/firebase-services'

export default function ClientProfessionalDetailPage({ params }) {
  const router = useRouter()
  const [user, loading, authError] = useAuthState(auth)
  const [professional, setProfessional] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '', anonymous: false })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [userAppointments, setUserAppointments] = useState([])
  const [expandedTreatments, setExpandedTreatments] = useState(false)
  const [expandedSchedule, setExpandedSchedule] = useState(false)
  const [activeReviewFilter, setActiveReviewFilter] = useState('all')

  const resolvedParams = use(params)
  const professionalId = resolvedParams.id

  useEffect(() => {
    if (user && professionalId) {
      loadProfessionalData()
      loadUserAppointments()
    }
  }, [user, professionalId])

  const loadProfessionalData = async () => {
    setLoadingData(true)
    try {
      const [professionalData, reviewsData] = await Promise.all([
        professionalService.getWithReviews(professionalId),
        reviewService.getByProfessional(professionalId, { status: 'approved' })
      ])
      
      setProfessional(professionalData)
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error loading professional data:', error)
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

  const canReviewProfessional = () => {
    return userAppointments.some(apt => 
      apt.professionalId === professionalId && 
      apt.status === 'completed' &&
      new Date(apt.date) < new Date()
    )
  }

  const hasReviewedProfessional = () => {
    return reviews.some(review => review.clientId === user?.uid)
  }

  const handleSubmitReview = async () => {
    if (!professional || reviewData.rating === 0) return

    setSubmittingReview(true)
    try {
      const review = {
        professionalId: professionalId,
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
      
      alert('Reseña enviada. Será visible tras revisión por el administrador.')
      
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error al enviar la reseña')
    } finally {
      setSubmittingReview(false)
    }
  }

  const renderStars = (rating, interactive = false, onRatingChange = null, size = "sm") => {
    const starSize = size === "lg" ? "h-6 w-6" : "h-4 w-4"
    
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
              className={`${starSize} ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const getScheduleSummary = () => {
    if (!professional?.baseSchedule) return []
    
    const dayNames = {
      monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
      thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
    }

    return Object.entries(professional.baseSchedule)
      .filter(([_, schedule]) => schedule.active)
      .map(([day, schedule]) => {
        const workBlocks = schedule.blocks?.filter(b => b.type === 'work') || []
        const timeRange = workBlocks.length > 0 
          ? `${workBlocks[0].start} - ${workBlocks[workBlocks.length - 1].end}`
          : 'Sin horarios'
        
        return {
          day: dayNames[day],
          time: timeRange
        }
      })
  }

  const groupTreatmentsByGender = () => {
    if (!professional?.availableTreatments) return { hombre: [], mujer: [] }
    
    const grouped = { hombre: [], mujer: [] }
    
    professional.availableTreatments.forEach(treatment => {
      if (treatment.genderSpecific === 'hombre') {
        grouped.hombre.push(treatment)
      } else if (treatment.genderSpecific === 'mujer') {
        grouped.mujer.push(treatment)
      }
    })
    
    return grouped
  }

  const filteredReviews = reviews.filter(review => {
    if (activeReviewFilter === 'all') return true
    return review.rating >= parseInt(activeReviewFilter)
  })

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="sticky top-0 z-10 backdrop-blur-sm bg-white/95 border-b p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (authError || !user || !professional) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {!professional ? 'Profesional no encontrado' : 'Error de acceso'}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {!professional 
                ? 'El profesional que buscas no existe o no está disponible.' 
                : authError ? authError.message : 'Necesitas iniciar sesión'
              }
            </p>
            <Button onClick={() => router.push(!professional ? '/client/professionals' : '/login')}>
              {!professional ? 'Ver Profesionales' : 'Ir al login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const treatmentGroups = groupTreatmentsByGender()
  const scheduleData = getScheduleSummary()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      
      {/* Header Sticky */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-white/95 border-b">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg truncate max-w-48">
                  {professional.name}
                </h1>
                {professional.totalReviews > 0 && (
                  <div className="flex items-center space-x-1">
                    {renderStars(professional.averageRating)}
                    <span className="text-sm text-muted-foreground">
                      ({professional.totalReviews})
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Professional Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4 mb-4">
              <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                {professional.profilePhoto?.base64 ? (
                  <AvatarImage 
                    src={professional.profilePhoto.base64} 
                    alt={professional.name}
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-lg">
                    {professional.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-2">{professional.name}</h2>
                
                {/* Rating y stats */}
                <div className="flex items-center space-x-4 mb-3">
                  {professional.totalReviews > 0 ? (
                    <div className="flex items-center space-x-2">
                      {renderStars(professional.averageRating, false, null, "lg")}
                      <div className="text-sm">
                        <div className="font-semibold">{professional.averageRating}</div>
                        <div className="text-muted-foreground">{professional.totalReviews} reseñas</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Sin reseñas aún
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {professional.acceptsOnlineBooking && (
                    <Badge variant="default">
                      <Calendar className="h-3 w-3 mr-1" />
                      Reserva Online
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {professional.advanceBookingDays || 30} días anticipación
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            {professional.description && (
              <div className="mb-4">
                <p className="text-muted-foreground">{professional.description}</p>
              </div>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              {professional.phone && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`tel:${professional.phone}`, '_self')}
                  className="justify-start"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
              )}
              {professional.email && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`mailto:${professional.email}`, '_self')}
                  className="justify-start"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Treatments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tratamientos</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setExpandedTreatments(!expandedTreatments)}
              >
                {expandedTreatments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Collapsible open={expandedTreatments} onOpenChange={setExpandedTreatments}>
              <CollapsibleContent>
                <div className="space-y-4">
                  
                  {treatmentGroups.hombre.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          H
                        </Badge>
                        <h4 className="font-semibold text-blue-700">Tratamientos para Hombre</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {treatmentGroups.hombre.map((treatment, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h5 className="font-medium">
                                    {treatment.name.replace(' (Hombre)', '')}
                                  </h5>
                                  {treatment.certified && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Award className="h-3 w-3 mr-1" />
                                      Certificado
                                    </Badge>
                                  )}
                                </div>
                                {treatment.experience && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong>Experiencia:</strong> {treatment.experience}
                                  </p>
                                )}
                                {treatment.notes && (
                                  <p className="text-sm text-muted-foreground">
                                    {treatment.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {treatmentGroups.mujer.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                          M
                        </Badge>
                        <h4 className="font-semibold text-pink-700">Tratamientos para Mujer</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {treatmentGroups.mujer.map((treatment, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h5 className="font-medium">
                                    {treatment.name.replace(' (Mujer)', '')}
                                  </h5>
                                  {treatment.certified && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Award className="h-3 w-3 mr-1" />
                                      Certificado
                                    </Badge>
                                  )}
                                </div>
                                {treatment.experience && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong>Experiencia:</strong> {treatment.experience}
                                  </p>
                                )}
                                {treatment.notes && (
                                  <p className="text-sm text-muted-foreground">
                                    {treatment.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Preview cuando está colapsado */}
            {!expandedTreatments && (
              <div className="space-y-2">
                {treatmentGroups.hombre.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">H</Badge>
                    <div className="flex flex-wrap gap-1">
                      {treatmentGroups.hombre.slice(0, 3).map((treatment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {treatment.name.replace(' (Hombre)', '')}
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
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs">M</Badge>
                    <div className="flex flex-wrap gap-1">
                      {treatmentGroups.mujer.slice(0, 3).map((treatment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {treatment.name.replace(' (Mujer)', '')}
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
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Horarios</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setExpandedSchedule(!expandedSchedule)}
              >
                {expandedSchedule ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Collapsible open={expandedSchedule} onOpenChange={setExpandedSchedule}>
              <CollapsibleContent>
                <div className="space-y-2">
                  {scheduleData.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                      <span className="font-medium">{schedule.day}</span>
                      <span className="text-muted-foreground">{schedule.time}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {!expandedSchedule && (
              <div className="text-muted-foreground text-sm">
                {scheduleData.length} días laborales configurados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Reseñas ({reviews.length})
            </CardTitle>
            {reviews.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant={activeReviewFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveReviewFilter('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={activeReviewFilter === '5' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveReviewFilter('5')}
                >
                  5★
                </Button>
                <Button
                  variant={activeReviewFilter === '4' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveReviewFilter('4')}
                >
                  4★+
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredReviews.length > 0 ? (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {review.anonymous ? '?' : (review.clientName?.charAt(0) || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {review.anonymous ? 'Usuario anónimo' : review.clientName}
                            </p>
                            <div className="flex items-center space-x-2">
                              {renderStars(review.rating)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt.toDate()).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {reviews.length === 0 ? 'Aún no hay reseñas' : 'No hay reseñas con este filtro'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="sticky bottom-4 z-10">
          <div className="bg-white rounded-lg border shadow-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              {professional.acceptsOnlineBooking ? (
                <Button
                  size="lg"
                  onClick={() => router.push(`/client/appointments/new?professional=${professionalId}`)}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reservar Cita
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => professional.phone && window.open(`tel:${professional.phone}`, '_self')}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contactar
                </Button>
              )}
              
              {canReviewProfessional() && !hasReviewedProfessional() && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowReviewModal(true)}
                  className="flex-1"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Reseñar
                </Button>
              )}
              
              {(!canReviewProfessional() || hasReviewedProfessional()) && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => alert('Función próximamente')}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mensaje
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Escribir Reseña</DialogTitle>
            <DialogDescription className="text-sm">
              Comparte tu experiencia con {professional.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Calificación *
              </label>
              <div className="flex justify-center py-2">
                {renderStars(reviewData.rating, true, (rating) => 
                  setReviewData(prev => ({ ...prev, rating })), "lg"
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
                rows={4}
                className="text-sm"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
              <span className="text-sm">Publicar de forma anónima</span>
              <Switch
                checked={reviewData.anonymous}
                onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, anonymous: checked }))}
              />
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Tu reseña será revisada antes de publicarse y aparecerá visible tras la aprobación del administrador.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="flex space-x-3 pt-2">
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
              {submittingReview ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Enviar</span>
                </div>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}