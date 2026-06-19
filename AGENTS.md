# 住まい探しマップ — コーディングエージェント引き継ぎドキュメント

## プロジェクト概要

愛知県の住宅検討向けインタラクティブ地図アプリ。  
以下の条件を1枚の地図で比較しやすくすることが主目的。

| 人物 | 条件 |
|---|---|
| **妻** | 新幹線で東京通勤。名古屋駅・三河安城駅への徒歩圏か駅近が理想 |
| **夫** | トヨタ本社または下山TCへ車通勤（下道寄り40分圏） |
| **子** | 近隣の公立小中学校。学区境界と評判を地図で確認したい |

> **「名古屋」の定義**: このアプリにおける「名古屋30分圏」の名古屋は **新幹線名古屋駅（JR東海）** を指す。  
> 名鉄豊田線など、地下鉄鶴舞線経由で丸の内・伏見にアクセスできる路線は、新幹線名古屋駅への乗換が必要なため対象外。

実装は React + Vite。地図は `MapLibre GL JS` を使い、背景地図は地理院地図Vectorの `style.json` を読み込む。

## 現在の実装方針

- 背景地図: `pale / std / blank` の3種類を切替
- 地図本体: [src/components/MapView.jsx](src/components/MapView.jsx) に描画ロジックが集約
- UI: [src/components/LayerPanel.jsx](src/components/LayerPanel.jsx) が左パネルを担当
- 状態管理: [src/App.jsx](src/App.jsx) で `layers`・`baseMap`・`driveMinutes`（30〜60分、デフォルト45分、localStorage永続化）を保持
- 等時間圏: [src/hooks/useIsochrone.js](src/hooks/useIsochrone.js) で ORS API を呼ぶ（車アクセス圏のみ）
- 旧実装: `IsochroneLayer.jsx` と `react-leaflet` 系依存は残っているが未使用

## ディレクトリ構成

```txt
住宅探し/
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── MapView.jsx
│   │   ├── LayerPanel.jsx
│   │   ├── LayerPanel.css
│   │   └── IsochroneLayer.jsx       （未使用）
│   ├── data/
│   │   ├── locations.js             車アクセス圏起点・新幹線駅
│   │   ├── meitetsu.js              名鉄名古屋本線
│   │   ├── jrNagoya.js              JR名古屋30分圏（東海道本線 + 中央線）
│   │   ├── jrToyohashi.js           JR豊橋30分圏
│   │   ├── nagoyaSubway.js          地下鉄名古屋30分圏
│   │   └── aichiLoopToyota.js       三河豊田40分圏（愛知環状鉄道・名鉄豊田線・名鉄名古屋本線）
│   └── hooks/
│       └── useIsochrone.js
├── public/data/
│   ├── school_districts.geojson     学区境界（A27 2023年版）
│   ├── school_facilities.geojson    学校ポイント（P29）
│   ├── cultural_facilities.geojson  文化施設ポイント（P27）
│   ├── walk_isochrones.geojson      徒歩15分圏（ORS、110 駅分）
│   ├── land_price.geojson           地価ボロノイ（L01 住宅地、1882 地点）
│   └── flood_hazard.geojson         旧洪水データ（現行未使用）
└── scripts/
    ├── generate_walk_isochrones.py  徒歩圏 GeoJSON 生成
    ├── generate_land_price.py       地価ボロノイ GeoJSON 生成
    ├── convert_school.py            学区 GML → GeoJSON
    ├── convert_public_facilities.py 学校・文化施設 GML → GeoJSON
    ├── convert_flood.py             洪水 GML → GeoJSON（現行未使用）
    ├── data/                        L01・N03 元データ（Git 管理外）
    │   ├── L01-24_23_GML/           地価公示 GML（愛知県 2024年版）
    │   └── N03-20240101_23_GML/     行政区域 GML（愛知県 2024年版）
    └── DATA_GUIDE.md                データ取得・変換手順
```

## 起動方法

```bash
source ~/.nvm/nvm.sh
npm run dev
```

## 現在のレイヤー一覧

