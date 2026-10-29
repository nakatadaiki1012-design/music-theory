/* =========================================================
   楽典ラボ：和声エディタ（五線を タップして 4 声を 書いて、ルールを 自動採点）
   ・バス課題／ソプラノ課題：与えられた 声部に 残りの 声を 書く
   ・自由入力：調と 和音記号を えらんで 4 声を 全部 自分で 書く
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, $ = GK.$, $$ = GK.$$, esc = GK.esc;
  var N = function (p) { return GK.nm(p); };
  GK.HTOOLS.push({ go: '#tools/hlab', ic: '🎼', ttl: '和声エディタ', en: 'Harmony Lab', gl: '五線に 音を 書いて 自動採点' });

  var S = GK.store.get('hlab', { type: 'bass', lv: 1 });
  var mid = function (p) { return M.midi(p); };
  var Ch = function (d, inv, sev) { return { d: d, inv: inv || 0, sev: !!sev }; };
  var CHL = [Ch(1), Ch(1, 1), Ch(1, 2), Ch(2), Ch(2, 1), Ch(3), Ch(4), Ch(4, 1), Ch(4, 2), Ch(5), Ch(5, 1), Ch(5, 2), Ch(5, 0, 1), Ch(5, 1, 1), Ch(5, 2, 1), Ch(5, 3, 1), Ch(6), Ch(6, 1), Ch(7, 1)];
  var chKey = function (c) { return c.d + ',' + c.inv + ',' + (c.sev ? 1 : 0); };
  var ACC = [[null, '自動'], [1, '♯'], [-1, '♭'], [0, '♮']];
  var VCN = ['S', 'A', 'T', 'B'];

  function pick(a, R) { return a[Math.floor(R() * a.length)]; }
  function defaultVoices(key, minor, chs, gv, model) {
    return chs.map(function (ch, i) {
      return [0, 1, 2, 3].map(function (j) {
        if (model && j === gv) return model[i][j];
        var L = H.voicePitches(key, minor, ch, j), m = (mid(H.RANGE[j][0]) + mid(H.RANGE[j][1])) / 2, b = L[0];
        L.forEach(function (x) { if (Math.abs(mid(x.p) - m) < Math.abs(mid(b.p) - m)) b = x; });
        return b.p;
      });
    });
  }
  function newTask() {
    if (S.type === 'free' || S.type === 'make') { newFree(); return; }
    var R = GK.rng(Math.floor(Math.random() * 1e9)), minor = S.lv >= 2 && R() < 0.3, ok = H.PROGS.filter(function (p) { return p.lv <= S.lv && p.lv >= Math.max(1, S.lv - 1) && !(minor && p.majorOnly); });
    var key = pick(minor ? H.KEYS.min : H.KEYS.maj, R), pr = pick(ok, R), model = null;
    for (var t = 0; t < 5 && !model; t++) { model = H.solve(key, minor, pr.chs, null, R); if (!model) { pr = pick(ok, R); } }
    S.t = { key: key, minor: minor, pr: pr, chs: pr.chs, model: model, gv: S.type === 'bass' ? 3 : 0, show: false, done: false };
    S.v = defaultVoices(key, minor, pr.chs, S.t.gv, model);
    S.cur = S.type === 'bass' ? 0 : 3;
  }
  function newFree() {
    var key = S.fk != null ? S.fk : 0, minor = !!S.fm, chs = S.fc || [Ch(1), Ch(4), Ch(5), Ch(1)];
    var mk = S.type === 'make';
    S.t = { key: key, minor: minor, pr: { name: mk ? '出題づくり' : '自由入力' }, chs: chs.map(function (c) { return Object.assign({}, c); }), model: null, gv: -1, show: false, done: false, free: !mk, make: mk };
    S.v = defaultVoices(key, minor, S.t.chs, -1, null); if (mk) { if (S.mv == null) S.mv = 0; S.cur = S.mv; } else S.cur = 0;
  }
  var score = function (iss) { var ng = H.ngCount(iss), wn = iss.length - ng; return Math.max(0, 100 - ng * 9 - wn * 3); };
  var grade = function (sc, ng) { return ng ? (sc >= 80 ? '惜しい！ あと すこし' : sc >= 55 ? 'もう ひといき' : 'ルールを 見なおそう') : sc === 100 ? '🎉 かんぺき' : '✅ 合格（注意を 直すと 満点）'; };

  GK.harmLab = function (body) {
    if (!S.t) newTask();
    var geo = null;
    body.innerHTML = '<div class="toolw hl"><div class="ctl"><div class="seg"><button type="button" data-ht="bass" aria-pressed="' + (S.type === 'bass') + '">バス課題</button><button type="button" data-ht="sop" aria-pressed="' + (S.type === 'sop') + '">ソプラノ課題</button><button type="button" data-ht="free" aria-pressed="' + (S.type === 'free') + '">自由入力</button><button type="button" data-ht="make" aria-pressed="' + (S.type === 'make') + '">自分で出題</button></div>' +
      (S.type === 'free' || S.type === 'make' ? '' : '<div class="seg"><button type="button" data-hl="1" aria-pressed="' + (S.lv === 1) + '">やさしい</button><button type="button" data-hl="2" aria-pressed="' + (S.lv === 2) + '">ふつう</button><button type="button" data-hl="3" aria-pressed="' + (S.lv === 3) + '">むずかしい</button></div>') +
      (S.type === 'free' || S.type === 'make' ? '<select id="hKey" aria-label="調">' + H.KEYS.maj.map(function (k) { return '<option value="' + k + ',0">' + esc(H.keyName(k, false)) + '</option>'; }).join('') + H.KEYS.min.map(function (k) { return '<option value="' + k + ',1">' + esc(H.keyName(k, true)) + '</option>'; }).join('') + '</select><button type="button" class="btn sm" id="hAdd">＋ 和音</button><button type="button" class="btn sm" id="hDel">− 和音</button>' : '<button type="button" class="btn sm" id="hNew">🎲 新しい課題</button>') +
      '<button type="button" class="btn sm" id="hPlay">🔊 聴く</button>' + (S.type === 'free' || S.type === 'make' ? '' : '<button type="button" class="btn sm" id="hModel">📖 お手本</button>') + '</div>' +
      '<div class="out" id="hInfo"></div>' +
      '<div class="hmain"><div class="hleft"><div class="seg hpal" id="hPal"></div><div class="fig sc hstaff" id="hStaff" style="min-height:200px"></div></div>' +
      '<div class="hright"><div class="hgrid" id="hGrid"></div><div class="hres" id="hRes"></div></div></div></div>';
    if (S.type === 'free' || S.type === 'make') { var sel = $('#hKey', body); sel.value = S.t.key + ',' + (S.t.minor ? 1 : 0); }
    body.onchange = function (e) {
      if (e.target.id !== 'hKey') return;
      var a = e.target.value.split(','); S.fk = +a[0]; S.fm = a[1] === '1'; S.fc = S.t.chs; newFree(); S.t.done = false; draw();
    };
    body.onclick = function (e) {
      var b = e.target.closest('[data-ht],[data-hl],#hNew,#hPlay,#hModel,#hAdd,#hDel,#hStart,[data-hc],[data-hv],[data-hmv],[data-hacc],[data-hq]'); if (!b) return;
      if (b.dataset.ht) { S.type = b.dataset.ht; newTask(); }
      else if (b.dataset.hl) { S.lv = +b.dataset.hl; newTask(); }
      else if (b.id === 'hNew') newTask();
      else if (b.id === 'hPlay') { H.play(cur()); return; }
      else if (b.id === 'hModel') { if (!S.t.show && !S.t.model) { flash('この 課題の お手本は 見つかりませんでした'); return; } S.t.show = !S.t.show; }
      else if (b.dataset.hmv) { S.mv = +b.dataset.hmv; S.cur = S.mv; S.t.done = false; }
      else if (b.id === 'hStart') { startMade(); GK.harmLab(body); return; }
      else if (b.id === 'hAdd') { if (S.t.chs.length < 6) { S.t.chs.push(Ch(1)); S.v.push(defaultVoices(S.t.key, S.t.minor, [Ch(1)], -1, null)[0]); S.fc = S.t.chs; S.t.done = false; } }
      else if (b.id === 'hDel') { if (S.t.chs.length > 2) { S.t.chs.pop(); S.v.pop(); S.fc = S.t.chs; S.t.done = false; } }
      else if (b.dataset.hq) { var qi = +b.dataset.hq, ix = 0; CHL.forEach(function (c, q) { if (chKey(c) === chKey(S.t.chs[qi])) ix = q; }); S.t.chs[qi] = Object.assign({}, CHL[(ix + 1) % CHL.length]); S.v[qi] = defaultVoices(S.t.key, S.t.minor, [S.t.chs[qi]], -1, null)[0]; S.fc = S.t.chs; S.t.done = false; }
      else if (b.dataset.hv) { S.cur = +b.dataset.hv; }
      else if (b.dataset.hacc !== undefined) { S.acc = b.dataset.hacc === '' ? null : +b.dataset.hacc; }
      else if (b.dataset.hc) {
        if (S.t.show) return;
        var a = b.dataset.hc.split(','), i = +a[0], j = +a[1], d = +a[2], L = H.voicePitches(S.t.key, S.t.minor, S.t.chs[i], j), k = 0;
        L.forEach(function (x, q) { if (mid(x.p) === mid(S.v[i][j])) k = q; });
        k = Math.max(0, Math.min(L.length - 1, k + d)); S.v[i][j] = L[k].p; M.play([[M.str(L[k].p), 1]], 100); S.t.done = false;
      }
      if (b.dataset.ht || b.dataset.hl) { GK.store.set('hlab', { type: S.type, lv: S.lv, fk: S.fk, fm: S.fm, fc: S.fc }); GK.harmLab(body); return; }
      GK.store.set('hlab', { type: S.type, lv: S.lv, fk: S.fk, fm: S.fm, fc: S.fc });
      draw();
    };
    // 五線を タップして 音を 書く
    $('#hStaff', body).addEventListener('click', function (e) {
      if (!geo || S.t.show) return;
      var svg = geo.svg, pt = M.svgPt(svg, e), t = S.t, i = 0, bd = 1e9;
      geo.xs.forEach(function (x, q) { if (Math.abs(x - pt.x) < bd) { bd = Math.abs(x - pt.x); i = q; } });
      var j = t.make ? S.mv : S.cur; if (j === t.gv) { flash('その 声部は 最初から 書いてあります（かえられません）'); return; }
      var bass = pt.y > (geo.y1 + (geo.y2 - 40)) / 2, dn = M.yToDiatonic(pt.y, bass ? geo.y2 : geo.y1, bass ? 'bass' : 'treble');
      var acc = M.keyAcc(t.key)[dn.l] || 0, lt = H.lt(t.key, t.minor);
      if (t.minor && dn.l === lt.l) acc = lt.a;
      if (S.acc != null) acc = S.acc;
      var p = { l: dn.l, a: acc, o: dn.o };
      if (mid(p) < 36 || mid(p) > 84) { flash('その 高さは はんいの 外です'); return; }
      S.v[i][j] = p; t.done = false; M.play([[M.str(p), 0.9]], 100); draw();
    });
    function startMade() {
      var t = S.t, mv = S.mv, given = {}; given[mv] = S.v.map(function (c) { return c[mv]; });
      var model = H.solve(t.key, t.minor, t.chs, given, GK.rng(Math.floor(Math.random() * 1e9)));
      S.type = mv === 0 ? 'sop' : 'bass';
      S.t = { key: t.key, minor: t.minor, pr: { name: 'じぶんの 課題' }, chs: t.chs, model: model, gv: mv, show: false, done: false, custom: true };
      S.v = defaultVoices(t.key, t.minor, t.chs, mv, S.v); S.cur = mv === 0 ? 1 : 0; S.acc = null;
      GK.store.set('hlab', { type: S.type, lv: S.lv, fk: S.fk, fm: S.fm, fc: S.fc });
    }
    function flash(msg) { var h = $('#hRes', body); if (h) h.insertAdjacentHTML('afterbegin', '<p class="hi wn">' + esc(msg) + '</p>'); }
    draw();
    function cur() { return S.t.show ? S.t.model : S.v; }
    function draw() {
      var t = S.t, vs = cur(), iss = H.checkAll(t.key, t.minor, t.chs, vs), mk = H.marksOf(iss), ng = H.ngCount(iss), warn = iss.length - ng, sc = score(iss);
      $('#hInfo', body).innerHTML = '<b>' + esc(H.keyName(t.key, t.minor)) + '</b><span>' + esc(t.pr.name) + '</span><span>' + (t.make ? '✏️ 和音を えらんで、' + (S.mv === 0 ? 'ソプラノ' : 'バス') + 'の メロディーを 五線に タップ。そのあと「この課題で 練習」' : t.free ? '✏️ 和音を えらんで、五線を タップして 4 声を 書こう' : S.type === 'bass' ? '🟣 バスは 与えられています。S・A・T を 書こう' : '🔴 ソプラノは 与えられています。A・T・B を 書こう') + '</span>' + (t.show ? '<span class="note">📖 お手本を 表示中</span>' : '');
      // 声部えらび・臨時記号
      if (S.cur === t.gv) S.cur = [0, 1, 2, 3].filter(function (x) { return x !== t.gv; })[0];
      $('#hPal', body).innerHTML = t.show ? '' : t.make ? '<span class="lbl">入力する 声部</span>' + [0, 3].map(function (j) { return '<button type="button" data-hmv="' + j + '" aria-pressed="' + (S.mv === j) + '" style="color:' + H.VCOL[j] + '">' + (j === 0 ? 'ソプラノ' : 'バス') + '</button>'; }).join('') + '<span class="lbl">♯♭</span>' + ACC.map(function (a) { return '<button type="button" data-hacc="' + (a[0] == null ? '' : a[0]) + '" aria-pressed="' + ((S.acc == null ? null : S.acc) === a[0]) + '">' + a[1] + '</button>'; }).join('') : '<span class="lbl">書く声部</span>' + [0, 1, 2, 3].map(function (j) { var lock = j === t.gv; return '<button type="button" data-hv="' + j + '" aria-pressed="' + (S.cur === j) + '"' + (lock ? ' disabled' : '') + ' style="color:' + H.VCOL[j] + '">' + VCN[j] + (lock ? '🔒' : '') + '</button>'; }).join('') + '<span class="lbl">♯♭</span>' + ACC.map(function (a) { return '<button type="button" data-hacc="' + (a[0] == null ? '' : a[0]) + '" aria-pressed="' + ((S.acc == null ? null : S.acc) === a[0]) + '">' + a[1] + '</button>'; }).join('');
      geo = M.satb($('#hStaff', body), { key: t.key, minor: t.minor, color: true, names: true, zoom: 2.6, sp: 58, hideq: !!t.make, marks: mk.marks, chords: t.chs.map(function (ch, i) { return { v: vs[i], lab: H.label(ch), sub: H.figure(ch), bad: t.make ? [] : mk.bad[i], q: t.make ? [0, 1, 2, 3].filter(function (x) { return x !== S.mv; }) : undefined }; }) });
      var g = '<i></i>' + t.chs.map(function (ch, i) { return (t.free || t.make) ? '<button type="button" class="hh hq" data-hq="' + i + '" title="和音を かえる">' + H.label(ch) + '</button>' : '<b class="hh">' + H.label(ch) + '</b>'; }).join('');
      for (var j = 0; j < 4; j++) {
        if (t.make && j !== S.mv) continue;
        g += '<b class="hv" style="color:' + H.VCOL[j] + '">' + VCN[j] + '</b>';
        t.chs.forEach(function (ch, i) {
          var p = vs[i][j], locked = j === t.gv || t.show, bad = (mk.bad[i] || []).indexOf(j) >= 0, role = ''; H.pcs(t.key, t.minor, ch).forEach(function (c, q) { if (c.l === p.l && c.a === p.a) role = ['根', '3', '5', '7'][q]; });
          g += '<div class="hc' + (locked ? ' fx' : '') + (bad ? ' err' : '') + '" style="--vc:' + H.VCOL[j] + '">' + (locked ? '' : '<button type="button" data-hc="' + i + ',' + j + ',-1" aria-label="下げる">‹</button>') + '<span><em>' + N(p) + '</em><small>' + (role || '和音外') + '</small></span>' + (locked ? '' : '<button type="button" data-hc="' + i + ',' + j + ',1" aria-label="上げる">›</button>') + '</div>';
        });
      }
      var gr = $('#hGrid', body); gr.style.setProperty('--n', t.chs.length); gr.innerHTML = g;
      var res = '';
      if (t.make) {
        var okAll = true, lines = t.chs.map(function (ch, i) {
          var p = vs[i][S.mv], inC = H.pcs(t.key, t.minor, ch).some(function (c) { return c.l === p.l && c.a === p.a; });
          if (!inC) okAll = false;
          return '<p class="hi ' + (inC ? 'tip' : 'ng') + '"><b>' + (inC ? '○' : '✕') + ' ' + (i + 1) + ' 番め ' + H.label(ch) + '</b>　' + N(p) + (inC ? ' は 和音の 音です' : ' は この和音（' + H.pcs(t.key, t.minor, ch).map(N).join('・') + '）の 音では ありません') + '</p>';
        }).join('');
        res = '<div class="' + (okAll ? 'hok' : 'hng') + '">' + (okAll ? '✅ 課題が できました。「この課題で 練習」を おそう' : '和音の 音に なるように 直そう') + '</div>' + lines + '<div class="frow"><button type="button" class="btn main" id="hStart"' + (okAll ? '' : ' disabled') + '>▶ この課題で 練習</button></div>';
      }
      else if (t.show) res = '<div class="hok">📖 お手本のポイント</div>' + H.explain(t.key, t.minor, t.chs, vs).map(function (x) { return '<p class="hi tip">' + esc(x) + '</p>'; }).join('');
      else {
        res = '<div class="hsc"><b>採点 ' + sc + '<small> / 100</small></b><span>' + grade(sc, ng) + '</span></div>';
        if (!iss.length) { res += '<div class="hok">🎉 ルール違反は ありません</div>'; }
        else {
          res += (ng ? '<div class="hng">✕ まちがい ' + ng + ' 個' + (warn ? '・⚠ 注意 ' + warn + ' 個' : '') + '</div>' : '<div class="hok">✅ ルール違反は ありません（⚠ 注意 ' + warn + ' 個）</div>');
          res += iss.slice().sort(function (a, b) { return (b.ng ? 1 : 0) - (a.ng ? 1 : 0) || a.i - b.i; }).map(function (x) {
            var where = x.i === x.j ? H.label(t.chs[x.i]) : H.label(t.chs[x.i]) + ' → ' + H.label(t.chs[x.j]);
            return '<p class="hi ' + (x.ng ? 'ng' : 'wn') + '"><b>' + (x.ng ? '✕' : '⚠') + ' ' + where + '</b>　' + esc(x.msg) + '</p>';
          }).join('');
        }
        if (!ng && !t.done) { t.done = true; GK.fx('fanfare'); if (!t.free && !t.custom && !t.paid) { t.paid = true; GK.earn(sc === 100 ? 15 : 8); } if (sc === 100) GK.confetti && GK.confetti(30); }
      }
      $('#hRes', body).innerHTML = res;
      var mb = $('#hModel', body); if (mb) mb.textContent = t.show ? '✏️ 自分のに もどる' : '📖 お手本';
    }
  };
})();
