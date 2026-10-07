/* =========================================================
   EDIT THESE
   ========================================================= */
const HER_NAME   = "Priyanka";
const SIGN_OFF   = "Yours, forever";     // e.g. "Yours, Rahul"
const UNLOCK_AT  = new Date("2026-10-08T00:00:00+05:30"); // 8 Oct 2026, 00:00 IST (fixed, whatever her phone timezone is)
const TURN_EVERY = 10;                   // seconds per automatic page turn
const SONG_FILE  = "assets/song.mp3";    // drop a birthday song here; otherwise a built-in music-box tune plays

/* Test helpers:  ?open  -> unlock now      ?in=15 -> unlock in 15 seconds */
const qs = new URLSearchParams(location.search);
let target = UNLOCK_AT.getTime();
if (qs.has("open")) target = Date.now();
if (qs.has("in")) target = Date.now() + (+qs.get("in") || 10) * 1000;

const $ = (id) => document.getElementById(id);

/* ---------- floating hearts / pandas in background ---------- */
(function sky() {
  const bits = ["🐼", "💗", "✨", "🌸", "🎋", "💖", "🐼"];
  const el = $("sky");
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.textContent = bits[i % bits.length];
    s.style.left = Math.random() * 100 + "%";
    s.style.fontSize = 14 + Math.random() * 22 + "px";
    s.style.animationDuration = 12 + Math.random() * 14 + "s";
    s.style.animationDelay = -Math.random() * 20 + "s";
    el.appendChild(s);
  }
})();

/* =========================================================
   LOCK SCREEN + COUNTDOWN
   ========================================================= */
const pad = (n) => String(n).padStart(2, "0");
let unlocked = false;

function tick() {
  const diff = target - Date.now();
  if (diff <= 0) return unlock();
  const s = Math.floor(diff / 1000);
  $("cd").textContent = pad(Math.floor(s / 86400));
  $("ch").textContent = pad(Math.floor((s % 86400) / 3600));
  $("cm").textContent = pad(Math.floor((s % 3600) / 60));
  $("cs").textContent = pad(s % 60);
}
function unlock() {
  if (unlocked) return;
  unlocked = true;
  clearInterval(timer);
  $("padlock").classList.add("open");
  $("lockTitle").textContent = "It's your day! 🎉";
  $("lockSub").textContent = "Happy Birthday, " + HER_NAME + " 🎂";
  $("count").hidden = true;
  $("lockFoot").textContent = "Your gift is ready, tap below 🐼💗";
  $("openBtn").hidden = false;
}
const timer = setInterval(tick, 250);
tick();

$("openBtn").addEventListener("click", () => {
  music.start();
  $("lock").hidden = true;
  $("diary").hidden = false;
  buildBook();
  go(0, true);
});

/* =========================================================
   MUSIC  (song.mp3 if present, else a music-box "Happy Birthday")
   ========================================================= */
const music = (() => {
  let mode = null, audio = null, ctx = null, master = null, on = true, duck = false, started = false;
  const MEL = [ // [midi, beats]
    [67,.75],[67,.25],[69,1],[67,1],[72,1],[71,2],
    [67,.75],[67,.25],[69,1],[67,1],[74,1],[72,2],
    [67,.75],[67,.25],[79,1],[76,1],[72,1],[71,1],[69,2],
    [77,.75],[77,.25],[76,1],[72,1],[74,1],[72,3],
  ];
  const level = () => (!on ? 0 : duck ? 0.06 : 0.22);

  function note(m, t, dur) {
    const f = 440 * Math.pow(2, (m - 69) / 12);
    [[f, "sine", 1], [f * 2, "triangle", 0.35], [f * 3, "sine", 0.1]].forEach(([fr, type, g]) => {
      const o = ctx.createOscillator(), e = ctx.createGain();
      o.type = type; o.frequency.value = fr;
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(g * 0.5, t + 0.01);
      e.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur * 1.6, 0.9));
      o.connect(e); e.connect(master);
      o.start(t); o.stop(t + Math.max(dur * 1.6, 0.9) + 0.05);
    });
  }
  function loopSynth() {
    const beat = 0.62; let t = ctx.currentTime + 0.1;
    MEL.forEach(([m, b]) => { note(m, t, b * beat); t += b * beat; });
    setTimeout(loopSynth, (t - ctx.currentTime + 2.5) * 1000);
  }
  function apply() {
    if (audio) audio.volume = level() / 0.22 * 0.9;
    if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.15);
  }
  async function start() {
    if (started) return; started = true;
    try {
      const r = await fetch(SONG_FILE, { method: "HEAD" });
      if (!r.ok) throw 0;
      audio = new Audio(SONG_FILE); audio.loop = true; mode = "file";
      apply(); await audio.play();
    } catch (e) {
      if (mode === "file") { audio = null; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      mode = "synth"; ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
      master.gain.value = level(); ctx.resume(); loopSynth();
    }
  }
  return {
    start,
    toggle() { on = !on; if (audio) { on ? audio.play() : audio.pause(); } apply(); return on; },
    duck(v) { duck = v; apply(); },
  };
})();
$("musicBtn").addEventListener("click", () => {
  $("musicBtn").classList.toggle("off", !music.toggle());
});

