// src/app/admin/professionals/editar/[id]/page.js
'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  User, 
  Clock, 
  Star, 
  Plus, 
  X, 
  Loader2, 
  CheckCircle, 
  Eye, 
  Save,
  Camera,
  Upload,
  Copy,
  Filter
} from 'lucide-react'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../../../components/ui/form'
import { Input } from '../../../../../components/ui/input'
import { Textarea } from '../../../../../components/ui/textarea'
import { Switch } from '../../../../../components/ui/switch'
import { Badge } from '../../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Skeleton } from '../../../../../components/ui/skeleton'
import { professionalService, photoService, scheduleService } from '../../../../../lib/firebase-services'
import { toast } from 'sonner'
import * as z from 'zod'

// 🔥 IMPORTAR NUEVA ESTRUCTURA DE TRATAMIENTOS
import { AVAILABLE_TREATMENTS } from '../../../../../constants/treatments'

// Schema de validación actualizado
const professionalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  available: z.boolean(),
  acceptsOnlineBooking: z.boolean(),
  advanceBookingDays: z.number().min(1).max(365),
  availableTreatments: z.array(z.object({
    treatmentId: z.string(),
    name: z.string(),
    genderSpecific: z.string().optional(),
    certified: z.boolean(),
    experience: z.string().optional(),
    notes: z.string().optional()
  })).min(1, 'Selecciona al menos un tratamiento'),
  baseSchedule: z.object({
    monday: z.object({
      active: z.boolean(),
      blocks: z.array(z.any())
    }),
    tuesday: z.object({
      active: z.boolean(),
      blocks: z.array(z.any())
    }),
    wednesday: z.object({
      active: z.boolean(),
      blocks: z.array(z.any())
    }),
    thursday: z.object({
      active: z.boolean(),
      blocks: z.array(z.any())
    }),
    friday: z.object({
      active: z.boolean(),
      blocks: z.array(z.any())
    }),
    saturday: z.object({
      active: z.boolean(),
      blocks: z.array(z.any())
    }),
    sunday: z.object({
      active: z.boolean(),
      blocks: z.array(z.any())
    })
  })
})

const generateBlockId = () => 'block_' + Math.random().toString(36).substr(2, 9)

