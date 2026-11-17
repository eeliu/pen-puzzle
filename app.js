import { buildArithmeticPuzzle, buildWordPuzzle, newSeed, parseWords } from './puzzle-core.js';

const $ = (selector) => document.querySelector(selector);
const translations = {
  'zh-CN': {
    languageLabel:'语言',
    controlSettings:'谜题设置',
    topbarNote:'无需注册 · 直接在浏览器中使用',
    description:'生成、解答和打印算术与单词交叉谜题。',
    eyebrow:'主题关卡 · 汪汪队 × 奥特曼',
    introTitle:'算术与单词交叉谜题',
    introText:'生成谜题，在线填写答案，或打印使用。',
    themeLabel:'汪汪队与奥特曼主题',
    puzzleType:'谜题类型',
    mathTab:'＋ 算术谜题',
    wordTab:'Aa 单词谜题',
    mathSettings:'算术设置',
    rangeLabel:'数字范围',
    rangeHelp:'操作数和结果',
    customRange:'或自定义',
    customMax:'自定义最大数字',
    operators:'运算符',
    operatorHelp:'至少选择一个',
    difficulty:'难度',
    difficultyHelp:'空格数量影响挑战性',
    easy:'轻松 · 约 25% 留空',
    normal:'适中 · 约 40% 留空',
    hard:'挑战 · 约 55% 留空',
    puzzleSize:'谜题规模',
    equationCount:'表达式条数',
    equationRange:'表达式条数，范围 4 到 40',
    wordSettings:'单词设置',
    wordsAndClues:'单词与线索',
    wordsFormat:'每行一个：WORD 空格 线索',
    showWordBank:'显示单词库',
    prefillLetters:'预填字母',
    none:'无',
    some:'少量',
    more:'更多',
    wordHint:'单词谜题的线索可能有多种解释，答案检查依据你输入的单词。',
    generate:'生成新谜题',
    puzzleId:'谜题编号',
    waiting:'等待生成',
    workspace:'谜题工作区',
    currentPuzzle:'当前谜题',
    ready:'准备开始',
    saveProgress:'保存进度',
    clearAnswers:'清空填写',
    print:'打印',
    enterFullscreen:'进入全屏',
    exitFullscreen:'退出全屏',
    printPuzzle:'打印谜题',
    printAnswers:'打印答案',
    printBoth:'谜题 + 答案',
    metaEmpty:'设置后生成一份新谜题',
    emptyTitle:'尚未生成题目',
    emptyText:'选择左侧设置，<br />然后点击“生成新谜题”。',
    footerText:'在线解答 · 支持打印',
    tipTitle:'小提示',
    tipText:'算术谜题中，横向和纵向的表达式会在数字格相交。试试从最容易确定的数字开始。',
    privacyTitle:'本地保存',
    privacyText:'题目和进度保存在当前浏览器中，刷新后可以继续。',
    footerNote:'一个轻量、开放的纸笔谜题工坊',
    mathTitle:'今日算术交叉谜题',
    wordTitle:'今日单词交叉谜题',
    easyName:'轻松',
    normalName:'适中',
    hardName:'挑战',
    customList:'自定义词表',
    mathMeta:'范围 0–{max} · {count}{requested} 条表达式',
    requestedMeta:' / {count}',
    wordMeta:'已放置 {placed} 个单词{unplaced}',
    unplacedMeta:' · {count} 个未能放置',
    mathNote:'{expressions} 条相交算式 · {blanks} 个数字待填写',
    across:'横向',
    down:'纵向',
    wordBank:'单词库',
    cellLabel:'数字格 {x}, {y}',
    elapsedTime:'用时',
    puzzleHistory:'历史题目',
    historyEmpty:'暂无历史记录',
    selectHistory:'选择历史题目',
    importHistory:'导入题目',
    historyImportError:'读取历史题目失败，请刷新后重试。',
    fewEquations:'当前设置下只找到 {count} 条可正确相交的算式；已保留连通布局。',
    extraBlanks:'为确保每条算式至少留空一个数字，本题实际留空 {count} 格（难度目标 {target} 格）。',
    unplacedNotice:'有 {count} 个词无法与其他词相交，未放入本题。可以增加共享字母的词或重新生成。',
    needOperator:'请至少选择一种运算符。',
    needWords:'请至少填写两个有效单词。',
    generationError:'生成谜题时出现问题，请调整设置后重试。',
    allCorrect:'全部正确！做得漂亮。',
    someCorrect:'{correct} / {total} 格正确，请继续调整红色格子。',
    answersRevealed:'答案已显示。你可以清空填写后再挑战一次。',
    saved:'进度已保存在这台设备的浏览器中。',
    needPuzzle:'先生成一份谜题，再进行打印。',
    answerTitle:'答案页 Answer Key',
    printTitle:'纸笔谜题工坊',
    mathPuzzle:'算术交叉谜题',
    wordPuzzle:'单词交叉谜题',
    answerReference:' · 参考答案',
    answerBanner:'答案供核对使用'
  },
  en: {
    languageLabel:'Language',
    controlSettings:'Puzzle settings',
    topbarNote:'No account needed · Runs in your browser',
    description:'Generate, solve, and print arithmetic and word crosswords.',
    eyebrow:'PUZZLE THEME · PUPPY RESCUE × ULTRAMAN',
    introTitle:'Math and word crossword puzzles',
    introText:'Generate a puzzle, fill in answers online, or print it.',
    themeLabel:'Puppy Patrol and Ultraman theme',
    puzzleType:'Puzzle type',
    mathTab:'＋ Math puzzle',
    wordTab:'Aa Word puzzle',
    mathSettings:'Math settings',
    rangeLabel:'Number range',
    rangeHelp:'Operands and results',
    customRange:'Or custom',
    customMax:'Custom maximum number',
    operators:'Operators',
    operatorHelp:'Choose at least one',
    difficulty:'Difficulty',
    difficultyHelp:'More blanks make it harder',
    easy:'Easy · about 25% blank',
    normal:'Medium · about 40% blank',
    hard:'Challenge · about 55% blank',
    puzzleSize:'Puzzle size',
    equationCount:'Number of equations',
    equationRange:'Number of equations, from 4 to 40',
    wordSettings:'Word settings',
    wordsAndClues:'Words and clues',
    wordsFormat:'One per line: WORD space clue',
    showWordBank:'Show word bank',
    prefillLetters:'Prefilled letters',
    none:'None',
    some:'Some',
    more:'More',
    wordHint:'Clues can have multiple interpretations. Answers are checked against the words you enter.',
    generate:'Generate puzzle',
    puzzleId:'Puzzle ID',
    waiting:'Not generated',
    workspace:'Puzzle workspace',
    currentPuzzle:'Current puzzle',
    ready:'Ready to begin',
    saveProgress:'Save progress',
    clearAnswers:'Clear answers',
    print:'Print',
    enterFullscreen:'Enter fullscreen',
    exitFullscreen:'Exit fullscreen',
    printPuzzle:'Print puzzle',
    printAnswers:'Print answers',
    printBoth:'Puzzle + answers',
    metaEmpty:'Choose settings and generate a puzzle',
    emptyTitle:'No puzzle generated',
    emptyText:'Choose settings on the left,<br />then select “Generate puzzle.”',
    footerText:'Solve online · Print ready',
    tipTitle:'Quick tip',
    tipText:'In math puzzles, horizontal and vertical equations cross at number cells. Start with the numbers you can determine most easily.',
    privacyTitle:'Saved locally',
    privacyText:'Puzzles and progress are saved in this browser and restored after refresh.',
    footerNote:'A lightweight, open puzzle workshop',
    mathTitle:'Today’s arithmetic crossword',
    wordTitle:'Today’s word crossword',
    easyName:'Easy',
    normalName:'Medium',
    hardName:'Challenge',
    customList:'Custom word list',
    mathMeta:'Range 0–{max} · {count}{requested} equations',
    requestedMeta:' / {count}',
    wordMeta:'{placed} words placed{unplaced}',
    unplacedMeta:' · {count} could not be placed',
    mathNote:'{expressions} crossing equations · {blanks} numbers to fill',
    across:'Across',
    down:'Down',
    wordBank:'Word bank',
    cellLabel:'Number cell {x}, {y}',
    elapsedTime:'Elapsed time',
    puzzleHistory:'Puzzle history',
    historyEmpty:'No saved puzzles',
    selectHistory:'Choose a saved puzzle',
    importHistory:'Load puzzle',
    historyImportError:'Could not load puzzle history. Refresh and try again.',
    fewEquations:'Only {count} equations could be placed with valid crossings for these settings. The connected layout was kept.',
    extraBlanks:'To leave at least one blank in every equation, this puzzle has {count} blanks (difficulty target: {target}).',
    unplacedNotice:'{count} words could not cross another word and were left out. Add words with shared letters or generate again.',
    needOperator:'Choose at least one operator.',
    needWords:'Enter at least two valid words.',
    generationError:'Something went wrong while generating the puzzle. Adjust the settings and try again.',
    allCorrect:'All correct! Nicely done.',
    someCorrect:'{correct} of {total} cells are correct. Adjust the red cells.',
    answersRevealed:'Answers revealed. Clear the entries to try again.',
    saved:'Progress saved in this browser.',
    needPuzzle:'Generate a puzzle before printing.',
    answerTitle:'Answer Key',
    printTitle:'Pen & Puzzle',
    mathPuzzle:'Arithmetic crossword',
    wordPuzzle:'Word crossword',
    answerReference:' · Answer key',
    answerBanner:'Use these answers to check your work'
  },
  ko: {
    languageLabel:'언어',
    controlSettings:'퍼즐 설정',
    topbarNote:'가입 없이 · 브라우저에서 바로 사용',
    description:'산수와 단어 크로스워드를 만들고 풀고 인쇄하세요.',
    eyebrow:'퍼즐 테마 · 퍼피 구조대 × 울트라맨',
    introTitle:'산수·단어 크로스워드 퍼즐',
    introText:'퍼즐을 만들고 온라인으로 답을 입력하거나 인쇄하세요.',
    themeLabel:'퍼피 구조대와 울트라맨 테마',
    puzzleType:'퍼즐 유형',
    mathTab:'＋ 산수 퍼즐',
    wordTab:'Aa 단어 퍼즐',
    mathSettings:'산수 설정',
    rangeLabel:'숫자 범위',
    rangeHelp:'피연산자와 결과',
    customRange:'직접 입력',
    customMax:'최대 숫자 직접 입력',
    operators:'연산자',
    operatorHelp:'하나 이상 선택',
    difficulty:'난이도',
    difficultyHelp:'빈칸이 많을수록 어려워집니다',
    easy:'쉬움 · 약 25% 빈칸',
    normal:'보통 · 약 40% 빈칸',
    hard:'도전 · 약 55% 빈칸',
    puzzleSize:'퍼즐 크기',
    equationCount:'식 개수',
    equationRange:'식 개수, 4~40',
    wordSettings:'단어 설정',
    wordsAndClues:'단어와 힌트',
    wordsFormat:'한 줄에 하나: WORD 공백 힌트',
    showWordBank:'단어 목록 표시',
    prefillLetters:'미리 채울 글자',
    none:'없음',
    some:'조금',
    more:'많이',
    wordHint:'힌트에는 여러 해석이 있을 수 있습니다. 정답은 입력한 단어를 기준으로 확인합니다.',
    generate:'새 퍼즐 만들기',
    puzzleId:'퍼즐 번호',
    waiting:'생성 대기 중',
    workspace:'퍼즐 작업 공간',
    currentPuzzle:'현재 퍼즐',
    ready:'시작할 준비가 됐어요',
    saveProgress:'진행 상황 저장',
    clearAnswers:'입력 지우기',
    print:'인쇄',
    enterFullscreen:'전체 화면',
    exitFullscreen:'전체 화면 종료',
    printPuzzle:'퍼즐 인쇄',
    printAnswers:'정답 인쇄',
    printBoth:'퍼즐 + 정답',
    metaEmpty:'설정을 선택한 뒤 퍼즐을 만드세요',
    emptyTitle:'퍼즐이 생성되지 않았습니다',
    emptyText:'왼쪽에서 설정을 선택한 뒤<br />“새 퍼즐 만들기”를 누르세요.',
    footerText:'온라인 풀이 · 인쇄 가능',
    tipTitle:'간단한 팁',
    tipText:'산수 퍼즐에서는 가로와 세로 식이 숫자 칸에서 교차합니다. 먼저 쉽게 알 수 있는 숫자부터 풀어 보세요.',
    privacyTitle:'로컬 저장',
    privacyText:'퍼즐과 진행 상황은 이 브라우저에 저장되며 새로고침 후 복원됩니다.',
    footerNote:'가볍고 열린 종이 퍼즐 공방',
    mathTitle:'오늘의 산수 크로스워드',
    wordTitle:'오늘의 단어 크로스워드',
    easyName:'쉬움',
    normalName:'보통',
    hardName:'도전',
    customList:'사용자 단어 목록',
    mathMeta:'범위 0–{max} · 식 {count}{requested}개',
    requestedMeta:' / {count}',
    wordMeta:'단어 {placed}개 배치{unplaced}',
    unplacedMeta:' · {count}개 배치 실패',
    mathNote:'교차 식 {expressions}개 · 채울 숫자 {blanks}개',
    across:'가로',
    down:'세로',
    wordBank:'단어 목록',
    cellLabel:'숫자 칸 {x}, {y}',
    elapsedTime:'경과 시간',
    puzzleHistory:'퍼즐 기록',
    historyEmpty:'저장된 퍼즐이 없습니다',
    selectHistory:'저장된 퍼즐 선택',
    importHistory:'퍼즐 불러오기',
    historyImportError:'퍼즐 기록을 읽을 수 없습니다. 새로고침 후 다시 시도하세요.',
    fewEquations:'현재 설정에서 올바르게 교차하는 식 {count}개만 배치할 수 있어 연결된 배치를 유지했습니다.',
    extraBlanks:'모든 식에 빈칸을 하나 이상 두기 위해 실제 빈칸은 {count}개입니다 (난이도 목표 {target}개).',
    unplacedNotice:'다른 단어와 교차하지 않는 단어 {count}개는 제외했습니다. 공통 글자가 있는 단어를 추가하거나 다시 생성해 보세요.',
    needOperator:'연산자를 하나 이상 선택하세요.',
    needWords:'유효한 단어를 두 개 이상 입력하세요.',
    generationError:'퍼즐을 만드는 중 문제가 발생했습니다. 설정을 바꾸고 다시 시도하세요.',
    allCorrect:'모두 정답입니다! 잘했어요.',
    someCorrect:'{total}칸 중 {correct}칸이 정답입니다. 빨간 칸을 수정해 보세요.',
    answersRevealed:'정답을 표시했습니다. 입력을 지우고 다시 도전할 수 있어요.',
    saved:'이 브라우저에 진행 상황을 저장했습니다.',
    needPuzzle:'인쇄하기 전에 퍼즐을 생성하세요.',
    answerTitle:'정답',
    printTitle:'Pen & Puzzle',
    mathPuzzle:'산수 크로스워드',
    wordPuzzle:'단어 크로스워드',
    answerReference:' · 정답',
    answerBanner:'정답 확인용'
  },
  ja: {
    languageLabel:'言語',
    controlSettings:'パズル設定',
    topbarNote:'登録不要 · ブラウザーですぐ使えます',
    description:'数字と単語のクロスワードを作って、解いて、印刷できます。',
    eyebrow:'テーマ · パウ・パトロール × ウルトラマン',
    introTitle:'数字と単語のクロスワード',
    introText:'パズルを作成し、オンラインで回答するか印刷できます。',
    themeLabel:'パウ・パトロールとウルトラマンのテーマ',
    puzzleType:'パズルの種類',
    mathTab:'＋ 数字パズル',
    wordTab:'Aa 単語パズル',
    mathSettings:'数字の設定',
    rangeLabel:'数字の範囲',
    rangeHelp:'計算する数と答え',
    customRange:'または指定',
    customMax:'最大値を指定',
    operators:'演算子',
    operatorHelp:'1つ以上選択',
    difficulty:'難易度',
    difficultyHelp:'空欄が多いほど難しくなります',
    easy:'かんたん · 約25%が空欄',
    normal:'ふつう · 約40%が空欄',
    hard:'チャレンジ · 約55%が空欄',
    puzzleSize:'パズルの規模',
    equationCount:'式の数',
    equationRange:'式の数（4〜40）',
    wordSettings:'単語の設定',
    wordsAndClues:'単語とヒント',
    wordsFormat:'1行に1つ：WORD 半角スペース ヒント',
    showWordBank:'単語一覧を表示',
    prefillLetters:'事前入力する文字',
    none:'なし',
    some:'少し',
    more:'多め',
    wordHint:'ヒントには複数の解釈があります。入力した単語をもとに答えを確認します。',
    generate:'新しいパズルを作成',
    puzzleId:'パズル番号',
    waiting:'未作成',
    workspace:'パズル作業エリア',
    currentPuzzle:'現在のパズル',
    ready:'準備完了',
    saveProgress:'進捗を保存',
    clearAnswers:'入力を消去',
    print:'印刷',
    enterFullscreen:'全画面表示',
    exitFullscreen:'全画面表示を終了',
    printPuzzle:'パズルを印刷',
    printAnswers:'答えを印刷',
    printBoth:'パズル + 答え',
    metaEmpty:'設定を選んでパズルを作成してください',
    emptyTitle:'パズルはまだありません',
    emptyText:'左側で設定を選び、<br />「新しいパズルを作成」を押してください。',
    footerText:'オンラインで回答 · 印刷可能',
    tipTitle:'ヒント',
    tipText:'数字パズルでは横と縦の式が数字のマスで交差します。まず分かりやすい数字から考えてみましょう。',
    privacyTitle:'ローカル保存',
    privacyText:'パズルと進捗はこのブラウザーに保存され、更新後も復元されます。',
    footerNote:'軽くてオープンな紙とペンのパズル工房',
    mathTitle:'今日の数字クロスワード',
    wordTitle:'今日の単語クロスワード',
    easyName:'かんたん',
    normalName:'ふつう',
    hardName:'チャレンジ',
    customList:'カスタム単語リスト',
    mathMeta:'範囲 0–{max} · 式 {count}{requested}問',
    requestedMeta:' / {count}',
    wordMeta:'{placed}語を配置{unplaced}',
    unplacedMeta:' · {count}語を配置できません',
    mathNote:'交差する式 {expressions}問 · 空欄の数字 {blanks}個',
    across:'ヨコ',
    down:'タテ',
    wordBank:'単語一覧',
    cellLabel:'数字マス {x}, {y}',
    elapsedTime:'経過時間',
    puzzleHistory:'パズル履歴',
    historyEmpty:'保存されたパズルはありません',
    selectHistory:'保存したパズルを選択',
    importHistory:'パズルを読み込む',
    historyImportError:'パズル履歴を読み込めません。更新して再度お試しください。',
    fewEquations:'現在の設定では正しく交差できる式が{count}問だけ見つかりました。連結した配置を維持しています。',
    extraBlanks:'すべての式に1つ以上の空欄を残すため、空欄は{count}個です（難易度の目標：{target}個）。',
    unplacedNotice:'他の単語と交差できない{count}語は配置されませんでした。共通の文字を含む単語を追加するか、再作成してください。',
    needOperator:'演算子を1つ以上選んでください。',
    needWords:'有効な単語を2つ以上入力してください。',
    generationError:'パズルの作成中に問題が発生しました。設定を変更してもう一度お試しください。',
    allCorrect:'全問正解です！お見事。',
    someCorrect:'{total}マス中{correct}マスが正解です。赤いマスを修正してください。',
    answersRevealed:'答えを表示しました。入力を消してもう一度挑戦できます。',
    saved:'このブラウザーに進捗を保存しました。',
    needPuzzle:'印刷する前にパズルを作成してください。',
    answerTitle:'解答',
    printTitle:'Pen & Puzzle',
    mathPuzzle:'数字クロスワード',
    wordPuzzle:'単語クロスワード',
    answerReference:' · 解答',
    answerBanner:'答え合わせにお使いください'
  }
};
const localeStorageKey = 'pen-puzzle-language';
translations['zh-CN'].brandHome = 'Pen and Puzzle 首页';
translations.en.brandHome = 'Pen and Puzzle home';
translations.ko.brandHome = 'Pen and Puzzle 홈';
translations.ja.brandHome = 'Pen and Puzzle ホーム';
const state = { mode: 'math', puzzle: null, seed: '', language: 'zh-CN', notice: null, timerElapsed: 0, timerStartedAt: null, timerCompleted: false, historyCreatedAt: null, historyRecordId: null, printTitleBackup: null };
const historyDatabaseName = 'pen-puzzle-history';
const historyStoreName = 'puzzles';
let historyDatabasePromise;

