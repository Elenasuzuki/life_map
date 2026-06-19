# 住まい探しマップ

愛知県の住宅検討向けに、通勤・鉄道アクセス・学区・地価を重ねて見るための地図プロトタイプです。  
フロントエンドは React + Vite、地図描画は MapLibre GL JS、背景地図は地理院地図Vectorを使っています。

## 住まい探しの登場人物と要件

| 人物 | 通勤・通学手段 | 主な要件 |
|---|---|---|
| **妻** | 新幹線で東京へ通勤 | 新幹線名古屋駅・三河安城駅への最短アクセス。毎日乗るので徒歩圏か駅近が理想 |
| **夫** | トヨタ本社または下山TCへ車通勤 | 各拠点への車40分圏内。高速を使わない下道ルートを基準とした現実的な所要時間 |
| **子** | 近隣の小中学校へ通学 | 評判が良く学童・教育が充実した公立学校の学区。学区境界と学校の場所を地図で確認したい |

「妻の新幹線アクセス」と「夫の車通勤圏」が重なるエリアで、かつ良い学区——この3条件の交差点を探すためのマップです。

> **名古屋駅の定義**: このアプリでは「名古屋30分圏」の名古屋は **新幹線名古屋駅（JR東海）** を指します。
> 地下鉄鶴舞線経由で丸の内・伏見にアクセスできる路線（名鉄豊田線など）は、新幹線名古屋駅への乗換が必要なため現時点では対象外としています。

## 現在できること

- 背景地図の切替
  `淡色 / 標準 / 白地図`
- 学区境界の表示
  国土数値情報 A27 2023年版を GeoJSON 化した実データ
  学区トグルON時は、学校・文化施設ポイントもあわせて表示
- 車アクセス圏の表示
  `トヨタ本社 / トヨタテクニカルセンター下山 / 昭太実家`
  それぞれを個別トグルで表示
- 新幹線アクセス駅の表示
  `名古屋駅 / 豊橋駅` に `🚄` アイコンを常時表示
- 三河安城駅徒歩15分圏
  `三河安城駅 + 徒歩15分圏` を独立レイヤーで表示
- 名鉄レイヤー
  `豊橋直通30分圏 + 徒歩15分圏`
- 名鉄レイヤー
  `名鉄名古屋直通30分圏 + 徒歩15分圏`
- JRレイヤー
  `JR名古屋直通30分圏 + 徒歩15分圏`（東海道本線 + 中央線）
- JRレイヤー
  `JR豊橋直通30分圏 + 徒歩15分圏`
- 地下鉄レイヤー
  `名古屋へ直通または1回乗換で30分以内 + 徒歩15分圏`
- 徒歩圏の描画
  ORS `foot-walking` アイソクロンで事前生成した実際の徒歩15分圏を使用（近似円ではない）
  データは `public/data/walk_isochrones.geojson` に静的保存（110 駅分）
  データがない場合は近似円にフォールバック
- 車アクセス圏
  ORS APIキー設定時のみ、実時間ベース40分圏を表示
  高速回避版は実線、高速道路あり版は点線で比較表示
- 車アクセス圏の重なり境界
  2重なり / 3重なり部分をオレンジ系の境界線で強調
- 地価レイヤー（トグル表示）
  国土数値情報 L01 地価公示（2024年）の住宅地公示地点をボロノイ分割で表示
  各セルが最近傍の公示地点の価格（¥/m²）を示す。1882 地点・7段階の色分け
- ハザード情報（トグル表示）
  - 洪水浸水想定区域（想定最大規模）：重ねるハザードマップ（国土交通省）の raster タイル
  - 津波浸水想定：同上
  - 地形分類：地理院タイル `lcmfc2`（治水地形分類図）を主体に `lcm25k_2012`（数値地図25000）で広域補完
- 各表示レイヤーの凡例
  左パネルの `凡例` ボタンから内容を確認可能

## データの限界・注意点

- 徒歩圏はORS `foot-walking` アイソクロン。道路ネットワーク依存のため、河川・線路の横断など現地条件と差が出ることがあります。
- 地価レイヤーは公示地点（スポット調査）ベースのボロノイ分割なので、セル内の実勢価格を保証するものではありません。
  極端に高い値（名古屋駅前等の商業混在地）も「住宅地」分類に含まれることがあります。
- 地形分類は公開されている地理院タイルの範囲でのみ表示されます
  - `lcmfc2`（治水地形分類図）はズーム16まで高解像度ですが、整備された河川管理区域外はデータなし
  - `lcm25k_2012` はズーム10-12の広域補完用。ズーム13以上では非表示（解像度不足のため）
  - 安城市中心部など一部エリアはズームインすると白抜きになります
  - 重ねるハザードマップ（disaportal）が使用する地形分類タイルは非公開サーバーで配信されており、同等の再現は不可能です

## 起動方法

```bash
source ~/.nvm/nvm.sh
npm run dev
```

ブラウザで `http://localhost:5173/` を開いてください。

本番ビルド確認:

```bash
source ~/.nvm/nvm.sh
npm run build
npm run preview
```

## 構成メモ

