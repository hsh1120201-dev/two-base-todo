/**
 * 兩基地待辦追蹤 — Google Apps Script 後端
 * 使用方式：
 * 1. 新建一個 Google 試算表 → 擴充功能 → Apps Script，把這整份貼上。
 * 2. 執行一次 setup()（會建立「待辦」工作表並匯入初始待辦）。
 * 3.（建議）專案設定 → 指令碼屬性，新增 EDIT_PASS = 你要的編輯密碼。沒設就任何人都能改。
 * 4. 部署 → 新增部署作業 → 網頁應用程式；執行身分：我；存取權：所有人。
 * 5. 把 /exec 網址貼到 todo/config.js 的 TODO_API_URL。
 */
const SHEET = '待辦';
const COLS = ['id','title','base','start','due','priority','kpi','owner','note','done','doneAt','createdAt','updatedAt'];
const BASES = ['社創','青創','兩基地'];
const PRIS = ['高','中','低'];

const SEED = [
  ["s01", "發出第 2 次顧問會議邀請（3–5 名）並函報顧問名單、敲定日期", "社創", "2026-11-17", "2026-11-18", "高", "顧問會議 2/2", "", "", false],
  ["s02", "預約空調師傅保養（排 11 月內）", "社創", "2026-11-17", "2026-11-18", "中", "空調保養 1/1", "", "", false],
  ["s03", "確認業師輔導「10月+18案」狀態，列出 11–12 月輔導名單與業師檔期", "社創", "2026-11-17", "2026-11-20", "高", "業師輔導 40 次", "", "", false],
  ["s04", "確認剩餘培力課程（第 15、16 場）講師、場地、宣傳；開放一般青年報名並投廣告", "社創", "2026-11-17", "2026-11-20", "高", "課程場次／時數／人次", "", "", false],
  ["s05", "結案報告初版交主管", "社創", "", "2026-11-20", "高", "結案報告", "", "", false],
  ["m01", "Meet Taipei 2026 參展：全程拍攝、記錄媒合活動、現場發放滿意度問卷（含性別年齡）", "兩基地", "2026-11-19", "2026-11-21", "高", "新創展、影片、滿意度", "", "社創 7＋青創 5＝12 間", false],
  ["m02", "香港來賓參訪（青創基地→社創基地，團隊分享與交流）", "兩基地", "", "2026-11-23", "高", "", "", "9:00 明新科大校門口集合，12:00 賦歸", false],
  ["s07", "第 2 次基地營運顧問會議，會後作紀錄與建議回覆表", "社創", "2026-11-25", "2026-11-26", "高", "顧問會議 2/2", "", "11/25（三）或 11/26（四）", false],
  ["s06", "業師一對一輔導集中安排（建議 ≥5 次）", "社創", "2026-11-23", "2026-11-27", "高", "業師輔導 40 次", "", "", false],
  ["s08", "空調保養完成，取得保養單", "社創", "2026-11-23", "2026-11-27", "中", "空調保養 1/1", "", "", false],
  ["s09", "逐則下載 FB 貼文觸及數；未達 2,500 者補投廣告", "社創", "2026-11-23", "2026-11-27", "中", "FB 20 則×2,500", "", "", false],
  ["s10", "Meet Taipei 精華影片（1–2 分鐘、1080p）初剪送審", "社創", "", "2026-11-27", "高", "新創展影片", "", "", false],
  ["s11", "創貸聯繫單第 10 件（以上）送桃竹苗分署", "社創", "", "2026-11-30", "高", "聯繫單 10 件", "", "", false],
  ["s12", "11 月管考（工作）會議，留簽到與紀錄", "社創", "", "2026-11-30", "中", "每月工作會議", "", "", false],
  ["m03", "新創成果展：推薦團隊參加，現場收問卷", "兩基地", "", "2026-12-01", "中", "滿意度、主題展", "", "", false],
  ["s13", "Meet Taipei 影片上架機關指定社群並投放廣告（目標觸及 5,000）", "社創", "2026-12-01", "2026-12-04", "高", "新創展影片", "", "", false],
  ["s14", "培力課程第 15 場（建議名人講堂或合辦，目標 ≥45 人）", "社創", "2026-12-01", "2026-12-04", "高", "課程場次／時數／人次", "", "", false],
  ["s15", "業師輔導（建議 ≥3 次）", "社創", "2026-12-01", "2026-12-04", "中", "業師輔導 40 次", "", "", false],
  ["s16", "同心樓電力維修休館，發布休館公告（FB、LINE 官方帳號、LINE 群組、廠商群組）", "社創", "", "2026-12-05", "中", "", "", "", false],
  ["s19", "法律護盾課程", "社創", "", "2026-12-09", "中", "", "", "", false],
  ["s20", "函報 11 月業師輔導紀錄", "社創", "", "2026-12-10", "中", "業師輔導", "", "", false],
  ["s17", "校園參訪第 4 場（高中職或大專學系）", "社創", "2026-12-08", "2026-12-11", "高", "參訪 4 場", "", "", false],
  ["s18", "培力課程第 16 場（緩衝場，補人次）", "社創", "2026-12-08", "2026-12-11", "高", "課程人次", "", "", false],
  ["s21", "基地活動精華影片（2–3 分鐘）送審", "社創", "", "2026-12-11", "高", "活動影片", "", "", false],
  ["s22", "活動精華影片上架並投廣告（目標觸及 5,000）", "社創", "2026-12-14", "2026-12-18", "高", "活動影片", "", "", false],
  ["s23", "發放進駐團隊滿意度問卷（18 組）、基地使用者問卷；確認總數 ≥200", "社創", "2026-12-14", "2026-12-18", "高", "滿意度 200 份", "", "", false],
  ["s24", "結案報告二版（填入 11–12 月實績）", "社創", "", "2026-12-18", "中", "結案報告", "", "", false],
  ["s25", "滿意度統計分析（含性別、年齡交叉分析）與檢討建議", "社創", "2026-12-21", "2026-12-24", "中", "滿意度分析", "", "", false],
  ["s26", "撰寫業師輔導報告書；12 月管考會議", "社創", "2026-12-21", "2026-12-24", "中", "輔導報告書", "", "", false],
  ["s27", "截取兩支影片觸及數、FB 逐則觸及、廣告帳單；彙整照片目錄與設計原始檔隨身碟", "社創", "2026-12-28", "2026-12-30", "中", "佐證", "", "", false],
  ["s28", "所有工作項目完成（契約期限）；結案報告定稿", "社創", "", "2026-12-31", "高", "全部", "", "", false],
  ["s29", "結案報告用印、印製 1 式 3 份＋隨身碟 2 份", "社創", "", "2027-01-04", "高", "結案報告", "", "", false],
  ["s30", "函送結案成果報告書（期限）", "社創", "", "2027-01-05", "高", "結案報告", "", "逾期每次罰 2,000 元", false]
];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) sh = ss.insertSheet(SHEET);
  sh.getRange(1, 1, sh.getMaxRows(), COLS.length).setNumberFormat('@');
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  if (sh.getLastRow() > 1) return '已有資料，未重複匯入';
  const now = new Date().toISOString();
  const rows = SEED.map(function (r) { return [r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9] ? 'TRUE' : 'FALSE','',now,now]; });
  sh.getRange(2, 1, rows.length, COLS.length).setValues(rows);
  return '已匯入 ' + rows.length + ' 筆';
}

