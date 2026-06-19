// 名古屋市営地下鉄の名古屋駅30分圏レイヤー
//
// 方針:
// - 名古屋駅に直結する東山線・桜通線の直通駅に加え、
//   地下鉄のみで1回乗換・30分以内の駅も含める
// - 既存の名鉄/JRレイヤーと粒度を揃えるため、保守的な判定を採用
// - 基本座標は駅名を地理院ジオコーダで point 化した値
// - ずれが目立つ駅は、名古屋市交通局の駅ホーム案内にある
//   「交差点の下 / 東西南北どちら側に伸びるか」をもとに
//   ホーム中心寄りへ手補正

export const SUBWAY_WALK_RADIUS_M = 1000

export const NAGOYA_SUBWAY_STATIONS = [
  { id: 'subway_nakamura_koen', name: '中村公園', line: '東山線', lat: 35.167717, lng: 136.854920, directToNagoya: true, fastestMinutesToNagoya: 8, accessNote: '東山線で名古屋へ直通約8分' },
  { id: 'subway_nakamura_nisseki', name: '中村日赤', line: '東山線', lat: 35.172771, lng: 136.862431, directToNagoya: true, fastestMinutesToNagoya: 6, accessNote: '東山線で名古屋へ直通約6分' },
  { id: 'subway_honjin', name: '本陣', line: '東山線', lat: 35.177035, lng: 136.867355, directToNagoya: true, fastestMinutesToNagoya: 4, accessNote: '東山線で名古屋へ直通約4分' },
  { id: 'subway_kamejima', name: '亀島', line: '東山線', lat: 35.177556, lng: 136.877398, directToNagoya: true, fastestMinutesToNagoya: 2, accessNote: '東山線で名古屋へ直通約2分' },
  { id: 'subway_nagoya', name: '名古屋', line: '東山線・桜通線', lat: 35.170955, lng: 136.881242, directToNagoya: true, fastestMinutesToNagoya: 0, accessNote: '起点駅' },
  { id: 'subway_fushimi', name: '伏見', line: '東山線', lat: 35.168948, lng: 136.897476, directToNagoya: true, fastestMinutesToNagoya: 2, accessNote: '東山線で名古屋へ直通約2分' },
  { id: 'subway_sakae', name: '栄', line: '東山線', lat: 35.169712, lng: 136.908685, directToNagoya: true, fastestMinutesToNagoya: 4, accessNote: '東山線で名古屋へ直通約4分' },
  { id: 'subway_shinsakaemachi', name: '新栄町', line: '東山線', lat: 35.170655, lng: 136.920116, directToNagoya: true, fastestMinutesToNagoya: 6, accessNote: '東山線で名古屋へ直通約6分' },
  { id: 'subway_chikusa', name: '千種', line: '東山線', lat: 35.171000, lng: 136.930250, directToNagoya: true, fastestMinutesToNagoya: 8, accessNote: '東山線で名古屋へ直通約8分' },
  { id: 'subway_imaike', name: '今池', line: '東山線・桜通線', lat: 35.168920, lng: 136.936973, directToNagoya: true, fastestMinutesToNagoya: 10, accessNote: '東山線で名古屋へ直通約10分' },
  { id: 'subway_ikeshita', name: '池下', line: '東山線', lat: 35.169520, lng: 136.946950, directToNagoya: true, fastestMinutesToNagoya: 12, accessNote: '東山線で名古屋へ直通約12分' },
  { id: 'subway_kakuozan', name: '覚王山', line: '東山線', lat: 35.166494, lng: 136.952781, directToNagoya: true, fastestMinutesToNagoya: 14, accessNote: '東山線で名古屋へ直通約14分' },
  { id: 'subway_motoyama', name: '本山', line: '東山線', lat: 35.165560, lng: 136.963587, directToNagoya: true, fastestMinutesToNagoya: 16, accessNote: '東山線で名古屋へ直通約16分' },
  { id: 'subway_higashiyama_koen', name: '東山公園', line: '東山線', lat: 35.160627, lng: 136.972636, directToNagoya: true, fastestMinutesToNagoya: 18, accessNote: '東山線で名古屋へ直通約18分' },
  { id: 'subway_hoshigaoka', name: '星ヶ丘', line: '東山線', lat: 35.165000, lng: 136.984650, directToNagoya: true, fastestMinutesToNagoya: 20, accessNote: '東山線で名古屋へ直通約20分' },
  { id: 'subway_issha', name: '一社', line: '東山線', lat: 35.168199, lng: 136.996075, directToNagoya: true, fastestMinutesToNagoya: 22, accessNote: '東山線で名古屋へ直通約22分' },
  { id: 'subway_kamiyashiro', name: '上社', line: '東山線', lat: 35.173485, lng: 137.006641, directToNagoya: true, fastestMinutesToNagoya: 24, accessNote: '東山線で名古屋へ直通約24分' },
  { id: 'subway_hongo', name: '本郷', line: '東山線', lat: 35.176550, lng: 137.012700, directToNagoya: true, fastestMinutesToNagoya: 26, accessNote: '東山線で名古屋へ直通約26分' },
  { id: 'subway_fujigaoka', name: '藤が丘', line: '東山線', lat: 35.182525, lng: 137.021605, directToNagoya: true, fastestMinutesToNagoya: 28, accessNote: '東山線で名古屋へ直通約28分' },
  { id: 'subway_taiko_dori', name: '太閤通', line: '桜通線', lat: 35.167637, lng: 136.873368, directToNagoya: true, fastestMinutesToNagoya: 2, accessNote: '桜通線で名古屋へ直通約2分' },
  { id: 'subway_kokusai_center', name: '国際センター', line: '桜通線', lat: 35.175720, lng: 136.888450, directToNagoya: true, fastestMinutesToNagoya: 2, accessNote: '桜通線で名古屋へ直通約2分' },
  { id: 'subway_marunouchi', name: '丸の内', line: '桜通線', lat: 35.173027, lng: 136.898740, directToNagoya: true, fastestMinutesToNagoya: 4, accessNote: '桜通線で名古屋へ直通約4分' },
  { id: 'subway_hisaya_odori', name: '久屋大通', line: '桜通線', lat: 35.173674, lng: 136.907696, directToNagoya: true, fastestMinutesToNagoya: 6, accessNote: '桜通線で名古屋へ直通約6分' },
  { id: 'subway_takaoka', name: '高岳', line: '桜通線', lat: 35.175820, lng: 136.917150, directToNagoya: true, fastestMinutesToNagoya: 8, accessNote: '桜通線で名古屋へ直通約8分' },
  { id: 'subway_kurumamichi', name: '車道', line: '桜通線', lat: 35.173419, lng: 136.929543, directToNagoya: true, fastestMinutesToNagoya: 10, accessNote: '桜通線で名古屋へ直通約10分' },
  { id: 'subway_fukiage', name: '吹上', line: '桜通線', lat: 35.158742, lng: 136.935419, directToNagoya: true, fastestMinutesToNagoya: 15, accessNote: '桜通線で名古屋へ直通約15分' },
  { id: 'subway_gokiso', name: '御器所', line: '桜通線', lat: 35.149407, lng: 136.934041, directToNagoya: true, fastestMinutesToNagoya: 17, accessNote: '桜通線で名古屋へ直通約17分' },
  { id: 'subway_sakurayama', name: '桜山', line: '桜通線', lat: 35.139873, lng: 136.933294, directToNagoya: true, fastestMinutesToNagoya: 19, accessNote: '桜通線で名古屋へ直通約19分' },
  { id: 'subway_mizuho_kuyakusho', name: '瑞穂区役所', line: '桜通線', lat: 35.132094, lng: 136.934394, directToNagoya: true, fastestMinutesToNagoya: 21, accessNote: '桜通線で名古屋へ直通約21分' },
  { id: 'subway_mizuho_undojo_nishi', name: '瑞穂運動場西', line: '桜通線', lat: 35.125055, lng: 136.935454, directToNagoya: true, fastestMinutesToNagoya: 23, accessNote: '桜通線で名古屋へ直通約23分' },
  { id: 'subway_aratamabashi', name: '新瑞橋', line: '桜通線', lat: 35.117730, lng: 136.937287, directToNagoya: true, fastestMinutesToNagoya: 25, accessNote: '桜通線で名古屋へ直通約25分' },
  { id: 'subway_sakurahommachi', name: '桜本町', line: '桜通線', lat: 35.109252, lng: 136.936857, directToNagoya: true, fastestMinutesToNagoya: 27, accessNote: '桜通線で名古屋へ直通約27分' },
  { id: 'subway_tsurusato', name: '鶴里', line: '桜通線', lat: 35.105501, lng: 136.944211, directToNagoya: true, fastestMinutesToNagoya: 29, accessNote: '桜通線で名古屋へ直通約29分' },
  { id: 'subway_kamiodai', name: '上小田井', line: '鶴舞線', lat: 35.223831, lng: 136.876912, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 20, accessNote: '鶴舞線で伏見乗換、名古屋へ約20分' },
  { id: 'subway_shonai_ryokuchi_koen', name: '庄内緑地公園', line: '鶴舞線', lat: 35.214926, lng: 136.882101, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 18, accessNote: '鶴舞線で伏見乗換、名古屋へ約18分' },
  { id: 'subway_shonai_dori', name: '庄内通', line: '鶴舞線', lat: 35.203737, lng: 136.891029, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 16, accessNote: '鶴舞線で伏見乗換、名古屋へ約16分' },
  { id: 'subway_joshin', name: '浄心', line: '鶴舞線', lat: 35.192058, lng: 136.890869, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 14, accessNote: '鶴舞線で伏見乗換、名古屋へ約14分' },
  { id: 'subway_sengencho', name: '浅間町', line: '鶴舞線', lat: 35.183250, lng: 136.890306, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 12, accessNote: '鶴舞線で伏見乗換、名古屋へ約12分' },
  { id: 'subway_osu_kannon', name: '大須観音', line: '鶴舞線', lat: 35.161900, lng: 136.894350, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 5, accessNote: '鶴舞線で伏見乗換、名古屋へ約5分' },
  { id: 'subway_tsurumai', name: '鶴舞', line: '鶴舞線', lat: 35.156110, lng: 136.915255, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 10, accessNote: '鶴舞線で伏見乗換、名古屋へ約10分' },
  { id: 'subway_arahata', name: '荒畑', line: '鶴舞線', lat: 35.151253, lng: 136.925293, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 12, accessNote: '鶴舞線で伏見乗換、名古屋へ約12分' },
  { id: 'subway_kawana', name: '川名', line: '鶴舞線', lat: 35.148655, lng: 136.948296, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 15, accessNote: '鶴舞線で伏見乗換、名古屋へ約15分' },
  { id: 'subway_irinaka', name: 'いりなか', line: '鶴舞線', lat: 35.143924, lng: 136.954562, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 17, accessNote: '鶴舞線で伏見乗換、名古屋へ約17分' },
  { id: 'subway_yagoto', name: '八事', line: '鶴舞線', lat: 35.136708, lng: 136.964242, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 19, accessNote: '鶴舞線で伏見乗換、名古屋へ約19分' },
  { id: 'subway_meijo_koen', name: '名城公園', line: '名城線', lat: 35.190683, lng: 136.901464, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 11, accessNote: '名城線で久屋大通乗換、名古屋へ約11分' },
  { id: 'subway_kurokawa', name: '黒川', line: '名城線', lat: 35.197124, lng: 136.910194, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 13, accessNote: '名城線で久屋大通乗換、名古屋へ約13分' },
  { id: 'subway_shiga_hondori', name: '志賀本通', line: '名城線', lat: 35.196169, lng: 136.921222, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 15, accessNote: '名城線で久屋大通乗換、名古屋へ約15分' },
  { id: 'subway_heian_dori', name: '平安通', line: '名城線', lat: 35.196105, lng: 136.929924, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 17, accessNote: '名城線で久屋大通乗換、名古屋へ約17分' },
  { id: 'subway_yabacho', name: '矢場町', line: '名城線', lat: 35.163269, lng: 136.908715, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 7, accessNote: '名城線で栄乗換、名古屋へ約7分' },
  { id: 'subway_kamimaezu', name: '上前津', line: '名城線・鶴舞線', lat: 35.157220, lng: 136.906796, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 9, accessNote: '名城線または鶴舞線で1回乗換、名古屋へ約9分' },
  { id: 'subway_higashi_betsuin', name: '東別院', line: '名城線', lat: 35.149588, lng: 136.904703, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 11, accessNote: '名城線で栄乗換、名古屋へ約11分' },
  { id: 'subway_nishi_takakura', name: '西高蔵', line: '名城線', lat: 35.134822, lng: 136.901707, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 13, accessNote: '名城線で栄乗換、名古屋へ約13分' },
  { id: 'subway_jingu_nishi', name: '熱田神宮西', line: '名城線', lat: 35.127838, lng: 136.906816, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 15, accessNote: '名城線で栄乗換、名古屋へ約15分' },
  { id: 'subway_jingu_temmacho', name: '熱田神宮伝馬町', line: '名城線', lat: 35.120794, lng: 136.910457, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 17, accessNote: '名城線で栄乗換、名古屋へ約17分' },
  { id: 'subway_horita', name: '堀田', line: '名城線', lat: 35.116464, lng: 136.921499, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 19, accessNote: '名城線で栄乗換、名古屋へ約19分' },
  { id: 'subway_myoon_dori', name: '妙音通', line: '名城線', lat: 35.117136, lng: 136.929768, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 21, accessNote: '名城線で栄乗換、名古屋へ約21分' },
  { id: 'subway_hibino', name: '日比野', line: '名港線', lat: 35.132782, lng: 136.893118, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 13, accessNote: '名港線で金山乗換、名古屋へ約13分' },
  { id: 'subway_rokubancho', name: '六番町', line: '名港線', lat: 35.124083, lng: 136.888458, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 15, accessNote: '名港線で金山乗換、名古屋へ約15分' },
  { id: 'subway_tokai_dori', name: '東海通', line: '名港線', lat: 35.113454, lng: 136.886069, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 17, accessNote: '名港線で金山乗換、名古屋へ約17分' },
  { id: 'subway_minato_kuyakusho', name: '港区役所', line: '名港線', lat: 35.107150, lng: 136.881300, directToNagoya: false, transferCount: 1, fastestMinutesToNagoya: 19, accessNote: '名港線で金山乗換、名古屋へ約19分' },
]

export const QUALIFYING_SUBWAY_NAGOYA_STATIONS = NAGOYA_SUBWAY_STATIONS.filter(
  (station) => station.fastestMinutesToNagoya <= 30
)
