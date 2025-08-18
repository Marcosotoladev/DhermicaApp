// src/lib/notification-service.js

'use client'

import { toast } from 'sonner'

/**
 * Servicio de notificaciones optimizado para DHérmica
 * Incluye notificaciones push, in-app y por email
 */

class NotificationService {
  constructor() {
    this.pushSubscription = null
    this.permission = 'default'
    this.isInitialized = false
  }

  /**
   * Inicializar el servicio de notificaciones
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      // Verificar soporte de notificaciones
      if (!('Notification' in window)) {
        console.warn('Browser does not support notifications')
        return
      }

      // Verificar soporte de Service Worker
      if (!('serviceWorker' in navigator)) {
        console.warn('Browser does not support service workers')
        return
      }

      this.permission = Notification.permission
      this.isInitialized = true

      console.log('Notification service initialized')
    } catch (error) {
      console.error('Error initializing notification service:', error)
    }
  }

  /**
   * Solicitar permisos para notificaciones push
   */
  async requestPermission() {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission

      if (permission === 'granted') {
        toast.success('Notificaciones activadas correctamente')
        await this.subscribeToPush()
      } else if (permission === 'denied') {
        toast.error('Notificaciones bloqueadas. Puedes activarlas desde la configuración del navegador.')
      }

      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast.error('Error al solicitar permisos de notificación')
      return 'denied'
    }
  }

  /**
   * Suscribirse a notificaciones push
   */
  async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Verificar si ya hay una suscripción
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Crear nueva suscripción
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_KEY)
        })
      }

      this.pushSubscription = subscription

      // Enviar suscripción al servidor
      await this.sendSubscriptionToServer(subscription)

      console.log('Push subscription successful')
      return subscription
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      toast.error('Error al configurar notificaciones push')
    }
  }

  /**
   * Enviar suscripción al servidor
   */
  async sendSubscriptionToServer(subscription) {
    try {
      // TODO: Implementar endpoint en el servidor
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: this.getCurrentUserId()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error)
    }
  }

  /**
   * Mostrar notificación in-app
   */
  showInAppNotification(type, message, options = {}) {
    const defaultOptions = {
      duration: 5000,
      position: 'top-right',
      dismissible: true
    }

    const finalOptions = { ...defaultOptions, ...options }

    switch (type) {
      case 'success':
        return toast.success(message, finalOptions)
      case 'error':
        return toast.error(message, finalOptions)
      case 'warning':
        return toast.warning(message, finalOptions)
      case 'info':
        return toast.info(message, finalOptions)
      default:
        return toast(message, finalOptions)
    }
  }

  /**
   * Mostrar notificación de cita creada
   */
  notifyAppointmentCreated(appointment) {
    const message = `✅ Cita creada: ${appointment.clientName} - ${appointment.treatmentName}`
    
    this.showInAppNotification('success', message, {
      duration: 6000,
      action: {
        label: 'Ver detalles',
        onClick: () => {
          // Navegar a los detalles de la cita
          window.location.href = `/admin/appointments/${appointment.id}`
        }
      }
    })

    // Notificación push si está disponible
    if (this.permission === 'granted') {
      this.showPushNotification({
        title: 'Nueva cita creada',
        body: `${appointment.clientName} - ${appointment.treatmentName}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: `appointment-${appointment.id}`,
        data: {
          type: 'appointment_created',
          appointmentId: appointment.id,
          url: `/admin/appointments/${appointment.id}`
        }
      })
    }
  }

  /**
   * Notificación de cita próxima (recordatorio)
   */
  notifyUpcomingAppointment(appointment, minutesUntil) {
    const timeLabel = minutesUntil < 60 
      ? `${minutesUntil} minutos`
      : `${Math.round(minutesUntil / 60)} horas`

    const message = `⏰ Próxima cita en ${timeLabel}: ${appointment.clientName}`
    
    this.showInAppNotification('info', message, {
      duration: 8000,
      action: {
        label: 'Ver agenda',
        onClick: () => {
          window.location.href = '/admin/dashboard'
        }
      }
    })

    if (this.permission === 'granted') {
      this.showPushNotification({
        title: 'Recordatorio de cita',
        body: `${appointment.clientName} en ${timeLabel} - ${appointment.treatmentName}`,
        icon: '/icons/icon-192x192.png',
        tag: `reminder-${appointment.id}`,
        requireInteraction: true,
        data: {
          type: 'appointment_reminder',
          appointmentId: appointment.id,
          url: `/admin/appointments/${appointment.id}`
        }
      })
    }
  }

  /**
   * Notificación de advertencia médica
   */
  notifyMedicalWarning(client, treatment, warnings) {
    const message = `⚠️ Advertencia médica: ${client.name} - ${treatment.name}`
    
    this.showInAppNotification('warning', message, {
      duration: 10000,
      description: warnings.join('. '),
      action: {
        label: 'Revisar',
        onClick: () => {
          // Abrir modal de información médica
          console.log('Open medical info modal')
        }
      }
    })
  }

  /**
   * Notificación de error de conexión
   */
  notifyConnectionError() {
    this.showInAppNotification('error', 'Sin conexión a internet', {
      duration: Infinity,
      description: 'Trabajando en modo offline. Los cambios se sincronizarán cuando se restablezca la conexión.',
      action: {
        label: 'Reintentar',
        onClick: () => {
          window.location.reload()
        }
      }
    })
  }

  /**
   * Notificación de reconexión exitosa
   */
  notifyConnectionRestored() {
    this.showInAppNotification('success', 'Conexión restablecida', {
      duration: 4000,
      description: 'Sincronizando datos...'
    })
  }

  /**
   * Mostrar notificación push nativa
   */
  async showPushNotification(options) {
    if (this.permission !== 'granted') return

    try {
      const registration = await navigator.serviceWorker.ready
      
      const notificationOptions = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: 'Ver',
            icon: '/icons/action-view.png'
          },
          {
            action: 'dismiss',
            title: 'Cerrar',
            icon: '/icons/action-close.png'
          }
        ],
        ...options
      }

      await registration.showNotification(options.title, notificationOptions)
    } catch (error) {
      console.error('Error showing push notification:', error)
    }
  }

  /**
   * Programar notificaciones para citas del día
   */
  async scheduleAppointmentReminders(appointments) {
    try {
      // Limpiar notificaciones programadas anteriores
      await this.clearScheduledNotifications()

      const now = new Date()
      
      for (const appointment of appointments) {
        const appointmentTime = new Date(`${appointment.date} ${appointment.startTime}`)
        
        // Programar recordatorio 1 hora antes
        const reminderTime = new Date(appointmentTime.getTime() - 60 * 60 * 1000)
        
        if (reminderTime > now) {
          setTimeout(() => {
            this.notifyUpcomingAppointment(appointment, 60)
          }, reminderTime.getTime() - now.getTime())
        }

        // Programar recordatorio 15 minutos antes
        const finalReminderTime = new Date(appointmentTime.getTime() - 15 * 60 * 1000)
        
        if (finalReminderTime > now) {
          setTimeout(() => {
            this.notifyUpcomingAppointment(appointment, 15)
          }, finalReminderTime.getTime() - now.getTime())
        }
      }

      console.log(`Scheduled reminders for ${appointments.length} appointments`)
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error)
    }
  }

  /**
   * Limpiar notificaciones programadas
   */
  async clearScheduledNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready
      const notifications = await registration.getNotifications()
      
      notifications.forEach(notification => {
        if (notification.tag.startsWith('reminder-') || notification.tag.startsWith('appointment-')) {
          notification.close()
        }
      })
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  /**
   * Configurar notificaciones personalizadas del usuario
   */
  setUserPreferences(preferences) {
    try {
      localStorage.setItem('notification-preferences', JSON.stringify({
        pushEnabled: true,
        reminderTime: 60, // minutos antes
        soundEnabled: true,
        vibrationEnabled: true,
        ...preferences
      }))
    } catch (error) {
      console.error('Error saving notification preferences:', error)
    }
  }

  /**
   * Obtener preferencias del usuario
   */
  getUserPreferences() {
    try {
      const stored = localStorage.getItem('notification-preferences')
      return stored ? JSON.parse(stored) : {
        pushEnabled: true,
        reminderTime: 60,
        soundEnabled: true,
        vibrationEnabled: true
      }
    } catch (error) {
      console.error('Error getting notification preferences:', error)
      return {}
    }
  }

  /**
   * Utilidad para convertir VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Obtener ID del usuario actual
   */
  getCurrentUserId() {
    // TODO: Integrar con el sistema de autenticación
    try {
      const user = JSON.parse(localStorage.getItem('auth-user'))
      return user?.uid || null
    } catch {
      return null
    }
  }

  /**
   * Desuscribirse de notificaciones push
   */
  async unsubscribeFromPush() {
    try {
      if (this.pushSubscription) {
        await this.pushSubscription.unsubscribe()
        this.pushSubscription = null
        
        // Notificar al servidor
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: this.getCurrentUserId()
          })
        })

        toast.success('Notificaciones desactivadas')
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      toast.error('Error al desactivar notificaciones')
    }
  }
}

// Instancia singleton
const notificationService = new NotificationService()

export default notificationService

/**
 * Hook para usar el servicio de notificaciones en componentes React
 */
export function useNotifications() {
  const [permission, setPermission] = useState(notificationService.permission)
  const [isSubscribed, setIsSubscribed] = useState(!!notificationService.pushSubscription)

  useEffect(() => {
    notificationService.initialize()
  }, [])

  const requestPermission = async () => {
    const result = await notificationService.requestPermission()
    setPermission(result)
    setIsSubscribed(result === 'granted')
    return result
  }

  const unsubscribe = async () => {
    await notificationService.unsubscribeFromPush()
    setIsSubscribed(false)
  }

  const notify = (type, message, options) => {
    return notificationService.showInAppNotification(type, message, options)
  }

  return {
    permission,
    isSubscribed,
    requestPermission,
    unsubscribe,
    notify,
    service: notificationService
  }
}