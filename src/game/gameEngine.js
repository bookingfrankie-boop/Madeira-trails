export const activityTypes = [
  { id: 'walking', label: 'Caminhada', shortLabel: 'A pé', icon: 'footprints' },
  { id: 'running', label: 'Corrida', shortLabel: 'Corrida', icon: 'activity' },
  { id: 'cycling', label: 'Ciclismo', shortLabel: 'Bicicleta', icon: 'bike' },
  { id: 'hiking', label: 'Trilhos e montanha', shortLabel: 'Montanha', icon: 'mountain' },
]

export const madeiraZones = [
  { id: 'funchal', name: 'Funchal', description: 'Cidade e encostas' },
  { id: 'camara-de-lobos', name: 'Câmara de Lobos', description: 'Costa sul' },
  { id: 'ribeira-brava', name: 'Ribeira Brava', description: 'Vale e costa' },
  { id: 'ponta-do-sol', name: 'Ponta do Sol', description: 'Encostas soalheiras' },
  { id: 'calheta', name: 'Calheta', description: 'Levadas e montanha' },
  { id: 'porto-moniz', name: 'Porto Moniz', description: 'Costa norte-oeste' },
  { id: 'sao-vicente', name: 'São Vicente', description: 'Vales do norte' },
  { id: 'santana', name: 'Santana', description: 'Laurissilva e picos' },
  { id: 'machico', name: 'Machico', description: 'Baía e península' },
  { id: 'santa-cruz', name: 'Santa Cruz', description: 'Costa leste' },
]

export function getGameStats(activities = []) {
  const totalMeters = activities.reduce((sum, activity) => sum + Math.max(0, Number(activity.distance) || 0), 0)
  const totalSeconds = activities.reduce((sum, activity) => sum + Math.max(0, Number(activity.elapsed) || 0), 0)
  const distinctTrails = new Set(activities.map((activity) => activity.trailCode).filter(Boolean))
  const allowedTypes = new Set(activityTypes.map((type) => type.id))
  const distinctTypes = new Set(activities.map((activity) => activity.activityType || 'walking').filter((type) => allowedTypes.has(type)))
  const baseXp = Math.floor(totalMeters / 100) + activities.length * 25 + distinctTrails.size * 15
  const missions = [
    { id: 'first-session', title: 'Primeiro passo', description: 'Termina a tua primeira atividade', target: 1, progress: Math.min(activities.length, 1), reward: 30, done: activities.length >= 1, value: activities.length, unit: 'atividade' },
    { id: 'five-km', title: '5 km na ilha', description: 'Acumula cinco quilómetros de atividade', target: 5000, progress: Math.min(totalMeters, 5000), reward: 60, done: totalMeters >= 5000, value: totalMeters, unit: 'm' },
    { id: 'variety', title: 'Quatro formas de explorar', description: 'Experimenta duas modalidades diferentes', target: 2, progress: Math.min(distinctTypes.size, 2), reward: 45, done: distinctTypes.size >= 2, value: distinctTypes.size, unit: 'modalidades' },
    { id: 'trail-explorer', title: 'Explorador de trilhos', description: 'Regista atividade em dois trilhos identificados', target: 2, progress: Math.min(distinctTrails.size, 2), reward: 50, done: distinctTrails.size >= 2, value: distinctTrails.size, unit: 'trilhos' },
  ]
  const bonusXp = missions.reduce((sum, mission) => sum + (mission.done ? mission.reward : 0), 0)
  const xp = baseXp + bonusXp
  const level = Math.floor(xp / 250) + 1
  const xpIntoLevel = xp % 250
  const exploredZones = new Set(activities.flatMap((activity) => (activity.municipality || '').split('·').map((part) => part.trim().toLocaleLowerCase('pt-PT'))).filter(Boolean))
  const zones = madeiraZones.map((zone) => ({
    ...zone,
    explored: exploredZones.has(zone.name.toLocaleLowerCase('pt-PT')),
  }))
  return {
    totalMeters,
    totalSeconds,
    totalActivities: activities.length,
    totalTrails: distinctTrails.size,
    totalTypes: distinctTypes.size,
    xp,
    level,
    xpIntoLevel,
    levelProgress: xpIntoLevel / 250 * 100,
    missions,
    completedMissions: missions.filter((mission) => mission.done).length,
    zones,
    exploredZones: zones.filter((zone) => zone.explored).length,
  }
}
