import type { FeatureCollection, Point } from 'geojson'

export interface DublinBikesStationProperties {
  system_id?: string
  station_id?: string
  last_reported?: number
  num_bikes_available?: number
  num_docks_available?: number
  is_installed?: boolean
  is_renting?: boolean
  is_returning?: boolean
  last_updated?: number
  name?: string
  short_name?: string
  address?: string
  capacity?: number
  last_reported_dt?: string
}

export type DublinBikesGeoJson = FeatureCollection<Point, DublinBikesStationProperties>