function t(key, values = {}) {
  const template = translations[state.language]?.[key] ?? translations['zh-CN'][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function applyLanguage(language) {
  state.language = Object.hasOwn(translations, language) ? language : 'zh-CN';
  document.documentElement.lang = state.language;
  document.title = state.language === 'zh-CN' ? 'Pen & Puzzle — 纸笔谜题工坊' : 'Pen & Puzzle';
  document.querySelector('meta[name="description"]').content = t('description');
  $('#language').value = state.language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.innerHTML = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.setAttribute('title', t(element.dataset.i18nTitle));
  });
  const focusModeButton = $('#focus-mode');
  if (focusModeButton) {
    const isFocused = document.body.classList.contains('focus-mode');
    const label = t(isFocused ? 'exitFullscreen' : 'enterFullscreen');
    focusModeButton.title = label;
    focusModeButton.setAttribute('aria-label', label);
  }
  try { localStorage.setItem(localeStorageKey, state.language); } catch { /* Locale still works when storage is unavailable. */ }
  if (state.puzzle) renderPuzzle();
  else if (state.notice) showNotice(state.notice.key, state.notice.type, state.notice.values);
  refreshHistoryOptions();
}

function getGridBounds(puzzle) {
  const cells = [...puzzle.grid.values()];
  return {
    minX: Math.min(...cells.map((cell) => cell.x)), maxX: Math.max(...cells.map((cell) => cell.x)),
    minY: Math.min(...cells.map((cell) => cell.y)), maxY: Math.max(...cells.map((cell) => cell.y)),
  };
}

