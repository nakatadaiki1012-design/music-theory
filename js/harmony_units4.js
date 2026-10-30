/* =========================================================
   楽典ラボ：和声法の 単元（その4）── 「和声 理論と実習」第1巻の 後半
   h10 Ⅴ₇の転回形　h11 四六の和音　h12 Ⅱ₇・Ⅶ₇と副七　h13 属九の和音　h14 実習のすすめ方
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, U = GK.Q.util, UT = H.UT, L = GK.L;
  var N = function (p) { return GK.nm(p); };
  var mc = U.mc, tx = U.tx, pick = U.pick, ri = U.ri, shuffle = U.shuffle, add = U.add, MEMO = L.MEMO, table = L.table;
  var kname = UT.kname, rkey = UT.rkey, fig = H.fig, KIND = UT.KIND, row2 = UT.row2, gold = UT.gold;
  var mid = function (p) { return M.midi(p); };
  var Ch = function (d, inv, sev, nine) { return { d: d, inv: inv || 0, sev: !!sev || !!nine, nine: !!nine }; };
  var same = function (a, b) { return a.l === b.l && a.a === b.a; };
  var tm = function (s) { return tx(s); };
  var textMc = function (R, right, wrongs, n) { return mc(R, tx(right), wrongs.map(tm), n); };
  var factQ = function (R, L1) { var x = pick(L1, R), m = mc(R, tx(x[1]), x[2].map(tm).concat([tx(x[1])])); return { q: x[0], ch: m.ch, a: m.a, ex: x[3] }; };
  var INV7 = ['Ⅴ₇（基本形）', 'Ⅴ₆₅（五六の和音）', 'Ⅴ₄₃（三四の和音）', 'Ⅴ₄₂（二の和音）'];
  var BASSROLE = ['根音', '第3音（導音）', '第5音', '第7音'];
  var colAt = function (n, i, c) { var r = []; for (var q = 0; q < n; q++) r.push(q === i ? [c, c, c, c] : null); return r; };

  /* ---------- 進行を つくる ---------- */
  // list：和音の ならびの 候補。返す：{ key, minor, chs, vs }
  function rprog(list, R, o) {
    o = o || {};
    for (var t = 0; t < 80; t++) {
      var chs = pick(list, R), minor = !!o.minor && R() < 0.3, key = rkey(R, minor), vs = H.solve(key, minor, chs, null, R);
      if (vs) return { key: key, minor: minor, chs: chs, vs: vs };
    }
    throw new Error('rprog');
  }
  var lessonFig = function (key, minor, chs, seed, o) { var vs = H.solve(key, minor, chs, null, GK.rng(seed)); return vs ? fig(key, minor, chs, vs, o) : { html: '' }; };
  // 1 つの つなぎを まちがいに かえた 問題の 部品
  function breakQ(R, list, minorOk) {
    for (var t = 0; t < 80; t++) {
      var p = rprog(list, R, { minor: minorOk }), k = ri(0, p.chs.length - 2, R), br = H.breakAt(p.key, p.minor, p.chs, p.vs, k, R); if (!br) continue;
      var lab = p.chs.slice(0, -1).map(function (c, i) { return tx(H.label(c) + ' → ' + H.label(p.chs[i + 1]), i); });
      var m = mc(R, lab[k], lab, Math.min(4, lab.length)), mk = H.marksOf(br.issues), kind = br.issues[0].kind;
      var sp = p.chs.length > 4 ? 48 : 54;
      return { q: kname(p.key, p.minor) + '。この 進行で、まちがいが ある つなぎは？', fig: fig(p.key, p.minor, p.chs, br.vs, { zoom: 2.4, sp: sp }), ch: m.ch, a: m.a, ex: '<b>' + H.label(p.chs[k]) + ' → ' + H.label(p.chs[k + 1]) + '</b> で ' + (KIND[kind] || kind) + '。' + br.issues.filter(function (x) { return x.ng; }).map(function (x) { return x.msg; }).join('。') + '。', exFig: fig(p.key, p.minor, p.chs, br.vs, { marks: mk.marks, bad: p.chs.map(function (_, i) { return mk.bad[i] || []; }), zoom: 2.4, sp: sp }) };
    }
    throw new Error('breakQ');
  }
  // 色つきの 和音を 当てる 問題の 部品（choices：その 和音の 候補ラベル）
  function nameQ(R, list, pickIdx, choices, qtxt, minorOk) {
    var p = rprog(list, R, { minor: minorOk }), idx = pickIdx(p.chs, R), ans = H.label(p.chs[idx]), wr = choices.filter(function (c) { return c !== ans; });
    var m = mc(R, tx(ans), wr.map(tm), 4);
    return { q: kname(p.key, p.minor) + '。' + qtxt, fig: fig(p.key, p.minor, p.chs, p.vs, { nolab: true, col: colAt(p.chs.length, idx, '#c08a0e'), zoom: 2.4, sp: p.chs.length > 4 ? 48 : 54 }), ch: m.ch, a: m.a, ex: '金色の 和音は <b>' + ans + '</b>（' + H.pcs(p.key, p.minor, p.chs[idx]).map(N).join('・') + '）。バスが <b>' + H.role(p.chs[idx], p.chs[idx].inv) + '</b>（' + N(p.vs[idx][3]) + '）です。', exFig: fig(p.key, p.minor, p.chs, p.vs, { col: colAt(p.chs.length, idx, '#c08a0e'), zoom: 2.4, sp: p.chs.length > 4 ? 48 : 54 }), play: p.vs.map(function (v, i) { return [v.map(H.str), i === p.vs.length - 1 ? 3 : 1.6]; }) };
  }
  var V7S = [[Ch(1), Ch(5, 1, 1), Ch(1)], [Ch(1), Ch(5, 2, 1), Ch(1)], [Ch(1), Ch(5, 3, 1), Ch(1, 1)], [Ch(1), Ch(4), Ch(5, 1, 1), Ch(1)], [Ch(1), Ch(6), Ch(5, 2, 1), Ch(1)]];
  var V7ALL = [Ch(5, 0, 1), Ch(5, 1, 1), Ch(5, 2, 1), Ch(5, 3, 1)].map(H.label);

  /* =================== h10 Ⅴ₇の転回形 =================== */
  add('v7iName', 'h10', 1, function (R) {
    var key = rkey(R), inv = ri(0, 3, R), pcs = H.pcs(key, false, Ch(5, 0, 1)), m = textMc(R, INV7[inv], INV7.filter(function (_, i) { return i !== inv; }), 4);
    return { q: kname(key) + '。Ⅴ₇ の <b>バス</b> が <b>' + N(pcs[inv]) + '</b>（' + BASSROLE[inv] + '）。この 和音の 名前は？', ch: m.ch, a: m.a, ex: 'Ⅴ₇（' + pcs.map(N).join('・') + '）の バスが ' + BASSROLE[inv] + ' → <b>' + INV7[inv] + '</b>。基本形 ＝ 根音、五六 ＝ 第3音、三四 ＝ 第5音、二 ＝ 第7音。' };
  });
  add('v7iBass', 'h10', 1, function (R) {
    var key = rkey(R), inv = ri(1, 3, R), pcs = H.pcs(key, false, Ch(5, 0, 1)), wr = pcs.filter(function (_, i) { return i !== inv; }).map(N), m = textMc(R, N(pcs[inv]), wr, 4);
    return { q: kname(key) + '。<b>' + INV7[inv] + '</b> の バスの 音は？', ch: m.ch, a: m.a, ex: INV7[inv] + ' は バスが <b>' + BASSROLE[inv] + '（' + N(pcs[inv]) + '）</b>。Ⅴ₇ ＝ ' + pcs.map(N).join('・') + '。' };
  });
  add('v7iFig', 'h10', 2, function (R, st) {
    return nameQ(R, V7S.slice(0, st >= 2 ? 5 : 3), function (chs) { for (var i = 0; i < chs.length; i++) if (chs[i].d === 5) return i; return 1; }, V7ALL.slice(1).concat([H.label(Ch(5, 0, 1))]), '金色の 和音は？（バスの 音で きまる）', true);
  });
  add('v7iRes', 'h10', 2, function (R) {
    return factQ(R, [
      ['Ⅴ₆₅ → Ⅰ で、バス（導音）は どう 進む？', '<b>半音 上</b> の 主音へ', ['2度 下', '3度 上', '同じ音で 保つ'], 'Ⅴ₆₅ の バスは 導音。導音は <b>主音へ 上行</b>（半音）。Ⅴ₆₅ → Ⅰ では バスが シ → ド。'],
      ['Ⅴ₄₂ の 次に 来る 和音は ふつう？', '<b>Ⅰ₆</b>（第1転回形）', ['Ⅰ（基本形）', 'Ⅳ', 'Ⅴ'], 'Ⅴ₄₂ の バスは 第7音。第7音は <b>2度 下行</b> するので、バス ファ → ミ。ミ を バスに もつ Ⅰ は <b>Ⅰ₆</b>。'],
      ['Ⅴ₄₃ → Ⅰ で、バス（第5音）は どう 進む？', '<b>2度 下</b>（レ → ド）か 上行など', ['かならず 跳躍', '第7音へ 進む', '動かない'], 'Ⅴ₄₃ の バスは 第5音（レ）。Ⅰ の 根音（ド）へ 2度 下行 するのが ふつう（Ⅰ₆ の ミ へ 上行 も ある）。'],
      ['Ⅴ₇ の 転回形では、和音の 音を？', '<b>4 つ ぜんぶ</b> そろえる', ['第5音を 省略する', '第3音を 省略する', '根音を 省略する'], '転回形の Ⅴ₇ は 4 声に 4 音 ぜんぶ。第5音の 省略は 基本形の Ⅴ₇ だけの 約束。'],
      ['Ⅴ₆₅ の 導音（バス）が ソプラノ にも 重なると？', '<b>導音の 重複</b> なので ダメ', ['よい', '第7音の 重複', '連続8度 には ならない'], '導音は 重ねない。バスが 導音の Ⅴ₆₅ では 上3声に 導音を 入れない。']
    ]);
  });
  add('v7iFind', 'h10', 3, function (R, st) { return breakQ(R, V7S, true); });
  add('v7Full', 'h10', 2, function (R) {
    return factQ(R, [
      ['Ⅴ₇（基本形）→ Ⅰ で、Ⅴ₇ の 4 音が ぜんぶ そろって いるとき、Ⅰ は？', '<b>第5音を 省略</b> して 根音を 3 つ（不完全な Ⅰ）', ['3 音 ぜんぶ そろう', '第3音を 省略', 'つかえない'], '完全な Ⅴ₇（根・3・5・7）→ <b>不完全な Ⅰ</b>（根音 3 つ・第3音）。連続5度を さける ための 約束。'],
      ['第5音を 省略した（不完全な）Ⅴ₇ から Ⅰ へ 進む とき、Ⅰ は？', '<b>3 音 ぜんぶ そろった</b> Ⅰ', ['第5音を 省略', '根音を 省略', 'つかえない'], '不完全な Ⅴ₇（根音 2 つ・3・7）→ <b>完全な Ⅰ</b>（根・3・5）。'],
      ['Ⅴ₇ の 第5音を 省略 してよい のは？', '<b>基本形</b> の Ⅴ₇ だけ', ['すべての 転回形', '第1転回だけ', '第3転回だけ'], '省略できる のは 基本形の Ⅴ₇ だけ。転回形は 4 音 そろえる。'],
      ['Ⅴ₇ → Ⅰ で 第7音は？', '<b>2度 下行</b>（ファ → ミ）', ['2度 上行', '同じ音で 保つ', '3度 跳ぶ'], '第7音は 2度 下行して Ⅰ の 第3音へ。']
    ]);
  });

  /* =================== h11 四六の和音 =================== */
  var SIX = { pass: ['経過四六', 'Ⅰ‐Ⅴ₆₄‐Ⅰ₆', 'バスが 順次進行で 通りすぎる'], aux: ['補助四六', 'Ⅰ‐Ⅳ₆₄‐Ⅰ', 'バスが 同じ音を 保ち、上3声が 動く（刺繍音のよう）'], cad: ['終止四六', 'Ⅰ₆₄‐Ⅴ‐Ⅰ', 'Ⅰ₆₄ が Ⅴ の 前に 強拍で 来る（倚音のよう）'] };
  var SIXL = { pass: [Ch(1), Ch(5, 2), Ch(1, 1)], aux: [Ch(1), Ch(4, 2), Ch(1)], cad: [Ch(1), Ch(4), Ch(1, 2), Ch(5), Ch(1)] };
  var SIXN = ['経過四六', '補助四六', '終止四六'];
  add('sixKind', 'h11', 1, function (R) {
    var k = pick(['pass', 'aux', 'cad'], R), m = textMc(R, SIX[k][0], SIXN.filter(function (x) { return x !== SIX[k][0]; }).concat(['倚四六']), 4);
    return { q: '和音の 進行が <b>' + SIX[k][1] + '</b> のとき、真ん中の 四六の 和音は？', ch: m.ch, a: m.a, ex: '<b>' + SIX[k][0] + '</b>：' + SIX[k][1] + '。' + SIX[k][2] + '。' };
  });
  add('sixProg', 'h11', 1, function (R) {
    var k = pick(['pass', 'aux', 'cad'], R), m = textMc(R, SIX[k][1], ['pass', 'aux', 'cad'].filter(function (x) { return x !== k; }).map(function (x) { return SIX[x][1]; }).concat(['Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ']), 4);
    return { q: '<b>' + SIX[k][0] + '</b> の 進行は？', ch: m.ch, a: m.a, ex: '<b>' + SIX[k][0] + '</b> は ' + SIX[k][1] + '。' + SIX[k][2] + '。' };
  });
  add('sixBass', 'h11', 1, function (R) {
    var key = rkey(R), d = pick([1, 4, 5], R), pcs = H.pcs(key, false, Ch(d)), wr = [pcs[0], pcs[1]].map(N), m = textMc(R, N(pcs[2]), wr.concat([N(H.lt(key, false))]), 4);
    return { q: kname(key) + '。<b>' + H.label(Ch(d, 2)) + '</b> の バスの 音は？', ch: m.ch, a: m.a, ex: H.label(Ch(d, 2)) + ' は 第2転回形。バスは <b>第5音（' + N(pcs[2]) + '）</b>。' };
  });
  add('sixFig', 'h11', 2, function (R, st) {
    var k = pick(['pass', 'aux', 'cad'], R), chs = SIXL[k], idx = chs.map(function (c) { return c.inv === 2; }).indexOf(true), p = rprog([chs], R, { minor: true }), m = textMc(R, SIX[k][0], SIXN.filter(function (x) { return x !== SIX[k][0]; }).concat(['倚四六']), 4);
    return { q: kname(p.key, p.minor) + '。金色の 四六の 和音は どの 種類？', fig: fig(p.key, p.minor, p.chs, p.vs, { col: colAt(p.chs.length, idx, '#c08a0e'), zoom: 2.4 }), ch: m.ch, a: m.a, ex: '<b>' + SIX[k][0] + '</b>（' + SIX[k][1] + '）。' + SIX[k][2] + '。', play: p.vs.map(function (v, i) { return [v.map(H.str), i === p.vs.length - 1 ? 3 : 1.6]; }) };
  });
  add('sixRule', 'h11', 2, function (R) {
    return factQ(R, [
      ['四六の和音で 重ねる 音は？', 'バスの 音（<b>第5音</b>）', ['根音', '第3音', 'どれも 重ねない'], '四六の 和音では <b>バス（第5音）を 重ねる</b> のが 基本。第3音・根音を 重ねない。'],
      ['終止四六（Ⅰ₆₄‐Ⅴ‐Ⅰ）の Ⅰ₆₄ は どんな 位置に 置く？', '<b>強拍</b>（Ⅴ は 弱拍に 近い）', ['弱拍', '拍に 関係なく', '小節の 最後の 弱拍'], 'Ⅰ₆₄ は Ⅴ に 対する 倚音のような もの。強拍に 置く。'],
      ['終止四六の Ⅰ₆₄ から Ⅴ へ、上3声は？', '<b>同じ 向き の 2度</b> 下行 して Ⅴ の 音へ', ['跳躍する', '同じ音で 保つ', '3度 上行'], 'Ⅰ₆₄ の 第3音・根音が 2度 下行して Ⅴ の 根音・第5音... ミ→レ、ド→シ（導音）、ソ（バス）は そのまま。'],
      ['経過四六 の バスは？', '<b>順次進行</b>（音階の ように）', ['跳躍', '同じ音を 保つ', '5度で 動く'], '経過四六は 低音が 順次進行で 通りすぎる。例：ド → レ（Ⅴ₆₄）→ ミ（Ⅰ₆）。'],
      ['補助四六 の バスは？', '<b>同じ音</b> を 保つ', ['順次進行', '跳躍', '下行だけ'], '補助四六は バスが 同じ音（ド ‐ ド ‐ ド）で、上3声が 刺繍音のように 動く。']
    ]);
  });
  add('sixFind', 'h11', 3, function (R) { return breakQ(R, [SIXL.cad, SIXL.pass, SIXL.aux, [Ch(1), Ch(4), Ch(1, 2), Ch(5, 0, 1), Ch(1)]], true); });

  /* =================== h12 Ⅱ₇・Ⅶ₇と副七 =================== */
  var QUALITY7 = { 1: '長七の和音', 2: '短七の和音', 3: '短七の和音', 4: '長七の和音', 5: '属七の和音', 6: '短七の和音', 7: '半減七の和音' };
  var Q7N = ['長七の和音', '短七の和音', '属七の和音', '半減七の和音'];
  add('sev7Notes', 'h12', 2, function (R) {
    var key = rkey(R), d = pick([2, 7, 4, 6], R), pc = H.pcs(key, false, Ch(d, 0, 1)), txt = function (a) { return a.map(N).join('・'); }, scl = M.scale(M.keyTonic(key, false), 'major');
    var at = function (x) { return scl[(x - 1) % 7]; };
    var wr = [[d, d + 2, d + 4], [d + 2, d + 4, d + 6, d + 8], [d + 1, d + 3, d + 5, d + 7]].map(function (a) { return a.map(at); }).map(txt).filter(function (t) { return t !== txt(pc); });
    var m = textMc(R, txt(pc), wr, 4);
    return { q: kname(key) + '。<b>' + H.label(Ch(d, 0, 1)) + '</b> の 構成音は？', ch: m.ch, a: m.a, ex: H.label(Ch(d, 0, 1)) + ' は ' + d + ' 番めの 音から 3度ずつ 4 つ → <b>' + txt(pc) + '</b>。' };
  });
  add('sev7Type', 'h12', 2, function (R) {
    var d = pick([2, 7, 4, 6, 3, 1], R), m = textMc(R, QUALITY7[d], Q7N.filter(function (x) { return x !== QUALITY7[d]; }), 4);
    return { q: '長調の <b>' + H.label(Ch(d, 0, 1)) + '</b> は？', ch: m.ch, a: m.a, ex: '長調の 七の和音：Ⅰ₇・Ⅳ₇ ＝ 長七、Ⅱ₇・Ⅲ₇・Ⅵ₇ ＝ 短七、Ⅴ₇ ＝ 属七、Ⅶ₇ ＝ <b>半減七</b>（導七）。' + H.label(Ch(d, 0, 1)) + ' は <b>' + QUALITY7[d] + '</b>。' };
  });
  add('sev7Rule', 'h12', 2, function (R) {
    return factQ(R, [
      ['Ⅱ₇ の 次に 来る 和音は ふつう？', '<b>Ⅴ</b>（またはⅤ₇）', ['Ⅳ', 'Ⅵ', 'Ⅲ'], 'Ⅱ₇ は 下属和音の はたらき。<b>Ⅱ₇ → Ⅴ</b>（根音が 4度 上行）が 基本。'],
      ['Ⅱ₇ の 第7音（ハ長調で ド）は？', '<b>2度 下行</b>（ド → シ）', ['2度 上行', '同じ音を 保つ', '3度 下行'], '第7音は 2度 下行。Ⅱ₇ → Ⅴ で ド → シ（Ⅴ の 導音）。'],
      ['Ⅱ₆₅（バスが ファ）は どんな ときに よく 使う？', '<b>Ⅱ₆₅ → Ⅴ</b> と、バスが なめらかに つながる とき', ['Ⅱ₆₅ → Ⅵ', 'Ⅱ₆₅ → Ⅳ', '終わりの 和音として'], 'Ⅱ₆₅ の バス（ファ）は Ⅴ の バス（ソ）へ 順次進行。Ⅱ‐Ⅴ‐Ⅰ の 流れの 定番。'],
      ['Ⅶ₇（導七の和音）は どの 和音の 代理？', '<b>Ⅴ₇（属和音）</b>', ['Ⅰ', 'Ⅳ', 'Ⅱ'], 'Ⅶ₇（シ・レ・ファ・ラ）は Ⅴ₇（ソ・シ・レ・ファ）の 根音を 省いた ような ひびき。Ⅰ へ 進む。'],
      ['Ⅶ₇ の 導音（シ）は？', '<b>半音 上</b> の 主音（ド）へ', ['2度 下行', '同じ音', '跳躍'], 'Ⅶ₇ → Ⅰ で 導音は 主音へ、第7音（ラ）は 2度 下行（ソ）へ。'],
      ['長調の Ⅶ₇ の 種類は？', '<b>半減七の和音</b>（導七）', ['属七の和音', '長七の和音', '減七の和音'], '長調の Ⅶ₇ は <b>半減七</b>。短調の Ⅶ₇ は 減七の和音。']
    ]);
  });
  add('sev7Find', 'h12', 3, function (R) { return breakQ(R, [[Ch(1), Ch(2, 0, 1), Ch(5), Ch(1)], [Ch(1), Ch(2, 1, 1), Ch(5), Ch(1)], [Ch(1), Ch(4), Ch(7, 1, 1), Ch(1)], [Ch(1), Ch(2, 0, 1), Ch(5, 0, 1), Ch(1)], [Ch(1), Ch(6), Ch(4, 0, 1), Ch(5), Ch(1)]], true); });
  add('sev7Fig', 'h12', 2, function (R) {
    var all = [Ch(2, 0, 1), Ch(2, 1, 1), Ch(4, 0, 1), Ch(6, 0, 1), Ch(7, 1, 1), Ch(5, 0, 1)].map(H.label);
    return nameQ(R, [[Ch(1), Ch(2, 0, 1), Ch(5), Ch(1)], [Ch(1), Ch(2, 1, 1), Ch(5), Ch(1)], [Ch(1), Ch(4), Ch(7, 1, 1), Ch(1)], [Ch(1), Ch(6), Ch(4, 0, 1), Ch(5), Ch(1)]], function (chs) { for (var i = 1; i < chs.length; i++) if (chs[i].sev && chs[i].d !== 5) return i; return 1; }, all, '金色の 七の和音は？', true);
  });

  /* =================== h13 属九の和音 =================== */
  var NINES = [[Ch(1), Ch(4), Ch(5, 0, 1, 1), Ch(1)], [Ch(1), Ch(2), Ch(5, 0, 1, 1), Ch(1)], [Ch(1), Ch(6), Ch(5, 0, 1, 1), Ch(1)]];
  add('nineNotes', 'h13', 1, function (R) {
    var key = rkey(R), pc = H.pcs(key, false, Ch(5, 0, 1, 1)), txt = function (a) { return a.map(N).join('・'); }, wr = [pc.slice(0, 4), pc.slice(1), [pc[0], pc[1], pc[3], pc[4]].concat([pc[2]]).slice(0, 4).reverse()].map(txt).filter(function (t) { return t !== txt(pc); });
    wr.push(txt(pc.slice(0, 3)));
    var m = textMc(R, txt(pc), wr.filter(function (t, i) { return wr.indexOf(t) === i; }), 4);
    return { q: kname(key) + '。<b>属九の和音（Ⅴ₉）</b> の 構成音は？（根音から 3度ずつ 5 つ）', ch: m.ch, a: m.a, ex: 'Ⅴ₉ ＝ ' + txt(pc) + '（根・第3・第5・第7・<b>第9音</b>）。第9音は 根音の 9度 上（ハ長調では ラ）。', play: [[pc.map(function (p, i) { return M.str({ l: p.l, a: p.a, o: 3 + (i > 1 ? 1 : 0) + (i > 3 ? 1 : 0) }); }), 2]] };
  });
  add('nineRule', 'h13', 2, function (R) {
    return factQ(R, [
      ['属九の和音を 4 声で 書く とき、省略する 音は？', '<b>第5音</b>', ['根音', '第3音', '第7音'], '5 音の 和音を 4 声で 書く ので <b>第5音を 省略</b>。根音・第3音・第7音・第9音を 使う。'],
      ['属九の和音（Ⅴ₉）の バス（最低音）は？', '<b>根音</b>', ['第3音', '第9音', 'どれでも よい'], 'Ⅴ₉ は 基本形で 使い、バスは 根音。第9音は 上の 声（とくに ソプラノ）に 置く。'],
      ['第9音は どう 進む？', '<b>2度 下行</b> して 解決', ['2度 上行', '同じ音で 保つ', '跳躍'], '第9音（ハ長調で ラ）は <b>2度 下行</b>（ラ → ソ）して Ⅰ の 第5音へ。第7音も 2度 下行（ファ → ミ）。'],
      ['第9音と 根音の 間の 音程は？（ハ長調で ソ‐ラ）', '<b>9度</b>（ソと ラの 間が 1 オクターブ ＋ 2度）', ['7度', '5度', '3度'], '根音から 数えて 9度 上が 第9音。バスの 根音と 第9音の 声部を ちかく 置かない（2度に ならない よう に）。'],
      ['長調の Ⅴ₉ の 第9音（ハ長調 ソ‐ラ）は？', '<b>長9度</b>（長九の和音）', ['短9度', '完全9度', '増9度'], '長調の Ⅴ₉ は <b>長九</b>。短調の Ⅴ₉ は 第9音が 半音 近く（イ短調 ミ‐ファ）なる <b>短九の和音</b>。'],
      ['短調の Ⅴ₉ は？', '<b>短九の和音</b>（第9音が 半音 下がる）', ['長九の和音', '増九の和音', '属十一の和音'], '短調では 第9音が 根音から <b>短9度</b>。ひびきが 暗く 緊張感が 強い。']
    ]);
  });
  add('nineFig', 'h13', 2, function (R) {
    var p = rprog(NINES, R, { minor: true }), idx = p.chs.map(function (c) { return !!c.nine; }).indexOf(true), v = p.vs[idx], n9 = H.pcs(p.key, p.minor, p.chs[idx])[4], j = -1;
    v.forEach(function (x, q) { if (same(x, n9)) j = q; });
    var VNs = H.VNAME; if (j < 0) throw new Error('nineFig');
    var col = p.chs.map(function (_, i) { return null; }); col[idx] = [null, null, null, null]; col[idx][j] = '#c08a0e';
    var m = textMc(R, VNs[j], VNs.filter(function (_, q) { return q !== j; }), 4);
    return { q: kname(p.key, p.minor) + '。Ⅴ₉ の 和音で <b>第9音（' + N(n9) + '）</b> を うたっている 声部は？', fig: fig(p.key, p.minor, p.chs, p.vs, { zoom: 2.4, sp: 54 }), ch: m.ch, a: m.a, ex: '第9音 ' + N(n9) + ' は <b>' + VNs[j] + '</b>。この 音は 次の Ⅰ で 2度 下行します。', exFig: fig(p.key, p.minor, p.chs, p.vs, { col: col, zoom: 2.4, sp: 54 }), play: p.vs.map(function (vv, i) { return [vv.map(H.str), i === p.vs.length - 1 ? 3 : 1.6]; }) };
  });
  add('nineFind', 'h13', 3, function (R) { return breakQ(R, NINES, true); });

  /* =================== h14 実習のすすめ方 =================== */
  add('workOrder', 'h14', 1, function (R) {
    var good = ['① 調と 和音を たしかめる', '② バス（ソプラノ）を 書く', '③ 共通音を 保つ・反対向きに 動く', '④ 禁則を チェックして 直す'];
    var A = good.join(' → '), wr = [[2, 0, 1, 3], [0, 3, 2, 1], [3, 2, 1, 0]].map(function (o) { return o.map(function (i) { return good[i]; }).join(' → '); });
    var m = textMc(R, A, wr, 4);
    return { q: '和声の 課題を 解く 順序で ふさわしい のは？', ch: m.ch, a: m.a, ex: '<b>調と 和音を たしかめ → 与えられた 声部を 見て → 共通音を 保つ・反対向きに 動かし → 禁則を チェック</b>。書いたあとの 見なおしも 大切。' };
  });
  add('chordFromSop', 'h14', 2, function (R) {
    var key = rkey(R), d = pick([1, 3, 5, 6, 2, 4, 7], R), note = pick([0, 1, 2], R), pcs = H.pcs(key, false, Ch(d)), nm = N(pcs[note]);
    var fits = [1, 4, 5].filter(function (x) { return H.pcs(key, false, Ch(x)).some(function (c) { return N(c) === nm; }); });
    if (!fits.length) throw new Error('chordFromSop');
    var right = fits.map(function (x) { return H.ROMAN[x]; }).join('・'), opts = ['Ⅰ', 'Ⅳ', 'Ⅴ', 'Ⅰ・Ⅳ', 'Ⅰ・Ⅴ', 'Ⅳ・Ⅴ', 'Ⅰ・Ⅳ・Ⅴ'].map(function (s) { return s; });
    var correct = fits.map(function (x) { return H.ROMAN[x]; }).join('・');
    var wr = opts.filter(function (o) { return o !== correct; }); var m = textMc(R, correct, wr, 4);
    return { q: kname(key) + '。ソプラノが <b>' + nm + '</b> のとき、これを 含む <b>主要三和音</b>（Ⅰ・Ⅳ・Ⅴ）は？', ch: m.ch, a: m.a, ex: '主要三和音の 構成音：' + [1, 4, 5].map(function (x) { return H.ROMAN[x] + '＝' + H.pcs(key, false, Ch(x)).map(N).join('・'); }).join('、') + '。' + nm + ' を 含むのは <b>' + correct + '</b>。' };
  });
  add('figBass7', 'h14', 2, function (R) {
    var key = rkey(R), d = pick([5, 2, 7, 4, 6], R), inv = ri(0, 3, R), ch = Ch(d, inv, 1), bass = H.pcs(key, false, ch)[inv], fg = H.figure(ch), lab = H.label(ch);
    var wr = []; for (var dd = 1; dd <= 7; dd++) { var c2 = Ch(dd, inv, 1); if (H.label(c2) !== lab && wr.length < 6) wr.push(H.label(c2)); }
    var m = textMc(R, lab, wr, 4);
    return { q: kname(key) + '。バスが <b>' + N(bass) + '</b>、数字が <b>' + fg + '</b>。この 和音（七の和音）の 和音記号は？', ch: m.ch, a: m.a, ex: '数字 <b>' + fg + '</b> は ' + (inv === 0 ? '基本形（7）' : inv === 1 ? '第1転回（五六）' : inv === 2 ? '第2転回（三四）' : '第3転回（二）') + '。バス ' + N(bass) + ' は ' + BASSROLE[inv] + ' なので、根音は <b>' + N(H.pcs(key, false, ch)[0]) + '</b> → <b>' + lab + '</b>。' };
  });
  add('nctAdd', 'h14', 2, function (R) {
    var key = rkey(R), s = M.scale(M.keyTonic(key, false), 'major'), a = pick([0, 1, 2, 3, 4], R), up = R() < 0.5, from = up ? a : a + 2, to = up ? a + 2 : a, mid1 = a + 1;
    var nm = function (x) { return N(s[x % 7]); }, wr = [0, 1, 2, 3, 4, 5, 6].map(function (x) { return nm(x); }).filter(function (x) { return x !== nm(mid1) && x !== nm(from) && x !== nm(to); });
    var m = textMc(R, nm(mid1), wr, 4);
    return { q: kname(key) + '。ソプラノが ' + nm(from) + ' → ' + nm(to) + '（3度）と 進む。間に <b>経過音</b> を 入れるなら？', ch: m.ch, a: m.a, ex: '3度の 間を 順次進行で 埋める 音が 経過音。' + nm(from) + ' → <b>' + nm(mid1) + '</b> → ' + nm(to) + '。', play: [[M.str(Object.assign({}, s[from % 7], { o: 4 })), 0.6], [M.str(Object.assign({}, s[mid1 % 7], { o: 4 })), 0.6], [M.str(Object.assign({}, s[to % 7], { o: 4 })), 0.8]] };
  });

  /* =================== 授業 =================== */
  var sx = function (chs, seed, o, key, minor) { return lessonFig(key || 0, !!minor, chs, seed, o); };
  GK.UNITDEF.push(
    {
      id: 'h10', title: 'Ⅴ₇の 転回形', en: 'Inversions of V7', sym: '⁶₅', goal: 'Ⅴ₆₅・Ⅴ₄₃・Ⅴ₄₂ を 書いて 解決できる',
      cards: [
        { k: '✨ ひとことで言うと', h: 'Ⅴ₇ も バスの音で 名前が かわる', b: 'Ⅴ₇ ＝ ソ・シ・レ・ファ。バスが <b>ソ（根音）</b> ＝ Ⅴ₇、<b>シ（導音）</b> ＝ Ⅴ₆₅、<b>レ（第5音）</b> ＝ Ⅴ₄₃、<b>ファ（第7音）</b> ＝ Ⅴ₄₂。', fig: { html: table(['和音記号', '呼び方', 'バス', '数字'], [['Ⅴ₇', '基本形', 'ソ（根音）', '7'], ['Ⅴ₆₅', '五六の和音', 'シ（導音）', '6 5'], ['Ⅴ₄₃', '三四の和音', 'レ（第5音）', '4 3'], ['Ⅴ₄₂', '二の和音', 'ファ（第7音）', '4 2']], { fs: 14, mw: 440 }) } },
        { k: 'ポイント 1', h: 'Ⅴ₆₅ → Ⅰ', b: 'バスの <b>導音</b> が 主音へ <b>上行</b>（シ → ド）。バスが 滑らかに なる ので よく 使う。4 音を ぜんぶ そろえる。', fig: sx([Ch(1), Ch(5, 1, 1), Ch(1)], 3, { zoom: 2.4 }) },
        { k: 'ポイント 2', h: 'Ⅴ₄₃ → Ⅰ', b: 'バスは <b>第5音（レ）</b>。主音へ <b>下行</b>（レ → ド）。導音と 第7音の 解決は 基本形と 同じ。', fig: sx([Ch(1), Ch(5, 2, 1), Ch(1)], 3, { zoom: 2.4 }) },
        { k: 'ポイント 3', h: 'Ⅴ₄₂ → Ⅰ₆', b: 'バスが <b>第7音（ファ）</b> なので、<b>2度 下行</b>（ファ → ミ）。解決先は <b>Ⅰ₆</b>（バスが 第3音の ミ）。', fig: sx([Ch(1), Ch(5, 3, 1), Ch(1, 1)], 3, { zoom: 2.4 }) },
        { k: 'ポイント 4', h: '第5音の 省略は 基本形 だけ', b: '<b>Ⅴ₇（基本形）</b> は 第5音を 省略できる。完全なⅤ₇ → 不完全なⅠ、不完全なⅤ₇ → 完全なⅠ。転回形は 4 音 ぜんぶ。', fig: sx([Ch(1), Ch(4), Ch(5, 0, 1), Ch(1)], 7, { zoom: 2.4, sp: 48 }) },
        MEMO('Ⅴ₇の 転回形の 覚え方', 'バスの 音で 名前が きまる。', [['Ⅴ₆₅ ＝ バスが 導音', 'バスは 半音 上へ（主音）'], ['Ⅴ₄₃ ＝ バスが 第5音', 'バスは 2度 下（主音）'], ['Ⅴ₄₂ ＝ バスが 第7音', 'バスは 2度 下 → Ⅰ₆'], ['転回形は 4 音 そろえる', '導音・第7音の 解決は いつも 同じ']])
      ],
      sum: ['Ⅴ₇ の バスの音：根 ＝ Ⅴ₇、導音 ＝ Ⅴ₆₅、第5音 ＝ Ⅴ₄₃、第7音 ＝ Ⅴ₄₂', 'Ⅴ₆₅→Ⅰ（バス 上行）、Ⅴ₄₃→Ⅰ、Ⅴ₄₂→Ⅰ₆（バス 2度下行）', '第5音の 省略は 基本形の Ⅴ₇ だけ。転回形は 4 音 そろえる'],
      types: ['v7iName', 'v7iBass', 'v7iFig', 'v7iRes', 'v7Full', 'v7iFind']
    },
    {
      id: 'h11', title: '四六の 和音', en: 'Six-Four Chords', sym: '⁶₄', goal: '経過・補助・終止の 四六の和音を 使い分けられる',
      cards: [
        { k: '✨ ひとことで言うと', h: '四六の和音は「使える 場面」が きまっている', b: '<b>第2転回形</b>（バスが 第5音）は 不安定。<b>経過四六・補助四六・終止四六</b> の 3 つの 場面だけで 使う。', fig: { html: table(['種類', '進行', 'ようす'], [['経過四六', 'Ⅰ‐Ⅴ₆₄‐Ⅰ₆', 'バスが 順次進行で 通りすぎる'], ['補助四六', 'Ⅰ‐Ⅳ₆₄‐Ⅰ', 'バスが 同じ音（刺繍音）'], ['終止四六', 'Ⅰ₆₄‐Ⅴ‐Ⅰ', 'Ⅴ の 前の かざり（倚音）']], { fs: 14, mw: 460 }) } },
        { k: 'ポイント 1', h: '経過四六（Ⅰ‐Ⅴ₆₄‐Ⅰ₆）', b: 'バス ド → レ → ミ と <b>順次進行</b>。真ん中の Ⅴ₆₄ が 経過四六。', fig: sx([Ch(1), Ch(5, 2), Ch(1, 1)], 4, { zoom: 2.4 }) },
        { k: 'ポイント 2', h: '補助四六（Ⅰ‐Ⅳ₆₄‐Ⅰ）', b: 'バスは <b>同じ音（ド）</b> を 保ち、上の 3 声が 刺繍音のように 動く。', fig: sx([Ch(1), Ch(4, 2), Ch(1)], 4, { zoom: 2.4 }) },
        { k: 'ポイント 3', h: '終止四六（Ⅰ₆₄‐Ⅴ‐Ⅰ）', b: '<b>強拍</b> に Ⅰ₆₄ を 置き、Ⅴ へ。Ⅰ₆₄ の 上声が <b>2度 下行</b>（ミ → レ、ド → シ）して Ⅴ の 音に。バス（ソ）は そのまま。', fig: sx([Ch(1), Ch(4), Ch(1, 2), Ch(5), Ch(1)], 4, { zoom: 2.4, sp: 48 }) },
        { k: 'ポイント 4', h: '重ねる 音', b: '四六の 和音では <b>バス（第5音）</b> を 重ねる。第3音・根音は 重ねない。', fig: { html: table(['四六の 和音', 'バス（重ねる 音）'], [['Ⅰ₆₄', 'ソ（第5音）'], ['Ⅳ₆₄', 'ド（第5音）'], ['Ⅴ₆₄', 'レ（第5音）']], { fs: 15, mw: 380 }) } },
        MEMO('四六の 3 兄弟', 'バスの ようすで 見わける。', [['経過 ＝ バスが 順次で 通りすぎる', 'Ⅰ‐Ⅴ₆₄‐Ⅰ₆'], ['補助 ＝ バスが 同じ音', 'Ⅰ‐Ⅳ₆₄‐Ⅰ'], ['終止 ＝ Ⅴ の 前の 強拍', 'Ⅰ₆₄‐Ⅴ‐Ⅰ'], ['バス（第5音）を 重ねる', 'ほかの 使いかたは しない']])
      ],
      sum: ['四六の 和音は 経過・補助・終止 の 3 つの 場面で 使う', '終止四六：強拍の Ⅰ₆₄ → Ⅴ → Ⅰ。上声は 2度 下行', '重ねる 音は バス（第5音）'],
      types: ['sixKind', 'sixProg', 'sixBass', 'sixFig', 'sixRule', 'sixFind']
    },
    {
      id: 'h12', title: 'Ⅱ₇・Ⅶ₇ と 副七の和音', en: 'II7, VII7 & Other 7ths', sym: 'Ⅱ₇', goal: 'Ⅱ₇・Ⅶ₇ などの 七の和音の 性質と 解決が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '七の和音は Ⅴ₇ だけじゃない', b: '七の和音は <b>各 音階音の 上</b> に つくれる。Ⅴ₇ 以外を <b>副七の和音</b> という。とくに よく 使うのは <b>Ⅱ₇</b>（下属の はたらき）と <b>Ⅶ₇</b>（導七）。', fig: { html: table(['和音', 'ハ長調の 音', '種類'], [['Ⅰ₇', 'ド・ミ・ソ・シ', '長七'], ['Ⅱ₇', 'レ・ファ・ラ・ド', '短七'], ['Ⅳ₇', 'ファ・ラ・ド・ミ', '長七'], ['Ⅴ₇', 'ソ・シ・レ・ファ', '属七'], ['Ⅵ₇', 'ラ・ド・ミ・ソ', '短七'], ['Ⅶ₇', 'シ・レ・ファ・ラ', '半減七']], { fs: 14, mw: 440 }) } },
        { k: 'ポイント 1', h: 'Ⅱ₇ → Ⅴ → Ⅰ', b: '<b>Ⅱ₇</b> は 下属和音の はたらき。Ⅱ₇ → Ⅴ（Ⅴ₇）→ Ⅰ が 定番。第7音（ド）は <b>2度 下行</b>（ド → シ）。', fig: sx([Ch(1), Ch(2, 0, 1), Ch(5), Ch(1)], 5, { zoom: 2.4 }) },
        { k: 'ポイント 2', h: 'Ⅱ₆₅', b: 'バスが <b>ファ</b>。Ⅴ の バス（ソ）へ 順次進行で なめらか。Ⅳ の 代わりに よく 使う。', fig: sx([Ch(1), Ch(2, 1, 1), Ch(5), Ch(1)], 5, { zoom: 2.4 }) },
        { k: 'ポイント 3', h: 'Ⅶ₇（導七の和音）', b: '導音の 上に 3度ずつ（シ・レ・ファ・ラ）。<b>Ⅴ₇ の 代理</b>。導音は 主音へ、第7音（ラ）は 2度 下行。長調では 半減七、短調では 減七の和音。', fig: sx([Ch(1), Ch(4), Ch(7, 1, 1), Ch(1)], 5, { zoom: 2.4 }) },
        { k: 'ポイント 4', h: 'そのほかの 副七', b: '<b>Ⅳ₇・Ⅵ₇・Ⅰ₇・Ⅲ₇</b> も 同じ 約束：第7音は <b>2度 下行</b>、根音は 4度 上行（5度 下行）して つなぐ のが 基本（Ⅵ₇ → Ⅱ → Ⅴ など）。', fig: sx([Ch(1), Ch(6), Ch(4, 0, 1), Ch(5), Ch(1)], 5, { zoom: 2.4, sp: 48 }) },
        MEMO('副七の 合言葉', '七の和音は 第7音が 主役。', [['第7音は いつも 2度 下行', '重ねない・準備は 要らない'], ['Ⅱ₇ → Ⅴ が 基本', 'Ⅱ₆₅ も よく 使う'], ['Ⅶ₇ は Ⅴ₇ の 代理', '導音は 上へ']])
      ],
      sum: ['七の和音は どの 音階音の 上にも つくれる（Ⅴ₇ 以外は 副七）', 'Ⅱ₇ → Ⅴ → Ⅰ が 定番。第7音は 2度 下行', 'Ⅶ₇（導七）は Ⅴ₇ の 代理。導音は 上へ、第7音は 下へ'],
      types: ['sev7Notes', 'sev7Type', 'sev7Rule', 'sev7Fig', 'sev7Find']
    },
    {
      id: 'h13', title: '属九の 和音', en: 'Dominant Ninth', sym: '⁹', goal: 'Ⅴ₉ の 構成と 書き方・解決が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: 'Ⅴ₇ に さらに 3度 つみあげる', b: '<b>Ⅴ₉</b> ＝ ソ・シ・レ・ファ・<b>ラ</b>。根音から 数えて <b>9度</b> 上の 音が <b>第9音</b>。5 つの 音を 4 声で 書くので <b>第5音（レ）を 省略</b> する。', fig: sx([Ch(1), Ch(4), Ch(5, 0, 1, 1), Ch(1)], 6, { zoom: 2.4 }) },
        { k: 'ポイント 1', h: '4 声での 書き方', b: '使う 音：<b>根音（バス）・第3音（導音）・第7音・第9音</b>。第9音は <b>ソプラノ</b> に 置くと きれい。', fig: { html: table(['声部', '音（ハ長調）'], [['ソプラノ', '第9音（ラ）など'], ['アルト・テノール', '第3音（シ）・第7音（ファ）'], ['バス', '根音（ソ）']], { fs: 14, mw: 420 }) } },
        { k: 'ポイント 2', h: '解決', b: '<b>第9音</b> は 2度 下行（ラ → ソ）、<b>第7音</b> は 2度 下行（ファ → ミ）、導音は 主音へ 上行。', fig: sx([Ch(1), Ch(2), Ch(5, 0, 1, 1), Ch(1)], 6, { zoom: 2.4 }) },
        { k: 'ポイント 3', h: '長九 と 短九', b: '長調の Ⅴ₉ ＝ <b>長九の和音</b>（根音から 長9度）。短調の Ⅴ₉ ＝ <b>短九の和音</b>（短9度）。短九の ほうが ひびきが 暗く 強い。', fig: { html: table(['調', 'Ⅴ₉ の 構成音', '第9音'], [['ハ長調', 'ソ・シ・レ・ファ・ラ', 'ソ‐ラ（長9度）'], ['イ短調', 'ミ・ソ♯・シ・レ・ファ', 'ミ‐ファ（短9度）']], { fs: 14, mw: 460 }) } },
        MEMO('Ⅴ₉ の 覚え方', '4 声の 5 音: 第5音を 省く。', [['Ⅴ₉ ＝ 根・3・5・7・9', '5 音 → 4 声は 第5音を 省略'], ['バスは 根音', '第9音は ソプラノに'], ['第7音・第9音は 2度 下行', '導音は 上行']])
      ],
      sum: ['Ⅴ₉ ＝ 根・3・5・7・9。4 声では 第5音を 省略', 'バスは 根音。第9音は ソプラノに 置くと きれい', '第9音・第7音は 2度 下行、導音は 上行'],
      types: ['nineNotes', 'nineRule', 'nineFig', 'nineFind']
    },
    {
      id: 'h14', title: '実習の すすめ方', en: 'Working Exercises', sym: '✎', goal: 'ソプラノ課題・バス課題の 手順が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '課題は「順序」を きめて 解く', b: '和声の 課題（ソプラノ課題・バス課題・数字付き低音）は、手順を きめて 書くと ミスが へる。', fig: { html: table(['手順', 'やること'], [['① 調と 和音', '調号・調。和音記号を 確認'], ['② 与えられた 声部', 'バス（ソプラノ）の 音を 見る'], ['③ 配置', '第3音を そろえ、開離か 密集かを きめる'], ['④ 連結', '共通音を 保つ／反対向き'], ['⑤ 見なおし', '連続5度・8度、導音・第7音の 解決']], { fs: 14, mw: 460 }) } },
        { k: 'ポイント 1', h: 'バス課題（数字付き低音）', b: 'バスの 音と <b>数字</b> から 和音を きめる。数字なし ＝ 基本形、6 ＝ 第1転回、6 4 ＝ 第2転回、7・6 5・4 3・4 2 ＝ 七の和音。', fig: { html: table(['数字', '意味'], [['（なし）', '三和音 基本形'], ['6', '第1転回（六）'], ['6 4', '第2転回（四六）'], ['7', 'Ⅴ₇ など'], ['6 5', '七の和音 第1転回'], ['4 3', '七の和音 第2転回'], ['4 2', '七の和音 第3転回']], { fs: 14, mw: 400 }) } },
        { k: 'ポイント 2', h: 'ソプラノ課題', b: 'ソプラノの 音から <b>使える 和音</b> を かんがえる。例：ソプラノが <b>ド</b> なら Ⅰ（根音）・Ⅳ（第5音）・Ⅵ（第3音）が 候補。和音の 進行（T‐S‐D‐T）に 合うものを えらぶ。', fig: { html: table(['ソプラノ', '使える 主要三和音'], [['ド', 'Ⅰ（根音）・Ⅳ（第5音）'], ['レ', 'Ⅴ（第5音）'], ['ミ', 'Ⅰ（第3音）'], ['ファ', 'Ⅳ（根音）'], ['ソ', 'Ⅰ（第5音）・Ⅴ（根音）'], ['ラ', 'Ⅳ（第3音）'], ['シ', 'Ⅴ（第3音）']], { fs: 14, mw: 440 }) } },
        { k: 'ポイント 3', h: '非和声音を 入れる', b: 'メロディーに 動きを つける ために <b>経過音・刺繍音</b> を 入れる。例：ド → ミ の間に <b>レ</b> を 入れて ド → レ → ミ。', fig: { score: { clef: 'treble', key: 0, notes: [{ k: 'C5', d: 'q' }, { k: 'D5', d: 'q', c: '#c0392b', lab: '経過音' }, { k: 'E5', d: 'q' }], sp: 44, zoom: 1.8 } } },
        MEMO('実習の 合言葉', '順序を まもろう。', [['和音を たしかめてから 書く', '共通音は 保つ'], ['反対向き ・ 連続 NG', '導音は 上へ、第7音は 下へ'], ['書いたら 声に 出して（音で）聴く', 'ラボの「自動採点」で 確認']])
      ],
      sum: ['手順：調と和音 → 与えられた声部 → 配置 → 連結 → 見なおし', '数字付き低音：なし・6・6 4・7・6 5・4 3・4 2 で 和音を きめる', 'ソプラノ課題は ソプラノの 音が 和音の 何の 音かを かんがえる'],
      types: ['workOrder', 'chordFromSop', 'figBass7', 'nctAdd']
    }
  );
  Object.assign(GK.TYPE_NAME, {
    v7iName: 'Ⅴ₇転回形の 名前', v7iBass: 'Ⅴ₇転回形の バス', v7iFig: 'Ⅴ₇転回形を 見わける', v7iRes: 'Ⅴ₇転回形の 解決', v7Full: 'Ⅴ₇の 完全・不完全', v7iFind: 'Ⅴ₇転回形の まちがい',
    sixKind: '四六の 種類', sixProg: '四六の 進行', sixBass: '四六の バス', sixFig: '四六の 見わけ', sixRule: '四六の 決まり', sixFind: '四六の まちがい',
    sev7Notes: '七の和音の 構成音', sev7Type: '七の和音の 種類', sev7Rule: 'Ⅱ₇・Ⅶ₇の 決まり', sev7Fig: '七の和音を 見わける', sev7Find: '七の和音の まちがい',
    nineNotes: 'Ⅴ₉の 構成音', nineRule: 'Ⅴ₉の 決まり', nineFig: '第9音の 声部', nineFind: 'Ⅴ₉の まちがい',
    workOrder: '実習の 順序', chordFromSop: 'ソプラノから 和音', figBass7: '数字付き低音（七）', nctAdd: '経過音を 入れる'
  });
  GK.Q.addTips({
    'Ⅴ₇ の バス：根 ＝ Ⅴ₇、導音 ＝ Ⅴ₆₅、第5音 ＝ Ⅴ₄₃、第7音 ＝ Ⅴ₄₂。転回形は 4 音 そろえる': 'v7iName,v7iBass,v7iFig,v7iRes,v7Full,v7iFind',
    '四六は 経過・補助・終止。バス（第5音）を 重ねる': 'sixKind,sixProg,sixBass,sixFig,sixRule,sixFind',
    '七の和音の 第7音は 2度 下行。Ⅱ₇→Ⅴ、Ⅶ₇ は Ⅴ₇ の 代理': 'sev7Notes,sev7Type,sev7Rule,sev7Fig,sev7Find',
    'Ⅴ₉ は 第5音を 省略。第9音・第7音は 2度 下行': 'nineNotes,nineRule,nineFig,nineFind',
    '課題の 手順：調と和音 → 与えられた声部 → 配置 → 連結 → 見なおし': 'workOrder,chordFromSop,figBass7,nctAdd'
  });
})();
