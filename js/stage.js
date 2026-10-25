/* =========================================================
   楽典ラボ：ゲームの演出（🎼 コンサートのステージ）
   ・正解するたびに「歓喜の歌」が 1 音ずつ進む（あなたの演奏）。コンボで 伴奏が厚くなる
   ・コンボで 楽器が 1 つずつ ステージに加わる（🎹 → 🎻 → 🎺 → 🥁 → 🎷 → 🎼）
   ・点数で 会場が 大きくなる（練習室 → … → ワールドツアー）。拍手も 大きくなる
   ・15 コンボごとに「ff（フォルティッシモ）タイム」：8 秒間 点数 2 倍
   ・終わったら カーテンコール：とどいた会場と「あなたの演奏」を 再生
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M, $ = GK.$;
  var ST = GK.STAGE = {};

  // 歓喜の歌（ベートーヴェン、パブリックドメイン）。[音, 和音の根音]
  var ODE = (function () {
    var p1 = 'E5 E5 F5 G5 G5 F5 E5 D5 C5 C5 D5 E5 E5 D5 D5 -'.split(' ');
    var p2 = 'E5 E5 F5 G5 G5 F5 E5 D5 C5 C5 D5 E5 D5 C5 C5 -'.split(' ');
    var p3 = 'D5 D5 E5 C5 D5 F5 E5 C5 D5 F5 E5 D5 C5 D5 G4 -'.split(' ');
    var ch = { p1: 'CCCC GGGG CCCC GGGG', p2: 'CCCC GGGG CCCC GGCC', p3: 'GGCC GGCC GGCC CCGG' };
    var out = [];
    [[p1, ch.p1], [p2, ch.p2], [p3, ch.p3], [p2, ch.p2]].forEach(function (x) {
      var roots = x[1].replace(/ /g, '');
      x[0].forEach(function (n, i) { if (n !== '-') out.push([n, roots.charAt(i)]); });
    });
    return out;
  })();
  var CHORD = { C: ['C4', 'E4', 'G4'], G: ['B3', 'D4', 'G4'] }, BASS = { C: 'C3', G: 'G2' };

  ST.VENUES = [[0, '🏫', '練習室'], [300, '🎒', '音楽室'], [800, '🎀', '発表会'], [1500, '🏛', '市民ホール'], [2500, '🎭', 'コンサートホール'], [4000, '🌟', 'オペラハウス'], [6000, '👑', '楽友協会 大ホール'], [9000, '🌍', 'ワールドツアー']];
  ST.BAND = [[0, '🎹', 'ピアノ'], [5, '🎻', 'バイオリン'], [10, '🎺', 'トランペット'], [15, '🥁', 'ティンパニ'], [20, '🎷', 'サックス'], [30, '🎼', 'フルオーケストラ']];
  ST.FF_EVERY = 15; ST.FF_SEC = 8;
  ST.venueOf = function (score) { var v = 0; ST.VENUES.forEach(function (x, i) { if (score >= x[0]) v = i; }); return v; };
  var bandOf = function (combo) { return ST.BAND.filter(function (b) { return combo >= b[0]; }); };

  function sound() { return GK.S.sound && M.audio(); }

  // ステージの帯（問題の上）
  ST.html = function () {
    return '<div class="stagebar" id="stg" data-v="0"><span class="sv" id="stgV">🏫 練習室</span><span class="sb" id="stgB">🎹</span><span class="sa"><i id="stgA"></i></span><span class="sn" id="stgN"></span></div>';
  };
  ST.update = function (G) {
    var v = ST.venueOf(G.score), nx = ST.VENUES[v + 1], cur = ST.VENUES[v], el = $('#stg', G.box); if (!el) return;
    el.dataset.v = v;
    $('#stgV', el).textContent = cur[1] + ' ' + cur[2];
    $('#stgB', el).textContent = bandOf(G.combo).map(function (b) { return b[1]; }).join('');
    $('#stgA', el).style.width = (nx ? Math.min(100, (G.score - cur[0]) / (nx[0] - cur[0]) * 100) : 100) + '%';
    $('#stgN', el).textContent = nx ? '次：' + nx[1] + ' ' + nx[2] + ' あと ' + GK.fmtN(nx[0] - G.score) + ' 点' : '最高の舞台！';
    el.classList.toggle('ff', ST.ffOn(G));
  };
  ST.ffOn = function (G) { return G.ffUntil && Date.now() < G.ffUntil; };

  // 小さな お知らせ（問題の上に 一瞬）
  // 同時に出たときは 順番に（重ならないように）
  ST.banner = function (G, html, cls) {
    var at = Math.max(Date.now(), G.bannerFree || 0), wait = at - Date.now();
    G.bannerFree = at + 1300;
    setTimeout(function () {
      var p = G.box && G.box.firstChild; if (!p || G.dead) return;
      var b = document.createElement('div'); b.className = 'gbanner ' + (cls || ''); b.innerHTML = html;
      p.appendChild(b); setTimeout(function () { b.remove(); }, 1600);
    }, wait);
  };
  // 正解した ボタンから 音符が 舞い上がる
  ST.notes = function (btn, n, gold) {
    if (!btn) return;
    var rc = btn.getBoundingClientRect(), sy = ['♪', '♫', '♩', '♬'];
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span'); s.className = 'fnote' + (gold ? ' gold' : '');
      s.textContent = sy[i % sy.length];
      s.style.left = (rc.left + rc.width * (0.2 + Math.random() * 0.6)) + 'px'; s.style.top = (rc.top + rc.height * 0.3) + 'px';
      s.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px'); s.style.animationDelay = (i * 0.05) + 's';
      document.body.appendChild(s); setTimeout(s.remove.bind(s), 1400);
    }
  };

  // 正解：次の 1 音を演奏（コンボで 伴奏が ふえる）
  ST.correct = function (G, btn) {
    var idx = (G.noteI || 0) % ODE.length, nt = ODE[idx];
    G.noteI = (G.noteI || 0) + 1;
    var layer = G.combo >= 20 ? 3 : G.combo >= 10 ? 2 : G.combo >= 5 ? 1 : 0;
    var keys = [nt[0]];
    if (layer >= 1) keys.push(BASS[nt[1]]);
    if (layer >= 2) keys = keys.concat(CHORD[nt[1]]);
    if (layer >= 3) { var p = M.p(nt[0]); keys.push(M.str({ l: p.l, a: p.a, o: p.o - 1 })); }
    (G.played = G.played || []).push(keys);
    if (sound()) M.play([[keys, 0.9]], 120);
    // 楽器が 加わる
    var join = ST.BAND.filter(function (b) { return b[0] === G.combo && b[0] > 0; })[0];
    if (join) { ST.banner(G, join[1] + ' ' + join[2] + 'が 加わった！'); GK.fx('combo'); }
    // ff タイム
    if (G.combo > 0 && G.combo % ST.FF_EVERY === 0) {
      G.ffUntil = Date.now() + ST.FF_SEC * 1000;
      ST.banner(G, '<b class="en">ff</b> フォルティッシモ・タイム！ ' + ST.FF_SEC + ' 秒間 点数 ×2', 'ffb');
      GK.fx('fanfare');
    }
    // 会場が 大きくなった
    var v = ST.venueOf(G.score);
    if (v > (G.venue || 0)) { G.venue = v; var x = ST.VENUES[v]; setTimeout(function () { if (G && !G.dead) { ST.banner(G, x[1] + ' ' + x[2] + ' に 進出！', 'venue'); ST.applause(0.5 + v * 0.08); } }, 250); }
    ST.notes(btn, 2 + Math.min(6, Math.floor(G.combo / 3)), ST.ffOn(G));
    ST.update(G);
  };
  // まちがい：ミスタッチ
  ST.wrong = function (G) {
    (G.played = G.played || []).push(null);
    if (sound()) M.play([[['C#4', 'D4', 'G#3'], 0.5]], 120);
    ST.update(G);
  };
  // 残り 5 秒：メトロノーム
  ST.tick = function (G, left) {
    var s = Math.ceil(left / 1000);
    if (left > 0 && s <= 5 && G.lastTickS !== s) { G.lastTickS = s; GK.fx('tick'); }
    var el = $('#stg', G.box); if (el) el.classList.toggle('ff', ST.ffOn(G));
  };
  // 拍手（その場で 作る音）
  ST.applause = function (amount) {
    if (!sound()) return;
    var ac = M.audio(), dur = 1.2 + amount * 1.5, n = Math.round(30 + amount * 120);
    var buf = ac.createBuffer(1, ac.sampleRate * 0.03, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    for (var k = 0; k < n; k++) {
      var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 2200; f.Q.value = 0.8;
      var t = ac.currentTime + Math.random() * dur * (k / n * 0.6 + 0.4) * 0.9;
      g.gain.value = 0.05 + Math.random() * 0.07 * Math.min(1, amount + 0.3);
      src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t);
    }
  };
  // あなたの演奏を 再生（まちがえた所は 休符）
  ST.replay = function (G) {
    var seq = (G.played || []).map(function (k) { return [k, 0.5]; });
    if (seq.length) M.play(seq, 120);
  };
  ST.curtain = function (G) {
    var v = ST.VENUES[ST.venueOf(G.score)], band = bandOf(G.maxCombo);
    return '<div class="curtain"><div class="cv">' + v[1] + '</div><div><b>' + v[2] + ' 公演</b><br><small>ステージに そろった楽器：' + band.map(function (b) { return b[1]; }).join('') + '（' + band[band.length - 1][2] + 'まで）</small></div></div>';
  };
})();