function renderMath(puzzle) {
  const bounds = getGridBounds(puzzle);
  const table = document.createElement('table');
  table.className = 'arithmetic-grid';
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    const row = table.insertRow();
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const td = row.insertCell();
      const key = `${x},${y}`;
      const cell = puzzle.grid.get(key);
      if (!cell) { td.className = 'empty-cell'; continue; }
      if (!cell.numeric) { td.className = 'operator-cell'; td.textContent = cell.token; continue; }
      td.className = 'number-cell';
      const answer = String(cell.token);
      if (puzzle.blankSet.has(key)) {
        const input = document.createElement('input');
        input.inputMode = 'numeric';
        input.dataset.key = key;
        input.dataset.answer = answer;
        input.setAttribute('aria-label', t('cellLabel', { x: x + 1, y: y + 1 }));
        input.value = puzzle.userEntries?.[key] || '';
        td.append(input);
      } else {
        td.textContent = answer;
      }
    }
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'grid-wrap';
  wrapper.append(table);
  const container = document.createElement('div');
  container.append(wrapper);
  const note = document.createElement('div');
  note.className = 'equation-notes';
  note.textContent = t('mathNote', { expressions: puzzle.expressions.length, blanks: puzzle.blankCount });
  container.append(note);
  return container;
}

function fitFullscreenMathGrid() {
  if (!document.body.classList.contains('focus-mode') || state.puzzle?.kind !== 'math') return;
  const content = $('#puzzle-content');
  const wrapper = content.querySelector('.grid-wrap');
  const table = wrapper?.querySelector('.arithmetic-grid');
  const note = content.querySelector('.equation-notes');
  if (!content.clientWidth || !content.clientHeight || !table) return;

  table.style.setProperty('--grid-scale', '1');
  const availableWidth = content.clientWidth - 8;
  const availableHeight = content.clientHeight - (note?.offsetHeight || 0) - 24;
  const widthScale = availableWidth / table.offsetWidth;
  const heightScale = availableHeight / table.offsetHeight;
  const scale = Math.min(1, widthScale, heightScale);
  table.style.setProperty('--grid-scale', String(Math.max(0.35, scale)));
}