```txt
src/
  App.jsx                    レイヤー状態・背景地図状態管理
  components/
    MapView.jsx              MapLibre 地図本体。背景地図・GeoJSON・各種徒歩圏を描画
    LayerPanel.jsx           左パネル。背景地図切替、レイヤートグル、凡例
    IsochroneLayer.jsx       旧 react-leaflet 実装。現状未使用
  data/
    locations.js             車アクセス圏の起点座標、新幹線駅座標
    meitetsu.js              名鉄名古屋本線データ
    jrNagoya.js              JR名古屋30分圏データ（東海道本線 + 中央線）
    jrToyohashi.js           JR豊橋30分圏データ
    nagoyaSubway.js          地下鉄名古屋30分圏データ
  hooks/
    useIsochrone.js          ORS API 呼び出し（車アクセス圏用）
public/data/
  school_districts.geojson   学区境界（A27 2023年版）
  school_facilities.geojson  学校ポイント（P29 由来）
  cultural_facilities.geojson 文化施設ポイント（P27 由来）
  walk_isochrones.geojson    徒歩15分圏（ORS foot-walking、110 駅分）
  land_price.geojson         地価ボロノイ（L01 住宅地 1882 地点）
  flood_hazard.geojson       旧洪水データ（現行の表示には未使用）
scripts/
  generate_walk_isochrones.py  徒歩圏 GeoJSON 生成（ORS API）
  generate_land_price.py       地価ボロノイ GeoJSON 生成（L01 + N03）
  convert_school.py            学区 GML → GeoJSON 変換
  convert_public_facilities.py 学校・文化施設 GML → GeoJSON 変換
  convert_flood.py             洪水 GML → GeoJSON 変換（現行未使用）
  data/                        L01・N03 元データ置き場（Git 管理外）
  DATA_GUIDE.md                データ取得・変換手順
```

## 背景地図

背景地図は地理院地図Vectorの外部 `style.json` を利用しています。

- `pale`
  `https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/pale.json`
- `std`
  `https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/std.json`
- `blank`
  `https://gsi-cyberjapan.github.io/gsivectortile-mapbox-gl-js/blank.json`

デフォルトは `淡色` です。選択状態は `localStorage` の `housing-map-basemap-v2` に保存されます。

## ORS APIキー

任意で `.env.local` に設定できます。

```bash
VITE_ORS_API_KEY=your_key
```

未設定時は、車アクセス拠点の点だけを表示し、実時間ベース40分圏は描画しません。
現在の車アクセス圏は ORS の `driving-car` isochrone を使い、`smoothing: 0` で取得しています。
高速回避版は `avoid_features: ['highways']`、高速道路あり版は通常経路です。
あわせて、高速道路あり版も別取得して比較表示しています。
同じ拠点・同じ条件では `localStorage` に12時間キャッシュされるため、2回目以降は速く表示されます。

徒歩15分圏の GeoJSON 再生成時も同じキーを使用します（`scripts/generate_walk_isochrones.py`）。

## データについて

- 学区
  `public/data/school_districts.geojson` は愛知県の国土数値情報 A27 2023年版から変換済みです。
  学区トグルでは、学校ポイント `public/data/school_facilities.geojson` と文化施設ポイント `public/data/cultural_facilities.geojson` も表示します。
  学校は `小学校 / 中学校 / 高等学校 / 大学` に色分け、文化施設は別色で表示します。スポットはズーム11以上で表示され、ポップアップはスポットクリック時のみ出ます。
- 新幹線
  `src/data/locations.js` で `名古屋駅 / 三河安城駅 / 豊橋駅` を管理しています。
  `名古屋駅 / 豊橋駅` は常時 `🚄` アイコン表示、`三河安城駅` はオレンジの `🚄` と徒歩15分圏を独立レイヤーで表示します。
- 名鉄/JR
  アプリ内データファイルで管理。保守的な「直通30分以内」を採用。
  `jrNagoya.js` は東海道本線（名古屋〜安城）と中央線（名古屋〜高蔵寺）の両方を含みます。
- 地下鉄
  `直通` に加えて `1回乗換で30分以内` の駅も含みます。座標は地理院ジオコーダ結果を基準にしつつ、一部駅は手補正しています。
- 徒歩圏
  `scripts/generate_walk_isochrones.py` で ORS `foot-walking` アイソクロン（900秒=15分）を事前取得。
  `public/data/walk_isochrones.geojson` に保存（110 駅分、stationId / group プロパティ付き）。
  データ更新時は ORS APIキーが必要。バッチサイズ 5 件で取得。
- 地価
  `scripts/generate_land_price.py` で国土数値情報 L01（地価公示）+ N03（行政区域）を処理。
  住宅地（L01_010=1）1882 地点をボロノイ分割し `public/data/land_price.geojson` として保存。
  元データは `scripts/data/` に配置（L01-24_23_GML / N03-20240101_23_GML）。
  カラースケールは 〜5万 / 5〜8万 / 8〜12万 / 12〜16万 / 16〜25万 / 25〜50万 / 50万〜 の7段階。
- 車アクセス圏
  3拠点を個別レイヤーに分けています。高速回避版40分圏は同色の実線、高速道路あり40分圏は同色の点線と半透明塗りで重ねています。3つ重なる領域だけ紺色の細い実線で強調しています。
- ハザード情報
  - 洪水・津波：`disaportaldata.gsi.go.jp/raster/` から raster タイルを取得
  - 地形分類：`cyberjapandata.gsi.go.jp/xyz/lcmfc2/`（主体）+ `lcm25k_2012`（補完）を重ね合わせ

## 注意点

- 背景地図は外部 `style.json` 依存なので、ネットワーク状況によって切替に少しラグが出ることがあります。
- ダークモード拡張や強制配色が MapLibre の canvas に影響することがあります。
- `leaflet` / `react-leaflet` は依存として残っていますが、現行の主要描画は MapLibre ベースです。
- 地下鉄駅座標はまだ正本データではなく、一部駅でベースマップ上の駅名位置とずれることがあります。
- 地形分類は `lcmfc2` のデータ整備範囲（主に河川管理区域）に限定されます。安城市中心部など一部エリアはズームインで白抜きになります。

## 今後の候補

- 地下鉄駅座標の正本データへの差し替え
- 地価ボロノイの粒度改善（地価調査データを追加して公示点を増やす）
- `MapView.jsx` の責務分割
