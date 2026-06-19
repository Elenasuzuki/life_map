import { useEffect, useMemo, useRef, useState } from 'react'
import polygonClipping from 'polygon-clipping'
import { SHINKANSEN_STATIONS, WORKPLACES } from '../data/locations'
import {
  MEITETSU_STATIONS,
  QUALIFYING_STATIONS,
  QUALIFYING_STATIONS_NAGOYA,
  WALK_RADIUS_M,
} from '../data/meitetsu'
import { QUALIFYING_JR_NAGOYA_STATIONS } from '../data/jrNagoya'
import { QUALIFYING_JR_TOYOHASHI_STATIONS } from '../data/jrToyohashi'
import { QUALIFYING_SUBWAY_NAGOYA_STATIONS, SUBWAY_WALK_RADIUS_M } from '../data/nagoyaSubway'
import {
  QUALIFYING_AICHILOOP_TOYOTA_STATIONS,
  WALK_RADIUS_M as AICHILOOP_WALK_RADIUS_M,
} from '../data/aichiLoopToyota'

const CENTER = { lat: 34.97, lng: 137.08 }
const ZOOM   = 10

const COLOR = {
  workplace:  '#2f7de1',
  meitetsu:   '#74cdee',
  walkZone:   '#74cdee',
  meitetsuNagoya: '#8bc34a',
  walkZoneNagoya: '#689f38',
  jrNagoya: '#8bc34a',
  walkZoneJrNagoya: '#689f38',
  jrToyohashi: '#74cdee',
  walkZoneJrToyohashi: '#74cdee',
  subwayNagoya: '#8bc34a',
  walkZoneSubwayNagoya: '#689f38',
  accessPointToyohashi: '#60bdd8',
  accessPointNagoya: '#9ccc65',
  shinkansenMikawaAnjo: '#f39c34',
  schoolElementary: '#bc8f6f',
  schoolJuniorHigh: '#9c6b4f',
  schoolHigh: '#7b4f36',
  schoolUniversity: '#5d3422',
  culturalFacility: '#546e7a',
  aichiLoopToyota: '#ff7043',
}

const BASE_MAPS = {
  std: {
    styleUrl: 'https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/std.json',
    attribution: '<a href="https://maps.gsi.go.jp/vector/" target="_blank" rel="noopener noreferrer">地理院地図Vector</a>',
  },
  pale: {
    styleUrl: 'https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/pale.json',
    attribution: '<a href="https://maps.gsi.go.jp/vector/" target="_blank" rel="noopener noreferrer">地理院地図Vector</a>',
  },
  blank: {
    styleUrl: 'https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/blank.json',
    attribution: '<a href="https://maps.gsi.go.jp/vector/" target="_blank" rel="noopener noreferrer">地理院地図Vector</a>',
  },
}

const ISOCHRONE_COLORS = ['#2f7de1', '#00a6b8', '#6b5cff']
const ACCESS_MARKER_OPACITY = 0.68
const ACCESS_MARKER_STROKE_OPACITY = 0.78
const ACCESS_MARKER_STROKE_WIDTH = 1.25
const ACCESS_WALK_LINE_OPACITY = 0.72
const ACCESS_WALK_LINE_WIDTH = 0.9
const ISOCHRONE_MARKER_RADIUS = 7
const ISOCHRONE_MARKER_OPACITY = 0.78
const ISOCHRONE_FILL_OPACITY = 0.06
const ISOCHRONE_HIGHWAY_LINE_OPACITY = 0.95
const ISOCHRONE_ROAD_LINE_OPACITY = 0.95
const ISOCHRONE_ROAD_LINE_WIDTH = 0.65
const CAR_OVERLAP_TRIPLE_LINE_COLOR = '#1f3b73'
const CAR_LAYER_CONFIG = {
  toyota_hq: {
    pointLayerId: 'workplace-toyota-hq-circles',
    fillLayerId: 'isochrone-toyota-hq-fill',
    roadLineLayerId: 'isochrone-toyota-hq-road-line',
    highwayFillLayerId: 'isochrone-toyota-hq-highway-fill',
    highwayLineLayerId: 'isochrone-toyota-hq-highway-line',
    visibleKey: 'carToyotaHq',
  },
  toyota_shimoyama: {
    pointLayerId: 'workplace-shimoyama-circles',
    fillLayerId: 'isochrone-shimoyama-fill',
    roadLineLayerId: 'isochrone-shimoyama-road-line',
    highwayFillLayerId: 'isochrone-shimoyama-highway-fill',
    highwayLineLayerId: 'isochrone-shimoyama-highway-line',
    visibleKey: 'carShimoyama',
  },
  shota_family_home: {
    pointLayerId: 'workplace-shota-home-circles',
    fillLayerId: 'isochrone-shota-home-fill',
    roadLineLayerId: 'isochrone-shota-home-road-line',
    highwayFillLayerId: 'isochrone-shota-home-highway-fill',
    highwayLineLayerId: 'isochrone-shota-home-highway-line',
    visibleKey: 'carShotaHome',
  },
}

const CAR_MARKER_COLORS = {
  toyota_hq: ISOCHRONE_COLORS[0],
  toyota_shimoyama: ISOCHRONE_COLORS[1],
  shota_family_home: ISOCHRONE_COLORS[2],
}

const SHINKANSEN_MARKER_COLORS = {
  shinkansen_nagoya: COLOR.accessPointNagoya,
  shinkansen_mikawa_anjo: COLOR.shinkansenMikawaAnjo,
  shinkansen_toyohashi: COLOR.accessPointToyohashi,
}


function makeFeatureCollection(features) {
  return { type: 'FeatureCollection', features }
}

function circlePolygon(center, radiusMeters, steps = 64) {
  const earthRadius = 6378137
  const lat = center[1] * Math.PI / 180
  const lng = center[0] * Math.PI / 180
  const distance = radiusMeters / earthRadius
  const coordinates = []

  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * Math.PI * 2
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(distance) +
      Math.cos(lat) * Math.sin(distance) * Math.cos(bearing)
    )
    const lng2 = lng + Math.atan2(
      Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
      Math.cos(distance) - Math.sin(lat) * Math.sin(lat2)
    )
    coordinates.push([lng2 * 180 / Math.PI, lat2 * 180 / Math.PI])
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
    properties: {},
  }
}

