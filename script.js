/* ============================================================
   🎒 EDIT THESE THINGS 🎒
   ============================================================ */
const FRIEND_NAME  = "Kaviyatharshini";        // shown on the map + in the summary/email
const FRIEND_SHORT = "Kaviya";                 // used in the spoken poem + map title
const YOUR_EMAIL   = "darshana4767@gmail.com"; // where the "Send to my friend" button mails the choices
/* ============================================================ */

/* The little poem the explorer girl "says" out loud + types in the bubble */
const POEM_LINES = [
  "¡Hola! My name is Dora, and guess what I can see —",
  `A super special explorer, and her name is ${FRIEND_SHORT}!`,
  "Grab your backpack, grab your map, the adventure's begun,",
  `It's ${FRIEND_SHORT}'s birthday — let's go and have some fun! 🎉`,
];

/* The four map stops, in the order she walks them.
   `requires` is the radio group that must be answered before she moves on. */
const STOPS = [
  { name: "Jungle Clearing", emoji: "🌴", requires: "day"  },
  { name: "Cake Cove",       emoji: "🍰", requires: "cake" },
  { name: "Gift Grove",      emoji: "👜", requires: "bag"  },
  { name: "Party Peak",      emoji: "⛰️", requires: null   },
];

/* Where the trail bends, as a fraction (0–1) of the map's width and height.
   `wide` is the desktop winding trail, `tall` is the phone zig-zag.
   The first point is where she starts; the rest are the four stops. */
const LAYOUTS = {
  wide: {
    start: { x: 0.04, y: 0.88 },
    stops: [
      { x: 0.15, y: 0.56 },
      { x: 0.40, y: 0.26 },
      { x: 0.64, y: 0.50 },
      { x: 0.87, y: 0.18 },
    ],
  },
  tall: {
    start: { x: 0.14, y: 0.96 },
    stops: [
      { x: 0.72, y: 0.80 },
      { x: 0.24, y: 0.58 },
      { x: 0.74, y: 0.38 },
      { x: 0.32, y: 0.14 },
    ],
  },
};

const MS_PER_1000PX = 2600; // walking speed along the trail

/* ============================================================
   INTRO — typing + speaking the poem
   ============================================================ */
const poemEl = document.getElementById("poem");
const fullPoem = POEM_LINES.join("\n");
document.getElementById("mapTitleName").textContent = FRIEND_SHORT;

let typeTimer = null;

function typePoem() {
  clearInterval(typeTimer);
  poemEl.textContent = "";
  let i = 0;
  typeTimer = setInterval(() => {
    poemEl.textContent = fullPoem.slice(0, i);
    i++;
    if (i > fullPoem.length) clearInterval(typeTimer);
  }, 45);
}

function speakPoem() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(fullPoem);
  u.rate = 0.95;
  u.pitch = 1.35; // higher pitch = more cartoony
  u.volume = 1;
  // Prefer a female / English voice if one is available
  const voices = window.speechSynthesis.getVoices();
  const pick = voices.find(v => /female|zira|samantha|google us english/i.test(v.name))
            || voices.find(v => v.lang && v.lang.startsWith("en"));
  if (pick) u.voice = pick;
  window.speechSynthesis.speak(u);
}

function playPoem() {
  typePoem();
  speakPoem();
}

window.addEventListener("load", () => {
  typePoem();
  // Voices may not be ready on first load — wait for them if needed
  if (window.speechSynthesis && window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => speakPoem();
  } else {
    speakPoem();
  }
});

/* ============================================================
   SCREEN NAVIGATION
   ============================================================ */
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================================================
   THE ADVENTURE MAP
   ============================================================ */
const mapScene   = document.getElementById("mapScene");
const svg        = document.getElementById("trailSvg");
const trailPath  = document.getElementById("trailPath");
const trailShade = document.getElementById("trailShadow");
const trailDone  = document.getElementById("trailWalked");
const walker     = document.getElementById("walker");
const statusEl   = document.getElementById("journeyStatus");
const stopEls    = Array.from(document.querySelectorAll(".stop"));
const panels     = Array.from(document.querySelectorAll(".stop-panel"));
const form       = document.getElementById("planner");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const narrow       = window.matchMedia("(max-width: 720px)");

