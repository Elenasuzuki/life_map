#!/usr/bin/env python3
"""
徒歩15分圏（実際のアイソクロン）を ORS foot-walking API で取得し、
public/data/walk_isochrones.geojson に保存する。

Usage:
  python scripts/generate_walk_isochrones.py

.env.local の VITE_ORS_API_KEY を使用。
ORS free tier は 1 リクエストあたり最大 5 地点まで。
"""

import json
import os
import re
import time
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ENV_FILE = PROJECT_DIR / '.env.local'
OUTPUT_FILE = PROJECT_DIR / 'public' / 'data' / 'walk_isochrones.geojson'

WALK_SECONDS = 900   # 15 minutes
BATCH_SIZE = 5       # ORS free tier limit
SLEEP_BETWEEN_BATCHES = 1.5  # seconds

ORS_ENDPOINT = 'https://api.openrouteservice.org/v2/isochrones/foot-walking'


def load_api_key():
    if not ENV_FILE.exists():
        raise FileNotFoundError(f'{ENV_FILE} が見つかりません。VITE_ORS_API_KEY を設定してください。')
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith('VITE_ORS_API_KEY='):
            return line.split('=', 1)[1].strip()
    raise ValueError('.env.local に VITE_ORS_API_KEY が見つかりません。')


def extract_stations_from_js(js_path, id_pattern=None):
    """JS ファイルからオブジェクトリテラルの id/lat/lng を正規表現で抽出する。"""
    text = js_path.read_text()
    # { ... id: 'xxx', ... lat: N, ... lng: N ... } の繰り返しブロックを抽出
    blocks = re.findall(r'\{[^{}]*?id:\s*[\'"]([^\'"]+)[\'"][^{}]*?\}', text, re.DOTALL)
    stations = []
    for block in blocks:
        # block はすでに id の値だが、フルブロック文字列が必要なので再抽出
        pass

    # 別の方法: lat/lng を id と一緒に取る
    pattern = re.compile(
        r"id:\s*['\"](?P<id>[^'\"]+)['\"].*?"
        r"lat:\s*(?P<lat>-?[\d.]+).*?"
        r"lng:\s*(?P<lng>-?[\d.]+)",
        re.DOTALL
    )
    for m in pattern.finditer(text):
        stations.append({
            'id': m.group('id'),
            'lat': float(m.group('lat')),
            'lng': float(m.group('lng')),
        })
    return stations


def filter_qualifying(stations, js_path, filter_key):
    """filter_key: 'directFromToyohashi' | 'directFromNagoya' | 'directFromToyohashi' など"""
    text = js_path.read_text()
    # filter_key: true かどうか各ブロックで判定
    # ブロック = { ... id: 'x' ... filterKey: true/false ... }
    block_pattern = re.compile(r'\{(?:[^{}]|\n)*?\}', re.DOTALL)
    qualifying_ids = set()
    for block in block_pattern.finditer(text):
        b = block.group()
        id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", b)
        flag_m = re.search(rf"{filter_key}:\s*(true|false)", b)
        if id_m and flag_m and flag_m.group(1) == 'true':
            qualifying_ids.add(id_m.group(1))
    return [s for s in stations if s['id'] in qualifying_ids]


def filter_subway_qualifying(stations, js_path, max_minutes=30):
    text = js_path.read_text()
    block_pattern = re.compile(r'\{(?:[^{}]|\n)*?\}', re.DOTALL)
    qualifying_ids = set()
    for block in block_pattern.finditer(text):
        b = block.group()
        id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", b)
        min_m = re.search(r"fastestMinutesToNagoya:\s*(\d+)", b)
        if id_m and min_m and int(min_m.group(1)) <= max_minutes:
            qualifying_ids.add(id_m.group(1))
    return [s for s in stations if s['id'] in qualifying_ids]


