// src/components/custom/PWAInstallPrompt.js

'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

/**
 * Componente para mostrar prompt de instalación PWA
 * Se muestra cuando la app es instalable y el usuario no la ha instalado
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar si ya está instalada
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Verificar localStorage para prompt descartado
    const promptDismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (promptDismissed) {
      return
    }

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    // Escuchar evento de instalación exitosa
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Mostrar prompt de instalación
    deferredPrompt.prompt()

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA instalada exitosamente')
    } else {
      console.log('Usuario rechazó la instalación')
    }

    // Limpiar el prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // No mostrar si ya está instalada o no hay prompt
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Instalar App</CardTitle>
                <CardDescription className="text-xs">
                  Acceso rápido desde tu escritorio
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Instala DHérmica para acceso más rápido y una mejor experiencia, 
            incluso sin conexión a internet.
          </p>
          <div className="flex space-x-2">
            <Button 
              onClick={handleInstall} 
              size="sm" 
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar
            </Button>
            <Button 
              onClick={handleDismiss} 
              variant="outline" 
              size="sm"
            >
              Más tarde
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook para detectar si la app está instalada como PWA
 */
export function useIsInstalled() {
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const checkIfInstalled = () => {
      // Método 1: display-mode standalone
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        return true
      }

      // Método 2: navigator.standalone (iOS)
      if (window.navigator.standalone === true) {
        return true
      }

      // Método 3: document.referrer (Android)
      if (document.referrer.includes('android-app://')) {
        return true
      }

      return false
    }

    setIsInstalled(checkIfInstalled())
  }, [])

  return isInstalled
}

/**
 * Hook para obtener información sobre capacidades PWA
 */
export function usePWACapabilities() {
  const [capabilities, setCapabilities] = useState({
    canInstall: false,
    isOfflineCapable: false,
    hasNotifications: false,
    hasServiceWorker: false
  })

  useEffect(() => {
    const checkCapabilities = () => {
      const caps = {
        canInstall: 'beforeinstallprompt' in window,
        isOfflineCapable: 'serviceWorker' in navigator,
        hasNotifications: 'Notification' in window,
        hasServiceWorker: 'serviceWorker' in navigator && navigator.serviceWorker.controller
      }
      setCapabilities(caps)
    }

    checkCapabilities()

    // Verificar service worker después de un momento
    setTimeout(checkCapabilities, 1000)
  }, [])

  return capabilities
}