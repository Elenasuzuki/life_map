// ──────────────────────────────────────────────
//  拠点データ
// ──────────────────────────────────────────────

/** 車アクセス圏の起点 */
export const WORKPLACES = [
  {
    id: 'toyota_hq',
    name: 'トヨタ本社',
    lat: 35.051659,
    lng: 137.160568,
    note: '〒471-8571 愛知県豊田市トヨタ町1番地 / 車アクセス圏の起点',
    iconEmoji: '🏢',
    type: 'workplace',
  },
  {
    id: 'toyota_shimoyama',
    name: 'トヨタテクニカルセンター下山',
    lat: 35.024651,
    lng: 137.311401,
    note: '愛知県豊田市下山田代町 / 車アクセス圏の起点',
    iconEmoji: '🏢',
    type: 'workplace',
  },
  {
    id: 'shota_family_home',
    name: '昭太実家',
    lat: 35.136021,
    lng: 136.943649,
    note: '〒467-0028 愛知県名古屋市瑞穂区初日町1丁目30-16 / 車アクセス圏の起点',
    iconEmoji: '🏠',
    type: 'workplace',
  },
]

/** 新幹線アクセスの主要駅 */
export const SHINKANSEN_STATIONS = [
  {
    id: 'shinkansen_nagoya',
    name: '名古屋駅',
    lat: 35.170915,
    lng: 136.881537,
    note: '東海道新幹線の主要アクセス駅',
    iconEmoji: '🚄',
    type: 'shinkansen',
  },
  {
    id: 'shinkansen_mikawa_anjo',
    name: '三河安城駅',
    lat: 34.968964,
    lng: 137.060460,
    note: '東海道新幹線の主要アクセス駅 / 徒歩15分圏の起点',
    iconEmoji: '🚄',
    type: 'shinkansen',
  },
  {
    id: 'shinkansen_toyohashi',
    name: '豊橋駅',
    lat: 34.762790,
    lng: 137.382495,
    note: '東海道新幹線の主要アクセス駅',
    iconEmoji: '🚄',
    type: 'shinkansen',
  },
]
