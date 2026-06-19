#!/usr/bin/env python3
"""
市区町村別 地価（住宅地 ¥/m²）コロプレス GeoJSON 生成スクリプト

データソース:
  - L01 地価公示（国土数値情報）: 住宅地の公示地点価格
  - N03 行政区域（国土数値情報）: 市区町村境界ポリゴン

事前準備（手動ダウンロード）:
  1. https://nlftp.mlit.go.jp/ksj/ を開く
  2. 「L01 地価公示」を検索 → 愛知県(23) → 最新年度の GML zip をダウンロード
     例: L01-24_23_GML.zip  → scripts/data/L01-24_23_GML/ に解凍
  3. 「N03 行政区域」を検索 → 愛知県(23) → 最新年度の zip をダウンロード
     例: N03-20240101_23_GML.zip → scripts/data/N03-20240101_23_GML/ に解凍

実行:
  python3 scripts/generate_land_price.py

出力: public/data/land_price.geojson

依存: geopandas shapely  (pip install geopandas)
"""

import sys
import json
import re
from pathlib import Path

try:
    import geopandas as gpd
    import pandas as pd
    from shapely.geometry import box
except ImportError:
    print("エラー: geopandas が必要です。\n  pip install geopandas")
    sys.exit(1)

# ── 設定 ────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = SCRIPT_DIR / "data"
OUTPUT = PROJECT_DIR / "public" / "data" / "land_price.geojson"

# 対象エリア（名古屋〜豊橋広域）
BBOX = (136.5, 34.6, 137.6, 35.4)

# ── L01 ファイル検索 ────────────────────────────────────────────────────────

def find_l01_file():
    """L01 GML または shapefile を scripts/data/ 以下から探す"""
    for pattern in ["**/L01-*.xml", "**/L01-*.gml", "**/L01-*.shp"]:
        hits = sorted(DATA_DIR.glob(pattern))
        if hits:
            return hits[0]
    # プロジェクトルート下も検索
    for pattern in ["**/L01-*.xml", "**/L01-*.gml", "**/L01-*.shp"]:
        hits = sorted(PROJECT_DIR.glob(pattern))
        if hits:
            return hits[0]
    return None

def find_n03_file():
    """N03 GML または shapefile を scripts/data/ 以下から探す"""
    for pattern in ["**/N03-*.xml", "**/N03-*.gml", "**/N03-*.shp"]:
        hits = sorted(DATA_DIR.glob(pattern))
        if hits:
            return hits[0]
    for pattern in ["**/N03-*.xml", "**/N03-*.gml", "**/N03-*.shp"]:
        hits = sorted(PROJECT_DIR.glob(pattern))
        if hits:
            return hits[0]
    return None

# ── 属性名の柔軟な検出 ──────────────────────────────────────────────────────

def detect_col(cols, candidates):
    """candidates リスト（優先順）から最初に見つかる列名を返す"""
    for c in candidates:
        match = next((col for col in cols if c in col), None)
        if match:
            return match
    return None

# ── メイン処理 ──────────────────────────────────────────────────────────────

def load_l01(path):
    print(f"L01 読み込み中: {path}")
    gdf = gpd.read_file(str(path))
    print(f"  {len(gdf)} 地点, 列: {list(gdf.columns)}")

    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    cols = list(gdf.columns)

    # 価格列 (¥/m²) — L01-24: L01_008, 旧版: L01_006
    price_col = detect_col(cols, ["L01_008", "L01_006", "価格", "price"])
    if not price_col:
        print(f"  警告: 価格列が見つかりません。列一覧: {cols}")
        sys.exit(1)
    print(f"  価格列: {price_col}")
    gdf["price_sqm"] = pd.to_numeric(gdf[price_col], errors="coerce")

    # 市区町村コード (5桁) — L01-24: L01_001, 旧版: L01_024
    code_col = detect_col(cols, ["L01_001", "L01_024", "市区町村コード", "cityCode"])
    if code_col:
        gdf["city_code"] = gdf[code_col].astype(str).str.zfill(5)
    else:
        gdf["city_code"] = None
    print(f"  市区町村コード列: {code_col}")

    # 用途区分 — L01-24: L01_010 (1=住宅地, 4=商業地), 旧版: L01_048 (文字列)
    use_col_num = detect_col(cols, ["L01_010"])
    use_col_str = detect_col(cols, ["L01_048", "用途区分", "useDistrict"])
    before = len(gdf)
    if use_col_num and pd.api.types.is_numeric_dtype(gdf[use_col_num]):
        gdf = gdf[gdf[use_col_num] == 1].copy()  # 1 = 住宅地
        print(f"  住宅地フィルタ (数値=1): {len(gdf)} 地点 (除外: {before - len(gdf)})")
    elif use_col_str:
        gdf = gdf[gdf[use_col_str].astype(str).str.contains("住宅", na=False)].copy()
        print(f"  住宅地フィルタ (文字列): {len(gdf)} 地点 (除外: {before - len(gdf)})")
    else:
        print("  用途区分列なし: 全種別を使用")

    gdf = gdf[gdf["price_sqm"].notna() & (gdf["price_sqm"] > 0)]
    print(f"  有効価格データ: {len(gdf)} 地点")
    return gdf[["price_sqm", "city_code", "geometry"]]


