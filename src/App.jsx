import { useState } from 'react'
import MapView from './components/MapView'
import LayerPanel from './components/LayerPanel'
import './App.css'

const DEFAULT_LAYERS = {
  school:     true,
  carToyotaHq: true,
  carShimoyama: true,
  carShotaHome: true,
  mikawaAnjoShinkansen: true,
  toyohashiAccess: true,
  nagoyaAccess: true,
  intersection: true,
  toyotaRailAccess: true,
  landPrice:  false,
  floodL2:    false,
  tsunami:    false,
  terrain:    false,
}

const DEFAULT_BASEMAP = 'pale'
const BASEMAP_STORAGE_KEY = 'housing-map-basemap-v2'
const DRIVE_MINUTES_STORAGE_KEY = 'housing-map-drive-minutes-v1'
const DEFAULT_DRIVE_MINUTES = 45
const BULK_DISPLAY_LAYER_KEYS = [
  'school',
  'carToyotaHq',
  'carShimoyama',
  'carShotaHome',
  'mikawaAnjoShinkansen',
  'toyohashiAccess',
  'nagoyaAccess',
  'toyotaRailAccess',
]

const VALID_DRIVE_MINUTES = [30, 35, 40, 45, 50, 55, 60]

function clampDriveMinutes(value) {
  const nearest = VALID_DRIVE_MINUTES.reduce((a, b) =>
    Math.abs(b - value) < Math.abs(a - value) ? b : a
  )
  return nearest
}

export default function App() {
  const [layers, setLayers]         = useState(DEFAULT_LAYERS)
  const [baseMap, setBaseMap]       = useState(() => {
    const saved = window.localStorage.getItem(BASEMAP_STORAGE_KEY)
    return saved ?? DEFAULT_BASEMAP
  })
  const [driveMinutes, setDriveMinutes] = useState(() => {
    const saved = Number(window.localStorage.getItem(DRIVE_MINUTES_STORAGE_KEY))
    return Number.isFinite(saved) && saved > 0
      ? clampDriveMinutes(saved)
      : DEFAULT_DRIVE_MINUTES
  })

  const toggleLayer = (key) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))

  const handleBulkDisplayLayers = (nextChecked) => {
    setLayers((prev) => {
      const next = { ...prev }
      BULK_DISPLAY_LAYER_KEYS.forEach((key) => {
        next[key] = nextChecked
      })
      return next
    })
  }

  const handleBaseMapChange = (nextBaseMap) => {
    setBaseMap(nextBaseMap)
    window.localStorage.setItem(BASEMAP_STORAGE_KEY, nextBaseMap)
  }

  const handleDriveMinutesChange = (nextDriveMinutes) => {
    const normalized = clampDriveMinutes(nextDriveMinutes)
    setDriveMinutes(normalized)
    window.localStorage.setItem(DRIVE_MINUTES_STORAGE_KEY, String(normalized))
  }

  return (
    <div className="app-shell">
      <LayerPanel
        layers={layers}
        baseMap={baseMap}
        driveMinutes={driveMinutes}
        onBaseMapChange={handleBaseMapChange}
        onDriveMinutesChange={handleDriveMinutesChange}
        onBulkDisplayLayersChange={handleBulkDisplayLayers}
        onToggle={toggleLayer}
      />
      <main className="map-area">
        <MapView
          layers={layers}
          baseMap={baseMap}
          driveMinutes={driveMinutes}
        />
      </main>
    </div>
  )
}
