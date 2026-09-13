import { z } from 'zod'

const nullableNumber = z.number().nullable().optional()

export const sonitusReadingSchema = z.object({
  recorded_at: z.string(),
  laeq: nullableNumber,
  lafmax: nullableNumber,
  pm1: nullableNumber,
  pm2_5: nullableNumber,
  pm4: nullableNumber,
  pm10: nullableNumber,
  tsp: nullableNumber,
  no2: nullableNumber,
  o3: nullableNumber,
  so2: nullableNumber,
  co: nullableNumber,
  voc: nullableNumber,
  status: z.string().optional(),
}).passthrough()

export const sonitusMonitorSchema = z.object({
  monitor_id: z.number(),
  label: z.string(),
  location: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  code: z.string(),
  serial_number: z.string(),
  frozen: z.boolean().optional(),
  monitor_type: z.object({
    name: z.string(),
    manufacturer: z.string().optional(),
    category: z.enum(['noise', 'air']),
  }).passthrough(),
  latest_reading: sonitusReadingSchema.nullable().optional(),
  current_rating: z.number().nullable().optional(),
  description: z.string().optional(),
}).passthrough()

export const sonitusMonitorsSchema = z.array(sonitusMonitorSchema)

export type SonitusMonitor = z.infer<typeof sonitusMonitorSchema>
