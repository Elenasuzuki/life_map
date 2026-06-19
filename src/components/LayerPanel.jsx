import { useState, useRef } from 'react'
import './LayerPanel.css'

function parseCoords(text) {
  const m = text.match(/^\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)\s*$/)
  if (!m) return null
  const a = parseFloat(m[1])
  const b = parseFloat(m[2])
  // latitude is between -90 and 90
  if (a >= -90 && a <= 90 && b >= -180 && b <= 180) return { lat: a, lng: b }
  if (b >= -90 && b <= 90 && a >= -180 && a <= 180) return { lat: b, lng: a }
  return null
}

async function geocodeAddress(text) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1&accept-language=ja`
  const res = await fetch(url, { headers: { 'Accept-Language': 'ja' } })
  if (!res.ok) throw new Error('geocode failed')
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name }
}

function SearchBox({ onSearchPin }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    const text = query.trim()
    if (!text) return

    const coords = parseCoords(text)
    if (coords) {
      onSearchPin({ ...coords, label: text })
      setStatus('ピンを立てました')
      return
    }

    setLoading(true)
    setStatus('検索中...')
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      const result = await geocodeAddress(text)
      if (!result) {
        setStatus('住所が見つかりませんでした')
      } else {
        onSearchPin(result)
        setStatus('ピンを立てました')
      }
    } catch {
      setStatus('検索に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setStatus('')
    onSearchPin(null)
  }

  return (
    <div className="search-box">
      <p className="section-title">住所・座標検索</p>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="text"
          placeholder="住所または 緯度,経度"
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
        />
        <div className="search-actions">
          <button className="search-btn" type="submit" disabled={loading || !query.trim()}>
            {loading ? '…' : '検索'}
          </button>
          {(query || status) && (
            <button className="search-clear-btn" type="button" onClick={handleClear}>✕</button>
          )}
        </div>
      </form>
      {status && <p className="search-status">{status}</p>}
    </div>
  )
}

function getLegendConfig(driveMinutes) {
  return {
  school: {
    title: '学区レイヤー凡例',
    items: [
      { color: '#8d6e63', label: '小学校区の境界線' },
      { color: '#6d4c41', label: '中学校区の境界線' },
      { color: '#bc8f6f', label: '小学校スポット' },
      { color: '#9c6b4f', label: '中学校スポット' },
      { color: '#7b4f36', label: '高等学校スポット' },
      { color: '#5d3422', label: '大学スポット' },
      { color: '#546e7a', label: '文化施設スポット' },
    ],
    note: '学区境界は国土数値情報 A27、学校ポイントは P29、文化施設ポイントは P27 を使用。スポットはズーム11以上で表示されます。',
  },
  carToyotaHq: {
    title: '車アクセス圏: トヨタ本社',
    items: [
      { color: '#2f7de1', label: `高速回避${driveMinutes}分圏の塗り` },
      { color: '#2f7de1', label: `高速道路あり${driveMinutes}分圏の点線` },
    ],
    note: 'ORS isochrone を使用。下道寄りは高速回避、高速ありは通常経路です。2つの塗りが重なる部分は濃く見えます。',
  },
  carShimoyama: {
    title: '車アクセス圏: 下山TC',
    items: [
      { color: '#00a6b8', label: `高速回避${driveMinutes}分圏の塗り` },
      { color: '#00a6b8', label: `高速道路あり${driveMinutes}分圏の点線` },
    ],
    note: 'ORS isochrone を使用。下道寄りは高速回避、高速ありは通常経路です。2つの塗りが重なる部分は濃く見えます。',
  },
  carShotaHome: {
    title: '車アクセス圏: 昭太実家',
    items: [
      { color: '#6b5cff', label: `高速回避${driveMinutes}分圏の塗り` },
      { color: '#6b5cff', label: `高速道路あり${driveMinutes}分圏の点線` },
    ],
    note: 'ORS isochrone を使用。下道寄りは高速回避、高速ありは通常経路です。2つの塗りが重なる部分は濃く見えます。',
  },
  mikawaAnjoShinkansen: {
    title: '三河安城駅徒歩15分圏 凡例',
    items: [
      { color: '#f39c34', label: '三河安城駅の新幹線アイコン' },
      { color: '#f39c34', label: '徒歩15分圏' },
    ],
    note: '三河安城駅を起点にした概算徒歩15分圏です。',
  },
  nagoyaAccess: {
    title: '名古屋30分圏 凡例',
    items: [
      { color: '#9ccc65', label: '名古屋30分圏の駅ポイント' },
      { color: '#8bc34a', label: '徒歩15分圏' },
    ],
    note: '名鉄・JR・地下鉄で名古屋へ30分以内の駅を統合表示しています。スポットは駅、円は徒歩15分圏です。',
  },
  toyohashiAccess: {
    title: '豊橋30分圏 凡例',
    items: [
      { color: '#60bdd8', label: '豊橋30分圏の駅ポイント' },
      { color: '#74cdee', label: '徒歩15分圏' },
    ],
    note: '名鉄・JRで豊橋へ30分以内の駅を統合表示しています。スポットは駅、円は徒歩15分圏です。',
  },
  toyotaRailAccess: {
    title: '三河豊田40分圏 凡例',
    items: [
      { color: '#ff7043', label: '三河豊田40分圏の駅ポイント' },
      { color: '#ff7043', label: '徒歩15分圏（1km近似）' },
    ],
    note: '愛知環状鉄道（全駅）および名鉄豊田線（新豊田/豊田市駅乗換）で三河豊田駅から40分以内の駅を表示。徒歩圏は事前計算イソクロン（未整備駅は1km近似円）です。JR中央線（高蔵寺乗換）は名古屋30分圏レイヤーと重複するため除外。',
  },
  intersection: {
    title: '条件交差エリア 凡例',
    items: [
      { color: '#fbbf24', label: '鉄道アクセス圏 × 車アクセス圏の重なり' },
    ],
    note: 'ONにした鉄道レイヤー（名古屋圏・豊橋圏・三河安城）の徒歩15分圏 と、ONにした車アクセス圏（下道寄り）の重なり部分を交差させて表示します。車アクセス圏が複数ONの場合はその重複エリアのみが対象になります（2拠点なら2圏の共通部分、3拠点なら3圏の共通部分）。ORS APIキーが未設定の場合は表示されません。',
  },
  floodL2: {
    title: '洪水浸水想定区域（最大規模）凡例',
    items: [
      { color: '#f7f5a9', label: '0.1〜0.5m（床下浸水レベル）' },
      { color: '#ffd8c0', label: '0.5〜3m（1階がほぼ水没）' },
      { color: '#ffb7b7', label: '3〜5m（2階まで水没）' },
      { color: '#ff9191', label: '5〜10m（2階が水没）' },
      { color: '#f285c9', label: '10〜20m' },
      { color: '#dc7adc', label: '20m以上' },
    ],
    note: '出典: 国土交通省 重ねるハザードマップ（最大規模降雨を想定）',
  },
  tsunami: {
    title: '津波浸水想定 凡例',
    items: [
      { color: '#f7f5a9', label: '0.1〜0.5m' },
      { color: '#ffd8c0', label: '0.5〜3m' },
      { color: '#ffb7b7', label: '3〜5m' },
      { color: '#ff9191', label: '5〜10m' },
      { color: '#f285c9', label: '10〜20m' },
      { color: '#dc7adc', label: '20m以上' },
    ],
    note: '出典: 国土交通省 重ねるハザードマップ（洪水と同じ凡例を使用）',
  },
  landPrice: {
    title: '地価（住宅地 ¥/m²）凡例',
    items: [
      { color: '#fffde7', label: '〜5万円/m²' },
      { color: '#fff176', label: '5〜8万円/m²' },
      { color: '#ffca28', label: '8〜12万円/m²' },
      { color: '#ffa000', label: '12〜16万円/m²' },
      { color: '#e65100', label: '16〜25万円/m²' },
      { color: '#c62828', label: '25〜50万円/m²' },
      { color: '#7b1fa2', label: '50万円/m² 以上（都市中心部）' },
    ],
    note: '国土数値情報 L01 地価公示（2024年）の住宅地公示地点をボロノイ分割で表示。各領域が最近傍の公示地点の価格を示します。',
  },
  terrain: {
    title: '地形分類（治水地形分類図）凡例',
    items: [
      // ── 山地・台地 ──
      {
        pattern: 'repeating-linear-gradient(45deg, #9b8060 0, #9b8060 2px, #f0ece0 2px, #f0ece0 9px)',
        label: '山地・丘陵地（斜線パターン）',
      },
      {
        pattern: 'repeating-linear-gradient(45deg, #b06020 0, #b06020 2px, #f5dfc0 2px, #f5dfc0 9px)',
        label: '崖・段丘崖（斜線パターン）',
      },
      {
        pattern: 'repeating-linear-gradient(0deg, #a0b8b0 0, #a0b8b0 1.5px, #e8f0ee 1.5px, #e8f0ee 6px)',
        label: '浅い谷（横線パターン）',
      },
      { color: '#e89050', label: '台地・段丘面' },
      { color: '#c87028', label: '山麓堆積地形' },
      // ── 低地（洪水リスク注意）──
      { color: '#f0c840', label: '扇状地' },
      { color: '#c8d870', label: '氾濫平野' },
      { color: '#90c0d8', label: '後背湿地' },
      { color: '#f0e020', label: '微高地（自然堤防）' },
      { color: '#c0a8d8', label: '旧河道（明瞭）' },
      {
        pattern: 'repeating-linear-gradient(45deg, #c0a8d8 0, #c0a8d8 2px, #ede8f5 2px, #ede8f5 9px)',
        label: '旧河道（不明瞭・斜線）',
      },
      { color: '#f0e8c0', label: '砂州・砂丘' },
      // ── 人工改変地形 ──
      { color: '#90b8d0', label: '干拓地' },
      { color: '#d8a8c0', label: '盛土地・埋立地' },
      {
        pattern: 'repeating-linear-gradient(0deg, #a0a0a0 0, #a0a0a0 1.5px, #e8e8e8 1.5px, #e8e8e8 6px)',
        label: '切土地（横線パターン）',
      },
      // ── 水域・その他 ──
      {
        pattern: 'repeating-linear-gradient(45deg, #4090c8 0, #4090c8 2px, #c8e0f0 2px, #c8e0f0 9px)',
        label: '天井川の区間・旧流路（斜線）',
      },
      { color: '#5890b8', label: '現河道・水面' },
    ],
    note: '2データ重ね合わせ: 治水地形分類図（lcmfc2, ズーム11以上）＋ 数値地図25000土地条件（lcm25k_2012, ズーム10以上）。lcmfc2は河川管理区域の詳細版、lcm25k_2012が未整備エリアを補完。出典: 国土地理院',
  },
  }
}

const BASEMAP_OPTIONS = [
  {
    key: 'blank',
    label: '白地図',
    description: '境界線だけでかなりシンプル',
  },
  {
    key: 'pale',
    label: '淡色',
    description: '情報を重ねても見やすい',
  },
  {
    key: 'std',
    label: '標準',
    description: '道路や地名を詳しく確認',
  },
]

const LAYER_CONFIG = [
  {
    key: 'school',
    label: '学区境界',
    sublabel: 'A27学区 + 学校/文化施設ポイント',
    color: '#4caf50',
    icon: '🏫',
  },
  {
    key: 'carToyotaHq',
    label: '車アクセス圏: トヨタ本社',
    sublabel: 'トヨタ本社 + 実時間ベース45分圏（ORS）',
    color: '#2f7de1',
    icon: '🏭',
  },
  {
    key: 'carShimoyama',
    label: '車アクセス圏: 下山TC',
    sublabel: '下山TC + 実時間ベース45分圏（ORS）',
    color: '#00a6b8',
    icon: '🏭',
  },
  {
    key: 'carShotaHome',
    label: '車アクセス圏: 昭太実家',
    sublabel: '昭太実家 + 実時間ベース45分圏（ORS）',
    color: '#6b5cff',
    icon: '🏠',
  },
  {
    key: 'mikawaAnjoShinkansen',
    label: '三河安城駅徒歩15分圏',
    sublabel: '東海道新幹線 三河安城駅 ＋ 徒歩圏',
    color: '#f39c34',
    icon: '🚄',
  },
  {
    key: 'nagoyaAccess',
    label: '名古屋30分圏 + 徒歩15分圏',
    sublabel: '名鉄・JR・地下鉄で名古屋へ30分以内の駅 ＋ 徒歩圏',
    color: '#8bc34a',
    icon: '🚉',
  },
  {
    key: 'toyohashiAccess',
    label: '豊橋30分圏 + 徒歩15分圏',
    sublabel: '名鉄・JRで豊橋へ30分以内の駅 ＋ 徒歩圏',
    color: '#74cdee',
    icon: '🚃',
  },
  {
    key: 'toyotaRailAccess',
    label: '三河豊田40分圏 + 徒歩15分圏',
    sublabel: '愛知環状鉄道・名鉄豊田線で三河豊田から40分以内の駅 ＋ 徒歩圏',
    color: '#ff7043',
    icon: '🚃',
  },
  {
    key: 'intersection',
    label: '条件交差エリア',
    sublabel: '鉄道アクセス圏 × 車アクセス圏の重なり（要ORS APIキー）',
    color: '#fbbf24',
    icon: '⭐',
    sectionBefore: '交差分析',
  },
  {
    key: 'landPrice',
    label: '地価（住宅地 ¥/m²）',
    sublabel: '市区町村別平均公示価格（国土数値情報 L01）',
    color: '#e65100',
    icon: '🏷️',
    sectionBefore: '地価情報',
  },
  {
    key: 'floodL2',
    label: '洪水浸水想定区域（想定最大規模）',
    sublabel: '重ねるハザードマップ（国土交通省）',
    color: '#c62828',
    icon: '🌊',
    sectionBefore: 'ハザード情報',
  },
  {
    key: 'tsunami',
    label: '津波浸水想定',
    sublabel: '重ねるハザードマップ（国土交通省）',
    color: '#1565c0',
    icon: '🌊',
  },
  {
    key: 'terrain',
    label: '地形分類（治水地形分類図）',
    sublabel: '地理院タイル（重ねるハザードマップ同等・ズーム10以上で表示）',
    color: '#6d4c41',
    icon: '🗾',
  },
]

export default function LayerPanel({
  layers,
  baseMap,
  driveMinutes,
  onBaseMapChange,
  onDriveMinutesChange,
  onBulkDisplayLayersChange,
  onToggle,
  panelOpen,
  onClose,
  onSearchPin,
}) {
  const [openLegend, setOpenLegend] = useState(null)
  const legends = getLegendConfig(driveMinutes)
  const layerConfig = LAYER_CONFIG.map((item) => {
    if (item.key === 'carToyotaHq') {
      return { ...item, sublabel: `トヨタ本社 + 実時間ベース${driveMinutes}分圏（ORS）` }
    }
    if (item.key === 'carShimoyama') {
      return { ...item, sublabel: `下山TC + 実時間ベース${driveMinutes}分圏（ORS）` }
    }
    if (item.key === 'carShotaHome') {
      return { ...item, sublabel: `昭太実家 + 実時間ベース${driveMinutes}分圏（ORS）` }
    }
    return item
  })

  const handleLegendToggle = (key, e) => {
    e.stopPropagation()
    setOpenLegend(prev => (prev === key ? null : key))
  }

  return (
    <aside className={`layer-panel${panelOpen ? ' panel-open' : ''}`}>
      <div className="panel-header">
        <h2 className="panel-title">住まい探しマップ</h2>
        <button className="panel-close-btn" onClick={onClose} aria-label="閉じる">✕</button>
      </div>
      <p className="panel-subtitle">背景地図とレイヤー表示を切替</p>

      <SearchBox onSearchPin={onSearchPin} />

      <div className="basemap-section">
        <p className="section-title">背景地図</p>
        <div className="basemap-options">
          {BASEMAP_OPTIONS.map(({ key, label, description }) => (
            <button
              key={key}
              type="button"
              className={`basemap-button ${baseMap === key ? 'active' : ''}`}
              onClick={() => onBaseMapChange(key)}
            >
              <span className="basemap-label">{label}</span>
              <span className="basemap-description">{description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="layer-toolbar">
        <p className="section-title">表示レイヤー</p>
        <div className="layer-toolbar-actions">
          <button
            type="button"
            className="layer-bulk-button"
            onClick={() => onBulkDisplayLayersChange(true)}
          >
            一括ON
          </button>
          <button
            type="button"
            className="layer-bulk-button"
            onClick={() => onBulkDisplayLayersChange(false)}
          >
            一括OFF
          </button>
        </div>
      </div>
      <ul className="layer-list">
        {layerConfig.flatMap(({ key, label, sublabel, color, icon, sectionBefore }) => {
          const items = []
          if (sectionBefore) {
            items.push(
              <li key={`section-${key}`} className="layer-section-header">
                <p className="section-title" style={{ margin: '8px 0 4px' }}>{sectionBefore}</p>
              </li>
            )
          }
          const legend = legends[key]
          items.push(
            <li
              key={key}
              className={`layer-item ${layers[key] ? 'active' : ''}`}
              onClick={() => onToggle(key)}
            >
              <span
                className="layer-dot"
                style={{ background: color, opacity: layers[key] ? 1 : 0.3 }}
              />
              <label className="layer-label">
                <span className="layer-icon">{icon}</span>
                <span>
                  <span className="layer-name">{label}</span>
                  <span className="layer-sub">{sublabel}</span>
                </span>
              </label>
              {legend && (
                <button
                  className={`legend-btn ${openLegend === key ? 'open' : ''}`}
                  onClick={e => handleLegendToggle(key, e)}
                >
                  凡例
                </button>
              )}
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => onToggle(key)}
                onClick={e => e.stopPropagation()}
              />
            </li>
          )
          if (legend && openLegend === key) {
            items.push(
              <li key={`legend-${key}`} className="hazard-legend-panel">
                <p className="hazard-legend-title">{legend.title}</p>
                <div className="hazard-legend-rows">
                  {legend.items.map(({ color: swatchColor, pattern, label: swatchLabel }) => {
                    const bg = pattern ?? swatchColor
                    return (
                      <div key={swatchLabel} className="hazard-legend-row">
                        <span
                          className="hazard-legend-swatch"
                          style={{ background: bg, '--swatch-bg': bg }}
                        />
                        <span>{swatchLabel}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="hazard-legend-note">{legend.note}</p>
              </li>
            )
          }
          return items
        })}
      </ul>

      <div className="drive-section">
        <div className="drive-header">
          <p className="drive-title">車アクセス時間</p>
          <span className="drive-value">{driveMinutes}分</span>
        </div>
        <div className="drive-buttons">
          {[30, 35, 40, 45, 50, 55, 60].map(min => (
            <button
              key={min}
              className={`drive-btn${driveMinutes === min ? ' active' : ''}`}
              onClick={() => onDriveMinutesChange(min)}
            >
              {min}
            </button>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="legend">
        <p className="legend-title">凡例（名鉄沿線）</p>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: '#9c27b0' }} />
          <span>豊橋から直通30分以内の駅</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: '#8bc34a' }} />
          <span>名古屋へ30分以内の駅（名鉄・JR・地下鉄）</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: '#74cdee' }} />
          <span>豊橋へ30分以内の駅（名鉄・JR）</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: '#888' }} />
          <span>30分超の駅</span>
        </div>
        <div className="legend-row">
          <span className="legend-circle" style={{ borderColor: '#74cdee' }} />
          <span>豊橋30分圏の徒歩15分圏</span>
        </div>
        <div className="legend-row">
          <span className="legend-circle" style={{ borderColor: '#8bc34a' }} />
          <span>名古屋30分圏の徒歩15分圏</span>
        </div>
      </div>

      <div className="data-note">
        <p>🔧 <strong>実データ置換ガイド</strong></p>
        <ul>
          <li>学区: 国土数値情報 A27（2023年版）をGeoJSON化済み</li>
          <li>ハザード: 現在の洪水レイヤーは精度見直しのため一時停止中</li>
          <li>車アクセス圏: 拠点ごとに個別トグル。ORS APIキー設定時のみ実時間ベース{driveMinutes}分圏を取得</li>
        </ul>
      </div>
    </aside>
  )
}
