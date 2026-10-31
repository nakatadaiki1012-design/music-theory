/* =========================================================
   楽典ラボ：ゲームの演出（🚂 音楽史タイムトラベル列車）
   ・正解すると 薪（まき）を くべて 汽車が 加速。決まった数 正解すると 次の時代の 駅を 通過する
     ルネサンス → バロック → 古典派 → ロマン派 → 国民楽派 → 近代 → ジャズ → 現代 → 未来
   ・時代が 進むと 空も 夜明け → 朝 → 昼 → 夕方 → 夜 → 宇宙 と 変わる
   ・コンボで 楽器が 1 つずつ 客車に 乗ってくる（🎹 → 🎻 → 🎺 → 🥁 → 🎷 → 🎼）
   ・15 コンボごとに「ff（フォルティッシモ）特急」：8 秒間 点数 2 倍
   ・正解するたびに「歓喜の歌」が 1 音ずつ進む（あなたの演奏）。終わったら 再生できる
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

  /* ---------- 駅（時代）
     [何問 正解で 着くか, アイコン, 駅の名前, 年代, 作曲家, ひとこと, 空（上）, 空（下）, 景色の色, 景色] */
  ST.STATIONS = [
    [0, '⛪', 'ルネサンス駅', '1500年ごろ', 'パレストリーナ', '教会の 合唱が 中心。いくつもの 旋律を 重ねる 多声音楽が 花開く', '#f6b7a6', '#fde6c4', '#7d5a6b', 'ren'],
    [3, '🎹', 'バロック駅', '1700年ごろ', 'バッハ・ヘンデル・ヴィヴァルディ', 'オルガンや チェンバロが 大活躍。フーガや 協奏曲が 生まれる', '#ffd27a', '#fff1c9', '#8a6a3a', 'bar'],
    [7, '🏛', '古典派駅', '1780年ごろ', 'ハイドン・モーツァルト・ベートーヴェン', 'ソナタ形式が ととのい、交響曲や 弦楽四重奏が 生まれる', '#7ec3f0', '#d9f0ff', '#5a7790', 'cla'],
    [12, '🌹', 'ロマン派駅', '1830年ごろ', 'シューベルト・ショパン・シューマン', '心の 感情を 自由に 歌う。ピアノ曲や 歌曲が 花ざかり', '#9fb6ee', '#ffd9b8', '#6a5a80', 'rom'],
    [18, '🏰', '国民楽派駅', '1880年ごろ', 'ムソルグスキー・スメタナ・ドヴォルザーク', 'ふるさとの 民謡や 風景を 音楽に えがく', '#f39a6b', '#ffd48f', '#6b3f3a', 'nat'],
    [25, '🗼', '近代駅', '1900年ごろ', 'ドビュッシー・ラヴェル', '光や 水の ゆらめきを 和音の 色で えがく（印象主義）', '#b48ad8', '#f7b6c6', '#4f3c6b', 'mod'],
    [33, '🎷', 'ジャズ駅', '1930年ごろ', 'ガーシュウィン・エリントン', 'シンコペーションと 即興。ラプソディ・イン・ブルー', '#3b4f8f', '#e58a6b', '#1f2440', 'jaz'],
    [42, '🌃', '現代駅', '2000年ごろ', '映画音楽・ゲーム音楽・ポップス', '電子楽器も 使い、あらゆる ジャンルが まざりあう', '#141a3a', '#3b2d6b', '#0b0f22', 'now'],
    [53, '🪐', '未来駅', '？？？？年', 'あなた', 'つぎの 音楽の 歴史を つくるのは あなた！', '#05060f', '#1a1240', '#2a2f5a', 'fut']
  ];
  ST.stationOf = function (ok) { var v = 0; ST.STATIONS.forEach(function (x, i) { if (ok >= x[0]) v = i; }); return v; };
  ST.venueOf = function () { return 0; }; // 古い呼び出し用
  ST.BAND = [[0, '🎹', 'ピアノ'], [5, '🎻', 'バイオリン'], [10, '🎺', 'トランペット'], [15, '🥁', 'ティンパニ'], [20, '🎷', 'サックス'], [30, '🎼', 'フルオーケストラ']];
  ST.FF_EVERY = 10; ST.FF_SEC = 8;
  var bandOf = function (combo) { return ST.BAND.filter(function (b) { return combo >= b[0]; }); };
  function sound() { return GK.S.sound && M.audio(); }

  /* ---------- 景色（横に くり返す 影絵。幅 480・高さ 90） */
  function svgURI(body) { return 'url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="90" viewBox="0 0 480 90">' + body + '</svg>') + '")'; }
  var SCN = {
    ren: function (c) { return '<path d="M0 70 Q60 40 120 62 T240 58 T360 64 T480 70 V90 H0Z" fill="' + c + '" opacity=".55"/>' +
      '<g fill="' + c + '"><rect x="70" y="40" width="34" height="34"/><path d="M66 42 L87 22 L108 42Z"/><rect x="84" y="6" width="5" height="20"/><rect x="80" y="12" width="13" height="3"/>' +
      '<rect x="300" y="46" width="26" height="28"/><path d="M296 48 L313 32 L330 48Z"/><path d="M180 74 q6 -40 12 0Z"/><path d="M196 74 q5 -32 10 0Z"/><path d="M420 74 q6 -42 12 0Z"/></g>'; },
    bar: function (c) { return '<g fill="' + c + '"><rect x="60" y="38" width="90" height="38"/><path d="M80 38 a25 25 0 0 1 50 0Z"/><rect x="102" y="4" width="6" height="12"/><rect x="50" y="20" width="14" height="56"/><path d="M50 20 l7 -12 l7 12Z"/><rect x="146" y="20" width="14" height="56"/><path d="M146 20 l7 -12 l7 12Z"/>' +
      '<rect x="300" y="50" width="70" height="26"/><path d="M296 52 L335 30 L374 52Z"/>' + [0, 1, 2, 3, 4].map(function (i) { return '<rect x="' + (304 + i * 14) + '" y="56" width="6" height="16" fill="#fff6" />'; }).join('') + '</g>'; },
    cla: function (c) { return '<g fill="' + c + '"><rect x="40" y="44" width="170" height="32"/><path d="M90 44 L125 26 L160 44Z"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<rect x="' + (46 + i * 16) + '" y="50" width="5" height="26" fill="#ffffff55"/>'; }).join('') +
      '<circle cx="270" cy="58" r="14"/><rect x="268" y="60" width="4" height="16"/><circle cx="320" cy="56" r="16"/><rect x="318" y="60" width="4" height="16"/><circle cx="420" cy="60" r="12"/><rect x="418" y="62" width="4" height="14"/></g>'; },
    rom: function (c) { return '<path d="M0 76 Q120 30 240 70 T480 66 V90 H0Z" fill="' + c + '" opacity=".6"/><g fill="' + c + '"><rect x="110" y="30" width="60" height="26"/><rect x="100" y="16" width="16" height="40"/><rect x="164" y="22" width="16" height="34"/>' +
      '<path d="M100 16 l8 -12 l8 12Z"/><path d="M164 22 l8 -12 l8 12Z"/>' + [0, 1, 2, 3, 4].map(function (i) { return '<rect x="' + (112 + i * 12) + '" y="25" width="7" height="6"/>'; }).join('') + '<circle cx="400" cy="20" r="10" fill="#fff8e0" opacity=".9"/></g>'; },
    nat: function (c) { var t = ''; for (var i = 0; i < 12; i++) t += '<path d="M' + (230 + i * 20) + ' 76 l9 -' + (22 + (i % 3) * 8) + ' l9 ' + (22 + (i % 3) * 8) + 'Z"/>'; return '<g fill="' + c + '"><rect x="40" y="44" width="80" height="32"/><path d="M52 44 q0 -22 14 -28 q14 6 14 28Z"/><path d="M84 44 q0 -16 10 -22 q10 6 10 22Z"/><rect x="64" y="6" width="4" height="12"/>' +
      '<path d="M140 44 q0 -18 12 -24 q12 6 12 24Z"/><rect x="138" y="44" width="28" height="32"/>' + t + '</g>'; },
    mod: function (c) { return '<g fill="' + c + '"><path d="M200 76 L214 30 L218 4 L222 30 L236 76 L228 76 Q218 58 208 76Z"/><rect x="210" y="40" width="16" height="3"/>' +
      [0, 1, 2, 3, 4, 5].map(function (i) { return '<path d="M' + (20 + i * 28) + ' 76 V54 l6 -8 h14 l6 8 V76Z"/>'; }).join('') + [0, 1, 2, 3, 4, 5].map(function (i) { return '<path d="M' + (270 + i * 34) + ' 76 V50 l6 -8 h18 l6 8 V76Z"/>'; }).join('') + '</g>'; },
    jaz: function (c) { var hs = [40, 64, 30, 72, 52, 80, 44, 60, 36, 70, 48, 58], x = 6, o = ''; hs.forEach(function (h, i) { var w = 30 + (i % 3) * 6; o += '<rect x="' + x + '" y="' + (76 - h) + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>'; for (var y = 80 - h; y < 70; y += 9) for (var k = 4; k < w - 4; k += 8) if ((x + y + k) % 3) o += '<rect x="' + (x + k) + '" y="' + y + '" width="3" height="4" fill="#ffd76a" opacity=".8"/>'; x += w + 8; }); return o; },
    now: function (c) { var hs = [50, 36, 70, 44, 82, 40, 60, 34, 66, 48], x = 8, o = '<rect x="236" y="0" width="3" height="20" fill="' + c + '"/>'; hs.forEach(function (h, i) { var w = 36 + (i % 2) * 8; o += '<rect x="' + x + '" y="' + (76 - h) + '" width="' + w + '" height="' + h + '" fill="' + c + '"/><rect x="' + x + '" y="' + (78 - h) + '" width="' + w + '" height="2" fill="' + (i % 2 ? '#ff5ec4' : '#3ee8ff') + '"/>'; for (var y = 82 - h; y < 70; y += 10) o += '<rect x="' + (x + 6) + '" y="' + y + '" width="' + (w - 12) + '" height="2" fill="' + (i % 3 ? '#3ee8ff' : '#ffd76a') + '" opacity=".55"/>'; x += w + 10; }); return o; },
    fut: function () { var o = ''; for (var i = 0; i < 40; i++) o += '<circle cx="' + ((i * 97) % 480) + '" cy="' + ((i * 53) % 70) + '" r="' + (i % 5 ? .9 : 1.6) + '" fill="#fff" opacity="' + (.4 + (i % 4) * .15) + '"/>'; return o + '<circle cx="120" cy="30" r="16" fill="#e8a36b"/><ellipse cx="120" cy="30" rx="26" ry="6" fill="none" stroke="#f6d39b" stroke-width="2"/><circle cx="360" cy="46" r="9" fill="#7fb7ff"/>'; }
  };
  // 手前の 木と 電柱（速く流れる）
  var NEAR = svgURI('<g fill="#1d1a2b" opacity=".55"><rect x="40" y="38" width="3" height="52"/><rect x="30" y="42" width="23" height="3"/><path d="M180 90 q14 -44 28 0Z"/><path d="M330 90 q10 -30 20 0Z"/><rect x="430" y="38" width="3" height="52"/><rect x="420" y="42" width="23" height="3"/></g>');

  /* ---------- 汽車（機関車 ＋ 客車 2 両）。車輪は 回す */
  function trainSVG() {
    var wheel = function (x, r) { return '<g class="wh" data-x="' + x + '" data-y="' + (64 - r) + '"><circle cx="' + x + '" cy="' + (64 - r) + '" r="' + r + '" fill="#b3342b" stroke="#2b1a14" stroke-width="2"/><path d="M' + (x - r + 2) + ' ' + (64 - r) + ' H' + (x + r - 2) + ' M' + x + ' ' + (64 - 2 * r + 2) + ' V' + (62) + '" stroke="#2b1a14" stroke-width="1.6"/></g>'; };
    var coach = function (x, col) { return '<rect x="' + x + '" y="24" width="64" height="32" rx="5" fill="' + col + '" stroke="#2b1a14" stroke-width="2"/><rect x="' + (x - 2) + '" y="20" width="68" height="6" rx="3" fill="#2b2b3a"/>' +
      [0, 1, 2].map(function (i) { return '<rect x="' + (x + 6 + i * 19) + '" y="30" width="15" height="13" rx="2" fill="#fff4d6" stroke="#2b1a14" stroke-width="1"/>'; }).join('') + wheel(x + 14, 7) + wheel(x + 50, 7); };
    return '<svg class="trs" viewBox="0 0 270 68" width="270" height="68" aria-hidden="true">' +
      coach(2, '#7a2a3a') + coach(74, '#2f6b5a') + '<rect x="66" y="44" width="10" height="3" fill="#2b2b3a"/><rect x="138" y="44" width="10" height="3" fill="#2b2b3a"/>' +
      // 機関車
      '<rect x="148" y="14" width="34" height="42" rx="3" fill="#2b2b3a"/><rect x="154" y="20" width="22" height="13" rx="2" fill="#ffe9a8"/><rect x="144" y="10" width="42" height="6" rx="2" fill="#d4a640"/>' +
      '<rect x="180" y="28" width="66" height="26" rx="12" fill="#33334a"/><rect x="184" y="31" width="58" height="3" fill="#d4a640"/><rect x="220" y="8" width="12" height="22" fill="#2b2b3a"/><rect x="216" y="4" width="20" height="7" rx="2" fill="#2b2b3a"/>' +
      '<circle cx="198" cy="28" r="5" fill="#d4a640"/><path d="M246 54 L262 62 L246 62Z" fill="#b3342b"/><circle cx="246" cy="40" r="4" fill="#fff4b0"/>' +
      '<rect class="fire" x="160" y="40" width="14" height="10" rx="2" fill="#ff8a2a"/>' +
      wheel(170, 9) + wheel(198, 11) + wheel(226, 11) +
      // 窓の 楽器
      '<g class="pax" font-size="11" text-anchor="middle">' + [[13, 40], [32, 40], [51, 40], [85, 40], [104, 40], [123, 40]].map(function (p, i) { return '<text x="' + (p[0] + 0.5) + '" y="' + p[1] + '" data-i="' + i + '"></text>'; }).join('') + '</g></svg>';
  }

  // 列車の帯（問題の上）
  ST.html = function () {
    var s0 = ST.STATIONS[0], s1 = ST.STATIONS[1];
    return '<div class="trn" id="stg" data-e="0"><div class="sky a" style="background:linear-gradient(' + s0[6] + ',' + s0[7] + ')"></div><div class="sky b"></div>' +
      '<div class="far a" style="background-image:' + svgURI(SCN[s0[9]](s0[8])) + '"></div><div class="far b"></div><div class="near" style="background-image:' + NEAR + '"></div><div class="rail"></div>' +
      '<div class="tr">' + trainSVG() + '</div><div class="fx"></div>' +
      '<div class="tinfo"><span class="now" id="stgV">' + s0[1] + ' ' + s0[2] + ' <small>' + s0[3] + '</small></span><span class="sa"><i id="stgA"></i></span><span class="sn" id="stgN">次：' + s1[2] + '</span></div></div>';
  };
  ST.ffOn = function (G) { return G.ffUntil && Date.now() < G.ffUntil; };

  // 時代を 変える（空と 景色を ふわっと 入れかえる）
  function setEra(G, e) {
    var el = $('#stg', G.box); if (!el) return;
    var s = ST.STATIONS[e], top = el.dataset.top === 'b' ? 'a' : 'b', bot = top === 'a' ? 'b' : 'a';
    var sky = $('.sky.' + top, el), far = $('.far.' + top, el);
    sky.style.background = 'linear-gradient(' + s[6] + ',' + s[7] + ')';
    far.style.backgroundImage = svgURI(SCN[s[9]](s[8]));
    sky.style.opacity = 1; far.style.opacity = 1; $('.sky.' + bot, el).style.opacity = 0; $('.far.' + bot, el).style.opacity = 0;
    el.dataset.top = top; el.dataset.e = e;
  }

  ST.update = function (G) {
    var el = $('#stg', G.box); if (!el) return;
    var e = G.era || 0, cur = ST.STATIONS[e], nx = ST.STATIONS[e + 1];
    $('#stgV', el).innerHTML = cur[1] + ' ' + cur[2] + ' <small>' + cur[3] + '</small>';
    $('#stgA', el).style.width = (nx ? Math.min(100, (G.ok - cur[0]) / (nx[0] - cur[0]) * 100) : 100) + '%';
    $('#stgN', el).textContent = nx ? '次：' + nx[2] + '（あと ' + (nx[0] - G.ok) + ' 問）' : '終点！';
    var band = bandOf(G.combo).map(function (b) { return b[1]; });
    GK.$$('.pax text', el).forEach(function (t, i) { var v = band[i] || ''; if (t.textContent !== v) t.textContent = v; });
    el.classList.toggle('ff', !!ST.ffOn(G));
  };

  /* ---------- 走らせる（requestAnimationFrame。値を なめらかに 変えるので チカチカしない） */
  function run(G) {
    var el = $('#stg', G.box); if (!el || G.trRun) return;
    G.trRun = true; G.trOff = 0; G.trBoost = 0; G.trPuff = 0;
    var far = GK.$$('.far', el), near = $('.near', el), rail = $('.rail', el), whs = GK.$$('.wh', el), fx = $('.fx', el), last = performance.now();
    function frame(t) {
      if (!G || G.dead || !el.isConnected) { G.trRun = false; return; }
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      var base = G.over ? 0 : 26 + Math.min(G.combo, 30) * 2.5, sp = Math.max(4, (base + G.trBoost) * (ST.ffOn(G) ? 1.6 : 1));
      if (G.over) sp = Math.max(0, (G.trSp || 0) - 60 * dt);
      G.trSp = sp; G.trBoost *= Math.pow(0.25, dt); // 加速は だんだん もとに もどる
      G.trOff += sp * dt;
      var o = G.trOff;
      far.forEach(function (f) { f.style.backgroundPositionX = (-o * 0.25).toFixed(1) + 'px'; });
      near.style.backgroundPositionX = (-o * 1.1).toFixed(1) + 'px';
      rail.style.backgroundPositionX = (-o * 1.3).toFixed(1) + 'px';
      whs.forEach(function (w) { w.setAttribute('transform', 'rotate(' + ((o * 4) % 360).toFixed(1) + ' ' + w.dataset.x + ' ' + w.dataset.y + ')'); });
      G.trPuff += sp * dt;
      if (G.trPuff > 70 && sp > 5) { G.trPuff = 0; puff(fx, 1); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  // けむり
  function puff(fx, size) {
    if (!fx || fx.childElementCount > 14) return;
    var p = document.createElement('i'); p.className = 'puff' + (size > 1 ? ' big' : ''); fx.appendChild(p);
    setTimeout(function () { p.remove(); }, 1500);
  }
  // 薪を くべる：上から 薪が とんで 火室へ → 火が ぼっと 明るく → 加速
  function addLog(G) {
    var el = $('#stg', G.box); if (!el) return;
    var fx = $('.fx', el), fire = $('.fire', el), lg = document.createElement('i'); lg.className = 'log'; fx.appendChild(lg);
    var er = el.getBoundingClientRect(), fr = fire.getBoundingClientRect();
    var x1 = er.width * 0.62, x2 = fr.left - er.left + fr.width / 2 - 9, y2 = fr.top - er.top - 2;
    if (lg.animate) lg.animate([{ transform: 'translate(' + x1 + 'px,-14px) rotate(0)' }, { transform: 'translate(' + ((x1 + x2) / 2) + 'px,' + (y2 - 36) + 'px) rotate(200deg)', offset: .55 }, { transform: 'translate(' + x2 + 'px,' + y2 + 'px) rotate(340deg)', opacity: 1, offset: .9 }, { transform: 'translate(' + x2 + 'px,' + (y2 + 6) + 'px) rotate(360deg)', opacity: 0 }], { duration: 520, easing: 'ease-in' });
    setTimeout(function () {
      lg.remove(); if (!G || G.dead) return;
      G.trBoost = Math.min(260, (G.trBoost || 0) + 150);
      if (fire.animate) fire.animate([{ fill: '#fff3a0' }, { fill: '#ff5a1a' }, { fill: '#ff8a2a' }], { duration: 600 });
      puff(fx, 2); puff(fx, 1);
    }, 500);
  }

  // 小さな お知らせ（問題の上に 一瞬）。同時に出たときは 順番に
  ST.banner = function (G, html, cls) {
    var at = Math.max(Date.now(), G.bannerFree || 0), wait = at - Date.now();
    G.bannerFree = at + (cls === 'venue' ? 2100 : 1300);
    setTimeout(function () {
      var p = G.box && G.box.firstChild; if (!p || G.dead || G.over || !p.querySelector('#stg')) return; // 終わったあとの 画面には 出さない
      var b = document.createElement('div'); b.className = 'gbanner ' + (cls || ''); b.innerHTML = html;
      p.appendChild(b); setTimeout(function () { b.remove(); }, cls === 'venue' ? 2300 : 1600);
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

  // 正解：薪を くべて 加速、次の 1 音を演奏（コンボで 伴奏が ふえる）
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
    run(G); addLog(G);
    // 楽器が 乗ってくる
    var join = ST.BAND.filter(function (b) { return b[0] === G.combo && b[0] > 0; })[0];
    if (join) { ST.banner(G, join[1] + ' ' + join[2] + 'が 乗車！'); GK.fx('combo'); }
    // ff 特急
    if (G.combo > 0 && G.combo % ST.FF_EVERY === 0) {
      G.ffUntil = Date.now() + ST.FF_SEC * 1000;
      ST.banner(G, '<b class="en">ff</b> 特急 モード！ ' + ST.FF_SEC + ' 秒間 点数 ×2', 'ffb');
      GK.fx('fanfare');
    }
    // 次の 駅に 着いた
    var e = ST.stationOf(G.ok);
    if (e > (G.era || 0)) {
      G.era = e; var s = ST.STATIONS[e];
      setTimeout(function () {
        if (!G || G.dead || G.over) return;
        setEra(G, e); passSign(G, s);
        ST.banner(G, '🚉 <b>' + s[2] + '</b> 通過！<br><small>🎼 ' + s[4] + 'の 時代（' + s[3] + '）</small>', 'venue');
        if (sound()) { GK.fx('poppo'); ST.applause(0.3 + e * 0.07); }
      }, 300);
    }
    ST.notes(btn, 2 + Math.min(6, Math.floor(G.combo / 3)), ST.ffOn(G));
    ST.update(G);
  };
  // 駅の 看板が 右から 左へ 通りすぎる
  function passSign(G, s) {
    var el = $('#stg', G.box); if (!el) return;
    var g = document.createElement('div'); g.className = 'sign'; g.innerHTML = '<b>' + s[1] + ' ' + s[2] + '</b><small>' + s[3] + '</small>';
    $('.fx', el).appendChild(g); setTimeout(function () { g.remove(); }, 2600);
  }
  // まちがい：ブレーキ（ミスタッチの音）
  ST.wrong = function (G) {
    (G.played = G.played || []).push(null);
    if (sound()) M.play([[['C#4', 'D4', 'G#3'], 0.5]], 120);
    run(G); G.trBoost = -20;
    ST.update(G);
  };
  // 残り 5 秒：メトロノーム
  ST.tick = function (G, left) {
    run(G);
    var s = Math.ceil(left / 1000);
    if (left > 0 && s <= 5 && G.lastTickS !== s) { G.lastTickS = s; GK.fx('tick'); }
    var el = $('#stg', G.box); if (el) { var on = !!ST.ffOn(G); if (el.classList.contains('ff') !== on) el.classList.toggle('ff', on); }
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
  // 終わったあと：どこまで 行けたか
  ST.curtain = function (G) {
    var e = ST.stationOf(G.ok), s = ST.STATIONS[e], band = bandOf(G.maxCombo);
    return '<div class="curtain"><div class="cv">' + s[1] + '</div><div><b>🚂 到着：' + s[2] + '（' + s[3] + '）</b><br><small>🎼 ' + s[4] + '　' + s[5] + '</small><br>' +
      '<span class="route">' + ST.STATIONS.map(function (x, i) { return '<i class="' + (i <= e ? 'on' : '') + '" title="' + x[2] + '">' + x[1] + '</i>'; }).join('<b>─</b>') + '</span>' +
      '<br><small>乗ってきた楽器：' + band.map(function (b) { return b[1]; }).join('') + '</small></div></div>';
  };
})();