function scheduleFullscreenMathGridFit() {
  window.requestAnimationFrame(fitFullscreenMathGrid);
}

function renderWords(puzzle) {
  const layout = document.createElement('div');
  layout.className = 'word-layout';
  const table = document.createElement('table');
  table.className = 'word-grid';
  for (let y = puzzle.minY; y <= puzzle.maxY; y += 1) {
    const row = table.insertRow();
    for (let x = puzzle.minX; x <= puzzle.maxX; x += 1) {
      const td = row.insertCell();
      const key = `${x},${y}`;
      const cell = puzzle.grid.get(key);
      if (!cell) { td.className = 'block'; continue; }
      if (puzzle.starts.has(key)) {
        const number = document.createElement('span');
        number.className = 'answer-number';
        number.textContent = puzzle.starts.get(key);
        td.append(number);
      }
      if (puzzle.prefilled.has(key)) {
        const letter = document.createElement('span');
        letter.className = 'prefilled';
        letter.textContent = cell.letter;
        td.append(letter);
      } else {
        const input = document.createElement('input');
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.dataset.key = key;
        input.dataset.answer = cell.letter;
        input.value = puzzle.userEntries?.[key] || '';
        td.append(input);
      }
    }
  }
  layout.append(table);
  const clues = document.createElement('div');
  clues.className = 'clues';
  for (const direction of ['across', 'down']) {
    const heading = document.createElement('h3');
    heading.textContent = `${t(direction)}${state.language === 'zh-CN' ? ` ${direction === 'across' ? 'ACROSS' : 'DOWN'}` : ''}`;
    clues.append(heading);
    const list = document.createElement('ol');
    puzzle.placed.filter((word) => word.direction === direction).sort((a, b) => a.number - b.number).forEach((word) => {
      const item = document.createElement('li');
      item.value = word.number;
      item.textContent = word.clue;
      list.append(item);
    });
    clues.append(list);
  }
  if (puzzle.showBank) {
    const bank = document.createElement('div');
    bank.className = 'word-bank-note';
    bank.textContent = `${t('wordBank')}: ${puzzle.placed.map((word) => word.word).join(' · ')}`;
    clues.append(bank);
  }
  layout.append(clues);
  return layout;
}

