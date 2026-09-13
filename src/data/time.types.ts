export interface AtlasTimeContext {
  mode: 'live' | 'replay'
  timestamp: string
  playing: boolean
}
