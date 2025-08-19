// src/app/admin/treatments/[id]/page.js
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Clock, DollarSign, Tag, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../components/ui/alert'
import { Skeleton } from '../../../../components/ui/skeleton'
import { Separator } from '../../../../components/ui/separator'
import { treatmentService } from '../../../../lib/firebase-services'
import { formatDuration } from '../../../../lib/time-utils'
import { toast } from 'sonner'

/**
 * Página de detalle del tratamiento
 * Muestra información simplificada y permite acciones de edición/eliminación
 */
export default function TreatmentDetailPage({ params }) {
  const router = useRouter()
  const [treatment, setTreatment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Unwrap params Promise
  const resolvedParams = use(params)
  const treatmentId = resolvedParams.id

  useEffect(() => {
    loadTreatment()
  }, [treatmentId])

  const loadTreatment = async () => {
    try {
      const treatmentData = await treatmentService.getById(treatmentId)
      
      if (!treatmentData) {
        toast.error('Tratamiento no encontrado')
        router.push('/admin/treatments')
        return
      }

      setTreatment(treatmentData)
    } catch (error) {
      console.error('Error loading treatment:', error)
      toast.error('Error al cargar el tratamiento')
      router.push('/admin/treatments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!treatment) return
    
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el tratamiento "${treatment.name}"?\n\n` +
      'Esta acción no se puede deshacer.'
    )
    
    if (!confirmDelete) return

    setDeleting(true)
    try {
      await treatmentService.delete(treatmentId)
      toast.success('Tratamiento eliminado exitosamente')
      router.push('/admin/treatments')
    } catch (error) {
      console.error('Error deleting treatment:', error)
      toast.error('Error al eliminar el tratamiento')
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async () => {
    if (!treatment) return
    
    try {
      await treatmentService.update(treatmentId, { active: !treatment.active })
      toast.success(`Tratamiento ${!treatment.active ? 'activado' : 'desactivado'} exitosamente`)
      await loadTreatment()
    } catch (error) {
      console.error('Error updating treatment status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-20" />
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
            
            {/* Content skeletons */}
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!treatment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tratamiento no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El tratamiento que buscas no existe o ha sido eliminado
            </p>
            <Button onClick={() => router.push('/admin/treatments')}>
              Volver a Tratamientos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/treatments')}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tratamientos</span>
            </Button>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {treatment.name}
                </h1>
                <Badge 
                  variant={treatment.active !== false ? "default" : "secondary"}
                  className={treatment.active !== false 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-gray-100 text-gray-600 border-gray-200"
                  }
                >
                  {treatment.active !== false ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactivo
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Detalles del tratamiento
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleActive}
              className={treatment.active !== false ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
            >
              {treatment.active !== false ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/treatments/editar/${treatmentId}`)}
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive mr-2"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Eliminar</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Restricciones médicas */}
            {treatment.medicalRestrictions && treatment.medicalRestrictions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span>Restricciones Médicas</span>
                  </CardTitle>
                  <CardDescription>
                    Condiciones que requieren atención especial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {treatment.medicalRestrictions.map((restriction) => (
                        <Badge 
                          key={restriction} 
                          variant="outline" 
                          className="border-yellow-300 text-yellow-800 bg-yellow-50"
                        >
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Se mostrará una advertencia automática al agendar citas para 
                        clientes que tengan alguna de estas condiciones médicas.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensaje cuando no hay restricciones */}
            {(!treatment.medicalRestrictions || treatment.medicalRestrictions.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin Restricciones Médicas</h3>
                  <p className="text-muted-foreground">
                    Este tratamiento no tiene restricciones médicas especiales configuradas.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            
            {/* Información rápida */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Tratamiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Categoría */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Categoría</span>
                  </div>
                  <Badge variant="outline">{treatment.category}</Badge>
                </div>

                <Separator />

                {/* Duración */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Duración</span>
                  </div>
                  <span className="font-medium">
                    {formatDuration(treatment.duration)}
                  </span>
                </div>

                <Separator />

                {/* Precio */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Precio</span>
                  </div>
                  <span className="font-medium text-lg">
                    {treatment.basePrice ? `$${treatment.basePrice}` : 'Sin precio definido'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Estado y acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/admin/appointments/new?treatmentId=${treatmentId}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Cita
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/admin/treatments/editar/${treatmentId}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Tratamiento
                </Button>
              </CardContent>
            </Card>

            {/* Información del sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Creado el:</p>
                  <p className="font-medium">
                    {treatment.createdAt?.toDate?.()?.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) || 'No disponible'}
                  </p>
                </div>
                
                {treatment.updatedAt && (
                  <div>
                    <p className="text-muted-foreground">Última modificación:</p>
                    <p className="font-medium">
                      {treatment.updatedAt.toDate?.()?.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || 'No disponible'}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-muted-foreground">ID del tratamiento:</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {treatment.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}