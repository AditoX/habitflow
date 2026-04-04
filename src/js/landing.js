// Animate preview calendar
const habits = ["Wake up 06:00","Meditation","Gym","Cold Shower","Work","Read 10 pages"];
const rows = document.getElementById("previewRows");

if (rows) {
  const checks = [
    [1,1,0,1,1,0,1],[1,0,1,1,0,1,1],[0,1,1,0,1,0,1],
    [1,1,1,1,0,0,1],[1,1,0,1,1,1,0],[0,1,1,0,1,1,1],
  ];
  rows.innerHTML = habits.map((h, i) => `
    <div style="display:grid;grid-template-columns:90px repeat(7,1fr);gap:3px;align-items:center">
      <span style="font-size:0.58rem;color:#7a8899;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:2px">${h}</span>
      ${checks[i].map(c => `
        <div style="height:18px;border-radius:5px;background:${c ? 'rgba(127,184,158,0.55)' : 'rgba(20,27,41,0.9)'};border:1px solid rgba(151,164,186,0.1)"></div>
      `).join("")}
    </div>`).join("");
}

// Preview bars
const barsEl = document.getElementById("previewBars");
if (barsEl) {
  const vals = [42,58,71,55,88,63,79];
  barsEl.innerHTML = vals.map(v =>
    `<div class="pchart-bar" style="height:${v}%"></div>`
  ).join("");
}

// Animate donut percent counter
const pctEl = document.getElementById("previewPct");
if (pctEl) {
  let n = 0;
  const target = 72;
  const step = () => {
    n = Math.min(n + 2, target);
    pctEl.textContent = n + "%";
    if (n < target) requestAnimationFrame(step);
  };
  setTimeout(() => requestAnimationFrame(step), 600);
}

// Intersection reveal for sections
const reveals = document.querySelectorAll(".feature-card, .step");
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.style.opacity = "1";
      e.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.1 });

reveals.forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(24px)";
  el.style.transition = "opacity 500ms ease, transform 500ms ease";
  io.observe(el);
});
