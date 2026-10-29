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
  var Ch = function (d, inv, sev) { return { d: d, inv: inv || 0, sev: !!sev }; };
  var CHL = [Ch(1), Ch(1, 1), Ch(1, 2), Ch(2), Ch(2, 1), Ch(3), Ch(4), Ch(4, 1), Ch(4, 2), Ch(5), Ch(5, 1), Ch(5, 2), Ch(5, 0, 1), Ch(5, 1, 1), Ch(5, 2, 1), Ch(5, 3, 1), Ch(6), Ch(6, 1), Ch(7, 1)];
  var chKey = function (c) { return c.d + ',' + c.inv + ',' + (c.sev ? 1 : 0); };
  var VCN = ['S', 'A', 'T', 'B'], VJP = ['ソプラノ', 'アルト', 'テノール', 'バス'];
  var ACC = [[null, '自動'], [1, '♯'], [-1, '♭'], [0, '♮']];
  var FUNC = { 1: 'T', 2: 'S', 3: 'T', 4: 'S', 5: 'D', 6: 'T', 7: 'D' };
  var ROLE = ['根', '3', '5', '7'];

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
    { g: '1 つの 和音', id: 'range', ks: ['range'], t: '音域', tip: '音域：S ド4〜ソ5・A ソ3〜レ5・T ド3〜ソ4・B ファ2〜ド4。' },
    { id: 'tone', ks: ['tone', 'bass'], t: '和音の 音・バスの 音', tip: '4 声は すべて その 和音の 音。バスは 転回形で きまる 音（基本形は 根音）。' },
    { id: 'comp', ks: ['incomplete', 'dblLT', 'dbl7'], t: '音が そろう・重ねてよい音', tip: '根音・第3音・第5音を そろえる（第5音は 省略できる ことも）。導音と 第7音は 重ねない。' },
    { id: 'order', ks: ['cross', 'space'], t: '声部の 順番・間隔', tip: '上から S・A・T・B。交差しない。S‐A、A‐T は 1 オクターブ 以内。' },
    { g: '和音の つなぎ', id: 'par', ks: ['p5', 'p8'], t: '連続5度・連続8度', tip: '2 つの 声が 同じ向きに 5度 → 5度、8度 → 8度 と 進むのは 禁止。' },
    { id: 'res', ks: ['lt', 'sev'], t: '導音・第7音の 解決', tip: '導音は 半音 上の 主音へ。第7音は 2度 下へ。', need: function (t) { return t.chs.some(function (c, i) { return (c.d === 5 || c.d === 7 || c.sev) && i < t.chs.length - 1; }); } },
    { id: 'move', ks: ['leap', 'aug'], t: '跳躍・増減の 音程', tip: '1 オクターブを こえる 跳躍、増2度などの 動きは さける。' },
    { g: '注意（⚠ ふつうは さける）', id: 'warn', ks: ['hidden', 'overlap', 'dblThird'], t: '隠伏・声部の 重なり・第3音の 重複', tip: 'ソプラノと バスが 同じ向きに 5度・8度へ（隠伏）、声部が 前の 位置を こえる、第3音を 重ねる ―― ふつうは さける。' }
  ];
  var STORE = function () { return GK.store.get('hlab', {}); };
  var S = (function () { var o = STORE(); return { mode: o.mode || (o.type === 'bass' ? 'bass' : o.type === 'free' ? 'free' : 'sop'), lv: o.lv || 1, auto: o.auto !== false, fk: o.fk, fm: o.fm, fc: o.fc, mv: o.mv, ses: {} }; })();
  var save = function () { GK.store.set('hlab', { mode: S.mode, lv: S.lv, auto: S.auto, fk: S.fk, fm: S.fm, fc: S.fc, mv: S.mv }); };
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
      var key = pick(minor ? H.KEYS.min : H.KEYS.maj, R), pr = pick(ok, R), model = null;
      for (var t = 0; t < 6 && !model; t++) { model = H.solve(key, minor, pr.chs, null, R); if (!model) pr = pick(ok, R); }
      var gv = mode === 'bass' ? 3 : 0;
      Z = { t: { key: key, minor: minor, name: pr.name, chs: pr.chs, model: model, gv: gv, lv: S.lv }, v: defaultVoices(key, minor, pr.chs, gv, model) };
    } else {
      var k = S.fk != null ? S.fk : 0, mn = !!S.fm, cs = (S.fc || [Ch(1), Ch(4), Ch(5), Ch(1)]).map(function (c) { return Object.assign({}, c); });
      if (mode === 'make' && S.mv == null) S.mv = 0;
      Z = { t: { key: k, minor: mn, name: mode === 'make' ? '出題づくり' : '自由入力', chs: cs, model: null, gv: -1, free: mode === 'free', make: mode === 'make' }, v: defaultVoices(k, mn, cs, -1, null) };
    }
    Z.sel = { i: 0, j: Z.t.make ? S.mv : firstFree(Z.t.gv) }; Z.hint = 0; Z.hints = 0; Z.acc = null; Z.open = null; Z.show = false; Z.done = false; Z.paid = false; Z.msg = '';
    S.ses[mode] = Z; return Z;
  }
  var sesOf = function () { return S.ses[S.mode] || newSession(S.mode); };
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
  GK.route(/^hlab(?:\/(sop|bass|free|make))?$/, function (m) {
    if (m[1]) { S.mode = m[1]; save(); }
    V.innerHTML = '<div class="split"><aside class="panel side"><h3>🎼 和声ラボ</h3>' +
      MODES.map(function (x) { return '<button type="button" class="it" data-go="#hlab/' + x[0] + '" aria-current="' + (S.mode === x[0]) + '"><b>' + x[1] + '</b><small>' + x[2] + '</small></button>'; }).join('') +
      '<button type="button" class="it" data-go="#home/harm"><b>◀ 和声法に もどる</b><small>授業・演習・テスト</small></button>' +
      '<p class="note" style="padding:6px 10px">クリア <b>' + stat().clears + '</b> 回（満点 <b>' + stat().perfect + '</b> 回）</p>' +
      '</aside><section class="panel main"><div class="mbody" id="hbody"></div></section></div>';
    GK.harmLab($('#hbody'));
  });
  GK.route(/^tools\/hlab$/, function () { GK.go('#hlab'); });

  GK.harmLab = function (body) {
    var Z = sesOf(), geo = null;
    var free = !!(Z.t.free || Z.t.make), make = !!Z.t.make;
    body.innerHTML = '<div class="hz">' +
      '<div class="hzbar" id="hzBar"></div><div class="hzaim" id="hzAim"></div>' +
      '<div class="hzmain"><div class="hzl"><div class="hzstep" id="hzStep"></div><div class="fig sc hstaff" id="hzStaff"></div><div id="hzScore"></div></div>' +
      '<div class="hzr"><div class="hzf" id="hzFocus"></div><div id="hzRules"></div><div id="hzModel"></div></div></div></div>';

    /* ----- バー ----- */
    function bar() {
      var t = Z.t, b = '';
      if (free) {
        b += '<select id="hzKey" aria-label="調">' + H.KEYS.maj.map(function (k) { return '<option value="' + k + ',0">' + esc(H.keyName(k, false)) + '</option>'; }).join('') + H.KEYS.min.map(function (k) { return '<option value="' + k + ',1">' + esc(H.keyName(k, true)) + '</option>'; }).join('') + '</select>' +
          '<button type="button" class="btn sm" data-a="add">＋ 和音</button><button type="button" class="btn sm" data-a="del">− 和音</button>';
      } else {
        b += '<span class="seg">' + [1, 2, 3].map(function (l) { return '<button type="button" data-a="lv" data-v="' + l + '" aria-pressed="' + (S.lv === l) + '">' + ['やさしい', 'ふつう', 'むずかしい'][l - 1] + '</button>'; }).join('') + '</span><button type="button" class="btn sm" data-a="new">🎲 新しい課題</button>';
      }
      b += '<button type="button" class="btn sm" data-a="play">🔊 ぜんぶ 聴く</button>';
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
        : (t.gv === 0 ? '🔴 ソプラノは 与えられています。アルト・テノール・バスを 書こう。' : '🟣 バスは 与えられています。ソプラノ・アルト・テノールを 書こう。') + ' 🎯 ' + AIM[t.lv || S.lv];
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
      h += '<div class="hzfh"><button type="button" class="btn sm" data-a="prev"' + (i ? '' : ' disabled') + '>◀</button><b>' + (i + 1) + ' 番めの 和音　' + H.label(ch) + '</b><span class="hzfn">' + FUNC[ch.d] + '（' + { T: '主', S: '下属', D: '属' }[FUNC[ch.d]] + 'の はたらき）</span><button type="button" class="btn sm" data-a="next"' + (i < t.chs.length - 1 ? '' : ' disabled') + '>▶</button>' +
        (free ? '<select id="hzCh" aria-label="和音">' + CHL.map(function (c) { return '<option value="' + chKey(c) + '"' + (chKey(c) === chKey(ch) ? ' selected' : '') + '>' + H.ROMAN[c.d] + ' ' + (c.sev ? ['7', '65', '43', '42'][c.inv] : ['基本形', '六（第1転回）', '四六（第2転回）'][c.inv]) + '</option>'; }).join('') + '</select>' : '') + '</div>';
      h += '<p class="hzfi">' + H.label(ch) + ' ＝ <b>' + pcs.map(function (p, q) { return N(p) + '<small>（' + ROLE[q] + '）</small>'; }).join('・') + '</b>' + (ch.inv ? '　<span>バスは ' + N(pcs[ch.inv]) + '（' + ROLE[ch.inv] + '）</span>' : '') + '</p>';
      if (!make) {
        if (i === 0) h += '<p class="hzfi tip">💡 最初の 和音：ソプラノの 音を 見て、根音・第3音・第5音が そろうように 配置しよう（根音を 重ねる のが 基本）。</p>';
        else {
          var pp = H.pcs(t.key, t.minor, t.chs[i - 1]), com = pcs.filter(function (c) { return pp.some(function (d) { return same(c, d); }); });
          h += '<p class="hzfi tip">💡 前の ' + H.label(t.chs[i - 1]) + ' との ' + (com.length ? '<b>共通音：' + com.map(N).join('・') + '</b> ── 同じ 声部で そのまま 保とう。' : '<b>共通音は ありません</b> ── 上の 3 声は バスと <b>反対向き</b> に、なるべく 近い 音へ。') + '</p>';
        }
      }
      // 声部ボタン（いまの 答え）
      h += '<div class="hzv">' + [0, 1, 2, 3].map(function (jj) {
        var p = vs[i][jj], r = roleOf(t.key, t.minor, ch, p), bad = !make && iss.some(function (x) { return x.ng && (x.i === i || x.j === i) && x.v.indexOf(jj) >= 0; }), lk = locked(jj);
        if (make && jj !== S.mv) return '';
        return '<button type="button" class="hzvb' + (j === jj ? ' sel' : '') + (bad ? ' ng' : '') + (lk ? ' lk' : '') + '" data-a="voice" data-v="' + jj + '" style="--vc:' + H.VCOL[jj] + '"' + (lk && !(j === jj) ? ' disabled' : '') + '><i>' + VCN[jj] + '</i><b>' + N(p) + '</b><small>' + (r < 0 ? '和音外' : ROLE[r]) + (lk ? ' 🔒' : '') + '</small></button>';
      }).join('') + '</div>';
      // 候補ボタン
      if (!locked(j)) {
        var cands = H.voicePitches(t.key, t.minor, ch, j).slice().sort(function (a, b) { return mid(b.p) - mid(a.p); }), cur = vs[i][j], sug = Z.hint === 3 ? Z.sug : null;
        h += '<p class="hzfi"><b>' + VJP[j] + '</b> の 音を えらぼう（いまの 他の声との 組み合わせで 判定）</p><div class="hzc">' + cands.map(function (c) {
          var jd = make ? { s: 'ok' } : judge(t, Z.v, i, j, c.p), on = mid(c.p) === mid(cur), isSug = sug && sug.i === i && sug.j === j && mid(sug.p) === mid(c.p);
          return '<button type="button" class="hzcb ' + jd.s + (on ? ' on' : '') + (isSug ? ' hint' : '') + '" data-a="pick" data-v="' + c.q + ',' + c.p.o + '" title="' + esc(jd.msg) + '"><b>' + N(c.p) + '<small>' + c.p.o + '</small></b><span>' + ROLE[c.q] + '</span><em>' + (jd.s === 'ok' ? '○' : jd.s === 'wn' ? '△' : '✕') + '</em></button>';
        }).join('') + '</div>';
        if (!make) {
          var cj = judge(t, Z.v, i, j, cur);
          h += '<p class="hzj ' + cj.s + '">' + (cj.s === 'ok' ? '○ いまの ' + N(cur) + ' は だいじょうぶ' : (cj.s === 'ng' ? '✕ ' : '△ ') + esc(cj.msg)) + '</p>';
        }
      } else if (Z.show) h += '<p class="hzfi">📖 お手本を 表示中です。「自分のに もどる」で 書きなおせます。</p>';
      else h += '<p class="hzfi">この 声部は 最初から 書いてあります（かえられません）。ほかの 声部を えらぼう。</p>';
      if (Z.hintTxt) h += '<div class="hzh">💡 ' + Z.hintTxt + '</div>';
      if (!make) h += '<div class="hzfa"><button type="button" class="btn sm" data-a="playcol">🔊 この 和音</button><label class="hzauto"><input type="checkbox" data-a="auto"' + (S.auto ? ' checked' : '') + '> 書いたら 次の 声部へ</label></div>';
      if (make) h += '<div class="hzfa"><span class="seg"><button type="button" data-a="mv" data-v="0" aria-pressed="' + (S.mv === 0) + '">ソプラノを 入力</button><button type="button" data-a="mv" data-v="3" aria-pressed="' + (S.mv === 3) + '">バスを 入力</button></span></div>';
      h += '<div class="hzacc"><span>♯♭</span>' + ACC.map(function (a) { return '<button type="button" data-a="acc" data-v="' + (a[0] == null ? '' : a[0]) + '" aria-pressed="' + ((Z.acc == null ? null : Z.acc) === a[0]) + '">' + a[1] + '</button>'; }).join('') + '<small>（五線を タップした ときの 臨時記号）</small></div>';
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
      var msg = ng ? (sc >= 80 ? '惜しい！ あと すこし' : sc >= 55 ? 'もう ひといき' : 'ルールを 見なおそう') : sc === 100 ? (Z.hints ? '🎉 かんぺき（ヒント ありは ★2）' : '🎉 かんぺき！') : '✅ 合格（⚠ を 直すと 満点）';
      el.innerHTML = '<div class="hzs ' + (ng ? '' : 'good') + '"><div class="hzs1"><b>採点 ' + sc + '<small> / 100</small></b><span class="stars">' + [0, 1, 2].map(function (q) { return q < stars ? '★' : '☆'; }).join('') + '</span></div><p>' + msg + '</p>' +
        (ng ? '<p class="hzn">✕ まちがい ' + ng + ' 個' + (iss.length - ng ? '・⚠ ' + (iss.length - ng) + ' 個' : '') + '</p>' : '') +
        (!ng && !free ? '<button type="button" class="btn main" data-a="new">次の 課題へ ▶</button>' : '') + '</div>';
      if (!ng && !Z.done) {
        Z.done = true; GK.fx('fanfare');
        if (!free && !t.custom && !Z.paid) { Z.paid = true; var st = stat(); st.clears++; if (stars === 3) st.perfect++; GK.store.set('hlabStat', st); GK.earn(stars === 3 ? 15 : stars === 2 ? 10 : 6); }
        if (stars === 3) GK.confetti && GK.confetti(30);
      }
      if (ng) Z.done = false;
    }
    function rules(iss) {
      var t = Z.t, h = '<h4 class="hzh4">✔ ルール チェック</h4><div class="hzrl">';
      if (make) { $('#hzRules', body).innerHTML = ''; return; }
      RULES.forEach(function (r) {
        if (r.g) h += '<div class="hzg">' + r.g + '</div>';
        var hit = kinds(iss, r.ks), ng = hit.filter(function (x) { return x.ng; }).length, wn = hit.length - ng, na = r.need && !r.need(t);
        var st = na ? 'na' : ng ? 'ng' : wn ? 'wn' : 'ok', open = Z.open === r.id;
        h += '<div class="hzr1 ' + st + (open ? ' open' : '') + '"><button type="button" data-a="rule" data-v="' + r.id + '"><i>' + (na ? '−' : ng ? '✕' : wn ? '⚠' : '✓') + '</i><span>' + r.t + '</span><em>' + (ng ? ng + ' 個' : wn ? wn + ' 個' : na ? '対象なし' : '') + '</em></button>';
        if (open) {
          h += '<div class="hzrd"><p class="tip">' + esc(r.tip) + '</p>' + (hit.length ? hit.map(function (x) { var where = x.i === x.j ? H.label(t.chs[x.i]) : H.label(t.chs[x.i]) + ' → ' + H.label(t.chs[x.j]); return '<p class="hi ' + (x.ng ? 'ng' : 'wn') + '"><b>' + (x.i + 1) + (x.i === x.j ? '' : '→' + (x.j + 1)) + ' 番め ' + where + '</b>　' + esc(x.msg) + ' <button type="button" class="btn sm" data-a="go" data-v="' + x.j + ',' + (x.v.length ? x.v[0] : Z.sel.j) + '">ここへ</button></p>'; }).join('') : '<p class="hi">この ルールは まもれています ✓</p>') + '</div>';
        }
        h += '</div>';
      });
      $('#hzRules', body).innerHTML = h + '</div>';
    }
    function modelBox() {
      var t = Z.t, el = $('#hzModel', body);
      el.innerHTML = Z.show && t.model ? '<h4 class="hzh4">📖 お手本の ポイント</h4>' + H.explain(t.key, t.minor, t.chs, t.model).map(function (x) { return '<p class="hi tip">' + esc(x) + '</p>'; }).join('') : '';
    }

    function draw() {
      var t = Z.t, vs = Z.show && t.model ? t.model : Z.v, iss = make ? [] : H.checkAll(t.key, t.minor, t.chs, vs);
      bar(); aim(); stepper(iss); staff(vs, iss); focus(vs, iss); scoreCard(iss); rules(iss); modelBox();
    }
    Z.draw = draw;

    /* ----- 操作 ----- */
    function nextTarget() {
      var t = Z.t, i = Z.sel.i, j = Z.sel.j, c = function (jj) { return jj !== t.gv && !(make && jj !== S.mv); };
      for (var q = j + 1; q < 4; q++) if (c(q)) { Z.sel.j = q; return; }
      if (i < t.chs.length - 1) { Z.sel.i = i + 1; for (q = 0; q < 4; q++) if (c(q)) { Z.sel.j = q; return; } }
    }
    function setNote(i, j, p) {
      Z.v[i][j] = p; Z.done = false; Z.hint = 0; Z.hintTxt = ''; Z.sug = null;
      M.play([[M.str(p), 0.9]], 100);
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
      S.ses[mode] = N2; S.mode = mode; save(); GK.go('#hlab/' + mode);
    }
    body.onclick = function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a, v = b.dataset.v, t = Z.t, rerender = false;
      if (a === 'pick') {
        if (Z.show) return; var q = v.split(','), r = +q[0], o = +q[1], pc = H.pcs(t.key, t.minor, t.chs[Z.sel.i])[r];
        setNote(Z.sel.i, Z.sel.j, { l: pc.l, a: pc.a, o: o }); if (S.auto && !make) nextTarget();
      }
      else if (a === 'col') { Z.sel.i = +v; if (Z.sel.j === t.gv || (make && Z.sel.j !== S.mv)) Z.sel.j = make ? S.mv : firstFree(t.gv); Z.hintTxt = ''; }
      else if (a === 'prev') { Z.sel.i = Math.max(0, Z.sel.i - 1); }
      else if (a === 'next') { Z.sel.i = Math.min(t.chs.length - 1, Z.sel.i + 1); }
      else if (a === 'voice') { Z.sel.j = +v; Z.hintTxt = ''; }
      else if (a === 'go') { var g = v.split(','); Z.sel = { i: +g[0], j: +g[1] === t.gv ? firstFree(t.gv) : +g[1] }; }
      else if (a === 'rule') { Z.open = Z.open === v ? null : v; }
      else if (a === 'acc') { Z.acc = v === '' ? null : +v; }
      else if (a === 'auto') { S.auto = b.checked; save(); return; }
      else if (a === 'lv') { S.lv = +v; save(); newSession(S.mode); rerender = true; }
      else if (a === 'new') { newSession(S.mode); rerender = true; }
      else if (a === 'reset') { var m0 = Z.t.model; Z.v = defaultVoices(t.key, t.minor, t.chs, t.gv, t.gv >= 0 ? Z.v : null); Z.done = false; Z.hintTxt = ''; Z.hint = 0; Z.show = false; Z.sel = { i: 0, j: firstFree(t.gv) }; }
      else if (a === 'play') { H.play(Z.show && t.model ? t.model : Z.v); return; }
      else if (a === 'playcol') { H.play([(Z.show && t.model ? t.model : Z.v)[Z.sel.i]]); return; }
      else if (a === 'hint') { hintNow(); }
      else if (a === 'model') { if (!Z.show && !t.model) { Z.hintTxt = 'この 課題の お手本は 見つかりませんでした。'; } else Z.show = !Z.show; }
      else if (a === 'add') { if (t.chs.length < 6) { t.chs.push(Ch(1)); Z.v.push(defaultVoices(t.key, t.minor, [Ch(1)], -1, null)[0]); S.fc = t.chs; save(); Z.done = false; } }
      else if (a === 'del') { if (t.chs.length > 2) { t.chs.pop(); Z.v.pop(); S.fc = t.chs; Z.sel.i = Math.min(Z.sel.i, t.chs.length - 1); save(); Z.done = false; } }
      else if (a === 'mv') { S.mv = +v; Z.sel.j = S.mv; save(); }
      else if (a === 'start') { startMade(); return; }
      if (rerender) { GK.harmLab(body); return; }
      Z.draw();
    };
    body.onchange = function (e) {
      var t = Z.t;
      if (e.target.id === 'hzKey') { var a = e.target.value.split(','); S.fk = +a[0]; S.fm = a[1] === '1'; var cs = t.chs; save(); newSession(S.mode); S.ses[S.mode].t.chs = cs; S.ses[S.mode].v = defaultVoices(S.fk, S.fm, cs, -1, null); Z = S.ses[S.mode]; GK.harmLab(body); }
      else if (e.target.id === 'hzCh') { var kk = e.target.value, c = CHL.filter(function (x) { return chKey(x) === kk; })[0]; t.chs[Z.sel.i] = Object.assign({}, c); Z.v[Z.sel.i] = defaultVoices(t.key, t.minor, [t.chs[Z.sel.i]], -1, null)[0]; S.fc = t.chs; save(); Z.done = false; Z.draw(); }
    };
    // 五線を タップして 音を 書く
    $('#hzStaff', body).addEventListener('click', function (e) {
      if (!geo || Z.show) return;
      var t = Z.t, pt = M.svgPt(geo.svg, e), i = 0, bd = 1e9;
      geo.xs.forEach(function (x, q) { if (Math.abs(x - pt.x) < bd) { bd = Math.abs(x - pt.x); i = q; } });
      var j = make ? S.mv : Z.sel.j; Z.sel.i = i;
      if (j === t.gv) { Z.hintTxt = 'その 声部は 最初から 書いてあります。ほかの 声部（S・A・T・B）を えらんで から タップしてね。'; Z.draw(); return; }
      var bass = pt.y > (geo.y1 + (geo.y2 - 40)) / 2, dn = M.yToDiatonic(pt.y, bass ? geo.y2 : geo.y1, bass ? 'bass' : 'treble');
      var acc = M.keyAcc(t.key)[dn.l] || 0, lt = H.lt(t.key, t.minor);
      if (t.minor && dn.l === lt.l) acc = lt.a;
      if (Z.acc != null) acc = Z.acc;
      var p = { l: dn.l, a: acc, o: dn.o };
      if (mid(p) < 36 || mid(p) > 84) { Z.hintTxt = 'その 高さは はんいの 外です。'; Z.draw(); return; }
      Z.sel.j = j; setNote(i, j, p); Z.draw();
    });
    draw();
  };
})();
