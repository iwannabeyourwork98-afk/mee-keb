(function(){
const LS_KEY = "mom-shop-money-v1";
const COSTS = [["rent","ค่าที่"],["elec","ค่าไฟ"],["fuel","ค่าน้ำมัน"],["hotel","ค่าที่พัก"],["other","อื่นๆ"]];
const KINDS = ["เสื้อ","กางเกง","เดรส","กระโปรง","อื่นๆ"];
const HOME_OUT_KINDS = ["ค่ากินใช้","ส่งน้อง","ผ่อนรถ","ให้ย่า/ยาย","เงินเดือนย่า","อื่นๆ"];
const HOME_IN_KINDS = ["ถอนจากร้าน","รายได้อื่น","อื่นๆ"];

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = n => Math.round(n).toLocaleString("th-TH");
const baht = n => (n < 0 ? "−฿" : "฿") + fmt(Math.abs(n));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0,10); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); };
const thDate = s => s ? new Date(s + "T12:00:00").toLocaleDateString("th-TH", { weekday:"short", day:"numeric", month:"short" }) : "";
const thShort = s => s ? new Date(s + "T12:00:00").toLocaleDateString("th-TH", { day:"numeric", month:"short" }) : "";
const toNum = v => { const t = String(v ?? "").replace(/[,\s฿]/g, ""); if (t === "") return null; const n = Number(t); return isFinite(n) && n >= 0 ? n : null; };

/* ---------- sample (shown until mom starts for real) ---------- */
function makeSample(){
  const t = today();
  const days = (start, n, base, seed) => Array.from({length:n}, (_, i) => ({ id: uid(), date: addDays(start, i),
    amount: Math.round((base + ((i * 7919 + seed) % 9) * 900 - 3600 + (i % 7 === 5 || i % 7 === 6 ? 3500 : 0)) / 10) * 10 }));
  const s1 = addDays(t, -52), s2 = addDays(t, -28), s3 = addDays(t, -5);
  const e1 = { id: uid(), name: "กาชาดจันทบุรี", place: "สนามหน้าศาลากลาง", status: "closed", created: s1,
    costs: { rent: 18000, elec: 1500, fuel: 4500, hotel: 6000, other: 0 }, days: days(s1, 16, 24000, 3) };
  const e2 = { id: uid(), name: "เกษตรแฟร์ ขอนแก่น", place: "ม.ขอนแก่น", status: "closed", created: s2,
    costs: { rent: 12000, elec: 1000, fuel: 3800, hotel: 4800, other: 0 }, days: days(s2, 12, 20000, 5) };
  const e3 = { id: uid(), name: "กาชาดชลบุรี", place: "ลานหน้าศาลากลาง", status: "open", created: s3,
    costs: { rent: 22000, elec: null, fuel: 5000, hotel: null, other: null }, days: days(s3, 6, 26000, 2) };
  const purchases = [
    { id: uid(), date: addDays(s1, 17), amount: 58000, note: "เดรส, เสื้อ", eventId: null, shop: "ผ้าเด็กประตูน้ำ" },
    { id: uid(), date: addDays(s2, 5), amount: 9500, note: "เสื้อ", eventId: e2.id, shop: "โบ๊เบ๊" },
    { id: uid(), date: addDays(s2, 13), amount: 34000, note: "กางเกง, เดรส", eventId: null, shop: "ผ้าเด็กประตูน้ำ" },
    { id: uid(), date: addDays(s3, 3), amount: 12000, note: "เสื้อ", eventId: e3.id, shop: "โบ๊เบ๊" },
  ];
  const homeLedger = [
    { id: uid(), date: addDays(s1, 1), amount: 20000, note: "ถอนจากร้าน", type: "in" },
    { id: uid(), date: addDays(s1, 2), amount: 14000, note: "ผ่อนรถ", type: "out" },
    { id: uid(), date: addDays(s1, 20), amount: 20000, note: "ส่งน้อง", type: "out" },
    { id: uid(), date: addDays(s2, 1), amount: 20000, note: "ถอนจากร้าน", type: "in" },
    { id: uid(), date: addDays(s2, 6), amount: 5000, note: "ให้ย่า/ยาย", type: "out" },
    { id: uid(), date: addDays(s2, 18), amount: 10000, note: "เงินเดือนย่า", type: "out" },
    { id: uid(), date: addDays(s3, 1), amount: 15000, note: "ถอนจากร้าน", type: "in" },
    { id: uid(), date: addDays(s3, 2), amount: 3500, note: "ค่ากินใช้", type: "out" },
  ];
  return { settings: { costPct: 67, buyPct: 80, startBudget: 0, wagePerDay: 4000, dream: "บ้านของเรา", notes: ["แม่สู้ๆ นะ บ้านของเราใกล้เข้ามาทุกวัน","ซื้อของพอดีงบ เงินก็เหลือเก็บเองนะแม่","ขอบคุณที่เหนื่อยเพื่อพวกเรานะแม่"] }, events: [e1, e2, e3], purchases, homeLedger };
}
const blank = () => ({ settings: { costPct: 67, buyPct: 80, startBudget: 0, wagePerDay: 4000, dream: "บ้านของเรา", notes: ["แม่สู้ๆ นะ บ้านของเราใกล้เข้ามาทุกวัน","ซื้อของพอดีงบ เงินก็เหลือเก็บเองนะแม่","ขอบคุณที่เหนื่อยเพื่อพวกเรานะแม่"] }, events: [], purchases: [], homeLedger: [] });

/* ---------- state & storage ---------- */
const LS_API_URL = "momShopApiUrl";
let apiUrl = localStorage.getItem(LS_API_URL) || "";
let state, isSample = false, lastJSON = "", syncing = false;
const view = { tab: "home", eventId: null };
try { const raw = localStorage.getItem(LS_KEY); if (raw) state = JSON.parse(raw); } catch(e) {}
if (!state || !state.events) { state = makeSample(); isSample = true; }
if (!Array.isArray(state.homeLedger)) state.homeLedger = (state.homeExpenses || []).map(x => ({ ...x, type: "out" }));
if (state.settings.wagePerDay == null) state.settings.wagePerDay = 4000;
if (state.settings.dream == null) state.settings.dream = "บ้านของเรา";
if (!Array.isArray(state.settings.notes)) state.settings.notes = ["แม่สู้ๆ นะ บ้านของเราใกล้เข้ามาทุกวัน","ซื้อของพอดีงบ เงินก็เหลือเก็บเองนะแม่","ขอบคุณที่เหนื่อยเพื่อพวกเรานะแม่"];

function persist(){
  if (isSample) return;
  const json = JSON.stringify(state); lastJSON = json;
  try { localStorage.setItem(LS_KEY, json); } catch(e) {}
  if (apiUrl) apiSet(json).then(ok => { if (!ok) toast("บันทึกออนไลน์ไม่สำเร็จ ข้อมูลยังอยู่ในเครื่องนี้"); });
}
function commit(msg){ persist(); render(); if (msg) toast(msg); }

/* ---------- backend sync (Google Apps Script Web App) ----------
 * GET เอาไว้ดึงข้อมูล, POST (body เป็น text ธรรมดา ไม่ใช่ JSON header) เอาไว้บันทึก
 * ใช้ text/plain โดยไม่ตั้ง Content-Type เอง เพื่อให้เบราว์เซอร์ส่งเป็น "simple request"
 * เลี่ยงปัญหา CORS preflight กับ Apps Script (Apps Script ตอบ OPTIONS ไม่ได้) */
