/* =========================================================
   楽典ラボ：3 声の 対位法（第1類）── C11
   ・定旋律は バス（全音符）。上に 2 声（中声・上声）を つける。長調だけ
   ・音の 表し方は 2 声と 同じ（音階の 何番目か）
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, CP = GK.CP, U = GK.Q.util, L = GK.L;
  var mc = U.mc, tx = U.tx, pick = U.pick, add = U.add, MEMO = L.MEMO, table = L.table;
  var T3 = CP.T3 = {};
  var mid = function (key, n) { return CP.mid(key, n); };
  var semi = function (key, a, b) { return ((mid(key, b) - mid(key, a)) % 12 + 12) % 12; };
  var dg = function (n) { return ((n % 7) + 7) % 7; };
  var VN = ['バス', '中声', '上声'];
  // 度数を 単音程に（10度 → 3度、12度 → 5度。8度・15度は 8度）
  var simp = function (d) { return d <= 8 ? d : (d - 1) % 7 === 0 ? 8 : (d - 1) % 7 + 1; };
  var sd = function (steps) { return simp(CP.deg(steps)); };

  /* ---------- 判定 ----------
     v = [バス（定旋律）, 中声, 上声]（それぞれ 音の 配列。null は まだ）
     返す：[{ k, i（小節）, msg }] */
  T3.check = function (key, v, partial) {
    var b = v[0], m = v[1], t = v[2], Ln = b.length, r = [];
    var add1 = function (k, i, msg) { r.push({ k: k, i: i, msg: msg }); };
    var n = 0; while (n < Ln && m[n] != null && t[n] != null) n++;
    for (var i = 0; i < n; i++) {
      var sm = semi(key, b[i], m[i]), st = semi(key, b[i], t[i]), mt = semi(key, m[i], t[i]);
      if (!(b[i] < m[i] && m[i] < t[i])) add1('cross', i, '声部が 重なる・交差している（下から バス・中声・上声の 順に）');
      if (t[i] - m[i] > 7) add1('spc', i, '上の 2 声が 8度より はなれている');
      [[sm, m[i]], [st, t[i]]].forEach(function (z, j) { if (CP.cls(z[0]) === 'D') add1('dis', i, (j ? '上声' : '中声') + 'が バスと ' + sd(z[1] - b[i]) + '度（不協和）'); });
      if ([1, 2, 10, 11].indexOf(mt) >= 0)   // 上の 2 声の 4度・増4度・減5度は、どちらも バスと 協和なら 使える（シ・ファ など）
        add1('dis', i, '上の 2 声が ' + sd(t[i] - m[i]) + '度で ぶつかる（不協和）');
      if (i > 0 && i < Ln - 1 && CP.cls(sm) !== 'I' && CP.cls(st) !== 'I') add1('empty', i, '和音が からっぽ（5度・8度だけ）。3度か 6度を 入れる');
      if (i === 0 && (dg(m[i]) % 2 || dg(t[i]) % 2 || dg(m[i]) === 6 || dg(t[i]) === 6)) add1('start', i, '最初の 和音は 主和音（ド・ミ・ソ）で');
      if (i === Ln - 1 && !partial) {
        if ([0, 2].indexOf(dg(m[i])) < 0 || [0, 2].indexOf(dg(t[i])) < 0 || (dg(m[i]) !== 0 && dg(t[i]) !== 0) || (dg(m[i]) !== 2 && dg(t[i]) !== 2)) add1('end', i, '最後の 和音は 主音と 第3音（ド・ミ）で');
      }
      if (i === Ln - 2 && dg(m[i]) !== 6 && dg(t[i]) !== 6) add1('penult', i, '終止の 前の 和音に 導音を 入れる');
      if (i > 0) {
        // 連続5度・8度（どの 2 声の 間でも）
        var V2 = [[0, 1], [0, 2], [1, 2]];
        V2.forEach(function (pr) {
          var a0 = v[pr[0]][i - 1], a1 = v[pr[0]][i], c0 = v[pr[1]][i - 1], c1 = v[pr[1]][i], s0 = semi(key, a0, c0), s1 = semi(key, a1, c1), da = a1 - a0, dc = c1 - c0;
          if (da && dc && (da > 0) === (dc > 0) && (s0 === 0 || s0 === 7) && s0 === s1) add1('par', i, VN[pr[0]] + 'と ' + VN[pr[1]] + 'が 連続' + (s1 === 7 ? '5度' : '8度'));
        });
        // 外声（バスと 上声）の 隠伏：同じ向きで 完全音程へ、上声が 跳躍
        var db = b[i] - b[i - 1], dt = t[i] - t[i - 1];
        if (db && dt && (db > 0) === (dt > 0) && (st === 0 || st === 7) && semi(key, b[i - 1], t[i - 1]) !== st && Math.abs(dt) > 1) add1('hid', i, '外声（バスと 上声）の 隠伏' + (st === 7 ? '5度' : '8度') + '（上声が 跳躍して 完全音程へ）');
        // 旋律
        [1, 2].forEach(function (k) {
          var d = v[k][i] - v[k][i - 1], ad = Math.abs(d);
          if (ad > 4 && ad !== 7) add1('leap', i, VN[k] + 'が ' + CP.degName(d) + 'の 大きな 跳躍');
          else if (Math.abs(mid(key, v[k][i]) - mid(key, v[k][i - 1])) === 6) add1('tri', i, VN[k] + 'が 増4度・減5度の 跳躍');
          if (d === 0 && k === 2) add1('rep', i, '上声が 同じ音の くりかえし');
          if (i >= 2) { var d0 = v[k][i - 1] - v[k][i - 2]; if (Math.abs(d0) >= 3 && !(Math.abs(d) === 1 && d * d0 < 0)) add1('leapRec', i, VN[k] + '：跳躍の あとは 反対向きの 2度で もどる'); }
          if (i === Ln - 1 && dg(v[k][i - 1]) === 6 && d !== 1) add1('lt', i, VN[k] + 'の 導音は 主音へ 2度 上がる');
        });
      }
    }
    return r;
  };

  /* ---------- お手本づくり ---------- */
  T3.gen = function (key, cf, R) {
    var Ln = cf.length, m = cf.map(function () { return null; }), t = m.slice(), v = [cf, m, t], budget = 9000;
    function go(i) {
      if (budget-- < 0) return false;
      if (i === Ln) return T3.check(key, v).length === 0;
      var cs = [];
      for (var a = cf[i] + 2; a <= cf[i] + 11; a++) for (var c = a + 2; c <= a + 7 && c <= cf[i] + 14; c++) cs.push([a, c, R()]);
      if (i > 0) cs.forEach(function (z) { z[2] = Math.abs(z[0] - m[i - 1]) + Math.abs(z[1] - t[i - 1]) * 1.3 + R() * 3; });
      cs.sort(function (x, y) { return x[2] - y[2]; });
      for (var q = 0; q < cs.length; q++) {
        m[i] = cs[q][0]; t[i] = cs[q][1];
        if (T3.check(key, v, true).length === 0 && go(i + 1)) return true;
        m[i] = null; t[i] = null;
      }
      return false;
    }
    return go(0) ? { m: m.slice(), t: t.slice() } : null;
  };
  T3.build = function (R, o) {
    o = o || {};
    for (var tr = 0; tr < 40; tr++) {
      var key = o.key != null ? o.key : pick([0, 1, -1, 2, -2], R), pool = o.pool || pick(CP.CFS.filter(function (p) { return p.length <= (o.maxLen || 11); }), R), cf = CP.place(key, pool, true);
      if (CP.mid(key, cf[0]) > 52) cf = cf.map(function (n) { return n - 7; });
      var g = T3.gen(key, cf, R); if (g) return { key: key, v: [cf, g.m, g.t] };
    }
    return null;
  };

  /* ---------- 楽譜（大譜表・全音符の 和音） ---------- */
  T3.fig = function (b, o) {
    o = o || {}; var key = b.key, Ln = b.v[0].length;
    var notes = []; for (var i = 0; i < Ln; i++) {
      var ks = [0, 1, 2].map(function (k) { return b.v[k][i]; });
      var col = (o.bad || []).indexOf(i) >= 0 ? '#d3302a' : (o.mark || []).indexOf(i) >= 0 ? '#2d6fb0' : null;
      notes.push({ k: ks.map(function (n) { return M.str(CP.pit(key, n)); }), d: 'w', c: col, lab: o.lab === false ? '' : sd(ks[2] - ks[0]) + '・' + sd(ks[1] - ks[0]) });
    }
    return { score: { clef: 'grand', key: key, bars: notes.map(function (n) { return [n]; }), end: 'end', sp: 44, minBar: 64, zoom: o.zoom || 1.6, wrap: Ln > 6 ? Math.ceil(Ln / 2) : 0 }, play: notes.map(function (n) { return [n.k, 2]; }), bpm: 80, cap: o.cap };
  };

  /* =================== 問題 =================== */
  var textMc = function (R, right, wrongs) { return mc(R, tx(right), wrongs.filter(function (w, i, a) { return w !== right && a.indexOf(w) === i; }).map(function (w) { return tx(w); }), 4); };
  var KN3 = { par: '連続5度・8度', dis: '不協和音程', empty: '和音が からっぽ', cross: '声部の 交差・重なり', hid: '外声の 隠伏', leap: '大きすぎる 跳躍' };
  add('t3Fact', 'c11', 1, function (R) {
    var x = pick([
      ['3 声の 対位法で、バスと 上の 声の 4度は？', '不協和（使えない）', ['協和（使える）', '完全協和（使える）', '不完全協和（使える）'], 'バスとの 4度は 2 声と 同じく <b>不協和</b>。'],
      ['3 声の 対位法で、上の 2 声どうしの 4度は？', '使える（バスと 協和して いれば）', ['使えない（いつも 不協和）', '強拍だけ 使える（弱拍は 不可）', '最後の 和音だけ 使える'], 'バスが 下で 支えて いれば、上の 2 声の 間の <b>4度は 使える</b>（例：ド・ソ・ド の ソ‐ド）。'],
      ['バスが レ、上の 2 声が シ（下）と ファ（上）。シ‐ファ（減5度）は？', '使える（どちらも バスと 協和）', ['使えない（不協和）', '上下を 入れかえれば 使える', '最後の 和音でだけ 使える'], 'シは バスから 6度、ファは 3度で どちらも 協和。上の 2 声の <b>減5度・増4度は 使える</b>（終止の 定番）。'],
      ['3 声で 途中の 和音に 入れたい 音程は？', '3度か 6度', ['5度と 8度だけ', '2度か 7度', '4度か 5度'], '5度と 8度だけでは からっぽ。<b>3度か 6度</b>を 入れて 豊かな 和音に。'],
      ['連続5度・8度が 禁止なのは どの 声部の 間？', 'どの 2 声の 間でも', ['外声（バスと 上声）だけ', '上の 2 声だけ', 'バスと 中声だけ'], '3 声の どの 組み合わせでも <b>連続5度・8度は 禁止</b>。'],
      ['上の 2 声（中声と 上声）の 間かくは？', '8度 以内', ['10度 以上', 'いつも 3度', '12度 以内'], '上の 2 声は <b>8度 以内</b>に。はなれすぎると 響きが うすくなる。'],
      ['バスが レ → ド で おわる とき、上の 2 声の 定番は？', 'シ → ド と ファ → ミ', ['ソ → ド と レ → ド', 'ラ → ソ と ド → ド', 'ミ → レ と ソ → ソ'], '導音（シ）は 主音へ、ファは ミへ。<b>Ⅶ₆ → Ⅰ</b> の 形（最後は ド・ミ・ド）。'],
      ['3 声の 最後の 和音は？', '主音と 第3音（ド・ミ・ド など）', ['属音と 導音（ソ・シ・レ など）', '主音と 第5音だけ（ド・ソ・ド など）', '下属音の 和音（ファ・ラ・ド など）'], '最後は 主音と <b>第3音</b>で 明るく おわる（5度は なくて よい）。'],
      ['外声（バスと 上声）で とくに 注意する ことは？', '同じ向きで 完全音程へ 跳躍しない（隠伏）', ['反進行を さける（同じ向きに そろえる）', '3度を さける（完全音程を 多く する）', '同じ音を 続ける（動きを 少なく する）'], '外声は いちばん よく 聞こえるので、<b>隠伏5度・8度</b>に 注意。']
    ], R), m = textMc(R, x[1], x[2].concat([x[1]]));
    return { q: x[0], ch: m.ch, a: m.a, ex: x[3] };
  });
  add('t3Iv', 'c11', 2, function (R) {
    var b = T3.build(R, { maxLen: 9 }), Ln = b.v[0].length, i = 1 + Math.floor(R() * (Ln - 2));
    var dd = function (k) { return sd(b.v[k][i] - b.v[0][i]); }, right = dd(2) + '度と ' + dd(1) + '度';
    var wr = [[dd(2), dd(1) + 1], [dd(2) + 1, dd(1)], [dd(2) - 1, dd(1) - 1], [dd(1), dd(2)], [dd(2) + 2, dd(1)]].map(function (z) { return z[0] + '度と ' + z[1] + '度'; });
    var m = textMc(R, right, wr);
    return { q: '青い 和音。上声と 中声は バスから それぞれ 何度？（上声・中声の 順。8度より 広い ときは 単音程で）', fig: T3.fig(b, { mark: [i], lab: false }), ch: m.ch, a: m.a, ex: '上声は バスから <b>' + dd(2) + '度</b>、中声は <b>' + dd(1) + '度</b>。' + (CP.cls(semi(b.key, b.v[0][i], b.v[1][i])) === 'I' || CP.cls(semi(b.key, b.v[0][i], b.v[2][i])) === 'I' ? '3度・6度が 入って 豊かな 和音。' : ''), exFig: T3.fig(b, { mark: [i] }) };
  });
  add('t3Err', 'c11', 2, function (R) {
    for (var tr = 0; tr < 200; tr++) {
      var b = T3.build(R, { maxLen: 9 }); if (!b) continue;
      var Ln = b.v[0].length, i = 1 + Math.floor(R() * (Ln - 3)), k = 1 + Math.floor(R() * 2), d = pick([-3, -2, -1, 1, 2, 3], R);
      var v = b.v.map(function (a) { return a.slice(); }); v[k][i] += d;
      var is = T3.check(b.key, v), ks = {}; is.forEach(function (z) { ks[z.k] = 1; }); var kk = Object.keys(ks);
      if (kk.length !== 1 || !KN3[kk[0]] || is.some(function (z) { return z.i !== i && z.i !== i + 1; })) continue;
      var bad = is.map(function (z) { return z.i; }), right = KN3[kk[0]], m = textMc(R, right, Object.keys(KN3).map(function (x) { return KN3[x]; }));
      var bb = { key: b.key, v: v };
      return { q: 'この 3 声の 対位法には まちがいが 1 種類 ある。どれ？（赤い 和音に 注目）', fig: T3.fig(bb, { bad: bad, lab: false }), ch: m.ch, a: m.a, ex: '<b>' + right + '</b>：' + is[0].msg + '。', exFig: T3.fig(bb, { bad: bad }) };
    }
    throw new Error('t3Err');
  });

  /* =================== 授業 =================== */
  var ex = null, exEnd = null;
  // 譜例：終止が「シ→ド・ファ→ミ」の 定番に なっている もの
  for (var s = 1; s < 200 && !ex; s++) { var e = T3.build(GK.rng(s), { key: 0, pool: CP.CFS[5] }); if (e) { var P = e.v[0].length - 2; if ([e.v[1][P], e.v[2][P]].some(function (n) { return dg(n) === 3; })) ex = e; } }
  if (ex) exEnd = { key: ex.key, v: ex.v.map(function (a) { return a.slice(-2); }) };
  var pf = function (b, o) { return b ? T3.fig(b, o) : { html: '' }; };
  var u = {
    id: 'c11', title: '3声の 対位法', en: 'Three-Voice Counterpoint', sym: '③', goal: '3 声（第1類）で 和音の 響きと 声部の 動きを 両立 できる', lv: 'adv',
    cards: [
      { k: '✨ ひとことで言うと', h: '3 つの 声 ＝ 和音が 生まれる', b: '定旋律（ここでは <b>バス</b>）に、<b>中声</b>と <b>上声</b>の 2 声を つける。3 つの 音が 重なるので、旋律の きまりに 加えて <b>和音の 響き</b>も 考える。楽譜の 下の 数字は バスから 見た「上声・中声」の 音程（10度は 3度の ように 単音程で）。', fig: pf(ex) },
      { k: 'ポイント 1', h: '縦の 音程', b: 'バスとの 音程は 2 声と 同じく <b>協和だけ</b>（バスとの 4度は 不協和）。ただし <b>上の 2 声どうしの 4度</b>（と 増4度・減5度）は、どちらも バスと 協和して いれば <b>使える</b>。途中の 和音には <b>3度か 6度</b>を 入れて、5度・8度だけの からっぽな 和音を さける。', fig: { html: table(['音程', 'バスと', '上の 2 声どうし'], [['5・8度', '○（完全協和）', '○'], ['3・6度', '◎（豊かに なる）', '○'], ['4度', '✕（不協和）', '○（使える）'], ['増4度・減5度', '✕', '○（シ・ファ など）'], ['2・7度', '✕', '✕']], { fs: 15, mw: 460 }) } },
      { k: 'ポイント 2', h: '3 声の 動き', b: '<b>連続5度・8度は どの 2 声の 間でも 禁止</b>（バス‐中声・バス‐上声・中声‐上声）。いちばん よく 聞こえる <b>外声</b>（バスと 上声）は、同じ向きで 完全音程へ 跳躍する <b>隠伏</b>にも 注意。上の 2 声は <b>8度 以内</b>。声部は いつも 下から <b>バス・中声・上声</b>の 順に して、<b>同じ 音に 重ねたり</b>（ユニゾン）<b>入れかわったり</b>（交差）しない。旋律の きまり（6度 以上・7度の 跳躍は ✕、跳躍の あとは 反対向きに もどる）は 2 声と 同じ。' },
      { k: 'ポイント 3', h: 'はじまりと 終わり', b: '最初の 和音は <b>主和音</b>。バスが レ → ド で おわる ときは、上の 2 声を <b>シ → ド</b>（導音 → 主音）と <b>ファ → ミ</b> に して、最後は <b>ド・ミ・ド</b>（主音と 第3音）。和声で いう <b>Ⅶ₆ → Ⅰ</b> の 形。', fig: pf(exEnd, { zoom: 1.4 }) },
      MEMO('3 声の 合言葉', '旋律も 和音も。', [['バスとの 4度は ✕', '上の 2 声の 4度は ○'], ['途中は 3度か 6度を 入れる', 'からっぽ（5・8度だけ）は さける'], ['連続5度・8度は どの 2 声でも ✕', '最後は ド・ミ・ド']])
    ],
    sum: ['3 声 ＝ 定旋律＋2 声。旋律の きまり＋和音の 響き', 'バスとの 4度は 不協和、上の 2 声どうしの 4度（増4度・減5度も）は 使える。途中は 3度か 6度を 入れる', '連続5度・8度は どの 2 声の 間でも 禁止。終止は シ→ド・ファ→ミ（Ⅶ₆→Ⅰ）'],
    types: ['t3Fact', 't3Iv', 't3Err']
  };
  u.grp = 'cp'; u.no = 'C' + (GK.CPUNITS.length + 1); GK.CPUNITS.push(u); GK.UNIT[u.id] = u;
  Object.assign(GK.TYPE_NAME, { t3Fact: '3声の きまり', t3Iv: '3声の 和音の 音程', t3Err: '3声の まちがい' });
  GK.HINTS = Object.assign(GK.HINTS || {}, {
    t3Fact: 'バスとの 関係か、上の 2 声どうしの 関係か を 区別しよう。',
    t3Iv: 'バスの 音を 1 と して、上声と 中声まで それぞれ 数えよう。',
    t3Err: '赤い 和音の 縦の 音程（バスとの 4度？ 3度・6度は ある？）と、前の 和音からの 動き（連続？）を 見よう。'
  });
})();