export default function EditProfessionalPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [professional, setProfessional] = useState(null)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [genderFilter, setGenderFilter] = useState('all')
  const fileInputRef = useRef(null)

  // Unwrap params Promise
  const resolvedParams = use(params)
  const professionalId = resolvedParams.id

  const form = useForm({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: '',
      description: '',
      phone: '',
      email: '',
      available: true,
      acceptsOnlineBooking: true,
      advanceBookingDays: 30,
      availableTreatments: [],
      baseSchedule: {
        monday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
        tuesday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
        wednesday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
        thursday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
        friday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
        saturday: { active: false, blocks: [] },
        sunday: { active: false, blocks: [] }
      }
    }
  })

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
            genderSpecific: sub.genders[0],
            categoryName: category.name
          })
        } else if (sub.genders.length > 1) {
          // Si tiene múltiples géneros, crear una opción por cada género
          sub.genders.forEach(gender => {
            subcategoriesWithGender.push({
              ...sub,
              id: `${sub.id}_${gender}`,
              displayName: `${sub.name} (${gender === 'hombre' ? 'Hombre' : 'Mujer'})`,
              genderSpecific: gender,
              originalId: sub.id,
              categoryName: category.name
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

  // 🔥 FILTRAR TRATAMIENTOS POR GÉNERO
  const getFilteredTreatments = () => {
    const treatmentsWithGender = getTreatmentsWithGenderOptions()
    
    if (genderFilter === 'all') return treatmentsWithGender
    
    return treatmentsWithGender.map(category => ({
      ...category,
      subcategories: category.subcategories?.filter(sub => 
        sub.genderSpecific === genderFilter
      ) || []
    })).filter(category => 
      category.subcategories.length > 0
    )
  }

  useEffect(() => {
    loadProfessional()
  }, [professionalId])

  const loadProfessional = async () => {
    try {
      const professionalData = await professionalService.getById(professionalId)
      
      if (!professionalData) {
        toast.error('Profesional no encontrado')
        router.push('/admin/professionals')
        return
      }

      setProfessional(professionalData)
      
      // Configurar foto si existe
      if (professionalData.profilePhoto) {
        setProfilePhoto(professionalData.profilePhoto)
        setPhotoPreview(professionalData.profilePhoto.base64)
      }
      
      // Cargar datos en el formulario
      form.reset({
        name: professionalData.name || '',
        description: professionalData.description || '',
        phone: professionalData.phone || '',
        email: professionalData.email || '',
        available: professionalData.available !== false,
        acceptsOnlineBooking: professionalData.acceptsOnlineBooking !== false,
        advanceBookingDays: professionalData.advanceBookingDays || 30,
        availableTreatments: professionalData.availableTreatments || [],
        baseSchedule: professionalData.baseSchedule || {
          monday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
          tuesday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
          wednesday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
          thursday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
          friday: { active: true, blocks: [{ id: generateBlockId(), start: '09:00', end: '18:00', type: 'work' }] },
          saturday: { active: false, blocks: [] },
          sunday: { active: false, blocks: [] }
        }
      })
      
    } catch (error) {
      console.error('Error loading professional:', error)
      toast.error('Error al cargar el profesional')
      router.push('/admin/professionals')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      // Validar horarios
      const scheduleErrors = scheduleService.validateSchedule(data.baseSchedule)
      if (scheduleErrors.length > 0) {
        toast.error('Errores en horarios:\n' + scheduleErrors.join('\n'))
        return
      }

      // Preparar datos para guardar
      const updateData = {
        ...data,
        profilePhoto: profilePhoto,
        updatedAt: new Date()
      }

      await professionalService.update(professionalId, updateData)
      
      toast.success('Profesional actualizado exitosamente')
      router.push(`/admin/professionals/${professionalId}`)
      
    } catch (error) {
      console.error('Error updating professional:', error)
      toast.error('Error al actualizar el profesional')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result
          
          // Validar la foto
          const photoData = {
            base64: base64,
            mimeType: file.type,
            size: file.size
          }
          
          photoService.validatePhoto(photoData)
          
          // Comprimir si es necesario
          let finalBase64 = base64
          if (file.size > 100 * 1024) { // Si es mayor a 100KB, comprimir
            finalBase64 = await photoService.compressBase64Image(base64, 400, 0.8)
          }
          
          const finalPhotoData = {
            base64: finalBase64,
            mimeType: file.type,
            size: photoService.getBase64Size(finalBase64),
            uploadedAt: new Date()
          }
          
          setProfilePhoto(finalPhotoData)
          setPhotoPreview(finalBase64)
          
        } catch (error) {
          toast.error(error.message)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const removePhoto = () => {
    setProfilePhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addTreatment = (treatment) => {
    const currentTreatments = form.getValues('availableTreatments')
    if (!currentTreatments.find(t => t.treatmentId === treatment.id)) {
      form.setValue('availableTreatments', [...currentTreatments, {
        treatmentId: treatment.id,
        name: treatment.displayName,
        genderSpecific: treatment.genderSpecific,
        certified: true,
        experience: '',
        notes: ''
      }])
    }
  }

  const removeTreatment = (treatmentId) => {
    const currentTreatments = form.getValues('availableTreatments')
    form.setValue('availableTreatments', currentTreatments.filter(t => t.treatmentId !== treatmentId))
  }

  const addScheduleBlock = (day) => {
    const currentBlocks = form.getValues(`baseSchedule.${day}.blocks`)
    form.setValue(`baseSchedule.${day}.blocks`, [...currentBlocks, {
      id: generateBlockId(),
      start: '09:00',
      end: '18:00',
      type: 'work'
    }])
  }

  const removeScheduleBlock = (day, blockId) => {
    const currentBlocks = form.getValues(`baseSchedule.${day}.blocks`)
    form.setValue(`baseSchedule.${day}.blocks`, currentBlocks.filter(b => b.id !== blockId))
  }

  const copyScheduleToAllDays = (sourceDay) => {
    const sourceSchedule = form.getValues(`baseSchedule.${sourceDay}`)
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    days.forEach(day => {
      if (day !== sourceDay) {
        form.setValue(`baseSchedule.${day}`, {
          active: sourceSchedule.active,
          blocks: sourceSchedule.blocks.map(block => ({
            ...block,
            id: generateBlockId()
          }))
        })
      }
    })
    
    toast.success('Horario copiado a todos los días')
  }

  const availableTreatments = form.watch('availableTreatments')
  const baseSchedule = form.watch('baseSchedule')
  const isAvailable = form.watch('available')

  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes', 
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  const activeDays = Object.keys(baseSchedule).filter(day => baseSchedule[day]?.active).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!professional) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/professionals')}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Editar Profesional
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Modifica la información de "{professional.name}"
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/professionals/${professionalId}`)}
              disabled={saving}
            >
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ver</span>
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Información básica con foto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Básica</span>
                </CardTitle>
                <CardDescription>
                  Datos principales del profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Foto de perfil */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {photoPreview ? (
                        <AvatarImage src={photoPreview} alt="Preview" />
                      ) : (
                        <AvatarFallback className="bg-muted">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {photoPreview && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removePhoto}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {photoPreview ? 'Cambiar Foto' : 'Subir Foto'}
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG o WebP. Máximo 200KB.
                  </p>
                </div>

                {/* Campos básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Dr. Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: +54 9 11 1234-5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="profesional@email.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="advanceBookingDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Días de anticipación para reservar</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="365" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción Profesional</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe la experiencia y especialización del profesional..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Configuraciones */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {isAvailable ? 'Profesional Disponible' : 'Profesional No Disponible'}
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {isAvailable 
                              ? 'El profesional aparece en la lista para agendar citas'
                              : 'El profesional no aparecerá disponible para nuevas citas'
                            }
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptsOnlineBooking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Acepta Reservas Online</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Los clientes pueden reservar citas directamente
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 🔥 TRATAMIENTOS ACTUALIZADOS CON GÉNEROS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Tratamientos Disponibles</span>
                </CardTitle>
                <CardDescription>
                  Modifica los tratamientos específicos que ofrece este profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Filtro por género */}
                <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtrar por:</span>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="w-32 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="text-sm">Todos</span>
                      </SelectItem>
                      <SelectItem value="hombre">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-1">H</Badge>
                          <span className="text-sm">Hombre</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="mujer">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs px-1">M</Badge>
                          <span className="text-sm">Mujer</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de tratamientos */}
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {getFilteredTreatments().map((category) => (
                    <div key={category.id} className="space-y-2">
                      <h4 className="text-sm font-semibold text-primary border-b pb-1">
                        {category.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-2">
                        {category.subcategories?.map((treatment) => {
                          const isSelected = availableTreatments.find(t => t.treatmentId === treatment.id)
                          return (
                            <Button
                              key={treatment.id}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  removeTreatment(treatment.id)
                                } else {
                                  addTreatment(treatment)
                                }
                              }}
                              className="justify-start h-auto p-2 flex-col items-start"
                            >
                              <div className="flex items-center space-x-2 w-full">
                                {isSelected && <CheckCircle className="h-3 w-3" />}
                                <span className="text-xs font-medium">{treatment.displayName}</span>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs px-1 py-0 ml-auto ${
                                    treatment.genderSpecific === 'hombre' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-pink-100 text-pink-700'
                                  }`}
                                >
                                  {treatment.genderSpecific === 'hombre' ? 'H' : 'M'}
                                </Badge>
                              </div>
                              {treatment.description && (
                                <span className="text-xs text-muted-foreground text-left mt-1">
                                  {treatment.description}
                                </span>
                              )}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tratamientos seleccionados */}
                {availableTreatments.length > 0 && (
                  <div>
                    <FormLabel className="text-base font-medium mb-3 block">
                      Tratamientos Configurados ({availableTreatments.length})
                    </FormLabel>
                    <div className="space-y-3">
                      {availableTreatments.map((treatment, index) => (
                        <Card key={treatment.treatmentId} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{treatment.name}</h4>
                              {treatment.genderSpecific && (
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs px-1 py-0 ${
                                    treatment.genderSpecific === 'hombre' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-pink-100 text-pink-700'
                                  }`}
                                >
                                  {treatment.genderSpecific === 'hombre' ? 'H' : 'M'}
                                </Badge>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTreatment(treatment.treatmentId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <FormField
                                control={form.control}
                                name={`availableTreatments.${index}.certified`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm">Certificado</FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`availableTreatments.${index}.experience`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Experiencia</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ej: 5 años" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`availableTreatments.${index}.notes`}
                            render={({ field }) => (
                              <FormItem className="mt-3">
                                <FormLabel className="text-sm">Notas especiales</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Ej: Especialización en pieles sensibles"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {availableTreatments.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Selecciona al menos un tratamiento para que el profesional pueda aparecer en las reservas.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Horarios de trabajo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Horarios de Trabajo</span>
                </CardTitle>
                <CardDescription>
                  Configura horarios con bloques flexibles y pausas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {Object.entries(dayNames).map(([dayKey, dayName]) => {
                  const daySchedule = baseSchedule[dayKey]
                  const workBlocks = daySchedule?.blocks?.filter(b => b.type === 'work') || []
                  const breakBlocks = daySchedule?.blocks?.filter(b => b.type !== 'work') || []
                  
                  return (
                    <Card key={dayKey} className={daySchedule?.active ? 'border-primary/20' : 'border-muted'}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <FormField
                            control={form.control}
                            name={`baseSchedule.${dayKey}.active`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-base font-medium">
                                  {dayName}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          {daySchedule?.active && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyScheduleToAllDays(dayKey)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar a todos
                            </Button>
                          )}
                        </div>

                        {daySchedule?.active && (
                          <div className="space-y-4">
                            
                            {/* Bloques de trabajo */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-green-700">
                                  Horarios de Trabajo ({workBlocks.length})
                                </h5>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addScheduleBlock(dayKey)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Agregar
                                </Button>
                              </div>
                              
                              {workBlocks.map((block, blockIndex) => {
                                const realIndex = daySchedule.blocks.findIndex(b => b.id === block.id)
                                return (
                                  <div key={block.id} className="flex items-center space-x-2 p-2 bg-green-50 rounded border">
                                    <FormField
                                      control={form.control}
                                      name={`baseSchedule.${dayKey}.blocks.${realIndex}.start`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input type="time" {...field} />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <FormField
                                      control={form.control}
                                      name={`baseSchedule.${dayKey}.blocks.${realIndex}.end`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input type="time" {...field} />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeScheduleBlock(dayKey, block.id)}
                                      className="text-destructive hover:text-destructive"
                                      disabled={workBlocks.length === 1}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Agregar pausas */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-orange-700">
                                  Pausas y Descansos ({breakBlocks.length})
                                </h5>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentBlocks = form.getValues(`baseSchedule.${dayKey}.blocks`)
                                    const newBreak = {
                                      id: generateBlockId(),
                                      start: '12:00',
                                      end: '13:00',
                                      type: 'lunch',
                                      description: 'Almuerzo'
                                    }
                                    form.setValue(`baseSchedule.${dayKey}.blocks`, [...currentBlocks, newBreak])
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Pausa
                                </Button>
                              </div>
                              
                              {breakBlocks.map((block) => {
                                const realIndex = daySchedule.blocks.findIndex(b => b.id === block.id)
                                return (
                                  <div key={block.id} className="space-y-2 p-2 bg-orange-50 rounded border">
                                    <div className="flex items-center space-x-2">
                                      <FormField
                                        control={form.control}
                                        name={`baseSchedule.${dayKey}.blocks.${realIndex}.start`}
                                        render={({ field }) => (
                                          <FormItem className="flex-1">
                                            <FormControl>
                                              <Input type="time" {...field} />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                      <span className="text-muted-foreground">-</span>
                                      <FormField
                                        control={form.control}
                                        name={`baseSchedule.${dayKey}.blocks.${realIndex}.end`}
                                        render={({ field }) => (
                                          <FormItem className="flex-1">
                                            <FormControl>
                                              <Input type="time" {...field} />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name={`baseSchedule.${dayKey}.blocks.${realIndex}.type`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                              <FormControl>
                                                <SelectTrigger className="w-24">
                                                  <SelectValue />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                <SelectItem value="lunch">Almuerzo</SelectItem>
                                                <SelectItem value="break">Pausa</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </FormItem>
                                        )}
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeScheduleBlock(dayKey, block.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <FormField
                                      control={form.control}
                                      name={`baseSchedule.${dayKey}.blocks.${realIndex}.description`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input 
                                              placeholder="Descripción de la pausa..."
                                              {...field}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                )
                              })}
                            </div>

                            {/* Resumen del día */}
                            {workBlocks.length > 0 && (
                              <div className="pt-2 border-t text-xs text-muted-foreground">
                                <strong>Resumen:</strong> {workBlocks.length} bloque(s) de trabajo
                                {breakBlocks.length > 0 && `, ${breakBlocks.length} pausa(s)`}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Resumen general de horarios */}
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Resumen:</strong> {activeDays} {activeDays === 1 ? 'día' : 'días'} laborales configurados.
                    {activeDays === 0 && (
                      <span className="text-destructive ml-2">
                        ⚠️ Debes activar al menos un día para que el profesional pueda recibir citas.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Información del sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
                <CardDescription>
                  Datos automáticos del profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Registrado el:</p>
                    <p className="font-medium">
                      {professional.createdAt?.toDate?.()?.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última actualización:</p>
                    <p className="font-medium">
                      {professional.updatedAt?.toDate?.()?.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || 'No disponible'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/professionals/${professionalId}`)}
                    disabled={saving}
                    className="order-2 sm:order-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving || availableTreatments.length === 0 || activeDays === 0}
                    className="order-1 sm:order-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Actualizar Profesional
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}