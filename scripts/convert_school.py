#!/usr/bin/env python3
"""
小中学校区（国土数値情報 A27）→ school_districts.geojson 変換スクリプト

使い方:
  1. https://nlftp.mlit.go.jp/ksj/ で「A27」を検索し
     「23 愛知県」のデータをダウンロード・解凍する
  2. 下の INPUT_DATA にそのパスをセット
  3. python3 scripts/convert_school.py
  4. public/data/school_districts.geojson が上書きされる

依存: geopandas  (pip install geopandas)

注記:
  2023年版の A27 は shapefile / geojson も同梱されており、
  列構成も旧版と少し異なるため、学校種別は学校名末尾から補完する。
"""

import sys
from pathlib import Path

try:
    import geopandas as gpd
    from shapely.geometry import box
except ImportError:
    print("エラー: geopandas が必要です。\n  pip install geopandas")
    sys.exit(1)

# ── 設定 ───────────────────────────────────────────────────────────────────

# ダウンロードしたデータファイルのパス
# 2023年版は shp / geojson / xml が同梱される
INPUT_DATA = "public/data/A27-23_23_GML/A27-23_23.shp"

OUTPUT = Path(__file__).parent.parent / "public/data/school_districts.geojson"

# 対象エリア
BBOX = (136.7, 34.7, 137.5, 35.2)

# 学校種別コード → 日本語
LEVEL_KEYWORDS = (
    ("義務教育学校", "義務教育学校"),
    ("中学校", "中学校"),
    ("小学校", "小学校"),
)

# ── 処理 ───────────────────────────────────────────────────────────────────

def infer_level(name):
    text = str(name or "")
    for keyword, level in LEVEL_KEYWORDS:
        if keyword in text:
            return level
    return None

def infer_city(row):
    for key in ("city", "市区町村", "address", "A27_005", "A27_002"):
        value = row.get(key)
        if not value:
            continue
        text = str(value)
        for city in ("名古屋市", "安城市", "岡崎市", "豊田市", "豊橋市", "知立市", "刈谷市", "豊明市"):
            if city in text:
                return city
    return _city_from_point(row.geometry.centroid.y, row.geometry.centroid.x)

def main():
    print(f"読み込み中: {INPUT_DATA}")
    gdf = gpd.read_file(INPUT_DATA)
    print(f"  {len(gdf)} フィーチャ, カラム: {list(gdf.columns)}")

    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    clip_box = box(*BBOX)
    gdf = gdf[gdf.geometry.intersects(clip_box)].copy()
    print(f"  クリップ後: {len(gdf)} フィーチャ")

    # 属性名を特定（年度・フォーマット差異に対応）
    name_col = next((c for c in gdf.columns if c in ("A27_004", "name", "学校名")), None)
    operator_col = next((c for c in gdf.columns if c in ("A27_002", "operator", "設置主体")), None)
    address_col = next((c for c in gdf.columns if c in ("A27_005", "address", "所在地")), None)

    gdf["school"] = gdf[name_col].fillna("不明") if name_col else "不明"
    gdf["level"] = gdf["school"].apply(infer_level)
    gdf["operator"] = gdf[operator_col] if operator_col else None
    gdf["address"] = gdf[address_col] if address_col else None
    gdf["city"] = gdf.apply(infer_city, axis=1)

    keep = ["school", "level", "city", "operator", "address", "geometry"]
    gdf  = gdf[[c for c in keep if c in gdf.columns]]

    # 小・中学校のみに絞る
    gdf = gdf[gdf["level"].isin(["小学校", "中学校", "義務教育学校"])]
    print(f"  小中学校区: {len(gdf)} 件")

    gdf.geometry = gdf.geometry.simplify(tolerance=0.0001, preserve_topology=True)
    gdf.to_file(OUTPUT, driver="GeoJSON")
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"\n完了: {OUTPUT}  ({size_kb:.0f} KB)")

def _city_from_point(lat, lng):
    """緯度経度から主要市名を返す簡易マッピング（精度低）"""
    if   34.92 < lat < 34.99 and 136.98 < lng < 137.13: return "安城市"
    elif 34.93 < lat < 34.97 and 137.13 < lng < 137.20: return "岡崎市"
    elif 35.06 < lat < 35.15 and 137.10 < lng < 137.22: return "豊田市"
    elif 34.75 < lat < 34.85 and 137.35 < lng < 137.45: return "豊橋市"
    elif 34.95 < lat < 35.05 and 136.85 < lng < 136.97: return "名古屋市"
    return "愛知県"

if __name__ == "__main__":
    if INPUT_DATA.startswith("path/to/"):
        print("エラー: INPUT_DATA を実際のパスに書き換えてください。")
        sys.exit(1)
    main()
