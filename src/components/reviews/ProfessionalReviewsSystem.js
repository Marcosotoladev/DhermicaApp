// src/components/reviews/ProfessionalReviewsSystem.js
import React, { useState, useEffect } from 'react'
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Flag, 
  Trash2, 
  Edit3,
  Send,
  Shield,
  User,
  Calendar,
  MoreHorizontal,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock data for demonstration
const MOCK_REVIEWS = [
  {
    id: 'review_1',
    professionalId: 'prof_1',
    clientId: 'client_1',
    clientName: 'María González',
    clientInitials: 'MG',
    appointmentId: 'apt_1',
    rating: 5,
    comment: 'Excelente profesional, muy dedicada y los resultados fueron increíbles. El tratamiento de HydraFacial superó mis expectativas.',
    status: 'active',
    createdAt: new Date('2025-01-15'),
    treatment: 'HydraFacial',
    helpful: 12
  },
  {
    id: 'review_2',
    professionalId: 'prof_1',
    clientId: 'client_2',
    clientName: 'Ana Rodríguez',
    clientInitials: 'AR',
    appointmentId: 'apt_2',
    rating: 4,
    comment: 'Muy buena atención, solo que me hubiera gustado más información sobre el cuidado post-tratamiento.',
    status: 'active',
    createdAt: new Date('2025-01-10'),
    treatment: 'Peeling Químico',
    helpful: 8
  },
  {
    id: 'review_3',
    professionalId: 'prof_1',
    clientId: 'client_3',
    clientName: 'Carla Pérez',
    clientInitials: 'CP',
    appointmentId: 'apt_3',
    rating: 1,
    comment: 'Comentario inapropiado que debe ser moderado por contener lenguaje ofensivo...',
    status: 'pending',
    createdAt: new Date('2025-01-08'),
    treatment: 'Láser Definitivo',
    helpful: 0
  }
]

