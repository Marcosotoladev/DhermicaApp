// src/components/ui/birth-date-picker.jsx
'use client'

import { useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calendar } from './calendar'
import { formatDate } from '../../lib/time-utils'

/**
 * Componente de selector de fecha de nacimiento mejorado
 * Permite navegación rápida por años y entrada manual
 */
export function BirthDatePicker({ value, onChange, placeholder = "Selecciona tu fecha de nacimiento" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [manualDate, setManualDate] = useState('')
  const [selectedYear, setSelectedYear] = useState(value?.getFullYear() || new Date().getFullYear() - 25)
  const [selectedMonth, setSelectedMonth] = useState(value?.getMonth() || 0)

  // Generar años (desde 1924 hasta año actual)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1924 + 1 }, (_, i) => currentYear - i)
  
  // Meses
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  // Manejar entrada manual de fecha
  const handleManualDateChange = (e) => {
    const inputValue = e.target.value
    setManualDate(inputValue)

    // Intentar parsear la fecha cuando tenga formato completo
    if (inputValue.length === 10) { // DD/MM/AAAA
      const [day, month, year] = inputValue.split('/')
      const parsedDate = new Date(year, month - 1, day)
      
      // Validar que la fecha sea válida
      if (
        parsedDate.getDate() == day &&
        parsedDate.getMonth() == month - 1 &&
        parsedDate.getFullYear() == year &&
        parsedDate <= new Date() &&
        parsedDate >= new Date(1924, 0, 1)
      ) {
        // ✅ Verificar que onChange existe antes de llamarla
        if (onChange && typeof onChange === 'function') {
          onChange(parsedDate)
          setIsOpen(false)
          setManualDate('')
        }
      }
    }
  }

  // Manejar cambio de año
  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year))
  }

  // Manejar cambio de mes
  const handleMonthChange = (month) => {
    setSelectedMonth(parseInt(month))
  }

  // Formatear entrada manual mientras escribe
  const formatManualInput = (value) => {
    // Remover todo lo que no sea número
    const numbers = value.replace(/\D/g, '')
    
    // Formatear como DD/MM/AAAA
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  const handleManualInputChange = (e) => {
    const formatted = formatManualInput(e.target.value)
    setManualDate(formatted)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full pl-3 text-left font-normal"
        >
          {value ? (
            formatDate(value)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          
          {/* Entrada manual */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Entrada rápida</label>
            <Input
              placeholder="DD/MM/AAAA"
              value={manualDate}
              onChange={handleManualInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualDateChange(e)
                }
              }}
              maxLength={10}
              className="text-center"
            />
            <p className="text-xs text-muted-foreground text-center">
              Escribe tu fecha de nacimiento
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">O selecciona en el calendario</p>
            
            {/* Selectores de año y mes */}
            <div className="flex gap-2 mb-4">
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-40">
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendario con año y mes preseleccionados */}
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                // ✅ Verificar que date y onChange existen antes de llamarla
                if (date && onChange && typeof onChange === 'function') {
                  onChange(date)
                  setIsOpen(false)
                }
              }}
              month={new Date(selectedYear, selectedMonth)}
              onMonthChange={(date) => {
                setSelectedYear(date.getFullYear())
                setSelectedMonth(date.getMonth())
              }}
              disabled={(date) =>
                date > new Date() || date < new Date(1924, 0, 1)
              }
              initialFocus
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}