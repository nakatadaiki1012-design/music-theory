/* =========================================================
   楽典ラボ：対位法のエンジン（厳格対位法・第1類〜第4類）
   ・音の 表し方：音階の 何番目か（整数）。0 ＝ 主音（4 オクターブ）、7 ＝ ひとつ上の 主音
   ・声部：cf（定旋律・1 小節 ＝ 1 音）と cp（対位線：{ n, b: 拍の長さ, tie, rest }）
   ・species：1 ＝ 1対1、2 ＝ 2対1、3 ＝ 4対1、4 ＝ シンコペーション（掛留）
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, F = GK.F, CP = GK.CP = {};
  var VF = function () { return window.Vex && Vex.Flow; };
  var SC = {};
  var scale = function (key) { return SC[key] || (SC[key] = M.scale(M.keyTonic(key, false), 'major')); };
  CP.pit = function (key, n) { var s = scale(key), q = ((n % 7) + 7) % 7, o = Math.floor(n / 7), p = s[q]; return { l: p.l, a: p.a, o: p.o + o }; };
  CP.mid = function (key, n) { return M.midi(CP.pit(key, n)); };
  CP.name = function (key, n) { return GK.nm(CP.pit(key, n)); };
  CP.KEYS = [0, 1, -1, 2, -2, 3, -3];
  CP.CFS = [[0, 2, 1, 0, 3, 2, 4, 3, 2, 1, 0], [0, 4, 3, 2, 4, 3, 2, 1, 0], [0, 3, 2, 4, 5, 4, 2, 3, 2, 1, 0], [0, 2, 3, 1, 2, 4, 3, 2, 1, 0], [0, 1, 2, 3, 4, 2, 3, 1, 0], [0, 2, 4, 3, 2, 1, 0], [0, 2, 1, 3, 2, 4, 3, 1, 0]];

  /* ---------- 音程の 分類（半音の 数から） ---------- */
  CP.cls = function (semi) { semi = Math.abs(semi) % 12; return semi === 0 || semi === 7 ? 'P' : [3, 4, 8, 9].indexOf(semi) >= 0 ? 'I' : 'D'; }; // P 完全協和／I 不完全協和／D 不協和
  CP.CLS = { P: '完全協和音程', I: '不完全協和音程', D: '不協和音程' };
  CP.deg = function (steps) { return Math.abs(steps) + 1; };           // 音階の 差 → ○度
  CP.degName = function (steps) { return CP.deg(steps) + '度'; };

  /* ---------- 時間軸（拍）の 展開 ---------- */
  function timeline(cp) { var t = 0, r = []; cp.forEach(function (x, i) { r.push({ i: i, t: t, b: x.b, n: x.n, rest: !!x.rest, tie: !!x.tie }); t += x.b; }); return r; }
  CP.timeline = timeline;
  function cfAt(cf, t) { return cf[Math.min(cf.length - 1, Math.floor(t / 4))]; }

  /* ---------- 判定 ----------
     spec = { key, cf, cp, above, sp }  partial：途中まで（終わりの 決まりは 見ない）
     返す： [{ k: 種類, t: 拍, bar: 小節（0 から）, ng: true, msg }] */
  CP.check = function (spec, partial) {
    var key = spec.key, cf = spec.cf, cp = spec.cp, ab = spec.above !== false, sp = spec.sp || 1, tl = timeline(cp), L = cf.length, iss = [];
    var sg = ab ? 1 : -1, mid = function (n) { return CP.mid(key, n); };
    var add = function (k, t, msg) { iss.push({ k: k, t: t, bar: Math.floor(t / 4), ng: true, msg: msg }); };
    var notes = tl.filter(function (x) { return !x.rest; });
    var onset = notes.filter(function (x, j) { return !(j > 0 && notes[j - 1].tie); });         // 発音する 音（つなぎの 後半は 数えない）
    var vert = function (x) { var c = cfAt(cf, x.t); return (x.n - c) * sg; };                    // 上の 声から 見た 何度ぶん（正：対位線が 外側）
    var cons = function (x) { var c = cfAt(cf, x.t); return CP.cls(mid(x.n) - mid(c)); };
    /* 始まり */
    if (onset.length) {
      var f = onset[0], v0 = vert(f);
      if ([0, 4, 7].indexOf(v0) < 0 || (!ab && v0 === 4)) add('start', f.t, '最初は 完全協和音程（1度・8度' + (ab ? '・5度' : '') + '）で はじめる');
    }
    /* 縦の 関係 */
    onset.forEach(function (x, j) {
      var c = cons(x), st = vert(x), strong = sp === 1 ? true : sp === 2 ? x.t % 4 === 0 : sp === 3 ? x.t % 2 === 0 : x.t % 4 === 2 ? true : false;
      if (sp === 4 && x.t % 4 === 0 && j > 0) strong = true;
      if (st < 0) add('cross', x.t, '声部が 交差している（対位線が 定旋律の 反対側に 出た）');
      else if (st === 0 && x !== onset[0] && Math.floor(x.t / 4) !== L - 1) add('uni', x.t, '途中で 同じ音（1度）に なっている（最初と 最後だけ）');
      if (c === 'D') {
        var prev = onset[j - 1], next = onset[j + 1], ok = false;
        if (!strong && prev && next) { var d1 = x.n - prev.n, d2 = next.n - x.n; ok = Math.abs(d1) === 1 && d1 === d2; }  // 弱拍の 経過音
        if (!strong && partial && !next) ok = true;                                                                       // 次の音が まだ 決まっていない
        if (!ok) add('dis', x.t, CP.deg(st) + '度（不協和）が ' + (strong ? '強拍に ある' : '弱拍に あるが 経過音（順次進行）に なっていない'));
      }
    });
    /* 掛留の 不協和（つなぎの 後ろ側が 小節の 頭に 来る） */
    if (sp === 4) {
      tl.forEach(function (x, j) {
        if (x.rest || j === 0 || !tl[j - 1].tie || x.t % 4 !== 0) return;
        if (CP.cls(mid(x.n) - mid(cfAt(cf, x.t))) !== 'D') return;
        var nx = tl[j + 1];
        if (!nx || nx.rest || nx.n !== x.n - 1) add('susp', x.t, '掛留で ぶつかった 音（' + CP.deg(vert(x)) + '度）は 2度 下がって 解決する');
      });
    }
    /* 旋律 */
    for (var j = 1; j < onset.length; j++) {
      var a = onset[j - 1], b = onset[j], dl = b.n - a.n, ad = Math.abs(dl), tm = Math.abs(mid(b.n) - mid(a.n));
      if (dl === 0) add('rep', b.t, '同じ音が くりかえされている');
      else if (ad > 4) add('leap', b.t, CP.deg(dl) + '度の 大きな 跳躍（5度 までに）');
      else if (tm === 6) add('tri', b.t, '増4度・減5度の 跳躍は さける');
      if (ad >= 3 && ad <= 4 && onset[j + 1]) { var d2 = onset[j + 1].n - b.n; if (!(Math.abs(d2) === 1 && d2 * dl < 0)) add('leapRec', onset[j + 1].t, '跳躍の あとは 反対向きの 順次進行で もどる'); }
    }
    /* 声部の 動き：定旋律が 動く 直前と 直後を くらべる */
    var ev = [];       // 各 小節の 先頭と 直前の 縦の 関係
    for (var bar = 1; bar < L; bar++) {
      var t1 = bar * 4, a1 = soundAt(tl, t1 - 0.01), b1 = soundAt(tl, t1);
      if (!a1 || !b1) continue;
      var c0 = cf[bar - 1], c1 = cf[bar], ca = cf[bar] - cf[bar - 1], cpd = b1.n - a1.n;
      var va = (a1.n - c0) * sg, vb = (b1.n - c1) * sg, pa = CP.cls(mid(a1.n) - mid(c0)) === 'P' && vperf(va), pb = CP.cls(mid(b1.n) - mid(c1)) === 'P' && vperf(vb);
      var sim = ca !== 0 && cpd !== 0 && (ca > 0) === (cpd > 0);
      if (sim && pa && pb && (va % 7) === (vb % 7)) add('par', t1, (vb % 7 === 4 ? '連続5度' : '連続8度') + '（同じ向きに 動いて 同じ 完全音程）');
      else if (sim && pb && !pa && sp === 1) add('hid', t1, '隠伏5度・8度（同じ向きに 動いて 完全音程に ぶつかる）');
    }
    if (sp >= 2) for (var bq = 1; bq < L; bq++) {      // 強拍から 強拍への 連続5度・8度
      var s0 = soundAt(tl, (bq - 1) * 4), s1 = soundAt(tl, bq * 4);
      if (!s0 || !s1 || s0.n === s1.n) continue;
      var u0 = (s0.n - cf[bq - 1]) * sg, u1 = (s1.n - cf[bq]) * sg, cd = cf[bq] - cf[bq - 1], pd = s1.n - s0.n;
      if (cd !== 0 && (cd > 0) === (pd > 0) && vperf(u0) && vperf(u1) && u0 % 7 === u1 % 7 && CP.cls(mid(s0.n) - mid(cf[bq - 1])) === 'P' && CP.cls(mid(s1.n) - mid(cf[bq])) === 'P') add('par', bq * 4, '強拍から 強拍へ ' + (u1 % 7 === 4 ? '連続5度' : '連続8度') + '（間に 弱拍の 音が あっても 禁止）');
    }
    /* 終わり */
    if (!partial) {
      var last = notes[notes.length - 1], lv = last ? vert(last) : 0;
      if (!last || Math.floor(last.t / 4) !== L - 1) add('end', (L - 1) * 4, '最後の 小節に 対位線が ない');
      else {
        if (lv !== 0 && lv !== 7) add('end', last.t, '最後は 1度か 8度で おわる');
        var pen = onset[onset.length - 2];
        if (pen && Math.floor(pen.t / 4) === L - 2) { if (pen.n - cf[L - 2] !== (ab ? 5 : -2)) add('penult', pen.t, '終止の 直前は ' + (ab ? '6度（導音）' : '3度（導音）') + 'に する'); }
      }
    }
    return iss;
  };
  function vperf(v) { v = Math.abs(v) % 7; return v === 0 || v === 4; }
  function soundAt(tl, t) { var r = null; tl.forEach(function (x) { if (x.t <= t + 1e-9 && t < x.t + x.b - 1e-9) r = x; }); return r && !r.rest ? r : null; }

  /* ---------- お手本づくり（深さ優先で さがす） ----------
     返す：cp 配列 または null */
  CP.slots = function (L, sp) {
    var s = [], bar;
    if (sp === 1) for (bar = 0; bar < L; bar++) s.push({ b: 4 });
    else if (sp === 2) { for (bar = 0; bar < L - 1; bar++) { s.push({ b: 2 }); s.push({ b: 2 }); } s.push({ b: 4 }); }
    else if (sp === 3) { for (bar = 0; bar < L - 1; bar++) for (var k = 0; k < 4; k++) s.push({ b: 1 }); s.push({ b: 4 }); }
    else {  // 第4類：最初は 2 拍の 休符。つなぎの 音を くりかえし、最後は 全音符
      s.push({ b: 2, rest: true });
      for (bar = 0; bar < L - 2; bar++) { s.push({ b: 2, tie: true, g: bar }); s.push({ b: 2, g: bar, second: true }); }
      s.push({ b: 2, g: L - 2 }); s.push({ b: 4 });
    }
    return s;
  };
  CP.gen = function (key, cf, above, sp, R) {
    var L = cf.length, slots = CP.slots(L, sp), sg = above ? 1 : -1, budget = 14000, out = [];
    var tpos = 0; slots.forEach(function (s) { s.t = tpos; tpos += s.b; });
    var penIdx = -1; slots.forEach(function (s, i) { if (!s.rest && !s.second && s.t < (L - 1) * 4) penIdx = i; });
    var cand = function (s) {
      var c = cfAt(cf, s.t), r = [], lo = above ? 0 : -9, hi = above ? 9 : 0, v;
      if (s.t >= (L - 1) * 4) return above ? [c + 7, c] : [c - 7, c];                // おわり：8度（1度）
      for (v = lo; v <= hi; v++) r.push(c + v);
      return r;
    };
    function shuf(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function go(i) {
      if (budget-- < 0) return false;
      if (i === slots.length) return CP.check({ key: key, cf: cf, cp: out, above: above, sp: sp }).length === 0;
      var s = slots[i];
      if (s.rest) { out.push({ b: s.b, rest: true }); if (go(i + 1)) return true; out.pop(); return false; }
      if (s.second) { var pv = out[out.length - 1]; out.push({ b: s.b, n: pv.n }); if (go(i + 1)) return true; out.pop(); return false; }
      var cs = shuf(cand(s));
      // 終止の 直前は 導音
      if (i === penIdx) cs = cs.filter(function (n) { return n - cfAt(cf, s.t) === (above ? 5 : -2); });
      for (var q = 0; q < cs.length; q++) {
        var o = { b: s.b, n: cs[q] }; if (s.tie) o.tie = true;
        out.push(o);
        if (CP.check({ key: key, cf: cf, cp: out, above: above, sp: sp }, true).length === 0 && go(i + 1)) return true;
        out.pop();
      }
      return false;
    }
    return go(0) ? out.map(function (x) { return Object.assign({}, x); }) : null;
  };

  /* ---------- まちがい入りの 例 ----------
     kind：dis（不協和）／par（連続5度・8度）／leap（大跳躍）／cross（交差）／rep（同音）／leapRec／end／penult／uni／susp */
  CP.flawed = function (key, cf, above, sp, kind, R) {
    var good = CP.gen(key, cf, above, sp, R); if (!good) return null;
    var idx = []; good.forEach(function (x, i) { if (!x.rest && !x.second) idx.push(i); });
    for (var t = 0; t < 160; t++) {
      var cp = good.map(function (x) { return Object.assign({}, x); }), i = idx[Math.floor(R() * idx.length)], d = [-3, -2, -1, 1, 2, 3, 4][Math.floor(R() * 7)];
      cp[i].n += d; if (cp[i].tie && cp[i + 1] && cp[i + 1].n !== undefined) cp[i + 1].n += d;
      var is = CP.check({ key: key, cf: cf, cp: cp, above: above, sp: sp }), ks = {}; is.forEach(function (x) { ks[x.k] = 1; });
      if (is.length && Object.keys(ks).length === 1 && ks[kind] && is.length <= 2) return { cp: cp, issues: is, good: good };
    }
    return null;
  };

  /* ---------- 定旋律（1 声）の 判定 ---------- */
  CP.checkCF = function (key, cf) {
    var r = [], mid = function (n) { return CP.mid(key, n); }, mx = Math.max.apply(null, cf), cnt = cf.filter(function (x) { return x === mx; }).length;
    if (cf[0] !== 0) r.push({ k: 'start', i: 0, msg: '最初は 主音' });
    if (cf[cf.length - 1] !== 0 || cf[cf.length - 2] !== 1) r.push({ k: 'end', i: cf.length - 1, msg: '終わりは「2度 → 主音」' });
    for (var i = 1; i < cf.length; i++) {
      var d = cf[i] - cf[i - 1], ad = Math.abs(d);
      if (d === 0) r.push({ k: 'rep', i: i, msg: '同じ音の くりかえし' });
      else if (ad > 4) r.push({ k: 'leap', i: i, msg: '6度以上の 跳躍' });
      else if (Math.abs(mid(cf[i]) - mid(cf[i - 1])) === 6) r.push({ k: 'tri', i: i, msg: '増4度・減5度の 跳躍' });
      if (ad >= 3 && ad <= 4 && i + 1 < cf.length) { var d2 = cf[i + 1] - cf[i]; if (!(Math.abs(d2) === 1 && d2 * d < 0)) r.push({ k: 'leapRec', i: i + 1, msg: '跳躍の あとの 反対向き 順次進行が ない' }); }
    }
    if (cnt > 1) cf.forEach(function (x, i) { if (x === mx) r.push({ k: 'climax', i: i, msg: '最高音が 2 回 以上' }); });
    return r;
  };

  /* =====================================================
     楽譜の 描画：大譜表に 2 声（上声は 高音部、下声は 低音部）
     spec = { key, cf, cp, above, lab（○度を 書く）, bad: [拍…], q: [cp の 番号（？にする）], zoom, sp, col }
     ===================================================== */
  var DUR = { 4: 'w', 2: 'h', 1: 'q' };
  M.cpfig = function (el, spec) {
    var V = VF(); el.innerHTML = '';
    if (!V) { el.textContent = '（楽譜の部品を読みこめませんでした）'; return null; }
    var key = spec.key || 0, above = spec.above !== false, cf = spec.cf, cp = spec.cp, L = cf.length, tl = timeline(cp), top = 6, gap = 100;
    var cfItems = cf.map(function (n, i) { return { n: n, b: 4, t: i * 4 }; });
    var onsets = {}; cfItems.forEach(function (x) { onsets[x.t] = 1; }); tl.forEach(function (x) { onsets[x.t] = 1; });
    var nOn = Object.keys(onsets).length, sp = spec.sp || (cp.some(function (x) { return x.b < 4; }) ? 30 : 42);
    var probe = new V.Stave(0, 0, 400); probe.addClef('treble'); if (key) probe.addKeySignature(M.keyVF(key, false)); probe.format && probe.format();
    var x0 = 4, first = probe.getNoteStartX(), W = Math.round(x0 + first + nOn * sp + 26), Hh = top + 40 + gap + 40 + 60;
    var r = new V.Renderer(el, V.Renderer.Backends.SVG); r.resize(W, Hh);
    var ctx = r.getContext(); ctx.setFillStyle('currentColor'); ctx.setStrokeStyle('currentColor');
    var svg = el.querySelector('svg');
    var st1 = new V.Stave(x0, top, W - x0 - 4), st2 = new V.Stave(x0, top + gap, W - x0 - 4);
    st1.addClef('treble'); st2.addClef('bass');
    if (key) { st1.addKeySignature(M.keyVF(key, false)); st2.addKeySignature(M.keyVF(key, false)); }
    st1.setEndBarType(V.Barline.type.END); st2.setEndBarType(V.Barline.type.END);
    st1.setContext(ctx).draw(); st2.setContext(ctx).draw();
    new V.StaveConnector(st1, st2).setType('brace').setContext(ctx).draw();
    new V.StaveConnector(st1, st2).setType('singleLeft').setContext(ctx).draw();
    new V.StaveConnector(st1, st2).setType('boldDoubleRight').setContext(ctx).draw();
    var bad = {}; (spec.bad || []).forEach(function (t) { bad[t] = 1; });
    var qs = {}; (spec.q || []).forEach(function (i) { qs[i] = 1; });
    var mk = function (n, b, clef, up, t, rest, col) {
      var s;
      if (rest) s = new V.StaveNote({ clef: clef, keys: [clef === 'treble' ? 'b/4' : 'd/3'], duration: DUR[b] + 'r' });
      else { var p = CP.pit(key, n); s = new V.StaveNote({ clef: clef, keys: [M.vf(p)], duration: DUR[b], stem_direction: up ? 1 : -1 }); }
      if (bad[t]) col = '#d3302a';
      if (col) s.setStyle({ fillStyle: col, strokeStyle: col });
      return s;
    };
    var cfN = cfItems.map(function (x) { return mk(x.n, 4, above ? 'bass' : 'treble', !above, x.t, false, spec.cfCol || null); });
    var cpN = tl.map(function (x) { return mk(x.n, x.b, above ? 'treble' : 'bass', above, x.t, x.rest || !!qs[x.i], spec.col || null); });
    var total = L * 4, mkV = function (arr) { return new V.Voice({ num_beats: total, beat_value: 4 }).setMode(V.Voice.Mode.SOFT).addTickables(arr); };
    var vU = mkV(above ? cpN : cfN), vL = mkV(above ? cfN : cpN);
    var fm = new V.Formatter(); fm.joinVoices([vU]); fm.joinVoices([vL]);
    fm.format([vU, vL], Math.max(40, st1.getNoteEndX() - first - 8), { align_rests: false });
    vU.draw(ctx, st1); vL.draw(ctx, st2);
    // つなぎ線（タイ）
    cpN.forEach(function (s, i) { if (tl[i].tie && cpN[i + 1]) new V.StaveTie({ first_note: s, last_note: cpN[i + 1], first_indices: [0], last_indices: [0] }).setContext(ctx).draw(); });
    svg.querySelectorAll('[fill="black"],[fill="#000"],[fill="#000000"]').forEach(function (e) { e.setAttribute('fill', 'currentColor'); });
    svg.querySelectorAll('[stroke="black"],[stroke="#000"],[stroke="#000000"]').forEach(function (e) { e.setAttribute('stroke', 'currentColor'); });
    // 音程の 数字（下の 五線の 下）
    var botY = 0;
    (above ? cfN : cpN).forEach(function (s) { if (s.isRest && s.isRest()) return; var e = s.getStemExtents ? s.getStemExtents() : null, ys = s.getYs(); botY = Math.max(botY, ys[ys.length - 1] + 7, e ? Math.max(e.topY, e.baseY) : 0); });
    var by = Math.max(top + gap + 40 + 54, botY + 20), xAt = {};
    cfItems.forEach(function (x, i) { xAt[x.t] = cfN[i].getAbsoluteX() + 6; });
    tl.forEach(function (x, i) { if (!x.rest) xAt[x.t] = cpN[i].getAbsoluteX() + 6; });
    if (spec.lab !== false) {
      var seen = {};
      Object.keys(xAt).map(Number).sort(function (a, b) { return a - b; }).forEach(function (t) {
        var s = soundAt(tl, t); if (!s || seen[t]) return; var c = cfAt(cf, t); if (qs[s.i]) { return; }
        var st = (s.n - c) * (above ? 1 : -1), tied = tl[s.i - 1] && tl[s.i - 1].tie && !tl[s.i - 1].rest && tl[s.i].t === t && tl[s.i - 1].n === s.n;
        var cls = CP.cls(CP.mid(key, s.n) - CP.mid(key, c));
        M.svgText(svg, xAt[t], by, (tied ? '(' : '') + CP.deg(st) + (tied ? ')' : ''), { size: 13, c: cls === 'D' ? '#d3302a' : '#7a7568', fixed: true });
      });
    }
    // 小節線と 小節の 番号
    var onT = Object.keys(xAt).map(Number).sort(function (x, y) { return x - y; }), yTop = st1.getYForLine(0), yBot = st2.getYForLine(4);
    for (var bq = 1; bq < L; bq++) {
      var tt = bq * 4, pv = null; onT.forEach(function (x) { if (x < tt) pv = x; });
      if (pv == null || xAt[tt] == null) continue;
      var bx = (xAt[pv] + xAt[tt]) / 2 + 2; M.svgEl(svg, 'line', { x1: bx, y1: yTop, x2: bx, y2: yBot, stroke: 'currentColor', 'stroke-width': 1 });
    }
    if (spec.nums !== false && L > 1) for (var bn = 0; bn < L; bn++) if (xAt[bn * 4] != null) M.svgText(svg, xAt[bn * 4], top + 12, String(bn + 1), { size: 11, c: '#9a9486', fixed: true });
    (spec.qLab || []).forEach(function (i) { var x = tl[i]; if (x) M.svgText(svg, xAt[x.t], top + (above ? 18 : gap + 18), '？', { size: 22, c: '#d3302a' }); });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh); svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('class', 'vf');
    svg.style.width = ''; svg.style.height = ''; svg.style.maxWidth = Math.round(W * (spec.zoom || 2)) + 'px'; svg.dataset.w = W;
    M.fit(svg, W, top + 40, top + gap + 80);
    return { svg: svg, xAt: xAt, y1: st1.getYForLine(4), y2: st2.getYForLine(4) };
  };
  F.CUSTOM.cpfig = function (box, a) { M.cpfig(box, a); };
  CP.fig = function (key, cf, cp, above, o) { return { c: 'cpfig', a: Object.assign({ key: key, cf: cf, cp: cp, above: above }, o || {}) }; };
  CP.sound = function (tl, t) { return soundAt(tl, t); };

  // 定旋律を 楽譜に 置く 高さ（上に つける ときは 低めの 五線、下に つける ときは 高めの 五線）
  CP.place = function (key, pool, above) {
    var best = pool, bd = 1e9, target = above ? 50 : 66;
    [-14, -7, 0, 7].forEach(function (o) {
      var a = pool.map(function (n) { return n + o; }), m = a.reduce(function (s, n) { return s + CP.mid(key, n); }, 0) / a.length;
      if (Math.abs(m - target) < bd) { bd = Math.abs(m - target); best = a; }
    });
    return best;
  };

  /* ---------- 音を 鳴らす ---------- */
  CP.play = function (key, cf, cp, above) {
    var ev = [], tl = timeline(cp), sec = 0.5;
    tl.forEach(function (x, i) { if (x.rest || (tl[i - 1] && tl[i - 1].tie && !tl[i - 1].rest)) return; var d = x.b; if (x.tie && tl[i + 1]) d += tl[i + 1].b; ev.push([M.str(CP.pit(key, x.n)), d * sec]); });
    return ev;
  };
})();
