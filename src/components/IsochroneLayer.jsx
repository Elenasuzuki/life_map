import { useEffect, useState } from 'react'
import { GeoJSON, Circle, Tooltip } from 'react-leaflet'
import { useIsochrone } from '../hooks/useIsochrone'
import { WORKPLACES } from '../data/locations'

// 旧 react-leaflet ベースの等時間圏レイヤー実装。
// 2026-04 時点の本番描画では未使用で、現行の表示は MapView.jsx 内の MapLibre 実装が担う。

const DRIVE_MINUTES = 40
const DRIVE_SECONDS = DRIVE_MINUTES * 60

// APIなし時のフォールバック: 直線距離で近似（車40分 ≈ 半径約20km）
// ※ 実際の道路形状とは大きく異なるため参考値
const APPROX_RADIUS_M = 20000

const COLORS = ['#ff6b35', '#ff9900']

export default function IsochroneLayer({ apiKey }) {
  const { isochroneData, loading, error, fetchIsochrone } = useIsochrone(apiKey)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!fetched) {
      setFetched(true)
      WORKPLACES.forEach(w => {
        fetchIsochrone({ lat: w.lat, lng: w.lng }, DRIVE_SECONDS, w.id)
      })
    }
  }, [fetched, fetchIsochrone])

  return (
    <>
      {WORKPLACES.map((w, idx) => {
        const hasData = isochroneData[w.id]
        const isLoading = loading[w.id]
        const hasError = error[w.id]

        // ORS データが取得できた場合
        if (hasData) {
          return (
            <GeoJSON
              key={`iso_${w.id}`}
              data={hasData}
              style={{
                color: COLORS[idx % COLORS.length],
                fillColor: COLORS[idx % COLORS.length],
                fillOpacity: 0.15,
                weight: 2,
              }}
              onEachFeature={(_, layer) => {
                layer.bindTooltip(`${w.name}から車${DRIVE_MINUTES}分圏`, { sticky: true })
              }}
            />
          )
        }

        // APIキーなし or エラー時: 近似円を表示
        return (
          <Circle
            key={`iso_approx_${w.id}`}
            center={[w.lat, w.lng]}
            radius={APPROX_RADIUS_M}
            pathOptions={{
              color: COLORS[idx % COLORS.length],
              fillColor: COLORS[idx % COLORS.length],
              fillOpacity: 0.10,
              weight: 2,
              dashArray: '8 4',
            }}
          >
            <Tooltip sticky>
              {isLoading
                ? `${w.name}: 等時間圏を取得中...`
                : hasError
                  ? `${w.name}: 近似円表示（ORS APIキー未設定）`
                  : `${w.name}から車${DRIVE_MINUTES}分圏（近似円）`}
            </Tooltip>
          </Circle>
        )
      })}
    </>
  )
}
