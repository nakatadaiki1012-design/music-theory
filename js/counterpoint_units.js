/* =========================================================
   楽典ラボ：対位法の 単元（授業・問題・エディタ）
   c01 旋律の 基本　c02 協和と 不協和　c03 声部の 動き　c04 第1類（1対1）　c05 第2類（2対1）　c06 第3類・第4類・第5類
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, CP = GK.CP, U = GK.Q.util, L = GK.L, $ = GK.$, esc = GK.esc;
  var N = function (p) { return GK.nm(p); };
  var mc = U.mc, tx = U.tx, pick = U.pick, ri = U.ri, shuffle = U.shuffle, add = U.add, MEMO = L.MEMO, table = L.table;
  var RED = '#d3302a', BLUE = '#2d6fb0', GOLD = '#c08a0e';
  var kname = function (key) { return GK.H.keyName(key, false); };
  var rkey = function (R) { return pick(CP.KEYS, R); };
  var row2 = function (a, b, ta, tb) { var x = Object.assign({}, a, { ttl: ta }), y = Object.assign({}, b, { ttl: tb }); return { row: [x, y] }; };
  var KN = { dis: '不協和音程', par: '連続5度・8度', hid: '隠伏5度・8度', leap: '大きすぎる 跳躍', leapRec: '跳躍の あとの 動き', rep: '同じ音の くりかえし', cross: '声部の 交差', end: '終わり方', penult: '終止の 直前', uni: '途中の 1度', susp: '掛留の 解決', start: '始め方', tri: '増4度・減5度の 跳躍', climax: '最高音が 2回' };
  var SPN = { 1: '第1類（1対1）', 2: '第2類（2対1）', 3: '第3類（4対1）', 4: '第4類（シンコペーション）' };

  /* ---------- 例を つくる 道具 ---------- */
  var poolsFor = function (sp, o) { return CP.CFS.filter(function (p) { return !(sp >= 4 && p.length < 8) && !(o && o.short && p.length > (sp === 3 ? 8 : 9)); }); };
  function build(sp, above, key, pi, seed) {
    var R = GK.rng(seed), cf = CP.place(key, CP.CFS[pi], above), cp = CP.gen(key, cf, above, sp, R);
    return cp ? { key: key, cf: cf, cp: cp, above: above, sp: sp } : null;
  }
  function rbuild(sp, R, o) {
    o = o || {};
    for (var t = 0; t < 30; t++) {
      var key = o.key != null ? o.key : rkey(R), above = o.above != null ? o.above : R() < 0.7, pool = pick(poolsFor(sp, o), R);
      var cf = CP.place(key, pool, above), cp = CP.gen(key, cf, above, sp, R);
      if (cp) return { key: key, cf: cf, cp: cp, above: above, sp: sp };
    }
    throw new Error('rbuild');
  }
  function fbuild(sp, kinds, R, o) {
    o = o || {};
    for (var t = 0; t < 60; t++) {
      var kind = pick(kinds, R), key = rkey(R), above = o.above != null ? o.above : R() < 0.7, pool = pick(poolsFor(sp, o), R);
      var cf = CP.place(key, pool, above), f = CP.flawed(key, cf, above, sp, kind, R);
      if (f) return { key: key, cf: cf, cp: f.cp, above: above, sp: sp, issues: f.issues, kind: kind, good: f.good };
    }
    throw new Error('fbuild');
  }
  var fig = function (b, o) { return CP.fig(b.key, b.cf, b.cp, b.above, o); };
  var badT = function (b) { return b.issues.map(function (x) { return x.t; }); };
  var msgs = function (b) { return b.issues.map(function (x) { return x.msg; }).join('。'); };
  var playOf = function (b) {
    var tl = CP.timeline(b.cp), T = {}; b.cf.forEach(function (_, i) { T[i * 4] = 1; }); tl.forEach(function (x) { if (!x.rest) T[x.t] = 1; });
    var ts = Object.keys(T).map(Number).sort(function (a, c) { return a - c; }), out = [];
    ts.forEach(function (t, i) {
      var s = CP.sound(tl, t), c = b.cf[Math.min(b.cf.length - 1, Math.floor(t / 4))], nx = i + 1 < ts.length ? ts[i + 1] : t + 4, ps = [M.str(CP.pit(b.key, c))];
      if (s) ps.push(M.str(CP.pit(b.key, s.n)));
      out.push([ps, Math.max(0.25, (nx - t) * 0.42)]);
    });
    return out;
  };
  CP.playOf = playOf;
  var cfScore = function (key, cf, o) {
    o = o || {};
    return { score: { clef: 'treble', key: key, notes: cf.map(function (n, i) { var bad = (o.bad || []).indexOf(i) >= 0; return { k: M.str(CP.pit(key, n)), d: 'w', c: bad ? RED : '#333', lab: o.labs ? o.labs[i] || '' : '' }; }), sp: 40, zoom: 1.9 } };
  };
  var textMc = function (R, right, wrongs, n) { return mc(R, tx(right), wrongs.map(function (w) { return tx(w); }), n); };
  var factQ = function (R, L1) { var x = pick(L1, R), m = mc(R, tx(x[1]), x[2].map(function (s) { return tx(s); }).concat([tx(x[1])])); return { q: x[0], ch: m.ch, a: m.a, ex: x[3] }; };

  /* =================== c01 旋律の 基本 =================== */
  add('cfRule', 'c01', 1, function (R) {
    return factQ(R, [
      ['対位法（カウンターポイント）とは？', '<b>2 つ以上の メロディー</b> を、それぞれ 独立して 美しく 重ねる 技術', ['和音を 上から 順に 積む 技術', '1 つの メロディーに 伴奏を つける 技術', '同じ メロディーを ずらして 重ねるだけ の 技術'], '「点（音符）に 対する 点」が 語源。<b>横の 流れ（旋律）</b> を 大切に して 声部を 重ねる。和声法は 縦（和音）、対位法は 横（旋律）。'],
      ['もとに なる 旋律の ことを 何という？', '<b>定旋律</b>（カントゥス・フィルムス）', ['対旋律', '副旋律', '主題和音'], '定旋律に 合わせて つける 旋律が <b>対位線</b>（対旋律）。'],
      ['定旋律の 終わり方は？', '<b>上主音 → 主音</b>（2度 → 主音）', ['導音 → 主音 だけ', '属音 → 主音', '主音 → 属音'], '厳格対位法の 定旋律は 最後が「ミ → ド」ではなく「<b>レ → ド</b>」（ハ長調）。'],
      ['定旋律の 最高音（頂点）は ふつう いくつ？', '<b>1 回だけ</b>', ['2 回 以上', 'ない', 'かならず 最初の 音'], '山の 頂上は ひとつ。くりかえさない ほうが 旋律が すっきりする。'],
      ['旋律で 大きな 跳躍（4度・5度）を したら？', '<b>反対向き の 順次進行</b> で もどる', ['同じ向きに もう 1 回 跳ぶ', '同じ音を くりかえす', '何も しなくて よい'], '跳躍の あとは <b>反対に 順次進行</b>（ドミソ…ではなく ド→ソ→ファ のように）。'],
      ['旋律で さける 動きは？', '<b>6度以上の 跳躍・増4度（減5度）・同じ音の くりかえし</b>', ['順次進行', '3度の 跳躍', '反対向きへ もどる 動き'], '歌いやすい 旋律に する ため、大きすぎる 跳躍や くせの ある 音程は さける。']
    ]);
  });
  var CFK = ['leap', 'leapRec', 'rep', 'climax'];
  add('cfFlaw', 'c01', 2, function (R, st) {
    for (var t = 0; t < 800; t++) {
      var key = rkey(R), pool = pick(CP.CFS, R).slice(), kind = pick(CFK, R), i = ri(2, pool.length - 3, R), d = pick([-3, -2, 2, 3, 4, 5], R), cf = pool.slice();
      if (kind === 'rep') cf[i] = cf[i - 1]; else cf[i] += d;
      var is = CP.checkCF(key, cf), ks = {}; is.forEach(function (x) { ks[x.k] = 1; });
      if (!is.length || Object.keys(ks).length !== 1 || !ks[kind]) continue;
      var m = textMc(R, KN[kind], CFK.map(function (k) { return KN[k]; }));
      return { q: kname(key) + '。この 定旋律には 1 つ 問題が ある。どんな 問題？', fig: cfScore(key, cf), ch: m.ch, a: m.a, ex: '<b>' + KN[kind] + '</b>：' + is[0].msg + '。', exFig: cfScore(key, cf, { bad: is.map(function (x) { return x.i; }) }), play: cf.map(function (n) { return [M.str(CP.pit(key, n)), 0.5]; }) };
    }
    throw new Error('cfFlaw');
  });
  add('cfEnd', 'c01', 1, function (R) {
    var key = rkey(R), t = M.DEG, nm = function (d) { return t[d] + '（' + CP.name(key, d) + '）'; }, m = textMc(R, nm(1), [nm(0), nm(4), nm(6), nm(2), nm(3), nm(5)]);
    return { q: kname(key) + '。定旋律の 最後の 音は 主音。その ひとつ前の 音は？', ch: m.ch, a: m.a, ex: '定旋律は「<b>上主音 → 主音</b>」で おわる（' + CP.name(key, 1) + ' → ' + CP.name(key, 0) + '）。対位線は ここで 導音（' + CP.name(key, 6) + '）を つかって 終止する。', play: [[M.str(CP.pit(key, 1)), 0.7], [M.str(CP.pit(key, 0)), 1.2]] };
  });

  /* =================== c02 協和と 不協和 =================== */
  var CSTEPS = { P: [0, 4, 7], I: [2, 5], D: [1, 3, 6] };
  function interval(R, want) {
    for (var t = 0; t < 80; t++) {
      var key = rkey(R), a = ri(0, 4, R), steps = pick(CSTEPS[want], R), semi = CP.mid(key, a + steps) - CP.mid(key, a);
      if (CP.cls(semi) === want) return { key: key, a: a, steps: steps };
    }
    throw new Error('interval');
  }
  var ivFig = function (iv, o) { var cf = CP.place(iv.key, [iv.a], true), sh = cf[0] - iv.a; return CP.fig(iv.key, cf, [{ n: iv.a + iv.steps + sh, b: 4 }], true, Object.assign({ lab: false, nums: false, sp: 54, zoom: 1.7 }, o || {})); };
  add('conClass', 'c02', 1, function (R, st) {
    var cl = pick(['P', 'I', 'D'], R), iv = interval(R, cl), m = textMc(R, CP.CLS[cl], ['P', 'I', 'D'].map(function (k) { return CP.CLS[k]; }), 3);
    return { q: '2 声の この 音程（' + CP.degName(iv.steps) + '）は 対位法では どれ？', fig: ivFig(iv), ch: m.ch, a: m.a, ex: '<b>' + CP.degName(iv.steps) + '</b> は <b>' + CP.CLS[cl] + '</b>。完全協和 ＝ 1度・5度・8度、不完全協和 ＝ 3度・6度、不協和 ＝ 2度・4度・7度（と 減5度・増4度）。', exFig: ivFig(iv, { lab: true }) };
  });
  add('conRule', 'c02', 1, function (R) {
    return factQ(R, [
      ['完全協和音程 は どれ？', '<b>1度・5度・8度</b>', ['3度・6度', '2度・7度', '4度・減5度'], '完全協和音程：<b>1度（ユニゾン）・5度・8度</b>。からっぽ で 安定した ひびき。'],
      ['不完全協和音程 は どれ？', '<b>3度・6度</b>', ['1度・5度・8度', '2度・7度', '4度'], '不完全協和音程：<b>3度・6度</b>。やわらかく 豊かな ひびき。対位法の 主役。'],
      ['対位法では 2 声の 4度 は どう あつかう？', '<b>不協和</b>（協和音程では ない）', ['完全協和', '不完全協和', '5度と 同じ'], '和声では 4度が 協和する 場合も あるが、<b>2 声の 対位法では 4度は 不協和</b>。'],
      ['不協和音程 は どれ？', '<b>2度・7度・4度</b>', ['3度・6度', '5度・8度', '1度・8度'], '2度・7度・4度 と 増4度・減5度が 不協和。ぶつかる ひびき。'],
      ['第1類（1対1）で 使える 音程は？', '<b>協和音程だけ</b>（1・3・5・6・8度）', ['どれでも よい', '不協和だけ', '2度と 7度だけ'], '第1類は すべての 音が <b>協和</b>。不協和は 第2類以降で 経過音 などとして 登場する。']
    ]);
  });
  add('conName', 'c02', 2, function (R) {
    var cl = pick(['P', 'I', 'D'], R), iv = interval(R, cl), correct = CP.degName(iv.steps), all = [1, 2, 3, 4, 5, 6, 7, 8].map(function (d) { return d + '度'; }).filter(function (x) { return x !== correct; });
    var m = textMc(R, correct, all);
    return { q: '2 声の この 音程は 何度？', fig: ivFig(iv), ch: m.ch, a: m.a, ex: '下の音を 1 と 数えて <b>' + correct + '</b>（' + CP.name(iv.key, iv.a) + ' → ' + CP.name(iv.key, iv.a + iv.steps) + '）。<b>' + CP.CLS[cl] + '</b>。', exFig: ivFig(iv, { lab: true }), play: [[[M.str(CP.pit(iv.key, iv.a)), M.str(CP.pit(iv.key, iv.a + iv.steps))], 1.4]] };
  });
  add('conFind', 'c02', 2, function (R) {
    for (var t = 0; t < 60; t++) {
      var key = rkey(R), bad = ri(0, 3, R), cf = [pick([0, 2, 4], R), pick([1, 3, 5], R), pick([2, 4, 6], R), pick([0, 3, 5], R)], cp = [], okAll = true;
      for (var i = 0; i < 4 && okAll; i++) {
        var want = i === bad ? ['D'] : ['P', 'I'], opts = [1, 2, 3, 4, 5, 6, 7].filter(function (s) { return want.indexOf(CP.cls(CP.mid(key, cf[i] + s) - CP.mid(key, cf[i]))) >= 0 && s !== 0; });
        if (!opts.length) { okAll = false; break; }
        cp.push({ n: cf[i] + pick(opts, R), b: 4 });
      }
      if (!okAll) continue;
      var cfp = CP.place(key, cf, true), shift = cfp[0] - cf[0], cpp = cp.map(function (x) { return { n: x.n + shift, b: 4 }; });
      var m = textMc(R, (bad + 1) + ' つめ', [1, 2, 3, 4].map(function (x) { return x + ' つめ'; }).filter(function (x) { return x !== (bad + 1) + ' つめ'; }));
      return { q: '<b>不協和音程</b> に なっているのは どれ？（上下の 音を 重ねて 数える）', fig: CP.fig(key, cfp, cpp, true, { lab: false, nums: true, zoom: 2 }), ch: m.ch, a: m.a, ex: (bad + 1) + ' つめが <b>' + CP.degName(cpp[bad].n - cfp[bad]) + '</b>（不協和）。他は 協和音程。', exFig: CP.fig(key, cfp, cpp, true, { lab: true, nums: true, zoom: 2, bad: [bad * 4] }) };
    }
    throw new Error('conFind');
  });

  /* =================== c03 声部の 動き =================== */
  var MOT = { par: '平行進行', sim: '同進行', con: '反進行', obl: '斜進行' };
  var MOTEX = { par: '<b>同じ向き</b> で、<b>同じ 音程</b> を たもって 動く', sim: '<b>同じ向き</b> に 動くが、音程は かわる', con: '<b>反対の 向き</b> に 動く', obl: '<b>片方が 動かず</b>、もう 片方だけ 動く' };
  // 2 つの 縦の 関係：cf（下の声）が a → a+cd、対位線が a+v1 → a+v1+pd
  function mkMotion(R, kind) {
    for (var t = 0; t < 400; t++) {
      var key = rkey(R), a = ri(0, 3, R), cd = pick([-2, -1, 1, 2], R), v1 = pick([2, 4, 5, 7], R), pd, sg = cd > 0 ? 1 : -1;
      if (kind === 'par') pd = cd;
      else if (kind === 'sim') pd = sg * pick([1, 2, 3], R);
      else if (kind === 'con') pd = -sg * pick([1, 2, 3], R);
      else if (R() < 0.5) { pd = pick([-2, -1, 1, 2], R); cd = 0; } else pd = 0;
      if (kind === 'sim' && pd === cd) continue;
      return fin(key, a, cd, v1, pd);
    }
    throw new Error('motion ' + kind);
  }
  function fin(key, a, cd, v1, pd) {
    var c = [a, a + cd], p = [a + v1, a + v1 + pd], v2 = p[1] - c[1], cl = [CP.cls(CP.mid(key, p[0]) - CP.mid(key, c[0])), CP.cls(CP.mid(key, p[1]) - CP.mid(key, c[1]))];
    if (v1 < 2 || v2 < 2 || v2 > 9 || cl[0] === 'D' || cl[1] === 'D') return null;
    return { key: key, cf: c, cp: p, vs: [v1, v2], cls: cl };
  }
  function motion(R, kind) { for (var t = 0; t < 200; t++) { var m = mkMotion(R, kind); if (m) return m; } throw new Error('motion2 ' + kind); }
  var motFig = function (mo, o) { var cf = CP.place(mo.key, mo.cf, true), sh = cf[0] - mo.cf[0]; return CP.fig(mo.key, cf, mo.cp.map(function (n) { return { n: n + sh, b: 4 }; }), true, Object.assign({ lab: false, nums: false, sp: 52, zoom: 1.8 }, o || {})); };
  add('motName', 'c03', 1, function (R) {
    var k = pick(['par', 'sim', 'con', 'obl'], R), mo = motion(R, k), m = textMc(R, MOT[k], Object.keys(MOT).map(function (x) { return MOT[x]; })), cf = CP.place(mo.key, mo.cf, true), sh = cf[0] - mo.cf[0];
    return { q: '2 つの 声部の 動きは どれ？', fig: motFig(mo), ch: m.ch, a: m.a, ex: '<b>' + MOT[k] + '</b>：' + MOTEX[k] + '。', exFig: motFig(mo, { lab: true }), play: playOf({ key: mo.key, cf: cf, cp: mo.cp.map(function (n) { return { n: n + sh, b: 4 }; }), above: true }) };
  });
  add('motDef', 'c03', 1, function (R) {
    var k = pick(Object.keys(MOT), R), m = textMc(R, MOT[k], Object.keys(MOT).map(function (x) { return MOT[x]; }));
    return { q: MOTEX[k] + ' ── この 動きの 名前は？', ch: m.ch, a: m.a, ex: '<b>' + MOT[k] + '</b>：' + MOTEX[k] + '。' };
  });
  function badMotion(R, kind) {
    for (var t = 0; t < 600; t++) {
      var key = rkey(R), a = ri(0, 3, R), cd = pick([-2, -1, 1, 2], R), sg = cd > 0 ? 1 : -1, v1, v2, m;
      if (kind === 'p5') { v1 = 4; v2 = 4; } else if (kind === 'p8') { v1 = 7; v2 = 7; } else { v1 = pick([2, 5], R); v2 = pick([4, 7], R); }
      var pd = cd + v2 - v1;
      if (kind === 'ok' ? (pd === 0 || (pd > 0) === (cd > 0)) : kind === 'hid' ? (pd === 0 || (pd > 0) !== (cd > 0)) : false) continue;
      m = fin(key, a, cd, v1, pd); if (!m) continue;
      if (kind === 'p5' || kind === 'p8') { if (m.cls[0] !== 'P' || m.cls[1] !== 'P') continue; }
      else if (m.cls[0] !== 'I' || m.cls[1] !== 'P') continue;
      return m;
    }
    throw new Error('badMotion ' + kind);
  }
  var BM = { p5: '連続5度', p8: '連続8度', hid: '隠伏5度・8度', ok: '問題なし' };
  add('motBad', 'c03', 2, function (R, st) {
    var k = pick(['p5', 'p8', 'hid', 'ok'], R), mo = badMotion(R, k), m = textMc(R, BM[k], Object.keys(BM).map(function (x) { return BM[x]; }));
    var why = { p5: '5度 → 5度 を <b>同じ向き</b> に（平行して）進むので 連続5度。', p8: '8度 → 8度 を <b>同じ向き</b> に 進むので 連続8度。', hid: '3度・6度から <b>同じ向き</b> に 5度・8度へ ぶつかる ので 隠伏5度・8度。', ok: '完全音程に 向かうが <b>反対の 向き</b>（反進行）なので 問題なし。' };
    return { q: '2 声部の この 動きは どう？', fig: motFig(mo), ch: m.ch, a: m.a, ex: '<b>' + BM[k] + '</b>：' + why[k], exFig: motFig(mo, { lab: true, bad: k === 'ok' ? [] : [4] }) };
  });
  add('motRule', 'c03', 2, function (R) {
    return factQ(R, [
      ['完全協和音程（5度・8度）に ぶつかる とき、安全な 動きは？', '<b>反進行</b>（反対の 向き）', ['平行進行', '同進行（同じ向き）', 'どんな 動きでも よい'], '完全音程へは <b>反進行</b> か <b>斜進行</b> で 入る。同じ向きは 連続・隠伏に なる。'],
      ['連続5度・連続8度が 禁止 されて いる 理由は？', '2 声が 1 つに 聞こえて <b>独立性</b> が うしなわれる から', ['音が 高く なる から', '和音が 4 つ に なる から', '歌えない 音が 出る から'], '2 つの 声部が ぴったり くっついて 動くと、<b>別々の メロディー に 聞こえなく</b> なる。'],
      ['もっとも よく 使うと よい 動きは？', '<b>反進行</b>', ['平行進行', 'ずっと 斜進行', 'すべて 同進行'], '反進行は 声部の 独立性が もっとも 高い。対位法の 基本。'],
      ['3度や 6度 の 平行進行 は？', '<b>続けて よい</b>（ただし 3 回まで）', ['禁止', '5 回 以上 続ける', '8度に しなければ ならない'], '不完全協和音程の 平行は よいが、長く 続くと 独立性が うすれるので <b>3 回 まで</b>。']
    ]);
  });

  /* =================== c04 第1類（1対1） =================== */
  add('cp1Rule', 'c04', 1, function (R) {
    return factQ(R, [
      ['第1類 対位法では 定旋律 1 音に 対位線 何音？', '<b>1 音</b>（1対1）', ['2 音', '4 音', '3 音'], '第1類は <b>音符対音符</b>。どちらも 全音符で、すべて 協和音程。'],
      ['第1類の 最初の 音程は？', '<b>完全協和音程</b>（1度・5度・8度）', ['2度', '3度の みで よい', '7度'], '最初と 最後は <b>完全協和音程</b>。上に つけるときは 5度も 可。下に つけるときは 1度か 8度。'],
      ['第1類の 最後の 音程は？', '<b>1度か 8度</b>', ['5度', '3度', '6度'], '最後は 1度（ユニゾン）か 8度で おわる。'],
      ['第1類の 終止の ひとつ前の 音程は？（上に つける とき）', '<b>6度</b>（導音）', ['3度', '5度', '4度'], '対位線が 導音（ハ長調では シ）に なり、主音（ド）へ <b>反進行</b> で 8度に おさまる。下に つける ときは 3度。'],
      ['第1類の 途中で ふつう さける 音程は？', '<b>1度（ユニゾン）</b>', ['3度', '6度', '5度'], '途中の 1度は 2 声が 重なって 独立性が うすれる ので、最初と 最後だけに する。']
    ]);
  });
  add('cp1Find', 'c04', 2, function (R, st) {
    var b = fbuild(1, ['dis', 'par', 'leap', 'rep', 'leapRec'], R), is = b.issues[0], bar = is.bar, L1 = b.cf.length;
    var opts = [bar]; while (opts.length < 4) { var x = ri(0, L1 - 1, R); if (opts.indexOf(x) < 0) opts.push(x); }
    var m = textMc(R, (bar + 1) + ' 小節め', opts.slice(1).map(function (x) { return (x + 1) + ' 小節め'; }));
    return { q: '第1類の 対位線。<b>まちがい</b> が ある 小節は？（連続の ときは 後ろの 小節）', fig: fig(b, { lab: false }), ch: m.ch, a: m.a, ex: (bar + 1) + ' 小節め：' + msgs(b) + '。', exFig: fig(b, { bad: badT(b) }), play: playOf(b) };
  });
  add('cp1Name', 'c04', 2, function (R, st) {
    var ks = ['dis', 'par', 'leap', 'rep', 'leapRec'], b = fbuild(1, ks, R), kind = b.issues[0].k, m = textMc(R, KN[kind], ks.map(function (k) { return KN[k]; }));
    return { q: '赤く しなくても わかる？ この 対位線の <b>まちがい</b> は どれ？', fig: fig(b, { lab: false }), ch: m.ch, a: m.a, ex: '<b>' + KN[kind] + '</b>：' + msgs(b) + '。', exFig: fig(b, { bad: badT(b) }), play: playOf(b) };
  });
  add('cp1Fill', 'c04', 3, function (R) {
    for (var t = 0; t < 40; t++) {
      var b = rbuild(1, R), L1 = b.cf.length, i = ri(2, L1 - 3, R), sg = b.above ? 1 : -1, c = b.cf[i], good = b.cp[i].n, cands = [];
      for (var s = (b.above ? 0 : -9); s <= (b.above ? 9 : 0); s++) { var n = c + s; if (n === good) continue; var cp2 = b.cp.map(function (x) { return Object.assign({}, x); }); cp2[i].n = n; if (CP.check({ key: b.key, cf: b.cf, cp: cp2, above: b.above, sp: 1 }).length) cands.push(n); }
      if (cands.length < 3) continue;
      var pick3 = shuffle(cands, R).slice(0, 3), lab = function (n) { return CP.name(b.key, n) + '（' + CP.degName(Math.abs(n - c)) + '）'; };
      var m = textMc(R, lab(good), pick3.map(lab));
      var cpq = b.cp.map(function (x) { return Object.assign({}, x); });
      return { q: kname(b.key) + '。<b>？</b> に 入る 音は？（ルールを まもる 音を えらぶ）', fig: fig(b, { q: [i], qLab: [i], lab: false }), ch: m.ch, a: m.a, ex: '<b>' + lab(good) + '</b> が 正解。ほかの 音は 不協和・連続5度（8度）・跳躍の まちがい などで ルール違反に なる。', exFig: fig(b, { lab: true }), play: playOf(b) };
    }
    throw new Error('cp1Fill');
  });
  add('cp1End', 'c04', 2, function (R) {
    var b = rbuild(1, R), above = b.above, L1 = b.cf.length, c = b.cf[L1 - 2], n = b.cp[L1 - 2].n;
    var lab = function (x) { return CP.name(b.key, x) + '（' + CP.degName(Math.abs(x - c)) + '）'; }, ans = lab(n), wr = [];
    [1, 3, 4, 6, 7].forEach(function (s) { var x = c + (above ? s : -s); if (lab(x) !== ans && wr.indexOf(lab(x)) < 0) wr.push(lab(x)); });
    var m = textMc(R, ans, wr);
    return { q: kname(b.key) + '。定旋律の 終わりは「' + CP.name(b.key, 1) + ' → ' + CP.name(b.key, 0) + '」。対位線を ' + (above ? '上' : '下') + ' に つける とき、終止の ひとつ前の 音は？（導音 を えらぶ）', fig: fig(b, { q: [L1 - 2], qLab: [L1 - 2], lab: false, nums: true }), ch: m.ch, a: m.a, ex: '<b>' + ans + '</b>。導音（' + CP.name(b.key, 6) + '）が 主音へ 解決して ' + (above ? '8度' : '1度か 8度') + 'に おさまる。', exFig: fig(b, { lab: true }), play: playOf(b) };
  });

  /* =================== c05 第2類（2対1） =================== */
  add('sp2Rule', 'c05', 1, function (R) {
    return factQ(R, [
      ['第2類 対位法では 定旋律 1 音に 対位線 何音？', '<b>2 音</b>（2分音符 2 つ）', ['1 音', '4 音', '3 音'], '第2類は <b>2対1</b>。定旋律が 全音符なら 対位線は 2分音符 2 つ。'],
      ['第2類で 強拍（1拍め）の 音は？', '<b>協和音程</b> でなければ ならない', ['不協和でも よい', '好きに えらべる', '5度だけ'], '強拍は かならず 協和音程。<b>弱拍</b> にだけ 条件つきで 不協和が 来られる。'],
      ['第2類で 弱拍に 不協和音程が 来て よい のは？', '<b>順次進行の 経過音</b>（同じ向きで 2度ずつ）', ['跳躍で 入る とき', '同じ音の くりかえし', 'いつでも'], '弱拍の 不協和は <b>経過音</b>（前も 後ろも 同じ向きに 順次進行）の ときだけ。'],
      ['第2類の 最後の 小節は？', '<b>全音符 1 つ</b>（1度か 8度）', ['2分音符 2 つ', '4分音符 4 つ', '休符'], '最後は 第1類と 同じ。全音符で 1度か 8度に おわる。'],
      ['第2類で さけなければ ならない のは？', '<b>強拍から 強拍へ の 連続5度・8度</b>', ['3度の 平行', '6度の 平行', '反進行'], '間に 弱拍の 音が はさまって いても、強拍から 強拍への 連続5度・8度は 禁止。']
    ]);
  });
  add('sp2Find', 'c05', 2, function (R) {
    var b = fbuild(2, ['dis', 'par', 'leap', 'rep'], R, { short: true }), bar = b.issues[0].bar, L1 = b.cf.length, opts = [bar];
    while (opts.length < 4) { var x = ri(0, L1 - 1, R); if (opts.indexOf(x) < 0) opts.push(x); }
    var m = textMc(R, (bar + 1) + ' 小節め', opts.slice(1).map(function (x) { return (x + 1) + ' 小節め'; }));
    return { q: '第2類の 対位線。<b>まちがい</b> が ある 小節は？', fig: fig(b, { lab: false }), ch: m.ch, a: m.a, ex: (bar + 1) + ' 小節め：' + msgs(b) + '。', exFig: fig(b, { bad: badT(b) }), play: playOf(b) };
  });
  add('sp2Name', 'c05', 2, function (R) {
    var ks = ['dis', 'par', 'leap', 'rep'], b = fbuild(2, ks, R, { short: true }), kind = b.issues[0].k, m = textMc(R, KN[kind], ks.map(function (k) { return KN[k]; }));
    return { q: 'この 第2類の 対位線の <b>まちがい</b> は どれ？', fig: fig(b, { lab: false }), ch: m.ch, a: m.a, ex: '<b>' + KN[kind] + '</b>：' + msgs(b) + '。', exFig: fig(b, { bad: badT(b) }), play: playOf(b) };
  });
  add('sp2Weak', 'c05', 2, function (R) {
    return factQ(R, [
      ['弱拍の 音が 不協和でも よい のは？（ド → レ → ミ の レ）', '前後が <b>同じ 向きの 順次進行</b>（経過音）', ['前後が 跳躍', '前の 音と 同じ 高さ', '次の 音が 反対向き'], '「ド → <b>レ</b> → ミ」の ように 同じ向きに 順次で つなぐ レが 経過音。'],
      ['ド → レ → ド の レは 弱拍で 不協和 のとき？', '<b>不可</b>（刺繍音は 第2類では 使えない）', ['可', '強拍なら 可', 'いつでも 可'], '行って もどる 動き（<b>刺繍音</b>）は、厳格対位法の 第2類では 使わない。経過音だけ。'],
      ['弱拍の 音が 跳躍で 入る とき、不協和は？', '<b>不可</b>', ['可', '2度なら 可', '5度なら 可'], '跳躍で 入る 不協和は 禁止。<b>順次進行</b> で 入って 順次進行で 出る。'],
      ['強拍が 不協和 の とき は？', '<b>不可</b>', ['可', '経過音なら 可', '弱拍の あとなら 可'], '強拍（1拍め）は 協和音程 のみ。']
    ]);
  });

  /* =================== c06 第3類・第4類・第5類 =================== */
  add('spName', 'c06', 1, function (R) {
    var sp = pick([1, 2, 3, 4], R), b = rbuild(sp, R, { short: true }), m = textMc(R, SPN[sp], [1, 2, 3, 4].map(function (k) { return SPN[k]; }));
    var why = { 1: '定旋律 1 音に 対位線 1 音（全音符）', 2: '定旋律 1 音に 対位線 2 音（2分音符）', 3: '定旋律 1 音に 対位線 4 音（4分音符）', 4: '対位線が <b>小節線を またいで</b> タイで つながれる（シンコペーション）' };
    return { q: 'この 対位法は どの 種類？', fig: fig(b, { lab: false }), ch: m.ch, a: m.a, ex: '<b>' + SPN[sp] + '</b>：' + why[sp] + '。', exFig: fig(b, { lab: true }), play: playOf(b) };
  });
  add('sp3Rule', 'c06', 2, function (R) {
    return factQ(R, [
      ['第3類 対位法では 定旋律 1 音に 対位線 何音？', '<b>4 音</b>（4分音符 4 つ）', ['1 音', '2 音', '8 音'], '第3類は <b>4対1</b>。最後の 小節だけ 全音符。'],
      ['第3類で 協和音程で なければ ならない 拍は？', '<b>1拍め と 3拍め</b>', ['すべての 拍', '1拍めだけ', '4拍め だけ'], '4分音符の うち <b>1拍め と 3拍め</b> は 協和音程。2拍め・4拍めには 経過音の 不協和が 来られる。'],
      ['第3類で 不協和が 来られる 拍は？', '<b>2拍め・4拍め</b>（経過音 として）', ['1拍め', '3拍め', 'どの 拍でも'], '弱い 拍（2・4拍め）に 順次進行の <b>経過音</b> として。'],
      ['第3類で 終止の ひとつ前（最後の 4分音符）は？', '<b>導音</b>', ['属音', '主音', '上主音'], '第1・2類と 同じく 終止の 直前は 導音（上に つける とき 6度）。']
    ]);
  });
  add('suspRule', 'c06', 2, function (R) {
    return factQ(R, [
      ['第4類 対位法の 特徴は？', '対位線が <b>小節線を またいで タイ</b> で つながる（シンコペーション）', ['4分音符 4 つ', '全音符 だけ', '休符 だけ'], '弱拍（3拍め）に 入った 音が 次の 小節の 頭まで つながる。この ときに <b>掛留（けいりゅう）</b> が 生まれる。'],
      ['掛留で ぶつかった 不協和音は どう 解決する？', '<b>2度 下行</b> する', ['2度 上行', '3度 跳躍', '同じ音で 保つ'], '不協和に なった 音は <b>2度 下</b> へ 解決して 協和音程に。'],
      ['対位線を 上に つける ときの 掛留の 音程の 進み方は？', '<b>7度 → 6度</b>（ほかに 4度 → 3度・9度 → 8度）', ['2度 → 3度', '5度 → 6度', '6度 → 7度'], '上の 声が 2度 下がって 7度から 6度（または 4度から 3度）に 解決する。'],
      ['対位線を 下に つける ときの 掛留の 音程の 進み方は？', '<b>2度 → 3度</b>（下の 声が 下がる）', ['7度 → 6度', '4度 → 5度', '6度 → 5度'], '下の 声が 下に 解決 するので、上から 見ると <b>2度 → 3度</b> に なる。'],
      ['掛留の 不協和が 出る 拍は？', '<b>強拍</b>（小節の 頭）', ['弱拍', '3拍め', '2拍め'], 'シンコペーションで 強拍に 不協和が ぶつかり、<b>弱拍で 解決</b> する。']
    ]);
  });
  add('suspFig', 'c06', 3, function (R) {
    for (var t = 0; t < 60; t++) {
      var b = rbuild(4, R, { short: true }), tl = CP.timeline(b.cp), hit = null;
      tl.forEach(function (x, j) { if (!x.rest && j > 0 && tl[j - 1].tie && x.t % 4 === 0) { var c = b.cf[x.t / 4], s = (x.n - c) * (b.above ? 1 : -1); if (CP.cls(CP.mid(b.key, x.n) - CP.mid(b.key, c)) === 'D' && !hit) hit = { x: x, st: s }; } });
      if (!hit) continue;
      var correct = CP.degName(hit.st), m = textMc(R, correct, ['2度', '4度', '7度', '9度', '3度', '6度'].filter(function (x) { return x !== correct; }));
      return { q: '赤い 音は 前の 小節から つながって 不協和に ぶつかった「掛留」。何度の 不協和？', fig: fig(b, { lab: false, bad: [hit.x.t] }), ch: m.ch, a: m.a, ex: '赤い 音は <b>' + correct + '</b>（不協和）。このあと <b>2度 下行</b> して 協和音程に 解決する。', exFig: fig(b, { lab: true, bad: [hit.x.t] }), play: playOf(b) };
    }
    throw new Error('suspFig');
  });
  add('sp5Rule', 'c06', 1, function (R) {
    return factQ(R, [
      ['第5類（華麗対位法）とは？', '第1〜4類を <b>まぜて</b> 自由に 動く', ['全音符だけ', '8分音符 だけ', '1 声だけ'], '第5類は これまでの <b>全種類 を ミックス</b>。2分・4分・8分音符や タイを 自由に まぜる。'],
      ['第5類で 使える 音符の 組み合わせは？', '全音符・2分・4分・（8分）・タイ など <b>自由に まぜる</b>', ['4分音符 だけ', '全音符 だけ', '2分音符 だけ'], '旋律らしい 流れの ある 対位線を 作る。バッハの 音楽へ つながる。'],
      ['厳格対位法で 学ぶ ことは？', '<b>声部の 独立性</b> と ルールの 基本', ['和音の 名前', '楽器の 名前', '調号の 数'], '2 声を 横に 美しく 動かす 力が、和声や 作曲の 土台に なる。']
    ]);
  });

  /* =================== 授業 =================== */
  var hasDis = function (b) { return b.cp.some(function (x) { return !x.rest && CP.cls(CP.mid(b.key, x.n) - CP.mid(b.key, b.cf[Math.min(b.cf.length - 1, Math.floor(CP.timeline(b.cp).filter(function (y) { return y.i === b.cp.indexOf(x); })[0].t / 4))])) === 'D'; }); };
  var tryB = function (sp, above, pis, need) { var fb = null; for (var i = 0; i < pis.length; i++) for (var sd = 1; sd < 60; sd++) { var r = build(sp, above, 0, pis[i], sd); if (r && !fb) fb = r; if (r && (!need || hasDis(r))) return r; } return fb; };
  var ex1 = tryB(1, true, [5, 4, 0]), ex1b = tryB(1, false, [5, 4, 0]), ex2 = tryB(2, true, [5, 4, 0], true), ex3 = tryB(3, true, [5, 4], true), ex4 = tryB(4, true, [4, 6, 0]);
  var pf = function (b, o) { return b ? fig(b, o) : { html: '' }; };
  var fl = function (sp, k, seed, above) { try { var R = GK.rng(seed); for (var t = 0; t < 40; t++) { var cf = CP.place(0, CP.CFS[t % CP.CFS.length], above), f = CP.flawed(0, cf, above, sp, k, R); if (f) return { key: 0, cf: cf, cp: f.cp, above: above, sp: sp, issues: f.issues }; } } catch (e) {} return null; };
  var flDis = fl(1, 'dis', 2, true), flPar = fl(1, 'par', 5, true), flLeap = fl(1, 'leap', 3, true);
  var mo = function (k) { return motion(GK.rng(k.length * 31 + 5 + (k === 'sim' ? 3 : 0)), k); };
  GK.CPDEF = [
    {
      id: 'c01', title: '旋律の 基本', en: 'Melody Basics', sym: '〰', goal: '定旋律と 歌いやすい 旋律の 決まりが わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '対位法は「2 つの メロディー を 重ねる」', b: '<b>和声法</b> は 和音（縦）、<b>対位法</b> は メロディー（横）。もとに なる 旋律が <b>定旋律</b>、そこへ つける 旋律が <b>対位線</b>。2 つが 別々に 歌えて ひとつに とけあう のが ねらい。', fig: pf(ex1, { lab: false }) },
        { k: 'ポイント 1', h: '定旋律の 作り方', b: '<b>主音で はじまり</b>、<b>上主音 → 主音</b> で おわる。おもに <b>順次進行</b>。最高音は <b>1 回</b>。長さは 8〜12 小節ぐらい。', fig: cfScore(0, CP.CFS[0], { labs: ['', '', '', '', '', '', '頂点', '', '', '2度', '主音'].slice(0, CP.CFS[0].length) }) },
        { k: 'ポイント 2', h: '跳躍の ルール', b: '4度・5度の 跳躍の あとは <b>反対向きの 順次進行</b> で もどる。<b>6度 以上</b> の 跳躍、<b>増4度・減5度</b>、<b>同じ音の くりかえし</b> は さける。', fig: row2(cfScore(0, [0, 4, 3, 2], { labs: ['', '跳ぶ', 'もどる', ''] }), cfScore(0, [0, 5, 4, 3], { bad: [1], labs: ['', '6度跳躍', '', ''] }), '○ 跳んで 反対へ もどる', '✕ 6度の 跳躍') },
        MEMO('旋律の 合言葉', '歌えるメロディーが 基本。', [['順次進行が 中心', '跳ぶ ときは 4度・5度まで'], ['跳んだら 反対へ 順次で もどる', '同じ音の くりかえしは しない'], ['頂点は 1 回', '主音で はじまり「2度 → 主音」で おわる']])
      ],
      sum: ['対位法 ＝ 2 つ以上の メロディーを 独立に 重ねる 技術', '定旋律は 主音で はじまり「上主音 → 主音」で おわる。頂点は 1 回', '跳躍は 5度まで。跳んだら 反対向きの 順次進行で もどる'],
      types: ['cfRule', 'cfEnd', 'cfFlaw']
    },
    {
      id: 'c02', title: '協和と 不協和', en: 'Consonance & Dissonance', sym: '⚖', goal: '2 声の 音程の 協和・不協和を 分けられる',
      cards: [
        { k: '✨ ひとことで言うと', h: '2 声の 音程は 3 種類に 分かれる', b: '<b>完全協和</b>（1・5・8度）、<b>不完全協和</b>（3・6度）、<b>不協和</b>（2・4・7度 と 増4度・減5度）。対位法の 最初の 音程は ぜんぶ 協和音程 から。', fig: { html: table(['種類', '音程', 'ひびき'], [['完全協和', '1度・5度・8度', 'からっぽで 安定'], ['不完全協和', '3度・6度', 'やわらかく 豊か'], ['不協和', '2度・4度・7度', 'ぶつかる']], { fs: 15, mw: 420 }) } },
        { k: 'ポイント 1', h: '音程の 数え方', b: '下の音を <b>1</b> と して 上の 音まで 数える。同じ音 ＝ <b>1度</b>、ひとつ 上 ＝ <b>2度</b>、ド → ソ ＝ <b>5度</b>。', fig: { row: [ivFig({ key: 0, a: 0, steps: 4 }, { lab: true, nums: false, zoom: 1.6 }), ivFig({ key: 0, a: 0, steps: 2 }, { lab: true, nums: false, zoom: 1.6 }), ivFig({ key: 0, a: 0, steps: 5 }, { lab: true, nums: false, zoom: 1.6 })] } },
        { k: 'ポイント 2', h: '2 声の 4度は 不協和', b: '和声では 4度が 使える ことも あるが、<b>2 声の 対位法では 4度は 不協和</b> として あつかう。ここは 大きな ちがい。', fig: row2(ivFig({ key: 0, a: 0, steps: 4 }, { lab: true, nums: false, zoom: 1.6 }), ivFig({ key: 0, a: 0, steps: 3 }, { lab: true, nums: false, zoom: 1.6 }), '5度（完全協和）', '4度（不協和）') },
        MEMO('協和の 覚え方', '1・5・8 と 3・6。', [['完全協和 ＝ 1・5・8度', '最初と 最後に 使う 音程'], ['不完全協和 ＝ 3・6度', '途中で いちばん よく 使う'], ['不協和 ＝ 2・4・7度', '2 声では 4度も 不協和']])
      ],
      sum: ['完全協和：1・5・8度、不完全協和：3・6度', '不協和：2・4・7度（と 増4度・減5度）。2 声では 4度も 不協和', '第1類は すべての 音程を 協和音程に する'],
      types: ['conRule', 'conClass', 'conName', 'conFind']
    },
    {
      id: 'c03', title: '声部の 動き', en: 'Types of Motion', sym: '⇄', goal: '4 つの 動きと 連続5度・8度が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '2 つの 声の 動きは 4 種類', b: '<b>平行</b>（同じ向き・同じ音程）、<b>同進行</b>（同じ向き・音程は かわる）、<b>反進行</b>（反対向き）、<b>斜進行</b>（片方だけ 動く）。', fig: { col: [row2(motFig(mo('par'), { zoom: 1.9 }), motFig(mo('sim'), { zoom: 1.9 }), '平行', '同進行'), row2(motFig(mo('con'), { zoom: 1.9 }), motFig(mo('obl'), { zoom: 1.9 }), '反進行', '斜進行')] } },
        { k: 'ポイント 1', h: '連続5度・連続8度は 禁止', b: '<b>同じ向き</b> に 動いて <b>5度 → 5度</b>、<b>8度 → 8度</b> に なるのは 禁止。2 声が くっついて ひとつに 聞こえる から。', fig: row2(motFig(badMotion(GK.rng(7), 'p5'), { lab: true, bad: [4], zoom: 1.7 }), motFig(badMotion(GK.rng(9), 'p8'), { lab: true, bad: [4], zoom: 1.7 }), '✕ 連続5度', '✕ 連続8度') },
        { k: 'ポイント 2', h: '隠伏と 安全な 入り方', b: '3度・6度から <b>同じ向き</b> に 5度・8度へ ぶつかるのも さける（<b>隠伏</b>）。完全音程へは <b>反進行</b> で 入る と 安全。', fig: row2(motFig(badMotion(GK.rng(3), 'hid'), { lab: true, bad: [4], zoom: 1.7 }), motFig(badMotion(GK.rng(4), 'ok'), { lab: true, zoom: 1.7 }), '✕ 隠伏5度・8度', '○ 反進行で 5度・8度へ') },
        MEMO('動きの 合言葉', '完全音程へは 反対向きで。', [['平行 ＝ 同じ向き・同じ音程', '3・6度の 平行は 3 回まで OK'], ['反進行が いちばん 独立性が 高い', '斜進行も 安全'], ['5度・8度へ 同じ向きは NG', '連続 と 隠伏']])
      ],
      sum: ['動きは 平行・同進行・反進行・斜進行 の 4 種類', '同じ向きの 5度→5度・8度→8度は 禁止（連続）', '完全音程へは 反進行か 斜進行で 入る'],
      types: ['motDef', 'motName', 'motBad', 'motRule']
    },
    {
      id: 'c04', title: '第1類（1対1）', en: 'First Species', sym: '①', goal: '音符対音符の 対位線を 作って 直せる',
      cards: [
        { k: '✨ ひとことで言うと', h: '第1類は「全音符 対 全音符」', b: '定旋律 1 音に 対位線 1 音。ぜんぶ <b>協和音程</b>。最初と 最後は <b>完全協和</b>、途中は 3度・6度 を 中心に <b>反進行</b> を 多めに。', fig: pf(ex1, { zoom: 2 }) },
        { k: 'ポイント 1', h: '作り方の 手順', b: '① 最初：<b>8度</b>（または 5度・1度） ② 最後：<b>8度か 1度</b> ③ 終止の ひとつ前：<b>導音</b>（6度） ④ その 間：3度・6度 を 中心に、連続5度・8度を さけて 順次進行で。', fig: pf(ex1, { lab: true, zoom: 2 }) },
        { k: 'ポイント 2', h: '下に つける とき', b: '定旋律の <b>下</b> に つける ことも できる。最初は <b>8度か 1度</b>、終止の 直前は <b>3度</b>（下に 導音）。ルールは 上と 同じ。', fig: pf(ex1b, { zoom: 2 }) },
        { k: 'ポイント 3', h: 'ありがちな まちがい', b: '<b>不協和</b>（4度・7度など）、<b>連続5度・8度</b>、<b>大跳躍</b>（6度 以上）。まちがいは 赤く 示される ので、見つけて なおして みよう。', fig: row2(pf(flPar, { lab: false, bad: flPar ? flPar.issues.map(function (x) { return x.t; }) : [], zoom: 1.8 }), pf(flDis, { lab: true, bad: flDis ? flDis.issues.map(function (x) { return x.t; }) : [], zoom: 1.8 }), '✕ 連続5度', '✕ 不協和') },
        MEMO('第1類 チェックリスト', '書き終えたら 確認。', [['はじまり ＝ 完全協和', 'おわり ＝ 1度か 8度'], ['終止の 前 ＝ 導音（6度／3度）', '途中の 1度は NG'], ['連続5度・8度 なし', '跳躍は 5度まで。跳んだら もどる']])
      ],
      sum: ['第1類 ＝ 1対1。ぜんぶ 協和音程', '最初・最後は 完全協和（最後は 1度か 8度）。終止の 前は 導音', '連続5度・8度、大跳躍、同じ音の くりかえしを さける'],
      types: ['cp1Rule', 'cp1End', 'cp1Find', 'cp1Name', 'cp1Fill']
    },
    {
      id: 'c05', title: '第2類（2対1）', en: 'Second Species', sym: '②', goal: '2分音符の 対位線と 経過音の ルールが わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '第2類は「2 分音符 ふたつ」', b: '定旋律 1 音に 対位線 <b>2 音</b>。<b>強拍</b>（1拍め）は 協和。<b>弱拍</b>（3拍め）は 協和、または <b>経過音</b> として 不協和も OK。', fig: pf(ex2, { zoom: 2 }) },
        { k: 'ポイント 1', h: '弱拍の 不協和（経過音）', b: '弱拍の 音が 不協和 でも よい のは、前後が <b>同じ向きの 順次進行</b> の とき だけ。下の 例の 赤い 数字が 不協和の 弱拍。', fig: pf(ex2, { lab: true, zoom: 2 }) },
        { k: 'ポイント 2', h: '強拍 から 強拍 の 禁則', b: '間に 弱拍の 音が あっても、<b>強拍から 強拍</b> へ <b>同じ向き</b> の <b>5度 → 5度・8度 → 8度</b> は 禁止。', fig: pf(fl(2, 'par', 6, true), { lab: true, bad: (fl(2, 'par', 6, true) || { issues: [] }).issues.map(function (x) { return x.t; }), zoom: 2 }) },
        MEMO('第2類 の ポイント', '強拍と 弱拍を 見分ける。', [['強拍 ＝ 協和', '弱拍 ＝ 協和 か 経過音'], ['最後の 小節は 全音符 1 つ', '終止の 前は 導音'], ['強拍 → 強拍 の 連続5度・8度 は NG', '刺繍音は 使えない']])
      ],
      sum: ['第2類 ＝ 2対1。2 分音符 2 つ', '強拍は 協和。弱拍は 協和 か 順次進行の 経過音', '強拍から 強拍への 連続5度・8度は 禁止'],
      types: ['sp2Rule', 'sp2Weak', 'sp2Name', 'sp2Find']
    },
    {
      id: 'c06', title: '第3類・第4類・第5類', en: 'Third to Fifth Species', sym: '③', goal: '4対1・シンコペーション・華麗対位法が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '3 つの 発展', b: '<b>第3類</b>：4分音符 4 つ。<b>第4類</b>：タイで つなぐ <b>シンコペーション</b>。<b>第5類</b>：ぜんぶ ミックスした <b>華麗対位法</b>。', fig: pf(ex3, { lab: false, zoom: 2 }) },
        { k: 'ポイント 1', h: '第3類（4対1）', b: '4分音符 4 つ。<b>1拍め・3拍め</b> は 協和、<b>2拍め・4拍め</b> は 順次進行の 経過音 なら 不協和も OK。最後の 小節は 全音符。', fig: pf(ex3, { lab: true, zoom: 2 }) },
        { k: 'ポイント 2', h: '第4類（シンコペーション）', b: '対位線が <b>小節線を またいで</b> タイで つながる。小節の 頭で 定旋律と ぶつかって <b>不協和</b> に なる ことが ある（<b>掛留</b>）。その 音は <b>2度 下行</b> して 解決する。', fig: pf(ex4, { lab: true, zoom: 2 }) },
        { k: 'ポイント 3', h: '掛留の 組み合わせ', b: '対位線を 上に つける とき：<b>7度 → 6度</b>・<b>4度 → 3度</b>・<b>9度 → 8度</b>。下に つける とき：<b>2度 → 3度</b>。数字の 組み合わせで 覚えよう。', fig: { html: table(['対位線の 位置', '掛留の 音程'], [['上', '7 → 6 ・ 4 → 3 ・ 9 → 8'], ['下', '2 → 3 ・ 4 → 5 ・ 9 → 10']], { fs: 15, mw: 420 }) } },
        MEMO('第3〜5類の まとめ', 'ルールは 少しずつ ふえる。', [['第3類 ＝ 4対1', '1拍め・3拍め ＝ 協和'], ['第4類 ＝ タイで 掛留', '不協和は 2度 下行で 解決'], ['第5類 ＝ ミックス', '旋律らしさ を 大切に']])
      ],
      sum: ['第3類：4分音符 4 つ。1・3拍めは 協和、2・4拍めは 経過音 OK', '第4類：シンコペーション。不協和の 掛留は 2度 下行で 解決（7→6・4→3・9→8・2→3）', '第5類：ぜんぶを まぜた 華麗対位法'],
      types: ['spName', 'sp3Rule', 'suspRule', 'suspFig', 'sp5Rule']
    }
  ];

  /* =================== 登録 =================== */
  GK.CPDEF.forEach(function (u, i) { u.grp = 'cp'; u.no = 'C' + (i + 1); GK.CPUNITS.push(u); GK.UNIT[u.id] = u; });
  Object.assign(GK.TYPE_NAME, {
    cfRule: '対位法の 基本', cfEnd: '定旋律の 終わり', cfFlaw: '旋律の まちがい', conClass: '協和・不協和', conRule: '音程の 種類', conName: '音程の 度数', conFind: '不協和を 見つける',
    motName: '声部の 動き', motDef: '動きの 名前', motBad: '連続・隠伏', motRule: '動きの 決まり', cp1Rule: '第1類の 決まり', cp1End: '終止の 直前', cp1Find: 'まちがいの 小節', cp1Name: 'まちがいの 名前', cp1Fill: '穴うめ（第1類）',
    sp2Rule: '第2類の 決まり', sp2Weak: '弱拍の 不協和', sp2Name: '第2類の まちがい', sp2Find: '第2類の 小節', spName: '第何類', sp3Rule: '第3類の 決まり', suspRule: '掛留の 決まり', suspFig: '掛留の 不協和', sp5Rule: '第5類'
  });
  GK.Q.addTips({
    '2 つの メロディーを 独立に 重ねる。定旋律は 主音で はじまり「上主音 → 主音」で おわる': 'cfRule,cfEnd,cfFlaw',
    '完全協和：1・5・8度、不完全協和：3・6度、不協和：2・4・7度（2 声の 4度も 不協和）': 'conClass,conRule,conName,conFind',
    '5度・8度へは 反進行で。同じ向きの 5度→5度・8度→8度は 禁止': 'motName,motDef,motBad,motRule',
    '第1類：最初と 最後は 完全協和、終止の 前は 導音。連続5度・8度に 注意': 'cp1Rule,cp1End,cp1Find,cp1Name,cp1Fill',
    '第2類：強拍は 協和。弱拍は 順次進行の 経過音 なら 不協和 OK': 'sp2Rule,sp2Weak,sp2Name,sp2Find',
    '第3類：1・3拍めは 協和。第4類：掛留の 不協和は 2度 下行で 解決': 'spName,sp3Rule,suspRule,suspFig,sp5Rule'
  });

  /* =================== 対位法エディタ（第1類を 自分で 書く） =================== */
  var S = GK.store.get('cplab', { above: true, lv: 1 });
  function newTask() {
    var R = GK.rng(Math.floor(Math.random() * 1e9)), pools = CP.CFS.filter(function (p) { return S.lv === 1 ? p.length <= 7 : S.lv === 2 ? p.length <= 9 : true; }), b = null;
    for (var t = 0; t < 40 && !b; t++) {
      var key = rkey(R), pool = pick(pools, R), cf = CP.place(key, pool, S.above), model = CP.gen(key, cf, S.above, 1, R);
      if (model) b = { key: key, cf: cf, model: model };
    }
    b.cp = b.cf.map(function (c) { return { n: c + (S.above ? 2 : -2), b: 4 }; });
    b.show = false; b.done = false; S.t = b;
  }
  GK.route(/^cplab$/, function () {
    GK.view.innerHTML = '<div class="split"><aside class="panel side"><h3>🎶 対位法ラボ</h3>' +
      '<p class="note" style="padding:6px 10px">定旋律に 第1類（1対1）の 対位線を つけよう。<br>① 上か 下か えらぶ ② 五線を タップして 音を 入れる（‹ › でも OK）③ ルール違反が 自動で 表示されます。</p>' +
      '<button type="button" class="it" data-go="#home/cp"><b>◀ 対位法に もどる</b><small>授業・演習・テスト</small></button></aside><section class="panel main"><div class="mbody" id="cpbody"></div></section></div>';
    GK.cpLab($('#cpbody'));
  });
  GK.route(/^tools\/cplab$/, function () { GK.go('#cplab'); });
  GK.cpLab = function (body) {
    if (!S.t) newTask();
    body.innerHTML = '<div class="toolw hl"><div class="ctl"><div class="seg"><button type="button" data-ca="1" aria-pressed="' + S.above + '">上に つける</button><button type="button" data-ca="0" aria-pressed="' + !S.above + '">下に つける</button></div>' +
      '<div class="seg"><button type="button" data-cl="1" aria-pressed="' + (S.lv === 1) + '">みじかい</button><button type="button" data-cl="2" aria-pressed="' + (S.lv === 2) + '">ふつう</button><button type="button" data-cl="3" aria-pressed="' + (S.lv === 3) + '">ながい</button></div>' +
      '<button type="button" class="btn sm" id="cNew">🎲 新しい課題</button><button type="button" class="btn sm" id="cPlay">🔊 聴く</button><button type="button" class="btn sm" id="cModel">📖 お手本</button></div>' +
      '<div class="out" id="cInfo"></div><div class="hmain hcol"><div class="hleft"><div class="fig sc hstaff" id="cStaff" style="min-height:200px"></div></div><div class="hright"><div class="hgrid" id="cGrid"></div><div class="hres" id="cRes"></div></div></div></div>';
    body.onclick = function (e) {
      var b = e.target.closest('[data-ca],[data-cl],#cNew,#cPlay,#cModel,[data-cc]'); if (!b) return;
      if (b.dataset.ca) { S.above = b.dataset.ca === '1'; newTask(); }
      else if (b.dataset.cl) { S.lv = +b.dataset.cl; newTask(); }
      else if (b.id === 'cNew') newTask();
      else if (b.id === 'cPlay') { var t = S.t; GK.M.play(CP.playOf({ key: t.key, cf: t.cf, cp: t.show ? t.model : t.cp, above: S.above }).map(function (x) { return [x[0], x[1]]; }), 100); return; }
      else if (b.id === 'cModel') S.t.show = !S.t.show;
      else if (b.dataset.cc) {
        if (S.t.show) return;
        var a = b.dataset.cc.split(','), i = +a[0], d = +a[1], c = S.t.cf[i], lo = S.above ? c : c - 9, hi = S.above ? c + 9 : c;
        S.t.cp[i].n = Math.max(lo, Math.min(hi, S.t.cp[i].n + d)); GK.M.play([[M.str(CP.pit(S.t.key, S.t.cp[i].n)), 0.8]], 100);
      }
      GK.store.set('cplab', { above: S.above, lv: S.lv });
      if (b.dataset.ca || b.dataset.cl) GK.cpLab(body); else draw();
    };
    var geo = null;
    // 五線を タップして 音を 書く
    $('#cStaff', body).addEventListener('click', function (e) {
      if (!geo || S.t.show) return;
      var t = S.t, pt = M.svgPt(geo.svg, e), i = 0, bd = 1e9;
      t.cf.forEach(function (_, q) { var x = geo.xAt[q * 4]; if (x != null && Math.abs(x - pt.x) < bd) { bd = Math.abs(x - pt.x); i = q; } });
      var treble = S.above, dn = M.yToDiatonic(pt.y, treble ? geo.y1 : geo.y2, treble ? 'treble' : 'bass'), p0 = CP.pit(t.key, 0), n = M.diatonicOf(dn) - M.diatonicOf(p0), c = t.cf[i];
      n = Math.max(S.above ? c : c - 9, Math.min(S.above ? c + 9 : c, n));
      t.cp[i].n = n; t.done = false; GK.M.play([[M.str(CP.pit(t.key, n)), 0.8]], 100); draw();
    });
    draw();
    function draw() {
      var t = S.t, cp = t.show ? t.model : t.cp, iss = CP.check({ key: t.key, cf: t.cf, cp: cp, above: S.above, sp: 1 });
      $('#cInfo', body).innerHTML = '<b>' + esc(kname(t.key)) + '</b><span>第1類（1対1）</span><span>定旋律に 対位線を ' + (S.above ? '上' : '下') + 'へ 書こう</span>' + (t.show ? '<span class="note">📖 お手本を 表示中</span>' : '');
      geo = M.cpfig($('#cStaff', body), { key: t.key, cf: t.cf, cp: cp, above: S.above, bad: iss.map(function (x) { return x.t; }), zoom: 2.4 });
      var g = '<i></i>' + t.cf.map(function (_, i) { return '<b class="hh">' + (i + 1) + '</b>'; }).join('') + '<b class="hv" style="color:' + BLUE + '">対位線</b>';
      cp.forEach(function (x, i) {
        var bad = iss.some(function (z) { return z.bar === i; }), c = t.cf[i], st = Math.abs(x.n - c);
        g += '<div class="hc' + (t.show ? ' fx' : '') + (bad ? ' err' : '') + '" style="--vc:' + BLUE + '">' + (t.show ? '' : '<button type="button" data-cc="' + i + ',-1" aria-label="下げる">‹</button>') + '<span><em>' + CP.name(t.key, x.n) + '</em><small>' + CP.degName(st) + '</small></span>' + (t.show ? '' : '<button type="button" data-cc="' + i + ',1" aria-label="上げる">›</button>') + '</div>';
      });
      var gr = $('#cGrid', body); gr.style.setProperty('--n', t.cf.length); gr.innerHTML = g;
      var res = '';
      if (t.show) res = '<div class="hok">📖 お手本：最初と 最後は 完全協和、終止の 前は 導音、ほとんどが 3度・6度。</div>';
      else if (!iss.length) { res = '<div class="hok">🎉 かんぺき！ ルール違反は ありません</div>'; if (!t.done) { t.done = true; GK.earn(15); GK.fx('fanfare'); GK.confetti && GK.confetti(30); } }
      else res = '<div class="hng">✕ まちがい ' + iss.length + ' 個</div>' + iss.map(function (x) { return '<p class="hi ng"><b>✕ ' + (x.bar + 1) + ' 小節め</b>　' + esc(x.msg) + '</p>'; }).join('');
      $('#cRes', body).innerHTML = res;
      $('#cModel', body).textContent = t.show ? '✏️ 自分のに もどる' : '📖 お手本';
    }
  };
})();
