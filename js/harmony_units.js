/* =========================================================
   楽典ラボ：和声法の 単元（授業・問題）
   h01 四声部と配置　h02 和音の重ね方　h03 和音の連結　h04 禁則　h05 終止と進行
   h06 転回形と数字　h07 非和声音　h08 副三和音と七の和音　h09 短調の和声
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, F = GK.F, C = M.COL, U = GK.Q.util, L = GK.L;
  var N = function (p) { return GK.nm(p); };
  var mc = U.mc, tx = U.tx, tw = U.tw, pick = U.pick, ri = U.ri, shuffle = U.shuffle, add = U.add, table = L.table, MEMO = L.MEMO;
  var mid = function (p) { return M.midi(p); };
  var Ch = function (d, inv, sev) { return { d: d, inv: inv || 0, sev: !!sev }; };
  var pn = function (p) { return N(p) + p.o; }; // ド4 ＝ 中央のド
  var VN = H.VNAME, PAIR = ['S‐A', 'S‐T', 'S‐B', 'A‐T', 'A‐B', 'T‐B'];
  var kname = function (key, minor) { return H.keyName(key, minor); };
  var rkey = function (R, minor) { return pick(minor ? H.KEYS.min : H.KEYS.maj, R); };
  var vtxt = function (v) { return v.map(function (p) { return N(p); }).join('・'); };
  var KIND = { p5: '連続5度', p8: '連続8度', hidden: '隠伏5度・8度', lt: '導音の 解決の まちがい', sev: '第7音の 解決の まちがい', nine: '第9音の 解決の まちがい', cross: '声部の 交差', space: '声部の 間隔が 広すぎる', dblLT: '導音の 重複', incomplete: '和音の 音が そろっていない', leap: '1 オクターブを こえる 跳躍', aug: '増・減の 音程の 進行', overlap: '声部の 重なり' };
  H.KIND = KIND;
  var fig = H.fig;
  var pairs = function (list, R) { return pick(list, R); };

  // 配置の 良い 1 和音（4 声）をランダムに
  function oneChord(key, minor, ch, R, pred) {
    var c = shuffle(H.cands(key, minor, ch, null, false, null).filter(H.nice), R);
    if (pred) c = c.filter(pred);
    return c[0] || null;
  }
  var spreadOf = function (v) { return mid(v[0]) - mid(v[2]); };

  /* =================== h01 四声部と配置 =================== */
  add('vFind', 'h01', 1, function (R) {
    var key = rkey(R), ch = pick([Ch(1), Ch(4), Ch(5)], R), v = oneChord(key, false, ch, R), j = ri(0, 3, R), col = [null, null, null, null]; col[j] = '#d3302a';
    var m = mc(R, tx(VN[j]), VN.map(function (x) { return tx(x); }));
    return { q: '赤い音は どの声部？', fig: fig(key, false, [ch], [v], { col: [col], nolab: true, zoom: 2.4 }), ch: m.ch, a: m.a, ex: '上の五線の <b>上の音 ＝ ソプラノ</b>、下の音 ＝ アルト。下の五線の 上の音 ＝ テノール、<b>いちばん 下 ＝ バス</b>。赤い音は <b>' + VN[j] + '</b>（' + N(v[j]) + '）。', exFig: fig(key, false, [ch], [v], { color: true, names: true, nolab: true, zoom: 2.4 }) };
  });
  add('stemQ', 'h01', 1, function (R) {
    var top = R() < 0.5, ans = top ? 1 : 3, key = 0, ch = Ch(1), v = oneChord(0, false, ch, R);
    var m = mc(R, tx(VN[ans]), VN.map(function (x) { return tx(x); }));
    return { q: '<b>' + (top ? '上' : '下') + 'の 五線</b> で、符尾が <b>下向き</b> に なる 声部は？', fig: fig(0, false, [ch], [v], { color: true, names: true, nolab: true, zoom: 2.4 }), ch: m.ch, a: m.a, ex: '同じ五線に 2 声 書くので 符尾の 向きで 区別する。上の五線は <b>ソプラノ ＝ 上向き、アルト ＝ 下向き</b>。下の五線は <b>テノール ＝ 上向き、バス ＝ 下向き</b>。' };
  });
  add('vRangeTxt', 'h01', 2, function (R) {
    var j = ri(0, 3, R), rg = function (x) { return pn(M.p(H.RANGE[x][0])) + '〜' + pn(M.p(H.RANGE[x][1])); };
    var m = mc(R, tx(rg(j)), [0, 1, 2, 3].map(function (x) { return tx(rg(x)); }));
    return { q: '<b>' + VN[j] + '</b> の 音域は？（ド4 ＝ 中央のド）', ch: m.ch, a: m.a, ex: [0, 1, 2, 3].map(function (x) { return VN[x] + '：' + rg(x); }).join('、') + '。', exFig: { c: 'vranges' } };
  });
  add('rangeOut', 'h01', 2, function (R) {
    for (var t = 0; t < 40; t++) {
      var key = rkey(R), ch = pick([Ch(1), Ch(4), Ch(5)], R), c = H.cands(key, false, ch, null, true, null, true);
      var good = shuffle(c.filter(function (v) { var is = H.checkChord(key, false, ch, v); return is.length === 1 && is[0].kind === 'range' && H.nice(v) !== null; }), R);
      if (!good.length) continue;
      var v = good[0], is = H.checkChord(key, false, ch, v), j = is[0].v[0];
      var m = mc(R, tx(VN[j]), VN.map(function (x) { return tx(x); }));
      return { q: '音域を はみ出している 声部は？', fig: fig(key, false, [ch], [v], { nolab: true, zoom: 2.4 }), ch: m.ch, a: m.a, ex: VN[j] + 'の ' + pn(v[j]) + ' は 音域（' + pn(M.p(H.RANGE[j][0])) + '〜' + pn(M.p(H.RANGE[j][1])) + '）の 外。', exFig: fig(key, false, [ch], [v], { bad: [[j]], nolab: true, zoom: 2.4 }) };
    }
    throw new Error('rangeOut');
  });
  add('hpos', 'h01', 1, function (R) {
    var open = R() < 0.5, key = rkey(R), ch = pick([Ch(1), Ch(4), Ch(5)], R);
    var v = oneChord(key, false, ch, R, function (x) { return (spreadOf(x) > 12) === open; });
    if (!v) { open = !open; v = oneChord(key, false, ch, R, function (x) { return (spreadOf(x) > 12) === open; }); }
    var m = mc(R, tx(open ? '開離配置' : '密集配置'), [tx('密集配置'), tx('開離配置')], 2);
    return { q: 'この配置は？', fig: fig(key, false, [ch], [v], { nolab: true, zoom: 2.4 }), ch: m.ch, a: m.a, ex: 'ソプラノ（' + pn(v[0]) + '）とテノール（' + pn(v[2]) + '）の 間は ' + (spreadOf(v) > 12 ? '1 オクターブより 広い → <b>開離配置</b>' : '1 オクターブ 以内 → <b>密集配置</b>') + '。' };
  });
  add('spaceFind', 'h01', 2, function (R) {
    for (var t = 0; t < 60; t++) {
      var key = rkey(R), ch = pick([Ch(1), Ch(4), Ch(5)], R), c = shuffle(H.cands(key, false, ch, null, true, null), R), want = ri(0, 3, R), v = null, pr = null;
      c.forEach(function (x) {
        if (v) return;
        var is = H.checkChord(key, false, ch, x), sa = mid(x[0]) - mid(x[1]), at = mid(x[1]) - mid(x[2]), tb = mid(x[2]) - mid(x[3]);
        if (want === 0 && is.length === 1 && is[0].kind === 'space' && is[0].v[0] === 0) { v = x; pr = 0; }
        else if (want === 1 && is.length === 1 && is[0].kind === 'space' && is[0].v[0] === 1) { v = x; pr = 1; }
        else if (want >= 2 && !H.ngCount(is) && tb > 12 && sa <= 12 && at <= 12) { v = x; pr = 3; }
      });
      if (!v) continue;
      var opts = ['ソプラノ と アルト', 'アルト と テノール', 'テノール と バス', 'どこも まちがっていない'], m = mc(R, tx(opts[pr]), opts.map(function (x) { return tx(x); }));
      return { q: '声部の 間隔が 広すぎる ところは？', fig: fig(key, false, [ch], [v], { nolab: true, zoom: 2.4 }), ch: m.ch, a: m.a, ex: pr === 3 ? 'S‐A、A‐T は どちらも 1 オクターブ 以内。<b>T‐B は はなれて よい</b> ので まちがいは ない。' : (pr === 0 ? 'ソプラノ（' + pn(v[0]) + '）と アルト（' + pn(v[1]) + '）が 1 オクターブより はなれている' : 'アルト（' + pn(v[1]) + '）と テノール（' + pn(v[2]) + '）が 1 オクターブより はなれている') + '。S‐A と A‐T は <b>1 オクターブ 以内</b>（T‐B だけは はなれて よい）。', exFig: fig(key, false, [ch], [v], { bad: [pr === 0 ? [0, 1] : pr === 1 ? [1, 2] : []], nolab: true, zoom: 2.4 }) };
    }
    throw new Error('spaceFind');
  });
  // 音域の 図（4 声の いちばん 低い音と 高い音）
  F.CUSTOM.vranges = function (box) {
    var ns = [];
    [0, 1, 2, 3].forEach(function (j) { [0, 1].forEach(function (k) { var p = H.RANGE[j][k]; ns.push({ k: p, d: 'w', staff: j < 2 ? 1 : 2, c: H.VCOL[j], lab: k === 0 ? 'SATB'.charAt(j) : '', lc: H.VCOL[j] }); }); });
    M.score(box, { clef: 'grand', notes: ns, minBar: 300, sp: 40, ls: 14, zoom: 2.2 });
  };

  /* =================== h02 和音の重ね方 =================== */
  var T3 = [Ch(1), Ch(4), Ch(5), Ch(2), Ch(6)];
  add('doubled', 'h02', 1, function (R) {
    var key = rkey(R), ch = pick(T3, R), want = pick([0, 0, 1, 2], R), pcs = H.pcs(key, false, ch);
    var v = oneChord(key, false, ch, R, function (x) { var cnt = pcs.map(function (c) { return x.filter(function (p) { return p.l === c.l && p.a === c.a; }).length; }); return cnt[want] === 2; });
    if (!v) { want = 0; v = oneChord(key, false, ch, R, function (x) { return x.filter(function (p) { return p.l === pcs[0].l && p.a === pcs[0].a; }).length === 2; }); }
    var nm = ['根音', '第3音', '第5音'], m = mc(R, tx(nm[want]), nm.map(function (x) { return tx(x); }), 3);
    return { q: key === 0 ? 'この ' + H.label(ch) + ' の 和音で、2 回 出てくる（重なっている）音は？' : kname(key) + '。この ' + H.label(ch) + ' の 和音で、2 回 出てくる音は？', fig: fig(key, false, [ch], [v], { zoom: 2.4 }), ch: m.ch, a: m.a, ex: H.label(ch) + ' ＝ ' + pcs.map(N).join('・') + '。4 声で 3 つの音だから 1 つが 重なる。ここでは <b>' + nm[want] + '（' + N(pcs[want]) + '）</b>。' + (want === 0 ? '根音を 重ねるのが 基本。' : '') };
  });
  add('posName', 'h02', 1, function (R) {
    var key = rkey(R), ch = pick([Ch(1), Ch(4), Ch(5)], R), pcs = H.pcs(key, false, ch), want = ri(0, 2, R);
    var v = oneChord(key, false, ch, R, function (x) { return x[0].l === pcs[want].l && x[0].a === pcs[want].a; });
    if (!v) { want = 0; v = oneChord(key, false, ch, R, function (x) { return x[0].l === pcs[0].l && x[0].a === pcs[0].a; }); }
    var nm = ['8度位置（ソプラノが 根音）', '3度位置（ソプラノが 第3音）', '5度位置（ソプラノが 第5音）'], m = mc(R, tx(nm[want]), nm.map(function (x) { return tx(x); }), 3);
    return { q: 'この 和音の 位置は？（ソプラノの 音で きまる）', fig: fig(key, false, [ch], [v], { zoom: 2.4 }), ch: m.ch, a: m.a, ex: 'ソプラノは ' + N(v[0]) + ' ＝ ' + ['根音', '第3音', '第5音'][want] + ' → <b>' + nm[want].split('（')[0] + '</b>。', exFig: fig(key, false, [ch], [v], { col: [[H.VCOL[0], null, null, null]], zoom: 2.4 }) };
  });
  add('missingNote', 'h02', 2, function (R) {
    for (var t = 0; t < 60; t++) {
      var key = rkey(R), ch = pick([Ch(1), Ch(4), Ch(5)], R), pcs = H.pcs(key, false, ch), c = shuffle(H.cands(key, false, ch, null, true, null), R), want = ri(0, 3, R), v = null, q = -1;
      c.forEach(function (x) {
        if (v) return; var is = H.checkChord(key, false, ch, x);
        if (want < 3) { if (is.length === 1 && is[0].kind === 'incomplete' && is[0].msg.indexOf(['根音', '第3音', '第5音'][want]) === 0) { v = x; q = want; } }
        else if (!H.ngCount(is)) { v = x; q = 3; }
      });
      if (!v) continue;
      var nm = ['根音', '第3音', '第5音', 'そろっている（足りない音は ない）'], m = mc(R, tx(nm[q]), nm.map(function (x) { return tx(x); }));
      return { q: 'この ' + H.label(ch) + ' の 和音で 足りない 音は？', fig: fig(key, false, [ch], [v], { zoom: 2.4 }), ch: m.ch, a: m.a, ex: H.label(ch) + ' ＝ ' + pcs.map(N).join('・') + '（根音・第3音・第5音）。' + (q === 3 ? '3 つとも そろっている → <b>完全な 和音</b>。' : '<b>' + nm[q] + '（' + N(pcs[q]) + '）</b>が ない。' + (q === 1 ? '第3音は 長か 短かを きめる 音なので <b>省略できない</b>。' : '')) };
    }
    throw new Error('missingNote');
  });
  add('dblNG', 'h02', 2, function (R) {
    for (var t = 0; t < 60; t++) {
      var key = rkey(R), ch = Ch(5), c = shuffle(H.cands(key, false, ch, null, true, null), R), v = null;
      c.forEach(function (x) { if (!v && H.nice(x)) { var is = H.checkChord(key, false, ch, x); if (is.length === 1 && is[0].kind === 'dblLT') v = x; } });
      if (!v) continue;
      var lt = H.lt(key, false), m = mc(R, tx('導音を 重ねている'), [tx('導音を 重ねている'), tx('第3音を 省略している'), tx('声部が 交差している'), tx('バスが 根音ではない')]);
      return { q: kname(key) + '。この Ⅴ の 和音の まちがいは？', fig: fig(key, false, [ch], [v], { zoom: 2.4 }), ch: m.ch, a: m.a, ex: 'Ⅴ の 第3音（' + N(lt) + '）は <b>導音</b>。導音は 主音へ 進みたがる 強い音なので <b>重ねると 2 つの 声が 同じ所へ 進んで しまう</b>。重ねてはいけない。', exFig: fig(key, false, [ch], [v], { bad: [v.map(function (p, j) { return p.l === lt.l && p.a === lt.a ? j : -1; }).filter(function (x) { return x >= 0; })], zoom: 2.4 }) };
    }
    throw new Error('dblNG');
  });

  /* =================== h03 和音の連結 =================== */
  var PAIRS1 = [[1, 4], [1, 5], [4, 1], [5, 1], [4, 5], [1, 6], [6, 4], [2, 5], [5, 6], [6, 2], [4, 2]];
  add('commonTone', 'h03', 1, function (R) {
    var key = rkey(R), pr = pick(PAIRS1, R), a = Ch(pr[0]), b = Ch(pr[1]), pa = H.pcs(key, false, a), pb = H.pcs(key, false, b);
    var com = pa.filter(function (x) { return pb.some(function (y) { return x.l === y.l && x.a === y.a; }); });
    var all = pa.concat(pb), seen = {}; all = all.filter(function (x) { var k = x.l + ':' + x.a; if (seen[k]) return false; seen[k] = 1; return true; });
    var right = com.length ? tx(com.map(N).join('・')) : tx('共通音は ない');
    var wrongs = [tx('共通音は ない')].concat(all.map(function (x) { return tx(N(x)); })); if (com.length === 2) wrongs.push(tx(com.map(N).reverse()[0])); else wrongs = wrongs.concat(all.slice(0, 3).map(function (x, i) { return tx(N(x) + '・' + N(all[(i + 2) % all.length])); }));
    var m = mc(R, right, wrongs);
    return { q: kname(key) + '。<b>' + H.label(a) + '</b> と <b>' + H.label(b) + '</b> の 共通音は？', ch: m.ch, a: m.a, ex: H.label(a) + ' ＝ ' + pa.map(N).join('・') + '、' + H.label(b) + ' ＝ ' + pb.map(N).join('・') + '。' + (com.length ? '共通音は <b>' + com.map(N).join('・') + '</b>。共通音は 同じ声部で そのまま 保つと なめらか。' : '<b>共通音は ない</b>。こういう ときは 上の 3 声を バスと 反対に 動かす。') };
  });
  add('holdVoice', 'h03', 2, function (R) {
    for (var t = 0; t < 80; t++) {
      var key = rkey(R), pr = pick([[1, 4], [1, 5], [4, 1], [5, 1], [1, 6], [6, 4], [2, 5]], R), chs = [Ch(pr[0]), Ch(pr[1])], pc = H.pairOK(key, false, chs, R); if (!pc) continue;
      var best = null; shuffle(pc.B, R).forEach(function (v1) { var cm = H.common(pc.v0, v1).filter(function (j) { return j < 3; }); if (!best && cm.length === 1 && H.nice(v1)) best = { v1: v1, j: cm[0] }; });
      if (!best) continue;
      var vs = [pc.v0, best.v1], col = [[null, null, null, null], [null, null, null, null]]; col[0][best.j] = col[1][best.j] = '#c08a0e';
      var m = mc(R, tx(VN[best.j]), VN.slice(0, 3).map(function (x) { return tx(x); }), 3);
      return { q: kname(key) + '。<b>' + H.label(chs[0]) + ' → ' + H.label(chs[1]) + '</b>。共通音（' + N(vs[0][best.j]) + '）を そのまま 保っている 声部は？', fig: fig(key, false, chs, vs, { zoom: 2.4 }), ch: m.ch, a: m.a, ex: '同じ高さの 音が 続いているのは <b>' + VN[best.j] + '（' + pn(vs[0][best.j]) + '）</b>。共通音を 保ち、ほかの声部は なるべく 近い音へ 動く（最短進行）。', exFig: fig(key, false, chs, vs, { col: col, zoom: 2.4 }) };
    }
    throw new Error('holdVoice');
  });
  add('contraryQ', 'h03', 2, function (R) {
    for (var t = 0; t < 80; t++) {
      var key = rkey(R), pr = pick([[4, 5], [5, 6], [1, 2], [6, 2], [4, 2]], R), chs = [Ch(pr[0]), Ch(pr[1])], pc = H.pairOK(key, false, chs, R); if (!pc) continue;
      var best = null; shuffle(pc.B, R).forEach(function (v1) {
        if (best || !H.nice(v1) || H.common(pc.v0, v1).some(function (j) { return j < 3; })) return;
        var bd = mid(v1[3]) - mid(pc.v0[3]); if (!bd) return;
        if ([0, 1, 2].every(function (j) { var d = mid(v1[j]) - mid(pc.v0[j]); return d && (d > 0) !== (bd > 0); })) best = v1;
      });
      if (!best) continue;
      var vs = [pc.v0, best], opts = ['バスと 反対の 向きに 動く', 'バスと 同じ向きに 動く', '共通音を 保って 動かない', '1 声だけ 動く'], m = mc(R, tx(opts[0]), opts.map(function (x) { return tx(x); }));
      return { q: kname(key) + '。<b>' + H.label(chs[0]) + ' → ' + H.label(chs[1]) + '</b>。共通音が ない とき、上の 3 声（S・A・T）は バスに 対して どう 動く？', fig: fig(key, false, chs, vs, { zoom: 2.4 }), ch: m.ch, a: m.a, ex: H.label(chs[0]) + ' と ' + H.label(chs[1]) + ' に 共通音は ない。こんな とき 上の 3 声を <b>バスと 反対の 向き</b> に 動かすと、連続5度・8度を さけられて きれいに つながる。', exFig: fig(key, false, chs, vs, { marks: [], zoom: 2.4 }) };
    }
    throw new Error('contraryQ');
  });
  // 穴うめ：次の和音の 1 つの声部の 音は？（pairs：和音の 組、minor：短調か）
  function fillGen(pairs, minor, label) {
    return function (R, st) {
      for (var t = 0; t < 160; t++) {
        var key = rkey(R, minor), pr = pick(pairs, R), chs = [Ch(pr[0], 0, pr[2]), Ch(pr[1], 0, pr[3])], pc = H.pairOK(key, minor, chs, R); if (!pc) continue;
        var tg = shuffle(pc.B, R)[0], j = st >= 3 ? 2 : 1;
        var same = pc.B.filter(function (v) { return [0, 1, 2, 3].every(function (q) { return q === j || mid(v[q]) === mid(tg[q]); }); });
        var pcsOk = {}; same.forEach(function (v) { pcsOk[v[j].l + ':' + v[j].a] = 1; });
        if (Object.keys(pcsOk).length !== 1) continue;
        var pcs = H.pcs(key, minor, chs[1]), sc = M.scale(M.keyTonic(key, minor), minor ? 'harmonic' : 'major').slice(0, 7), pool = [];
        pcs.concat(sc).forEach(function (x) { if (!pool.some(function (y) { return y.l === x.l && y.a === x.a; })) pool.push({ l: x.l, a: x.a }); });
        var right = { l: tg[j].l, a: tg[j].a }, wrongs = pool.filter(function (x) { return !(x.l === right.l && x.a === right.a); });
        var why = function (x) {
          var best = null; for (var o = 2; o <= 6; o++) { var p = { l: x.l, a: x.a, o: o }; if (mid(p) < mid(H.RANGE[j][0]) || mid(p) > mid(H.RANGE[j][1])) continue; if (!best || Math.abs(mid(p) - mid(pc.v0[j])) < Math.abs(mid(best) - mid(pc.v0[j]))) best = p; }
          if (!best) return null; var v2 = tg.slice(); v2[j] = best;
          var is = H.checkChord(key, minor, chs[1], v2, 1, chs[0]).concat(H.checkTrans(key, minor, chs[0], pc.v0, chs[1], v2, 0)).filter(function (z) { return z.ng; });
          return is.length ? N(x) + ' だと「' + is[0].msg + '」' : null;
        };
        var opts = shuffle(wrongs, R).map(function (x) { return tw(N(x), why(x) || (N(x) + ' では 和音が そろわない・つながらない'), x.l + ':' + x.a); });
        var m = mc(R, tx(N(right), right.l + ':' + right.a), opts), q0 = [[], [j]];
        return { q: kname(key, minor) + '。<b>' + H.label(chs[0]) + ' → ' + H.label(chs[1]) + '</b>。？ に 入る ' + VN[j] + 'の 音は？', fig: fig(key, minor, chs, [pc.v0, tg], { q: q0, zoom: 2.4 }), ch: m.ch, a: m.a, why: m.why, ex: '他の 3 声は きまっているので、<b>' + N(right) + '</b> を 入れると ' + H.label(chs[1]) + ' の 音が そろい、連続5度・8度や 導音・第7音の ルールも まもれる。', exFig: fig(key, minor, chs, [pc.v0, tg], { zoom: 2.4 }), play: [[pc.v0.map(H.str), 1.6], [tg.map(H.str), 3]] };
      }
      throw new Error('fill');
    };
  }
  add('fillVoice', 'h03', 2, fillGen(PAIRS1.map(function (x) { return [x[0], x[1]]; }), false));

  /* =================== 授業（h01〜h03） =================== */
  var V4 = function (a, b, c, d) { return [a, b, c, d].map(function (x) { return x; }); };
  var vv = function () { return Array.prototype.slice.call(arguments).map(H.mk); };
  var IVVI = vv('C5 G4 E4 C3', 'C5 A4 F4 F3', 'B4 G4 D4 G3', 'C5 G4 E4 C3'), IVVI_CH = [Ch(1), Ch(4), Ch(5), Ch(1)];
  var gold = '#c08a0e';
  var row2 = function (a, b, ta, tb) { var x = Object.assign({}, a, { ttl: ta }), y = Object.assign({}, b, { ttl: tb }); return { row: [x, y] }; };
  GK.UNITDEF = GK.UNITDEF || [];
  GK.UNITDEF.push(
    {
      id: 'h01', title: '四声部と 配置', en: 'Four-Part Writing', sym: '𝄞', goal: 'S・A・T・B の 音域・書き方・配置が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '和声法は「4 人の 合唱」で 考える', b: '和音を <b>4 つの 声</b> で つなぐ 勉強。上から <b>ソプラノ（S）・アルト（A）・テノール（T）・バス（B）</b>。それぞれが <em>なめらかに 歌える</em> ように 音を えらぶ。', fig: fig(0, false, IVVI_CH, IVVI, { color: true, names: true, zoom: 2.2 }) },
        { k: 'ポイント 1', h: '声部ごとの 音域', b: '人の声には 出せる 高さの 範囲が ある。<b>S：ド4〜ソ5　A：ソ3〜レ5　T：ド3〜ソ4　B：ファ2〜ド4</b>（ド4 ＝ 中央のド）。はみ出すと 歌えない。', fig: { c: 'vranges' } },
        { k: 'ポイント 2', h: '大譜表に 4 声を 書く', b: '上の五線に <b>S（符尾 上）と A（符尾 下）</b>、下の五線に <b>T（符尾 上）と B（符尾 下）</b>。同じ五線の 2 声は <em>符尾の 向き</em> で 見分ける。', fig: fig(0, false, [Ch(1)], vv('C5 G4 E4 C3'), { color: true, names: true, zoom: 2.4 }) },
        { k: 'ポイント 3', h: '密集配置 と 開離配置', b: '上の 3 声（S・A・T）が <b>1 オクターブ以内</b> に おさまる ＝ <b>密集</b>。それを こえて ひろがる ＝ <b>開離</b>。どちらも 使える。', fig: row2(fig(0, false, [Ch(1)], vv('C5 G4 E4 C3'), { color: true, nolab: true, zoom: 2.2 }), fig(0, false, [Ch(1)], vv('E5 G4 C4 C3'), { color: true, nolab: true, zoom: 2.2 }), '密集（S‐T が 6度）', '開離（S‐T が 10度）') },
        { k: 'ポイント 4', h: '声部の 間隔 と 交差', b: '<b>S‐A と A‐T</b> は 1 オクターブ 以内。<b>T‐B</b> だけは はなれて よい。また 下の声が 上の声より 高くなる <b>声部の 交差</b> は しない。', fig: row2(fig(0, false, [Ch(1)], vv('C5 G4 E4 C3'), { color: true, nolab: true, zoom: 2.2 }), fig(0, false, [Ch(1)], vv('E5 C4 G3 C3'), { bad: [[0, 1]], nolab: true, zoom: 2.2 }), '○ S‐A も A‐T も 1 オクターブ 以内', '✕ S‐A が 10度（はなれすぎ）') },
        MEMO('四声部は「合唱団」で 覚える', '4 人の 役わりを イメージしよう。', [['ソプラノ ＝ メロディーを 歌う 主役', 'いちばん 高い声。耳に のこる 旋律を 受けもつ'], ['バス ＝ 土台を ささえる 人', 'いちばん 低い声。バスと ソプラノを「外声」と いい、いちばん よく 聞こえる'], ['アルト・テノール ＝ 間を うめる「内声」', 'なるべく 動かず なめらかに'], ['音域 ＝「歌える 範囲」', 'はみ出したら 歌えない。ソ・ド・ド・ファ（高い方の はし）を 覚える：S ソ5、A レ5、T ソ4、B ド4']])
      ],
      sum: ['S・A・T・B の 4 声。音域は S ド4〜ソ5・A ソ3〜レ5・T ド3〜ソ4・B ファ2〜ド4', 'S‐A と A‐T は 1 オクターブ 以内（T‐B は はなれて よい）、声部は 交差しない', 'S・A・T が 1 オクターブ 以内 ＝ 密集、こえる ＝ 開離'],
      types: ['vFind', 'stemQ', 'hpos', 'vRangeTxt', 'rangeOut', 'spaceFind']
    },
    {
      id: 'h02', title: '和音の 重ね方', en: 'Doubling & Position', sym: '♬', goal: '三和音を 4 声に 正しく 配置できる',
      cards: [
        { k: '✨ ひとことで言うと', h: '3 つの音を 4 声に「1 つ 重ねて」入れる', b: '三和音は 3 つの音（根音・第3音・第5音）。4 声で 歌うので どれか <b>1 つを 2 回</b> 使う。ふつうは <b>根音</b> を 重ねる。', fig: fig(0, false, [Ch(1)], vv('C5 G4 E4 C3'), { col: [['#c4452a', null, null, '#c4452a']], zoom: 2.4, subs: ['ドが 2 回'] }) },
        { k: 'ポイント 1', h: '完全和音：3 つの音が そろう', b: '根音・第3音・第5音が すべて そろった 和音が <b>完全和音</b>。とくに <b>第3音</b> は 長調か 短調か を きめる 大事な音なので <em>省略しない</em>。', fig: row2(fig(0, false, [Ch(1)], vv('C5 G4 E4 C3'), { nolab: true, zoom: 2.2 }), fig(0, false, [Ch(1)], vv('C5 G4 C4 C3'), { nolab: true, zoom: 2.2 }), '○ ド・ミ・ソ が そろう', '✕ 第3音（ミ）が ない') },
        { k: 'ポイント 2', h: '3 つの 位置（ソプラノの 音で 呼ぶ）', b: 'ソプラノが 根音 ＝ <b>8度位置</b>、第3音 ＝ <b>3度位置</b>、第5音 ＝ <b>5度位置</b>。同じ 和音でも ソプラノを かえると 3 通りの かたちに なる。', fig: { row: [Object.assign(fig(0, false, [Ch(1)], vv('C5 G4 E4 C3'), { nolab: true, zoom: 2 }), { ttl: '8度位置' }), Object.assign(fig(0, false, [Ch(1)], vv('E5 C5 G4 C3'), { nolab: true, zoom: 2 }), { ttl: '3度位置' }), Object.assign(fig(0, false, [Ch(1)], vv('G5 C5 E4 C3'), { nolab: true, zoom: 2 }), { ttl: '5度位置' })] } },
        { k: 'ポイント 3', h: '重ねては いけない音：導音', b: '<b>導音</b>（長音階の 第7音）は 主音へ 進みたがる 強い音。<em>重ねると 2 声が 同じ所へ 進んで しまう</em> ので 重ねない。Ⅴ では <b>根音（ソ）</b> を 重ねる。', fig: row2(fig(0, false, [Ch(5)], vv('B4 G4 D4 G3'), { nolab: true, zoom: 2.2 }), fig(0, false, [Ch(5)], vv('B4 D4 B3 G2'), { bad: [[0, 2]], nolab: true, zoom: 2.2 }), '○ 根音（ソ）を 重ねる', '✕ 導音（シ）を 重ねている') },
        MEMO('重ね方の 3 か条', '迷ったら この 3 つ。', [['根音を 重ねるのが 基本', '土台の 音は 2 回 鳴らして 安定させる'], ['第3音は 省略しない', '長調・短調の 色を きめる 音'], ['導音は 重ねない', 'シ（ハ長調）を 2 回 鳴らすと どちらも 上へ 進めない'], ['位置は ソプラノで 呼ぶ', '根音＝8度、第3音＝3度、第5音＝5度']])
      ],
      sum: ['三和音は 4 声に 1 つ 重ねる。基本は 根音を 重ねる', '完全和音（根・3・5）を つくる。第3音は 省略しない', '導音は 重ねない。位置は ソプラノの 音で 8度・3度・5度 位置'],
      types: ['doubled', 'posName', 'missingNote', 'dblNG']
    },
    {
      id: 'h03', title: '和音の 連結（基本）', en: 'Connecting Chords', sym: '⌒', goal: '共通音を 保ち、なめらかに 連結できる',
      cards: [
        { k: '✨ ひとことで言うと', h: '和音を つなぐ 2 つの 方法', b: '<b>① 共通音が ある</b> → その音は 同じ声部で <b>保持</b>、ほかは 近い音へ。<b>② 共通音が ない</b> → 上の 3 声を <b>バスと 反対の向き</b> へ 動かす。', fig: row2(fig(0, false, [Ch(1), Ch(4)], vv('C5 G4 E4 C3', 'C5 A4 F4 F3'), { col: [[gold, null, null, null], [gold, null, null, null]], zoom: 2.2 }), fig(0, false, [Ch(4), Ch(5)], vv('C5 A4 F4 F3', 'B4 G4 D4 G3'), { zoom: 2.2 }), '共通音あり（Ⅰ→Ⅳ）', '共通音なし（Ⅳ→Ⅴ）') },
        { k: 'ポイント 1', h: '共通音は そのまま 保つ', b: 'Ⅰ（ド・ミ・ソ）と Ⅳ（ファ・ラ・ド）の 共通音は <b>ド</b>。ドは 同じ声部で 保ち、ほかの声部は <em>いちばん 近い音</em> へ。バスは 大きく 動いても よい。', fig: fig(0, false, [Ch(1), Ch(4)], vv('C5 G4 E4 C3', 'C5 A4 F4 F3'), { col: [[gold, null, null, null], [gold, null, null, null]], zoom: 2.4, subs: ['', 'ドを保持'] }) },
        { k: 'ポイント 2', h: '共通音が ない：バスと 反対へ', b: 'Ⅳ（ファ・ラ・ド）と Ⅴ（ソ・シ・レ）には 共通音が ない。バスが <b>上へ</b> 行くなら、上の 3 声は <b>下へ</b>。同じ向きだと 連続5度・8度に なりやすい。', fig: fig(0, false, [Ch(4), Ch(5)], vv('C5 A4 F4 F3', 'B4 G4 D4 G3'), { zoom: 2.4, subs: ['', '上↓ バス↑'] }) },
        { k: 'ポイント 3', h: '最短進行：なるべく 近い音へ', b: '各声部は <b>近い音へ</b>（順次進行か 小さな跳躍）。バス以外は 大きく 跳ばない。<em>跳躍は 4〜5度まで</em> を めやすに。同じ音を 保つのも 最短進行。', fig: fig(0, false, [Ch(1), Ch(5)], vv('C5 G4 E4 C3', 'B4 G4 D4 G2'), { col: [[null, gold, null, null], [null, gold, null, null]], zoom: 2.4, subs: ['', 'ソを保持'] }) },
        MEMO('連結の 合言葉', '連結は この 2 つだけ。', [['共通音は「そのまま」', 'Ⅰ→Ⅳ は ド、Ⅰ→Ⅴ は ソ。同じ声部で 動かない'], ['共通音が なければ「反対に」', 'Ⅳ→Ⅴ・Ⅴ→Ⅵ は バスが 上なら 上3声は 下'], ['動くなら「いちばん 近い音」', '遠くへ 跳ぶと 歌いにくく、禁則も おこりやすい'], ['バスは 自由に 大きく', '根音の 土台なので 跳んで よい']])
      ],
      sum: ['共通音は 同じ声部で 保つ', '共通音が ない ときは 上の 3 声を バスと 反対に', '動く声部は いちばん 近い音へ（最短進行）'],
      types: ['commonTone', 'holdVoice', 'contraryQ', 'fillVoice']
    }
  );
  H.UT = { Ch: Ch, pn: pn, VN: VN, kname: kname, rkey: rkey, vtxt: vtxt, KIND: KIND, oneChord: oneChord, vv: vv, row2: row2, gold: gold, fillGen: fillGen, IVVI: IVVI, IVVI_CH: IVVI_CH };
})();
