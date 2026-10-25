/* =========================================================
   楽典ラボ：🎮 ゲーム（⏱ タイムアタック ／ 🏆 クラス対戦）
   クラス対戦は Firebase Realtime Database の REST ＋ ストリーム（論理表現ラボ・数学Aラボと同じしくみ）
   rooms/g{code} = { cfg: { m, us, t }, state: lobby|play|end, round, seed, startAt, host, players: { pid: { n, s, c, k, w, r, d, b } } }
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, $ = GK.$, $$ = GK.$$, esc = GK.esc, S = GK.S, RW = GK.RW;
  var V = GK.view, api = GK.api;
  var ROOM = function (c) { return 'rooms/g' + c; };
  var OFF = 0; // サーバーとの 時計のずれ
  var now = function () { return Date.now() + OFF; };

  /* ---------- 範囲 ---------- */
  var GR = [['all', '全範囲', null], ['a', '音名・リズム', ['u01', 'u02', 'u03', 'u04']], ['b', '音程・音階', ['u05', 'u06', 'u07', 'u08']], ['c', '調・和音', ['u09', 'u10', 'u11', 'u12']], ['d', '楽語・記号', ['u13', 'u14', 'u15']], ['units', '単元をえらぶ', null]];
  var unitsOf = function (cfg) {
    if (cfg.m === 'units') { var us = (cfg.us || '').split(',').filter(function (u) { return GK.UNIT[u]; }); if (us.length) return us; }
    var g = GR.filter(function (x) { return x[0] === cfg.m; })[0];
    return g && g[2] ? g[2] : GK.UNITS.map(function (u) { return u.id; });
  };
  var rangeName = function (cfg) {
    if (cfg.m === 'units') { var us = unitsOf(cfg); return us.length > 3 ? us.length + ' 単元' : us.map(function (u) { return GK.UNIT[u].title; }).join('・'); }
    return (GR.filter(function (x) { return x[0] === cfg.m; })[0] || GR[0])[1];
  };
  /* ---------- ルール（数学Aラボと同じ） ---------- */
  var BONUS = { 1: 2, 2: 4, 3: 6 }, PENALTY = 2, COMBO_BONUS = 1; // 正解で もどる時間は 少しだけ
  var bonusSec = function (st, ok) { return Math.round(BONUS[st] * Math.max(0.3, Math.pow(0.97, ok)) * 10) / 10; };
  var mult = function (k) { return k >= 40 ? 3 : k >= 30 ? 2.5 : k >= 20 ? 2 : k >= 10 ? 1.5 : 1; };
  var RULER = [[0, 'ウォーミングアップ中'], [5, '小テスト 1 回分'], [10, '楽典ドリル 1 ページ分'], [20, '定期テストの楽典 1 回分'], [30, '楽典検定 1 回分'], [45, '音大入試の楽典 1 回分'], [60, '楽典の問題集 1 冊分']];
  var ruler = function (n) { var r = RULER[0][1]; RULER.forEach(function (x) { if (n >= x[0]) r = x[1]; }); return r; };
  // 時間が たつほど 時計が速く進む（60 秒から だんだん、上限なし：2 分で 約 1.7 倍、3 分で 2.3 倍）。上手な人も 必ず 終わる
  var DRAIN0 = 60, DRAINK = 90, HARD_END = 300; // HARD_END：念のため 5 分で 必ず終わり
  var drainRate = function (sec) { return 1 + Math.max(0, sec - DRAIN0) / DRAINK; };
  // 問題：はじめの 8 問は ★1 の種類だけ、22 問目までは ★2 まで、そのあとは 全部（だんだん むずかしく）
  function makeQs(cfg, seed) {
    var R = GK.rng(seed), T = GK.Q.T, all = GK.Q.typesOf(unitsOf(cfg), true), out = [], bag = [], last = null, seen = {};
    for (var i = 0; i < 160; i++) {
      var tr = i < 8 ? 1 : i < 22 ? 2 : 3;
      var pool = all.filter(function (id) { return T[id].st <= tr; }); if (!pool.length) pool = all;
      bag = bag.filter(function (id) { return pool.indexOf(id) >= 0; });
      if (!bag.length) bag = GK.shuffle(pool.slice(), R);
      var id = bag.pop(); if (id === last && bag.length) { bag.unshift(id); id = bag.pop(); } last = id;
      try { out.push(GK.Q.fresh(id, R, Math.max(T[id].st, tr), seen)); } catch (e) { console.error(id, e); }
    }
    return out;
  }

  /* =========================================================
     ゲームのトップ
     ========================================================= */
  var TA = GK.store.get('taSel', { m: 'all', us: '', t: 90 });
  GK.route(/^game$/, function () { top(); });
  GK.route(/^join=(\d{4})$/, function (m) { top(m[1]); });
  function top(code) {
    var lv = GK.levelOf(RW.coins);
    V.innerHTML = '<div class="gcards">' +
      '<section class="panel gcard"><h3>⏱ タイムアタック</h3><p class="note">時間がなくなるまで 何問とけるか。正解すると 時間がもどる（★が多い問題ほど たくさん）。続けて正解すると コンボで 点数アップ。</p>' +
      '<div class="frow"><span>範囲</span><div class="seg">' + GR.map(function (g) { return '<button type="button" data-tm="' + g[0] + '" aria-pressed="' + (TA.m === g[0]) + '">' + g[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="frow" id="tus"' + (TA.m === 'units' ? '' : ' hidden') + '><div class="upick" style="width:100%">' + GK.UNITS.map(function (u) { return '<button type="button" data-tu="' + u.id + '" aria-pressed="' + (TA.us.split(',').indexOf(u.id) >= 0) + '"><i>' + u.no + '</i>' + esc(u.title) + '</button>'; }).join('') + '</div></div>' +
      '<div class="frow"><span>持ち時間</span><div class="seg">' + [60, 90, 120, 180].map(function (t) { return '<button type="button" data-tt="' + t + '" aria-pressed="' + (TA.t === t) + '">' + t + ' 秒</button>'; }).join('') + '</div></div>' +
      '<div class="frow" style="margin-top:auto"><button type="button" class="btn main big" id="taGo">▶ スタート</button><span class="note">ベスト <b style="font-family:var(--font-en);font-size:20px;color:var(--ink)">' + GK.fmtN(RW.best[TA.m] || 0) + '</b> 点</span></div></section>' +
      '<section class="panel gcard"><h3>🏆 クラス対戦</h3><p class="note">先生の部屋に 番号で参加。<b>タイムアタック型</b>（決めた時間で 何問とけるか）と <b>🎼 アンサンブル・クイズ</b>（1 問ずつ 全員で答えて、クラスで 曲を完成させる）が あります。</p>' +
      '<input class="in" id="jcode" inputmode="numeric" maxlength="4" placeholder="部屋番号" value="' + esc(code || '') + '">' +
      '<input class="in" id="jnick" maxlength="12" placeholder="ニックネーム" value="' + esc(S.nick || '') + '">' +
      '<div class="frow"><button type="button" class="btn main" id="jGo">参加する ▶</button></div>' +
      '<div class="frow" style="margin-top:auto;border-top:1px dashed var(--line);padding-top:10px"><span>先生</span><button type="button" class="btn" id="mkRoom">🏫 タイムアタック型</button><button type="button" class="btn" id="mkEns">🎼 アンサンブル・クイズ</button><button type="button" class="btn ghost" id="rwB">🏅 ' + lv.name + '・バッジ ' + Object.keys(RW.badges).length + '/' + GK.BADGES.length + '</button></div></section></div>';
    V.onclick = function (e) {
      var b = e.target.closest('[data-tm],[data-tt],[data-tu],#taGo,#jGo,#mkRoom,#mkEns,#rwB'); if (!b) return;
      if (b.dataset.tm) { TA.m = b.dataset.tm; $$('[data-tm]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#tus').hidden = TA.m !== 'units'; }
      if (b.dataset.tt) { TA.t = +b.dataset.tt; $$('[data-tt]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }
      if (b.dataset.tu) { var us = TA.us ? TA.us.split(',') : [], i = us.indexOf(b.dataset.tu); if (i >= 0) us.splice(i, 1); else us.push(b.dataset.tu); TA.us = us.join(','); b.setAttribute('aria-pressed', i < 0); }
      GK.store.set('taSel', TA);
      if (b.id === 'taGo') { if (TA.m === 'units' && !TA.us) { GK.toast('単元をえらんでください'); return; } GK.go('#ta'); }
      if (b.id === 'jGo') join($('#jcode').value.trim(), $('#jnick').value.trim());
      if (b.id === 'mkRoom') makeRoom();
      if (b.id === 'mkEns') makeEnsRoom();
      if (b.id === 'rwB') GK.openDlg('<h3>🏅 段位・バッジ<button type="button" class="btn ghost sm x" data-d="close">とじる</button></h3>' + GK.rewardsHTML());
    };
    if (code) setTimeout(function () { $('#jnick') && $('#jnick').focus(); }, 50);
  }

  /* =========================================================
     ゲーム本体（ひとり・対戦で共通）
     ========================================================= */
  var G = null;
  function newGame(box, cfg, seed, mode, startAt, hooks) {
    stopGame();
    G = { cfg: cfg, qs: makeQs(cfg, seed), i: 0, mode: mode, startAt: startAt, score: 0, combo: 0, maxCombo: 0, ok: 0, ng: 0, res: [], over: false, hooks: hooks || {}, box: box,
      left: cfg.t * 1000, last: startAt };
    box.innerHTML = '<section class="panel qz" style="position:relative"><div class="ta-top"><span class="tm" id="gtm"></span><div class="tbar" id="gbar"><i></i></div><span class="cb" id="gcb"></span><span class="sc" id="gsc">0<small> 点</small></span>' + (mode === 'battle' ? '<span class="rank" id="grk">−</span>' : '') + '</div>' + GK.STAGE.html() + '<div id="gq" style="flex:1;min-height:0;display:flex;flex-direction:column"></div></section>';
    G.timer = setInterval(tick, 100);
    GK.quizKeys(function () { return G && G.qel; });
    tick();
  }
  function stopGame() { if (G) { clearInterval(G.timer); G.dead = true; } }
  GK.onLeave(function () { stopGame(); G = null; });
  function timeLeft() {
    if (G.mode === 'battle') return Math.max(0, G.startAt + G.cfg.t * 1000 - now());
    var t = now();
    if (G.started && t > G.last) { G.left -= (t - G.last) * drainRate((t - G.startAt) / 1000); G.last = t; }
    return Math.max(0, G.left);
  }
  function tick() {
    if (!G || G.dead) return;
    var t = now(), gq = $('#gq', G.box);
    if (!gq) { stopGame(); return; }
    if (t < G.startAt) {
      var n = Math.ceil((G.startAt - t) / 1000);
      if (G.cd !== n) { G.cd = n; gq.innerHTML = '<div class="count">' + n + '</div>'; GK.fx('count'); }
      return;
    }
    if (!G.started) { G.started = true; G.last = now(); GK.fx('go'); showQ(); }
    var left = timeLeft(), max = G.mode === 'battle' ? G.cfg.t * 1000 : Math.max(G.cfg.t * 1000, 1);
    var bar = $('#gbar', G.box); if (bar) { bar.firstChild.style.width = Math.min(100, left / max * 100) + '%'; bar.classList.toggle('low', left < 10000); }
    var tm = $('#gtm', G.box), dr = G.mode === 'battle' ? 1 : drainRate((now() - G.startAt) / 1000);
    if (tm) tm.innerHTML = Math.ceil(left / 1000) + '秒' + (dr > 1.05 ? '<small style="color:var(--warm);font-size:13px;margin-left:4px;font-family:var(--font-en);font-style:italic">accel. ×' + dr.toFixed(1) + '</small>' : '');
    GK.STAGE.tick(G, left);
    if (G.mode !== 'battle' && t - G.startAt > HARD_END * 1000) left = 0;
    if (left <= 0 && !G.over) { G.over = true; clearInterval(G.timer); G.dur = (now() - G.startAt) / 1000; GK.fx('whistle'); G.hooks.end && G.hooks.end(G); }
  }
  function showQ() {
    var gq = $('#gq', G.box), q = G.qs[G.i % G.qs.length];
    gq.innerHTML = '<div class="qz" style="padding:6px 0 0"></div>';
    G.qel = gq.firstChild;
    G.qstart = now();
    GK.drawQ(G.qel, q, {
      top: '<span>第 ' + (G.i + 1) + ' 問</span>', noFb: true,
      onPick: function (k, ok) {
        if (G.over) return;
        G.res.push({ q: q, pick: k, ok: ok });
        var pop = '';
        if (ok) {
          G.combo++; G.ok++; G.maxCombo = Math.max(G.maxCombo, G.combo);
          var ff = GK.STAGE.ffOn(G), pts = Math.round(q.st * 30 * mult(G.combo) * (ff ? 2 : 1));
          G.score += pts; pop = '+' + pts + (ff ? ' ff' : '');
          if (G.mode !== 'battle') {
            var b = bonusSec(q.st, G.ok - 1) + (G.combo % 5 === 0 ? COMBO_BONUS : 0);
            G.left = Math.min(Math.max(G.cfg.t * 1000, timeLeft()), timeLeft() + b * 1000); G.last = now();
            pop += '　+' + b + '秒';
          }
          G.qel.classList.add('flash-ok');
          GK.STAGE.correct(G, G.qel.querySelector('.ch button.ok'));
        } else {
          G.combo = 0; G.ng++; pop = '✕';
          if (G.mode !== 'battle') { G.left = timeLeft() - PENALTY * 1000; G.last = now(); pop += '　−' + PENALTY + '秒'; }
          G.qel.classList.add('flash-ng');
          GK.STAGE.wrong(G);
        }
        popup(pop, !ok);
        $('#gsc', G.box).innerHTML = GK.fmtN(G.score) + '<small> 点</small>';
        $('#gcb', G.box).textContent = G.combo >= 3 ? '🔥 ' + G.combo + ' コンボ' + (mult(G.combo) > 1 ? ' ×' + mult(G.combo) : '') : '';
        G.hooks.answer && G.hooks.answer(G);
        setTimeout(function () { if (G && !G.over && !G.dead) { G.i++; showQ(); } }, ok ? 380 : 1100);
      }
    });
  }
  function popup(t, ng) {
    var p = document.createElement('div'); p.className = 'pop' + (ng ? ' ng' : ''); p.textContent = t;
    var sc = $('#gsc', G.box); if (!sc) return;
    p.style.right = '16px'; p.style.top = (G.box.querySelector('#stg') ? G.box.querySelector('#stg').offsetTop + G.box.querySelector('#stg').offsetHeight + 34 : 78) + 'px';
    G.box.firstChild.appendChild(p); setTimeout(function () { p.remove(); }, 800);
  }

  /* ---------- ⏱ タイムアタック ---------- */
  GK.route(/^ta$/, function () {
    var cfg = { m: TA.m, us: TA.us, t: TA.t };
    newGame(V, cfg, Math.floor(Math.random() * 1e9), 'solo', now() + 3000, { end: soloEnd });
  });
  function soloEnd(g) {
    var best = RW.best[g.cfg.m] || 0, nb = g.score > best;
    if (nb) RW.best[g.cfg.m] = g.score;
    RW.taBest = Math.max(RW.taBest, g.score); RW.maxCombo = Math.max(RW.maxCombo, g.maxCombo);
    GK.rwSave(); GK.earn(Math.floor(g.score / 20)); GK.checkBadges();
    if (nb && g.score > 0) GK.confetti(60);
    var mm = Math.floor(g.dur / 60), ss = Math.round(g.dur % 60);
    setTimeout(function () { GK.STAGE.applause(Math.min(1, 0.3 + GK.STAGE.venueOf(g.score) * 0.1 + (nb ? 0.3 : 0))); }, 300);
    V.innerHTML = '<section class="panel res"><p class="note">🎭 カーテンコール・' + esc(rangeName(g.cfg)) + '・⏱ ' + (mm ? mm + ' 分 ' : '') + ss + ' 秒 つづいた</p>' + GK.STAGE.curtain(g) + '<div class="big">' + GK.fmtN(g.score) + '<small> 点</small></div>' +
      '<p class="msg">' + (nb ? '🎉 ベスト更新！' : 'ベスト ' + GK.fmtN(best) + ' 点') + '　正解 ' + g.ok + ' 問・最大 ' + g.maxCombo + ' コンボ</p><p>📏 <b>' + g.ok + ' 問正解 ≒ ' + ruler(g.ok) + '</b></p>' +
      '<div class="acts"><button type="button" class="btn" id="rep">🔊 あなたの演奏を聴く</button>' + (g.res.length ? '<button type="button" class="btn" id="rv">📖 ' + (g.ng ? 'まちがえた ' + g.ng + ' 問の解説' : '解説を見る') + '</button>' : '') + '<button type="button" class="btn" id="brag">📣 自慢する</button><button type="button" class="btn main" data-go="#ta">▶ もう一度</button><button type="button" class="btn ghost" data-go="#game">◀ ゲームのトップ</button></div></section>';
    $('#rep').onclick = function () { GK.STAGE.replay(g); };
    $('#brag').onclick = function () { GK.share('🎼 楽典ラボ タイムアタック（' + rangeName(g.cfg) + '）で ' + GK.fmtN(g.score) + ' 点！ ' + GK.STAGE.VENUES[GK.STAGE.venueOf(g.score)][2] + ' 公演まで とどいた！ ' + g.ok + ' 問正解・最大 ' + g.maxCombo + ' コンボ（' + ruler(g.ok) + '）\n' + location.origin + location.pathname); };
    var rv = $('#rv'); if (rv) rv.onclick = function () { GK.review(V, g.res, function () { GK.go('#game'); }); };
  }

  /* =========================================================
     🏆 クラス対戦：つなぐ道具
     ========================================================= */
  function pid() { if (!S.pid) { S.pid = 'p' + Math.random().toString(36).slice(2, 10); GK.saveS(); } return S.pid; }
  function listen(path, cb) {
    var tree = null, es = null, poll = null, closed = false;
    function setAt(p, val) {
      var keys = p.split('/').filter(Boolean);
      if (!keys.length) { tree = val; return; }
      if (tree === null || typeof tree !== 'object') tree = {};
      var o = tree;
      for (var i = 0; i < keys.length - 1; i++) { if (o[keys[i]] == null || typeof o[keys[i]] !== 'object') o[keys[i]] = {}; o = o[keys[i]]; }
      if (val === null) delete o[keys[keys.length - 1]]; else o[keys[keys.length - 1]] = val;
    }
    function startPoll() {
      if (poll || closed) return;
      poll = setInterval(function () { api('GET', path).then(function (v) { tree = v; cb(tree); }, function () { }); }, 1500);
    }
    try {
      es = new EventSource(GK.dbBase() + '/' + path + '.json');
      es.addEventListener('put', function (e) { var d = JSON.parse(e.data); setAt(d.path, d.data); cb(tree); });
      es.addEventListener('patch', function (e) { var d = JSON.parse(e.data), p = d.path.replace(/\/$/, ''); Object.keys(d.data || {}).forEach(function (k) { setAt(p + '/' + k, d.data[k]); }); cb(tree); });
      es.onerror = function () { if (es.readyState === 2) startPoll(); };
    } catch (e) { startPoll(); }
    return function () { closed = true; if (es) es.close(); clearInterval(poll); };
  }
  function syncClock(code) {
    var t0 = Date.now(), p = ROOM(code) + '/clock/' + pid();
    return api('PUT', p, { '.sv': 'timestamp' }).then(function (ts) {
      var t1 = Date.now();
      if (typeof ts === 'number') OFF = ts - (t0 + t1) / 2;
      api('DELETE', p).catch(function () { });
    }, function () { });
  }
  function joinUrl(code) {
    var u = location.origin + location.pathname + '#join=' + code;
    return u;
  }
  function playersOf(room, round) {
    var ps = room && room.players || {};
    return Object.keys(ps).map(function (k) { var p = ps[k]; p.id = k; return p; })
      .filter(function (p) { return p && p.n && (round == null || p.r === round); })
      .sort(function (a, b) { return round == null ? (b.b || 0) - (a.b || 0) : (b.s || 0) - (a.s || 0) || (b.c || 0) - (a.c || 0); });
  }
  var qrLib = null;
  function drawQR(el, url) {
    var put = function () { if (!el.isConnected || !window.qrcode) return; var q = window.qrcode(0, 'M'); q.addData(url); q.make(); el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); };
    if (window.qrcode) { put(); return; }
    if (!qrLib) { qrLib = document.createElement('script'); qrLib.src = 'js/vendor/qrcode.js'; document.head.appendChild(qrLib); } // qrcode-generator（MIT）
    qrLib.addEventListener('load', put);
  }

  /* ---------- 先生：部屋 ---------- */
  function makeRoom() {
    var cfg = { m: TA.m === 'units' && !TA.us ? 'all' : TA.m, us: TA.us || '', t: 90 };
    var tryOne = function (n) {
      var code = String(1000 + Math.floor(Math.random() * 9000));
      return api('GET', ROOM(code)).then(function (v) {
        if (v && n < 6) return tryOne(n + 1);
        return api('PUT', ROOM(code), { cfg: cfg, state: 'lobby', round: 0, seed: 0, startAt: 0, host: pid(), created: { '.sv': 'timestamp' } })
          .then(function () { GK.go('#host/' + code); });
      });
    };
    tryOne(0).catch(function (e) { GK.toast('部屋をつくれませんでした（' + e.message + '）。⚙ 設定を確認してください'); });
  }
  var H = null;
  GK.route(/^host\/(\d{4})$/, function (m) {
    var code = m[1];
    H = { code: code, room: null, tab: 'now', ending: false };
    V.innerHTML = '<div class="host"><aside class="panel hostL" id="hostL"></aside><section class="panel board" id="board"><div class="count" style="font-size:30px">つないでいます…</div></section></div>';
    syncClock(code).then(function () {
      if (!H || H.code !== code) return;
      H.stop = listen(ROOM(code), function (room) {
        if (!H) return;
        if (!room) { GK.toast('この部屋は閉じられました'); GK.go('#game'); return; }
        var prev = H.st; H.room = room; H.st = room.state + '|' + room.round;
        if (prev && prev === 'play|' + room.round && room.state === 'end') setTimeout(function () { if (H && H.room) podium(H.room); }, 300);
        drawHostL(); drawBoard();
      });
      H.timer = setInterval(function () {
        if (!H || !H.room) return;
        var r = H.room;
        if (r.state === 'play' && now() > r.startAt + r.cfg.t * 1000 + 2500 && !H.ending) {
          H.ending = true; api('PATCH', ROOM(code), { state: 'end' }).then(function () { if (H) H.ending = false; });
        }
        if (r.state === 'play') drawBoard();
      }, 250);
    });
  });
  GK.onLeave(function () { if (H) { H.stop && H.stop(); clearInterval(H.timer); H = null; } });
  function drawHostL() {
    var r = H.room, el = $('#hostL'); if (!el) return;
    var cfg = r.cfg, busy = r.state === 'play', key = JSON.stringify(cfg) + busy + playersOf(r).length + r.round;
    if (H.lkey === key) return; H.lkey = key;
    var hadQR = $('#qr', el) && $('#qr', el).innerHTML;
    el.innerHTML = '<div class="roomhd"><small>部屋番号</small><div class="code">' + H.code + '</div></div><div class="qr" id="qr">' + (hadQR || '') + '</div>' +
      '<p class="note joinhow" style="text-align:center">楽典ラボ → 🎮 → 部屋番号を入力<br>または QR を読みとる</p>' +
      '<div class="hsum"><p><span>📚</span><b>' + esc(rangeName(cfg)) + '</b></p><p><span>⏱</span><b>' + cfg.t + ' 秒</b></p>' +
      '<div class="seg">' + GR.filter(function (g) { return g[0] !== 'units'; }).map(function (g) { return '<button type="button" data-hm="' + g[0] + '" aria-pressed="' + (cfg.m === g[0]) + '"' + (busy ? ' disabled' : '') + '>' + g[1] + '</button>'; }).join('') + '</div>' +
      '<div class="seg">' + [60, 90, 120, 180].map(function (t) { return '<button type="button" data-ht="' + t + '" aria-pressed="' + (cfg.t === t) + '"' + (busy ? ' disabled' : '') + '>' + t + '秒</button>'; }).join('') + '</div></div>' +
      '<div class="hbtns"><span class="ppl">👥 <b>' + playersOf(r).length + '</b> 人</span><button type="button" class="btn main big" id="hGo"' + (busy ? ' disabled' : '') + '>' + (r.round ? '▶ 第' + (r.round + 1) + '回戦' : '▶ スタート') + '</button></div>' +
      '<div class="hbtns"><button type="button" class="btn ghost sm" id="hCopy">🔗 参加リンク</button><button type="button" class="btn ghost sm" id="hClose">部屋を閉じる</button></div>';
    if (!hadQR) drawQR($('#qr', el), joinUrl(H.code));
    el.onclick = function (e) {
      var b = e.target.closest('[data-hm],[data-ht],#hGo,#hCopy,#hClose'); if (!b) return;
      if (b.dataset.hm) api('PATCH', ROOM(H.code) + '/cfg', { m: b.dataset.hm });
      if (b.dataset.ht) api('PATCH', ROOM(H.code) + '/cfg', { t: +b.dataset.ht });
      if (b.id === 'hGo') { H.tab = 'now'; api('PATCH', ROOM(H.code), { state: 'play', round: (r.round || 0) + 1, seed: Math.floor(Math.random() * 1e9), startAt: Math.round(now() + 5000) }).catch(function () { GK.toast('スタートできませんでした'); }); }
      if (b.id === 'hCopy') GK.share('【楽典ラボ クラス対戦】部屋 ' + H.code + '\n' + joinUrl(H.code));
      if (b.id === 'hClose' && confirm('部屋 ' + H.code + ' を閉じますか？（ランキングも消えます）')) { var c = H.code; api('DELETE', ROOM(c)).then(function () { GK.go('#game'); }, function () { GK.go('#game'); }); }
    };
  }
  function rows(list, live) {
    var cols = list.length > 24 ? 3 : list.length > 12 ? 2 : 1, max = cols * 14, more = list.length - max;
    var html = '<div class="bbody" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + list.slice(0, max).map(function (p, i) {
      return '<div class="prow' + (i < 3 ? ' r' + (i + 1) : '') + '"><span class="rk">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1)) + '</span><span class="nm">' + esc(p.n) + (live && p.k >= 3 ? '<span class="fire">🔥' + p.k + '</span>' : '') + (live && p.d ? '<span class="done">おわり</span>' : '') + '</span><span class="pt">' + GK.fmtN(live === 'best' ? p.b || 0 : p.s || 0) + '</span></div>';
    }).join('') + '</div>';
    return html + (more > 0 ? '<p class="note">…ほか ' + more + ' 人</p>' : '');
  }
  function drawBoard() {
    var r = H.room, el = $('#board'); if (!el) return;
    if ($('.podium', el)) return;
    var t = now(), head = '', body = '';
    var tabs = '<div class="tabs seg"><button type="button" data-tab="now" aria-pressed="' + (H.tab === 'now') + '">いまの回</button><button type="button" data-tab="best" aria-pressed="' + (H.tab === 'best') + '">🏆 ハイスコア</button></div>';
    if (H.tab === 'best') { head = '<span class="st">🏆 ハイスコア</span>' + tabs; body = rows(playersOf(r), 'best'); }
    else if (r.state === 'lobby' || !r.round) {
      var ps = playersOf(r);
      head = '<span class="st">参加者を待っています</span>' + tabs;
      body = ps.length ? '<div class="names">' + ps.map(function (p) { return '<span>' + esc(p.n) + '</span>'; }).join('') + '</div>' : '<p class="note">生徒が 部屋番号を入れると ここに名前が出ます</p>';
    } else if (r.state === 'play' && t < r.startAt) {
      head = '<span class="st">第' + r.round + '回戦</span>' + tabs;
      body = '<div class="count">' + Math.max(1, Math.ceil((r.startAt - t) / 1000)) + '</div>';
    } else {
      var end = r.state === 'end', left = Math.max(0, r.startAt + r.cfg.t * 1000 - t), lst = playersOf(r, r.round);
      head = '<span class="st">' + (end ? '🎉 結果発表' : '第' + r.round + '回戦') + '</span>' + tabs + (end ? '<button type="button" class="btn sm" id="again">🎉 表彰式をもう一度</button>' : '<button type="button" class="btn sm ghost" id="stopNow">⏹ ここで結果発表</button><span class="tm">' + Math.ceil(left / 1000) + '</span>');
      body = rows(lst, !end);
    }
    if (r.state === 'play' && t >= r.startAt && H.goR !== r.round) { H.goR = r.round; GK.fx('go'); }
    var key = head + body;
    if (H.bkey === key) return; H.bkey = key;
    el.innerHTML = '<div class="bhead">' + head + '</div>' + body;
    el.onclick = function (e) {
      var b = e.target.closest('[data-tab],#again,#stopNow'); if (!b) return;
      if (b.id === 'stopNow' && confirm('ここで終わりにして 結果発表しますか？')) api('PATCH', ROOM(H.code), { state: 'end' });
      if (b.dataset.tab) { H.tab = b.dataset.tab; H.bkey = null; drawBoard(); }
      if (b.id === 'again') podium(H.room);
    };
  }
  function podium(r, onClose, title) {
    var el = $('#board'); if (!el) return;
    var lst = playersOf(r, r.round).slice(0, 3);
    var d = document.createElement('div'); d.className = 'podium';
    d.innerHTML = '<h2 class="ttl" style="font-size:30px">' + (title || '🎉 第' + r.round + '回戦 表彰式') + '</h2><div class="pods">' + [1, 0, 2].map(function (i) { var p = lst[i]; return p ? '<div class="pod p' + (i + 1) + '" data-i="' + i + '"><b>' + esc(p.n) + '</b><span class="pt">' + GK.fmtN(p.s || 0) + ' 点</span><div class="blk">' + (i + 1) + '</div></div>' : ''; }).join('') + '</div><button type="button" class="btn" id="pclose">ランキングを見る</button>';
    el.appendChild(d);
    GK.fx('drum');
    [2, 1, 0].forEach(function (i, k) { setTimeout(function () { var p = $('.pod[data-i="' + i + '"]', d); if (p) { p.classList.add('on'); GK.fx(i === 0 ? 'fanfare' : 'ok'); if (i === 0) GK.confetti(90); } }, 1300 + k * 1100); });
    $('#pclose', d).onclick = function () { d.remove(); if (onClose) onClose(); else { H.bkey = null; drawBoard(); } };
  }

  /* ---------- 生徒：参加 ---------- */
  var B = null;
  function join(code, name) {
    if (!/^\d{4}$/.test(code)) { GK.toast('部屋番号（4 けた）を入れてください'); return; }
    if (!name) { GK.toast('ニックネームを入れてください'); return; }
    S.nick = name; GK.saveS();
    var me = ROOM(code) + '/players/' + pid();
    var kind = '';
    api('GET', ROOM(code) + '/cfg').then(function (cfg) {
      if (cfg == null) throw new Error('部屋が見つかりません');
      kind = cfg.kind || '';
      return api('GET', me);
    }).then(function (old) {
      return api('PATCH', me, { n: name, s: old && old.s || 0, b: old && old.b || 0, r: old && old.r || 0, k: 0 });
    }).then(function () {
      RW.battles++; GK.rwSave(); GK.earn(20);
      GK.go((kind === 'ens' ? '#ens/' : '#battle/') + code);
    }).catch(function (e) { GK.toast('参加できませんでした（' + e.message + '）'); });
  }
  GK.route(/^battle\/(\d{4})$/, function (m) {
    var code = m[1];
    B = { code: code, played: 0, awarded: {}, room: null };
    V.innerHTML = '<section class="panel res" id="bwait"><div class="big" style="font-size:28px">つないでいます…</div></section>';
    syncClock(code).then(function () { if (B && B.code === code) B.stop = listen(ROOM(code), onRoom); });
  });
  GK.onLeave(function () { if (B) { B.stop && B.stop(); B = null; } });
  function onRoom(room) {
    if (!B) return;
    if (!room) { GK.toast('部屋が閉じられました'); GK.go('#game'); return; }
    B.room = room;
    var me = (room.players || {})[pid()] || {};
    if (room.state === 'play' && room.round !== B.played && now() < room.startAt + room.cfg.t * 1000 - 3000) {
      B.played = room.round; B.lastPush = 0;
      api('PATCH', ROOM(B.code) + '/players/' + pid(), { s: 0, c: 0, k: 0, r: room.round, d: 0 }).catch(function () { });
      newGame(V, room.cfg, room.seed, 'battle', room.startAt, {
        answer: function () { push(false); },
        end: function () { push(true); waitEnd(); }
      });
      return;
    }
    if (G && G.mode === 'battle' && !G.over && room.state === 'end' && B.played === room.round) { // 先生が 結果発表
      G.over = true; clearInterval(G.timer); GK.fx('whistle'); push(true);
    }
    if (G && G.mode === 'battle' && !G.over) { // プレイ中：自分の順位
      var lst = playersOf(room, room.round), rk = lst.map(function (p) { return p.id; }).indexOf(pid());
      var el = $('#grk'); if (el && rk >= 0) el.textContent = (rk + 1) + ' 位 / ' + lst.length;
      return;
    }
    if (room.state === 'end' && B.played === room.round) {
      if (B.awarded[room.round]) return; // 結果・解説を見ている間は そのまま
      B.awarded[room.round] = 1;
      var l2 = playersOf(room, room.round), r2 = l2.map(function (p) { return p.id; }).indexOf(pid()) + 1;
      if (r2 >= 1 && r2 <= 3) { RW.top3++; GK.rwSave(); GK.earn(50); GK.confetti(r2 === 1 ? 90 : 40); }
      if (G) { RW.maxCombo = Math.max(RW.maxCombo, G.maxCombo); GK.rwSave(); GK.earn(Math.floor(G.score / 20)); }
      GK.checkBadges();
      showBattleEnd(room, r2, l2.length);
      return;
    }
    if (!G || G.over) lobby(room, me);
  }
  function push(final) {
    if (!B || !G) return;
    var t = Date.now(); if (!final && t - B.lastPush < 700) { clearTimeout(B.pt); B.pt = setTimeout(function () { push(false); }, 700); return; }
    B.lastPush = t;
    var me = (B.room.players || {})[pid()] || {};
    api('PATCH', ROOM(B.code) + '/players/' + pid(), { s: G.score, c: G.ok, k: G.combo, r: B.played, b: Math.max(me.b || 0, G.score), d: final ? 1 : 0 }).catch(function () { });
  }
  function waitEnd() {
    V.innerHTML = '<section class="panel res"><div class="big">' + GK.fmtN(G.score) + '<small> 点</small></div><p class="msg">そこまで！ 結果発表を待っています…</p><p class="note">正解 ' + G.ok + ' 問・最大 ' + G.maxCombo + ' コンボ</p></section>';
  }
  function lobby(room, me) {
    if (G && G.over && room.state === 'play' && B.played === room.round) return; // 結果待ち
    var n = playersOf(room).length;
    var mid = room.state === 'play' && room.round !== B.played ? '<p class="msg">いま 第' + room.round + '回戦の最中です。次の回から参加できます</p>' : '<p class="msg">先生のスタートを 待っています</p>';
    V.innerHTML = '<section class="panel res"><p class="note">部屋 ' + B.code + '・' + esc(rangeName(room.cfg)) + '・' + room.cfg.t + ' 秒</p><div class="big" style="font-size:34px">' + esc(me.n || S.nick) + '</div>' + mid + '<p class="note">👥 ' + n + ' 人が参加中</p><div class="acts"><button type="button" class="btn ghost" data-go="#game">ぬける</button></div></section>';
  }
  function showBattleEnd(room, rank, n) {
    var g = G;
    V.innerHTML = '<section class="panel res">' + (rank === 1 ? '<div class="stampbig">優勝</div>' : '') + '<div class="big">' + (rank ? rank + '<small> 位 / ' + n + ' 人</small>' : '−') + '</div>' +
      '<p class="msg">' + (rank === 1 ? '👑 優勝！' : rank === 2 ? '🥈 2 位！' : rank === 3 ? '🥉 3 位！' : 'おつかれさま！') + '　' + GK.fmtN(g ? g.score : 0) + ' 点' + (g ? '・正解 ' + g.ok + ' 問' : '') + '</p>' +
      '<div class="acts">' + (g && g.res.length ? '<button type="button" class="btn" id="rv">📖 ' + (g.ng ? 'まちがえた ' + g.ng + ' 問の解説' : '解説を見る') + '</button>' : '') + '</div><p class="note">次の回が始まると 自動で切りかわります</p></section>';
    var rv = $('#rv'); if (rv) rv.onclick = function () { GK.review(V, g.res, function () { showBattleEnd(room, rank, n); }); };
  }

  /* =========================================================
     🎼 アンサンブル・クイズ（1 問ずつ、全員で同時に答える）
     ・問題・楽譜・選択肢は 先生の画面にも 生徒の手元にも出る
     ・点数：正解 100 ＋ 速さ（最大 200）＋ 連続正解。速さは テンポの名前で表示（Presto〜Andante）
     ・クラスの 60% 以上が正解すると「きらきら星」の音が 1 つ ふえ、最後に クラスで完成した曲を演奏する
     rooms/g{code} = { cfg: { kind: 'ens', m, us, n: 7|14, sec, ear }, state: lobby|q|rev|end, round, seed, qi, qAt, h: '1011…',
                       players: { pid: { n, s, k, r, a: { qi: { c, t, ok, p } } } } }
     ========================================================= */
  var MEL = ['C5', 'C5', 'G5', 'G5', 'A5', 'A5', 'G5', 'F5', 'F5', 'E5', 'E5', 'D5', 'D5', 'C5'];
  var MELD = function (i) { return i === 6 || i === 13 ? 'h' : 'q'; };
  var ENS_OK = 0.6; // クラスの正解率が これ以上で 音が 1 つ ふえる
  var TEMPO = [[0.25, 'Presto!'], [0.5, 'Allegro!'], [0.75, 'Moderato'], [1.01, 'Andante']];
  var tempoName = function (frac) { for (var i = 0; i < TEMPO.length; i++) if (frac < TEMPO[i][0]) return TEMPO[i][1]; return 'Andante'; };
  var ensPoints = function (ok, frac, k) { return ok ? 100 + Math.round(200 * Math.max(0, 1 - frac)) + Math.min(100, Math.max(0, k - 1) * 20) : 0; };
  function ensQs(cfg, seed) { return GK.Q.set(unitsOf(cfg), cfg.n, GK.rng(seed), { noEar: !cfg.ear, ramp: true }); }
  var ansOf = function (p, qi) { return p && p.a ? p.a[qi] : null; };
  // クラスで集めた音（h：'1' ＝ 音、'0' ＝ 休符）の楽譜
  function melodySpec(h, n, upto) {
    var notes = [];
    for (var i = 0; i < n; i++) {
      var d = MELD(i), done = i < h.length, ok = h.charAt(i) === '1';
      if (done && !ok) notes.push({ d: d + 'r', c: C.gray });
      else notes.push({ k: MEL[i], d: d, c: done ? C.green : 'var(--line)', st: -1 });
    }
    var bars = [[]], beats = 0;
    notes.forEach(function (x) { bars[bars.length - 1].push(x); beats += x.d.charAt(0) === 'h' ? 2 : 1; if (beats >= 4) { bars.push([]); beats = 0; } });
    if (!bars[bars.length - 1].length) bars.pop();
    return { clef: 'treble', time: '4/4', bars: bars, end: 'end', sp: 26, beam: false, below: 20, above: 30 };
  }
  function playMelody(h, upto) {
    var seq = [];
    for (var i = 0; i < upto; i++) seq.push([h.charAt(i) === '1' ? MEL[i] : null, MELD(i) === 'h' ? 2 : 1]);
    return M.play(seq, 132);
  }
  var C = M.COL, F = GK.F;

  /* ---------- 先生 ---------- */
  var ENS = GK.store.get('ensSel', { m: 'all', us: '', n: 7, sec: 20, ear: false });
  function makeEnsRoom() {
    var cfg = { kind: 'ens', m: TA.m === 'units' && !TA.us ? 'all' : TA.m, us: TA.us || '', n: ENS.n, sec: ENS.sec, ear: !!ENS.ear };
    var tryOne = function (n) {
      var code = String(1000 + Math.floor(Math.random() * 9000));
      return api('GET', ROOM(code)).then(function (v) {
        if (v && n < 6) return tryOne(n + 1);
        return api('PUT', ROOM(code), { cfg: cfg, state: 'lobby', round: 0, seed: 0, qi: 0, qAt: 0, h: '', host: pid(), created: { '.sv': 'timestamp' } })
          .then(function () { GK.go('#ensh/' + code); });
      });
    };
    tryOne(0).catch(function (e) { GK.toast('部屋をつくれませんでした（' + e.message + '）。⚙ 設定を確認してください'); });
  }
  var EH = null;
  GK.route(/^ensh\/(\d{4})$/, function (m) {
    var code = m[1];
    EH = { code: code, room: null, key: '', qs: null, qsKey: '', busy: false };
    V.innerHTML = '<div class="host"><aside class="panel hostL" id="hostL"></aside><section class="panel board ens" id="board"><div class="count" style="font-size:30px">つないでいます…</div></section></div>';
    syncClock(code).then(function () {
      if (!EH || EH.code !== code) return;
      EH.stop = listen(ROOM(code), function (room) {
        if (!EH) return;
        if (!room) { GK.toast('この部屋は閉じられました'); GK.go('#game'); return; }
        var prev = EH.room && EH.room.state; EH.room = room;
        if (prev === 'rev' && room.state === 'end') setTimeout(function () { if (EH) podium(room, function () { EH.key = ''; ensBoard(); }, '🎉 アンサンブル・クイズ 表彰式'); }, 400);
        ensHostL(); ensBoard();
      });
      EH.timer = setInterval(function () { if (EH && EH.room) ensTick(); }, 250);
    });
  });
  GK.onLeave(function () { if (EH) { EH.stop && EH.stop(); clearInterval(EH.timer); EH = null; } });
  function ensQsFor(r) { var k = r.round + ':' + r.seed; if (EH.qsKey !== k) { EH.qs = ensQs(r.cfg, r.seed); EH.qsKey = k; } return EH.qs; }
  function ensHostL() {
    var r = EH.room, el = $('#hostL'); if (!el) return;
    var cfg = r.cfg, busy = r.state === 'q' || r.state === 'rev', n = playersOf(r).length;
    var key = JSON.stringify(cfg) + busy + n + r.round + r.state; if (EH.lkey === key) return; EH.lkey = key;
    var hadQR = $('#qr', el) && $('#qr', el).innerHTML;
    var seg = function (k, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button type="button" data-ec="' + k + ':' + o[0] + '" aria-pressed="' + (String(cfg[k]) === String(o[0])) + '"' + (busy ? ' disabled' : '') + '>' + o[1] + '</button>'; }).join('') + '</div>'; };
    el.innerHTML = '<div class="roomhd"><small>🎼 アンサンブル・クイズ　部屋番号</small><div class="code">' + EH.code + '</div></div><div class="qr" id="qr">' + (hadQR || '') + '</div>' +
      '<p class="note joinhow" style="text-align:center">楽典ラボ → 🎮 → 部屋番号を入力<br>または QR を読みとる</p>' +
      '<div class="hsum"><p><span>📚</span><b>' + esc(rangeName(cfg)) + '</b>　' + cfg.n + ' 問・' + cfg.sec + ' 秒' + (cfg.ear ? '・👂' : '') + '</p>' +
      (busy ? '' : seg('m', GR.filter(function (g) { return g[0] !== 'units'; })) +
      seg('n', [[7, '7 問（1 フレーズ）'], [14, '14 問（2 フレーズ）']]) +
      seg('sec', [[10, '10 秒'], [20, '20 秒'], [30, '30 秒']]) +
      seg('ear', [[false, '👂 聴く問題なし'], [true, '👂 聴く問題あり']])) + '</div>' +
      '<div class="hbtns"><span class="ppl">👥 <b>' + n + '</b> 人</span><button type="button" class="btn main big" id="eGo"' + (busy ? ' disabled' : '') + '>' + (r.round ? '▶ もう一度（新しい問題）' : '▶ スタート') + '</button></div>' +
      '<div class="hbtns"><button type="button" class="btn ghost sm" id="hCopy">🔗 参加リンク</button><button type="button" class="btn ghost sm" id="hClose">部屋を閉じる</button></div>';
    if (!hadQR) drawQR($('#qr', el), joinUrl(EH.code));
    el.onclick = function (e) {
      var b = e.target.closest('[data-ec],#eGo,#hCopy,#hClose'); if (!b) return;
      if (b.dataset.ec) {
        var kv = b.dataset.ec.split(':'), v = kv[0] === 'm' ? kv[1] : kv[0] === 'ear' ? kv[1] === 'true' : +kv[1], o = {}; o[kv[0]] = v;
        ENS[kv[0]] = v; GK.store.set('ensSel', ENS); api('PATCH', ROOM(EH.code) + '/cfg', o);
      }
      if (b.id === 'eGo') { M.audio(); api('PATCH', ROOM(EH.code), { state: 'q', round: (r.round || 0) + 1, seed: Math.floor(Math.random() * 1e9), qi: 0, qAt: Math.round(now() + 4000), h: '' }); }
      if (b.id === 'hCopy') GK.share('【楽典ラボ アンサンブル・クイズ】部屋 ' + EH.code + '\n' + joinUrl(EH.code));
      if (b.id === 'hClose' && confirm('部屋 ' + EH.code + ' を閉じますか？')) { var c = EH.code; api('DELETE', ROOM(c)).then(function () { GK.go('#game'); }, function () { GK.go('#game'); }); }
    };
  }
  function ensStats(r, qi, q) {
    var ps = playersOf(r, r.round), cnt = q ? q.ch.map(function () { return 0; }) : [], ok = 0, ans = 0;
    ps.forEach(function (p) { var a = ansOf(p, qi); if (!a) return; ans++; if (a.ok) ok++; if (cnt[a.c] != null) cnt[a.c]++; });
    return { n: ps.length, ans: ans, ok: ok, cnt: cnt, ps: ps };
  }
  function ensTick() {
    var r = EH.room, t = now();
    if (r.state === 'q') {
      var q = ensQsFor(r)[r.qi], st = ensStats(r, r.qi, q), end = r.qAt + r.cfg.sec * 1000;
      if (t >= r.qAt && EH.playedQ !== r.round + ':' + r.qi) { EH.playedQ = r.round + ':' + r.qi; GK.fx('go'); if (q.ear) setTimeout(function () { GK.playQ(q); }, 300); }
      if (!EH.busy && t > r.qAt + 800 && (t > end + 400 || (st.n > 0 && st.ans >= st.n))) {
        EH.busy = true;
        var h = (r.h || '') + (st.n && st.ok / st.n >= ENS_OK ? '1' : '0');
        api('PATCH', ROOM(EH.code), { state: 'rev', h: h }).then(function () { EH.busy = false; }, function () { EH.busy = false; });
      }
      var tm = $('#eTm'), an = $('#eAns'), bar = $('#eBar');
      if (tm) tm.textContent = t < r.qAt ? '' : Math.max(0, Math.ceil((end - t) / 1000));
      if (an) an.textContent = st.ans + ' / ' + st.n + ' 人が 答えた';
      if (bar) bar.style.width = Math.max(0, Math.min(100, (end - t) / (r.cfg.sec * 1000) * 100)) + '%';
      if (t < r.qAt && !$('.count', $('#board'))) { EH.key = ''; ensBoard(); }
      if (t >= r.qAt && $('.count', $('#board'))) { EH.key = ''; ensBoard(); }
      var cd = $('#board .count'); if (cd) { var nn = Math.max(1, Math.ceil((r.qAt - t) / 1000)); if (cd.dataset.n !== String(nn)) { cd.dataset.n = nn; cd.textContent = nn; GK.fx('count'); } }
    }
  }
  function choiceBox(c, i, opt) {
    opt = opt || {};
    var inner = c && c.fig ? '<div class="efig" data-fi="' + i + '"></div>' : '<span>' + c + '</span>';
    var w = opt.total ? Math.round(opt.count / opt.total * 100) : 0;
    return '<div class="ech-i' + (opt.ok ? ' ok' : opt.dim ? ' dim' : '') + '">' + (opt.rev ? '<i class="ebar" style="width:' + w + '%"></i>' : '') + '<span class="kn">' + '①②③④'.charAt(i) + '</span>' + inner + (opt.rev ? '<b class="ecnt">' + opt.count + '人</b>' : '') + '</div>';
  }
  function ensBoard() {
    var r = EH.room, el = $('#board'); if (!el || $('.podium', el)) return;
    var t = now(), key = r.state + '|' + r.round + '|' + r.qi + '|' + (r.state === 'q' && t < r.qAt ? 'cd' : '') + '|' + (r.state === 'lobby' || r.state === 'end' ? playersOf(r).map(function (p) { return p.n + p.s; }).join(',') : '') + (r.state === 'rev' ? JSON.stringify(ensStats(r, r.qi).cnt) + ensStats(r, r.qi).ans : '');
    if (EH.key === key) return; EH.key = key;
    var n = r.cfg.n, h = r.h || '';
    var strip = '<div class="estrip"><span class="note">🎼 クラスの曲（' + h.split('').filter(function (x) { return x === '1'; }).length + ' / ' + n + ' 音）</span><div class="emel" id="eMel"></div></div>';
    if (r.state === 'lobby' || !r.round) {
      var ps = playersOf(r);
      el.innerHTML = '<div class="bhead"><span class="st">参加者を待っています</span></div>' + (ps.length ? '<div class="names">' + ps.map(function (p) { return '<span>' + esc(p.n) + '</span>'; }).join('') + '</div>' : '<p class="note">生徒が 部屋番号を入れると ここに名前が出ます</p>') +
        '<div class="ehow"><p><b>🎼 アンサンブル・クイズ</b>：1 問ずつ、全員が 同時に答えます。</p><p>⏱ 早く正解するほど 高得点（<i>Presto!</i> → <i>Allegro!</i> → <i>Moderato</i> → <i>Andante</i>）</p><p>🎶 クラスの <b>' + Math.round(ENS_OK * 100) + '% 以上</b>が正解すると「きらきら星」の音が 1 つ ふえる。全部 そろえて 曲を完成させよう！</p></div>' + strip;
      M.score($('#eMel'), melodySpec('', n));
      return;
    }
    var qs = ensQsFor(r), q = qs[r.qi];
    if (r.state === 'end') {
      var lst = playersOf(r, r.round), got = h.split('').filter(function (x) { return x === '1'; }).length;
      el.innerHTML = '<div class="bhead"><span class="st">🎉 結果発表</span><button type="button" class="btn sm" id="ePod">🎉 表彰式をもう一度</button></div>' +
        '<div class="eend"><div class="erank">' + rows(lst) + '</div><div class="esum"><p class="msg">クラスで ' + got + ' / ' + n + ' 音 そろった！' + (got === n ? ' 🎉 曲が完成！' : '') + '</p><button type="button" class="btn main" id="ePlay">🔊 クラスの曲を聴く</button></div></div>' + strip;
      M.score($('#eMel'), melodySpec(h, n));
      el.onclick = function (e) {
        if (e.target.closest('#ePlay')) { var dur = playMelody(h, n); setTimeout(function () { GK.STAGE.applause(got / n); }, (dur || 0) * 1000 + 200); }
        if (e.target.closest('#ePod')) podium(r, function () { EH.key = ''; ensBoard(); }, '🎉 アンサンブル・クイズ 表彰式');
      };
      return;
    }
    if (r.state === 'q' && t < r.qAt) {
      el.innerHTML = '<div class="bhead"><span class="st">第 ' + (r.qi + 1) + ' 問 / ' + n + '</span></div><div class="count" data-n="">' + Math.max(1, Math.ceil((r.qAt - t) / 1000)) + '</div>' + strip;
      M.score($('#eMel'), melodySpec(h, n));
      return;
    }
    var rev = r.state === 'rev', stt = ensStats(r, r.qi, q);
    el.innerHTML = '<div class="bhead"><span class="st">第 ' + (r.qi + 1) + ' 問 / ' + n + '</span><span class="stars" style="color:var(--gold)">' + '★★★'.slice(0, q.st) + '</span>' +
      (rev ? '<span class="ppl">正解 ' + stt.ok + ' / ' + stt.n + ' 人（' + (stt.n ? Math.round(stt.ok / stt.n * 100) : 0) + '%）</span>' + (r.h.charAt(r.qi) === '1' ? '<b class="egood">🎶 音が ふえた！</b>' : '<b class="ebad">… 休符</b>') +
        '<button type="button" class="btn main" id="eNext">' + (r.qi + 1 >= n ? '🎉 結果発表' : '次の問題 ▶') + '</button>'
        : '<span class="ppl" id="eAns"></span><button type="button" class="btn sm ghost" id="eStop">⏹ ここで答えを見る</button><span class="tm" id="eTm"></span>') + '</div>' +
      (rev ? '' : '<div class="tbar ebarw"><i id="eBar"></i></div>') +
      '<p class="eq">' + GK.symfix(q.q) + '</p><div class="efigq" id="eFig"></div>' +
      '<div class="ech">' + q.ch.map(function (c, i) { return choiceBox(c, i, rev ? { rev: true, ok: i === q.a, dim: i !== q.a, count: stt.cnt[i] || 0, total: Math.max(1, stt.ans) } : {}); }).join('') + '</div>' +
      (rev ? '<div class="eex">💡 ' + q.ex + '</div>' + '<div class="etop">' + stt.ps.slice(0, 5).map(function (p, i) { return '<span>' + (i + 1) + '. ' + esc(p.n) + ' <b>' + GK.fmtN(p.s || 0) + '</b></span>'; }).join('') + '</div>' : '') + strip;
    var figEl = $('#eFig');
    if (q.ear && !rev) figEl.innerHTML = '<div class="ear"><button type="button" id="eEar">🔊</button><p class="note">先生のスピーカーで 鳴らします（もう一度 おせます）</p></div>';
    else if (rev && q.exFig) F.render(figEl, q.exFig);
    else if (q.fig) F.render(figEl, q.fig);
    else figEl.style.flex = '0 0 0';
    $$('.efig', el).forEach(function (d) { F.render(d, q.ch[+d.dataset.fi].fig); });
    M.score($('#eMel'), melodySpec(h, n));
    if (rev && EH.revPlayed !== r.round + ':' + r.qi) {
      EH.revPlayed = r.round + ':' + r.qi;
      var rate = stt.n ? stt.ok / stt.n : 0;
      if (r.h.charAt(r.qi) === '1') { GK.fx('ok'); $('.estrip', el).classList.add('gain'); setTimeout(function () { playMelody(r.h, r.qi + 1); }, 500); setTimeout(function () { GK.STAGE.applause(rate); }, 500 + (r.qi + 1) * 470); }
      else { GK.fx('ng'); GK.STAGE.applause(rate * 0.4); }
    }
    el.onclick = function (e) {
      if (e.target.closest('#eEar')) GK.playQ(q);
      if (e.target.closest('#eStop')) { var hh = (r.h || '') + (stt.n && stt.ok / stt.n >= ENS_OK ? '1' : '0'); api('PATCH', ROOM(EH.code), { state: 'rev', h: hh }); }
      if (e.target.closest('#eNext')) {
        if (r.qi + 1 >= n) api('PATCH', ROOM(EH.code), { state: 'end' });
        else api('PATCH', ROOM(EH.code), { state: 'q', qi: r.qi + 1, qAt: Math.round(now() + 3000) });
      }
    };
  }

  /* ---------- 生徒 ---------- */
  var EB = null;
  GK.route(/^ens\/(\d{4})$/, function (m) {
    var code = m[1];
    EB = { code: code, round: 0, qs: null, s: 0, k: 0, shown: '', ans: {}, awarded: {} };
    V.innerHTML = '<section class="panel res"><div class="big" style="font-size:28px">つないでいます…</div></section>';
    syncClock(code).then(function () { if (EB && EB.code === code) { EB.stop = listen(ROOM(code), ensRoom); EB.timer = setInterval(ensStuTick, 200); } });
  });
  GK.onLeave(function () { if (EB) { EB.stop && EB.stop(); clearInterval(EB.timer); EB = null; } });
  function stuHead(r) {
    return '<div class="ta-top"><span class="tm">第 ' + (r.qi + 1) + ' / ' + r.cfg.n + ' 問</span><div class="tbar"><i id="sBar"></i></div><span class="cb">' + (EB.k >= 2 ? '🔥 ' + EB.k : '') + '</span><span class="sc">' + GK.fmtN(EB.s) + '<small> 点</small></span></div>';
  }
  function ensRoom(r) {
    if (!EB) return;
    if (!r) { GK.toast('部屋が閉じられました'); GK.go('#game'); return; }
    EB.room = r;
    var meP = ROOM(EB.code) + '/players/' + pid();
    if (r.round && r.round !== EB.round && (r.state === 'q' || r.state === 'rev')) {
      EB.round = r.round; EB.qs = ensQs(r.cfg, r.seed); EB.s = 0; EB.k = 0; EB.ans = {}; EB.shown = '';
      api('PATCH', meP, { r: r.round, s: 0, k: 0, a: null }).catch(function () { });
    }
    ensStuDraw();
  }
  function ensStuTick() {
    if (!EB || !EB.room) return;
    var r = EB.room, t = now();
    if (r.state === 'q' && r.round === EB.round) {
      var bar = $('#sBar'); if (bar) bar.style.width = Math.max(0, Math.min(100, (r.qAt + r.cfg.sec * 1000 - t) / (r.cfg.sec * 1000) * 100)) + '%';
      var want = t < r.qAt ? 'cd' : 'q';
      if (EB.shown !== r.round + ':' + r.qi + ':' + want && !EB.ans[r.qi]) ensStuDraw();
      var cd = $('.count', V); if (cd && t < r.qAt) { var nn = Math.max(1, Math.ceil((r.qAt - t) / 1000)); if (cd.textContent !== String(nn)) { cd.textContent = nn; GK.fx('count'); } }
      if (t > r.qAt + r.cfg.sec * 1000 && !EB.ans[r.qi] && EB.shown === r.round + ':' + r.qi + ':q') { EB.shown += ':late'; var el = $('.qz', V); if (el) { $$('.ch button', el).forEach(function (b) { b.disabled = true; b.classList.add('dim'); }); ensWait('⏰ 時間切れ'); } }
    }
  }
  function ensWait(msg) {
    var fb = $('.qz .fb', V); if (!fb) return;
    fb.hidden = false; fb.innerHTML = '<span class="mk">⏳</span><div class="ex">' + msg + '<br><small style="color:var(--muted)">先生の画面で 答えを見よう</small></div>';
  }
  function ensStuDraw() {
    var r = EB.room, t = now(), me = (r.players || {})[pid()] || {};
    if (r.state === 'lobby' || !r.round || (r.round !== EB.round)) {
      if (EB.shown === 'lobby') return; EB.shown = 'lobby';
      V.innerHTML = '<section class="panel res"><p class="note">🎼 アンサンブル・クイズ・部屋 ' + EB.code + '</p><div class="big" style="font-size:34px">' + esc(me.n || S.nick) + '</div><p class="msg">' + (r.state === 'lobby' || !r.round ? '先生のスタートを 待っています' : 'いまの回の 途中です。次の回から参加できます') + '</p><p class="note">1 問ずつ、早く正解するほど 高得点。クラスの ' + Math.round(ENS_OK * 100) + '% 以上が正解すると 曲の音が ふえます</p><div class="acts"><button type="button" class="btn ghost" data-go="#game">ぬける</button></div></section>';
      return;
    }
    var q = EB.qs[r.qi];
    if (r.state === 'q' && t < r.qAt) {
      var k1 = r.round + ':' + r.qi + ':cd'; if (EB.shown === k1) return; EB.shown = k1;
      V.innerHTML = '<section class="panel qz">' + stuHead(r) + '<div class="count">' + Math.max(1, Math.ceil((r.qAt - t) / 1000)) + '</div></section>';
      return;
    }
    if (r.state === 'q') {
      var k2 = r.round + ':' + r.qi + ':q'; if (EB.shown.indexOf(k2) === 0) return; EB.shown = k2;
      V.innerHTML = '<section class="panel qz" style="position:relative"></section>';
      var el = $('.qz', V);
      // 聴く問題は 先生のスピーカーで鳴らす（手元では 鳴らさない）
      var qq = q.ear ? Object.assign({}, q, { ear: false, play: null, fig: { html: '<div style="text-align:center;font-size:20px;font-weight:700">🔊 先生のスピーカーの音を 聴いて答えよう</div>' } }) : Object.assign({}, q, { play: null });
      GK.drawQ(el, qq, {
        noFb: true, top: '',
        onPick: function (i, ok) {
          var tt = Math.max(0, now() - r.qAt), frac = tt / (r.cfg.sec * 1000);
          if (frac > 1) return;
          EB.k = ok ? EB.k + 1 : 0;
          var pts = ensPoints(ok, frac, EB.k); EB.s += pts; EB.ans[r.qi] = { c: i, ok: ok, p: pts, tn: tempoName(frac) };
          var o = { s: EB.s, k: EB.k, r: r.round }; o['a/' + r.qi] = { c: i, t: Math.round(tt), ok: ok, p: pts };
          api('PATCH', ROOM(EB.code) + '/players/' + pid(), o).catch(function () { });
          $$('.ch button', el).forEach(function (b, j) { b.classList.remove('ok', 'ng', 'dim'); if (j === i) b.classList.add('picked'); else b.classList.add('dim'); });
          ensWait('答えました！' + (ok ? '' : '') + ' 結果を 待っています…');
        }
      });
      $('.qtop', el).outerHTML = stuHead(r);
      return;
    }
    if (r.state === 'rev') {
      var k3 = r.round + ':' + r.qi + ':rev'; if (EB.shown === k3) return; EB.shown = k3;
      var a = EB.ans[r.qi];
      if (!EB.qsel || EB.shown.indexOf(r.round + ':' + r.qi) !== 0 || !$('.qz', V)) { V.innerHTML = '<section class="panel qz"></section>'; GK.drawQ($('.qz', V), Object.assign({}, q, { play: null, ear: false, fig: q.ear ? null : q.fig }), { noFb: true }); $('.qtop', V).outerHTML = stuHead(r); }
      var el2 = $('.qz', V);
      $$('.ch button', el2).forEach(function (b, j) { b.disabled = true; b.classList.remove('picked', 'dim', 'ok', 'ng'); if (j === q.a) b.classList.add('ok'); else if (a && j === a.c) b.classList.add('ng'); else b.classList.add('dim'); });
      GK.showFb(el2, q, a ? a.ok : false, { pick: a ? a.c : -1 });
      var ex = $('.fb .ex', el2), mk = $('.fb .mk', el2);
      var late = now() > r.qAt + r.cfg.sec * 1000;
      if (!a) { mk.textContent = late ? '⏰' : '—'; mk.className = 'mk ng'; }
      var ps = playersOf(r, r.round), rk = ps.map(function (p) { return p.id; }).indexOf(pid()) + 1;
      if (a && a.ok) { var tp = document.createElement('div'); tp.className = 'tempopop en'; tp.textContent = a.tn; el2.appendChild(tp); setTimeout(function () { tp.remove(); }, 1600); }
      ex.insertAdjacentHTML('afterbegin', '<b style="font-size:1.15em">' + (a && a.ok ? '+' + a.p + ' 点 <i class="en">' + a.tn + '</i>' : a ? '0 点' : late ? '時間切れ' : '答えなし') + '</b>　' + (rk ? rk + ' 位 / ' + ps.length + ' 人' : '') + (r.h && r.h.charAt(r.qi) === '1' ? '　🎶 クラスの音が ふえた！' : '') + '<br>');
      $('.sc', el2).innerHTML = GK.fmtN(EB.s) + '<small> 点</small>';
      return;
    }
    if (r.state === 'end') {
      if (EB.shown === 'end:' + r.round) return; EB.shown = 'end:' + r.round;
      var ps2 = playersOf(r, r.round), rk2 = ps2.map(function (p) { return p.id; }).indexOf(pid()) + 1, okN = Object.keys(EB.ans).filter(function (k) { return EB.ans[k].ok; }).length;
      if (!EB.awarded[r.round]) {
        EB.awarded[r.round] = 1; GK.earn(Math.floor(EB.s / 50));
        if (rk2 >= 1 && rk2 <= 3) { RW.top3++; GK.rwSave(); GK.earn(50); GK.confetti(rk2 === 1 ? 90 : 40); }
        GK.checkBadges();
      }
      var got = (r.h || '').split('').filter(function (x) { return x === '1'; }).length;
      V.innerHTML = '<section class="panel res">' + (rk2 === 1 ? '<div class="stampbig">優勝</div>' : '') + '<div class="big">' + (rk2 ? rk2 + '<small> 位 / ' + ps2.length + ' 人</small>' : '−') + '</div>' +
        '<p class="msg">' + GK.fmtN(EB.s) + ' 点・正解 ' + okN + ' / ' + r.cfg.n + ' 問</p><p>🎼 クラスで ' + got + ' / ' + r.cfg.n + ' 音 そろえた' + (got === r.cfg.n ? '！ 曲が完成 🎉' : '') + '</p>' +
        '<div class="acts"><button type="button" class="btn" id="eRv">📖 解説を見る</button></div><p class="note">先生が もう一度 始めると 自動で切りかわります</p></section>';
      $('#eRv').onclick = function () {
        var res = EB.qs.map(function (qq2, i) { var aa = EB.ans[i]; return { q: qq2, pick: aa ? aa.c : -1, ok: !!(aa && aa.ok) }; });
        GK.review(V, res, function () { EB.shown = ''; ensStuDraw(); });
      };
    }
  }
})();