| key | データソース | 内容 |
|---|---|---|
| `school` | `school_districts.geojson` + `school_facilities.geojson` + `cultural_facilities.geojson` | 学区境界 + 学校/文化施設ポイント |
| `carToyotaHq` | `locations.js` + `useIsochrone.js` | トヨタ本社 車アクセス圏 |
| `carShimoyama` | `locations.js` + `useIsochrone.js` | 下山TC 車アクセス圏 |
| `carShotaHome` | `locations.js` + `useIsochrone.js` | 昭太実家 車アクセス圏 |
| `mikawaAnjoShinkansen` | `locations.js` + `walk_isochrones.geojson` | 三河安城駅 + 徒歩15分圏 |
| `toyohashiAccess` | `meitetsu.js` + `jrToyohashi.js` + `walk_isochrones.geojson` | 豊橋30分圏（名鉄+JR）+ 徒歩圏 |
| `nagoyaAccess` | `meitetsu.js` + `jrNagoya.js` + `nagoyaSubway.js` + `walk_isochrones.geojson` | 名古屋30分圏（名鉄+JR+地下鉄）+ 徒歩圏 |
| `toyotaRailAccess` | `aichiLoopToyota.js` + `walk_isochrones.geojson` | 三河豊田40分圏（愛知環状鉄道全駅・名鉄豊田線・名鉄名古屋本線中岡崎乗換）+ 徒歩圏 |
| `intersection` | 車アクセス圏ポリゴンの重なり計算 | 複数アクセス圏の重複エリア強調境界線 |
| `landPrice` | `land_price.geojson` | 地価ボロノイ（住宅地 ¥/m²、7段階） |
| `floodL2` | disaportal raster タイル | 洪水浸水想定（想定最大規模） |
| `tsunami` | disaportal raster タイル | 津波浸水想定 |
| `terrain` | `lcmfc2` + `lcm25k_2012` raster タイル | 地形分類（カバレッジに制限あり） |

補足:
- `名古屋駅 / 豊橋駅` の新幹線アイコンは常時表示（レイヤートグル外）
- `三河安城駅` は `mikawaAnjoShinkansen` トグル配下
- すべての主要レイヤーに LayerPanel 上の開閉式凡例あり
- 名古屋30分圏は現在 `黄緑系` の配色

## 背景地図

| key | style | 備考 |
|---|---|---|
| `pale` | `pale.json` | デフォルト |
| `std` | `std.json` | 詳細確認向け |
| `blank` | `blank.json` | 白地図 |

実装ポイント:
- 背景地図は `map.setStyle(...)` で切替
- style JSON は起動時に先読みして `styleCacheRef` へ保持
- 切替時の黒抜け軽減のため、スナップショットオーバーレイと `app-background` を併用
- `localStorage` キーは `housing-map-basemap-v2`

## データ詳細

### 学区

- ファイル: `public/data/school_districts.geojson`
- ソース: 国土数値情報 A27 2023年版
- 表示: 塗り + 破線境界 + 学校/文化施設ポイント
- ポリゴン自体はポップアップなし。スポットクリック時のみポップアップ
- 境界線は `line-width` をズーム連動で調整

### 学校・文化施設ポイント

- ファイル: `school_facilities.geojson` / `cultural_facilities.geojson`
- 生成: `scripts/convert_public_facilities.py`
- ソース: 国土数値情報 P29（学校）/ P27（文化施設）
- `minzoom: 11` で表示。広域では非表示（正常）

### 名鉄

- ファイル: `src/data/meitetsu.js`
- 内容: 名鉄名古屋本線の駅データ
- 判定: `豊橋直通30分圏`（directFromToyohashi）と `名鉄名古屋直通30分圏`（directFromNagoya）
- 座標: 名鉄公式所在地 → 地理院ジオコーダで point 化

### 新幹線

- ファイル: `src/data/locations.js`
- 駅: `名古屋駅 / 三河安城駅 / 豊橋駅`
- `名古屋駅 / 豊橋駅`: DOM マーカーの `🚄` を常時表示
- `三河安城駅`: オレンジ `🚄` + `walk_isochrones.geojson` の徒歩15分圏

### JR

