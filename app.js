/* ==========================================================================
   UFC Career — redesign demo interactions
   - guided quest-rail with locked/unlocked/current/done states + progression
   - belt progress simulation
   - EN / 中文 toggle (onboarding rail + key copy)
   - video modal + celebratory toast
   ========================================================================== */

/* ---------- quest steps (bilingual) ---------- */
const STEPS = [
  { kicker:{en:"Watch first · 2 min",zh:"先看 · 2 分钟"}, video:true,
    title:{en:"How Unity works",zh:"Unity 是怎么运作的"},
    desc:{en:"Belts, funded accounts, withdrawals — the whole game in 2 minutes. Start here.",zh:"腰带、资助账户、提现 —— 2 分钟看懂整个玩法。从这里开始。"},
    cta:{en:"▶ Watch now",zh:"▶ 立即观看"}, reward:600 },
  { kicker:{en:"Set up",zh:"设置"},
    title:{en:"Register FundedXYZ & link your UID",zh:"注册 FundedXYZ 并绑定你的 UID"},
    desc:{en:"Create your funded-challenge account and connect it so every withdrawal counts toward your belt.",zh:"创建你的资助挑战账户并连接，让每一笔提现都计入你的腰带进度。"},
    cta:{en:"Link my UID →",zh:"绑定我的 UID →"}, reward:800 },
  { kicker:{en:"Watch · 3 min",zh:"观看 · 3 分钟"}, video:true,
    title:{en:"Pass your first challenge",zh:"通过你的第一个挑战"},
    desc:{en:"The 3 rules that get you funded — drawdown, targets, discipline. Watch before you trade.",zh:"让你获得资助的 3 条规则 —— 回撤、目标、纪律。交易前先看。"},
    cta:{en:"▶ Watch now",zh:"▶ 立即观看"}, reward:900 },
  { kicker:{en:"Free lesson",zh:"免费课程"},
    title:{en:"Start Stage 1: Discover (free)",zh:"开始 阶段 1：发现（免费）"},
    desc:{en:"Your first real lesson — unlocked free. No paywall to get moving.",zh:"你的第一节真正的课程 —— 免费解锁。没有付费墙挡路。"},
    cta:{en:"Open Stage 1 →",zh:"打开阶段 1 →"}, link:"learn.html", reward:1000 },
  { kicker:{en:"Community",zh:"社区"},
    title:{en:"Join the monthly sprint",zh:"加入每月冲刺"},
    desc:{en:"634 traders are pushing toward this month's goal together. Add your name to the sprint.",zh:"634 名交易者正一起冲刺本月目标。把你的名字加入冲刺。"},
    cta:{en:"Join the sprint →",zh:"加入冲刺 →"}, reward:1500 },
  { kicker:{en:"The goal",zh:"目标"},
    title:{en:"Your first withdrawal 🎉",zh:"你的第一笔提现 🎉"},
    desc:{en:"Cash out real profit and lock in your White belt — the community feed cheers you on.",zh:"提取真实利润，锁定你的白带 —— 社区动态为你欢呼。"},
    cta:{en:"Submit withdrawal →",zh:"提交提现 →"}, reward:2000 }
];

