/* =========================================================
   楽典ラボ：楽語じてん（音楽用語）
   [用語, 読み, 意味, 種類, レベル(1〜3), 速さの順位（速さの用語だけ） | 強さの順位（強弱だけ）]
   種類：tempo 速さ／tchg 速さの変化／dyn 強弱／expr 発想（気分）／art 奏法／aux 補助語／form 反復・構成
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK;
  GK.TERM_CAT = { tempo: '速さ', tchg: '速さの変化', dyn: '強弱', expr: '発想（曲の気分）', art: '奏法', aux: '補助語（組み合わせて使う）', form: '反復・構成' };
  var T = [
    // ---- 速さ（遅い → 速い の順位つき）
    ['Grave', 'グラーヴェ', '重々しく ゆるやかに', 'tempo', 2, 1],
    ['Largo', 'ラルゴ', '幅広く ゆるやかに', 'tempo', 1, 2],
    ['Lento', 'レント', 'ゆるやかに', 'tempo', 2, 2],
    ['Adagio', 'アダージョ', 'ゆるやかに', 'tempo', 1, 3],
    ['Larghetto', 'ラルゲット', 'ラルゴより やや速く', 'tempo', 3, 3.5],
    ['Andante', 'アンダンテ', '歩くような速さで', 'tempo', 1, 4],
    ['Andantino', 'アンダンティーノ', 'アンダンテより やや速く', 'tempo', 3, 4.5],
    ['Moderato', 'モデラート', '中くらいの速さで', 'tempo', 1, 5],
    ['Allegretto', 'アレグレット', 'やや速く', 'tempo', 2, 6],
    ['Allegro', 'アレグロ', '速く', 'tempo', 1, 7],
    ['Vivace', 'ヴィヴァーチェ', '活発に 速く', 'tempo', 2, 8],
    ['Presto', 'プレスト', '急速に', 'tempo', 1, 9],
    ['Prestissimo', 'プレスティッシモ', 'きわめて速く', 'tempo', 2, 10],
    // ---- 速さの変化
    ['ritardando（rit.）', 'リタルダンド', 'だんだん遅く', 'tchg', 1],
    ['rallentando（rall.）', 'ラレンタンド', 'だんだん ゆるやかに', 'tchg', 2],
    ['accelerando（accel.）', 'アッチェレランド', 'だんだん速く', 'tchg', 1],
    ['a tempo', 'ア・テンポ', 'もとの速さで', 'tchg', 1],
    ['Tempo I（Tempo primo）', 'テンポ・プリモ', '最初の速さで', 'tchg', 2],
    ['ritenuto（riten.）', 'リテヌート', 'すぐに遅く', 'tchg', 3],
    ['allargando', 'アラルガンド', '強くしながら だんだん遅く', 'tchg', 3],
    ['stringendo', 'ストリンジェンド', 'だんだん せきこんで（速く）', 'tchg', 3],
    ['rubato', 'ルバート', 'テンポを 自由に ゆらして', 'tchg', 3],
    ["l'istesso tempo", 'リステッソ・テンポ', '同じ速さで', 'tchg', 3],
    ['più mosso', 'ピウ・モッソ', '今までより 速く', 'tchg', 2],
    ['meno mosso', 'メノ・モッソ', '今までより 遅く', 'tchg', 2],
    ['calando', 'カランド', 'だんだん 遅く 弱く', 'tchg', 3],
    ['morendo', 'モレンド', '消えるように', 'tchg', 3],
    ['smorzando', 'スモルツァンド', 'だんだん 消えるように', 'tchg', 3],
    // ---- 強弱（弱い → 強い の順位つき）
    ['ppp（pianississimo）', 'ピアニッシッシモ', 'できるだけ弱く', 'dyn', 2, 1],
    ['pp（pianissimo）', 'ピアニッシモ', 'ごく弱く', 'dyn', 1, 2],
    ['p（piano）', 'ピアノ', '弱く', 'dyn', 1, 3],
    ['mp（mezzo piano）', 'メッゾ・ピアノ', 'やや弱く', 'dyn', 1, 4],
    ['mf（mezzo forte）', 'メッゾ・フォルテ', 'やや強く', 'dyn', 1, 5],
    ['f（forte）', 'フォルテ', '強く', 'dyn', 1, 6],
    ['ff（fortissimo）', 'フォルティッシモ', 'ごく強く', 'dyn', 1, 7],
    ['fff（fortississimo）', 'フォルティッシッシモ', 'できるだけ強く', 'dyn', 2, 8],
    ['crescendo（cresc.）', 'クレシェンド', 'だんだん強く', 'dyn', 1],
    ['decrescendo（decresc.）', 'デクレシェンド', 'だんだん弱く', 'dyn', 1],
    ['diminuendo（dim.）', 'ディミヌエンド', 'だんだん弱く', 'dyn', 1],
    ['sforzando（sf・sfz）', 'スフォルツァンド', 'その音を 特に強く', 'dyn', 2],
    ['fp（forte piano）', 'フォルテ・ピアノ', '強く、すぐに弱く', 'dyn', 2],
    ['rinforzando（rf・rfz）', 'リンフォルツァンド', '急に強く', 'dyn', 3],
    // ---- 発想（曲の気分）
    ['dolce', 'ドルチェ', '甘く やわらかに', 'expr', 1],
    ['cantabile', 'カンタービレ', '歌うように', 'expr', 1],
    ['espressivo', 'エスプレッシーヴォ', '表情豊かに', 'expr', 1],
    ['maestoso', 'マエストーソ', '荘厳に', 'expr', 1],
    ['con brio', 'コン・ブリオ', '生き生きと', 'expr', 1],
    ['grazioso', 'グラツィオーソ', '優雅に', 'expr', 2],
    ['leggiero', 'レッジェーロ', '軽く', 'expr', 2],
    ['tranquillo', 'トランクイッロ', '静かに', 'expr', 2],
    ['agitato', 'アジタート', '激しく', 'expr', 2],
    ['animato', 'アニマート', '元気に', 'expr', 2],
    ['appassionato', 'アパッショナート', '情熱的に', 'expr', 2],
    ['brillante', 'ブリッランテ', '華やかに 輝かしく', 'expr', 2],
    ['con fuoco', 'コン・フオーコ', '火のように 熱烈に', 'expr', 3],
    ['con moto', 'コン・モート', '動きをつけて', 'expr', 3],
    ['energico', 'エネルジコ', '力強く', 'expr', 3],
    ['giocoso', 'ジョコーソ', '楽しげに', 'expr', 3],
    ['scherzando', 'スケルツァンド', 'おどけて', 'expr', 3],
    ['misterioso', 'ミステリオーソ', '神秘的に', 'expr', 3],
    ['pesante', 'ペザンテ', '重々しく', 'expr', 3],
    ['risoluto', 'リソルート', 'きっぱりと', 'expr', 3],
    ['semplice', 'センプリチェ', '素朴に', 'expr', 3],
    ['lamentoso', 'ラメントーソ', '悲しげに', 'expr', 3],
    ['amabile', 'アマービレ', '愛らしく', 'expr', 3],
    ['affettuoso', 'アフェットゥオーソ', '愛情をこめて', 'expr', 3],
    ['sotto voce', 'ソット・ヴォーチェ', 'ひそやかに', 'expr', 3],
    ['marziale', 'マルツィアーレ', '行進曲風に', 'expr', 3],
    ['pastorale', 'パストラーレ', '牧歌風に', 'expr', 3],
    // ---- 奏法
    ['legato', 'レガート', 'なめらかに', 'art', 1],
    ['staccato', 'スタッカート', '音を短く切って', 'art', 1],
    ['tenuto', 'テヌート', '音の長さを 十分に保って', 'art', 1],
    ['fermata', 'フェルマータ', '音を ほどよく のばす', 'art', 1],
    ['accent', 'アクセント', 'その音を 目立たせて強く', 'art', 1],
    ['staccatissimo', 'スタッカーティッシモ', 'ごく短く 切って', 'art', 2],
    ['marcato', 'マルカート', '一音一音 はっきりと', 'art', 2],
    ['portato', 'ポルタート', '音を やや切りはなして', 'art', 3],
    ['sostenuto', 'ソステヌート', '音を じゅうぶん保って', 'art', 3],
    ['pizzicato（pizz.）', 'ピッツィカート', '弦を 指ではじいて', 'art', 2],
    ['arco', 'アルコ', '弓で ひいて', 'art', 2],
    ['tremolo', 'トレモロ', '同じ音を 細かく くり返して', 'art', 2],
    ['glissando（gliss.）', 'グリッサンド', 'すべるように 音を移して', 'art', 2],
    ['arpeggio', 'アルペッジョ', '和音を 下から順に くずして', 'art', 2],
    ['tutti', 'トゥッティ', '全員で', 'art', 2],
    ['solo', 'ソロ', '1 人で 演奏する', 'art', 2],
    ['simile', 'シーミレ', '前と同じように', 'art', 2],
    ['8va（ottava）', 'オッターヴァ', '1 オクターブ高く', 'art', 2],
    ['loco', 'ロコ', 'もとの高さで', 'art', 3],
    ['con sordino', 'コン・ソルディーノ', '弱音器をつけて', 'art', 3],
    ['senza sordino', 'センツァ・ソルディーノ', '弱音器を はずして', 'art', 3],
    ['divisi（div.）', 'ディヴィジ', 'パートを 分かれて', 'art', 3],
    ['una corda', 'ウナ・コルダ', '弱音ペダルを 踏んで', 'art', 3],
    ['tr（trillo）', 'トリル', '上の音と すばやく くり返す', 'art', 2],
    ['mordent', 'モルデント', '下の音を 1 回 すばやく はさむ', 'art', 3],
    ['pralltriller', 'プラルトリラー', '上の音を 1 回 すばやく はさむ', 'art', 3],
    ['turn', 'ターン', '上・もとの音・下・もとの音 と回る', 'art', 3],
    // ---- 補助語
    ['molto', 'モルト', '非常に', 'aux', 1],
    ['poco', 'ポーコ', '少し', 'aux', 1],
    ['poco a poco', 'ポーコ・ア・ポーコ', '少しずつ', 'aux', 1],
    ['più', 'ピウ', 'もっと', 'aux', 2],
    ['meno', 'メノ', 'より少なく', 'aux', 2],
    ['sempre', 'センプレ', 'つねに', 'aux', 2],
    ['subito', 'スビト', 'すぐに', 'aux', 2],
    ['con', 'コン', '〜をもって（〜で）', 'aux', 2],
    ['senza', 'センツァ', '〜なしで', 'aux', 2],
    ['assai', 'アッサイ', '非常に', 'aux', 3],
    ['non troppo', 'ノン・トロッポ', 'はなはだしくなく', 'aux', 3],
    ['ma', 'マ', 'しかし', 'aux', 3],
    ['e', 'エ', 'そして', 'aux', 3],
    ['quasi', 'クアジ', 'ほとんど 〜のように', 'aux', 3],
    // ---- 反復・構成
    ['D.C.（da capo）', 'ダ・カーポ', '始めに もどる', 'form', 1],
    ['D.S.（dal segno）', 'ダル・セーニョ', '𝄋 に もどる', 'form', 1],
    ['Fine', 'フィーネ', '終わり', 'form', 1],
    ['Coda', 'コーダ', '終わりの部分（𝄌 へ とぶ）', 'form', 1],
    ['al Fine', 'アル・フィーネ', 'Fine まで', 'form', 2],
    ['attacca', 'アタッカ', '休まずに 次へ 続けて', 'form', 3],
    ['G.P.（general pause）', 'ゲネラル・パウゼ', '全員 休み', 'form', 3]
  ];
  GK.TERMS = T.map(function (x, i) { return { id: i, t: x[0], r: x[1], m: x[2], c: x[3], lv: x[4], rank: x[5] }; });
  // 反対の意味の組
  GK.TERM_OPP = [['crescendo（cresc.）', 'diminuendo（dim.）'], ['accelerando（accel.）', 'ritardando（rit.）'], ['più mosso', 'meno mosso'], ['legato', 'staccato'], ['pizzicato（pizz.）', 'arco'], ['con sordino', 'senza sordino'], ['tutti', 'solo'], ['con', 'senza'], ['più', 'meno'], ['8va（ottava）', 'loco'], ['molto', 'poco']];
  // 組み合わせの言葉
  GK.TERM_PHRASE = [
    ['poco a poco cresc.', '少しずつ だんだん強く'], ['molto rit.', '非常に だんだん遅く'], ['sempre f', 'つねに強く'], ['subito p', 'すぐに弱く'],
    ['Allegro ma non troppo', '速く、しかし はなはだしくなく'], ['Andante con moto', '歩くような速さで 動きをつけて'], ['Allegro con brio', '速く 生き生きと'],
    ['cresc. e accel.', 'だんだん強く、そして だんだん速く'], ['dim. e rit.', 'だんだん弱く、そして だんだん遅く'], ['poco più mosso', '今までより 少し速く'],
    ['molto legato', '非常に なめらかに'], ['Adagio molto', '非常に ゆるやかに'], ['senza rit.', 'だんだん遅く しないで'], ['Allegro assai', '非常に速く'],
    ['meno mosso', '今までより 遅く'], ['quasi recitativo', 'ほとんど 語るように'], ['sempre legato', 'つねに なめらかに'], ['poco rit.', '少し だんだん遅く']
  ];
  // 意味が近いので おたがいを まちがいの選択肢にしない組
  GK.TERM_SYN = [
    ['Grave', 'Largo', 'Lento', 'Adagio', 'Larghetto', 'pesante', 'maestoso'],
    ['Andante', 'Andantino'], ['Allegro', 'Allegretto', 'Vivace'], ['Presto', 'Prestissimo', 'Vivace'],
    ['ritardando（rit.）', 'rallentando（rall.）', 'ritenuto（riten.）', 'allargando', 'calando', 'morendo', 'smorzando', 'meno mosso', 'decrescendo（decresc.）', 'diminuendo（dim.）'],
    ['accelerando（accel.）', 'stringendo', 'più mosso'], ['a tempo', "l'istesso tempo", 'Tempo I（Tempo primo）'],
    ['sforzando（sf・sfz）', 'rinforzando（rf・rfz）', 'accent', 'marcato', 'fp（forte piano）'],
    ['tenuto', 'sostenuto', 'fermata', 'portato'], ['staccato', 'staccatissimo', 'portato'], ['legato', 'portato'],
    ['agitato', 'con fuoco', 'appassionato', 'energico', 'risoluto'], ['animato', 'con brio', 'con moto', 'brillante', 'Vivace'], ['giocoso', 'scherzando'],
    ['tranquillo', 'sotto voce'], ['dolce', 'amabile', 'affettuoso', 'grazioso'], ['cantabile', 'espressivo'],
    ['molto', 'assai'], ['poco', 'poco a poco'], ['più', 'più mosso'], ['meno', 'meno mosso'], ['tr（trillo）', 'tremolo', 'mordent', 'pralltriller', 'turn'],
    ['D.C.（da capo）', 'D.S.（dal segno）'], ['Fine', 'al Fine'], ['solo', 'tutti', 'divisi（div.）']
  ];
  GK.termSyn = function (a, b) { return a === b || GK.TERM_SYN.some(function (g) { return g.indexOf(a) >= 0 && g.indexOf(b) >= 0; }); };
  // 曲の気分（発想）の 3 つの組
  GK.TERM_MOOD = [
    ['やさしい・静か', ['dolce', 'cantabile', 'espressivo', 'grazioso', 'tranquillo', 'semplice', 'amabile', 'affettuoso', 'sotto voce', 'pastorale']],
    ['明るい・元気', ['con brio', 'animato', 'brillante', 'leggiero', 'giocoso', 'scherzando', 'con moto', 'energico']],
    ['激しい・重い', ['maestoso', 'agitato', 'appassionato', 'con fuoco', 'pesante', 'risoluto', 'marziale', 'misterioso', 'lamentoso']]
  ];
  GK.termShort = function (t) { return t.replace(/（.*）$/, ''); };
  GK.termByName = function (t) { return GK.TERMS.filter(function (x) { return x.t === t; })[0]; };
})();