- ファイル: `src/data/jrNagoya.js` / `src/data/jrToyohashi.js`
- `jrNagoya.js`: JR東海道本線（名古屋〜安城）+ **JR中央線（名古屋〜高蔵寺）**
- `jrToyohashi.js`: JR東海道本線（豊橋方面）
- JR中央線を含める理由: 妻の新幹線通勤前提（名古屋=新幹線名古屋駅）で、春日井・神領・高蔵寺が「妻の名古屋アクセス圏」かつ「夫のトヨタ車通勤圏」の交差候補になるため

### 地下鉄

- ファイル: `src/data/nagoyaSubway.js`
- 内容: 名古屋へ直通または1回乗換で30分以内の地下鉄駅（60 駅）
- 座標: 地理院ジオコーダ基準 + 一部手補正。正本データではない点に注意

### 三河豊田40分圏（aichiLoopToyota.js）

- ファイル: `src/data/aichiLoopToyota.js`
- 内容: 三河豊田駅を起点に電車40分以内の駅（36駅）
- 路線と範囲:
  - 愛知環状鉄道（全23駅、北方向: 高蔵寺まで42分 / 南方向: 岡崎まで23分）
  - 名鉄豊田線（新豊田→豊田市 徒歩乗換、赤池まで38分）
  - 名鉄名古屋本線（中岡崎→岡崎公園前 徒歩乗換5分、知立まで38分）
- 乗換詳細:
  - 名鉄豊田線: 愛知環状・新豊田駅 ↔ 名鉄・豊田市駅（約5〜8分徒歩）
  - 名鉄名古屋本線: 愛知環状・中岡崎駅 ↔ 名鉄・岡崎公園前駅（約5分徒歩、出口共有）
- 座標: Wikipedia インフォボックス由来（DMS→十進変換）。補間値の駅は `accessNote` にコメントあり
- フィールド: `fastestMinutesFromMikawaTotyota`（ポップアップで表示）
- walk_isochrones.geojson との対応: 現時点では aichiLoopToyota 系 ID は GeoJSON に含まれないため全駅 1km 近似円にフォールバック

### 車アクセス圏

- ファイル: `src/data/locations.js` + `src/hooks/useIsochrone.js`
- 起点: `トヨタ本社 / トヨタテクニカルセンター下山 / 昭太実家`
- ORS `driving-car` isochrone、`smoothing: 0`
- 等時間圏の分数は `driveMinutes`（デフォルト45分、LayerPanel のスライダーで30〜60分に変更可）
- 高速回避版は `avoid_features: ['highways']`
- 高速道路あり版も別取得して同色の半透明塗り + 点線で重ねる
- `localStorage` に12時間キャッシュ（`housing-map-drive-minutes-v1` に分数も保存）
- 高速回避版の境界は同色の実線
- 3重なりだけ紺色の細い実線で強調（2重なり専用線はなし）
- APIキーなし時はポリゴン非表示、点のみ表示

補足:
- `avoid_features: ['highways']` は体感的な「完全な下道のみ」とは一致しない
- 都市部では高速道路あり版との差が小さく見えることがある

### 徒歩15分圏（walk_isochrones.geojson）

- ファイル: `public/data/walk_isochrones.geojson`
- 生成: `scripts/generate_walk_isochrones.py`
- 内容: 名鉄・JR・地下鉄・三河安城の対象駅 110 駅分の ORS `foot-walking` アイソクロン（900秒）
- プロパティ: `stationId`（駅ID）、`group`（どのレイヤー用か）
- MapView 側では `isoLookup`（stationId → geometry）で参照し、データがない駅は近似円にフォールバック
- 再生成: `.env.local` の `VITE_ORS_API_KEY` を使用。1バッチ5件、レートリミット対策にスリープあり

グループ対応表:

| group 値 | 使用レイヤー |
|---|---|
| `meitetsu-walk` | 名鉄 豊橋30分圏 |
| `meitetsu-nagoya-walk` | 名鉄 名古屋30分圏 |
| `jr-nagoya-walk` | JR 名古屋30分圏 |
| `jr-toyohashi-walk` | JR 豊橋30分圏 |
| `mikawa-anjo-shinkansen-walk` | 三河安城駅 |
| `subway-nagoya-walk` | 地下鉄 名古屋30分圏 |