function renderPuzzle() {
  const puzzle = state.puzzle;
  if (!puzzle) return;
  const content = $('#puzzle-content');
  content.replaceChildren(puzzle.kind === 'math' ? renderMath(puzzle) : renderWords(puzzle));
  scheduleFullscreenMathGridFit();
  $('#puzzle-title').textContent = t(puzzle.kind === 'math' ? 'mathTitle' : 'wordTitle');
  $('#meta-summary').textContent = puzzle.kind === 'math'
    ? t('mathMeta', { max: puzzle.max, count: puzzle.expressions.length, requested: puzzle.expressions.length < puzzle.requestedCount ? t('requestedMeta', { count: puzzle.requestedCount }) : '' })
    : t('wordMeta', { placed: puzzle.placed.length, unplaced: puzzle.unplaced.length ? t('unplacedMeta', { count: puzzle.unplaced.length }) : '' });
  $('#meta-difficulty').textContent = puzzle.difficulty ? t(`${puzzle.difficulty}Name`) : t('customList');
  updateTimerDisplay();
  $('#footer-id').textContent = `P&P — ${state.seed.toString(16).toUpperCase()}`;
  $('#puzzle-id').textContent = state.seed.toString(16).toUpperCase().padStart(8, '0');
  if (puzzle.kind === 'math' && puzzle.expressions.length < puzzle.requestedCount) {
    showNotice('fewEquations', 'error', { count: puzzle.expressions.length });
  } else if (puzzle.kind === 'math' && puzzle.blankCount > puzzle.targetBlankCount) {
    showNotice('extraBlanks', 'success', { count: puzzle.blankCount, target: puzzle.targetBlankCount });
  } else if (puzzle.unplaced?.length) showNotice('unplacedNotice', 'error', { count: puzzle.unplaced.length });
  else showNotice('', 'success');
}

