/* =========================================================
   楽典ラボ：応用（音大入試 形式）── 五線に 書いて 採点する「記譜問題」
   音階を書く／音程を書く／和音を書く／移調して書く
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, $ = GK.$, esc = GK.esc, V = GK.view;
  var VF = function () { return window.Vex && Vex.Flow; };
  var N = function (p) { return GK.nm(p); };
  var mid = function (p) { return M.midi(p); };
  var ACCC = { '-2': 'bb', '-1': 'b', '0': 'n', '1': '#', '2': '##' };
  var same = function (a, b) { return a.l === b.l && a.a === b.a; };
  var JP = function (p) { return M.name(p, 'jp'); };
  function pick(a, R) { return a[Math.floor(R() * a.length)]; }
  function ri(a, b, R) { return a + Math.floor(R() * (b - a + 1)); }

  /* ---------- 五線に 書きこむ 部品 ----------
     spec = { clef, key, given: [音…], slots: n, mode: 'seq'|'chord', vals: [音|null …]（chord は 音の 配列）, colors: [色…], zoom } */
  M.writeStaff = function (el, spec) {
    var Vx = VF(); el.innerHTML = '';
    if (!Vx) { el.textContent = '（楽譜の部品を読みこめませんでした）'; return null; }
    var key = spec.key || 0, clef = spec.clef || 'treble', given = spec.given || [], n = spec.slots, chord = spec.mode === 'chord', sp = spec.sp || 54, top = 6;
    var cnt = given.length + (chord ? 1 : n);
    var probe = new Vx.Stave(0, 0, 400); probe.addClef(clef); if (key) probe.addKeySignature(M.keyVF(key, false)); probe.format && probe.format();
    var x0 = 4, first = probe.getNoteStartX(), W = Math.round(x0 + first + cnt * sp + 30), Hh = top + 40 + 40 + 56;
    var r = new Vx.Renderer(el, Vx.Renderer.Backends.SVG); r.resize(W, Hh);
    var ctx = r.getContext(); ctx.setFillStyle('currentColor'); ctx.setStrokeStyle('currentColor');
    var svg = el.querySelector('svg'), st = new Vx.Stave(x0, top, W - x0 - 4);
    st.addClef(clef); if (key) st.addKeySignature(M.keyVF(key, false)); st.setEndBarType(Vx.Barline.type.END); st.setContext(ctx).draw();
    var keyAcc = M.keyAcc(key), state = {};
    var accOf = function (p) { var k = p.l + ':' + p.o; return k in state ? state[k] : (keyAcc[p.l] || 0); };
    var mkNote = function (ps, col) {
      ps = ps.slice().sort(function (a, b) { return mid(a) - mid(b); });
      var s = new Vx.StaveNote({ clef: clef, keys: ps.map(function (p) { return M.vf(p); }), duration: 'w' });
      ps.forEach(function (p, i) { if (accOf(p) !== p.a) s.addModifier(new Vx.Accidental(ACCC[p.a]), i); state[p.l + ':' + p.o] = p.a; });
      if (col) s.setStyle({ fillStyle: col, strokeStyle: col });
      return s;
    };
    var notes = [], slotIdx = [];
    given.forEach(function (p) { notes.push(mkNote([p], spec.givenColor || null)); });
    for (var i = 0; i < (chord ? 1 : n); i++) {
      var v = (spec.vals || [])[i], col = (spec.colors || [])[i] || null;
      var ps = chord ? (spec.vals || []) : (v ? [v] : []);
      slotIdx.push(notes.length);
      notes.push(ps.length ? mkNote(ps, col) : new Vx.GhostNote('w'));
    }
    var voice = new Vx.Voice({ num_beats: notes.length * 4, beat_value: 4 }).setMode(Vx.Voice.Mode.SOFT).addTickables(notes);
    new Vx.Formatter().joinVoices([voice]).format([voice], Math.max(40, st.getNoteEndX() - first - 8), { align_rests: false });
    voice.draw(ctx, st);
    svg.querySelectorAll('[fill="black"],[fill="#000"],[fill="#000000"]').forEach(function (e) { e.setAttribute('fill', 'currentColor'); });
    svg.querySelectorAll('[stroke="black"],[stroke="#000"],[stroke="#000000"]').forEach(function (e) { e.setAttribute('stroke', 'currentColor'); });
    var xs = slotIdx.map(function (k) { return notes[k].getAbsoluteX() + 8; });
    // 空の 場所には うすい 目じるし
    slotIdx.forEach(function (k, q) { var empty = chord ? !(spec.vals || []).length : !(spec.vals || [])[q]; if (empty) M.svgEl(svg, 'rect', { x: xs[q] - 12, y: top + 40 + 4, width: 24, height: 32, rx: 6, fill: 'none', stroke: '#9a9486', 'stroke-width': 1.5, 'stroke-dasharray': '4 3', opacity: .7 }); });
    // 順番の 数字（音階など）
    if (spec.numbers) xs.forEach(function (x, q) { M.svgText(svg, x, top + 120, String(q + 1), { size: 12, c: '#9a9486', fixed: true }); });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh); svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('class', 'vf');
    svg.style.width = ''; svg.style.height = ''; svg.style.maxWidth = Math.round(W * (spec.zoom || 2.2)) + 'px'; svg.dataset.w = W;
    M.fit(svg, W, top + 40, top + 80);
    return { svg: svg, xs: xs, yb: st.getYForLine(4), clef: clef };
  };

  /* =====================================================
     問題づくり
     ===================================================== */
  var KEYS_MAJ = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5], KEYS_MIN = [0, 1, -1, 2, -2, 3, -3, 4, -4];
  var SCALES = { major: '長音階', natural: '自然短音階', harmonic: '和声短音階', melodic: '旋律短音階（上行）' };
  var shiftO = function (p, d) { return { l: p.l, a: p.a, o: p.o + d }; };
  var IVL = [[2, 'M'], [2, 'm'], [3, 'M'], [3, 'm'], [4, 'P'], [4, 'A'], [5, 'P'], [5, 'd'], [6, 'M'], [6, 'm'], [7, 'M'], [7, 'm'], [8, 'P']];
  var CTYPES = ['maj', 'min', 'dim', 'aug', 'dom7', 'min7', 'hdim7', 'dim7'];

  var GEN = {
    scale: function (R) {
      var type = pick(['major', 'natural', 'harmonic', 'melodic'], R), minor = type !== 'major', f = pick(minor ? KEYS_MIN : KEYS_MAJ, R), bass = R() < 0.3, useSig = R() < 0.5;
      var tonic = M.keyTonic(f, minor); if (bass) tonic = shiftO(tonic, -2);
      var ans = M.scale(tonic, type).slice(0, 8).map(function (p) { return { l: p.l, a: p.a, o: p.o }; });
      return { cat: 'scale', clef: bass ? 'bass' : 'treble', key: useSig ? f : 0, sigNote: useSig ? '調号つき' : '調号なし', given: [], n: 8, mode: 'seq', answer: ans, numbers: true,
        q: '<b>' + M.keyName(f, minor) + '</b> の <b>' + SCALES[type] + '</b> を、主音から 1 オクターブ <b>上行</b> で 書きなさい。（' + (useSig ? '調号つき：調号に ない ♯♭ は 臨時記号で' : '調号なし：必要な ♯♭ は ぜんぶ 臨時記号で') + '）',
        ex: SCALES[type] + '：' + ans.map(N).join(' ') + (type === 'melodic' ? '（旋律短音階の 上行は 第6・第7音が 半音 上がる）' : type === 'harmonic' ? '（和声短音階は 第7音だけ 半音 上がる）' : '') };
    },
    interval: function (R) {
      var down = R() < 0.4, bass = R() < 0.25, it = pick(IVL, R), g = { l: ri(0, 6, R), a: pick([-1, 0, 0, 0, 1], R), o: bass ? (down ? 3 : 2) : (down ? 5 : 4) };
      var ans = M.up(g, it[0], it[1], down), name = M.QN[it[1]] + it[0] + '度';
      if (Math.abs(ans.a) > 1 || Math.abs(g.a) > 1) return GEN.interval(R);
      return { cat: 'interval', clef: bass ? 'bass' : 'treble', key: 0, sigNote: '', given: [g], n: 1, mode: 'seq', answer: [{ l: ans.l, a: ans.a, o: ans.o }],
        q: '<b>' + JP(g) + '</b>（' + N(g) + '）の <b>' + (down ? '下' : '上') + '</b> に <b>' + name + '</b> の 音を 書きなさい。',
        ex: JP(g) + ' の ' + (down ? '下' : '上') + ' ' + name + ' は <b>' + JP(ans) + '</b>（' + N(ans) + '）。度数で 音名の 文字を きめ（' + it[0] + '度 ' + (down ? '下' : '上') + '）、♯♭ で 音程の 質を あわせる。' };
    },
    chord: function (R) {
      var kind = pick(['type', 'type', 'key', 'inv'], R), bass = R() < 0.2;
      if (kind === 'key') {
        var minor = R() < 0.4, f = pick(minor ? KEYS_MIN : KEYS_MAJ, R), d = pick([5, 5, 2, 7, 1, 4], R), sev = d === 5 || d === 2 || d === 7 || R() < 0.4, pcs = M.diatonic(f, minor, d, sev).map(function (p) { return { l: p.l, a: p.a, o: p.o }; });
        if (pcs[0].o < 4) pcs = pcs.map(function (p) { return shiftO(p, 1); }); if (bass) pcs = pcs.map(function (p) { return shiftO(p, -2); });
        var lab = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'][d] + (sev ? '₇' : '');
        return { cat: 'chord', clef: bass ? 'bass' : 'treble', key: 0, sigNote: '', given: [], n: pcs.length, mode: 'chord', answer: pcs, bassNote: pcs[0],
          q: '<b>' + M.keyName(f, minor) + '</b> の <b>' + lab + '</b>（' + (sev ? '七の和音' : '三和音') + '）を <b>基本形</b> で 書きなさい。（調号は 使わず ♯♭ は ぜんぶ 臨時記号で。声部は 1 つの 和音として 下から 積む）', ex: lab + ' ＝ ' + pcs.map(N).join('・') + '（' + pcs.map(JP).join('・') + '）。' };
      }
      var type = pick(CTYPES, R), root = { l: ri(0, 6, R), a: pick([-1, 0, 0, 1], R), o: bass ? 2 : 4 }, notes = M.chord(root, type), inv = kind === 'inv' && notes.length >= 3 ? ri(1, notes.length - 1, R) : 0;
      if (notes.some(function (p) { return Math.abs(p.a) > 2; })) return GEN.chord(R);
      var ans = M.inv(notes, inv), invName = inv === 0 ? '基本形' : notes.length === 3 ? ['', '第1転回形', '第2転回形'][inv] : ['', '第1転回形', '第2転回形', '第3転回形'][inv];
      var ansN = ans.map(function (p) { return { l: p.l, a: p.a, o: p.o }; });
      return { cat: 'chord', clef: bass ? 'bass' : 'treble', key: 0, sigNote: '', given: [root], n: ansN.length, mode: 'chord', answer: ansN, bassNote: ansN[0],
        q: '<b>' + JP(root) + '</b>（' + N(root) + '）を <b>根音</b> とする <b>' + M.CH_JP[type] + '</b> を <b>' + invName + '</b> で 書きなさい。（根音は 左に 示してある）', ex: M.CH_JP[type] + '：' + notes.map(N).join('・') + '。' + invName + ' なので いちばん 下の 音（バス）は <b>' + N(ansN[0]) + '</b>。' };
    },
    trans: function (R) {
      var f = pick([0, 1, -1, 2, -2], R), sc = M.scale(M.keyTonic(f, false), 'major'), idx = [0, 2, 4, 3, 1, 0].slice(0, ri(4, 6, R)), src = idx.map(function (i) { return { l: sc[i].l, a: sc[i].a, o: sc[i].o }; });
      var it = pick([[2, 'M'], [3, 'M'], [3, 'm'], [4, 'P'], [5, 'P'], [2, 'm']], R), down = R() < 0.35, name = M.QN[it[1]] + it[0] + '度';
      if (down) src = src.map(function (p) { return shiftO(p, 1); });
      var ans = src.map(function (p) { var q = M.up(p, it[0], it[1], down); return { l: q.l, a: q.a, o: q.o }; });
      if (ans.some(function (p) { return Math.abs(p.a) > 1; })) return GEN.trans(R);
      return { cat: 'trans', clef: 'treble', key: 0, sigNote: '', given: [], n: ans.length, mode: 'seq', answer: ans, numbers: true, showSrc: src,
        q: '上の メロディー（' + M.keyName(f, false) + '）を <b>' + name + ' ' + (down ? '下' : '上') + '</b> に <b>移調</b> して 書きなさい。（調号は 使わず ♯♭ は 臨時記号で）', ex: '移調は 全部の 音を 同じ 音程だけ 動かす。' + src.map(N).join(' ') + ' → <b>' + ans.map(N).join(' ') + '</b>。' };
    }
  };
  var CATS = [['scale', '🎼 音階を 書く', '長・短音階（和声・旋律）'], ['interval', '↕ 音程を 書く', '上・下の 度数と 質'], ['chord', '🎹 和音を 書く', '三和音・七の和音・転回形'], ['trans', '🔀 移調して 書く', 'メロディーを 移調'], ['mix', '🎓 ぜんぶ まぜる', '入試ふうの 総合']];

  GK.EXAM = { GEN: GEN };
  /* ---------- 採点 ---------- */
  function grade(q, vals) {
    var marks = [], ok;
    if (q.mode === 'seq') {
      marks = q.answer.map(function (a, i) { var v = vals[i]; return !!v && v.l === a.l && v.a === a.a && v.o === a.o; });
      ok = marks.every(Boolean);
    } else {
      var have = (vals || []).slice().sort(function (a, b) { return mid(a) - mid(b); }), exp = q.answer.slice().sort(function (a, b) { return mid(a) - mid(b); });
      var pcOk = have.length === exp.length && exp.every(function (e) { return have.some(function (h) { return same(h, e); }); }) && have.every(function (h) { return exp.some(function (e) { return same(h, e); }); });
      var bassOk = have.length && same(have[0], q.bassNote);
      ok = pcOk && bassOk; marks = [ok];
      q.why = !have.length ? '音が 書かれていません。' : !pcOk ? '和音の 構成音が ちがいます（音名と ♯♭ を たしかめよう）。' : !bassOk ? '転回形が ちがいます（いちばん 下の 音が ちがう）。' : '';
    }
    return { ok: ok, marks: marks };
  }

  GK.EXAM.grade = grade;
  GK.EXAM.side = function (active) {
    return '<aside class="panel side"><h3>🎓 応用（入試形式）</h3>' +
      '<p class="note" style="padding:0 10px 6px">音大入試の 楽典のように、<b>五線に 書く</b> 問題と、<b>実際の 楽譜を 読んで 答える</b> 問題です。</p>' +
      '<button type="button" class="it" data-go="#exam/piece" aria-current="' + (active === 'piece') + '"><b>📜 課題楽曲（大譜表）</b><small>音程・調名・和音を 楽譜から 読みとる</small></button>' +
      CATS.map(function (c) { return '<button type="button" class="it" data-go="#exam/write/' + c[0] + '" aria-current="' + (active === c[0]) + '"><b>' + c[1] + '</b><small>' + c[2] + '</small></button>'; }).join('') +
      '<button type="button" class="it" data-go="#exam/mock"><b>📝 選択式 ★3 模擬</b><small>20 問・★3 だけ</small></button>' +
      '<button type="button" class="it" data-go="#drill"><b>◀ 演習へ もどる</b></button>' +
      '<p class="note" style="padding:6px 10px">書いた 問題 正解 <b>' + (GK.store.get('examW', { ok: 0 }).ok) + '</b> 問</p></aside>';
  };
  /* =====================================================
     ページ（#exam, #exam/write/<cat>）
     ===================================================== */
  var S = { cat: 'mix', round: null };
  GK.route(/^exam(?:\/write(?:\/(scale|interval|chord|trans|mix))?)?$/, function (m) {
    if (m[1]) S.cat = m[1];
    V.innerHTML = '<div class="split">' + GK.EXAM.side(S.cat) + '<section class="panel main"><div class="mbody" id="xbody"></div></section></div>';
    start($('#xbody'));
  });
  GK.route(/^exam\/mock$/, function () {
    GK.go('#drill/mock');
  });

  function start(body) {
    var R = GK.rng(Math.floor(Math.random() * 1e9)), cat = S.cat, qs = [];
    for (var i = 0; i < 5; i++) { var c = cat === 'mix' ? pick(['scale', 'interval', 'chord', 'trans', 'scale'], R) : cat; qs.push(GEN[c](R)); }
    var st = { qs: qs, i: 0, ok: 0, results: [] };
    show(body, st);
  }
  function show(body, st) {
    var q = st.qs[st.i], vals = q.mode === 'chord' ? [] : q.answer.map(function () { return null; }), acc = null, erase = false, graded = false, geo = null;
    body.innerHTML = '<div class="xw"><div class="xwh"><b>第 ' + (st.i + 1) + ' 問 / ' + st.qs.length + '</b><span>' + (q.sigNote || '') + '</span></div><p class="xwq">' + q.q + '</p>' +
      (q.showSrc ? '<div class="fig sc xwsrc" id="xSrc"></div>' : '') +
      '<div class="fig sc hstaff xwst" id="xStaff"></div>' +
      '<div class="hzacc xwacc" id="xAcc"></div><div class="xwa"><button type="button" class="btn" id="xGo">✔ 採点する</button><button type="button" class="btn" id="xClr">↺ けす</button><button type="button" class="btn" id="xPlay">🔊 聴く</button></div><div id="xRes"></div></div>';
    if (q.showSrc) M.writeStaff($('#xSrc', body), { clef: q.clef, key: 0, given: [], slots: q.showSrc.length, mode: 'seq', vals: q.showSrc, zoom: 1.7, sp: 44 });
    var box = $('#xStaff', body); box.style.touchAction = 'none';
    function draw(colors) { geo = M.writeStaff(box, { clef: q.clef, key: q.key, given: q.given, givenColor: '#2d6fb0', slots: q.n, mode: q.mode, vals: q.mode === 'chord' ? vals : vals, colors: colors, numbers: q.numbers, zoom: 2.3, sp: q.mode === 'chord' ? 90 : 52 });
      $('#xAcc', body).innerHTML = graded ? '' : '<span>♯♭</span>' + [[null, '自動'], [-2, '𝄫'], [-1, '♭'], [0, '♮'], [1, '♯'], [2, '𝄪']].map(function (a) { return '<button type="button" data-ac="' + (a[0] == null ? '' : a[0]) + '" aria-pressed="' + (!erase && acc === a[0]) + '">' + a[1] + '</button>'; }).join('') + '<button type="button" data-er="1" aria-pressed="' + erase + '">🧹 消す</button><small>' + (q.key ? '（自動 ＝ 調号どおり）' : '（自動 ＝ ♯♭ なし）') + '</small>'; }
    draw(); GK.EXAM.dbg = function () { return { q: q, geo: geo }; };
    $('#xAcc', body).addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.dataset.er) erase = !erase; else { acc = b.dataset.ac === '' ? null : +b.dataset.ac; erase = false; } draw(); });
    box.addEventListener('pointerdown', function (e) {
      if (graded || !geo) return; e.preventDefault();
      var pt = M.svgPt(geo.svg, e), dn = M.yToDiatonic(pt.y, geo.yb, geo.clef), a = acc != null ? acc : (M.keyAcc(q.key)[dn.l] || 0), p = { l: dn.l, a: a, o: dn.o };
      if (mid(p) < 28 || mid(p) > 96) return;
      if (q.mode === 'chord') {
        var k = -1; vals.forEach(function (v, i) { if (v.l === dn.l && v.o === dn.o) k = i; });
        if (erase || (k >= 0 && acc == null && same(vals[k], p))) { if (k >= 0) vals.splice(k, 1); } else if (k >= 0) vals[k] = p; else if (vals.length < 5) vals.push(p);
      } else {
        var si = 0, bd = 1e9; geo.xs.forEach(function (x, q2) { if (Math.abs(x - pt.x) < bd) { bd = Math.abs(x - pt.x); si = q2; } });
        if (erase) vals[si] = null; else vals[si] = p;
      }
      acc = null; M.play([[M.str(p), 0.5]], 100); draw();
    });
    $('#xClr', body).onclick = function () { if (graded) return; vals = q.mode === 'chord' ? [] : q.answer.map(function () { return null; }); draw(); };
    $('#xPlay', body).onclick = function () { var vs = graded ? q.answer : (q.mode === 'chord' ? [vals] : vals.filter(Boolean).map(function (v) { return [v]; })); if (q.mode === 'chord') { if ((graded ? q.answer : vals).length) M.play([[(graded ? q.answer : vals).map(M.str), 2]], 80); } else M.play(vs.map(function (a) { return [M.str(a[0] || a), 0.5]; }), 100); };
    $('#xGo', body).onclick = function () {
      if (graded) { if (st.i + 1 < st.qs.length) { st.i++; show(body, st); } else finish(body, st); return; }
      var g = grade(q, vals); graded = true; st.results.push(g.ok); if (g.ok) st.ok++;
      var colors = q.mode === 'chord' ? [g.ok ? '#2c8a5c' : '#d3302a'] : g.marks.map(function (x) { return x ? '#2c8a5c' : '#d3302a'; });
      draw(colors);
      $('#xRes', body).innerHTML = '<div class="xwr ' + (g.ok ? 'ok' : 'ng') + '"><b>' + (g.ok ? '⭕ 正解！' : '✕ おしい') + '</b>' + (g.ok ? '' : '<p>' + (q.why || q.mode === 'seq' ? (q.mode === 'seq' ? '赤い 音が まちがい（空の ところは 書いて いません）。' : '') + esc(q.why || '') : '') + '</p>') +
        '<p class="xwe">' + q.ex + '</p>' + (g.ok ? '' : '<div class="fig sc" id="xAns"></div>') + '</div>';
      if (!g.ok) M.writeStaff($('#xAns', body), { clef: q.clef, key: q.key, given: q.given, givenColor: '#2d6fb0', slots: q.n, mode: q.mode, vals: q.answer, colors: q.mode === 'chord' ? ['#2c8a5c'] : q.answer.map(function () { return '#2c8a5c'; }), numbers: q.numbers, zoom: 1.9, sp: q.mode === 'chord' ? 80 : 46 });
      $('#xGo', body).textContent = st.i + 1 < st.qs.length ? '次の 問題 ▶' : '結果を 見る ▶'; if (g.ok) GK.fx('ok');
    };
  }
  function finish(body, st) {
    var w = GK.store.get('examW', { ok: 0, sets: 0 }); w.ok += st.ok; w.sets = (w.sets || 0) + 1; GK.store.set('examW', w);
    var pt = st.ok * 3 + (st.ok === st.qs.length ? 5 : 0); GK.earn(pt); if (st.ok === st.qs.length) { GK.fx('fanfare'); GK.confetti && GK.confetti(30); }
    body.innerHTML = '<div class="xw"><div class="hzs ' + (st.ok >= 4 ? 'good' : '') + '"><div class="hzs1"><b>' + st.ok + '<small> / ' + st.qs.length + ' 問 正解</small></b></div><p>' + (st.ok === st.qs.length ? '🎉 ぜんぶ 正解！ 入試レベルの 記譜力です' : st.ok >= 4 ? '✅ 合格ライン（8 割）です' : st.ok >= 2 ? 'もう ひといき。まちがえた 種類を くりかえそう' : '解説を 読んで もう 1 セット') + '</p><p class="hzn">+' + pt + ' コイン</p></div>' +
      '<div class="xwa"><button type="button" class="btn main" id="xAgain">▶ もう 1 セット</button><button type="button" class="btn" data-go="#drill">演習へ もどる</button></div></div>';
    $('#xAgain', body).onclick = function () { start(body); };
  }
})();