function pointFeature(item, extra = {}) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [item.lng, item.lat],
    },
    properties: {
      ...extra,
      ...item,
    },
  }
}

function geometryToMultiPolygon(geometry) {
  if (!geometry) return null
  if (geometry.type === 'Polygon') return [geometry.coordinates]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates
  return null
}

function multiPolygonToFeatures(multiPolygon, properties) {
  if (!Array.isArray(multiPolygon) || multiPolygon.length === 0) return []
  return multiPolygon.map((coordinates) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates,
    },
    properties,
  }))
}

function hasMultiPolygonGeometry(multiPolygon) {
  return Array.isArray(multiPolygon) && multiPolygon.length > 0
}

function stationPopupHtml(props) {
  const toyohashiTravel = props.fastestMinutesFromToyohashi !== undefined
    ? `<br/><span>豊橋から直通 最速 <b>${props.fastestMinutesFromToyohashi}</b> 分</span>`
    : ''
  const nagoyaTravel = props.fastestMinutesFromNagoya !== undefined
    ? `<br/><span>名鉄名古屋から直通 最速 <b>${props.fastestMinutesFromNagoya}</b> 分</span>`
    : ''
  const jrNagoyaTravel = props.fastestMinutesFromJRNagoya !== undefined
    ? `<br/><span>JR名古屋から直通 最速 <b>${props.fastestMinutesFromJRNagoya}</b> 分</span>`
    : ''
  const jrToyohashiTravel = props.fastestMinutesFromJRToyohashi !== undefined
    ? `<br/><span>JR豊橋から直通 最速 <b>${props.fastestMinutesFromJRToyohashi}</b> 分</span>`
    : ''
  const aichiLoopTravel = props.fastestMinutesFromMikawaTotyota !== undefined
    ? `<br/><span>三河豊田から 最速 <b>${props.fastestMinutesFromMikawaTotyota}</b> 分</span>`
    : ''
  const subwayNagoyaTravel = props.fastestMinutesToNagoya !== undefined
    ? `<br/><span>地下鉄で名古屋へ${props.transferCount === 1 ? ' 1回乗換' : ' 直通'} 最速 <b>${props.fastestMinutesToNagoya}</b> 分</span>`
    : ''
  const note = props.note
    ? `<br/><span style="color:#555">${props.note}</span>`
    : ''
  const accessNote = props.accessNote
    && !props.line
    ? `<br/><span style="color:#555">${props.accessNote}</span>`
    : ''
  const nagoyaAccessNote = props.nagoyaAccessNote
    ? `<br/><span style="color:#555">${props.nagoyaAccessNote}</span>`
    : ''
  const jrNagoyaAccessNote = props.jrNagoyaAccessNote
    ? `<br/><span style="color:#555">${props.jrNagoyaAccessNote}</span>`
    : ''
  const jrToyohashiAccessNote = props.jrToyohashiAccessNote
    ? `<br/><span style="color:#555">${props.jrToyohashiAccessNote}</span>`
    : ''
  const subwayAccessNote = props.accessNote && props.line
    ? `<br/><span style="color:#555">${props.line} / ${props.accessNote}</span>`
    : ''

  return `<div style="min-width:160px"><strong>${props.name}</strong>${note}${toyohashiTravel}${nagoyaTravel}${jrNagoyaTravel}${jrToyohashiTravel}${subwayNagoyaTravel}${aichiLoopTravel}${accessNote}${nagoyaAccessNote}${jrNagoyaAccessNote}${jrToyohashiAccessNote}${subwayAccessNote}</div>`
}

function popupAtFeature(map, event, html) {
  if (!window.maplibregl) return
  new window.maplibregl.Popup({ closeButton: true, closeOnClick: true })
    .setLngLat(event.lngLat)
    .setHTML(html)
    .addTo(map)
}

function setSourceData(map, id, data) {
  const source = map.getSource(id)
  if (source) {
    source.setData(data)
  } else {
    map.addSource(id, { type: 'geojson', data })
  }
}

function ensureLayer(map, layer) {
  if (!map.getLayer(layer.id)) {
    map.addLayer(layer)
  }
}

function ensureSolidBackground(map, baseMap) {
  const backgroundColor = baseMap === 'pale' ? '#f6f4ee' : '#ffffff'

  if (map.getLayer('app-background')) {
    map.setPaintProperty('app-background', 'background-color', backgroundColor)
    map.setPaintProperty('app-background', 'background-opacity', 1)
    return
  }

  map.addLayer({
    id: 'app-background',
    type: 'background',
    paint: {
      'background-color': backgroundColor,
      'background-opacity': 1,
    },
  }, map.getStyle().layers?.[0]?.id)
}

function setVisibility(map, layerIds, visible) {
  layerIds.forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    }
  })
}

function ensureRasterSource(map, id, tiles, options = {}) {
  if (!map.getSource(id)) {
    map.addSource(id, {
      type: 'raster',
      tiles,
      tileSize: 256,
      ...options,
    })
  }
}

function createEmojiMarker(map, item, { color, borderAlpha, markersRef, setPointer, clearPointer }) {
  if (!window.maplibregl || markersRef.current[item.id]) return

  const element = document.createElement('button')
  element.type = 'button'
  element.className = 'workplace-emoji-marker'
  element.textContent = item.iconEmoji ?? '📍'
  element.setAttribute('aria-label', item.name)
  element.style.background = color
  element.style.border = `2px solid rgba(255,255,255,${borderAlpha})`
  element.style.borderRadius = '999px'
  element.style.width = '30px'
  element.style.height = '30px'
  element.style.display = 'flex'
  element.style.alignItems = 'center'
  element.style.justifyContent = 'center'
  element.style.padding = '0'
  element.style.cursor = 'pointer'
  element.style.fontSize = '17px'
  element.style.lineHeight = '1'
  element.style.boxShadow = '0 1px 4px rgba(0,0,0,0.18)'

  element.addEventListener('click', () => {
    popupAtFeature(map, { lngLat: { lng: item.lng, lat: item.lat } }, stationPopupHtml(item))
  })
  element.addEventListener('mouseenter', setPointer)
  element.addEventListener('mouseleave', clearPointer)

  markersRef.current[item.id] = new window.maplibregl.Marker({ element, anchor: 'center' })
    .setLngLat([item.lng, item.lat])
    .addTo(map)
}

