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

test('unsupported activity types do not create extra modalities', () => {
  const stats = getGameStats([
    { distance: 100, elapsed: 100, activityType: 'walking' },
    { distance: 100, elapsed: 100, activityType: 'hacking' },
  ])
  assert.equal(stats.totalTypes, 2)
  assert.equal(stats.totalMeters, 200)
})