let stopLengths = [];   // distance along the trail of each stop
let walkerLen   = 0;    // where she currently stands along the trail
let currentStop = -1;   // stop she is standing at (-1 = not started)
let walking     = false;
let skipWalk    = false;
let animId      = null;

/* --- Draw a smooth curve through the waypoints (Catmull-Rom → bézier) --- */
function curveThrough(points) {
  const segs = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || points[i + 1];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    segs.push(
      `C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ` +
      `${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    );
  }
  return segs;
}

/* --- Build the trail for the current screen size --- */
function buildTrail() {
  const w = mapScene.clientWidth;
  const h = mapScene.clientHeight;
  if (!w || !h) return;

  // The viewBox matches the box exactly, so 1 SVG unit === 1 CSS pixel and
  // trail coordinates convert straight into % positions for stops / walker.
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  const layout = narrow.matches ? LAYOUTS.tall : LAYOUTS.wide;
  const pts = [layout.start, ...layout.stops].map(p => ({ x: p.x * w, y: p.y * h }));
  const segs = curveThrough(pts);

  // Measure how far along the trail each stop sits by growing the path step by step
  stopLengths = [];
  for (let i = 1; i < segs.length; i++) {
    trailPath.setAttribute("d", segs.slice(0, i + 1).join(" "));
    stopLengths.push(trailPath.getTotalLength());
  }

  const d = segs.join(" ");
  trailPath.setAttribute("d", d);
  trailShade.setAttribute("d", d);
  trailDone.setAttribute("d", d);

  // Place the stop markers on their bend in the trail
  stopEls.forEach((el, i) => {
    el.style.left = (pts[i + 1].x / w) * 100 + "%";
    el.style.top  = (pts[i + 1].y / h) * 100 + "%";
  });

  if (!walking) {
    walkerLen = currentStop >= 0 ? stopLengths[currentStop] : 0;
    placeWalker(walkerLen);
  }
  paintWalked(walkerLen);
}

/* --- Put the walker on the trail at a given distance --- */
function placeWalker(len) {
  const w = mapScene.clientWidth || 1;
  const h = mapScene.clientHeight || 1;
  const total = trailPath.getTotalLength();
  const p = trailPath.getPointAtLength(Math.max(0, Math.min(len, total)));
  walker.style.left = (p.x / w) * 100 + "%";
  walker.style.top  = (p.y / h) * 100 + "%";
  return p;
}

/* --- Colour in the part of the trail she has already walked --- */
function paintWalked(len) {
  const total = trailPath.getTotalLength() || 1;
  trailDone.setAttribute("stroke-dasharray", `${Math.max(0, len)} ${total + 10}`);
}

/* --- Walk her from where she is to stop `i` --- */
function walkTo(i) {
  hidePanels();
  setStopStates(i, "walking");
  announce(`Walking to ${STOPS[i].name}…`);
  // Bring the map into view so the walk is actually seen (esp. on phones)
  mapScene.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });

  const from = walkerLen;
  const to = stopLengths[i];
  const dist = Math.abs(to - from);
  const duration = reduceMotion.matches ? 0 : (dist / 1000) * MS_PER_1000PX;

  cancelAnimationFrame(animId);
  skipWalk = false;
  walking = true;
  walker.classList.add("is-walking");
  walker.classList.remove("is-arrived");

  if (duration <= 0) return finishWalk(i, to);

  const startT = performance.now();
  let lastX = placeWalker(from).x;

  const step = (now) => {
    let t = (now - startT) / duration;
    if (skipWalk) t = 1;
    if (t >= 1) return finishWalk(i, to);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out
    const len = from + (to - from) * eased;
    const p = placeWalker(len);
    paintWalked(len);
    if (Math.abs(p.x - lastX) > 0.5) {
      walker.classList.toggle("face-left", p.x < lastX);
      lastX = p.x;
    }
    animId = requestAnimationFrame(step);
  };
  animId = requestAnimationFrame(step);
}

function finishWalk(i, to) {
  cancelAnimationFrame(animId);
  walking = false;
  walkerLen = to;
  placeWalker(to);
  paintWalked(to);
  walker.classList.remove("is-walking", "face-left");
  walker.classList.add("is-arrived");
  arriveAt(i);
}

/* --- She has arrived: light up the stop and pop up its question --- */
function arriveAt(i) {
  currentStop = i;
  setStopStates(i, "arrived");
  const panel = panels[i];
  panel.hidden = false;
  panel.tabIndex = -1;
  panel.focus({ preventScroll: true });
  panel.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "nearest" });
  announce(`Arrived at ${STOPS[i].name}. ${panel.querySelector("h2").textContent}`);
}

function hidePanels() {
  panels.forEach(p => { p.hidden = true; });
}

function setStopStates(i, phase) {
  stopEls.forEach((el, idx) => {
    el.classList.toggle("is-done", idx < i);
    el.classList.toggle("is-current", idx === i && phase === "arrived");
  });
}

function announce(msg) {
  statusEl.textContent = msg;
}

/* --- Start the adventure (from the "Let's go! ⭐" button) --- */
function startJourney() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  clearInterval(typeTimer);
  show("journey");

  // Wait for the map to have a size before measuring the trail
  requestAnimationFrame(() => {
    restore();
    buildTrail();

    // If answers were restored, hop straight to the first unanswered stop
    const resume = firstUnansweredStop();
    if (resume > 0) {
      walkerLen = stopLengths[resume - 1];
      placeWalker(walkerLen);
      paintWalked(walkerLen);
      currentStop = resume - 1;
    }
    walkTo(resume);
  });
}

function firstUnansweredStop() {
  for (let i = 0; i < STOPS.length; i++) {
    const g = STOPS[i].requires;
    if (g && !document.querySelector(`input[name="${g}"]:checked`)) return i;
  }
  return STOPS.length - 1; // everything answered → the finale
}

/* --- "Vámonos!" buttons: check the answer, then walk on --- */
form.querySelectorAll("[data-next]").forEach(btn => {
  btn.addEventListener("click", () => {
    const panel = btn.closest(".stop-panel");
    const i = Number(panel.dataset.panel);
    if (!validateStop(i, panel)) return;
    saveProgress();
    walkTo(i + 1);
  });
});

function validateStop(i, panel) {
  const err = panel.querySelector("[data-err]");
  const group = STOPS[i].requires;
  const picked = group ? document.querySelector(`input[name="${group}"]:checked`) : true;
  const otherEmpty =
    group === "cake" && picked && picked.value === "__other" &&
    !document.getElementById("cakeOther").value.trim();

  if (!picked || otherEmpty) {
    if (err) err.hidden = false;
    const focusTarget = otherEmpty
      ? document.getElementById("cakeOther")
      : panel.querySelector(`input[name="${group}"]`);
    if (focusTarget) focusTarget.focus();
    return false;
  }
  if (err) err.hidden = true;
  return true;
}

/* --- "Skip walking" jumps her straight to the next stop --- */
document.getElementById("skipWalkBtn").addEventListener("click", () => {
  if (walking) skipWalk = true;
});

/* --- Keep the trail correct when the screen is resized or rotated --- */
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildTrail, 150);
});

/* Show/hide the "Other" cake flavour box */
function toggleOther(radio) {
  const on = radio.checked;
  document.getElementById("cakeOther").classList.toggle("hidden", !on);
  document.getElementById("cakeOtherLbl").classList.toggle("hidden", !on);
}

/* ============================================================
   SAVE / RESTORE ANSWERS
   ============================================================ */
form.addEventListener("input", saveProgress);

function saveProgress() {
  try {
    localStorage.setItem("bdayPlan", JSON.stringify(collect()));
  } catch (e) { /* private mode — just keep going */ }
}

function restore() {
  let saved = null;
  try { saved = localStorage.getItem("bdayPlan"); } catch (e) { /* ignore */ }
  if (!saved) return;
  try {
    const d = JSON.parse(saved);
    setRadio("day", d.day);
    setRadio("guests", d.guests);
    setRadio("surprise", d.surprise);
    if (d.cakeIsOther) {
      setRadio("cake", "__other");
      document.getElementById("cakeOther").classList.remove("hidden");
      document.getElementById("cakeOtherLbl").classList.remove("hidden");
      document.getElementById("cakeOther").value = d.cake || "";
    } else {
      setRadio("cake", d.cake);
    }
    setRadio("bag", d.bag);
    document.getElementById("bagLinks").value = d.bagLinks || "";
    document.getElementById("dress").value = d.dress || "";
    document.getElementById("playlist").value = d.playlist || "";
    document.getElementById("wishlist").value = d.wishlist || "";
  } catch (e) { /* ignore bad data */ }
}

function setRadio(name, value) {
  if (!value) return;
  const el = document.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`);
  if (el) el.checked = true;
}

