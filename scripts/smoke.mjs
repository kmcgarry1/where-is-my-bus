import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const url =
  process.argv[2] ?? process.env.BUSTIME_SMOKE_URL ?? 'http://127.0.0.1:5174/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
const requests = []
page.on('pageerror', (error) => errors.push(error.message))
const now = new Date().toISOString()
const stop = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-6.25, 53.35] },
  properties: {
    id: 'nta-stop:1234',
    stopId: '1234',
    name: "O'Connell Street",
    sourceProperties: {},
  },
}
const bus = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-6.26, 53.345] },
  properties: {
    id: 'bus-1',
    vehicleId: '1',
    tripId: 'trip-1',
    routeId: 'route-1',
    routeLabel: '46A',
    name: 'Route 46A',
    assetType: 'bus',
    observedAt: now,
    speed: 4,
    scheduleDeviationSeconds: 180,
    sourceProperties: {
      tripHeadsign: 'Phoenix Park',
      nextStopId: '1234',
      providerArrival: new Date(Date.now() + 240000).toISOString(),
    },
  },
}
const collection = (features) => ({ type: 'FeatureCollection', features })
await page.route('**/api/providers/nta/**', async (route) => {
  const request = new URL(route.request().url())
  requests.push(request.pathname + request.search)
  let body
  if (request.pathname.endsWith('/vehicles')) {
    const bounds = request.searchParams.get('bounds')?.split(',').map(Number)
    const visible =
      !bounds ||
      (bus.geometry.coordinates[0] >= bounds[0] &&
        bus.geometry.coordinates[0] <= bounds[2] &&
        bus.geometry.coordinates[1] >= bounds[1] &&
        bus.geometry.coordinates[1] <= bounds[3])
    const vehicles = visible ? [bus] : []
    if (visible && request.searchParams.has('stopId')) vehicles.push({ ...bus, properties: { ...bus.properties, id: 'unavailable-bus', tripId: 'unavailable-trip' } })
    body = { source: 'live', collection: collection(vehicles) }
  } else if (request.pathname.endsWith('/stops'))
    body = { collection: collection([stop]) }
  else if (request.pathname.endsWith('/routes'))
    body = {
      routes: [
        {
          routeId: 'route-1',
          shortName: '46A',
          longName: 'Dun Laoghaire - Phoenix Park',
          operator: 'Test operator',
          headsigns: ['Phoenix Park'],
        },
      ],
    }
  else if (request.pathname.endsWith('/stop-services'))
    body = {
      services: [
        {
          stopId: '1234',
          routeId: 'route-1',
          routeShortName: '46A',
          tripIds: ['trip-1', 'unavailable-trip'],
          headsign: 'Phoenix Park',
        },
      ],
    }
  else if (request.searchParams.get('tripId') === 'unavailable-trip') {
    await route.fulfill({ status: 503, json: { error: 'Trip unavailable' } })
    return
  }
  else if (request.pathname.endsWith('/trip-context'))
    body = {
      context: {
        source: 'configured',
        trip: { tripId: 'trip-1', routeId: 'route-1' },
        stops: [
          {
            tripId: 'trip-1',
            stopId: '1234',
            name: "O'Connell Street",
            latitude: 53.35,
            longitude: -6.25,
            stopSequence: 1,
          },
        ],
        shape: [],
      },
    }
  else body = { collection: collection([]) }
  await route.fulfill({ json: body })
})
try {
  await page.goto(url)
  await page.getByRole('heading', { name: 'Where is my bus?' }).waitFor()
  assert.equal(requests.length, 0, 'no transit data before choosing area')
  await page.selectOption('#area', 'ireland')
  await page.getByRole('tab', { name: 'Live buses' }).click()
  await page.locator('.result-row').first().waitFor()
  await page.locator('.result-row').first().click()
  await page
    .getByRole('heading', { name: 'What might be delaying it?' })
    .waitFor()
  await page.locator('.eta-number').filter({ hasText: 'min' }).waitFor()
  await page.waitForFunction(
    () =>
      window.__busTimeMap?.hasImage('local-bus') &&
      window.__busTimeMap?.getSource('vehicles'),
  )
  assert.ok(
    await page
      .locator('.map-canvas')
      .evaluate((element) => element.getBoundingClientRect().height > 300),
    'map container is visible',
  )
  await page.waitForFunction(
    () =>
      window.__busTimeMap?.queryRenderedFeatures({ layers: ['bus-icons'] })
        .length > 0,
  )
  const canvas = await page.evaluate(() => {
    const map = window.__busTimeMap
    const gl = map.getCanvas().getContext('webgl2')
    map.triggerRepaint()
    return new Promise((resolve) =>
      map.once('render', () => {
        const pixels = new Uint8Array(
          4 * gl.drawingBufferWidth * gl.drawingBufferHeight,
        )
        const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.readPixels(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels,
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
        const colors = new Set()
        for (let i = 0; i < pixels.length; i += 400)
          colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)
        resolve({
          colors: colors.size,
          bus: map.hasImage('local-bus'),
          stop: map.hasImage('local-stop'),
        })
      }),
    )
  })
  assert.ok(canvas.colors > 5, `map canvas has varied pixels: ${canvas.colors}`)
  await mkdir('artifacts', { recursive: true })
  await page.waitForFunction(
    () =>
      window.__busTimeMap?.queryRenderedFeatures({ layers: ['bus-icons'] })
        .length > 0,
  )
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'artifacts/bus-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Back to results' }).click()
  await page.getByRole('tab', { name: 'Stops', exact: true }).click()
  await page.getByRole('searchbox').fill('1234')
  await page.locator('.result-row').first().click()
  await page.locator('.arrival-row').first().waitFor()
  await page.getByText('Some arrival information is unavailable.', { exact: true }).waitFor()
  await page.locator('.arrival-row').first().click()
  await page.locator('.eta-number').filter({ hasText: 'min' }).waitFor()
  assert.ok(
    requests.some((request) => request.includes('/vehicles?stopId=1234')),
  )
  assert.ok(
    requests
      .filter((request) => request.includes('/stops?'))
      .every((request) => request.includes('q=1234')),
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(800)
  await page.waitForFunction(() => !window.__busTimeMap?.isMoving())
  assert.ok(await page.evaluate(() => {
    const map = window.__busTimeMap
    const data = map.getSource('selected')._data
    const selected = (data.geojson ?? data).features[0]
    const point = map.project(selected.geometry.coordinates)
    const rect = map.getContainer().getBoundingClientRect()
    return point.x >= 0 && point.x <= rect.width && point.y >= 0 && point.y <= rect.height
  }), 'selected bus stays inside the mobile map')
  await page.screenshot({ path: 'artifacts/bus-mobile.png', fullPage: true })
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    'no mobile horizontal overflow',
  )
  await page.selectOption('#area', 'cork')
  await page.getByRole('tab', { name: 'Live buses' }).click()
  await page.getByText('No buses are reporting in this area.').waitFor()
  await page.selectOption('#area', 'dublin')
  await page.getByRole('tab', { name: 'Routes', exact: true }).click()
  await page.getByRole('searchbox').fill('46A')
  await page.locator('.result-row').first().click()
  await page.locator('.live-section .result-row').first().waitFor()
  assert.ok(requests.some((request) => request.includes('routeId=route-1')))
  assert.ok(
    requests
      .filter((request) => request.includes('/routes?'))
      .every((request) => request.includes('q=46A')),
  )
  await page.getByRole('button', { name: 'Show bus stops' }).click()
  await page.waitForFunction(
    () =>
      window.__busTimeMap?.queryRenderedFeatures({ layers: ['stop-icons'] })
        .length > 0,
  )
  assert.ok(
    requests.some(
      (request) =>
        request.includes('/stops?bounds=') && request.includes('limit=200'),
    ),
  )
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify(
      {
        passed: true,
        canvas,
        requests,
        screenshots: ['artifacts/bus-desktop.png', 'artifacts/bus-mobile.png'],
      },
      null,
      2,
    ),
  )
} catch (error) {
  await page.screenshot({ path: 'artifacts/smoke-failure.png', fullPage: true })
  console.log(
    await page.evaluate(() => ({
      warning: document.querySelector('.map-warning')?.textContent,
      layers: window.__busTimeMap?.getStyle().layers.map((layer) => layer.id),
      vehicles: window.__busTimeMap?.getSource('vehicles')?._data,
    })),
  )
  throw error
} finally {
  await browser.close()
}
