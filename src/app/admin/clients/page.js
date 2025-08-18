// src/app/admin/clients/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Eye, Calendar, Phone, Mail, AlertTriangle, ArrowLeft, Users, TrendingUp, Filter, X, MoreVertical } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../../components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { clientService, appointmentService } from '../../../lib/firebase-services'
import { formatDate } from '../../../lib/time-utils'

/**
 * Página de gestión de clientes
 * Lista, busca y gestiona todos los clientes de Dhermica - Optimizada para móvil
 */
export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientsWithAppointments, setClientsWithAppointments] = useState(new Map())
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm])

  const loadClients = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Cargando clientes...')
      
      let clientsData = []
      
      // Intentar obtener clientes con diferentes métodos
      try {
        // Si agregaste el método getAll en firebase-services.js
        if (typeof clientService.getAll === 'function') {
          clientsData = await clientService.getAll()
          console.log('✅ Clientes obtenidos con getAll():', clientsData.length)
        } else {
          // Usar search con un término amplio
          clientsData = await clientService.search('a')
          console.log('✅ Clientes obtenidos con search("a"):', clientsData.length)
        }
      } catch (searchError) {
        console.warn('⚠️ Error obteniendo clientes:', searchError)
        throw new Error('No se pudo obtener los clientes')
      }
      
      console.log('📊 Datos de clientes:', clientsData)
      setClients(clientsData || [])
      
      // Cargar número de citas por cliente
      if (clientsData && clientsData.length > 0) {
        console.log('🔄 Cargando citas para cada cliente...')
        const appointmentCounts = new Map()
        
        for (const client of clientsData) {
          try {
            const result = await appointmentService.getByClient(client.id)
            
            // Manejar diferentes formatos de respuesta
            let appointmentCount = 0
            if (Array.isArray(result)) {
              appointmentCount = result.length
            } else if (result && Array.isArray(result.appointments)) {
              appointmentCount = result.appointments.length
            } else if (typeof result === 'number') {
              appointmentCount = result
            }
            
            appointmentCounts.set(client.id, appointmentCount)
            console.log(`Cliente ${client.name}: ${appointmentCount} citas`)
            
          } catch (error) {
            console.error(`❌ Error loading appointments for client ${client.id}:`, error)
            appointmentCounts.set(client.id, 0)
          }
        }
        
        setClientsWithAppointments(appointmentCounts)
        console.log('✅ Citas cargadas para todos los clientes')
      }
      
    } catch (error) {
      console.error('❌ Error general al cargar clientes:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients || []

    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(client =>
        (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone || '').includes(searchTerm)
      )
    }

    setFilteredClients(filtered)
    console.log(`🔍 Filtrado: ${filtered.length} de ${clients.length} clientes`)
  }

  // ✅ FUNCIÓN MEJORADA - Evita NaN
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0
    
    try {
      const today = new Date()
      let birthDate
      
      // Manejar diferentes formatos de fecha
      if (dateOfBirth.toDate && typeof dateOfBirth.toDate === 'function') {
        // Timestamp de Firebase
        birthDate = dateOfBirth.toDate()
      } else if (dateOfBirth instanceof Date) {
        birthDate = dateOfBirth
      } else if (typeof dateOfBirth === 'string') {
        birthDate = new Date(dateOfBirth)
      } else {
        return 0
      }
      
      // Verificar que la fecha es válida
      if (isNaN(birthDate.getTime())) {
        return 0
      }
      
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      // Asegurar que el resultado es un número válido
      return age >= 0 ? age : 0
    } catch (error) {
      console.error('Error calculando edad:', error)
      return 0
    }
  }

  const hasMedicalInfo = (medicalInfo) => {
    if (!medicalInfo) return false
    return medicalInfo.diabetes || 
           medicalInfo.cancer || 
           medicalInfo.tattoos || 
           (medicalInfo.allergies && medicalInfo.allergies.trim()) || 
           (medicalInfo.medications && medicalInfo.medications.trim()) || 
           (medicalInfo.other && medicalInfo.other.trim())
  }

  const getMedicalBadges = (medicalInfo) => {
    const badges = []
    if (medicalInfo?.diabetes) badges.push('Diabetes')
    if (medicalInfo?.cancer) badges.push('Cáncer')
    if (medicalInfo?.tattoos) badges.push('Tatuajes')
    if (medicalInfo?.allergies && medicalInfo.allergies.trim()) badges.push('Alergias')
    if (medicalInfo?.medications && medicalInfo.medications.trim()) badges.push('Medicamentos')
    return badges
  }

  // ✅ CÁLCULOS MEJORADOS - Evitan NaN
  const safeArray = Array.from(clientsWithAppointments.values()).filter(count => typeof count === 'number' && !isNaN(count))
  const totalAppointments = safeArray.reduce((sum, count) => sum + count, 0)
  const clientsWithMedicalInfo = (clients || []).filter(client => hasMedicalInfo(client.medicalInfo)).length
  const averageAppointments = clients.length > 0 ? Math.round(totalAppointments / clients.length) : 0

  // ✅ FUNCIÓN AUXILIAR para mostrar números seguros
  const safeNumber = (value, fallback = 0) => {
    const num = Number(value)
    return isNaN(num) ? fallback : num
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-muted rounded w-1/2 sm:w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 sm:h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-muted-foreground">Cargando clientes...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-600 mb-4">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-medium">Error al cargar clientes</h3>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex space-x-3">
                <Button onClick={loadClients} variant="outline">
                  Intentar de nuevo
                </Button>
                <Button onClick={() => router.push('/admin/clients/new')}>
                  Crear nuevo cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - Mobile Optimized */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-0">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="px-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">Clientes</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Gestiona la base de clientes de Dhermica ({safeNumber(clients.length)} total)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Mobile Stats Button */}
              <Sheet open={showStats} onOpenChange={setShowStats}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:hidden">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[60vh]">
                  <SheetHeader>
                    <SheetTitle>Estadísticas de Clientes</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold">{safeNumber(clients.length)}</p>
                        <p className="text-xs text-muted-foreground">Total clientes</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Calendar className="h-6 w-6 text-success mx-auto mb-2" />
                        <p className="text-2xl font-bold">{safeNumber(totalAppointments)}</p>
                        <p className="text-xs text-muted-foreground">Total citas</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
                        <p className="text-2xl font-bold">{safeNumber(clientsWithMedicalInfo)}</p>
                        <p className="text-xs text-muted-foreground">Con info médica</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-6 w-6 text-accent mx-auto mb-2" />
                        <p className="text-2xl font-bold">{safeNumber(averageAppointments)}</p>
                        <p className="text-xs text-muted-foreground">Citas promedio</p>
                      </CardContent>
                    </Card>
                  </div>
                </SheetContent>
              </Sheet>

              <Button 
                onClick={() => router.push('/admin/clients/new')}
                size="sm"
                className="px-3 sm:px-4"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-4 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Desktop Search */}
          <Card className="hidden sm:block">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Desktop Statistics */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{safeNumber(clients.length)}</p>
                    <p className="text-xs text-muted-foreground">Total clientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{safeNumber(totalAppointments)}</p>
                    <p className="text-xs text-muted-foreground">Total citas realizadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{safeNumber(clientsWithMedicalInfo)}</p>
                    <p className="text-xs text-muted-foreground">Con info médica</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">{safeNumber(averageAppointments)}</p>
                    <p className="text-xs text-muted-foreground">Citas promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Stats Summary */}
          <div className="sm:hidden">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{safeNumber(clients.length)}</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{safeNumber(filteredClients.length)}</p>
                      <p className="text-xs text-muted-foreground">Mostrados</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowStats(true)}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver más
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de clientes */}
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredClients.map((client) => {
                const age = calculateAge(client.dateOfBirth)
                const appointmentCount = clientsWithAppointments.get(client.id) || 0
                
                return (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Avatar className="h-10 sm:h-12 w-10 sm:w-12 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">
                              {(client.name || 'Sin Nombre').split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg truncate">
                              {client.name || 'Sin nombre'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {age > 0 ? `${age} años` : 'Edad no disponible'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {hasMedicalInfo(client.medicalInfo) && (
                            <Badge variant="outline" className="text-warning border-warning text-xs">
                              <AlertTriangle className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Médica</span>
                            </Badge>
                          )}
                          
                          {/* Mobile Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="sm:hidden px-2">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin/clients/${client.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/clients/editar/${client.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/appointments/new?clientId=${client.id}`)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Nueva cita
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 sm:space-y-4">
                      {/* Información de contacto */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{client.email || 'Sin email'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{client.phone || 'Sin teléfono'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>
                            {safeNumber(appointmentCount)} citas realizadas
                          </span>
                        </div>
                      </div>
                      
                      {/* Información médica */}
                      {hasMedicalInfo(client.medicalInfo) && (
                        <div>
                          <p className="text-sm font-medium mb-2">Información Médica</p>
                          <div className="flex flex-wrap gap-1">
                            {getMedicalBadges(client.medicalInfo).slice(0, 2).map((badge) => (
                              <Badge key={badge} variant="outline" className="text-xs text-warning border-warning">
                                {badge}
                              </Badge>
                            ))}
                            {getMedicalBadges(client.medicalInfo).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{getMedicalBadges(client.medicalInfo).length - 2} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Fecha de registro */}
                      <div className="text-xs text-muted-foreground">
                        Cliente desde: {
                          client.createdAt?.toDate ? 
                            formatDate(client.createdAt.toDate(), 'dd/MM/yyyy') : 
                            'Fecha no disponible'
                        }
                      </div>
                      
                      {/* Desktop Actions */}
                      <div className="hidden sm:flex items-center justify-between pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/clients/editar/${client.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/appointments/new?clientId=${client.id}`)}
                            className="text-primary hover:text-primary"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Mobile Quick Actions */}
                      <div className="sm:hidden flex space-x-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/appointments/new?clientId=${client.id}`)}
                          className="flex-1 text-primary hover:text-primary"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Cita
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <Users className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No se encontraron clientes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Prueba ajustando el término de búsqueda'
                    : 'Comienza agregando tu primer cliente'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => router.push('/admin/clients/new')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Cliente
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}