async function apiGet(){
  if (!apiUrl) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(apiUrl + (apiUrl.includes("?") ? "&" : "?") + "action=get", { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    return json && json.data ? json.data : null;
  } catch (e) { clearTimeout(timer); return null; }
}
async function apiSet(json){
  if (!apiUrl) return false;
  try {
    const res = await fetch(apiUrl, { method: "POST", body: json });
    if (!res.ok) return false;
    const out = await res.json();
    return !!(out && out.ok);
  } catch (e) { return false; }
}
async function syncFromServer(){
  if (syncing) return; syncing = true;
  try {
    const remote = await apiGet();
    if (!remote || !remote.events) return;
    const json = JSON.stringify(remote);
    if (json === lastJSON) return;
    if (!Array.isArray(remote.homeLedger)) remote.homeLedger = (remote.homeExpenses || []).map(x => ({ ...x, type: "out" }));
    state = remote; isSample = false; lastJSON = json;
    try { localStorage.setItem(LS_KEY, json); } catch(e) {}
    if (!$(".scrim")) render();
  } finally { syncing = false; }
}
async function connectApi(url){
  apiUrl = url;
  try { localStorage.setItem(LS_API_URL, apiUrl); } catch(e) {}
  if (!apiUrl) { render(); return; }
  const remote = await apiGet();
  if (remote && remote.events && remote.events.length) {
    if (!Array.isArray(remote.homeLedger)) remote.homeLedger = (remote.homeExpenses || []).map(x => ({ ...x, type: "out" }));
    state = remote; isSample = false; lastJSON = JSON.stringify(remote);
    try { localStorage.setItem(LS_KEY, lastJSON); } catch(e) {}
    toast("ดึงข้อมูลจากออนไลน์มาแล้ว");
  } else if (!isSample) {
    await apiSet(JSON.stringify(state));
    toast("เชื่อมออนไลน์แล้ว");
  } else {
    toast("เชื่อมออนไลน์แล้ว เริ่มใช้จริงได้เลย");
  }
  render();
}
if (apiUrl) syncFromServer();
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && apiUrl) syncFromServer(); });

/* ---------- money math ---------- */
const S = () => state.settings;
const buyRate = () => (S().costPct / 100) * (S().buyPct / 100);
function evCalc(ev){
  const sales = ev.days.reduce((a, d) => a + d.amount, 0);
  const goods = sales * S().costPct / 100;
  const fixed = COSTS.reduce((a, [k]) => a + (ev.costs[k] || 0), 0);
  const missing = COSTS.filter(([k]) => k !== "other" && ev.costs[k] == null).map(([, l]) => l);
  const profit = sales - goods - fixed;
  const dates = ev.days.map(d => d.date).sort();
  const span = dates.length ? Math.round((new Date(dates.at(-1)) - new Date(dates[0])) / 864e5) + 1 : 0;
  const bought = state.purchases.filter(p => p.eventId === ev.id).reduce((a, p) => a + p.amount, 0);
  return { sales, goods, fixed, missing, profit, span, first: dates[0], last: dates.at(-1), budget: sales * buyRate(), bought };
}
const thMonth = (key, opt = { month: "long" }) => new Date(key + "-15T12:00:00").toLocaleDateString("th-TH", opt);
function totals(){
  const evs = state.events.map(e => ({ e, c: evCalc(e) }));
  const sales = evs.reduce((a, x) => a + x.c.sales, 0);
  const spent = state.purchases.reduce((a, p) => a + p.amount, 0);
  const fixedTotal = evs.reduce((a, x) => a + x.c.fixed, 0);
  const homeIn = state.homeLedger.filter(x => x.type === "in").reduce((a, x) => a + x.amount, 0);
  const homeOut = state.homeLedger.filter(x => x.type === "out").reduce((a, x) => a + x.amount, 0);
  return { evs, sales, spent, stock: spent - sales * S().costPct / 100,
    profit: evs.reduce((a, x) => a + x.c.profit, 0),
    cash: sales - spent - fixedTotal,
    home: { in: homeIn, out: homeOut, balance: homeIn - homeOut } };
}
/* งบซื้อของ = ต่องานเท่านั้น ไม่สะสมข้ามงาน */
function eventWallet(c){ return { earned: c.budget, spent: c.bought, wallet: c.budget - c.bought }; }
const sortedEvents = () => [...state.events].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1) || (b.created || "").localeCompare(a.created || ""));
const openEvents = () => sortedEvents().filter(e => e.status === "open");
function shopHistory(){
  const freq = {};
  state.purchases.forEach(p => { if (p.shop) freq[p.shop] = (freq[p.shop] || 0) + 1; });
  return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 8);
}

/* ---------- views ---------- */
function render(){
  document.querySelectorAll(".nav button").forEach(b => b.setAttribute("aria-current", b.dataset.tab === view.tab && !view.eventId ? "page" : "false"));
  const banner = isSample ? `<div class="banner"><span><b>ข้อมูลตัวอย่าง</b> ลองกดเล่นได้ ยังไม่บันทึกจริง</span><button data-act="start-real">เริ่มใช้จริง</button></div>` : "";
  let body;
  const picked = view.eventId && state.events.find(e => e.id === view.eventId);
  if (picked) body = eventPage(picked, false);
  else if (view.tab === "dash") body = dashView();
  else if (view.tab === "events") body = eventsView();
  else if (view.tab === "settings") body = settingsView();
  else body = homeView();
  $("#app").innerHTML = `<header class="top"><h1>มีเก็บ</h1><span class="sub">${thDate(today())}</span></header>${banner}${body}`;
}

function walletCard(t){
  const over = t.wallet < 0;
  const pct = t.earned > 0 ? Math.min(100, t.spent / t.earned * 100) : (t.spent > 0 ? 100 : 0);
  const per100 = Math.round(buyRate() * 100);
  return `<section class="tag ${over ? "over" : ""}" aria-label="งบซื้อของ">
    <div class="k">${over ? "ซื้อของเกินงบแล้ว" : "ตอนนี้ซื้อของได้อีกไม่เกิน"}</div>
    <div class="big num">${baht(Math.abs(t.wallet))}</div>
    <div class="meter" role="img" aria-label="ใช้งบไป ${Math.round(pct)}%"><i style="width:${pct}%"></i></div>
    <div class="row num"><span>ใช้ซื้อของไปแล้ว ${baht(t.spent)}</span><span>งบที่ได้ ${baht(t.earned)}</span></div>
    <div class="rule">${over
      ? `ต้องขายได้อีก <b class="num">${baht(-t.wallet / buyRate())}</b> ถึงจะมีงบซื้อของเพิ่ม`
      : `ขายได้ 100 บาท กันไว้ซื้อของได้ <b>${per100} บาท</b>`}</div>
  </section>`;
}

function homeCard(t){
  const h = t.home;
  const neg = h.balance < 0;
  return `<section class="tag home ${neg ? "over" : ""}" aria-label="บัญชีเงินบ้าน">
    <div class="k">${neg ? "บัญชีเงินบ้านติดลบ" : "บัญชีเงินบ้านคงเหลือ"}</div>
    <div class="big num">${baht(Math.abs(h.balance))}</div>
    <div class="row num"><span>รับเข้ารวม ${baht(h.in)}</span><span>จ่ายออกรวม ${baht(h.out)}</span></div>
    <div class="rule">ตอนนี้ร้านมีเงินสดอยู่ประมาณ ${baht(t.cash)} · ไว้เป็นข้อมูลตัดสินใจ ไม่ได้หักจากอะไร</div>
  </section>`;
}

