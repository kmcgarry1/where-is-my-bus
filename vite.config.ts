import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { ntaGtfsRealtimeRoutes } from './server/providers/ntaGtfsRealtime/routes.ts'
import { transportRoutes } from './server/transport/routes.ts'

const serverEnvKeys = [
  'NTA_API_KEY',
  'NTA_GTFSR_API_KEY',
  'TFI_API_KEY',
  'NTA_VEHICLE_POSITIONS_URL',
  'NTA_TRIP_UPDATES_URL',
  'NTA_SERVICE_ALERTS_URL',
  'NTA_GTFS_STATIC_URL',
  'NTA_DISABLE_RECOMMENDED_STATIC_GTFS',
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of serverEnvKeys) {
    if (!process.env[key] && env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [
      vue(),
      {
        name: 'bustime-provider-api',
        configureServer(server) {
          server.middlewares.use(transportRoutes())
          server.middlewares.use(ntaGtfsRealtimeRoutes())
        },
        configurePreviewServer(server) {
          server.middlewares.use(transportRoutes())
          server.middlewares.use(ntaGtfsRealtimeRoutes())
        },
      },
    ],
  }
})
