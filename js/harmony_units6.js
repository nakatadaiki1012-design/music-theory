/* =========================================================
   楽典ラボ：和声法の 演習（★3 の 実戦問題）
   ・和声分析：和音記号の ない 4 声の 楽譜を 見て、和音記号の ならびを えらぶ
   ・構成音から：バスと 上の 音から 和音記号を えらぶ
   ・つぎの 和音：その 和音の あとに 正しく 進める 和音
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, U = GK.Q.util, UT = H.UT;
  var N = function (p) { return GK.nm(p); };
  var tw = function (t, w) { var o = U.tx(t); o.w = w; return o; };
  // まちがえた ときの 説明：どの 和音を どう 読みちがえたか
  function whyMis(key, minor, right, wrong) {
    var pr = H.pcs(key, minor, right), pw; try { pw = H.pcs(key, minor, wrong); } catch (e) { return ''; }
    var nm = function (p) { return p.map(N).join('・'); }, sameSet = pr.map(N).sort().join() === pw.map(N).sort().join();
    if (sameSet) return H.label(wrong) + ' なら バスは ' + N(pw[wrong.inv]) + '。この 楽譜の バスは <b>' + N(pr[right.inv]) + '</b>（' + H.role(right, right.inv) + '）なので <b>' + H.label(right) + '</b>。';
    return H.label(wrong) + ' なら 音は ' + nm(pw) + '。この 楽譜の 音は <b>' + nm(pr) + '</b> なので <b>' + H.label(right) + '</b>。';
  }
  var mc = U.mc, tx = U.tx, pick = U.pick, shuffle = U.shuffle, add = U.add;
  var kname = UT.kname, rkey = UT.rkey, fig = H.fig;
  var C = function (d, inv, sev, o) { return Object.assign({ d: d, inv: inv || 0, sev: !!sev, nine: false }, o || {}); };
  var sig = function (key, minor, ch) { return H.pcs(key, minor, ch).map(N).sort().join(',') + '|' + N(H.pcs(key, minor, ch)[ch.inv]); };
  var SUBS = { 1: [6, 3], 2: [4, 7], 3: [1, 6], 4: [2, 6], 5: [7, 3], 6: [4, 1], 7: [5, 2] };
  // まちがえやすい となりの 和音（転回・代理・七の有無・変化和音 ↔ ふつうの 和音）
  function confuse(ch, minor) {
    var r = [], nInv = ch.sev ? 4 : 3, k;
    if (ch.a6) { ['it', 'ge', 'fr'].forEach(function (t) { if (t !== ch.a6) r.push(C(4, 0, 0, { a6: t })); }); r.push(C(4, 1)); r.push(C(2, 1, 0, { nap: 1 })); return r; }
    if (ch.nap) { r.push(C(2, 1)); r.push(C(4)); r.push(C(2, 0, 0, { nap: 1 })); r.push(C(4, 0, 0, { a6: 'it' })); return r; }
    if (ch.tg) { var rd = (ch.tg + 3) % 7 + 1; r.push(C(rd, ch.inv, ch.sev)); r.push(C(5, ch.inv, ch.sev)); SUBS[ch.tg].forEach(function (t) { if (t !== 1) r.push(C(5, ch.inv, ch.sev, { tg: t })); }); for (k = 0; k < nInv; k++) if (k !== ch.inv) r.push(C(5, k, ch.sev, { tg: ch.tg })); return r; }
    if (ch.bor) { r.push(C(ch.d, ch.inv, ch.sev)); if (ch.d === 4) r.push(C(2, 1, 1, { bor: 1 })); if (ch.d === 2) r.push(C(4, 0, 0, { bor: 1 })); r.push(C(ch.d, (ch.inv + 1) % nInv, ch.sev, { bor: 1 })); return r; }
    for (k = 0; k < nInv; k++) if (k !== ch.inv) r.push(C(ch.d, k, ch.sev, ch.nine ? { nine: true, sev: true } : null));
    SUBS[ch.d].forEach(function (d) { r.push(C(d, ch.inv, ch.sev && d !== 1 ? true : false)); });
    if (!ch.nine && (ch.d === 2 || ch.d === 5 || ch.d === 7 || ch.d === 4)) r.push(C(ch.d, ch.sev ? Math.min(ch.inv, 2) : ch.inv, !ch.sev));
    if (ch.nine) r.push(C(5, 0, 1)); if (ch.d === 7 && ch.sev) r.push(C(5, 0, 0, { nine: true, sev: true }));
    return r;
  }
  function solved(list, R, minor) {
    for (var t = 0; t < 60; t++) {
      var chs = pick(list, R), mn = minor === true ? true : minor === 'mix' ? R() < 0.35 : false, key = rkey(R, mn), vs = H.solve(key, mn, chs, null, R);
      if (vs) return { key: key, minor: mn, chs: chs, vs: vs };
    }
    return null;
  }
  /* ---------- 和声分析（★3） ---------- */
  function analyze(id, unit, list, minor, focus) {
    add(id, unit, 3, function (R) {
      var P = solved(list, R, minor); if (!P) throw new Error(id);
      var labs = P.chs.map(H.label), right = labs.join(' ‐ '), wr = [], wy = [], tries = 0;
      var idxs = P.chs.map(function (c, i) { return i; }).filter(function (i) { return i > 0 && i < P.chs.length - 1; });
      if (focus) { var f = P.chs.map(function (c, i) { return focus(c) ? i : -1; }).filter(function (i) { return i >= 0; }); if (f.length) idxs = f.concat(f, idxs); }
      while (wr.length < 3 && tries++ < 80) {
        var i = pick(idxs, R), alts = confuse(P.chs[i], P.minor).filter(function (c) { try { return sig(P.key, P.minor, c) !== sig(P.key, P.minor, P.chs[i]); } catch (e) { return false; } });
        if (!alts.length) continue;
        var a = pick(alts, R), l2 = labs.slice(); l2[i] = H.label(a); var s2 = l2.join(' ‐ ');
        if (s2 !== right && wr.indexOf(s2) < 0) { wr.push(s2); wy.push((i + 1) + ' 番めの 和音を 読みちがえています。' + whyMis(P.key, P.minor, P.chs[i], a)); }
      }
      var m = mc(R, tx(right), wr.map(function (w, k) { return tw(w, wy[k]); }), 4), sp = P.chs.length > 5 ? 44 : P.chs.length > 4 ? 48 : 54;
      return {
        q: kname(P.key, P.minor) + '。和音記号を 消した 4 声の 楽譜。正しい 和音記号の ならびは？', fig: fig(P.key, P.minor, P.chs, P.vs, { nolab: true, zoom: 2.4, sp: sp }), ch: m.ch, a: m.a, why: m.why,
        ex: '<b>' + right + '</b>。バス（いちばん 下）で 転回形、4 声の 音を 集めて 根音と 種類を きめる。' + P.chs.map(function (c) { return H.label(c) + '＝' + H.pcs(P.key, P.minor, c).map(N).join('・'); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join('、') + '。',
        exFig: fig(P.key, P.minor, P.chs, P.vs, { zoom: 2.4, sp: sp }), play: function () { H.play(P.vs); }
      };
    });
  }
  /* ---------- 構成音から 和音記号（★3） ---------- */
  function spell(id, unit, pool, minor) {
    add(id, unit, 3, function (R) {
      var mn = minor === true ? true : minor === 'mix' ? R() < 0.4 : false, ch = pick(pool, R);
      if (mn && ch.bor) mn = false;
      var key = rkey(R, mn), pcs = H.pcs(key, mn, ch), bass = pcs[ch.inv], up = shuffle(pcs.filter(function (_, q) { return q !== ch.inv; }), R);
      var right = H.label(ch), wr = [];
      var wc = []; shuffle(confuse(ch, mn), R).forEach(function (c) { var l = H.label(c); try { if (l !== right && wr.indexOf(l) < 0 && sig(key, mn, c) !== sig(key, mn, ch)) { wr.push(l); wc.push(c); } } catch (e) { } });
      var m = mc(R, tx(right), wr.slice(0, 5).map(function (w, k) { return tw(w, whyMis(key, mn, ch, wc[k])); }), 4);
      return { q: kname(key, mn) + '。バスが <b>' + N(bass) + '</b>、上の 声部に <b>' + up.map(N).join('・') + '</b>。この 和音の 和音記号は？', ch: m.ch, a: m.a, why: m.why,
        ex: ch.a6 ? 'バス（♭6 の ' + N(pcs[0]) + '）と ' + N(pcs[2]) + '（♯4）が 増6度 → 増六の和音。ほかの 音が 主音だけ ＝ It⁺⁶、主音＋♭3 ＝ Ge⁺⁶、主音＋2 ＝ Fr⁺⁶ なので <b>' + right + '</b>。' : '3度ずつ 積みなおすと ' + pcs.map(N).join('・') + '（根音 ' + N(pcs[0]) + '）。バスが ' + H.role(ch, ch.inv) + ' なので <b>' + right + '</b>。', play: [[pcs.map(function (p, q) { return M.str(Object.assign({}, p, { o: q === ch.inv ? 3 : 4 })); }), 2]] };
    });
  }
  /* ---------- つぎに 進める 和音（★3） ---------- */
  function nextQ(id, unit, items) {
    add(id, unit, 3, function (R) {
      var it = pick(items, R), m = mc(R, tx(it[1]), it[2].map(function (w) { return tx(w); }), 4);
      return { q: '<b>' + it[0] + '</b> の あと、ふつう 進む 和音は？', ch: m.ch, a: m.a, ex: '<b>' + it[0] + ' → ' + it[1] + '</b>。' + it[3] };
    });
  }

  var T1 = [[C(1), C(4), C(1), C(5), C(1)], [C(1), C(6), C(4), C(5), C(1)], [C(1), C(2), C(5), C(1)], [C(1), C(4), C(5), C(6)], [C(1), C(6), C(2), C(5), C(1)]];
  var T6 = [[C(1), C(5, 1), C(1), C(4), C(5), C(1)], [C(1), C(4, 1), C(5), C(6)], [C(1), C(1, 1), C(4), C(5), C(1)], [C(1), C(2, 1), C(5), C(1)], [C(1), C(6), C(4, 1), C(5), C(1)]];
  var T8 = [[C(1), C(6), C(2), C(5, 0, 1), C(1)], [C(1), C(3), C(6), C(4), C(5), C(1)], [C(1), C(4), C(7, 1), C(1)], [C(1), C(2), C(5, 0, 1), C(1)]];
  var T10 = [[C(1), C(5, 1, 1), C(1)], [C(1), C(5, 2, 1), C(1)], [C(1), C(5, 3, 1), C(1, 1)], [C(1), C(4), C(5, 1, 1), C(1)], [C(1), C(6), C(5, 2, 1), C(1)], [C(1), C(2, 1), C(5, 0, 1), C(1)]];
  var T11 = [[C(1), C(5, 2), C(1, 1)], [C(1), C(4, 2), C(1)], [C(1), C(4), C(1, 2), C(5), C(1)], [C(1), C(2, 1), C(1, 2), C(5, 0, 1), C(1)]];
  var T12 = [[C(1), C(2, 0, 1), C(5), C(1)], [C(1), C(2, 1, 1), C(5), C(1)], [C(1), C(4), C(7, 1, 1), C(1, 1)], [C(1), C(6), C(4, 0, 1), C(5), C(1)], [C(1), C(2, 1, 1), C(5, 0, 1), C(1)]];
  var T13 = [[C(1), C(4), C(5, 0, 1, { nine: true }), C(1)], [C(1), C(2), C(5, 0, 1, { nine: true }), C(1)], [C(1), C(6), C(5, 0, 1, { nine: true }), C(1)]];
  var T15 = [[C(1), C(4), C(5, 0, 0, { tg: 5 }), C(5), C(1)], [C(1), C(2), C(5, 0, 1, { tg: 5 }), C(5), C(1)], [C(1), C(4), C(5, 1, 1, { tg: 5 }), C(5), C(1)], [C(1), C(5, 0, 1, { tg: 4 }), C(4), C(5), C(1)], [C(1), C(5, 0, 1, { tg: 2 }), C(2), C(5), C(1)], [C(1), C(5, 0, 1, { tg: 6 }), C(6), C(4), C(5), C(1)]];
  var T17 = [[C(1), C(4), C(4, 0, 0, { bor: 1 }), C(1)], [C(1), C(2, 1, 1, { bor: 1 }), C(5), C(1)], [C(1), C(6, 0, 0, { bor: 1 }), C(4, 0, 0, { bor: 1 }), C(5), C(1)], [C(1), C(4, 0, 0, { bor: 1 }), C(5, 0, 1), C(1)]];
  var T18 = [[C(1), C(2, 1, 0, { nap: 1 }), C(5), C(1)], [C(1), C(4), C(2, 1, 0, { nap: 1 }), C(5, 0, 1), C(1)], [C(1), C(2, 1, 0, { nap: 1 }), C(1, 2), C(5), C(1)]];
  var T19 = [[C(1), C(4, 0, 0, { a6: 'it' }), C(5), C(1)], [C(1), C(4, 0, 0, { a6: 'ge' }), C(1, 2), C(5), C(1)], [C(1), C(4, 0, 0, { a6: 'fr' }), C(5), C(1)]];
  var T20 = [[C(1), C(4), C(7, 1, 1), C(1, 1)], [C(1), C(2), C(7, 1, 1), C(1, 1)], [C(1), C(6), C(7, 2, 1), C(1, 1)]];
  var alt = function (c) { return H.isAlt(c); };

  analyze('anaBasic', 'h05', T1, 'mix');
  analyze('anaInv', 'h06', T6, 'mix', function (c) { return c.inv > 0; });
  analyze('anaSub', 'h08', T8, false, function (c) { return [2, 3, 6, 7].indexOf(c.d) >= 0; });
  analyze('anaMinor', 'h09', T1.concat(T6), true);
  analyze('anaV7', 'h10', T10, 'mix', function (c) { return c.sev; });
  analyze('anaSix', 'h11', T11, 'mix', function (c) { return c.inv === 2 && !c.sev; });
  analyze('anaSev', 'h12', T12, false, function (c) { return c.sev; });
  analyze('anaNine', 'h13', T13, 'mix', function (c) { return c.nine; });
  analyze('anaSec', 'h15', T15, false, alt);
  analyze('anaBor', 'h17', T17, false, alt);
  analyze('anaNap', 'h18', T18, 'mix', alt);
  analyze('anaA6', 'h19', T19, 'mix', alt);
  analyze('anaOmit', 'h20', T20, 'mix', function (c) { return c.d === 7; });
  spell('spInv', 'h06', [C(1, 1), C(1, 2), C(4, 1), C(4, 2), C(5, 1), C(5, 2), C(2, 1), C(6, 1)], 'mix');
  spell('spSev', 'h12', [C(2, 0, 1), C(2, 1, 1), C(7, 0, 1), C(7, 1, 1), C(4, 0, 1), C(6, 0, 1), C(5, 1, 1), C(5, 3, 1)], false);
  spell('spSec', 'h15', [C(5, 0, 0, { tg: 5 }), C(5, 0, 1, { tg: 5 }), C(5, 1, 1, { tg: 5 }), C(5, 0, 1, { tg: 4 }), C(5, 0, 1, { tg: 2 }), C(5, 0, 1, { tg: 6 })], false);
  spell('spAlt', 'h19', [C(4, 0, 0, { a6: 'it' }), C(4, 0, 0, { a6: 'ge' }), C(4, 0, 0, { a6: 'fr' }), C(2, 1, 0, { nap: 1 })], 'mix');
  spell('spBor', 'h17', [C(4, 0, 0, { bor: 1 }), C(2, 1, 1, { bor: 1 }), C(6, 0, 0, { bor: 1 }), C(2, 0, 0, { bor: 1 })], false);
  nextQ('nextAlt', 'h19', [
    ['Ge⁺⁶（ドイツの 六）', 'Ⅰ₆₄（その あと Ⅴ）', ['Ⅴ（すぐに）', 'Ⅳ', 'Ⅵ'], 'すぐ Ⅴ へ 行くと 連続5度に なるので、Ⅰ₆₄ を はさむ。'],
    ['It⁺⁶（イタリアの 六）', 'Ⅴ', ['Ⅳ', 'Ⅱ', 'Ⅵ'], '増6度が 外へ 広がって 属音の オクターブに。'],
    ['N₆（ナポリの 六）', 'Ⅴ（または Ⅰ₆₄ → Ⅴ）', ['Ⅰ', 'Ⅳ', 'Ⅵ'], 'ナポリは S の はたらき。Ⅴ の 前に 置く。'],
    ['Ⅴ₇/Ⅴ（ドッペルドミナント）', 'Ⅴ', ['Ⅰ', 'Ⅳ', 'Ⅱ'], '「/」の 右の 和音へ。'],
    ['○Ⅳ（準固有の Ⅳ）', 'Ⅰ か Ⅴ', ['Ⅱ', 'Ⅲ', 'Ⅵ'], '下げた 第6音は 属音へ 落ちる。○Ⅳ → Ⅰ（変格）か ○Ⅳ → Ⅴ。']
  ]);
  nextQ('nextV7', 'h10', [
    ['Ⅴ₄₂', 'Ⅰ₆', ['Ⅰ', 'Ⅳ', 'Ⅴ'], 'バス（第7音）が 2度 下行するので、バスが 第3音の Ⅰ₆ へ。'],
    ['Ⅴ₆₅', 'Ⅰ', ['Ⅰ₆', 'Ⅳ', 'Ⅵ'], 'バスの 導音が 主音へ 上がるので Ⅰ（基本形）。'],
    ['Ⅴ₄₃', 'Ⅰ（または Ⅰ₆）', ['Ⅳ', 'Ⅵ', 'Ⅱ'], 'バスの 第5音が 主音へ 下りる（Ⅰ）か 第3音へ 上がる（Ⅰ₆）。'],
    ['Ⅱ₇', 'Ⅴ（Ⅴ₇）', ['Ⅰ', 'Ⅳ', 'Ⅵ'], 'Ⅱ₇ は S。第7音が 2度 下行して Ⅴ の 第3音（導音）に。'],
    ['Ⅰ₆₄（終止四六）', 'Ⅴ', ['Ⅰ', 'Ⅳ', 'Ⅵ'], '終止四六は Ⅴ を 飾る。上声が 2度 下行して Ⅴ に。']
  ]);
  // ★1 の 少ない 単元に やさしい 問題
  add('sevEasy', 'h12', 1, function (R) {
    var x = pick([['Ⅱ₇ の はたらきは？', 'S（下属）', ['T（主）', 'D（属）', 'どれでもない'], 'Ⅱ₇ は Ⅳ の なかま（<b>S</b>）。Ⅴ の 前に 置く。'],
      ['七の和音の 第7音は どう 進む？', '2度 下行', ['2度 上行', '跳躍', '動かない'], '第7音は 不協和な 音。<b>2度 下</b> へ 解決する。'],
      ['Ⅶ₇ の はたらきは？', 'D（属）', ['T（主）', 'S（下属）', 'どれでもない'], 'Ⅶ₇ は Ⅴ₉ の 根音省略形。<b>D</b>。'],
      ['ハ長調の Ⅱ₇ の 構成音は？', 'レ・ファ・ラ・ド', ['レ・ファ♯・ラ・ド', 'ファ・ラ・ド・ミ', 'シ・レ・ファ・ラ'], 'Ⅱ（レ）から 3度ずつ 4 つ：<b>レ・ファ・ラ・ド</b>。']], R);
    var m = mc(R, tx(x[1]), x[2].map(function (w) { return tx(w); }), 4);
    return { q: x[0], ch: m.ch, a: m.a, ex: x[3] };
  });
  add('seqAna', 'h21', 2, function (R) {
    var key = rkey(R), roots = [1, 4, 7, 3, 6, 2, 5, 1], i = Math.floor(R() * 5) + 1, s = M.scale(M.keyTonic(key, false), 'major');
    var right = H.ROMAN[roots[i + 1]], m = mc(R, tx(right), ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'].filter(function (x) { return x !== right; }).map(function (w) { return tx(w); }), 4);
    return { q: kname(key) + '。バスが ' + roots.slice(0, i + 1).map(function (d) { return N(s[d - 1]); }).join(' → ') + ' → ？ と 5度 下行（4度 上行）の 反復進行。次の 和音は？', ch: m.ch, a: m.a, ex: '次の バスは <b>' + N(s[roots[i + 1] - 1]) + '</b> ＝ <b>' + right + '</b>。Ⅰ‐Ⅳ‐Ⅶ‐Ⅲ‐Ⅵ‐Ⅱ‐Ⅴ‐Ⅰ。' };
  });


  /* ---------- ★3：1 つの 和音の まちがい（エンジンで 判定） ---------- */
  var VF = [['range', '音域の 外の 音が ある'], ['incomplete', '第3音が ない'], ['dblLT', '導音を 重ねている'], ['cross', '声部が 交差している'], ['space', '上の 声部の 間が 広すぎる'], ['ok', 'まちがいは ない']];
  var vfName = function (k) { return VF.filter(function (x) { return x[0] === k; })[0][1]; };
  add('voiceFault', 'h02', 3, function (R) {
    for (var t = 0; t < 200; t++) {
      var mn = R() < 0.3, key = rkey(R, mn), ch = C(pick([1, 4, 5, 5, 6, 2], R)), clean = R() < 0.25;
      var all = shuffle(H.cands(key, mn, ch, null, true, null, true), R).slice(0, 400), v = null, kind = null;
      for (var i = 0; i < all.length; i++) {
        var iss = H.checkChord(key, mn, ch, all[i], 0, null), ng = iss.filter(function (x) { return x.ng; });
        if (clean ? iss.length === 0 && H.nice(all[i]) : ng.length && ng.every(function (x) { return x.kind === ng[0].kind; }) && !(ng[0].kind === 'incomplete' && ng[0].msg.indexOf('第3音') < 0) && VF.some(function (x) { return x[0] === ng[0].kind; }) && iss.length === ng.length) { v = all[i]; kind = clean ? 'ok' : ng[0].kind; break; }
      }
      if (!v) continue;
      var wr = shuffle(VF.filter(function (x) { return x[0] !== kind; }), R).slice(0, 3).map(function (x) { return x[1]; }), m = mc(R, tx(vfName(kind)), wr.map(function (w) { return tx(w); }), 4);
      var dbl = (function () { var pcs = H.pcs(key, mn, ch), c = pcs.map(function () { return 0; }); v.forEach(function (p) { pcs.forEach(function (x, q) { if (x.l === p.l && x.a === p.a) c[q]++; }); }); return ['根音', '第3音', '第5音'][c.indexOf(2)] || '根音'; })();
      var msg = kind === 'ok' ? dbl + 'を 重ねた 完全和音。音域・間隔・交差も OK。' : H.checkChord(key, mn, ch, v, 0, null).map(function (x) { return x.msg; }).join('。') + '。';
      return { q: kname(key, mn) + '。この ' + H.label(ch) + ' の 4 声の 書き方で、まちがっているのは？', fig: fig(key, mn, [ch], [v], { zoom: 2.4 }), ch: m.ch, a: m.a, ex: '<b>' + vfName(kind) + '</b>。' + msg, play: [[v.map(function (p) { return M.str(p); }), 2]] };
    }
    throw new Error('voiceFault');
  });
  /* ---------- ★3：つなぎの まちがいの 種類（エンジンで 判定） ---------- */
  var TF = [['p5', '連続5度'], ['p8', '連続8度'], ['lt', '導音が 主音へ 進まない'], ['sev', '第7音が 2度 下行しない'], ['leap', '7度や オクターブを こえる 跳躍'], ['aug', '増・減音程の 進行'], ['ok', 'まちがいは ない']];
  var tfName = function (k) { return TF.filter(function (x) { return x[0] === k; })[0][1]; };
  var TP = [[C(1), C(4)], [C(4), C(5)], [C(5), C(1)], [C(2), C(5)], [C(5, 0, 1), C(1)], [C(1), C(6)], [C(6), C(2)], [C(5), C(6)], [C(1), C(5)], [C(2, 0, 1), C(5)]];
  add('transFault', 'h04', 3, function (R) {
    for (var t = 0; t < 120; t++) {
      var mn = R() < 0.3, chs = pick(TP, R); if (mn && (chs[0].d === 2 || chs[1].d === 2)) continue;
      var key = rkey(R, mn), vs = H.solve(key, mn, chs, null, R); if (!vs) continue;
      var clean = R() < 0.2, kind = 'ok', v2 = vs;
      if (clean && H.checkAll(key, mn, chs, vs).length) continue;
      if (!clean) { var br = H.breakAt(key, mn, chs, vs, 0, R); if (!br || !TF.some(function (x) { return x[0] === br.issues[0].kind; })) continue; v2 = br.vs; kind = br.issues[0].kind; if (H.checkAll(key, mn, chs, v2).some(function (x) { return !x.ng && x.i !== x.j; })) continue; }
      var wr = shuffle(TF.filter(function (x) { return x[0] !== kind; }), R).slice(0, 3).map(function (x) { return x[1]; }), m = mc(R, tx(tfName(kind)), wr.map(function (w) { return tx(w); }), 4);
      var iss = H.checkAll(key, mn, chs, v2).filter(function (x) { return x.ng; });
      return { q: kname(key, mn) + '。<b>' + H.label(chs[0]) + ' → ' + H.label(chs[1]) + '</b> の つなぎ。まちがいは？', fig: fig(key, mn, chs, v2, { zoom: 2.4, marks: [] }), ch: m.ch, a: m.a,
        ex: '<b>' + tfName(kind) + '</b>。' + (kind === 'ok' ? '共通音・導音・第7音の 進み方も 正しい。' : iss.map(function (x) { return x.msg; }).join('。') + '。'), exFig: fig(key, mn, chs, v2, { zoom: 2.4, marks: H.marksOf(iss).marks, bad: H.marksOf(iss).bad ? chs.map(function (_, i) { return H.marksOf(iss).bad[i]; }) : null }), play: function () { H.play(v2); } };
    }
    throw new Error('transFault');
  });
  analyze('anaWork', 'h14', T1.concat(T6, T10, T11), 'mix');
  analyze('anaSeq', 'h21', [[C(1), C(4), C(7, 1), C(3), C(6), C(2), C(5, 0, 1), C(1)]], false);


  /* ---------- ★3：非和声音の 分析（定義どおりに 組み立てる） ---------- */
  var NK = { pass: '経過音', neigh: '刺繍音', app: '倚音', sus: '掛留音', ant: '先取音', esc: '逸音' };
  function nctCase(R, kinds) {
    var key = rkey(R), sc = M.scale(M.keyTonic(key, false), 'major'), nmD = function (d) { return N(sc[((d % 7) + 7) % 7]); };
    var tones = function (cd) { return [cd - 1, cd + 1, cd + 3].map(function (x) { return ((x % 7) + 7) % 7; }); }, inC = function (d, cd) { return tones(cd).indexOf(((d % 7) + 7) % 7) >= 0; };
    var PAIRS = [[1, 5], [5, 1], [4, 1], [1, 4], [4, 5], [2, 5], [6, 4]];
    for (var t = 0; t < 400; t++) {
      var k = pick(kinds, R), pr = pick(PAIRS, R), c1 = pr[0], c2 = pr[1], d = 7 + Math.floor(R() * 7), dir = R() < 0.5 ? 1 : -1, ns = null;
      // ns：[音度, 和音, 拍（強/弱）, タイ]
      if (k === 'pass' && inC(d, c1) && !inC(d + dir, c1) && inC(d + 2 * dir, c1)) ns = [[d, c1, '強'], [d + dir, c1, '弱'], [d + 2 * dir, c1, '強']];
      if (k === 'neigh' && inC(d, c1) && !inC(d + dir, c1)) ns = [[d, c1, '強'], [d + dir, c1, '弱'], [d, c1, '強']];
      if (k === 'app') { var lp = d + 3 * dir; if (inC(lp, c1) && !inC(d, c2) && inC(d + dir, c2)) ns = [[lp, c1, '弱'], [d, c2, '強'], [d + dir, c2, '弱']]; }   // 跳躍で 入り、反対向きに 2度で 解決
      if (k === 'sus' && inC(d, c1) && !inC(d, c2) && inC(d - 1, c2)) ns = [[d, c1, '弱'], [d, c2, '強', 'タイで のびる'], [d - 1, c2, '弱']];
      if (k === 'ant' && !inC(d, c1) && inC(d, c2) && inC(d - dir, c1)) ns = [[d - dir, c1, '強'], [d, c1, '弱'], [d, c2, '強']];
      if (k === 'esc' && inC(d, c1) && !inC(d + dir, c1) && inC(d - 2 * dir, c2) && !inC(d - 2 * dir, c1)) ns = [[d, c1, '強'], [d + dir, c1, '弱'], [d - 2 * dir, c2, '強']];
      if (!ns) continue;
      var mark = 1, txt = ns.map(function (n, i) { return (i === mark ? '<b>【' + nmD(n[0]) + '】</b>' : nmD(n[0])) + '（' + H.ROMAN[n[1]] + '・' + n[2] + '拍' + (n[3] ? '・' + n[3] : '') + '）'; }).join(' → ');
      return { key: key, k: k, txt: txt, c1: c1, c2: c2, chord: function (cd) { return H.ROMAN[cd] + '＝' + tones(cd).map(function (x) { return N(sc[x]); }).join('・'); } };
    }
    throw new Error('nctCase');
  }
  function nctAna(id, unit, kinds, choices) {
    add(id, unit, 3, function (R) {
      var c = nctCase(R, kinds), right = NK[c.k], m = mc(R, tx(right), choices.filter(function (x) { return x !== right; }).map(function (w) { return tx(w); }), 4);
      var why = { pass: '和音の 音どうしの 間を 同じ 向きに 順次で 通りぬける', neigh: '和音の 音から となりへ 行き、同じ 音へ もどる', app: '跳躍して 強拍に 入り、2度で 解決する', sus: '前の 和音の 音が タイで のこり、強拍で ぶつかって 2度 下へ 解決する', ant: '次の 和音の 音を 弱拍で 先に 鳴らす', esc: '2度で 離れて、反対向きに 跳躍して 次の 和音へ' }[c.k];
      return { q: kname(c.key) + '。和音 ' + c.chord(c.c1) + (c.c1 !== c.c2 ? ' → ' + c.chord(c.c2) : '') + '。ソプラノ：' + c.txt + '。【 】の 音は？', ch: m.ch, a: m.a, ex: '【 】の 音は 和音に ふくまれない 非和声音。' + why + ' ので <b>' + right + '</b>。' };
    });
  }
  nctAna('nctAna1', 'h07', ['pass', 'neigh', 'app', 'sus'], ['経過音', '刺繍音', '倚音', '掛留音']);
  nctAna('nctAna2', 'h22', ['app', 'sus', 'ant', 'esc', 'pass', 'neigh'], ['経過音', '刺繍音', '倚音', '掛留音', '先取音', '逸音']);
  add('voiceFault1', 'h01', 3, function (R, st) { return GK.Q.T.voiceFault.gen(R, st); });
  add('connFault', 'h03', 3, function (R, st) { return GK.Q.T.transFault.gen(R, st); });

  // 単元に 登録
  var REG = { h01: ['voiceFault1'], h03: ['connFault'], h07: ['nctAna1'], h22: ['nctAna2'], h02: ['voiceFault'], h04: ['transFault'], h14: ['anaWork'], h21: ['seqAna', 'anaSeq'], h05: ['anaBasic'], h06: ['anaInv', 'spInv'], h08: ['anaSub'], h09: ['anaMinor'], h10: ['anaV7', 'nextV7'], h11: ['anaSix'], h12: ['sevEasy', 'anaSev', 'spSev'], h13: ['anaNine'], h15: ['anaSec', 'spSec'], h17: ['anaBor', 'spBor'], h18: ['anaNap'], h19: ['anaA6', 'spAlt', 'nextAlt'], h20: ['anaOmit'] };
  Object.keys(REG).forEach(function (u) { var U2 = GK.UNIT[u] || (GK.UNITDEF || []).filter(function (x) { return x.id === u; })[0]; if (U2) REG[u].forEach(function (t) { if (U2.types.indexOf(t) < 0) U2.types.push(t); }); });
  var nm = { voiceFault1: '配置の まちがい（応用）', connFault: '連結の まちがい（応用）', nctAna1: '非和声音の 分析', nctAna2: '非和声音の 分析（応用）', voiceFault: '和音の 書き方の まちがい', transFault: 'つなぎの まちがいの 種類', anaWork: '和声分析（総合）', anaSeq: '和声分析（反復進行）', anaBasic: '和声分析（基本）', anaInv: '和声分析（転回形）', anaSub: '和声分析（副三和音）', anaMinor: '和声分析（短調）', anaV7: '和声分析（Ⅴ₇）', anaSix: '和声分析（四六）', anaSev: '和声分析（七の和音）', anaNine: '和声分析（Ⅴ₉）', anaSec: '和声分析（副属和音）', anaBor: '和声分析（準固有）', anaNap: '和声分析（ナポリ）', anaA6: '和声分析（増六）', anaOmit: '和声分析（根音省略）',
    spInv: '構成音から 和音記号（転回形）', spSev: '構成音から 和音記号（七の和音）', spSec: '構成音から 和音記号（副属和音）', spAlt: '構成音から 和音記号（ナポリ・増六）', spBor: '構成音から 和音記号（準固有）', nextAlt: '変化和音の 進み先', nextV7: 'Ⅴ₇ 転回形・Ⅱ₇ の 進み先', sevEasy: '七の和音の きほん', seqAna: '反復進行の バス' };
  Object.assign(GK.TYPE_NAME, nm);
  var hint = {};
  Object.keys(nm).forEach(function (k) {
    hint[k] = /^ana/.test(k) ? 'まず いちばん 下の 音（バス）を 読み、つぎに 4 声の 音を 集めて 3度ずつ 積みなおそう。臨時記号の 音は 変化和音の 目じるし。'
      : /^sp/.test(k) ? '音を 3度ずつ 積みなおして 根音を さがし、バスが 根音・第3音・第5音・第7音の どれかで 転回形を きめよう。'
      : /^next/.test(k) ? 'その 和音の はたらき（S・D）と、不協和な 音の 解決の 向きを 思い出そう。'
      : /^nctAna/.test(k) ? '【 】の 前と 後ろの 音の 動き（順次・跳躍・同じ音）と、拍（強・弱）、タイ・和音の かわり目を 見よう。'
      : k === 'voiceFault' || k === 'voiceFault1' ? '音域・必要な 音（第3音）・導音の 重複・声部の 順番と 間隔を 1 つずつ チェック。'
      : k === 'transFault' || k === 'connFault' ? '2 声ずつ 組に して 5度・8度の 連続を、導音・第7音は 進み先を、各声部は 跳躍の 大きさを 見よう。'
      : k === 'seqAna' ? 'バスを 5度 下（4度 上）へ 動かそう。' : '七の和音の はたらきと 第7音の 進み方を 思い出そう。';
  });
  GK.HINTS = Object.assign(GK.HINTS || {}, hint);
  GK.Q.addTips({ 'バスで 転回形、4 声の 音を 3度ずつ 積んで 根音と 種類': 'anaWork,anaSeq,anaBasic,anaInv,anaSub,anaMinor,anaV7,anaSix,anaSev,anaNine,anaSec,anaBor,anaNap,anaA6,anaOmit,spInv,spSev,spSec,spAlt,spBor' });
})();
