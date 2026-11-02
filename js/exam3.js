/* =========================================================
   楽典ラボ：応用（入試形式）── 課題楽曲 II（ピアノ曲ふうの 大譜表）
   右手＝リズムの ある 旋律、左手＝伴奏。速度記号・強弱・楽語つき。
   問：音程（旋律・上下）／調名（前半・後半）／和音／楽語の 意味／非和声音／終止
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, $ = GK.$, esc = GK.esc, V = GK.view;
  var VF = function () { return window.Vex && Vex.Flow; };
  var mid = function (p) { return M.midi(p); };
  var dn = function (p) { return p.o * 7 + p.l; };
  function pick(a, R) { return a[Math.floor(R() * a.length)]; }
  function shuf(a, R) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var Ch = function (d, inv, sev) { return { d: d, inv: inv || 0, sev: !!sev, nine: false }; };
  var ROM = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'];
  var INVN = ['基本', '第1転回', '第2転回', '第3転回'];
  var CTYPES = [['maj', '長三和音'], ['min', '短三和音'], ['dim', '減三和音'], ['dom7', '属七の和音'], ['dim7', '減七の和音'], ['maj7', '長七の和音'], ['min7', '短七の和音'], ['hdim7', '減五短七の和音']];
  var QUAL = [['P', '完全'], ['M', '長'], ['m', '短'], ['A', '増'], ['d', '減']];
  var KEYF = [0, 1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
  var MAJK = [0, 1, -1, 2, -2, 3, -3], MINK = [0, 1, -1, 2, -2];
  // 前半（もとの 調）：終わり方 いろいろ
  var PA = [
    { chs: [Ch(1), Ch(4), Ch(5), Ch(1)], cad: 'auth' }, { chs: [Ch(1), Ch(2), Ch(5), Ch(1)], cad: 'auth' },
    { chs: [Ch(1), Ch(6), Ch(4), Ch(5)], cad: 'half' }, { chs: [Ch(1), Ch(5, 1), Ch(1), Ch(5)], cad: 'half' },
    { chs: [Ch(1), Ch(6), Ch(4), Ch(1)], cad: 'plag' }, { chs: [Ch(1), Ch(4), Ch(5), Ch(6)], cad: 'dec' }
  ];
  // 後半（転調先）：正格終止で 終わる
  var PB = [[Ch(1), Ch(4), Ch(5, 0, 1), Ch(1)], [Ch(1), Ch(2, 1), Ch(5, 0, 1), Ch(1)], [Ch(1), Ch(6), Ch(5), Ch(1)], [Ch(1), Ch(4), Ch(5), Ch(1)]];
  var CADN = { auth: '正格終止', half: '半終止', plag: '変格終止', dec: '偽終止' };
  var TEMPI = [['Andante', '歩くような 速さで'], ['Moderato', '中くらいの 速さで'], ['Allegretto', 'やや 速く'], ['Adagio', 'ゆるやかに'], ['Allegro', '速く'], ['Andantino', 'アンダンテより やや 速く'], ['Lento', '遅く'], ['Vivace', 'いきいきと 速く']];
  var EXPR = [['dolce', 'やさしく 甘く'], ['cantabile', '歌うように'], ['grazioso', '優雅に'], ['espressivo', '表情豊かに'], ['leggiero', '軽く'], ['rit.', 'だんだん 遅く'], ['cresc.', 'だんだん 強く'], ['dim.', 'だんだん 弱く'], ['a tempo', 'もとの 速さで'], ['legato', 'なめらかに']];
  var NCT = [['pass', '経過音'], ['neigh', '刺繍音'], ['app', '倚音'], ['sus', '掛留音']];
  var RHY = { 4: [[2, 2, 2, 2], [4, 2, 2], [2, 1, 1, 2, 2], [3, 1, 2, 2], [2, 2, 1, 1, 2], [2, 1, 1, 4], [1, 1, 2, 2, 2]], 3: [[2, 2, 2], [4, 2], [2, 1, 1, 2], [3, 1, 2], [1, 1, 2, 2]] };
  var DUR = { 1: '8', 2: 'q', 3: 'qd', 4: 'h', 6: 'hd', 8: 'w' };

  function typeOf(key, minor, ch) { var t = M.chordType(M.diatonic(key, minor, ch.d, ch.sev)); return CTYPES.filter(function (x) { return x[0] === t; })[0] || null; }
  function related(f, minor, R) {
    var c = minor ? [[f, false], [f + 1, true], [f - 1, true]] : [[f + 1, false], [f - 1, false], [f, true]];
    return pick(c.filter(function (x) { return Math.abs(x[0]) <= 4; }), R);
  }
  // その 調の 音階音（l から 1 段 上・下）
  function stepOf(key, minor, p, dir) {
    var d2 = dn(p) + dir, l = ((d2 % 7) + 7) % 7, o = Math.floor(d2 / 7), a = M.keyAcc(key)[l] || 0;
    return { l: l, a: a, o: o };
  }
  function scaleDeg(key, minor, l) { var t = M.keyTonic(key, minor); return (l - t.l + 7) % 7; }

  /* ---------- 曲を つくる ---------- */
  function genScore(R) {
    for (var tr = 0; tr < 300; tr++) {
      var meter = R() < 0.6 ? 4 : 3, m1 = R() < 0.3, f1 = pick(m1 ? MINK : MAJK, R), k2 = related(f1, m1, R);
      var pa = pick(PA, R), pb = pick(PB, R);
      if (m1 && pa.cad === 'dec') continue;
      var va = H.solve(f1, m1, pa.chs, null, R), vb = H.solve(k2[0], k2[1], pb, null, R);
      if (!va || !vb) continue;
      var secs = [{ key: f1, minor: m1, chs: pa.chs, vs: va, cad: pa.cad }, { key: k2[0], minor: k2[1], chs: pb, vs: vb, cad: 'auth' }];
      var bars = [];
      secs.forEach(function (s, si) { s.chs.forEach(function (c, i) { bars.push({ si: si, key: s.key, minor: s.minor, ch: c, v: s.vs[i], ty: typeOf(s.key, s.minor, c) }); }); });
      var U = meter * 2;   // 1 小節の 8分音符の 数
      // 右手の 旋律
      var ok = true;
      bars.forEach(function (b, bi) {
        var last = bi === 3 || bi === 7, pat = last ? (bi === 7 ? [U] : (meter === 4 ? [4, 4] : [4, 2])) : pick(RHY[meter], R).slice();
        var pcs = H.pcs(b.key, b.minor, b.ch), cand = [];
        for (var o = 4; o <= 5; o++) pcs.forEach(function (c) { var p = { l: c.l, a: c.a, o: o }; if (mid(p) >= 62 && mid(p) <= 81) cand.push(p); });
        var s0 = b.v[0]; if (mid(s0) < 62) s0 = { l: s0.l, a: s0.a, o: s0.o + 1 };
        var tgt = bi < 7 ? bars[bi + 1].v[0] : s0, notes = [], on = 0;
        pat.forEach(function (d, k) { notes.push({ d: d, on: on, p: null, nct: null }); on += d; });
        var second = function (k) { return notes[k].d === 1 && k > 0 && notes[k - 1].d === 1 && notes[k - 1].on % 2 === 0; };
        notes.forEach(function (n, k) {
          if (second(k)) return;
          if (k === 0) { n.p = s0; return; }
          var prev = second(k - 1) ? notes[k - 2].p : notes[k - 1].p, best = null, bs = 1e9;
          cand.forEach(function (c) {
            var dd = Math.abs(dn(c) - dn(prev)), sc = dd * 1.2 + Math.abs(dn(c) - dn(tgt)) * 0.4 + R() * 2.2;
            if (second(k - 1)) sc += (dd === 2 ? -4 : dd === 0 ? -1 : 3);
            if (dd === 0 && !second(k - 1)) sc += 3; if (dd > 5) sc += 8;
            if (sc < bs) { bs = sc; best = c; }
          });
          n.p = best;
        });
        // 2 つめの 8分音符：経過音・刺繍音（だめなら 和音の 音）
        notes.forEach(function (n, k) {
          if (!second(k)) return;
          var a = notes[k - 1].p, z = k + 1 < notes.length ? notes[k + 1].p : tgt, d = dn(z) - dn(a), np = null, kind = null;
          if (Math.abs(d) === 2) { np = stepOf(b.key, b.minor, a, d > 0 ? 1 : -1); kind = 'pass'; }
          else if (d === 0) { np = stepOf(b.key, b.minor, a, R() < 0.5 ? 1 : -1); kind = 'neigh'; }
          if (np && b.minor) { var sd = scaleDeg(b.key, b.minor, np.l); if (sd === 5 || sd === 6) np = null; }
          if (np && pcs.some(function (c) { return c.l === np.l; })) np = null;
          if (!np) { var c2 = cand.filter(function (c) { return Math.abs(dn(c) - dn(a)) <= 4 && Math.abs(dn(c) - dn(z)) <= 4; }); np = c2.length ? pick(c2, R) : a; kind = null; }
          n.p = np; n.nct = kind;
        });
        if (notes.some(function (n) { return !n.p; })) ok = false;
        b.rh = notes;
        // 左手：バス＋テノール
        var lpat = last && bi === 7 ? [U] : meter === 4 ? [4, 4] : [U];
        b.lh = lpat.map(function (d, k) { return { d: d, on: k * 4, ps: [b.v[3], b.v[2]] }; });
      });
      if (!ok) continue;
      var ncts = []; bars.forEach(function (b, bi) { b.rh.forEach(function (n, k) { if (n.nct) ncts.push({ b: bi, k: k, kind: n.nct }); }); });
      if (!ncts.length) continue;
      // 音程の 問題：ア＝旋律の となりあう 2 音、イ＝右手と バス（同じ 小節の 1 拍め）
      var mel = [], ver = [];
      bars.forEach(function (b, bi) { b.rh.forEach(function (n, k) { if (k + 1 < b.rh.length) { var x = n.p, y = b.rh[k + 1].p, lo = mid(x) <= mid(y) ? x : y, hi = lo === x ? y : x, iv = M.interval(lo, hi); if (iv.deg >= 3 && iv.deg <= 8 && iv.q !== '?') mel.push({ b: bi, k: k, k2: k + 1, iv: iv }); } }); });
      bars.forEach(function (b, bi) { if (bi === 0 || bi === 7) return; var x = b.lh[0].ps[0], y = b.rh[0].p, iv = M.interval(x, y); if (iv.q === '?' || (iv.deg > 8 && (iv.deg - 1) % 7 === 0) || iv.deg < 3) return; ver.push({ b: bi, iv: iv }); });
      if (!mel.length || !ver.length) continue;
      var simp = function (iv) { var d = iv.deg > 8 ? ((iv.deg - 1) % 7) + 1 : iv.deg; return { q: iv.q, deg: d, comp: iv.deg > 8, raw: iv }; };
      var pm = pick(mel, R), pv = pick(ver.filter(function (x) { return x.b !== pm.b; }).length ? ver.filter(function (x) { return x.b !== pm.b; }) : ver, R);
      var cb = shuf([1, 2, 5, 6].filter(function (i) { return bars[i].ty; }), R).slice(0, 2).sort(function (a, b) { return a - b; });
      if (cb.length < 2) continue;
      var tempo = pick(TEMPI, R), ex = pick(EXPR, R), exBar = /rit|a tempo/.test(ex[0]) ? 6 : /cresc|dim/.test(ex[0]) ? pick([2, 5], R) : 4;
      return {
        meter: meter, bars: bars, secs: secs, tempo: tempo, expr: ex, exBar: exBar, dyn1: pick(['p', 'mp', 'mf'], R), dyn2: pick(['f', 'mf', 'p'], R),
        mel: Object.assign({}, pm, simp(pm.iv)), ver: Object.assign({}, pv, simp(pv.iv)), chords: cb, nct: pick(ncts, R), cad: pa.cad
      };
    }
    throw new Error('genScore');
  }

  /* ---------- 楽譜を かく（2 段 × 4 小節） ---------- */
  function drawScore(el, P, o) {
    o = o || {};
    var Vx = VF(); el.innerHTML = ''; if (!Vx) { el.textContent = '（楽譜を 読みこめませんでした）'; return null; }
    var only = o.only || null, show = function (s) { return !only || only.indexOf(s) >= 0; };
    var BPS = o.bps || ((el.clientWidth || 900) < 560 ? 2 : 4), NS = 8 / BPS, W = BPS === 2 ? 540 : 900, SYS = 236, top = 64, gap = 92;
    var sysOf = function (bi) { return Math.floor(bi / BPS); };
    var r = new Vx.Renderer(el, Vx.Renderer.Backends.SVG); r.resize(W, top + SYS * NS + 10);
    var ctx = r.getContext(); ctx.setFillStyle('currentColor'); ctx.setStrokeStyle('currentColor');
    var svg = el.querySelector('svg'), E = function (tag, at, par) { return M.svgEl(par || svg, tag, at); };
    var G = function (slot) { var g = M.svgEl(svg, 'g', { 'class': 'pmk', 'data-slot': slot }), f = function (tag, at) { return M.svgEl(g, tag, at); }; f.el = g; return f; };
    var keyAccOf = function (f) { return M.keyAcc(f); };
    var geo = { rh: [], lh: [], bx: [], sys: [] };
    for (var sy = 0; sy < NS; sy++) {
      var y1 = top + sy * SYS, y2 = y1 + gap, x = 10, sec = P.secs[0];   // 調号は ずっと 最初の 調（転調は 臨時記号で）
      var ks0 = []; for (var q0 = 0; q0 < BPS; q0++) ks0.push(q0);
      var widths = ks0.map(function (k) { var b = P.bars[sy * BPS + k]; return 70 + b.rh.length * 30; }), sum = widths.reduce(function (a, b) { return a + b; }, 0);
      var first = new Vx.Stave(0, 0, 300); first.addClef('treble'); if (sec.key) first.addKeySignature(M.keyVF(sec.key, sec.minor)); if (sy === 0) first.addTimeSignature(P.meter + '/4'); first.format && first.format();
      var head = first.getNoteStartX() + 4, scale = (W - 20 - head) / sum;
      geo.sys.push({ y1: y1, y2: y2 });
      for (var k = 0; k < BPS; k++) {
        var bi = sy * BPS + k, b = P.bars[bi], w = widths[k] * scale + (k === 0 ? head : 0);
        var s1 = new Vx.Stave(x, y1, w), s2 = new Vx.Stave(x, y2, w);
        if (k === 0) { s1.addClef('treble'); s2.addClef('bass'); if (sec.key) { s1.addKeySignature(M.keyVF(sec.key, sec.minor)); s2.addKeySignature(M.keyVF(sec.key, sec.minor)); } if (sy === 0) { s1.addTimeSignature(P.meter + '/4'); s2.addTimeSignature(P.meter + '/4'); } }
        if (bi === 7) { s1.setEndBarType(Vx.Barline.type.END); s2.setEndBarType(Vx.Barline.type.END); }
        s1.setContext(ctx).draw(); s2.setContext(ctx).draw();
        if (k === 0) { new Vx.StaveConnector(s1, s2).setType('brace').setContext(ctx).draw(); new Vx.StaveConnector(s1, s2).setType('singleLeft').setContext(ctx).draw(); }
        new Vx.StaveConnector(s1, s2).setType(bi === 7 ? 'boldDoubleRight' : 'singleRight').setContext(ctx).draw();
        var ka = keyAccOf(b.key), st1 = {}, st2 = {};
        var accFor = function (p, stt) { var kk = p.l + ':' + p.o, cur = kk in stt ? stt[kk] : ka[p.l] || 0; stt[kk] = p.a; return cur !== p.a ? { '-2': 'bb', '-1': 'b', '0': 'n', '1': '#', '2': '##' }[p.a] : null; };
        // 調号は 段の 最初の 調（後半は 2 段め）。小節の 中の 臨時記号は 調号と くらべる
        ka = keyAccOf(sec.key);
        var rn = b.rh.map(function (n) {
          var sn = new Vx.StaveNote({ clef: 'treble', keys: [M.vf(n.p)], duration: DUR[n.d], auto_stem: true });
          var ac = accFor(n.p, st1); if (ac) sn.addModifier(new Vx.Accidental(ac), 0);
          if (n.d === 3 || n.d === 6) Vx.Dot.buildAndAttach([sn], { all: true });
          if (bi === 7) sn.addModifier(new Vx.Articulation('a@a').setPosition(3), 0);
          return sn;
        });
        var ln = b.lh.map(function (n) {
          var ks = n.ps.slice().sort(function (a, c) { return mid(a) - mid(c); });
          var sn = new Vx.StaveNote({ clef: 'bass', keys: ks.map(M.vf), duration: DUR[n.d], stem_direction: -1 });
          ks.forEach(function (p, q) { var ac = accFor(p, st2); if (ac) sn.addModifier(new Vx.Accidental(ac), q); });
          if (n.d === 6) Vx.Dot.buildAndAttach([sn], { all: true });
          return sn;
        });
        var v1 = new Vx.Voice({ num_beats: P.meter, beat_value: 4 }).setMode(Vx.Voice.Mode.SOFT).addTickables(rn);
        var v2 = new Vx.Voice({ num_beats: P.meter, beat_value: 4 }).setMode(Vx.Voice.Mode.SOFT).addTickables(ln);
        var beams = Vx.Beam.generateBeams(rn);
        new Vx.Formatter().joinVoices([v1]).joinVoices([v2]).format([v1, v2], Math.max(40, s1.getNoteEndX() - s1.getNoteStartX() - 14));
        v1.draw(ctx, s1); v2.draw(ctx, s2); beams.forEach(function (bm) { bm.setContext(ctx).draw(); });
        geo.rh[bi] = rn; geo.lh[bi] = ln; geo.bx[bi] = { x0: x, x1: x + w, n0: s1.getNoteStartX() };
        x += w;
      }
    }
    svg.querySelectorAll('[fill="black"],[fill="#000"],[fill="#000000"]').forEach(function (e) { e.setAttribute('fill', 'currentColor'); });
    svg.querySelectorAll('[stroke="black"],[stroke="#000"],[stroke="#000000"]').forEach(function (e) { e.setAttribute('stroke', 'currentColor'); });
    var nx = function (sn) { return sn.getAbsoluteX() + 6; }, ny = function (sn, q) { return sn.getYs()[q || 0]; };
    var T = function (par, x, y, t, op) { return M.svgText(par, x, y, t, Object.assign({ fixed: true }, op || {})); };
    // 速度記号・強弱・楽語（曲の 一部。いつも 見える）
    var s0 = geo.sys[0], b0 = geo.bx[0];
    T(svg, b0.n0 - 4, s0.y1 + 2, P.tempo[0], { size: 16, anchor: 'start', font: 'serif', italic: false });
    T(svg, nx(geo.rh[0][0]) - 2, s0.y1 + 95, P.dyn1, { size: 17, font: 'serif', italic: true });
    T(svg, nx(geo.rh[4][0]) - 2, geo.sys[sysOf(4)].y1 + 95, P.dyn2, { size: 17, font: 'serif', italic: true });
    var esy = geo.sys[sysOf(P.exBar)], exY = /cresc|dim|rit|a tempo/.test(P.expr[0]) ? esy.y1 + 95 : esy.y1 + 2;
    T(svg, nx(geo.rh[P.exBar][0]) + 2, exY, P.expr[0], { size: 15, anchor: 'start', font: 'serif', italic: true });
    svg.querySelectorAll('[fill="black"],[stroke="black"]').forEach(function (e) { if (e.getAttribute('fill') === 'black') e.setAttribute('fill', 'currentColor'); if (e.getAttribute('stroke') === 'black') e.setAttribute('stroke', 'currentColor'); });
    // 目じるし
    var ring = function (f, sn, q, lab, side) { var cx = nx(sn), cy = ny(sn, q); f('circle', { cx: cx, cy: cy, r: 17, fill: 'transparent', stroke: 'none', 'class': 'phit' }); f('ellipse', { cx: cx, cy: cy, rx: 12, ry: 9.5, fill: 'none', stroke: '#c0392b', 'stroke-width': 2.2 }); T(f.el, cx + (side || 18), cy - 12, lab, { size: 14, c: '#c0392b' }); };
    if (show('i0')) { var gm = G('i0'), rb = geo.rh[P.mel.b]; ring(gm, rb[P.mel.k], 0, 'ア', -16); ring(gm, rb[P.mel.k2], 0, 'ア′'); }
    if (show('i1')) { var gv = G('i1'); ring(gv, geo.rh[P.ver.b][0], 0, 'イ'); var lk = geo.lh[P.ver.b][0]; ring(gv, lk, 0, 'イ′'); }
    P.secs.forEach(function (sc, si) {
      if (!show('k' + si)) return;
      var f = G('k' + si);
      for (var s2 = sysOf(si * 4); s2 <= sysOf(si * 4 + 3); s2++) {
        var fb = Math.max(si * 4, s2 * BPS), lb = Math.min(si * 4 + 3, s2 * BPS + BPS - 1), a = (fb % BPS === 0 ? geo.bx[fb].n0 : geo.bx[fb].x0) - 6, bb = geo.bx[lb].x1 - 6, y = geo.sys[s2].y2 + 70;
        f('rect', { x: a, y: y - 14, width: bb - a, height: 30, fill: 'transparent', stroke: 'none', 'class': 'phit' });
        f('path', { d: 'M' + a + ' ' + (y - 8) + ' V' + y + ' H' + bb + ' V' + (y - 8), fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 });
        if (s2 !== sysOf(si * 4)) continue;
        var mx = (a + bb) / 2; f('rect', { x: mx - 11, y: y - 10, width: 22, height: 20, fill: 'var(--panel, #fff)', stroke: 'currentColor', 'stroke-width': 1.3 }); T(f.el, mx, y + 5, 'AB'.charAt(si), { size: 14 });
      }
    });
    P.chords.forEach(function (bi, q) {
      if (!show('c' + q)) return;
      var f = G('c' + q), bx = geo.bx[bi], sy0 = geo.sys[sysOf(bi)], x0 = (bi % BPS === 0 ? bx.n0 - 8 : bx.x0 + 4), x1 = bx.x1 - 4;
      f('rect', { x: x0, y: sy0.y1 - 24, width: x1 - x0, height: sy0.y2 - sy0.y1 + 84, rx: 6, fill: 'transparent', stroke: 'none', 'class': 'phit' });
      f('rect', { x: x0, y: sy0.y1 - 24, width: x1 - x0, height: sy0.y2 - sy0.y1 + 84, rx: 6, fill: 'none', stroke: '#2d6fb0', 'stroke-width': 1.8, 'stroke-dasharray': '5 4' });
      f('circle', { cx: x0 + 12, cy: sy0.y1 - 24, r: 10, fill: 'var(--panel, #fff)', stroke: '#2d6fb0', 'stroke-width': 1.5 }); T(f.el, x0 + 12, sy0.y1 - 19, 'ab'.charAt(q), { size: 13, c: '#2d6fb0' });
    });
    if (show('t0')) { var ft = G('t0'); ft('rect', { x: b0.n0 - 8, y: s0.y1 - 16, width: P.tempo[0].length * 9.5 + 10, height: 24, rx: 5, fill: 'none', stroke: '#8a5cc0', 'stroke-width': 1.8 }); T(ft.el, b0.n0 - 18, s0.y1 + 2, '①', { size: 15, c: '#8a5cc0' }); }
    if (show('t1')) { var fe = G('t1'), ex0 = nx(geo.rh[P.exBar][0]) + 2; fe('rect', { x: ex0 - 5, y: exY - 16, width: P.expr[0].length * 9 + 10, height: 22, rx: 5, fill: 'none', stroke: '#8a5cc0', 'stroke-width': 1.8 }); T(fe.el, ex0 - 15, exY + 1, '②', { size: 15, c: '#8a5cc0' }); }
    if (show('n0')) { var fn = G('n0'), sn = geo.rh[P.nct.b][P.nct.k]; fn('circle', { cx: nx(sn), cy: ny(sn), r: 17, fill: 'transparent', stroke: 'none', 'class': 'phit' }); fn('ellipse', { cx: nx(sn), cy: ny(sn), rx: 12, ry: 9.5, fill: 'none', stroke: '#2c8a5c', 'stroke-width': 2.4 }); T(fn.el, nx(sn), Math.min(ny(sn) - 16, geo.sys[sysOf(P.nct.b)].y1 + 30), '＊', { size: 18, c: '#2c8a5c' }); }
    if (show('e0')) { var fc = G('e0'), a2 = (2 % BPS === 0 ? geo.bx[2].n0 - 6 : geo.bx[2].x0 + 4), b2 = geo.bx[3].x1 - 6, yy = geo.sys[sysOf(2)].y1 - 4; fc('rect', { x: a2, y: yy - 14, width: b2 - a2, height: 26, fill: 'transparent', stroke: 'none', 'class': 'phit' }); fc('path', { d: 'M' + a2 + ' ' + (yy + 8) + ' V' + yy + ' H' + b2 + ' V' + (yy + 8), fill: 'none', stroke: '#c08a0e', 'stroke-width': 1.8 }); T(fc.el, (a2 + b2) / 2, yy - 4, '終', { size: 14, c: '#c08a0e' }); }
    var bb2 = null; try { bb2 = svg.getBBox(); } catch (e) { }
    var y0 = bb2 ? Math.min(bb2.y - 6, top - 50) : 0, hh = bb2 ? bb2.y + bb2.height + 8 - y0 : top + SYS * NS;
    svg.setAttribute('viewBox', '0 ' + y0 + ' ' + W + ' ' + hh); svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('class', 'vf');
    svg.style.width = ''; svg.style.height = ''; svg.style.maxWidth = '100%';
    return geo;
  }

  // 演奏（右手と 左手を 同時に）
  function playScore(P, from, to) {
    from = from || 0; to = to == null ? 7 : to;
    var bpm = /Adagio|Lento/.test(P.tempo[0]) ? 66 : /Allegro|Vivace/.test(P.tempo[0]) ? 120 : 92, rh = [], lh = [];
    for (var bi = from; bi <= to; bi++) { P.bars[bi].rh.forEach(function (n) { rh.push([M.str(n.p), n.d / 2]); }); P.bars[bi].lh.forEach(function (n) { lh.push([n.ps.map(function (p) { return M.str(p); }), n.d / 2]); }); }
    M.play(rh, bpm); M.play(lh, bpm);
  }

  /* ---------- ページ（#exam/score） ---------- */
  GK.route(/^exam\/score$/, function () {
    V.innerHTML = '<div class="split">' + GK.EXAM.side('score') + '<section class="panel main"><div class="mbody" id="sbody"></div></section></div>';
    run($('#sbody'));
  });
  var INVS = ['基本', '第1転回', '第2転回', '第3転回'];
  function opts4(list, right, R) { var w = shuf(list.filter(function (x) { return x[0] !== right[0] && x[1] !== right[1]; }), R).slice(0, 3); return shuf(w.concat([right]), R); }
  function run(body) {
    var R = GK.rng(Math.floor(Math.random() * 1e9)), P = genScore(R), graded = false, ans = {}, cur = 'i0', timer = 0;
    var termOpts = [opts4(TEMPI, P.tempo, R), opts4(EXPR, P.expr, R)];
    var slots = [
      { id: 'i0', g: 1, lab: 'ア', kind: 'iv', p: P.mel, need: ['q', 'd'], t: 'ア と ア′ の 音程', sub: '旋律の となりあう 2 音' },
      { id: 'i1', g: 1, lab: 'イ', kind: 'iv', p: P.ver, need: ['q', 'd'], t: 'イ と イ′ の 音程', sub: '右手と 左手。複音程は 単音程で' },
      { id: 'k0', g: 2, lab: 'A', kind: 'key', s: P.secs[0], need: ['k'], t: 'A（前半）の 調名' },
      { id: 'k1', g: 2, lab: 'B', kind: 'key', s: P.secs[1], need: ['k'], t: 'B（後半）の 調名' }
    ];
    P.chords.forEach(function (bi, q) { var b = P.bars[bi]; slots.push({ id: 'c' + q, g: 3, lab: 'ab'.charAt(q), kind: 'ch', b: b, bi: bi, need: ['t', 'd', 'i'], t: '和音 ' + 'ab'.charAt(q) + '（その 小節の 和音）', sub: '和音度は その 部分の 調で' }); });
    slots.push({ id: 't0', g: 4, lab: '①', kind: 'term', term: P.tempo, opts: termOpts[0], need: ['v'], t: '① ' + P.tempo[0] + ' の 意味' });
    slots.push({ id: 't1', g: 4, lab: '②', kind: 'term', term: P.expr, opts: termOpts[1], need: ['v'], t: '② ' + P.expr[0] + ' の 意味' });
    slots.push({ id: 'n0', g: 5, lab: '＊', kind: 'nct', need: ['v'], t: '＊ の 音の 種類', sub: '非和声音' });
    slots.push({ id: 'e0', g: 5, lab: '終', kind: 'cad', need: ['v'], t: 'A の 終わり方（終止）', sub: '第3〜4小節' });
    var S = function (id) { return slots.filter(function (x) { return x.id === id; })[0]; };
    var A = function (id) { return ans[id] || (ans[id] = {}); };
    var done = function (sl) { var a = A(sl.id); return sl.need.every(function (k) { return a[k] !== undefined; }); };
    var right = function (sl) {
      if (sl.kind === 'iv') return { q: sl.p.q, d: sl.p.deg };
      if (sl.kind === 'key') return { k: sl.s.key + ',' + (sl.s.minor ? 1 : 0) };
      if (sl.kind === 'ch') return { t: sl.b.ty[0], d: sl.b.ch.d, i: sl.b.ch.inv };
      if (sl.kind === 'term') return { v: sl.term[0] };
      if (sl.kind === 'nct') return { v: P.nct.kind };
      return { v: P.cad };
    };
    var isOk = function (sl) { var r = right(sl), a = A(sl.id); return sl.need.every(function (k) { return String(a[k]) === String(r[k]); }); };
    var rightText = function (sl) {
      if (sl.kind === 'iv') return M.QN[sl.p.q] + sl.p.deg + '度' + (sl.p.comp ? '（複音程 ' + sl.p.raw.name + ' を 単音程に）' : '');
      if (sl.kind === 'key') return M.keyName(sl.s.key, sl.s.minor);
      if (sl.kind === 'ch') return sl.b.ty[1] + '・' + ROM[sl.b.ch.d] + '・' + INVN[sl.b.ch.inv] + '（' + M.keyName(sl.b.key, sl.b.minor) + ' の ' + H.label(sl.b.ch) + '）';
      if (sl.kind === 'term') return sl.term[0] + '＝' + sl.term[1];
      if (sl.kind === 'nct') return NCT.filter(function (x) { return x[0] === P.nct.kind; })[0][1] + (P.nct.kind === 'pass' ? '（3度 はなれた 和音の 音の 間を 順次に 通る）' : '（同じ 音へ もどる とちゅうの となりの 音）');
      return CADN[P.cad] + '（' + H.label(P.bars[2].ch) + ' → ' + H.label(P.bars[3].ch) + '）';
    };
    body.innerHTML = '<div class="xw xp xpone xp2"><div class="xpl"><div class="fig sc xwpiece xwscore" id="pFig"></div></div><div class="xpr">' +
      '<div class="xpstrip"><button type="button" class="xpa" data-mv="-1" aria-label="まえ">◀</button><div class="xpdots" id="pSlots"></div><button type="button" class="xpa" data-mv="1" aria-label="つぎ">▶</button></div>' +
      '<div class="xppad" id="pPad"></div>' +
      '<div class="xpact"><button type="button" class="btn main" id="pGo"></button><button type="button" class="btn" id="pPlay">🔊 全体</button><button type="button" class="btn" id="pNew">🎲 べつの曲</button></div><div id="pRes"></div></div></div>';
    var fig = $('#pFig', body); drawScore(fig, P); GK.EXAM.dbgS = P;
    var svg = fig.querySelector('svg'); svg.classList.add('pfocus');
    function chips(sl, k, opts, cls) {
      var a = A(sl.id), r = right(sl);
      return '<div class="xpc' + (cls ? ' ' + cls : '') + '">' + opts.map(function (o) {
        var v = String(o[0]), c = 'xc';
        if (String(a[k]) === v) c += ' on';
        if (graded) { if (String(r[k]) === v) c += ' ok'; else if (String(a[k]) === v) c += ' ng'; }
        return '<button type="button" class="' + c + '" data-k="' + k + '" data-v="' + esc(v) + '"' + (graded ? ' disabled' : '') + '>' + esc(o[1]) + '</button>';
      }).join('') + '</div>';
    }
    var row = function (html) { return '<div class="xprow">' + html + '</div>'; };
    function drawSlots() {
      $('#pSlots', body).innerHTML = [1, 2, 3, 4, 5].map(function (g) {
        return '<span class="xpgrp">' + slots.filter(function (x) { return x.g === g; }).map(function (sl) {
          return '<button type="button" class="xpd' + (sl.id === cur ? ' cur' : '') + (done(sl) ? ' fill' : '') + (graded ? (isOk(sl) ? ' ok' : ' ng') : '') + '" data-s="' + sl.id + '">' + sl.lab + '</button>';
        }).join('') + '</span>';
      }).join('');
      var left = slots.filter(function (x) { return !done(x); }).length, go = $('#pGo', body);
      go.textContent = graded ? '採点ずみ' : left ? '✔ 採点（あと ' + left + '）' : '✔ 採点する'; go.disabled = graded;
    }
    function drawPad() {
      var sl = S(cur), no = ['', '問1', '問2', '問3', '問4', '問5'][sl.g], h = '<div class="xpph"><span class="xpq">' + no + '</span><b>' + sl.t + '</b>' + (sl.sub ? '<small>' + sl.sub + '</small>' : '') + '<button type="button" class="xph" id="pHear" aria-label="聴く">🔊</button></div>';
      if (sl.kind === 'iv') h += row(chips(sl, 'q', QUAL)) + row(chips(sl, 'd', [1, 2, 3, 4, 5, 6, 7, 8].map(function (d) { return [d, d + '度']; }), 'n8'));
      else if (sl.kind === 'key') {
        var nm = function (m) { return KEYF.map(function (f) { return [f + ',' + m, M.keyName(f, !!m).replace(/[長短]調$/, '')]; }); };
        var a0 = A(sl.id), md = a0.m !== undefined ? a0.m : a0.k !== undefined ? +String(a0.k).split(',')[1] : 0; if (graded) md = sl.s.minor ? 1 : 0;
        h += '<div class="xpmode">' + ['長調', '短調'].map(function (t, m) { return '<button type="button" class="' + (m === md ? 'on' : '') + '" data-m="' + m + '"' + (graded ? ' disabled' : '') + '>' + t + '</button>'; }).join('') + '</div>' + row(chips(sl, 'k', nm(md), 'kk'));
      } else if (sl.kind === 'ch') {
        h += row(chips(sl, 't', CTYPES.map(function (x) { return [x[0], x[1].replace('の和音', '')]; }))) + row(chips(sl, 'd', [1, 2, 3, 4, 5, 6, 7].map(function (d) { return [d, ROM[d]]; }), 'n7')) + row(chips(sl, 'i', INVS.map(function (x, i) { return [i, x]; })));
      } else if (sl.kind === 'term') h += row(chips(sl, 'v', sl.opts.map(function (o) { return [o[0], o[1]]; })));
      else if (sl.kind === 'nct') h += row(chips(sl, 'v', NCT));
      else h += row(chips(sl, 'v', [['auth', '正格終止'], ['plag', '変格終止'], ['half', '半終止'], ['dec', '偽終止']]));
      if (graded) h += '<div class="xfb ' + (isOk(sl) ? 'ok">⭕ 正解' : 'ng">✕ 正解は ' + esc(rightText(sl))) + '</div>';
      var pad = $('#pPad', body); pad.innerHTML = h;
      pad.querySelectorAll('.xc').forEach(function (b) { b.onclick = function () { choose(b.getAttribute('data-k'), b.getAttribute('data-v')); }; });
      $('#pHear', body).onclick = function () { hear(sl); };
      pad.querySelectorAll('.xpmode button').forEach(function (b) { b.onclick = function () { A(sl.id).m = +b.getAttribute('data-m'); drawPad(); }; });
    }
    function hear(sl) {
      if (sl.kind === 'iv') { var b = P.bars[sl.p.b], x = sl.id === 'i0' ? [b.rh[sl.p.k].p, b.rh[sl.p.k2].p] : [b.lh[0].ps[0], b.rh[0].p]; M.play([[M.str(x[0]), 1], [M.str(x[1]), 1], [[M.str(x[0]), M.str(x[1])], 2]], 90); }
      else if (sl.kind === 'key') playScore(P, sl.s === P.secs[0] ? 0 : 4, sl.s === P.secs[0] ? 3 : 7);
      else if (sl.kind === 'ch') { var bb = sl.b; M.play([[bb.v.map(function (p) { return M.str(p); }), 2]], 80); }
      else if (sl.kind === 'nct') playScore(P, P.nct.b, P.nct.b);
      else if (sl.kind === 'cad') playScore(P, 2, 3);
      else playScore(P, 0, 1);
    }
    function mark() {
      var sl0 = S(cur), sec = sl0.kind === 'ch' ? 'k' + (sl0.bi >= 4 ? 1 : 0) : '';
      svg.querySelectorAll('.pmk').forEach(function (g) { var d = g.getAttribute('data-slot'); g.classList.toggle('on', d === cur); g.classList.toggle('on2', d === sec); });
      var g = svg.querySelector('.pmk.on');
      if (g && fig.scrollHeight > fig.clientHeight + 4) { var rv = g.getBoundingClientRect(), fv = fig.getBoundingClientRect(); fig.scrollTop += (rv.top + rv.height / 2) - (fv.top + fv.height / 2); }
      if (g && fig.scrollWidth > fig.clientWidth) { var r = g.getBoundingClientRect(), fr = fig.getBoundingClientRect(); if (r.left < fr.left + 20 || r.right > fr.right - 20) fig.scrollLeft += (r.left + r.width / 2) - (fr.left + fr.width / 2); }
    }
    function pickSlot(id) { clearTimeout(timer); cur = id; drawSlots(); drawPad(); mark(); }
    function choose(k, v) {
      if (graded) return;
      var sl = S(cur), a = A(cur), was = done(sl); a[k] = v; GK.fx && GK.fx('tap'); drawSlots(); drawPad();
      if (!was && done(sl)) { var ix = slots.indexOf(sl), nx = null; for (var t = 1; t < slots.length; t++) { var c = slots[(ix + t) % slots.length]; if (!done(c)) { nx = c; break; } } if (nx) timer = setTimeout(function () { pickSlot(nx.id); }, 350); }
    }
    $('#pSlots', body).addEventListener('click', function (e) { var b = e.target.closest('.xpd'); if (b) pickSlot(b.getAttribute('data-s')); });
    svg.querySelectorAll('.pmk').forEach(function (g) { g.addEventListener('click', function () { pickSlot(g.getAttribute('data-slot')); }); });
    body.querySelectorAll('.xpa').forEach(function (b) { b.onclick = function () { var ix = slots.indexOf(S(cur)); pickSlot(slots[(ix + slots.length + (+b.getAttribute('data-mv'))) % slots.length].id); }; });
    $('#pPlay', body).onclick = function () { playScore(P); };
    $('#pNew', body).onclick = function () { run(body); };
    $('#pGo', body).onclick = function () {
      if (graded) return; graded = true; clearTimeout(timer);
      var got = slots.filter(isOk).length, tot = slots.length, pts = got + (got === tot ? 5 : 0);
      GK.earn(pts); var w = GK.store.get('examW', { ok: 0, sets: 0 }); w.ok += got; GK.store.set('examW', w); if (got === tot) { GK.fx('fanfare'); GK.confetti && GK.confetti(30); }
      var bad = slots.filter(function (x) { return !isOk(x); });
      $('#pRes', body).innerHTML = '<div class="xpres ' + (got >= tot * 0.8 ? 'ok' : 'ng') + '"><b>' + got + ' / ' + tot + ' 正解</b>' + (got === tot ? '🎉 ぜんぶ 正解！' : '<span>赤い 丸を タップで 答えを 確認</span>') + '<span>+' + pts + ' コイン</span></div>';
      pickSlot(bad.length ? bad[0].id : cur);
    };
    pickSlot(cur);
  }

  /* ---------- 演習・ゲームで つかう 4 択（ピアノ曲の 楽譜から） ---------- */
  var F = GK.F, U = GK.Q.util, tx = U.tx, mc = U.mc, add = U.add;
  F.CUSTOM.score = function (box, a) { drawScore(box, a.P, a.o); };
  var sf = function (P, only) { return { c: 'score', a: { P: P, o: { only: only } } }; };
  GK.UNIT.x01.types = GK.UNIT.x01.types.concat(['scoreTerm', 'scoreNct', 'scoreCad', 'scoreKey']);
  add('scoreTerm', 'x01', 2, function (R) {
    var P = genScore(R), two = R() < 0.5, term = two ? P.expr : P.tempo, list = two ? EXPR : TEMPI;
    var m = mc(R, tx(term[1]), shuf(list.filter(function (x) { return x[1] !== term[1]; }), R).slice(0, 5).map(function (x) { return tx(x[1]); }), 4);
    return { q: '楽譜の <b>' + (two ? '②' : '①') + ' ' + term[0] + '</b> の 意味は？', fig: sf(P, [two ? 't1' : 't0']), ch: m.ch, a: m.a, ex: '<b>' + term[0] + '</b> ＝ ' + term[1] + '。' };
  });
  add('scoreNct', 'x01', 3, function (R) {
    var P = genScore(R), rt = NCT.filter(function (x) { return x[0] === P.nct.kind; })[0][1];
    var m = mc(R, tx(rt), NCT.filter(function (x) { return x[1] !== rt; }).map(function (x) { return tx(x[1]); }), 4);
    return { q: '楽譜の ＊ の 音（非和声音）の 種類は？', fig: sf(P, ['n0']), ch: m.ch, a: m.a, ex: '<b>' + rt + '</b>。' + (P.nct.kind === 'pass' ? '3度 はなれた 和音の 音の 間を 順次に 通りぬける 音。' : '和音の 音から となりへ 動いて、また 同じ 音へ もどる 音。') };
  });
  add('scoreCad', 'x01', 3, function (R) {
    var P = genScore(R), rt = CADN[P.cad];
    var m = mc(R, tx(rt), ['正格終止', '変格終止', '半終止', '偽終止'].filter(function (x) { return x !== rt; }).map(function (x) { return tx(x); }), 4);
    return { q: '前半（第3〜4小節「終」）の 終わり方は？', fig: sf(P, ['e0', 'k0']), ch: m.ch, a: m.a, ex: '<b>' + rt + '</b>（' + M.keyName(P.secs[0].key, P.secs[0].minor) + '：' + H.label(P.bars[2].ch) + ' → ' + H.label(P.bars[3].ch) + '）。Ⅴ→Ⅰ＝正格、Ⅳ→Ⅰ＝変格、～→Ⅴ＝半、Ⅴ→Ⅵ＝偽。' };
  });
  add('scoreKey', 'x01', 3, function (R) {
    var P = genScore(R), s = P.secs[1], rt = M.keyName(s.key, s.minor), wr = [];
    [[s.key, !s.minor], [s.key + 1, s.minor], [s.key - 1, s.minor], [P.secs[0].key, P.secs[0].minor], [s.key + 2, s.minor]].forEach(function (c) { var n = M.keyName(c[0], c[1]); if (n !== rt && wr.indexOf(n) < 0 && Math.abs(c[0]) <= 7) wr.push(n); });
    var m = mc(R, tx(rt), wr.map(function (t) { return tx(t); }), 4);
    return { q: '後半（B）の 部分は 何調に 転調している？', fig: sf(P, ['k1']), ch: m.ch, a: m.a, ex: '<b>' + rt + '</b>。後半の 臨時記号（導音）と 終わりの 和音（Ⅴ→Ⅰ）から わかる。' };
  });
  Object.assign(GK.TYPE_NAME, { scoreTerm: 'ピアノ曲の 楽語', scoreNct: 'ピアノ曲の 非和声音', scoreCad: 'ピアノ曲の 終止', scoreKey: 'ピアノ曲の 転調' });
  Object.assign(GK.HINTS || {}, {
    scoreTerm: '速さの 言葉か、気分・弾き方の 言葉か。英語や 似た 言葉も ヒント。',
    scoreNct: '＊の 前と 後ろの 音を 見よう。同じ 向きに 通りぬける？ となりへ 行って もどる？',
    scoreCad: '最後の 2 小節の 和音を 読もう。Ⅰで 終わる？ Ⅴで 止まる？',
    scoreKey: '後半に 出てくる 臨時記号（導音）と、最後の 和音を 見よう。'
  });
  GK.EXAM.genScore = genScore; GK.EXAM.drawScore = drawScore;
})();
