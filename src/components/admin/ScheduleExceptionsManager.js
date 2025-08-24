// src/components/admin/ScheduleExceptionsManager.js
import React, { useState } from 'react'
import { 
  Calendar, 
  Plus, 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Edit3,
  Trash2,
  Save,
  Ban,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const generateBlockId = () => 'block_' + Math.random().toString(36).substr(2, 9)

// 🔥 CAMBIO IMPORTANTE: Importar la nueva estructura
import { AVAILABLE_TREATMENTS, getAllTreatmentsFlat } from '../../constants/treatments'

const ScheduleExceptionDialog = ({ 
  exception = null, 
  onSave, 
  onClose, 
  open = false 
}) => {
  const [formData, setFormData] = useState(exception || {
    date: '',
    type: 'custom',
    reason: '',
    blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }],
    availableTreatmentsOverride: []
  })

  const [showTreatments, setShowTreatments] = useState(false)

  const handleSave = () => {
    if (!formData.date) return
    
    if (formData.type === 'custom' && formData.blocks.length === 0) {
      alert('Debes agregar al menos un bloque de tiempo para horario personalizado')
      return
    }

    onSave({
      ...formData,
      id: exception?.id || `exception_${Date.now()}`
    })
    onClose()
  }

  const addTimeBlock = () => {
    setFormData(prev => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        { id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }
      ]
    }))
  }

  const removeTimeBlock = (blockId) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }))
  }

  const updateTimeBlock = (blockId, field, value) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId ? { ...block, [field]: value } : block
      )
    }))
  }

  const toggleTreatment = (treatmentId) => {
    setFormData(prev => ({
      ...prev,
      availableTreatmentsOverride: prev.availableTreatmentsOverride.includes(treatmentId)
        ? prev.availableTreatmentsOverride.filter(id => id !== treatmentId)
        : [...prev.availableTreatmentsOverride, treatmentId]
    }))
  }

  // 🔥 FUNCIÓN HELPER: Obtener el nombre de un tratamiento por ID (incluyendo género específico)
  const getTreatmentNameById = (id) => {
    // Buscar en tratamientos con género específico
    const treatmentsWithGender = getTreatmentsWithGenderOptions()
    for (const category of treatmentsWithGender) {
      const subcategory = category.subcategories?.find(sub => sub.id === id)
      if (subcategory) return subcategory.displayName
    }
    
    // Fallback: buscar en estructura original
    for (const category of AVAILABLE_TREATMENTS) {
      const subcategory = category.subcategories?.find(sub => sub.id === id)
      if (subcategory) return subcategory.name
    }
    
    const mainCategory = AVAILABLE_TREATMENTS.find(t => t.id === id)
    return mainCategory?.name || id
  }

  // 🔥 FUNCIÓN PARA GENERAR TRATAMIENTOS CON GÉNEROS ESPECÍFICOS
  const getTreatmentsWithGenderOptions = () => {
    const treatments = []
    
    AVAILABLE_TREATMENTS.forEach(category => {
      const subcategoriesWithGender = []
      
      category.subcategories?.forEach(sub => {
        if (sub.genders.length === 1) {
          // Si solo tiene un género, agregar tal como está
          subcategoriesWithGender.push({
            ...sub,
            displayName: sub.name,
            genderSpecific: sub.genders[0]
          })
        } else if (sub.genders.length > 1) {
          // Si tiene múltiples géneros, crear una opción por cada género
          sub.genders.forEach(gender => {
            subcategoriesWithGender.push({
              ...sub,
              id: `${sub.id}_${gender}`,
              displayName: `${sub.name} (${gender === 'hombre' ? 'Hombre' : 'Mujer'})`,
              genderSpecific: gender,
              originalId: sub.id
            })
          })
        }
      })
      
      if (subcategoriesWithGender.length > 0) {
        treatments.push({
          ...category,
          subcategories: subcategoriesWithGender
        })
      }
    })
    
    return treatments
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'custom': return <Clock className="h-4 w-4" />
      case 'unavailable': return <Ban className="h-4 w-4" />
      case 'partial': return <AlertTriangle className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] sm:w-[95vw] max-w-2xl max-h-[98vh] sm:max-h-[95vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-base sm:text-lg">
            {exception ? 'Editar Excepción' : 'Nueva Excepción'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configura horarios especiales para fechas específicas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          
          {/* Fecha y Tipo - Stack en mobile */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1 block">Fecha *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="text-xs sm:text-sm h-9"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium mb-1 block">Tipo *</label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="text-xs sm:text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs sm:text-sm">Horario Personalizado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="unavailable">
                    <div className="flex items-center space-x-2">
                      <Ban className="h-3 w-3" />
                      <span className="text-xs sm:text-sm">No Disponible</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="partial">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs sm:text-sm">Disponibilidad Parcial</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1 block">Razón/Descripción</label>
            <Textarea
              placeholder="Ej: Día libre, Capacitación..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={2}
              className="text-xs sm:text-sm resize-none h-16"
            />
          </div>

          {/* Bloques de Tiempo */}
          {(formData.type === 'custom' || formData.type === 'partial') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-medium">Bloques de Tiempo</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addTimeBlock}
                  className="text-[10px] sm:text-xs px-2 h-7 sm:h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span className="hidden xs:inline">Agregar</span>
                </Button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {formData.blocks.map((block, index) => (
                  <Card key={block.id} className="p-2 sm:p-3">
                    <div className="space-y-2 sm:space-y-0">
                      
                      {/* Primera fila: Tipo y horarios */}
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={block.type}
                          onValueChange={(value) => updateTimeBlock(block.id, 'type', value)}
                        >
                          <SelectTrigger className="w-16 sm:w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="work">
                              <span className="text-xs">Trabajo</span>
                            </SelectItem>
                            <SelectItem value="break">
                              <span className="text-xs">Pausa</span>
                            </SelectItem>
                            <SelectItem value="lunch">
                              <span className="text-xs">Almuerzo</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          type="time"
                          value={block.start}
                          onChange={(e) => updateTimeBlock(block.id, 'start', e.target.value)}
                          className="w-20 sm:w-24 text-xs"
                        />
                        
                        <span className="text-xs text-muted-foreground">-</span>
                        
                        <Input
                          type="time"
                          value={block.end}
                          onChange={(e) => updateTimeBlock(block.id, 'end', e.target.value)}
                          className="w-20 sm:w-24 text-xs"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeBlock(block.id)}
                          className="text-destructive hover:text-destructive p-1 h-8 w-8"
                          disabled={formData.blocks.length === 1}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Segunda fila: Descripción (solo para breaks) */}
                      {block.type !== 'work' && (
                        <Input
                          placeholder="Descripción opcional"
                          value={block.description || ''}
                          onChange={(e) => updateTimeBlock(block.id, 'description', e.target.value)}
                          className="text-xs"
                        />
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {formData.blocks.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Agrega al menos un bloque de tiempo.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* 🔥 TRATAMIENTOS - NUEVA ESTRUCTURA CON SUBCATEGORÍAS */}
          {formData.type !== 'unavailable' && (
            <div>
              <Collapsible open={showTreatments} onOpenChange={setShowTreatments}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-auto font-medium text-sm"
                  >
                    <span>Restricción de Tratamientos (Opcional)</span>
                    {showTreatments ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-3 mt-3">
                  <p className="text-xs text-muted-foreground">
                    Si no seleccionas ningún tratamiento, estarán disponibles todos. 
                    Si seleccionas específicos, solo esos estarán disponibles este día.
                  </p>

                  {/* Tratamientos con opciones específicas por género */}
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {getTreatmentsWithGenderOptions().map((category) => (
                      <div key={category.id} className="space-y-2">
                        <h4 className="text-sm font-semibold text-primary border-b pb-1">
                          {category.name}
                        </h4>
                        <div className="grid grid-cols-1 gap-2 ml-2">
                          {category.subcategories?.map((subcategory) => (
                            <div key={subcategory.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id={subcategory.id}
                                checked={formData.availableTreatmentsOverride.includes(subcategory.id)}
                                onCheckedChange={() => toggleTreatment(subcategory.id)}
                              />
                              <label 
                                htmlFor={subcategory.id} 
                                className="text-sm cursor-pointer flex-1 flex flex-col"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{subcategory.displayName}</span>
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs px-1 py-0 ${
                                      subcategory.genderSpecific === 'hombre' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-pink-100 text-pink-700'
                                    }`}
                                  >
                                    {subcategory.genderSpecific === 'hombre' ? 'H' : 'M'}
                                  </Badge>
                                </div>
                                {subcategory.description && (
                                  <span className="text-xs text-muted-foreground">{subcategory.description}</span>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista previa de selección */}
                  {formData.availableTreatmentsOverride.length > 0 && (
                    <div className="p-2 sm:p-3 bg-orange-50 rounded border text-xs">
                      <p className="text-orange-800">
                        <strong>Solo disponibles:</strong> {' '}
                        {formData.availableTreatmentsOverride
                          .map(id => getTreatmentNameById(id))
                          .join(', ')}
                      </p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Vista Previa */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Vista Previa</h4>
            <div className="flex items-start space-x-2">
              {getTypeIcon(formData.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {formData.date ? new Date(formData.date).toLocaleDateString('es-ES', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'Fecha no seleccionada'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formData.reason || 'Sin descripción'}
                </p>
                {formData.type !== 'unavailable' && formData.blocks.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.blocks.filter(b => b.type === 'work').map((block) => (
                      <Badge key={block.id} variant="outline" className="text-xs px-1 py-0">
                        {block.start}-{block.end}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!formData.date} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {exception ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ScheduleExceptionsManager = ({ 
  professionalId, 
  exceptions = [], 
  onUpdate 
}) => {
  const [showDialog, setShowDialog] = useState(false)
  const [editingException, setEditingException] = useState(null)
  const [showPastExceptions, setShowPastExceptions] = useState(false)

  // 🔥 FUNCIÓN HELPER: Obtener el nombre de un tratamiento por ID
  const getTreatmentNameById = (id) => {
    // Buscar en subcategorías
    for (const category of AVAILABLE_TREATMENTS) {
      const subcategory = category.subcategories?.find(sub => sub.id === id)
      if (subcategory) return subcategory.name
    }
    // Buscar en categorías principales (fallback)
    const mainCategory = AVAILABLE_TREATMENTS.find(t => t.id === id)
    return mainCategory?.name || id
  }

  const handleSaveException = (exceptionData) => {
    if (editingException) {
      const updatedExceptions = exceptions.map(exc => 
        exc.id === editingException.id ? exceptionData : exc
      )
      onUpdate(updatedExceptions)
    } else {
      onUpdate([...exceptions, exceptionData])
    }
    
    setEditingException(null)
    setShowDialog(false)
  }

  const handleDeleteException = (exceptionId) => {
    if (window.confirm('¿Eliminar esta excepción?')) {
      onUpdate(exceptions.filter(exc => exc.id !== exceptionId))
    }
  }

  const handleEditException = (exception) => {
    setEditingException(exception)
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingException(null)
  }

  const sortedExceptions = [...exceptions].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const futureExceptions = sortedExceptions.filter(exc => 
    new Date(exc.date) >= today
  )
  
  const pastExceptions = sortedExceptions.filter(exc => 
    new Date(exc.date) < today
  )

  const getTypeInfo = (type) => {
    switch (type) {
      case 'custom':
        return { 
          label: 'Personalizado', 
          icon: Clock, 
          color: 'bg-blue-100 text-blue-800 border-blue-200' 
        }
      case 'unavailable':
        return { 
          label: 'No Disponible', 
          icon: Ban, 
          color: 'bg-red-100 text-red-800 border-red-200' 
        }
      case 'partial':
        return { 
          label: 'Parcial', 
          icon: AlertTriangle, 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
        }
      default:
        return { 
          label: type, 
          icon: Calendar, 
          color: 'bg-gray-100 text-gray-800 border-gray-200' 
        }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Excepciones de Horario</span>
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Configura horarios especiales o días no disponibles
            </CardDescription>
          </div>
          <Button onClick={() => setShowDialog(true)} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Nueva</span>
            <span className="hidden sm:inline">Nueva Excepción</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6">
        
        {/* Próximas Excepciones */}
        {futureExceptions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-primary">
              Próximas ({futureExceptions.length})
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {futureExceptions.map((exception) => {
                const typeInfo = getTypeInfo(exception.type)
                const Icon = typeInfo.icon
                
                return (
                  <Card key={exception.id} className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h5 className="font-medium text-sm truncate">
                              {new Date(exception.date).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </h5>
                            <Badge className={`${typeInfo.color} text-xs w-fit`}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                          
                          {exception.reason && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {exception.reason}
                            </p>
                          )}
                          
                          {exception.type !== 'unavailable' && exception.blocks && (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {exception.blocks
                                  .filter(block => block.type === 'work')
                                  .map((block) => (
                                    <Badge key={block.id} variant="outline" className="text-xs px-1 py-0">
                                      {block.start}-{block.end}
                                    </Badge>
                                  ))}
                              </div>
                              
                              {exception.blocks.filter(block => block.type !== 'work').length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {exception.blocks
                                    .filter(block => block.type !== 'work')
                                    .map((block) => (
                                      <Badge 
                                        key={block.id} 
                                        variant="secondary" 
                                        className="text-xs px-1 py-0"
                                      >
                                        {block.type === 'break' ? 'Pausa' : 'Almuerzo'} 
                                        {block.start}-{block.end}
                                      </Badge>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* 🔥 ACTUALIZAR VISUALIZACIÓN DE TRATAMIENTOS */}
                          {exception.availableTreatmentsOverride && 
                           exception.availableTreatmentsOverride.length > 0 && (
                            <div className="mt-2 p-2 bg-orange-50 rounded text-xs">
                              <strong>Solo:</strong> {
                                exception.availableTreatmentsOverride
                                  .map(id => getTreatmentNameById(id))
                                  .slice(0, 2)
                                  .join(', ')
                              }
                              {exception.availableTreatmentsOverride.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditException(exception)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteException(exception.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Historial - Collapsible */}
        {pastExceptions.length > 0 && (
          <div>
            <Collapsible open={showPastExceptions} onOpenChange={setShowPastExceptions}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-0 h-auto text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <span>Historial ({pastExceptions.length})</span>
                  {showPastExceptions ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-2 mt-3">
                {pastExceptions.slice(-5).map((exception) => {
                  const typeInfo = getTypeInfo(exception.type)
                  const Icon = typeInfo.icon
                  
                  return (
                    <Card key={exception.id} className="p-2 sm:p-3 opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {new Date(exception.date).toLocaleDateString('es-ES', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {typeInfo.label}
                              </Badge>
                            </div>
                            {exception.reason && (
                              <p className="text-xs text-muted-foreground truncate">
                                {exception.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteException(exception.id)}
                          className="text-destructive hover:text-destructive opacity-50 h-8 w-8 p-0 flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  )
                })}
                {pastExceptions.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground">
                    ... y {pastExceptions.length - 5} más
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Estado vacío */}
        {exceptions.length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2 sm:mb-3" />
            <h4 className="text-base sm:text-lg font-medium mb-2">Sin excepciones</h4>
            <p className="text-muted-foreground mb-4 text-sm px-4">
              Configura horarios especiales para fechas específicas
            </p>
            <Button onClick={() => setShowDialog(true)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Excepción
            </Button>
          </div>
        )}

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Info:</strong> Las excepciones tienen prioridad sobre el horario base. 
            Los clientes verán estos horarios al reservar.
          </AlertDescription>
        </Alert>
      </CardContent>

      <ScheduleExceptionDialog
        exception={editingException}
        open={showDialog}
        onSave={handleSaveException}
        onClose={handleCloseDialog}
      />
    </Card>
  )
}

export default ScheduleExceptionsManager