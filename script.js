/* ============================================================
   🎒 EDIT THESE THINGS 🎒
   ============================================================ */
const FRIEND_NAME = "Kaviyatharshini";       // shown on intro + emails
const FRIEND_SHORT = "Kaviya";               // used in the spoken poem
const YOUR_EMAIL   = "darshana4767@gmail.com"; // where choices get emailed
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mnpawjdn"; // choices sent here
/* ============================================================ */

const POEM_LINES = [
  "¡Hola! My name is Dora, and guess what I can see —",
  `A super special explorer, and her name is ${FRIEND_SHORT}!`,
  "Grab your backpack, grab your map, the adventure's begun,",
  `It's ${FRIEND_SHORT}'s birthday — let's go and have some fun! 🎉`,
];

document.getElementById("friendName").textContent = FRIEND_NAME;

// ---- Typing + speaking the poem ----
const poemEl = document.getElementById("poem");
const fullPoem = POEM_LINES.join("\n");

function typePoem() {
  poemEl.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    poemEl.textContent = fullPoem.slice(0, i);
    i++;
    if (i > fullPoem.length) clearInterval(timer);
  }, 45);
}

function speakPoem() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(fullPoem);
  u.rate = 0.95;
  u.pitch = 1.35;
  u.volume = 1;
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
  if (window.speechSynthesis && window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => speakPoem();
  } else {
    speakPoem();
  }
});

// ---- Screen navigation ----
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  // Only show scenery backgrounds during the adventure stops
  document.body.classList.toggle("in-adventure", id === "form");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToIntro() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  show("intro");
}

function startAdventure() {
  show("form");
  restore();
  goToStop(0);
}

// ---- Multi-stop adventure navigation ----
function goToStop(n) {
  document.querySelectorAll(".stop-panel").forEach((p) => {
    p.hidden = Number(p.dataset.panel) !== n;
  });
  document.querySelectorAll(".trail .stop").forEach((s) => {
    s.classList.toggle("here", Number(s.dataset.stop) === n);
    s.classList.toggle("done", Number(s.dataset.stop) < n);
  });
  setScene(n);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Body gets a class so CSS can swap the background scene
function setScene(n) {
  const scenes = ["scene-mountain", "scene-lake", "scene-forest", "scene-forest"];
  document.body.classList.remove("scene-mountain", "scene-lake", "scene-forest");
  document.body.classList.add(scenes[n] || "scene-mountain");
}

function nextStop(current) {
  const required = { 0: "day", 1: "cake", 2: "bag" }[current];
  if (required && !document.querySelector(`input[name="${required}"]:checked`)) {
    alert("Pick one of the floating icons first! ⭐");
    return;
  }
  goToStop(current + 1);
}

function prevStop(current) {
  goToStop(current - 1);
}

function toggleOther(radio) {
  document.getElementById("cakeOther").classList.toggle("hidden", !radio.checked);
}

// ---- Save/restore progress (3 questions only) ----
const form = document.getElementById("planner");
form.addEventListener("input", saveProgress);

function saveProgress() {
  localStorage.setItem("bdayPlan", JSON.stringify(collect()));
}

function restore() {
  const saved = localStorage.getItem("bdayPlan");
  if (!saved) return;
  try {
    const d = JSON.parse(saved);
    setRadio("day", d.day);
    if (d.cakeIsOther) {
      setRadio("cake", "__other");
      document.getElementById("cakeOther").classList.remove("hidden");
      document.getElementById("cakeOther").value = d.cake || "";
    } else {
      setRadio("cake", d.cake);
    }
    setRadio("bag", d.bag);
  } catch (e) { /* ignore */ }
}

function setRadio(name, value) {
  if (!value) return;
  const el = document.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`);
  if (el) el.checked = true;
}

// ---- Collect answers (3 questions only) ----
function collect() {
  const g = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value || "";
  const cakeChoice = g("cake");
  const cakeIsOther = cakeChoice === "__other";
  return {
    day: g("day"),
    cake: cakeIsOther ? document.getElementById("cakeOther").value.trim() : cakeChoice,
    cakeIsOther,
    bag: g("bag"),
  };
}

// ---- Build summary ----
function buildSummary(d) {
  const line = (label, val) => (val ? `${label}: ${val}\n` : "");
  return (
    `🎉 ${FRIEND_NAME}'s Birthday Plan 🎉\n` +
    `----------------------------------\n` +
    line("🗓️ How to celebrate", d.day) +
    line("🎂 Cake flavour", d.cake) +
    line("👜 Gift bag", d.bag)
  ).trim();
}

let currentSummary = "";

function finish(e) {
  e.preventDefault();
  const d = collect();
  currentSummary = buildSummary(d);
  document.getElementById("summary").textContent = currentSummary;

  // mailto backup button
  const subject = encodeURIComponent(`${FRIEND_NAME}'s Birthday Plan 🎉`);
  const body = encodeURIComponent(currentSummary);
  document.getElementById("mailBtn").href = `mailto:${YOUR_EMAIL}?subject=${subject}&body=${body}`;

  // Send to Formspree (lands in your email automatically)
  fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      friend: FRIEND_NAME,
      day: d.day,
      cake: d.cake,
      bag: d.bag,
      summary: currentSummary,
    }),
  }).catch(() => { /* ignore network errors; mailto is a backup */ });

  show("done");
  celebrate();
  return false;
}

function copyChoices() {
  navigator.clipboard.writeText(currentSummary).then(
    () => alert("Copied! 📋 Paste it anywhere ⭐"),
    () => alert("Couldn't copy automatically — just select the text above.")
  );
}

// ---- Confetti 🎉 ----
function celebrate() {
  if (typeof confetti !== "function") return;
  const end = Date.now() + 1500;
  const colors = ["#06d6a0", "#ff9f1c", "#9b5de5", "#ff5d8f", "#ffd166"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });
}
