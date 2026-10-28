/* =========================================================
   楽典ラボ：和声エディタ（自分で 4 声を 書いて、ルールを 自動チェック）
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, H = GK.H, $ = GK.$, $$ = GK.$$, esc = GK.esc;
  var N = function (p) { return GK.nm(p); };
  GK.HTOOLS.push({ go: '#tools/hlab', ic: '🎼', ttl: '和声エディタ', en: 'Harmony Lab', gl: '4 声を 自分で 書いて 自動チェック' });

  var S = GK.store.get('hlab', { type: 'bass', lv: 1 });
  var mid = function (p) { return M.midi(p); };

  function pick(a, R) { return a[Math.floor(R() * a.length)]; }
  function newTask() {
    var R = GK.rng(Math.floor(Math.random() * 1e9)), minor = S.lv >= 2 && R() < 0.3, ok = H.PROGS.filter(function (p) { return p.lv <= S.lv && p.lv >= Math.max(1, S.lv - 1) && !(minor && p.majorOnly); });
    var key = pick(minor ? H.KEYS.min : H.KEYS.maj, R), pr = pick(ok, R), model = null;
    for (var t = 0; t < 5 && !model; t++) { model = H.solve(key, minor, pr.chs, null, R); if (!model) { pr = pick(ok, R); } }
    S.t = { key: key, minor: minor, pr: pr, chs: pr.chs, model: model, gv: S.type === 'bass' ? 3 : 0, show: false, done: false };
    S.v = pr.chs.map(function (ch, i) {
      return [0, 1, 2, 3].map(function (j) {
        if (j === S.t.gv) return model[i][j];
        var L = H.voicePitches(key, minor, ch, j), m = (mid(H.RANGE[j][0]) + mid(H.RANGE[j][1])) / 2, b = L[0];
        L.forEach(function (x) { if (Math.abs(mid(x.p) - m) < Math.abs(mid(b.p) - m)) b = x; });
        return b.p;
      });
    });
  }

  GK.harmLab = function (body) {
    if (!S.t) newTask();
    body.innerHTML = '<div class="toolw hl"><div class="ctl"><div class="seg"><button type="button" data-ht="bass" aria-pressed="' + (S.type === 'bass') + '">バス課題</button><button type="button" data-ht="sop" aria-pressed="' + (S.type === 'sop') + '">ソプラノ課題</button></div>' +
      '<div class="seg"><button type="button" data-hl="1" aria-pressed="' + (S.lv === 1) + '">やさしい</button><button type="button" data-hl="2" aria-pressed="' + (S.lv === 2) + '">ふつう</button><button type="button" data-hl="3" aria-pressed="' + (S.lv === 3) + '">むずかしい</button></div>' +
      '<button type="button" class="btn sm" id="hNew">🎲 新しい課題</button><button type="button" class="btn sm" id="hPlay">🔊 聴く</button><button type="button" class="btn sm" id="hModel">📖 お手本</button></div>' +
      '<div class="out" id="hInfo"></div><div class="fig sc" id="hStaff" style="flex:1 1 0;min-height:130px"></div><div class="hgrid" id="hGrid"></div><div class="hres" id="hRes"></div></div>';
    body.onclick = function (e) {
      var b = e.target.closest('[data-ht],[data-hl],#hNew,#hPlay,#hModel,[data-hc]'); if (!b) return;
      if (b.dataset.ht) { S.type = b.dataset.ht; newTask(); }
      else if (b.dataset.hl) { S.lv = +b.dataset.hl; newTask(); }
      else if (b.id === 'hNew') newTask();
      else if (b.id === 'hPlay') { H.play(cur()); return; }
      else if (b.id === 'hModel') { S.t.show = !S.t.show; }
      else if (b.dataset.hc) {
        if (S.t.show) return;
        var a = b.dataset.hc.split(','), i = +a[0], j = +a[1], d = +a[2], L = H.voicePitches(S.t.key, S.t.minor, S.t.chs[i], j), k = 0;
        L.forEach(function (x, q) { if (mid(x.p) === mid(S.v[i][j])) k = q; });
        k = Math.max(0, Math.min(L.length - 1, k + d)); S.v[i][j] = L[k].p; M.play([[M.str(L[k].p), 1]], 100);
      }
      GK.store.set('hlab', { type: S.type, lv: S.lv });
      if (b.dataset.ht || b.dataset.hl) GK.harmLab(body); else draw();
    };
    draw();
    function cur() { return S.t.show ? S.t.model : S.v; }
    function draw() {
      var t = S.t, vs = cur(), iss = H.checkAll(t.key, t.minor, t.chs, vs), mk = H.marksOf(iss), ng = H.ngCount(iss), warn = iss.length - ng;
      $('#hInfo', body).innerHTML = '<b>' + esc(H.keyName(t.key, t.minor)) + '</b><span>' + t.pr.name + '</span><span>' + (S.type === 'bass' ? '🟣 バスは 与えられています。ソプラノ・アルト・テノールを 書こう' : '🔴 ソプラノは 与えられています。アルト・テノール・バスを 書こう') + '</span>' + (t.show ? '<span class="note">📖 お手本を 表示中</span>' : '');
      M.satb($('#hStaff', body), { key: t.key, minor: t.minor, color: true, names: true, zoom: 2.6, sp: 58, marks: mk.marks, chords: t.chs.map(function (ch, i) { return { v: vs[i], lab: H.label(ch), sub: H.figure(ch), bad: mk.bad[i] }; }) });
      var g = '<i></i>' + t.chs.map(function (ch, i) { return '<b class="hh">' + H.label(ch) + '</b>'; }).join('');
      for (var j = 0; j < 4; j++) {
        g += '<b class="hv" style="color:' + H.VCOL[j] + '">' + 'SATB'.charAt(j) + '</b>';
        t.chs.forEach(function (ch, i) {
          var p = vs[i][j], locked = j === t.gv || t.show, bad = (mk.bad[i] || []).indexOf(j) >= 0, role = ''; H.pcs(t.key, t.minor, ch).forEach(function (c, q) { if (c.l === p.l && c.a === p.a) role = ['根', '3', '5', '7'][q]; });
          g += '<div class="hc' + (locked ? ' fx' : '') + (bad ? ' err' : '') + '" style="--vc:' + H.VCOL[j] + '">' + (locked ? '' : '<button type="button" data-hc="' + i + ',' + j + ',-1" aria-label="下げる">‹</button>') + '<span><em>' + N(p) + '</em><small>' + role + '</small></span>' + (locked ? '' : '<button type="button" data-hc="' + i + ',' + j + ',1" aria-label="上げる">›</button>') + '</div>';
        });
      }
      var gr = $('#hGrid', body); gr.style.setProperty('--n', t.chs.length); gr.innerHTML = g;
      var res = '';
      if (t.show) res = '<div class="hok">📖 お手本のポイント</div>' + H.explain(t.key, t.minor, t.chs, vs).map(function (x) { return '<p class="hi tip">' + esc(x) + '</p>'; }).join('');
      else if (!iss.length) { res = '<div class="hok">🎉 かんぺき！ ルール違反は ありません</div>'; if (!t.done) { t.done = true; GK.earn(15); GK.fx('fanfare'); GK.confetti && GK.confetti(30); } }
      else {
        res = (ng ? '<div class="hng">✕ まちがい ' + ng + ' 個' + (warn ? '・⚠ 注意 ' + warn + ' 個' : '') + '</div>' : '<div class="hok">✅ ルール違反は ありません（⚠ 注意 ' + warn + ' 個）</div>');
        if (!ng && !t.done) { t.done = true; GK.earn(15); GK.fx('fanfare'); }
        res += iss.slice().sort(function (a, b) { return (b.ng ? 1 : 0) - (a.ng ? 1 : 0) || a.i - b.i; }).map(function (x) {
          var where = x.i === x.j ? H.label(t.chs[x.i]) : H.label(t.chs[x.i]) + ' → ' + H.label(t.chs[x.j]);
          return '<p class="hi ' + (x.ng ? 'ng' : 'wn') + '"><b>' + (x.ng ? '✕' : '⚠') + ' ' + where + '</b>　' + esc(x.msg) + '</p>';
        }).join('');
      }
      $('#hRes', body).innerHTML = res;
      $('#hModel', body).textContent = t.show ? '✏️ 自分のに もどる' : '📖 お手本';
    }
  };
})();
