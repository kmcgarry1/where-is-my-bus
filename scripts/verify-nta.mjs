const appUrl = process.env.ATLASOPS_SMOKE_URL ?? process.env.ATLASOPS_VERIFY_URL ?? 'http://127.0.0.1:5173/'
const baseUrl = new URL(appUrl)
const requireLive = process.env.ATLASOPS_REQUIRE_LIVE_NTA === '1'
const requireStaticGtfs = process.env.ATLASOPS_REQUIRE_STATIC_GTFS === '1'
const { deriveMissingMovingBearings, interpolateMovingCollection } = await import('../src/data/moving/interpolation.ts')

const diagnostics = await readJson('/api/providers/nta/diagnostics', 'NTA diagnostics')
const vehicles = await readJson('/api/providers/nta/vehicles', 'NTA vehicles')
const alerts = await readJson('/api/providers/nta/alerts', 'NTA alerts')

const result = {
  realtimeMode: diagnostics.diagnostics?.realtime?.mode,
  keyConfigured: diagnostics.diagnostics?.realtime?.keyConfigured,
  keyEnvName: diagnostics.diagnostics?.realtime?.keyEnvName,
  vehicleSource: vehicles.source,
  vehicleCount: vehicles.collection?.features?.length ?? 0,
  alertSource: alerts.source,
  alertCount: alerts.collection?.features?.length ?? 0,
  staticGtfsSource: diagnostics.diagnostics?.staticGtfs?.source,
  staticGtfsConfigured: diagnostics.diagnostics?.staticGtfs?.configured,
  staticRouteCount: diagnostics.diagnostics?.staticGtfs?.routeCount ?? 0,
  staticTripCount: diagnostics.diagnostics?.staticGtfs?.tripCount ?? 0,
  staticStopCount: diagnostics.diagnostics?.staticGtfs?.stopCount ?? 0,
  recommendedStaticGtfsReachable: diagnostics.diagnostics?.recommendedStaticGtfs?.reachable,
  recommendedStaticGtfsBytes: diagnostics.diagnostics?.recommendedStaticGtfs?.contentLength,
  interpolation: verifyInterpolation(),
  derivedBearing: verifyDerivedBearing(),
}

const failures = []
if (!diagnostics.diagnostics?.realtime) failures.push('diagnostics missing realtime section')
if (!diagnostics.diagnostics?.staticGtfs) failures.push('diagnostics missing static GTFS section')
if (!diagnostics.diagnostics?.recommendedStaticGtfs?.url) failures.push('diagnostics missing recommended static GTFS URL')
if (!Array.isArray(vehicles.collection?.features)) failures.push('vehicles response missing GeoJSON features')
if (!Array.isArray(alerts.collection?.features)) failures.push('alerts response missing GeoJSON features')
if (requireLive && diagnostics.diagnostics?.realtime?.mode !== 'live') failures.push('ATLASOPS_REQUIRE_LIVE_NTA=1 but diagnostics mode is not live')
if (requireLive && vehicles.source !== 'live') failures.push('ATLASOPS_REQUIRE_LIVE_NTA=1 but vehicles source is not live')
if (requireLive && alerts.source !== 'live') failures.push('ATLASOPS_REQUIRE_LIVE_NTA=1 but alerts source is not live')
if (requireLive && result.vehicleCount === 0) failures.push('ATLASOPS_REQUIRE_LIVE_NTA=1 but no live vehicles were returned')
if (requireStaticGtfs && diagnostics.diagnostics?.staticGtfs?.source !== 'configured') failures.push('ATLASOPS_REQUIRE_STATIC_GTFS=1 but static GTFS is not configured')
if (requireStaticGtfs && result.staticStopCount === 0) failures.push('ATLASOPS_REQUIRE_STATIC_GTFS=1 but no static stops were indexed')
if (!result.interpolation.pass) failures.push(result.interpolation.error)
if (!result.derivedBearing.pass) failures.push(result.derivedBearing.error)

console.log(JSON.stringify({ result, failures }, null, 2))

if (failures.length) {
  process.exit(1)
}

async function readJson(path, label) {
  const response = await fetch(new URL(path, baseUrl))
  const contentType = response.headers.get('content-type') ?? ''
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`${label} responded ${response.status}: ${body.slice(0, 240)}`)
  }
  if (!contentType.includes('application/json')) {
    throw new Error(`${label} returned ${contentType || 'unknown content type'}: ${body.slice(0, 120)}`)
  }
  return JSON.parse(body)
}

function verifyInterpolation() {
  const from = movingCollectionAt([-6.3, 53.3], 'measured')
  const to = movingCollectionAt([-6.2, 53.4], 'measured')
  const midpoint = interpolateMovingCollection(from, to, 0.5).features[0]
  const coordinates = midpoint.geometry.coordinates
  const pass = midpoint.properties.interpolated === true
    && midpoint.properties.sourceProperties.movementInterpolation === 'visual-transition'
    && Math.abs(coordinates[0] - -6.25) < 0.000001
    && Math.abs(coordinates[1] - 53.35) < 0.000001
  return {
    pass,
    coordinates,
    movementInterpolation: midpoint.properties.sourceProperties.movementInterpolation,
    error: pass ? undefined : 'moving interpolation midpoint check failed',
  }
}

function verifyDerivedBearing() {
  const from = movingCollectionAt([-6.3, 53.3], 'measured')
  const to = movingCollectionAt([-6.2, 53.3], 'measured')
  const feature = deriveMissingMovingBearings(from, to).features[0]
  const bearing = feature.properties.bearing
  const pass = Number.isFinite(bearing)
    && Math.abs(bearing - 90) < 0.1
    && feature.properties.sourceProperties.bearingSource === 'derived-from-previous-position'
  return {
    pass,
    bearing,
    bearingSource: feature.properties.sourceProperties.bearingSource,
    error: pass ? undefined : 'moving derived bearing check failed',
  }
}

function movingCollectionAt(coordinates, movementInterpolation) {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      id: 'vehicle:test',
      geometry: { type: 'Point', coordinates },
      properties: {
        id: 'vehicle:test',
        provider: 'nta-gtfs-realtime',
        providerName: 'NTA GTFS-Realtime',
        assetType: 'bus',
        name: 'Test vehicle',
        observedAt: new Date(0).toISOString(),
        status: 'normal',
        sourceProperties: {
          source: 'test',
          movementInterpolation,
        },
      },
    }],
  }
}
