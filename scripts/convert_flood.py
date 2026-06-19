#!/usr/bin/env python3
"""
洪水浸水想定区域（国土数値情報 A31a）→ flood_hazard.geojson 変換スクリプト

KSJ 独自GMLスキーマを直接XMLパースして変換します。

使い方:
  python3 scripts/convert_flood.py

依存: shapely  (geopandas インストール済みなら同梱)
"""

import json
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

try:
    from shapely.geometry import Polygon, mapping, shape
    from shapely.ops import unary_union
except ImportError:
    print("エラー: shapely が必要です。\n  pip3 install geopandas")
    sys.exit(1)

# ── 設定 ──────────────────────────────────────────────────────────────────

BASE   = Path(__file__).parent.parent / "public/data"
OUTPUT = BASE / "flood_hazard.geojson"

FOLDERS = [
    # 住まい探しでは「想定最大規模」のみ表示（計画規模は参考）
    (BASE / "A31a-24_23_10_GML/20_想定最大規模", "flood_l2"),
    (BASE / "A31a-24_23_20_GML/20_想定最大規模", "flood_l2"),
    # 計画規模も含めたい場合は下2行のコメントを外す:
    # (BASE / "A31a-24_23_10_GML/10_計画規模",     "flood_l1"),
    # (BASE / "A31a-24_23_20_GML/10_計画規模",     "flood_l1"),
]

# 対象エリア: 名古屋〜豊橋の広域 (xmin, ymin, xmax, ymax)
BBOX = (136.7, 34.6, 137.55, 35.2)

RANK_TO_DEPTH = {
    "1": 0.25, "2": 1.5, "3": 4.0, "4": 7.5, "5": 12.0,
}

NS = {
    "ksj":   "http://nlftp.mlit.go.jp/ksj/schemas/ksj-app",
    "gml":   "http://schemas.opengis.net/gml/3.2.1",
    "xlink": "http://www.w3.org/1999/xlink",
}
XLINK_HREF = "{http://www.w3.org/1999/xlink}href"
GML_ID     = "{http://schemas.opengis.net/gml/3.2.1}id"

# ── XML パーサー ───────────────────────────────────────────────────────────

def parse_gml(xml_path: Path, category: str) -> list:
    """GMLを解析してフィーチャリストを返す"""
    tree = ET.parse(xml_path)
    root = tree.getroot()

    # 1. Curve ID → 座標リスト [(lon, lat), ...]
    curves = {}
    for curve in root.iter("{http://schemas.opengis.net/gml/3.2.1}Curve"):
        cid = curve.get(GML_ID)
        pos = curve.find(".//{http://schemas.opengis.net/gml/3.2.1}posList")
        if cid and pos is not None and pos.text:
            nums = list(map(float, pos.text.split()))
            # 座標は (lat, lon) 順 → (lon, lat) に変換
            coords = [(nums[i+1], nums[i]) for i in range(0, len(nums)-1, 2)]
            curves[cid] = coords

    # 2. Surface ID → リング座標のリスト
    surfaces = {}
    for surface in root.iter("{http://schemas.opengis.net/gml/3.2.1}Surface"):
        sid = surface.get(GML_ID)
        if not sid:
            continue
        rings = []
        for ring in surface.iter("{http://schemas.opengis.net/gml/3.2.1}Ring"):
            ring_coords = []
            for member in ring.findall(
                "{http://schemas.opengis.net/gml/3.2.1}curveMember"
            ):
                href = member.get(XLINK_HREF, "").lstrip("#")
                ring_coords.extend(curves.get(href, []))
            if ring_coords:
                rings.append(ring_coords)
        if rings:
            surfaces[sid] = rings  # rings[0]=exterior, rings[1:]=holes

    # 3. フィーチャ (MaximumScale / PlanScale) を解析
    features = []
    for feat in list(root.iter(
        "{http://nlftp.mlit.go.jp/ksj/schemas/ksj-app}MaximumScale"
    )) + list(root.iter(
        "{http://nlftp.mlit.go.jp/ksj/schemas/ksj-app}PlanScale"
    )):
        # bounds → surface 参照
        bounds = feat.find(
            "{http://nlftp.mlit.go.jp/ksj/schemas/ksj-app}bounds"
        )
        if bounds is None:
            continue
        sid = bounds.get(XLINK_HREF, "").lstrip("#")
        rings = surfaces.get(sid)
        if not rings:
            continue

        # ポリゴン生成
        exterior = rings[0]
        holes    = rings[1:] if len(rings) > 1 else []
        try:
            poly = Polygon(exterior, holes)
            if not poly.is_valid:
                poly = poly.buffer(0)
            if poly.is_empty:
                continue
        except Exception:
            continue

        # 対象エリア判定
        lon, lat = poly.centroid.x, poly.centroid.y
        if not (BBOX[0] <= lon <= BBOX[2] and BBOX[1] <= lat <= BBOX[3]):
            continue

        # 属性
        def txt(tag):
            el = feat.find(f"{{http://nlftp.mlit.go.jp/ksj/schemas/ksj-app}}{tag}")
            return el.text.strip() if el is not None and el.text else ""

        depth = RANK_TO_DEPTH.get(txt("waterDepth"), 1.0)
        river = txt("riverName") or "不明"

        features.append({
            "type": "Feature",
            "geometry": mapping(poly),
            "properties": {
                "depth_m":  depth,
                "category": category,
                "river":    river,
                "label":    f"{river} 洪水浸水想定区域",
            },
        })

    return features

