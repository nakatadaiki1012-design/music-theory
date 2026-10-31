/* =========================================================
   楽典ラボ：同じ 単元を くりかえし 学べるように、問題の 種類を ふやす（その2）
   楽典 u02・u03・u08・u10・u11・u12 ／ 和声法 h02・h03・h05・h06・h07・h08・h09・h13 ／ 対位法 c01・c02・c03
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, U = GK.Q.util;
  var N = function (p) { return GK.nm(p); };
  var mc = U.mc, tx = U.tx, pick = U.pick, ri = U.ri, add = U.add;
  var T = function (s) { return tx(s); };
  var textQ = function (R, right, wrongs, n) { return mc(R, tx(right), wrongs.filter(function (w) { return w !== right; }).map(T), n); };
  var factQ = function (R, L) { var x = pick(L, R), m = mc(R, tx(x[1]), x[2].map(T)); return { q: x[0], ch: m.ch, a: m.a, ex: x[3] }; };
  var NEW = {};
  var reg = function (id, u, st, name, fn) { add(id, u, st, fn); (NEW[u] = NEW[u] || []).push(id); GK.TYPE_NAME[id] = name; };
  var Ch = function (d, inv, sev) { return { d: d, inv: inv || 0, sev: !!sev, nine: false }; };
  var KM = [0, 1, -1, 2, -2, 3, -3, 4, -4];
  var rkey = function (R) { return pick(KM, R); };
  var kname = function (f, mi) { return M.keyName(f, mi); };
  var ROM = H ? H.ROMAN : ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'];

  /* =================== 楽典 =================== */
  // u02 付点音符
  var DOTS = [['付点2分音符', '4分音符', 3], ['付点4分音符', '8分音符', 3], ['付点8分音符', '16分音符', 3], ['付点2分音符', '8分音符', 6], ['複付点4分音符', '16分音符', 7], ['付点全音符', '4分音符', 6], ['付点4分音符', '16分音符', 6]];
  reg('dotVal', 'u02', 2, '付点音符の 長さ', function (R) {
    var x = pick(DOTS, R), m = textQ(R, x[2] + ' 個', [x[2] - 1, x[2] + 1, x[2] * 2, Math.max(1, x[2] - 2), x[2] + 2].map(function (n) { return n + ' 個'; }));
    return { q: '<b>' + x[0] + '</b> は <b>' + x[1] + '</b> 何個ぶん？', ch: m.ch, a: m.a, ex: '付点は もとの 音符の 半分を たす（1.5 倍）。複付点は さらに その 半分（1.75 倍）。' + x[0] + ' ＝ ' + x[1] + ' <b>' + x[2] + ' 個</b>。' };
  });
  var NR = [['全音符', '全休符'], ['2分音符', '2分休符'], ['4分音符', '4分休符'], ['8分音符', '8分休符'], ['16分音符', '16分休符']];
  reg('noteRest', 'u02', 1, '音符と 同じ 長さの 休符', function (R) {
    var i = ri(0, 4, R), rev = R() < 0.5, x = NR[i];
    var m = textQ(R, rev ? x[0] : x[1], NR.map(function (y) { return rev ? y[0] : y[1]; }));
    return { q: rev ? '<b>' + x[1] + '</b> と 同じ 長さの 音符は？' : '<b>' + x[0] + '</b> と 同じ 長さの 休符は？', ch: m.ch, a: m.a, ex: x[0] + ' ＝ ' + x[1] + '（同じ 長さ）。' };
  });
  // u03 拍子
  var TS = [['2/4', '4分音符', 2, 2], ['3/4', '4分音符', 3, 3], ['4/4', '4分音符', 4, 4], ['6/8', '8分音符', 6, 2], ['9/8', '8分音符', 9, 3], ['12/8', '8分音符', 12, 4], ['3/8', '8分音符', 3, 1], ['2/2', '2分音符', 2, 2], ['3/2', '2分音符', 3, 3], ['6/4', '4分音符', 6, 2]];
  reg('timeUnit', 'u03', 1, '拍子記号の 読み方', function (R) {
    var x = pick(TS, R), right = x[1] + ' が ' + x[2] + ' つ', wr = ['4分音符 が ' + x[2] + ' つ', '8分音符 が ' + x[2] + ' つ', '2分音符 が ' + x[2] + ' つ', x[1] + ' が ' + (x[2] + 1) + ' つ', x[1] + ' が ' + x[3] + ' つ'];
    var m = textQ(R, right, wr);
    return { q: '<b>' + x[0] + '</b> 拍子の 1 小節は？', ch: m.ch, a: m.a, ex: '下の 数字 ＝ 何分音符か、上の 数字 ＝ いくつか。' + x[0] + ' ＝ <b>' + right + '</b>。' };
  });
  reg('compBeat', 'u03', 2, '複合拍子の 拍の 数', function (R) {
    var x = pick(TS.filter(function (y) { return y[2] % 3 === 0 && y[2] > 3; }), R), m = textQ(R, x[3] + ' 拍', ['1 拍', '2 拍', '3 拍', '4 拍', '6 拍', '9 拍', '12 拍']);
    return { q: '<b>' + x[0] + '</b> 拍子を「付点音符 1 つ ＝ 1 拍」で 数えると、1 小節は 何拍？', ch: m.ch, a: m.a, ex: '複合拍子は 3 つ ずつ まとめて 1 拍（付点音符）。' + x[2] + ' ÷ 3 ＝ <b>' + x[3] + ' 拍</b>。' };
  });
  // u08 短音階
  reg('minFacts', 'u08', 2, '短音階の きまり', function (R) {
    return factQ(R, [
      ['旋律短音階の <b>下行形</b> は どれと 同じ？', '自然短音階', ['和声短音階', '長音階', '旋律短音階の 上行形'], '旋律短音階は 上行で 第6・第7音を 半音 上げ、<b>下行は 自然短音階</b> に もどる。'],
      ['和声短音階で 半音 上げる 音は？', '第7音 だけ', ['第6音 だけ', '第6音と 第7音', '第3音'], '和声短音階は <b>第7音（導音）</b> だけを 半音 上げる。'],
      ['旋律短音階の 上行形で 半音 上げる 音は？', '第6音と 第7音', ['第7音 だけ', '第3音と 第6音', '第2音'], '旋律短音階の 上行形は <b>第6音と 第7音</b> を 半音 上げる。'],
      ['和声短音階の 第6音と 第7音の 間は？', '増2度', ['長2度', '短2度', '短3度'], '和声短音階は 第6音と 第7音の 間が <b>増2度</b>（半音 3 つ）。'],
      ['短調の 主音は、平行調（長調）の 第何音？', '第6音', ['第3音', '第5音', '第2音'], 'イ短調の 主音 ラ は ハ長調の <b>第6音</b>。平行調は 調号が 同じ。'],
      ['自然短音階で 半音の 場所は？', '第2〜3音 と 第5〜6音', ['第3〜4音 と 第7〜8音', '第1〜2音 と 第4〜5音', '第6〜7音 と 第7〜8音'], '自然短音階：全・半・全・全・半・全・全。半音は <b>2〜3 と 5〜6</b>。']
    ]);
  });
  reg('minRaise', 'u08', 2, '短音階で 上げる 音', function (R) {
    var f = pick([0, 1, -1, 2, -2, 3, -3], R), mel = R() < 0.4, sc = M.scale(M.keyTonic(f, true), 'natural').slice(0, 7), h = M.scale(M.keyTonic(f, true), mel ? 'melodic' : 'harmonic').slice(0, 7);
    var right = mel ? N(h[5]) + ' と ' + N(h[6]) : N(h[6]), wr = mel ? [N(sc[5]) + ' と ' + N(sc[6]), N(h[6]), N(h[5])] : [N(sc[6]), N(h[5]), N(sc[4])];
    var m = textQ(R, right, wr);
    return { q: '<b>' + kname(f, true) + '</b> の <b>' + (mel ? '旋律短音階（上行）' : '和声短音階') + '</b> で、半音 上がった 音は？', ch: m.ch, a: m.a, ex: kname(f, true) + '（自然）：' + sc.map(N).join(' ') + ' → ' + (mel ? '第6・第7音' : '第7音') + 'を 半音 上げて <b>' + right + '</b>。' };
  });
  // u10 三和音（文字で）
  var TRI = [['maj', '長三和音'], ['min', '短三和音'], ['dim', '減三和音'], ['aug', '増三和音']];
  reg('triadText', 'u10', 2, '音名から 三和音の 種類', function (R) {
    for (var t = 0; t < 30; t++) {
      var x = pick(TRI, R), root = { l: ri(0, 6, R), a: pick([0, 0, 1, -1], R), o: 4 }, ns = M.chord(root, x[0]);
      if (ns.some(function (p) { return Math.abs(p.a) > 1; })) continue;
      var m = textQ(R, x[1], TRI.map(function (y) { return y[1]; }));
      return { q: '<b>' + ns.map(N).join('・') + '</b> は 何三和音？', ch: m.ch, a: m.a, ex: '下から 3度＋3度。長3＋短3 ＝ 長三和音、短3＋長3 ＝ 短三和音、短3＋短3 ＝ 減三和音、長3＋長3 ＝ 増三和音。答え：<b>' + x[1] + '</b>。' };
    }
    throw new Error('triadText');
  });
  // u11 調の中の 和音の コードネーム
  reg('degCode', 'u11', 2, '調の 和音の コードネーム', function (R) {
    var f = rkey(R), d = ri(1, 7, R), ns = M.diatonic(f, false, d, false), t = M.chordType(ns), right = M.chordName(ns[0], t), wr = [];
    [1, 2, 3, 4, 5, 6, 7].forEach(function (dd) { if (dd !== d) { var n2 = M.diatonic(f, false, dd, false); wr.push(M.chordName(n2[0], M.chordType(n2))); } });
    var m = textQ(R, right, wr);
    return { q: '<b>' + kname(f, false) + '</b> の <b>' + ROM[d] + '</b> の 和音を コードネームで 書くと？', ch: m.ch, a: m.a, ex: kname(f, false) + ' の ' + ROM[d] + ' ＝ ' + ns.map(N).join('・') + ' → <b>' + right + '</b>。（Ⅰ・Ⅳ・Ⅴ は 長、Ⅱ・Ⅲ・Ⅵ は 短（m）、Ⅶ は 減（dim））' };
  });
  // u12 移調先の 調
  var IVN = [[2, 'M', '長2度'], [3, 'm', '短3度'], [3, 'M', '長3度'], [4, 'P', '完全4度'], [5, 'P', '完全5度'], [2, 'm', '短2度']];
  reg('transTo', 'u12', 1, '移調すると 何調', function (R) {
    for (var t = 0; t < 40; t++) {
      var f = pick([0, 1, -1, 2, -2], R), it = pick(IVN, R), down = R() < 0.4, ton = M.keyTonic(f, false), to = M.up(ton, it[0], it[1], down), f2 = null;
      for (var k = -7; k <= 7; k++) { var tt = M.keyTonic(k, false); if (tt.l === to.l && tt.a === to.a) f2 = k; }
      if (f2 == null) continue;
      var right = kname(f2, false), wr = [f2 + 1, f2 - 1, f2 + 2, f2 - 2, f].filter(function (k) { return Math.abs(k) <= 7; }).map(function (k) { return kname(k, false); });
      var m = textQ(R, right, wr);
      return { q: '<b>' + kname(f, false) + '</b> の 曲を <b>' + it[2] + ' ' + (down ? '下' : '上') + '</b> に 移調すると 何調？', ch: m.ch, a: m.a, ex: '主音 ' + N(ton) + ' を ' + it[2] + (down ? '下' : '上') + ' へ → ' + N(to) + '。<b>' + right + '</b>。' };
    }
    throw new Error('transTo');
  });

  /* =================== 和声法 =================== */
  if (H && H.UT) {
    var UT = H.UT, fig = H.fig, oneChord = UT.oneChord;
    reg('dblRule', 'h02', 1, '重ねる音・省く音', function (R) {
      return factQ(R, [
        ['基本形の 三和音で、ふつう 重ねる 音は？', '根音', ['第3音', '第5音', '導音'], '4 声で 3 音の 和音を 書く ので 1 つ 重ねる。基本は <b>根音</b>。'],
        ['省略しても よい 音は？', '第5音', ['第3音', '根音', '第7音'], '第3音は 長・短を きめる 大切な 音なので 省略しない。省略できるのは <b>第5音</b>。'],
        ['ぜったいに 重ねては いけない 音は？', '導音', ['根音', '第5音', '主音'], '導音を 重ねると 2 つとも 主音へ 進んで 連続8度に なる。<b>導音は 重ねない</b>。'],
        ['第2転回形（四六の和音）で 重ねる 音は？', 'バスの 音（第5音）', ['根音', '第3音', '重ねない'], '四六の和音は <b>バスの 音（第5音）</b> を 重ねる。'],
        ['第1転回形（六の和音）で ふつう 重ねる 音は？', '根音か 第5音', ['第3音（バスの音）', '導音', 'どれも 重ねない'], '六の和音は バス（第3音）を 重ねず、<b>根音か 第5音</b> を 重ねる。'],
        ['Ⅴ₇ の 4 声で 省略できる 音は？', '第5音', ['第7音', '第3音', '根音'], 'Ⅴ₇（基本形）は <b>第5音</b> を 省略して 根音を 重ねられる。']
      ]);
    });
    reg('chordOfV', 'h02', 2, '4 声の 和音を 見わける', function (R) {
      var f = rkey(R), d = pick([1, 2, 4, 5, 6], R), ch = Ch(d), v = oneChord(f, false, ch, R); if (!v) throw new Error('chordOfV');
      var m = textQ(R, ROM[d], [1, 2, 3, 4, 5, 6, 7].map(function (x) { return ROM[x]; }));
      return { q: kname(f, false) + '。この 4 声の 和音は？（和音記号で）', fig: fig(f, false, [ch], [v], { nolab: true, zoom: 2.4 }), ch: m.ch, a: m.a, ex: '音を 集めると ' + H.pcs(f, false, ch).map(N).join('・') + ' → <b>' + ROM[d] + '</b>。バス（' + N(v[3]) + '）が 根音。', exFig: fig(f, false, [ch], [v], { zoom: 2.4 }) };
    });
    var RREL = { 1: { 4: '4度上（5度下）', 5: '5度上（4度下）', 6: '3度下', 2: '2度上' }, 2: { 5: '4度上（5度下）' }, 4: { 5: '2度上', 1: '5度上（4度下）', 2: '3度下' }, 5: { 1: '4度上（5度下）', 6: '2度上' }, 6: { 2: '4度上（5度下）', 4: '3度下', 5: '2度下' } };
    reg('rootMove', 'h03', 2, '根音の 進み方', function (R) {
      var a = pick(Object.keys(RREL), R), b = pick(Object.keys(RREL[a]), R), right = RREL[a][b];
      var m = textQ(R, right, ['4度上（5度下）', '5度上（4度下）', '2度上', '2度下', '3度下', '3度上']);
      var com = right.indexOf('2度') >= 0 ? '共通音なし → 上 3 声は バスと 反対向きに' : right.indexOf('3度') >= 0 ? '共通音 2 つ → 2 つ 保つ' : '共通音 1 つ → その 音を 保つ';
      return { q: '和音が <b>' + ROM[a] + ' → ' + ROM[b] + '</b> と 進むとき、根音は どう 動く？', ch: m.ch, a: m.a, ex: ROM[a] + ' → ' + ROM[b] + '：根音は <b>' + right + '</b>。' + com + '。' };
    });
    reg('connRule', 'h03', 1, '連結の きまり', function (R) {
      return factQ(R, [
        ['根音が 4度上（5度下）に 進む 連結（Ⅰ→Ⅳ など）で 共通音は？', '1 つ。同じ 声部で 保つ', ['ない', '2 つ', '3 つ'], '4度・5度 関係の 和音は 共通音 1 つ。<b>同じ 声部で 保ち</b>、ほかの 声は 近い 音へ。'],
        ['根音が 2度 進む 連結（Ⅳ→Ⅴ など）では？', '共通音が ないので 上 3 声は バスと 反対向きに', ['共通音を 2 つ 保つ', '全部の 声を 同じ 向きに', 'バスだけ 動かす'], '2度 関係は 共通音なし。<b>上 3 声を バスと 反対向き</b> に して 連続5度・8度を さける。'],
        ['根音が 3度 進む 連結（Ⅰ→Ⅵ など）で 共通音は？', '2 つ', ['ない', '1 つ', '3 つ'], '3度 関係は 共通音が <b>2 つ</b>。2 つとも 保つと なめらか。'],
        ['上 3 声の 動きで 基本は？', 'なるべく 近い 音へ（順次・保持）', ['いつも 跳躍', 'バスと 同じ 向き', '3 声とも 同じ 音へ'], '上 3 声は <b>なるべく 近い 音</b> へ（共通音は 保つ）。'],
        ['バスの 動き方は？', '跳躍も してよい（根音を 弾く）', ['かならず 順次', '動かない', '上 3 声と 同じ'], 'バスは 和音の 根音（転回形なら その音）を とるので <b>跳躍 OK</b>。']
      ]);
    });
    var CADS = [['正格終止', [5, 1]], ['変格終止', [4, 1]], ['半終止', [1, 5]], ['偽終止', [5, 6]]];
    reg('cadWhere', 'h05', 2, '進行の 終わり方', function (R) {
      var x = pick(CADS, R), pre = pick([[1, 4], [1, 6, 4], [1, 2], [1, 6, 2], [1]], R), seq = x[0] === '半終止' ? pre.concat([x[1][1]]) : pre.concat(x[1]);
      if (x[0] === '変格終止') seq = [1, 5, 1, 4, 1]; if (x[0] === '偽終止') seq = pre.concat([5, 6]);
      var m = textQ(R, x[0], CADS.map(function (y) { return y[0]; }));
      return { q: '和音進行 <b>' + seq.map(function (d) { return ROM[d]; }).join('‐') + '</b> の 終わり方は？', ch: m.ch, a: m.a, ex: '最後の 2 つ（' + ROM[seq[seq.length - 2]] + '→' + ROM[seq[seq.length - 1]] + '）で きまる。<b>' + x[0] + '</b>：正格 Ⅴ→Ⅰ、変格 Ⅳ→Ⅰ、半 …→Ⅴ、偽 Ⅴ→Ⅵ。' };
    });
    reg('funcFill', 'h05', 2, 'はたらきの 穴うめ', function (R) {
      var opts = [['Ⅰ‐？‐Ⅴ‐Ⅰ', ['Ⅳ', 'Ⅱ'], 'S（下属）'], ['Ⅰ‐Ⅳ‐？‐Ⅰ', ['Ⅴ'], 'D（属）'], ['？‐Ⅳ‐Ⅴ‐Ⅰ', ['Ⅰ', 'Ⅵ'], 'T（主）'], ['Ⅰ‐Ⅵ‐？‐Ⅴ‐Ⅰ', ['Ⅱ', 'Ⅳ'], 'S（下属）']], x = pick(opts, R), right = pick(x[1], R);
      var wr = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'].filter(function (s) { return x[1].indexOf(s) < 0; });
      var m = textQ(R, right, wr);
      return { q: '<b>' + x[0] + '</b> の ？ に 入る 和音として ふさわしいのは？', ch: m.ch, a: m.a, ex: 'T → S → D → T の 流れ。？ には <b>' + x[2] + '</b> の 和音（' + x[1].join('・') + '）。' };
    });
    reg('invText', 'h06', 2, '音から 転回形', function (R) {
      var f = rkey(R), d = pick([1, 4, 5, 2, 6], R), inv = ri(0, 2, R), ch = Ch(d, inv), pcs = H.pcs(f, false, ch), bass = pcs[inv], up = pcs.filter(function (_, i) { return i !== inv; });
      var right = H.label(ch), wr = [Ch(d, (inv + 1) % 3), Ch(d, (inv + 2) % 3), Ch(d % 7 + 1, inv), Ch((d + 1) % 7 + 1, inv)].map(H.label);
      var m = textQ(R, right, wr);
      return { q: kname(f, false) + '。バスが <b>' + N(bass) + '</b>、上に <b>' + up.map(N).join('・') + '</b>。この 和音は？', ch: m.ch, a: m.a, ex: pcs.map(N).join('・') + ' ＝ ' + ROM[d] + '。バスが ' + H.role(ch, inv) + ' なので <b>' + right + '</b>。' };
    });
    reg('nctMore', 'h07', 2, '非和声音の いろいろ', function (R) {
      return factQ(R, [
        ['和音の 音から 順次で 出て、跳躍で 次の 和音の 音へ 行く 非和声音は？', '逸音', ['倚音', '経過音', '掛留音'], '<b>逸音</b>：順次で はなれ、跳躍で 解決する（倚音の 逆）。'],
        ['バスで 長く 保たれ、上の 和音が かわっても 鳴りつづける 音は？', '保続音（オルゲルプンクト）', ['経過音', '先取音', '刺繍音'], '<b>保続音</b>：バスで 主音や 属音を 長く 保つ。'],
        ['倚音と 掛留音の ちがいは？', '掛留音は 前の 和音から つながって いる（準備が ある）', ['倚音は 弱拍に 来る', '掛留音は 跳躍で 入る', 'ちがいは ない'], '掛留音は <b>前の 音を つないで</b> 準備し、倚音は 準備なし（跳躍などで 入る）。'],
        ['経過音が 来やすい 拍は？', '弱拍', ['強拍', '小節の 頭だけ', 'どこにも 来ない'], '経過音は ふつう <b>弱拍</b>。強拍の 経過音は「アクセントの ある 経過音」。'],
        ['先取音は 曲の どこで よく 使われる？', '終止の 直前（最後の 主音を 先に）', ['曲の 最初', '転調の 途中', '休符の 前'], '<b>終止の 直前</b> に 次の 和音（主音）を 先に 鳴らす 形が 多い。']
      ]);
    });
    reg('nctFind', 'h07', 2, '非和声音を 見つける', function (R) {
      var f = rkey(R), sc = M.scale(M.keyTonic(f, false), 'major'), pat = pick([[0, 1, 2, 4], [2, 3, 4, 2], [4, 5, 4, 2], [2, 1, 0, 2], [4, 3, 2, 0]], R), bad = pat.map(function (x) { return [0, 2, 4, 7].indexOf(x) < 0; }).indexOf(true);
      var ps = pat.map(function (x) { var p = sc[x]; return { l: p.l, a: p.a, o: p.o }; });
      var m = textQ(R, (bad + 1) + ' 番め', ['1 番め', '2 番め', '3 番め', '4 番め']);
      return { q: kname(f, false) + '。Ⅰ の 和音（' + [0, 2, 4].map(function (i) { return N(sc[i]); }).join('・') + '）の 上の メロディー。<b>非和声音</b> は 何番め？', fig: { score: { clef: 'treble', key: f, notes: ps.map(function (p, i) { return { k: M.str(p), d: 'q', lab: String(i + 1) }; }), sp: 44, zoom: 1.9 } }, ch: m.ch, a: m.a, ex: (bad + 1) + ' 番めの ' + N(ps[bad]) + ' は Ⅰ の 和音の 音では ない。前後の 動きから ' + (Math.abs(pat[bad + 1] - pat[bad - 1]) === 2 ? '経過音' : '刺繍音') + '。', play: ps.map(function (p) { return [M.str(p), 0.5]; }) };
    });
    var QM = { 1: '長三和音', 2: '短三和音', 3: '短三和音', 4: '長三和音', 5: '長三和音', 6: '短三和音', 7: '減三和音' };
    reg('qualFind', 'h08', 2, '三和音の 種類で さがす', function (R) {
      var want = pick(['長三和音', '短三和音', '減三和音'], R), ok = [1, 2, 3, 4, 5, 6, 7].filter(function (d) { return QM[d] === want; }), right = ROM[pick(ok, R)];
      var wr = [1, 2, 3, 4, 5, 6, 7].filter(function (d) { return QM[d] !== want; }).map(function (d) { return ROM[d]; });
      var m = textQ(R, right, wr);
      return { q: '長調で <b>' + want + '</b> に なる 和音は？', ch: m.ch, a: m.a, ex: '長調：Ⅰ・Ⅳ・Ⅴ ＝ 長、Ⅱ・Ⅲ・Ⅵ ＝ 短、Ⅶ ＝ 減。答え：<b>' + right + '</b>。' };
    });
    reg('minChordNotes', 'h09', 2, '短調の 和音の 構成音', function (R) {
      var f = pick([0, 1, -1, 2, -2, 3, -3], R), d = pick([5, 5, 1, 4, 7], R), sev = d === 5 && R() < 0.5, ch = Ch(d, 0, sev), pc = H.pcs(f, true, ch), txt = function (a) { return a.map(N).join('・'); };
      var nat = pc.map(function (p) { var lt = H.lt(f, true); return p.l === lt.l && p.a === lt.a ? { l: p.l, a: p.a - 1 } : p; });
      var wr = [txt(nat), txt(H.pcs(f, true, Ch(d % 7 + 1, 0, sev))), txt(H.pcs(f, true, Ch((d + 1) % 7 + 1, 0, sev)))].filter(function (t) { return t !== txt(pc); });
      var m = textQ(R, txt(pc), wr.concat([txt(H.pcs(f, false, Ch(d, 0, sev)))]));
      return { q: '<b>' + kname(f, true) + '</b>（和声短音階）の <b>' + H.label(ch) + '</b> の 構成音は？', ch: m.ch, a: m.a, ex: '短調では 導音（' + N(H.lt(f, true)) + '）を ふくむ 和音で 第7音を 半音 上げる。' + H.label(ch) + ' ＝ <b>' + txt(pc) + '</b>。' };
    });
    reg('nineSpell', 'h13', 2, '第9音を 答える', function (R) {
      var mi = R() < 0.4, f = pick([0, 1, -1, 2, -2, 3, -3], R), pc = H.pcs(f, mi, { d: 5, inv: 0, sev: true, nine: true }), right = N(pc[4]);
      var wr = pc.slice(0, 4).map(N).concat([N({ l: pc[4].l, a: pc[4].a + (mi ? 1 : -1) })]);
      var m = textQ(R, right, wr);
      return { q: '<b>' + kname(f, mi) + '</b> の Ⅴ₉ の <b>第9音</b> は？', ch: m.ch, a: m.a, ex: 'Ⅴ₉ ＝ ' + pc.map(N).join('・') + '。第9音は 根音（' + N(pc[0]) + '）の 9度 上 ＝ <b>' + right + '</b>（' + (mi ? '短調は 短9度' : '長調は 長9度') + '）。' };
    });
  }

  /* =================== 対位法 =================== */
  reg('cfFacts', 'c01', 1, '定旋律の きまり', function (R) {
    return factQ(R, [
      ['定旋律の 音域（いちばん 低い 音〜高い 音）は ふつう？', '10度 くらいまで', ['2 オクターブ 以上', '3度 以内', '決まりは ない'], '歌いやすい ように 音域は <b>10度 くらい まで</b>。'],
      ['定旋律の 音符は？', 'すべて 全音符', ['8分音符 中心', '付点音符', 'いろいろ まぜる'], '厳格対位法の 定旋律は <b>全音符</b> だけで 書く。'],
      ['同じ 向きに 2 回 続けて 跳躍すると？', '和音の 分散の ように なり さける', ['よい 旋律', 'かならず 使う', '終止の 形'], '<b>続けての 跳躍</b> は さけ、跳躍の あとは 反対向きに もどる。'],
      ['旋律で 増4度（三全音）の 動きは？', 'さける', ['よく 使う', '終わりで 使う', '1 回だけ 使う'], '増4度（ファ‐シ）は 歌いにくいので <b>さける</b>。'],
      ['定旋律の 長さは ふつう？', '8〜14 小節 くらい', ['2 小節', '50 小節 以上', '1 小節'], 'ふつう <b>8〜14 小節</b>。']
    ]);
  });
  reg('conText', 'c02', 1, '音程の 協和・不協和（文字）', function (R) {
    var L = [['1度', '完全協和'], ['5度', '完全協和'], ['8度', '完全協和'], ['3度', '不完全協和'], ['6度', '不完全協和'], ['10度', '不完全協和'], ['2度', '不協和'], ['4度（2 声）', '不協和'], ['7度', '不協和'], ['9度', '不協和']], x = pick(L, R);
    var m = textQ(R, x[1] + '音程', ['完全協和音程', '不完全協和音程', '不協和音程'], 3);
    return { q: '2 声の 対位法で <b>' + x[0] + '</b> は？', ch: m.ch, a: m.a, ex: '完全協和：1・5・8度、不完全協和：3・6度（10度＝3度）、不協和：2・4・7度（9度＝2度）。<b>' + x[0] + '</b> は ' + x[1] + '音程。' };
  });
  reg('motText', 'c03', 1, '動きの 名前（文字）', function (R) {
    var L = [['上の声が 上行、下の声が 下行', '反進行'], ['上の声が 下行、下の声が 上行', '反進行'], ['両方 上行して、音程（3度→3度）が 同じ', '平行進行'], ['両方 下行して、音程が 6度→3度 と かわる', '同進行'], ['上の声は 動かず、下の声だけ 上行', '斜進行'], ['下の声は 動かず、上の声だけ 下行', '斜進行'], ['両方 上行して、5度→8度 に なる', '同進行']], x = pick(L, R);
    var m = textQ(R, x[1], ['平行進行', '同進行', '反進行', '斜進行']);
    return { q: '<b>' + x[0] + '</b> ── この 動きは？', ch: m.ch, a: m.a, ex: '<b>' + x[1] + '</b>。反進行 ＝ 反対向き、平行進行 ＝ 同じ向きで 同じ音程、同進行 ＝ 同じ向きで 音程が かわる、斜進行 ＝ 片方が 動かない。' };
  });

  // 単元に 登録
  Object.keys(NEW).forEach(function (u) { var un = GK.UNIT[u]; if (un) NEW[u].forEach(function (id) { if (un.types.indexOf(id) < 0) un.types.push(id); }); });
})();