/* =========================================================
   DIARY CONTENT
   ========================================================= */
const panda = (cls = "panda") => `
<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="22" cy="22" r="14" fill="#222"/><circle cx="78" cy="22" r="14" fill="#222"/>
  <ellipse cx="50" cy="55" rx="40" ry="37" fill="#fff" stroke="#222" stroke-width="2"/>
  <ellipse cx="33" cy="52" rx="10" ry="13" fill="#222" transform="rotate(20 33 52)"/>
  <ellipse cx="67" cy="52" rx="10" ry="13" fill="#222" transform="rotate(-20 67 52)"/>
  <circle cx="34" cy="50" r="3.6" fill="#fff"/><circle cx="66" cy="50" r="3.6" fill="#fff"/>
  <ellipse cx="50" cy="63" rx="6" ry="4.5" fill="#222"/>
  <path d="M43 71 q7 7 14 0" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="26" cy="66" r="5" fill="#ff9db8" opacity=".7"/><circle cx="74" cy="66" r="5" fill="#ff9db8" opacity=".7"/>
</svg>`;

const photo = (src, caption, o = {}) => `
  ${o.date ? `<p class="date">${o.date}</p>` : ""}
  <figure class="polaroid ${o.tall ? "tall" : ""}" style="--r:${o.r ?? -2}deg">
    <img src="assets/img/${src}" alt="${caption}" loading="lazy" draggable="false">
    <figcaption>${caption}</figcaption>
  </figure>
  <p class="note">${o.note ?? ""}</p>
  ${o.sticker ?? ""}`;

const video = (src, caption, o = {}) => `
  ${o.date ? `<p class="date">${o.date}</p>` : ""}
  <figure class="polaroid ${o.tall ? "tall" : ""}" style="--r:${o.r ?? 2}deg">
    <div class="vwrap">
      <video src="assets/vid/${src}#t=0.1" ${o.controls ? "controls" : "muted loop"} playsinline preload="metadata" ${o.main ? 'data-main="1"' : ""}></video>
      ${o.controls ? "" : '<button class="snd" type="button">🔇 tap for sound</button>'}
    </div>
    <figcaption>${caption}</figcaption>
  </figure>
  <p class="note">${o.note ?? ""}</p>
  ${o.sticker ?? ""}`;

const stick = (emoji, pos) => `<span class="sticker" style="${pos};font-size:2em">${emoji}</span>`;
const pandaStick = (pos) => `<span class="sticker" style="${pos}">${panda()}</span>`;

