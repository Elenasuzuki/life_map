// 名鉄名古屋本線の駅データ
//
// 根本見直し:
// - 座標は名鉄公式の各駅「所在地」を地理院ジオコーダで point 化
// - 「豊橋30分圏」は、擬似的な分数の連番ではなく
//   「豊橋から直通列車で30分以内に到達可能な駅」を保守的に採用
//
// 座標ソース:
// - 名鉄公式 各駅詳細情報の所在地
// - 地理院ジオコーダ https://msearch.gsi.go.jp/address-search/AddressSearch
//
// 30分圏判定の考え方:
// - 豊橋起点の直通時刻表ベースで、30分以内に到達できる主要駅のみを強調
// - 乗換が必要な駅や、時間帯で30分超/以内が揺れる駅は保守的に除外

export const WALK_RADIUS_M = 1000
export const TRAIN_LIMIT_MIN = 30

export const MEITETSU_STATIONS = [
  {
    id: 'meitetsu_nagoya',
    name: '名鉄名古屋',
    lat: 35.169827,
    lng: 136.884384,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 0,
    nagoyaAccessNote: '起点駅',
  },
  {
    id: 'kanayama',
    name: '金山',
    lat: 35.142136,
    lng: 136.900726,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 3,
    nagoyaAccessNote: '名鉄名古屋から直通で約3分',
  },
  {
    id: 'jingumae',
    name: '神宮前',
    lat: 35.126251,
    lng: 136.912491,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 6,
    nagoyaAccessNote: '名鉄名古屋から直通で約6分',
  },
  {
    id: 'narumi',
    name: '鳴海',
    lat: 35.078434,
    lng: 136.950745,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 14,
    nagoyaAccessNote: '名鉄名古屋から直通で約14分',
  },
  {
    id: 'sakyo',
    name: '左京山',
    lat: 35.069916,
    lng: 136.962387,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 17,
    nagoyaAccessNote: '名鉄名古屋から直通で約17分',
  },
  {
    id: 'arimatsu',
    name: '有松',
    lat: 35.066967,
    lng: 136.972076,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 19,
    nagoyaAccessNote: '名鉄名古屋から直通で約19分',
  },
  {
    id: 'chukyo_keiba',
    name: '中京競馬場前',
    lat: 35.061695,
    lng: 136.980774,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 21,
    nagoyaAccessNote: '名鉄名古屋から直通で約21分',
  },
  {
    id: 'zengo',
    name: '前後',
    lat: 35.052383,
    lng: 136.995483,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 19,
    nagoyaAccessNote: '名鉄名古屋から直通の急行で約19分',
  },
  {
    id: 'toyoake',
    name: '豊明',
    lat: 35.041012,
    lng: 137.008591,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 23,
    nagoyaAccessNote: '名鉄名古屋から直通の準急で約23分',
  },
  { id: 'fujimatsu', name: '富士松', lat: 35.029697, lng: 137.016754, directFromToyohashi: false },
  { id: 'hitotsugi', name: '一ツ木', lat: 35.013184, lng: 137.026428, directFromToyohashi: false },
  {
    id: 'chiryu',
    name: '知立',
    lat: 35.005955,
    lng: 137.040405,
    directFromToyohashi: false,
    directFromNagoya: true,
    fastestMinutesFromNagoya: 20,
    nagoyaAccessNote: '名鉄名古屋から直通の特急で約20分',
  },
  { id: 'ushida', name: '牛田', lat: 34.999508, lng: 137.060532, directFromToyohashi: false },
  {
    id: 'shin_anjo',
    name: '新安城',
    lat: 34.987610,
    lng: 137.084885,
    directFromToyohashi: true,
    directFromNagoya: true,
    fastestMinutesFromToyohashi: 29,
    accessNote: '豊橋から直通の優等列車で約29分圏',
    fastestMinutesFromNagoya: 25,
    nagoyaAccessNote: '名鉄名古屋から直通の特急・急行で約25分',
  },
  { id: 'uto', name: '宇頭', lat: 34.970470, lng: 137.118973, directFromToyohashi: false },
  {
    id: 'yatsuhashibashi',
    name: '矢作橋',
    lat: 34.961666,
    lng: 137.140045,
    directFromToyohashi: true,
    fastestMinutesFromToyohashi: 30,
    accessNote: '豊橋から直通列車の最速帯で約30分',
  },
  { id: 'okazaki_koen', name: '岡崎公園前', lat: 34.955124, lng: 137.153015, directFromToyohashi: false },
  {
    id: 'higashi_okazaki',
    name: '東岡崎',
    lat: 34.952389,
    lng: 137.166962,
    directFromToyohashi: true,
    fastestMinutesFromToyohashi: 20,
    accessNote: '豊橋から直通の快速特急・特急で約20分',
  },
  { id: 'otogawa', name: '男川', lat: 34.937759, lng: 137.183533, directFromToyohashi: false },
  {
    id: 'miai',
    name: '美合',
    lat: 34.924236,
    lng: 137.195801,
    directFromToyohashi: true,
    fastestMinutesFromToyohashi: 22,
    accessNote: '豊橋から直通の急行で約22分',
  },
  { id: 'fujikawa', name: '藤川', lat: 34.913227, lng: 137.218826, directFromToyohashi: false },
  {
    id: 'motojuku',
    name: '本宿',
    lat: 34.892651,
    lng: 137.259811,
    directFromToyohashi: true,
    fastestMinutesFromToyohashi: 25,
    accessNote: '豊橋から直通の急行・準急で約25分',
  },
  { id: 'meiden_yamanaka', name: '名電山中', lat: 34.884360, lng: 137.274480, directFromToyohashi: false },
  { id: 'meiden_nagasawa', name: '名電長沢', lat: 34.871284, lng: 137.287903, directFromToyohashi: false },
  { id: 'meiden_akasaka', name: '名電赤坂', lat: 34.858582, lng: 137.308090, directFromToyohashi: false },
  { id: 'goyu', name: '御油', lat: 34.845749, lng: 137.321640, directFromToyohashi: false },
  {
    id: 'kokufu',
    name: '国府',
    lat: 34.837212,
    lng: 137.328934,
    directFromToyohashi: true,
    fastestMinutesFromToyohashi: 8,
    accessNote: '豊橋から直通の特急・急行で約8分',
  },
  { id: 'odabuchi', name: '小田渕', lat: 34.814583, lng: 137.345825, directFromToyohashi: false },
  {
    id: 'ina',
    name: '伊奈',
    lat: 34.802536,
    lng: 137.354919,
    directFromToyohashi: true,
    fastestMinutesFromToyohashi: 5,
    accessNote: '豊橋から直通で約5分',
  },
  {
    id: 'toyohashi',
    name: '豊橋',
    lat: 34.763454,
    lng: 137.381500,
    directFromToyohashi: true,
    fastestMinutesFromToyohashi: 0,
    accessNote: '起点駅',
  },
]

export const QUALIFYING_STATIONS = MEITETSU_STATIONS.filter(
  (station) => station.directFromToyohashi
)

export const QUALIFYING_STATIONS_NAGOYA = MEITETSU_STATIONS.filter(
  (station) => station.directFromNagoya
)
