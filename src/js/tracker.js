const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const defaultHabits = [
  { id: "wake",       name: "Wake up at 06:00",  target: "Daily",       color: "#8293a8" },
  { id: "meditation", name: "Meditation",         target: "10 min",      color: "#b0957c" },
  { id: "gym",        name: "Gym",                target: "Workout",     color: "#8ea694" },
  { id: "cold",       name: "Cold Shower",        target: "Reset",       color: "#7e92ab" },
  { id: "work",       name: "Work",               target: "Deep focus",  color: "#9189a7" },
  { id: "read",       name: "Read 10 pages",      target: "Books",       color: "#89a79f" },
  { id: "learn",      name: "Learn a skill",      target: "30 min",      color: "#b5a07a" },
  { id: "sugar",      name: "No sugar",           target: "Clean food",  color: "#a78686" },
  { id: "alcohol",    name: "No alcohol",         target: "Consistency", color: "#8ea88d" },
  { id: "social",     name: "1H social media",    target: "Limit",       color: "#a99172" },
  { id: "planning",   name: "Planning",           target: "Daily map",   color: "#8893a5" },
  { id: "sleep",      name: "Sleep before 11:00", target: "Recovery",    color: "#7e8ea6" },
];

const habitPalette = [
  "#8293a8","#b0957c","#8ea694","#7e92ab","#9189a7",
  "#89a79f","#b5a07a","#a78686","#8ea88d","#a99172","#8893a5","#929da8",
];

const storagePrefix = "habit-tracker-dashboard";
const storageVersion = "v3-clean"; // bump this to force a reset

// Auto-reset if stored version doesn't match (wipes old seeded data)
if (localStorage.getItem(storagePrefix + "-version") !== storageVersion) {
  localStorage.removeItem(storagePrefix);
  localStorage.setItem(storagePrefix + "-version", storageVersion);
}

const state = {
  month: 0,
  year: 2026,
  habits: [],
  notesByMonth: {},
  checks: {},
};

const monthHeading      = document.getElementById("monthHeading");
const yearHeading       = document.getElementById("yearHeading");
const yearInput         = document.getElementById("yearInput");
const monthSelect       = document.getElementById("monthSelect");
const habitList         = document.getElementById("habitList");
const habitEditorList   = document.getElementById("habitEditorList");
const addHabitButton    = document.getElementById("addHabitButton");
const dailyChart        = document.getElementById("dailyChart");
const dailyAxis         = document.getElementById("dailyAxis");
const weeklyChart       = document.getElementById("weeklyChart");
const calendarGrid      = document.getElementById("calendarGrid");
const analysisBody      = document.getElementById("analysisBody");
const streakList        = document.getElementById("streakList");
const moodStrip         = document.getElementById("moodStrip");
const notesInput        = document.getElementById("notesInput");
const dailyAverageLabel = document.getElementById("dailyAverageLabel");
const bestWeekLabel     = document.getElementById("bestWeekLabel");
const goalTarget        = document.getElementById("goalTarget");
const goalCompleted     = document.getElementById("goalCompleted");
const goalLeft          = document.getElementById("goalLeft");
const completionPercent = document.getElementById("completionPercent");
const donutChart        = document.getElementById("donutChart");
const moodValue         = document.getElementById("moodValue");
const motivationValue   = document.getElementById("motivationValue");
const heroConsistency   = document.getElementById("heroConsistency");
const heroBandFill      = document.getElementById("heroBandFill");
const heroMiniGrid      = document.getElementById("heroMiniGrid");
const jumpCurrentMonth  = document.getElementById("jumpCurrentMonth");
const mobileCalendarQuery = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(max-width: 640px)")
  : null;

let mobileWeekIndex = 0;
let mobileWeekMonthKey = "";

// Called by dashboard.html after auth is confirmed
window.__initTracker = function() { initialize(); };

function initialize() {
  populateMonthOptions();
  loadState();
  renderHabitList();
  renderHabitEditor();
  setupHeroMiniGrid();
  bindEvents();
  setupRevealAnimations();
  render();
}

function populateMonthOptions() {
  monthSelect.innerHTML = months.map((m, i) => `<option value="${i}">${m}</option>`).join("");
}

