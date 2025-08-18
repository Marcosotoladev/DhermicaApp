'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Heart, Stethoscope, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { medicalValidationService } from '../../lib/firebase-services-optimized'

/**
 * Componente para mostrar alertas médicas y validaciones
 */
export function MedicalValidation({ 
  clientId, 
  treatmentId, 
  onValidationChange,
  className = "" 
}) {
  const [validation, setValidation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (clientId && treatmentId) {
      validateMedical()
    } else {
      setValidation(null)
      onValidationChange?.(null)
    }
  }, [clientId, treatmentId])

  const validateMedical = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await medicalValidationService.validateClientTreatment(clientId, treatmentId)
      setValidation(result)
      onValidationChange?.(result)
    } catch (error) {
      console.error('Error validating medical restrictions:', error)
      setError('Error al validar restricciones médicas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Validando restricciones médicas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={validateMedical}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!validation) {
    return null
  }

  const { isValid, warnings, client, treatment } = validation

  if (isValid && warnings.length === 0) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              ✅ No hay restricciones médicas para este tratamiento
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-orange-100 rounded">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-base text-orange-800">
              Advertencias Médicas
            </CardTitle>
            <CardDescription className="text-orange-700">
              Revisar antes de confirmar la cita
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Información del cliente y tratamiento */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div>
            <span className="text-orange-600 font-medium">Cliente:</span>
            <p className="text-orange-800">{client?.name}</p>
          </div>
          <div>
            <span className="text-orange-600 font-medium">Tratamiento:</span>
            <p className="text-orange-800">{treatment?.name}</p>
          </div>
        </div>

        <Separator className="my-3 bg-orange-200" />

        {/* Lista de advertencias */}
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="mt-0.5">
                <div className="h-1.5 w-1.5 bg-orange-600 rounded-full" />
              </div>
              <span className="text-sm text-orange-800 leading-tight">
                {warning}
              </span>
            </div>
          ))}
        </div>

        {/* Información médica detallada si está disponible */}
        {client?.medicalInfo && (
          <>
            <Separator className="my-3 bg-orange-200" />
            <MedicalInfoSummary medicalInfo={client.medicalInfo} />
          </>
        )}

        {/* Acciones recomendadas */}
        <div className="mt-4 p-3 bg-orange-100 rounded-lg">
          <div className="flex items-center space-x-1 mb-2">
            <Stethoscope className="h-3 w-3 text-orange-600" />
            <span className="text-xs font-medium text-orange-800">
              Acciones Recomendadas:
            </span>
          </div>
          <ul className="text-xs text-orange-700 space-y-1">
            <li>• Verificar información médica actualizada</li>
            <li>• Consultar protocolo específico para estas condiciones</li>
            <li>• Considerar autorización médica si es necesario</li>
            <li>• Documentar decisión en notas de la cita</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Resumen de información médica del cliente
 */