// Star Rating Component
const StarRating = ({ rating, editable = false, size = 'default', onRatingChange }) => {
  const [hover, setHover] = useState(0)
  const starSize = size === 'small' ? 'h-4 w-4' : size === 'large' ? 'h-6 w-6' : 'h-5 w-5'

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} cursor-pointer transition-colors ${
            star <= (hover || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 hover:text-yellow-400'
          }`}
          onClick={() => editable && onRatingChange && onRatingChange(star)}
          onMouseEnter={() => editable && setHover(star)}
          onMouseLeave={() => editable && setHover(0)}
        />
      ))}
    </div>
  )
}

// Rating Distribution Chart
const RatingDistribution = ({ reviews }) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const activeReviews = reviews.filter(r => r.status === 'active')
  
  activeReviews.forEach(review => {
    distribution[review.rating]++
  })

  const total = activeReviews.length
  const averageRating = total > 0 
    ? Math.round((activeReviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
    : 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold">{averageRating}</div>
        <StarRating rating={Math.round(averageRating)} />
        <p className="text-sm text-muted-foreground">{total} valoraciones</p>
      </div>
      
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = distribution[rating]
          const percentage = total > 0 ? (count / total) * 100 : 0
          
          return (
            <div key={rating} className="flex items-center space-x-2 text-sm">
              <span className="w-2">{rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Add Review Dialog
const AddReviewDialog = ({ professionalId, clientId, onReviewAdded, canReview = true }) => {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    
    setIsSubmitting(true)
    try {
      const newReview = {
        id: `review_${Date.now()}`,
        professionalId,
        clientId,
        clientName: 'Usuario Actual', // En implementación real viene del contexto de auth
        clientInitials: 'UA',
        rating,
        comment: comment.trim(),
        status: 'active',
        createdAt: new Date(),
        helpful: 0
      }
      
      onReviewAdded && onReviewAdded(newReview)
      setOpen(false)
      setRating(0)
      setComment('')
    } catch (error) {
      console.error('Error adding review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canReview) {
    return (
      <Alert>
        <AlertDescription>
          Debes tener al menos una cita completada para poder valorar este profesional.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Star className="h-4 w-4 mr-2" />
          Escribir Valoración
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Valorar Profesional</DialogTitle>
          <DialogDescription>
            Comparte tu experiencia para ayudar a otros clientes
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Calificación *
            </label>
            <StarRating 
              rating={rating} 
              editable={true} 
              size="large"
              onRatingChange={setRating}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentario (opcional)
            </label>
            <Textarea
              placeholder="Cuéntanos sobre tu experiencia con este profesional..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={rating === 0 || isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Enviando...' : 'Publicar Valoración'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Review Item Component
const ReviewItem = ({ review, isAdmin = false, currentClientId, onReviewUpdate, onReviewDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editComment, setEditComment] = useState(review.comment)
  const [showModerationDialog, setShowModerationDialog] = useState(false)

  const isOwner = currentClientId === review.clientId
  const canEdit = isOwner && review.status === 'active'

  const handleEdit = async () => {
    try {
      const updatedReview = {
        ...review,
        rating: editRating,
        comment: editComment.trim(),
        updatedAt: new Date()
      }
      onReviewUpdate && onReviewUpdate(updatedReview)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating review:', error)
    }
  }

  const handleModerate = async (status, reason = '') => {
    try {
      const moderatedReview = {
        ...review,
        status,
        moderationReason: reason,
        moderatedAt: new Date(),
        moderatedBy: 'admin' // En implementación real sería el ID del admin
      }
      onReviewUpdate && onReviewUpdate(moderatedReview)
      setShowModerationDialog(false)
    } catch (error) {
      console.error('Error moderating review:', error)
    }
  }

  const getStatusBadge = () => {
    switch (review.status) {
      case 'active':
        return <Badge variant="default" className="text-xs">Activo</Badge>
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pendiente</Badge>
      case 'hidden':
        return <Badge variant="destructive" className="text-xs">Oculto</Badge>
      default:
        return null
    }
  }

  return (
    <Card className={`${review.status !== 'active' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {review.clientInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium">{review.clientName}</h4>
                {getStatusBadge()}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <StarRating 
                    rating={editRating} 
                    editable={true}
                    onRatingChange={setEditRating}
                  />
                  <Textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleEdit}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <StarRating rating={review.rating} />
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                <span>{review.createdAt.toLocaleDateString('es-ES')}</span>
                {review.treatment && (
                  <Badge variant="outline" className="text-xs">
                    {review.treatment}
                  </Badge>
                )}
                {review.helpful > 0 && (
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{review.helpful}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(canEdit || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && !isEditing && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                
                {canEdit && (
                  <DropdownMenuItem 
                    onClick={() => onReviewDelete && onReviewDelete(review.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}

                {isAdmin && (
                  <>
                    {review.status === 'active' && (
                      <DropdownMenuItem onClick={() => setShowModerationDialog(true)}>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Ocultar
                      </DropdownMenuItem>
                    )}
                    
                    {review.status === 'hidden' && (
                      <DropdownMenuItem onClick={() => handleModerate('active')}>
                        <Eye className="h-4 w-4 mr-2" />
                        Mostrar
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => onReviewDelete && onReviewDelete(review.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Permanentemente
                    </DropdownMenuItem>
                  </>
                )}

                {!isOwner && !isAdmin && (
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {review.status === 'hidden' && review.moderationReason && (
          <Alert className="mt-3">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Oculto por moderación:</strong> {review.moderationReason}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Moderation Dialog */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderar Valoración</DialogTitle>
            <DialogDescription>
              Esta acción ocultará la valoración de la vista pública
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Razón de la moderación
              </label>
              <Select onValueChange={(value) => handleModerate('hidden', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una razón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate_language">Lenguaje inapropiado</SelectItem>
                  <SelectItem value="spam">Spam o contenido comercial</SelectItem>
                  <SelectItem value="false_information">Información falsa</SelectItem>
                  <SelectItem value="personal_attack">Ataque personal</SelectItem>
                  <SelectItem value="off_topic">Fuera de tema</SelectItem>
                  <SelectItem value="other">Otro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModerationDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Main Reviews Component
const ProfessionalReviewsSystem = ({ 
  professionalId, 
  currentClientId, 
  isAdmin = false,
  canAddReview = true 
}) => {
  const [reviews, setReviews] = useState(MOCK_REVIEWS)
  const [filter, setFilter] = useState('all') // all, active, pending, hidden
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, highest, lowest

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      if (filter === 'all') return true
      return review.status === filter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'highest':
          return b.rating - a.rating
        case 'lowest':
          return a.rating - b.rating
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

  const handleReviewAdded = (newReview) => {
    setReviews(prev => [newReview, ...prev])
  }

  const handleReviewUpdate = (updatedReview) => {
    setReviews(prev => prev.map(review => 
      review.id === updatedReview.id ? updatedReview : review
    ))
  }

  const handleReviewDelete = (reviewId) => {
    setReviews(prev => prev.filter(review => review.id !== reviewId))
  }

  const activeReviews = reviews.filter(r => r.status === 'active')

  return (
    <div className="space-y-6">
      
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Valoraciones y Comentarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Rating Distribution */}
            <RatingDistribution reviews={reviews} />
            
            {/* Add Review */}
            <div className="space-y-4">
              <h4 className="font-medium">¿Has sido atendido por este profesional?</h4>
              <AddReviewDialog
                professionalId={professionalId}
                clientId={currentClientId}
                onReviewAdded={handleReviewAdded}
                canReview={canAddReview}
              />
              
              {activeReviews.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {activeReviews.length} {activeReviews.length === 1 ? 'persona ha' : 'personas han'} valorado este profesional
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      {(reviews.length > 0 || isAdmin) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="active">Activas</SelectItem>
                      {isAdmin && (
                        <>
                          <SelectItem value="pending">Pendientes</SelectItem>
                          <SelectItem value="hidden">Ocultas</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="oldest">Más antiguas</SelectItem>
                    <SelectItem value="highest">Mejor valoradas</SelectItem>
                    <SelectItem value="lowest">Peor valoradas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                {filteredReviews.length} {filteredReviews.length === 1 ? 'valoración' : 'valoraciones'}
                {filter !== 'all' && ` (${filter})`}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              isAdmin={isAdmin}
              currentClientId={currentClientId}
              onReviewUpdate={handleReviewUpdate}
              onReviewDelete={handleReviewDelete}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {filter === 'all' ? 'Aún no hay valoraciones' : `No hay valoraciones ${filter}`}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Sé el primero en valorar a este profesional'
                  : 'Cambia el filtro para ver más valoraciones'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ProfessionalReviewsSystem
export { StarRating, RatingDistribution, AddReviewDialog }