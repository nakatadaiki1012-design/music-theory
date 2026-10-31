/* =========================================================
   楽典ラボ：問題の レパートリーを ふやす（演習・ゲーム 共通）
   音程の たし算・複音程・近親調・音階の 何番目・半音の 数
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, U = GK.Q.util;
  var N = function (p) { return GK.nm(p); };
  var mc = U.mc, tx = U.tx, pick = U.pick, ri = U.ri, add = U.add;
  var IV = [[2, 'M'], [2, 'm'], [3, 'M'], [3, 'm'], [4, 'P'], [5, 'P'], [6, 'M'], [6, 'm'], [7, 'M'], [7, 'm'], [4, 'A'], [5, 'd']];
  var ivName = function (d, q) { return M.QN[q] + d + '度'; };
  var near = function (d, q) { // まちがえやすい 音程の 名前
    var r = [], qs = d === 1 || d === 4 || d === 5 || d === 8 ? ['P', 'A', 'd'] : ['M', 'm', 'A', 'd'];
    qs.forEach(function (x) { if (x !== q) r.push(ivName(d, x)); });
    [d - 1, d + 1].forEach(function (dd) { if (dd >= 1) r.push(ivName(dd, dd === 1 || dd === 4 || dd === 5 || dd === 8 || dd === 11 || dd === 12 ? 'P' : q === 'P' ? 'M' : q)); });
    return r;
  };
  var nat = function (R) { return { l: ri(0, 6, R), a: 0, o: 4 }; };

  // 音程の たし算（積み重ね）
  add('ivAdd', 'u06', 2, function (R) {
    for (var t = 0; t < 40; t++) {
      var a = pick([[3, 'M'], [3, 'm'], [2, 'M'], [2, 'm'], [4, 'P']], R), b = pick([[3, 'M'], [3, 'm'], [2, 'M'], [4, 'P'], [2, 'm']], R), base = nat(R);
      var p1 = M.up(base, a[0], a[1]), p2 = M.up(p1, b[0], b[1]), iv = M.interval(base, p2);
      if (iv.q === '?' || Math.abs(p1.a) > 1 || Math.abs(p2.a) > 1 || iv.deg > 8) continue;
      var right = iv.name, m = mc(R, tx(right), near(iv.deg, iv.q).map(function (s) { return tx(s); }));
      return { q: '<b>' + ivName(a[0], a[1]) + '</b> の 上に <b>' + ivName(b[0], b[1]) + '</b> を 重ねると、いちばん下から いちばん上までは？', ch: m.ch, a: m.a,
        ex: '例：' + N(base) + ' → ' + N(p1) + '（' + ivName(a[0], a[1]) + '）→ ' + N(p2) + '（' + ivName(b[0], b[1]) + '）。' + N(base) + '〜' + N(p2) + ' は <b>' + right + '</b>。度数は「足して 1 を ひく」（' + a[0] + '＋' + b[0] + '−1＝' + iv.deg + '）。' };
    }
    throw new Error('ivAdd');
  });
  // 複音程 ↔ 単音程
  add('ivComp', 'u06', 2, function (R) {
    var x = pick(IV.slice(0, 10), R), simple = ivName(x[0], x[1]), comp = ivName(x[0] + 7, x[1]), up = R() < 0.5;
    if (up) {
      var wr = [ivName(x[0] + 8, x[1]), ivName(x[0] + 6, x[1]), ivName(x[0] + 7, x[1] === 'M' ? 'm' : x[1] === 'm' ? 'M' : 'A'), ivName(x[0] + 9, x[1])];
      var m = mc(R, tx(comp), wr.map(function (s) { return tx(s); }));
      return { q: '1 オクターブと <b>' + simple + '</b> を 合わせた 音程（複音程）は？', ch: m.ch, a: m.a, ex: '1 オクターブ ＝ 7 度 ぶん 広がる。' + x[0] + '＋7＝' + (x[0] + 7) + ' → <b>' + comp + '</b>。質（長・短・完全）は そのまま。' };
    }
    var wr2 = near(x[0], x[1]).concat([ivName(x[0] + 1, x[1])]), m2 = mc(R, tx(simple), wr2.map(function (s) { return tx(s); }));
    return { q: '複音程 <b>' + comp + '</b> を 単音程に 直すと？', ch: m2.ch, a: m2.a, ex: (x[0] + 7) + '−7＝' + x[0] + ' → <b>' + simple + '</b>。質は そのまま。' };
  });
  // 近親調（属調・下属調・平行調・同主調）
  var REL = [['dom', '属調'], ['sub', '下属調'], ['rel', '平行調'], ['par', '同主調']];
  var relKey = function (f, minor, k) { return k === 'dom' ? [f + 1, minor] : k === 'sub' ? [f - 1, minor] : k === 'rel' ? [f, !minor] : minor ? [f + 3, false] : [f - 3, true]; };
  add('keyNeighbor', 'u09', 2, function (R) {
    for (var t = 0; t < 40; t++) {
      var minor = R() < 0.4, f = ri(-4, 4, R), k = pick(REL, R), ans = relKey(f, minor, k[0]);
      if (Math.abs(ans[0]) > 7) continue;
      var right = M.keyName(ans[0], ans[1]), wr = [];
      REL.forEach(function (r) { if (r[0] !== k[0]) { var x = relKey(f, minor, r[0]); if (Math.abs(x[0]) <= 7) wr.push(M.keyName(x[0], x[1])); } });
      wr.push(M.keyName(f + 2, minor)); wr = wr.filter(function (s) { return s !== right; });
      var m = mc(R, tx(right), wr.map(function (s) { return tx(s); }));
      return { q: '<b>' + M.keyName(f, minor) + '</b> の <b>' + k[1] + '</b> は？', ch: m.ch, a: m.a,
        ex: '属調 ＝ 5度 上（♯が 1 つ ふえる）、下属調 ＝ 5度 下（♭が 1 つ ふえる）、平行調 ＝ 同じ 調号の 長調↔短調、同主調 ＝ 同じ 主音の 長調↔短調。' + M.keyName(f, minor) + ' の ' + k[1] + ' は <b>' + right + '</b>。' };
    }
    throw new Error('keyNeighbor');
  });
  // 音階の 何番目の 音（主音・属音・導音 など）
  add('degNote', 'u07', 2, function (R) {
    var minor = R() < 0.35, f = ri(-4, 4, R), sc = M.scale(M.keyTonic(f, minor), minor ? 'harmonic' : 'major').slice(0, 7), d = ri(1, 6, R);
    var right = N(sc[d]), wr = sc.filter(function (_, i) { return i !== d; }).map(N);
    var m = mc(R, tx(right), wr.map(function (s) { return tx(s); }));
    return { q: '<b>' + M.keyName(f, minor) + '</b>' + (minor ? '（和声短音階）' : '') + ' の <b>' + M.DEG[d] + '</b>（第' + (d + 1) + '音）は？', ch: m.ch, a: m.a,
      ex: M.keyName(f, minor) + '：' + sc.map(N).join(' ') + '。' + M.DEG[d] + ' は ' + (d + 1) + ' 番め → <b>' + right + '</b>。' };
  });
  // 2 つの 音の 間の 半音の 数
  add('semiCount', 'u05', 1, function (R) {
    var a = { l: ri(0, 6, R), a: pick([0, 0, 0, 1, -1], R), o: 4 }, iv = pick([[2, 'M'], [2, 'm'], [3, 'M'], [3, 'm'], [4, 'P'], [5, 'P'], [6, 'm'], [6, 'M']], R), b = M.up(a, iv[0], iv[1]);
    if (b.a > 1 || b.a < -1 || M.midi(b) <= M.midi(a)) b = M.up(a, 3, 'M');
    var n = M.midi(b) - M.midi(a), wr = [n - 2, n - 1, n + 1, n + 2].filter(function (x) { return x > 0; }).map(String);
    var m = mc(R, tx(String(n)), wr.map(function (s) { return tx(s + ' 個'); }).concat([]), 4);
    m.ch = m.ch.map(function (c) { return /個$/.test(c) ? c : c + ' 個'; });
    return { q: '<b>' + N(a) + '</b> から 上の <b>' + N(b) + '</b> まで、半音は いくつ？', ch: m.ch, a: m.a, ex: '鍵盤で となりあう 鍵の 間が 半音 1 つ。' + N(a) + ' → ' + N(b) + ' は <b>' + n + ' 個</b>（' + M.interval(a, b).name + '）。' };
  });

  [['u06', ['ivAdd', 'ivComp']], ['u09', ['keyNeighbor']], ['u07', ['degNote']], ['u05', ['semiCount']]].forEach(function (x) { var u = GK.UNIT[x[0]]; if (u) x[1].forEach(function (id) { if (u.types.indexOf(id) < 0) u.types.push(id); }); });
  Object.assign(GK.TYPE_NAME, { ivAdd: '音程の たし算', ivComp: '複音程と 単音程', keyNeighbor: '近親調の 名前', degNote: '音階の 何番めの 音', semiCount: '半音の 数' });
  GK.Q.addTips({ '音程の たし算は 度数を 足して 1 を ひく。1 オクターブ ＝ 7 度': 'ivAdd,ivComp', '属調は 5度上・下属調は 5度下・平行調は 同じ調号・同主調は 同じ主音': 'keyNeighbor', '主音・上主音・中音・下属音・属音・下中音・導音': 'degNote', '鍵盤の となりどうしが 半音 1 つ': 'semiCount' });
})();
