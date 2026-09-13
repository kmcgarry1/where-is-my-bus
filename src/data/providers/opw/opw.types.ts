import type { FeatureCollection, Point } from 'geojson'

export interface OpwReadingProperties {
  station_ref?: string
  station_name?: string
  sensor_ref?: string
  region_id?: number | null
  datetime?: string
  value?: string
  err_code?: number
  url?: string
  csv_file?: string
}

export type OpwLatestGeoJson = FeatureCollection<Point, OpwReadingProperties>
