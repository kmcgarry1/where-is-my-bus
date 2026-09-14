import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch()
try {
  const context = await browser.newContext({ permissions: ['geolocation'], geolocation: { longitude: -6.26, latitude: 53.35 }, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const requests = []
  let empty = false
  await page.route('**/api/providers/nta/stops?**', route => {
    requests.push(new URL(route.request().url()))
    return route.fulfill({ json: { collection: { type: 'FeatureCollection', features: empty ? [] : [
      ['far', 53.356], ['near', 53.351], ['outside', 53.37],
    ].map(([id, latitude]) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [-6.26, latitude] }, properties: { id, stopId: id, name: `${id} stop`, sourceProperties: {} } })) } } })
  })
  await page.goto(process.argv[2] || 'http://127.0.0.1:5174', { waitUntil: 'domcontentloaded' })
  await page.locator('.user-location-pin').waitFor()
  assert.equal(requests.length, 0)
  await page.getByRole('button', { name: 'Bus stops near me', exact: true }).click()
  await page.getByText('near stop', { exact: true }).waitFor()
  assert.deepEqual(await page.locator('.result-row strong').allTextContents(), ['near stop', 'far stop'])
  assert.equal(requests[0].searchParams.get('limit'), '200')
  assert.ok(requests[0].searchParams.has('bounds'))
  await page.screenshot({ path: 'artifacts/nearby-mobile.png' })
  empty = true
  await page.getByRole('button', { name: 'Bus stops near me', exact: true }).click()
  await page.getByText('No bus stops found within 1 km. Search by stop name or number.').waitFor()
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (_success, failure) => failure({ code: 1, message: 'Permission denied' })
  })
  await page.getByRole('button', { name: 'Bus stops near me', exact: true }).click()
  await page.locator('.search-section [role="alert"]').waitFor()
  console.log('Nearby search: scoped loading, distance ordering, radius, empty and denied location states passed')
} finally {
  await browser.close()
}
