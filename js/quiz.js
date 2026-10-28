/* =========================================================
   楽典ラボ：問題を作る（同じ乱数なら 全員 同じ問題 → クラス対戦）
   gen(R) → { q: 問題文, fig: 図, ch: [文字 | { fig }], a: 正解の番号, ex: 解説, exFig: 解説の図, play: 鳴らすもの, ear: 聴く問題 }
   ※ 乱数は 必ず R を使う（Math.random は使わない）
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, F = GK.F, C = M.COL;
  var N = function (p) { return GK.nm(p); };
  var pick = function (a, R) { return a[Math.floor(R() * a.length)]; };
  var ri = function (a, b, R) { return a + Math.floor(R() * (b - a + 1)); };
  var shuffle = GK.shuffle;
  var T = {}; // 問題の種類

  // 正解 1 つ ＋ まちがい（key が同じものは 1 つに）
  function mc(R, right, wrongs, n) {
    n = n || 4;
    var seen = {}, list = [], pool = shuffle(wrongs.slice(), R);
    // 文字の選択肢は 長さが ちかい まちがいを えらぶ（「いちばん長いのが 正解」の かたよりを 防ぐ）
    var plain = function (x) { return x.t != null && !x.fig; }, len = function (x) { return String(x.t).replace(/<[^>]+>/g, '').length; };
    if (plain(right) && pool.length > n && pool.every(plain)) {
      var L = len(right); pool.sort(function (a, b) { return Math.abs(len(a) - L) - Math.abs(len(b) - L); });
      pool = shuffle(pool.slice(0, n + 1), R);
    }
    seen[right.k] = 1;
    pool.forEach(function (w) { if (list.length < n - 1 && !seen[w.k]) { seen[w.k] = 1; list.push(w); } });
    var all = shuffle([right].concat(list), R);
    return { ch: all.map(function (x) { return x.fig ? { fig: x.fig, k: x.k } : x.t; }), a: all.indexOf(right), why: all.map(function (x) { return x.w || ''; }) };
  }
  var tx = function (t, k) { return { k: k == null ? t : k, t: t }; };
  var tw = function (t, w, k) { var o = tx(t, k); o.w = w; return o; }; // w：その選択肢が 本当は何か（まちがえたときに 見せる）
  var pn = function (p) { p = M.p(p); return { k: M.str({ l: p.l, a: p.a, o: 4 }), t: N(p) }; }; // 音名の選択肢（オクターブなし）
  // ヘ音記号の五線の まん中（レ3 あたり）に 来るように オクターブを ずらす
  function toBass(ps) { var avg = ps.reduce(function (t, p) { return t + M.midi(p); }, 0) / ps.length, k = Math.round((50 - avg) / 12); return ps.map(function (p) { return { l: p.l, a: p.a, o: p.o + k }; }); }
  function nat(lo, hi) { var r = [], a = M.dia(lo), b = M.dia(hi); for (var d = a; d <= b; d++) r.push({ l: d % 7, a: 0, o: Math.floor(d / 7) }); return r; }
  function posTxt(p, clef) { // 五線の どこか
    var bottom = M.clefBottom(clef), d = M.dia(p) - M.dia(bottom);
    if (d >= 0 && d <= 8) return d % 2 === 0 ? '第' + (d / 2 + 1) + '線' : '第' + ((d + 1) / 2) + '間';
    if (d < 0) { var k = -d; return k % 2 === 0 ? '下第' + (k / 2) + '線' : (k === 1 ? '第1線の下' : '下第' + ((k - 1) / 2) + '線の下'); }
    var u = d - 8; return u % 2 === 0 ? '上第' + (u / 2) + '線' : (u === 1 ? '第5線の上' : '上第' + ((u - 1) / 2) + '線の上');
  }
  var one = function (p, clef, o) { return { score: F.one(M.str(p), Object.assign({ clef: clef }, o || {})) }; };
  var lens = function (b) { return b === Math.floor(b) ? b + '' : b === 0.5 ? '0.5' : (Math.round(b * 100) / 100) + ''; };
  // 音符の長さの名前
  var DN = { w: '全音符', h: '2分音符', q: '4分音符', '8': '8分音符', '16': '16分音符', hd: '付点2分音符', qd: '付点4分音符', '8d': '付点8分音符', wd: '付点全音符' };
  var RN = { wr: '全休符', hr: '2分休符', qr: '4分休符', '8r': '8分休符', '16r': '16分休符', qdr: '付点4分休符' };
  var noteFig = function (d, o) { o = o || {}; return { score: { clef: 'treble', notes: [{ k: o.k || 'B4', d: d, c: o.c, st: 1 }], minBar: o.w || 56, sp: 30, noClef: true, rhythm: true, above: 30, below: 22 } }; };
  // 足し算の図：音符 ＋ 音符
  // 式の図：音符と記号を 等間かくで ならべる。記号は 符頭の高さに そろえる
  // toks: [ '8' などの長さ | { t: '＝', c: 色 } ]
  function eqFig(toks) {
    var items = [], texts = [], x = 8, Y = 50, SW = 46; // Y：符頭の線（Stave y=-10 → 中央の線）、SW：1 マスの幅
    toks.forEach(function (tk) {
      if (typeof tk === 'string') { items.push({ s: 0, x: x + 14, k: 'B4', d: tk, st: 1 }); x += SW; } // 符頭（はば約 12）を マスの まん中より少し左に（はた・付点の分）
      else { texts.push({ x: x + SW / 2, y: Y + 10, t: tk.t, size: tk.size || 28, c: tk.c }); x += SW; }
    });
    return { free: { w: x + 8, h: 80, staves: [{ x: 0, y: -10, w: x + 8, hide: true }], items: items, texts: texts } };
  }
  function sumFig(ds) {
    var toks = [];
    ds.forEach(function (d, i) { if (i) toks.push({ t: '＋' }); toks.push(d); });
    return eqFig(toks.concat(ds.length > 1 ? [{ t: '＝' }, { t: '？', c: C.red }] : []));
  }

  /* =================== 01 五線と音名 =================== */
  // 音部記号の「目じるし」の音から 線・間を 1 つずつ数える（いちばん近い目じるしを使う）
  var MARKS = {
    treble: [['G4', 'ト音記号の 第2線は ソ'], ['C5', 'ト音記号の 第3間は ド'], ['C4', '下第1線は 中央のド'], ['G5', 'ト音記号の 第5線の上は ソ']],
    bass: [['F3', 'ヘ音記号の 第4線は ファ'], ['C3', 'ヘ音記号の 第2間は ド'], ['C4', '上第1線は 中央のド'], ['G2', 'ヘ音記号の 第1線は ソ']],
    alto: [['C4', 'アルト記号の 第3線は 中央のド'], ['F3', 'アルト記号の 第1線は ファ'], ['G4', 'アルト記号の 第5線は ソ']],
    tenor: [['C4', 'テノール記号の 第4線は 中央のド'], ['D3', 'テノール記号の 第1線は レ'], ['A3', 'テノール記号の 第3線は ラ']],
    soprano: [['C4', 'ソプラノ記号の 第1線は 中央のド'], ['G4', 'ソプラノ記号の 第3線は ソ'], ['C5', 'ソプラノ記号の 第4間は ド']],
    'mezzo-soprano': [['C4', 'メゾソプラノ記号の 第2線は 中央のド'], ['A3', 'メゾソプラノ記号の 第1線は ラ']],
    'baritone-c': [['C4', 'バリトン記号の 第5線は 中央のド'], ['B2', 'バリトン記号の 第1線は シ']]
  };
  function readGen(clef, poolE, poolH) {
    return function (R, st) {
      var p = pick(st >= 2 ? poolH : poolE, R);
      var wr = [-1, 1, -2, 2, 3, -3].map(function (k) { return pn(M.P(p.l + k, 0, p.o)); });
      var m = mc(R, pn(p), wr);
      var mk = MARKS[clef].slice().sort(function (a, b) { return Math.abs(M.dia(p) - M.dia(a[0])) - Math.abs(M.dia(p) - M.dia(b[0])); })[0];
      var ref = M.p(mk[0]), d = M.dia(p) - M.dia(ref), sg = d < 0 ? -1 : 1, path = [];
      for (var j = 0; sg * j <= sg * d; j += sg) path.push(M.P(ref.l + j, 0, ref.o));
      var how = d === 0 ? 'この音が ちょうど その音' : 'そこから ' + (d > 0 ? '上へ ' : '下へ ') + Math.abs(d) + ' つ（' + path.map(N).join('→') + '）';
      return { q: 'この音の音名は？', fig: one(p, clef), ch: m.ch, a: m.a, ex: mk[1].replace(/(ド|レ|ミ|ファ|ソ|ラ|シ)$/, function () { return N(ref); }) + '。' + how + ' → <b>' + N(p) + '</b>。', exFig: { score: { clef: clef, notes: path.map(function (x, j) { var last = j === path.length - 1; return { k: M.str(x), d: 'q', c: last ? C.red : j === 0 ? C.blue : C.gray, lab: j === 0 || last ? N(x) : '', lc: last ? C.red : C.blue }; }), sp: 34, beam: false } }, play: [[p, 1.5]] };
    };
  }
  T.readT = { u: 'u01', st: 1, gen: readGen('treble', nat('C4', 'A5'), nat('G3', 'C6')) };
  T.readB = { u: 'u01', st: 2, gen: readGen('bass', nat('E2', 'C4'), nat('C2', 'E4')) };
  var clefQ = function (clef, g) { return function (R, st) { var q = g(R, st); q.q = '<b>' + M.CLEF_JP[clef] + '</b>（ハ音記号）。この音の音名は？'; return q; }; };
  T.readA = { u: 'u01', st: 3, gen: clefQ('alto', readGen('alto', nat('E3', 'C5'), nat('C3', 'E5'))) };
  T.readTn = { u: 'u01', st: 3, gen: clefQ('tenor', readGen('tenor', nat('C3', 'A4'), nat('A2', 'C5'))) };
  // ソプラノ・メゾソプラノ・バリトン記号（めずらしい ハ音記号）
  T.readC = {
    u: 'u01', st: 3, gen: function (R, st) {
      var c = pick(['soprano', 'mezzo-soprano', 'baritone-c'], R), lo = M.clefBottom(c), top = M.P(lo.l + 8, 0, lo.o);
      var q = readGen(c, nat(M.str(M.P(lo.l - 1, 0, lo.o)), M.str(M.P(top.l + 1, 0, top.o))), nat(M.str(M.P(lo.l - 2, 0, lo.o)), M.str(M.P(top.l + 2, 0, top.o))))(R, st);
      q.q = '<b>' + M.CLEF_JP[c] + '</b>（ハ音記号）。この音の音名は？'; return q;
    }
  };
  var CCL = ['soprano', 'mezzo-soprano', 'alto', 'tenor', 'baritone-c'];
  var cStaff = function (c, notes) { return { score: { clef: c, notes: notes || [], minBar: notes ? 90 : 40, sp: 60, zoom: 2.4 } }; };
  T.cClefMid = {
    u: 'u01', st: 2, gen: function (R, st) {
      var c = st >= 3 ? pick(CCL, R) : pick(['alto', 'tenor'], R), n = M.CLEF_C_LINE[c];
      var m = mc(R, tx('第' + n + '線'), [1, 2, 3, 4, 5].map(function (k) { return tx('第' + k + '線'); }).concat([tx('第' + Math.min(4, n) + '間')]));
      return { q: 'この <b>' + M.CLEF_JP[c] + '</b> で <b>中央のド</b> は どこ？', fig: cStaff(c), ch: m.ch, a: m.a, ex: 'ハ音記号は まん中の くぼみが 指す線が 中央のド → <b>第' + n + '線</b>。', exFig: cStaff(c, [{ k: 'C4', d: 'w', c: C.red, lab: '中央の' + N('C4') }]) };
    }
  };
  T.cClefName = {
    u: 'u01', st: 2, gen: function (R, st) {
      var c = st >= 3 ? pick(CCL, R) : pick(['alto', 'tenor', 'alto', 'tenor', 'soprano'], R);
      var m = mc(R, tx(M.CLEF_JP[c]), CCL.map(function (x) { return tw(M.CLEF_JP[x], M.CLEF_JP[x] + ' は 第' + M.CLEF_C_LINE[x] + '線が ド'); }));
      return { q: 'この ハ音記号の 名前は？（赤い音が 中央のド）', fig: cStaff(c, [{ k: 'C4', d: 'w', c: C.red }]), ch: m.ch, a: m.a, why: m.why, ex: 'ドの線が 第' + M.CLEF_C_LINE[c] + '線 → <b>' + M.CLEF_JP[c] + '</b>。下から ソプラノ（1）・メゾソプラノ（2）・アルト（3）・テノール（4）・バリトン（5）。' };
    }
  };
  T.cClefInst = {
    u: 'u01', st: 1, gen: function (R) {
      var L = [
        ['<b>ビオラ</b>の楽譜で ふだん使う 音部記号は？', 'アルト記号', ['テノール記号', 'ト音記号', 'ヘ音記号'], 'ビオラは まん中の音域なので、まん中の線が ドの <b>アルト記号</b>。'],
        ['<b>チェロ</b>が 高い音を書くときに 使う 音部記号は？', 'テノール記号', ['アルト記号', 'ソプラノ記号', 'ヘ音記号'], 'チェロは ふだん ヘ音記号。高い音は 加線が多くなるので <b>テノール記号</b>（第4線が ド）。もっと高いと ト音記号。'],
        ['<b>ファゴット</b>や <b>トロンボーン</b>が 高い音で使う 音部記号は？', 'テノール記号', ['アルト記号', 'メゾソプラノ記号', 'ト音記号'], 'ふだんは ヘ音記号、高い音は <b>テノール記号</b>（第4線が ド）。'],
        ['<b>アルト記号</b>を ふだん使う 楽器は？', 'ビオラ', ['チェロ', 'フルート', 'トランペット'], 'アルト記号（第3線が ド）は <b>ビオラ</b>の 記号。'],
        ['<b>テノール記号</b>で ドになるのは？', '第4線', ['第3線', '第1線', '第5線'], 'テノール記号は アルト記号を 1 線 上にずらした形 → <b>第4線</b>が 中央のド。']
      ];
      var x = pick(L, R), m = mc(R, tx(x[1]), x[2].map(function (y) { return tx(y); }));
      return { q: x[0], ch: m.ch, a: m.a, ex: x[3], exFig: { c: 'cClefs', a: { list: ['alto', 'tenor'] } } };
    }
  };
  T.cClefSame = {
    u: 'u01', st: 3, gen: function (R) {
      var c = pick(['alto', 'tenor'], R), to = c === 'alto' ? 'treble' : 'bass';
      var p = pick(c === 'alto' ? nat('G3', 'D5') : nat('C3', 'G4'), R);
      if (to === 'treble' && M.dia(p) < M.dia('A3')) p = M.p('C4');
      var wr = [-1, 1, -2, 2].map(function (k) { var x = M.P(p.l + k, 0, p.o); return { k: M.str(x), fig: one(x, to) }; });
      var m = mc(R, { k: M.str(p), fig: one(p, to) }, wr);
      return { q: '<b>' + M.CLEF_JP[c] + '</b>の この音と 同じ高さを <b>' + M.CLEF_JP[to] + '</b>で 書いたのは？', fig: one(p, c), ch: m.ch, a: m.a, ex: 'この音は ' + posTxt(p, c) + ' → <b>' + N(p) + '</b>（' + M.str(p) + '）。' + M.CLEF_JP[to] + 'では ' + posTxt(p, to) + '。', exFig: { row: [one(p, c, { lab: N(p), c: C.red }), one(p, to, { lab: N(p), c: C.red })] }, play: [[p, 1.5]] };
    }
  };
  T.findNote = {
    u: 'u01', st: 1, gen: function (R) {
      var pool = nat('C4', 'G5'), p = pick(pool, R);
      var wr = [-1, 1, -2, 2, 3].map(function (k) { var x = M.P(p.l + k, 0, p.o); return { k: M.str(x), fig: one(x, 'treble') }; });
      var m = mc(R, { k: M.str(p), fig: one(p, 'treble') }, wr);
      return { q: 'ト音記号で「<b>' + N(p) + '</b>」はどれ？', fig: null, ch: m.ch, a: m.a, ex: '<b>' + N(p) + '</b> は ' + posTxt(p, 'treble') + '。', exFig: { score: F.one(M.str(p), { lab: N(p), c: C.red }) } };
    }
  };
  T.nameSys = {
    u: 'u01', st: 1, gen: function (R) {
      var sys = [['doremi', 'ドレミ'], ['jp', '日本音名'], ['en', '英語音名']], a = pick(sys, R), b = pick(sys.filter(function (s) { return s !== a; }), R);
      var p = { l: ri(0, 6, R), a: 0, o: 4 };
      var wr = [1, 2, 3, 4, 5, 6].map(function (k) { var x = M.P(p.l + k, 0, 4); return tx(M.name(x, b[0]), M.str(x)); });
      var m = mc(R, tx(M.name(p, b[0]), M.str(p)), wr);
      return { q: a[1] + 'の「<b>' + M.name(p, a[0]) + '</b>」は ' + b[1] + 'で？', fig: { html: '<table style="border-collapse:collapse;font-size:18px"><tr>' + [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<td style="padding:4px 10px;border:1px solid var(--line);text-align:center;' + (i === p.l ? 'background:var(--gold-soft);font-weight:700' : '') + '">' + M.name({ l: i, a: 0, o: 4 }, a[0]) + '</td>'; }).join('') + '</tr></table>', cap: a[1] + 'の ならび' }, ch: m.ch, a: m.a, ex: M.name(p, 'doremi') + '＝' + M.name(p, 'jp') + '＝' + M.name(p, 'en') + '（ド・レ・ミ… ＝ ハ・ニ・ホ・ヘ・ト・イ・ロ ＝ C・D・E・F・G・A・B）' };
    }
  };
  T.grandSame = {
    u: 'u01', st: 3, gen: function (R) {
      var p = pick(nat('A3', 'E4'), R);
      var wr = [-1, 1, -2, 2].map(function (k) { var x = M.P(p.l + k, 0, p.o); return { k: M.str(x), fig: one(x, 'treble') }; });
      var m = mc(R, { k: M.str(p), fig: one(p, 'treble') }, wr);
      return { q: 'ヘ音記号の この音と 同じ高さを ト音記号で書いたのは？', fig: one(p, 'bass'), ch: m.ch, a: m.a, ex: 'この音は <b>' + N(p) + '</b>（' + M.str(p) + '）。中央のド（C4）は どちらの記号でも 加線1本。', exFig: { score: { clef: 'grand', notes: [{ k: M.str(p), d: 'w', staff: 2, c: C.red }, { k: M.str(p), d: 'w', staff: 1, c: C.red, lab: N(p) }], sp: 50 } }, play: [[p, 1.5]] };
    }
  };
  T.ledgerN = {
    u: 'u01', st: 2, gen: function (R) {
      var clef = R() < 0.6 ? 'treble' : 'bass';
      var pool = clef === 'treble' ? ['G3', 'A3', 'B3', 'C4', 'D4', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6'] : ['B1', 'C2', 'D2', 'E2', 'F2', 'B3', 'C4', 'D4', 'E4', 'F4'];
      var p = M.p(pick(pool, R)), bottom = { treble: 'E4', bass: 'G2' }[clef], d = M.dia(p) - M.dia(bottom);
      var n = d < 0 ? Math.floor(-d / 2) : d > 8 ? Math.floor((d - 8) / 2) : 0;
      var m = mc(R, tx(n + ' 本'), [0, 1, 2, 3, 4].map(function (x) { return tx(x + ' 本'); }));
      return { q: 'この音を書くのに 使っている<b>加線</b>は 何本？', fig: one(p, clef), ch: m.ch, a: m.a, ex: 'この音は <b>' + posTxt(p, clef) + '</b>（' + N(p) + '）。五線から はみ出た分だけ 短い線を足すので 加線は <b>' + n + ' 本</b>。' + (n === 0 ? '第1線の下・第5線の上は 加線なしで書ける。' : '') };
    }
  };

  /* =================== 02 音符と休符 =================== */
  T.durName = {
    u: 'u02', st: 1, gen: function (R, st) {
      var ds = st >= 2 ? ['hd', 'qd', '8d', 'h', 'q', '8', '16'] : ['w', 'h', 'q', '8', '16'];
      var d = pick(ds, R), wr = Object.keys(DN).map(function (k) { return tx(DN[k]); });
      var m = mc(R, tx(DN[d]), wr);
      return { q: 'この音符の名前は？', fig: noteFig(d, { w: 70 }), ch: m.ch, a: m.a, ex: '<b>' + DN[d] + '</b>：4分音符を1拍とすると <b>' + lens(M.len(d)) + ' 拍</b>。' };
    }
  };
  T.restName = {
    u: 'u02', st: 1, gen: function (R) {
      var ds = ['wr', 'hr', 'qr', '8r', '16r'], d = pick(ds, R);
      var m = mc(R, tx(RN[d]), ds.map(function (k) { return tx(RN[k]); }));
      return { q: 'この休符の名前は？', fig: { score: { clef: 'treble', notes: [{ d: d }], minBar: 70, noClef: true, zoom: 1.6 } }, ch: m.ch, a: m.a, ex: '<b>' + RN[d] + '</b>（' + lens(M.len(d.replace('r', ''))) + ' 拍）。全休符は 線から<b>ぶら下がる</b>、2分休符は 線に<b>のる</b>。', exFig: { c: 'noteTree', a: { rest: true } } };
    }
  };
  T.durCount = {
    u: 'u02', st: 2, gen: function (R) {
      var pairs = [['w', 'q'], ['w', '8'], ['h', '8'], ['hd', 'q'], ['hd', '8'], ['qd', '8'], ['qd', '16'], ['q', '16'], ['h', '16'], ['8d', '16'], ['wd', 'h']];
      var pr = pick(pairs, R), n = M.len(pr[0]) / M.len(pr[1]);
      var wr = [n - 1, n + 1, n * 2, n / 2, n + 2, n - 2].filter(function (x) { return x > 0 && x === Math.floor(x); }).map(function (x) { return tx(x + ' つ'); });
      var m = mc(R, tx(n + ' つ'), wr);
      return { q: '<b>' + DN[pr[0]] + '</b> は <b>' + DN[pr[1]] + '</b> いくつ分？', fig: eqFig([pr[0], { t: '＝' }, pr[1], { t: '×' }, { t: '？', c: C.red }]), ch: m.ch, a: m.a, ex: DN[pr[0]] + ' ＝ ' + lens(M.len(pr[0])) + ' 拍、' + DN[pr[1]] + ' ＝ ' + lens(M.len(pr[1])) + ' 拍。' + lens(M.len(pr[0])) + ' ÷ ' + lens(M.len(pr[1])) + ' ＝ <b>' + n + '</b>。' };
    }
  };
  T.durSum = {
    u: 'u02', st: 2, gen: function (R) {
      var sums = [[['q', '8'], 'qd'], [['h', 'q'], 'hd'], [['q', 'q'], 'h'], [['8', '8'], 'q'], [['h', 'h'], 'w'], [['8', '16'], '8d'], [['hd', 'q'], 'w'], [['qd', '8'], 'h'], [['16', '16'], '8'], [['q', '8', '8'], 'h']];
      var s = pick(sums, R), all = ['w', 'hd', 'h', 'qd', 'q', '8d', '8'];
      var m = mc(R, { k: s[1], fig: noteFig(s[1]) }, all.map(function (d) { return { k: d, fig: noteFig(d) }; }));
      var tot = s[0].reduce(function (a, d) { return a + M.len(d); }, 0);
      return { q: 'たすと どの音符と 同じ長さ？', fig: sumFig(s[0]), ch: m.ch, a: m.a, ex: s[0].map(function (d) { return lens(M.len(d)); }).join(' ＋ ') + ' ＝ <b>' + lens(tot) + ' 拍</b> ＝ ' + DN[s[1]] + '。' };
    }
  };
  T.longest = {
    u: 'u02', st: 1, gen: function (R) {
      var all = shuffle(['w', 'hd', 'h', 'qd', 'q', '8', '16'], R).slice(0, 4);
      var best = all.slice().sort(function (a, b) { return M.len(b) - M.len(a); })[0];
      var ch = all.map(function (d) { return { k: d, fig: noteFig(d) }; });
      return { q: 'いちばん 長い音符は？', ch: ch.map(function (x) { return { fig: x.fig, k: x.k }; }), a: all.indexOf(best), ex: all.map(function (d) { return DN[d] + ' ' + lens(M.len(d)) + '拍'; }).join('、') + '。いちばん長いのは <b>' + DN[best] + '</b>。' };
    }
  };
  T.restBeats = {
    u: 'u02', st: 2, gen: function (R) {
      var ds = ['wr', 'hr', 'qr', '8r', '16r'], d = pick(ds, R), b = M.len(d);
      var m = mc(R, tx(lens(b) + ' 拍'), [4, 3, 2, 1, 0.5, 0.25, 1.5].map(function (x) { return tx(lens(x) + ' 拍'); }));
      return { q: '4分音符を 1 拍とすると、この休符は 何拍 休む？', fig: { score: { clef: 'treble', notes: [{ d: d }], minBar: 70, noClef: true, zoom: 1.6 } }, ch: m.ch, a: m.a, ex: '<b>' + RN[d] + '</b> は ' + DN[d.replace('r', '')] + 'と同じ長さ → <b>' + lens(b) + ' 拍</b>。休符も 音符と同じく 半分ずつ 短くなる。', exFig: { c: 'noteTree', a: { rest: true } } };
    }
  };
  T.durBeats = {
    u: 'u02', st: 1, gen: function (R, st) {
      var ds = st >= 2 ? ['hd', 'qd', '8d', 'wd', 'h', 'q'] : ['w', 'h', 'q', '8', '16'], d = pick(ds, R), b = M.len(d), d0 = d.replace('d', '');
      var m = mc(R, tx(lens(b) + ' 拍'), [6, 4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25].map(function (x) { return tx(lens(x) + ' 拍'); }));
      return { q: '4分音符を 1 拍とすると、この音符は 何拍？', fig: noteFig(d, { w: 70 }), ch: m.ch, a: m.a, ex: DN[d] + ' ＝ <b>' + lens(b) + ' 拍</b>。' + (d !== d0 ? 'もとの ' + DN[d0] + '（' + lens(M.len(d0)) + ' 拍）＋ その半分（' + lens(M.len(d0) / 2) + ' 拍）。' : '全音符 4 → 2分 2 → 4分 1 → 8分 0.5 → 16分 0.25 と 半分ずつ。'), exFig: d !== d0 ? sumFig([d0, ({ h: 'q', q: '8', '8': '16', w: 'h' })[d0]]) : { c: 'noteTree' } };
    }
  };

  /* =================== 03 拍子と小節 =================== */
  var FILL = {
    '2/4': [['q', 'q'], ['h'], ['8', '8', 'q'], ['qd', '8'], ['q', '8', '8'], ['8', '8', '8', '8']],
    '3/4': [['q', 'q', 'q'], ['h', 'q'], ['hd'], ['qd', '8', 'q'], ['q', 'h'], ['8', '8', 'q', 'q'], ['q', '8', '8', 'q']],
    '4/4': [['h', 'h'], ['q', 'q', 'h'], ['hd', 'q'], ['qd', '8', 'h'], ['w'], ['q', 'q', 'q', 'q'], ['8', '8', 'q', 'h'], ['q', 'hd']],
    '5/4': [['hd', 'h'], ['q', 'q', 'q', 'h'], ['h', 'q', 'h'], ['qd', '8', 'q', 'h']],
    '6/8': [['qd', 'qd'], ['q', '8', 'qd'], ['8', '8', '8', 'qd'], ['qd', 'q', '8'], ['hd'], ['8', '8', '8', '8', '8', '8']]
  };
  var melk = function (R) { return pick(['C5', 'B4', 'A4', 'G4', 'D5', 'E5', 'F4'], R); };
  T.timeFit = {
    u: 'u03', st: 2, gen: function (R) {
      var ts = ['2/4', '3/4', '4/4', '5/4', '6/8'], t = pick(ts, R), f = pick(FILL[t], R);
      // 3/4 と 6/8 は 同じ長さなので いっしょには出さない。6/8 は 正解でないときも ときどき出す（「6/8 があれば正解」に ならないように）
      var opts = t === '6/8' ? ['2/4', '6/8', '4/4', '5/4'] : t === '3/4' ? ['2/4', '3/4', '4/4', '5/4'] : ['2/4', R() < 0.5 ? '6/8' : '3/4', '4/4', '5/4'];
      var m = mc(R, tx(t), opts.map(function (o) { return tx(o); }));
      var beats = f.reduce(function (a, d) { return a + M.len(d); }, 0);
      return { q: 'この小節に合う 拍子記号は？', fig: { score: { clef: 'treble', notes: f.map(function (d) { return { k: melk(R), d: d }; }), end: 'end', sp: 40, bg: t === '6/8' ? '3/8' : null } }, ch: m.ch, a: m.a, ex: '音符をたすと 4分音符 <b>' + lens(beats) + ' 拍</b> 分。' + (t === '6/8' ? '8分音符6つ分で、3つずつ まとまっているので <b>6/8</b>。' : '→ <b>' + t + '</b>。'), play: function () { M.playSpec({ notes: f.map(function (d) { return { k: 'A4', d: d }; }) }, 100); } };
    }
  };
  T.missing = {
    u: 'u03', st: 2, gen: function (R) {
      var t = pick(['2/4', '3/4', '4/4'], R), f = pick(FILL[t].filter(function (x) { return x.length >= 2; }), R).slice();
      var last = f.pop(), rest = R() < 0.4 && !/d/.test(last); // 付点の休符は 習っていないので 出さない
      var ans = rest ? last + 'r' : last;
      var all = ['h', 'q', '8', 'qd', 'hd', 'w', 'hr', 'qr', '8r'];
      var m = mc(R, { k: ans, fig: noteFig(ans) }, all.filter(function (d) { return M.len(d.replace('r', '')) !== M.len(last); }).map(function (d) { return { k: d, fig: noteFig(d) }; }));
      var have = f.reduce(function (a, d) { return a + M.len(d); }, 0), need = parseInt(t, 10);
      return { q: t + '拍子。<b>？</b> に入れると ちょうど1小節になるのは？', fig: { score: { clef: 'treble', time: t, notes: f.map(function (d) { return { k: melk(R), d: d }; }).concat([{ k: 'B4', d: ans, c: 'transparent' }]), end: 'end', sp: 44, after: function (o) { var n = o.notes[o.notes.length - 1]; M.svgText(o.svg, n.x, o.staves[0].getYForLine(2) + 9, '？', { size: 26, c: C.red }); } } }, ch: m.ch, a: m.a, ex: '1小節は ' + need + ' 拍。いまは ' + lens(have) + ' 拍なので あと <b>' + lens(need - have) + ' 拍</b>（' + (rest ? RN[ans] : DN[ans]) + '）。' };
    }
  };
  T.timeKind = {
    u: 'u03', st: 2, gen: function (R) {
      var L = [['2/4', '単純2拍子'], ['3/4', '単純3拍子'], ['4/4', '単純4拍子'], ['6/8', '複合2拍子'], ['9/8', '複合3拍子'], ['12/8', '複合4拍子']];
      var x = pick(L, R);
      var m = mc(R, tx(x[1]), L.map(function (y) { return tx(y[1]); }));
      var comp = /8$/.test(x[0]);
      return { q: '<b>' + x[0] + '</b> 拍子は 何拍子？（単純拍子・複合拍子）', fig: { score: { clef: 'treble', time: x[0], notes: [], minBar: 30 } }, ch: m.ch, a: m.a, ex: comp ? '8分音符が ' + parseInt(x[0], 10) + ' つ。3つずつ まとまって 付点4分音符 ' + parseInt(x[0], 10) / 3 + ' 拍 → <b>' + x[1] + '</b>。' : '4分音符が ' + parseInt(x[0], 10) + ' つ → <b>' + x[1] + '</b>。' };
    }
  };
  T.timeMean = {
    u: 'u03', st: 1, gen: function (R) {
      var ts = pick([[2, 4], [3, 4], [4, 4], [3, 8], [6, 8], [2, 2], [9, 8], [5, 4]], R), n = ts[0], d = ts[1];
      var say = function (a, b) { return tx('1 小節に ' + DN[{ 1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16' }[b]] + 'が ' + a + ' つ分', a + '/' + b); };
      var wr = [[n, d === 4 ? 8 : 4], [n, d === 8 ? 2 : d * 2], [n + 1, d], [n - 1, d], [d, n]].filter(function (x) { return x[0] > 0 && { 1: 1, 2: 1, 4: 1, 8: 1, 16: 1 }[x[1]]; }).map(function (x) { return say(x[0], x[1]); });
      var m = mc(R, say(n, d), wr);
      return { q: 'この拍子記号の 意味は？', fig: { score: { clef: 'treble', time: n + '/' + d, notes: [], minBar: 20 } }, ch: m.ch, a: m.a, ex: '下の数 <b>' + d + '</b> ＝ ' + DN[{ 2: 'h', 4: 'q', 8: '8' }[d]] + '、上の数 <b>' + n + '</b> ＝ いくつ分。→ <b>1 小節に ' + DN[{ 2: 'h', 4: 'q', 8: '8' }[d]] + 'が ' + n + ' つ分</b>。' };
    }
  };
  T.barError = {
    u: 'u03', st: 3, gen: function (R) {
      var t = pick(['2/4', '3/4', '4/4', '6/8'], R), need = { '2/4': 2, '3/4': 3, '4/4': 4, '6/8': 3 }[t];
      var bars = shuffle(FILL[t].slice(), R).slice(0, 3).map(function (b) { return b.slice(); }), bad = ri(0, 2, R), b = bars[bad];
      var sum = function (x) { return x.reduce(function (a, d) { return a + M.len(d); }, 0); };
      for (var k = 0; k < 20 && sum(b) === need; k++) { var j = ri(0, b.length - 1, R), alt = pick(['h', 'q', '8', 'qd', 'hd'].filter(function (d) { return d !== b[j]; }), R); var c = b.slice(); c[j] = alt; if (sum(c) !== need && sum(c) <= need + 2) b = c; }
      if (sum(b) === need) b.push('q');
      bars[bad] = b;
      var lab = ['①', '②', '③'];
      var fig = { score: { clef: 'treble', time: t, bars: bars.map(function (x, i) { return x.map(function (d, j) { return { k: melk(R), d: d, lab: j === 0 ? lab[i] : null }; }); }), end: 'end', sp: 30, ls: 16, beam: true, bg: t === '6/8' ? '3/8' : null, wrap: 2, wrapW: 300 } };
      return { q: '<b>' + t + '</b> 拍子。拍の数が <b>合わない</b> 小節は？', fig: fig, ch: lab, a: bad, ex: '1 小節は ' + (t === '6/8' ? '8分音符 6 つ（4分音符 3 拍分）' : '4分音符 ' + need + ' 拍') + '。' + bars.map(function (x, i) { return lab[i] + ' ' + lens(sum(x)) + ' 拍'; }).join('、') + ' → <b>' + lab[bad] + '</b>。' };
    }
  };
  T.eighthCount = {
    u: 'u03', st: 1, gen: function (R) {
      var t = pick(['2/4', '3/4', '4/4', '6/8', '3/8', '2/2'], R), u = pick(['8', '16'], R);
      var top = parseInt(t, 10), bot = +t.split('/')[1], n = top * (u === '8' ? 8 : 16) / bot;
      var m = mc(R, tx(n + ' つ'), [n - 1, n + 1, n * 2, n / 2, n + 2, top].filter(function (x) { return x > 0 && x === Math.floor(x); }).map(function (x) { return tx(x + ' つ'); }));
      return { q: '<b>' + t + '</b> 拍子の1小節に <b>' + DN[u] + '</b> は いくつ入る？', fig: { score: { clef: 'treble', time: t, notes: [], minBar: 20 } }, ch: m.ch, a: m.a, ex: t + ' は ' + bot + '分音符が ' + top + ' つ。' + bot + '分音符 1 つ ＝ ' + DN[u] + ' ' + ((u === '8' ? 8 : 16) / bot) + ' つ → ' + top + ' × ' + ((u === '8' ? 8 : 16) / bot) + ' ＝ <b>' + n + '</b>。' };
    }
  };
  T.strong = {
    u: 'u03', st: 1, gen: function (R) {
      var L = [['2/4', '強・弱'], ['3/4', '強・弱・弱'], ['4/4', '強・弱・中強・弱']], x = pick(L, R);
      var wr = ['強・弱・弱', '強・弱', '強・弱・中強・弱', '弱・強・弱', '強・強・弱', '弱・強・弱・強', '強・中強・弱'].map(function (s) { return tx(s); });
      var m = mc(R, tx(x[1]), wr);
      return { q: '<b>' + x[0] + '</b> 拍子。1 拍目から 順に、拍の 強い・弱い は？', fig: null, ch: m.ch, a: m.a, ex: '1拍目が いつも 強拍。' + x[0] + ' は <b>' + x[1] + '</b>。', exFig: { c: 'beats', a: { time: x[0] } } };
    }
  };

  /* =================== 04 リズム =================== */
  T.tieLen = {
    u: 'u04', st: 2, gen: function (R) {
      var cands = [['h', 'q'], ['q', '8'], ['h', 'h'], ['hd', 'q'], ['q', 'q', 'q'], ['h', '8'], ['qd', 'q'], ['w', 'h']];
      var ds = pick(cands, R), k = melk(R), tot = ds.reduce(function (a, d) { return a + M.len(d); }, 0);
      var wr = [tot - 1, tot + 1, tot - 0.5, tot + 0.5, M.len(ds[0]), tot * 2].filter(function (x) { return x > 0; }).map(function (x) { return tx(lens(x) + ' 拍'); });
      var m = mc(R, tx(lens(tot) + ' 拍'), wr);
      return { q: 'タイでつながった音は 何拍のばす？（4分音符＝1拍）', fig: { score: { clef: 'treble', notes: ds.map(function (d, i) { return { k: k, d: d, tie: i < ds.length - 1, c: C.red }; }), sp: 50 } }, ch: m.ch, a: m.a, ex: ds.map(function (d) { return lens(M.len(d)); }).join(' ＋ ') + ' ＝ <b>' + lens(tot) + ' 拍</b>。タイは 長さをたす。', play: function () { M.play([[k, tot]], 90); } };
    }
  };
  T.tripletQ = {
    u: 'u04', st: 2, gen: function (R) {
      var v = pick([['8', '4分音符 1つ分', '8分音符 2つ分の長さに 3つ'], ['q', '2分音符 1つ分', '4分音符 2つ分の長さに 3つ'], ['16', '8分音符 1つ分', '16分音符 2つ分の長さに 3つ']], R);
      var wr = ['4分音符 1つ分', '2分音符 1つ分', '8分音符 1つ分', '付点4分音符 1つ分', '付点2分音符 1つ分'].map(function (s) { return tx(s); });
      var m = mc(R, tx(v[1]), wr);
      return { q: 'この3連符（3つ全部）の長さは？', fig: { score: { clef: 'treble', notes: [0, 1, 2].map(function (i) { return { k: ['C5', 'D5', 'E5'][i], d: v[0], t3: true }; }), sp: 46, minBar: 100 } }, ch: m.ch, a: m.a, ex: '3連符は 2つ分を 3等分。' + v[2] + ' → <b>' + v[1] + '</b>。' };
    }
  };
  T.synco = {
    u: 'u04', st: 2, gen: function (R) {
      var good = pick([[['8', 'q', '8'], '2/4'], [['16', '8', '16', 'q'], '2/4'], [['16', '8', '16', '16', '8', '16'], '2/4']], R);
      var bad = shuffle([[['q', 'q'], '2/4'], [['8', '8', 'q'], '2/4'], [['q', '8', '8'], '2/4'], [['qd', '8'], '2/4'], [['16', '16', '8', 'q'], '2/4']], R).slice(0, 3);
      var fig = function (x) { return { score: { clef: 'treble', notes: x[0].map(function (d) { return { k: 'B4', d: d, st: 1 }; }), noClef: true, sp: 26, minBar: 60, rhythm: true, above: 30, below: 22 } }; };
      var m = mc(R, { k: 'g', fig: fig(good) }, bad.map(function (b, i) { return { k: 'b' + i, fig: fig(b) }; }));
      return { q: 'シンコペーションに なっているのは？', ch: m.ch, a: m.a, ex: '弱い拍（拍のうら）の音が 次の拍まで のびると、強弱の位置がずれる＝<b>シンコペーション</b>。', exFig: { score: { clef: 'treble', time: good[1], notes: good[0].map(function (d, i) { return { k: 'B4', d: d, c: d === 'q' && i > 0 ? C.red : null }; }), sp: 40 }, play: true } };
    }
  };
  T.pickup = {
    u: 'u04', st: 2, gen: function (R) {
      var t = pick([3, 4, 2], R), p = ri(1, t - 1, R), last = t - p;
      var m = mc(R, tx(last + ' 拍'), [1, 2, 3, 4].map(function (x) { return tx(x + ' 拍'); }));
      return { q: '<b>' + t + '/4</b> 拍子の曲が <b>' + p + ' 拍分</b> の弱起で始まる。最後の小節は ふつう何拍？', fig: null, ch: m.ch, a: m.a, ex: '最初と最後で 1小節になるように書く。' + t + ' − ' + p + ' ＝ <b>' + last + ' 拍</b>。' };
    }
  };
  T.beatCount = {
    u: 'u04', st: 1, gen: function (R, st) {
      var pool = st >= 2 ? ['hd', 'qd', '8', 'q', 'qr', 'h', '8r', '16'] : ['h', 'q', '8', 'qr', 'w', 'hr'];
      var n = ri(2, 4, R), ds = [], tot = 0;
      for (var i = 0; i < n; i++) { var d = pick(pool, R); if (tot + M.len(d.replace('r', '')) > 6) d = 'q'; ds.push(d); tot += M.len(d.replace('r', '')); }
      if (ds.filter(function (d) { return d === '8'; }).length % 2) { ds.push('8'); tot += 0.5; }
      var wr = [tot - 1, tot + 1, tot - 0.5, tot + 0.5, tot + 2].filter(function (x) { return x > 0; }).map(function (x) { return tx(lens(x) + ' 拍'); });
      var m = mc(R, tx(lens(tot) + ' 拍'), wr);
      return { q: 'ぜんぶで 何拍分？（4分音符＝1拍、休符も数える）', fig: { score: { clef: 'treble', notes: ds.map(function (d) { return { k: melk(R), d: d }; }), sp: 40 } }, ch: m.ch, a: m.a, ex: ds.map(function (d) { return lens(M.len(d.replace('r', ''))); }).join(' ＋ ') + ' ＝ <b>' + lens(tot) + ' 拍</b>。' };
    }
  };
  T.tieSlur = {
    u: 'u04', st: 1, gen: function (R) {
      var same = R() < 0.5, a = M.p(melk(R)), b = same ? a : M.P(a.l + pick([1, 2, -1, -2], R), 0, a.o);
      return { q: 'この弧（こ）は タイ？ スラー？', fig: { score: { clef: 'treble', notes: [{ k: M.str(a), d: 'h', tie: same, sl: same ? 0 : 1, c: C.red }, { k: M.str(b), d: 'h', c: C.red }], sp: 70, minBar: 120 } }, ch: ['タイ（長さを たす）', 'スラー（なめらかに）'], a: same ? 0 : 1, ex: same ? '<b>同じ高さ</b>（' + N(a) + '）を つないでいる → <b>タイ</b>。2 つめは 弾き直さず のばす。' : '<b>ちがう高さ</b>（' + N(a) + '→' + N(b) + '）を つないでいる → <b>スラー</b>。なめらかに つなげて演奏する。', play: same ? [[a, 4]] : [[a, 2], [b, 2]] };
    }
  };
  T.pickupBeat = {
    u: 'u04', st: 2, gen: function (R) {
      var t = pick([3, 4], R), p = ri(1, t - 1, R), start = t - p + 1;
      var up = []; for (var i = 0; i < p; i++) up.push({ k: ['G4', 'A4', 'B4'][i], d: 'q', c: C.red });
      var full = t === 3 ? [{ k: 'C5', d: 'h' }, { k: 'B4', d: 'q' }] : [{ k: 'C5', d: 'h' }, { k: 'D5', d: 'q' }, { k: 'B4', d: 'q' }];
      var m = mc(R, tx(start + ' 拍目から'), [1, 2, 3, 4].filter(function (x) { return x <= t; }).map(function (x) { return tx(x + ' 拍目から'); }));
      return { q: 'この曲は 何拍目から 始まる？', fig: { score: { clef: 'treble', time: t + '/4', bars: [up, full], sp: 40 } }, ch: m.ch, a: m.a, ex: '最初の小節は ' + p + ' 拍だけ（<b>弱起</b>）。' + t + ' 拍子なので 足りない ' + (t - p) + ' 拍分 おくれて <b>' + start + ' 拍目から</b>。最後の小節は ' + (t - p) + ' 拍に なる。' };
    }
  };
  T.rhythmEar = {
    u: 'u04', st: 2, ear: true, gen: function (R) {
      var RH = [['q', 'q'], ['h'], ['8', '8', 'q'], ['q', '8', '8'], ['qd', '8'], ['8', 'q', '8'], ['8', '8', '8', '8'], ['16', '16', '8', 'q'], ['q', '16', '16', '8']];
      var L = shuffle(RH.slice(), R).slice(0, 4), right = L[0];
      var fig = function (x) { return { score: { clef: 'treble', notes: x.map(function (d) { return { k: 'B4', d: d, st: 1 }; }), noClef: true, sp: 26, minBar: 60, rhythm: true, above: 30, below: 22 } }; };
      var m = mc(R, { k: right.join(), fig: fig(right) }, L.slice(1).map(function (x) { return { k: x.join(), fig: fig(x) }; }));
      var say = { q: 'タン', h: 'ターアン', '8': 'タ', qd: 'ターア', '16': 'タ' };
      return { q: '🔊 聴いて答えよう：どのリズム？（4分音符 2 拍分）', ear: true, ch: m.ch, a: m.a, ex: '正解は「' + right.map(function (d) { return say[d]; }).join('・') + '」。音の数と、長い音・短い音の 順番を 聴きくらべよう。', exFig: { score: { clef: 'treble', time: '2/4', notes: right.map(function (d) { return { k: 'A4', d: d }; }), sp: 44 } }, play: function () { M.play([[null, 0.25]].concat(right.map(function (d) { return ['A4', M.len(d)]; })), 84); } };
    }
  };

  /* =================== 05 変化記号 =================== */
  T.accName = {
    u: 'u05', st: 1, gen: function (R) {
      var p = pick(nat('D4', 'F5'), R); p.a = R() < 0.5 ? 1 : -1;
      var wr = [{ l: p.l, a: -p.a, o: 4 }, { l: p.l, a: 0, o: 4 }, M.P(p.l + 1, p.a, 4), M.P(p.l - 1, p.a, 4), M.P(p.l + 1, -p.a, 4)].map(pn);
      var m = mc(R, pn(p), wr);
      return { q: 'この音の音名は？', fig: one(p, 'treble'), ch: m.ch, a: m.a, ex: '<b>' + N({ l: p.l, a: 0, o: 4 }) + '</b> に ' + (p.a > 0 ? '♯（半音上げ）' : '♭（半音下げ）') + ' → <b>' + N(p) + '</b>（' + M.nameAll(p) + '）。', play: [[p, 1.5]] };
    }
  };
  T.halfWhole = {
    u: 'u05', st: 1, gen: function (R) {
      var p = pick(nat('C4', 'B4'), R); p.a = pick([0, 0, 1, -1], R);
      var q = M.P(p.l + 1, pick([0, 0, 1, -1], R), p.o);
      var s = M.midi(q) - M.midi(p);
      if (s !== 1 && s !== 2) { q.a += s < 1 ? 1 - s : 2 - s; q.a = Math.max(-1, Math.min(1, q.a)); s = M.midi(q) - M.midi(p); }
      if (s !== 1 && s !== 2) { p = { l: 2, a: 0, o: 4 }; q = { l: 3, a: 0, o: 4 }; s = 1; }
      var ans = s === 1 ? '半音' : '全音';
      var mk = {}; mk[M.midi(p)] = { c: C.red }; mk[M.midi(q)] = { c: C.red };
      return { q: '2つの音の へだたりは？', fig: { score: { clef: 'treble', notes: [{ k: M.str(p), d: 'w' }, { k: M.str(q), d: 'w' }], sp: 60 } }, ch: ['半音', '全音'], a: ans === '半音' ? 0 : 1, ex: N(p) + ' と ' + N(q) + ' の間は 鍵盤で <b>' + (s === 1 ? 'となり（半音）' : '1つとばし（全音）') + '</b>。', exFig: { kbd: { from: 'C4', to: 'B5', mark: mk, steps: [[M.midi(p), M.midi(q), ans, C.red]], h: 70 } }, play: [[p, 1], [q, 1]] };
    }
  };
  T.enharm = {
    u: 'u05', st: 2, gen: function (R) {
      var pairs = [['C#4', 'Db4'], ['D#4', 'Eb4'], ['F#4', 'Gb4'], ['G#4', 'Ab4'], ['A#4', 'Bb4'], ['E#4', 'F4'], ['B#3', 'C4'], ['Cb4', 'B3'], ['Fb4', 'E4']];
      var pr = pick(pairs, R), sw = R() < 0.5, a = M.p(sw ? pr[1] : pr[0]), b = M.p(sw ? pr[0] : pr[1]);
      var wr = [M.P(b.l, b.a + (b.a >= 0 ? 1 : -1), b.o), M.P(a.l, -a.a, a.o), M.P(b.l + 1, b.a, b.o), M.P(b.l - 1, b.a, b.o), M.P(a.l + 2, 0, a.o)].filter(function (x) { return M.midi(x) % 12 !== M.midi(a) % 12; }).map(pn);
      var m = mc(R, pn(b), wr);
      var mk = {}; mk[M.midi(a)] = { c: C.red };
      var qk = {}; qk[M.midi(a)] = { c: 'var(--gold)', t: '★' };
      return { q: '★の鍵盤は <b>' + N(a) + '</b>。同じ鍵盤の <b>別の名前</b>（異名同音）は？', fig: { kbd: { from: 'C4', to: 'B4', mark: qk, h: 100 } }, ch: m.ch, a: m.a, ex: '<b>' + N(a) + '</b> ＝ <b>' + N(b) + '</b>。名前はちがうが 同じ鍵盤。', exFig: { kbd: { from: 'C4', to: 'B4', mark: mk, h: 80 } } };
    }
  };
  T.accRule = {
    u: 'u05', st: 3, gen: function (R) {
      var base = pick(nat('D4', 'E5'), R), acc = pick([1, -1], R), sameBar = R() < 0.5;
      var A = { l: base.l, a: acc, o: base.o }, other = M.P(base.l + 2, 0, base.o);
      var target = sameBar ? A : { l: base.l, a: 0, o: base.o };
      var bars = sameBar ? [[{ k: M.str(A), d: 'q' }, { k: M.str(other), d: 'q' }, { k: M.str(target), d: 'h', c: C.red, lab: '★' }]] : [[{ k: M.str(A), d: 'q' }, { k: M.str(other), d: 'q' }, { k: M.str(other), d: 'h' }], [{ k: M.str(target), d: 'h', c: C.red, lab: '★' }, { k: M.str(other), d: 'h' }]];
      var wr = [{ l: base.l, a: acc, o: 4 }, { l: base.l, a: 0, o: 4 }, { l: base.l, a: -acc, o: 4 }, M.P(base.l + 1, 0, 4)].map(pn);
      var m = mc(R, pn(target), wr);
      return { q: '★の音の 音名は？（前にある 臨時記号に 注意）', fig: { score: { clef: 'treble', time: sameBar ? '4/4' : '4/4', bars: bars, end: 'end', sp: 46 } }, ch: m.ch, a: m.a, ex: sameBar ? '臨時記号は <b>同じ小節</b>の 同じ高さの音に 効きつづける → <b>' + N(target) + '</b>。' : '小節線をこえると 臨時記号の効き目は なくなる → <b>' + N(target) + '</b>。' };
    }
  };
  T.kbdName = {
    u: 'u05', st: 1, gen: function (R) {
      var bl = pick([[61, 'C#4', 'Db4'], [63, 'D#4', 'Eb4'], [66, 'F#4', 'Gb4'], [68, 'G#4', 'Ab4'], [70, 'A#4', 'Bb4']], R);
      var right = M.p(R() < 0.5 ? bl[1] : bl[2]);
      var wr = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'Db4', 'Eb4', 'Gb4', 'Ab4', 'Bb4'].map(M.p).filter(function (p) { return M.midi(p) !== bl[0]; }).filter(function (p) { return Math.abs(M.midi(p) - bl[0]) <= 2; }).map(pn);
      var m = mc(R, pn(right), wr);
      var mk = {}; mk[bl[0]] = { c: C.red, t: '★' };
      return { q: '★の 黒鍵の音名は？', fig: { kbd: { from: 'C4', to: 'B4', mark: mk, h: 100 } }, ch: m.ch, a: m.a, ex: '★は <b>' + N(bl[1]) + '</b> とも <b>' + N(bl[2]) + '</b> ともいう（左の白鍵の♯／右の白鍵の♭）。' };
    }
  };
  T.accKbd = {
    u: 'u05', st: 1, gen: function (R, st) {
      var pool = st >= 3 ? ['E#4', 'B#4', 'Cb5', 'Fb4', 'C#4', 'Eb4', 'Ab4', 'F#4'] : st >= 2 ? ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'Db4', 'Eb4', 'Gb4', 'Ab4', 'Bb4', 'E#4', 'Cb5'] : ['C#4', 'F#4', 'G#4', 'Eb4', 'Bb4', 'Ab4', 'Db4'];
      var p = M.p(pick(pool, R)), mi = M.midi(p), cand = [mi];
      shuffle([-2, -1, 1, 2], R).forEach(function (k) { var x = mi + k; if (cand.length < 4 && x >= 60 && x <= 72) cand.push(x); });
      cand = shuffle(cand, R); // ①〜④ は ばらばらの 順（左から 順だと 答えの 位置が かたよる）
      var lab = ['①', '②', '③', '④'], mk = {}; cand.forEach(function (x, i) { mk[x] = { c: 'var(--gold)', t: lab[i] }; });
      var nat = { l: p.l, a: 0, o: p.o }, black = [1, 3, 6, 8, 10].indexOf(mi % 12) >= 0, ak = {}; ak[mi] = { c: C.red, t: N(p) }; ak[M.midi(nat)] = { c: C.blue, t: N(nat) };
      return { q: '楽譜の音を ひくのは ①〜④の どの鍵盤？', fig: { col: [one(p, 'treble'), { kbd: { from: 'C4', to: 'C5', mark: mk, h: 110 } }] }, ch: lab.slice(0, cand.length), a: cand.indexOf(mi), ex: N(nat) + ' の 鍵盤から ' + (p.a > 0 ? '右（上）' : '左（下）') + 'に 半音 → <b>' + (black ? '黒鍵' : '白鍵') + '</b>。' + (black ? '' : '白鍵どうしの 半音（ミ‐ファ・シ‐ド）に 注意。'), exFig: { kbd: { from: 'C4', to: 'C5', mark: ak, h: 80 } }, play: [[p, 1.5]] };
    }
  };
  T.dblAcc = {
    u: 'u05', st: 3, gen: function (R) {
      var p = M.p(pick(['F##4', 'C##4', 'G##4', 'D##4', 'Bbb4', 'Ebb4', 'Abb4', 'Dbb5', 'Gbb4'], R)), mi = M.midi(p);
      var white = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 }, ans = { l: white[mi % 12], a: 0, o: 4 };
      var wr = [{ l: p.l, a: p.a > 0 ? 1 : -1, o: 4 }, { l: p.l, a: 0, o: 4 }, M.P(ans.l + 1, 0, 4), M.P(ans.l - 1, 0, 4)].map(pn);
      var m = mc(R, pn(ans), wr), mk = {}; mk[mi] = { c: C.red, t: N(p) };
      return { q: '<b>' + N(p) + '</b> と 同じ鍵盤の 白鍵は？', fig: one(p, 'treble'), ch: m.ch, a: m.a, ex: (p.a > 0 ? '𝄪 は 全音（半音 2 つ）上げる' : '𝄫 は 全音（半音 2 つ）下げる') + '。' + N({ l: p.l, a: 0, o: 4 }) + ' から 鍵盤 2 つ ' + (p.a > 0 ? '右' : '左') + ' → <b>' + N(ans) + '</b>。', exFig: { kbd: { from: 'C4', to: 'B5', mark: mk, h: 70 } } };
    }
  };
  T.jpAcc = {
    u: 'u05', st: 2, gen: function (R) {
      var p = { l: ri(0, 6, R), a: pick([1, -1], R), o: 4 };
      var jp = function (x) { return tx(M.name(x, 'jp')); };
      var m = mc(R, jp(p), [{ l: p.l, a: -p.a, o: 4 }, M.P(p.l + 1, p.a, 4), M.P(p.l - 1, p.a, 4), M.P(p.l + 1, -p.a, 4)].map(jp));
      return { q: '<b>' + M.name(p, 'doremi') + '</b> を 日本音名で 言うと？', ch: m.ch, a: m.a, ex: M.name({ l: p.l, a: 0, o: 4 }, 'doremi') + '＝' + M.name({ l: p.l, a: 0, o: 4 }, 'jp') + '。' + (p.a > 0 ? '♯ は「嬰」' : '♭ は「変」') + ' を 前につける → <b>' + M.name(p, 'jp') + '</b>（' + M.name(p, 'en') + '）。' };
    }
  };

  /* =================== 06 音程 =================== */
  var IVS_EASY = [['m', 2], ['M', 2], ['m', 3], ['M', 3], ['P', 4], ['P', 5], ['m', 6], ['M', 6], ['m', 7], ['M', 7], ['P', 8]];
  var IVS_HARD = IVS_EASY.concat([['A', 4], ['d', 5], ['A', 2], ['d', 7], ['A', 5], ['d', 4], ['A', 6], ['d', 3]]);
  function ivWrongs(deg, q) {
    var r = [], perf = [1, 4, 5, 8].indexOf(deg) >= 0;
    (perf ? ['P', 'A', 'd'] : ['M', 'm', 'A', 'd']).forEach(function (x) { if (x !== q) r.push([deg, x]); });
    [deg - 1, deg + 1].forEach(function (d) { if (d >= 1 && d <= 8) r.push([d, [1, 4, 5, 8].indexOf(d) >= 0 ? 'P' : q === 'P' ? 'M' : q]); });
    return r.map(function (x) { return tw(M.ivName(x[0], x[1]), M.ivName(x[0], x[1]) + ' なら 半音 ' + M.interval('C4', M.up('C4', x[0], x[1])).semis + ' 個'); });
  }
  function ivPair(R, hard) {
    for (var t = 0; t < 30; t++) {
      var iv = pick(hard ? IVS_HARD : IVS_EASY, R), a = pick(nat('C4', 'G5'), R);
      if (hard) a.a = pick([0, 0, 1, -1], R);
      var b = M.up(a, iv[1], iv[0]);
      if (Math.abs(b.a) <= 1 && M.midi(b) <= 86) return [a, b, iv];
    }
    return [M.p('C4'), M.p('E4'), ['M', 3]];
  }
  T.ivDeg = {
    u: 'u06', st: 1, gen: function (R) {
      var a = pick(nat('C4', 'E5'), R), d = ri(2, 8, R), b = M.P(a.l + d - 1, 0, a.o);
      var m = mc(R, tx(d + '度'), [d - 1, d + 1, d - 2, d + 2].filter(function (x) { return x >= 1 && x <= 9; }).map(function (x) { return tx(x + '度'); }));
      var labs = []; for (var i = 0; i < d; i++) labs.push(M.str(M.P(a.l + i, 0, a.o)));
      return { q: '2つの音の音程は 何度？', fig: { score: { clef: 'treble', notes: [{ k: M.str(a), d: 'w' }, { k: M.str(b), d: 'w' }], sp: 60 } }, ch: m.ch, a: m.a, ex: '下の音も 上の音も 数に入れる：' + labs.map(function (k) { return N(k); }).join('・') + ' → <b>' + d + '度</b>。', exFig: { score: { clef: 'treble', notes: labs.map(function (k, i) { return { k: k, d: 'q', lab: (i + 1) + '', c: i === 0 || i === labs.length - 1 ? C.red : C.gray }; }), sp: 34 } } };
    }
  };
  T.ivName = {
    u: 'u06', st: 2, gen: function (R, st) {
      var pr = ivPair(R, st >= 3), a = pr[0], b = pr[1], iv = M.interval(a, b), harm = R() < 0.5, clef = 'treble';
      if (st >= 3 && R() < 0.4) { clef = 'bass'; var bb = toBass([a, b]); a = bb[0]; b = bb[1]; } // ヘ音記号でも 読めるように
      var m = mc(R, tx(iv.name), ivWrongs(iv.deg, iv.q));
      var mk = {}; mk[M.midi(a)] = { c: C.red }; mk[M.midi(b)] = { c: C.red };
      return { q: '2つの音の音程は？', fig: { score: { clef: clef, notes: harm ? [{ k: [M.str(a), M.str(b)], d: 'w' }] : [{ k: M.str(a), d: 'w' }, { k: M.str(b), d: 'w' }], sp: 60, minBar: 80 } }, ch: m.ch, a: m.a, why: m.why, ex: N(a) + '〜' + N(b) + '：<b>' + iv.deg + '度</b>で 半音 <b>' + iv.semis + ' 個</b> → <b>' + iv.name + '</b>。', exFig: { kbd: { from: 'C' + a.o, to: 'B' + Math.max(a.o + 1, b.o), mark: mk, steps: [[M.midi(a), M.midi(b), '半音' + iv.semis, C.red]], h: 70 } }, play: harm ? [[[a, b], 2]] : [[a, 1], [b, 1.5]] };
    }
  };
  T.ivBuild = {
    u: 'u06', st: 2, gen: function (R) {
      var pr = ivPair(R, false), a = pr[0], iv = pr[2], b = pr[1];
      var wr = [M.up(a, iv[1], iv[0] === 'M' ? 'm' : iv[0] === 'm' ? 'M' : 'A'), M.up(a, iv[1] + 1, [1, 4, 5, 8].indexOf(iv[1] + 1) >= 0 ? 'P' : 'M'), M.up(a, iv[1] - 1 || 1, [1, 4, 5, 8].indexOf(iv[1] - 1) >= 0 ? 'P' : 'm'), M.up(a, iv[1], iv[0], true)].filter(function (x) { return Math.abs(x.a) <= 1; }).map(pn);
      var m = mc(R, pn(b), wr);
      return { q: '<b>' + N(a) + '</b> の <b>' + M.ivName(iv[1], iv[0]) + ' 上</b> の音は？', fig: one(a, 'treble'), ch: m.ch, a: m.a, ex: N(a) + ' から ' + iv[1] + '度上は ' + N({ l: b.l, a: 0, o: 4 }) + ' のなかま。半音 ' + M.interval(a, b).semis + ' 個にするため <b>' + N(b) + '</b>。', exFig: { score: { clef: 'treble', notes: [{ k: M.str(a), d: 'w', lab: N(a) }, { k: M.str(b), d: 'w', lab: N(b), c: C.red }], sp: 60 } }, play: [[a, 1], [b, 1.5]] };
    }
  };
  T.ivInv = {
    u: 'u06', st: 2, gen: function (R) {
      var iv = pick(IVS_EASY.filter(function (x) { return x[1] < 8; }).concat([['A', 4], ['d', 5]]), R), d2 = 9 - iv[1], q2 = M.invQ[iv[0]];
      var m = mc(R, tx(M.ivName(d2, q2)), ivWrongs(d2, q2).concat([tx(M.ivName(iv[1], iv[0]))]));
      var a = M.p('C4'), b = M.up(a, iv[1], iv[0]);
      return { q: '<b>' + M.ivName(iv[1], iv[0]) + '</b> を 転回すると 何度？（下の音を 1 オクターブ上げる）', fig: { score: { clef: 'treble', bars: [[{ k: [M.str(a), M.str(b)], d: 'w', lab: 'もと：' + M.ivName(iv[1], iv[0]) }], [{ k: [M.str(b), 'C5'], d: 'w', lab: '転回：？', kc: [null, C.red], acc: 'show' }]], minBar: 90, sp: 70 } }, ch: m.ch, a: m.a, ex: '度数は 9 − ' + iv[1] + ' ＝ ' + d2 + '。' + M.QN[iv[0]] + ' は <b>' + M.QN[q2] + '</b> に → <b>' + M.ivName(d2, q2) + '</b>。' };
    }
  };
  T.ivSemis = {
    u: 'u06', st: 2, gen: function (R) {
      var L = [['m', 2], ['M', 2], ['m', 3], ['M', 3], ['P', 4], ['A', 4], ['d', 5], ['P', 5], ['m', 6], ['M', 6], ['m', 7], ['M', 7], ['P', 8]];
      var x = pick(L, R), a = M.p(pick(['C4', 'D4', 'F4', 'G4'], R)), b = M.up(a, x[1], x[0]), iv = M.interval(a, b), n = iv.semis;
      var m = mc(R, tx(n + ' 個'), [n - 1, n + 1, n - 2, n + 2, n + 3].filter(function (k) { return k > 0; }).map(function (k) { return tx(k + ' 個'); }));
      var mk = {}; mk[M.midi(a)] = { c: C.red }; mk[M.midi(b)] = { c: C.red };
      return { q: '<b>' + iv.name + '</b> は 半音 いくつ分？', ch: m.ch, a: m.a, ex: '例：' + N(a) + '〜' + N(b) + ' を 鍵盤で数えると 半音 <b>' + n + ' 個</b>。' + (x[0] === 'A' || x[0] === 'd' ? '増4度と減5度は どちらも 半音 6 個（異名同音的な音程）。' : ''), exFig: { kbd: { from: 'C4', to: M.midi(b) > 83 ? 'B6' : 'B5', mark: mk, steps: [[M.midi(a), M.midi(b), '半音' + n, C.red]], h: 70 } }, play: [[a, 1], [b, 1.5]] };
    }
  };
  T.ivQual = {
    u: 'u06', st: 2, gen: function (R) {
      var x = pick([['P', 4], ['P', 5], ['M', 3], ['M', 6], ['M', 2], ['m', 3], ['m', 6], ['m', 7]], R), wide = R() < 0.5;
      var q2 = { P: wide ? 'A' : 'd', M: wide ? 'A' : 'm', m: wide ? 'M' : 'd' }[x[0]], perf = x[0] === 'P';
      var all = (perf ? ['P', 'A', 'd'] : ['M', 'm', 'A', 'd']).filter(function (q) { return q !== q2; }).map(function (q) { return tx(M.ivName(x[1], q)); }).concat([(function (nd) { return tx(M.ivName(nd, [1, 4, 5, 8].indexOf(nd) >= 0 ? 'P' : 'M')); })(x[1] + (wide ? 1 : -1))]);
      var m = mc(R, tx(M.ivName(x[1], q2)), all);
      return { q: '<b>' + M.ivName(x[1], x[0]) + '</b> を 半音 <b>' + (wide ? '広げる' : 'せまくする') + '</b> と？', ch: m.ch, a: m.a, ex: (perf ? '完全グループ：減 ← <b>完全</b> → 増' : '長・短グループ：減 ← 短 ← 長 → 増') + '。度数は 変わらない → <b>' + M.ivName(x[1], q2) + '</b>。', exFig: { c: 'ivLadder' } };
    }
  };
  T.ivWider = {
    u: 'u06', st: 2, gen: function (R) {
      // 同じ度数の 2 つ（長と短・完全と増 など）が 答えの候補に なるように 作る
      var semis = function (x) { return M.interval('C4', M.up('C4', x[1], x[0])).semis; };
      var wide = R() < 0.5, d = pick([3, 4, 5, 6], R), pair = d === 4 ? [['P', 4], ['A', 4]] : d === 5 ? [['P', 5], ['d', 5]] : [['M', d], ['m', d]];
      var others = (wide ? [['M', 2], ['m', 2], ['m', 3], ['M', 3]] : [['m', 7], ['M', 7], ['P', 8], ['M', 6]]).filter(function (x) { return x[1] !== d && (wide ? x[1] < d : x[1] > d); });
      var L = shuffle(pair.concat(shuffle(others, R).slice(0, 2)), R), srt = L.slice().sort(function (a, b) { return semis(a) - semis(b); }), ans = wide ? srt[3] : srt[0];
      return { q: 'いちばん <b>' + (wide ? '広い' : 'せまい') + '</b> 音程は？', ch: L.map(function (x) { return M.ivName(x[1], x[0]); }), a: L.indexOf(ans), ex: srt.map(function (x) { return M.ivName(x[1], x[0]) + '（半音 ' + semis(x) + '）'; }).join(' ＜ ') + '。度数が同じなら 減 ＜ 短 ＜ 長 ＜ 増、減 ＜ 完全 ＜ 増。', exFig: { c: 'ivTable' } };
    }
  };
  T.ivEar = {
    u: 'u06', st: 2, ear: true, gen: function (R) {
      var set = [['m', 2], ['M', 2], ['m', 3], ['M', 3], ['P', 4], ['P', 5], ['P', 8]];
      var iv = pick(set, R), a = pick(nat('C4', 'G4'), R), b = M.up(a, iv[1], iv[0]);
      var m = mc(R, tx(M.ivName(iv[1], iv[0])), set.map(function (x) { return tx(M.ivName(x[1], x[0])); }));
      return { q: '🔊 聴いて答えよう：何の音程？', ear: true, ch: m.ch, a: m.a, ex: '<b>' + M.ivName(iv[1], iv[0]) + '</b>（' + N(a) + '〜' + N(b) + '）。長3度は明るく、短3度は少し暗い。完全5度・8度は よくとける。', exFig: { score: { clef: 'treble', notes: [{ k: M.str(a), d: 'h' }, { k: M.str(b), d: 'h' }, { k: [M.str(a), M.str(b)], d: 'w' }], sp: 50 } }, play: [[a, 1], [b, 1], [[a, b], 2]] };
    }
  };

  /* =================== 07 長音階 =================== */
  T.majPattern = {
    u: 'u07', st: 1, gen: function (R) {
      if (R() < 0.5) {
        var m = mc(R, tx('全・全・半・全・全・全・半'), ['全・半・全・全・半・全・全', '全・全・全・半・全・全・半', '半・全・全・全・半・全・全', '全・全・半・全・全・半・全'].map(function (s) { return tx(s); }));
        return { q: '長音階の 全音・半音の ならびは？', ch: m.ch, a: m.a, ex: '長音階は <b>全・全・半・全・全・全・半</b>（3〜4番目と 7〜8番目が 半音）。', exFig: { kbd: { from: 'C4', to: 'C5', steps: [[60, 62, '全'], [62, 64, '全'], [64, 65, '半', C.red], [65, 67, '全'], [67, 69, '全'], [69, 71, '全'], [71, 72, '半', C.red]], h: 70 } } };
      }
      var m2 = mc(R, tx('3〜4番目 と 7〜8番目'), ['2〜3番目 と 5〜6番目', '3〜4番目 と 6〜7番目', '4〜5番目 と 7〜8番目', '1〜2番目 と 5〜6番目'].map(function (s) { return tx(s); }));
      return { q: '長音階で <b>半音</b> になるのは どこ？', ch: m2.ch, a: m2.a, ex: '長音階は 全・全・<b>半</b>・全・全・全・<b>半</b>。ハ長調なら ミ‐ファ と シ‐ド。' };
    }
  };
  T.majWrong = {
    u: 'u07', st: 2, gen: function (R) {
      var f = ri(-3, 3, R), sc = M.scale(M.keyTonic(f), 'major').map(function (p) { return M.p(M.str(p)); });
      var i = ri(1, 6, R), w = sc[i];
      sc[i] = { l: w.l, a: w.a + (w.a >= 1 ? -1 : w.a <= -1 ? 1 : pick([1, -1], R)), o: w.o };
      var nums = [i, i - 1, i + 1, i + 2, i - 2].filter(function (x) { return x >= 1 && x <= 6; });
      var m = mc(R, tx((i + 1) + ' 番目', i), nums.map(function (x) { return tx((x + 1) + ' 番目', x); }));
      return { q: M.keyName(f) + 'の 長音階。まちがっている音は？', fig: { score: { clef: 'treble', notes: sc.map(function (p, j) { return { k: M.str(p), d: 'q', lab: (j + 1) + '' }; }), sp: 40, beam: false } }, ch: m.ch, a: m.a, ex: '正しくは <b>' + N(w) + '</b>。全・全・半・全・全・全・半 の ならびに 合わない。', exFig: { score: { clef: 'treble', key: f, notes: M.scale(M.keyTonic(f), 'major').map(function (p, j) { return { k: M.str(p), d: 'q', c: j === i ? C.red : null, lab: j === i ? N(p) : null }; }), sp: 36 } } };
    }
  };
  T.degreeName = {
    u: 'u07', st: 2, gen: function (R) {
      if (R() < 0.35) {
        var dI = pick([0, 3, 4, 6], R);
        var m0 = mc(R, tx(M.DEG[dI]), M.DEG.map(function (s) { return tx(s); }));
        return { q: '音階の <b>' + (dI + 1) + ' 番目</b>（' + M.ROMAN[dI] + '）の音の名前は？', ch: m0.ch, a: m0.a, ex: 'Ⅰ主音・Ⅱ上主音・Ⅲ中音・Ⅳ下属音・Ⅴ属音・Ⅵ下中音・Ⅶ導音。<b>' + M.ROMAN[dI] + '＝' + M.DEG[dI] + '</b>。' };
      }
      var f = ri(-4, 4, R), d = pick([4, 3, 6], R), sc = M.scale(M.keyTonic(f), 'major'), p = sc[d];
      var wr = sc.slice(0, 7).map(pn).concat([pn({ l: p.l, a: p.a === 0 ? 1 : 0, o: 4 })]);
      var m = mc(R, pn(p), wr);
      return { q: '<b>' + M.keyName(f) + '</b> の <b>' + M.DEG[d] + '</b> は？', fig: { score: { clef: 'treble', key: f, notes: [{ k: M.str(sc[0]), d: 'w', lab: '主音' }], minBar: 60 } }, ch: m.ch, a: m.a, ex: M.DEG[d] + 'は 音階の ' + (d + 1) + ' 番目 → <b>' + N(p) + '</b>。', exFig: { score: { clef: 'treble', key: f, notes: sc.map(function (q, j) { return { k: M.str(q), d: 'q', c: j === d ? C.red : null, lab: j === d ? N(q) : M.ROMAN[j % 7] }; }), sp: 36 } } };
    }
  };
  T.scaleName = {
    u: 'u07', st: 2, gen: function (R) {
      var f = ri(-5, 5, R), sc = M.scale(M.keyTonic(f), 'major');
      var wr = [f - 1, f + 1, f + 2, f - 2, -f].filter(function (x) { return x >= -7 && x <= 7; }).map(function (x) { return tx(M.keyName(x), x); });
      var m = mc(R, tx(M.keyName(f), f), wr);
      return { q: '何長調の 音階？', fig: { score: { clef: 'treble', notes: sc.map(function (p) { return { k: M.str(p), d: 'q' }; }), sp: 36, beam: false } }, ch: m.ch, a: m.a, ex: '始まりの音（主音）は <b>' + M.name(sc[0], 'jp') + '</b> → <b>' + M.keyName(f) + '</b>。', play: function () { M.playNotes(sc.map(M.str), { beat: 0.5, bpm: 100 }); } };
    }
  };
  // 調号の ♯♭ を つく順に
  var accList = function (f) { return f === 0 ? 'なし' : (f > 0 ? M.SHARPS : M.FLATS).slice(0, Math.abs(f)).map(function (l) { return N({ l: l, a: f > 0 ? 1 : -1, o: 4 }); }).join('・'); };
  T.majSharps = {
    u: 'u07', st: 2, gen: function (R) {
      var f = pick([1, 2, 3, 4, -1, -2, -3, -4], R), sc = M.scale(M.keyTonic(f), 'major'), sh = f > 0;
      var wr = [tx(accList(f - (sh ? 1 : -1))), tx(accList(f + (sh ? 1 : -1))), tx(accList(-f)), tx(sc.slice(1, 1 + Math.abs(f)).map(function (p) { return N({ l: p.l, a: sh ? 1 : -1, o: 4 }); }).join('・'))];
      var m = mc(R, tx(accList(f)), wr);
      return { q: '<b>' + M.keyName(f) + '</b> の 長音階で ' + (sh ? '♯' : '♭') + ' が つく音は？', ch: m.ch, a: m.a, ex: N(sc[0]) + ' から 全・全・半・全・全・全・半 に ならべると ' + sc.map(N).join('・') + ' → ' + (sh ? '♯' : '♭') + ' は <b>' + accList(f) + '</b>。', exFig: { score: { clef: 'treble', notes: sc.map(function (p) { return { k: M.str(p), d: 'q', c: p.a ? C.red : null }; }), sp: 34, beam: false } }, play: function () { M.playNotes(sc.map(M.str), { beat: 0.5, bpm: 100 }); } };
    }
  };
  T.majHalf = {
    u: 'u07', st: 3, gen: function (R) {
      var f = pick([1, 2, 3, -1, -2, -3], R), sc = M.scale(M.keyTonic(f), 'major');
      var say = function (i, j) { return tx(N(sc[i]) + '‐' + N(sc[i + 1]) + ' と ' + N(sc[j]) + '‐' + N(sc[j + 1]), i + '-' + j); };
      var m = mc(R, say(2, 6), [say(1, 4), say(3, 6), say(2, 5), say(0, 4), tx('ミ‐ファ と シ‐ド', 'c')]);
      return { q: '<b>' + M.keyName(f) + '</b> の 長音階で <b>半音</b> になるのは？', ch: m.ch, a: m.a, ex: 'どの長調でも 半音は <b>3〜4番目 と 7〜8番目</b>。' + M.keyName(f) + 'なら <b>' + N(sc[2]) + '‐' + N(sc[3]) + ' と ' + N(sc[6]) + '‐' + N(sc[7]) + '</b>（ミ‐ファ・シ‐ド は ハ長調のとき）。', exFig: { score: { clef: 'treble', key: f, notes: sc.map(function (p, j) { return { k: M.str(p), d: 'q', c: j === 2 || j === 3 || j === 6 || j === 7 ? C.red : null, lab: (j + 1) + '' }; }), sp: 34, beam: false } } };
    }
  };
  T.majFill = {
    u: 'u07', st: 2, gen: function (R) {
      var f = pick([1, 2, 3, 4, -1, -2, -3, -4], R), sc = M.scale(M.keyTonic(f), 'major'), cand = [];
      sc.forEach(function (p, j) { if (j >= 1 && j <= 6 && p.a) cand.push(j); });
      var i = cand.length && R() < 0.75 ? pick(cand, R) : ri(1, 6, R), p = sc[i];
      var wr = [{ l: p.l, a: p.a === 0 ? 1 : 0, o: 4 }, { l: p.l, a: p.a === 0 ? -1 : -p.a, o: 4 }, M.P(p.l + 1, p.a, 4), M.P(p.l - 1, p.a, 4)].map(pn);
      var m = mc(R, pn(p), wr);
      var notes = sc.map(function (x, j) { return j === i ? { k: M.str({ l: x.l, a: 0, o: x.o }), d: 'q', c: 'transparent', acc: 'none' } : { k: M.str(x), d: 'q' }; });
      var st1 = M.midi(sc[i]) - M.midi(sc[i - 1]);
      return { q: M.keyName(f) + 'の 長音階。<b>？</b> に入る音は？', fig: { score: { clef: 'treble', notes: notes, sp: 36, beam: false, after: function (o) { var n = o.notes[i]; M.svgText(o.svg, n.x, o.staves[0].getYForLine(2) + 9, '？', { size: 26, c: C.red }); } } }, ch: m.ch, a: m.a, ex: i + '〜' + (i + 1) + ' 番目は ' + (st1 === 1 ? '半音' : '全音') + '（全・全・半・全・全・全・半）。' + N(sc[i - 1]) + ' から ' + (st1 === 1 ? '半音' : '全音') + ' 上 → <b>' + N(p) + '</b>。', exFig: { score: { clef: 'treble', notes: sc.map(function (x, j) { return { k: M.str(x), d: 'q', c: j === i ? C.red : null, lab: j === i ? N(x) : null }; }), sp: 36, beam: false } } };
    }
  };

  /* =================== 08 短音階 =================== */
  T.minType = {
    u: 'u08', st: 2, gen: function (R) {
      var tn = pick(['A4', 'E4', 'D4', 'G4', 'C4', 'B4'], R), ty = pick(['natural', 'harmonic', 'melodic', 'major'], R);
      var sc = M.scale(tn, ty);
      var all = ['natural', 'harmonic', 'melodic', 'major'];
      var m = mc(R, tx(M.SCALE_NAME[ty], ty), all.map(function (t) { return tx(M.SCALE_NAME[t], t); }));
      var why = { natural: '3・6・7番目が 長音階より半音低い まま', harmonic: '7番目だけ 半音上がっている（導音）', melodic: '6・7番目が 半音上がっている（上り）', major: '3番目が 主音の長3度上（明るい）' }[ty];
      return { q: '<b>' + N(M.p(tn)) + '</b> から始まる この音階の 種類は？', fig: { score: { clef: 'treble', notes: sc.map(function (p) { return { k: M.str(p), d: 'q' }; }), sp: 36, beam: false } }, ch: m.ch, a: m.a, ex: '<b>' + M.SCALE_NAME[ty] + '</b>：' + why + '。', play: function () { M.playNotes(sc.map(M.str), { beat: 0.5, bpm: 100 }); } };
    }
  };
  T.minLead = {
    u: 'u08', st: 2, gen: function (R) {
      var f = ri(-3, 3, R), tn = M.keyTonic(f, true), sc = M.scale(tn, 'natural'), sev = sc[6], up = M.up(sev, 1, 'A');
      var wr = [sev, sc[5], M.up(sc[5], 1, 'A'), sc[4], M.up(sc[2], 1, 'A')].map(pn);
      var m = mc(R, pn(up), wr);
      return { q: '<b>' + M.keyName(f, true) + '</b> の 和声短音階で 半音上げる音は？', fig: { score: { clef: 'treble', key: f, minor: true, notes: sc.map(function (p) { return { k: M.str(p), d: 'q' }; }), sp: 34, beam: false } }, ch: m.ch, a: m.a, ex: '第7音（' + N(sev) + '）を半音上げて 導音を作る → <b>' + N(up) + '</b>。', exFig: { score: { clef: 'treble', key: f, minor: true, notes: M.scale(tn, 'harmonic').map(function (p, j) { return { k: M.str(p), d: 'q', c: j === 6 ? C.red : null, lab: j === 6 ? N(p) : null }; }), sp: 34 } } };
    }
  };
  T.minEar = {
    u: 'u08', st: 1, ear: true, gen: function (R) {
      var tn = pick(['C4', 'D4', 'E4', 'G4', 'A3'], R), mj = R() < 0.5, sc = M.scale(tn, mj ? 'major' : pick(['natural', 'harmonic'], R));
      return { q: '🔊 聴いて答えよう：長音階？ 短音階？', ear: true, ch: ['長音階（明るい）', '短音階（暗い）'], a: mj ? 0 : 1, ex: '<b>' + (mj ? '長音階' : '短音階') + '</b>。3番目の音が 主音から長3度なら 明るく、短3度なら 暗く聞こえる。', play: function () { M.playNotes(sc.map(M.str), { beat: 0.5, bpm: 110 }); }, exFig: { score: { clef: 'treble', notes: sc.map(function (p, j) { return { k: M.str(p), d: 'q', c: j === 2 ? C.red : null }; }), sp: 34 } } };
    }
  };
  T.majMinEar = {
    u: 'u08', st: 1, ear: true, gen: function (R) {
      var mj = R() < 0.5, f = 0, seq = [1, 4, 5, 1].map(function (d) { return [M.diatonic(mj ? 0 : 0, !mj, d).map(function (p) { return M.str({ l: p.l, a: p.a, o: p.o - (mj ? 0 : 1) }); }), 1]; });
      return { q: '🔊 聴いて答えよう：長調？ 短調？', ear: true, ch: ['長調', '短調'], a: mj ? 0 : 1, ex: '<b>' + (mj ? 'ハ長調' : 'イ短調') + '</b> の Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ。短調は Ⅰ が短三和音なので 暗く聞こえる。', play: function () { M.play(seq, 80); } };
    }
  };
  T.minSteps = {
    u: 'u08', st: 2, gen: function (R) {
      if (R() < 0.5) {
        var m = mc(R, tx('2〜3番目 と 5〜6番目'), ['3〜4番目 と 7〜8番目', '2〜3番目 と 6〜7番目', '3〜4番目 と 5〜6番目', '1〜2番目 と 5〜6番目'].map(function (x) { return tx(x); }));
        return { q: '<b>自然短音階</b>で 半音になるのは どこ？', ch: m.ch, a: m.a, ex: '自然短音階は 全・<b>半</b>・全・全・<b>半</b>・全・全 → <b>2〜3番目 と 5〜6番目</b>。イ短調なら シ‐ド と ミ‐ファ。', exFig: { score: { clef: 'treble', notes: M.scale('A4', 'natural').map(function (p, j) { return { k: M.str(p), d: 'q', lab: (j + 1) + '', c: [1, 2, 4, 5].indexOf(j) >= 0 ? C.red : null }; }), sp: 34, beam: false } } };
      }
      var m2 = mc(R, tx('6〜7番目'), ['5〜6番目', '7〜8番目', '2〜3番目', '3〜4番目'].map(function (x) { return tx(x); }));
      return { q: '<b>和声短音階</b>で 半音 3 つ分（増2度）の 広い へだたりが あるのは どこ？', ch: m2.ch, a: m2.a, ex: '第7音を 半音上げたので、第6音との間が 半音 3 つ（<b>増2度</b>）に広がる → <b>6〜7番目</b>。イ短調なら ファ‐ソ♯。', exFig: { score: { clef: 'treble', notes: M.scale('A4', 'harmonic').map(function (p, j) { return { k: M.str(p), d: 'q', lab: (j + 1) + '', c: j === 5 || j === 6 ? C.red : null }; }), sp: 34, beam: false } } };
    }
  };
  T.minName = {
    u: 'u08', st: 2, gen: function (R) {
      var f = pick([0, 1, 2, 3, -1, -2, -3], R), ty = pick(['natural', 'harmonic'], R), tn = M.keyTonic(f, true), sc = M.scale(tn, ty);
      while (M.midi(sc[7]) > 84) sc = sc.map(function (p) { return { l: p.l, a: p.a, o: p.o - 1 }; });
      var wr = [tx(M.keyName(f), 'M'), tx(M.name(tn, 'jp') + '長調', 'MM')].concat([f - 1, f + 1, f + 3].filter(function (x) { return x >= -7 && x <= 7; }).map(function (x) { return tx(M.keyName(x, true), x); }));
      var m = mc(R, tx(M.keyName(f, true), f), wr);
      return { q: '何短調の 音階？（' + M.SCALE_NAME[ty] + '）', fig: { score: { clef: 'treble', notes: sc.map(function (p) { return { k: M.str(p), d: 'q' }; }), sp: 36, beam: false } }, ch: m.ch, a: m.a, ex: '始まりの音（主音）は <b>' + M.name(tn, 'jp') + '</b> → <b>' + M.keyName(f, true) + '</b>。', play: function () { M.playNotes(sc.map(M.str), { beat: 0.5, bpm: 100 }); } };
    }
  };
  T.minMel = {
    u: 'u08', st: 2, gen: function (R) {
      var L = [
        ['<b>旋律短音階</b>の <b>下り</b>は 何と同じ？', '自然短音階', ['和声短音階', '長音階', '上りと同じ'], '旋律短音階は 上りだけ 第6・第7音を上げ、下りは <b>自然短音階</b> にもどる。'],
        ['<b>旋律短音階</b>の <b>上り</b>で 半音上げるのは？', '第6音と 第7音', ['第7音だけ', '第3音と 第6音', '第6音だけ'], '上りは 増2度を なくすため <b>第6音と 第7音</b> を 半音上げる。'],
        ['<b>和声短音階</b>で 半音上げるのは？', '第7音だけ', ['第6音と 第7音', '第3音だけ', '第6音だけ'], '和声短音階は 導音を作るため <b>第7音だけ</b> 半音上げる。'],
        ['第7音を 半音上げて 作る <b>導音</b> は、主音の 何下？', '半音下', ['全音下', '短3度下', '完全5度下'], '導音は 主音の <b>半音下</b>。主音へ 進みたくなる音。']
      ];
      var x = pick(L, R), m = mc(R, tx(x[1]), x[2].map(function (s) { return tx(s); }));
      if (L.indexOf(x) >= 2) return { q: x[0], ch: m.ch, a: m.a, ex: x[3], exFig: { score: { clef: 'treble', notes: M.scale('A4', 'harmonic').map(function (p, j) { return { k: M.str(p), d: 'q', c: j === 6 ? C.red : null, lab: j === 6 ? '導音' : j === 7 ? '主音' : null }; }), sp: 34, beam: false }, ttl: 'イ短調の 和声短音階' } };
      return { q: x[0], ch: m.ch, a: m.a, ex: x[3], exFig: { col: [{ score: { clef: 'treble', notes: M.scale('A4', 'melodic').map(function (p, j) { return { k: M.str(p), d: 'q', c: j === 5 || j === 6 ? C.red : null }; }), sp: 30, beam: false }, ttl: '旋律短音階（上り）' }, { score: { clef: 'treble', notes: M.scale('A4', 'natural').reverse().map(function (p) { return { k: M.str(p), d: 'q' }; }), sp: 30, beam: false }, ttl: '下り（自然短音階と同じ）' }] } };
    }
  };

  /* =================== 09 調と調号 =================== */
  var ksig = function (f, minor, clef) { return { score: { clef: clef || 'treble', key: f, minor: minor, notes: [], minBar: 30 } }; };
  T.keyMaj = {
    u: 'u09', st: 1, gen: function (R, st) {
      var f = st >= 2 ? pick([-7, -6, -5, -4, 4, 5, 6, 7, -3, 3], R) : ri(-3, 3, R), clef = st >= 3 && R() < 0.5 ? 'bass' : 'treble';
      var wr = [f - 1, f + 1, -f, f + 2, f - 2].filter(function (x) { return x >= -7 && x <= 7; }).map(function (x) { return tw(M.keyName(x), M.keyName(x) + ' の 調号は ' + sigTxt(x), x); }).concat([tw(M.keyName(f, true), M.keyName(f, true) + ' は 短調（この調号の 平行調）', 'm')]);
      var m = mc(R, tx(M.keyName(f), f), wr);
      var how = f === 0 ? '調号なしは ハ長調' : f > 0 ? 'いちばん右の♯（' + N({ l: M.SHARPS[f - 1], a: 1, o: 4 }) + '）の 半音上' : f === -1 ? '♭1つは ヘ長調' : '右から2番目の♭（' + N({ l: M.FLATS[-f - 2], a: -1, o: 4 }) + '）';
      return { q: (f === 0 ? '調号が ない（♯・♭ なし）とき、<b>長調</b> は？' : 'この調号の <b>長調</b> は？') + (clef === 'bass' ? '（ヘ音記号）' : ''), fig: ksig(f, false, clef), ch: m.ch, a: m.a, why: m.why, ex: how + ' → <b>' + M.keyName(f) + '</b>。', exFig: { score: { clef: 'treble', key: f, notes: [{ k: M.str(M.keyTonic(f)), d: 'w', c: C.red, lab: '主音' }], minBar: 60 } } };
    }
  };
  T.keyMin = {
    u: 'u09', st: 2, gen: function (R, st) {
      var f = ri(-4, 4, R), clef = st >= 3 && R() < 0.5 ? 'bass' : 'treble';
      var wr = [tx(M.keyName(f), 'M')].concat([f - 1, f + 1, -f, f + 3].filter(function (x) { return x >= -7 && x <= 7; }).map(function (x) { return tx(M.keyName(x, true), x); }));
      var m = mc(R, tx(M.keyName(f, true), f), wr);
      return { q: (f === 0 ? '調号が ない（♯・♭ なし）とき、<b>短調</b> は？' : 'この調号の <b>短調</b> は？') + (clef === 'bass' ? '（ヘ音記号）' : ''), fig: ksig(f, true, clef), ch: m.ch, a: m.a, ex: '長調は ' + M.keyName(f) + '。その主音の <b>短3度下</b> → <b>' + M.keyName(f, true) + '</b>（平行調）。', exFig: { score: { clef: 'treble', key: f, notes: [{ k: M.str(M.keyTonic(f)), d: 'w', lab: '長調の主音' }, { k: M.str(M.up(M.keyTonic(f), 3, 'm', true)), d: 'w', c: C.red, lab: '短調の主音' }], sp: 70, ls: 12 } } };
    }
  };
  T.keySig = {
    u: 'u09', st: 2, gen: function (R) {
      var minor = R() < 0.3, f = ri(-5, 5, R); if (f === 0) f = pick([2, -2], R);
      var fig = function (x) { return { score: { clef: 'treble', key: x, minor: minor, notes: [], minBar: 20 } }; };
      var wr = [f - 1, f + 1, -f, f + 2, f - 2].filter(function (x) { return x >= -7 && x <= 7 && x !== 0; }).map(function (x) { return { k: x, fig: fig(x) }; });
      var m = mc(R, { k: f, fig: fig(f) }, wr);
      return { q: '<b>' + M.keyName(f, minor) + '</b> の 調号は？', ch: m.ch, a: m.a, ex: M.keyName(f, minor) + ' は <b>' + (f > 0 ? '♯ ' + f + ' つ' : '♭ ' + (-f) + ' つ') + '</b>。' + (minor ? '平行調の ' + M.keyName(f) + ' と同じ。' : '') };
    }
  };
  T.related = {
    u: 'u09', st: 3, gen: function (R) {
      var f = ri(-3, 3, R), kind = pick(['平行調', '同主調', '属調', '下属調'], R);
      var ans = { '平行調': M.keyName(f, true), '同主調': M.name(M.keyTonic(f), 'jp') + '短調', '属調': M.keyName(f + 1), '下属調': M.keyName(f - 1) }[kind];
      var wr = [M.keyName(f, true), M.name(M.keyTonic(f), 'jp') + '短調', M.keyName(f + 1), M.keyName(f - 1), M.keyName(f + 1, true), M.keyName(f - 3)].map(function (s) { return tx(s); });
      var m = mc(R, tx(ans), wr);
      var why = { '平行調': '調号が同じ短調（主音が短3度下）', '同主調': '主音が同じ短調', '属調': '♯が1つ多い（主音が完全5度上）', '下属調': '♭が1つ多い（主音が完全4度上）' }[kind];
      return { q: '<b>' + M.keyName(f) + '</b> の <b>' + kind + '</b> は？', ch: m.ch, a: m.a, ex: kind + '＝' + why + ' → <b>' + ans + '</b>。', exFig: { c: 'related', a: { f: f } } };
    }
  };
  T.keyOrderQ = {
    u: 'u09', st: 1, gen: function (R) {
      var sh = R() < 0.5, n = ri(1, 7, R), L = sh ? M.SHARPS : M.FLATS, p = { l: L[n - 1], a: sh ? 1 : -1, o: 4 };
      var wr = L.map(function (l) { return pn({ l: l, a: sh ? 1 : -1, o: 4 }); });
      var m = mc(R, pn(p), wr);
      return { q: (sh ? '♯' : '♭') + ' の調号で <b>' + n + ' 番目</b> に つくのは？', ch: m.ch, a: m.a, ex: (sh ? '♯は ファ・ド・ソ・レ・ラ・ミ・シ' : '♭は シ・ミ・ラ・レ・ソ・ド・ファ') + ' の順 → <b>' + N(p) + '</b>。', exFig: { c: 'keyOrder', a: { sharp: sh } } };
    }
  };
  var sigTxt = function (f) { return f === 0 ? 'なし' : (f > 0 ? '♯ ' : '♭ ') + Math.abs(f) + ' つ'; };
  T.sigCount = {
    u: 'u09', st: 1, gen: function (R, st) {
      var minor = st >= 2 && R() < 0.4, f = ri(-5, 5, R); if (f === 0) f = pick([1, -1], R);
      var m = mc(R, tx(sigTxt(f)), [f - 1, f + 1, -f, f + 2, f - 2].filter(function (x) { return x >= -7 && x <= 7; }).map(function (x) { return tx(sigTxt(x)); }));
      return { q: '<b>' + M.keyName(f, minor) + '</b> の 調号は？', ch: m.ch, a: m.a, ex: M.keyName(f, minor) + ' は <b>' + sigTxt(f) + '</b>（' + accList(f) + '）。' + (minor ? '平行調の ' + M.keyName(f) + ' と 同じ調号。' : ''), exFig: ksig(f, minor) };
    }
  };
  T.relMin = {
    u: 'u09', st: 2, gen: function (R) {
      var f = ri(-4, 4, R), kind = R() < 0.6 ? '平行調' : '同主調', tn = M.keyTonic(f, true);
      var par = M.keyName(f), same = M.name(tn, 'jp') + '長調', ans = kind === '平行調' ? par : same;
      var m = mc(R, tx(ans), [par, same, M.keyName(f + 1), M.keyName(f - 1), M.keyName(f + 3)].map(function (s) { return tx(s); }));
      return { q: '<b>' + M.keyName(f, true) + '</b> の <b>' + kind + '</b>（長調）は？', ch: m.ch, a: m.a, ex: kind === '平行調' ? '平行調＝調号が同じ。短調の主音の <b>短3度上</b> が 長調の主音 → <b>' + par + '</b>。' : '同主調＝主音が同じ（' + M.name(tn, 'jp') + '）→ <b>' + same + '</b>。', exFig: { c: 'related', a: { f: f } } };
    }
  };
  T.melKey = {
    u: 'u09', st: 3, gen: function (R) {
      var f = ri(-3, 3, R), minor = R() < 0.5, tn = M.keyTonic(f, minor), sc = M.scale({ l: tn.l, a: tn.a, o: 4 }, minor ? 'harmonic' : 'major');
      if (M.midi(sc[0]) > 67) sc = sc.map(function (p) { return { l: p.l, a: p.a, o: p.o - 1 }; });
      var degs = [0, ri(1, 4, R), ri(2, 5, R), ri(1, 4, R), ri(3, 5, R), 6, 7], last = sc[7];
      var ps = degs.map(function (d) { return sc[d]; });
      var notes = ps.map(function (p, i) { return { k: M.str(p), d: i === 6 ? 'h' : 'q' }; });
      var sigN = f === 0 ? '調号なし' : '調号 ' + (f > 0 ? '♯ ' : '♭ ') + Math.abs(f) + ' つ';
      var m = mc(R, tx(M.keyName(f, minor)), [M.keyName(f, !minor), M.keyName(f + 1), M.keyName(f - 1, true), M.keyName(f + 1, true), M.keyName(f - 1)].map(function (x) { return tx(x); }));
      return { q: 'このメロディーは 何調？（調号と 最後の音に 注目）', fig: { score: { clef: 'treble', key: f, time: '4/4', bars: [notes.slice(0, 4), notes.slice(4)], end: 'end', sp: 32, wrap: 1, wrapW: 250 } }, ch: m.ch, a: m.a, ex: sigN + ' → <b>' + M.keyName(f) + '</b> か <b>' + M.keyName(f, true) + '</b>。' + (minor ? '短調の導音 ' + N(sc[6]) + ' に 臨時記号（' + M.ACC[sc[6].a === 0 ? '0' : sc[6].a] .replace(/^$/, '♮') + '）がつき、主音 ' + N(last) + ' で終わる → <b>' + M.keyName(f, true) + '</b>。' : '臨時記号がなく、主音 ' + N(last) + ' で終わる → <b>' + M.keyName(f) + '</b>。'), play: function () { M.playSpec({ notes: notes }, 100); } };
    }
  };

  /* =================== 10 和音 =================== */
  var TRI = ['maj', 'min', 'aug', 'dim'];
  var RECIPE = { maj: '長3度＋短3度', min: '短3度＋長3度', aug: '長3度＋長3度', dim: '短3度＋短3度', dom7: '長三和音＋短7度', maj7: '長三和音＋長7度', min7: '短三和音＋短7度', hdim7: '減三和音＋短7度', dim7: '減三和音＋減7度' };
  var tyW = function (t) { return tw(M.CH_JP[t], M.CH_JP[t] + ' ＝ ' + RECIPE[t], t); };
  function chordFig(ps, o) { o = o || {}; return { score: { clef: o.clef || 'treble', key: o.key || 0, notes: [{ k: ps.map(M.str), d: 'w', kc: o.kc }], minBar: o.w || 70, noClef: o.noClef } }; }
  T.triadType = {
    u: 'u10', st: 1, gen: function (R, st) {
      var root, ty;
      if (st >= 2) { root = pick(nat('C4', 'A4'), R); root.a = pick([0, 0, 1, -1], R); ty = pick(TRI, R); }
      else { var d = ri(1, 7, R), ch0 = M.diatonic(0, false, d); root = ch0[0]; ty = M.chordType(ch0); }
      var ps = M.chord(root, ty), clef = st >= 3 && R() < 0.4 ? 'bass' : 'treble';
      if (clef === 'bass') ps = toBass(ps);
      var m = mc(R, tx(M.CH_JP[ty], ty), TRI.map(tyW));
      var i1 = M.interval(ps[0], ps[1]).name, i2 = M.interval(ps[1], ps[2]).name;
      return { q: 'この三和音の 種類は？', fig: chordFig(ps, { clef: clef }), ch: m.ch, a: m.a, ex: '下から <b>' + i1 + '</b> ＋ <b>' + i2 + '</b> → <b>' + M.CH_JP[ty] + '</b>。', play: [[ps, 2]], why: m.why };
    }
  };
  T.triadBuild = {
    u: 'u10', st: 2, gen: function (R) {
      var root = pick(nat('C4', 'A4'), R); root.a = pick([0, 0, 0, 1, -1], R);
      var ty = pick(['maj', 'min', 'dim', 'aug'], R);
      var m = mc(R, { k: ty, fig: chordFig(M.chord(root, ty), { noClef: false, w: 50 }) }, TRI.map(function (t) { return { k: t, fig: chordFig(M.chord(root, t), { w: 50 }) }; }));
      return { q: '<b>' + N(root) + '</b> を根音とする <b>' + M.CH_JP[ty] + '</b> は？', ch: m.ch, a: m.a, ex: M.CH_JP[ty] + '＝' + { maj: '長3度＋短3度', min: '短3度＋長3度', aug: '長3度＋長3度', dim: '短3度＋短3度' }[ty] + ' → <b>' + M.chord(root, ty).map(N).join('・') + '</b>。', play: [[M.chord(root, ty), 2]] };
    }
  };
  T.inversion = {
    u: 'u10', st: 2, gen: function (R) {
      var d = ri(1, 7, R), ch0 = M.diatonic(0, false, d).map(function (p) { return { l: p.l, a: p.a, o: 4 }; }), n = ri(0, 2, R);
      var base = M.chord(ch0[0], M.chordType(M.diatonic(0, false, d)));
      var ps = M.inv(base, n);
      var names = ['基本形', '第1転回形', '第2転回形'];
      return { q: 'この和音は 基本形？ 転回形？（根音は <b>' + N(base[0]) + '</b>）', fig: chordFig(ps), ch: names, a: n, ex: 'いちばん下が ' + ['根音', '第3音', '第5音'][n] + '（' + N(ps[0]) + '）→ <b>' + names[n] + '</b>。', play: [[ps, 2]] };
    }
  };
  T.chordRoot = {
    u: 'u10', st: 2, gen: function (R, st) {
      var d = ri(1, 7, R), base = M.diatonic(0, false, d).map(function (p) { return { l: p.l, a: p.a, o: p.o - (d >= 5 ? 1 : 0) }; }), n = st >= 3 ? ri(1, 2, R) : ri(0, 2, R), ps = M.inv(base, n);
      var root = base[0], others = [-1, 1, 3].map(function (k) { return M.P(root.l + k, 0, 4); });
      var m = mc(R, pn(root), base.slice(1).map(pn).concat(others.map(pn)));
      return { q: 'この和音の <b>根音</b> は？', fig: chordFig(ps), ch: m.ch, a: m.a, ex: '3 度ずつ重なるように 並べかえると ' + base.map(N).join('・') + '。いちばん下の <b>' + N(root) + '</b> が 根音。' + (n ? '（この楽譜は' + ['', '第1', '第2'][n] + '転回形）' : '（基本形）'), exFig: chordFig(base.map(function (p) { return { l: p.l, a: p.a, o: p.o }; }), { kc: [C.red] }), play: [[ps, 2]] };
    }
  };
  T.isTriad = {
    u: 'u10', st: 1, gen: function (R) {
      var r = M.p(pick(['C4', 'D4', 'E4', 'F4', 'G4', 'A4'], R)), D = function (k) { return M.P(r.l + k, 0, r.o); };
      var good = [D(0), D(2), D(4)], bads = shuffle([[D(0), D(1), D(2)], [D(0), D(3), D(6)], [D(0), D(2), D(3)], [D(0), D(1), D(4)], [D(0), D(3), D(4)]], R).slice(0, 3);
      var fig = function (ps) { return chordFig(ps, { w: 50 }); };
      var m = mc(R, { k: 'ok', fig: fig(good) }, bads.map(function (b, i) { return { k: 'b' + i, fig: fig(b) }; }));
      return { q: '<b>三和音</b>（1つおきに 3つ重ねた和音）は どれ？', ch: m.ch, a: m.a, ex: '三和音は 根音の上に <b>3度・5度</b>。五線では <b>線・線・線</b> か <b>間・間・間</b> の だんごの形 → ' + good.map(N).join('・') + '。', exFig: chordFig(good, { kc: [C.red, C.red, C.red] }) };
    }
  };
  T.chordTones = {
    u: 'u10', st: 1, gen: function (R, st) {
      var root = st >= 2 ? M.p(pick(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb3', 'Eb4'], R)) : M.p(pick(['C4', 'F4', 'G4', 'D4', 'A4'], R));
      var ty = st >= 2 ? pick(['maj', 'min'], R) : 'maj', ps = M.chord(root, ty), w = pick([1, 2], R), ans = ps[w];
      var wr = [ps[3 - w], { l: ans.l, a: ans.a + (ans.a < 1 ? 1 : -1), o: 4 }, M.P(ans.l + 1, 0, 4), M.P(ans.l - 1, 0, 4), root].map(pn);
      var m = mc(R, pn(ans), wr);
      return { q: '<b>' + N(root) + '</b> を根音とする <b>' + M.CH_JP[ty] + '</b> の <b>' + (w === 1 ? '第3音' : '第5音') + '</b> は？', ch: m.ch, a: m.a, ex: M.CH_JP[ty] + '＝' + RECIPE[ty] + '。' + N(root) + ' → <b>' + ps.map(N).join('・') + '</b>。' + (w === 1 ? '真ん中' : 'いちばん上') + 'が ' + (w === 1 ? '第3音' : '第5音') + ' → <b>' + N(ans) + '</b>。', exFig: chordFig(ps, { kc: ps.map(function (_, i) { return i === w ? C.red : null; }) }), play: [[ps, 2]] };
    }
  };
  T.seventh = {
    u: 'u10', st: 3, gen: function (R) {
      var ts = ['dom7', 'maj7', 'min7', 'hdim7', 'dim7'], ty = pick(ts, R), root = pick(nat('C4', 'G4'), R);
      var ps = M.chord(root, ty);
      var m = mc(R, tx(M.CH_JP[ty], ty), ts.map(tyW));
      var why = { dom7: '長三和音＋短7度', maj7: '長三和音＋長7度', min7: '短三和音＋短7度', hdim7: '減三和音＋短7度', dim7: '減三和音＋減7度' }[ty];
      return { q: 'この 七の和音の 種類は？', fig: chordFig(ps), ch: m.ch, a: m.a, ex: '<b>' + why + '</b> → ' + M.CH_JP[ty] + '（' + M.chordName(root, ty) + '）。', play: [[ps, 2]], why: m.why };
    }
  };
  T.chordEar = {
    u: 'u10', st: 2, ear: true, gen: function (R) {
      var ty = pick(['maj', 'min'], R), root = pick(nat('C4', 'G4'), R), ps = M.chord(root, ty);
      return { q: '🔊 聴いて答えよう：何の三和音？', ear: true, ch: ['長三和音（明るい）', '短三和音（暗い）'], a: ty === 'maj' ? 0 : 1, ex: '<b>' + M.CH_JP[ty] + '</b>（' + ps.map(N).join('・') + '）。', exFig: chordFig(ps), play: function () { M.playChord(ps.map(M.str), true); } };
    }
  };

  /* =================== 11 和音の働き・コードネーム =================== */
  var CNT = ['maj', 'min', 'dom7', 'maj7', 'min7', 'dim', 'aug', 'sus4'];
  T.chordName = {
    u: 'u11', st: 2, gen: function (R, st) {
      var root = pick(nat('C4', 'A4'), R);
      if (st >= 3) { root = M.p(pick(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B3', 'F#4', 'C#4', 'Bb3', 'Eb4', 'Ab4', 'Db4'], R)); }
      var ty = pick(st >= 3 ? CNT : ['maj', 'min', 'dom7', 'maj7', 'min7'], R), ps = M.chord(root, ty);
      var cw = function (r, t) { var nm = M.chordName(r, t); return tw(nm, nm + ' ＝ ' + M.chord(r, t).map(N).join('・')); };
      var wr = CNT.map(function (t) { return cw(root, t); }).concat([cw(M.P(root.l + 2, 0, 4), ty), cw(M.P(root.l + 5, 0, 4), ty)]);
      var m = mc(R, tx(M.chordName(root, ty)), wr);
      return { q: 'この和音の コードネームは？', fig: chordFig(ps), ch: m.ch, a: m.a, ex: '根音は ' + M.name(root, 'en') + '、' + M.CH_JP[ty] + ' → <b>' + M.chordName(root, ty) + '</b>。', play: [[ps, 2]], why: m.why };
    }
  };
  T.roman = {
    u: 'u11', st: 2, gen: function (R) {
      var f = ri(-2, 2, R), d = ri(1, 7, R), ps = M.diatonic(f, false, d).map(function (p) { return { l: p.l, a: p.a, o: p.o > 5 ? 4 : p.o }; });
      while (M.midi(ps[2]) > 79) ps = ps.map(function (p) { return { l: p.l, a: p.a, o: p.o - 1 }; });
      var m = mc(R, tx(M.ROMAN[d - 1]), M.ROMAN.map(function (r) { return tx(r); }));
      return { q: '<b>' + M.keyName(f) + '</b> で この和音は 何の和音？（Ⅰ〜Ⅶ）', fig: { score: { clef: 'treble', key: f, notes: [{ k: ps.map(M.str), d: 'w' }], minBar: 60 } }, ch: m.ch, a: m.a, ex: '根音 ' + N(ps[0]) + ' は ' + M.keyName(f) + 'の ' + d + ' 番目の音 → <b>' + M.ROMAN[d - 1] + '</b>。', play: [[ps, 2]] };
    }
  };
  T.func = {
    u: 'u11', st: 1, gen: function (R) {
      var L = [['Ⅰ', 'トニック'], ['Ⅳ', 'サブドミナント'], ['Ⅴ', 'ドミナント'], ['Ⅴ7', 'ドミナント']], x = pick(L, R);
      if (R() < 0.4) {
        var y = pick([['トニック', 'Ⅰ'], ['ドミナント', 'Ⅴ'], ['サブドミナント', 'Ⅳ']], R);
        return { q: '主要三和音で <b>' + y[0] + '</b> の働きをするのは？', ch: ['Ⅰ', 'Ⅳ', 'Ⅴ'], a: ['Ⅰ', 'Ⅳ', 'Ⅴ'].indexOf(y[1]), ex: 'Ⅰ＝トニック（安定）、Ⅳ＝サブドミナント、Ⅴ＝ドミナント（Ⅰに進みたい）。' };
      }
      return { q: '<b>' + x[0] + '</b> の和音の 働きは？', ch: ['トニック', 'サブドミナント', 'ドミナント'], a: ['トニック', 'サブドミナント', 'ドミナント'].indexOf(x[1]), ex: x[0] + ' は <b>' + x[1] + '</b>。' + { 'トニック': '安定して 落ち着く「帰る場所」。', 'サブドミナント': 'Ⅰから少し はなれる。', 'ドミナント': 'Ⅰへ 進みたくなる 緊張。' }[x[1]] };
    }
  };
  T.cadence = {
    u: 'u11', st: 2, gen: function (R) {
      var L = [['Ⅴ', 'Ⅰ', '完全終止', 'しっかり終わる'], ['Ⅳ', 'Ⅰ', '変終止', 'アーメン終止。やわらかく終わる'], ['Ⅰ', 'Ⅴ', '半終止', 'Ⅴで止まり まだ続く感じ'], ['Ⅴ', 'Ⅵ', '偽終止', 'Ⅰのかわりに Ⅵへ。だまされた感じ']];
      var x = pick(L, R), d = function (r) { return M.ROMAN.indexOf(r) + 1; };
      var c1 = M.diatonic(0, false, d(x[0])), c2 = M.diatonic(0, false, d(x[1]));
      var m = mc(R, tx(x[2]), L.map(function (y) { return tx(y[2]); }));
      return { q: '和音が <b>' + x[0] + ' → ' + x[1] + '</b> と進む 終わり方は？', fig: { score: { clef: 'treble', notes: [{ k: c1.map(M.str), d: 'h', lab: x[0] }, { k: c2.map(M.str), d: 'h', lab: x[1] }], sp: 60 } }, ch: m.ch, a: m.a, ex: x[0] + '→' + x[1] + ' は <b>' + x[2] + '</b>：' + x[3] + '。', play: [[c1, 1.5], [c2, 2.5]] };
    }
  };
  T.nameToChord = {
    u: 'u11', st: 2, gen: function (R) {
      var root = pick(nat('C4', 'A4'), R), ty = pick(['maj', 'min', 'dom7'], R), ps = M.chord(root, ty);
      var j = function (a) { return a.map(N).join('・'); };
      var wr = ['maj', 'min', 'dom7', 'maj7', 'dim'].filter(function (t) { return t !== ty; }).map(function (t) { return tx(j(M.chord(root, t))); }).concat([tx(j(M.chord(M.P(root.l + 1, 0, 4), ty)))]);
      var m = mc(R, tx(j(ps)), wr);
      return { q: 'コードネーム <b class="en">' + M.chordName(root, ty) + '</b> の 構成音は？', ch: m.ch, a: m.a, ex: M.chordName(root, ty) + '＝' + M.CH_JP[ty] + ' → <b>' + j(ps) + '</b>。', exFig: chordFig(ps), play: [[ps, 2]] };
    }
  };
  // 調の中の和音（d：1〜7、sev：七の和音）
  function keyChord(f, d, sev) { var ps = M.diatonic(f, false, d, sev); return { ps: ps, name: M.chordName(ps[0], M.chordType(ps)) }; }
  T.chordInKey = {
    u: 'u11', st: 2, gen: function (R, st) {
      var f = ri(-2, 2, R), d = st >= 3 ? ri(1, 7, R) : pick([1, 4, 5], R), sev = d === 5 && R() < 0.4, c = keyChord(f, d, sev);
      var rn = M.ROMAN[d - 1] + (sev ? '7' : '');
      var wr = [1, 2, 3, 4, 5, 6, 7].filter(function (x) { return x !== d; }).map(function (x) { return tx(keyChord(f, x).name); }).concat([tx(M.chordName(c.ps[0], sev ? 'maj' : M.chordType(c.ps) === 'maj' ? 'min' : 'maj'))]);
      var m = mc(R, tx(c.name), wr);
      return { q: '<b>' + M.keyName(f) + '</b> の <b>' + rn + '</b> の和音の コードネームは？', ch: m.ch, a: m.a, ex: M.keyName(f) + 'の ' + d + ' 番目の音は ' + M.name(c.ps[0], 'en') + '。' + (d === 1 || d === 4 || d === 5 ? (sev ? '属七の和音 → ' : 'Ⅰ・Ⅳ・Ⅴ は 長三和音 → ') : d === 7 ? 'Ⅶ は 減三和音 → ' : 'Ⅱ・Ⅲ・Ⅵ は 短三和音 → ') + '<b>' + c.name + '</b>（' + c.ps.map(N).join('・') + '）。', exFig: { score: { clef: 'treble', key: f, notes: [1, 2, 3, 4, 5, 6, 7].map(function (x) { var k = keyChord(f, x), lo = M.midi(keyChord(f, 1).ps[0]) > 65 ? 1 : 0; return { k: k.ps.map(function (p) { return M.str({ l: p.l, a: p.a, o: p.o - lo }); }), d: 'w', lab: k.name, c: x === d ? C.red : null }; }), sp: 40, ls: 11 } }, play: [[c.ps, 2]] };
    }
  };
  T.funcName = {
    u: 'u11', st: 2, gen: function (R) {
      var f = ri(-2, 2, R), x = pick([[1, 'トニック'], [4, 'サブドミナント'], [5, 'ドミナント'], [5, 'ドミナント', 1]], R), c = keyChord(f, x[0], !!x[2]);
      return { q: '<b>' + M.keyName(f) + '</b> で <b class="en">' + c.name + '</b> の和音の 働きは？', ch: ['トニック', 'サブドミナント', 'ドミナント'], a: ['トニック', 'サブドミナント', 'ドミナント'].indexOf(x[1]), ex: c.name + ' の根音 ' + M.name(c.ps[0], 'en') + ' は ' + M.keyName(f) + 'の ' + x[0] + ' 番目 → <b>' + M.ROMAN[x[0] - 1] + (x[2] ? '7' : '') + '</b> → <b>' + x[1] + '</b>。', play: [[c.ps, 2]] };
    }
  };
  T.cadenceEar = {
    u: 'u11', st: 2, ear: true, gen: function (R) {
      var full = R() < 0.5, prog = full ? [1, 4, 5, 1] : [1, 4, 1, 5];
      var ch = function (d) { var ps = M.diatonic(0, false, d).map(function (p) { return { l: p.l, a: p.a, o: p.o - (M.midi(p) > 71 ? 1 : 0) }; }); return ps.concat([{ l: ps[0].l, a: 0, o: 3 }]); };
      return { q: '🔊 聴いて答えよう：最後は 終わった感じ？ 続く感じ？', ear: true, ch: ['終わった感じ（完全終止）', 'まだ続く感じ（半終止）'], a: full ? 0 : 1, ex: '<b>' + prog.map(function (d) { return M.ROMAN[d - 1]; }).join('→') + '</b>。' + (full ? 'Ⅴ→Ⅰ で 帰る場所に もどる → <b>完全終止</b>。' : 'Ⅴ で 止まる → <b>半終止</b>（まだ続く感じ）。'), exFig: { score: { clef: 'treble', notes: prog.map(function (d) { return { k: M.diatonic(0, false, d).map(M.str), d: 'h', lab: M.ROMAN[d - 1] }; }), sp: 50 } }, play: function () { M.play(prog.map(function (d, i) { return [ch(d), i === 3 ? 2.5 : 1]; }), 76); } };
    }
  };

  /* =================== 12 移調 =================== */
  T.transNote = {
    u: 'u12', st: 2, gen: function (R) {
      var f = pick([1, 2, -1, -2, 3, -3], R), deg = ri(0, 6, R), from = M.scale('C4', 'major')[deg], to = M.scale(M.keyTonic(f), 'major')[deg];
      var wr = [{ l: to.l, a: to.a === 0 ? 1 : 0, o: 4 }, M.P(to.l + 1, 0, 4), M.P(to.l - 1, to.a, 4), from, { l: to.l, a: to.a === 0 ? -1 : 0, o: 4 }].map(pn);
      var m = mc(R, pn(to), wr);
      return { q: 'ハ長調の <b>' + N(from) + '</b> は、<b>' + M.keyName(f) + '</b> に 移調すると 何の音になる？', ch: m.ch, a: m.a, ex: N(from) + ' は ハ長調の ' + (deg + 1) + ' 番目（' + M.ROMAN[deg] + '）。' + M.keyName(f) + 'の ' + (deg + 1) + ' 番目は <b>' + N(to) + '</b>。', exFig: { score: { clef: 'treble', key: f, notes: M.scale(M.keyTonic(f), 'major').slice(0, 7).map(function (p, j) { return { k: M.str(p), d: 'q', lab: M.ROMAN[j], c: j === deg ? C.red : null }; }), sp: 34 } } };
    }
  };
  T.transMelody = {
    u: 'u12', st: 3, gen: function (R) {
      var f = pick([1, 2, -1, -2], R), degs = [0, ri(1, 4, R), ri(2, 5, R), ri(0, 4, R)];
      var cs = M.scale('C4', 'major'), ts = M.scale(M.keyTonic(f), 'major');
      var src = degs.map(function (d) { return cs[d]; }), dst = degs.map(function (d) { return ts[d]; });
      var fig = function (ps, key) { return { score: { clef: 'treble', key: key, notes: ps.map(function (p) { return { k: M.str(p), d: 'q' }; }), sp: 26, minBar: 60 } }; };
      var w1 = dst.map(function (p) { return M.P(p.l + 1, 0, p.o); }); // 1 度ずれ
      var w2 = dst.slice(); w2[2] = M.P(dst[2].l + 1, dst[2].a, dst[2].o); // 1 音まちがい
      var w3 = degs.map(function (d) { return M.scale(M.keyTonic(f), 'major')[d]; }).map(function (p) { return M.P(p.l - 1, 0, p.o); });
      var m = mc(R, { k: 'ok', fig: fig(dst, f) }, [{ k: 'w1', fig: fig(w1, f) }, { k: 'w2', fig: fig(w2, f) }, { k: 'w3', fig: fig(w3, f) }]);
      return { q: 'このメロディーを <b>' + M.keyName(f) + '</b> に移調したのは？', fig: fig(src, 0), ch: m.ch, a: m.a, ex: '主音 ' + N(cs[0]) + ' → ' + N(ts[0]) + '。全部の音を 同じだけずらして、' + dst.map(N).join('・') + '。', play: function () { M.playNotes(src.map(M.str), { beat: 0.6 }); } };
    }
  };
  T.transInterval = {
    u: 'u12', st: 2, gen: function (R) {
      var f = pick([1, 2, 3, 4, -1, -2, -3], R), t = M.keyTonic(f);
      var tt = { l: t.l, a: t.a, o: 4 }; if (M.midi(tt) < 60) tt.o = 5;
      var iv = M.interval('C4', tt);
      var all = ['長2度', '短3度', '長3度', '完全4度', '完全5度', '長6度', '短6度', '長7度', '短7度', '短2度'].map(function (s) { return tx(s); });
      var m = mc(R, tx(iv.name), all);
      return { q: 'ハ長調 → <b>' + M.keyName(f) + '</b>。何度 上に 移調する？', ch: m.ch, a: m.a, ex: '主音 ' + N('C4') + ' → ' + N(tt) + ' は <b>' + iv.name + '</b>。' };
    }
  };
  T.transKey = {
    u: 'u12', st: 3, gen: function (R) {
      var f = pick([0, -1, -2, 1, -3], R), w = f + 2;
      var m = mc(R, tx(M.keyName(w), w), [f, f + 1, f - 2, f + 3, f - 1].filter(function (x) { return x >= -7 && x <= 7; }).map(function (x) { return tx(M.keyName(x), x); }));
      return { q: 'B♭クラリネットで <b>' + M.keyName(f) + '</b> の音を鳴らしたい。楽譜は 何調で書く？', ch: m.ch, a: m.a, ex: 'B♭管は 書いた音より 長2度低く鳴る → 楽譜は <b>長2度上</b>の <b>' + M.keyName(w) + '</b>。' };
    }
  };
  T.transInst = {
    u: 'u12', st: 2, gen: function (R) {
      var hn = R() < 0.4, w = pick(nat('C4', 'C5'), R), snd = M.up(w, hn ? 5 : 2, hn ? 'P' : 'M', true);
      var wr = [w, M.up(w, hn ? 5 : 2, hn ? 'P' : 'M'), M.up(w, hn ? 4 : 3, hn ? 'P' : 'm', true), M.up(w, 2, 'm', true), M.up(w, 5, 'P', !hn ? true : false)].filter(function (x) { return Math.abs(x.a) <= 1; }).map(pn);
      var m = mc(R, pn(snd), wr);
      return { q: '<b>' + (hn ? 'F管のホルン' : 'B♭管のクラリネット') + '</b> の楽譜で <b>' + N(w) + '</b> と書いてある。実際に 鳴る音は？', fig: one(w, 'treble'), ch: m.ch, a: m.a, ex: (hn ? 'F管は 書いた音より <b>完全5度 低く</b> 鳴る' : 'B♭管は 書いた音より <b>長2度 低く</b> 鳴る') + ' → ' + N(w) + ' は <b>' + N(snd) + '</b>。（だから楽譜は その分 高く書く）', exFig: { score: { clef: 'treble', notes: [{ k: M.str(w), d: 'w', lab: '楽譜：' + N(w) }, { k: M.str(snd), d: 'w', lab: '鳴る：' + N(snd), c: C.red }], sp: 80, ls: 12 } }, play: [[snd, 1.5]] };
    }
  };
  T.transChord = {
    u: 'u12', st: 2, gen: function (R) {
      var P = pick([[1, 4, 5, 1], [1, 6, 4, 5], [1, 5, 6, 4], [2, 5, 1, 1], [1, 4, 1, 5]], R), f = pick([2, 1, -1, -2, 3], R);
      var nm = function (k, d) { return keyChord(k, d).name; }, say = function (k) { return tx(P.map(function (d) { return nm(k, d); }).join('‐')); };
      var src = P.map(function (d) { return nm(0, d); }).join('‐');
      var allMaj = tx(P.map(function (d) { return M.name(M.diatonic(f, false, d)[0], 'en'); }).join('‐'));
      var m = mc(R, say(f), [say(f + 1), say(f - 1), say(-f), allMaj]);
      var iv = M.interval('C4', (function () { var t = M.keyTonic(f); t = { l: t.l, a: t.a, o: 4 }; if (M.midi(t) < 60) t.o = 5; return t; })());
      return { q: 'コード進行 <b class="en">' + src + '</b>（ハ長調）を <b>' + M.keyName(f) + '</b> に移調すると？', ch: m.ch, a: m.a, ex: 'ハ長調 → ' + M.keyName(f) + ' は <b>' + iv.name + ' 上</b>。どのコードも 根音を ' + iv.name + ' 上げ、m などの 種類は そのまま → <b>' + P.map(function (d) { return nm(f, d); }).join('‐') + '</b>。' };
    }
  };
  T.transBack = {
    u: 'u12', st: 2, gen: function (R) {
      var f = pick([1, 2, 3, -1, -2, -3], R), t = M.keyTonic(f); t = { l: t.l, a: t.a, o: 4 }; if (M.midi(t) < 60) t.o = 5;
      var iv = M.interval('C4', t), inv = M.ivName(9 - iv.deg, M.invQ[iv.q]), up = iv.deg >= 6; // 近い方へ 動かす
      var ans = up ? inv + ' 上げる' : iv.name + ' 下げる', alt = up ? iv.name + ' 下げても' : inv + ' 上げても';
      var others = ['長2度', '短3度', '長3度', '完全4度', '完全5度'].filter(function (x) { return x !== iv.name && x !== inv; });
      var m = mc(R, tx(ans), [tx(up ? inv + ' 下げる' : iv.name + ' 上げる')].concat(others.map(function (x) { return tx(x + (up ? ' 上げる' : ' 下げる')); })));
      return { q: '<b>' + M.keyName(f) + '</b> の曲を <b>ハ長調</b> に 移調する。どうする？', ch: m.ch, a: m.a, ex: '主音を ' + M.name(t, 'jp') + '（' + N(t) + '）から ハ（' + N('C4') + '）へ 動かす → <b>' + ans + '</b>（' + alt + ' 同じ調になる）。' };
    }
  };

  /* =================== 13 楽語と記号 =================== */
  var DYN = [['pp', 'ごく弱く'], ['p', '弱く'], ['mp', 'やや弱く'], ['mf', 'やや強く'], ['f', '強く'], ['ff', 'ごく強く']];
  T.dyn = {
    u: 'u13', st: 1, gen: function (R) {
      var x = pick(DYN, R);
      var m = mc(R, tx(x[1]), DYN.map(function (y) { return tw(y[1], '「' + y[1] + '」は ' + en(y[0]) + ' の 意味'); }));
      return { q: 'この強弱記号の 意味は？', fig: { c: 'dyn', a: { list: [x[0]], labs: [''] } }, ch: m.ch, a: m.a, ex: '<b>' + x[0] + '</b>＝' + x[1] + '。p は弱く、f は強く、m は「やや」。', exFig: { c: 'dyn' }, why: m.why };
    }
  };
  T.dynOrder = {
    u: 'u13', st: 2, gen: function (R) {
      // 6 つから 4 つ えらんで 並べる。となりを入れかえたもの・逆順が まちがい
      var all = ['pp', 'p', 'mp', 'mf', 'f', 'ff'], L = shuffle(all.slice(), R).slice(0, 4).sort(function (x, y) { return all.indexOf(x) - all.indexOf(y); }), up = R() < 0.6;
      if (!up) L.reverse();
      var j = function (a) { return a.join(up ? '＜' : '＞'); }, sw = function (i) { var c = L.slice(), t = c[i]; c[i] = c[i + 1]; c[i + 1] = t; return tx(j(c)); };
      var m = mc(R, tx(j(L)), [sw(0), sw(1), sw(2), tx(j(L.slice().reverse()))]);
      return { q: (up ? '弱い → 強い' : '強い → 弱い') + ' の順に 正しく並んでいるのは？', ch: m.ch, a: m.a, ex: '<b>' + j(L) + '</b>。全体は pp＜p＜mp＜mf＜f＜ff（m は「やや」なので p と f の あいだ）。', exFig: { c: 'dyn' } };
    }
  };
  T.hairpin = {
    u: 'u13', st: 1, gen: function (R) {
      var up = R() < 0.5, svg = '<svg viewBox="0 0 220 44" style="width:min(70%,320px);height:auto;color:var(--ink)"><path d="' + (up ? 'M6 22 L214 6 M6 22 L214 38' : 'M6 6 L214 22 L6 38') + '" stroke="currentColor" fill="none" stroke-width="2.4"/></svg>';
      var m = mc(R, tx(up ? 'だんだん強く（cresc.）' : 'だんだん弱く（dim.）'), [tx(up ? 'だんだん弱く（dim.）' : 'だんだん強く（cresc.）'), tx('その音を 目立たせて強く（アクセント）'), tx('だんだん速く（accel.）'), tx('だんだん遅く（rit.）')]);
      return { q: 'この記号の 意味は？', fig: { html: svg }, ch: m.ch, a: m.a, ex: up ? '口が <b>だんだん開いていく</b> → 音が大きくなる → <b>クレシェンド</b>（cresc.）。' : '口が <b>だんだん閉じていく</b> → 音が小さくなる → <b>デクレシェンド・ディミヌエンド</b>（decresc.・dim.）。アクセント（＞）は 1 つの音の上につく 小さな記号。', exFig: { c: 'dyn', a: { list: ['p', 'f'], labs: ['弱く', '強く'], hair: true } } };
    }
  };
  var TEMPO = [['Largo', '幅広く ゆるやかに'], ['Adagio', 'ゆるやかに'], ['Andante', '歩くような速さで'], ['Moderato', '中くらいの速さで'], ['Allegro', '速く'], ['Presto', '急速に'], ['Allegretto', 'やや速く'], ['Lento', 'ゆるやかに（おそく）']];
  T.tempo = {
    u: 'u13', st: 1, gen: function (R) {
      var x = pick(TEMPO.slice(0, 6), R);
      var m = mc(R, tx(x[1]), TEMPO.filter(function (y) { return y[0] !== 'Lento'; }).map(function (y) { return tw(y[1], '「' + y[1] + '」は ' + en(y[0]) + ' の 意味'); }));
      return { q: '<b class="en" style="font-style:italic">' + x[0] + '</b> の意味は？', ch: m.ch, a: m.a, ex: '<b>' + x[0] + '</b>＝' + x[1] + '。', exFig: { c: 'tempo' }, why: m.why };
    }
  };
  var TCH = [['rit.', 'だんだん遅く'], ['accel.', 'だんだん速く'], ['a tempo', 'もとの速さで'], ['rall.', 'だんだんゆるやかに'], ['Tempo I', '最初の速さで'], ['cresc.', 'だんだん強く'], ['dim.', 'だんだん弱く'], ['poco a poco', '少しずつ']];
  T.tempoChange = {
    u: 'u13', st: 2, gen: function (R) {
      var x = pick(TCH, R);
      var m = mc(R, tx(x[1]), TCH.map(function (y) { return tw(y[1], '「' + y[1] + '」は ' + en(y[0]) + ' の 意味'); }));
      return { q: '<b class="en" style="font-style:italic">' + x[0] + '</b> の意味は？', ch: m.ch, a: m.a, ex: '<b>' + x[0] + '</b>＝' + x[1] + '。', why: m.why };
    }
  };
  var ART = [['a.', 'スタッカート', '音を短く切って'], ['a-', 'テヌート', '音の長さを十分に保って'], ['a>', 'アクセント', 'その音を目立たせて強く'], ['a@a', 'フェルマータ', 'その音を ほどよく のばす']];
  T.artic = {
    u: 'u13', st: 1, gen: function (R) {
      var x = pick(ART, R), byName = R() < 0.5;
      var m = byName ? mc(R, tx(x[1]), ART.map(function (y) { return tw(y[1], y[1] + ' ＝ ' + y[2]); }).concat([tx('スラー'), tx('タイ')])) : mc(R, tx(x[2]), ART.map(function (y) { return tw(y[2], '「' + y[2] + '」は ' + y[1]); }));
      return { q: '赤い記号の ' + (byName ? '名前' : '意味') + 'は？', fig: { score: { clef: 'treble', notes: [{ k: 'G4', d: 'q', art: x[0], c: C.red }, { k: 'A4', d: 'q' }], sp: 60, noClef: false } }, ch: m.ch, a: m.a, ex: '<b>' + x[1] + '</b>：' + x[2] + '。', why: m.why };
    }
  };
  var EXP = [['dolce', '甘く やわらかに'], ['cantabile', '歌うように'], ['espressivo', '表情豊かに'], ['legato', 'なめらかに'], ['maestoso', '荘厳に'], ['grazioso', '優雅に'], ['con brio', '生き生きと'], ['leggiero', '軽く'], ['tranquillo', '静かに'], ['agitato', '激しく']];
  T.express = {
    u: 'u13', st: 2, gen: function (R) {
      var x = pick(EXP, R);
      var m = mc(R, tx(x[1]), EXP.map(function (y) { return tw(y[1], '「' + y[1] + '」は ' + en(y[0]) + ' の 意味'); }));
      return { q: '<b class="en" style="font-style:italic">' + x[0] + '</b> の意味は？', ch: m.ch, a: m.a, ex: '<b>' + x[0] + '</b>＝' + x[1] + '。', why: m.why };
    }
  };
  T.repeatOrder = {
    u: 'u13', st: 3, gen: function (R) {
      var L = [['basic', 'A B C B C D', ['A B C D', 'A B C A B C D', 'A B B C C D', 'A B C D B C']], ['volta', 'A B A C D', ['A B C D', 'A B A B C D', 'A B C A C D', 'A A B C D']], ['dc', 'A B C D A B', ['A B C D A B C D', 'A B C D', 'A B A B C D', 'A B C D C D']], ['ds', 'A B C D B C D', ['A B C D A B C D', 'A B C D', 'A B C D C D', 'A B C B C D']]];
      var x = pick(L, R);
      var m = mc(R, tx(x[1]), x[2].map(function (s) { return tx(s); }));
      return { q: 'この楽譜を 演奏する順は？（左から順に）', fig: { c: 'repeatQ', a: { kind: x[0] } }, ch: m.ch, a: m.a, ex: { basic: '𝄆〜𝄇 の間（B・C）を くり返す。', volta: '2回目は 1番カッコ（B）をとばして 2番カッコ（C）へ。', dc: 'D.C. で 始めにもどり、Fine で終わる。', ds: 'D.S. で 𝄋 にもどる。' }[x[0]] + ' → <b>' + x[1].split(' ').join('→') + '</b>。' };
    }
  };
  // 問題用：順番を書かない 反復の図
  F.CUSTOM.repeatQ = function (box, a) {
    var mk = function (lab, k) { return [{ k: k, d: 'w', lab: lab }]; };
    var bars = [mk('A', 'C5'), mk('B', 'D5'), mk('C', 'E5'), mk('D', 'F5')];
    if (a.kind === 'basic') { bars[1].beg = 'repeat'; bars[2].endBar = 'repeat'; }
    else if (a.kind === 'volta') { bars[0].beg = 'repeat'; bars[1].volta = ['begin', '1.']; bars[1].endBar = 'repeat'; bars[2].volta = ['begin', '2.']; }
    else if (a.kind === 'dc') { bars[1][0].top = 'Fine'; bars[1].endBar = 'double'; bars[3].rep = 'DC_AL_FINE'; }
    else { bars[1].repL = 'SEGNO_LEFT'; bars[3].rep = 'DS'; }
    M.score(box, { clef: 'treble', bars: bars, end: 'end', minBar: 92, sp: 40 });
  };

  /* =================== 14・15 楽語（楽語じてん terms.js から） =================== */
  var TM = GK.TERMS, syn = GK.termSyn;
  var en = function (t) { return '<i class="en" style="font-weight:700">' + t + '</i>'; };
  var tq = function (t) { return '<b class="en" style="font-style:italic">' + t.t + '</b>'; };
  var tex = function (t) { return '<b class="en" style="font-style:italic">' + t.t + '</b> <small>［' + t.r + '］</small>＝ ' + t.m + '。' + tnu(t); };
  // ニュアンスと 語源（terms_info.js）
  // 演奏家の イメージ（terms_pro.js）が あれば それを、なければ ニュアンスを 見せる
  var tnu = function (t) { return t.nu ? '<br><small>' + (t.ps ? '🎻 演奏家の イメージ：<b>' + t.ps + '</b>' : '💡 ' + t.nu) + (t.et ? '　🌱 ' + t.et + (t.en ? ' → <i class="en">' + t.en + '</i>' : '') : '') + '</small>' : ''; };
  var wt = function (x) { return '「' + x.m + '」は ' + en(x.t) + ' の 意味'; }, wm = function (x) { return en(x.t) + ' ＝ ' + x.m; };
  var inCats = function (cats) { return function (t) { return cats.indexOf(t.c) >= 0; }; };
  // 演習では まちがえた楽語（weakT）を 半分くらいの確率で 出す。クラス対戦では使わない（全員 同じ問題にするため）
  // （一度まちがえた言葉なので むずかしさの★に関係なく 出す）
  function pickTerm(cats, st, R) {
    var pool = tPool(cats, st);
    if (GK.Q.useWeak) { var w = GK.store.get('weakT', {}), wp = TM.filter(inCats(cats)).filter(function (t) { return w[t.t]; }); if (wp.length && R() < 0.5) pool = wp; }
    return pick(pool, R);
  }
  function tPool(cats, st) { var lv = Math.max(1, Math.min(3, st || 1)); return TM.filter(inCats(cats)).filter(function (t) { return t.lv <= lv; }); }
  // まちがいの選択肢：なるべく 同じ種類から（速さには速さ）
  function tOthers(t, cats) {
    var o = TM.filter(inCats(cats)).filter(function (x) { return x.m !== t.m && !syn(x.t, t.t); }), same = o.filter(function (x) { return x.c === t.c; }), ms = {};
    same.forEach(function (x) { ms[x.m] = 1; });
    return Object.keys(ms).length >= 3 ? same : o;
  }
  // mode：mean（楽語 → 意味）／rev（意味 → 楽語）／read（読み方）
  function termGen(cats, mode) {
    return function (R, st) {
      var t = pickTerm(cats, st, R), o = tOthers(t, cats), m;
      if (mode === 'rev') {
        m = mc(R, tx(en(t.t), t.t), o.map(function (x) { return tw(en(x.t), wm(x), x.t); }));
        return { q: '「<b>' + t.m + '</b>」を表す 楽語は？', ch: m.ch, a: m.a, ex: tex(t), why: m.why, term: t.t };
      }
      if (mode === 'read') {
        m = mc(R, tx(t.r), TM.filter(inCats(cats)).filter(function (x) { return x.r !== t.r; }).map(function (x) { return tw(x.r, '「' + x.r + '」は ' + en(x.t) + ' の 読み方'); }));
        return { q: tq(t) + ' の 読み方は？', ch: m.ch, a: m.a, ex: tex(t), why: m.why, term: t.t };
      }
      m = mc(R, tx(t.m), o.map(function (x) { return tw(x.m, wt(x)); }));
      return { q: tq(t) + ' の 意味は？', ch: m.ch, a: m.a, ex: tex(t), why: m.why, term: t.t };
    };
  }
  var C14 = ['tempo', 'tchg', 'dyn', 'aux'], C15 = ['expr', 'art', 'form'];
  // 英語の なかま：同じ語源の 英語から 楽語を当てる（または その逆）
  var EN_OK = function (t) { return t.en && /^[a-z]/i.test(t.en) && !/^(and|but|turn|accent|not too much|little by little)$/.test(t.en); };
  var enKey = function (t) { return t.en.split(/[・（ ]/)[0].replace(/-$/, ''); };
  function etymGen(cats) {
    return function (R, st) {
      var pool = TM.filter(inCats(cats)).filter(EN_OK).filter(function (t) { return t.lv <= Math.max(2, st); }), t = pick(pool, R), k = enKey(t);
      var others = TM.filter(inCats(cats)).filter(function (x) { return x !== t && !syn(x.t, t.t) && (!x.en || x.en.indexOf(k) < 0) && (!t.en || !x.en || t.en.indexOf(enKey(x)) < 0); });
      if (R() < 0.5) {
        var m = mc(R, tx(en(t.t), t.t), others.map(function (x) { return tw(en(x.t), wm(x), x.t); }));
        return { q: '英語の <b class="en">' + t.en + '</b> と 同じ 語源（なかま）の 楽語は？', ch: m.ch, a: m.a, why: m.why, ex: tex(t), term: t.t };
      }
      var o2 = others.filter(EN_OK);
      var m2 = mc(R, tx('<i class="en">' + t.en + '</i>', t.en), o2.map(function (x) { return tw('<i class="en">' + x.en + '</i>', '<i class="en">' + x.en + '</i> は ' + en(x.t) + '（' + x.m + '）の なかま', x.en); }));
      return { q: tq(t) + '（' + t.m + '）と 同じ 語源の 英語は？', ch: m2.ch, a: m2.a, why: m2.why, ex: tex(t), term: t.t };
    };
  }
  T.tmMean = { u: 'u14', st: 1, gen: termGen(['tempo', 'tchg', 'dyn'], 'mean') };
  T.tmRev = { u: 'u14', st: 1, gen: termGen(['tempo', 'tchg', 'dyn'], 'rev') };
  T.auxMean = { u: 'u14', st: 1, gen: termGen(['aux'], 'mean') };
  T.read14 = { u: 'u14', st: 2, gen: termGen(C14, 'read') };
  T.etym14 = { u: 'u14', st: 2, gen: etymGen(C14) };
  // 教科書の 一言の 奥にある、演奏家の イメージ
  T.proQ = {
    u: 'u13', st: 2, gen: function (R) {
      var pool = TM.filter(function (t) { return t.ps; }), t = pick(pool, R);
      if (t.t === 'fermata' || R() < 0.15) {
        t = GK.termByName('fermata');
        var m0 = mc(R, tx('バス停（停留所）'), ['とまり木', '信号', '線路', '終電'].map(function (x) { return tx(x); }));
        return { q: '教科書では「ほどよく のばす」と 習う <b>fermata（𝄐）</b>。イタリア語で ふだんは 何の意味？', ch: m0.ch, a: m0.a, ex: '<b>fermata ＝ 停留所・バス停</b>。' + t.pl, term: t.t };
      }
      var m = mc(R, tx(t.ps), pool.filter(function (x) { return x !== t && !syn(x.t, t.t); }).map(function (x) { return tw(x.ps, '「' + x.ps + '」は ' + en(x.t) + ' の イメージ'); }));
      return { q: '教科書では「' + t.m + '」と 習う ' + tq(t) + '。演奏家の イメージに 近いのは？', ch: m.ch, a: m.a, why: m.why, ex: '<b>' + t.ps + '</b>。' + t.pl, term: t.t };
    }
  };
  T.etym15 = { u: 'u15', st: 2, gen: etymGen(C15) };
  T.exMean = { u: 'u15', st: 1, gen: termGen(['expr'], 'mean') };
  T.exRev = { u: 'u15', st: 2, gen: termGen(['expr'], 'rev') };
  T.artMean = { u: 'u15', st: 1, gen: termGen(['art', 'form'], 'mean') };
  T.artRev = { u: 'u15', st: 2, gen: termGen(['art', 'form'], 'rev') };
  T.read15 = { u: 'u15', st: 2, gen: termGen(C15, 'read') };

  // いちばん速い・遅い（順番が 本によってちがう組は いっしょに出さない）
  T.tmFast = {
    u: 'u14', st: 2, gen: function (R) {
      var slow = ['Grave', 'Largo', 'Lento', 'Adagio'], rest = ['Andante', 'Moderato', 'Allegretto', 'Allegro', 'Vivace', 'Presto', 'Prestissimo'], L;
      do { L = shuffle([pick(slow, R)].concat(shuffle(rest.slice(), R).slice(0, 3)), R); } while (L.indexOf('Allegro') >= 0 && L.indexOf('Vivace') >= 0);
      var ts = L.map(GK.termByName), fast = R() < 0.5, srt = ts.slice().sort(function (a, b) { return a.rank - b.rank; }), ans = fast ? srt[3] : srt[0];
      return { q: 'いちばん <b>' + (fast ? '速い' : '遅い') + '</b> のは？', ch: ts.map(function (t) { return en(t.t); }), a: ts.indexOf(ans), ex: srt.map(function (t) { return '<b class="en" style="font-style:italic">' + t.t + '</b>' + (t === ans ? '（' + t.m + '）' : ''); }).join(' ＜ ') + '（遅い → 速い）。' };
    }
  };
  // 強弱：いちばん強い・弱い
  var DYN8 = ['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff'];
  T.dynLoud = {
    u: 'u14', st: 1, gen: function (R, st) {
      var pool = st >= 2 ? DYN8 : DYN8.slice(1, 7), L = shuffle(shuffle(pool.slice(), R).slice(0, 4), R), loud = R() < 0.5;
      var srt = L.slice().sort(function (a, b) { return DYN8.indexOf(a) - DYN8.indexOf(b); }), ans = loud ? srt[3] : srt[0];
      return { q: 'いちばん <b>' + (loud ? '強い' : '弱い') + '</b> のは？', ch: L.map(function (d) { return '<b class="en" style="font-style:italic;font-size:1.3em">' + d + '</b>'; }), a: L.indexOf(ans), ex: srt.join(' ＜ ') + '（弱い → 強い）。p が多いほど弱く、f が多いほど強い。m は「やや」。', exFig: { c: 'dyn', a: { list: srt, labs: srt.map(function (d) { return GK.TERMS.filter(function (t) { return t.c === 'dyn' && GK.termShort(t.t) === d; })[0].m; }) } } };
    }
  };
  // 強弱記号（ppp・fff・sf・sfz・fp・rfz）
  T.dynSym = {
    u: 'u14', st: 2, gen: function (R) {
      var L = [['ppp', 'ppp（pianississimo）'], ['fff', 'fff（fortississimo）'], ['sf', 'sforzando（sf・sfz）'], ['sfz', 'sforzando（sf・sfz）'], ['fp', 'fp（forte piano）'], ['rfz', 'rinforzando（rf・rfz）']];
      var x = pick(L, R), t = GK.termByName(x[1]);
      var m = mc(R, tx(t.m), tOthers(t, ['dyn']).map(function (y) { return tw(y.m, wt(y)); }));
      return { q: 'この強弱記号の 意味は？', fig: { c: 'dyn', a: { list: [x[0]], labs: [''] } }, ch: m.ch, a: m.a, ex: '<b class="en" style="font-style:italic">' + x[0] + '</b> ＝ ' + t.t + '（' + t.r + '）＝ ' + t.m + '。', why: m.why, term: t.t };
    }
  };
  // 組み合わせの言葉
  var ABBR = {};
  TM.forEach(function (t) { ABBR[GK.termShort(t.t)] = t; var p = /（(.*)）$/.exec(t.t); if (p) p[1].split('・').forEach(function (a) { ABBR[a] = t; }); });
  ABBR['cresc.'] = GK.termByName('crescendo（cresc.）'); ABBR['dim.'] = GK.termByName('diminuendo（dim.）');
  function gloss(ph) {
    var w = ph.split(' '), out = [];
    for (var i = 0; i < w.length; i++) {
      var two = w[i] + ' ' + w[i + 1], three = two + ' ' + w[i + 2];
      if (ABBR[three]) { out.push([three, ABBR[three]]); i += 2; } else if (ABBR[two]) { out.push([two, ABBR[two]]); i++; } else out.push([w[i], ABBR[w[i]]]);
    }
    return out.map(function (x) { return '<b class="en" style="font-style:italic">' + x[0] + '</b>' + (x[1] ? '（' + x[1].m + '）' : ''); }).join(' ＋ ');
  }
  T.phrase = {
    u: 'u14', st: 2, gen: function (R) {
      var x = pick(GK.TERM_PHRASE, R);
      var m = mc(R, tx(x[1]), GK.TERM_PHRASE.map(function (y) { return tw(y[1], '「' + y[1] + '」は ' + en(y[0])); }));
      return { q: tq({ t: x[0] }) + ' の 意味は？', ch: m.ch, a: m.a, ex: gloss(x[0]) + ' → <b>' + x[1] + '</b>。', why: m.why };
    }
  };
  // 何を表す言葉？
  var CATN = { tempo: '速さ', tchg: '速さ', dyn: '強弱', expr: '曲の気分（発想）', art: 'ひき方（奏法）', aux: '補助語（組み合わせる言葉）', form: '反復・構成' };
  var CAT_NG = ['Grave', 'Vivace', 'morendo', 'smorzando', 'calando', 'allargando', 'sostenuto', 'sotto voce', 'con moto', 'leggiero', 'tutti', 'solo', 'divisi（div.）', '8va（ottava）', 'loco', 'simile', 'pesante', 'marziale', 'legato'];
  function catGen(cats) {
    return function (R, st) {
      var t = pick(tPool(cats, st).filter(function (x) { return CAT_NG.indexOf(x.t) < 0; }), R);
      var all = ['速さ', '強弱', '曲の気分（発想）', 'ひき方（奏法）', '補助語（組み合わせる言葉）', '反復・構成'];
      var m = mc(R, tx(CATN[t.c]), all.map(function (c) { return tx(c); }));
      return { q: tq(t) + ' は 何を表す言葉？', ch: m.ch, a: m.a, ex: tex(t) + ' → <b>' + CATN[t.c] + '</b>。' };
    };
  }
  T.cat14 = { u: 'u14', st: 2, gen: catGen(C14) };
  T.cat15 = { u: 'u15', st: 2, gen: catGen(C15) };
  // 反対の意味
  function oppGen(cats) {
    var pairs = GK.TERM_OPP.filter(function (p) { return p.every(function (n) { return cats.indexOf(GK.termByName(n).c) >= 0; }); });
    var inPair = [].concat.apply([], GK.TERM_OPP);
    return function (R) {
      var pr = pick(pairs, R), k = R() < 0.5 ? 0 : 1, a = GK.termByName(pr[k]), b = GK.termByName(pr[1 - k]);
      var wr = TM.filter(inCats(cats)).filter(function (x) { return inPair.indexOf(x.t) < 0 && !syn(x.t, a.t) && !syn(x.t, b.t); });
      var m = mc(R, tx(en(b.t), b.t), wr.map(function (x) { return tw(en(x.t), wm(x), x.t); }));
      return { q: tq(a) + '（' + a.m + '）と <b>反対</b>の意味の言葉は？', ch: m.ch, a: m.a, ex: tex(a) + '<br>' + tex(b), why: m.why, term: a.t };
    };
  }
  T.opp14 = { u: 'u14', st: 2, gen: oppGen(C14) };
  T.opp15 = { u: 'u15', st: 2, gen: oppGen(C15) };
  // 曲の気分に合う言葉
  var MOOD_NG = ['espressivo', 'cantabile', 'con moto', 'misterioso', 'semplice', 'pastorale', 'marziale', 'lamentoso', 'leggiero'];
  T.mood = {
    u: 'u15', st: 2, gen: function (R) {
      var gi = ri(0, 2, R), ok = function (n) { return MOOD_NG.indexOf(n) < 0; };
      var right = pick(GK.TERM_MOOD[gi][1].filter(ok), R), t = GK.termByName(right);
      var wr = []; GK.TERM_MOOD.forEach(function (g, i) { if (i !== gi) wr = wr.concat(g[1].filter(ok)); });
      var m = mc(R, tx(en(right), right), wr.map(function (n) { return tw(en(n), wm(GK.termByName(n)), n); }));
      var ws = m.ch.filter(function (_, i) { return i !== m.a; }).map(function (c) { var x = GK.termByName(c.replace(/<[^>]+>/g, '')); return '<i class="en">' + x.t + '</i>＝' + x.m; });
      return { q: '「<b>' + GK.TERM_MOOD[gi][0] + '</b>」感じの曲に 合う言葉は？', ch: m.ch, a: m.a, ex: tex(t) + '<br><small>ほか：' + ws.join('、') + '</small>', why: m.why, term: right };
    }
  };
  // 奏法・装飾の記号
  var ASYM = [['a.', 'staccato', 'スタッカート'], ['av', 'staccatissimo', 'スタッカーティッシモ'], ['a-', 'tenuto', 'テヌート'], ['a>', 'accent', 'アクセント'], ['a^', 'marcato', 'マルカート'], ['a@a', 'fermata', 'フェルマータ'], ['tr', 'tr（trillo）', 'トリル', 1], ['mordent', 'mordent', 'モルデント', 1], ['mordent_inverted', 'pralltriller', 'プラルトリラー', 1], ['turn', 'turn', 'ターン', 1]];
  T.artSym = {
    u: 'u15', st: 2, gen: function (R, st) {
      var pool = ASYM.filter(function (x) { return st >= 3 || !x[3] || x[0] === 'tr'; }), x = pick(pool, R), t = GK.termByName(x[1]);
      var m = mc(R, tx(x[2]), ASYM.map(function (y) { return tw(y[2], y[2] + ' ＝ ' + GK.termByName(y[1]).m); }));
      var n = { k: x[3] ? 'D5' : 'G4', d: 'q', c: C.red }; if (x[3]) n.orn = x[0]; else n.art = x[0];
      return { q: '赤い音符の 記号の 名前は？', fig: { score: { clef: 'treble', notes: [n, { k: 'C5', d: 'q' }], sp: 60 } }, ch: m.ch, a: m.a, ex: '<b>' + x[2] + '</b>（<i class="en">' + GK.termShort(t.t) + '</i>）＝ ' + t.m + '。', why: m.why, term: t.t };
    }
  };

  /* =========================================================
     出題
     ========================================================= */
  // 🎤 まちがえたときに 見せる 覚え方（授業の「覚え方」カードと 同じ 合言葉）
  var TIPS = {};
  [
  ['readT,findNote,ledgerN', 'ト音記号の 線は「ミソシレファ」、間は「ファラドミ」'],
  ['readB', 'ヘ音記号の 線は「ソシレファラ」、間は「ラドミソ」'],
  ['readA', 'アルト記号は まん中の 第3線が 中央のド'],
  ['readTn', 'テノール記号は 第4線が 中央のド（アルト記号を 1 線 上にずらした形）'],
  ['readC,cClefMid,cClefName,cClefInst,cClefSame', 'ハ音記号は「ドを 指さす矢印」（アルト 第3線・テノール 第4線）'],
  ['grandSame', '中央のドは ト音記号でも ヘ音記号でも 加線 1 本'],
  ['nameSys', 'ドレミ ＝ ハニホ ＝ CDE。ト音記号の「ト」は ソ（G）'],
  ['durName,durBeats,durCount,durSum,longest,beatCount', 'はたが 1 本ふえるごとに 半分。付点は 自分の半分を おまけ'],
  ['restName,restBeats', '全休符は 重いから ぶら下がる、2分休符は 軽いから のっかる'],
  ['timeMean,eighthCount,timeFit,missing,barError', '拍子記号は 下が「何分音符」、上が「いくつ」'],
  ['timeKind', '6/8 は「タタタ・タタタ」の 2 拍子（3 つずつ まとまる ＝ 複合拍子）'],
  ['strong', '1 拍目は いつも 主役。4 拍子は ドン・タ・トン・タ'],
  ['tieSlur,tieLen', '同じ高さ（たいら）なら タイ、ちがう高さは スラー'],
  ['tripletQ', '3連符 ＝ 2 人用の席に 3 人'],
  ['synco', 'シンコペーション ＝ 強い拍を 先取りする「食い気味」のリズム'],
  ['pickup,pickupBeat', '弱起は パズルの 2 ピース：最初と最後で 1 小節'],
  ['rhythmEar', '音の数を 数えてから、長い音が どこにあるかを 聴く'],
  ['accName,jpAcc,accKbd', '♯ は「えい（嬰）！」と 半音 持ち上げる、♭ は「へん（変）」に 半音 へこむ'],
  ['halfWhole', 'ミ‐ファ・シ‐ド は 仲良しペア（白鍵どうしでも 半音）'],
  ['enharm,kbdName', '黒鍵は 左の白鍵の ♯、右の白鍵の ♭'],
  ['dblAcc', '𝄪・𝄫 は 鍵盤 2 つ分（全音）動く'],
  ['accRule', '臨時記号は その小節だけの 1日パス'],
  ['ivDeg', '両はしも 数える（ド〜ソ は ド・レ・ミ・ファ・ソ で 5 度）'],
  ['ivName,ivBuild,ivSemis,ivWider,ivQual,ivEar', '半音の数：短3度＝3、長3度＝4、完全4度＝5、完全5度＝7'],
  ['ivInv', '転回は「9 から引いて、長短 入れかえ」。完全は 完全のまま'],
  ['majPattern,majWrong,majFill,majHalf,majSharps,scaleName', '長音階は「2 つと半、3 つと半」（全全半・全全全半）'],
  ['degreeName', '5 番目 属音、4 番目 下属音、7 番目 導音（主音へ みちびく）'],
  ['minType,minSteps,minMel,minName', '旋律短音階は「行きは よいよい、帰りは 自然」'],
  ['minLead', '和声短音階は 7 を上げて 導音を作る'],
  ['minEar,majMinEar,chordEar', '明るい・暗いは 3 番目の音で 決まる'],
  ['keyMaj,keySig,sigCount', '♯ の調は「ト・ニ・イ・ホ・ロ」、♭ の調は「ヘ・変ロ・変ホ・変イ」'],
  ['keyOrderQ', '♯ は「ファドソレラミシ」、♭ は 逆から「シミラレソドファ」'],
  ['keyMin,related,relMin,melKey', '短調は 長調の主音から 下へ「ド・シ・ラ」と 3 つ'],
  ['triadType,triadBuild,chordTones,seventh', '下が 長3度なら 明るい、短3度なら 暗い。増は ふくらむ、減は しぼむ'],
  ['isTriad', '三和音は だんご 3 兄弟（線・線・線 か 間・間・間）'],
  ['inversion,chordRoot', '転回形は「いちばん下に だれが いるか」。根音は だんごに 並べ直して 探す'],
  ['chordName,nameToChord', 'コードネームは 大文字 ＝ 根音、m ＝ 短、7 ＝ 短7度を トッピング'],
  ['roman,chordInKey', '長調では Ⅰ・Ⅳ・Ⅴ が 長、Ⅱ・Ⅲ・Ⅵ が 短、Ⅶ が 減'],
  ['func,funcName,cadence,cadenceEar', 'Ⅰ＝おうち、Ⅳ＝おでかけ、Ⅴ＝帰りたい。Ⅴ→Ⅰ は「ただいま！」'],
  ['transNote,transMelody,transInterval,transBack,transChord', '移調は 全員そろって 同じ歩数で 引っこし'],
  ['transKey,transInst', '楽譜の「ド」で 楽器の名前の音が 鳴る（B♭管 → シ♭、F管 → ファ）'],
  ['dyn,dynOrder,dynLoud,dynSym', 'p ＝ ひそひそ、f ＝ フォース（力）、m ＝ まあまあ'],
  ['hairpin', '＜ は 口が開く（だんだん強く）、＞ は 口が閉じる（だんだん弱く）'],
  ['tempo,tmFast', '速さの はしご：Largo 寝そべる → Andante 歩く → Allegro 走る → Presto ダッシュ'],
  ['tempoChange', 'accel. ＝ アクセル、rit. ＝ ブレーキ、a tempo ＝ もとの速さ'],
  ['tmMean,tmRev,read14,cat14,opp14', '-issimo ＝ とても、-etto・-ino ＝ ちょっと ひかえめ'],
  ['auxMean,phrase', 'molto もりもり、poco ぽこっと少し、subito すぐ、sempre ずっと'],
  ['express,exMean,exRev,mood,read15,cat15,etym14,etym15,proQ', '英語や カタカナ語の 親戚を 探そう（dolce ＝ スイーツ、maestoso ＝ マエストロ）'],
  ['artic,artSym,artMean,artRev,opp15', '点 ＝ 短く、線 ＝ 十分 のばす、＞ ＝ 強く。pizz. は つまんで ピッ'],
  ['repeatOrder', 'D.C. ＝ 頭（カーポ）へ、D.S. ＝ 𝄋 へ、Fine ＝ フィニッシュ']
  ].forEach(function (x) { x[0].split(',').forEach(function (id) { TIPS[id] = x[1]; }); });
  GK.Q = { T: T };
  GK.Q.TIPS = TIPS;
  GK.Q.util = { mc: mc, tx: tx, tw: tw, pick: pick, ri: ri, shuffle: shuffle, N: N, add: function (id, u, st, gen) { T[id] = { u: u, st: st, gen: gen, id: id }; } };
  GK.Q.addTips = function (m) { Object.keys(m).forEach(function (k) { m[k].split(',').forEach(function (id) { TIPS[id] = k; }); }); };
  Object.keys(T).forEach(function (k) { T[k].id = k; });
  // 1 問つくる
  GK.Q.make = function (id, R, st) {
    var t = T[id], s = st || t.st;
    var q = t.gen(R, s);
    q.t = id; q.u = t.u; q.st = Math.max(t.st, Math.min(3, s)); q.ear = !!(t.ear || q.ear);
    // 楽語は 解説に 語源（いちばんの 覚え方）が 入るので 覚え方の 一言は 省く
    if (!q.tip && TIPS[id] && !(q.term && GK.termByName(q.term) && GK.termByName(q.term).nu)) q.tip = TIPS[id];
    return q;
  };
  // 同じ問題（問題文と答えが同じ）が 続けて出ないように 作り直す。seen：これまでに出した問題
  GK.Q.sig = function (q) { var c = q.ch[q.a]; return q.t + '|' + q.q + '|' + (c && c.fig ? JSON.stringify(c.k) : c) + '|' + (q.fig ? JSON.stringify(q.fig) : '') + '|' + (q.ear && q.exFig ? JSON.stringify(q.exFig) : ''); };
  GK.Q.fresh = function (id, R, st, seen) {
    var q;
    for (var k = 0; k < 6; k++) { q = GK.Q.make(id, R, st); if (!seen[GK.Q.sig(q)]) break; }
    seen[GK.Q.sig(q)] = 1;
    return q;
  };
  GK.Q.typesOf = function (uids, noEar) {
    var r = [];
    uids.forEach(function (u) { (GK.UNIT[u].types || []).forEach(function (id) { if (T[id] && !(noEar && T[id].ear)) r.push(id); }); });
    return r;
  };
  // n 問：種類を まんべんなく、だんだん むずかしく
  GK.Q.set = function (uids, n, R, o) {
    o = o || {};
    var types = GK.Q.typesOf(uids, o.noEar), bag = [], out = [], last = null, err = 0, seen = {};
    if (o.types) types = o.types.slice();
    GK.Q.useWeak = !!o.weak;
    for (var i = 0; i < n; i++) {
      if (!bag.length) bag = shuffle(types.slice(), R);
      var id = bag.pop(); if (id === last && bag.length) { bag.unshift(id); id = bag.pop(); }
      last = id;
      var st = o.stFn ? o.stFn(i) : o.st || (o.ramp ? Math.min(3, 1 + Math.floor(i * 3 / n)) : T[id].st);
      try { out.push(GK.Q.fresh(id, R, Math.max(T[id].st, st), seen)); } catch (e) { console.error(id, e); if (++err < 50) i--; }
    }
    GK.Q.useWeak = false;
    return out;
  };
})();
