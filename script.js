gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.defaults({ scroller: ".scroller" });

const NS = "http://www.w3.org/2000/svg";
const $ = (s) => document.querySelector(s);

/* repeatable "random" so the forest looks the same on every load */
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ---------- pine tree path ---------- */
function pine(x, base, h, tiers = 5) {
  const w = h * 0.3, top = base - h, span = h * 0.92, t = h * 0.025;
  const R = [], L = [];
  for (let i = 1; i <= tiers; i++) {
    const y = top + span * (i / tiers);
    const wi = w * (0.25 + 0.75 * i / tiers);
    R.push(`L${x + wi} ${y} L${x + wi * 0.45} ${y}`);
    L.unshift(`L${x - wi * 0.45} ${y} L${x - wi} ${y}`);
  }
  const yb = top + span;
  return `M${x} ${top} ${R.join(" ")} L${x + t} ${yb} L${x + t} ${base} L${x - t} ${base} L${x - t} ${yb} ${L.join(" ")}Z`;
}

/* ---------- build the scenery ---------- */
// front forest (two rows, taller on the left)
let d = "";
for (let x = -30; x < 1650; x += 20 + rnd() * 26) {
  d += pine(x, 910, (70 + rnd() * 110) * (1.25 - 0.55 * x / 1600), 4);
}
for (let x = -10; x < 1650; x += 26 + rnd() * 30) {
  d += pine(x, 910, 45 + rnd() * 55, 4);
}
$("#forest").setAttribute("d", d);

// small trees on the crest of the dark foreground hill
d = "";
[180, 330, 520, 760, 980, 1180, 1390].forEach((x) => { d += pine(x, 812, 60 + rnd() * 50, 4); });
$("#crestTrees").setAttribute("d", d);

// big framing pines
$("#bigL").setAttribute("d", pine(90, 960, 880, 8) + pine(330, 960, 560, 7) + pine(-60, 960, 760, 7));
$("#bigR").setAttribute("d", pine(1510, 960, 880, 8) + pine(1270, 960, 560, 7) + pine(1660, 960, 760, 7));

// clouds
const cloudD = "M0 36 H190 Q200 36 200 28 Q200 20 188 20 Q180 -4 150 4 Q135 -18 100 -4 Q70 -16 55 12 Q20 4 18 24 Q0 24 0 36Z";
[[120, 320, 1.4], [520, 440, 1.0], [980, 250, 1.7], [1270, 430, 1.2], [-150, 520, 1.3], [760, 560, 0.9]].forEach(([x, y, s]) => {
  const p = document.createElementNS(NS, "path");
  p.setAttribute("d", cloudD);
  p.setAttribute("transform", `translate(${x} ${y}) scale(${s})`);
  $("#clouds").appendChild(p);
});

// bird flock (small "v" shapes)
[[720, 440], [790, 400], [850, 450], [900, 405], [820, 500]].forEach(([x, y]) => {
  const p = document.createElementNS(NS, "path");
  p.setAttribute("d", "M0 0 q8 -9 16 0 q8 -9 16 0");
  p.setAttribute("transform", `translate(${x} ${y}) scale(${0.8 + rnd() * 0.8})`);
  $("#flock").appendChild(p);
});

// stars
const STARS = window.innerWidth < 700 ? 70 : 130;
for (let i = 0; i < STARS; i++) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", rnd() * 1600);
  c.setAttribute("cy", rnd() * 600);
  c.setAttribute("r", 0.7 + rnd() * 1.7);
  c.setAttribute("fill", "#fff");
  $("#stars").appendChild(c);
}

/* ---------- fit to any screen shape (portrait, landscape, tablet) ---------- */
function fitEdges() {
  const r = $("#scene").getBoundingClientRect();
  if (!r.width || !r.height) return;
  const vis = Math.min(1600, 900 * (r.width / r.height));   // visible width in scene units
  const left = 800 - vis / 2, right = 800 + vis / 2;
  const f = Math.min(1, vis / 1000);                         // shrink pines on narrow screens
  gsap.set("#edgeL", { x: left });
  gsap.set("#edgeR", { x: right - 1600 });
  gsap.set("#scaleL", { scale: f, svgOrigin: "0 900" });
  gsap.set("#scaleR", { scale: f, svgOrigin: "1600 900" });
}
fitEdges();
if (window.ResizeObserver) new ResizeObserver(fitEdges).observe($("#scene"));
window.addEventListener("orientationchange", () => setTimeout(() => { fitEdges(); ScrollTrigger.refresh(); }, 300));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const thumb = $(".thumb");

