/* =========================================================
   楽典ラボ：学びを 定着させる しくみ
   ・習熟の記録（問題の種類ごと）と 間隔反復（箱方式：1・3・7・14・30 日あとに 復習）
   ・🔁 今日の復習　・🧭 力だめし（診断）　・🗺 学習マップ
   ・演習に 前の単元の問題を まぜる（インターリービング）
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, $ = GK.$, $$ = GK.$$, esc = GK.esc, V = GK.view, RW = GK.RW;
  var BOX_DAYS = [0, 1, 3, 7, 14, 30];

  /* ---------- 習熟の記録 ---------- */
  var skills = function () { return GK.store.get('skill', {}); };
  // 1 問ごとに 記録。同じ日に 何回 正解しても 箱は 1 つしか 上がらない（間をあけて 思い出せたか が 大事）
  GK.skillNote = function (id, ok) {
    if (!GK.Q.T[id]) return;
    var s = skills(), d = GK.dayNo(), r = s[id] || { n: 0, ok: 0, b: 0, d: d, rec: '', up: -1 };
    r.n++; if (ok) r.ok++;
    r.rec = (r.rec + (ok ? '1' : '0')).slice(-8);
    if (ok) { if (r.up !== d) { r.b = Math.min(5, r.b + 1); r.up = d; } r.d = d + BOX_DAYS[r.b]; }
    else { r.b = 0; r.d = d; r.up = -1; }
    s[id] = r; GK.store.set('skill', s);
  };
  // 0〜1：さいきん 8 回の 正解率 × 回数の 自信
  GK.skillScore = function (id) {
    var r = skills()[id]; if (!r || !r.rec) return 0;
    var ok = r.rec.split('').filter(function (c) { return c === '1'; }).length;
    return ok / r.rec.length * Math.min(1, r.rec.length / 4);
  };
  // new（まだ）・weak（苦手）・learning（練習中）・mastered（身についた）
  GK.skillState = function (id) {
    var r = skills()[id]; if (!r) return 'new';
    var sc = GK.skillScore(id), last = r.rec.charAt(r.rec.length - 1) === '1';
    if (!last || (r.rec.length >= 3 && sc < 0.5)) return 'weak';
    if (r.b >= 3 && sc >= 0.75) return 'mastered';
    return 'learning';
  };
  GK.unitMastery = function (uid) {
    var u = GK.UNIT[uid], res = { pct: 0, mastered: 0, learning: 0, weak: 0, new: 0, n: 0 }; if (!u) return res;
    u.types.forEach(function (id) { if (!GK.Q.T[id]) return; res.n++; res[GK.skillState(id)]++; res.pct += GK.skillScore(id); });
    res.pct = res.n ? Math.round(res.pct / res.n * 100) : 0;
    return res;
  };
  // 今日 復習する 種類（いちばん おくれている ものから）
  GK.dueTypes = function () {
    var s = skills(), d = GK.dayNo();
    return Object.keys(s).filter(function (id) { return GK.Q.T[id] && s[id].d <= d; })
      .sort(function (a, b) { return s[a].d - s[b].d || s[a].b - s[b].b; });
  };
  GK.nextReviewIn = function () {
    var s = skills(), d = GK.dayNo(), m = null;
    Object.keys(s).forEach(function (id) { if (GK.Q.T[id] && s[id].d > d && (m === null || s[id].d < m)) m = s[id].d; });
    return m === null ? null : m - d;
  };

  /* ---------- 演習に 前の単元の問題を まぜる ---------- */
  GK.mixReview = function (qs, uid) {
    var grp = GK.UNIT[uid].grp || 'theory', s = skills(), d = GK.dayNo();
    var c = Object.keys(s).filter(function (id) { var t = GK.Q.T[id]; return t && t.u !== uid && (GK.UNIT[t.u].grp || 'theory') === grp && !t.ear; })
      .sort(function (a, b) { return (s[a].d <= d ? 0 : 1) - (s[b].d <= d ? 0 : 1) || GK.skillScore(a) - GK.skillScore(b) || s[a].d - s[b].d; });
    var R = GK.rng(Math.floor(Math.random() * 1e9)), n = Math.min(2, c.length), at = [3, 7];
    for (var i = 0; i < n && at[i] < qs.length; i++) {
      try { var q = GK.Q.make(c[i], R, 2); q.mix = true; qs[at[i]] = q; } catch (e) { }
    }
    return qs;
  };

  /* ---------- 画面 ---------- */
  function shell(tab, body) {
    var due = GK.dueTypes().length;
    V.innerHTML = '<div class="split"><aside class="panel side"><h3>🧠 学習サポート</h3>' +
      [['due', '🔁 今日の復習', due ? due + ' 種類 たまっています' : 'いまは ありません'], ['diag', '🧭 力だめし', '今の実力を はかる（診断）'], ['map', '🗺 学習マップ', '単元ごとの 身につき具合']].map(function (x) {
        return '<button type="button" class="it" data-go="#learn/' + x[0] + '" aria-current="' + (tab === x[0]) + '"><b>' + x[1] + '</b><small>' + x[2] + '</small></button>';
      }).join('') + '</aside><section class="panel main"><div class="mbody" id="lbody"></div></section></div>';
    $('#lbody').innerHTML = body;
    return $('#lbody');
  }
  function chips(ids, max) {
    return '<div class="wrongs" style="justify-content:flex-start">' + ids.slice(0, max || 12).map(function (id) { return '<span>' + esc(GK.typeName(id)) + '</span>'; }).join('') + (ids.length > (max || 12) ? '<span>ほか ' + (ids.length - (max || 12)) + '</span>' : '') + '</div>';
  }
  // 問題を 解いて 結果を 見せる（main：まるごと 使う 場所）
  function runIn(main, qs, title, onDone) {
    main.innerHTML = ''; main.style.cssText = 'background:transparent;border:0';
    GK.runSet(main, { qs: qs, mode: title.test ? 'test' : 'prac', onEnd: function (res, n) { GK.checkBadges(); onDone(res, n, qs); } });
  }

  GK.route(/^learn(?:\/(due|diag|map))?$/, function (m) {
    var tab = m[1] || 'due';
    if (tab === 'due') dueView(); else if (tab === 'diag') diagView(); else mapView();
  });

  /* 🔁 今日の復習 */
  function dueView() {
    var due = GK.dueTypes(), s = skills(), seen = Object.keys(s).length;
    var html = '<div class="mhead"><h2 class="ttl">🔁 今日の復習</h2></div>';
    if (!seen) html += '<p>まだ 復習する ものが ありません。授業の 演習や テストを すると、<b>間をあけて 思い出す</b> タイミングで ここに たまります。</p><p class="note">人は 1 日たつと 約半分 忘れます。1 日後・3 日後・1 週間後… と 思い出すたびに 長く おぼえていられます。</p><div class="acts"><button type="button" class="btn main" data-go="#home">▶ 授業へ</button><button type="button" class="btn" data-go="#learn/diag">🧭 力だめしで はじめる</button></div>';
    else if (!due.length) { var nx = GK.nextReviewIn(); html += '<div class="res" style="flex:1"><div class="big">🎉</div><p class="msg">今日の復習は ぜんぶ おわり！</p><p class="note">' + (nx ? '次の 復習は ' + nx + ' 日後です。' : '') + '</p><div class="acts"><button type="button" class="btn" data-go="#drill">💪 まとめて演習</button><button type="button" class="btn" data-go="#learn/map">🗺 学習マップ</button></div></div>'; }
    else {
      html += '<p>間をあけて 思い出すと、記憶が 長く 定着します。<b>' + due.length + ' 種類</b> が 復習の 時期です（いちばん 10 問）。</p>' + chips(due, 14) +
        '<div class="frow" style="margin-top:auto"><button type="button" class="btn main big" id="lgo">▶ 復習をはじめる</button></div>';
    }
    var main = shell('due', html);
    var go = $('#lgo', main); if (go) go.onclick = startDue;
    function startDue() {
      var ids = GK.dueTypes().slice(0, 10), R = GK.rng(Math.floor(Math.random() * 1e9));
      var qs = GK.Q.set([], Math.min(10, Math.max(ids.length, 5)), R, { types: ids, ramp: false });
      var mm = $('.main', V);
      runIn(mm, qs, {}, function (res, n) {
        mm.style.cssText = '';
        mm.innerHTML = '<section class="panel res"><div class="big">' + n + '<small> / ' + qs.length + '</small></div><p class="msg">' + (n >= qs.length * 0.8 ? '🎉 しっかり 思い出せました！' : '👍 まちがえた ところは あした また 出ます') + '</p><div class="acts"><button type="button" class="btn" id="rv">📖 解説を見る</button>' + (GK.dueTypes().length ? '<button type="button" class="btn main" id="more">🔁 つづけて 復習</button>' : '') + '<button type="button" class="btn" data-go="#learn/map">🗺 学習マップ</button></div></section>';
        $('#rv').onclick = function () { GK.review(mm, res, function () { GK.go('#learn/due'); }); };
        var mo = $('#more'); if (mo) mo.onclick = function () { GK.go('#learn/due'); GK.render(); setTimeout(function () { var g = $('#lgo'); g && g.click(); }, 50); };
      });
    }
  }

  /* 🧭 力だめし（診断） */
  function diagView() {
    var last = GK.store.get('diag', null);
    var html = '<div class="mhead"><h2 class="ttl">🧭 力だめし（診断）</h2></div>' +
      '<p>各単元から 2 問ずつ（全 <b>' + (GK.UNITS.filter(function (u) { return (u.grp || 'theory') === 'theory'; }).length * 2) + ' 問</b>）。ヒントも 解説も なしで、今の 実力を はかります。<b>できなくて 当たり前</b> です。</p>' +
      '<p class="note">結果で「ここから 始めよう」が わかります。やった 日・結果は 学習マップにも 反映されます。</p>' +
      (last ? '<p class="note">前回：' + esc(last.date) + '（' + last.ok + ' / ' + last.n + ' 問）</p>' + diagRows(last) : '') +
      '<div class="frow" style="margin-top:auto"><button type="button" class="btn main big" id="dgo">▶ 力だめしを はじめる</button></div>';
    var main = shell('diag', html);
    $('#dgo', main).onclick = function () {
      var R = GK.rng(Math.floor(Math.random() * 1e9)), qs = [];
      GK.UNITS.filter(function (u) { return (u.grp || 'theory') === 'theory'; }).forEach(function (u) { GK.Q.set([u.id], 2, R, { noEar: true, st: 2 }).forEach(function (q) { qs.push(q); }); });
      var mm = $('.main', V);
      runIn(mm, qs, { test: true }, function (res, n) {
        var us = {}; res.forEach(function (r) { var u = r.q.u; us[u] = us[u] || [0, 0]; us[u][1]++; if (r.ok) us[u][0]++; });
        var d = { date: GK.today(), ok: n, n: qs.length, us: us }; GK.store.set('diag', d);
        mm.style.cssText = ''; mm.innerHTML = '<section class="panel main" style="border:0;box-shadow:none"><div class="mbody"><div class="mhead"><h2 class="ttl">🧭 結果：' + n + ' / ' + qs.length + '</h2></div>' + diagAdvice(d) + diagRows(d) +
          '<div class="acts" style="margin-top:auto"><button type="button" class="btn" id="rv">📖 まちがえた問題の解説</button><button type="button" class="btn" data-go="#learn/map">🗺 学習マップ</button></div></div></section>';
        $('#rv').onclick = function () { GK.review(mm, res, function () { GK.go('#learn/diag'); }); };
      });
    };
  }
  function diagRows(d) {
    return '<div class="dgrid">' + GK.UNITS.filter(function (u) { return d.us[u.id]; }).map(function (u) {
      var x = d.us[u.id], k = x[0] >= x[1] ? 'g' : x[0] === 0 ? 'r' : 'y';
      return '<button type="button" class="drow ' + k + '" data-go="#' + u.id + '"><i>' + u.no + '</i><span>' + esc(u.title) + '</span><b>' + (k === 'g' ? '◎ できている' : k === 'y' ? '△ あと少し' : '× ここから') + '</b></button>';
    }).join('') + '</div>';
  }
  function diagAdvice(d) {
    var first = GK.UNITS.filter(function (u) { return d.us[u.id] && d.us[u.id][0] < d.us[u.id][1]; })[0];
    var good = GK.UNITS.filter(function (u) { return d.us[u.id] && d.us[u.id][0] >= d.us[u.id][1]; }).length;
    return '<p>' + good + ' 単元は もう できています。' + (first ? '<b>おすすめは 「' + esc(first.title) + '」から</b> 順番に。' : 'すべて よくできています！ ゲームで 腕だめしを。') + '</p>' + (first ? '<div class="acts" style="justify-content:flex-start"><button type="button" class="btn main" data-go="#' + first.id + '">▶ ' + esc(first.title) + ' へ</button></div>' : '');
  }

  /* 🗺 学習マップ */
  function mapView() {
    var units = GK.UNITS.concat(GK.HUNITS || [], GK.CPUNITS || []);
    var weak = []; units.forEach(function (u) { u.types.forEach(function (id) { if (GK.skillState(id) === 'weak') weak.push(id); }); });
    weak.sort(function (a, b) { return GK.skillScore(a) - GK.skillScore(b); });
    var html = '<div class="mhead"><h2 class="ttl">🗺 学習マップ</h2></div>' +
      '<div class="legend"><span><i class="m"></i>身についた</span><span><i class="l"></i>練習中</span><span><i class="w"></i>苦手</span><span><i class="n"></i>まだ</span></div>' +
      '<div class="mgrid">' + units.map(function (u) {
        var x = GK.unitMastery(u.id), t = Math.max(1, x.n);
        return '<button type="button" class="mrow" data-go="#' + u.id + '"><span class="mt"><i>' + u.no + '</i>' + esc(u.title) + (GK.prog(u.id).pass ? ' <em>合格</em>' : '') + '</span><span class="mb">' +
          ['mastered', 'learning', 'weak', 'new'].map(function (k, i) { return '<i class="' + 'mlwn'.charAt(i) + '" style="width:' + (x[k] / t * 100) + '%"></i>'; }).join('') + '</span><b>' + x.pct + '%</b></button>';
      }).join('') + '</div>' +
      (weak.length ? '<h3 style="margin:6px 0 2px">⚠ 苦手な ところ</h3>' + chips(weak, 10) + '<div class="acts" style="justify-content:flex-start"><button type="button" class="btn main" id="wgo">💪 苦手を 練習（10 問）</button></div>' : '<p class="note">苦手な ところは ありません。この調子で！</p>');
    var main = shell('map', html), w = $('#wgo', main);
    if (w) w.onclick = function () {
      var R = GK.rng(Math.floor(Math.random() * 1e9)), qs = GK.Q.set([], 10, R, { types: weak.slice(0, 10), ramp: false }), mm = $('.main', V);
      runIn(mm, qs, {}, function (res, n) {
        mm.style.cssText = ''; mm.innerHTML = '<section class="panel res"><div class="big">' + n + '<small> / ' + qs.length + '</small></div><div class="acts"><button type="button" class="btn" id="rv">📖 解説を見る</button><button type="button" class="btn main" data-go="#learn/map">🗺 学習マップへ</button></div></section>';
        $('#rv').onclick = function () { GK.review(mm, res, function () { GK.go('#learn/map'); }); };
      });
    };
  }
})();
