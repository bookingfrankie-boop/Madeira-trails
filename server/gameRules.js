const ZONES = [
  { id: 'funchal', name: 'Funchal', lon: -16.9256, lat: 32.6669 },
  { id: 'camara-de-lobos', name: 'Câmara de Lobos', lon: -16.9718, lat: 32.6488 },
  { id: 'ribeira-brava', name: 'Ribeira Brava', lon: -17.0627, lat: 32.6748 },
  { id: 'ponta-do-sol', name: 'Ponta do Sol', lon: -17.1013, lat: 32.6798 },
  { id: 'calheta', name: 'Calheta', lon: -17.1771, lat: 32.7167 },
  { id: 'porto-moniz', name: 'Porto Moniz', lon: -17.1667, lat: 32.8667 },
  { id: 'sao-vicente', name: 'São Vicente', lon: -17.0434, lat: 32.7967 },
  { id: 'santana', name: 'Santana', lon: -16.8809, lat: 32.8031 },
  { id: 'machico', name: 'Machico', lon: -16.7650, lat: 32.7180 },
  { id: 'santa-cruz', name: 'Santa Cruz', lon: -16.7930, lat: 32.6880 },
]

function distanceMeters(a, b) {
  const rad = (degrees) => degrees * Math.PI / 180
  const dLat = rad(b[1] - a[1])
  const dLon = rad(b[0] - a[0])
  const lat1 = rad(a[1])
  const lat2 = rad(b[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
}

export function validateRoute(points, activityType, elapsed) {
  if (!Array.isArray(points) || points.length < 3 || points.length > 20000) {
    throw Object.assign(new Error('São necessários pelo menos 3 pontos GPS para validar a atividade partilhada.'), { status: 422 })
  }
  let distance = 0
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i]
    if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      throw Object.assign(new Error('O percurso contém coordenadas inválidas.'), { status: 422 })
    }
    const [lon, lat] = point
    // Broad guardrail for Madeira island only. It is not an official coastline polygon.
    if (lon < -17.35 || lon > -16.45 || lat < 32.55 || lat > 33.15) {
      throw Object.assign(new Error('Esta atividade fica fora do território jogável da ilha da Madeira.'), { status: 422 })
    }
    if (i > 0) distance += distanceMeters(points[i - 1], point)
  }
  const maxSpeed = { walking: 5.5, hiking: 5.5, running: 12, cycling: 35 }[activityType]
  if (!maxSpeed || distance < 100 || elapsed < 60 || distance / elapsed > maxSpeed) {
    throw Object.assign(new Error('A atividade não cumpre os limites mínimos de distância, duração ou velocidade.'), { status: 422 })
  }
  return Math.round(distance)
}

export function nearestZone(points) {
  const middle = points[Math.floor(points.length / 2)]
  return ZONES.reduce((best, zone) => {
    const distance = distanceMeters(middle, [zone.lon, zone.lat])
    return !best || distance < best.distance ? { id: zone.id, distance } : best
  }, null).id
}