/* ---------- starting positions ---------- */
gsap.set("#sun", { y: 40 });
gsap.set(["#hillBlue"], { y: 320 });
gsap.set("#hillNavy", { y: 220 });
gsap.set("#hillDarkG", { y: 240 });
gsap.set("#nightRange", { y: 360 });
gsap.set("#nightFront", { y: 260 });
gsap.set("#bigL", { x: -700 });
gsap.set("#bigR", { x: 700 });

/* ---------- main scroll timeline (0 -> 10) ---------- */
const tl = gsap.timeline({
  defaults: { ease: "none" },
  scrollTrigger: { trigger: ".scrollElement", start: "top top", end: "bottom bottom", scrub: 1,
    onUpdate: (self) => { thumb.style.top = (self.progress * 87.5) + "%"; } }
});

tl
  // hints
  .to("#hintDown", { opacity: 0, duration: 0.6 }, 0)
  .to("#hintBack", { opacity: 1, duration: 0.6 }, 9.4)

  // 1) morning: sun comes down, pink ranges sink, blue hills rise
  .to("#sun", { y: 380, duration: 3.2, ease: "power1.inOut" }, 0)
  .to("#rangePink", { y: 520, duration: 3 }, 0.5)
  .to("#rangePurple", { y: 460, duration: 2.8 }, 0.8)
  .to("#hillBlue", { y: 0, duration: 2.5 }, 1)
  .to("#hillNavy", { y: 0, duration: 2.5 }, 1.5)
  .to("#forest", { y: 120, duration: 3.5 }, 0)
  .to("#clouds", { opacity: 1, duration: 1 }, 1)
  .to("#clouds", { x: 320, duration: 5 }, 1)
  .to("#clouds", { opacity: 0, duration: 1 }, 5.2)

  // 2) big pines close in
  .to("#bigL", { x: 0, duration: 2.2 }, 2)
  .to("#bigR", { x: 0, duration: 2.2 }, 2)
  .to("#bigL", { x: 60, scale: 1.12, svgOrigin: "0 900", duration: 3 }, 4.2)
  .to("#bigR", { x: -60, scale: 1.12, svgOrigin: "1600 900", duration: 3 }, 4.2)

  // 3) sunset: sun swells, sky turns dusky purple
  .to("#sun", { y: 470, scale: 4.4, duration: 2.5, ease: "power1.inOut" }, 4)
  .to("#s1", { attr: { "stop-color": "#7d3f73" }, duration: 2.5 }, 4)
  .to("#s2", { attr: { "stop-color": "#a0507a" }, duration: 2.5 }, 4)
  .to("#hillDarkG", { y: 0, duration: 2 }, 4)
  .to("#bird", { opacity: 0, duration: 0.8 }, 5)
  .to("#flock", { opacity: 1, duration: 0.6 }, 5.9)
  .to("#flock", { x: 90, y: -70, duration: 2, ease: "power1.out" }, 5.9)
  .to("#flock", { opacity: 0, duration: 0.6 }, 7.4)

  // 4) sun sets behind the hill, sky goes to night
  .to("#sun", { y: 1000, duration: 1.8, ease: "power1.in" }, 6.8)
  .to("#s1", { attr: { "stop-color": "#07062f" }, duration: 2 }, 7)
  .to("#s2", { attr: { "stop-color": "#15105a" }, duration: 2 }, 7)
  .to("#stars", { opacity: 1, duration: 1.5 }, 7.6)

  // 5) night: pines leave, purple glow and magenta peaks rise
  .to("#bigL", { x: -750, duration: 1.6 }, 8.2)
  .to("#bigR", { x: 750, duration: 1.6 }, 8.2)
  .to("#forest", { opacity: 0, duration: 1 }, 8)
  .to(["#hillBlue", "#hillNavy", "#hillDarkG"], { y: 420, duration: 1.6 }, 8.2)
  .to("#nightGlowRect", { opacity: 1, duration: 1.5 }, 8.4)
  .to("#nightRange", { y: 0, duration: 1.6 }, 8.6)
  .to("#nightFront", { y: 0, duration: 1.2 }, 9);

/* ---------- twinkling stars ---------- */
gsap.to("#stars circle", {
  opacity: 0.25, repeat: -1, yoyo: true, ease: "sine.inOut",
  duration: () => 0.6 + Math.random() * 1.4,
  stagger: { each: 0.02, from: "random" }
});

