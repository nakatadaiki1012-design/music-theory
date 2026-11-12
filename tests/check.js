/* =========================================================
   楽典ラボ：自動チェック
   使い方：  node tests/check.js          （ふつう：数分）
             node tests/check.js --quick  （かんたん：問題を 少なめに）
   必要なもの：Node.js と Playwright（npm i -D playwright ／ npx playwright install chromium）
   しらべること：
     1. すべての 問題の 種類を 作って、エラー・選択肢の 重複・答えの 抜け・図の 描画を 確認
     2. ヒントと 種類の 名前が ついているか
     3. 和声の 練習用 進行が お手本を 作れるか（長調・短調）
     4. 授業の 譜例と、入試形式の 楽譜（課題楽曲 I・II）が 作れるか
     5. 和声の 実践（ソプラノ・バス課題）が ヒントだけで 完成できるか
     6. 記録（localStorage）が こわれても 動き、正しい 記録は 消えず、保存・読みこみが できるか
   ========================================================= */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), QUICK = process.argv.includes('--quick');
const N = QUICK ? 12 : 50;   // 1 種類あたりの 問題の 数
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright が ありません：npm i -D playwright && npx playwright install chromium'); process.exit(2); }

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(req.url.split('?')[0]), f = path.join(ROOT, u === '/' ? 'index.html' : u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}

