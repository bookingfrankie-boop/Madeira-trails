import { useCallback, useEffect, useRef, useState } from 'react'
import { distanceAlongRoute, distanceBetweenCoordinates } from '../utils/geo.js'

export function useGpsTracking() {
  const [tracking, setTracking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [position, setPosition] = useState(null)
  const [points, setPoints] = useState([])
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [altitude, setAltitude] = useState(null)
  const [speed, setSpeed] = useState(null)
  const watchId = useRef(null)
  const startedAt = useRef(null)
  const pausedAt = useRef(null)
  const pauseDuration = useRef(0)

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
  }, [])

  useEffect(() => {
    if (!tracking || paused || !startedAt.current) return undefined
    const updateTime = () => setElapsed(Math.floor((Date.now() - startedAt.current - pauseDuration.current) / 1000))
    updateTime()
    const interval = window.setInterval(updateTime, 1000)
    return () => window.clearInterval(interval)
  }, [tracking, paused])

  const locate = useCallback(() => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este dispositivo não disponibiliza localização GPS.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (result) => {
        const next = [result.coords.longitude, result.coords.latitude]
        setPosition(next)
        setAltitude(result.coords.altitude)
        resolve(next)
      },
      () => reject(new Error('Não foi possível obter a localização. Verifica as permissões de GPS.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    )
  }), [])

  const start = useCallback(async () => {
    try {
      await locate()
      setError('')
      setPoints([])
      setElapsed(0)
      pauseDuration.current = 0
      pausedAt.current = null
      startedAt.current = Date.now()
      setPaused(false)
      setTracking(true)
      watchId.current = navigator.geolocation.watchPosition(
        (result) => {
          const next = [result.coords.longitude, result.coords.latitude]
          setPosition(next)
          setAltitude(result.coords.altitude)
          setSpeed(result.coords.speed)
          if (!pausedAt.current) {
            setPoints((previous) => {
              const last = previous.at(-1)
              if (last && distanceBetweenCoordinates(last, next) < 4) return previous
              return [...previous, next]
            })
          }
        },
        () => setError('Sinal GPS perdido. A caminhada continua a ser guardada localmente.'),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
      )
    } catch (locationError) {
      setError(locationError.message)
    }
  }, [locate])

  const pause = useCallback(() => {
    if (paused) {
      if (pausedAt.current) pauseDuration.current += Date.now() - pausedAt.current
      pausedAt.current = null
      setPaused(false)
      return
    }
    pausedAt.current = Date.now()
    setPaused(true)
  }, [paused])

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
    watchId.current = null
    pausedAt.current = null
    startedAt.current = null
    setTracking(false)
    setPaused(false)
    setSpeed(null)
    return { points, elapsed, distance: distanceAlongRoute(points) }
  }, [elapsed, points])

  return { tracking, paused, position, points, elapsed, altitude, speed, error, locate, start, pause, stop }
}