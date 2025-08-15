// src/components/forms/client-search.js
'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, User } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { clientService } from '../../lib/firebase-services'

/**
 * Componente de búsqueda de clientes con autocompletado
 * Permite buscar clientes existentes o crear uno nuevo
 */
export function ClientSearch({ onSelectClient, selectedClient, allowNew = false }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState('')

  // Efecto para búsqueda con debounce
  useEffect(() => {
    if (searchTerm.length < 2) {
      setClients([])
      setShowResults(false)
      return
    }

    const searchClients = async () => {
      setLoading(true)
      setError('')
      
      try {
        const results = await clientService.search(searchTerm)
        setClients(results)
        setShowResults(true)
      } catch (error) {
        console.error('Error searching clients:', error)
        setError('Error al buscar clientes')
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce: esperar 300ms después de que el usuario deje de escribir
    const debounceTimer = setTimeout(searchClients, 300)
    
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const handleSelectClient = (client) => {
    onSelectClient(client)
    setSearchTerm('')
    setShowResults(false)
  }

  const handleClearSelection = () => {
    onSelectClient(null)
    setSearchTerm('')
    setShowResults(false)
  }

  // Si ya hay un cliente seleccionado, mostrar su información
  if (selectedClient) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedClient.name}</p>
                <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Mostrar alertas médicas si las hay */}
              {(selectedClient.medicalInfo?.diabetes || 
                selectedClient.medicalInfo?.cancer || 
                selectedClient.medicalInfo?.tattoos) && (
                <Badge variant="outline" className="text-xs text-warning">
                  ⚠️ Info médica
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Cambiar
              </Button>
            </div>
          </div>
          
          {/* Información médica relevante */}
          {selectedClient.medicalInfo && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {selectedClient.medicalInfo.diabetes && (
                  <Badge variant="secondary" className="text-xs">Diabetes</Badge>
                )}
                {selectedClient.medicalInfo.cancer && (
                  <Badge variant="secondary" className="text-xs">Cáncer</Badge>
                )}
                {selectedClient.medicalInfo.tattoos && (
                  <Badge variant="secondary" className="text-xs">Tatuajes</Badge>
                )}
                {selectedClient.medicalInfo.allergies && (
                  <Badge variant="secondary" className="text-xs">Alergias</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      {/* Campo de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar cliente por nombre, teléfono o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mostrar error si lo hay */}
      {error && (
        <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </div>
      )}

      {/* Resultados de búsqueda */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-pulse">Buscando...</div>
              </div>
            ) : clients.length > 0 ? (
              <div className="divide-y divide-border">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="w-full p-3 text-left hover:bg-muted transition-colors focus:bg-muted focus:outline-none"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                          {client.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{client.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {client.phone} • {client.email}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        {client.medicalInfo?.diabetes && (
                          <Badge variant="outline" className="text-xs">D</Badge>
                        )}
                        {client.medicalInfo?.cancer && (
                          <Badge variant="outline" className="text-xs">C</Badge>
                        )}
                        {client.medicalInfo?.tattoos && (
                          <Badge variant="outline" className="text-xs">T</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-2">
                  No se encontraron clientes
                </p>
                {allowNew && searchTerm.length >= 2 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      // Aquí podrías abrir un modal para crear nuevo cliente
                      // o navegar a la página de creación
                      console.log('Crear nuevo cliente:', searchTerm)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear cliente "{searchTerm}"
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}