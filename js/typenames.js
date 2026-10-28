/* =========================================================
   楽典ラボ：問題の種類の 名前（学習マップ・今日の復習で 見せる）
   ========================================================= */
(function () {
  'use strict';
  var GK = window.GK;
  GK.TYPE_NAME = {
    // 01 五線と音名
    readT: 'ト音記号を読む', readB: 'ヘ音記号を読む', findNote: '音名から楽譜の音を探す', nameSys: 'ドレミ・ハニホ・CDE', readA: 'アルト記号を読む', readTn: 'テノール記号を読む',
    cClefMid: 'ハ音記号の ドの線', cClefName: 'ハ音記号の 名前', cClefInst: 'ハ音記号と楽器', cClefSame: '記号をまたいだ同じ高さ', readC: 'めずらしいハ音記号', grandSame: '大譜表の同じ高さ', ledgerN: '加線の数',
    // 02 音符と休符
    durName: '音符の名前', durBeats: '音符の拍数', restName: '休符の名前', durCount: '音符いくつ分', durSum: '音符のたし算', longest: 'いちばん長い音符', restBeats: '休符の拍数',
    // 03 拍子
    timeFit: '小節に合う拍子', missing: '足りない音符', timeKind: '単純・複合拍子', eighthCount: '1小節の音符の数', strong: '拍の強弱', timeMean: '拍子記号の意味', barError: '拍の数が合わない小節',
    // 04 リズム
    tieSlur: 'タイとスラー', tieLen: 'タイの長さ', tripletQ: '3連符', synco: 'シンコペーション', pickup: '弱起の最後の小節', pickupBeat: '弱起の始まり', beatCount: '拍の数をかぞえる', rhythmEar: 'リズムを聴く',
    // 05 変化記号
    accName: '♯♭の音名', accKbd: '鍵盤で♯♭', halfWhole: '全音と半音', enharm: '異名同音', accRule: '臨時記号のきまり', kbdName: '黒鍵の名前', jpAcc: '嬰・変の日本音名', dblAcc: '𝄪・𝄫',
    // 06 音程
    ivDeg: '音程の度数', ivName: '音程の名前', ivBuild: '音程から音をつくる', ivInv: '音程の転回', ivEar: '音程を聴く', ivSemis: '音程の半音の数', ivQual: '音程を広げる・せまくする', ivWider: '広い・せまい音程',
    // 07 長音階
    majPattern: '長音階の全音・半音', majWrong: '長音階のまちがい探し', degreeName: '音階の音の名前', scaleName: '音階から調名', majSharps: '長音階の♯♭', majFill: '長音階の穴うめ', majHalf: '長音階の半音の場所',
    // 08 短音階
    minType: '短音階の種類', minLead: '和声短音階', minEar: '長音階・短音階を聴く', majMinEar: '長調・短調を聴く', minSteps: '短音階の半音', minName: '短調の音階', minMel: '旋律短音階',
    // 09 調と調号
    keyMaj: '調号から長調', keyMin: '調号から短調', keySig: '調名から調号', sigCount: '調号の数', related: '近親調', relMin: '短調の平行調・同主調', keyOrderQ: '♯♭のつく順', melKey: 'メロディーの調',
    // 10 和音
    isTriad: '三和音のかたち', chordTones: '和音の構成音', triadType: '三和音の種類', triadBuild: '三和音を組み立てる', inversion: '転回形', chordRoot: '和音の根音', seventh: '七の和音', chordEar: '和音を聴く',
    // 11 和音の働き
    chordName: 'コードネーム', roman: 'ローマ数字', func: '和音の働き', funcName: '調の中の和音の働き', cadence: '終止形', cadenceEar: '終止を聴く', nameToChord: 'コードネームの構成音', chordInKey: '調の中のコード',
    // 12 移調
    transNote: '音の移調', transMelody: 'メロディーの移調', transInterval: '移調の度数', transBack: 'ハ長調にもどす', transKey: '移調楽器の調', transInst: '移調楽器の実音', transChord: 'コード進行の移調',
    // 13 楽語と記号
    dyn: '強弱記号', dynOrder: '強弱の順', hairpin: 'クレシェンド記号', tempo: '速さの言葉', tempoChange: '速さの変化', artic: '奏法の記号', express: '発想の言葉', repeatOrder: '反復記号', proQ: '演奏家のイメージ',
    // 14 速さと強弱の楽語
    tmMean: '速さ・強弱の意味', tmRev: '意味から楽語', tmFast: '速い・遅い順', dynSym: 'ppp・sf・fp など', dynLoud: '強い・弱い順', auxMean: '補助語', phrase: '楽語の組み合わせ', cat14: '何を表す言葉？', opp14: '反対の意味', read14: '楽語の読み方', etym14: '楽語と英語の語源',
    // 15 発想と奏法の楽語
    exMean: '発想の意味', exRev: '意味から発想の言葉', mood: '曲の気分と楽語', artMean: '奏法の意味', artRev: '意味から奏法の言葉', artSym: '奏法の記号の名前', cat15: '何を表す言葉？', opp15: '反対の意味', read15: '楽語の読み方', etym15: '楽語と英語の語源'
  };
  GK.typeName = function (id) { return GK.TYPE_NAME[id] || id; };
})();