/* เวอร์ชันย่อของบัญชีเงินบ้าน ใช้บนหน้าหลัก ไม่ให้แย่งพื้นที่งบซื้อของ */
function homeMini(t){
  const h = t.home;
  const neg = h.balance < 0;
  return `<section class="card">
    <div class="h2">บัญชีเงินบ้าน <small>${neg ? "ติดลบ" : "คงเหลือ"}</small></div>
    <div class="mini-num num ${neg ? "bad" : ""}">${baht(Math.abs(h.balance))}</div>
    <div class="label" style="margin:-4px 0 10px">ร้านมีเงินสดอยู่ตอนนี้ ~${baht(t.cash)}</div>
    <div class="actions">
      <button class="btn soft" data-act="home-pay" data-type="in"><span class="plus">+</span> รับเข้า</button>
      <button class="btn soft" data-act="home-pay" data-type="out"><span class="plus">+</span> จ่ายออก</button>
    </div>
  </section>`;
}

/* การ์ดความฝัน: ไม่มีตัวเลข แค่เตือนใจ ข้อความจากลูกเปลี่ยนวันละข้อความ */
function dreamCard(){
  const notes = (S().notes || []).filter(Boolean);
  const dayNo = Math.floor(new Date(today() + "T12:00:00") / 864e5);
  const msg = notes.length ? notes[dayNo % notes.length] : "";
  return `<section class="dream" aria-label="ความฝันของเรา">
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22 24 7l18 15"/><path d="M11 18v22h26V18"/><path d="M20 40V29h8v11"/><path d="M33 12V6h4v9.5"/></svg>
    <div><div class="d-title">ความฝันของเรา: ${esc(S().dream || "บ้านของเรา")}</div>${msg ? `<div class="d-msg">“${esc(msg)}”</div>` : ""}</div>
  </section>`;
}

/* หน้าหลัก = หน้างานที่กำลังขายอยู่ */
function homeView(){
  const opens = openEvents();
  if (!opens.length) {
    return `${dreamCard()}<div class="grid detail">
      <div class="col">
        <section class="card live"><div class="name">ตอนนี้ไม่มีงานที่กำลังขาย</div>
          <div class="meta">จะซื้อของเตรียมงานหน้าก่อนก็ได้ แค่สร้างงานไว้ก่อน แล้วจดค่าซื้อของผูกกับงานนั้นเลย งบซื้อของจะเริ่มคำนวณจากยอดขายงานนั้นให้เอง</div>
          <button class="btn primary huge-btn" data-act="new-ev"><span class="plus">+</span> สร้างงานใหม่</button></section>
      </div>
      <div class="col">
        ${homeMini(totals())}
      </div>
    </div>`;
  }
  const cur = opens.find(e => e.id === view.homeEv) || opens[0];
  const switcher = opens.length > 1 ? `<div class="chips" style="margin-bottom:12px">${opens.map(e =>
    `<button class="chip" data-act="home-ev" data-ev="${e.id}" aria-pressed="${e.id === cur.id}">${esc(e.name)}</button>`).join("")}</div>` : "";
  return dreamCard() + switcher + eventPage(cur, true);
}