/* ---------- shooting star ---------- */
function shoot() {
  gsap.fromTo("#shoot", { x: 1100, y: 380, opacity: 1 }, { x: 650, y: 530, opacity: 0, duration: 1.4, ease: "power1.in", overwrite: true });
}
ScrollTrigger.create({ trigger: ".scrollElement", start: "76% top", onEnter: shoot, onEnterBack: shoot });

/* ---------- bird (same code as shown in the video) ---------- */
gsap.fromTo("#bird", { opacity: 1 }, {
  y: -250,
  x: 800,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".scrollElement",
    start: "15% top",
    end: "60% 100%",
    scrub: 4,
    onEnter: function () { gsap.to("#bird", { scaleX: 1, rotation: 0 }) },
    onLeave: function () { gsap.to("#bird", { scaleX: -1, rotation: -15 }) },
  }
});

/* ---------- hint bobbing ---------- */
gsap.to(".chev.dn", { y: 6, repeat: -1, yoyo: true, duration: 0.8, ease: "sine.inOut" });
gsap.to(".chev.up", { y: -6, repeat: -1, yoyo: true, duration: 0.8, ease: "sine.inOut" });

/* ---------- buttons ---------- */
const sceneEl = $("#scene");
const goFull = sceneEl.requestFullscreen || sceneEl.webkitRequestFullscreen;
if (!goFull) $("#full").style.display = "none";           // iPhone Safari has no element fullscreen
$("#full").addEventListener("click", () => {
  if (!(document.fullscreenElement || document.webkitFullscreenElement)) goFull.call(sceneEl);
  else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
});
["fullscreenchange", "webkitfullscreenchange"].forEach((e) => document.addEventListener(e, () => { fitEdges(); ScrollTrigger.refresh(); }));
$("#works").addEventListener("click", () => {
  window.open("https://github.com/ajmalraheemzai-ops?tab=repositories", "_blank");
});

/* ---------- ambient motion (always running) ---------- */
if (!reduceMotion) {
gsap.to("#sun circle:first-child", { scale: 1.07, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
gsap.to("#clouds path", { x: "+=45", duration: () => 7 + Math.random() * 6, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: { each: 0.4, from: "random" } });
gsap.to("#flock path", { y: "+=10", duration: () => 1 + Math.random(), repeat: -1, yoyo: true, ease: "sine.inOut" });

}

/* ---------- automatic motion: the scene scrolls itself ---------- */
const scroller = $(".scroller");
const autoBtn = $("#auto");
if (reduceMotion) autoBtn.textContent = "▶ Auto Motion";
const SECONDS = 50;     // time for one full pass down (or back up)
const IDLE = 2500;      // ms of no user input before auto motion resumes
let autoOn = !reduceMotion, dir = 1, pos = 0, hold = 0, wasIdle = true;
let lastInput = performance.now() - IDLE + 800;   // start ~0.8s after load

const markInput = () => { lastInput = performance.now(); };
["wheel", "touchstart", "touchmove", "keydown"].forEach((e) => scroller.addEventListener(e, markInput, { passive: true }));
scroller.addEventListener("pointerdown", markInput);
scroller.addEventListener("pointermove", (e) => { if (e.buttons) markInput(); });

gsap.ticker.add((time, deltaTime) => {
  const max = scroller.scrollHeight - scroller.clientHeight;
  if (!autoOn || max <= 0) return;
  if (performance.now() - lastInput < IDLE) { wasIdle = false; return; }   // user is in control
  if (!wasIdle) { pos = scroller.scrollTop; wasIdle = true; }              // resume from where they stopped
  const dt = Math.min(deltaTime, 100);
  if (hold > 0) { hold -= dt; return; }
  pos += dir * (max / SECONDS) * (dt / 1000);
  if (pos >= max) { pos = max; dir = -1; hold = 1500; }
  else if (pos <= 0) { pos = 0; dir = 1; hold = 1200; }
  scroller.scrollTop = pos;
});

autoBtn.addEventListener("click", () => {
  autoOn = !autoOn;
  autoBtn.textContent = autoOn ? "❚❚ Auto Motion" : "▶ Auto Motion";
  if (autoOn) { pos = scroller.scrollTop; lastInput = -1e9; wasIdle = true; }
});

/* ---------- footer year ---------- */
$("#year").textContent = new Date().getFullYear();