/* ============================================================
   COLLECT / SUMMARY / FINALE
   ============================================================ */
function collect() {
  const g = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value || "";
  const cakeChoice = g("cake");
  const cakeIsOther = cakeChoice === "__other";
  return {
    day: g("day"),
    cake: cakeIsOther ? document.getElementById("cakeOther").value.trim() : cakeChoice,
    cakeIsOther,
    bag: g("bag"),
    bagLinks: document.getElementById("bagLinks").value.trim(),
    dress: document.getElementById("dress").value.trim(),
    playlist: document.getElementById("playlist").value.trim(),
    guests: g("guests"),
    surprise: g("surprise"),
    wishlist: document.getElementById("wishlist").value.trim(),
  };
}

function buildSummary(d) {
  const line = (label, val) => (val ? `${label}: ${val}\n` : "");
  return (
    `🎉 ${FRIEND_NAME}'s Birthday Plan 🎉\n` +
    `----------------------------------\n` +
    line("🌴 Jungle Clearing — how to celebrate", d.day) +
    line("🍰 Cake Cove — cake flavour", d.cake) +
    line("👜 Gift Grove — bag", d.bag) +
    line("🔗 Bag links", d.bagLinks) +
    line("⛰️ Party Peak — dress code / colour", d.dress) +
    line("🎵 Playlist", d.playlist) +
    line("👯 Guest vibe", d.guests) +
    line("🎁 Surprise", d.surprise) +
    line("📝 Wishlist / notes", d.wishlist)
  ).trim();
}

