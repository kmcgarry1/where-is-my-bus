import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.setDefaultTimeout(60000)
try {
  await page.goto('http://127.0.0.1:5174')
  await page.selectOption('#area', 'dublin')
  await page.getByRole('tab', { name: 'Live buses' }).click()
  await page.locator('.result-row').first().waitFor()
  const buses = await page.evaluate(() => window.__busTimeMap?.getSource('vehicles')?._data?.features ?? [])
  const index = Math.max(0, buses.findIndex(bus => bus.properties.sourceProperties.nextStopId && bus.properties.tripId))
  const bus = buses[index]
  await page.locator('.result-row').nth(index).click()
  await page.waitForFunction(() => document.querySelector('.eta-number')?.textContent?.trim() !== '...')
  await page.waitForTimeout(1000)
  console.log(JSON.stringify({ buses: buses.length, selected: bus?.properties.routeLabel, eta: await page.locator('.arrival-focus').innerText(), delay: await page.locator('.delay-section').innerText() }))
  await page.screenshot({ path: 'artifacts/live-bus-desktop.png', fullPage: true })
  const stopId = bus?.properties.sourceProperties.nextStopId
  if (stopId) {
    await page.getByRole('button', { name: 'Back to results' }).click()
    await page.getByRole('tab', { name: 'Stops', exact: true }).click()
    await page.getByRole('searchbox').fill(stopId)
    await page.locator('.result-row').first().click()
    await page.locator('.arrival-row').first().waitFor()
    console.log(JSON.stringify({ stopId, arrivals: await page.locator('.arrival-row').count(), first: await page.locator('.arrival-row').first().innerText() }))
    await page.screenshot({ path: 'artifacts/live-stop-desktop.png', fullPage: true })
  }
} finally { await browser.close() }
