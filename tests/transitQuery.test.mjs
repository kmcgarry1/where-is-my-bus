import assert from 'node:assert/strict'
import test from 'node:test'
import {
  insideBounds,
  matchesQuery,
  parseBounds,
  queryLimit,
} from '../server/providers/ntaGtfsRealtime/query.ts'

test('search matches stop numbers, route labels and accented names', () => {
  assert.equal(matchesQuery('eireann cork', ['Bus Eireann', 'Cork']), true)
  assert.equal(matchesQuery('eir', ['Éireann']), true)
  assert.equal(matchesQuery('46a', ['46A', 'Dublin']), true)
  assert.equal(matchesQuery('1234', ['Stop 1234']), true)
  assert.equal(matchesQuery('Galway', ['Cork']), false)
})
test('bounds include edges and exclude other cities', () => {
  const bounds = parseBounds('-6.42,53.24,-6.05,53.43')
  assert.equal(insideBounds(-6.26, 53.35, bounds), true)
  assert.equal(insideBounds(-8.47, 51.9, bounds), false)
  assert.equal(insideBounds(-6.42, 53.24, bounds), true)
  assert.throws(() => parseBounds('10,20,0,30'))
  assert.throws(() => parseBounds('NaN,0,1,2'))
})
test('limits cannot request an unbounded index', () => {
  assert.equal(queryLimit('999999'), 200)
  assert.equal(queryLimit('-1'), 30)
  assert.equal(queryLimit(null), 30)
})
