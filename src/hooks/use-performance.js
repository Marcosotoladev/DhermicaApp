// src/hooks/use-performance.js

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { connectionUtils } from '../lib/firebase-services-optimized'

/**
 * Hook para detectar estado de conexión
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(true)

  useEffect(() => {
    // Verificar conexión inicial
    setIsOnline(navigator.onLine)

    // Verificar Firebase inicial
    connectionUtils.isOnline().then(setIsFirebaseOnline)

    // Listeners para cambios de conexión
    const handleOnline = () => {
      setIsOnline(true)
      connectionUtils.goOnline()
      connectionUtils.isOnline().then(setIsFirebaseOnline)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsFirebaseOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verificar Firebase periódicamente
    const interval = setInterval(() => {
      if (navigator.onLine) {
        connectionUtils.isOnline().then(setIsFirebaseOnline)
      }
    }, 30000) // cada 30 segundos

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  return {
    isOnline,
    isFirebaseOnline,
    isFullyOnline: isOnline && isFirebaseOnline
  }
}

/**
 * Hook para debounce - optimiza búsquedas y validaciones
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para detectar si el componente está visible (Intersection Observer)
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState(null)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options.threshold, options.rootMargin])

  return {
    elementRef,
    isIntersecting,
    entry
  }
}

/**
 * Hook para lazy loading de componentes
 */
export function useLazyLoad(shouldLoad = true) {
  const [hasLoaded, setHasLoaded] = useState(false)
  const { elementRef, isIntersecting } = useIntersectionObserver()

  useEffect(() => {
    if (isIntersecting && shouldLoad && !hasLoaded) {
      setHasLoaded(true)
    }
  }, [isIntersecting, shouldLoad, hasLoaded])

  return {
    elementRef,
    shouldRender: hasLoaded,
    isVisible: isIntersecting
  }
}

/**
 * Hook para optimizar re-renders con memorización inteligente
 */
export function useStableCallback(callback, deps) {
  const ref = useRef(callback)

  useEffect(() => {
    ref.current = callback
  }, deps)

  return useCallback((...args) => ref.current(...args), [])
}

/**
 * Hook para medir performance de componentes
 */
export function usePerformanceMonitor(componentName) {
  const mountTime = useRef(Date.now())
  const renderCount = useRef(0)
  const lastRenderTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current += 1
    lastRenderTime.current = Date.now()
  })

  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current
    console.log(`${componentName} mounted in ${mountDuration}ms`)

    return () => {
      const totalTime = Date.now() - mountTime.current
      console.log(`${componentName} total lifetime: ${totalTime}ms, renders: ${renderCount.current}`)
    }
  }, [componentName])

  return {
    renderCount: renderCount.current,
    mountTime: mountTime.current,
    lastRenderTime: lastRenderTime.current
  }
}

/**
 * Hook para gestión de estado local con persistencia opcional
 */
export function useLocalState(key, initialValue, persist = false) {
  const [state, setState] = useState(() => {
    if (!persist || typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      setState(value)
      
      if (persist && typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, persist])

  const clearValue = useCallback(() => {
    setState(initialValue)
    
    if (persist && typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  }, [key, initialValue, persist])

  return [state, setValue, clearValue]
}

/**
 * Hook para detectar dispositivo móvil y características
 */
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    isLandscape: false,
    screenSize: 'unknown'
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      const info = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouchDevice,
        isLandscape: width > height,
        screenSize: width < 640 ? 'sm' : width < 768 ? 'md' : width < 1024 ? 'lg' : 'xl'
      }

      setDeviceInfo(info)
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

/**
 * Hook para optimizar listas grandes con virtualización simple
 */
export function useVirtualizedList(items, itemHeight, containerHeight) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )

    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, itemHeight, containerHeight, scrollTop])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  return {
    ...visibleItems,
    handleScroll
  }
}

/**
 * Hook para precargar recursos críticos
 */
export function usePreload() {
  const preloadedResources = useRef(new Set())

  const preloadImage = useCallback((src) => {
    if (preloadedResources.current.has(src)) return

    const img = new Image()
    img.src = src
    preloadedResources.current.add(src)
  }, [])

  const preloadRoute = useCallback((href) => {
    if (preloadedResources.current.has(href)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
    preloadedResources.current.add(href)
  }, [])

  const preloadFont = useCallback((fontUrl) => {
    if (preloadedResources.current.has(fontUrl)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = fontUrl
    document.head.appendChild(link)
    preloadedResources.current.add(fontUrl)
  }, [])

  return {
    preloadImage,
    preloadRoute,
    preloadFont
  }
}

/**
 * Hook para gestión de errores con retry automático
 */
export function useErrorHandler(maxRetries = 3) {
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const executeWithRetry = useCallback(async (asyncFn, customMaxRetries = maxRetries) => {
    setIsRetrying(true)
    setError(null)

    for (let attempt = 0; attempt <= customMaxRetries; attempt++) {
      try {
        const result = await asyncFn()
        setRetryCount(0)
        setIsRetrying(false)
        return result
      } catch (err) {
        if (attempt === customMaxRetries) {
          setError(err)
          setRetryCount(attempt)
          setIsRetrying(false)
          throw err
        }

        setRetryCount(attempt + 1)
        
        // Backoff exponencial
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }, [maxRetries])

  const clearError = useCallback(() => {
    setError(null)
    setRetryCount(0)
    setIsRetrying(false)
  }, [])

  return {
    error,
    retryCount,
    isRetrying,
    executeWithRetry,
    clearError
  }
}

/**
 * Hook para optimizar formularios con validación en tiempo real
 */
export function useOptimizedForm(validationSchema, debounceMs = 300) {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isValidating, setIsValidating] = useState(false)

  const debouncedValues = useDebounce(values, debounceMs)

  // Validar cuando cambien los valores con debounce
  useEffect(() => {
    if (Object.keys(debouncedValues).length === 0) return

    setIsValidating(true)
    
    try {
      validationSchema.parse(debouncedValues)
      setErrors({})
    } catch (err) {
      if (err.errors) {
        const newErrors = {}
        err.errors.forEach(error => {
          newErrors[error.path[0]] = error.message
        })
        setErrors(newErrors)
      }
    } finally {
      setIsValidating(false)
    }
  }, [debouncedValues, validationSchema])

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const resetForm = useCallback(() => {
    setValues({})
    setErrors({})
    setTouched({})
  }, [])

  const isValid = Object.keys(errors).length === 0
  const hasErrors = Object.keys(errors).length > 0

  return {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    hasErrors,
    setValue,
    setFieldError,
    resetForm
  }
}