(async () => {
  const srv = await serve(), url = 'http://localhost:' + srv.address().port + '/index.html';
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }), p = await ctx.newPage();
  const pageErr = []; p.on('pageerror', e => pageErr.push(e.message));
  await p.goto(url); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('gk:set', JSON.stringify({ sound: false })); }); await p.reload(); await p.waitForTimeout(500);
  let fail = 0; const out = (ok, msg) => { console.log((ok ? '✔ ' : '✘ ') + msg); if (!ok) fail++; };

  // 1・2 問題
  const q = await p.evaluate(n => {
    const bad = [], strip = s => String(s).replace(/<[^>]+>/g, ''); let made = 0;
    const units = GK.UNITS.concat(GK.HUNITS || [], GK.CPUNITS || []).concat(GK.UNIT.x01 ? [GK.UNIT.x01] : []);
    units.forEach(u => (u.types || []).forEach(t => {
      const T = GK.Q.T[t]; if (!T) { bad.push(u.id + ' ' + t + '：種類が ない'); return; }
      if (!GK.TYPE_NAME[t]) bad.push(t + '：名前が ない'); if (!GK.HINTS || !GK.HINTS[t]) bad.push(t + '：ヒントが ない');
      for (let i = 0; i < n; i++) {
        let q; try { q = GK.Q.make(t, GK.rng(i * 131 + 7), T.st); } catch (e) { bad.push(t + '：作れない ' + e.message); break; }
        made++;
        const cs = q.ch.map(x => x && x.fig ? JSON.stringify(x.fig) : strip(x));
        if (new Set(cs).size !== cs.length) { bad.push(t + '：選択肢が 重複 ' + cs.join(' | ')); break; }
        if (!(q.a >= 0 && q.a < q.ch.length)) { bad.push(t + '：答えが ない'); break; }
        if (q.fig) { const d = document.createElement('div'); document.body.appendChild(d); try { GK.F.render(d, q.fig); } catch (e) { bad.push(t + '：図が かけない ' + e.message); } d.remove(); }
      }
    }));
    return { bad, made };
  }, N);
  out(!q.bad.length, '問題 ' + q.made + ' 問を 作成' + (q.bad.length ? '\n   ' + q.bad.slice(0, 20).join('\n   ') : ''));

  // 3 進行
  const pr = await p.evaluate(() => {
    const H = GK.H, bad = [];
    H.PROGS.forEach(x => { let ok = 0, okm = 0; for (let s = 0; s < 8; s++) { const k = [0, 1, -1, 2, -2][s % 5]; if (H.solve(k, false, x.chs, null, GK.rng(s + 1))) ok++; if (!x.majorOnly && H.solve(k, true, x.chs, null, GK.rng(s + 1))) okm++; } if (ok < 8 || (!x.majorOnly && okm < 6)) bad.push(x.name + ' 長' + ok + '/8 短' + okm + '/8'); });
    return { bad, n: H.PROGS.length };
  });
  out(!pr.bad.length, '和声の 進行 ' + pr.n + ' 種類' + (pr.bad.length ? '\n   ' + pr.bad.join('\n   ') : ''));

  // 4 授業の 譜例・入試の 楽譜
  const lf = await p.evaluate(() => {
    const bad = [];
    GK.UNITS.concat(GK.HUNITS || []).forEach(u => (u.cards || []).forEach((c, i) => { const f = typeof c.fig === 'function' ? c.fig() : c.fig; const chk = x => { if (!x) return; if (x.html === '') bad.push(u.id + ' カード' + (i + 1) + '：譜例が 作れない'); (x.row || []).forEach(chk); }; chk(f); }));
    let pf = 0, sf = 0; for (let i = 0; i < 40; i++) { try { GK.EXAM.genPiece(GK.rng(i + 1)); } catch (e) { pf++; } try { GK.EXAM.genScore(GK.rng(i + 1)); } catch (e) { sf++; } }
    if (pf) bad.push('課題楽曲 I：' + pf + '/40 作れない'); if (sf) bad.push('課題楽曲 II：' + sf + '/40 作れない');
    return bad;
  });
  out(!lf.length, '授業の 譜例・入試の 楽譜' + (lf.length ? '\n   ' + lf.join('\n   ') : ''));

  // 5 実践（ヒントで 完成できるか）
  let ok = 0, tot = 0; const units = QUICK ? ['h03', 'h10', 'h15', 'h16', 'h19'] : ['h01', 'h05', 'h06', 'h10', 'h11', 'h12', 'h13', 'h15', 'h16', 'h17', 'h18', 'h19', 'h20', 'h21'];
  for (const u of units) {
    await p.evaluate(x => { location.hash = '#hlab/u/' + x + '/' + (Math.random() < 0.5 ? 'sop' : 'bass'); }, u); await p.waitForTimeout(200);
    await p.click('[data-a="new"]'); await p.waitForTimeout(100);
    for (let k = 0; k < 4; k++) { const n = await p.$$('.hzcb'); if (!n.length) break; await n[Math.floor(Math.random() * n.length)].click(); }
    for (let s = 0; s < 70; s++) {
      const st = await p.evaluate(() => ({ hole: !!document.querySelector('.hzp'), good: !!document.querySelector('.hzs.good') })); if (!st.hole && st.good) break;
      for (let h = 0; h < 3; h++) { await p.click('[data-a="hint"]'); if (await p.$('.hzcb.hint')) break; }
      const hb = await p.$('.hzcb.hint'); if (hb) await hb.click(); else { const n = await p.$$('.hzcb.ok'); if (n.length) await n[0].click(); }
    }
    tot++; if (await p.evaluate(() => !!document.querySelector('.hzs.good'))) ok++; else console.log('   完成できない：' + u);
  }
  out(ok === tot, '和声の 実践 ' + ok + '/' + tot + ' 題を ヒントで 完成');

  // 6 記録の 保護
  {
    const bad = [];
    // (a) こわれた 記録・形の ちがう 記録・正しい 記録を まぜて 入れる
    await p.evaluate(() => {
      localStorage.clear();
      const S = (k, v) => localStorage.setItem('gk:' + k, v);
      S('set', JSON.stringify({ sound: false, size: 'x' }));
      S('rw', JSON.stringify({ coins: null, streak: 'abc', badges: [], best: { a: 120, b: 'x' } }));
      S('u:u01', JSON.stringify({ card: 3, seen: true, prac: 7, pracN: 2, test: 9, pass: '2026-1-1' }));   // 正しい（合格は 日付の 文字）
      S('u:u02', 'null'); S('u:u03', '{こわれた'); S('u:u04', JSON.stringify([1, 2]));
      S('skill', JSON.stringify({ iv: { n: 5, ok: 4, b: 2, d: 100, rec: '1101', up: 3 }, bad1: 7, bad2: { n: 'x' } }));
      S('weak', JSON.stringify({ iv: 4, x: -1, y: 'a' })); S('actDays', JSON.stringify([1, 'a', 3]));
      S('drillSel', JSON.stringify('oops')); S('taSel', '[1'); S('task', JSON.stringify({ units: ['u01'] }));
    });
    await p.reload(); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const g = k => { try { return JSON.parse(localStorage.getItem('gk:' + k)); } catch (e) { return 'BROKEN'; } };
      return { rw: GK.RW, u1: GK.prog('u01'), u2: GK.prog('u02'), u3: GK.prog('u03'), u4: GK.prog('u04'), u3raw: localStorage.getItem('gk:u:u03'), bad3: localStorage.getItem('gk:bad:u:u03'), skill: g('skill'), weak: g('weak'), act: g('actDays'), task: g('task'), S: GK.S, ver: localStorage.getItem('gk:ver'), snap: !!GK.store.snapInfo() };
    });
    if (r.rw.coins !== 0 || r.rw.streak !== 0 || Array.isArray(r.rw.badges) || r.rw.best.a !== 120 || 'b' in r.rw.best) bad.push('コインの 記録の 修理 ' + JSON.stringify(r.rw));
    if (r.u1.pass !== '2026-1-1' || r.u1.card !== 3 || r.u1.prac !== 7 || r.u1.test !== 9) bad.push('正しい 記録が かわった ' + JSON.stringify(r.u1));
    [r.u2, r.u3, r.u4].forEach((u, i) => { if (u.card !== 0 || u.pass !== 0 || u.test !== -1) bad.push('こわれた 単元の 記録 u0' + (i + 2) + ' ' + JSON.stringify(u)); });
    if (r.u3raw !== null || r.bad3 !== '{こわれた') bad.push('こわれた 記録の 退避');
    if (!r.skill.iv || r.skill.iv.ok !== 4 || r.skill.bad1 || (r.skill.bad2 && r.skill.bad2.n !== 0)) bad.push('習熟の 記録 ' + JSON.stringify(r.skill));
    if (r.weak.iv !== 4 || 'x' in r.weak || 'y' in r.weak) bad.push('苦手の 記録 ' + JSON.stringify(r.weak));
    if (JSON.stringify(r.act) !== '[1,3]') bad.push('学習日 ' + JSON.stringify(r.act));
    if (!r.task || r.task.units[0] !== 'u01') bad.push('課題が 消えた');
    if (r.S.sound !== false || r.S.names !== 'doremi') bad.push('設定 ' + JSON.stringify(r.S));
    if (r.ver !== '2' || !r.snap) bad.push('版・控え');
    // (b) こわれた 記録の まま 画面を ひととおり 開く
    for (const h of ['#home/theory', '#home/harm', '#home/cp', '#u01', '#u01/x', '#drill', '#game', '#learn/map', '#hlab', '#cplab', '#tools']) { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(150); }
    // (c) 書き出し → 入れかえ → 同じに もどるか
    const rt = await p.evaluate(() => {
      GK.earn(5); GK.setProg('u05', { seen: true }); const before = GK.store.dump();
      localStorage.setItem('gk:rw', '{こわす'); GK.store.load(before); const after = GK.store.dump();
      let err = ''; try { GK.store.load({ 'gk:rw': '{x' }); } catch (e) { err = e.message; }
      const still = GK.store.dump();
      return { same: JSON.stringify(before) === JSON.stringify(after), rejected: !!err, kept: JSON.stringify(still) === JSON.stringify(after) };
    });
    if (!rt.same) bad.push('保存して もどすと 記録が かわる'); if (!rt.rejected || !rt.kept) bad.push('こわれた ファイルを 読みこむと 記録が 消える');
    // (d) 容量いっぱい：書けなくても 止まらず、読める
    const q = await p.evaluate(() => {
      const orig = Storage.prototype.setItem; Storage.prototype.setItem = function () { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; };
      let ok = true; try { GK.earn(1); GK.setProg('u06', { seen: true }); GK.skillNote && GK.skillNote('noteName', true); } catch (e) { ok = false; }
      Storage.prototype.setItem = orig; return { ok, coins: GK.store.get('rw', {}).coins >= 0 };
    });
    if (!q.ok || !q.coins) bad.push('容量いっぱいで エラー');
    // (e) 別の タブで 増えた コインを 古い 手もちで 上書きしない
    await p.evaluate(() => GK.rwSave()); const p2 = await ctx.newPage(); await p2.goto(url); await p2.waitForTimeout(400);
    const c0 = await p.evaluate(() => GK.store.get('rw', {}).coins);
    await p2.evaluate(() => { GK.earn(100); }); await p.waitForTimeout(300);
    await p.evaluate(() => { GK.earn(1); });
    const c1 = await p.evaluate(() => GK.store.get('rw', {}).coins); await p2.close();
    if (c1 !== c0 + 101) bad.push('別の タブの コインが 消えた（' + c0 + ' → ' + c1 + '）');
    out(!bad.length, '記録の 保護（こわれた 記録・容量いっぱい・保存と 読みこみ・別の タブ）' + (bad.length ? '\n   ' + bad.join('\n   ') : ''));
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem('gk:set', JSON.stringify({ sound: false })); });
  }

  out(!pageErr.length, 'ページの エラー なし' + (pageErr.length ? '\n   ' + pageErr.slice(0, 5).join('\n   ') : ''));
  await b.close(); srv.close();
  console.log(fail ? '\n' + fail + ' 件 まちがいが あります' : '\nぜんぶ OK');
  process.exit(fail ? 1 : 0);
})();