# ── メイン ────────────────────────────────────────────────────────────────

def main():
    print("=== 洪水浸水想定区域 変換開始 ===")
    all_features = []

    for folder, category in FOLDERS:
        if not folder.exists():
            continue
        xml_files = sorted(folder.glob("*.xml"))
        if not xml_files:
            continue
        print(f"\n📂 {folder.parent.name}/{folder.name}  ({len(xml_files)} ファイル)")

        for xml in xml_files:
            try:
                feats = parse_gml(xml, category)
                all_features.extend(feats)
                print(f"  {xml.name}: {len(feats)} フィーチャ")
            except Exception as e:
                print(f"  ⚠️  {xml.name}: {e}")

    if not all_features:
        print("\nエラー: 対象エリア内にデータが見つかりませんでした。")
        sys.exit(1)

    print(f"\n合計: {len(all_features)} フィーチャ → 浸水深レベルでマージ中...")

    # 浸水深レベル + カテゴリでグループ化してマージ
    # セルサイズが5〜50mのため:
    #   1. 微小バッファ(5m=約4.5e-5度)で隣接セルを接続
    #   2. unary_union で連続エリアに結合
    #   3. 比較的小さな簡略化(0.0002=20m)で座標数を削減
    BUFFER_DEG   = 1e-4    # 約10m: 隣接セルを結合するバッファ
    SIMPLIFY_TOL = 0.001   # 約100m: バッファ後の連続エリアなら安全
    MIN_AREA     = 1e-6    # 0.01km²未満の孤立断片を除去

    from collections import defaultdict
    groups = defaultdict(list)
    for f in all_features:
        p = f["properties"]
        key = (p["depth_m"], p["category"])
        groups[key].append(shape(f["geometry"]))

    DEPTH_LABEL = {
        0.25: "0.5m未満",
        1.5:  "0.5〜3m",
        4.0:  "3〜5m",
        7.5:  "5〜10m",
        12.0: "10m以上",
    }

    merged_features = []
    for (depth_m, category), polys in sorted(groups.items()):
        print(f"  深さ{depth_m}m / {category}: {len(polys)}ポリゴン → マージ中...")
        try:
            # バッファで隣接セルを接続してからunion → 簡略化
            buffered = [p.buffer(BUFFER_DEG) for p in polys]
            merged = unary_union(buffered)
            merged = merged.simplify(SIMPLIFY_TOL, preserve_topology=True)
            if merged.is_empty:
                continue
            geoms = list(merged.geoms) if merged.geom_type == "MultiPolygon" else [merged]
            for g in geoms:
                if g.is_empty or g.area < MIN_AREA:
                    continue
                label_depth = DEPTH_LABEL.get(depth_m, f"{depth_m}m")
                cat_label = "想定最大規模" if category == "flood_l2" else "計画規模"
                merged_features.append({
                    "type": "Feature",
                    "geometry": mapping(g),
                    "properties": {
                        "depth_m":  depth_m,
                        "category": category,
                        "river":    "複数河川",
                        "label":    f"浸水想定区域 ({label_depth}) [{cat_label}]",
                    },
                })
        except Exception as e:
            print(f"  ⚠️  マージ失敗 ({depth_m}/{category}): {e}")

    print(f"マージ後: {len(merged_features)} フィーチャ")

    geojson = {
        "type": "FeatureCollection",
        "features": merged_features,
    }

    OUTPUT.write_text(json.dumps(geojson, ensure_ascii=False), encoding="utf-8")
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"✅ 完了: {OUTPUT.name}  ({size_kb:.0f} KB)")

    if size_kb > 8000:
        print("⚠️  8MB超えています。重い場合はお知らせください。")

    rivers = {f["properties"]["river"] for f in merged_features}
    print(f"\n含まれる河川 ({len(rivers)} 本):")
    for r in sorted(rivers):
        print(f"  {r}")

if __name__ == "__main__":
    main()
