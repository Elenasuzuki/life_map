#!/usr/bin/env python3
"""
国土数値情報の学校・文化施設ポイントをアプリ用 GeoJSON に整形する。

- 学校: P29 愛知県
- 文化施設: P27 愛知県

出力:
- public/data/school_facilities.geojson
- public/data/cultural_facilities.geojson
"""

import sys
from pathlib import Path

try:
    import geopandas as gpd
    from shapely.geometry import box
except ImportError:
    print("エラー: geopandas が必要です。 pip install geopandas")
    sys.exit(1)


ROOT = Path(__file__).resolve().parent.parent
INPUT_SCHOOLS = ROOT / "public/data/p29-13_23.geojson"
INPUT_CULTURE = ROOT / "public/data/p27-13_23.geojson"
OUTPUT_SCHOOLS = ROOT / "public/data/school_facilities.geojson"
OUTPUT_CULTURE = ROOT / "public/data/cultural_facilities.geojson"

# 安城〜岡崎〜豊田〜豊橋〜名古屋東部までを含む想定表示範囲
BBOX = (136.7, 34.7, 137.5, 35.2)

SCHOOL_TYPE_MAP = {
    "16001": "小学校",
    "16002": "中学校",
    "16004": "高等学校",
    "16006": "大学",
    "16007": "大学",
}


def city_name_from_code(code):
    text = str(code or "")
    return {
        "23100": "名古屋市",
        "23203": "一宮市",
        "23204": "瀬戸市",
        "23205": "半田市",
        "23211": "豊田市",
        "23212": "安城市",
        "23214": "蒲郡市",
        "23217": "江南市",
        "23219": "小牧市",
        "23220": "稲沢市",
        "23221": "新城市",
        "23222": "東海市",
        "23223": "大府市",
        "23225": "知立市",
        "23227": "高浜市",
        "23229": "豊明市",
        "23231": "田原市",
        "23235": "みよし市",
        "23238": "長久手市",
        "23202": "岡崎市",
        "23201": "豊橋市",
        "23101": "名古屋市千種区",
        "23102": "名古屋市東区",
        "23103": "名古屋市北区",
        "23104": "名古屋市西区",
        "23105": "名古屋市中村区",
        "23106": "名古屋市中区",
        "23107": "名古屋市昭和区",
        "23108": "名古屋市瑞穂区",
        "23109": "名古屋市熱田区",
        "23110": "名古屋市中川区",
        "23111": "名古屋市港区",
        "23112": "名古屋市南区",
        "23113": "名古屋市守山区",
        "23114": "名古屋市緑区",
        "23115": "名古屋市名東区",
        "23116": "名古屋市天白区",
    }.get(text, text[:5] if len(text) >= 5 else "愛知県")


def read_clip(path):
    gdf = gpd.read_file(path)
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)
    return gdf[gdf.geometry.intersects(box(*BBOX))].copy()


def convert_schools():
    gdf = read_clip(INPUT_SCHOOLS)
    gdf["facilityType"] = gdf["学校分類"].map(SCHOOL_TYPE_MAP)
    gdf = gdf[gdf["facilityType"].notna()].copy()
    gdf["name"] = gdf["名称"].fillna("名称不明")
    gdf["address"] = gdf["所在地"].fillna("")
    gdf["city"] = gdf["行政区域コード"].apply(city_name_from_code)
    gdf["source"] = "国土数値情報 P29"
    out = gdf[["name", "facilityType", "address", "city", "source", "geometry"]]
    out.to_file(OUTPUT_SCHOOLS, driver="GeoJSON")
    return len(out)


def convert_culture():
    gdf = read_clip(INPUT_CULTURE)
    gdf["facilityType"] = "文化施設"
    gdf["name"] = gdf["名称"].fillna("名称不明")
    gdf["address"] = gdf["所在地"].fillna("")
    gdf["city"] = gdf["行政区域コード"].apply(city_name_from_code)
    gdf["categoryCode"] = gdf["文化施設分類"].fillna("")
    gdf["source"] = "国土数値情報 P27"
    out = gdf[["name", "facilityType", "address", "city", "categoryCode", "source", "geometry"]]
    out.to_file(OUTPUT_CULTURE, driver="GeoJSON")
    return len(out)


def main():
    if not INPUT_SCHOOLS.exists():
        print(f"学校データが見つかりません: {INPUT_SCHOOLS}")
        sys.exit(1)
    if not INPUT_CULTURE.exists():
        print(f"文化施設データが見つかりません: {INPUT_CULTURE}")
        sys.exit(1)

    school_count = convert_schools()
    culture_count = convert_culture()
    print(f"school_facilities.geojson: {school_count} 件")
    print(f"cultural_facilities.geojson: {culture_count} 件")


if __name__ == "__main__":
    main()
