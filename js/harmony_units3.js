/* =========================================================
   楽典ラボ：和声法の 単元（その3）
   h07 非和声音　h08 副三和音と七の和音　h09 短調の和声
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, U = GK.Q.util, UT = H.UT, L = GK.L;
  var N = function (p) { return GK.nm(p); };
  var mc = U.mc, tx = U.tx, pick = U.pick, ri = U.ri, shuffle = U.shuffle, add = U.add, MEMO = L.MEMO, table = L.table;
  var Ch = UT.Ch, kname = UT.kname, rkey = UT.rkey, fig = H.fig, vv = UT.vv, row2 = UT.row2, gold = UT.gold, oneChord = UT.oneChord;
  var RED = '#c0392b', BLUE = '#2d6fb0';
  var sc = function (key, minor) { return M.scale(M.keyTonic(key, minor), minor ? 'harmonic' : 'major'); };
  var at = function (s, d) { var p = s[(d - 1) % 7], o = Math.floor((d - 1) / 7); return { l: p.l, a: p.a, o: p.o + o }; };

  /* =================== h07 非和声音 =================== */
  var NCT = {
    pass: ['経過音', '和音の 音から 次の 和音の 音へ、<b>順次進行</b>で つなぐ 音'],
    nei: ['刺繍音', '和音の 音から <b>2度 はなれて</b> もとの 音へ もどる 音（かざり）'],
    app: ['倚音', '<b>跳躍で 入り</b>、<b>順次進行で</b> 和音の 音へ 解決する 音（強拍に 来る）'],
    sus: ['掛留音', '前の 和音の 音を <b>つないで</b> 次の 和音にまで 残し、<b>2度 下行</b>で 解決する 音'],
    ant: ['先取音', '次の 和音の 音を <b>先に 出して</b> しまう 音']
  };
  var NK = Object.keys(NCT);
  add('nctDef', 'h07', 1, function (R) {
    var k = pick(NK, R), m = mc(R, tx(NCT[k][0], k), NK.map(function (x) { return tx(NCT[x][0], x); }));
    return { q: NCT[k][1] + ' ── これは？', ch: m.ch, a: m.a, ex: '<b>' + NCT[k][0] + '</b>：' + NCT[k][1] + '。' };
  });
  var PAT = { pass: [[1, 2, 3], [3, 4, 5], [5, 4, 3], [3, 2, 1]], nei: [[3, 4, 3], [5, 6, 5], [5, 4, 5], [3, 2, 3], [1, 2, 1], [1, 0, 1]], app: [[3, 6, 5], [1, 4, 3], [5, 9, 8]] };
  add('nctFig', 'h07', 2, function (R, st) {
    var k = pick(['pass', 'nei', 'app'], R), key = rkey(R), s = sc(key, false), d = pick(PAT[k], R);
    var ps = d.map(function (x) { return x === 0 ? { l: s[6].l, a: s[6].a, o: s[6].o - 1 } : at(s, x); });
    var notes = ps.map(function (p, i) { return { k: M.str(p), d: 'q', c: i === 1 ? RED : '#333', lab: i === 1 ? '？' : '' }; });
    var m = mc(R, tx(NCT[k][0], k), ['pass', 'nei', 'app'].map(function (x) { return tx(NCT[x][0], x); }), 3);
    return { q: kname(key) + '。Ⅰ の 和音（' + [0, 2, 4].map(function (i) { return N(s[i]); }).join('・') + '）の 上で、<b>赤い音</b> は 非和声音。何かな？', fig: { score: { clef: 'treble', key: key, notes: notes, sp: 52, zoom: 2 } }, ch: m.ch, a: m.a, ex: '<b>' + NCT[k][0] + '</b>：' + NCT[k][1] + '。' + (k === 'pass' ? '前後の 和音の 音を 順次進行で つないでいる。' : k === 'nei' ? '同じ 和音の 音の あいだに はさまって いる。' : '跳躍で 非和声音に 入って、順次で 和音の 音へ。'), play: ps.map(function (p) { return [p, 0.5]; }) };
  });
  add('nctPick', 'h07', 1, function (R) {
    var key = rkey(R), s = sc(key, false), non = [2, 4, 6].map(function (i) { return s[i % 7]; }), ct = [0, 2, 4].map(function (i) { return s[i]; });
    var a = pick([1, 3, 5, 6], R), m = mc(R, tx(N(s[a])), [0, 2, 4].map(function (i) { return tx(N(s[i])); }));
    return { q: kname(key) + '。Ⅰ の 和音（' + ct.map(N).join('・') + '）の 上で <b>非和声音</b> は どれ？', ch: m.ch, a: m.a, ex: 'Ⅰ の 和音は ' + ct.map(N).join('・') + '。<b>' + N(s[a]) + '</b> は 和音の 音ではない ので 非和声音。' };
  });
  add('nctRule', 'h07', 2, function (R) {
    var L1 = [
      ['倚音は どう 解決する？', '<b>順次進行</b> で 和音の 音へ', ['跳躍で 次の 音へ', 'そのまま 動かない', '半音 上へ かならず'], '倚音は 強拍に 来て、<b>順次進行</b> で 和音の 音へ 解決する。'],
      ['掛留音は どう 解決する？', '<b>2度 下行</b> する', ['2度 上行 する', '3度 跳ぶ', '同じ 音を 保つ'], '掛留音は 前の 音を つないで、<b>2度 下行</b> で 解決する。'],
      ['先取音とは？', '次の 和音の 音を <b>先に 出す</b>', ['前の 和音の 音を 残す', '跳躍で 入る', '順次で つなぐ'], '先取音は 次の 和音の 音を 先に 鳴らす。'],
      ['経過音の 動き方は？', '<b>同じ 向き</b> の 順次進行', ['跳躍で 入って 出る', 'もとの 音に もどる', '3度 ずつ 跳躍する'], '経過音は 和音の 音と 和音の 音を 順次で つなぐ。'],
      ['刺繍音の 動き方は？', '2度 はなれて <b>もとの 音へ もどる</b>', ['同じ向きに 進む', '跳躍で 入る', '次の 和音の 音を 出す'], '刺繍音は 和音の 音 → 隣の 音 → もとの 音。']
    ];
    var x = pick(L1, R), m = mc(R, tx(x[1]), x[2].map(function (s) { return tx(s); }).concat([tx(x[1])]));
    return { q: x[0], ch: m.ch, a: m.a, ex: x[3] };
  });

  /* =================== h08 副三和音と七の和音 =================== */
  var QUAL = { 1: '長三和音', 2: '短三和音', 3: '短三和音', 4: '長三和音', 5: '長三和音', 6: '短三和音', 7: '減三和音' };
  add('subName', 'h08', 1, function (R) {
    var d = ri(1, 7, R), all = ['長三和音', '短三和音', '減三和音'], m = mc(R, tx(QUAL[d]), all.map(function (x) { return tx(x); }), 3);
    return { q: '長調で <b>' + H.ROMAN[d] + '</b> の 和音は？', ch: m.ch, a: m.a, ex: '長調の 三和音：Ⅰ・Ⅳ・Ⅴ ＝ <b>長</b>、Ⅱ・Ⅲ・Ⅵ ＝ <b>短</b>、Ⅶ ＝ <b>減</b>。' + H.ROMAN[d] + ' は <b>' + QUAL[d] + '</b>。' };
  });
  add('subNotes', 'h08', 2, function (R) {
    var key = rkey(R), d = pick([2, 3, 4, 6, 7], R), pc = H.pcs(key, false, Ch(d)), txt = function (a) { return a.map(N).join('・'); };
    var wr = [[1, 3, 5], [2, 4, 6], [3, 5, 7], [4, 6, 1]].map(function (a) { return a.map(function (x) { return at(sc(key, false), x); }); }).map(txt).filter(function (t) { return t !== txt(pc); });
    var m = mc(R, tx(txt(pc)), wr.map(function (t) { return tx(t); }));
    return { q: kname(key) + '。<b>' + H.ROMAN[d] + '</b> の 和音の 構成音は？', ch: m.ch, a: m.a, ex: H.ROMAN[d] + ' は 音階の ' + d + ' 番目から 3度ずつ 重ねる → <b>' + txt(pc) + '</b>。' };
  });
  var SUBOF = { 2: 'Ⅳ（下属和音）', 6: 'Ⅰ（主和音）', 7: 'Ⅴ（属和音）', 3: 'Ⅰ（主和音）' };
  add('subSub', 'h08', 2, function (R) {
    var d = pick([2, 6, 7, 3], R), m = mc(R, tx(SUBOF[d]), ['Ⅰ（主和音）', 'Ⅳ（下属和音）', 'Ⅴ（属和音）'].map(function (x) { return tx(x); }), 3);
    return { q: '<b>' + H.ROMAN[d] + '</b> の 和音は、どの 和音の「代理」として 働く？', ch: m.ch, a: m.a, ex: H.ROMAN[d] + ' は 構成音を 2 つ 共有する <b>' + SUBOF[d] + '</b> の 代理。Ⅰ↔Ⅵ（ドミソ／ラドミ）・Ⅳ↔Ⅱ・Ⅴ↔Ⅶ。' };
  });
  add('v7Notes', 'h08', 2, function (R) {
    var key = rkey(R), pc = H.pcs(key, false, Ch(5, 0, true)), txt = function (a) { return a.map(N).join('・'); }, s = sc(key, false);
    var wr = [[5, 7, 2], [5, 7, 2, 5], [1, 3, 5, 7], [5, 7, 2, 3]].map(function (a) { return a.map(function (x) { return at(s, x); }); }).map(txt).filter(function (t) { return t !== txt(pc); });
    wr.push(txt([at(s, 5), at(s, 7), at(s, 2), at(s, 5)])); wr = wr.filter(function (t, i) { return wr.indexOf(t) === i && t !== txt(pc); });
    var m = mc(R, tx(txt(pc)), wr.map(function (t) { return tx(t); }));
    return { q: kname(key) + '。<b>Ⅴ₇</b>（属七の和音）の 構成音は？', ch: m.ch, a: m.a, ex: 'Ⅴ の 3度ずつ 重ねて さらに 7度 → <b>' + txt(pc) + '</b>（根音・第3音＝導音・第5音・第7音）。' };
  });
  add('v7Why', 'h08', 2, function (R) {
    var L1 = [
      ['Ⅴ₇ の 第7音は どの 方向へ 解決する？', '2度 下行', ['2度 上行', '3度 上行', '同音 保持'], '第7音は <b>2度 下行</b>。ファ → ミ。'],
      ['Ⅴ₇ → Ⅰ で Ⅰ の 第5音を 省略 するのは どんな とき？', '各声部が なめらかに 進み、導音と 第7音を 解決 するため', ['いつでも 省略 しなければ ならない', '根音を 3 つ 重ねたいから', '転回形の ときだけ'], 'Ⅴ₇ は 4 音 なので、Ⅰ の 第5音を 省略して <b>根音を 3 つ</b> にする ことが ある（完全な 4 音の Ⅴ₇ から）。'],
      ['Ⅴ₇ は 何和音？', '<b>属七の和音</b>', ['属三和音', '減七の和音', '副七の和音'], 'Ⅴ の 上に 7度を 加えた 和音を 属七の和音 という。'],
      ['Ⅴ₇ の 導音と 第7音の ひびきは？', '<b>減5度</b>（トライトーン）で 解決したい', ['完全5度で 安定', '長3度で 明るい', '8度で とけあう'], 'シ と ファ の 減5度が 強く 解決を 求める。']
    ];
    var x = pick(L1, R), m = mc(R, tx(x[1]), x[2].map(function (s) { return tx(s); }).concat([tx(x[1])]));
    return { q: x[0], ch: m.ch, a: m.a, ex: x[3] };
  });

  /* =================== h09 短調の和声 =================== */
  var MQ = { 1: '短三和音', 2: '減三和音', 3: '増三和音', 4: '短三和音', 5: '長三和音', 6: '長三和音', 7: '減三和音' };
  add('minLT', 'h09', 1, function (R) {
    var key = pick(H.KEYS.min, R), s = sc(key, true), lt = s[6], nat = M.scale(M.keyTonic(key, true), 'natural')[6];
    var wr = s.slice(0, 6).map(function (p) { return tx(N(p)); }).filter(function (t, i) { return i !== 6; });
    wr.push(tx(N(nat))); var m = mc(R, tx(N(lt)), wr);
    return { q: kname(key, true) + '。和声短音階の <b>導音</b>（Ⅴ の 3度）は？', ch: m.ch, a: m.a, ex: '短調では 和声短音階で <b>第7音を 半音 上げて</b> 導音を つくる → <b>' + N(lt) + '</b>（自然短音階は ' + N(nat) + '）。' };
  });
  add('minQual', 'h09', 2, function (R) {
    var d = ri(1, 7, R), all = ['短三和音', '長三和音', '減三和音', '増三和音'], m = mc(R, tx(MQ[d]), all.map(function (x) { return tx(x); }));
    return { q: '短調（和声短音階）で <b>' + H.ROMAN[d] + '</b> の 和音は？', ch: m.ch, a: m.a, ex: '短調：Ⅰ・Ⅳ ＝ 短、Ⅴ・Ⅵ ＝ 長、Ⅱ・Ⅶ ＝ 減、Ⅲ ＝ 増。' + H.ROMAN[d] + ' は <b>' + MQ[d] + '</b>。' };
  });
  add('minAug', 'h09', 2, function (R) {
    var key = pick(H.KEYS.min, R), s = sc(key, true), a = [s[5], s[6]], t = function (x) { return N(x[0]) + ' → ' + N(x[1]); };
    var o = [[s[5], s[6]], [s[4], s[5]], [s[6], s[7]], [s[2], s[3]]], m = mc(R, tx(t(o[0])), o.map(function (x) { return tx(t(x)); }));
    return { q: kname(key, true) + '。和声短音階で <b>増2度</b> に なって、歌いにくい 進みは？', ch: m.ch, a: m.a, ex: '和声短音階は 第6音と 導音の あいだが <b>増2度</b>（' + t(o[0]) + '）。和声では この 動きを さけ、' + N(s[5]) + ' は ' + N(s[4]) + ' へ 下がるなど 工夫する。' };
  });
  add('minLTvoice', 'h09', 3, function (R) {
    var key = pick(H.KEYS.min, R), ch = Ch(5), v = oneChord(key, true, ch, R); if (!v) throw new Error('minLTvoice');
    var lt = H.lt(key, true), idx = -1, n = 0; v.forEach(function (p, j) { if (p.l === lt.l && p.a === lt.a) { idx = j; n++; } });
    if (n !== 1) throw new Error('minLTvoice n');
    var col = [[null, null, null, null]]; col[0][idx] = gold;
    var m = mc(R, tx(H.VN ? H.VN[idx] : ['ソプラノ', 'アルト', 'テノール', 'バス'][idx]), ['ソプラノ', 'アルト', 'テノール', 'バス'].map(function (x) { return tx(x); }));
    return { q: kname(key, true) + '。この Ⅴ の 和音で <b>導音（' + N(lt) + '）</b> を うたっている 声部は？', fig: fig(key, true, [ch], [v], { zoom: 2.4, nolab: false }), ch: m.ch, a: m.a, ex: '導音 ' + N(lt) + ' は <b>' + ['ソプラノ', 'アルト', 'テノール', 'バス'][idx] + '</b>。導音は 重ねず、Ⅰ へ 上行 して 解決させる。', exFig: fig(key, true, [ch], [v], { zoom: 2.4, col: col }) };
  });

  /* =================== 授業 =================== */
  var minCad = H.solve(0, true, [Ch(1), Ch(4), Ch(5), Ch(1)], null, GK.rng(5));
  var nctFig1 = function (key, deg, c, lab) { var s = sc(key, false); return { score: { clef: 'treble', key: key, notes: deg.map(function (x, i) { return { k: M.str(at(s, x)), d: 'q', c: i === 1 ? RED : '#333', lab: i === 1 ? lab : '' }; }), sp: 46, zoom: 1.9 } }; };
  GK.UNITDEF.push(
    {
      id: 'h07', title: '非和声音', en: 'Non-Chord Tones', sym: '♪', goal: '和音に 入らない 音（かざり）の 種類が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '非和声音 ＝ 和音の「外」の 音', b: 'メロディーには 和音の 音では ない「かざり」の 音が まじる。これが <b>非和声音</b>。うまく 使うと 歌のように 流れる。', fig: nctFig1(0, [1, 2, 3], 0, '経過') },
        { k: 'ポイント 1', h: '経過音と 刺繍音', b: '<b>経過音</b>：和音の 音と 和音の 音を <em>順次進行で つなぐ</em>。<b>刺繍音</b>：和音の 音から 隣へ 行って <em>もとへ もどる</em>。', fig: row2(nctFig1(0, [3, 4, 5], 0, '経過音'), nctFig1(0, [3, 4, 3], 0, '刺繍音'), 'ミ → ファ → ソ', 'ミ → ファ → ミ') },
        { k: 'ポイント 2', h: '倚音（いおん）', b: '強拍で <em>跳躍して</em> 非和声音に 入り、<b>順次進行</b>で 和音の 音へ 解決する。「寄りかかる」ような 切なさ。', fig: nctFig1(0, [3, 6, 5], 0, '倚音') },
        { k: 'ポイント 3', h: '掛留音と 先取音', b: '<b>掛留音</b>：前の 和音の 音を <em>つないで</em> 残し、<b>2度 下行</b> で 解決（4‑3 掛留 など）。<b>先取音</b>：次の 和音の 音を <em>先に</em> 鳴らす。', fig: { html: table(['名前', '動き', 'イメージ'], [['経過音', '順次で つなぐ', 'ふみ石'], ['刺繍音', '隣へ 行って もどる', 'ししゅうの 針'], ['倚音', '跳躍で 入り 順次で 解決', 'よりかかる'], ['掛留音', 'つなぎ 2度 下行', 'ひきずる'], ['先取音', '次の音を 先に', 'フライング']], { fs: 14, mw: 440 }) } },
        MEMO('非和声音の 合言葉', '「どこから 来て どこへ 行くか」で 見分ける。', [['経過音 ＝ 順次で ふみ石', '前も 後ろも 和音の 音'], ['刺繍音 ＝ いって もどる', '同じ 音に もどって くる'], ['倚音 ＝ 跳んで 入って 順次で 解決', '強拍に 来る'], ['掛留音 ＝ つないで 2度 下がる', '先取音 ＝ 次の 和音を 先取り']])
      ],
      sum: ['非和声音は 和音の 外の かざり', '経過音（順次でつなぐ）・刺繍音（行ってもどる）・倚音（跳んで順次解決）', '掛留音（つなぎ 2度下行）・先取音（次の音を先に）'],
      types: ['nctDef', 'nctPick', 'nctFig', 'nctRule']
    },
    {
      id: 'h08', title: '副三和音と 七の和音', en: 'Secondary Triads & 7th Chords', sym: '⑦', goal: 'Ⅱ・Ⅲ・Ⅵ・Ⅶ と Ⅴ₇ が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '主要三和音の「代理」が 副三和音', b: '主要三和音は <b>Ⅰ・Ⅳ・Ⅴ</b>。<b>Ⅱ・Ⅲ・Ⅵ・Ⅶ</b> を <em>副三和音</em> といい、似た 働きの 和音の <b>代理</b> に なる。', fig: { html: table(['和音', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'], [['種類', '長', '短', '短', '長', '長', '短', '減'], ['働き', 'T', 'S', 'T', 'S', 'D', 'T', 'D']], { fs: 15, mw: 420 }) } },
        { k: 'ポイント 1', h: '代理の 関係', b: '<b>Ⅵ</b> は Ⅰ の 代理（共通音 2つ）、<b>Ⅱ</b> は Ⅳ の 代理、<b>Ⅶ</b> は Ⅴ の 代理。<em>Ⅴ → Ⅵ</em> が 偽終止。', fig: row2(fig(0, false, [Ch(1), Ch(6)], vv('C5 G4 E4 C3', 'C5 A4 E4 A2'), { zoom: 2.2 }), fig(0, false, [Ch(4), Ch(2)], vv('C5 A4 F4 F3', 'D5 A4 F4 D3'), { zoom: 2.2 }), 'Ⅰ と Ⅵ', 'Ⅳ と Ⅱ') },
        { k: 'ポイント 2', h: 'Ⅴ₇（属七の和音）', b: 'Ⅴ に <b>7度</b> を 加えた 4 音の 和音。<b>導音（シ）</b> と <b>第7音（ファ）</b> の 減5度が 強く 解決を 求める。Ⅰ に 向かう 力が 強い。', fig: fig(0, false, [Ch(5, 0, true), Ch(1)], (H.solve(0, false, [Ch(5, 0, true), Ch(1)], null, GK.rng(6)) || vv('B4 G4 D4 G3', 'C5 G4 E4 C3')), { zoom: 2.4 }) },
        MEMO('副三和音の 覚え方', '長・短・減を おさえよう。', [['Ⅰ・Ⅳ・Ⅴ ＝ 長三和音', 'Ⅱ・Ⅲ・Ⅵ ＝ 短三和音、Ⅶ ＝ 減三和音'], ['Ⅵ は Ⅰ の 代理', 'Ⅱ は Ⅳ、Ⅶ は Ⅴ の 代理'], ['Ⅴ₇ ＝ ソ シ レ ファ', '導音は 上へ、第7音は 下へ']])
      ],
      sum: ['副三和音：Ⅱ・Ⅲ・Ⅵ ＝ 短、Ⅶ ＝ 減', 'Ⅵ は Ⅰ の、Ⅱ は Ⅳ の、Ⅶ は Ⅴ の 代理', 'Ⅴ₇ は 4 音（根・3・5・7）。導音は 上、第7音は 下へ'],
      types: ['subName', 'subNotes', 'subSub', 'v7Notes', 'v7Why']
    },
    {
      id: 'h09', title: '短調の 和声', en: 'Harmony in Minor', sym: 'm', goal: '短調での 導音・和音の 種類・増2度に 気づける',
      cards: [
        { k: '✨ ひとことで言うと', h: '短調は「和声短音階」で 考える', b: '短調では Ⅴ に <b>導音</b> が ほしいので、第7音を <b>半音 上げた</b> <em>和声短音階</em> を つかう。（イ短調なら ソ → <b>ソ♯</b>）', fig: { score: { clef: 'treble', key: 0, notes: M.scale({ l: 5, a: 0, o: 4 }, 'harmonic').map(function (p, i) { return { k: M.str(p), d: 'q', c: i === 6 ? RED : '#333', lab: i === 6 ? '導音' : '' }; }), sp: 40, zoom: 1.8 } } },
        { k: 'ポイント 1', h: '短調の 三和音', b: 'Ⅰ・Ⅳ ＝ 短、<b>Ⅴ・Ⅵ ＝ 長</b>、Ⅱ・Ⅶ ＝ 減、<b>Ⅲ ＝ 増</b>。Ⅴ は 長三和音 に なるのが 大事（導音が ある から）。', fig: { html: table(['和音', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'], [['種類', '短', '減', '増', '短', '長', '長', '減']], { fs: 15, mw: 420 }) } },
        { k: 'ポイント 2', h: '増2度を さける', b: '和声短音階では <b>第6音 → 導音</b> が <em>増2度</em>（ファ → ソ♯）。歌いにくい ので 和声では ふつう この 動きを さける。', fig: minCad ? fig(0, true, [Ch(1), Ch(4), Ch(5), Ch(1)], minCad, { zoom: 2.2, sp: 48 }) : { html: '' } },
        MEMO('短調の ポイント', 'Ⅴ だけは 長調と 同じ ひびきに する。', [['導音は 第7音を 半音 上げる', 'イ短調 ＝ ソ → ソ♯'], ['Ⅴ は 長三和音', 'Ⅴ₇ も 同じ ひびき'], ['増2度（6→7）は さける', 'Ⅲ は 増三和音 なので ふつう 使わない']])
      ],
      sum: ['和声短音階：第7音を 半音 上げた 導音', 'Ⅰ・Ⅳ ＝ 短、Ⅴ・Ⅵ ＝ 長、Ⅱ・Ⅶ ＝ 減、Ⅲ ＝ 増', '第6音 → 導音は 増2度。さけて 進める'],
      types: ['minLT', 'minQual', 'minAug', 'minLTvoice']
    }
  );
})();
