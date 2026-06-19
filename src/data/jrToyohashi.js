// JR豊橋駅からの30分圏レイヤー
//
// 方針:
// - 豊橋駅への新幹線アクセスを意識し、
//   JR東海道本線の直通30分以内の主要駅を保守的に採用
// - 座標は地理院ジオコーダの駅 point を使用

export const JR_TOYOHASHI_STATIONS = [
  {
    id: 'jr_toyohashi',
    name: '豊橋',
    lat: 34.762225,
    lng: 137.381588,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 0,
    jrToyohashiAccessNote: '起点駅',
  },
  {
    id: 'jr_nishikosakai',
    name: '西小坂井',
    lat: 34.796701,
    lng: 137.353005,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 5,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約5分',
  },
  {
    id: 'jr_aichi_mito',
    name: '愛知御津',
    lat: 34.812471,
    lng: 137.316479,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 9,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約9分',
  },
  {
    id: 'jr_mikawa_otsuka',
    name: '三河大塚',
    lat: 34.815882,
    lng: 137.283510,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 13,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約13分',
  },
  {
    id: 'jr_mikawa_miya',
    name: '三河三谷',
    lat: 34.818490,
    lng: 137.247749,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 17,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約17分',
  },
  {
    id: 'jr_gamagori',
    name: '蒲郡',
    lat: 34.822681,
    lng: 137.225701,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 20,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約20分',
  },
  {
    id: 'jr_mikawa_shiotsu',
    name: '三河塩津',
    lat: 34.825079,
    lng: 137.201444,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 22,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約22分',
  },
  {
    id: 'jr_mikawamita',
    name: '三ケ根',
    lat: 34.836018,
    lng: 137.174274,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 26,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約26分',
  },
  {
    id: 'jr_futagawa',
    name: '二川',
    lat: 34.725540,
    lng: 137.438766,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 6,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約6分',
  },
  {
    id: 'jr_shinjohara',
    name: '新所原',
    lat: 34.723020,
    lng: 137.484470,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 11,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約11分',
  },
  {
    id: 'jr_washizu',
    name: '鷲津',
    lat: 34.716757,
    lng: 137.546083,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 15,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約15分',
  },
  {
    id: 'jr_arai_machi',
    name: '新居町',
    lat: 34.694170,
    lng: 137.569200,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 18,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約18分',
  },
  {
    id: 'jr_bentenjima',
    name: '弁天島',
    lat: 34.690117,
    lng: 137.602885,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 22,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約22分',
  },
  {
    id: 'jr_maisaka',
    name: '舞阪',
    lat: 34.685700,
    lng: 137.626411,
    directFromToyohashi: true,
    fastestMinutesFromJRToyohashi: 26,
    jrToyohashiAccessNote: '豊橋からJR東海道本線で直通約26分',
  },
]

export const QUALIFYING_JR_TOYOHASHI_STATIONS = JR_TOYOHASHI_STATIONS.filter(
  (station) => station.directFromToyohashi
)