const PAGES = [
  /* 0 cover */
  { cover: true, html: `
    <div class="spine"></div>
    <div class="small">a little diary for</div>
    <h2>${HER_NAME}</h2>
    ${panda("panda")}
    <h2 style="font-size:2.2em">Happy Birthday!</h2>
    <p>8 October 🎂</p>
    <p style="font-size:1em;opacity:.8">turn the page →</p>` },

  /* 1 dedication */
  { html: `
    <p class="date">8 October</p>
    <div class="h">Happy Birthday, ${HER_NAME}! 🎂</div>
    <p class="t">Today the world got its most beautiful person, and I got the luckiest seat right beside her. 💗</p>
    <p class="t">Every page in this little diary is a piece of you: a smile, a candid you pretend to hate, an evening we stole from time.</p>
    <p class="t">Words said once fly away, so I wrote them down for you to keep. Turn the pages slowly, my love. ✨</p>
    <div class="sign">${SIGN_OFF} 🐼</div>` },

  /* 2 */
  { html: photo("solo.jpg", "You, Jaipur &amp; that little purple flower in your hair 🌸", {
      date: "Jaipur", r: -2, note: "This smile. This is the one I fell for. All over again.",
      sticker: pandaStick("right:.6em;bottom:.4em;width:3em;height:3em") }) },

  /* 3 */
  { html: photo("night.jpg", "I will never forget the chole kulche we had together 😋", {
      date: "Jaipur nights", r: 2, note: "Lake lights, a plate of chole kulche, and you. Best evening ever.",
      sticker: stick("🌙", "right:.7em;bottom:.6em") }) },

  /* 4 */
  { html: photo("happy.jpg", "Both of us in Jaipur, so happy 😊", {
      date: "Jaipur", r: -1.5, note: "No filters needed. Just the two of us, and happiness all over our faces.",
      sticker: stick("💞", "left:2.8em;bottom:.5em") }) },

  /* 5 love letter */
  { html: `
    <div class="h">How much do I love you?</div>
    <p class="t">More than I can fit on this page, or in this whole diary. 💗</p>
    <p class="t">I love the way you smile when you think nobody is looking. The way you scrunch your face when I tease you. The way an ordinary day turns into a festival when you walk in.</p>
    <p class="t">With you, <b>home isn't a place, it's a person.</b> And that person is you.</p>
    <p class="t">I love you today, tomorrow, and on every day I haven't lived yet. 🌹</p>
    <div class="sign">${SIGN_OFF}</div>
    <span class="sticker" style="left:2.8em;bottom:.5em">${panda()}</span>` },

  /* 6 */
  { html: video("v5.mp4", "Evenings are like this: slow, soft, and you, in those pretty earrings 💗", {
      date: "One quiet evening", r: 2, tall: true, note: "Those earrings look so beautiful when they're on you. Sorry I couldn't get the other pair too. Next time, promise! 🥺",
      sticker: stick("🌸", "left:2.6em;bottom:.5em") }) },

  /* 7 */
  { html: photo("selfie.jpg", "Our selfie, squished together right where I like it 🥰", {
      date: "Us", r: -2, note: "I pretend to look at the camera. I'm really looking at you.",
      sticker: pandaStick("right:.6em;bottom:.4em;width:3em;height:3em") }) },

  /* 8 */
  { html: video("v2.mp4", "Black &amp; white, hearts on your head, hand in your hair 🤍", {
      date: "A little photoshoot", r: -2, tall: true, note: "Even a black &amp; white filter can't hide how pretty you look.",
      sticker: stick("🎀", "right:.7em;bottom:.6em") }) },

  /* 9 */
  { html: video("v3.mp4", "That calm, confident look. I never stood a chance 😍", {
      date: "Same day, more drama", r: 2, tall: true, note: "Hearts floating above your head, and I'm completely done for. 💘" }) },

  /* 10 */
  { html: photo("hearts.jpg", "Me, standing behind you while hearts float over your head 💗", {
      date: "Us", r: 2, note: "I'm the one in blue. You're the reason everyone looks at the photo.",
      sticker: stick("💗", "right:.7em;bottom:.6em") }) },

  /* 11 */
  { html: video("v4.mp4", "You and your heart crown 👑 (the filter is jealous)", {
      date: "Purple wall, purple mood", r: -2, note: "Queen energy. I'm just here to carry the bags. 😄",
      sticker: pandaStick("right:.6em;bottom:.4em;width:3em;height:3em") }) },

  /* 12 */
  { html: video("v7.mp4", "Us together: me being goofy, you being cute 😂💞", {
      date: "Us, being us", r: 2, note: "Hearts over our heads, and honestly, accurate.",
      sticker: stick("💑", "left:2.8em;bottom:.5em") }) },

  /* 13 */
  { html: photo("c1.jpg", "The candid you HATED, but I'm keeping it forever 😜", {
      date: "Exhibit A", r: -2, tall: true, note: "Sorry not sorry. You look adorable and I will not be deleting this.",
      sticker: stick("😝", "right:.7em;bottom:.6em") }) },

  /* 14 */
  { html: photo("c2.jpg", "Another candid you'll pretend to dislike 🙈", {
      date: "Exhibit B", r: 2, tall: true, note: "This is how you take revenge on me. By being pretty in every angle.",
      sticker: pandaStick("right:.6em;bottom:.4em;width:3em;height:3em") }) },

  /* 15 */
  { html: video("v1.mp4", "Good morning, sunshine ☀️", {
      date: "Every morning, ideally", r: -2, tall: true, note: "The first thing I want to see every single day. 🌅",
      sticker: stick("☀️", "right:.7em;bottom:.6em") }) },

  /* 16 exams */
  { html: `
    <div class="h">For your exams 📚</div>
    <p class="t">I know you're deep in your studies right now, and I know how tired you get. So listen to me:</p>
    <p class="t"><b>I believe in you</b>, more than you believe in yourself on your hardest days. You are smart, strong and working so hard, and every bit of it will pay off.</p>
    <p class="t">I want to see you <b>successful</b>, shining and proud of yourself. That's the dream I carry for you. 🏆</p>
    <p class="t">When you're tired, I'm there. When you doubt, I'm there. When you win, I'll be the loudest one in the room. 🎉</p>` },

  /* 17 promises */
  { html: `
    <div class="h">My promises 🐼</div>
    <ul class="promises">
      <li>☕ I'll be your calm when everything feels too much.</li>
      <li>🥟 Momos, whenever you crave them.</li>
      <li>🥔 Samosa, any time, any weather.</li>
      <li>🍛 Chole kulche, on me, always.</li>
      <li>🐼 Panda hugs, unlimited.</li>
      <li>🤝 <b>I will always be with you</b>, in every step, every result, every dream.</li>
    </ul>
    <p class="t" style="margin-top:.4em">So go crush those exams, ${HER_NAME}. I'm right behind you. Always. 💪💗</p>
    <div class="sign">${SIGN_OFF}</div>` },

  /* 18 my wish */
  { html: video("v6.mp4", "My birthday wish for you. Press play 💌", {
      date: "From me, to you", r: -1.5, controls: true, main: true, tall: true,
      note: "(turn up the volume, and the music will fade while it plays)" }) },

  /* 19 end */
  { html: `
    <div style="margin:auto 0;text-align:center">
      <span style="display:inline-block;width:6em;height:6em">${panda()}</span>
      <div class="h" style="font-size:2.3em">Happy Birthday,<br>${HER_NAME}! 🎂</div>
      <p class="t">Thank you for being you. For every smile, every fight that ended in laughter, every tomorrow we'll share.</p>
      <p class="t"><b>To be continued... forever.</b> 💗</p>
    </div>
    <div class="sign">${SIGN_OFF} 🐼</div>` },
];
const N = PAGES.length;