function bindEvents() {
  monthSelect.addEventListener("change", () => {
    state.month = Number(monthSelect.value);
    ensureMonthData(); saveState(); render();
  });

  yearInput.addEventListener("change", () => {
    const nextYear = clampYear(Number(yearInput.value) || state.year);
    state.year = nextYear;
    yearInput.value = String(nextYear);
    ensureMonthData(); saveState(); render();
  });

  notesInput.addEventListener("input", () => {
    state.notesByMonth[getMonthKey()] = notesInput.value;
    saveState();
  });

  if (jumpCurrentMonth) {
    jumpCurrentMonth.addEventListener("click", () => {
      const today = new Date();
      state.month = today.getMonth();
      state.year = today.getFullYear();
      ensureMonthData(); saveState(); render();
      document.getElementById("dashboard").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  addHabitButton.addEventListener("click", () => addHabit());
}

function loadState() {
  const today = new Date();
  state.month = today.getMonth();
  state.year = today.getFullYear();
  state.habits = cloneDefaultHabits();

  const saved = localStorage.getItem(storagePrefix);
  if (saved) {
    const parsed = JSON.parse(saved);
    state.month = Number.isInteger(parsed.month) ? parsed.month : state.month;
    state.year = Number.isInteger(parsed.year) ? parsed.year : state.year;
    state.habits = normalizeHabits(parsed.habits);
    state.notesByMonth = parsed.notesByMonth && typeof parsed.notesByMonth === "object" ? parsed.notesByMonth : {};
    state.checks = parsed.checks && typeof parsed.checks === "object" ? parsed.checks : {};
  }

  yearInput.value = String(state.year);
  monthSelect.value = String(state.month);
  notesInput.value = state.notesByMonth[getMonthKey()] || "";
  ensureMonthData();
}

function saveState() {
  localStorage.setItem(storagePrefix, JSON.stringify(state));
}

function cloneDefaultHabits() { return defaultHabits.map((h) => ({ ...h })); }

function normalizeHabits(savedHabits) {
  if (!Array.isArray(savedHabits) || savedHabits.length === 0) return cloneDefaultHabits();
  return savedHabits.map((habit, index) => ({
    id: typeof habit.id === "string" && habit.id ? habit.id : createHabitId(index),
    name: typeof habit.name === "string" && habit.name.trim() ? habit.name.trim() : `Habit ${index + 1}`,
    target: typeof habit.target === "string" && habit.target.trim() ? habit.target.trim() : "Daily",
    color: typeof habit.color === "string" && habit.color.trim() ? habit.color.trim() : habitPalette[index % habitPalette.length],
  }));
}

function clampYear(v) { return Math.min(2100, Math.max(2000, v)); }
function getMonthKey() { return `${state.year}-${String(state.month + 1).padStart(2, "0")}`; }
function getDaysInMonth() { return new Date(state.year, state.month + 1, 0).getDate(); }
function currentHabits() { return state.habits; }

function ensureMonthData() {
  const monthKey = getMonthKey();
  const totalDays = getDaysInMonth();
  if (!state.checks[monthKey]) state.checks[monthKey] = {};
  if (!state.notesByMonth[monthKey]) state.notesByMonth[monthKey] = defaultMonthlyNote();
  for (const habit of currentHabits()) {
    if (!Array.isArray(state.checks[monthKey][habit.id])) {
      state.checks[monthKey][habit.id] = Array.from({ length: totalDays }, () => false);
      continue;
    }
    const existing = state.checks[monthKey][habit.id].map((v) => (typeof v === "boolean" ? v : false)).slice(0, totalDays);
    while (existing.length < totalDays) existing.push(false);
    state.checks[monthKey][habit.id] = existing;
  }
}

// ── Habit list (left rail) ────────────────────────────────────────────────────
function renderHabitList() {
  habitList.innerHTML = currentHabits()
    .map((h) => `
      <div class="habit-row">
        <span class="habit-badge" style="--habit-color:${h.color}"></span>
        <div class="habit-name">
          <div class="habit-copy">
            <span>${h.name}</span>
            <span class="habit-target">${h.target}</span>
          </div>
          <div class="habit-row-actions">
            <button class="habit-row-btn" type="button" data-role="edit-habit-inline" data-id="${h.id}">Edit</button>
            <button class="habit-row-btn habit-row-btn--danger" type="button" data-role="delete-habit-inline" data-id="${h.id}">Del</button>
          </div>
        </div>
      </div>`)
    .join("");

  for (const btn of habitList.querySelectorAll("[data-role='edit-habit-inline']")) {
    btn.addEventListener("click", handleInlineHabitEdit);
  }
  for (const btn of habitList.querySelectorAll("[data-role='delete-habit-inline']")) {
    btn.addEventListener("click", handleDeleteHabit);
  }
}

// ── Edit Habits panel (right side-panel, now hidden by default) ───────────────
function renderHabitEditor() {
  habitEditorList.innerHTML = currentHabits()
    .map((h) => `
      <div class="habit-editor-card">
        <div class="habit-editor-top">
          <span class="habit-editor-color" style="background:${h.color}"></span>
          <strong>${h.name}</strong>
        </div>
        <div class="habit-editor-fields">
          <input type="text" value="${escapeAttribute(h.name)}" data-role="habit-name" data-id="${h.id}" placeholder="Habit name"/>
          <input type="text" value="${escapeAttribute(h.target)}" data-role="habit-target" data-id="${h.id}" placeholder="Target"/>
        </div>
        <div class="habit-editor-actions">
          <button class="text-btn" type="button" data-role="delete-habit" data-id="${h.id}">Delete</button>
        </div>
      </div>`)
    .join("");

  for (const input of habitEditorList.querySelectorAll("input")) {
    input.addEventListener("change", handleHabitFieldChange);
    input.addEventListener("blur", handleHabitFieldChange);
  }
  for (const btn of habitEditorList.querySelectorAll("[data-role='delete-habit']")) {
    btn.addEventListener("click", handleDeleteHabit);
  }
}

function handleHabitFieldChange(event) {
  const input = event.currentTarget;
  const habit = currentHabits().find((h) => h.id === input.dataset.id);
  if (!habit) return;
  if (input.dataset.role === "habit-name") habit.name = input.value.trimStart() || "Untitled Habit";
  if (input.dataset.role === "habit-target") habit.target = input.value.trimStart() || "Daily";
  saveState(); render();
}

function handleDeleteHabit(event) {
  const habitId = event.currentTarget.dataset.id;
  if (currentHabits().length <= 1) return;
  state.habits = currentHabits().filter((h) => h.id !== habitId);
  for (const md of Object.values(state.checks)) delete md[habitId];
  saveState(); render();
}

function handleInlineHabitEdit(event) {
  const habitId = event.currentTarget.dataset.id;
  const actionGroup = event.currentTarget.closest(".habit-row-actions");
  if (!actionGroup) return;
  openHabitEditorPopover(habitId, actionGroup);
}

function addHabit() {
  const index = currentHabits().length;
  const newHabit = {
    id: createHabitId(Date.now()),
    name: `New Habit ${index + 1}`,
    target: "Daily",
    color: habitPalette[index % habitPalette.length],
  };
  state.habits = [...currentHabits(), newHabit];
  for (const monthKey of Object.keys(state.checks)) {
    const [year, month] = monthKey.split("-").map(Number);
    state.checks[monthKey][newHabit.id] = Array.from({ length: new Date(year, month, 0).getDate() }, () => false);
  }
  ensureMonthData(); saveState(); render();
}

function createHabitId(seed) {
  return `habit-${String(seed).replace(/\D/g, "").slice(-8) || Date.now()}`;
}

// ── Main render ───────────────────────────────────────────────────────────────
function render() {
  const monthKey = getMonthKey();
  const days = getDaysInMonth();
  const habits = currentHabits();
  const habitChecks = state.checks[monthKey];

  const dailyTotals = Array.from({ length: days }, (_, di) =>
    habits.reduce((sum, h) => sum + (habitChecks[h.id][di] ? 1 : 0), 0)
  );
  const weeklyTotals = groupIntoWeeks(dailyTotals);
  const totalTarget = days * habits.length;
  const completed = dailyTotals.reduce((s, v) => s + v, 0);
  const left = totalTarget - completed;
  const percent = totalTarget === 0 ? 0 : Math.round((completed / totalTarget) * 100);

  monthHeading.textContent = months[state.month];
  yearHeading.textContent = state.year;
  yearInput.value = String(state.year);
  monthSelect.value = String(state.month);
  notesInput.value = state.notesByMonth[monthKey] || "";

  renderHabitList();
  renderHabitEditor();
  renderDailyChart(dailyTotals, habits.length);
  renderWeeklyChart(weeklyTotals, habits.length);
  renderCalendar(days, habitChecks, habits);
  renderAnalysis(days, habitChecks, habits);
  renderTopHabits(habitChecks, habits);
  renderMoodStrip(dailyTotals, habits.length);
  renderHeroPreview(dailyTotals, percent, habits.length);
  renderHistoryPanel();

  goalTarget.textContent = totalTarget;
  goalCompleted.textContent = completed;
  goalLeft.textContent = left;
  completionPercent.textContent = `${percent}%`;
  donutChart.style.setProperty("--angle", `${Math.round((percent / 100) * 360)}deg`);
  dailyAverageLabel.textContent = `${Math.round(average(dailyTotals, habits.length) * 100)}% avg`;
  bestWeekLabel.textContent = `Week ${bestWeekIndex(weeklyTotals) + 1}`;

  const moodScore = average(dailyTotals, habits.length);
  moodValue.textContent = moodDescriptor(moodScore);
  motivationValue.textContent = `${Math.round(moodScore * 100)}%`;
}

// ── Charts ────────────────────────────────────────────────────────────────────
function renderDailyChart(dailyTotals, habitCount) {
  const maxValue = Math.max(habitCount, 1);
  dailyChart.style.setProperty("--days", String(dailyTotals.length));
  dailyAxis.style.setProperty("--days", String(dailyTotals.length));
  dailyChart.innerHTML = dailyTotals
    .map((value, i) => {
      const height = Math.max(12, (value / maxValue) * 100);
      const pct = Math.round((value / maxValue) * 100);
      return `<div class="chart-bar" style="height:${height}%" data-label="Day ${i + 1}: ${pct}%"></div>`;
    })
    .join("");
  dailyAxis.innerHTML = dailyTotals.map((_, i) => `<span>${i + 1}</span>`).join("");
}

function renderWeeklyChart(weeklyTotals, habitCount) {
  const maxWeek = Math.max(...weeklyTotals, 1);
  weeklyChart.innerHTML = weeklyTotals
    .map((value, i) => {
      const height = Math.max(16, (value / maxWeek) * 100);
      const normalized = Math.round((value / (7 * Math.max(habitCount, 1))) * 100);
      return `<div class="chart-bar" style="height:${height}%" data-label="Week ${i + 1}: ${normalized}%"></div>`;
    })
    .join("");
}

// ── Calendar with inline habit label editing ──────────────────────────────────
function renderCalendar(days, habitChecks, habits) {
  if (isMobileCalendar()) {
    renderMobileCalendar(days, habitChecks, habits);
    return;
  }

  calendarGrid.style.setProperty("--days", String(days));
  const weekSpans = buildWeekSpans(days);

  const weekBand = `
    <div class="calendar-head">
      <div class="week-label-blank">
        <button class="add-habit-inline-btn" id="addHabitInlineBtn" type="button" title="Add a new habit">+ Add habit</button>
      </div>
      ${weekSpans.map((span, i) => `<div class="week-band" style="grid-column: span ${span}">Week ${i + 1}</div>`).join("")}
    </div>`;

  const headRow = `
    <div class="calendar-head">
      <div class="calendar-label">Habits</div>
      ${Array.from({ length: days }, (_, i) => {
        const date = new Date(state.year, state.month, i + 1);
        return `<div class="head-cell"><span>${weekdayLabels[date.getDay()]}</span><strong>${i + 1}</strong></div>`;
      }).join("")}
    </div>`;

  const habitRows = habits
    .map((habit) => `
      <div class="calendar-row">
        <div class="calendar-label calendar-label-editable" data-habit-id="${habit.id}">
          <span class="habit-dot" style="background:${habit.color}"></span>
          <span class="habit-label-text">${habit.name}</span>
          <span class="habit-label-actions">
            <button class="habit-label-edit-btn" data-habit-id="${habit.id}" title="Rename habit">✎</button>
            <button class="habit-label-delete-btn" data-habit-id="${habit.id}" title="Delete habit">✕</button>
          </span>
        </div>
        ${habitChecks[habit.id].map((checked, dayIndex) => `
          <label class="day-cell">
            <span class="habit-check">
              <input type="checkbox" data-habit="${habit.id}" data-day="${dayIndex}" ${checked ? "checked" : ""}/>
              <span></span>
            </span>
          </label>`).join("")}
      </div>`)
    .join("");

  calendarGrid.innerHTML = weekBand + headRow + habitRows;

  document.getElementById("addHabitInlineBtn").addEventListener("click", () => addHabit());

  for (const checkbox of calendarGrid.querySelectorAll("input[type='checkbox']")) {
    checkbox.addEventListener("change", (e) => {
      const input = e.currentTarget;
      state.checks[getMonthKey()][input.dataset.habit][Number(input.dataset.day)] = input.checked;
      saveState(); render();
    });
  }

  for (const btn of calendarGrid.querySelectorAll(".habit-label-edit-btn")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openInlineHabitEditor(btn.dataset.habitId, btn.closest(".habit-label-actions") || btn, { preferAbove: true });
    });
  }

  for (const btn of calendarGrid.querySelectorAll(".habit-label-delete-btn")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const habitId = btn.dataset.habitId;
      if (currentHabits().length <= 1) return;
      if (!confirm("Delete this habit and all its data?")) return;
      state.habits = currentHabits().filter((h) => h.id !== habitId);
      for (const md of Object.values(state.checks)) delete md[habitId];
      saveState(); render();
    });
  }
}