function registerWalkZoneLayer(map, sourceId, data, color, fillOpacity, dasharray = [2, 2]) {
  setSourceData(map, sourceId, data)
  ensureLayer(map, {
    id: `${sourceId}-fill`,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': color,
      'fill-opacity': fillOpacity,
    },
  })
  ensureLayer(map, {
    id: `${sourceId}-line`,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': color,
      'line-width': ACCESS_WALK_LINE_WIDTH,
      'line-dasharray': dasharray,
      'line-opacity': ACCESS_WALK_LINE_OPACITY,
    },
  })
}

const HAZARD_RASTER_LAYERS = [
  {
    key: 'floodL2',
    sourceId: 'hazard-flood-l2',
    layerId: 'hazard-flood-l2-layer',
    tiles: ['https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png'],
    sourceOptions: { maxzoom: 17 },
    opacity: 0.75,
  },
  {
    key: 'tsunami',
    sourceId: 'hazard-tsunami',
    layerId: 'hazard-tsunami-layer',
    tiles: ['https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png'],
    sourceOptions: { maxzoom: 17 },
    opacity: 0.75,
  },
  // terrain 下層: lcm25k_2012（数値地図25000 土地条件）
  // zoom 10-12 のみ表示。広域カバー用。zoom 13+ は lcmfc2 に委譲。
  {
    key: 'terrain',
    sourceId: 'hazard-terrain-base',
    layerId: 'hazard-terrain-base-layer',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/lcm25k_2012/{z}/{x}/{y}.png'],
    sourceOptions: { maxzoom: 12 },
    layerMinzoom: 10,
    layerMaxzoom: 13,
    opacity: 0.72,
    resampling: 'nearest',
  },
  // terrain 上層: lcmfc2（治水地形分類図）
  // zoom 10-16 ネイティブ対応。zoom 13+ でも高解像度。
  {
    key: 'terrain',
    sourceId: 'hazard-terrain',
    layerId: 'hazard-terrain-layer',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/lcmfc2/{z}/{x}/{y}.png'],
    sourceOptions: { maxzoom: 16 },
    layerMinzoom: 10,
    opacity: 0.85,
    resampling: 'nearest',
  },
]

function cloneStyle(style) {
  if (typeof structuredClone === 'function') {
    return structuredClone(style)
  }
  return JSON.parse(JSON.stringify(style))
}

