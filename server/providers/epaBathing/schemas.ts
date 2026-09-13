import { z } from 'zod'

export const epaAlertSchema = z.object({
  incident_id: z.number(),
  bathing_water_incident_id: z.string(),
  beach_id: z.string(),
  beach_name: z.string(),
  county_name: z.string().nullable().optional(),
  local_authority_name: z.string().nullable().optional(),
  has_bathing_restriction_in_place: z.string().nullable().optional(),
  incident_start_date: z.string(),
  incident_expected_duration: z.number().nullable().optional(),
  bathing_restriction_type: z.string().nullable().optional(),
  incident_description: z.string().nullable().optional(),
  bathing_notice_pdf: z.string().nullable().optional(),
  incident_end_date: z.string().nullable().optional(),
  last_updated: z.string().nullable().optional(),
})

export const epaLocationSchema = z.object({
  beach_id: z.string(),
  beach_name: z.string(),
  county_name: z.string().nullable().optional(),
  local_authority_name: z.string().nullable().optional(),
  easting: z.number().nullable().optional(),
  northing: z.number().nullable().optional(),
  beach_type: z.string().nullable().optional(),
  current_annual_water_quality_classification: z.string().nullable().optional(),
  has_all_season_bathing_restriction_in_place: z.string().nullable().optional(),
  last_updated: z.string().nullable().optional(),
})

export const epaListResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  count: z.number(),
  length: z.number(),
  page: z.number(),
  list: z.array(itemSchema),
})

export type EpaBathingAlert = z.infer<typeof epaAlertSchema>
export type EpaBathingLocation = z.infer<typeof epaLocationSchema>