/* =========================================================
   BOOK ENGINE
   ========================================================= */
const book = $("book");
let els = [], cur = 0, autoT = null, holds = 0, hintHidden = false;

function buildBook() {
  PAGES.forEach((p, i) => {
    const pg = document.createElement("div");
    pg.className = "page";
    pg.innerHTML = `<div class="face front ${p.cover ? "cover" : ""}">${p.html}</div><div class="face back"></div>`;
    book.appendChild(pg);
    els.push(pg);
  });
  book.addEventListener("click", (e) => {
    const b = e.target.closest(".snd");
    if (!b) return;
    const v = b.parentElement.querySelector("video");
    v.muted = !v.muted;
    b.textContent = v.muted ? "🔇 tap for sound" : "🔊 sound on";
    if (!v.muted) { v.currentTime = 0; v.play(); }
    syncAudioHold();
  }, true);
  book.querySelectorAll("video").forEach((v) => {
    v.addEventListener("play", syncAudioHold);
    v.addEventListener("pause", syncAudioHold);
    v.addEventListener("ended", syncAudioHold);
  });
}

/* While a video with sound is playing: soften the music and don't auto-turn the page */
function syncAudioHold() {
  const loud = [...book.querySelectorAll("video")].some((v) => !v.paused && !v.ended && !v.muted);
  music.duck(loud);
  const was = holds > 0;
  holds = loud ? 1 : 0;
  if (loud) { clearTimeout(autoT); $("penFill").className = ""; }
  else if (was) schedule();
}

