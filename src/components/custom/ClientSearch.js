// src/components/custom/ClientSearch.js
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, User, AlertTriangle, Phone, Mail, Calendar, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'
import { clientService } from '../../lib/firebase-services'
import { formatDate } from '../../lib/time-utils'

/**
 * Componente de búsqueda de clientes con debounce y autocompletado
 * Características:
 * - Búsqueda con debounce (500ms)
 * - Visualización de información médica
 * - Opción de crear nuevo cliente
 * - Mobile-first design
 */
export function ClientSearch({ 
  onSelectClient, 
  allowNew = true,
  placeholder = "Buscar cliente por nombre, email o teléfono...",
  selectedClient = null 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState(null)

  // Función de búsqueda con debounce
  const searchClients = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setClients([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setError('')

    try {
      console.log('Buscando clientes con término:', term)
      const results = await clientService.search(term)
      console.log('Resultados encontrados:', results.length)
      
      setClients(results)
      setShowResults(true)
    } catch (error) {
      console.error('Error searching clients:', error)
      setError('Error al buscar clientes')
      setClients([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Manejar cambio en el input con debounce
  const handleSearchChange = (value) => {
    setSearchTerm(value)

    // Limpiar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Configurar nuevo timer
    const newTimer = setTimeout(() => {
      searchClients(value)
    }, 500) // 500ms de debounce

    setDebounceTimer(newTimer)
  }

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  // Seleccionar cliente
  const handleSelectClient = (client) => {
    console.log('Cliente seleccionado:', client)
    setSearchTerm(client.name)
    setShowResults(false)
    onSelectClient(client)
  }

  // Limpiar selección
  const handleClearSelection = () => {
    setSearchTerm('')
    setClients([])
    setShowResults(false)
    onSelectClient(null)
  }

  // Crear nuevo cliente
  const handleCreateNew = () => {
    console.log('Crear nuevo cliente con término:', searchTerm)
    // TODO: Abrir modal o navegar a formulario de nuevo cliente
    // Por ahora, creamos un cliente temporal para demostrar
    const newClient = {
      id: 'new',
      name: searchTerm,
      email: '',
      phone: '',
      isNew: true
    }
    onSelectClient(newClient)
    setShowResults(false)
  }

  // Verificar restricciones médicas
  const getMedicalWarnings = (client) => {
    if (!client.medicalInfo) return []

    const warnings = []
    if (client.medicalInfo.diabetes) warnings.push('Diabetes')
    if (client.medicalInfo.cancer) warnings.push('Cáncer')
    if (client.medicalInfo.tattoos) warnings.push('Tatuajes')
    
    return warnings
  }

  // Obtener iniciales para avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Calcular edad
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    
    try {
      const birthDate = dateOfBirth.toDate ? dateOfBirth.toDate() : new Date(dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      return age
    } catch {
      return null
    }
  }

  return (
    <div className="relative w-full">
      
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
          onFocus={() => searchTerm && setShowResults(true)}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
        )}
        {searchTerm && !isSearching && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClearSelection}
          >
            ×
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {/* Cliente seleccionado */}
      {selectedClient && !showResults && (
        <Card className="mt-3 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {getInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">{selectedClient.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedClient.email || 'Sin email'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                Cambiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados de búsqueda */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            
            {/* Loading state */}
            {isSearching && (
              <div className="p-4">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {!isSearching && clients.length === 0 && searchTerm.length >= 2 && (
              <div className="p-4 text-center">
                <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  No se encontraron clientes con "{searchTerm}"
                </p>
                {allowNew && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCreateNew}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear cliente "{searchTerm}"
                  </Button>
                )}
              </div>
            )}

            {/* Results list */}
            {!isSearching && clients.length > 0 && (
              <div className="py-2">
                {clients.map((client) => {
                  const medicalWarnings = getMedicalWarnings(client)
                  const age = calculateAge(client.dateOfBirth)

                  return (
                    <div
                      key={client.id}
                      className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0"
                      onClick={() => handleSelectClient(client)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium truncate">{client.name}</h4>
                          {age && (
                            <Badge variant="secondary" className="text-xs">
                              {age} años
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Advertencias médicas */}
                        {medicalWarnings.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <div className="flex flex-wrap gap-1">
                              {medicalWarnings.map((warning) => (
                                <Badge 
                                  key={warning} 
                                  variant="outline" 
                                  className="text-xs text-orange-700 border-orange-200"
                                >
                                  {warning}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Opción de crear nuevo cliente */}
                {allowNew && searchTerm && (
                  <div className="p-3 border-t border-border/50">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCreateNew}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear nuevo cliente "{searchTerm}"
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Versión compacta del componente para espacios reducidos
 */
export function ClientSearchCompact({ onSelectClient, selectedClient }) {
  return (
    <ClientSearch
      onSelectClient={onSelectClient}
      selectedClient={selectedClient}
      placeholder="Buscar cliente..."
      allowNew={false}
    />
  )
}