let currentSummary = "";

function finish(e) {
  e.preventDefault();
  saveProgress();

  const d = collect();
  currentSummary = buildSummary(d);
  document.getElementById("summary").textContent = currentSummary;

  const subject = encodeURIComponent(`${FRIEND_NAME}'s Birthday Plan 🎉`);
  const body = encodeURIComponent(currentSummary);
  document.getElementById("mailBtn").href = `mailto:${YOUR_EMAIL}?subject=${subject}&body=${body}`;

  stopEls.forEach(el => { el.classList.add("is-done"); el.classList.remove("is-current"); });
  announce("We made it to Party Peak!");
  show("done");
  celebrate();
  return false;
}

function copyChoices() {
  if (!navigator.clipboard) {
    alert("Couldn't copy automatically — just select the text above.");
    return;
  }
  navigator.clipboard.writeText(currentSummary).then(
    () => alert("Copied! 📋 Paste it anywhere ⭐"),
    () => alert("Couldn't copy automatically — just select the text above.")
  );
}

function startOver() {
  try { localStorage.removeItem("bdayPlan"); } catch (e) { /* ignore */ }
  location.reload();
}

/* ---- Confetti 🎉 ---- */
function celebrate() {
  if (typeof confetti !== "function") return;
  const colors = ["#06d6a0", "#ff9f1c", "#9b5de5", "#ff5d8f", "#ffd166"];
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });
  if (reduceMotion.matches) return;
  const end = Date.now() + 1500;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