/* ---------- i18n dictionary (page chrome) ---------- */
const I18N = {
  nav_home:{en:"Home",zh:"首页"}, nav_earn:{en:"Earn",zh:"赚取"}, nav_community:{en:"Community",zh:"社区"}, nav_learn:{en:"Learn",zh:"学习"},
  discord:{en:"Community",zh:"社区"},
  belt_white:{en:"White Trader",zh:"白带交易者"}, belt_next:{en:"Next: Yellow Trader",zh:"下一级：黄带"},
  hero_h1:{en:"You're a White Trader.<br>Your next belt is Yellow.",zh:"你现在是白带交易者。<br>下一条腰带是黄带。"},
  hero_sub:{en:"One clear path. Follow the steps below to reach Yellow Trader — and you're withdrawing profit before you know it. No guessing which of 10 menus to open.",zh:"一条清晰的路径。按下面的步骤走向黄带 —— 不知不觉你就开始提现盈利了。不用再猜该点开 10 个菜单里的哪一个。"},
  withdrawn:{en:"Withdrawn so far",zh:"累计提现"}, to_yellow:{en:"to Yellow",zh:"到黄带"},
  you_here:{en:"YOU ARE HERE",zh:"你在这里"},
  cta_continue:{en:"Continue your path →",zh:"继续你的路径 →"}, cta_card:{en:"View my profile card",zh:"查看我的资料卡"},
  rail_h:{en:"Your career path",zh:"你的职业路径"}, rail_step:{en:"Step",zh:"第"}, rail_of:{en:"of",zh:"步 / 共"}, rail_done:{en:"complete",zh:"完成"},
  energy_h:{en:"🔥 Live community energy",zh:"🔥 社区实时动态"}, energy_link:{en:"Open leaderboard →",zh:"打开排行榜 →"},
  sprint_over:{en:"2026 Community Goal",zh:"2026 社区目标"}, sprint_sub:{en:"withdrawn together · 122% of the $10M target smashed",zh:"共同提现 · 已达 $10M 目标的 122%"},
  s_funded:{en:"Funded traders",zh:"资助交易者"}, s_passes:{en:"Challenge passes",zh:"挑战通过"}, s_sprint:{en:"Sept sprint left",zh:"9月冲刺剩余"},
  dist_over:{en:"Belt distribution · 634 traders",zh:"腰带分布 · 634 名交易者"},
  dist_note:{en:"👉 You're 1 of 573 White Traders. 29 made it to Yellow this year — you're closer than you think.",zh:"👉 你是 573 名白带之一。今年有 29 人升到黄带 —— 你比想象中更接近。"},
  lb_over:{en:"Top traders · all-time",zh:"顶尖交易者 · 历史"}, lb_you:{en:"You · David Yang",zh:"你 · David Yang"},
  feed_over:{en:"Recent withdrawals · community",zh:"最近提现 · 社区"},
  earn_h:{en:"💰 Earn · your funded accounts",zh:"💰 赚取 · 你的资助账户"}, earn_link:{en:"Link a UID →",zh:"绑定 UID →"},
  earn_sub:{en:"Complete Step 2 in your path to link your first funded account here. Your recommended prop firm is <b class='gold'>FundedXYZ</b> — one clear choice, not 9 competing logos.",zh:"完成路径中的第 2 步，在这里绑定你的第一个资助账户。推荐的自营公司是 <b class='gold'>FundedXYZ</b> —— 一个明确的选择，而不是 9 个互相竞争的标志。"},
  foot:{en:"UFC Career — redesign demo by Sam for David. Dark visual language + tokens mirrored from app.unitycrypto.com. Mock data, no backend.",zh:"UFC Career —— Sam 为 David 制作的重新设计演示。深色视觉语言与设计变量取自 app.unitycrypto.com。模拟数据，无后端。"},
  modal_done:{en:"✓ Mark watched & continue",zh:"✓ 标记已看并继续"},
  step_here:{en:"YOU ARE HERE",zh:"你在这里"}, step_video:{en:"VIDEO",zh:"视频"},
  step_done:{en:"Done",zh:"已完成"}, step_locked:{en:"Complete the step above to unlock",zh:"完成上一步以解锁"},
  // learn page
  learn_over:{en:"Learn · your curriculum",zh:"学习 · 你的课程"},
  learn_h1:{en:"Stage 1 is free.<br>Earn your way to the rest.",zh:"阶段 1 免费。<br>凭本事解锁其余阶段。"},
  learn_sub:{en:"Nothing here unlocks by waiting. Stage 1 is open right now — watch, learn, act. Later stages unlock as you progress, with the price and payoff shown upfront. No mystery paywall.",zh:"这里没有任何东西靠等待解锁。阶段 1 现在就开放 —— 观看、学习、行动。后续阶段随进度解锁，价格与收益提前公开。没有神秘付费墙。"},
  back_home:{en:"← Back to your path",zh:"← 返回你的路径"}
};

let LANG = localStorage.getItem("ufc_lang") || "en";
const t = (k) => (I18N[k] ? I18N[k][LANG] : k);

/* ---------- progress state (fresh career path on every load) ---------- */
let progress = 0; // completed steps — always starts at the beginning
let withdrawn = 3200;
localStorage.removeItem("ufc_progress"); localStorage.removeItem("ufc_withdrawn");

function saveState(){ /* demo: career path intentionally not persisted */ }

