#!/usr/bin/env python3
"""
車アクセス圏アイソクロンを事前生成して public/data/drive_isochrones/ に保存する。

対象: 3拠点 × 2モード（高速回避/高速あり）× 7段階（30,35,40,45,50,55,60分）= 42ファイル

Usage:
  python scripts/generate_drive_isochrones.py

.env.local の VITE_ORS_API_KEY を使用。
"""

import json
import os
import time
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ENV_FILE = PROJECT_DIR / '.env.local'
OUTPUT_DIR = PROJECT_DIR / 'public' / 'data' / 'drive_isochrones'

DRIVE_MINUTES = [30, 35, 40, 45, 50, 55, 60]
SLEEP_BETWEEN_REQUESTS = 1.5  # ORS free tier rate limit

ORS_ENDPOINT = 'https://api.openrouteservice.org/v2/isochrones/driving-car'

WORKPLACES = [
    {'id': 'toyota_hq',          'lat': 35.051659, 'lng': 137.160568},
    {'id': 'toyota_shimoyama',   'lat': 35.024651, 'lng': 137.311401},
    {'id': 'shota_family_home',  'lat': 35.136021, 'lng': 136.943649},
]


def load_api_key():
    if not ENV_FILE.exists():
        raise FileNotFoundError(f'{ENV_FILE} が見つかりません。')
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith('VITE_ORS_API_KEY='):
            return line.split('=', 1)[1].strip()
    raise ValueError('.env.local に VITE_ORS_API_KEY が見つかりません。')


def call_ors(lat, lng, range_seconds, avoid_highways, api_key):
    body = {
        'locations': [[lng, lat]],
        'range': [range_seconds],
        'range_type': 'time',
        'smoothing': 0,
    }
    if avoid_highways:
        body['options'] = {'avoid_features': ['highways']}

    encoded = json.dumps(body).encode()
    req = urllib.request.Request(
        ORS_ENDPOINT,
        data=encoded,
        headers={
            'Authorization': api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/geo+json',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


def output_path(workplace_id, minutes, avoid_highways):
    mode = 'no_highway' if avoid_highways else 'highway'
    return OUTPUT_DIR / f'{workplace_id}_{mode}_{minutes}min.geojson'


def main():
    api_key = load_api_key()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    total = len(WORKPLACES) * 2 * len(DRIVE_MINUTES)
    count = 0

    for workplace in WORKPLACES:
        for avoid_highways in [True, False]:
            for minutes in DRIVE_MINUTES:
                count += 1
                mode = 'no_highway' if avoid_highways else 'highway'
                path = output_path(workplace['id'], minutes, avoid_highways)

                if path.exists():
                    print(f'[{count}/{total}] スキップ（既存）: {path.name}')
                    continue

                print(f'[{count}/{total}] 取得中: {workplace["id"]} {mode} {minutes}min ... ', end='', flush=True)
                try:
                    data = call_ors(workplace['lat'], workplace['lng'], minutes * 60, avoid_highways, api_key)
                    path.write_text(json.dumps(data, ensure_ascii=False))
                    print('OK')
                except urllib.error.HTTPError as e:
                    print(f'ERROR {e.code}: {e.read().decode()}')
                except Exception as e:
                    print(f'ERROR: {e}')

                if count < total:
                    time.sleep(SLEEP_BETWEEN_REQUESTS)

    print(f'\n完了: {OUTPUT_DIR}')


if __name__ == '__main__':
    main()
