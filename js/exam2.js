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
    [Ch(1), Ch(1, 1), Ch(4), Ch(5, 2, 1), Ch(1)], [Ch(1), Ch(2, 0, 1), Ch(5, 0, 1), Ch(1)], [Ch(1), Ch(4), Ch(7, 1, 1), Ch(1, 1)], [Ch(1), Ch(5, 1, 1), Ch(1), Ch(4), Ch(5), Ch(1)]
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
    xs.forEach(function (x, i) { M.svgText(svg, x + 2, top - 6, CIRC[i], { size: 13, c: '#8a8578', fixed: true, cls: 'pnum' }); });
    // 小節線
    for (var i = 1; i < xs.length; i++) { var bx = (xs[i - 1] + xs[i]) / 2 + 3; E('line', { x1: bx, y1: geo.y1 - 40, x2: bx, y2: geo.y1 + 0, stroke: 'currentColor', 'stroke-width': 1 }); E('line', { x1: bx, y1: geo.y2 - 40, x2: bx, y2: geo.y2, stroke: 'currentColor', 'stroke-width': 1 }); }
    // 和音の 点線の 枠
    var G = function (slot) { var g = M.svgEl(svg, 'g', { 'class': 'pmk', 'data-slot': slot }), f = function (tag, at) { return M.svgEl(g, tag, at); }; f.el = g; return f; };
    P.boxes.forEach(function (ci, q) {
      if (o.boxes && o.boxes.indexOf(q) < 0) return;
      var E = G('c' + q);
      var x = xs[ci] + 2; E('rect', { x: x - 24, y: top + 6, width: 48, height: bot - top - 4, fill: 'transparent', stroke: 'none', 'class': 'phit' }); E('rect', { x: x - 24, y: top + 6, width: 48, height: bot - top - 4, rx: 6, fill: 'none', stroke: '#2d6fb0', 'stroke-width': 1.8, 'stroke-dasharray': '5 4' });
      E('circle', { cx: x, cy: top + 6, r: 10, fill: 'var(--panel, #fff)', stroke: '#2d6fb0', 'stroke-width': 1.5 }); M.svgText(E.el, x, top + 11, LET[q], { size: 13, c: '#2d6fb0', fixed: true });
    });
    // 部分（調）の かっこ
    P.secs.forEach(function (sc, si) {
      if (o.secs === false) return;
      var E = G('k' + si);
      var a = xs[sc.start] - 24, b = xs[sc.start + sc.chs.length - 1] + 28, y = bot + 14;
      E('rect', { x: a, y: y - 14, width: b - a, height: 30, fill: 'transparent', stroke: 'none', 'class': 'phit' });
      E('path', { d: 'M' + a + ' ' + (y - 8) + ' V' + y + ' H' + b + ' V' + (y - 8), fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 });
      var mx = (a + b) / 2; E('rect', { x: mx - 11, y: y - 10, width: 22, height: 20, fill: 'var(--panel, #fff)', stroke: 'currentColor', 'stroke-width': 1.3 }); M.svgText(E.el, mx, y + 5, 'AB'.charAt(si), { size: 14, c: 'currentColor', fixed: true });
    });
    // 2 音の 目じるし
    P.pairs.forEach(function (p, q) {
      if (o.pairs && o.pairs.indexOf(q) < 0) return;
      var E = G('i' + q);
      [[p.i1, p.j1, JA[q]], [p.i2, p.j2, JA[q] + '′']].forEach(function (z) {
        var n = geo.notes[z[1]][z[0]]; if (!n || !n.getYs) return; var cx = n.getAbsoluteX() + 6, cy = n.getYs()[0];
        E('circle', { cx: cx, cy: cy, r: 17, fill: 'transparent', stroke: 'none', 'class': 'phit' });
        E('ellipse', { cx: cx, cy: cy, rx: 12, ry: 9.5, fill: 'none', stroke: '#c0392b', 'stroke-width': 2.2 });
        M.svgText(E.el, cx + (z[1] % 2 === 0 ? 18 : -18), cy - 12 + (z[1] % 2 === 0 ? 0 : 26), z[2], { size: 14, c: '#c0392b', fixed: true });
      });
    });
    M.fit(svg, +svg.dataset.w, geo.y1 - 40, geo.y2 + 50);
    return geo;
  }

  /* ---------- ページ ---------- */
  GK.route(/^exam\/piece$/, function () {
    V.innerHTML = '<div class="split">' + GK.EXAM.side('piece') + '<section class="panel main"><div class="mbody" id="pbody"></div></section></div>';
    run($('#pbody'));
  });

  /* ---------- クラス対戦・演習で つかう 4 択の 入試形式（楽譜を 読む） ---------- */
  var F = GK.F, U = GK.Q.util, tx = U.tx, mc = U.mc, add = U.add;
  GK.UNIT.x01 = { id: 'x01', no: 'X1', title: '入試形式（大譜表）', en: 'Exam Score', sym: '🎓', grp: 'exam', goal: '', types: ['pieceIv', 'pieceKey', 'pieceChord'] };
  F.CUSTOM.piece = function (box, a) {
    var geo = drawPiece(box, a.P, a.o);
    // スマホでは 小さく なりすぎるので 横スクロールに（目じるしの ある ところを 見せる）
    if (geo && window.innerWidth < 640) {
      var svg = geo.svg, vb = svg.viewBox.baseVal, cw = box.clientWidth || 340, s = 0.9;
      if (vb.width * s > cw) {
        box.style.cssText += ';overflow-x:auto;overflow-y:hidden;justify-content:flex-start;display:block;-webkit-overflow-scrolling:touch';
        svg.style.width = Math.round(vb.width * s) + 'px'; svg.style.maxWidth = 'none'; svg.style.height = Math.round(vb.height * s) + 'px';
        var mk = svg.querySelector('.pmk'); if (mk) { var bb = mk.getBBox(); box.scrollLeft = Math.max(0, (bb.x - vb.x + bb.width / 2) * s - cw / 2); }
        var hint = document.createElement('div'); hint.className = 'cap'; hint.textContent = '← 横に スクロール できます →'; box.parentNode.appendChild(hint);
      }
    }
  };
  var pf = function (P, o) { return { c: 'piece', a: { P: P, o: o } }; };
  var ROM = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'];
  add('pieceIv', 'x01', 2, function (R) {
    var P = genPiece(R), q = Math.floor(R() * 3), p = P.pairs[q], right = M.QN[p.q] + p.deg + '度', wr = [];
    var opts = [['P', 4], ['P', 5], ['M', 3], ['m', 3], ['M', 6], ['m', 6], ['M', 2], ['m', 7], ['A', 4], ['d', 5], ['M', 7], ['m', 2], ['d', 7], ['A', 2]];
    shuf(opts, R).forEach(function (o) { var t = M.QN[o[0]] + o[1] + '度'; if (t !== right && wr.length < 5) wr.push(t); });
    var near = M.QN[p.q === 'M' ? 'm' : p.q === 'm' ? 'M' : p.q === 'P' ? 'A' : 'd'] + p.deg + '度'; if (near !== right && wr.indexOf(near) < 0) wr[0] = near;
    var m = mc(R, tx(right), wr.map(function (t) { return tx(t); }), 4);
    return { q: '赤く 囲んだ <b>' + JA[q] + ' と ' + JA[q] + '′</b> の ２音間の 音程は？（複音程は 単音程に）', fig: pf(P, { pairs: [q], boxes: [], secs: false }), ch: m.ch, a: m.a, ex: '<b>' + right + '</b>。' + (p.comp ? '複音程（' + p.raw.name + '）を 単音程に 直した 答え。' : '') + '低い音から 数え、♯♭ で 質を あわせる。', exFig: pf(P, { pairs: [q], boxes: [], secs: false }), play: [[[M.str(P.cols[p.i1].v[p.j1]), M.str(P.cols[p.i2].v[p.j2])], 1.4]] };
  });
  add('pieceKey', 'x01', 3, function (R) {
    var P = genPiece(R), si = Math.floor(R() * 2), s = P.secs[si], right = M.keyName(s.key, s.minor), wr = [];
    var cand = [[s.key, !s.minor], [s.key + 1, s.minor], [s.key - 1, s.minor], [s.key + 2, s.minor], [s.key - 2, s.minor], [s.key + 1, !s.minor], [s.key - 1, !s.minor], [P.secs[1 - si].key, P.secs[1 - si].minor]];
    cand.forEach(function (c) { var n = M.keyName(c[0], c[1]); if (n !== right && wr.indexOf(n) < 0 && Math.abs(c[0]) <= 7 && wr.length < 6) wr.push(n); });
    var m = mc(R, tx(right), wr.map(function (t) { return tx(t); }), 4);
    return { q: 'かっこ <b>' + 'AB'.charAt(si) + '</b> の 部分の 調名は？', fig: pf(P, { pairs: [], boxes: [], secs: true }), ch: m.ch, a: m.a, ex: '<b>' + right + '</b>。臨時記号（導音の ♯・♮）と、はじめと 終わりの 和音（Ⅰ）から 判断する。', exFig: pf(P, { pairs: [], boxes: [], secs: true }) };
  });
  add('pieceChord', 'x01', 3, function (R) {
    var P = genPiece(R), q = Math.floor(R() * P.boxes.length), ci = P.boxes[q], c = P.cols[ci], ty = P.types[ci], d = c.ch.d, inv = c.ch.inv;
    var lab = function (t, dd, ii) { return t + '・' + ROM[dd] + '・' + INVN[ii]; }, right = lab(ty[1], d, inv), wr = [];
    var same = CTYPES.filter(function (x) { return (x[0].indexOf('7') >= 0) === (ty[0].indexOf('7') >= 0) && x[0] !== ty[0]; });
    [lab(pick(same, R)[1], d, inv), lab(ty[1], d, (inv + 1) % (ty[0].indexOf('7') >= 0 ? 4 : 3)), lab(ty[1], d % 7 + 1, inv), lab(pick(same, R)[1], d, (inv + 2) % (ty[0].indexOf('7') >= 0 ? 4 : 3)), lab(ty[1], (d + 2) % 7 + 1, inv), lab(ty[1], d, (inv + 2) % (ty[0].indexOf('7') >= 0 ? 4 : 3))].forEach(function (t) { if (t !== right && wr.indexOf(t) < 0) wr.push(t); });
    var m = mc(R, tx(right), wr.slice(0, 5).map(function (t) { return tx(t); }), 4);
    return { q: '点線で 囲んだ 和音 <b>' + LET[q] + '</b> の 種類・和音度・位置は？（和音度は その 部分の 調 ＝ ' + M.keyName(c.key, c.minor) + ' で）', fig: pf(P, { pairs: [], boxes: [q], secs: true }), ch: m.ch, a: m.a, ex: '<b>' + right + '</b>（' + M.keyName(c.key, c.minor) + ' の ' + H.label(c.ch) + '）。いちばん 下の 音（バス）で 位置、積み上げた 形で 種類を きめる。', exFig: pf(P, { pairs: [], boxes: [q], secs: true }), play: [[c.v.map(function (p) { return M.str(p); }), 2]] };
  });
  Object.assign(GK.TYPE_NAME, { pieceIv: '楽譜の 2音の 音程', pieceKey: '楽譜の 調名', pieceChord: '楽譜の 和音' });

  /* ---------- 課題楽曲ページ：答えは タップで 選ぶ ---------- */
  var INVS = ['基本', '第1転回', '第2転回', '第3転回'];
  var KEYF = [0, 1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
  function run(body) {
    var P = genPiece(GK.rng(Math.floor(Math.random() * 1e9))), graded = false, ans = {}, cur = 'i0', timer = 0;
    var slots = [];
    P.pairs.forEach(function (p, q) { slots.push({ id: 'i' + q, g: 1, lab: JA[q], kind: 'iv', p: p, need: ['q', 'd'] }); });
    P.secs.forEach(function (s, i) { slots.push({ id: 'k' + i, g: 2, lab: 'AB'.charAt(i), kind: 'key', s: s, need: ['k'] }); });
    P.boxes.forEach(function (ci, q) { slots.push({ id: 'c' + q, g: 3, lab: LET[q], kind: 'ch', ci: ci, c: P.cols[ci], ty: P.types[ci], need: ['t', 'd', 'i'] }); });
    var S = function (id) { return slots.filter(function (x) { return x.id === id; })[0]; };
    var A = function (id) { return ans[id] || (ans[id] = {}); };
    var done = function (sl) { var a = A(sl.id); return sl.need.every(function (k) { return a[k] !== undefined; }); };
    var right = function (sl) {
      if (sl.kind === 'iv') return { q: sl.p.q, d: sl.p.deg };
      if (sl.kind === 'key') return { k: sl.s.key + ',' + (sl.s.minor ? 1 : 0) };
      return { t: sl.ty[0], d: sl.c.ch.d, i: sl.c.ch.inv };
    };
    var isOk = function (sl) { var r = right(sl), a = A(sl.id); return sl.need.every(function (k) { return String(a[k]) === String(r[k]); }); };
    var qn = function (q) { var h = QUAL.filter(function (x) { return x[0] === q; })[0]; return h ? h[1] : '？'; };
    var tyn = function (t) { var h = CTYPES.filter(function (x) { return x[0] === t; })[0]; return h ? h[1].replace('の和音', '') : '？'; };
    var kn = function (k) { if (k === undefined) return '？'; var z = String(k).split(','); return M.keyName(+z[0], z[1] === '1'); };
    var sum = function (sl, a) {
      if (sl.kind === 'iv') return (a.q !== undefined ? qn(a.q) : '？') + (a.d !== undefined ? a.d : '？') + '度';
      if (sl.kind === 'key') return kn(a.k);
      return (a.t !== undefined ? tyn(a.t) : '？') + '・' + (a.d !== undefined ? ROM[a.d] : '？') + '・' + (a.i !== undefined ? INVS[a.i] : '？');
    };
    var rightText = function (sl) {
      if (sl.kind === 'iv') return M.QN[sl.p.q] + sl.p.deg + '度' + (sl.p.comp ? '（複音程 ' + sl.p.raw.name + ' を 単音程に）' : '');
      if (sl.kind === 'key') return M.keyName(sl.s.key, sl.s.minor);
      return sl.ty[1] + '・' + ROM[sl.c.ch.d] + '・' + INVN[sl.c.ch.inv] + '（' + M.keyName(sl.c.key, sl.c.minor) + ' の ' + H.label(sl.c.ch) + '）';
    };

    body.innerHTML = '<div class="xw xp xpone"><div class="xpl"><div class="fig sc xwpiece" id="pFig"></div></div><div class="xpr">' +
      '<div class="xpstrip"><button type="button" class="xpa" data-mv="-1" aria-label="まえ">◀</button><div class="xpdots" id="pSlots"></div><button type="button" class="xpa" data-mv="1" aria-label="つぎ">▶</button></div>' +
      '<div class="xppad" id="pPad"></div>' +
      '<div class="xpact"><button type="button" class="btn main" id="pGo"></button><button type="button" class="btn" id="pPlay">🔊 全体</button><button type="button" class="btn" id="pNew">🎲 べつの曲</button></div><div id="pRes"></div></div></div>';
    var fig = $('#pFig', body); drawPiece(fig, P); GK.EXAM.dbgP = P;
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
    function row(t, html) { return '<div class="xprow">' + (t ? '<span class="xprl">' + t + '</span>' : '') + html + '</div>'; }
    function drawSlots() {
      $('#pSlots', body).innerHTML = [1, 2, 3].map(function (g) {
        return '<span class="xpgrp">' + slots.filter(function (x) { return x.g === g; }).map(function (sl) {
          var c = 'xpd' + (sl.id === cur ? ' cur' : '') + (done(sl) ? ' fill' : '') + (graded ? (isOk(sl) ? ' ok' : ' ng') : '');
          return '<button type="button" class="' + c + '" data-s="' + sl.id + '">' + sl.lab + '</button>';
        }).join('') + '</span>';
      }).join('');
      var left = slots.filter(function (x) { return !done(x); }).length;
      var go = $('#pGo', body); go.textContent = graded ? '採点ずみ' : left ? '✔ 採点（あと ' + left + '）' : '✔ 採点する'; go.disabled = graded;
    }
    function head(no, t, sub) { return '<div class="xpph"><span class="xpq">' + no + '</span><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '<button type="button" class="xph" id="pHear" aria-label="聴く">🔊</button></div>'; }
    function drawPad() {
      var sl = S(cur), h = '';
      if (sl.kind === 'iv') {
        h = head('問1', sl.lab + ' と ' + sl.lab + '′ の 音程', '複音程は 単音程で') +
          row('', chips(sl, 'q', QUAL.slice(0, 5))) + row('', chips(sl, 'd', [1, 2, 3, 4, 5, 6, 7, 8].map(function (d) { return [d, d + '度']; }), 'n8'));
      } else if (sl.kind === 'key') {
        var nm = function (m) { return KEYF.map(function (f) { return [f + ',' + m, M.keyName(f, !!m).replace(/[長短]調$/, '')]; }); };
        var a0 = A(sl.id), md = a0.m !== undefined ? a0.m : a0.k !== undefined ? +String(a0.k).split(',')[1] : 0;
        if (graded) md = sl.s.minor ? 1 : 0;
        h = head('問2', sl.lab + ' の 調名', '') + '<div class="xpmode">' + ['長調', '短調'].map(function (t, m) { return '<button type="button" class="' + (m === md ? 'on' : '') + '" data-m="' + m + '"' + (graded ? ' disabled' : '') + '>' + t + '</button>'; }).join('') + '</div>' + row('', chips(sl, 'k', nm(md), 'kk'));
      } else {
        h = head('問3', '和音 ' + sl.lab, '和音度は 問2 の 調で') +
          row('', chips(sl, 't', CTYPES.map(function (x) { return [x[0], x[1].replace('の和音', '')]; }))) +
          row('', chips(sl, 'd', [1, 2, 3, 4, 5, 6, 7].map(function (d) { return [d, ROM[d]]; }), 'n7')) +
          row('', chips(sl, 'i', INVS.map(function (x, i) { return [i, x]; })));
      }
      if (graded) h += '<div class="xfb ' + (isOk(sl) ? 'ok">⭕ 正解' : 'ng">✕ 正解は ' + esc(rightText(sl))) + '</div>';
      $('#pPad', body).innerHTML = h;
      $('#pPad', body).querySelectorAll('.xc').forEach(function (b) { b.onclick = function () { choose(b.getAttribute('data-k'), b.getAttribute('data-v')); }; });
      $('#pHear', body).onclick = function () { hear(sl); };
      $('#pPad', body).querySelectorAll('.xpmode button').forEach(function (b) { b.onclick = function () { A(sl.id).m = +b.getAttribute('data-m'); drawPad(); }; });
    }
    function hear(sl) {
      if (sl.kind === 'iv') M.play([[[M.str(P.cols[sl.p.i1].v[sl.p.j1]), M.str(P.cols[sl.p.i2].v[sl.p.j2])], 1.6]]);
      else if (sl.kind === 'ch') M.play([[sl.c.v.map(function (p) { return M.str(p); }), 2]]);
      else M.play(sl.s.vs.map(function (v) { return [v.map(function (p) { return M.str(p); }), 1.2]; }), 80);
    }
    function mark() {
      var sl0 = S(cur), sec = sl0.kind === 'ch' ? 'k' + sl0.c.si : '';
      svg.querySelectorAll('.pmk').forEach(function (g) { var d = g.getAttribute('data-slot'); g.classList.toggle('on', d === cur); g.classList.toggle('on2', d === sec); });
      var g = svg.querySelector('.pmk.on');
      if (g && fig.scrollWidth > fig.clientWidth) { var r = g.getBoundingClientRect(), fr = fig.getBoundingClientRect(); if (r.left < fr.left + 20 || r.right > fr.right - 20) fig.scrollLeft += (r.left + r.width / 2) - (fr.left + fr.width / 2); }
    }
    function pickSlot(id) { clearTimeout(timer); cur = id; drawSlots(); drawPad(); mark(); }
    function choose(k, v) {
      if (graded) return;
      var sl = S(cur), a = A(cur), was = done(sl);
      a[k] = v; GK.fx && GK.fx('tap');
      drawSlots(); drawPad();
      if (!was && done(sl)) {
        var ix = slots.indexOf(sl), nx = null;
        for (var t = 1; t < slots.length; t++) { var c = slots[(ix + t) % slots.length]; if (!done(c)) { nx = c; break; } }
        if (nx) timer = setTimeout(function () { pickSlot(nx.id); }, 350);
      }
    }
    $('#pSlots', body).addEventListener('click', function (e) { var b = e.target.closest('.xpd'); if (b) pickSlot(b.getAttribute('data-s')); });
    body.querySelectorAll('.xpa').forEach(function (b) { b.onclick = function () { var ix = slots.indexOf(S(cur)); pickSlot(slots[(ix + slots.length + (+b.getAttribute('data-mv'))) % slots.length].id); }; });
    $('#pPlay', body).onclick = function () { M.play(P.cols.map(function (c) { return [c.v.map(function (p) { return M.str(p); }), 1.4]; }), 76); };
    $('#pNew', body).onclick = function () { run(body); };
    $('#pGo', body).onclick = function () {
      if (graded) return; graded = true; clearTimeout(timer);
      var got = slots.filter(isOk).length, tot = slots.length;
      var pts = got + (got === tot ? 5 : 0); GK.earn(pts); var w = GK.store.get('examW', { ok: 0, sets: 0 }); w.ok += got; GK.store.set('examW', w); if (got === tot) { GK.fx('fanfare'); GK.confetti && GK.confetti(30); }
      var bad = slots.filter(function (x) { return !isOk(x); });
      $('#pRes', body).innerHTML = '<div class="xpres ' + (got >= tot * 0.8 ? 'ok' : 'ng') + '"><b>' + got + ' / ' + tot + ' 正解</b>' + (got === tot ? '🎉 ぜんぶ 正解！' : '<span>赤い 丸を タップで 答えを 確認</span>') + '<span>+' + pts + ' コイン</span></div>';
      pickSlot(bad.length ? bad[0].id : cur);
    };
    pickSlot(cur);
  }
})();