function renderMobileCalendar(days, habitChecks, habits) {
  syncMobileWeekIndex(days);

  const weekRanges = buildWeekRanges(days);
  const activeWeek = weekRanges[mobileWeekIndex] || weekRanges[0];
  const visibleDays = Array.from(
    { length: activeWeek.end - activeWeek.start + 1 },
    (_, offset) => activeWeek.start + offset
  );

  calendarGrid.style.setProperty("--days", String(visibleDays.length));
  calendarGrid.classList.add("calendar-grid--mobile-week");

  const weekBand = `
    <div class="calendar-head calendar-head--mobile-nav">
      <button class="calendar-week-nav" id="mobileWeekPrev" type="button" ${mobileWeekIndex === 0 ? "disabled" : ""}>Prev</button>
      <div class="week-band week-band--mobile">Week ${mobileWeekIndex + 1}</div>
      <button class="calendar-week-nav" id="mobileWeekNext" type="button" ${mobileWeekIndex === weekRanges.length - 1 ? "disabled" : ""}>Next</button>
    </div>
    <div class="calendar-head calendar-head--mobile-add">
      <button class="add-habit-inline-btn add-habit-inline-btn--mobile" id="addHabitInlineBtn" type="button" title="Add a new habit">+ Add habit</button>
      <div class="calendar-mobile-range">Days ${activeWeek.start + 1}-${activeWeek.end + 1}</div>
    </div>`;

  const headRow = `
    <div class="calendar-head calendar-head--mobile-days">
      <div class="calendar-label">Habits</div>
      ${visibleDays.map((dayIndex) => {
        const date = new Date(state.year, state.month, dayIndex + 1);
        return `<div class="head-cell"><span>${weekdayLabels[date.getDay()]}</span><strong>${dayIndex + 1}</strong></div>`;
      }).join("")}
    </div>`;

  const habitRows = habits
    .map((habit) => `
      <div class="calendar-row calendar-row--mobile">
        <div class="calendar-label calendar-label-editable" data-habit-id="${habit.id}">
          <span class="habit-dot" style="background:${habit.color}"></span>
          <span class="habit-label-text">${habit.name}</span>
          <span class="habit-label-actions">
            <button class="habit-label-edit-btn" data-habit-id="${habit.id}" title="Rename habit">Edit</button>
            <button class="habit-label-delete-btn" data-habit-id="${habit.id}" title="Delete habit">Del</button>
          </span>
        </div>
        ${visibleDays.map((dayIndex) => `
          <label class="day-cell">
            <span class="habit-check">
              <input type="checkbox" data-habit="${habit.id}" data-day="${dayIndex}" ${habitChecks[habit.id][dayIndex] ? "checked" : ""}/>
              <span></span>
            </span>
          </label>`).join("")}
      </div>`)
    .join("");

  calendarGrid.innerHTML = weekBand + headRow + habitRows;

  document.getElementById("addHabitInlineBtn").addEventListener("click", () => addHabit());

  const prevBtn = document.getElementById("mobileWeekPrev");
  const nextBtn = document.getElementById("mobileWeekNext");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      mobileWeekIndex = Math.max(0, mobileWeekIndex - 1);
      render();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      mobileWeekIndex = Math.min(weekRanges.length - 1, mobileWeekIndex + 1);
      render();
    });
  }

  for (const checkbox of calendarGrid.querySelectorAll("input[type='checkbox']")) {
    checkbox.addEventListener("change", (e) => {
      const input = e.currentTarget;
      state.checks[getMonthKey()][input.dataset.habit][Number(input.dataset.day)] = input.checked;
      saveState(); render();
    });
  }

  for (const btn of calendarGrid.querySelectorAll(".habit-label-edit-btn")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openInlineHabitEditor(btn.dataset.habitId);
    });
  }

  for (const btn of calendarGrid.querySelectorAll(".habit-label-delete-btn")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const habitId = btn.dataset.habitId;
      if (currentHabits().length <= 1) return;
      if (!confirm("Delete this habit and all its data?")) return;
      state.habits = currentHabits().filter((h) => h.id !== habitId);
      for (const md of Object.values(state.checks)) delete md[habitId];
      saveState(); render();
    });
  }
}

