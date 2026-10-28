/* =========================================================
   楽典ラボ：和声法のエンジン（四部和声の 判定・お手本づくり・楽譜の 描画）
   声部は [S, A, T, B] の 順。音は { l, a, o } か 'C4' のような 文字。
   和音は { d: 1〜7（音階の何番目）, sev: 七の和音か, inv: 転回（0〜3） }
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, F = GK.F, H = GK.H = {};
  var N = function (p) { return GK.nm(p); };
  var VF = function () { return window.Vex && Vex.Flow; };

  H.VOICES = ['S', 'A', 'T', 'B'];
  H.VNAME = ['ソプラノ', 'アルト', 'テノール', 'バス'];
  H.VCOL = ['#c4452a', '#2f6bb8', '#2c8a5c', '#7d4fb0'];
  H.RANGE = [['C4', 'G5'], ['G3', 'D5'], ['C3', 'G4'], ['F2', 'C4']];
  var lo = function (v) { return M.midi(H.RANGE[v][0]); }, hi = function (v) { return M.midi(H.RANGE[v][1]); };
  var P = function (x) { return typeof x === 'string' ? M.p(x) : x; };
  var mid = function (x) { return M.midi(P(x)); };
  var same = function (a, b) { a = P(a); b = P(b); return a.l === b.l && a.a === b.a; };

  /* ---------- 調と 和音 ---------- */
  H.ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'];
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  var sub = function (s) { return s.split('').map(function (c) { return SUB.charAt(+c); }).join(''); };
  // 和音記号（転回形は 小さな 数字：Ⅰ₆・Ⅴ₇・Ⅴ₆₅）
  H.label = function (ch) { var f = ch.sev ? ['7', '65', '43', '42'][ch.inv] : ['', '6', '64'][ch.inv]; return H.ROMAN[ch.d] + sub(f); };
  H.figure = function (ch) { return ch.sev ? ['7', '6 5', '4 3', '4 2'][ch.inv] : ['', '6', '6 4'][ch.inv]; };
  H.pcs = function (key, minor, ch) { return M.diatonic(key, minor, ch.d, ch.sev).map(function (p) { return { l: p.l, a: p.a }; }); };
  H.tonic = function (key, minor) { var t = M.keyTonic(key, minor); return { l: t.l, a: t.a }; };
  H.lt = function (key, minor) { var s = M.scale(M.keyTonic(key, minor), minor ? 'harmonic' : 'major'); return { l: s[6].l, a: s[6].a }; };
  H.role = function (ch, idx) { return ch.sev ? ['根音', '第3音', '第5音', '第7音'][idx] : ['根音', '第3音', '第5音'][idx]; };
  H.keyName = function (key, minor) { return M.keyName(key, minor); };
  H.ctext = function (key, minor, ch) { var ps = H.pcs(key, minor, ch); return H.label(ch) + '（' + ps.map(N).join('・') + '）'; };

  /* ---------- 1 つの 和音の 検査 ---------- */
  // v：[S, A, T, B]。ng：まちがい、warn：ふつうは さける
  // prev：ひとつ前の 和音（Ⅴ₇ の あとの Ⅰ は 第5音を 省略して よい）
  H.checkChord = function (key, minor, ch, v, idx, prev) {
    var out = [], pcs = H.pcs(key, minor, ch), lt = H.lt(key, minor), i = idx || 0;
    var add = function (kind, ng, vs, msg) { out.push({ i: i, j: i, kind: kind, ng: ng, v: vs, msg: msg }); };
    v = v.map(P);
    var cnt = pcs.map(function () { return 0; });
    v.forEach(function (p, j) {
      var m = mid(p);
      if (m < lo(j) || m > hi(j)) add('range', true, [j], H.VNAME[j] + 'の ' + N(p) + ' は 音域の 外です（' + N(H.RANGE[j][0]) + '〜' + N(H.RANGE[j][1]) + '）');
      var k = -1; pcs.forEach(function (c, q) { if (same(c, p)) k = q; });
      if (k < 0) add('tone', true, [j], H.VNAME[j] + 'の ' + N(p) + ' は この和音（' + pcs.map(N).join('・') + '）の 音では ありません'); else cnt[k]++;
    });
    if (!same(pcs[ch.inv], v[3])) add('bass', true, [3], 'バスは ' + H.role(ch, ch.inv) + '（' + N(pcs[ch.inv]) + '）に します（' + H.label(ch) + '）');
    // 声部の 間かく・交差
    for (var j = 0; j < 3; j++) {
      if (mid(v[j]) < mid(v[j + 1])) add('cross', true, [j, j + 1], H.VNAME[j + 1] + 'が ' + H.VNAME[j] + 'より 高くなっています（声部の交差）');
      else if (j < 2 && mid(v[j]) - mid(v[j + 1]) > 12) add('space', true, [j, j + 1], H.VNAME[j] + 'と' + H.VNAME[j + 1] + 'が 1 オクターブより はなれています');
    }
    // そろっているか
    var need = ch.sev ? [0, 1, 3] : (prev && prev.sev && ch.d === 1 && ch.inv === 0) ? [0, 1] : [0, 1, 2];
    need.forEach(function (q) { if (!cnt[q]) add('incomplete', true, [], H.role(ch, q) + '（' + N(pcs[q]) + '）が ありません' + (q === 1 ? '（第3音は 省略できません）' : '')); });
    // 重ねてはいけない音
    pcs.forEach(function (c, q) {
      if (cnt[q] > 1 && same(c, lt)) add('dblLT', true, [], '導音（' + N(lt) + '）を 重ねては いけません');
      else if (cnt[q] > 1 && ch.sev && q === 3) add('dbl7', true, [], '第7音（' + N(c) + '）を 重ねては いけません');
    });
    if (ch.inv === 0 && !ch.sev && cnt[1] > 1 && !same(pcs[1], lt) && (ch.d === 1 || ch.d === 4 || ch.d === 5)) add('dblThird', false, [], '第3音を 重ねるのは ふつう さけます（根音を 重ねるのが 基本）');
    return out;
  };

  /* ---------- 2 つの 和音の つなぎの 検査 ---------- */
  H.checkTrans = function (key, minor, ch0, v0, ch1, v1, idx) {
    var out = [], lt = H.lt(key, minor), ton = H.tonic(key, minor), i = idx || 0;
    v0 = v0.map(P); v1 = v1.map(P);
    var add = function (kind, ng, vs, msg) { out.push({ i: i, j: i + 1, kind: kind, ng: ng, v: vs, msg: msg }); };
    var sg = function (x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
    // 連続 5 度・8 度
    for (var a = 0; a < 4; a++) for (var b = a + 1; b < 4; b++) {
      var d0 = Math.abs(mid(v0[a]) - mid(v0[b])), d1 = Math.abs(mid(v1[a]) - mid(v1[b]));
      var c0 = d0 % 12, c1 = d1 % 12, mv = sg(mid(v1[a]) - mid(v0[a])), mw = sg(mid(v1[b]) - mid(v0[b]));
      if (mv && mw && mv === mw) {
        if (c0 === 7 && c1 === 7) add('p5', true, [a, b], H.VNAME[a] + 'と' + H.VNAME[b] + 'が 連続5度（' + N(v0[b]) + '‐' + N(v0[a]) + ' → ' + N(v1[b]) + '‐' + N(v1[a]) + '）');
        else if (c0 === 0 && c1 === 0) add('p8', true, [a, b], H.VNAME[a] + 'と' + H.VNAME[b] + 'が 連続8度（' + (d0 ? '' : '1度 ') + N(v0[b]) + ' → ' + N(v1[b]) + '）');
        else if (a === 0 && b === 3 && (c1 === 7 || c1 === 0) && Math.abs(mid(v1[0]) - mid(v0[0])) > 2) add('hidden', false, [a, b], 'ソプラノと バスが 同じ向きに 進んで 5度・8度に（隠伏5度・8度）。ソプラノは 順次進行に すると 安全');
      }
    }
    // 旋律の 動き
    for (var j = 0; j < 4; j++) {
      var x = v0[j], y = v1[j], dm = mid(y) - mid(x);
      if (Math.abs(dm) > 12) add('leap', true, [j], H.VNAME[j] + 'の 跳躍が 1 オクターブを こえています');
      else if (dm) {
        var lw = dm > 0 ? x : y, up = dm > 0 ? y : x, iv = M.interval(lw, up);
        if (iv.q === 'A' || iv.q === 'd' || iv.q === 'AA' || iv.q === 'dd') add('aug', true, [j], H.VNAME[j] + 'が ' + N(x) + ' → ' + N(y) + '（' + iv.name + '）と 進んでいます。増・減の 音程は 使いません');
      }
    }
    // 隣りあう声部の ぶつかり（オーバーラップ）
    for (var k = 0; k < 3; k++) {
      if (mid(v1[k]) < mid(v0[k + 1]) || mid(v1[k + 1]) > mid(v0[k])) add('overlap', false, [k, k + 1], H.VNAME[k] + 'と' + H.VNAME[k + 1] + 'が 前の 位置を こえて います（声部の 重なり）');
    }
    // 導音の 解決（V・Ⅶ の あと）
    if (ch0.d === 5 || ch0.d === 7) {
      var p1 = H.pcs(key, minor, ch1), hasTon = p1.some(function (c) { return same(c, ton); });
      v0.forEach(function (p, j) {
        if (!same(p, lt) || !hasTon) return;
        var up1 = mid(v1[j]) - mid(p) === 1 && same(v1[j], ton);
        if (up1) return;
        var okInner = (j === 1 || j === 2) && ch1.d === 1 && !ch1.sev && [3, 4].indexOf(mid(p) - mid(v1[j])) >= 0;
        if (!okInner) add('lt', true, [j], H.VNAME[j] + 'の 導音（' + N(p) + '）は 半音 上の 主音（' + N(ton) + '）へ 進みます' + (j === 1 || j === 2 ? '（内声は Ⅰへの とき 3度 下へ 進んでも よい）' : ''));
      });
    }
    // 第 7 音の 解決
    if (ch0.sev) {
      var s7 = H.pcs(key, minor, ch0)[3];
      v0.forEach(function (p, j) {
        if (!same(p, s7)) return;
        var d = mid(p) - mid(v1[j]);
        if (!(d === 1 || d === 2)) add('sev', true, [j], H.VNAME[j] + 'の 第7音（' + N(p) + '）は 2度 下へ 進みます');
      });
    }
    return out;
  };

  H.checkAll = function (key, minor, chs, vs) {
    var out = [];
    chs.forEach(function (ch, i) {
      out = out.concat(H.checkChord(key, minor, ch, vs[i], i, i ? chs[i - 1] : null));
      if (i + 1 < chs.length) out = out.concat(H.checkTrans(key, minor, ch, vs[i], chs[i + 1], vs[i + 1], i));
    });
    return out;
  };
  H.ngCount = function (issues) { return issues.filter(function (x) { return x.ng; }).length; };

  /* ---------- 候補づくり・お手本の 自動作成 ---------- */
  // 和音 ch の 4 声の 並べ方（まちがいのない ものだけ）。fixed: { 0: 'E5' }（声部の番号 → 音）
  // widen：音域を 上下 1 オクターブ ひろげて 数える（音域を はみ出す 例を つくるため）
  H.cands = function (key, minor, ch, fixed, all, prev, widen) {
    var pcs = H.pcs(key, minor, ch), opt = [[], [], [], []];
    for (var v = 0; v < 4; v++) for (var o = 1; o <= 7; o++) pcs.forEach(function (pc, q) {
      var p = { l: pc.l, a: pc.a, o: o }, m = mid(p), w = widen ? 12 : 0;
      if (m < lo(v) - w || m > hi(v) + w) return;
      if (v === 3 && q !== ch.inv) return;
      if (fixed && fixed[v] != null && mid(fixed[v]) !== m) return;
      opt[v].push(p);
    });
    var res = [];
    opt[3].forEach(function (b) { opt[2].forEach(function (t) { if (mid(t) < mid(b)) return; opt[1].forEach(function (a) { if (mid(a) < mid(t)) return; opt[0].forEach(function (s) {
      if (mid(s) < mid(a)) return;
      var vv = [s, a, t, b];
      if (all || !H.ngCount(H.checkChord(key, minor, ch, vv, 0, prev))) res.push(vv);
    }); }); }); });
    return res;
  };
  var spread = function (v) { return mid(v[0]) - mid(v[2]) > 12 ? 1 : 0; }; // 開離なら 1
  var cost = function (key, minor, c0, v0, c1, v1, R) {
    var iss = H.checkTrans(key, minor, c0, v0, c1, v1), t = 0;
    if (H.ngCount(iss)) return Infinity;
    iss.forEach(function (x) { t += x.kind === 'hidden' ? 6 : x.kind === 'overlap' ? 5 : 2; });
    for (var j = 0; j < 3; j++) { var d = Math.abs(mid(v1[j]) - mid(v0[j])); t += d === 0 ? -3 : d; }
    t += Math.abs(mid(v1[3]) - mid(v0[3])) * 0.35;
    if (spread(v0) !== spread(v1)) t += 1.5;
    return t + (R ? R() * 0.9 : 0);
  };
  // 進行 chs（四声部）の お手本。given：{ 0: [音 …] } か { 3: [音 …] }（ソプラノ課題・バス課題）
  H.solve = function (key, minor, chs, given, R) {
    var n = chs.length, layers = [];
    for (var i = 0; i < n; i++) {
      var fx = null; if (given) { fx = {}; Object.keys(given).forEach(function (v) { fx[v] = given[v][i]; }); }
      var c = H.cands(key, minor, chs[i], fx, false, i ? chs[i - 1] : null);
      // 最初と 最後の 和音は 配置が きれいな ものを 優先
      if (!c.length) return null;
      layers.push(c);
    }
    var best = layers[0].map(function (v) { return { v: v, c: (R ? R() * 1.5 : 0) + Math.abs(mid(v[0]) - mid('E5')) * 0.15 + (spread(v) ? 0.6 : 0), prev: -1 }; }), tbl = [best];
    for (var k = 1; k < n; k++) {
      var row = layers[k].map(function (v) {
        var bc = Infinity, bi = -1;
        tbl[k - 1].forEach(function (s, si) { var cc = s.c + cost(key, minor, chs[k - 1], s.v, chs[k], v, R); if (cc < bc) { bc = cc; bi = si; } });
        return { v: v, c: bc, prev: bi };
      }).filter(function (s) { return s.c < Infinity; });
      if (!row.length) return null;
      tbl.push(row);
    }
    var last = tbl[n - 1], bi = 0; last.forEach(function (s, i2) { if (s.c < last[bi].c) bi = i2; });
    var out = [], cur = bi; for (var q = n - 1; q >= 0; q--) { out[q] = tbl[q][cur].v; cur = tbl[q][cur].prev; }
    return out;
  };

  /* ---------- 練習用の 進行 ---------- */
  var C = function (d, inv, sev) { return { d: d, inv: inv || 0, sev: !!sev }; };
  H.PROGS = [
    { name: 'Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', chs: [C(1), C(4), C(5), C(1)], lv: 1 },
    { name: 'Ⅰ‐Ⅵ‐Ⅳ‐Ⅴ‐Ⅰ', chs: [C(1), C(6), C(4), C(5), C(1)], lv: 1 },
    { name: 'Ⅰ‐Ⅳ‐Ⅰ‐Ⅴ‐Ⅰ', chs: [C(1), C(4), C(1), C(5), C(1)], lv: 1 },
    { name: 'Ⅰ‐Ⅱ‐Ⅴ‐Ⅰ', chs: [C(1), C(2), C(5), C(1)], lv: 2 },
    { name: 'Ⅰ‐Ⅳ‐Ⅴ₇‐Ⅰ', chs: [C(1), C(4), C(5, 0, 1), C(1)], lv: 2 },
    { name: 'Ⅰ‐Ⅵ‐Ⅱ‐Ⅴ₇‐Ⅰ', chs: [C(1), C(6), C(2), C(5, 0, 1), C(1)], lv: 2, majorOnly: true },
    { name: 'Ⅰ‐Ⅴ₆‐Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', chs: [C(1), C(5, 1), C(1), C(4), C(5), C(1)], lv: 3 },
    { name: 'Ⅰ‐Ⅳ₆‐Ⅴ‐Ⅵ', chs: [C(1), C(4, 1), C(5), C(6)], lv: 3 },
    { name: 'Ⅰ‐Ⅰ₆‐Ⅳ‐Ⅴ₇‐Ⅰ', chs: [C(1), C(1, 1), C(4), C(5, 0, 1), C(1)], lv: 3 }
  ];
  H.KEYS = { maj: [0, 1, -1, 2, -2, 3, -3], min: [0, 1, -1, 2, -2] }; // 調号（長調）／（短調）
  H.MINORS = true;

  /* ---------- 楽譜の 描画（大譜表に 4 声：上 S・A、下 T・B） ----------
     spec = { key, minor, chords: [{ v: [S,A,T,B], lab, fig, col: [色…] | true, d }], marks: [{ i, j, vs: [a, b], t, c }], sp, zoom, color, names }  */
  M.satb = function (el, spec) {
    var V = VF(); el.innerHTML = '';
    if (!V) { el.textContent = '（楽譜の部品を読みこめませんでした）'; return null; }
    var chords = spec.chords, n = chords.length, key = spec.key || 0, minor = !!spec.minor, sp = spec.sp || 54, gap = 100, top = 6;
    var probe = new V.Stave(0, 0, 400); probe.addClef('treble'); if (key) probe.addKeySignature(M.keyVF(key, minor)); probe.format && probe.format();
    var x0 = 4, first = probe.getNoteStartX(), W = Math.round(x0 + first + n * sp + 22), Hh = top + 40 + gap + 40 + 56;
    var r = new V.Renderer(el, V.Renderer.Backends.SVG); r.resize(W, Hh);
    var ctx = r.getContext(); ctx.setFillStyle('currentColor'); ctx.setStrokeStyle('currentColor');
    var svg = el.querySelector('svg');
    var st1 = new V.Stave(x0, top, W - x0 - 4), st2 = new V.Stave(x0, top + gap, W - x0 - 4);
    st1.addClef('treble'); st2.addClef('bass');
    if (key) { st1.addKeySignature(M.keyVF(key, minor)); st2.addKeySignature(M.keyVF(key, minor)); }
    st1.setEndBarType(V.Barline.type.END); st2.setEndBarType(V.Barline.type.END);
    st1.setContext(ctx).draw(); st2.setContext(ctx).draw();
    new V.StaveConnector(st1, st2).setType('brace').setContext(ctx).draw();
    new V.StaveConnector(st1, st2).setType('singleLeft').setContext(ctx).draw();
    new V.StaveConnector(st1, st2).setType('boldDoubleRight').setContext(ctx).draw();
    var keyAcc = M.keyAcc(key), st = [{ key: keyAcc }, { key: keyAcc }];
    var sn = [[], [], [], []], bad = {};
    (spec.marks || []).forEach(function (mk) { (mk.vs || []).forEach(function (v) { bad[mk.i + ':' + v] = 1; bad[mk.j + ':' + v] = 1; }); });
    chords.forEach(function (c, i) { (c.bad || []).forEach(function (v) { bad[i + ':' + v] = 1; }); });
    var mkNote = function (p, clef, up, staff, col) {
      p = P(p);
      var s = new V.StaveNote({ clef: clef, keys: [M.vf(p)], duration: 'h', stem_direction: up ? 1 : -1 });
      var key2 = p.l + ':' + p.o, cur = key2 in staff ? staff[key2] : staff.key[p.l];
      if (cur !== p.a) s.addModifier(new V.Accidental({ '-2': 'bb', '-1': 'b', '0': 'n', '1': '#', '2': '##' }[p.a])); // 調号と ちがう音には 臨時記号
      staff[key2] = p.a;
      if (col) { s.setStyle({ fillStyle: col, strokeStyle: col }); }
      return s;
    };
    chords.forEach(function (c, i) {
      var vv = c.v.map(P);
      for (var j = 0; j < 4; j++) {
        var col = null;
        if (bad[i + ':' + j]) col = '#d3302a';
        else if (c.col === true || spec.color) col = H.VCOL[j];
        else if (c.col && c.col[j]) col = c.col[j];
        if (c.q && c.q.indexOf(j) >= 0) sn[j].push(new V.GhostNote('h')); else sn[j].push(mkNote(vv[j], j < 2 ? 'treble' : 'bass', j % 2 === 0, st[j < 2 ? 0 : 1], col));
      }
    });
    var voices = sn.map(function (arr) { return new V.Voice({ num_beats: n * 2, beat_value: 4 }).setMode(V.Voice.Mode.SOFT).addTickables(arr); });
    var fm = new V.Formatter(); fm.joinVoices([voices[0], voices[1]]); fm.joinVoices([voices[2], voices[3]]);
    fm.format(voices, Math.max(40, st1.getNoteEndX() - first - 8), { align_rests: false });
    voices[0].draw(ctx, st1); voices[1].draw(ctx, st1); voices[2].draw(ctx, st2); voices[3].draw(ctx, st2);
    svg.querySelectorAll('[fill="black"],[fill="#000"],[fill="#000000"]').forEach(function (e) { e.setAttribute('fill', 'currentColor'); });
    svg.querySelectorAll('[stroke="black"],[stroke="#000"],[stroke="#000000"]').forEach(function (e) { e.setAttribute('stroke', 'currentColor'); });
    // 和音記号・数字（バスの 下）／ 声部の 名前
    var by = top + gap + 40 + 52, xs = sn[0].map(function (s) { return s.getAbsoluteX() + (s.getGlyphWidth ? s.getGlyphWidth() / 2 : 6); });
    chords.forEach(function (c, i) { if (c.lab) M.svgText(svg, xs[i], by, c.lab, { size: 17, c: c.lc || undefined, font: 'serif' }); if (c.sub) M.svgText(svg, xs[i], by + 17, c.sub, { size: 10, c: '#7a7568', fixed: true }); });
    // まちがいの 印（線で むすぶ）
    (spec.marks || []).forEach(function (mk) {
      (mk.vs || []).forEach(function (v) {
        var a = sn[v][mk.i], b = sn[v][mk.j]; if (!a || !b || !a.getYs || !b.getYs || a instanceof V.GhostNote || b instanceof V.GhostNote) return;
        var ya = a.getYs()[0], yb = b.getYs()[0];
        M.svgEl(svg, 'line', { x1: a.getAbsoluteX() + 6, y1: ya, x2: b.getAbsoluteX() + 6, y2: yb, stroke: mk.c || '#d3302a', 'stroke-width': 2, 'stroke-dasharray': '4 3', opacity: .85 });
      });
      if (mk.t) { var m0 = (xs[mk.i] + xs[mk.j]) / 2; M.svgText(svg, m0, top + 30 - 14, mk.t, { size: 12, c: mk.c || '#d3302a' }); }
    });
    (spec.names ? sn : []).forEach(function (arr, j) { var s0 = arr[0]; if (s0 && !(s0 instanceof V.GhostNote)) M.svgText(svg, s0.getAbsoluteX() - 15, s0.getYs()[0] + 4, 'SATB'.charAt(j), { size: 11, c: H.VCOL[j], anchor: 'end', fixed: true }); });
    chords.forEach(function (c, i) { (c.q || []).forEach(function (j) { M.svgText(svg, xs[i], top + 10 + (j < 2 ? 0 : gap - 2) + (j % 2) * 0, 'SATB'.charAt(j) + '？', { size: 15, c: H.VCOL[j] }); }); });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh); svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('class', 'vf');
    svg.style.width = ''; svg.style.height = ''; svg.style.maxWidth = Math.round(W * (spec.zoom || 2.2)) + 'px'; svg.dataset.w = W;
    M.fit(svg, W, top + 40, top + gap + 80);
    return { svg: svg, notes: sn, xs: xs };
  };
  // 図の 部品：{ c: 'satb', a: spec }
  F.CUSTOM.satb = function (box, a) { M.satb(box, a); };

  /* ---------- 図・問題づくりの 道具 ---------- */
  H.mk = function (str) { return str.split(/\s+/).map(function (x) { return M.p(x); }); };
  H.common = function (v0, v1) { return [0, 1, 2, 3].filter(function (j) { return mid(v0[j]) === mid(v1[j]); }); };
  // 図の 指定：o = { color, names, zoom, sp, marks, col: [[色…]…], bad: [[声部…]…], q: [[声部…]…], nolab }
  H.fig = function (key, minor, chs, vs, o) {
    o = o || {};
    return { c: 'satb', a: { key: key, minor: minor, color: o.color, names: o.names, zoom: o.zoom, sp: o.sp, marks: o.marks, chords: chs.map(function (c, i) { return { v: vs[i], lab: o.nolab ? null : (o.labs ? o.labs[i] : H.label(c)), sub: o.subs && o.subs[i], col: o.col && o.col[i], bad: o.bad && o.bad[i], q: o.q && o.q[i] }; }) } };
  };
  // 1 つの 和音だけ（配置の 説明などに）
  H.fig1 = function (key, minor, ch, v, o) { return H.fig(key, minor, [ch], [v], o); };
  // 検査の 結果を 図に 反映（つなぎの 線・まちがいの 音）
  H.marksOf = function (issues) {
    var marks = [], bad = {};
    issues.forEach(function (x) {
      if (x.i !== x.j && x.v.length === 2 && (x.kind === 'p5' || x.kind === 'p8' || x.kind === 'hidden')) marks.push({ i: x.i, j: x.j, vs: x.v, t: x.kind === 'p5' ? '連続5度' : x.kind === 'p8' ? '連続8度' : '隠伏' });
      else x.v.forEach(function (vv) { (bad[x.j] = bad[x.j] || []).push(vv); if (x.i !== x.j) (bad[x.i] = bad[x.i] || []).push(vv); });
    });
    return { marks: marks, bad: bad };
  };
  var kindsOf = function (iss, ng) { var k = []; iss.forEach(function (x) { if (x.ng === ng && k.indexOf(x.kind) < 0) k.push(x.kind); }); return k; };
  // 見た目が ふつうの 配置か（ソプラノとアルトが 同じ高さ・バスが 高すぎる などを さける）
  var nice = function (v) { return mid(v[3]) <= 55 && mid(v[0]) - mid(v[1]) >= 2 && mid(v[1]) - mid(v[2]) >= 2 && mid(v[2]) - mid(v[3]) >= 5; };
  H.nice = nice;
  var WARN = { hidden: 1, overlap: 1, dblThird: 1 };
  // ちょうど 1 種類の まちがいだけを もつ「つなぎ」（2 和音）。見つからなければ null
  // kind が 注意（hidden など）の ときは、まちがいは なく その 注意だけを もつ
  H.flawed = function (key, minor, chs, kind, R) {
    var A = GK.shuffle(H.cands(key, minor, chs[0], null, false, null), R), B = GK.shuffle(H.cands(key, minor, chs[1], null, true, chs[0]), R), best = null, n = 0, isW = !!WARN[kind];
    for (var pass = 0; pass < 2 && !best; pass++) {
      for (var a = 0; a < A.length && n < 6000; a++) { if (pass === 0 && !nice(A[a])) continue;
        for (var b = 0; b < B.length && n < 6000; b++, n++) { if (pass === 0 && !nice(B[b])) continue;
          var iss = H.checkChord(key, minor, chs[1], B[b], 1, chs[0]).concat(H.checkTrans(key, minor, chs[0], A[a], chs[1], B[b], 0)), k = kindsOf(iss, true), w = kindsOf(iss, false);
          var ok = isW ? (!k.length && w.indexOf(kind) >= 0 && w.length === 1) : (k.length === 1 && k[0] === kind && w.filter(function (x) { return x !== 'overlap'; }).length === 0);
          if (ok) { best = { v: [A[a], B[b]], issues: iss }; if (!w.length) return best; }
        }
      }
    }
    if (best) return best;
    if (kind === 'cross') {
      var base = H.cands(key, minor, chs[1], null, false, chs[0]);
      for (var a2 = 0; a2 < A.length && a2 < 60; a2++) for (var q = 0; q < 3; q++) {
        if (!base.length) return null;
        var w2 = base[Math.floor((R ? R() : Math.random()) * base.length)].slice(); var t = w2[q]; w2[q] = w2[q + 1]; w2[q + 1] = t;
        var iss2 = H.checkChord(key, minor, chs[1], w2, 1, chs[0]).concat(H.checkTrans(key, minor, chs[0], A[a2], chs[1], w2, 0));
        if (mid(w2[q]) !== mid(w2[q + 1]) && kindsOf(iss2, true).join() === 'cross') return { v: [A[a2], w2], issues: iss2 };
      }
    }
    return null;
  };
  // 進行 vs の k 番めの つなぎ（k → k+1）だけを まちがいに かえる（ほかは 正しいまま）
  H.breakAt = function (key, minor, chs, vs, k, R) {
    var c = GK.shuffle(H.cands(key, minor, chs[k + 1], null, true, chs[k]), R);
    for (var i = 0; i < c.length && i < 3000; i++) {
      var v2 = vs.slice(); v2[k + 1] = c[i];
      var ng = H.checkAll(key, minor, chs, v2).filter(function (x) { return x.ng; });
      if (ng.length && ng.every(function (x) { return x.i === k && x.j === k + 1; }) && kindsOf(ng, true).length === 1) return { vs: v2, issues: ng };
    }
    return null;
  };
  // 正しい 2 和音の つなぎ（v0 と、v0 から 正しく つなげる v1 の 一覧）
  H.pairOK = function (key, minor, chs, R) {
    var A = GK.shuffle(H.cands(key, minor, chs[0], null, false, null).filter(nice), R), B = H.cands(key, minor, chs[1], null, false, chs[0]);
    for (var i = 0; i < A.length; i++) {
      var ok = B.filter(function (v) { return !H.ngCount(H.checkTrans(key, minor, chs[0], A[i], chs[1], v, 0)); });
      if (ok.length) return { v0: A[i], B: ok };
    }
    return null;
  };
  // 2 つの 和音の「つなぎ方」の 説明（お手本に つける）
  H.explain = function (key, minor, chs, vs) {
    var out = [];
    for (var i = 0; i + 1 < chs.length; i++) {
      var com = H.common(vs[i], vs[i + 1]).filter(function (j) { return j < 3; }), head = H.label(chs[i]) + '→' + H.label(chs[i + 1]) + '：';
      var bd = mid(vs[i + 1][3]) - mid(vs[i][3]);
      if (com.length) out.push(head + '共通音 ' + com.map(function (j) { return N(vs[i][j]) + '（' + H.VNAME[j] + '）'; }).join('・') + ' を そのまま 保つ');
      else {
        var contr = [0, 1, 2].every(function (j) { var d = mid(vs[i + 1][j]) - mid(vs[i][j]); return d && bd && (d > 0) !== (bd > 0); });
        out.push(head + '共通音が ないので ' + (contr ? '上の 3 声は バスと 反対に 動く' : '上の 3 声は なるべく 近い音へ'));
      }
    }
    return out;
  };
  // 声部ごとの 候補（エディタ用）：和音 ch の 声部 v の 音を 低い順に
  H.voicePitches = function (key, minor, ch, v) {
    var pcs = H.pcs(key, minor, ch), res = [];
    for (var o = 2; o <= 6; o++) pcs.forEach(function (pc, q) {
      var p = { l: pc.l, a: pc.a, o: o }, m = mid(p);
      if (m < lo(v) || m > hi(v) || (v === 3 && q !== ch.inv)) return;
      res.push({ p: p, q: q });
    });
    return res.sort(function (a, b) { return mid(a.p) - mid(b.p); });
  };

  // 音を 鳴らす（4 声を 1 つずつ 和音で）
  H.play = function (vs, bpm) {
    M.play(vs.map(function (v, i) { return [v.map(function (p) { return M.str(P(p)); }), i === vs.length - 1 ? 3 : 1.6]; }), bpm || 72);
  };
  H.str = function (p) { return M.str(P(p)); };
})();