def call_ors_isochrone(locations, api_key):
    """locations: list of [lng, lat]. Returns list of GeoJSON features."""
    body = json.dumps({
        'locations': locations,
        'range': [WALK_SECONDS],
        'range_type': 'time',
    }).encode()
    req = urllib.request.Request(
        ORS_ENDPOINT,
        data=body,
        headers={
            'Authorization': api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/geo+json',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data.get('features', [])


def fetch_isochrones_for_group(group_name, stations, api_key):
    """指定グループの全駅のアイソクロン Feature を取得して返す。"""
    features = []
    batches = [stations[i:i+BATCH_SIZE] for i in range(0, len(stations), BATCH_SIZE)]
    for i, batch in enumerate(batches):
        locations = [[s['lng'], s['lat']] for s in batch]
        print(f'  {group_name}: batch {i+1}/{len(batches)} ({len(batch)} 駅)... ', end='', flush=True)
        try:
            raw_features = call_ors_isochrone(locations, api_key)
            # ORS は locations の順番通りに feature を返す。properties.value = 900。
            for j, feat in enumerate(raw_features):
                station = batch[j] if j < len(batch) else batch[0]
                feat['properties'] = {
                    **feat.get('properties', {}),
                    'stationId': station['id'],
                    'group': group_name,
                }
                features.append(feat)
            print(f'OK ({len(raw_features)} features)')
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f'ERROR {e.code}: {body}')
        except Exception as e:
            print(f'ERROR: {e}')
        if i < len(batches) - 1:
            time.sleep(SLEEP_BETWEEN_BATCHES)
    return features


def main():
    api_key = load_api_key()
    print(f'API key: {api_key[:20]}...')

    data_dir = PROJECT_DIR / 'src' / 'data'

    meitetsu_js = data_dir / 'meitetsu.js'
    jr_nagoya_js = data_dir / 'jrNagoya.js'
    jr_toyohashi_js = data_dir / 'jrToyohashi.js'
    nagoya_subway_js = data_dir / 'nagoyaSubway.js'
    locations_js = data_dir / 'locations.js'

    # 各グループの駅を収集
    groups = {}

    # meitetsu-walk: directFromToyohashi
    all_meitetsu = extract_stations_from_js(meitetsu_js)
    groups['meitetsu-walk'] = filter_qualifying(all_meitetsu, meitetsu_js, 'directFromToyohashi')

    # meitetsu-nagoya-walk: directFromNagoya
    groups['meitetsu-nagoya-walk'] = filter_qualifying(all_meitetsu, meitetsu_js, 'directFromNagoya')

    # jr-nagoya-walk: directFromNagoya
    all_jr_nagoya = extract_stations_from_js(jr_nagoya_js)
    groups['jr-nagoya-walk'] = filter_qualifying(all_jr_nagoya, jr_nagoya_js, 'directFromNagoya')

    # jr-toyohashi-walk: directFromToyohashi
    all_jr_toyohashi = extract_stations_from_js(jr_toyohashi_js)
    groups['jr-toyohashi-walk'] = filter_qualifying(all_jr_toyohashi, jr_toyohashi_js, 'directFromToyohashi')

    # mikawa-anjo-shinkansen-walk: shinkansen_mikawa_anjo のみ
    all_locations = extract_stations_from_js(locations_js)
    mikawa_anjo = [s for s in all_locations if s['id'] == 'shinkansen_mikawa_anjo']
    groups['mikawa-anjo-shinkansen-walk'] = mikawa_anjo

    # subway-nagoya-walk: fastestMinutesToNagoya <= 30
    all_subway = extract_stations_from_js(nagoya_subway_js)
    groups['subway-nagoya-walk'] = filter_subway_qualifying(all_subway, nagoya_subway_js, 30)

    total = sum(len(v) for v in groups.values())
    print(f'\n合計 {total} 駅のアイソクロンを取得します:')
    for name, stations in groups.items():
        print(f'  {name}: {len(stations)} 駅')
    print()

    all_features = []
    for group_name, stations in groups.items():
        if not stations:
            print(f'  {group_name}: 駅なし、スキップ')
            continue
        features = fetch_isochrones_for_group(group_name, stations, api_key)
        all_features.extend(features)
        time.sleep(SLEEP_BETWEEN_BATCHES)

    geojson = {
        'type': 'FeatureCollection',
        'features': all_features,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(geojson, ensure_ascii=False, indent=2))
    print(f'\n完了: {len(all_features)} features → {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
