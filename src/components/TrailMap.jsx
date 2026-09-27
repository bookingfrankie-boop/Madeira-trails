import { useEffect, useRef } from 'react'
import { AttributionControl, Map as MapLibreMap, Marker, NavigationControl, Popup } from 'maplibre-gl'

const madeiraCenter = [-16.98, 32.76]

function mapStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.48, 'raster-contrast': 0.12 } }],
  }
}

export default function TrailMap({ trail, position, points, onLocate, onStart, tracking, paused }) {
  const container = useRef(null)
  const map = useRef(null)
  const markers = useRef([])
  const onLocateRef = useRef(onLocate)
  onLocateRef.current = onLocate

  useEffect(() => {
    if (!container.current || map.current) return undefined
    const instance = new MapLibreMap({
      container: container.current,
      style: mapStyle(),
      center: trail?.coordinates ?? madeiraCenter,
      zoom: trail ? 11 : 9,
      pitch: 0,
      attributionControl: false,
    })
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    instance.addControl(new AttributionControl({ compact: true }), 'bottom-right')
    instance.on('load', () => {
      instance.addSource('activity', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } })
      instance.addLayer({
        id: 'activity-line', type: 'line', source: 'activity',
        paint: { 'line-color': '#d89b47', 'line-width': 5, 'line-opacity': 0.96 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })
    })
    map.current = instance
    return () => {
      markers.current.forEach((marker) => marker.remove())
      markers.current = []
      instance.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    markers.current.forEach((marker) => marker.remove())
    markers.current = []
    if (trail) {
      const marker = new Marker({ color: '#d89b47' }).setLngLat(trail.coordinates).setPopup(
        new Popup({ offset: 20 }).setText(`${trail.code} · ${trail.name} · localização aproximada`),
      ).addTo(instance)
      markers.current.push(marker)
      instance.flyTo({ center: trail.coordinates, zoom: 11, duration: 650 })
    } else if (!position) {
      instance.flyTo({ center: madeiraCenter, zoom: 9, duration: 650 })
    }
  }, [trail, position])

  useEffect(() => {
    const instance = map.current
    if (!instance || !position) return
    if (!markers.current.some((marker) => marker.getElement().dataset.userLocation === 'true')) {
      const element = document.createElement('div')
      element.className = 'user-location-marker'
      element.dataset.userLocation = 'true'
      markers.current.push(new Marker({ element }).setLngLat(position).setPopup(new Popup({ offset: 16 }).setText('A tua localização')).addTo(instance))
    } else {
      const userMarker = markers.current.find((marker) => marker.getElement().dataset.userLocation === 'true')
      userMarker.setLngLat(position)
    }
    if (tracking) instance.easeTo({ center: position, duration: 500 })
  }, [position, tracking])

  useEffect(() => {
    const instance = map.current
    if (!instance || !instance.isStyleLoaded() || !instance.getSource('activity')) return
    instance.getSource('activity').setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: points.length > 1 ? points : [] },
    })
  }, [points])

  useEffect(() => {
    if (!map.current) return undefined
    const resize = window.setTimeout(() => map.current?.resize(), 80)
    return () => window.clearTimeout(resize)
  }, [trail])

  return (
    <div className="map-shell">
      <div className="map-canvas" ref={container} aria-label="Mapa interativo da Ilha da Madeira" />
      <div className="map-credit">Mapa © OpenStreetMap · Percursos dependem de GPX oficial</div>
      <button className="map-locate icon-button" type="button" title="Localizar-me" aria-label="Localizar-me" onClick={() => onLocateRef.current()}>
        <span className="locate-glyph" />
      </button>
      {tracking && (
        <div className="map-follow-pill"><span className="live-dot" /> {paused ? 'Caminhada em pausa' : 'A acompanhar'}</div>
      )}
      {!tracking && !trail && (
        <button className="map-start-button" type="button" onClick={onStart}>Começar caminhada</button>
      )}
    </div>
  )
}