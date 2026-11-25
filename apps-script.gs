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
    if (req.action === 'kpiList') return json_({ ok: true, items: kpiList_() });
    const pass = PropertiesService.getScriptProperties().getProperty('EDIT_PASS');
    if (pass && String(req.pass || '') !== pass) return json_({ ok: false, error: 'need_pass' });
    if (req.action === 'checkPass') return json_({ ok: true });
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      if (req.action === 'save') return json_({ ok: true, task: save_(req.task || {}) });
      if (req.action === 'delete') { del_(String(req.id || '')); return json_({ ok: true }); }
      if (req.action === 'kpiSave') return json_({ ok: true, item: kpiSave_(req.item || {}) });
      if (req.action === 'kpiDelete') { kpiDel_(String(req.id || '')); return json_({ ok: true }); }
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

/* ===== 月會 KPI 達成表（kpi.html）=====
 * 「KPI」工作表第一次被讀取時會自動建立並匯入初始資料，不用另外執行 setup。
 * 欄位：id, base(社創/青創), seq(排序), item(重點執行項目), target(年度目標), rate(達成率), note(備註說明), updatedAt
 * 備註可用 **粗體**、__底線__。
 */
const KPI_SHEET = 'KPI';
const KPI_COLS = ['id','base','seq','item','target','rate','note','updatedAt'];
const KPI_BASES = ['社創','青創'];

const KPI_SEED = [
  ["q1","青創",1,"團隊招募","20組團隊","100%","第一期已於3/23辦理進駐18間；第二期於6/18辦理完畢招募1間，第三期於7/23辦理完畢招募3間，計22組。"],
  ["q2","青創",2,"團隊交流凝聚方案","2次","100%","上半年7/23青社創共振日凝聚交流工作坊辦理完畢；下半年度11/23(一)13:00-17:00「上市之路-挑戰你的商業決策思維」辦理完畢，簽到24人(含講師2人、工作人員2人)，參與團隊13組計20人。"],
  ["q3","青創",3,"企業組織/學群參訪","4案","50%","__7/31前應辦理兩次__\n1/26靜宜大學，7/9雲科大青創中心兩基地參訪。"],
  ["q4","青創",4,"其他創業基地交流","1次","100%","7/21(二)桃園青創基地及A8智慧產業加速器參訪完畢。"],
  ["q5","青創",5,"國際參訪","1次","100%","__至少帶5組新創團隊前往__，9/8-9/11前往馬來西亞拓商。(**宏力、數碼牛**、加減數位、承菲、先進材)"],
  ["q6","青創",6,"創業資金","200萬","100%","__年度媒合15案以上__，輔導媒合竹縣SBIR及其他競賽/補助案持續追蹤中。**(日日風味所、加減數位、果多文創、恩科、數碼牛、積世達/宜智科技: SITI台北創業補助獲100萬+戰國策全國創新創業競賽冠軍獲8萬+新創千里馬競賽銅獎獲2萬、SBIR獲補助團隊及金額-恩科創新82萬元、承菲智鏈80萬元、加減數位80萬元，計352萬)**"],
  ["q7","青創",7,"團隊健檢","1場","100%","__進駐後45日內辦理__，4/16已核定。"],
  ["q8","青創",8,"業師輔導","30次","73%","進駐團隊或一般青創家輔導紀錄表已累計**22次**，媒合進行中。"],
  ["s1","社創",1,"校園推廣參訪","4場","75%","5/6新竹B區BNI、7/9雲科大青創中心、11/7清大「產業創新與生涯探索課程」，12月上旬再排1場。"],
  ["s2","社創",2,"培力課程場次","15場","93%","已辦14場（含11/10「永續商模」），12月辦第15、16場。"],
  ["s3","社創",3,"培力課程總時數","34小時","91%","累計31小時，再補3小時以上。"],
  ["s4","社創",4,"培力課程總人次","300人次","70%","依簽到表累計**210人次**（不含長官、講師、工作人員），剩餘2場每場需45人以上。"],
  ["s5","社創",5,"推薦團隊參加青創主題展","2組","100%","先進材、云碩參加3/27新春交流茶會。"],
  ["s6","社創",6,"國內大型新創展","8組","100%","Meet Taipei 2026（11/19–21）社創7組＋青創5組，共12間參展。"],
  ["s7","社創",7,"新創展精華影片","1支","0%","__觸及5,000人__，11/27初剪送審，12/4前上架投放廣告。"],
  ["s8","社創",8,"本案活動精華影片","1支","0%","__觸及5,000人__，12/11前送審，12/16前上架投放廣告。"],
  ["s9","社創",9,"進駐團隊招募","15組","100%","續約13組＋8/26審查新增5組，計18組。"],
  ["s10","社創",10,"新創健檢","1場","100%","6/18第一場、9月第二場辦理完畢。"],
  ["s11","社創",11,"迎新交流聚會","1場","100%","10/7辦理完畢。"],
  ["s12","社創",12,"業師一對一輔導","40次","80%","已核備累計32次，11–12月持續媒合。"],
  ["s13","社創",13,"每月工作會議","12次","83%","1–10月均已辦理，11、12月各1次。"],
  ["s14","社創",14,"協助取得創業資金","100萬","100%","先進材SBIR 66萬＋千里馬競賽5萬、蘊宮女子美學館1萬、知享桃園SBIR 70萬，**計142萬**。"],
  ["s15","社創",15,"創業競賽前三名","1組","100%","新創千里馬創業競賽金獎：先進材。"],
  ["s16","社創",16,"創業貸款聯繫單","10件","90%","已送件9件，11/30前再送1件以上。"],
  ["s17","社創",17,"基地營運顧問會議","2次","50%","上半年1次已辦（線上），第2次11月底辦理。"],
  ["s18","社創",18,"FB粉專貼文","20則","100%","已發28則，FB＋IG合計觸及54,275人次；逐則確認觸及2,500人。"],
  ["s19","社創",19,"滿意度調查有效問卷","200份","73%","課程累計145份，Meet Taipei、成果展、進駐團隊問卷持續收。"],
  ["s20","社創",20,"空調設備保養","1次","0%","11月底前完成並留保養單。"]
];

function kpiSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(KPI_SHEET);
  if (!sh) {
    sh = ss.insertSheet(KPI_SHEET);
    sh.getRange(1, 1, sh.getMaxRows(), KPI_COLS.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, KPI_COLS.length).setValues([KPI_COLS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    const now = new Date().toISOString();
    const rows = KPI_SEED.map(function (r) { return [r[0], r[1], String(r[2]), r[3], r[4], r[5], r[6], now]; });
    sh.getRange(2, 1, rows.length, KPI_COLS.length).setValues(rows);
  }
  return sh;
}

function kpiList_() {
  const v = kpiSheet_().getDataRange().getDisplayValues();
  return v.slice(1).filter(function (r) { return r[0]; }).map(function (r) {
    const o = {}; KPI_COLS.forEach(function (k, i) { o[k] = r[i]; });
    o.seq = Number(o.seq) || 0;
    return o;
  });
}

function kpiSave_(t) {
  const sh = kpiSheet_();
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(function (r) { return r[0]; });
  const idx = t.id ? ids.indexOf(String(t.id)) : -1;
  let cur = {};
  if (idx > 0) { const r = sh.getRange(idx + 1, 1, 1, KPI_COLS.length).getDisplayValues()[0]; KPI_COLS.forEach(function (k, i) { cur[k] = r[i]; }); }
  const o = {
    id: idx > 0 ? cur.id : 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    base: t.base !== undefined ? (KPI_BASES.indexOf(t.base) >= 0 ? t.base : '社創') : cur.base,
    seq: t.seq !== undefined ? String(Number(t.seq) || 0) : cur.seq,
    item: t.item !== undefined ? clean_(t.item, 60) : cur.item,
    target: t.target !== undefined ? clean_(t.target, 40) : cur.target,
    rate: t.rate !== undefined ? clean_(t.rate, 20) : cur.rate,
    note: t.note !== undefined ? clean_(t.note, 2000) : cur.note,
    updatedAt: new Date().toISOString()
  };
  if (!o.item) throw new Error('請填寫重點執行項目');
  const row = KPI_COLS.map(function (k) { return o[k]; });
  if (idx > 0) sh.getRange(idx + 1, 1, 1, KPI_COLS.length).setValues([row]);
  else { const r = sh.getLastRow() + 1; sh.getRange(r, 1, 1, KPI_COLS.length).setNumberFormat('@').setValues([row]); }
  o.seq = Number(o.seq) || 0;
  return o;
}

function kpiDel_(id) {
  const sh = kpiSheet_();
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(function (r) { return r[0]; });
  const idx = ids.indexOf(id);
  if (idx > 0) sh.deleteRow(idx + 1);
}
