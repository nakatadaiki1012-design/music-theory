/* =========================================================
   楽典ラボ：和声ラボ（4 声を 書いて 自動採点・ガイドつき）
   ・ソプラノ課題／バス課題：与えられた 声部に 合わせて 残りの 声を 書く
   ・自由入力：調と 和音記号を えらんで 4 声を 全部 書く
   ・自分で出題：ソプラノ（バス）の メロディーを 入れて 課題にする
   書き方：五線を タップ ／ 「いま書く 音」の 候補ボタン を えらぶ
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, $ = GK.$, esc = GK.esc, V = GK.view;
  var N = function (p) { return GK.nm(p); };
  var mid = function (p) { return M.midi(p); };
  var same = function (a, b) { return a.l === b.l && a.a === b.a; };
  var Ch = function (d, inv, sev, nine) { return { d: d, inv: inv || 0, sev: !!sev || !!nine, nine: !!nine }; };
  var CHL = [];
  for (var dd = 1; dd <= 7; dd++) { [0, 1, 2].forEach(function (iv) { CHL.push(Ch(dd, iv)); }); [0, 1, 2, 3].forEach(function (iv) { CHL.push(Ch(dd, iv, true)); }); if (dd === 5) CHL.push(Ch(5, 0, true, true)); }
  var chKey = function (c) { return c.d + ',' + c.inv + ',' + (c.nine ? 2 : c.sev ? 1 : 0); };
  var chName = function (c) { return H.ROMAN[c.d] + ' ' + (c.nine ? '九の和音（Ⅴ₉）' : c.sev ? ['七の和音', '五六の和音', '三四の和音', '二の和音'][c.inv] : ['基本形', '六の和音（第1転回）', '四六の和音（第2転回）'][c.inv]); };
  var STEPS = [0, 2, 4, 5, 7, 9, 11];
  var VCN = ['S', 'A', 'T', 'B'], VJP = ['ソプラノ', 'アルト', 'テノール', 'バス'];
  var ACC = [[null, '自動'], [1, '♯'], [-1, '♭'], [0, '♮']];
  var FUNC = { 1: 'T', 2: 'S', 3: 'T', 4: 'S', 5: 'D', 6: 'T', 7: 'D' };
  var ROLE = ['根', '3', '5', '7', '9'];

  var MODES = [
    ['sop', '🔴 ソプラノ課題', 'メロディー（ソプラノ）が 与えられる。アルト・テノール・バスを 書く'],
    ['bass', '🟣 バス課題', '低い声（バス）が 与えられる。ソプラノ・アルト・テノールを 書く'],
    ['free', '✏️ 自由入力', '調と 和音を えらんで、4 声を ぜんぶ 自分で 書く'],
    ['make', '🛠 自分で出題', 'ソプラノ（バス）の メロディーを 五線に 入れて 課題にする']
  ];
  var AIM = {
    1: '共通音は そのまま 保つ。共通音が ないときは 上の 3 声を バスと 反対向きに 動かそう。',
    2: '転回形や Ⅱ・Ⅵ も 出てくる。導音は 主音へ 上がる ことを わすれずに。',
    3: 'Ⅴ₇ と 転回形。第7音は 2度 下へ、導音は 半音 上へ。'
  };
  // ルールの 一覧（チェックリスト）
  var RULES = [
    { g: '1 つの 和音', id: 'range', s: '音域', ks: ['range'], t: '音域', tip: '音域：S ド4〜ソ5・A ソ3〜レ5・T ド3〜ソ4・B ファ2〜ド4。' },
    { id: 'tone', s: '和音の音', ks: ['tone', 'bass'], t: '和音の 音・バスの 音', tip: '4 声は すべて その 和音の 音。バスは 転回形で きまる 音（基本形は 根音）。' },
    { id: 'comp', s: 'そろい', ks: ['incomplete', 'dblLT', 'dbl7'], t: '音が そろう・重ねてよい音', tip: '根音・第3音・第5音を そろえる（第5音は 省略できる ことも）。導音と 第7音は 重ねない。' },
    { id: 'order', s: '声部の順', ks: ['cross', 'space'], t: '声部の 順番・間隔', tip: '上から S・A・T・B。交差しない。S‐A、A‐T は 1 オクターブ 以内。' },
    { g: '和音の つなぎ', id: 'par', s: '連続5・8度', ks: ['p5', 'p8'], t: '連続5度・連続8度', tip: '2 つの 声が 同じ向きに 5度 → 5度、8度 → 8度 と 進むのは 禁止。' },
    { id: 'res', s: '解決', ks: ['lt', 'sev'], t: '導音・第7音の 解決', tip: '導音は 半音 上の 主音へ。第7音は 2度 下へ。', need: function (t) { return t.chs.some(function (c, i) { return (c.d === 5 || c.d === 7 || c.sev) && i < t.chs.length - 1; }); } },
    { id: 'move', s: '跳躍', ks: ['leap', 'aug'], t: '跳躍・増減の 音程', tip: '1 オクターブを こえる 跳躍、増2度などの 動きは さける。' },
    { g: '注意（⚠ ふつうは さける）', id: 'warn', s: '注意', ks: ['hidden', 'overlap', 'dblThird'], t: '隠伏・声部の 重なり・第3音の 重複', tip: 'ソプラノと バスが 同じ向きに 5度・8度へ（隠伏）、声部が 前の 位置を こえる、第3音を 重ねる ―― ふつうは さける。' }
  ];
  // 単元ごとの 実践課題に つかう 進行（H.PROGS の name）
  var UP = {
    h01: ['Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ'], h02: ['Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅰ‐Ⅴ‐Ⅰ'], h03: ['Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅰ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅵ‐Ⅳ‐Ⅴ‐Ⅰ'], h04: ['Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅵ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅴ₇‐Ⅰ'],
    h05: ['Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅰ₆₄‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅵ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ₆‐Ⅴ‐Ⅵ'], h06: ['Ⅰ‐Ⅴ₆‐Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ₆‐Ⅴ‐Ⅵ', 'Ⅰ‐Ⅰ₆‐Ⅳ‐Ⅴ₇‐Ⅰ'], h07: ['Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅴ₇‐Ⅰ'],
    h08: ['Ⅰ‐Ⅵ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅱ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅴ₇‐Ⅰ', 'Ⅰ‐Ⅵ‐Ⅱ‐Ⅴ₇‐Ⅰ'], h09: ['Ⅰ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅵ‐Ⅳ‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅴ₇‐Ⅰ', 'Ⅰ‐Ⅱ‐Ⅴ‐Ⅰ'],
    h10: ['Ⅰ‐Ⅴ₆₅‐Ⅰ', 'Ⅰ‐Ⅴ₄₃‐Ⅰ', 'Ⅰ‐Ⅴ₄₂‐Ⅰ₆'], h11: ['Ⅰ‐Ⅴ₆₄‐Ⅰ₆（経過）', 'Ⅰ‐Ⅳ₆₄‐Ⅰ（補助）', 'Ⅰ‐Ⅳ‐Ⅰ₆₄‐Ⅴ‐Ⅰ'],
    h12: ['Ⅰ‐Ⅱ₇‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅱ₆₅‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅱ₇‐Ⅴ₇‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅶ₆₅‐Ⅰ', 'Ⅰ‐Ⅵ‐Ⅳ₇‐Ⅴ‐Ⅰ'], h13: ['Ⅰ‐Ⅳ‐Ⅴ₉‐Ⅰ', 'Ⅰ‐Ⅱ‐Ⅴ₉‐Ⅰ', 'Ⅰ‐Ⅵ‐Ⅴ₉‐Ⅰ'],
    h14: ['Ⅰ‐Ⅳ‐Ⅴ₇‐Ⅰ', 'Ⅰ‐Ⅵ‐Ⅱ‐Ⅴ₇‐Ⅰ', 'Ⅰ‐Ⅱ₇‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅳ‐Ⅰ₆₄‐Ⅴ‐Ⅰ', 'Ⅰ‐Ⅴ₆₅‐Ⅰ', 'Ⅰ‐Ⅰ₆‐Ⅳ‐Ⅴ₇‐Ⅰ']
  };
  var unitProgs = function (u) { var nm = UP[u] || []; return H.PROGS.filter(function (p) { return nm.indexOf(p.name) >= 0; }); };
  var sk = function () { return S.unit ? S.mode + '@' + S.unit : S.mode; };
  var STORE = function () { return GK.store.get('hlab', {}); };
  var S = (function () { var o = STORE(); return { mode: o.mode || (o.type === 'bass' ? 'bass' : o.type === 'free' ? 'free' : 'sop'), lv: o.lv || 1, adv: o.adv || 'voice', kbd: !!o.kbd, snap: o.snap !== false, fk: o.fk, fm: o.fm, fc: o.fc, mv: o.mv, unit: null, ses: {} }; })();
  var save = function () { GK.store.set('hlab', { mode: S.mode, lv: S.lv, adv: S.adv, kbd: S.kbd, snap: S.snap, fk: S.fk, fm: S.fm, fc: S.fc, mv: S.mv }); };
  var stat = function () { return GK.store.get('hlabStat', { clears: 0, perfect: 0 }); };

  function pick(a, R) { return a[Math.floor(R() * a.length)]; }
  function defaultVoices(key, minor, chs, gv, given) {
    return chs.map(function (ch, i) {
      return [0, 1, 2, 3].map(function (j) {
        if (given && j === gv) return given[i][j];
        var L = H.voicePitches(key, minor, ch, j), m = (mid(H.RANGE[j][0]) + mid(H.RANGE[j][1])) / 2, b = L[0];
        L.forEach(function (x) { if (Math.abs(mid(x.p) - m) < Math.abs(mid(b.p) - m)) b = x; });
        return b.p;
      });
    });
  }
  var firstFree = function (gv, from) { for (var j = from || 0; j < 4; j++) if (j !== gv) return j; return 0; };
  function newSession(mode) {
    var Z;
    if (mode === 'sop' || mode === 'bass') {
      var R = GK.rng(Math.floor(Math.random() * 1e9)), minor = S.lv >= 2 && R() < 0.3, ok = H.PROGS.filter(function (p) { return p.lv <= S.lv && p.lv >= Math.max(1, S.lv - 1) && !(minor && p.majorOnly); });
      if (S.unit) { minor = S.unit === 'h09' || (S.unit === 'h14' && R() < 0.25); ok = unitProgs(S.unit).filter(function (p) { return !(minor && p.majorOnly); }); if (!ok.length) ok = unitProgs(S.unit); }
      var key = pick(minor ? H.KEYS.min : H.KEYS.maj, R), pr = pick(ok, R), model = null;
      for (var t = 0; t < 6 && !model; t++) { model = H.solve(key, minor, pr.chs, null, R); if (!model) pr = pick(ok, R); }
      var gv = mode === 'bass' ? 3 : 0;
      Z = { t: { key: key, minor: minor, name: pr.name, chs: pr.chs, model: model, gv: gv, lv: S.lv, unit: S.unit || null }, v: defaultVoices(key, minor, pr.chs, gv, model) };
    } else {
      var k = S.fk != null ? S.fk : 0, mn = !!S.fm, cs = (S.fc || [Ch(1), Ch(4), Ch(5), Ch(1)]).map(function (c) { return Object.assign({}, c); });
      if (mode === 'make' && S.mv == null) S.mv = 0;
      Z = { t: { key: k, minor: mn, name: mode === 'make' ? '出題づくり' : '自由入力', chs: cs, model: null, gv: -1, free: mode === 'free', make: mode === 'make' }, v: defaultVoices(k, mn, cs, -1, null) };
    }
    Z.sel = { i: 0, j: Z.t.make ? S.mv : firstFree(Z.t.gv) }; Z.hint = 0; Z.hints = 0; Z.acc = null; Z.open = null; Z.show = false; Z.done = false; Z.paid = false; Z.msg = '';
    S.ses[sk()] = Z; return Z;
  }
  var sesOf = function () { return S.ses[sk()] || newSession(S.mode); };
  var score = function (iss) { var ng = H.ngCount(iss), wn = iss.length - ng; return Math.max(0, 100 - ng * 9 - wn * 3); };
  var roleOf = function (key, minor, ch, p) { var r = -1; H.pcs(key, minor, ch).forEach(function (c, q) { if (same(c, p)) r = q; }); return r; };
  var kinds = function (iss, ks) { return iss.filter(function (x) { return ks.indexOf(x.kind) >= 0; }); };

  /* ---------- 候補の 判定（この 音に すると どうなるか） ---------- */
  function judge(t, v, i, j, p) {
    var vs = v.map(function (c, q) { return q === i ? c.map(function (x, k) { return k === j ? p : x; }) : c; });
    var iss = H.checkAll(t.key, t.minor, t.chs, vs).filter(function (x) { return (x.i === i || x.j === i) && (x.v.indexOf(j) >= 0 || x.v.length === 0); });
    var ng = iss.filter(function (x) { return x.ng; });
    return ng.length ? { s: 'ng', msg: ng[0].msg } : iss.length ? { s: 'wn', msg: iss[0].msg } : { s: 'ok', msg: '' };
  }

  /* =====================================================
     ページ（#hlab）
     ===================================================== */
  GK.route(/^hlab\/u\/(h\d\d)(?:\/(sop|bass))?$/, function (m) { S.unit = m[1]; S.mode = m[2] || (S.mode === 'bass' ? 'bass' : 'sop'); save(); page(); });
  GK.route(/^hlab(?:\/(sop|bass|free|make))?$/, function (m) { S.unit = null; if (m[1]) { S.mode = m[1]; save(); } page(); });
  function page() {
    var un = S.unit && GK.UNIT[S.unit], clr = (GK.store.get('hlabUnit', {})[S.unit] || 0);
    V.innerHTML = '<div class="split"><aside class="panel side">' + (un ? '<h3>📖 ' + esc(un.no) + ' ' + esc(un.title) + ' の 実践</h3><button type="button" class="it" data-go="#hlab/u/' + S.unit + '/sop" aria-current="' + (S.mode === 'sop') + '"><b>🔴 ソプラノ課題</b><small>この単元の 和音進行で</small></button><button type="button" class="it" data-go="#hlab/u/' + S.unit + '/bass" aria-current="' + (S.mode === 'bass') + '"><b>🟣 バス課題</b><small>この単元の 和音進行で</small></button><button type="button" class="it" data-go="#' + S.unit + '"><b>◀ 授業にもどる</b><small>' + esc(un.goal) + '</small></button><button type="button" class="it" data-go="#hlab/sop"><b>✍️ 実践の トップへ</b><small>自由入力・自分で出題 など</small></button><p class="note" style="padding:6px 10px">この単元の クリア <b>' + clr + '</b> 回</p>' : '<h3>✍️ 和声の 実践</h3>') +
      (un ? '' : MODES.map(function (x) { return '<button type="button" class="it" data-go="#hlab/' + x[0] + '" aria-current="' + (S.mode === x[0]) + '"><b>' + x[1] + '</b><small>' + x[2] + '</small></button>'; }).join('')) + (un ? '' : '<p class="note" style="padding:2px 10px">単元ごとの 実践は、各単元の「✍️ 実践」から。</p>') +
      '<button type="button" class="it" data-go="#home/harm"><b>◀ 和声法ラボの ホームへ</b><small>授業・演習・実践・ゲーム</small></button>' +
      '<p class="note" style="padding:6px 10px">クリア <b>' + stat().clears + '</b> 回（満点 <b>' + stat().perfect + '</b> 回）</p>' +
      '</aside><section class="panel main"><div class="mbody" id="hbody"></div></section></div>';
    GK.harmLab($('#hbody'));
  }
  GK.route(/^tools\/hlab$/, function () { GK.go('#hlab'); });

  GK.harmLab = function (body) {
    var Z = sesOf(), geo = null;
    var free = !!(Z.t.free || Z.t.make), make = !!Z.t.make;
    Z.undo = Z.undo || []; Z.redo = Z.redo || [];
    body.innerHTML = '<div class="hz">' +
      '<div class="hzbar" id="hzBar"></div><div class="hzaim" id="hzAim"></div>' +
      '<div class="hzmain"><div class="hzl"><div class="hzstep" id="hzStep"></div><p class="hzcap">👆 五線を さわる／ドラッグ ・ 候補ボタン ・ 🎹 鍵盤 ・ パソコンは ド＝C から B の キー（C D E F G A B）で 入力。← → ↑ ↓ で 移動、Ctrl+Z で もどす</p><div class="fig sc hstaff" id="hzStaff"></div><div class="hzkbd" id="hzKbd"></div><div id="hzScore"></div></div>' +
      '<div class="hzr"><div class="hzf" id="hzFocus"></div><div id="hzRules"></div><div id="hzModel"></div></div></div></div>';

    /* ----- バー ----- */
    function bar() {
      var t = Z.t, b = '';
      if (free) {
        b += '<select id="hzKey" aria-label="調">' + H.KEYS.maj.map(function (k) { return '<option value="' + k + ',0">' + esc(H.keyName(k, false)) + '</option>'; }).join('') + H.KEYS.min.map(function (k) { return '<option value="' + k + ',1">' + esc(H.keyName(k, true)) + '</option>'; }).join('') + '</select>' +
          '<button type="button" class="btn sm" data-a="add">＋ 和音</button><button type="button" class="btn sm" data-a="del">− 和音</button>';
      } else if (t.unit) {
        b += '<button type="button" class="btn sm" data-a="new">🎲 新しい課題</button>';
      } else {
        b += '<span class="seg">' + [1, 2, 3].map(function (l) { return '<button type="button" data-a="lv" data-v="' + l + '" aria-pressed="' + (S.lv === l) + '">' + ['やさしい', 'ふつう', 'むずかしい'][l - 1] + '</button>'; }).join('') + '</span><button type="button" class="btn sm" data-a="new">🎲 新しい課題</button>';
      }
      b += '<button type="button" class="btn sm" data-a="undo" title="ひとつ もどす（Ctrl+Z）"' + (Z.undo.length ? '' : ' disabled') + '>↶</button><button type="button" class="btn sm" data-a="redo" title="やりなおし（Ctrl+Y）"' + (Z.redo.length ? '' : ' disabled') + '>↷</button><button type="button" class="btn sm" data-a="play">🔊 ぜんぶ 聴く</button><button type="button" class="btn sm" data-a="kbd" aria-pressed="' + S.kbd + '">🎹 鍵盤</button>';
      if (!free) b += '<button type="button" class="btn sm" data-a="hint">💡 ヒント' + (Z.hints ? '（' + Z.hints + '）' : '') + '</button><button type="button" class="btn sm" data-a="model">' + (Z.show ? '✏️ 自分のに もどる' : '📖 お手本') + '</button>';
      if (!make) b += '<button type="button" class="btn sm" data-a="reset">↺ やりなおし</button>';
      $('#hzBar', body).innerHTML = b;
      if (free) $('#hzKey', body).value = t.key + ',' + (t.minor ? 1 : 0);
    }

    /* ----- 見出し ----- */
    function aim() {
      var t = Z.t, h = '<b>' + esc(H.keyName(t.key, t.minor)) + '</b>';
      if (!free) h += '<span class="hzprog">' + esc(t.name) + '</span>';
      var txt = make ? '和音を えらんで、' + (S.mv === 0 ? 'ソプラノ' : 'バス') + 'の メロディーを 入れよう（和音の 音だけ）。できたら「この課題で 練習」。'
        : free ? '和音記号を えらんで、4 声を ぜんぶ 書いて みよう。自動で 採点します。'
        : (t.gv === 0 ? '🔴 ソプラノは 与えられています。アルト・テノール・バスを 書こう。' : '🟣 バスは 与えられています。ソプラノ・アルト・テノールを 書こう。') + ' 🎯 ' + (t.unit && GK.UNIT[t.unit] ? '【' + GK.UNIT[t.unit].title + '】' + GK.UNIT[t.unit].goal : AIM[t.lv || S.lv]);
      $('#hzAim', body).innerHTML = h + '<p>' + esc(txt) + '</p>';
    }

    /* ----- ステップ（和音の ならび） ----- */
    function stepper(iss) {
      var t = Z.t, h = '';
      t.chs.forEach(function (ch, i) {
        var bad = !make && iss.some(function (x) { return x.ng && (x.i === i || x.j === i); }), warn = !make && !bad && iss.some(function (x) { return x.i === i || x.j === i; });
        h += '<button type="button" class="hzd' + (Z.sel.i === i ? ' sel' : '') + (bad ? ' ng' : warn ? ' wn' : ' ok') + '" data-a="col" data-v="' + i + '"><small>' + (i + 1) + '</small><b>' + H.label(ch) + '</b><i>' + FUNC[ch.d] + '</i><em>' + (make ? '' : bad ? '✕' : warn ? '⚠' : '✓') + '</em></button>';
      });
      $('#hzStep', body).innerHTML = h;
    }

    /* ----- 五線 ----- */
    function staff(vs, iss) {
      var t = Z.t, mk = H.marksOf(iss);
      geo = M.satb($('#hzStaff', body), { key: t.key, minor: t.minor, color: true, names: true, zoom: 2.6, sp: 58, hideq: make, marks: make ? [] : mk.marks, chords: t.chs.map(function (ch, i) { return { v: vs[i], lab: H.label(ch), sub: H.figure(ch), bad: make ? [] : mk.bad[i], q: make ? [0, 1, 2, 3].filter(function (x) { return x !== S.mv; }) : undefined }; }) });
      if (geo && geo.svg && geo.notes && geo.notes[Z.sel.j] && geo.notes[Z.sel.j][Z.sel.i] && geo.notes[Z.sel.j][Z.sel.i].getYs && !(make && Z.sel.j !== S.mv)) {
        var sn = geo.notes[Z.sel.j][Z.sel.i], ring = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ring.setAttribute('cx', sn.getAbsoluteX() + 6); ring.setAttribute('cy', sn.getYs()[0]); ring.setAttribute('rx', 11); ring.setAttribute('ry', 8.5); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#e8b73a'); ring.setAttribute('stroke-width', 3); geo.svg.appendChild(ring);
      }
      if (geo && geo.svg && geo.xs[Z.sel.i] != null) {
        var half = geo.xs.length > 1 ? Math.abs(geo.xs[1] - geo.xs[0]) / 2 : 30, r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', geo.xs[Z.sel.i] - half + 4); r.setAttribute('y', geo.y1 - 60); r.setAttribute('width', half * 2 - 8); r.setAttribute('height', geo.y2 - geo.y1 + 150);
        r.setAttribute('rx', 8); r.setAttribute('fill', '#e8b73a'); r.setAttribute('opacity', '.22'); geo.svg.insertBefore(r, geo.svg.firstChild);
      }
    }

    /* ----- 「いま書く」パネル ----- */
    function focus(vs, iss) {
      var t = Z.t, i = Z.sel.i, j = Z.sel.j, ch = t.chs[i], pcs = H.pcs(t.key, t.minor, ch), h = '';
      var locked = function (jj) { return jj === t.gv || Z.show || (make && jj !== S.mv); };
      h += '<div class="hzfh"><button type="button" class="btn sm" data-a="prev"' + (i ? '' : ' disabled') + '>◀</button><b>' + (i + 1) + ' 番め　' + H.label(ch) + '</b><span class="hzfn">' + FUNC[ch.d] + '（' + { T: '主', S: '下属', D: '属' }[FUNC[ch.d]] + '）</span><button type="button" class="btn sm" data-a="next"' + (i < t.chs.length - 1 ? '' : ' disabled') + '>▶</button>' +
        (free ? '<select id="hzCh" aria-label="和音">' + [1, 2, 3, 4, 5, 6, 7].map(function (dg) { return '<optgroup label="' + H.ROMAN[dg] + '">' + CHL.filter(function (c) { return c.d === dg; }).map(function (c) { return '<option value="' + chKey(c) + '"' + (chKey(c) === chKey(ch) ? ' selected' : '') + '>' + chName(c) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>' : '') + '</div>';
      h += '<p class="hzfi"><b>' + pcs.map(function (p, q) { return N(p) + '<small>' + ROLE[q] + '</small>'; }).join(' ') + '</b>' + (ch.inv ? '　<span>バス＝' + N(pcs[ch.inv]) + '</span>' : '') + '</p>';
      if (!make) {
        if (i === 0) h += '<p class="hzfi tip">💡 根音・第3音・第5音が そろうように。根音を 重ねる。</p>';
        else {
          var pp = H.pcs(t.key, t.minor, t.chs[i - 1]), com = pcs.filter(function (c) { return pp.some(function (d) { return same(c, d); }); });
          h += '<p class="hzfi tip">💡 ' + (com.length ? '共通音 <b>' + com.map(N).join('・') + '</b> は そのまま 保つ' : '共通音なし → 上の 3 声は バスと <b>反対向き</b>') + '</p>';
        }
      }
      h += '<div class="hzvr"><div class="hzv">' + [0, 1, 2, 3].map(function (jj) {
        var p = vs[i][jj], r = roleOf(t.key, t.minor, ch, p), bad = !make && iss.some(function (x) { return x.ng && (x.i === i || x.j === i) && x.v.indexOf(jj) >= 0; }), lk = locked(jj);
        if (make && jj !== S.mv) return '';
        return '<button type="button" class="hzvb' + (j === jj ? ' sel' : '') + (bad ? ' ng' : '') + (lk ? ' lk' : '') + '" data-a="voice" data-v="' + jj + '" style="--vc:' + H.VCOL[jj] + '"' + (lk && !(j === jj) ? ' disabled' : '') + '><i>' + VCN[jj] + '</i><b>' + N(p) + '</b><small>' + (r < 0 ? '和音外' : ROLE[r]) + (lk ? '🔒' : '') + '</small></button>';
      }).join('') + '</div>' + (!locked(j) ? '<div class="hzud2"><button type="button" class="btn sm" data-a="up" title="上の 音へ">▲</button><button type="button" class="btn sm" data-a="down" title="下の 音へ">▼</button></div>' : '') + '</div>';
      if (!locked(j)) {
        var cands = H.voicePitches(t.key, t.minor, ch, j).slice().sort(function (a, b) { return mid(b.p) - mid(a.p); }), cur = vs[i][j], sug = Z.hint === 3 ? Z.sug : null;
        h += '<div class="hzc">' + cands.map(function (c) {
          var jd = make ? { s: 'ok' } : judge(t, Z.v, i, j, c.p), on = mid(c.p) === mid(cur), isSug = sug && sug.i === i && sug.j === j && mid(sug.p) === mid(c.p);
          return '<button type="button" class="hzcb ' + jd.s + (on ? ' on' : '') + (isSug ? ' hint' : '') + '" data-a="pick" data-v="' + c.q + ',' + c.p.o + '" title="' + esc(jd.msg) + '"><b>' + N(c.p) + '<small>' + c.p.o + '</small></b><span>' + ROLE[c.q] + '</span><em>' + (jd.s === 'ok' ? '○' : jd.s === 'wn' ? '△' : '✕') + '</em></button>';
        }).join('') + '</div>';
        if (!make) {
          var cj = judge(t, Z.v, i, j, cur);
          h += '<p class="hzj ' + cj.s + '">' + (cj.s === 'ok' ? '○ ' + VJP[j] + 'の ' + N(cur) + ' は OK' : (cj.s === 'ng' ? '✕ ' : '△ ') + esc(cj.msg)) + '</p>';
        }
      } else if (Z.show) h += '<p class="hzfi">📖 お手本を 表示中（「自分のに もどる」で 書きなおし）。</p>';
      else h += '<p class="hzfi">この 声部は 最初から 書いてあります。ほかの 声部を えらぼう。</p>';
      if (Z.hintTxt) h += '<div class="hzh">💡 ' + Z.hintTxt + '</div>';
      h += '<div class="hzfa">' + (!make ? '<button type="button" class="btn sm" data-a="playcol">🔊 この和音</button><label class="hzauto">書いたら <select data-a="adv" aria-label="書いたあと"><option value="voice"' + (S.adv === 'voice' ? ' selected' : '') + '>次の声部へ</option><option value="col"' + (S.adv === 'col' ? ' selected' : '') + '>次の和音へ</option><option value="none"' + (S.adv === 'none' ? ' selected' : '') + '>そのまま</option></select></label>' : '<span class="seg"><button type="button" data-a="mv" data-v="0" aria-pressed="' + (S.mv === 0) + '">ソプラノを 入力</button><button type="button" data-a="mv" data-v="3" aria-pressed="' + (S.mv === 3) + '">バスを 入力</button></span>') +
        (!locked(j) ? '<label class="hzauto"><input type="checkbox" data-a="snap"' + (S.snap ? ' checked' : '') + '> 吸いつく</label>' : '') + '</div>';
      if (!S.snap) h += '<div class="hzacc"><span>♯♭</span>' + ACC.map(function (a) { return '<button type="button" data-a="acc" data-v="' + (a[0] == null ? '' : a[0]) + '" aria-pressed="' + ((Z.acc == null ? null : Z.acc) === a[0]) + '">' + a[1] + '</button>'; }).join('') + '</div>';
      $('#hzFocus', body).innerHTML = h;
    }

    /* ----- 採点・チェックリスト ----- */
    function scoreCard(iss) {
      var t = Z.t, el = $('#hzScore', body);
      if (make) {
        var allIn = t.chs.every(function (ch, i) { return roleOf(t.key, t.minor, ch, Z.v[i][S.mv]) >= 0; });
        el.innerHTML = '<div class="hzs ' + (allIn ? 'good' : '') + '"><b>' + (allIn ? '✅ 課題が できました' : '和音の 音に なるように えらぼう') + '</b><p>' + t.chs.map(function (ch, i) { var p = Z.v[i][S.mv], r = roleOf(t.key, t.minor, ch, p); return (r >= 0 ? '○' : '✕') + ' ' + H.label(ch) + '：' + N(p); }).join('　') + '</p><button type="button" class="btn main" data-a="start"' + (allIn ? '' : ' disabled') + '>▶ この課題で 練習</button></div>';
        return;
      }
      var ng = H.ngCount(iss), sc = score(iss), stars = ng ? 0 : sc === 100 ? (Z.hints ? 2 : 3) : 1;
      var msg = ng ? (sc >= 80 ? '惜しい！ あと すこし' : sc >= 55 ? 'もう ひといき' : 'ルールを 見なおそう') : sc === 100 ? (Z.hints ? '🎉 かんぺき（ヒントあり ★2）' : '🎉 かんぺき！') : '✅ 合格（⚠ を 直すと 満点）';
      el.innerHTML = '<div class="hzs ' + (ng ? '' : 'good') + '"><div class="hzs1"><b>' + sc + '<small>/100</small></b><span class="stars">' + [0, 1, 2].map(function (q) { return q < stars ? '★' : '☆'; }).join('') + '</span><span class="hzmsg">' + msg + (ng ? '　✕' + ng + (iss.length - ng ? ' ⚠' + (iss.length - ng) : '') : '') + '</span>' + (!ng && !free ? '<button type="button" class="btn main sm" data-a="new">次の 課題へ ▶</button>' : '') + '</div></div>';
      if (!ng && !Z.done && !Z.show) {
        Z.done = true; GK.fx('fanfare');
        if (!free && !t.custom && !Z.paid) { Z.paid = true; if (t.unit) { var su = GK.store.get('hlabUnit', {}); su[t.unit] = (su[t.unit] || 0) + 1; GK.store.set('hlabUnit', su); } var st = stat(); st.clears++; if (stars === 3) st.perfect++; GK.store.set('hlabStat', st); GK.earn(stars === 3 ? 15 : stars === 2 ? 10 : 6); }
        if (stars === 3) GK.confetti && GK.confetti(30);
      }
      if (ng) Z.done = false;
    }
    function rules(iss) {
      var t = Z.t;
      if (make) { $('#hzRules', body).innerHTML = ''; return; }
      var h = '<div class="hzrl2">' + RULES.map(function (r) {
        var hit = kinds(iss, r.ks), ng = hit.filter(function (x) { return x.ng; }).length, wn = hit.length - ng, na = r.need && !r.need(t), st = na ? 'na' : ng ? 'ng' : wn ? 'wn' : 'ok';
        return '<button type="button" class="hzchip ' + st + (Z.open === r.id ? ' open' : '') + '" data-a="rule" data-v="' + r.id + '"><i>' + (na ? '−' : ng ? '✕' : wn ? '⚠' : '✓') + '</i>' + r.s + (ng || wn ? '<em>' + (ng || wn) + '</em>' : '') + '</button>';
      }).join('') + '</div>';
      var op = RULES.filter(function (r) { return r.id === Z.open; })[0];
      if (op) {
        var hit2 = kinds(iss, op.ks);
        h += '<div class="hzrd"><p class="tip"><b>' + op.t + '</b>：' + esc(op.tip) + '</p>' + (hit2.length ? hit2.map(function (x) { var where = x.i === x.j ? H.label(t.chs[x.i]) : H.label(t.chs[x.i]) + ' → ' + H.label(t.chs[x.j]); return '<p class="hi ' + (x.ng ? 'ng' : 'wn') + '"><b>' + (x.i + 1) + (x.i === x.j ? '' : '→' + (x.j + 1)) + ' 番め ' + where + '</b>　' + esc(x.msg) + ' <button type="button" class="btn sm" data-a="go" data-v="' + x.j + ',' + (x.v.length ? x.v[0] : Z.sel.j) + '">ここへ</button></p>'; }).join('') : '<p class="hi">この ルールは まもれています ✓</p>') + '</div>';
      }
      $('#hzRules', body).innerHTML = h;
    }
    function modelBox() {
      var t = Z.t, el = $('#hzModel', body);
      el.innerHTML = Z.show && t.model ? '<h4 class="hzh4">📖 お手本の ポイント</h4>' + H.explain(t.key, t.minor, t.chs, t.model).map(function (x) { return '<p class="hi tip">' + esc(x) + '</p>'; }).join('') : '';
    }

    function draw() {
      var t = Z.t, vs = Z.show && t.model ? t.model : Z.v, iss = make ? [] : H.checkAll(t.key, t.minor, t.chs, vs);
      bar(); aim(); stepper(iss); staff(vs, iss); kbd(); focus(vs, iss); scoreCard(iss); rules(iss); modelBox();
    }
    Z.draw = draw;

    /* ----- 操作 ----- */
    function nextTarget() {
      var t = Z.t, i = Z.sel.i, j = Z.sel.j, c = function (jj) { return jj !== t.gv && !(make && jj !== S.mv); };
      for (var q = j + 1; q < 4; q++) if (c(q)) { Z.sel.j = q; return; }
      if (i < t.chs.length - 1) { Z.sel.i = i + 1; for (q = 0; q < 4; q++) if (c(q)) { Z.sel.j = q; return; } }
    }
    var lastPlay = 0;
    function snapZ() { return JSON.stringify({ v: Z.v, chs: Z.t.chs }); }
    function pushH() { Z.undo.push(snapZ()); if (Z.undo.length > 80) Z.undo.shift(); Z.redo = []; }
    function restore(str) { var o = JSON.parse(str); Z.v = o.v; Z.t.chs = o.chs; if (free) { S.fc = Z.t.chs; save(); } Z.sel.i = Math.min(Z.sel.i, Z.t.chs.length - 1); Z.done = false; Z.hintTxt = ''; Z.draw(); }
    function undo() { if (!Z.undo.length) return; Z.redo.push(snapZ()); restore(Z.undo.pop()); }
    function redo() { if (!Z.redo.length) return; Z.undo.push(snapZ()); restore(Z.redo.pop()); }
    function advance() {
      var t = Z.t, adv = make ? 'col' : S.adv;
      if (adv === 'voice') nextTarget();
      else if (adv === 'col' && Z.sel.i < t.chs.length - 1) Z.sel.i++;
    }
    // ふつうの 位置（調号・短調の 導音・和音の 音）で 音名を 書く
    function spell(l, midiHint, i) {
      var t = Z.t, a = M.keyAcc(t.key)[l] || 0, lt = H.lt(t.key, t.minor);
      if (t.minor && l === lt.l) a = lt.a;
      if (S.snap) H.pcs(t.key, t.minor, t.chs[i]).forEach(function (c) { if (c.l === l) a = c.a; });
      if (Z.acc != null) { a = Z.acc; Z.acc = null; }
      return a;
    }
    function typeLetter(L) {
      var t = Z.t, i = Z.sel.i, j = Z.sel.j; if (Z.show) return;
      if (j === t.gv || (make && j !== S.mv)) { Z.hintTxt = 'その 声部は 書きかえられません。1〜4 の キーで 声部を えらんでね。'; Z.draw(); return; }
      var l = 'CDEFGAB'.indexOf(L), a = spell(l, 0, i), cur = mid(Z.v[i][j]), best = null, bd = 1e9;
      for (var o = 1; o <= 7; o++) { var p = { l: l, a: a, o: o }, m = mid(p), pen = Math.abs(m - cur) + (m < mid(H.RANGE[j][0]) || m > mid(H.RANGE[j][1]) ? 40 : 0); if (pen < bd) { bd = pen; best = p; } }
      setNote(i, j, best); advance(); Z.draw();
    }
    function keyNote(m) {
      var t = Z.t, i = Z.sel.i, j = Z.sel.j; if (Z.show || j === t.gv || (make && j !== S.mv)) return;
      var pc = ((m % 12) + 12) % 12, p = null;
      H.pcs(t.key, t.minor, t.chs[i]).forEach(function (c) { var l = c.l; if ((STEPS[l] + c.a + 120) % 12 === pc) p = { l: l, a: c.a, o: Math.round((m - c.a - STEPS[l]) / 12) - 1 }; });
      if (!p) { var sharp = t.key >= 0, nat = STEPS.indexOf(pc);
        if (nat >= 0) p = { l: nat, a: 0, o: Math.round((m - STEPS[nat]) / 12) - 1 };
        else { var l2 = sharp ? STEPS.indexOf(pc - 1) : STEPS.indexOf(pc + 1), a2 = sharp ? 1 : -1; p = { l: l2, a: a2, o: Math.round((m - a2 - STEPS[l2]) / 12) - 1 }; } }
      setNote(i, j, p); advance(); Z.draw();
    }
    function kbd() {
      var el = $('#hzKbd', body); if (!S.kbd || Z.show) { el.innerHTML = ''; el.style.display = 'none'; return; }
      var t = Z.t, i = Z.sel.i, j = Z.sel.j, lo = mid(H.RANGE[j][0]) - 3, hi = mid(H.RANGE[j][1]) + 3, W = 30, ct = {}, cur = mid(Z.v[i][j]);
      H.pcs(t.key, t.minor, t.chs[i]).forEach(function (c) { ct[(STEPS[c.l] + c.a + 120) % 12] = 1; });
      var wh = '', bl = '', n = 0;
      for (var m = lo; m <= hi; m++) {
        var pc = ((m % 12) + 12) % 12, isW = STEPS.indexOf(pc) >= 0, cls = (ct[pc] ? ' ct' : '') + (m === cur ? ' on' : '');
        if (isW) { wh += '<button type="button" class="pk w' + cls + '" data-a="key" data-v="' + m + '"><span>' + (pc === 0 ? 'ド' + (Math.floor(m / 12) - 1) : ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'][STEPS.indexOf(pc)]) + '</span></button>'; n++; }
        else bl += '<button type="button" class="pk b' + cls + '" style="left:' + (n * W - 10) + 'px" data-a="key" data-v="' + m + '"></button>';
      }
      el.style.display = ''; el.innerHTML = '<div class="pkw" style="width:' + (n * W) + 'px">' + wh + bl + '</div><p class="hzfi">🎹 ' + VJP[j] + 'の 音を 鍵盤で。<b>●</b> の ある 鍵が この 和音の 音です。</p>';
    }
    function setNote(i, j, p, quiet) {
      if (!quiet) pushH();
      Z.v[i][j] = p; Z.done = false; Z.hint = 0; Z.hintTxt = ''; Z.sug = null;
      var now = Date.now(); if (!quiet || now - lastPlay > 140) { lastPlay = now; M.play([[M.str(p), 0.6]], 100); }
    }
    var dnOf = function (p) { return p.o * 7 + p.l; };
    // タップした 高さ（音階の 番号）に いちばん 近い 和音の 音
    function snapTo(i, j, dn) {
      var t = Z.t, L = H.voicePitches(t.key, t.minor, t.chs[i], j), cur = Z.v[i][j], best = null, bd = 1e9;
      L.forEach(function (c) { var d = Math.abs(dnOf(c.p) - dn) * 10 + Math.abs(mid(c.p) - mid(cur)) * 0.01; if (d < bd) { bd = d; best = c.p; } });
      return best;
    }
    function stepNote(dir) {
      var t = Z.t, i = Z.sel.i, j = Z.sel.j; if (Z.show || j === t.gv) return;
      var L = H.voicePitches(t.key, t.minor, t.chs[i], j), cur = mid(Z.v[i][j]), nx = null;
      if (dir > 0) { L.forEach(function (c) { if (mid(c.p) > cur && !nx) nx = c.p; }); } else { L.slice().reverse().forEach(function (c) { if (mid(c.p) < cur && !nx) nx = c.p; }); }
      if (nx) { setNote(i, j, nx); Z.draw(); }
    }
    function hintNow() {
      var t = Z.t, vs = Z.v, iss = H.checkAll(t.key, t.minor, t.chs, vs).filter(function (x) { return x.ng; }).sort(function (a, b) { return a.j - b.j || a.i - b.i; });
      if (!iss.length) { Z.hintTxt = 'もう まちがいは ありません。⚠ が あれば チェックリストを 見てみよう。'; return; }
      var x = iss[0], ti = x.j, tv = (x.v.length ? x.v : [0, 1, 2, 3]).filter(function (q) { return q !== t.gv; })[0]; if (tv == null) tv = firstFree(t.gv);
      Z.hint = Z.hint >= 3 ? 1 : Z.hint + 1; Z.hints++;
      Z.sel = { i: ti, j: tv };
      var where = x.i === x.j ? H.label(t.chs[x.i]) : H.label(t.chs[x.i]) + ' → ' + H.label(t.chs[x.j]);
      if (Z.hint === 1) Z.hintTxt = '<b>' + (ti + 1) + ' 番めの 和音（' + where + '）</b> に 問題が あります。' + VJP[tv] + 'を 見なおして みよう。';
      else if (Z.hint === 2) { var rr = RULES.filter(function (r) { return r.ks.indexOf(x.kind) >= 0; })[0]; Z.hintTxt = esc(x.msg) + (rr ? '<br><small>' + esc(rr.tip) + '</small>' : ''); }
      else {
        var sug = null, cands = H.voicePitches(t.key, t.minor, t.chs[ti], tv);
        if (t.model && t.model[ti]) sug = { i: ti, j: tv, p: t.model[ti][tv] };
        if (!sug || judge(t, vs, ti, tv, sug.p).s === 'ng') { var okc = cands.filter(function (c) { return judge(t, vs, ti, tv, c.p).s === 'ok'; })[0]; if (okc) sug = { i: ti, j: tv, p: okc.p }; }
        Z.sug = sug; Z.hintTxt = sug ? VJP[tv] + 'は <b>' + N(sug.p) + '</b> に して みよう（候補ボタンの 光っている 音）。' : 'この 和音は 他の 声部も 見なおして みよう。';
      }
    }
    function startMade() {
      var t = Z.t, mv = S.mv, given = {}; given[mv] = Z.v.map(function (c) { return c[mv]; });
      var model = H.solve(t.key, t.minor, t.chs, given, GK.rng(Math.floor(Math.random() * 1e9))), mode = mv === 0 ? 'sop' : 'bass';
      var N2 = { t: { key: t.key, minor: t.minor, name: 'じぶんの 課題', chs: t.chs, model: model, gv: mv, custom: true, lv: S.lv }, v: defaultVoices(t.key, t.minor, t.chs, mv, Z.v) };
      N2.sel = { i: 0, j: firstFree(mv) }; N2.hint = 0; N2.hints = 0; N2.acc = null; N2.show = false; N2.done = false; N2.paid = false;
      S.unit = null; S.ses[mode] = N2; S.mode = mode; save(); GK.go('#hlab/' + mode);
    }
    body.onclick = function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a, v = b.dataset.v, t = Z.t, rerender = false;
      if (a === 'pick') {
        if (Z.show) return; var q = v.split(','), r = +q[0], o = +q[1], pc = H.pcs(t.key, t.minor, t.chs[Z.sel.i])[r];
        setNote(Z.sel.i, Z.sel.j, { l: pc.l, a: pc.a, o: o }); advance();
      }
      else if (a === 'col') { Z.sel.i = +v; if (Z.sel.j === t.gv || (make && Z.sel.j !== S.mv)) Z.sel.j = make ? S.mv : firstFree(t.gv); Z.hintTxt = ''; }
      else if (a === 'prev') { Z.sel.i = Math.max(0, Z.sel.i - 1); }
      else if (a === 'next') { Z.sel.i = Math.min(t.chs.length - 1, Z.sel.i + 1); }
      else if (a === 'voice') { Z.sel.j = +v; Z.hintTxt = ''; }
      else if (a === 'go') { var g = v.split(','); Z.sel = { i: +g[0], j: +g[1] === t.gv ? firstFree(t.gv) : +g[1] }; }
      else if (a === 'rule') { Z.open = Z.open === v ? null : v; }
      else if (a === 'acc') { Z.acc = v === '' ? null : +v; }
      else if (a === 'adv') return;
      else if (a === 'key') { keyNote(+v); return; }
      else if (a === 'kbd') { S.kbd = !S.kbd; save(); }
      else if (a === 'undo') { undo(); return; }
      else if (a === 'redo') { redo(); return; }
      else if (a === 'snap') { S.snap = b.checked; save(); return; }
      else if (a === 'up') { stepNote(1); return; }
      else if (a === 'down') { stepNote(-1); return; }
      else if (a === 'lv') { S.lv = +v; save(); newSession(S.mode); rerender = true; }
      else if (a === 'new') { newSession(S.mode); rerender = true; }
      else if (a === 'reset') { pushH(); var m0 = Z.t.model; Z.v = defaultVoices(t.key, t.minor, t.chs, t.gv, t.gv >= 0 ? Z.v : null); Z.done = false; Z.hintTxt = ''; Z.hint = 0; Z.show = false; Z.sel = { i: 0, j: firstFree(t.gv) }; }
      else if (a === 'play') { H.play(Z.show && t.model ? t.model : Z.v); return; }
      else if (a === 'playcol') { H.play([(Z.show && t.model ? t.model : Z.v)[Z.sel.i]]); return; }
      else if (a === 'hint') { hintNow(); }
      else if (a === 'model') { if (!Z.show && !t.model) { Z.hintTxt = 'この 課題の お手本は 見つかりませんでした。'; } else Z.show = !Z.show; }
      else if (a === 'add') { if (t.chs.length < 6) { pushH(); t.chs.push(Ch(1)); Z.v.push(defaultVoices(t.key, t.minor, [Ch(1)], -1, null)[0]); S.fc = t.chs; save(); Z.done = false; } }
      else if (a === 'del') { if (t.chs.length > 2) { pushH(); t.chs.pop(); Z.v.pop(); S.fc = t.chs; Z.sel.i = Math.min(Z.sel.i, t.chs.length - 1); save(); Z.done = false; } }
      else if (a === 'mv') { S.mv = +v; Z.sel.j = S.mv; save(); }
      else if (a === 'start') { startMade(); return; }
      if (rerender) { GK.harmLab(body); return; }
      Z.draw();
    };
    body.onchange = function (e) {
      var t = Z.t;
      if (e.target.id === 'hzKey') { var a = e.target.value.split(','); S.fk = +a[0]; S.fm = a[1] === '1'; var cs = t.chs; save(); newSession(S.mode); S.ses[sk()].t.chs = cs; S.ses[sk()].v = defaultVoices(S.fk, S.fm, cs, -1, null); Z = S.ses[sk()]; GK.harmLab(body); }
      else if (e.target.dataset && e.target.dataset.a === 'adv') { S.adv = e.target.value; save(); }
      else if (e.target.id === 'hzCh') { pushH(); var kk = e.target.value, c = CHL.filter(function (x) { return chKey(x) === kk; })[0]; t.chs[Z.sel.i] = Object.assign({}, c); Z.v[Z.sel.i] = defaultVoices(t.key, t.minor, [t.chs[Z.sel.i]], -1, null)[0]; S.fc = t.chs; save(); Z.done = false; Z.draw(); }
    };
    // 五線を さわる：さわった 列の いちばん 近い 声部が その 高さの 音に なる。指を ずらすと 追いかけ、はなすと 決まる
    var box = $('#hzStaff', body), drag = null;
    box.style.touchAction = 'none';
    function colAt(pt) { var i = 0, bd = 1e9; geo.xs.forEach(function (x, q) { if (Math.abs(x - pt.x) < bd) { bd = Math.abs(x - pt.x); i = q; } }); return i; }
    function apply(pt) {
      var t = Z.t, i = drag.i, j = drag.j, tr = j < 2, dn = M.yToDiatonic(pt.y, tr ? geo.y1 : geo.y2, tr ? 'treble' : 'bass'), p;
      if (S.snap) p = snapTo(i, j, dnOf(dn));
      else { var acc = M.keyAcc(t.key)[dn.l] || 0, lt = H.lt(t.key, t.minor); if (t.minor && dn.l === lt.l) acc = lt.a; if (Z.acc != null) acc = Z.acc; p = { l: dn.l, a: acc, o: dn.o }; }
      if (!p || mid(p) < 36 || mid(p) > 84) return;
      if (mid(p) === mid(Z.v[i][j])) return;
      setNote(i, j, p, true); Z.sel = { i: i, j: j }; Z.draw();
    }
    box.addEventListener('pointerdown', function (e) {
      if (!geo || Z.show || e.button > 0) return;
      var t = Z.t, pt = M.svgPt(geo.svg, e), i = colAt(pt), treble = pt.y < (geo.y1 + (geo.y2 - 40)) / 2;
      var cands = (make ? [S.mv] : treble ? [0, 1] : [2, 3]).filter(function (j) { return j !== t.gv; });
      if (!cands.length) { Z.hintTxt = 'そこの 声部は 最初から 書いてあります（かえられません）。ほかの 段を さわってね。'; Z.draw(); return; }
      var best = cands[0], bd = 1e9;
      cands.forEach(function (j) { var n = geo.notes[j][i], y = n && n.getYs ? n.getYs()[0] : 1e9; if (Math.abs(y - pt.y) < bd) { bd = Math.abs(y - pt.y); best = j; } });
      e.preventDefault(); pushH(); drag = { i: i, j: best, id: e.pointerId }; dragTip(e);
      try { box.setPointerCapture(e.pointerId); } catch (x) { }
      Z.sel = { i: i, j: best }; Z.hintTxt = ''; apply(pt); Z.draw();
    });
    var tip = null;
    function dragTip(e) { if (!tip) { tip = document.createElement('div'); tip.className = 'hztip'; document.body.appendChild(tip); } if (drag) { tip.textContent = N(Z.v[drag.i][drag.j]); tip.style.left = (e.clientX + 18) + 'px'; tip.style.top = (e.clientY - 46) + 'px'; } }
    box.addEventListener('pointermove', function (e) { if (drag && geo) { e.preventDefault(); apply(M.svgPt(geo.svg, e)); dragTip(e); } });
    var endDrag = function (e) { if (tip) { tip.remove(); tip = null; } if (!drag) return; var d = drag; drag = null; try { box.releasePointerCapture(d.id); } catch (x) { } M.play([[M.str(Z.v[d.i][d.j]), 0.9]], 100); Z.draw(); };
    box.addEventListener('pointerup', endDrag); box.addEventListener('pointercancel', endDrag);
    // キーボード（パソコン）：← → 和音、↑ ↓ 音、1〜4 または S A T B で 声部、Space で 聴く
    if (GK._hzKey) document.removeEventListener('keydown', GK._hzKey);
    GK._hzKey = function (e) {
      if (!document.body.contains(body)) { document.removeEventListener('keydown', GK._hzKey); return; }
      if (e.target.closest && e.target.closest('select,input,textarea')) return;
      var t = Z.t, k = e.key, handled = true;
      if (k === 'ArrowLeft') Z.sel.i = Math.max(0, Z.sel.i - 1);
      else if (k === 'ArrowRight') Z.sel.i = Math.min(t.chs.length - 1, Z.sel.i + 1);
      else if (k === 'ArrowUp') { stepNote(1); return e.preventDefault(); }
      else if (k === 'ArrowDown') { stepNote(-1); return e.preventDefault(); }
      else if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      else if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
      else if (e.ctrlKey || e.metaKey || e.altKey) return;
      else if (/^[a-gA-G]$/.test(k)) { typeLetter(k.toUpperCase()); return e.preventDefault(); }
      else if (k === '+' || k === '=' || k === '#') { Z.acc = 1; }
      else if (k === '-' || k === '_') { Z.acc = -1; }
      else if (k === '0') { Z.acc = 0; }
      else if (k === 'Enter') { nextTarget(); }
      else if (/^[1-4]$/.test(k)) { var jj = +k - 1; if (jj !== t.gv && !(make && jj !== S.mv)) Z.sel.j = jj; }
      else if (k === ' ') { H.play([(Z.show && t.model ? t.model : Z.v)[Z.sel.i]]); return e.preventDefault(); }
      else handled = false;
      if (handled) { e.preventDefault(); Z.draw(); }
    };
    document.addEventListener('keydown', GK._hzKey);
    draw();
  };
})();