export default function MapView({ layers, baseMap, driveMinutes }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const workplaceMarkersRef = useRef({})
  const shinkansenMarkersRef = useRef({})
  const attributionRef = useRef(null)
  const styleCacheRef = useRef({})
  const transitionTimerRef = useRef(null)
  const viewportRef = useRef({
    center: [CENTER.lng, CENTER.lat],
    zoom: ZOOM,
  })
  const [schoolData, setSchoolData] = useState(null)
  const [schoolFacilityData, setSchoolFacilityData] = useState(null)
  const [culturalFacilityData, setCulturalFacilityData] = useState(null)
  const [walkIsochroneData, setWalkIsochroneData] = useState(null)
  const [landPriceData, setLandPriceData] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const [mapSnapshotUrl, setMapSnapshotUrl] = useState('')
  const [isBaseMapTransitioning, setIsBaseMapTransitioning] = useState(false)
  const activeBaseMap = BASE_MAPS[baseMap] ?? BASE_MAPS.pale
  const [isochroneData, setIsochroneData] = useState({})
  const driveSeconds = driveMinutes * 60

  useEffect(() => {
    fetch('/data/school_districts.geojson')
      .then(r => r.json())
      .then(setSchoolData)
      .catch(e => console.error('学区GeoJSON読み込み失敗:', e))

    fetch('/data/school_facilities.geojson')
      .then(r => r.json())
      .then(setSchoolFacilityData)
      .catch(e => console.error('学校ポイントGeoJSON読み込み失敗:', e))

    fetch('/data/cultural_facilities.geojson')
      .then(r => r.json())
      .then(setCulturalFacilityData)
      .catch(e => console.error('文化施設ポイントGeoJSON読み込み失敗:', e))

    fetch('/data/walk_isochrones.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setWalkIsochroneData(data) })
      .catch(() => {})

    fetch('/data/land_price.geojson')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setLandPriceData(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    Object.entries(BASE_MAPS).forEach(([key, config]) => {
      fetch(config.styleUrl)
        .then((response) => response.json())
        .then((styleJson) => {
          styleCacheRef.current[key] = styleJson
        })
        .catch((error) => {
          console.error(`背景地図スタイルの先読み失敗 (${key}):`, error)
        })
    })
  }, [])

  useEffect(() => {
    const newData = {}
    const loads = WORKPLACES.flatMap((workplace) => [
      fetch(`/data/drive_isochrones/${workplace.id}_no_highway_${driveMinutes}min.geojson`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) newData[workplace.id] = data }),
      fetch(`/data/drive_isochrones/${workplace.id}_highway_${driveMinutes}min.geojson`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) newData[`${workplace.id}:highway`] = data }),
    ])
    Promise.all(loads).then(() => setIsochroneData(newData))
  }, [driveMinutes])

  const isoLookup = useMemo(() => {
    if (!walkIsochroneData) return {}
    const lookup = {}
    for (const f of walkIsochroneData.features) {
      const id = f.properties?.stationId
      if (id) lookup[id] = f.geometry
    }
    return lookup
  }, [walkIsochroneData])

  const stationGroups = useMemo(() => ({
    meitetsu: makeFeatureCollection(
      MEITETSU_STATIONS.map((station) => pointFeature(station, {
        markerColor: station.directFromToyohashi ? COLOR.accessPointToyohashi : '#888888',
        markerRadius: station.directFromToyohashi ? 5 : 2.75,
      }))
    ),
  }), [])

  const walkZoneData = useMemo(() => makeFeatureCollection(
    QUALIFYING_STATIONS.map((station) => {
      const geom = isoLookup[station.id]
      return geom
        ? { type: 'Feature', geometry: geom, properties: { id: station.id, name: station.name } }
        : { ...circlePolygon([station.lng, station.lat], WALK_RADIUS_M), properties: { id: station.id, name: station.name } }
    })
  ), [isoLookup])

  const walkZoneNagoyaData = useMemo(() => makeFeatureCollection(
    QUALIFYING_STATIONS_NAGOYA.map((station) => {
      const geom = isoLookup[station.id]
      return geom
        ? { type: 'Feature', geometry: geom, properties: { id: station.id, name: station.name } }
        : { ...circlePolygon([station.lng, station.lat], WALK_RADIUS_M), properties: { id: station.id, name: station.name } }
    })
  ), [isoLookup])

  const walkZoneJrNagoyaData = useMemo(() => makeFeatureCollection(
    QUALIFYING_JR_NAGOYA_STATIONS.map((station) => {
      const geom = isoLookup[station.id]
      return geom
        ? { type: 'Feature', geometry: geom, properties: { id: station.id, name: station.name } }
        : { ...circlePolygon([station.lng, station.lat], WALK_RADIUS_M), properties: { id: station.id, name: station.name } }
    })
  ), [isoLookup])

  const walkZoneJrToyohashiData = useMemo(() => makeFeatureCollection(
    QUALIFYING_JR_TOYOHASHI_STATIONS.map((station) => {
      const geom = isoLookup[station.id]
      return geom
        ? { type: 'Feature', geometry: geom, properties: { id: station.id, name: station.name } }
        : { ...circlePolygon([station.lng, station.lat], WALK_RADIUS_M), properties: { id: station.id, name: station.name } }
    })
  ), [isoLookup])

  const mikawaAnjoShinkansenWalkData = useMemo(() => {
    const station = SHINKANSEN_STATIONS.find((item) => item.id === 'shinkansen_mikawa_anjo')
    if (!station) return makeFeatureCollection([])
    const geom = isoLookup[station.id]
    return makeFeatureCollection([
      geom
        ? { type: 'Feature', geometry: geom, properties: { id: station.id, name: station.name } }
        : { ...circlePolygon([station.lng, station.lat], WALK_RADIUS_M), properties: { id: station.id, name: station.name } },
    ])
  }, [isoLookup])

  const nagoyaDirectStations = useMemo(() => makeFeatureCollection(
    QUALIFYING_STATIONS_NAGOYA.map((station) => pointFeature(station, {
      markerColor: COLOR.accessPointNagoya,
      markerRadius: 5,
    }))
  ), [])

  const jrNagoyaDirectStations = useMemo(() => makeFeatureCollection(
    QUALIFYING_JR_NAGOYA_STATIONS.map((station) => pointFeature(station, {
      markerColor: COLOR.accessPointNagoya,
      markerRadius: 5,
    }))
  ), [])

  const jrToyohashiDirectStations = useMemo(() => makeFeatureCollection(
    QUALIFYING_JR_TOYOHASHI_STATIONS.map((station) => pointFeature(station, {
      markerColor: COLOR.accessPointToyohashi,
      markerRadius: 5,
    }))
  ), [])

  const walkZoneSubwayNagoyaData = useMemo(() => makeFeatureCollection(
    QUALIFYING_SUBWAY_NAGOYA_STATIONS.map((station) => {
      const geom = isoLookup[station.id]
      return geom
        ? { type: 'Feature', geometry: geom, properties: { id: station.id, name: station.name } }
        : { ...circlePolygon([station.lng, station.lat], SUBWAY_WALK_RADIUS_M), properties: { id: station.id, name: station.name } }
    })
  ), [isoLookup])

  const subwayNagoyaDirectStations = useMemo(() => makeFeatureCollection(
    QUALIFYING_SUBWAY_NAGOYA_STATIONS.map((station) => pointFeature(station, {
      markerColor: COLOR.accessPointNagoya,
      markerRadius: 4.75,
    }))
  ), [])

  const walkZoneAichiLoopToyotaData = useMemo(() => makeFeatureCollection(
    QUALIFYING_AICHILOOP_TOYOTA_STATIONS.map((station) => {
      const geom = isoLookup[station.id]
      return geom
        ? { type: 'Feature', geometry: geom, properties: { id: station.id, name: station.name } }
        : { ...circlePolygon([station.lng, station.lat], AICHILOOP_WALK_RADIUS_M), properties: { id: station.id, name: station.name } }
    })
  ), [isoLookup])

  const aichiLoopToyotaDirectStations = useMemo(() => makeFeatureCollection(
    QUALIFYING_AICHILOOP_TOYOTA_STATIONS.map((station) => pointFeature(station, {
      markerColor: COLOR.aichiLoopToyota,
      markerRadius: 4.5,
    }))
  ), [])

  const isochroneFeatures = useMemo(() => makeFeatureCollection(
    WORKPLACES.flatMap((workplace, index) => {
      const featureData = isochroneData[workplace.id]
      if (featureData?.features?.[0]) {
        return [{
          ...featureData.features[0],
          properties: {
            ...featureData.features[0].properties,
            id: workplace.id,
            name: workplace.name,
            color: ISOCHRONE_COLORS[index % ISOCHRONE_COLORS.length],
          },
        }]
      }

      return []
    })
  ), [isochroneData])

  const isochroneHighwayFeatures = useMemo(() => makeFeatureCollection(
    WORKPLACES.flatMap((workplace, index) => {
      const featureData = isochroneData[`${workplace.id}:highway`]
      if (featureData?.features?.[0]) {
        return [{
          ...featureData.features[0],
          properties: {
            ...featureData.features[0].properties,
            id: workplace.id,
            name: workplace.name,
            color: ISOCHRONE_COLORS[index % ISOCHRONE_COLORS.length],
          },
        }]
      }

      return []
    })
  ), [isochroneData])

  const carOverlapFeatures = useMemo(() => {
    const activeIds = Object.entries(CAR_LAYER_CONFIG)
      .filter(([, config]) => layers[config.visibleKey])
      .map(([workplaceId]) => workplaceId)

    const activePolygons = activeIds
      .map((workplaceId) => {
        const feature = isochroneFeatures.features.find(
          (item) => item.properties?.id === workplaceId
        )
        return geometryToMultiPolygon(feature?.geometry)
      })
      .filter(Boolean)

    if (activePolygons.length < 2) {
      return makeFeatureCollection([])
    }

    const overlapFeatures = []

    if (activePolygons.length === 2) {
      const doubleOverlap = polygonClipping.intersection(
        activePolygons[0],
        activePolygons[1]
      )
      overlapFeatures.push(
        ...multiPolygonToFeatures(doubleOverlap, { overlapLevel: 2 })
      )
      return makeFeatureCollection(overlapFeatures)
    }

    const [a, b, c] = activePolygons
    const ab = polygonClipping.intersection(a, b)
    const ac = polygonClipping.intersection(a, c)
    const bc = polygonClipping.intersection(b, c)
    const tripleOverlap = polygonClipping.intersection(a, b, c)

    const doubleCandidates = [ab, ac, bc]
      .filter(hasMultiPolygonGeometry)
      .map((shape) =>
        hasMultiPolygonGeometry(tripleOverlap)
          ? polygonClipping.difference(shape, tripleOverlap)
          : shape
      )
      .filter(hasMultiPolygonGeometry)

    const doubleOverlap = doubleCandidates.length > 0
      ? polygonClipping.union(...doubleCandidates)
      : null

    overlapFeatures.push(
      ...multiPolygonToFeatures(doubleOverlap, { overlapLevel: 2 }),
      ...multiPolygonToFeatures(tripleOverlap, { overlapLevel: 3 })
    )

    return makeFeatureCollection(overlapFeatures)
  }, [isochroneFeatures, layers])

  const intersectionData = useMemo(() => {
    const transitPolygons = [
      ...(layers.nagoyaAccess ? walkZoneNagoyaData.features : []),
      ...(layers.nagoyaAccess ? walkZoneJrNagoyaData.features : []),
      ...(layers.nagoyaAccess ? walkZoneSubwayNagoyaData.features : []),
      ...(layers.toyohashiAccess ? walkZoneData.features : []),
      ...(layers.toyohashiAccess ? walkZoneJrToyohashiData.features : []),
      ...(layers.mikawaAnjoShinkansen ? mikawaAnjoShinkansenWalkData.features : []),
    ].map(f => geometryToMultiPolygon(f.geometry)).filter(Boolean)

    const carPolygons = Object.entries(CAR_LAYER_CONFIG)
      .filter(([, config]) => layers[config.visibleKey])
      .map(([workplaceId]) => {
        const feature = isochroneFeatures.features.find(f => f.properties?.id === workplaceId)
        return geometryToMultiPolygon(feature?.geometry)
      })
      .filter(Boolean)

    if (transitPolygons.length === 0 || carPolygons.length === 0) return makeFeatureCollection([])

    const transitUnion = transitPolygons.length === 1
      ? transitPolygons[0]
      : polygonClipping.union(...transitPolygons)
    const carCombined = carPolygons.length === 1
      ? carPolygons[0]
      : polygonClipping.intersection(...carPolygons)

    if (!hasMultiPolygonGeometry(carCombined)) return makeFeatureCollection([])

    const result = polygonClipping.intersection(transitUnion, carCombined)
    return makeFeatureCollection(multiPolygonToFeatures(result, {}))
  }, [layers, walkZoneNagoyaData, walkZoneJrNagoyaData, walkZoneSubwayNagoyaData, walkZoneData, walkZoneJrToyohashiData, mikawaAnjoShinkansenWalkData, isochroneFeatures])

  useEffect(() => {
    if (!window.maplibregl || !mapNodeRef.current) return

    const map = new window.maplibregl.Map({
      container: mapNodeRef.current,
      style: activeBaseMap.styleUrl,
      center: viewportRef.current.center,
      zoom: viewportRef.current.zoom,
      hash: false,
      attributionControl: false,
    })

    map.addControl(new window.maplibregl.NavigationControl(), 'top-right')
    attributionRef.current = new window.maplibregl.AttributionControl({
      compact: true,
      customAttribution: activeBaseMap.attribution,
    })
    map.addControl(attributionRef.current)

    map.on('load', () => {
      setStyleLoaded(true)
      setMapReady(true)
    })
    map.on('style.load', () => {
      setStyleLoaded(true)
    })
    map.on('moveend', () => {
      const center = map.getCenter()
      viewportRef.current = {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
      }
    })

    mapRef.current = map

    return () => {
      Object.values(workplaceMarkersRef.current).forEach((marker) => marker.remove())
      workplaceMarkersRef.current = {}
      Object.values(shinkansenMarkersRef.current).forEach((marker) => marker.remove())
      shinkansenMarkersRef.current = {}
      viewportRef.current.zoom = map.getZoom()
      const center = map.getCenter()
      viewportRef.current.center = [center.lng, center.lat]
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
      setMapReady(false)
      setStyleLoaded(false)
      attributionRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const canvas = map.getCanvas?.()
    if (styleLoaded && canvas) {
      try {
        setMapSnapshotUrl(canvas.toDataURL('image/png'))
        setIsBaseMapTransitioning(true)
      } catch (error) {
        console.warn('背景地図切替用スナップショットの取得に失敗:', error)
        setMapSnapshotUrl('')
        setIsBaseMapTransitioning(false)
      }
    }

    setMapReady(false)
    setStyleLoaded(false)
    const cachedStyle = styleCacheRef.current[baseMap]
    map.setStyle(cachedStyle ? cloneStyle(cachedStyle) : activeBaseMap.styleUrl)

    if (attributionRef.current) {
      map.removeControl(attributionRef.current)
    }
    attributionRef.current = new window.maplibregl.AttributionControl({
      compact: true,
      customAttribution: activeBaseMap.attribution,
    })
    map.addControl(attributionRef.current)
  }, [activeBaseMap])

  useEffect(() => {
    if (!styleLoaded) return

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setIsBaseMapTransitioning(false)
      setMapSnapshotUrl('')
    }, 160)

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [styleLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !styleLoaded) return

    ensureSolidBackground(map, baseMap)

    HAZARD_RASTER_LAYERS.forEach(({ sourceId, layerId, tiles, opacity, sourceOptions, layerMinzoom, layerMaxzoom, resampling }) => {
      ensureRasterSource(map, sourceId, tiles, sourceOptions ?? {})
      ensureLayer(map, {
        id: layerId,
        type: 'raster',
        source: sourceId,
        ...(layerMinzoom != null ? { minzoom: layerMinzoom } : {}),
        ...(layerMaxzoom != null ? { maxzoom: layerMaxzoom } : {}),
        paint: {
          'raster-opacity': opacity,
          'raster-fade-duration': 0,
          ...(resampling ? { 'raster-resampling': resampling } : {}),
        },
      })
    })

    const handlePointClick = (event) => {
      const feature = event.features?.[0]
      if (!feature) return
      popupAtFeature(map, event, stationPopupHtml(feature.properties))
    }

    const handleFacilityClick = (event) => {
      const feature = event.features?.[0]
      if (!feature) return
      const props = feature.properties ?? {}
      popupAtFeature(
        map,
        event,
        `<strong>${props.name ?? '施設'}</strong><br/>` +
        `${props.city ?? '愛知県'} / ${props.facilityType ?? '施設'}<br/>` +
        `${props.address ? `${props.address}<br/>` : ''}` +
        `${props.source ?? ''}`
      )
    }

    const setPointer = () => { map.getCanvas().style.cursor = 'pointer' }
    const clearPointer = () => { map.getCanvas().style.cursor = '' }

    Object.entries(CAR_LAYER_CONFIG).forEach(([workplaceId]) => {
      const workplace = WORKPLACES.find((item) => item.id === workplaceId)
      if (!workplace) return
      createEmojiMarker(map, workplace, {
        color: CAR_MARKER_COLORS[workplaceId] ?? '#2f7de1',
        borderAlpha: 0.9,
        markersRef: workplaceMarkersRef,
        setPointer,
        clearPointer,
      })
    })

    SHINKANSEN_STATIONS.forEach((station) => {
      createEmojiMarker(map, station, {
        color: SHINKANSEN_MARKER_COLORS[station.id] ?? '#5d6d7e',
        borderAlpha: 0.92,
        markersRef: shinkansenMarkersRef,
        setPointer,
        clearPointer,
      })
    })

    if (landPriceData) {
      setSourceData(map, 'land-price', landPriceData)
      ensureLayer(map, {
        id: 'land-price-fill',
        type: 'fill',
        source: 'land-price',
        paint: {
          'fill-color': [
            'step',
            ['get', 'price'],
            '#fffde7',    // < 50,000
            50000,  '#fff176',
            80000,  '#ffca28',
            120000, '#ffa000',
            160000, '#e65100',
            250000, '#c62828',
            500000, '#7b1fa2',
          ],
          'fill-opacity': 0.6,
        },
      })
      ensureLayer(map, {
        id: 'land-price-line',
        type: 'line',
        source: 'land-price',
        paint: {
          'line-color': '#666666',
          'line-width': 0.4,
          'line-opacity': 0.3,
        },
      })
    }

    if (schoolData) {
      setSourceData(map, 'school', schoolData)
      ensureLayer(map, {
        id: 'school-fill',
        type: 'fill',
        source: 'school',
        paint: {
          'fill-color': '#c7c7cf',
          'fill-opacity': 0.15,
        },
      })
      ensureLayer(map, {
        id: 'school-line',
        type: 'line',
        source: 'school',
        paint: {
          'line-color': [
            'match',
            ['get', 'level'],
            '小学校', '#8d6e63',
            '#6d4c41',
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0.6,
            10, 1,
            12, 1.6,
            14, 2.2,
          ],
          'line-dasharray': [2, 2],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0.45,
            10, 0.6,
            12, 0.75,
            14, 0.85,
          ],
        },
      })
    }

    if (schoolFacilityData) {
      setSourceData(map, 'school-facilities', schoolFacilityData)
      ensureLayer(map, {
        id: 'school-facilities-circles',
        type: 'circle',
        source: 'school-facilities',
        minzoom: 11,
        paint: {
          'circle-color': [
            'match',
            ['get', 'facilityType'],
            '小学校', COLOR.schoolElementary,
            '中学校', COLOR.schoolJuniorHigh,
            '高等学校', COLOR.schoolHigh,
            '大学', COLOR.schoolUniversity,
            '#795548',
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9, 2.5,
            11, 4,
            13, 5.5,
          ],
          'circle-opacity': 0.78,
          'circle-stroke-width': 0.8,
          'circle-stroke-color': '#fffaf4',
          'circle-stroke-opacity': 0.9,
        },
      })
      map.on('click', 'school-facilities-circles', handleFacilityClick)
      map.on('mouseenter', 'school-facilities-circles', setPointer)
      map.on('mouseleave', 'school-facilities-circles', clearPointer)
    }

    if (culturalFacilityData) {
      setSourceData(map, 'cultural-facilities', culturalFacilityData)
      ensureLayer(map, {
        id: 'cultural-facilities-circles',
        type: 'circle',
        source: 'cultural-facilities',
        minzoom: 11,
        paint: {
          'circle-color': COLOR.culturalFacility,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9, 2,
            11, 3.25,
            13, 4.5,
          ],
          'circle-opacity': 0.54,
          'circle-stroke-width': 0.7,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.75,
        },
      })
      map.on('click', 'cultural-facilities-circles', handleFacilityClick)
      map.on('mouseenter', 'cultural-facilities-circles', setPointer)
      map.on('mouseleave', 'cultural-facilities-circles', clearPointer)
    }

    registerWalkZoneLayer(map, 'meitetsu-walk',                walkZoneData,                  COLOR.walkZone,             0.12, [3, 2])
    registerWalkZoneLayer(map, 'meitetsu-nagoya-walk',         walkZoneNagoyaData,            COLOR.walkZoneNagoya,        0.08)
    registerWalkZoneLayer(map, 'jr-nagoya-walk',               walkZoneJrNagoyaData,          COLOR.walkZoneJrNagoya,      0.08)
    registerWalkZoneLayer(map, 'jr-toyohashi-walk',            walkZoneJrToyohashiData,       COLOR.walkZoneJrToyohashi,   0.08)
    registerWalkZoneLayer(map, 'mikawa-anjo-shinkansen-walk',  mikawaAnjoShinkansenWalkData,  COLOR.shinkansenMikawaAnjo,  0.1)
    registerWalkZoneLayer(map, 'subway-nagoya-walk',           walkZoneSubwayNagoyaData,      COLOR.walkZoneSubwayNagoya,  0.07)
    registerWalkZoneLayer(map, 'aichiloop-toyota-walk',        walkZoneAichiLoopToyotaData,   COLOR.aichiLoopToyota,       0.1)

    setSourceData(map, 'aichiloop-toyota-points', aichiLoopToyotaDirectStations)
    ensureLayer(map, {
      id: 'aichiloop-toyota-circles',
      type: 'circle',
      source: 'aichiloop-toyota-points',
      paint: {
        'circle-color': ['get', 'markerColor'],
        'circle-radius': ['get', 'markerRadius'],
        'circle-opacity': ACCESS_MARKER_OPACITY,
        'circle-stroke-width': ACCESS_MARKER_STROKE_WIDTH,
        'circle-stroke-color': ['get', 'markerColor'],
        'circle-stroke-opacity': ACCESS_MARKER_STROKE_OPACITY,
      },
    })
    map.on('click', 'aichiloop-toyota-circles', handlePointClick)
    map.on('mouseenter', 'aichiloop-toyota-circles', setPointer)
    map.on('mouseleave', 'aichiloop-toyota-circles', clearPointer)

    Object.entries(stationGroups).forEach(([key, collection]) => {
      const sourceId = `${key}-points`
      const layerId = `${key}-circles`
      setSourceData(map, sourceId, collection)
      ensureLayer(map, {
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': ['get', 'markerColor'],
          'circle-radius': ['get', 'markerRadius'],
          'circle-opacity': ACCESS_MARKER_OPACITY,
          'circle-stroke-width': ACCESS_MARKER_STROKE_WIDTH,
          'circle-stroke-color': ['get', 'markerColor'],
          'circle-stroke-opacity': ACCESS_MARKER_STROKE_OPACITY,
        },
      })
      map.on('click', layerId, handlePointClick)
      map.on('mouseenter', layerId, setPointer)
      map.on('mouseleave', layerId, clearPointer)
    })

    setSourceData(map, 'meitetsu-nagoya-points', nagoyaDirectStations)
    ensureLayer(map, {
      id: 'meitetsu-nagoya-circles',
      type: 'circle',
      source: 'meitetsu-nagoya-points',
      paint: {
        'circle-color': ['get', 'markerColor'],
        'circle-radius': ['get', 'markerRadius'],
        'circle-opacity': ACCESS_MARKER_OPACITY,
        'circle-stroke-width': ACCESS_MARKER_STROKE_WIDTH,
        'circle-stroke-color': ['get', 'markerColor'],
        'circle-stroke-opacity': ACCESS_MARKER_STROKE_OPACITY,
      },
    })
    map.on('click', 'meitetsu-nagoya-circles', handlePointClick)
    map.on('mouseenter', 'meitetsu-nagoya-circles', setPointer)
    map.on('mouseleave', 'meitetsu-nagoya-circles', clearPointer)

    setSourceData(map, 'jr-nagoya-points', jrNagoyaDirectStations)
    ensureLayer(map, {
      id: 'jr-nagoya-circles',
      type: 'circle',
      source: 'jr-nagoya-points',
      paint: {
        'circle-color': ['get', 'markerColor'],
        'circle-radius': ['get', 'markerRadius'],
        'circle-opacity': ACCESS_MARKER_OPACITY,
        'circle-stroke-width': ACCESS_MARKER_STROKE_WIDTH,
        'circle-stroke-color': ['get', 'markerColor'],
        'circle-stroke-opacity': ACCESS_MARKER_STROKE_OPACITY,
      },
    })
    map.on('click', 'jr-nagoya-circles', handlePointClick)
    map.on('mouseenter', 'jr-nagoya-circles', setPointer)
    map.on('mouseleave', 'jr-nagoya-circles', clearPointer)

    setSourceData(map, 'jr-toyohashi-points', jrToyohashiDirectStations)
    ensureLayer(map, {
      id: 'jr-toyohashi-circles',
      type: 'circle',
      source: 'jr-toyohashi-points',
      paint: {
        'circle-color': ['get', 'markerColor'],
        'circle-radius': ['get', 'markerRadius'],
        'circle-opacity': ACCESS_MARKER_OPACITY,
        'circle-stroke-width': ACCESS_MARKER_STROKE_WIDTH,
        'circle-stroke-color': ['get', 'markerColor'],
        'circle-stroke-opacity': ACCESS_MARKER_STROKE_OPACITY,
      },
    })
    map.on('click', 'jr-toyohashi-circles', handlePointClick)
    map.on('mouseenter', 'jr-toyohashi-circles', setPointer)
    map.on('mouseleave', 'jr-toyohashi-circles', clearPointer)

    setSourceData(map, 'subway-nagoya-points', subwayNagoyaDirectStations)
    ensureLayer(map, {
      id: 'subway-nagoya-circles',
      type: 'circle',
      source: 'subway-nagoya-points',
      paint: {
        'circle-color': ['get', 'markerColor'],
        'circle-radius': ['get', 'markerRadius'],
        'circle-opacity': ACCESS_MARKER_OPACITY,
        'circle-stroke-width': ACCESS_MARKER_STROKE_WIDTH,
        'circle-stroke-color': ['get', 'markerColor'],
        'circle-stroke-opacity': ACCESS_MARKER_STROKE_OPACITY,
      },
    })
    map.on('click', 'subway-nagoya-circles', handlePointClick)
    map.on('mouseenter', 'subway-nagoya-circles', setPointer)
    map.on('mouseleave', 'subway-nagoya-circles', clearPointer)

    setSourceData(map, 'isochrone', isochroneFeatures)
    setSourceData(map, 'isochrone-highway', isochroneHighwayFeatures)
    Object.entries(CAR_LAYER_CONFIG).forEach(([workplaceId, config]) => {
      ensureLayer(map, {
        id: config.fillLayerId,
        type: 'fill',
        source: 'isochrone',
        filter: ['==', ['get', 'id'], workplaceId],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ISOCHRONE_FILL_OPACITY,
        },
      })
      ensureLayer(map, {
        id: config.roadLineLayerId,
        type: 'line',
        source: 'isochrone',
        filter: ['==', ['get', 'id'], workplaceId],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ISOCHRONE_ROAD_LINE_WIDTH,
          'line-opacity': ISOCHRONE_ROAD_LINE_OPACITY,
        },
      })
      ensureLayer(map, {
        id: config.highwayFillLayerId,
        type: 'fill',
        source: 'isochrone-highway',
        filter: ['==', ['get', 'id'], workplaceId],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ISOCHRONE_FILL_OPACITY,
        },
      })
      ensureLayer(map, {
        id: config.highwayLineLayerId,
        type: 'line',
        source: 'isochrone-highway',
        filter: ['==', ['get', 'id'], workplaceId],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ISOCHRONE_ROAD_LINE_WIDTH,
          'line-opacity': ISOCHRONE_HIGHWAY_LINE_OPACITY,
          'line-dasharray': [3, 2],
        },
      })
    })
    if (!map.getSource('intersection')) {
      map.addSource('intersection', { type: 'geojson', data: makeFeatureCollection([]) })
    }
    ensureLayer(map, {
      id: 'intersection-fill',
      type: 'fill',
      source: 'intersection',
      paint: { 'fill-color': '#fbbf24', 'fill-opacity': 0.22 },
    })
    ensureLayer(map, {
      id: 'intersection-line',
      type: 'line',
      source: 'intersection',
      paint: { 'line-color': '#f59e0b', 'line-width': 1.5, 'line-opacity': 0.9 },
    })
    if (!map.getSource('car-overlap')) {
      map.addSource('car-overlap', { type: 'geojson', data: makeFeatureCollection([]) })
    }
    ensureLayer(map, {
      id: 'car-overlap-triple-line',
      type: 'line',
      source: 'car-overlap',
      filter: ['==', ['get', 'overlapLevel'], 3],
      paint: {
        'line-color': CAR_OVERLAP_TRIPLE_LINE_COLOR,
        'line-width': 0.5,
        'line-opacity': 1,
      },
    })
    return () => {
      if (!mapRef.current) return

      const safeOff = (eventName, layerId, handler) => {
        if (map.getLayer(layerId)) {
          map.off(eventName, layerId, handler)
        }
      }

      ;[
        'meitetsu-circles',
        'school-facilities-circles',
        'cultural-facilities-circles',
        'meitetsu-nagoya-circles',
        'jr-nagoya-circles',
        'jr-toyohashi-circles',
        'subway-nagoya-circles',
        'aichiloop-toyota-circles',
      ].forEach((layerId) => {
      safeOff('click', layerId, layerId.includes('facilities') ? handleFacilityClick : handlePointClick)
      safeOff('mouseenter', layerId, setPointer)
      safeOff('mouseleave', layerId, clearPointer)
      })
    }
  }, [aichiLoopToyotaDirectStations, baseMap, culturalFacilityData, isochroneFeatures, isochroneHighwayFeatures, jrNagoyaDirectStations, jrToyohashiDirectStations, landPriceData, mapReady, mikawaAnjoShinkansenWalkData, nagoyaDirectStations, schoolData, schoolFacilityData, stationGroups, styleLoaded, subwayNagoyaDirectStations, walkZoneAichiLoopToyotaData, walkZoneData, walkZoneJrNagoyaData, walkZoneJrToyohashiData, walkZoneNagoyaData, walkZoneSubwayNagoyaData])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !styleLoaded) return

    setSourceData(map, 'intersection', intersectionData)
    setSourceData(map, 'car-overlap', carOverlapFeatures)

    Object.entries(CAR_LAYER_CONFIG).forEach(([workplaceId, config]) => {
      const marker = workplaceMarkersRef.current[workplaceId]
      if (marker?.getElement()) {
        marker.getElement().style.display = layers[config.visibleKey] ? '' : 'none'
      }
    })
    SHINKANSEN_STATIONS.forEach((station) => {
      const shouldShow = station.id === 'shinkansen_mikawa_anjo'
        ? layers.mikawaAnjoShinkansen
        : true
      const marker = shinkansenMarkersRef.current[station.id]
      if (marker?.getElement()) {
        marker.getElement().style.display = shouldShow ? '' : 'none'
      }
    })

    setVisibility(map, ['land-price-fill', 'land-price-line'], layers.landPrice)
    setVisibility(
      map,
      ['school-fill', 'school-line', 'school-facilities-circles', 'cultural-facilities-circles'],
      layers.school
    )
    Object.values(CAR_LAYER_CONFIG).forEach((config) => {
      setVisibility(
        map,
        [config.fillLayerId, config.roadLineLayerId, config.highwayFillLayerId, config.highwayLineLayerId],
        layers[config.visibleKey]
      )
    })
    setVisibility(
      map,
      ['car-overlap-triple-line'],
      Object.values(CAR_LAYER_CONFIG).some((config) => layers[config.visibleKey])
    )
    setVisibility(map, ['meitetsu-circles', 'meitetsu-walk-fill', 'meitetsu-walk-line'], layers.toyohashiAccess)
    setVisibility(
      map,
      ['mikawa-anjo-shinkansen-walk-fill', 'mikawa-anjo-shinkansen-walk-line'],
      layers.mikawaAnjoShinkansen
    )
    setVisibility(
      map,
      ['meitetsu-nagoya-circles', 'meitetsu-nagoya-walk-fill', 'meitetsu-nagoya-walk-line'],
      layers.nagoyaAccess
    )
    setVisibility(
      map,
      ['jr-nagoya-circles', 'jr-nagoya-walk-fill', 'jr-nagoya-walk-line'],
      layers.nagoyaAccess
    )
    setVisibility(
      map,
      ['jr-toyohashi-circles', 'jr-toyohashi-walk-fill', 'jr-toyohashi-walk-line'],
      layers.toyohashiAccess
    )
    setVisibility(
      map,
      ['subway-nagoya-circles', 'subway-nagoya-walk-fill', 'subway-nagoya-walk-line'],
      layers.nagoyaAccess
    )
    setVisibility(
      map,
      ['aichiloop-toyota-circles', 'aichiloop-toyota-walk-fill', 'aichiloop-toyota-walk-line'],
      layers.toyotaRailAccess
    )
    HAZARD_RASTER_LAYERS.forEach(({ key, layerId }) => {
      setVisibility(map, [layerId], layers[key])
    })
    setVisibility(map, ['intersection-fill', 'intersection-line'], layers.intersection)
  }, [carOverlapFeatures, intersectionData, layers, mapReady, styleLoaded])

  return (
    <div className="maplibre-shell">
      <div
        ref={mapNodeRef}
        className="maplibre-map"
        data-darkreader-ignore="true"
        data-darkreader-inline-bgcolor=""
        data-darkreader-inline-color=""
      />
      {mapSnapshotUrl && (
        <img
          className={`maplibre-transition ${isBaseMapTransitioning ? 'active' : ''}`}
          src={mapSnapshotUrl}
          alt=""
          aria-hidden="true"
        />
      )}
    </div>
  )
}
