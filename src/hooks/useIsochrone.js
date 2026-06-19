import { useState, useCallback } from 'react'
import axios from 'axios'

const ORS_BASE = 'https://api.openrouteservice.org/v2/isochrones/driving-car'
const ISOCHRONE_CACHE_TTL_MS = 1000 * 60 * 60 * 12
const ISOCHRONE_CACHE_VERSION = 'v3-routing-mode-no-smoothing'

function getIsochroneCacheKey(location, rangeSeconds, id, routeMode) {
  const lat = Number(location.lat).toFixed(6)
  const lng = Number(location.lng).toFixed(6)
  return `isochrone:${ISOCHRONE_CACHE_VERSION}:${routeMode}:${id}:${lat}:${lng}:${rangeSeconds}`
}

function readIsochroneCache(cacheKey) {
  try {
    const raw = window.localStorage.getItem(cacheKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.savedAt || !parsed?.data) return null
    if (Date.now() - parsed.savedAt > ISOCHRONE_CACHE_TTL_MS) {
      window.localStorage.removeItem(cacheKey)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

function writeIsochroneCache(cacheKey, data) {
  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    )
  } catch {
    // localStorage 容量超過などは無視して通信結果だけ使う
  }
}

/**
 * OpenRouteService の等時間圏（isochrone）を取得するフック
 * 現在は MapView.jsx の MapLibre 描画から利用している。
 *
 * @param {string} apiKey - ORS APIキー（VITE_ORS_API_KEY）
 * @returns {{ isochroneData, loading, error, fetchIsochrone }}
 *
 * 使い方:
 *   const { isochroneData, loading, fetchIsochrone } = useIsochrone(apiKey)
 *   fetchIsochrone({ lng, lat }, 2400) // 2400秒 = 40分
 */
export function useIsochrone(apiKey) {
  const [isochroneData, setIsochroneData] = useState({})
  const [loading, setLoading] = useState({})
  const [error, setError]     = useState({})

  const fetchIsochrone = useCallback(
    async (location, rangeSeconds, id, options = {}) => {
      if (!apiKey) {
        console.warn('[useIsochrone] ORS APIキーが設定されていません。.env.local に VITE_ORS_API_KEY を設定してください。')
        return null
      }

      const avoidHighways = options.avoidHighways ?? true
      const routeMode = avoidHighways ? 'no-highways' : 'with-highways'
      const cacheKey = getIsochroneCacheKey(location, rangeSeconds, id, routeMode)
      const cached = readIsochroneCache(cacheKey)
      if (cached) {
        setIsochroneData(prev => ({ ...prev, [id]: cached }))
        setLoading(prev => ({ ...prev, [id]: false }))
        setError(prev => ({ ...prev, [id]: null }))
        return cached
      }

      setLoading(prev => ({ ...prev, [id]: true }))
      setError(prev => ({ ...prev, [id]: null }))

      try {
        const res = await axios.post(
          ORS_BASE,
          {
            locations: [[location.lng, location.lat]],
            range: [rangeSeconds],
            range_type: 'time',
            smoothing: 0,
            ...(avoidHighways
              ? {
                  options: {
                    avoid_features: ['highways'],
                  },
                }
              : {}),
          },
          {
            headers: {
              Authorization: apiKey,
              'Content-Type': 'application/json',
            },
          }
        )
        setIsochroneData(prev => ({ ...prev, [id]: res.data }))
        writeIsochroneCache(cacheKey, res.data)
        return res.data
      } catch (e) {
        const msg = e?.response?.data?.error?.message ?? e.message
        console.error('[useIsochrone] エラー:', msg)
        setError(prev => ({ ...prev, [id]: msg }))
        return null
      } finally {
        setLoading(prev => ({ ...prev, [id]: false }))
      }
    },
    [apiKey]
  )

  return { isochroneData, loading, error, fetchIsochrone }
}
