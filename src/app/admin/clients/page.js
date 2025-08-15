// src/app/admin/clients/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Eye, Calendar, Phone, Mail, AlertTriangle, ArrowLeft, Users, TrendingUp } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { clientService, appointmentService } from '../../../lib/firebase-services'
import { formatDate } from '../../../lib/time-utils'

/**
 * Página de gestión de clientes
 * Lista, busca y gestiona todos los clientes de Dhermica
 */
export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientsWithAppointments, setClientsWithAppointments] = useState(new Map())

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm])

  const loadClients = async () => {
    setLoading(true)
    try {
      const clientsData = await clientService.search('')
      setClients(clientsData)
      
      // Cargar número de citas por cliente
      const appointmentCounts = new Map()
      for (const client of clientsData) {
        try {
          const appointments = await appointmentService.getByClient(client.id)
          appointmentCounts.set(client.id, appointments.length)
        } catch (error) {
          console.error(`Error loading appointments for client ${client.id}:`, error)
          appointmentCounts.set(client.id, 0)
        }
      }
      setClientsWithAppointments(appointmentCounts)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      )
    }

    setFilteredClients(filtered)
  }

  const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const hasMedicalInfo = (medicalInfo) => {
    if (!medicalInfo) return false
    return medicalInfo.diabetes || 
           medicalInfo.cancer || 
           medicalInfo.tattoos || 
           medicalInfo.allergies || 
           medicalInfo.medications || 
           medicalInfo.other
  }

  const getMedicalBadges = (medicalInfo) => {
    const badges = []
    if (medicalInfo?.diabetes) badges.push('Diabetes')
    if (medicalInfo?.cancer) badges.push('Cáncer')
    if (medicalInfo?.tattoos) badges.push('Tatuajes')
    if (medicalInfo?.allergies) badges.push('Alergias')
    if (medicalInfo?.medications) badges.push('Medicamentos')
    return badges
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
              <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
              <p className="text-muted-foreground">
                Gestiona la base de clientes de Dhermica
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/clients/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Búsqueda */}
        <Card>
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{clients.length}</p>
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
                  <p className="text-2xl font-bold">
                    {Array.from(clientsWithAppointments.values()).reduce((sum, count) => sum + count, 0)}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {clients.filter(client => hasMedicalInfo(client.medicalInfo)).length}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {Math.round(Array.from(clientsWithAppointments.values()).reduce((sum, count) => sum + count, 0) / clients.length) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Citas promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de clientes */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {calculateAge(client.dateOfBirth)} años
                        </p>
                      </div>
                    </div>
                    {hasMedicalInfo(client.medicalInfo) && (
                      <Badge variant="outline" className="text-warning border-warning">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Médica
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Información de contacto */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {clientsWithAppointments.get(client.id) || 0} citas realizadas
                      </span>
                    </div>
                  </div>
                  
                  {/* Información médica */}
                  {hasMedicalInfo(client.medicalInfo) && (
                    <div>
                      <p className="text-sm font-medium mb-2">Información Médica</p>
                      <div className="flex flex-wrap gap-1">
                        {getMedicalBadges(client.medicalInfo).slice(0, 3).map((badge) => (
                          <Badge key={badge} variant="outline" className="text-xs text-warning border-warning">
                            {badge}
                          </Badge>
                        ))}
                        {getMedicalBadges(client.medicalInfo).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{getMedicalBadges(client.medicalInfo).length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Fecha de registro */}
                  <div className="text-xs text-muted-foreground">
                    Cliente desde: {formatDate(client.createdAt?.toDate() || new Date(), 'dd/MM/yyyy')}
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
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
                        onClick={() => router.push(`/admin/clients/${client.id}/edit`)}
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron clientes</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Prueba ajustando el término de búsqueda'
                  : 'Comienza agregando tu primer cliente'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => router.push('/admin/clients/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Cliente
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}