function MedicalInfoSummary({ medicalInfo }) {
  const conditions = []

  if (medicalInfo.diabetes) conditions.push({ label: 'Diabetes', icon: '🩸', severity: 'high' })
  if (medicalInfo.cancer) conditions.push({ label: 'Cáncer', icon: '🎗️', severity: 'high' })
  if (medicalInfo.pregnancy) conditions.push({ label: 'Embarazo', icon: '🤱', severity: 'high' })
  if (medicalInfo.tattoos) conditions.push({ label: 'Tatuajes', icon: '🎨', severity: 'medium' })
  if (medicalInfo.allergies) conditions.push({ label: 'Alergias', icon: '🤧', severity: 'medium', detail: medicalInfo.allergies })
  if (medicalInfo.medications) conditions.push({ label: 'Medicamentos', icon: '💊', severity: 'medium', detail: medicalInfo.medications })

  if (conditions.length === 0) {
    return (
      <div className="text-xs text-orange-600 italic">
        No se registra información médica adicional
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center space-x-1 mb-2">
        <Heart className="h-3 w-3 text-orange-600" />
        <span className="text-xs font-medium text-orange-800">
          Información Médica:
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {conditions.map((condition, index) => (
          <Badge
            key={index}
            variant="outline"
            className={`text-xs ${
              condition.severity === 'high'
                ? 'border-red-300 text-red-700 bg-red-50'
                : 'border-orange-300 text-orange-700 bg-orange-50'
            }`}
          >
            <span className="mr-1">{condition.icon}</span>
            {condition.label}
            {condition.detail && (
              <span className="ml-1 text-xs opacity-75">
                ({condition.detail.slice(0, 20)}{condition.detail.length > 20 ? '...' : ''})
              </span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  )
}

/**
 * Componente compacto para mostrar estado de validación médica
 */
export function MedicalValidationBadge({ 
  clientId, 
  treatmentId, 
  onClick,
  className = "" 
}) {
  const [validation, setValidation] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (clientId && treatmentId) {
      validateMedical()
    }
  }, [clientId, treatmentId])

  const validateMedical = async () => {
    setLoading(true)
    try {
      const result = await medicalValidationService.validateClientTreatment(clientId, treatmentId)
      setValidation(result)
    } catch (error) {
      console.error('Error validating medical restrictions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Badge variant="outline" className={`animate-pulse ${className}`}>
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-spin mr-1"></div>
        Validando...
      </Badge>
    )
  }

  if (!validation) {
    return null
  }

  const { isValid, warnings } = validation

  if (isValid && warnings.length === 0) {
    return (
      <Badge 
        variant="outline" 
        className={`border-green-500 text-green-700 bg-green-50 cursor-pointer hover:bg-green-100 ${className}`}
        onClick={onClick}
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Sin restricciones
      </Badge>
    )
  }

  return (
    <Badge 
      variant="outline" 
      className={`border-orange-500 text-orange-700 bg-orange-50 cursor-pointer hover:bg-orange-100 ${className}`}
      onClick={onClick}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      {warnings.length} advertencia{warnings.length !== 1 ? 's' : ''}
    </Badge>
  )
}

/**
 * Hook para usar validaciones médicas en otros componentes
 */
export function useMedicalValidation(clientId, treatmentId) {
  const [validation, setValidation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validateMedical = async () => {
    if (!clientId || !treatmentId) {
      setValidation(null)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await medicalValidationService.validateClientTreatment(clientId, treatmentId)
      setValidation(result)
      return result
    } catch (err) {
      const errorMessage = 'Error al validar restricciones médicas'
      setError(errorMessage)
      console.error('Medical validation error:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    validateMedical()
  }, [clientId, treatmentId])

  return {
    validation,
    loading,
    error,
    refetch: validateMedical,
    isValid: validation?.isValid ?? true,
    warnings: validation?.warnings ?? [],
    hasWarnings: validation?.warnings?.length > 0
  }
}

/**
 * Componente para mostrar formulario de información médica
 */
export function MedicalInfoForm({ 
  initialData = {},
  onSave,
  loading = false,
  className = ""
}) {
  const [formData, setFormData] = useState({
    diabetes: false,
    cancer: false,
    pregnancy: false,
    tattoos: false,
    allergies: '',
    medications: '',
    other: '',
    ...initialData
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave?.(formData)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-red-500" />
          <span>Información Médica</span>
        </CardTitle>
        <CardDescription>
          Esta información es confidencial y se usa para garantizar la seguridad en los tratamientos
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Condiciones médicas */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Condiciones médicas:</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.diabetes}
                  onChange={(e) => handleChange('diabetes', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Diabetes</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cancer}
                  onChange={(e) => handleChange('cancer', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Cáncer (actual o pasado)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pregnancy}
                  onChange={(e) => handleChange('pregnancy', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Embarazo</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tattoos}
                  onChange={(e) => handleChange('tattoos', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Tatuajes</span>
              </label>
            </div>
          </div>

          <Separator />

          {/* Información adicional */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">
                Alergias conocidas:
              </label>
              <textarea
                value={formData.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
                placeholder="Describe cualquier alergia conocida..."
                className="w-full p-2 border rounded-md text-sm resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Medicamentos actuales:
              </label>
              <textarea
                value={formData.medications}
                onChange={(e) => handleChange('medications', e.target.value)}
                placeholder="Lista los medicamentos que tomas actualmente..."
                className="w-full p-2 border rounded-md text-sm resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Otra información relevante:
              </label>
              <textarea
                value={formData.other}
                onChange={(e) => handleChange('other', e.target.value)}
                placeholder="Cualquier otra información médica relevante..."
                className="w-full p-2 border rounded-md text-sm resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Aviso de privacidad */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Privacidad y Confidencialidad</p>
                <p>
                  Esta información médica es estrictamente confidencial y solo será utilizada 
                  por profesionales autorizados para garantizar tu seguridad durante los tratamientos.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Información'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}