function openInlineHabitEditor(habitId, anchorEl, options = {}) {
  const fallbackEl = calendarGrid.querySelector(`.calendar-label-editable[data-habit-id="${habitId}"]`);
  openHabitEditorPopover(habitId, anchorEl || fallbackEl, options);
}

function openHabitEditorPopover(habitId, anchorEl, options = {}) {
  const habit = currentHabits().find((h) => h.id === habitId);
  if (!habit || !anchorEl) return;

  // Close any existing popover
  document.querySelectorAll(".habit-edit-popover").forEach((p) => p.remove());

  const popover = document.createElement("div");
  popover.className = "habit-edit-popover";
  popover.innerHTML = `
    <label>
      <span class="popover-field-label">Habit name</span>
      <input class="popover-name-input" type="text" value="${escapeAttribute(habit.name)}" placeholder="Habit name" maxlength="60"/>
    </label>
    <label>
      <span class="popover-field-label">Target / note</span>
      <input class="popover-target-input" type="text" value="${escapeAttribute(habit.target)}" placeholder="e.g. Daily, 30 min" maxlength="30"/>
    </label>
    <div class="popover-actions">
      <button class="popover-save-btn" type="button">Save</button>
      <button class="popover-cancel-btn" type="button">Cancel</button>
    </div>`;

  anchorEl.appendChild(popover);
  placeHabitEditorPopover(popover, anchorEl, options);

  const nameInput   = popover.querySelector(".popover-name-input");
  const targetInput = popover.querySelector(".popover-target-input");
  const saveBtn     = popover.querySelector(".popover-save-btn");
  const cancelBtn   = popover.querySelector(".popover-cancel-btn");

  nameInput.focus();
  nameInput.select();

  function savePopover() {
    habit.name   = nameInput.value.trim() || habit.name;
    habit.target = targetInput.value.trim() || habit.target;
    saveState(); render();
  }

  function closePopover() { popover.remove(); }

  saveBtn.addEventListener("click", savePopover);
  cancelBtn.addEventListener("click", closePopover);
  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); targetInput.focus(); } if (e.key === "Escape") closePopover(); });
  targetInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); savePopover(); } if (e.key === "Escape") closePopover(); });
  popover.addEventListener("click", (e) => e.stopPropagation());

  // Close if clicking outside
  setTimeout(() => {
    document.addEventListener("click", function outsideClick() {
      closePopover();
      document.removeEventListener("click", outsideClick);
    });
  }, 0);
}

