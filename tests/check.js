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
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 800 } });
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

  out(!pageErr.length, 'ページの エラー なし' + (pageErr.length ? '\n   ' + pageErr.slice(0, 5).join('\n   ') : ''));
  await b.close(); srv.close();
  console.log(fail ? '\n' + fail + ' 件 まちがいが あります' : '\nぜんぶ OK');
  process.exit(fail ? 1 : 0);
})();
