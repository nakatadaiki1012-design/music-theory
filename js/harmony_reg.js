/* =========================================================
   楽典ラボ：和声法の 単元を 登録する（harmony_units.js の あとに 読みこむ）
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK;
  (GK.UNITDEF || []).forEach(function (u, i) {
    u.grp = 'harm'; u.no = 'H' + (i + 1);
    GK.HUNITS.push(u); GK.UNIT[u.id] = u;
  });
  Object.assign(GK.TYPE_NAME, {
    vFind: '赤い音は どの声部', stemQ: '符尾の 向き', hpos: '密集・開離', vRangeTxt: '声部の 音域', rangeOut: '音域の はみ出し', spaceFind: '声部の 間隔',
    doubled: '重なっている音', posName: '8度・3度・5度位置', missingNote: '足りない音', dblNG: '導音の 重複',
    commonTone: '共通音', holdVoice: '共通音の 保持', contraryQ: '反対の 向きに 動く', fillVoice: '穴うめ（連結）',
    parDef: '禁則の 意味', ltRes: '導音の 解決', sevRes: '第7音の 解決', ruleName: '違反の 名前', ruleWhere: '違反している 声部', findTrans: 'まちがいの つなぎ',
    funcOf: '和音の 働き', funcOrder: '逆行を 見つける', cadName: '終止の 名前', cadFig: '楽譜から 終止', cadRule: '完全正格終止',
    invName: '転回形の 名前', bassOf: 'バスの 音', figToChord: '数字から 和音', chordToFig: '和音から 数字', invOfV: '転回形を 見分ける',
    nctDef: '非和声音の 意味', nctPick: '非和声音を 選ぶ', nctFig: '非和声音の 種類', nctRule: '非和声音の 解決',
    subName: '副三和音の 種類', subNotes: '和音の 構成音', subSub: '代理和音', v7Notes: 'Ⅴ₇ の 構成音', v7Why: 'Ⅴ₇ の 性質',
    minLT: '短調の 導音', minQual: '短調の 和音の 種類', minAug: '増2度', minLTvoice: '導音の 声部'
  });
  GK.Q.addTips({
    '4 声は 上から S・A・T・B。大譜表では 上の五線が S（符尾 上）と A（符尾 下）': 'vFind,stemQ',
    '音域は S ド4〜ソ5・A ソ3〜レ5・T ド3〜ソ4・B ファ2〜ド4': 'vRangeTxt,rangeOut',
    'S‐A、A‐T は 1 オクターブ 以内。T‐B だけ はなれて よい。S‐T が 1 オクターブ 以内 ＝ 密集': 'hpos,spaceFind',
    '基本は 根音を 重ねる。第3音は 省略しない。導音は 重ねない': 'doubled,posName,missingNote,dblNG',
    '共通音は そのまま 保つ。ないときは 上の 3 声を バスと 反対に': 'commonTone,holdVoice,contraryQ,fillVoice',
    '同じ向きで 5度→5度・8度→8度は 禁止。導音は 上へ、第7音は 下へ': 'parDef,ltRes,sevRes,ruleName,ruleWhere,findTrans',
    'T → S → D → T が 自然。正格 Ⅴ→Ⅰ・変格 Ⅳ→Ⅰ・半 …→Ⅴ・偽 Ⅴ→Ⅵ': 'funcOf,funcOrder,cadName,cadFig,cadRule',
    '経過音（つなぐ）・刺繍音（もどる）・倚音（跳んで順次）・掛留音（2度下行）': 'nctDef,nctPick,nctFig,nctRule',
    'Ⅱ・Ⅲ・Ⅵ は 短、Ⅶ は 減。Ⅵ は Ⅰ の、Ⅱ は Ⅳ の 代理。Ⅴ₇ は 4 音': 'subName,subNotes,subSub,v7Notes,v7Why',
    '短調は 第7音を 半音 上げて 導音に。6→7 は 増2度': 'minLT,minQual,minAug,minLTvoice',
    '数字なし ＝ 基本形、6 ＝ 第1転回、6 4 ＝ 第2転回。Ⅴ₇ は 7・6 5・4 3・4 2': 'invName,bassOf,figToChord,chordToFig,invOfV'
  });
})();
