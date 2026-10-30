/* =========================================================
   楽典ラボ：応用（入試形式）── 課題楽曲（大譜表）を 読んで 答える
   問1 2音間の音程　問2 部分の調名　問3 和音の種類・和音度・位置
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, $ = GK.$, esc = GK.esc, V = GK.view;
  var N = function (p) { return GK.nm(p); };
  var JP = function (p) { return M.name(p, 'jp'); };
  function pick(a, R) { return a[Math.floor(R() * a.length)]; }
  function shuf(a, R) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var Ch = function (d, inv, sev) { return { d: d, inv: inv || 0, sev: !!sev, nine: false }; };
  var CIRC = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];
  var JA = ['ア', 'イ', 'ウ'], LET = ['a', 'b', 'c', 'd', 'e'];
  var CTYPES = [['maj', '長三和音'], ['min', '短三和音'], ['dim', '減三和音'], ['dom7', '属七の和音'], ['dim7', '減七の和音'], ['maj7', '長七の和音'], ['min7', '短七の和音'], ['hdim7', '減五短七の和音']];
  var INVN = ['基本', '第一転回', '第二転回', '第三転回'];
  var QUAL = [['P', '完全'], ['M', '長'], ['m', '短'], ['A', '増'], ['d', '減'], ['AA', '重増'], ['dd', '重減']];
  var PRG = [
    [Ch(1), Ch(4), Ch(5, 0, 1), Ch(1)], [Ch(1), Ch(2, 1, 1), Ch(5), Ch(1)], [Ch(1), Ch(6), Ch(4), Ch(5, 0, 1), Ch(1)], [Ch(1), Ch(4, 1), Ch(5, 0, 1), Ch(1)],
    [Ch(1), Ch(1, 1), Ch(4), Ch(5, 2, 1), Ch(1)], [Ch(1), Ch(2, 0, 1), Ch(5, 0, 1), Ch(1)], [Ch(1), Ch(4), Ch(7, 1, 1), Ch(1)], [Ch(1), Ch(5, 1, 1), Ch(1), Ch(4), Ch(5), Ch(1)]
  ];
  var MAJK = [0, 1, -1, 2, -2, 3, -3, 4, -4], MINK = [0, 1, -1, 2, -2, 3, -3];

  function typeOf(key, minor, ch) {
    var notes = M.diatonic(key, minor, ch.d, ch.sev), t = M.chordType(notes);
    var hit = CTYPES.filter(function (x) { return x[0] === t; })[0];
    return hit || null;
  }
  // 転調先（近親調）
  function related(f, minor, R) {
    var c = minor ? [[f, false], [f + 1, true], [f - 1, true]] : [[f + 1, false], [f - 1, false], [f, true]];
    return pick(c.filter(function (x) { return Math.abs(x[0]) <= 5; }), R);
  }

  /* ---------- 課題楽曲を つくる ---------- */
  function genPiece(R) {
    for (var t = 0; t < 200; t++) {
      var m1 = R() < 0.35, f1 = pick(m1 ? MINK : MAJK, R), k2 = related(f1, m1, R), f2 = k2[0], m2 = k2[1];
      var secs = [], ok = true, cols = [];
      [[f1, m1], [f2, m2]].forEach(function (k, si) {
        if (!ok) return;
        var chs = pick(PRG, R), vs = H.solve(k[0], k[1], chs, null, R);
        if (!vs) { ok = false; return; }
        secs.push({ key: k[0], minor: k[1], chs: chs, vs: vs, start: cols.length });
        chs.forEach(function (c, i) { cols.push({ si: si, ch: c, v: vs[i], key: k[0], minor: k[1] }); });
      });
      if (!ok || cols.length > 11) continue;
      var types = cols.map(function (c) { return typeOf(c.key, c.minor, c.ch); });
      var cand = []; types.forEach(function (ty, i) { if (ty && cols[i].ch.d !== 3) cand.push(i); });
      var interesting = cand.filter(function (i) { return cols[i].ch.sev || cols[i].ch.inv; });
      if (cand.length < 4 || interesting.length < 1) continue;
      var boxes = [pick(interesting, R)]; shuf(cand, R).forEach(function (i) { if (boxes.length < 4 && boxes.indexOf(i) < 0) boxes.push(i); });
      boxes.sort(function (a, b) { return a - b; });
      // 2 音間の 音程（ア・イ・ウ）
      var pairs = [], tries = 0;
      while (pairs.length < 3 && tries++ < 200) {
        var i1 = Math.floor(R() * cols.length), j1 = Math.floor(R() * 4), mode = pick(['h', 'm', 'x'], R), i2 = i1, j2 = j1;
        if (mode === 'h') j2 = (j1 + 1 + Math.floor(R() * 3)) % 4;
        else if (mode === 'm') { i2 = i1 + (R() < 0.5 ? 1 : -1); }
        else { i2 = i1 + (R() < 0.5 ? 1 : -1); j2 = (j1 + 1 + Math.floor(R() * 3)) % 4; }
        if (i2 < 0 || i2 >= cols.length || (i1 === i2 && j1 === j2)) continue;
        var a = cols[i1].v[j1], b = cols[i2].v[j2], iv = M.interval(a, b), deg = iv.deg;
        if (deg > 8 && (deg - 1) % 7 === 0) continue;
        if (pairs.some(function (p) { return (p.i1 === i1 && p.j1 === j1) || (p.i2 === i1 && p.j2 === j1) || (p.i1 === i2 && p.j1 === j2) || (p.i2 === i2 && p.j2 === j2); })) continue;
        if (iv.q === '?' || iv.deg === 1 && iv.q !== 'P') continue;
        var sd = ((deg - 1) % 7) + 1; if (deg === 8) sd = 8;
        pairs.push({ i1: i1, j1: j1, i2: i2, j2: j2, q: iv.q, deg: sd, comp: deg > 8, raw: iv });
      }
      if (pairs.length < 3) continue;
      return { secs: secs, cols: cols, boxes: boxes, types: types, pairs: pairs };
    }
    throw new Error('genPiece');
  }
  GK.EXAM.genPiece = genPiece;

  /* ---------- 楽譜と 目じるし ---------- */
  function drawPiece(el, P, o) {
    o = o || {};
    var f1 = P.secs[0].key, m1 = P.secs[0].minor;
    var geo = M.satb(el, { key: f1, minor: m1, color: false, names: false, zoom: 2.2, sp: 56, chords: P.cols.map(function (c) { return { v: c.v }; }) });
    var svg = geo.svg, xs = geo.xs, ns = 'http://www.w3.org/2000/svg', top = geo.y1 - 62, bot = geo.y2 + 36;
    var E = function (tag, at) { return M.svgEl(svg, tag, at); };
    xs.forEach(function (x, i) { M.svgText(svg, x + 2, top - 6, CIRC[i], { size: 13, c: '#8a8578', fixed: true }); });
    // 小節線
    for (var i = 1; i < xs.length; i++) { var bx = (xs[i - 1] + xs[i]) / 2 + 3; E('line', { x1: bx, y1: geo.y1 - 40, x2: bx, y2: geo.y1 + 0, stroke: 'currentColor', 'stroke-width': 1 }); E('line', { x1: bx, y1: geo.y2 - 40, x2: bx, y2: geo.y2, stroke: 'currentColor', 'stroke-width': 1 }); }
    // 和音の 点線の 枠
    P.boxes.forEach(function (ci, q) {
      var x = xs[ci] + 2; E('rect', { x: x - 24, y: top + 6, width: 48, height: bot - top - 4, rx: 6, fill: 'none', stroke: '#2d6fb0', 'stroke-width': 1.8, 'stroke-dasharray': '5 4' });
      E('circle', { cx: x, cy: top + 6, r: 10, fill: '#fff', stroke: '#2d6fb0', 'stroke-width': 1.5 }); M.svgText(svg, x, top + 11, LET[q], { size: 13, c: '#2d6fb0', fixed: true });
    });
    // 部分（調）の かっこ
    P.secs.forEach(function (sc, si) {
      var a = xs[sc.start] - 24, b = xs[sc.start + sc.chs.length - 1] + 28, y = bot + 14;
      E('path', { d: 'M' + a + ' ' + (y - 8) + ' V' + y + ' H' + b + ' V' + (y - 8), fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 });
      var mx = (a + b) / 2; E('rect', { x: mx - 11, y: y - 10, width: 22, height: 20, fill: 'var(--panel, #fff)', stroke: 'currentColor', 'stroke-width': 1.3 }); M.svgText(svg, mx, y + 5, 'AB'.charAt(si), { size: 14, c: 'currentColor', fixed: true });
    });
    // 2 音の 目じるし
    P.pairs.forEach(function (p, q) {
      [[p.i1, p.j1, JA[q]], [p.i2, p.j2, JA[q] + '′']].forEach(function (z) {
        var n = geo.notes[z[1]][z[0]]; if (!n || !n.getYs) return; var cx = n.getAbsoluteX() + 6, cy = n.getYs()[0];
        E('ellipse', { cx: cx, cy: cy, rx: 12, ry: 9.5, fill: 'none', stroke: '#c0392b', 'stroke-width': 2.2 });
        M.svgText(svg, cx + (z[1] % 2 === 0 ? 18 : -18), cy - 12 + (z[1] % 2 === 0 ? 0 : 26), z[2], { size: 14, c: '#c0392b', fixed: true });
      });
    });
    M.fit(svg, +svg.dataset.w, geo.y1 - 40, geo.y2 + 50);
    return geo;
  }

  /* ---------- ページ ---------- */
  var sel = function (id, opts, ph) { return '<select data-q="' + id + '"><option value="">' + (ph || '—') + '</option>' + opts.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
  var KEYOPT = (function () { var r = []; MAJK.concat([-5, 5]).forEach(function (f) { r.push([f + ',0', M.keyName(f, false)]); }); MINK.concat([-5, 5]).forEach(function (f) { r.push([f + ',1', M.keyName(f, true)]); }); return r; })();
  GK.route(/^exam\/piece$/, function () {
    V.innerHTML = '<div class="split">' + GK.EXAM.side('piece') + '<section class="panel main"><div class="mbody" id="pbody"></div></section></div>';
    run($('#pbody'));
  });
  function run(body) {
    var P = genPiece(GK.rng(Math.floor(Math.random() * 1e9))), graded = false;
    var iv = P.pairs.map(function (p, q) { return '<div class="xrow"><b>' + JA[q] + ' ─ ' + JA[q] + '′</b>' + sel('iq' + q, QUAL, '長・短・完全…') + sel('id' + q, [1, 2, 3, 4, 5, 6, 7, 8].map(function (d) { return [d, d + '度']; }), '何度') + '<span class="xfb" id="fi' + q + '"></span></div>'; }).join('');
    var ky = P.secs.map(function (s, i) { return '<div class="xrow"><b>' + 'AB'.charAt(i) + '</b>' + sel('k' + i, KEYOPT, '調名') + '<span class="xfb" id="fk' + i + '"></span></div>'; }).join('');
    var cd = P.boxes.map(function (ci, q) { return '<div class="xrow"><b>' + LET[q] + '</b>' + sel('ct' + q, CTYPES.map(function (x) { return [x[0], x[1]]; }), '種類') + sel('cd' + q, [1, 2, 3, 4, 5, 6, 7].map(function (d) { return [d, ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'][d]]; }), '和音度') + sel('ci' + q, INVN.map(function (x, i) { return [i, x]; }), '位置') + '<span class="xfb" id="fc' + q + '"></span></div>'; }).join('');
    body.innerHTML = '<div class="xw"><div class="xwh"><b>📜 課題楽曲（大譜表）</b><span>ひとつの 楽譜から 読みとる 問題</span></div>' +
      '<div class="fig sc xwpiece" id="pFig"></div>' +
      '<div class="xq"><h4>問1　赤く 囲んだ ア〜ウ の ２音間の 音程を 答えなさい。複音程は 単音程に 直して 答えること。<br><small>答えかた：左で「長・短・完全・増・減」から えらび、右で 度数。例）<b>長3度</b>・<b>完全5度</b>・<b>減7度</b></small></h4>' + iv + '</div>' +
      '<div class="xq"><h4>問2　かっこ A・B の 部分の 調名を 答えなさい。</h4>' + ky + '</div>' +
      '<div class="xq"><h4>問3　点線で 囲んだ a〜d の 和音の 種類・和音度・位置を 答えなさい。（和音度は 問2の 調で）</h4>' + cd + '</div>' +
      '<div class="xwa"><button type="button" class="btn main" id="pGo">✔ 採点する</button><button type="button" class="btn" id="pNew">🎲 べつの 楽曲</button><button type="button" class="btn" id="pPlay">🔊 聴く</button></div><div id="pRes"></div></div>';
    var geo = drawPiece($('#pFig', body), P); GK.EXAM.dbgP = P;
    $('#pPlay', body).onclick = function () { M.play(P.cols.map(function (c, i) { return [c.v.map(function (p) { return M.str(p); }), 1.4]; }), 76); };
    $('#pNew', body).onclick = function () { run(body); };
    $('#pGo', body).onclick = function () {
      if (graded) return; graded = true;
      var val = function (id) { var e = body.querySelector('[data-q="' + id + '"]'); return e ? e.value : ''; }, got = 0, tot = 0;
      var mark = function (id, ok, msg) { var e = $('#' + id, body); e.className = 'xfb ' + (ok ? 'ok' : 'ng'); e.innerHTML = (ok ? '⭕' : '✕ 正解：') + (ok ? '' : esc(msg)); tot++; if (ok) got++; };
      P.pairs.forEach(function (p, q) { var ok = val('iq' + q) === p.q && +val('id' + q) === p.deg; mark('fi' + q, ok, M.QN[p.q] + p.deg + '度' + (p.comp ? '（複音程 ' + p.raw.name + ' → 単音程）' : '')); });
      P.secs.forEach(function (s, i) { var ok = val('k' + i) === s.key + ',' + (s.minor ? 1 : 0); mark('fk' + i, ok, M.keyName(s.key, s.minor)); });
      P.boxes.forEach(function (ci, q) { var c = P.cols[ci], ty = P.types[ci], ok = val('ct' + q) === ty[0] && +val('cd' + q) === c.ch.d && +val('ci' + q) === c.ch.inv; mark('fc' + q, ok, ty[1] + '・' + ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'][c.ch.d] + '・' + INVN[c.ch.inv] + '（' + M.keyName(c.key, c.minor) + ' ' + H.label(c.ch) + '）'); });
      var pts = got + (got === tot ? 5 : 0); GK.earn(pts); var w = GK.store.get('examW', { ok: 0, sets: 0 }); w.ok += got; GK.store.set('examW', w); if (got === tot) { GK.fx('fanfare'); GK.confetti && GK.confetti(30); }
      $('#pRes', body).innerHTML = '<div class="xwr ' + (got >= tot * 0.8 ? 'ok' : 'ng') + '"><b>' + got + ' / ' + tot + ' 問 正解</b>' + (got === tot ? ' 🎉 ぜんぶ 正解！' : got >= tot * 0.8 ? '　合格ライン（8 割）です' : '　まちがいを 見なおそう') + '<p class="xwe">音程は 低い音から 数え、♯♭ で 質を あわせる。調名は 臨時記号（導音）と 和音から。和音は 構成音を 積みなおして 根音を さがす。（+' + pts + ' コイン）</p></div>';
      body.querySelectorAll('select').forEach(function (s) { s.disabled = true; });
    };
  }
})();