function go(n, instant) {
  n = Math.max(0, Math.min(N - 1, n));
  const moved = n !== cur;
  cur = n;
  els.forEach((el, k) => {
    el.style.zIndex = k < cur ? 100 + k : N - k;
    el.style.transform = k < cur ? "rotateY(-180deg)" : "";
    el.classList.toggle("turning", false);
  });
  if (instant) els.forEach((el) => (el.style.transition = "none")), void book.offsetWidth, els.forEach((el) => (el.style.transition = ""));
  $("pageno").textContent = cur === 0 ? "" : `page ${cur} of ${N - 1}`;
  if (moved && !hintHidden) { hintHidden = true; $("hint").classList.add("gone"); }
  playVisible();
  schedule();
}

function playVisible() {
  els.forEach((el, k) => {
    el.querySelectorAll("video").forEach((v) => {
      if (k === cur && !v.dataset.main) {
        v.muted = true;
        const s = v.parentElement.querySelector(".snd"); if (s) s.textContent = "🔇 tap for sound";
        v.play().catch(() => {});
      } else { v.pause(); v.muted = v.dataset.main ? false : true; }
    });
  });
  syncAudioHold();
}

function schedule() {
  clearTimeout(autoT);
  const bar = $("penFill");
  bar.className = ""; void bar.offsetWidth;
  if (cur >= N - 1 || holds) return;
  bar.style.setProperty("--dur", TURN_EVERY + "s");
  bar.className = "run";
  autoT = setTimeout(() => go(cur + 1), TURN_EVERY * 1000);
}

$("next").addEventListener("click", () => go(cur + 1));
$("prev").addEventListener("click", () => go(cur - 1));
addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") go(cur + 1);
  if (e.key === "ArrowLeft") go(cur - 1);
});

/* ---------- finger / mouse dragging ---------- */
(() => {
  let sx = 0, sy = 0, t0 = 0, active = false, dragging = false, el = null, dir = 0, prog = 0, pid = null, suppress = false;

  book.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, video[controls]")) return;
    active = true; dragging = false; sx = e.clientX; sy = e.clientY; t0 = performance.now(); pid = e.pointerId;
  });
  book.addEventListener("pointermove", (e) => {
    if (!active) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      dir = dx < 0 ? 1 : -1;
      el = dir === 1 ? els[cur] : els[cur - 1];
      if (!el || (dir === 1 && cur >= N - 1)) { active = false; return; }
      dragging = true; clearTimeout(autoT); $("penFill").className = "";
      el.classList.add("drag", "turning");
      el.style.zIndex = 300;
      try { book.setPointerCapture(pid); } catch (_) {}
    }
    prog = Math.min(1, Math.max(0, Math.abs(dx) / (book.clientWidth * 0.85)));
    if ((dir === 1 && dx > 0) || (dir === -1 && dx < 0)) prog = 0;
    const ang = dir === 1 ? -180 * prog : -180 * (1 - prog);
    el.style.transform = `rotateY(${ang}deg)`;
  });
  const end = (e) => {
    if (!active) return;
    active = false;
    if (!dragging) return;
    dragging = false; suppress = true; setTimeout(() => (suppress = false), 60);
    const fast = Math.abs(e.clientX - sx) / (performance.now() - t0) > 0.5;
    const done = prog > 0.3 || (fast && prog > 0.04);
    el.classList.remove("drag");
    go(done ? cur + dir : cur);
  };
  book.addEventListener("pointerup", end);
  book.addEventListener("pointercancel", end);
  book.addEventListener("click", (e) => { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);
})();

/* dev helper: ?skip&p=7 jumps straight into the diary */
if (qs.has("skip")) { $("lock").hidden = true; $("diary").hidden = false; buildBook(); go(+qs.get("p") || 0, true); }