function showNotice(key, type = 'success', values = {}) {
  const notice = $('#notice');
  state.notice = key ? { key, type, values } : null;
  notice.textContent = key ? t(key, values) : '';
  notice.className = key ? `notice ${type}` : 'notice hidden';
}

function generate() {
  const button = $('#generate');
  const generationStartedAt = performance.now();
  persist();
  button.disabled = true;
  try {
    const seed = newSeed();
    state.seed = seed;
    if (state.mode === 'math') {
      const rangeInput = $('#range-max');
      if (!rangeInput.reportValidity()) return;
      const max = Number(rangeInput.value);
      const enabled = [...document.querySelectorAll('.operator-options input:checked')].map((input) => input.value);
      if (!enabled.length) {
        showNotice('needOperator', 'error');
        return;
      }
      const requestedCount = Number.parseInt($('#equation-count').value, 10) || 6;
      const equationCount = Math.max(4, Math.min(40, requestedCount));
      $('#equation-count').value = equationCount;
      state.puzzle = buildArithmeticPuzzle(seed, max, enabled, equationCount, $('#difficulty').value);
      state.puzzle.userEntries = {};
    } else {
      const entries = parseWords($('#word-list').value);
      if (entries.length < 2) {
        showNotice('needWords', 'error');
        return;
      }
      state.puzzle = buildWordPuzzle(seed, entries, Number($('#prefill').value), $('#word-bank').checked);
      state.puzzle.userEntries = {};
    }
    state.timerElapsed = 0;
    state.timerStartedAt = generationStartedAt;
    state.timerCompleted = false;
    state.historyCreatedAt = new Date().toISOString();
    state.historyRecordId = `${historyId(seed)}-${Date.now().toString(36)}`;
    renderPuzzle();
    persist().then(refreshHistoryOptions);
  } catch (error) {
    console.error('Puzzle generation failed:', error);
    showNotice('generationError', 'error');
  } finally {
    button.disabled = false;
  }
}

function collectEntries() {
  if (!state.puzzle) return;
  const entries = {};
  document.querySelectorAll('#puzzle-content input[data-key]').forEach((input) => { entries[input.dataset.key] = input.value; });
  state.puzzle.userEntries = entries;
}

function checkAnswers() {
  const inputs = [...document.querySelectorAll('#puzzle-content input[data-answer]')];
  if (!inputs.length) return;
  let correct = 0;
  let empty = 0;
  for (const input of inputs) {
    const value = input.value.trim().toUpperCase();
    const answer = input.dataset.answer.toUpperCase();
    input.classList.remove('correct', 'incorrect');
    if (!value) { empty += 1; continue; }
    if (value === answer) { correct += 1; input.classList.add('correct'); }
    else input.classList.add('incorrect');
  }
  // Only show the banner once after every cell is filled, instead of after each fill.
  if (empty) {
    showNotice('', 'success');
  } else {
    showNotice(correct === inputs.length ? 'allCorrect' : 'someCorrect', correct === inputs.length ? 'success' : 'error', { correct, total: inputs.length });
  }
  collectEntries();
  updateTimerCompletion(inputs);
  persist();
}