/* ---------- render quest rail ---------- */
function renderRail(){
  const rail = document.getElementById("questRail");
  if(!rail) return;
  rail.innerHTML = "";
  STEPS.forEach((s, i) => {
    let state = "locked";
    if(i < progress) state = "done";
    else if(i === progress) state = "current";
    const el = document.createElement("div");
    el.className = `step ${state}`;
    const nodeInner = state === "done" ? "✓" : (i+1);
    const tags = [];
    if(state === "current") tags.push(`<span class="tag-here">${t("step_here")}</span>`);
    if(s.video) tags.push(`<span class="tag-video">▶ ${t("step_video")}</span>`);
    let action = "";
    if(state === "done"){
      action = `<span class="check-done">✓ ${t("step_done")} · +$${s.reward.toLocaleString()}</span>`;
    } else if(state === "current"){
      action = `<button class="btn btn-gold step-go" data-i="${i}">${s.cta[LANG]}</button>`;
      if(s.video) action += `<span class="lock-note">🎬 2–3 min</span>`;
    } else {
      action = `<span class="lock-note">🔒 ${t("step_locked")}</span>`;
    }
    const videoBlock = (s.video && state === "current") ? `
      <div class="video-ph" data-i="${i}" data-video>
        <div class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        <div class="vt">${s.title[LANG]}</div><div class="vd">${s.kicker[LANG]}</div>
      </div>` : "";
    el.innerHTML = `
      <div class="spine"><div class="node">${nodeInner}</div></div>
      <div class="step-card">
        <div class="step-top">
          <span class="step-kicker">${s.kicker[LANG]}</span>
          ${tags.join(" ")}
        </div>
        <h4>${s.title[LANG]}</h4>
        <div class="desc">${s.desc[LANG]}</div>
        ${videoBlock}
        <div class="step-act">${action}</div>
      </div>`;
    rail.appendChild(el);
  });
  // header progress
  const pct = Math.round((progress/STEPS.length)*100);
  const cur = document.getElementById("stepCur"); if(cur) cur.textContent = Math.min(progress+1, STEPS.length);
  const pctEl = document.getElementById("stepPct"); if(pctEl) pctEl.textContent = pct + "%";
  updateBelt();
  bindStepActions();
}

/* ---------- belt bar ---------- */
function updateBelt(){
  const fillEl = document.getElementById("beltFill");
  const youEl = document.getElementById("beltYou");
  const numEl = document.getElementById("withdrawnNum");
  if(!fillEl) return;
  const capped = Math.min(withdrawn, 10000);
  const pct = Math.round((capped/10000)*100);
  // map to belt track: WHITE segment sits ~17%..33% region; scale within white->yellow
  const trackPct = 17 + (pct/100)*16 + (progress/6)*0; // stays in white-yellow zone visually
  const visual = Math.min(17 + (capped/10000)*16, 33);
  fillEl.style.width = visual + "%";
  youEl.style.left = visual + "%";
  if(numEl) numEl.textContent = "$" + withdrawn.toLocaleString();
}

/* ---------- advance a step ---------- */
function completeStep(i){
  if(i !== progress) return;
  withdrawn += STEPS[i].reward;
  progress++;
  saveState();
  const msgs = LANG === "zh"
    ? ["很好！下一步已解锁 🔓","做得好！继续前进","进度 +1，离黄带更近了","你正在往上爬 🥋","社区为你欢呼 🎉","第一笔提现完成！🏆"]
    : ["Nice! Next step unlocked 🔓","Great move — keep going","+1 progress, closer to Yellow","You're climbing 🥋","The community cheers you on 🎉","First withdrawal done! 🏆"];
  toast(msgs[Math.min(i, msgs.length-1)]);
  renderRail();
  if(progress >= STEPS.length){
    setTimeout(()=>toast(LANG==="zh"?"🎉 白带达成！继续冲刺黄带":"🎉 White belt complete! Now push for Yellow"), 1600);
  }
}

function bindStepActions(){
  document.querySelectorAll(".step-go").forEach(b=>{
    b.onclick = () => {
      const i = +b.dataset.i;
      const s = STEPS[i];
      if(s.link){ location.href = s.link; return; }
      if(s.video){ openVideo(i); return; }
      completeStep(i);
    };
  });
  document.querySelectorAll("[data-video]").forEach(v=>{
    v.onclick = () => openVideo(+v.dataset.i);
  });
}

/* ---------- video modal ---------- */
let pendingVideo = null;
function openVideo(i){
  pendingVideo = i;
  const s = STEPS[i];
  document.getElementById("modalTitle").textContent = s.title[LANG];
  document.getElementById("modalBg").classList.add("show");
}
function closeVideo(complete){
  document.getElementById("modalBg").classList.remove("show");
  if(complete && pendingVideo !== null){ completeStep(pendingVideo); }
  pendingVideo = null;
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg){
  const el = document.getElementById("toast");
  if(!el) return;
  document.getElementById("toastMsg").textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 2600);
}

/* ---------- i18n apply ---------- */
function applyLang(){
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    if(I18N[k]) el.innerHTML = I18N[k][LANG];
  });
  document.querySelectorAll("#lang button").forEach(b=>{
    b.classList.toggle("on", b.dataset.lang === LANG);
  });
  document.documentElement.lang = LANG === "zh" ? "zh" : "en";
  renderRail();
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // lang toggle
  document.querySelectorAll("#lang button").forEach(b=>{
    b.onclick = () => { LANG = b.dataset.lang; localStorage.setItem("ufc_lang", LANG); applyLang(); };
  });
  // modal
  const mc = document.getElementById("modalClose");
  if(mc) mc.onclick = () => closeVideo(true);
  const mb = document.getElementById("modalBg");
  if(mb) mb.onclick = (e)=>{ if(e.target === mb) closeVideo(false); };
  applyLang();
});