def load_n03(path):
    print(f"\nN03 読み込み中: {path}")
    gdf = gpd.read_file(str(path))
    print(f"  {len(gdf)} フィーチャ, 列: {list(gdf.columns)}")

    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    # 愛知県のみ
    pref_col = detect_col(list(gdf.columns), ["N03_001", "都道府県名", "prefName"])
    if pref_col:
        gdf = gdf[gdf[pref_col].astype(str).str.contains("愛知", na=False)].copy()

    cols = list(gdf.columns)
    code_col = detect_col(cols, ["N03_007", "行政区域コード", "cityCode"])
    city_col = detect_col(cols, ["N03_004", "市区町村名", "cityName"])
    # N03_005: 政令市の区名（名古屋市中区 等）
    ward_col = detect_col(cols, ["N03_005"])

    print(f"  コード列: {code_col}, 市区町村名列: {city_col}, 区名列: {ward_col}")

    gdf["city_code"] = gdf[code_col].astype(str).str.zfill(5) if code_col else None
    city = gdf[city_col].fillna("") if city_col else pd.Series([""] * len(gdf))
    ward = gdf[ward_col].fillna("") if ward_col else pd.Series([""] * len(gdf))
    gdf["display_name"] = city + ward  # "名古屋市" + "千種区" → "名古屋市千種区"

    gdf = gdf[gdf["city_code"].notna() & (gdf["city_code"] != "") & (gdf["city_code"] != "00000")].copy()

    # 同一 city_code の複数ポリゴン（飛び地など）を dissolve
    gdf = gdf.dissolve(by="city_code", aggfunc="first").reset_index()
    print(f"  dissolve 後: {len(gdf)} 市区町村")

    gdf.geometry = gdf.geometry.simplify(tolerance=0.0002, preserve_topology=True)
    return gdf[["city_code", "display_name", "geometry"]]


def aggregate_prices(l01_gdf, n03_gdf):
    print("\n価格集計中...")

    if l01_gdf["city_code"].isna().all() or (l01_gdf["city_code"] == "None").all():
        # city_code が取れていない場合は spatial join
        print("  spatial join で市区町村コードを補完")
        joined = gpd.sjoin(l01_gdf, n03_gdf[["city_code", "geometry"]], how="left", predicate="within")
        l01_gdf["city_code"] = joined["city_code_right"]

    agg = (
        l01_gdf.groupby("city_code")["price_sqm"]
        .agg(["mean", "median", "count"])
        .reset_index()
        .rename(columns={"mean": "avgPrice", "median": "medianPrice", "count": "sampleCount"})
    )
    agg["avgPrice"]    = agg["avgPrice"].round(0).astype(int)
    agg["medianPrice"] = agg["medianPrice"].round(0).astype(int)

    result = n03_gdf.merge(agg, on="city_code", how="inner")
    print(f"  地価データあり市区町村: {len(result)}")
    print(f"  価格レンジ: {result['avgPrice'].min():,.0f} 〜 {result['avgPrice'].max():,.0f} ¥/m²")
    return result


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    l01_path = find_l01_file()
    n03_path = find_n03_file()

    if not l01_path:
        print("""
L01 ファイルが見つかりません。以下の手順でダウンロードしてください:

  1. https://nlftp.mlit.go.jp/ksj/ を開く
  2. 「L01 地価公示」→「愛知県(23)」→ 最新年度の GML をダウンロード
  3. 解凍して scripts/data/ に配置

  例: scripts/data/L01-24_23_GML/L01-24_23.xml
""")
        sys.exit(1)

    if not n03_path:
        print("""
N03 ファイルが見つかりません。以下の手順でダウンロードしてください:

  1. https://nlftp.mlit.go.jp/ksj/ を開く
  2. 「N03 行政区域」→「愛知県(23)」→ 最新年度の GML をダウンロード
  3. 解凍して scripts/data/ に配置

  例: scripts/data/N03-20240101_23_GML/N03-20240101_23.xml
""")
        sys.exit(1)

    l01 = load_l01(l01_path)
    n03 = load_n03(n03_path)
    result = aggregate_prices(l01, n03)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # GeoJSON 出力（geopandas ではなく json で直接書き出し、属性名を統一）
    features = []
    for _, row in result.iterrows():
        from shapely.geometry import mapping
        features.append({
            'type': 'Feature',
            'geometry': mapping(row.geometry),
            'properties': {
                'cityCode': row['city_code'],
                'cityName': row.get('display_name', row.get('city_name', '')),
                'avgPrice': int(row['avgPrice']),
                'medianPrice': int(row['medianPrice']),
                'sampleCount': int(row['sampleCount']),
            }
        })
    import json
    OUTPUT.write_text(json.dumps({'type': 'FeatureCollection', 'features': features}, ensure_ascii=False))
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"\n完了: {OUTPUT}  ({size_kb:.0f} KB, {len(features)} 市区町村)")

    # 価格帯分布を表示
    print("\n価格帯分布 (住宅地 ¥/m²):")
    bins   = [0, 30_000, 60_000, 100_000, 200_000, 400_000, float("inf")]
    labels = ["〜3万", "3〜6万", "6〜10万", "10〜20万", "20〜40万", "40万〜"]
    result["band"] = pd.cut(result["avgPrice"], bins=bins, labels=labels)
    print(result["band"].value_counts().sort_index().to_string())


if __name__ == "__main__":
    main()
