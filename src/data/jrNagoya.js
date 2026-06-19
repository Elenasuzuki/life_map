// JR名古屋駅からの30分圏レイヤー
//
// 対象路線:
// - JR東海道本線（東行き: 名古屋〜安城）
// - JR中央線（名古屋〜高蔵寺）
//   ※妻の新幹線通勤前提で「名古屋」= 新幹線名古屋駅を指す
//   ※中央線は春日井〜高蔵寺がトヨタ方面への車通勤圏と重なる可能性あり
//
// 方針:
// - 快速・特別快速での最速時間を基準に保守的な判定
// - 座標はJR東海の駅所在地を地理院ジオコーダで point 化した値

export const JR_NAGOYA_STATIONS = [
  {
    id: 'jr_nagoya',
    name: '名古屋',
    lat: 35.170750,
    lng: 136.883423,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 0,
    jrNagoyaAccessNote: '起点駅',
  },
  {
    id: 'jr_kanayama',
    name: '金山',
    lat: 35.143536,
    lng: 136.901657,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 4,
    jrNagoyaAccessNote: '名古屋からJR東海道本線で直通約4分',
  },
  {
    id: 'jr_atsuta',
    name: '熱田',
    lat: 35.130268,
    lng: 136.910141,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 7,
    jrNagoyaAccessNote: '名古屋からJR東海道本線で直通約7分',
  },
  {
    id: 'jr_kasadera',
    name: '笠寺',
    lat: 35.095722,
    lng: 136.926529,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 10,
    jrNagoyaAccessNote: '名古屋からJR東海道本線で直通約10分',
  },
  {
    id: 'jr_odaka',
    name: '大高',
    lat: 35.066856,
    lng: 136.937286,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 13,
    jrNagoyaAccessNote: '名古屋からJR東海道本線で直通約13分',
  },
  {
    id: 'jr_kyowa',
    name: '共和',
    lat: 35.034992,
    lng: 136.954803,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 17,
    jrNagoyaAccessNote: '名古屋からJR東海道本線で直通約17分',
  },
  {
    id: 'jr_obu',
    name: '大府',
    lat: 35.008968,
    lng: 136.961472,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 19,
    jrNagoyaAccessNote: '名古屋からJR東海道本線で直通約19分',
  },
  {
    id: 'jr_kariya',
    name: '刈谷',
    lat: 34.990871,
    lng: 137.009918,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 21,
    jrNagoyaAccessNote: '名古屋からJR東海道本線で直通約21分',
  },
  {
    id: 'jr_anjo',
    name: '安城',
    lat: 34.959995,
    lng: 137.086914,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 29,
    jrNagoyaAccessNote: '名古屋からJR東海道本線の快速系で直通約29分',
  },

  // ── JR中央線 ──
  {
    id: 'jr_chikusa',
    name: '千種',
    lat: 35.167100,
    lng: 136.930800,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 8,
    jrNagoyaAccessNote: '名古屋からJR中央線で直通約8分',
  },
  {
    id: 'jr_ozone',
    name: '大曽根',
    lat: 35.181600,
    lng: 136.919500,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 10,
    jrNagoyaAccessNote: '名古屋からJR中央線快速で直通約10分',
  },
  {
    id: 'jr_shin_moriyama',
    name: '新守山',
    lat: 35.205600,
    lng: 136.934800,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 14,
    jrNagoyaAccessNote: '名古屋からJR中央線で直通約14分',
  },
  {
    id: 'jr_kachigawa',
    name: '勝川',
    lat: 35.233300,
    lng: 136.960700,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 18,
    jrNagoyaAccessNote: '名古屋からJR中央線快速で直通約18分',
  },
  {
    id: 'jr_kasugai',
    name: '春日井',
    lat: 35.247700,
    lng: 136.976200,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 23,
    jrNagoyaAccessNote: '名古屋からJR中央線快速で直通約23分',
  },
  {
    id: 'jr_jinryo',
    name: '神領',
    lat: 35.263000,
    lng: 137.004200,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 27,
    jrNagoyaAccessNote: '名古屋からJR中央線快速で直通約27分',
  },
  {
    id: 'jr_kozoji',
    name: '高蔵寺',
    lat: 35.267800,
    lng: 137.041800,
    directFromNagoya: true,
    fastestMinutesFromJRNagoya: 30,
    jrNagoyaAccessNote: '名古屋からJR中央線快速で直通約30分（快速利用時。普通はやや超過）',
  },
]

export const QUALIFYING_JR_NAGOYA_STATIONS = JR_NAGOYA_STATIONS.filter(
  (station) => station.directFromNagoya
)