function dashView(){
  const t = totals();
  const stockUp = t.stock > 0;
  const recentBuys = [...state.purchases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const recentHome = [...state.homeLedger].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return `<div class="grid home">
    <div class="col">
      <section class="card">
        <h2 class="h2">สรุปทั้งหมด <small>${state.events.length} งาน</small></h2>
        <div class="pair">
          <div class="stat"><div class="label">ยอดขายรวม</div><div class="v num">${baht(t.sales)}</div></div>
          <div class="stat"><div class="label">กำไรรวม (ประมาณ)</div><div class="v num ${t.profit < 0 ? "bad" : ""}">${baht(t.profit)}</div></div>
          <div class="stat" style="grid-column:1/-1"><div class="label">เงินที่จมอยู่ในสต๊อก เทียบกับตอนเริ่มจด</div>
            <div class="v num ${stockUp ? "bad" : "good"}">${stockUp ? "เพิ่มขึ้น " : "ลดลง "}${baht(Math.abs(t.stock))}</div>
            <div class="label">${stockUp ? "ซื้อของเข้ามามากกว่าที่ขายออกไป" : "ขายของออกไปมากกว่าที่ซื้อเข้ามา เงินกลับมาหมุนได้"}</div></div>
        </div>
      </section>
      ${compareCard(t)}
      ${profitChart(t.evs)}
    </div>
    <div class="col">
      ${buyBudgetList(t.evs)}
      ${homeCard(t)}
      ${monthTable()}
      <section class="card">
        <h2 class="h2">ซื้อของล่าสุด</h2>
        <div class="list">${recentBuys.length ? recentBuys.map(p => purchaseRow(p)).join("") : `<div class="empty">ยังไม่มีการซื้อของ</div>`}</div>
      </section>
      <section class="card">
        <h2 class="h2">จ่ายเรื่องบ้านล่าสุด</h2>
        <div class="list">${recentHome.length ? recentHome.map(x => homeLedgerRow(x)).join("") : `<div class="empty">ยังไม่มีรายการในบัญชีเงินบ้าน</div>`}</div>
      </section>
    </div>
  </div>`;
}

function monthTable(){
  const keys = new Set([today().slice(0, 7)]);
  state.homeLedger.forEach(x => keys.add(x.date.slice(0, 7)));
  const rows = [...keys].sort().reverse().slice(0, 6).map(key => {
    const entries = state.homeLedger.filter(x => x.date.startsWith(key));
    const inSum = entries.filter(x => x.type === "in").reduce((a, x) => a + x.amount, 0);
    const outSum = entries.filter(x => x.type === "out").reduce((a, x) => a + x.amount, 0);
    return { key, inSum, outSum, net: inSum - outSum };
  });
  return `<section class="card"><h2 class="h2">เงินบ้านแต่ละเดือน</h2>
    <div style="overflow-x:auto"><table class="mtable num"><thead><tr><th>เดือน</th><th>รับเข้า</th><th>จ่ายออก</th><th>สุทธิ</th></tr></thead>
    <tbody>${rows.map(m => `<tr><td>${thMonth(m.key, { month: "short", year: "2-digit" })}</td><td>${fmt(m.inSum)}</td><td>${fmt(m.outSum)}</td><td class="${m.net < 0 ? "bad" : "good"}">${m.net < 0 ? "−" : ""}${fmt(Math.abs(m.net))}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function buyBudgetList(evs){
  const rows = [...evs].sort((a, b) => (b.c.first || b.e.created || "").localeCompare(a.c.first || a.e.created || "")).slice(0, 6);
  const unassigned = state.purchases.filter(p => !p.eventId);
  const unassignedTotal = unassigned.reduce((a, p) => a + p.amount, 0);
  if (!rows.length && !unassigned.length) return "";
  return `<section class="card"><h2 class="h2">งบซื้อของแต่ละงาน <small>ไม่สะสมข้ามงาน</small></h2>
    <div class="list">${rows.map(({ e, c }) => {
      const left = c.budget - c.bought;
      const over = left < 0;
      return `<button class="item" data-act="open-ev" data-ev="${e.id}">
        <span class="grow"><span class="t">${esc(e.name)}${e.status === "open" ? " •" : ""}</span><br><span class="s">ได้งบ ${baht(c.budget)} · ใช้ไป ${baht(c.bought)}</span></span>
        <span class="amt num" style="color:${over ? "var(--bad)" : "var(--good)"}">${over ? "เกิน " : "เหลือ "}${baht(Math.abs(left))}</span></button>`;
    }).join("")}</div>
    ${unassigned.length ? `<div class="label" style="margin-top:10px">มีของที่ซื้อไว้ ${baht(unassignedTotal)} (${unassigned.length} รายการ) ยังไม่ผูกกับงานไหน ลองแก้รายการให้ผูกกับงานที่จะไปดูนะ</div>` : ""}
  </section>`;
}

function compareCard(t){
  const dates = [];
  state.events.forEach(e => { if (e.created) dates.push(e.created); e.days.forEach(d => dates.push(d.date)); });
  state.homeLedger.forEach(x => dates.push(x.date));
  if (!dates.length) return "";
  dates.sort();
  const calDays = Math.max(1, Math.round((new Date(today() + "T12:00:00") - new Date(dates[0] + "T12:00:00")) / 864e5) + 1);
  if (calDays < 7) return `<section class="card"><h2 class="h2">ร้านเลี้ยงบ้านไหวไหม</h2><p class="label" style="margin:0">ข้อมูลยังน้อยไป ใช้ไปสัก 1 สัปดาห์แอปจะเริ่มบอกได้</p></section>`;
  const profitPerDay = t.profit / calDays, homePerDay = t.home.out / calDays, diff = profitPerDay - homePerDay, ok = diff >= 0;
  return `<section class="card">
    <h2 class="h2">ร้านเลี้ยงบ้านไหวไหม <small>เฉลี่ยจาก ${calDays} วันที่ผ่านมา</small></h2>
    <div class="pair">
      <div class="stat"><div class="label">ร้านทำกำไรเฉลี่ย/วัน</div><div class="v num">${baht(profitPerDay)}</div></div>
      <div class="stat"><div class="label">บ้านใช้จ่ายเฉลี่ย/วัน</div><div class="v num">${baht(homePerDay)}</div></div>
    </div>
    <div class="hint ${ok ? "good" : "bad"}" style="margin-top:10px">${ok
      ? `ร้านเลี้ยงบ้านไหว เหลือเก็บเข้าร้านเฉลี่ยวันละ <b class="num">${baht(diff)}</b>`
      : `ตอนนี้บ้านใช้มากกว่าที่ร้านทำกำไรได้ เฉลี่ยวันละ <b class="num">${baht(-diff)}</b> ส่วนนี้ไปดึงจากเงินทุนซื้อของ`}</div>
  </section>`;
}

function profitChart(evs){
  const rows = [...evs].sort((a, b) => (b.c.first || b.e.created || "").localeCompare(a.c.first || a.e.created || "")).slice(0, 6);
  if (!rows.length) return "";
  const max = Math.max(1, ...rows.map(r => Math.abs(r.c.profit)));
  const hasNeg = rows.some(r => r.c.profit < 0);
  const zero = hasNeg ? 30 : 0, span = hasNeg ? 70 : 78;
  return `<section class="card"><h2 class="h2">กำไรแต่ละงาน <small>งานล่าสุด ${rows.length} งาน</small></h2>
    <div class="bars">${rows.map(({ e, c }) => {
      const w = Math.abs(c.profit) / max * span;
      const neg = c.profit < 0;
      const left = neg ? zero - Math.min(w, zero) : zero;
      const tip = `${e.name}: ขาย ${baht(c.sales)} · กำไร ${baht(c.profit)}${c.missing.length ? " (ค่าใช้จ่ายยังไม่ครบ)" : ""}`;
      return `<button class="bar" data-act="open-ev" data-ev="${e.id}" title="${esc(tip)}" aria-label="${esc(tip)}">
        <span class="n">${esc(e.name)}${e.status === "open" ? " •" : ""}</span>
        <span class="track"><span class="zero" style="left:${zero}%"></span>
          <span class="fill ${neg ? "neg" : ""}" style="left:${left}%;width:${neg ? Math.min(w, zero) : w}%"></span>
          <span class="val num" style="left:calc(${neg ? zero : zero + w}% + 6px)">${baht(c.profit)}${c.missing.length ? "*" : ""}</span></span>
      </button>`; }).join("")}</div>
    <div class="label" style="margin-top:8px">* ค่าใช้จ่ายของงานยังใส่ไม่ครบ · • กำลังขายอยู่</div></section>`;
}

function purchaseRow(p){
  const ev = state.events.find(e => e.id === p.eventId);
  const bits = [thDate(p.date)];
  if (p.shop) bits.push("จาก" + p.shop);
  bits.push(ev ? "ระหว่าง" + ev.name : "ช่วงไม่มีงาน");
  return `<button class="item" data-act="buy" data-id="${p.id}">
    <span class="grow"><span class="t">${esc(p.note || "ซื้อของ")}</span><br><span class="s">${bits.map(esc).join(" · ")}</span></span>
    <span class="amt num">${baht(p.amount)}</span></button>`;
}

function homeLedgerRow(x){
  const isIn = x.type === "in";
  return `<button class="item" data-act="home-pay" data-id="${x.id}">
    <span class="grow"><span class="t">${esc(x.note || (isIn ? "รับเข้า" : "จ่ายออก"))}</span><br><span class="s">${thDate(x.date)}</span></span>
    <span class="amt num" style="color:${isIn ? "var(--good)" : "inherit"}">${baht(isIn ? x.amount : -x.amount)}</span></button>`;
}

function eventsView(){
  const evs = sortedEvents();
  return `<div class="grid"><div class="actions"><button class="btn primary wide" data-act="new-ev"><span class="plus">+</span> สร้างงานใหม่</button></div>
  <section class="card"><h2 class="h2">งานทั้งหมด <small>${evs.length} งาน</small></h2><div class="list">
  ${evs.length ? evs.map(e => { const c = evCalc(e); return `<button class="item" data-act="open-ev" data-ev="${e.id}">
    <span class="grow"><span class="t">${esc(e.name)}</span> <span class="pill ${e.status}">${e.status === "open" ? "กำลังขาย" : "จบแล้ว"}</span><br>
      <span class="s">${c.first ? `${thShort(c.first)} – ${thShort(c.last)} · ${c.span} วัน` : "ยังไม่มียอดขาย"}${c.missing.length ? ` · <span style="color:var(--warn)">ยังไม่ใส่${c.missing.join(", ")}</span>` : ""}</span></span>
    <span style="text-align:right"><span class="amt num">${baht(c.sales)}</span><br><span class="s num">กำไร ${baht(c.profit)}</span></span>
    <span class="chev">›</span></button>`; }).join("") : `<div class="empty">ยังไม่มีงาน กด “สร้างงานใหม่” ได้เลย</div>`}
  </div></section></div>`;
}

function eventPage(ev, home){
  const c = evCalc(ev);
  const days = [...ev.days].sort((a, b) => b.date.localeCompare(a.date));
  const buys = state.purchases.filter(p => p.eventId === ev.id).sort((a, b) => b.date.localeCompare(a.date));
  const firstDate = c.first;
  const todayEntry = ev.days.find(d => d.date === today());
  const isOpen = ev.status === "open";
  const todayCard = isOpen ? `<section class="card live">
      <div class="label">ยอดขายวันนี้ · ${thDate(today())}</div>
      <div class="today num ${todayEntry ? "" : "none"}">${todayEntry ? baht(todayEntry.amount) : "ยังไม่ได้ใส่"}</div>
      ${todayEntry ? `<div class="label" style="margin:-4px 0 10px">กันไว้เป็นค่าแรงตัวเองวันนี้ ${baht(S().wagePerDay)} ก่อนใช้เงินร้านนะแม่</div>` : ""}
      <button class="btn primary huge-btn" data-act="sale" data-ev="${ev.id}" ${todayEntry ? `data-id="${todayEntry.id}"` : ""}><span class="plus">${todayEntry ? "✎" : "+"}</span> ${todayEntry ? "แก้ยอดขายวันนี้" : "ใส่ยอดขายวันนี้"}</button>
      <div class="pair">
        <div class="stat"><div class="label">ขายรวมงานนี้</div><div class="v num">${baht(c.sales)}</div></div>
        <div class="stat"><div class="label">ขายมาแล้ว</div><div class="v num">${c.span} วัน</div></div>
      </div>
    </section>` : "";
  const buyBlock = home ? `${walletCard(eventWallet(c))}
      <button class="btn soft huge-btn" data-act="buy" data-ev="${ev.id}"><span class="plus">+</span> บันทึกซื้อของ</button>
      ${homeMini(totals())}` : "";
  return `${home ? "" : `<button class="back" data-act="back">‹ กลับ</button>`}
  <div class="dhead"><div>${home ? `<div class="label">งานที่กำลังขาย</div>` : ""}<h2>${esc(ev.name)}</h2><div class="label">${esc(ev.place || "")}${ev.place && c.first ? " · " : ""}${c.first ? `${thShort(c.first)} – ${thShort(c.last)} (${c.span} วัน)` : ""}</div></div>
    <span class="pill ${ev.status}">${isOpen ? "กำลังขาย" : "จบแล้ว"}</span></div>
  <div class="grid detail">
    <div class="col">
      ${todayCard}
      ${buyBlock}
      <section class="card"><h2 class="h2">ยอดขายรายวัน <small>รวม ${baht(c.sales)}</small></h2>
        ${isOpen ? "" : `<button class="btn primary" style="width:100%" data-act="sale" data-ev="${ev.id}"><span class="plus">+</span> ใส่ยอดขาย</button>`}
        <div class="list" style="margin-top:6px">${days.length ? days.map(d => `<button class="item" data-act="sale" data-ev="${ev.id}" data-id="${d.id}">
          <span class="grow"><span class="t">วันที่ ${Math.round((new Date(d.date) - new Date(firstDate)) / 864e5) + 1}</span><br><span class="s">${thDate(d.date)}</span></span>
          <span class="amt num">${baht(d.amount)}</span></button>`).join("") : `<div class="empty">ยังไม่มียอดขาย</div>`}</div>
        ${isOpen ? `<button class="btn ghost" data-act="sale" data-ev="${ev.id}">+ ใส่ยอดของวันอื่น (ลืมใส่)</button>` : ""}
      </section>
    </div>
    <div class="col">
      <section class="card"><h2 class="h2">สรุปเงินงานนี้</h2>
        <div class="ledger num">
          <div class="r"><span>ยอดขาย</span><span>${baht(c.sales)}</span></div>
          <div class="r minus"><span>− ต้นทุนของที่ขายไป (${S().costPct}%)</span><span>${baht(c.goods)}</span></div>
          <div class="r minus"><span>− ค่าใช้จ่ายงาน</span><span>${baht(c.fixed)}</span></div>
          ${c.missing.length ? `<div class="note" style="color:var(--warn)">ยังไม่ใส่${c.missing.join(", ")} กำไรจริงอาจน้อยกว่านี้</div>` : ""}
          <div class="r total"><span>กำไรงานนี้</span><span style="color:${c.profit < 0 ? "var(--bad)" : "inherit"}">${baht(c.profit)}</span></div>
        </div>
      </section>
      <section class="card"><h2 class="h2">ค่าใช้จ่ายงาน <small>ใส่ทีหลังได้ · ไม่มีใส่ 0</small></h2>
        <div class="costs">${COSTS.map(([k, l]) => `<div class="field"><label for="c-${k}">${l}</label>
          <input class="in num" id="c-${k}" inputmode="numeric" placeholder="ยังไม่ใส่" data-cost="${k}" data-ev="${ev.id}" value="${ev.costs[k] == null ? "" : fmt(ev.costs[k])}"></div>`).join("")}</div>
      </section>
      <section class="card"><h2 class="h2">ซื้อของระหว่างงานนี้ <small>ได้งบจากงานนี้ ${baht(c.budget)}</small></h2>
        <div class="list">${buys.length ? buys.map(purchaseRow).join("") : `<div class="empty">ยังไม่ได้ซื้อของระหว่างงานนี้</div>`}</div>
        ${home ? "" : `<button class="btn ghost" data-act="buy" data-ev="${ev.id}">+ บันทึกซื้อของระหว่างงานนี้</button>`}
      </section>
      <div class="actions">
        <button class="btn soft" data-act="share" data-ev="${ev.id}">ข้อความส่ง LINE</button>
        <button class="btn soft" data-act="toggle-ev" data-ev="${ev.id}">${isOpen ? "จบงานนี้" : "เปิดงานอีกครั้ง"}</button>
        <button class="btn soft wide" data-act="edit-ev" data-ev="${ev.id}">แก้ชื่องาน / สถานที่</button>
      </div>
    </div>
  </div>`;
}

function settingsView(){
  const s = S();
  const f = (k, l, help) => `<div class="field"><label for="s-${k}">${l}</label>
    <input class="in num" id="s-${k}" inputmode="numeric" data-set="${k}" value="${fmt(s[k] || 0)}">${help ? `<p>${help}</p>` : ""}</div>`;
  return `<div class="grid"><section class="card set" style="display:grid;gap:16px">
    <h2 class="h2" style="margin:0">กติกาเงินซื้อของ</h2>
    ${f("costPct", "ต้นทุนของ (% ของราคาขาย)", "ของทุน 100 บาท บวกกำไรแล้วขาย 150 บาท = ต้นทุนคิดเป็น 67%")}
    ${f("buyPct", "เติมของได้กี่ % ของที่ขายออกไป", "100% = ของในร้านเท่าเดิม · ต่ำกว่า 100% = ค่อยๆ ดึงเงินออกจากสต๊อก")}
    <div class="formula">ขายได้ 100 บาท → ซื้อของได้ ${Math.round(buyRate() * 100)} บาท</div>
    <p class="label" style="margin:0">งบซื้อของคิดต่องานเท่านั้น ซื้อของก่อนงานเริ่มก็จดผูกกับงานนั้นได้เลย ไม่ต้องรองบสะสม</p>
    ${f("startBudget", "งบซื้อของยกมา (บาท)", "ถ้าเริ่มจดตอนที่มีเงินสำรองไว้ซื้อของอยู่แล้ว ใส่ตรงนี้ ถ้าไม่มีใส่ 0 · ใช้กับงานแรกที่สร้าง")}
  </section>
  <section class="card set" style="display:grid;gap:16px">
    <h2 class="h2" style="margin:0">ค่าแรงตัวเอง</h2>
    ${f("wagePerDay", "ค่าแรงตัวเองต่อวัน (บาท)", "แค่ข้อความเตือนตอนใส่ยอดขาย ไม่ได้หักหรือโอนเงินให้อัตโนมัติ แม่ต้องแยกเงินเองตามนี้")}
  </section>
  <section class="card set" style="display:grid;gap:16px">
    <h2 class="h2" style="margin:0">ความฝันและข้อความถึงแม่</h2>
    <div class="field"><label for="s-dream">ความฝันของเรา</label>
      <input class="in" id="s-dream" data-text="dream" value="${esc(s.dream || "")}" placeholder="เช่น บ้านของเรา"><p>ขึ้นบนหน้าหลักทุกครั้งที่แม่เปิดแอป</p></div>
    <div class="field"><label for="s-notes">ข้อความจากลูก (บรรทัดละ 1 ข้อความ)</label>
      <textarea class="in notes" id="s-notes" data-text="notes">${esc((s.notes || []).join("\n"))}</textarea><p>แอปจะเปลี่ยนข้อความให้วันละข้อความ</p></div>
  </section>
  <section class="card set" style="display:grid;gap:16px">
    <h2 class="h2" style="margin:0">เชื่อมข้อมูลออนไลน์</h2>
    <div class="field"><label for="s-api">ลิงก์เชื่อมข้อมูล (Apps Script Web App URL)</label>
      <input class="in" id="s-api" data-api="1" placeholder="https://script.google.com/macros/s/xxx/exec" value="${esc(apiUrl)}">
      <p>วางลิงก์จากขั้นตอน deploy Apps Script (ดู apps_script/README.md) ทีเดียว เครื่องนี้จะจำไว้แล้วซิงก์ข้อมูลให้เอง เปิดจากเครื่องอื่นด้วยลิงก์เดียวกันก็เห็นข้อมูลเดียวกัน</p>
    </div>
  </section>
  <section class="card"><h2 class="h2">ข้อมูล</h2>
    <p class="label" style="margin:0 0 8px">${isSample ? "ตอนนี้เป็นข้อมูลตัวอย่าง" : apiUrl ? "บันทึกออนไลน์ เปิดจากเครื่องอื่นก็เห็นข้อมูลเดียวกัน" : "บันทึกไว้ในเครื่องนี้เครื่องเดียว ยังไม่เชื่อมออนไลน์"}</p>
    ${isSample ? `<button class="btn primary" style="width:100%" data-act="start-real">ล้างตัวอย่าง เริ่มใช้จริง</button>` : `<button class="btn danger" data-act="wipe">ลบข้อมูลทั้งหมด</button>`}
  </section></div>`;
}

/* ---------- sheets ---------- */
function openSheet(html, onMount){
  $("#sheet-root").innerHTML = `<div class="scrim" data-act="close-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
  const first = $(".sheet [autofocus]") || $(".sheet input");
  if (onMount) onMount();
  if (first) setTimeout(() => first.focus(), 60);
}
function closeSheet(){ $("#sheet-root").innerHTML = ""; render(); }

function saleSheet(evId, entryId){
  const ev = state.events.find(e => e.id === evId) || openEvents()[0];
  if (!ev) { toast("สร้างงานก่อน แล้วค่อยใส่ยอดขาย"); return newEventSheet(); }
  const entry = ev.days.find(d => d.id === entryId);
  const choices = sortedEvents();
  openSheet(`<h3>${entry ? "แก้ยอดขาย" : "ใส่ยอดขาย"}</h3>
    <div class="field"><label for="f-ev">งาน</label><select class="in" id="f-ev">${choices.map(e => `<option value="${e.id}" ${e.id === ev.id ? "selected" : ""}>${esc(e.name)}${e.status === "closed" ? " (จบแล้ว)" : ""}</option>`).join("")}</select></div>
    <div class="field"><label for="f-date">วันที่</label><input class="in" type="date" id="f-date" value="${entry ? entry.date : today()}"></div>
    <div class="field"><label for="f-amt">ยอดขายวันนั้น (บาท)</label><input class="in huge" id="f-amt" inputmode="numeric" autofocus placeholder="0" value="${entry ? fmt(entry.amount) : ""}"></div>
    <div id="f-hint"></div>
    <div class="foot">${entry ? `<button class="btn danger" data-act="del-sale" data-ev="${ev.id}" data-id="${entry.id}">ลบ</button>` : `<button class="btn soft" data-act="close">ยกเลิก</button>`}
      <button class="btn primary" data-act="save-sale" data-id="${entry ? entry.id : ""}">บันทึก</button></div>`, () => {
    const upd = () => { const n = toNum($("#f-amt").value); $("#f-hint").innerHTML = n
      ? `<div class="hint good">ได้งบซื้อของเพิ่ม <b class="num">${baht(n * buyRate())}</b></div>
         <div class="label" style="margin-top:6px">อย่าลืมกันไว้เป็นค่าแรงตัวเองวันนี้ <b>${baht(S().wagePerDay)}</b> ก่อนใช้เงินร้านนะแม่</div>` : ""; };
    $("#f-amt").addEventListener("input", upd); upd();
  });
}

function buySheet(purchaseId, evId){
  const p = state.purchases.find(x => x.id === purchaseId);
  const defEv = p ? p.eventId : (evId || openEvents()[0]?.id || "");
  const picked = new Set((p?.note || "").split(",").map(s => s.trim()).filter(Boolean));
  const shops = shopHistory();
  const curShop = p?.shop || "";
  const isNewShop = curShop && !shops.includes(curShop);
  openSheet(`<h3>${p ? "แก้รายการซื้อของ" : "บันทึกซื้อของ"}</h3>
    <div class="field"><label for="f-ev">ซื้อระหว่างงาน</label><select class="in" id="f-ev"><option value="">ไม่อยู่ในงานไหน (ยังไม่รู้ว่าจะไปงานไหน)</option>${sortedEvents().map(e => `<option value="${e.id}" ${e.id === defEv ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select></div>
    <div id="f-hint"></div>
    <div class="field"><label for="f-amt">จ่ายไปทั้งหมด (บาท)</label><input class="in huge" id="f-amt" inputmode="numeric" autofocus placeholder="0" value="${p ? fmt(p.amount) : ""}"></div>
    <div class="field"><label>ซื้อจากร้านไหน (ไม่ต้องเลือกก็ได้)</label>
      <div class="chips" id="shop-chips">${shops.map(s => `<button class="chip" type="button" data-act="shop-chip" data-shop="${esc(s)}" aria-pressed="${s === curShop ? "true" : "false"}">${esc(s)}</button>`).join("")}<button class="chip" type="button" data-act="shop-new" aria-pressed="${isNewShop ? "true" : "false"}">+ ร้านใหม่</button></div>
      <div id="shop-new-field" style="margin-top:8px" ${isNewShop ? "" : "hidden"}><input class="in" id="f-shop-new" placeholder="ชื่อร้าน เช่น ผ้าเด็กประตูน้ำ" value="${isNewShop ? esc(curShop) : ""}"></div>
    </div>
    <div class="field"><label>ซื้ออะไรบ้าง (ไม่ต้องเลือกก็ได้)</label><div class="chips">${KINDS.map(k => `<button class="chip" type="button" data-act="chip" aria-pressed="${picked.has(k)}">${k}</button>`).join("")}</div></div>
    <div class="field"><label for="f-date">วันที่ซื้อ</label><input class="in" type="date" id="f-date" value="${p ? p.date : today()}"></div>
    <div class="foot">${p ? `<button class="btn danger" data-act="del-buy" data-id="${p.id}">ลบ</button>` : `<button class="btn soft" data-act="close">ยกเลิก</button>`}
      <button class="btn primary" data-act="save-buy" data-id="${p ? p.id : ""}">บันทึก</button></div>`, () => {
    const calcBase = () => {
      const sel = state.events.find(e => e.id === $("#f-ev").value);
      if (!sel) return null;
      const c = evCalc(sel);
      const already = state.purchases.filter(x => x.eventId === sel.id && x.id !== (p ? p.id : null)).reduce((a, x) => a + x.amount, 0);
      return c.budget - already;
    };
    const upd = () => {
      const base = calcBase();
      if (base == null) { $("#f-hint").innerHTML = `<div class="hint info">ยังไม่ได้ผูกกับงานไหน เลยยังไม่มีงบให้เทียบ เลือกงานด้านบนได้นะ</div>`; return; }
      const n = toNum($("#f-amt").value) || 0;
      if (!n) { $("#f-hint").innerHTML = `<div class="hint info">งานนี้ซื้อของได้อีกไม่เกิน <b class="num">${baht(base)}</b></div>`; return; }
      const left = base - n;
      $("#f-hint").innerHTML = left >= 0 ? `<div class="hint good">ซื้อแล้วงบงานนี้ยังเหลือ <b class="num">${baht(left)}</b></div>`
        : `<div class="hint bad"><b>เกินงบงานนี้ ${baht(-left)}</b><br>ต้องขายงานนี้ได้อีก ${baht(-left / buyRate())} เงินถึงจะกลับมา ลองลดจำนวนที่ซื้อดูก่อนไหม<br>นึกถึง${esc(S().dream || "บ้านของเรา")}ก่อนนะแม่</div>`;
    };
    $("#f-amt").addEventListener("input", upd);
    $("#f-ev").addEventListener("change", upd);
    upd();
  });
}

function homeSheet(entryId, defaultType){
  const x = state.homeLedger.find(e => e.id === entryId);
  const t = totals();
  const type = x ? x.type : (defaultType || "out");
  const picked = new Set((x?.note || "").split(",").map(s => s.trim()).filter(Boolean));
  openSheet(`<h3>${x ? "แก้รายการ" : "จดบัญชีเงินบ้าน"}</h3>
    <div class="hint info">ตอนนี้ร้านมีเงินสดอยู่ประมาณ <b class="num">${baht(t.cash)}</b></div>
    <div class="field"><label>รายการนี้เป็น</label>
      <div class="seg">
        <button type="button" class="seg-btn" data-act="ledger-type" data-type="in" aria-pressed="${type === "in" ? "true" : "false"}">รับเข้า</button>
        <button type="button" class="seg-btn" data-act="ledger-type" data-type="out" aria-pressed="${type === "out" ? "true" : "false"}">จ่ายออก</button>
      </div>
    </div>
    <div class="field"><label for="f-amt">จำนวนเงิน (บาท)</label><input class="in huge" id="f-amt" inputmode="numeric" autofocus placeholder="0" value="${x ? fmt(x.amount) : ""}"></div>
    <div class="field"><label>รายการ (ไม่ต้องเลือกก็ได้)</label>
      <div class="chips" id="in-chips" ${type === "in" ? "" : "hidden"}>${HOME_IN_KINDS.map(k => `<button class="chip" type="button" data-act="chip" aria-pressed="${picked.has(k)}">${k}</button>`).join("")}</div>
      <div class="chips" id="out-chips" ${type === "out" ? "" : "hidden"}>${HOME_OUT_KINDS.map(k => `<button class="chip" type="button" data-act="chip" aria-pressed="${picked.has(k)}">${k}</button>`).join("")}</div>
    </div>
    <div class="field"><label for="f-date">วันที่</label><input class="in" type="date" id="f-date" value="${x ? x.date : today()}"></div>
    <div class="foot">${x ? `<button class="btn danger" data-act="del-home" data-id="${x.id}">ลบ</button>` : `<button class="btn soft" data-act="close">ยกเลิก</button>`}
      <button class="btn primary" data-act="save-home" data-id="${x ? x.id : ""}">บันทึก</button></div>`);
}

function newEventSheet(evId){
  const ev = state.events.find(e => e.id === evId);
  openSheet(`<h3>${ev ? "แก้ข้อมูลงาน" : "สร้างงานใหม่"}</h3>
    <div class="field"><label for="f-name">ชื่องาน</label><input class="in" id="f-name" autofocus placeholder="เช่น กาชาดชลบุรี" value="${esc(ev?.name || "")}"></div>
    <div class="field"><label for="f-place">สถานที่ (ไม่ใส่ก็ได้)</label><input class="in" id="f-place" placeholder="เช่น ลานหน้าศาลากลาง" value="${esc(ev?.place || "")}"></div>
    ${ev ? "" : `<details><summary>ใส่ค่าใช้จ่ายงานตอนนี้เลย (ใส่ทีหลังได้)</summary>
      <div class="costs" style="margin-top:10px">${COSTS.map(([k, l]) => `<div class="field"><label for="n-${k}">${l}</label><input class="in num" id="n-${k}" inputmode="numeric" placeholder="ยังไม่ใส่"></div>`).join("")}</div></details>`}
    <div id="f-err"></div>
    <div class="foot">${ev ? `<button class="btn danger" data-act="del-ev" data-ev="${ev.id}">ลบงาน</button>` : `<button class="btn soft" data-act="close">ยกเลิก</button>`}
      <button class="btn primary" data-act="save-ev" data-ev="${ev ? ev.id : ""}">${ev ? "บันทึก" : "สร้างงาน"}</button></div>`);
}

function shareSheet(ev){
  const c = evCalc(ev);
  const t = totals();
  const w = eventWallet(c);
  const text = [`📍 ${ev.name}${ev.status === "closed" ? " จบแล้ว" : ` (ขายมา ${c.span} วัน)`}`,
    `ขายได้ ${baht(c.sales)}`,
    `กำไรประมาณ ${baht(c.profit)}${c.missing.length ? ` (ยังไม่รวม${c.missing.join(", ")})` : ""}`,
    w.wallet >= 0 ? `🛒 งานนี้ซื้อของได้ไม่เกิน ${baht(w.wallet)}` : `🛑 งานนี้ซื้อของเกินงบ ${baht(-w.wallet)} รอขายเพิ่มก่อนนะ`,
    `💰 ร้านมีเงินสดอยู่ประมาณ ${baht(t.cash)}`,
    t.home.balance >= 0 ? `🏠 บัญชีเงินบ้านคงเหลือ ${baht(t.home.balance)}` : `🏠 บัญชีเงินบ้านติดลบ ${baht(-t.home.balance)}`].join("\n");
  openSheet(`<h3>ข้อความส่ง LINE</h3><textarea class="in" id="f-text" readonly>${esc(text)}</textarea>
    <div class="foot"><button class="btn soft" data-act="close">ปิด</button><button class="btn primary" data-act="copy">คัดลอกข้อความ</button></div>`);
}

/* ---------- actions ---------- */
let toastTimer;
function toast(msg){ let el = $(".toast"); if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 2400); }

document.addEventListener("click", async ev => {
  const el = ev.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act;
  if (a === "close-bg") { if (ev.target === el) closeSheet(); return; }
  if (a === "close") return closeSheet();
  if (a === "tab") { view.tab = el.dataset.tab; view.eventId = null; render(); scrollTo(0, 0); return; }
  if (a === "open-ev") { view.eventId = el.dataset.ev; render(); scrollTo(0, 0); return; }
  if (a === "home-ev") { view.homeEv = el.dataset.ev; render(); return; }
  if (a === "back") { view.eventId = null; render(); return; }
  if (a === "sale") return saleSheet(el.dataset.ev, el.dataset.id);
  if (a === "buy") return buySheet(el.dataset.id, el.dataset.ev);
  if (a === "home-pay") return homeSheet(el.dataset.id, el.dataset.type);
  if (a === "new-ev") return newEventSheet();
  if (a === "edit-ev") return newEventSheet(el.dataset.ev);
  if (a === "share") return shareSheet(state.events.find(e => e.id === el.dataset.ev));
  if (a === "chip") { el.setAttribute("aria-pressed", el.getAttribute("aria-pressed") !== "true"); return; }
  if (a === "ledger-type") {
    document.querySelectorAll('.seg-btn').forEach(b => b.setAttribute("aria-pressed", "false"));
    el.setAttribute("aria-pressed", "true");
    const show = el.dataset.type;
    const inC = $("#in-chips"), outC = $("#out-chips");
    if (inC) inC.hidden = show !== "in";
    if (outC) outC.hidden = show !== "out";
    return;
  }
  if (a === "shop-chip" || a === "shop-new") {
    document.querySelectorAll('#shop-chips .chip').forEach(c => c.setAttribute("aria-pressed", "false"));
    el.setAttribute("aria-pressed", "true");
    const nf = $("#shop-new-field");
    if (a === "shop-new") { if (nf) { nf.hidden = false; $("#f-shop-new")?.focus(); } }
    else if (nf) nf.hidden = true;
    return;
  }
  if (a === "copy") { const ta = $("#f-text"); try { await navigator.clipboard.writeText(ta.value); toast("คัดลอกแล้ว ไปวางใน LINE ได้เลย"); } catch(e) { ta.focus(); ta.select(); toast("กดค้างที่ข้อความแล้วเลือกคัดลอก"); } return; }
  if (a === "start-real") {
    if (!confirm("ล้างข้อมูลตัวอย่าง แล้วเริ่มจดของจริงเลยไหม")) return;
    state = blank(); isSample = false; view.eventId = null; view.tab = "home"; return commit("เริ่มใช้จริงแล้ว สร้างงานแรกได้เลย");
  }
  if (a === "wipe") { if (!confirm("ลบข้อมูลทั้งหมด? ลบแล้วเอากลับมาไม่ได้")) return; state = blank(); view.eventId = null; return commit("ลบข้อมูลแล้ว"); }

  if (a === "save-sale") {
    const amt = toNum($("#f-amt").value), date = $("#f-date").value, target = state.events.find(e => e.id === $("#f-ev").value);
    if (amt == null || !date || !target) { $("#f-hint").innerHTML = `<div class="hint bad">ใส่ยอดขายเป็นตัวเลข และเลือกวันที่ก่อน</div>`; return; }
    for (const e of state.events) { const i = e.days.findIndex(d => d.id === el.dataset.id); if (i > -1) e.days.splice(i, 1); }
    const same = target.days.find(d => d.date === date);
    if (same) same.amount = amt; else target.days.push({ id: uid(), date, amount: amt });
    $("#sheet-root").innerHTML = ""; return commit(same ? `แก้ยอด ${thShort(date)} เป็น ${baht(amt)} แล้ว` : `บันทึกยอดขาย ${baht(amt)} แล้ว`);
  }
  if (a === "del-sale") { const e = state.events.find(x => x.id === el.dataset.ev); e.days = e.days.filter(d => d.id !== el.dataset.id); $("#sheet-root").innerHTML = ""; return commit("ลบยอดขายแล้ว"); }

  if (a === "save-buy") {
    const amt = toNum($("#f-amt").value), date = $("#f-date").value;
    if (!amt || !date) { $("#f-hint").innerHTML = `<div class="hint bad">ใส่จำนวนเงินที่จ่ายไปก่อน</div>`; return; }
    const note = [...document.querySelectorAll('.chips:not(#shop-chips) > .chip[aria-pressed="true"]')].map(c => c.textContent).join(", ");
    const shopChip = document.querySelector('#shop-chips .chip[data-shop][aria-pressed="true"]');
    const shopNewOpen = $("#shop-new-field") && !$("#shop-new-field").hidden;
    const shop = shopChip ? shopChip.dataset.shop : (shopNewOpen ? ($("#f-shop-new")?.value || "").trim() : "");
    const rec = { id: el.dataset.id || uid(), date, amount: amt, note, eventId: $("#f-ev").value || null, shop };
    const i = state.purchases.findIndex(p => p.id === rec.id); if (i > -1) state.purchases[i] = rec; else state.purchases.push(rec);
    $("#sheet-root").innerHTML = "";
    const savedEv = state.events.find(x => x.id === rec.eventId);
    const left = savedEv ? eventWallet(evCalc(savedEv)).wallet : null;
    return commit(left == null ? "บันทึกแล้ว" : left >= 0 ? `บันทึกแล้ว งบงานนี้เหลือ ${baht(left)}` : `บันทึกแล้ว งบงานนี้เกิน ${baht(-left)}`);
  }
  if (a === "del-buy") { state.purchases = state.purchases.filter(p => p.id !== el.dataset.id); $("#sheet-root").innerHTML = ""; return commit("ลบรายการซื้อของแล้ว"); }

  if (a === "save-home") {
    const amt = toNum($("#f-amt").value), date = $("#f-date").value;
    const type = document.querySelector('.seg-btn[aria-pressed="true"]')?.dataset.type || "out";
    if (!amt || !date) { return; }
    const note = [...document.querySelectorAll(`#${type}-chips .chip[aria-pressed="true"]`)].map(c => c.textContent).join(", ");
    const rec = { id: el.dataset.id || uid(), date, amount: amt, note, type };
    const i = state.homeLedger.findIndex(x => x.id === rec.id); if (i > -1) state.homeLedger[i] = rec; else state.homeLedger.push(rec);
    $("#sheet-root").innerHTML = ""; const bal = totals().home.balance;
    return commit(bal >= 0 ? `บันทึกแล้ว บัญชีเงินบ้านคงเหลือ ${baht(bal)}` : `บันทึกแล้ว บัญชีเงินบ้านติดลบ ${baht(-bal)}`);
  }
  if (a === "del-home") { state.homeLedger = state.homeLedger.filter(x => x.id !== el.dataset.id); $("#sheet-root").innerHTML = ""; return commit("ลบรายการแล้ว"); }

  if (a === "save-ev") {
    const name = $("#f-name").value.trim();
    if (!name) { $("#f-err").innerHTML = `<div class="hint bad">ใส่ชื่องานก่อน</div>`; return; }
    const place = $("#f-place").value.trim();
    const existing = state.events.find(e => e.id === el.dataset.ev);
    if (existing) { existing.name = name; existing.place = place; $("#sheet-root").innerHTML = ""; return commit("แก้ข้อมูลงานแล้ว"); }
    const costs = {}; COSTS.forEach(([k]) => costs[k] = toNum($("#n-" + k)?.value));
    const e = { id: uid(), name, place, status: "open", created: today(), costs, days: [] };
    state.events.push(e); view.eventId = null; view.tab = "home"; view.homeEv = e.id; $("#sheet-root").innerHTML = ""; return commit(`สร้างงาน “${name}” แล้ว`);
  }
  if (a === "del-ev") {
    if (!confirm("ลบงานนี้และยอดขายทั้งหมดของงาน? ลบแล้วเอากลับมาไม่ได้")) return;
    state.events = state.events.filter(e => e.id !== el.dataset.ev);
    state.purchases.forEach(p => { if (p.eventId === el.dataset.ev) p.eventId = null; });
    view.eventId = null; $("#sheet-root").innerHTML = ""; return commit("ลบงานแล้ว");
  }
  if (a === "toggle-ev") {
    const e = state.events.find(x => x.id === el.dataset.ev); e.status = e.status === "open" ? "closed" : "open";
    commit(e.status === "closed" ? "จบงานแล้ว" : "เปิดงานอีกครั้งแล้ว");
    if (e.status === "closed") shareSheet(e);
  }
});

document.addEventListener("change", ev => {
  const t = ev.target;
  if (t.dataset.cost) {
    const e = state.events.find(x => x.id === t.dataset.ev); if (!e) return;
    e.costs[t.dataset.cost] = toNum(t.value); commit("บันทึกค่าใช้จ่ายแล้ว");
  }
  if (t.dataset.text) {
    const k = t.dataset.text;
    state.settings[k] = k === "notes" ? t.value.split("\n").map(x => x.trim()).filter(Boolean) : t.value.trim();
    commit("บันทึกแล้ว");
  }
  if (t.dataset.set) {
    let n = toNum(t.value) ?? 0;
    if (t.dataset.set === "costPct" || t.dataset.set === "buyPct") n = Math.min(t.dataset.set === "buyPct" ? 150 : 100, Math.max(1, n));
    state.settings[t.dataset.set] = n; commit("บันทึกการตั้งค่าแล้ว");
  }
  if (t.dataset.api) {
    const v = t.value.trim();
    if (v && !v.startsWith("https://script.google.com/")) { toast("ลิงก์ควรขึ้นต้นด้วย https://script.google.com/..."); t.value = apiUrl; return; }
    connectApi(v);
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && $(".scrim")) closeSheet(); });

render();
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