function doGet() { return json_({ ok: true, tasks: list_() }); }

function doPost(e) {
  let req = {};
  try { req = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json_({ ok: false, error: '格式錯誤' }); }
  try {
    if (req.action === 'list') return json_({ ok: true, tasks: list_() });
    const pass = PropertiesService.getScriptProperties().getProperty('EDIT_PASS');
    if (pass && String(req.pass || '') !== pass) return json_({ ok: false, error: 'need_pass' });
    if (req.action === 'checkPass') return json_({ ok: true });
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      if (req.action === 'save') return json_({ ok: true, task: save_(req.task || {}) });
      if (req.action === 'delete') { del_(String(req.id || '')); return json_({ ok: true }); }
    } finally { lock.releaseLock(); }
    return json_({ ok: false, error: '未知動作' });
  } catch (err) { return json_({ ok: false, error: String(err.message || err) }); }
}

function sheet_() { const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET); if (!sh) throw new Error('請先執行 setup()'); return sh; }

function list_() {
  const v = sheet_().getDataRange().getDisplayValues();
  return v.slice(1).filter(function (r) { return r[0]; }).map(function (r) {
    const o = {}; COLS.forEach(function (k, i) { o[k] = r[i]; });
    o.done = String(o.done).toUpperCase() === 'TRUE';
    return o;
  });
}

function clean_(s, n) { return String(s == null ? '' : s).trim().slice(0, n); }
function isDate_(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s); }

function save_(t) {
  const sh = sheet_();
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(function (r) { return r[0]; });
  const now = new Date().toISOString();
  let idx = t.id ? ids.indexOf(String(t.id)) : -1;
  let cur = {};
  if (idx > 0) { const r = sh.getRange(idx + 1, 1, 1, COLS.length).getDisplayValues()[0]; COLS.forEach(function (k, i) { cur[k] = r[i]; }); }
  const o = {
    id: idx > 0 ? cur.id : 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    title: t.title !== undefined ? clean_(t.title, 200) : cur.title,
    base: t.base !== undefined ? (BASES.indexOf(t.base) >= 0 ? t.base : '社創') : cur.base,
    start: t.start !== undefined ? (isDate_(t.start) ? t.start : '') : cur.start,
    due: t.due !== undefined ? t.due : cur.due,
    priority: t.priority !== undefined ? (PRIS.indexOf(t.priority) >= 0 ? t.priority : '中') : cur.priority,
    kpi: t.kpi !== undefined ? clean_(t.kpi, 80) : cur.kpi,
    owner: t.owner !== undefined ? clean_(t.owner, 40) : cur.owner,
    note: t.note !== undefined ? clean_(t.note, 1000) : cur.note,
    done: t.done !== undefined ? (t.done ? 'TRUE' : 'FALSE') : (cur.done || 'FALSE'),
    doneAt: cur.doneAt || '',
    createdAt: cur.createdAt || now,
    updatedAt: now
  };
  if (t.done !== undefined) o.doneAt = t.done ? now : '';
  if (!o.title) throw new Error('請填寫待辦事項');
  if (!isDate_(o.due)) throw new Error('截止日格式錯誤');
  const row = COLS.map(function (k) { return o[k]; });
  if (idx > 0) sh.getRange(idx + 1, 1, 1, COLS.length).setValues([row]);
  else { const r = sh.getLastRow() + 1; sh.getRange(r, 1, 1, COLS.length).setNumberFormat('@').setValues([row]); }
  o.done = o.done === 'TRUE';
  return o;
}

function del_(id) {
  const sh = sheet_();
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(function (r) { return r[0]; });
  const idx = ids.indexOf(id);
  if (idx > 0) sh.deleteRow(idx + 1);
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