### 地価ボロノイ（land_price.geojson）

- ファイル: `public/data/land_price.geojson`
- 生成: `scripts/generate_land_price.py`
- 元データ: `scripts/data/L01-24_23_GML/`（地価公示 2024年版）、`scripts/data/N03-20240101_23_GML/`（行政区域）
- 手順: L01 住宅地（L01_010=1）1882 地点を shapely `voronoi_diagram` でボロノイ分割 → 愛知県境界でクリップ → `scripts/data/N03-20240101_23_GML/` の境界から市区町村名を付与
- L01 カラム対応:
  - `L01_001`: 市区町村コード（5桁）
  - `L01_008`: 価格（¥/m²）
  - `L01_010`: 用途区分（1=住宅地, 4=商業地）
- N03 カラム対応:
  - `N03_004`: 市区町村名
  - `N03_005`: 区名（政令市の場合。名古屋市千種区 など）
  - `N03_007`: 行政区域コード（join key）
- GeoJSON プロパティ: `cityCode`, `cityName`, `price`（¥/m²）
- カラースケール（MapView.jsx の `step` 式）:

| 閾値 ¥/m² | 色 | 住宅探し的な感覚 |
|---|---|---|
| 〜50,000 | `#fffde7` | 農村・山間部 |
| 50,000 | `#fff176` | 郊外住宅地 |
| 80,000 | `#ffca28` | 一般郊外（安城・岡崎周辺） |
| 120,000 | `#ffa000` | 利便性高い郊外 |
| 160,000 | `#e65100` | 近郊住宅地 |
| 250,000 | `#c62828` | 名古屋市内 |
| 500,000 | `#7b1fa2` | 名古屋駅前等の中心市街地 |

注意点:
- 最大値 19,500,000 ¥/m²（名古屋駅前）等、商業用途が混在する高額地点が住宅地分類に含まれる場合がある
- 愛知県の住宅地価格中央値は約 112,000 ¥/m²（2024年公示）
- 元データ更新時は L01・N03 を再ダウンロードして `generate_land_price.py` を再実行

### ハザード情報（洪水・津波・地形分類）

実装は `MapView.jsx` の `HAZARD_RASTER_LAYERS` 定数にまとまっている。
`ensureRasterSource` / `ensureLayer` でスタイル再ロード後も再追加される。

#### 洪水浸水想定（floodL2）

- タイル: `https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png`
- maxzoom: 17、opacity: 0.75

#### 津波浸水想定（tsunami）

- タイル: `https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png`
- maxzoom: 17、opacity: 0.75

#### 地形分類（terrain）

2枚のタイルを重ねて表示する。

| レイヤー | ソース | zoom 範囲 | 役割 |
|---|---|---|---|
| 下層 | `lcm25k_2012` | 表示: 10-12、source maxzoom: 12 | 広域カバー |
| 上層 | `lcmfc2` | 表示: 10+、source maxzoom: 16 | 高解像度（河川管理区域のみ） |

- `raster-resampling: nearest`、`raster-fade-duration: 0` を指定
- 重ねるハザードマップ（disaportal）が使用する地形分類タイルは**非公開サーバーで配信されており外部から取得不可**（調査済み）

## MapView.jsx の現在の責務

主に以下を担当:

- 背景地図の初期化と切替（スナップショット・style 先読み含む）
- 学区 / 学校 / 文化施設 GeoJSON の読み込みと描画
- 徒歩圏 GeoJSON（`walk_isochrones.geojson`）の読み込みと `isoLookup` 構築
- 地価ボロノイ（`land_price.geojson`）の読み込みと choropleth 描画
- 名鉄 / JR / 地下鉄 / 職場の source/layer 生成
- 新幹線 DOM マーカーの生成
- ORS 車アクセス圏の表示（下道寄り / 高速道路あり 2系統）
- 車アクセス圏の重なり計算と境界線描画
- ポップアップ生成
- レイヤー visibility 制御

### useEffect の構造

**Effect A（レイヤー構築）**
deps: スタイル・データ系（`layers` を含まない）  
スタイルロード時・GeoJSON/isochrone データ到着時のみ実行。`ensureLayer` / `setSourceData` / マーカー DOM 生成 / イベントリスナー登録を担当。

