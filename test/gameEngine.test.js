import test from 'node:test'
import assert from 'node:assert/strict'
import { getGameStats, madeiraZones } from '../src/game/gameEngine.js'

test('fresh player starts at level one with zero XP', () => {
  const stats = getGameStats([])
  assert.equal(stats.xp, 0)
  assert.equal(stats.level, 1)
  assert.equal(stats.totalActivities, 0)
  assert.equal(stats.zones.length, 10)
  assert.equal(stats.exploredZones, 0)
})

test('activity progress is calculated from metres and completed missions', () => {
  const stats = getGameStats([{
    id: 'activity-0001',
    distance: 1000,
    elapsed: 600,
    activityType: 'walking',
    trailCode: 'PR 6',
    municipality: 'Calheta',
  }])
  assert.equal(stats.totalMeters, 1000)
  assert.equal(stats.totalActivities, 1)
  assert.equal(stats.totalTrails, 1)
  assert.equal(stats.completedMissions, 1)
  assert.equal(stats.zones.find((zone) => zone.id === 'calheta').explored, true)
})

test('zone catalogue is restricted to the ten municipalities of Madeira island', () => {
  assert.equal(madeiraZones.length, 10)
  assert.equal(madeiraZones.some((zone) => zone.id === 'porto-santo'), false)
  assert.deepEqual(new Set(madeiraZones.map((zone) => zone.id)).size, 10)
})

test('unsupported activity types are excluded from modality progress', () => {
  const stats = getGameStats([
    { distance: 100, elapsed: 100, activityType: 'walking' },
    { distance: 100, elapsed: 100, activityType: 'hacking' },
  ])
  assert.equal(stats.totalTypes, 1)
  assert.equal(stats.totalMeters, 200)
})

import { nearestZone, validateRoute } from '../server/gameRules.js'

test('server accepts plausible GPS activity on Madeira and assigns a zone', () => {
  const points = [
    [-16.9256, 32.6669],
    [-16.9245, 32.6672],
    [-16.9234, 32.6676],
  ]
  const distance = validateRoute(points, 'walking', 300)
  assert.ok(distance > 100)
  assert.equal(nearestZone(points), 'funchal')
})

test('server rejects activity outside the Madeira island play area', () => {
  assert.throws(
    () => validateRoute([[-16.35, 33.07], [-16.34, 33.07], [-16.33, 33.07]], 'walking', 300),
    (error) => error.status === 422 && error.message.includes('fora do território'),
  )
})

test('server rejects implausible average speed and too few GPS samples', () => {
  assert.throws(
    () => validateRoute([[-16.9256, 32.6669], [-16.915, 32.6669], [-16.905, 32.6669]], 'running', 60),
    (error) => error.status === 422 && error.message.includes('velocidade'),
  )
  assert.throws(
    () => validateRoute([[-16.9256, 32.6669], [-16.9245, 32.6672]], 'walking', 300),
    (error) => error.status === 422,
  )
})
