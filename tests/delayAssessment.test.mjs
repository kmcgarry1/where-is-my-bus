import assert from 'node:assert/strict'
import test from 'node:test'
import { assessDelay } from '../src/data/moving/delayAssessment.ts'
const now = Date.parse('2026-09-13T12:00:00Z')
const vehicle = (changes = {}) => ({
  properties: {
    id: 'bus',
    routeId: 'route',
    tripId: 'trip',
    observedAt: new Date(now).toISOString(),
    sourceProperties: {},
    ...changes,
  },
})
test('matches current service alerts and excludes future or unrelated alerts', () => {
  const alert = {
    properties: {
      status: 'active',
      startedAt: new Date(now - 1000).toISOString(),
      title: 'Road closed',
      sourceProperties: { routeIds: ['route'] },
    },
  }
  assert.equal(
    assessDelay(vehicle(), [alert], undefined, now).category,
    'Service alert',
  )
  assert.equal(
    assessDelay(vehicle({ routeId: 'other' }), [alert], undefined, now)
      .category,
    'No clear delay detected',
  )
  alert.properties.startedAt = new Date(now + 1000).toISOString()
  assert.equal(
    assessDelay(vehicle(), [alert], undefined, now).category,
    'No clear delay detected',
  )
})
test('reports lateness without inventing a cause', () => {
  const assessment = assessDelay(
    vehicle({ scheduleDeviationSeconds: 300 }),
    [],
    undefined,
    now,
  )
  assert.equal(assessment.category, 'Running late')
  assert.match(assessment.explanation, /No specific cause/)
})
test('stale positions take precedence over movement inference', () => {
  assert.equal(
    assessDelay(
      vehicle({ speed: 0, observedAt: new Date(now - 600000).toISOString() }),
      [],
      undefined,
      now,
    ).category,
    'Position data stale',
  )
})
test('stationary movement is explicitly inferred', () => {
  const assessment = assessDelay(vehicle({ speed: 0 }), [], undefined, now)
  assert.equal(assessment.category, 'Stopped or slow movement')
  assert.equal(assessment.inferred, true)
})
test('missing evidence does not imply an on-time guarantee', () => {
  assert.equal(
    assessDelay(vehicle(), [], undefined, now).category,
    'No clear delay detected',
  )
})
