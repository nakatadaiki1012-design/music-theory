/* =========================================================
   楽典ラボ：和声法の 単元（その2）
   h04 禁則　h05 終止と進行　h06 転回形と数字
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, F = GK.F, U = GK.Q.util, UT = H.UT, L = GK.L;
  var N = function (p) { return GK.nm(p); };
  var mc = U.mc, tx = U.tx, tw = U.tw, pick = U.pick, ri = U.ri, shuffle = U.shuffle, add = U.add, MEMO = L.MEMO, table = L.table;
  var Ch = UT.Ch, VN = UT.VN, kname = UT.kname, rkey = UT.rkey, fig = H.fig, KIND = UT.KIND, vv = UT.vv, row2 = UT.row2, gold = UT.gold, oneChord = UT.oneChord;
  var mid = function (p) { return M.midi(p); };
  var PAIRN = { '0,1': 'S‐A', '0,2': 'S‐T', '0,3': 'S‐B', '1,2': 'A‐T', '1,3': 'A‐B', '2,3': 'T‐B' };

  /* ---------- まちがいの ある つなぎを さがす ---------- */
  var FP = { p5: [[1, 4], [4, 1], [1, 5], [4, 5], [5, 1], [1, 6]], p8: [[1, 4], [4, 1], [1, 5], [4, 5]], lt: [[5, 1]], sev: [[5, 1, 1]], cross: [[1, 4], [4, 5], [1, 5]], space: [[1, 4], [4, 5], [1, 5]], dblLT: [[1, 5]], incomplete: [[1, 4], [4, 1], [1, 5]], hidden: [[1, 4], [4, 1], [4, 5], [5, 1], [1, 5], [1, 6]], leap: [[1, 4], [4, 1]], overlap: [[1, 4], [4, 5], [1, 5]] };
  function flawAny(kind, minor, R, key) {
    var list = shuffle(FP[kind].slice(), R); key = key == null ? rkey(R, minor) : key;
    for (var i = 0; i < list.length; i++) {
      var pr = list[i], chs = [Ch(pr[0], 0, !!pr[2]), Ch(pr[1])], f = H.flawed(key, minor, chs, kind, R);
      if (f) return { key: key, minor: minor, chs: chs, v: f.v, issues: f.issues, kind: kind };
    }
    return null;
  }
  H.flawAny = flawAny;
  var flawFig = function (fl, o) { var mk = H.marksOf(fl.issues); return fig(fl.key, fl.minor, fl.chs, fl.v, Object.assign({ marks: mk.marks, bad: [mk.bad[0], mk.bad[1]].map(function (x, i) { return fl.issues.some(function (z) { return z.i === z.j; }) ? (mk.bad[i] || []) : []; }), zoom: 2.4 }, o || {})); };
  var msgs = function (iss) { return iss.filter(function (x) { return x.ng || x.kind === 'hidden'; }).map(function (x) { return x.msg; }).join('。'); };

  /* =================== h04 禁則 =================== */
  add('parDef', 'h04', 1, function (R) {
    var L1 = [
      ['連続5度', '2 つの声が <b>同じ向き</b> に 進んで、<b>5度 → 5度</b> に なる こと', ['5 つの声が つぎつぎに 動く こと', 'バスが 5度ずつ 下がる こと', '5度の 跳躍を 2 回 つづける こと'], '連続5度は 2 声が くっついて 1 つの声に 聞こえてしまうので 禁止。'],
      ['連続8度', '2 つの声が <b>同じ向き</b> に 進んで、<b>8度 → 8度</b>（1度 → 1度 も 同じ）に なる こと', ['8 つの 和音が 続く こと', 'バスが 8度 跳ぶ こと', 'ソプラノと バスが 8度 はなれる こと'], '連続8度も 2 声が 1 つに 聞こえるので 禁止。'],
      ['声部の 交差', '<b>下の声が 上の声より 高く</b> なる こと', ['2 つの声が 同じ音に なる こと', '声部が 1 オクターブ はなれる こと', 'バスが ソプラノより 長く 伸びる こと'], 'S＞A＞T＞B の 順が くずれるので 禁止。'],
      ['隠伏5度・8度', 'ソプラノと バスが <b>同じ向き</b> に 進んで 5度や 8度に ぶつかる こと', ['アルトと テノールが 隠れて 動く こと', '第5音を 隠す こと', 'バスを 見えなく する こと'], 'ソプラノが 順次進行なら 許される。外声の 跳躍に 注意。']
    ];
    var x = pick(L1, R), m = mc(R, tx(x[1]), x[2].map(function (s) { return tx(s); }).concat([tx(x[1])]));
    return { q: '<b>' + x[0] + '</b> とは？', ch: m.ch, a: m.a, ex: x[3] };
  });
  add('ltRes', 'h04', 1, function (R, st) {
    var minor = st >= 2 && R() < 0.3, key = rkey(R, minor), lt = H.lt(key, minor), ton = H.tonic(key, minor), sc = M.scale(M.keyTonic(key, minor), minor ? 'harmonic' : 'major').slice(0, 7);
    var wr = sc.filter(function (p) { return !((p.l === ton.l && p.a === ton.a) || (p.l === lt.l && p.a === lt.a)); }).map(function (p) { return tx(N(p)); });
    var m = mc(R, tx(N(ton)), wr);
    return { q: kname(key, minor) + '。Ⅴ の 和音の <b>導音（' + N(lt) + '）</b> は、ふつう どの音へ 進む？', ch: m.ch, a: m.a, ex: '導音は <b>半音 上の 主音（' + N(ton) + '）</b> へ 進む（導く 音）。ソプラノと バスでは かならず。内声は Ⅰ へ 行く とき 3度 下の 音へ 進んでも よい。' };
  });
  add('sevRes', 'h04', 1, function (R, st) {
    var minor = st >= 2 && R() < 0.3, key = rkey(R, minor), sev = H.pcs(key, minor, Ch(5, 0, true))[3], tg = H.pcs(key, minor, Ch(1))[1], sc = M.scale(M.keyTonic(key, minor), minor ? 'harmonic' : 'major').slice(0, 7);
    var wr = sc.filter(function (p) { return !((p.l === tg.l && p.a === tg.a) || (p.l === sev.l && p.a === sev.a)); }).map(function (p) { return tx(N(p)); });
    var m = mc(R, tx(N(tg)), wr);
    return { q: kname(key, minor) + '。Ⅴ₇ の <b>第7音（' + N(sev) + '）</b> は、ふつう どの音へ 進む？', ch: m.ch, a: m.a, ex: '第7音は <b>2度 下行</b> して 解決する（' + N(sev) + ' → ' + N(tg) + '）。' + N(tg) + ' は Ⅰ の 第3音。' };
  });
  add('ruleName', 'h04', 2, function (R, st) {
    var pool = st >= 3 ? ['p5', 'p8', 'lt', 'cross', 'space', 'dblLT', 'incomplete', 'hidden', 'sev'] : ['p5', 'p8', 'lt', 'cross', 'space', 'dblLT', 'incomplete'];
    for (var t = 0; t < 30; t++) {
      var kind = pick(pool, R), fl = flawAny(kind, false, R); if (!fl) continue;
      var m = mc(R, tx(KIND[kind], kind), pool.map(function (k) { return tx(KIND[k], k); }));
      return { q: '2 つの 和音の つなぎに 問題が ある。どんな ルール違反？', fig: fig(fl.key, false, fl.chs, fl.v, { zoom: 2.4 }), ch: m.ch, a: m.a, ex: '<b>' + KIND[kind] + '</b>。' + msgs(fl.issues) + '。', exFig: flawFig(fl) };
    }
    throw new Error('ruleName');
  });
  add('ruleWhere', 'h04', 2, function (R) {
    for (var t = 0; t < 30; t++) {
      var kind = pick(['p5', 'p8'], R), fl = flawAny(kind, false, R); if (!fl) continue;
      var ng = fl.issues.filter(function (x) { return x.ng; }); if (ng.length !== 1 || ng[0].v.length !== 2) continue;
      var key = ng[0].v.join(','), m = mc(R, tx(PAIRN[key], key), Object.keys(PAIRN).map(function (k) { return tx(PAIRN[k], k); }));
      return { q: KIND[kind] + ' に なっているのは どの 2 声？', fig: fig(fl.key, false, fl.chs, fl.v, { zoom: 2.4 }), ch: m.ch, a: m.a, ex: '<b>' + PAIRN[key] + '</b>（' + VN[ng[0].v[0]] + 'と' + VN[ng[0].v[1]] + '）。同じ向きに 進んで ' + (kind === 'p5' ? '5度 → 5度' : '8度 → 8度') + ' に なっている。', exFig: flawFig(fl) };
    }
    throw new Error('ruleWhere');
  });
  add('findTrans', 'h04', 2, function (R, st) {
    for (var t = 0; t < 40; t++) {
      var key = rkey(R), pr = pick(H.PROGS.filter(function (p) { return !p.adv && p.chs.length >= 4 && p.lv <= (st >= 3 ? 3 : 2); }), R), chs = pr.chs, vs = H.solve(key, false, chs, null, R); if (!vs) continue;
      var k = ri(0, chs.length - 2, R), br = H.breakAt(key, false, chs, vs, k, R); if (!br) continue;
      var lab = chs.slice(0, -1).map(function (c, i) { return tx(H.label(c) + ' → ' + H.label(chs[i + 1]), i); });
      var m = mc(R, lab[k], lab, Math.min(4, lab.length)), kind = br.issues[0].kind;
      return { q: kname(key) + '。この 進行で、まちがいが ある つなぎは？', fig: fig(key, false, chs, br.vs, { zoom: 2.4, sp: chs.length > 4 ? 48 : 54 }), ch: m.ch, a: m.a, ex: '<b>' + H.label(chs[k]) + ' → ' + H.label(chs[k + 1]) + '</b> で ' + KIND[kind] + '。' + msgs(br.issues) + '。', exFig: (function () { var mk = H.marksOf(br.issues); return fig(key, false, chs, br.vs, { marks: mk.marks, bad: chs.map(function (_, i) { return mk.bad[i] || []; }), zoom: 2.4, sp: chs.length > 4 ? 48 : 54 }); })() };
    }
    throw new Error('findTrans');
  });

  /* =================== h05 終止と進行 =================== */
  var FN = { 1: 0, 6: 0, 3: 0, 4: 1, 2: 1, 5: 2, 7: 2 }, FNAME = ['主和音（トニック・T）', '下属和音（サブドミナント・S）', '属和音（ドミナント・D）'];
  add('funcOf', 'h05', 1, function (R, st) {
    var d = pick(st >= 2 ? [2, 6, 7, 1, 4, 5] : [1, 4, 5], R), m = mc(R, tx(FNAME[FN[d]]), FNAME.map(function (x) { return tx(x); }), 3);
    return { q: '<b>' + H.ROMAN[d] + '</b> の 和音は どの 働き（の 代理）？', ch: m.ch, a: m.a, ex: '主和音 ＝ Ⅰ（代理：Ⅵ）、下属和音 ＝ Ⅳ（代理：Ⅱ）、属和音 ＝ Ⅴ（代理：Ⅶ）。' + H.ROMAN[d] + ' は <b>' + FNAME[FN[d]] + '</b>' + ([1, 4, 5].indexOf(d) < 0 ? ' の 代理' : '') + '。' };
  });
  var NEXT = { 1: [2, 4, 5, 6], 2: [5], 4: [5, 1, 2], 5: [1, 6], 6: [2, 4, 5] };
  function walk(R, bad) {
    for (var t = 0; t < 200; t++) {
      var s = [1], n = ri(3, 4, R);
      for (var i = 0; i < n; i++) { var c = s[s.length - 1], nx = NEXT[c]; s.push(pick(nx, R)); }
      s.push(1); if (NEXT[s[s.length - 2]].indexOf(1) < 0) continue;
      return s;
    }
    return [1, 4, 5, 1];
  }
  var seqTxt = function (s) { return s.map(function (d) { return H.ROMAN[d]; }).join('→'); };
  add('funcOrder', 'h05', 1, function (R) {
    var good = [], keys = {};
    for (var t = 0; t < 60 && good.length < 3; t++) { var s = walk(R), k = seqTxt(s); if (!keys[k]) { keys[k] = 1; good.push(s); } }
    var bad = pick([[1, 5, 4, 1], [1, 4, 5, 2, 5, 1], [1, 6, 5, 4, 1], [1, 5, 2, 5, 1]], R);
    var m = mc(R, tx(seqTxt(bad)), good.map(function (s) { return tx(seqTxt(s)); }).concat([tx(seqTxt(bad))]));
    var at = -1; for (var i = 0; i + 1 < bad.length; i++) if (FN[bad[i]] === 2 && FN[bad[i + 1]] === 1) at = i;
    return { q: '和音の 進行で 「逆行」（属 → 下属）が 入っているのは？', ch: m.ch, a: m.a, ex: '<b>' + seqTxt(bad) + '</b> には <b>' + H.ROMAN[bad[at]] + '→' + H.ROMAN[bad[at + 1]] + '</b>（属和音 → 下属和音）が ある。T → S → D → T の 流れに 逆らう「逆行」は ふつう さける。' };
  });
  var CAD = { auth: '正格終止', plag: '変格終止', half: '半終止', dec: '偽終止' };
  var CADEX = { auth: 'Ⅴ → Ⅰ（Ⅴ₇ → Ⅰ も）。いちばん「おわった」感じが する。', plag: 'Ⅳ → Ⅰ。「アーメン終止」ともいう。やわらかく おわる。', half: '…→ Ⅴ。属和音で 止まる ので「まだ つづく」感じ。', dec: 'Ⅴ → Ⅵ。Ⅰ を 予想させて Ⅵ に 行く「あれっ？」の 終わり方。' };
  function cadChs(kind, R) { return kind === 'auth' ? [Ch(5, 0, R() < 0.3), Ch(1)] : kind === 'plag' ? [Ch(4), Ch(1)] : kind === 'half' ? [Ch(pick([1, 2, 4, 6], R)), Ch(5)] : [Ch(5), Ch(6)]; }
  add('cadName', 'h05', 1, function (R) {
    var kind = pick(Object.keys(CAD), R), chs = cadChs(kind, R), m = mc(R, tx(CAD[kind], kind), Object.keys(CAD).map(function (k) { return tx(CAD[k], k); }));
    return { q: '和音が <b>' + H.label(chs[0]) + ' → ' + H.label(chs[1]) + '</b> と 進む 終わり方は？', ch: m.ch, a: m.a, ex: '<b>' + CAD[kind] + '</b>：' + CADEX[kind] };
  });
  add('cadFig', 'h05', 2, function (R) {
    for (var t = 0; t < 40; t++) {
      var kind = pick(Object.keys(CAD), R), key = rkey(R), chs = cadChs(kind, R), pc = H.pairOK(key, false, chs, R); if (!pc) continue;
      var v1 = pick(pc.B.filter(H.nice).length ? pc.B.filter(H.nice) : pc.B, R), vs = [pc.v0, v1];
      var m = mc(R, tx(CAD[kind], kind), Object.keys(CAD).map(function (k) { return tx(CAD[k], k); }));
      return { q: kname(key) + '。この 終わり方は？', fig: fig(key, false, chs, vs, { zoom: 2.4 }), ch: m.ch, a: m.a, ex: H.label(chs[0]) + ' → ' + H.label(chs[1]) + ' ＝ <b>' + CAD[kind] + '</b>。' + CADEX[kind], play: [[vs[0].map(H.str), 1.6], [vs[1].map(H.str), 3]] };
    }
    throw new Error('cadFig');
  });
  add('cadRule', 'h05', 2, function (R) {
    var key = rkey(R), ton = H.tonic(key, false), th = H.pcs(key, false, Ch(1))[1], fi = H.pcs(key, false, Ch(1))[2];
    var o = [[ton, ton], [th, ton], [fi, ton], [ton, fi]], t = function (x) { return 'ソプラノ ' + N(x[0]) + '・バス ' + N(x[1]); }, m = mc(R, tx(t(o[0])), o.map(function (x) { return tx(t(x)); }));
    return { q: kname(key) + '。もっとも「おわった」感じの <b>完全正格終止</b>（Ⅴ → Ⅰ）。最後の Ⅰ の ソプラノと バスは？', ch: m.ch, a: m.a, ex: '完全正格終止は <b>Ⅴ → Ⅰ</b>、両方 <b>根音位置</b>、最後の Ⅰ で <b>ソプラノも 主音（' + N(ton) + '）</b>。バスは 根音（' + N(ton) + '）。' };
  });

  /* =================== h06 転回形と数字 =================== */
  var INVN = ['基本形', '第1転回形', '第2転回形', '第3転回形'];
  add('invName', 'h06', 1, function (R) {
    var ch = pick([Ch(1, 1), Ch(1, 2), Ch(5, 0, 1), Ch(5, 1, 1), Ch(5, 2, 1), Ch(5, 3, 1), Ch(4, 1), Ch(2, 1), Ch(5, 1), Ch(4, 2)], R);
    var nm = { 0: '', 1: '六の和音', 2: '四六の和音' }, sn = ['', '五六の和音', '三四の和音', '二の和音'];
    var m = mc(R, tx(INVN[ch.inv]), INVN.map(function (x) { return tx(x); }), ch.sev ? 4 : 3);
    var lab = H.label(ch);
    return { q: '<b>' + lab + '</b> は？', ch: m.ch, a: m.a, ex: lab + ' の 下の 数字は 転回形を 表す。' + (ch.sev ? '七の和音：なし ＝ 基本形、五六 ＝ 第1転回、三四 ＝ 第2転回、二 ＝ 第3転回' : '三和音：なし ＝ 基本形、六 ＝ 第1転回、四六 ＝ 第2転回') + ' → <b>' + INVN[ch.inv] + '</b>。' };
  });
  add('bassOf', 'h06', 1, function (R, st) {
    var key = rkey(R), ch = pick([Ch(1, 1), Ch(1, 2), Ch(4, 1), Ch(5, 1), Ch(5, 2), Ch(2, 1), Ch(6, 1), Ch(5, 1, 1)], R), pcs = H.pcs(key, false, ch);
    var wr = pcs.map(function (p, i) { return i === ch.inv ? null : tx(N(p)); }).filter(Boolean);
    var m = mc(R, tx(N(pcs[ch.inv])), wr.concat([tx(N(H.lt(key, false)) + (ch.d === 5 ? '' : ''))]));
    return { q: kname(key) + '。<b>' + H.label(ch) + '</b> の バスの 音は？', ch: m.ch, a: m.a, ex: H.label(ch) + ' ＝ ' + pcs.map(N).join('・') + '。' + INVN[ch.inv] + ' なので バスは <b>' + H.role(ch, ch.inv) + '（' + N(pcs[ch.inv]) + '）</b>。' };
  });
  function figNote(key, ch) { var pcs = H.pcs(key, false, ch), p = pcs[ch.inv], bs = { l: p.l, a: p.a, o: 3 }; if (mid(bs) > 50) bs.o = 2; if (mid(bs) < 41) bs.o = 3; return bs; }
  add('figToChord', 'h06', 2, function (R) {
    var key = rkey(R), ch = pick([Ch(1, 1), Ch(1, 2), Ch(4, 1), Ch(5, 1), Ch(2, 1), Ch(6, 1), Ch(5, 0, 1), Ch(5, 1, 1), Ch(1), Ch(4), Ch(5)], R), bs = figNote(key, ch);
    var opts = {}; for (var d = 1; d <= 7; d++) for (var inv = 0; inv <= (d === 5 ? 3 : 2); inv++) [false, true].forEach(function (sev) {
      if (sev && d !== 5) return; if (!sev && inv > 2) return; var c2 = Ch(d, inv, sev), p2 = H.pcs(key, false, c2)[inv];
      if (p2.l === bs.l && p2.a === bs.a) opts[H.label(c2)] = c2;
    });
    var right = H.label(ch), wrongs = Object.keys(opts).filter(function (k) { return k !== right; }).map(function (k) { return tx(k); });
    var m = mc(R, tx(right), wrongs), fg = H.figure(ch);
    return { q: kname(key) + '。バスの 音と 数字から、和音記号は？', fig: { score: { clef: 'bass', key: key, notes: [{ k: M.str(bs), d: 'w', lab: fg || '（なし）' }], minBar: 90, sp: 60, ls: 18, zoom: 2.4 } }, ch: m.ch, a: m.a, ex: 'バス ' + N(bs) + '、数字 ' + (fg || 'なし') + ' → <b>' + right + '</b>（' + H.pcs(key, false, ch).map(N).join('・') + '）。バスは ' + H.role(ch, ch.inv) + '。' };
  });
  add('chordToFig', 'h06', 2, function (R) {
    var key = rkey(R), ch = pick([Ch(1, 1), Ch(1, 2), Ch(4, 1), Ch(5, 1), Ch(5, 2), Ch(5, 0, 1), Ch(5, 1, 1), Ch(5, 2, 1), Ch(5, 3, 1)], R), fg = H.figure(ch) || 'なし';
    var all = ['なし', '6', '6 4', '7', '6 5', '4 3', '4 2'], pool = ch.sev ? ['7', '6 5', '4 3', '4 2', '6', '6 4'] : ['なし', '6', '6 4', '7', '6 5'], m = mc(R, tx(fg), pool.map(function (x) { return tx(x); }));
    return { q: '<b>' + H.label(ch) + '</b> を 数字付き低音で 書くと、バスの 下の 数字は？', ch: m.ch, a: m.a, ex: H.label(ch) + ' は ' + INVN[ch.inv] + '。数字付き低音では <b>' + fg + '</b>' + (fg === 'なし' ? '（基本形は 数字を 書かない）' : '') + '。' };
  });
  add('invOfV', 'h06', 2, function (R) {
    var key = rkey(R), inv = ri(0, 2, R), ch = pick([Ch(1, inv), Ch(4, inv), Ch(5, inv)], R), v = oneChord(key, false, ch, R);
    if (!v) throw new Error('invOfV');
    var m = mc(R, tx(INVN[inv]), INVN.slice(0, 3).map(function (x) { return tx(x); }), 3), pcs = H.pcs(key, false, Ch(ch.d));
    return { q: kname(key) + '。この <b>' + H.ROMAN[ch.d] + '</b> の 和音は？（バスの 音で きまる）', fig: fig(key, false, [Ch(ch.d)], [v], { nolab: true, zoom: 2.4 }), ch: m.ch, a: m.a, ex: 'バスは ' + N(v[3]) + ' ＝ ' + H.role(Ch(ch.d), inv) + ' → <b>' + INVN[inv] + '</b>（' + H.label(ch) + '）。', exFig: fig(key, false, [ch], [v], { zoom: 2.4, col: [[null, null, null, '#7d4fb0']] }) };
  });

  /* =================== 授業（h04〜h06） =================== */
  var hid = flawAny('hidden', false, GK.rng(4), 0), lt1 = flawAny('lt', false, GK.rng(3), 0), p5 = flawAny('p5', false, GK.rng(11), 0), p8 = flawAny('p8', false, GK.rng(2), 0), crs = flawAny('cross', false, GK.rng(3), 0);
  var goodVI = vv('B4 G4 D4 G3', 'C5 G4 E4 C3'), good7 = H.solve(0, false, [Ch(5, 0, true), Ch(1)], null, GK.rng(6));
  var sevIdx = good7 ? [0, 1, 2, 3].filter(function (j) { return good7[0][j].l === 3; })[0] : 0;
  var colAt = function (j, c) { var a = [null, null, null, null]; a[j] = c; return a; };
  var ltIdx = 0;
  GK.UNITDEF.push(
    {
      id: 'h04', title: '禁則（してはいけないこと）', en: 'Voice-Leading Rules', sym: '✕', goal: '連続5度・8度、導音・第7音の 解決を まもれる',
      cards: [
        { k: '✨ ひとことで言うと', h: '禁則は「声を 独立させる」ための ルール', b: '4 声が それぞれ <b>別の 歌</b> として 聞こえることが 大事。2 声が ぴったり 同じ動きを すると <em>1 つの声に 聞こえて しまう</em>（連続5度・8度）ので 禁止。', fig: p5 ? flawFig(p5) : { html: '' } },
        { k: 'ポイント 1', h: '連続5度・連続8度', b: '2 声が <b>同じ向き</b> に 進んで <b>5度 → 5度</b>（または 8度 → 8度）に なるのは 禁止。<em>反対の向き</em> や、一方が 動かない ときは だいじょうぶ。', fig: row2(p5 ? flawFig(p5, { zoom: 2.2 }) : { html: '' }, p8 ? flawFig(p8, { zoom: 2.2 }) : { html: '' }, '✕ 連続5度', '✕ 連続8度') },
        { k: 'ポイント 2', h: '隠伏5度・8度 と 声部の 交差', b: 'ソプラノと バスが <b>同じ向き</b> に 進んで 5度・8度に 着く（<b>隠伏</b>）のも さける（ソプラノが 順次進行なら OK）。<b>声部の 交差</b> は しない。', fig: row2(hid ? flawFig(hid, { zoom: 2.2 }) : { html: '' }, crs ? flawFig(crs, { zoom: 2.2 }) : { html: '' }, '⚠ 隠伏5度・8度', '✕ 声部の 交差') },
        { k: 'ポイント 3', h: '導音は 上へ（Ⅴ → Ⅰ）', b: '<b>導音</b>（Ⅴ の 第3音）は <b>半音 上の 主音</b> へ。ソプラノと バスでは かならず。<em>内声は Ⅰ へ 行く とき 3度 下</em>（Ⅴ の 第5音）へ 進んでも よい。', fig: row2(fig(0, false, [Ch(5), Ch(1)], goodVI, { col: [colAt(0, gold), colAt(0, gold)], zoom: 2.2 }), lt1 ? flawFig(lt1, { zoom: 2.2 }) : { html: '' }, '○ シ → ド（上行）', '✕ 導音が 下行') },
        { k: 'ポイント 4', h: '第7音は 下へ（Ⅴ₇ → Ⅰ）', b: 'Ⅴ₇ の <b>第7音</b>（ソ・シ・レ・<b>ファ</b>）は <b>2度 下行</b> して ミ へ。導音は 上行、第7音は 下行 ── 2 つの 約束を セットで 覚える。', fig: good7 ? fig(0, false, [Ch(5, 0, true), Ch(1)], good7, { col: [colAt(sevIdx, gold), colAt(sevIdx, gold)], zoom: 2.4, subs: ['', 'ファ→ミ'] }) : { html: '' } },
        MEMO('禁則の 合言葉', '4 つだけ 覚えれば だいじょうぶ。', [['連続5度・8度は「同じ向きで くっつく」', '5度 → 5度、8度 → 8度 を 同じ向きで'], ['隠伏は「外声が 同じ向きで 着く」', 'ソプラノは 順次進行に して かわす'], ['導音は「シ → ド」上へ', '第7音は「ファ → ミ」下へ'], ['交差・はなれすぎ・増音程も NG', '声部は 上から S＞A＞T＞B を まもる']])
      ],
      sum: ['連続5度・連続8度（同じ向きで 5度→5度・8度→8度）は 禁止', '導音は 半音 上の 主音へ、第7音は 2度 下へ', '声部の 交差・隠伏・増減の 跳躍も さける'],
      types: ['parDef', 'ltRes', 'sevRes', 'ruleName', 'ruleWhere', 'findTrans']
    },
    {
      id: 'h05', title: '終止と 和音の 進行', en: 'Cadences & Progressions', sym: '𝄂', goal: '和音の 働き・流れと 4 種類の 終止が わかる',
      cards: [
        { k: '✨ ひとことで言うと', h: '和音には 3 つの 役わりが ある', b: '<b>主和音（Ⅰ）T</b>：落ち着く おうち。<b>下属和音（Ⅳ）S</b>：おでかけ。<b>属和音（Ⅴ）D</b>：おうちへ 帰りたい 緊張。流れは <em>T → S → D → T</em>。', fig: fig(0, false, UT.IVVI_CH, UT.IVVI, { zoom: 2.2, labs: ['Ⅰ T', 'Ⅳ S', 'Ⅴ D', 'Ⅰ T'] }) },
        { k: 'ポイント 1', h: '進行の 基本：逆行を さける', b: 'T → S → D → T が 自然。<b>D → S</b>（Ⅴ → Ⅳ）の ような 逆戻りは <em>逆行</em> といって ふつう さける。Ⅰ からは どこへでも 行ける。', fig: { html: table(['和音', '次に 来る 和音'], [['Ⅰ', 'どれでも'], ['Ⅱ', 'Ⅴ'], ['Ⅳ', 'Ⅴ・Ⅰ（Ⅱ）'], ['Ⅴ', 'Ⅰ（Ⅵ）'], ['Ⅵ', 'Ⅱ・Ⅳ・Ⅴ']], { fs: 15, mw: 360 }) } },
        { k: 'ポイント 2', h: '終止の 4 種類', b: '<b>正格終止</b> Ⅴ→Ⅰ（いちばん 強い）、<b>変格終止</b> Ⅳ→Ⅰ（アーメン）、<b>半終止</b> …→Ⅴ（つづく）、<b>偽終止</b> Ⅴ→Ⅵ（あれっ？）。', fig: { html: table(['終止', '進行', 'ひびき'], [['正格終止', 'Ⅴ(₇) → Ⅰ', 'しっかり おわる「。」'], ['変格終止', 'Ⅳ → Ⅰ', 'アーメン'], ['半終止', '… → Ⅴ', 'まだ つづく「、」'], ['偽終止', 'Ⅴ → Ⅵ', 'だまされた「？」']], { fs: 14, mw: 420 }) } },
        { k: 'ポイント 3', h: '完全正格終止の かたち', b: 'Ⅴ → Ⅰ で、<b>両方 根音位置</b>。最後の Ⅰ で <b>ソプラノも 主音</b>。いちばん「終わった」感じに なる。Ⅴ₇ → Ⅰ でも よい。', fig: fig(0, false, [Ch(5), Ch(1)], goodVI, { zoom: 2.4, subs: ['', 'S も B も ド'] }) },
        MEMO('終止は「文の 終わり」', '音楽の 句読点として 覚えよう。', [['正格終止 ＝「。」', 'Ⅴ → Ⅰ。いちばん しっかり'], ['半終止 ＝「、」', 'Ⅴ で 止まる。まだ つづく'], ['変格終止 ＝「アーメン」', 'Ⅳ → Ⅰ。やさしく おわる'], ['偽終止 ＝「あれっ？」', 'Ⅴ → Ⅵ。Ⅰ だと 思ったら ちがった']])
      ],
      sum: ['T（Ⅰ）→ S（Ⅳ）→ D（Ⅴ）→ T が 自然。D → S の 逆行は さける', '正格 Ⅴ→Ⅰ・変格 Ⅳ→Ⅰ・半 …→Ⅴ・偽 Ⅴ→Ⅵ', '完全正格終止：両方 根音位置で ソプラノも 主音'],
      types: ['funcOf', 'funcOrder', 'cadName', 'cadFig', 'cadRule']
    },
    {
      id: 'h06', title: '転回形と 数字付き低音', en: 'Inversions & Figured Bass', sym: '⇅', goal: '六・四六の和音と 数字の 読み書きが できる',
      cards: [
        { k: '✨ ひとことで言うと', h: '転回形は「バスの 音」が かわる', b: 'バスが <b>根音</b> ＝ 基本形、<b>第3音</b> ＝ <b>第1転回形（六の和音）</b>、<b>第5音</b> ＝ <b>第2転回形（四六の和音）</b>。', fig: { row: [Object.assign(fig(0, false, [Ch(1)], vv('C5 G4 E4 C3'), { zoom: 2 }), { ttl: '基本形' }), Object.assign(fig(0, false, [Ch(1, 1)], vv('C5 G4 C4 E3'), { zoom: 2 }), { ttl: '第1転回' }), Object.assign(fig(0, false, [Ch(1, 2)], vv('E5 C5 G4 G2'), { zoom: 2 }), { ttl: '第2転回' })] } },
        { k: 'ポイント 1', h: '数字付き低音', b: 'バスの 下の <b>数字</b> で 和音を 表す。数字なし ＝ 基本形、<b>6</b> ＝ 第1転回形、<b>6 4</b> ＝ 第2転回形。数字は バスから 数えた 音程。', fig: { html: table(['数字', '転回形', 'バスから 見て'], [['（なし）', '基本形', '3度・5度'], ['6', '第1転回形', '3度・6度'], ['6 4', '第2転回形', '4度・6度']], { fs: 15, mw: 380 }) } },
        { k: 'ポイント 2', h: 'Ⅴ₇ の 転回形', b: '<b>Ⅴ₇</b> ＝ 基本形、<b>Ⅴ₆₅</b>（五六）＝ 第1、<b>Ⅴ₄₃</b>（三四）＝ 第2、<b>Ⅴ₄₂</b>（二）＝ 第3。数字は 和音記号の 右下。', fig: { html: table(['記号', '呼び方', 'バス', '数字'], [['Ⅴ₇', '基本形', 'ソ（根音）', '7'], ['Ⅴ₆₅', '五六の和音', 'シ（第3音）', '6 5'], ['Ⅴ₄₃', '三四の和音', 'レ（第5音）', '4 3'], ['Ⅴ₄₂', '二の和音', 'ファ（第7音）', '4 2']], { fs: 14, mw: 460 }) } },
        { k: 'ポイント 3', h: '六の和音（第1転回形）の 使い方', b: 'バスが 根音から 第3音へ 動くので、<em>バスの 動きが なめらか</em> に なる。Ⅴ₆ は バスが 導音 なので 重ねない（根音か 第5音を 重ねる）。', fig: fig(0, false, [Ch(1), Ch(5, 1), Ch(1)], vv('C5 G4 E4 C3', 'D5 G4 D4 B2', 'C5 G4 E4 C3'), { zoom: 2.4 }) },
        { k: 'ポイント 4', h: '四六の和音（第2転回形）', b: 'バスが 第5音。<b>終止四六</b>：Ⅰ₆₄ → Ⅴ → Ⅰ のように <em>Ⅴ の 前の かざり</em> として 使う。バスの 音（第5音）を 重ねる。', fig: fig(0, false, [Ch(1, 2), Ch(5), Ch(1)], vv('E5 C5 G4 G2', 'D5 B4 G4 G2', 'E5 C5 G4 C3'), { zoom: 2.4 }) },
        MEMO('転回形の 暗記', '数字は「バスから 数えた 音程」。', [['六の和音 ＝ 第1転回形', 'バスが 第3音。数字は 6（6度と 3度）'], ['四六の和音 ＝ 第2転回形', 'バスが 第5音。数字は 6 4'], ['Ⅴ₇：五六・三四・二', '第1・第2・第3転回。バスは シ・レ・ファ'], ['基本形は 数字なし', 'Ⅴ₇ だけは「7」を 書く']])
      ],
      sum: ['バスが 根音 ＝ 基本形、第3音 ＝ 第1転回（六）、第5音 ＝ 第2転回（四六）', '数字付き低音：なし・6・6 4。Ⅴ₇ は 7・6 5・4 3・4 2', 'Ⅰ₆₄ は Ⅴ の 前の かざり（終止四六）'],
      types: ['invName', 'bassOf', 'figToChord', 'chordToFig', 'invOfV']
    }
  );
})();
