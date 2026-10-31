/* =========================================================
   楽典ラボ：やってみたくなる しかけ
   🔥 れんぞく日数・1 週間の カレンダー ／ 🎯 今日の 目標（10 問）／ 🎁 今日の 1 問
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK, RW = GK.RW, $ = GK.$, esc = GK.esc;
  var GOAL = 10, DQ_PRIZE = 10, GOAL_PRIZE = 20;
  var load = function () { var t = GK.store.get('today', {}); if (t.d !== GK.dayNo()) t = { d: GK.dayNo(), n: 0, ok: 0, goal: false, dq: false, dqOk: false }; return t; };
  var save = function (t) { GK.store.set('today', t); };
  var days = function () { return GK.store.get('actDays', []); };
  var streakNow = function () { return RW.lastDay >= GK.dayNo() - 1 ? RW.streak : 0; };

  // 1 問 答えるたびに よばれる
  GK.act = function (ok) {
    var t = load(); t.n++; if (ok) t.ok++;
    var ds = days(), d = GK.dayNo(); if (ds.indexOf(d) < 0) { ds.push(d); GK.store.set('actDays', ds.slice(-60)); }
    GK.touchDay && GK.touchDay();
    if (!t.goal && t.n >= GOAL) {
      t.goal = true; save(t);
      setTimeout(function () { GK.celebrate('🎯 今日の 目標 たっせい！', '+' + GOAL_PRIZE + ' コイン'); GK.confetti && GK.confetti(40); GK.earn(GOAL_PRIZE); }, 700);
    } else save(t);
    GK.motivChip();
  };
  // ヘッダーの 🔥
  GK.motivChip = function () {
    var el = $('#strkBtn'); if (!el) return;
    var s = streakNow(), t = load();
    el.innerHTML = '🔥<b>' + s + '</b>'; el.classList.toggle('lit', t.n > 0); el.title = 'れんぞく ' + s + ' 日（今日 ' + t.n + ' 問）';
  };
  // 今日の 1 問：日付で きまる（コースごと）
  function dailyQ(tab) {
    var units = tab === 'harm' ? GK.HUNITS : tab === 'cp' ? GK.CPUNITS : GK.UNITS, T = GK.Q.T, ids = [];
    units.forEach(function (u) { u.types.forEach(function (id) { if (T[id] && !T[id].ear) ids.push(id); }); });
    var R = GK.rng(GK.dayNo() * 7919 + (tab === 'harm' ? 1 : tab === 'cp' ? 2 : 0));
    for (var k = 0; k < 10; k++) { try { return GK.Q.make(ids[Math.floor(R() * ids.length)], R, 2); } catch (e) { } }
    return null;
  }
  GK.motivHTML = function (tab) {
    if (tab === 'tools') tab = 'theory';
    var t = load(), s = streakNow(), ds = days(), d = GK.dayNo(), WD = ['日', '月', '火', '水', '木', '金', '土'], now = new Date().getDay(), dqKey = 'dq_' + tab;
    var cal = ''; for (var i = 6; i >= 0; i--) { var on = ds.indexOf(d - i) >= 0; cal += '<i class="' + (on ? 'on' : '') + (i === 0 ? ' td' : '') + '" title="' + (i === 0 ? '今日' : i + ' 日前') + '"><span>' + WD[(now - i + 7) % 7] + '</span>' + (on ? '🔥' : '・') + '</i>'; }
    var pct = Math.min(100, Math.round(t.n / GOAL * 100)), dqDone = !!t[dqKey];
    var hint = t.n === 0 ? (s > 0 ? '今日 1 問 やると 🔥 ' + (s + 1) + ' 日 れんぞく！' : '1 問 やると 🔥 れんぞく記録 スタート') : t.goal ? '🎉 今日の 目標 たっせい！ この ちょうしで' : 'あと ' + (GOAL - t.n) + ' 問で 目標たっせい（+' + GOAL_PRIZE + ' コイン）';
    return '<div class="motiv"><div class="mvt"><div class="mvs"><span class="fl' + (t.n ? ' lit' : '') + '">🔥</span><b>' + s + '</b><small>日<br>れんぞく</small></div><div class="mvc">' + cal + '</div></div>' +
      '<div class="mvg"><small>🎯 今日の 目標</small><div class="mbar"><i style="width:' + pct + '%"></i></div><b>' + Math.min(t.n, GOAL) + '/' + GOAL + '</b></div>' +
      '<p class="mvh">' + hint + '</p>' +
      '<button type="button" class="btn ' + (dqDone ? '' : 'warm') + ' mvq" id="dqBtn"' + (dqDone ? ' disabled' : '') + '>' + (dqDone ? (t[dqKey] === 'ok' ? '✅ 今日の 1 問 正解！' : '📖 今日の 1 問 おわり') : '🎁 今日の 1 問（+' + DQ_PRIZE + ' コイン）') + '</button></div>';
  };
  GK.motivBind = function (V, tab) {
    if (tab === 'tools') tab = 'theory';
    var b = $('#dqBtn', V); if (!b) return;
    b.onclick = function () {
      var q = dailyQ(tab); if (!q) return;
      var dqKey = 'dq_' + tab;
      GK.openDlg('<h3>🎁 今日の 1 問<button type="button" class="btn ghost sm x" data-d="close">とじる</button></h3><p class="note">毎日 かわる 1 問。正解で +' + DQ_PRIZE + ' コイン。</p><div class="qz dqz"></div>');
      GK.drawQ($('.dqz'), q, { onPick: function (i, ok) {
        var t = load(); t[dqKey] = ok ? 'ok' : 'ng'; save(t);
        GK.earn(ok ? DQ_PRIZE : 2); if (ok) GK.confetti && GK.confetti(25);
        setTimeout(function () { GK.render(); }, 50);
      } });
    };
  };
  setTimeout(GK.motivChip, 0);
})();