function formatElapsedTime(milliseconds) {
  const totalMilliseconds = Math.floor(milliseconds);
  const minutes = Math.floor(totalMilliseconds / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const remainder = totalMilliseconds % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(remainder).padStart(3, '0')}`;
}

function updateTimerDisplay() {
  const timer = $('#puzzle-timer');
  if (!timer) return;
  const elapsed = state.timerElapsed + (state.timerStartedAt === null ? 0 : performance.now() - state.timerStartedAt);
  timer.textContent = formatElapsedTime(elapsed);
}

function updateTimerCompletion(inputs = [...document.querySelectorAll('#puzzle-content input[data-answer]')]) {
  if (!inputs.length) return;
  const complete = inputs.every((input) => input.value.trim().toUpperCase() === input.dataset.answer.toUpperCase());
  if (complete && state.timerStartedAt !== null) {
    state.timerElapsed += performance.now() - state.timerStartedAt;
    state.timerStartedAt = null;
    state.timerCompleted = true;
    updateTimerDisplay();
  } else if (!complete && state.timerCompleted) {
    state.timerStartedAt = performance.now();
    state.timerCompleted = false;
  }
}

function revealAnswers() {
  document.querySelectorAll('#puzzle-content input[data-answer]').forEach((input) => { input.value = input.dataset.answer; input.classList.remove('incorrect'); input.classList.add('correct'); });
  collectEntries();
  updateTimerCompletion();
  showNotice('answersRevealed', 'success');
  persist();
}

function openHistoryDatabase() {
  if (historyDatabasePromise) return historyDatabasePromise;
  historyDatabasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(historyDatabaseName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(historyStoreName)) {
        database.createObjectStore(historyStoreName, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return historyDatabasePromise;
}

function saveHistoryRecord(record) {
  return openHistoryDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(historyStoreName, 'readwrite');
    transaction.objectStore(historyStoreName).put(record);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }));
}

function readHistoryRecords() {
  return openHistoryDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(historyStoreName, 'readonly');
    const request = transaction.objectStore(historyStoreName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

function refreshHistoryOptions() {
  if (typeof indexedDB === 'undefined') return;
  const select = $('#history-select');
  if (!select) return;
  const selectedId = select.value || state.historyRecordId || '';
  readHistoryRecords().then((records) => {
    records.sort((left, right) => Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0));
    select.replaceChildren();
    if (!records.length) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = t('historyEmpty');
      select.append(emptyOption);
      return;
    }

    const promptOption = document.createElement('option');
    promptOption.value = '';
    promptOption.textContent = t('selectHistory');
    select.append(promptOption);
    const dateFormatter = new Intl.DateTimeFormat(state.language, { dateStyle: 'short', timeStyle: 'short' });
    for (const record of records) {
      const option = document.createElement('option');
      option.value = record.id;
      const puzzleName = t(record.puzzle.kind === 'math' ? 'mathTitle' : 'wordTitle');
      const createdAt = record.createdAt ? new Date(record.createdAt) : new Date(0);
      option.textContent = `${record.id} · ${puzzleName} · ${dateFormatter.format(createdAt)}`;
      select.append(option);
    }
    if (records.some((record) => record.id === selectedId)) select.value = selectedId;
  }).catch(() => {
    // Keep the history control usable for older browsers with limited storage.
  });
}

function historyId(seed) {
  return Number(seed).toString(16).toUpperCase().padStart(8, '0');
}

function persist() {
  if (!state.puzzle) return;
  collectEntries();
  if (state.timerStartedAt !== null) {
    state.timerElapsed += performance.now() - state.timerStartedAt;
    state.timerStartedAt = performance.now();
  }
  const record = {
    id: state.historyRecordId || historyId(state.seed),
    seed: state.seed,
    mode: state.mode,
    puzzle: serializePuzzle(state.puzzle),
    timerElapsed: state.timerElapsed,
    timerCompleted: state.timerCompleted,
    createdAt: state.historyCreatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.historyCreatedAt = record.createdAt;
  try { localStorage.setItem('pen-puzzle-progress', JSON.stringify(record)); } catch { /* Private browsing may block storage. */ }
  return saveHistoryRecord(record).catch(() => {
    // Keep current progress in localStorage if IndexedDB is unavailable.
  });
}

function serializePuzzle(puzzle) {
  return { ...puzzle, grid: [...puzzle.grid.entries()], blankSet: puzzle.blankSet ? [...puzzle.blankSet] : undefined, prefilled: puzzle.prefilled ? [...puzzle.prefilled] : undefined, starts: puzzle.starts ? [...puzzle.starts] : undefined };
}

function restoreSaved() {
  try {
    const data = JSON.parse(localStorage.getItem('pen-puzzle-progress'));
    if (!data?.puzzle) return;
    activateHistoryRecord(data);
    persist().then(refreshHistoryOptions);
  } catch { /* Ignore stale or unavailable local progress. */ }
}

function activateHistoryRecord(record, { resetTimer = false } = {}) {
  const puzzle = record.puzzle;
  puzzle.grid = new Map(puzzle.grid);
  if (puzzle.blankSet) puzzle.blankSet = new Set(puzzle.blankSet);
  if (puzzle.prefilled) puzzle.prefilled = new Set(puzzle.prefilled);
  if (puzzle.starts) puzzle.starts = new Map(puzzle.starts);
  state.seed = record.seed;
  state.mode = record.mode;
  state.puzzle = puzzle;
  state.timerElapsed = resetTimer ? 0 : Number(record.timerElapsed) || 0;
  state.timerCompleted = resetTimer ? false : Boolean(record.timerCompleted);
  state.timerStartedAt = state.timerCompleted ? null : performance.now();
  state.historyCreatedAt = record.createdAt || new Date().toISOString();
  state.historyRecordId = record.id || historyId(record.seed);
  setMode(state.mode);
  renderPuzzle();
  updateTimerCompletion();
}

function importHistoryPuzzle() {
  const id = $('#history-select').value;
  if (!id) return;
  Promise.resolve(persist()).then(readHistoryRecords).then((records) => {
    const record = records.find((entry) => entry.id === id);
    if (!record) return;
    activateHistoryRecord(record, { resetTimer: true });
    persist();
  }).catch(() => showNotice('historyImportError', 'error'));
}

function printPuzzle(kind) {
  if (!state.puzzle) { showNotice('needPuzzle', 'error'); return; }
  collectEntries();
  const root = $('#print-root');
  root.replaceChildren();
  const sheet = (answers) => {
    const page = document.createElement('section');
    page.className = 'print-sheet';
    if (state.puzzle.kind === 'math') {
      const bounds = getGridBounds(state.puzzle);
      const columns = bounds.maxX - bounds.minX + 1;
      const rows = bounds.maxY - bounds.minY + 1;
      const cellSize = Math.min(8, 186 / columns, 205 / rows);
      page.style.setProperty('--print-cell-size', `${cellSize}mm`);
    }
    const title = document.createElement('h1');
    title.textContent = answers ? t('answerTitle') : t('printTitle');
    const summary = document.createElement('div');
    summary.className = 'print-summary';
    summary.textContent = `${t(state.puzzle.kind === 'math' ? 'mathPuzzle' : 'wordPuzzle')} · ${t('puzzleId')} ${state.seed.toString(16).toUpperCase()}${answers ? t('answerReference') : ''}`;
    page.append(title, summary);
    const clone = state.puzzle.kind === 'math' ? renderMath(state.puzzle) : renderWords(state.puzzle);
    clone.querySelectorAll('input[data-answer]').forEach((input) => {
      if (answers) input.replaceWith(document.createTextNode(input.dataset.answer));
      else { input.value = ''; input.removeAttribute('value'); }
    });
    page.append(clone);
    if (answers) {
      const banner = document.createElement('div');
      banner.className = 'answer-banner';
      banner.textContent = t('answerBanner');
      page.append(banner);
    }
    const watermark = document.createElement('span');
    watermark.className = 'print-watermark';
    watermark.textContent = 'w.w';
    page.append(watermark);
    return page;
  };
  if (kind === 'puzzle' || kind === 'both') root.append(sheet(false));
  if (kind === 'answers' || kind === 'both') root.append(sheet(true));
  state.printTitleBackup = document.title;
  document.title = state.historyRecordId || historyId(state.seed);
  window.print();
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-button').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $('#math-settings').classList.toggle('hidden', mode !== 'math');
  $('#word-settings').classList.toggle('hidden', mode !== 'words');
}

if (typeof document !== 'undefined') {
document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
$('#generate').addEventListener('click', generate);
$('#history-import').addEventListener('click', importHistoryPuzzle);
$('#puzzle-content').addEventListener('input', (event) => {
  if (event.target.matches('input[data-key]')) {
    if (state.puzzle?.kind === 'words') event.target.value = event.target.value.replace(/[^a-z]/gi, '').toUpperCase().slice(-1);
    collectEntries();
    updateTimerCompletion();
    persist();
  }
});
$('#puzzle-content').addEventListener('keydown', (event) => {
  const input = event.target;
  if (!input.matches('input[data-key]') || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Enter'].includes(event.key)) return;
  const fields = [...document.querySelectorAll('#puzzle-content input[data-key]')];
  const index = fields.indexOf(input);
  const next = ['ArrowRight', 'ArrowDown', 'Enter'].includes(event.key) ? index + 1 : index - 1;
  if (fields[next]) { event.preventDefault(); fields[next].focus(); }
});
$('#puzzle-content').addEventListener('change', checkAnswers);
window.setInterval(updateTimerDisplay, 10);
window.addEventListener('pagehide', persist);
$('#reset').addEventListener('click', () => {
  document.querySelectorAll('#puzzle-content input[data-key]').forEach((input) => { input.value = ''; input.classList.remove('correct', 'incorrect'); });
  if (state.puzzle) state.puzzle.userEntries = {};
  updateTimerCompletion();
  showNotice('', 'success');
  persist();
});
$('#save').addEventListener('click', () => { persist(); showNotice('saved', 'success'); });
$('#language').addEventListener('change', (event) => applyLanguage(event.target.value));
$('#print-menu-button').addEventListener('click', () => $('#print-menu').classList.toggle('hidden'));
const focusModeButton = $('#focus-mode');
function setFocusMode(enabled) {
  document.body.classList.toggle('focus-mode', enabled);
  focusModeButton.setAttribute('aria-pressed', String(enabled));
  const label = t(enabled ? 'exitFullscreen' : 'enterFullscreen');
  focusModeButton.title = label;
  focusModeButton.setAttribute('aria-label', label);
  scheduleFullscreenMathGridFit();
}
focusModeButton.addEventListener('click', async () => {
  const enabled = !document.body.classList.contains('focus-mode');
  setFocusMode(enabled);
  if (enabled && document.documentElement.requestFullscreen) {
    try { await document.documentElement.requestFullscreen(); } catch { /* Keep the compact layout if fullscreen is unavailable. */ }
  } else if (!enabled && document.fullscreenElement && document.exitFullscreen) {
    try { await document.exitFullscreen(); } catch { /* The compact layout is already closed. */ }
  }
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('focus-mode')) setFocusMode(false);
  else scheduleFullscreenMathGridFit();
});
window.addEventListener('resize', scheduleFullscreenMathGridFit);
document.querySelectorAll('[data-print]').forEach((button) => button.addEventListener('click', () => {
  $('#print-menu').classList.add('hidden');
  printPuzzle(button.dataset.print);
}));
window.addEventListener('afterprint', () => {
  $('#print-root').replaceChildren();
  if (state.printTitleBackup !== null) {
    document.title = state.printTitleBackup;
    state.printTitleBackup = null;
  }
});
let savedLanguage = 'zh-CN';
try { savedLanguage = localStorage.getItem(localeStorageKey) || 'zh-CN'; } catch { /* Use the default locale when storage is unavailable. */ }
applyLanguage(savedLanguage);
restoreSaved();
}