**Effect B（visibility 制御）**
deps: `[carOverlapFeatures, layers, mapReady, styleLoaded]`  
レイヤートグル時のみ実行。`setVisibility` 全呼び出し・マーカー表示切替・car-overlap ソース更新を担当。

### モジュールスコープのユーティリティ関数

| 関数 | 役割 |
|---|---|
| `registerWalkZoneLayer(map, sourceId, data, color, fillOpacity, dasharray?)` | 徒歩圏の fill + line レイヤーを登録。6路線分で共通利用 |
| `createEmojiMarker(map, item, options)` | 職場・新幹線駅の絵文字マーカー DOM を生成して地図に追加 |
| `ensureLayer(map, layer)` | レイヤーが未登録の場合のみ `addLayer` |
| `setSourceData(map, id, data)` | ソースが存在すれば `setData`、なければ `addSource` |
| `setVisibility(map, layerIds, visible)` | 複数レイヤーの visibility を一括設定 |
| `ensureRasterSource(map, id, tiles, options?)` | ラスタータイルソースを idempotent に追加 |

## 既知の注意点

### 1. 背景地図は外部 style.json 依存
ネットワーク状況により切替ラグが出ることがある。style 先読みで体感は軽減済み。

### 2. ダークモード拡張の影響
MapLibre canvas にブラウザ拡張の強制配色が効くと背景が黒っぽく見えることがある。

### 3. 地下鉄駅座標の信頼性
駅ポイントは地理院ジオコーダの代表点。ベースマップの駅名位置とズレることがある。GTFS stops 等の正本データへの差し替えが望ましい。

### 4. 車アクセス圏は ORS 依存
APIキーなしではポリゴン非表示。`.env.local` で `VITE_ORS_API_KEY` を設定して使う前提。

### 5. ORS の高速回避には限界がある
`avoid_features: ['highways']` は「完全な下道のみ」を保証しない。
都市部では幹線道路ネットワークが残るため、高速道路あり版との差が小さく見えることがある。

### 6. 学校・文化施設ポイントは広域では非表示
`minzoom: 11` が設定されているため、広域ズームで見えないのは正常。

### 7. 地形分類のカバレッジ制限
`lcmfc2` は河川管理区域のみ整備されており、安城市中心部など一部エリアはズームインで白抜きになる。公開タイルで同等カバレッジを実現する方法は存在しないことが調査済み。

### 8. 地価の高額外れ値
名古屋駅前など、商業用途が混在するエリアが「住宅地（L01_010=1）」に含まれ、1000万円/m²超の値が出ることがある。カラースケールは 50万円/m² 以上を最濃色で統一しているため、視覚的には問題ない。

### 9. 依存関係は旧実装を含む
`leaflet` / `react-leaflet` は `package.json` に残っているが、主要描画は MapLibre。整理するなら未使用依存と旧コンポーネントの棚卸しが必要。

## 未完了タスク

| 優先度 | タスク | 備考 |
|---|---|---|
| 高 | 地下鉄駅座標の正本データ差し替え | GTFS stops 等の公式座標が見つかれば置換したい |
| 中 | 地価ボロノイの粒度改善 | 地価調査データ（都道府県調査）も追加して公示点を増やす |
| 中 | 車アクセス圏の重なり表現の磨き込み | 現状は線のみ。塗り強調も検討余地あり |
| 中 | 背景地図切替のさらなる安定化 | 外部 style 依存のため |
| 低 | `MapView.jsx` の責務分割 | useEffect 分割・ユーティリティ関数化は完了。残りは popup・basemap 制御の分離 |

## 環境変数

```txt
VITE_ORS_API_KEY=your_key
```

用途:
- 車アクセス圏の ORS isochrone 取得（ランタイム、キャッシュあり）
- 徒歩15分圏 GeoJSON の事前生成（`scripts/generate_walk_isochrones.py`）

## 依存関係

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "leaflet": "^1.9.4",
    "polygon-clipping": "^0.15.7",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

- 実描画は MapLibre GL JS の CDN 読み込み
- Python スクリプトは `geopandas` / `shapely` を使用（`pip install geopandas`）