function placeHabitEditorPopover(popover, anchorEl, options = {}) {
  if (!popover || !anchorEl) return;

  popover.classList.remove("habit-edit-popover--above", "habit-edit-popover--align-left");
  if (options.preferAbove) {
    popover.classList.add("habit-edit-popover--above");
  }

  const rect = popover.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  if (!options.preferAbove && rect.bottom > viewportHeight - 16 && rect.top > rect.height + 24) {
    popover.classList.add("habit-edit-popover--above");
  }

  const adjustedRect = popover.getBoundingClientRect();
  if (adjustedRect.right > viewportWidth - 16) {
    popover.classList.add("habit-edit-popover--align-left");
  }
}

// ── Analysis ──────────────────────────────────────────────────────────────────
function renderAnalysis(days, habitChecks, habits) {
  analysisBody.innerHTML = habits
    .map((habit) => {
      const actual = habitChecks[habit.id].filter(Boolean).length;
      const left = days - actual;
      const pct = Math.round((actual / days) * 100) || 0;
      return `
        <div class="analysis-row">
          <span>${days}</span>
          <span>${actual}</span>
          <span>${left}</span>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span>${pct}</span>
        </div>`;
    })
    .join("");
}

// ── Top 10 — editable via +/− buttons ────────────────────────────────────────
function renderTopHabits(habitChecks, habits) {
  const ranked = habits
    .map((h) => ({ id: h.id, name: h.name, count: habitChecks[h.id].filter(Boolean).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  streakList.innerHTML = ranked
    .map((item, i) => `
      <li class="streak-item">
        <span class="streak-rank">${i + 1}.</span>
        <span class="streak-name">${item.name}</span>
        <span class="streak-count-wrap">
          <button class="streak-adj-btn" data-habit-id="${item.id}" data-action="dec" title="Remove one check">−</button>
          <strong class="streak-count">${item.count}</strong>
          <button class="streak-adj-btn" data-habit-id="${item.id}" data-action="inc" title="Add one check">+</button>
        </span>
      </li>`)
    .join("");

  for (const btn of streakList.querySelectorAll(".streak-adj-btn")) {
    btn.addEventListener("click", () => {
      const habitId = btn.dataset.habitId;
      const action  = btn.dataset.action;
      const monthKey = getMonthKey();
      const checksArr = state.checks[monthKey][habitId];
      if (!checksArr) return;

      if (action === "inc") {
        const first = checksArr.findIndex((v) => !v);
        if (first !== -1) checksArr[first] = true;
      } else {
        let last = -1;
        for (let i = checksArr.length - 1; i >= 0; i--) { if (checksArr[i]) { last = i; break; } }
        if (last !== -1) checksArr[last] = false;
      }
      saveState(); render();
    });
  }
}

// ── Mood strip ────────────────────────────────────────────────────────────────
function renderMoodStrip(dailyTotals, habitCount) {
  const maxValue = Math.max(habitCount, 1);
  moodStrip.style.setProperty("--days", String(dailyTotals.length));
  moodStrip.innerHTML = dailyTotals
    .map((value, i) => {
      const height = Math.max(8, (value / maxValue) * 46);
      return `<div class="mood-cell"><i style="height:${height}px"></i><span>${i + 1}</span></div>`;
    })
    .join("");
}

// ── Month History panel ───────────────────────────────────────────────────────
function renderHistoryPanel() {
  const container = document.getElementById("historyBody");
  if (!container) return;

  const habits = currentHabits();
  const currentKey = getMonthKey();

  const allKeys = Object.keys(state.checks)
    .filter((k) => k !== currentKey)
    .sort((a, b) => b.localeCompare(a));

  if (allKeys.length === 0) {
    container.innerHTML = `<p class="history-empty">No past months yet. Your history will appear here once you navigate to a new month.</p>`;
    return;
  }

  container.innerHTML = allKeys
    .map((key) => {
      const [yearStr, monthStr] = key.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr) - 1;
      const days = new Date(year, month + 1, 0).getDate();
      const monthChecks = state.checks[key];

      let completed = 0, total = 0;
      for (const habit of habits) {
        const arr = monthChecks[habit.id];
        if (!Array.isArray(arr)) continue;
        total += days;
        completed += arr.filter(Boolean).length;
      }
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const label = moodDescriptor(total > 0 ? completed / total : 0);

      return `
        <div class="history-card">
          <div class="history-month-label">
            <span class="history-month-name">${months[month]} ${year}</span>
            <span class="history-badge history-badge--${label.toLowerCase().replace(" ", "-")}">${label}</span>
          </div>
          <div class="history-stats">
            <span>${completed} / ${total} checks</span>
            <span class="history-pct">${pct}%</span>
          </div>
          <div class="history-bar-wrap"><div class="history-bar" style="width:${pct}%"></div></div>
          <div class="history-habit-breakdown">
            ${habits.map((habit) => {
              const arr = monthChecks[habit.id];
              if (!Array.isArray(arr)) return "";
              const cnt = arr.filter(Boolean).length;
              const p = Math.round((cnt / days) * 100);
              return `
                <div class="history-habit-row">
                  <span class="history-habit-dot" style="background:${habit.color}"></span>
                  <span class="history-habit-name">${habit.name}</span>
                  <span class="history-habit-count">${cnt}/${days}</span>
                  <div class="history-mini-bar-wrap"><div class="history-mini-bar" style="width:${p}%;background:${habit.color}"></div></div>
                  <span class="history-habit-pct">${p}%</span>
                </div>`;
            }).join("")}
          </div>
          <button class="history-jump-btn" data-key="${key}" type="button">View this month →</button>
        </div>`;
    })
    .join("");

  for (const btn of container.querySelectorAll(".history-jump-btn")) {
    btn.addEventListener("click", () => {
      const [yearStr, monthStr] = btn.dataset.key.split("-");
      state.year  = Number(yearStr);
      state.month = Number(monthStr) - 1;
      ensureMonthData(); saveState(); render();
      document.getElementById("dashboard").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

// ── Hero preview ──────────────────────────────────────────────────────────────
function renderHeroPreview(dailyTotals, percent, habitCount) {
  if (!heroConsistency || !heroBandFill || !heroMiniGrid) return;
  heroConsistency.textContent = `${percent}%`;
  heroBandFill.style.width = `${percent}%`;
  const sample = dailyTotals.slice(0, 12);
  const padded = sample.length >= 12 ? sample : [...sample, ...Array(12 - sample.length).fill(0)];
  const maxValue = Math.max(...padded, habitCount, 1);
  heroMiniGrid.innerHTML = padded
    .map((value, i) => {
      const fill = Math.max(14, Math.round((value / maxValue) * 100));
      return `<div class="preview-mini-cell" style="--fill:${fill}%" title="Day ${i + 1}: ${value}/${Math.max(habitCount, 1)}"></div>`;
    })
    .join("");
}

function setupHeroMiniGrid() {
  if (!heroMiniGrid) return;
  heroMiniGrid.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const fill = 24 + ((i * 5) % 34);
    return `<div class="preview-mini-cell" style="--fill:${fill}%"></div>`;
  }).join("");
}

function setupRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => { for (const e of entries) { if (e.isIntersecting) e.target.classList.add("is-visible"); } },
    { threshold: 0.16 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupIntoWeeks(dailyTotals) {
  const totals = [];
  for (let i = 0; i < dailyTotals.length; i += 7)
    totals.push(dailyTotals.slice(i, i + 7).reduce((s, v) => s + v, 0));
  while (totals.length < 5) totals.push(0);
  return totals;
}

function buildWeekSpans(days) {
  const spans = [];
  let remaining = days;
  while (remaining > 0) { spans.push(Math.min(7, remaining)); remaining -= 7; }
  return spans;
}

function buildWeekRanges(days) {
  const ranges = [];
  for (let start = 0; start < days; start += 7) {
    ranges.push({ start, end: Math.min(days - 1, start + 6) });
  }
  return ranges;
}

function isMobileCalendar() {
  return mobileCalendarQuery ? mobileCalendarQuery.matches : window.innerWidth <= 640;
}

function syncMobileWeekIndex(days) {
  const monthKey = getMonthKey();
  const maxWeekIndex = Math.max(0, Math.ceil(days / 7) - 1);
  if (mobileWeekMonthKey !== monthKey) {
    mobileWeekMonthKey = monthKey;
    mobileWeekIndex = defaultMobileWeekIndex(maxWeekIndex);
  } else {
    mobileWeekIndex = Math.min(maxWeekIndex, Math.max(0, mobileWeekIndex));
  }
}

function defaultMobileWeekIndex(maxWeekIndex) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === state.year && today.getMonth() === state.month;
  if (!isCurrentMonth) return 0;
  return Math.min(maxWeekIndex, Math.floor((today.getDate() - 1) / 7));
}

function average(list, habitCount) {
  if (list.length === 0 || habitCount === 0) return 0;
  return list.reduce((s, v) => s + v / habitCount, 0) / list.length;
}

function bestWeekIndex(weeklyTotals) { return weeklyTotals.indexOf(Math.max(...weeklyTotals)); }

function moodDescriptor(score) {
  if (score >= 0.85) return "Locked in";
  if (score >= 0.65) return "Steady";
  if (score >= 0.45) return "Rebuilding";
  return "Needs reset";
}

function seedMonthData(totalDays) {
  const seeded = {};
  for (const habit of currentHabits())
    seeded[habit.id] = Array.from({ length: totalDays }, () => false);
  return seeded;
}

function defaultMonthlyNote() {
  return "Focus on consistency over perfect streaks. Protect sleep, plan the next day before bed, and use the weekly chart to catch dips early.";
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
