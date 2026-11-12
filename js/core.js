/* =========================================================
   楽典ラボ：共通の道具（保存・設定・効果音・コイン・画面の切りかえ）
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, M = GK.M;

  /* ---------- 小さな道具 ---------- */
  GK.$ = function (s, r) { return (r || document).querySelector(s); };
  GK.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  GK.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  // 音楽記号の文字（𝄞 𝄆 𝄋 など）は 楽譜用フォントで
  GK.symfix = function (html) { return String(html).replace(/([\u{1D100}-\u{1D1FF}])/gu, '<span class="sym">$1</span>'); };
  GK.fmtN = function (n) { return Math.round(n).toLocaleString('ja-JP'); };
  GK.view = document.getElementById('view');

  /* ---------- 保存（この端末のブラウザの中） ---------- */
  /* 記録が こわれない ための しくみ
     ・読むとき：形（数・文字・配列・オブジェクト）が 初期値と ちがえば 初期値に もどす。足りない 項目は 初期値で うめる
     ・こわれた データ（JSON として 読めない）は「gk:bad:名前」に 退避して から 初期値で 動く
     ・書くとき：容量オーバーなら 退避データや 毎日の 控えを 消して もう一度。だめなら 1 回だけ お知らせ
     ・起動時に 形を ととのえ（repair）、1 日 1 回 控え（gk:snap）を とる。ファイルへの 保存・読みこみも できる */
  var PFX = 'gk:', VER = 2, LS = null;
  try { LS = window.localStorage; LS.getItem(PFX + 'ver'); } catch (e) { LS = null; }   // 読めるか だけ 確かめる（容量いっぱい でも 読めれば 記録は 見せる）
  var mem = {};   // localStorage が 使えない とき（プライベートモード など）は この ページの 間だけ 覚える
  var raw = {
    get: function (k) { try { return LS ? LS.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return null; } },
    set: function (k, v) { if (!LS) { mem[k] = v; return; } LS.setItem(k, v); },
    del: function (k) { try { if (LS) LS.removeItem(k); else delete mem[k]; } catch (e) { } },
    keys: function () { var r = []; try { if (LS) { for (var i = 0; i < LS.length; i++) r.push(LS.key(i)); } else r = Object.keys(mem); } catch (e) { } return r.filter(function (k) { return k && k.indexOf(PFX) === 0; }); }
  };
  var typeOf = function (v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; };
  var clone = function (v) { return v == null || typeof v !== 'object' ? v : JSON.parse(JSON.stringify(v)); };
  // 読んだ 値 v を 初期値 d の 形に あわせる
  //  ・入れもの（オブジェクト・配列）の 形が ちがえば 初期値
  //  ・ふつうの 値は 文字・数・真偽の どれでも 受けいれる（例：合格の 印は 日付の 文字）。null や NaN（こわれた 数）だけ 初期値に
  function fit(v, d) {
    if (d === undefined || d === null) return v;
    var td = typeOf(d), tv = typeOf(v);
    if (td !== 'object' && td !== 'array') return tv === 'null' || tv === 'undefined' || tv === 'object' || tv === 'array' || (tv === 'number' && !isFinite(v)) ? d : v;
    if (td !== tv) return clone(d);
    if (td === 'object') {
      var r = {}, k;
      for (k in v) if (Object.prototype.hasOwnProperty.call(v, k)) r[k] = v[k];
      for (k in d) if (Object.prototype.hasOwnProperty.call(d, k)) r[k] = k in v ? fit(v[k], d[k]) : clone(d[k]);
      return r;
    }
    return v;
  }
  function parse(k, s) {   // こわれて いたら 退避して undefined
    if (s == null) return undefined;
    try { return JSON.parse(s); } catch (e) {
      try { if (k.indexOf(PFX + 'bad:') !== 0) raw.set(PFX + 'bad:' + k.slice(PFX.length), s); } catch (e2) { }
      if (window.console) console.warn('記録が こわれていたので 初期値に もどしました：', k);
      return undefined;
    }
  }
  var warned = false;
  function write(k, s) {
    try { raw.set(k, s); return true; } catch (e) {
      // 容量オーバー：退避データ → 控え の 順に 消して もう一度
      raw.keys().filter(function (x) { return x.indexOf(PFX + 'bad:') === 0; }).forEach(raw.del);
      try { raw.set(k, s); return true; } catch (e2) { }
      raw.del(PFX + 'snap');
      try { raw.set(k, s); return true; } catch (e3) { }
      if (!warned) { warned = true; setTimeout(function () { GK.toast && GK.toast('⚠ 記録を 保存 できませんでした（ブラウザの 保存領域が いっぱい です）'); }, 0); }
      return false;
    }
  }
  GK.store = {
    // d：初期値（形の お手本）。d が オブジェクトなら 足りない 項目を うめた 新しい オブジェクトを 返す
    get: function (k, d) { var v = parse(PFX + k, raw.get(PFX + k)); return v === undefined ? clone(d) : fit(v, d); },
    set: function (k, v) { if (v === undefined) { raw.del(PFX + k); return true; } var s; try { s = JSON.stringify(v); } catch (e) { return false; } return write(PFX + k, s); },
    del: function (k) { raw.del(PFX + k); },
    keys: function () { return raw.keys().map(function (k) { return k.slice(PFX.length); }); },
    ok: !!LS
  };
  GK.store._fit = fit;

  /* ---------- 起動時の 点検と 修理 ---------- */
  var num0 = function (v) { return typeof v === 'number' && isFinite(v) && v >= 0; };
  var cleanMap = function (o, okv) { if (typeOf(o) !== 'object') return {}; var r = {}; Object.keys(o).forEach(function (k) { if (okv(o[k])) r[k] = o[k]; }); return r; };
  var PROG0 = { card: 0, seen: false, prac: 0, pracN: 0, test: -1, pass: 0 };
  var RW0 = { coins: 0, streak: 0, lastDay: 0, badges: {}, best: {}, battles: 0, top3: 0, maxCombo: 0, taBest: 0, drillOk: 0, earOk: 0 };
  var REPAIR = {
    rw: function (v) { var r = fit(v, RW0); ['coins', 'streak', 'lastDay', 'battles', 'top3', 'maxCombo', 'taBest', 'drillOk', 'earOk'].forEach(function (k) { if (!num0(r[k])) r[k] = 0; }); r.best = cleanMap(r.best, function (x) { return typeof x === 'number' && isFinite(x); }); r.badges = cleanMap(r.badges, function (x) { return !!x; }); return r; },
    weak: function (v) { return cleanMap(v, num0); },
    weakT: function (v) { return cleanMap(v, num0); },
    hlabUnit: function (v) { return cleanMap(v, num0); },
    skill: function (v) { var r = {}; if (typeOf(v) !== 'object') return r; Object.keys(v).forEach(function (k) { if (typeOf(v[k]) !== 'object') return; var x = fit(v[k], { n: 0, ok: 0, b: 0, d: 0, rec: '', up: -1 }); ['n', 'ok', 'b'].forEach(function (q) { if (!num0(x[q])) x[q] = 0; }); if (typeof x.d !== 'number') x.d = 0; x.rec = String(x.rec).replace(/[^01]/g, '').slice(-8); x.b = Math.min(5, x.b); r[k] = x; }); return r; },
    actDays: function (v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'number' && isFinite(x); }).slice(-60) : []; },
    taskSel: function (v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : []; }
  };
  GK.store.repair = function () {
    var fixed = 0;
    raw.keys().forEach(function (fk) {
      var k = fk.slice(PFX.length); if (/^(bad:|snap$|ver$|_t$)/.test(k)) return;
      var s = raw.get(fk), v = parse(fk, s);
      if (v === undefined) { raw.del(fk); fixed++; return; }
      var f = REPAIR[k] || (/^u:/.test(k) ? function (x) { var r = fit(x, PROG0); ['card', 'prac', 'pracN'].forEach(function (q) { if (!num0(r[q])) r[q] = 0; }); return r; } : null);
      if (!f) return;
      var nv = f(v), ns = JSON.stringify(nv);
      if (ns !== s) { write(fk, ns); fixed++; }
    });
    if (raw.get(PFX + 'ver') !== String(VER)) write(PFX + 'ver', String(VER));
    return fixed;
  };
  // ぜんぶの 記録（gk: で はじまる もの。退避データと 控えは のぞく）
  GK.store.dump = function () { var o = {}; raw.keys().forEach(function (k) { if (!/^gk:(bad:|snap$|_t$)/.test(k)) o[k] = raw.get(k); }); return o; };
  // 記録を まるごと 入れかえる（ファイルや 控えから）。形を 点検 してから
  GK.store.load = function (data) {
    if (typeOf(data) !== 'object') throw new Error('形が ちがいます');
    var ks = Object.keys(data).filter(function (k) { return k.indexOf(PFX) === 0 && !/^gk:(bad:|snap$)/.test(k) && typeof data[k] === 'string'; });
    if (!ks.length) throw new Error('楽典ラボの 記録が 入って いません');
    ks.forEach(function (k) { JSON.parse(data[k]); });   // 読めない ものが あれば ここで 止める
    var keep = GK.store.dump();
    raw.keys().forEach(function (k) { if (!/^gk:(bad:|snap$)/.test(k)) raw.del(k); });
    try { ks.forEach(function (k) { raw.set(k, data[k]); }); }
    catch (e) { raw.keys().forEach(function (k) { if (!/^gk:(bad:|snap$)/.test(k)) raw.del(k); }); Object.keys(keep).forEach(function (k) { try { raw.set(k, keep[k]); } catch (e2) { } }); throw new Error('保存領域が たりません'); }
    GK.store.repair();
  };
  // 1 日 1 回、その日 最初に 開いた ときの 記録を 控えて おく（こまった ときに 控えへ もどせる）
  //   force：日に 関係なく いまの 記録を 控える（消す・入れかえる 直前に）
  GK.store.snapshot = function (force) {
    var d = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5), cur = parse(PFX + 'snap', raw.get(PFX + 'snap'));
    if (cur && cur.day === d && !force) return;
    var data = GK.store.dump(); if (Object.keys(data).length <= 2) return;
    raw.del(PFX + 'snap');
    try { raw.set(PFX + 'snap', JSON.stringify({ day: d, at: Date.now(), data: data })); } catch (e) { }
  };
  GK.store.snapInfo = function () { var c = parse(PFX + 'snap', raw.get(PFX + 'snap')); return c && typeOf(c.data) === 'object' ? c : null; };
  GK.store.repair();
  GK.store.snapshot();
  var S0 = { names: 'doremi', theme: 'auto', size: 1, sound: true, db: '', nick: '' }, S = GK.S = GK.store.get('set', S0);
  GK.saveS = function () { GK.store.set('set', S); };
  GK.applyLook = function () {
    var r = document.documentElement;
    if (S.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme);
    r.setAttribute('data-size', S.size);
  };
  GK.applyLook();
  // 音名（設定の書き方で）
  GK.nm = function (p) { return M.name(p, S.names); };
  GK.SYS_NAME = { doremi: 'ドレミ', jp: 'ハニホ（日本音名）', en: 'CDE（英語音名）' };

  /* ---------- 乱数（同じ seed なら 同じ問題） ---------- */
  GK.rng = function (seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  GK.shuffle = function (a, R) { R = R || Math.random; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  GK.pick = function (a, R) { return a[Math.floor((R || Math.random)() * a.length)]; };
  GK.ri = function (a, b, R) { return a + Math.floor((R || Math.random)() * (b - a + 1)); };

  /* ---------- お知らせ ---------- */
  var tt = null;
  GK.toast = function (msg) {
    var el = GK.$('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false; clearTimeout(tt); tt = setTimeout(function () { el.hidden = true; }, 2600);
  };
  var cq = [], cbusy = false;
  GK.celebrate = function (t, big) {
    cq.push([t, big]); if (cbusy) return;
    (function nextC() {
      var x = cq.shift(); if (!x) { cbusy = false; return; }
      cbusy = true;
      var d = document.createElement('div'); d.className = 'celebrate' + (document.querySelector('#gq .qz, .qz .ch') ? ' mini' : '');   // 問題を 解いている ときは 上の すみに 小さく（問題を かくさない）
      d.innerHTML = '<small>' + GK.esc(x[0]) + '</small><b>' + GK.esc(x[1]) + '</b>';
      document.body.appendChild(d); GK.fx('fanfare');
      setTimeout(function () { d.remove(); nextC(); }, 2000);
    })();
  };
  GK.confetti = function (n) {
    var cols = ['#c4452a', '#2c8a5c', '#2f6bb8', '#c08a0e', '#7d4fb0'];
    for (var i = 0; i < (n || 60); i++) {
      var c = document.createElement('i'); c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % cols.length];
      c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's'; c.style.animationDelay = Math.random() * .6 + 's';
      document.body.appendChild(c); setTimeout(c.remove.bind(c), 4000);
    }
  };

  /* ---------- 効果音（その場で作る） ---------- */
  GK.fx = function (kind) {
    if (!S.sound) return;
    var ac = M.audio(); if (!ac) return;
    var t = ac.currentTime + 0.01;
    function beep(f, at, d, type, v) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t + at);
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(v || 0.12, t + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
      o.connect(g); g.connect(ac.destination); o.start(t + at); o.stop(t + at + d + 0.05);
    }
    if (kind === 'tap') beep(660, 0, 0.06, 'triangle', 0.06);
    else if (kind === 'ok') { beep(880, 0, 0.12, 'triangle'); beep(1320, 0.07, 0.18, 'triangle'); }
    else if (kind === 'ng') { beep(220, 0, 0.18, 'square', 0.06); beep(196, 0.1, 0.22, 'square', 0.06); }
    else if (kind === 'combo') { [988, 1175, 1568].forEach(function (f, i) { beep(f, i * 0.06, 0.14, 'triangle', 0.1); }); }
    else if (kind === 'count') beep(740, 0, 0.12, 'sine', 0.15);
    else if (kind === 'tick') { beep(1760, 0, 0.04, 'square', 0.05); beep(880, 0, 0.06, 'sine', 0.08); }
    else if (kind === 'go') beep(1480, 0, 0.35, 'sine', 0.18);
    else if (kind === 'poppo') { [[587, 0], [740, 0], [880, 0], [587, .42], [740, .42], [880, .42]].forEach(function (x) { beep(x[0], x[1], .34, 'triangle', .07); }); } // 汽笛
    else if (kind === 'whistle') { beep(2100, 0, 0.5, 'sine', 0.12); beep(2160, 0, 0.5, 'sine', 0.08); }
    else if (kind === 'fanfare') { [523, 659, 784, 1047].forEach(function (f, i) { beep(f, i * 0.11, i === 3 ? 0.5 : 0.14, 'triangle', 0.12); }); }
    else if (kind === 'drum') { for (var i = 0; i < 16; i++) beep(120 + Math.random() * 30, i * 0.07, 0.06, 'square', 0.05); }
  };

  /* ---------- 進みぐあい ---------- */
  GK.prog = function (uid) { return GK.store.get('u:' + uid, PROG0); };
  GK.setProg = function (uid, o) { GK.store.set('u:' + uid, Object.assign(GK.prog(uid), o)); };
  GK.TEST_N = 8; GK.PASS = 6; // 確認テスト 8 問中 6 問で 合格（75%）

  /* ---------- ごほうび（コイン・段位・バッジ） ---------- */
  var RANKS = GK.RANKS = [[0, '10級'], [100, '9級'], [250, '8級'], [500, '7級'], [800, '6級'], [1200, '5級'], [1700, '4級'], [2300, '3級'], [3000, '2級'], [4000, '1級'], [5500, '初段'], [7500, '二段'], [10000, '三段'], [13000, '四段'], [17000, '五段'], [22000, '名人']];
  GK.BADGES = [
    { id: 'first', ico: '🌱', name: 'はじめの一歩', how: 'はじめてコインを手に入れる' },
    { id: 'pass1', ico: '💮', name: '初合格', how: '確認テストに 1 つ合格' },
    { id: 'pass7', ico: '🎼', name: '半分クリア', how: '確認テストに 7 つ合格' },
    { id: 'passAll', ico: '👑', name: '楽典マスター', how: '全単元の確認テストに合格' },
    { id: 'drill100', ico: '📝', name: '100 問', how: '演習で 100 問正解' },
    { id: 'drill500', ico: '📚', name: '500 問', how: '演習で 500 問正解' },
    { id: 'day3', ico: '🔥', name: '3日連続', how: '3 日続けて 学習する' },
    { id: 'day7', ico: '🌋', name: '7日連続', how: '7 日続けて 学習する' },
    { id: 'combo10', ico: '⚡', name: '10 コンボ', how: 'タイムアタックで 10 問連続正解' },
    { id: 'combo30', ico: '🌩', name: '30 コンボ', how: 'タイムアタックで 30 問連続正解' },
    { id: 'ta1000', ico: '🎯', name: '1,000 点', how: 'タイムアタックで 1,000 点' },
    { id: 'ta3000', ico: '🚀', name: '3,000 点', how: 'タイムアタックで 3,000 点' },
    { id: 'ear', ico: '👂', name: 'いい耳', how: '聴いて答える問題に 30 問正解' },
    { id: 'battle', ico: '🏆', name: 'クラス対戦デビュー', how: 'クラス対戦に参加する' },
    { id: 'top3', ico: '🥇', name: '表彰台', how: 'クラス対戦で 3 位以内' },
    { id: 'coin5000', ico: '💰', name: '5,000 コイン', how: 'コインを 5,000 枚ためる' }
  ];
  var RW = GK.RW = REPAIR.rw(GK.store.get('rw', RW0));
  GK.rwSave = function () { GK.store.set('rw', RW); };
  // 別の タブで 記録が かわったら、この タブの 手もちも 合わせる（古い 手もちで 上書きして 消さない ため）
  window.addEventListener('storage', function (e) {
    if (!e.key || e.newValue == null) return;
    var v; try { v = JSON.parse(e.newValue); } catch (x) { return; }
    if (e.key === PFX + 'rw') { v = REPAIR.rw(v); Object.keys(v).forEach(function (k) { RW[k] = v[k]; }); GK.coinChip && GK.coinChip(); }
    else if (e.key === PFX + 'set') { v = fit(v, S0); Object.keys(v).forEach(function (k) { S[k] = v[k]; }); GK.applyLook && GK.applyLook(); }
  });
  GK.dayNo = function () { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); };
  GK.today = function () { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  GK.levelOf = function (c) {
    var i = 0; while (i + 1 < RANKS.length && c >= RANKS[i + 1][0]) i++;
    var nx = RANKS[i + 1];
    return { i: i, name: RANKS[i][1], from: RANKS[i][0], next: nx ? nx[0] : null, nextName: nx ? nx[1] : null };
  };
  function touchDay() { var d = GK.dayNo(); if (RW.lastDay === d) return; RW.streak = RW.lastDay === d - 1 ? RW.streak + 1 : 1; RW.lastDay = d; }
  GK.touchDay = function () { touchDay(); GK.rwSave(); };
  GK.passCount = function () { return (GK.UNITS || []).filter(function (u) { return GK.prog(u.id).pass; }).length; };
  function badgeOn(id) {
    var n = (GK.UNITS || []).length || 13;
    switch (id) {
      case 'first': return RW.coins > 0;
      case 'pass1': return GK.passCount() >= 1;
      case 'pass7': return GK.passCount() >= 7;
      case 'passAll': return GK.passCount() >= n;
      case 'drill100': return RW.drillOk >= 100;
      case 'drill500': return RW.drillOk >= 500;
      case 'day3': return RW.streak >= 3;
      case 'day7': return RW.streak >= 7;
      case 'combo10': return RW.maxCombo >= 10;
      case 'combo30': return RW.maxCombo >= 30;
      case 'ta1000': return RW.taBest >= 1000;
      case 'ta3000': return RW.taBest >= 3000;
      case 'ear': return RW.earOk >= 30;
      case 'battle': return RW.battles >= 1;
      case 'top3': return RW.top3 >= 1;
      case 'coin5000': return RW.coins >= 5000;
    }
    return false;
  }
  GK.checkBadges = function () {
    GK.BADGES.forEach(function (b) { if (!RW.badges[b.id] && badgeOn(b.id)) { RW.badges[b.id] = GK.today(); GK.celebrate(b.ico + ' バッジ獲得', b.name); } });
    GK.rwSave();
  };
  GK.earn = function (n) {
    if (!n) return;
    var before = GK.levelOf(RW.coins).i;
    RW.coins += n; touchDay();
    var lv = GK.levelOf(RW.coins);
    if (lv.i > before) { GK.celebrate('🎉 段位アップ！', lv.name); GK.confetti(50); }
    GK.checkBadges(); GK.coinChip(); plusAnim(n);
  };
  GK.coinChip = function () {
    var el = GK.$('#coinBtn'); if (!el) return;
    var lv = GK.levelOf(RW.coins);
    el.innerHTML = '🪙<b>' + GK.fmtN(RW.coins) + '</b><span class="rk">' + lv.name + '</span>';
    el.title = 'コイン ' + GK.fmtN(RW.coins) + '・' + lv.name + '（おすとゲームへ）';
  };
  function plusAnim(n) {
    var el = GK.$('#coinBtn'); if (!el) return;
    var rc = el.getBoundingClientRect(), p = document.createElement('div');
    p.className = 'plus'; p.textContent = '+' + n; p.style.left = rc.left + rc.width / 2 + 'px'; p.style.top = rc.bottom + 'px';
    document.body.appendChild(p); setTimeout(function () { p.remove(); }, 900);
  }
  GK.rewardsHTML = function () {
    var lv = GK.levelOf(RW.coins), pc = lv.next ? (RW.coins - lv.from) / (lv.next - lv.from) * 100 : 100;
    var streak = RW.lastDay >= GK.dayNo() - 1 ? RW.streak : 0;
    return '<div class="lvbox"><div class="lvname">' + lv.name + '</div><div class="bar"><i style="width:' + pc + '%"></i></div>' +
      '<p class="note">' + (lv.next ? '🪙 ' + GK.fmtN(RW.coins) + '　あと ' + GK.fmtN(lv.next - RW.coins) + ' で ' + lv.nextName : '🪙 ' + GK.fmtN(RW.coins) + '　最高位です！') + (streak ? '　🔥 ' + streak + ' 日連続' : '') + '</p></div>' +
      '<div class="bdg">' + GK.BADGES.map(function (b) { return '<div class="bd' + (RW.badges[b.id] ? '' : ' off') + '" title="' + GK.esc(b.how) + '"><span>' + b.ico + '</span><b>' + b.name + '</b><small>' + (RW.badges[b.id] ? RW.badges[b.id] : b.how) + '</small></div>'; }).join('') + '</div>' +
      '<p class="note">コイン：演習で正解 +5、確認テスト合格 +50（はじめては +150）、タイムアタック 20 点ごとに +1、クラス対戦 参加 +20・3 位以内 +50</p>';
  };

  /* ---------- 画面の切りかえ（URL の # で） ---------- */
  var routes = [], leaveFns = [], always = [];
  GK.route = function (re, fn) { routes.push([re, fn]); };
  GK.onLeave = function (fn) { always.push(fn); };      // 画面をはなれるたびに いつも
  GK.onLeaveOnce = function (fn) { leaveFns.push(fn); }; // いまの画面を はなれる時だけ
  GK.go = function (h) { if (location.hash === h) GK.render(); else location.hash = h; };
  GK.courseKey = function () { return document.body.dataset.course || 'theory'; };
  GK.courseUnits = function (c) { c = c || GK.courseKey(); return c === 'harm' ? GK.HUNITS : c === 'cp' ? GK.CPUNITS : GK.UNITS; };
  var COURSES = {
    theory: { brand: '楽典', home: '#home/theory', drill: '#drill/c/theory', game: '#game/c/theory', third: ['🎹', '#tools', 'さわる'] },
    harm: { brand: '和声法', home: '#home/harm', drill: '#drill/c/harm', game: '#game/c/harm', third: ['✍️', '#hlab', '実践'] },
    cp: { brand: '対位法', home: '#home/cp', drill: '#drill/c/cp', game: '#game/c/cp', third: ['✍️', '#cplab', '実践'] }
  };
  GK.render = function () {
    leaveFns.splice(0).concat(always).forEach(function (f) { try { f(); } catch (e) { } });
    GK.view.onclick = null;
    var h = decodeURIComponent(location.hash.slice(1)) || 'home';
    var dc = /^(?:drill|game)\/c\/(theory|harm|cp)$/.exec(h), cs = dc ? dc[1] : /^(home\/harm|hlab|h\d\d)/.test(h) ? 'harm' : /^(home\/cp|cplab|c\d\d)/.test(h) ? 'cp' : /^(home\/theory|home\/tools|u\d\d|learn|tools|exam)/.test(h) ? 'theory' : null;
    if (cs) GK.store.set('course', cs);
    var hu = /^(h\d\d)/.exec(h); if (hu && GK.UNIT[hu[1]]) GK.store.set('harmSub', GK.UNIT[hu[1]].lv === 'adv' ? 'adv' : 'basic'); else if (/^home\/harm2/.test(h)) GK.store.set('harmSub', 'adv'); else if (/^home\/harm$/.test(h)) GK.store.set('harmSub', 'basic');
    document.body.dataset.course = cs || GK.store.get('course', 'theory');
    var ck = document.body.dataset.course, C = COURSES[ck] || COURSES.theory;
    var tab = /^(drill|exam)/.test(h) ? 'drill' : /^(tools|hlab|cplab)/.test(h) ? 'third' : /^(game|ta$|host|join|battle|ens)/.test(h) ? 'game' : 'home';
    var br = GK.$('#brand'); if (br) br.innerHTML = '<span class="clef">𝄞</span>' + C.brand + '<b>ラボ</b>';
    GK.$$('#cnav button').forEach(function (b) {
      var k = b.dataset.k; b.dataset.go = k === 'third' ? C.third[1] : (k === 'home' && ck === 'harm' && GK.store.get('harmSub', 'basic') === 'adv') ? '#home/harm2' : C[k];
      var lb = b.querySelector('.lbl'); if (k === 'third') { b.firstChild.nodeValue = C.third[0]; if (lb) lb.textContent = ' ' + C.third[2]; }
      b.setAttribute('aria-current', k === tab ? 'true' : 'false');
    });
    GK.$$('#cswitch button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.c === ck ? 'true' : 'false'); });
    for (var i = 0; i < routes.length; i++) {
      var m = routes[i][0].exec(h);
      if (m) { GK.view.innerHTML = ''; routes[i][1](m); return; }
    }
    GK.go('#home');
  };
  window.addEventListener('hashchange', GK.render);
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); GK.go(g.dataset.go); }
  });
  GK.$('#brand').addEventListener('click', function () { GK.go('#home'); });

  /* ---------- 設定 ---------- */
  var dlg = GK.dlg = document.getElementById('dlg');
  GK.openDlg = function (html, onClick) {
    dlg.innerHTML = '<div class="dlg">' + html + '</div>';
    dlg.onclick = function (e) {
      if (e.target === dlg) { dlg.close(); return; }
      var b = e.target.closest('[data-d]'); if (!b) return;
      if (b.dataset.d === 'close') { dlg.close(); return; }
      onClick && onClick(b.dataset.d, b);
    };
    if (!dlg.open) dlg.showModal();
  };
  function segH(key, opts) {
    return '<div class="seg">' + opts.map(function (o) { return '<button type="button" data-d="' + key + ':' + o[0] + '" aria-pressed="' + (String(S[key]) === String(o[0])) + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  /* ---------- 記録の 書き出し・読みこみ（ファイル） ---------- */
  GK.exportData = function () {
    var d = new Date(), name = 'gakuten-lab-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
    var body = JSON.stringify({ app: 'gakuten-lab', ver: VER, at: d.toISOString(), data: GK.store.dump() }, null, 1);
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    GK.toast('📤 記録を ファイルに 保存しました');
  };
  GK.importData = function (file) {
    var rd = new FileReader();
    rd.onload = function () {
      var j; try { j = JSON.parse(rd.result); } catch (e) { alert('読みこめませんでした（ファイルが こわれて います）'); return; }
      if (!j || j.app !== 'gakuten-lab' || typeof j.data !== 'object') { alert('楽典ラボの 記録ファイルでは ありません'); return; }
      if (!confirm('ファイルの 記録（' + String(j.at || '').slice(0, 10) + '）に 入れかえます。いまの 記録は 消えます。よいですか？')) return;
      GK.store.snapshot(true);
      try { GK.store.load(j.data); GK.toast('📥 記録を もどしました'); setTimeout(function () { location.reload(); }, 600); } catch (e) { alert('もどせませんでした：' + e.message + '（いまの 記録は そのまま です）'); }
    };
    rd.readAsText(file);
  };
  GK.openSettings = function () {
    var html = '<h3>⚙ 設定<button type="button" class="btn ghost sm x" data-d="close">とじる</button></h3>' +
      '<div class="frow"><span>音名の書き方</span>' + segH('names', [['doremi', 'ドレミ'], ['jp', 'ハニホ'], ['en', 'CDE']]) + '</div>' +
      '<p class="note">問題の答えや 楽譜の下の文字が この書き方になります（調の名前は いつも「ハ長調」のように 日本音名）。</p>' +
      '<div class="frow"><span>文字の大きさ</span>' + segH('size', [[0, '小'], [1, '中'], [2, '大']]) + '</div>' +
      '<div class="frow"><span>画面</span>' + segH('theme', [['auto', '自動'], ['light', '明るい'], ['dark', '暗い']]) + '</div>' +
      '<div class="frow"><span>効果音</span>' + segH('sound', [[true, 'オン'], [false, 'オフ']]) + '</div>' +
      '<div class="frow"><span>クラス対戦の<br>データベース</span></div>' +
      '<div class="fld"><input type="text" id="dbUrl" placeholder="空なら 共通のデータベース" value="' + GK.esc(S.db || '') + '"><button type="button" class="btn sm" data-d="dbtest">保存して接続テスト</button></div>' +
      '<p class="note" id="dbSt">ふつうは空のままで OK（数学Aラボ・論理表現ラボと同じものにつながります）。</p>' +
      '<div class="frow"><span>記録の 保存</span></div>' +
      '<div class="fld" style="flex-wrap:wrap;gap:6px"><button type="button" class="btn sm" data-d="exp">📤 ファイルに 保存</button><button type="button" class="btn sm" data-d="imp">📥 ファイルから もどす</button>' + (GK.store.snapInfo() ? '<button type="button" class="btn sm" data-d="snap">⏪ 控えに もどす（' + (function (sn) { var t = new Date(sn.at); return (t.getMonth() + 1) + '/' + t.getDate() + ' ' + t.getHours() + ':' + ('0' + t.getMinutes()).slice(-2); })(GK.store.snapInfo()) + '）</button>' : '') + '<input type="file" id="impF" accept=".json,application/json" hidden></div>' +
      '<p class="note">記録は この ブラウザの 中に あります。機種変更・ブラウザの データ消去の 前に「ファイルに 保存」して おくと 安心です。' + (GK.store.ok ? '' : '<br>⚠ いまは 保存できない 設定（プライベートモード など）です。ページを とじると 記録が 消えます。') + '</p>' +
      '<div class="frow"><button type="button" class="btn ghost sm" data-d="reset">記録をぜんぶ消す</button></div>';
    GK.openDlg(html, function (v) {
      if (v === 'dbtest') {
        S.db = GK.$('#dbUrl').value.trim(); GK.saveS();
        var st = GK.$('#dbSt'); st.textContent = 'つないでいます…';
        GK.api('GET', 'rooms/g0000/state').then(function () { st.textContent = '✅ つながりました'; }, function (e) { st.textContent = '✕ つながりません（' + e.message + '）'; });
        return;
      }
      if (v === 'reset') {
        if (confirm('進みぐあい・テストの点・コインを ぜんぶ消します。よいですか？\n（まちがえて 消した ときは、設定の「控えに もどす」で もどせます）')) {
          GK.store.snapshot(true);
          GK.store.keys().forEach(function (k) { if (!/^(set|snap|ver)$/.test(k)) GK.store.del(k); });
          location.reload();
        }
        return;
      }
      if (v === 'exp') { GK.exportData(); return; }
      if (v === 'imp') { var f = GK.$('#impF'); f.value = ''; f.onchange = function () { if (f.files[0]) GK.importData(f.files[0]); }; f.click(); return; }
      if (v === 'snap') {
        var sn = GK.store.snapInfo(), dt = new Date(sn.at);
        if (confirm((dt.getMonth() + 1) + '月' + dt.getDate() + '日 ' + dt.getHours() + ':' + ('0' + dt.getMinutes()).slice(-2) + ' の 記録に もどします。それより あとの 記録は 消えます。よいですか？')) {
          try { var now = GK.store.dump(); GK.store.load(sn.data); GK.store.del('snap'); GK.store.set('snap', { day: GK.dayNo(), at: Date.now(), data: now }); location.reload(); } catch (e) { alert('もどせませんでした：' + e.message); }
        }
        return;
      }
      var kv = v.split(':'), val = kv[1];
      if (kv[0] === 'size') val = +val; if (kv[0] === 'sound') val = val === 'true';
      S[kv[0]] = val; GK.saveS(); GK.applyLook(); GK.openSettings();
      if (kv[0] === 'names' || kv[0] === 'size') GK.render();
    });
  };
  GK.$('#setBtn').addEventListener('click', GK.openSettings);

  /* ---------- クラス対戦のデータベース（Firebase の REST） ---------- */
  GK.dbBase = function () {
    var u = (S.db || (window.GK_CONFIG && GK_CONFIG.db) || '').trim().replace(/\/+$/, '');
    return /^https:\/\/[^\s]+$/.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(u) ? u : '';
  };
  GK.api = function (method, path, body) {
    var o = { method: method };
    if (body !== undefined) o.body = JSON.stringify(body);
    if (!GK.dbBase()) return Promise.reject(new Error('データベースが未設定'));
    return fetch(GK.dbBase() + '/' + path + '.json', o).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  };
})();
