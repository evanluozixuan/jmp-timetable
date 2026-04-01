let timetable = [];


let selectedGroup = localStorage.getItem("group") || "all";

async function loadTimetable() {
  const res = await fetch("./timetable.json");
  timetable = await res.json();
  setupGroups();
}

function setupGroups() {
  const select = document.getElementById("groupSelect");
  const groups = ["all", ...new Set(timetable.map(x => x.groupValue).filter(Boolean))];

  select.innerHTML = groups
    .map(g => `<option value="${g}">${g}</option>`)
    .join("");

  select.value = selectedGroup;
  select.addEventListener("change", () => {
    selectedGroup = select.value;
    localStorage.setItem("group", selectedGroup);
  });
}

function getTodayString() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function filteredForUser(items) {
  return items.filter(item => {
    return item.groupValue === "all" || selectedGroup === "all" || item.groupValue === selectedGroup;
  });
}

function getTodaysClasses() {
  const today = getTodayString();
  return filteredForUser(timetable)
    .filter(item => item.date === today)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

function getNextClass() {
  const nowMins = getNowMinutes();
  const todays = getTodaysClasses();
  return todays.find(item => timeToMinutes(item.start) >= nowMins) || null;
}

document.getElementById("todayBtn").addEventListener("click", () => {
  const today = getTodaysClasses();
  const el = document.getElementById("todayResult");

  if (!today.length) {
    el.innerHTML = "<p>No classes today.</p>";
    return;
  }

  el.innerHTML = today.map(item => `
    <div class="session">
      <strong>${item.start}–${item.end}</strong><br>
      ${item.title}<br>
      ${item.location}
    </div>
  `).join("");
});

document.getElementById("nextBtn").addEventListener("click", () => {
  const next = getNextClass();
  const el = document.getElementById("nextResult");

  if (!next) {
    el.innerHTML = "<p>No more classes today.</p>";
    return;
  }

  el.innerHTML = `
    <div class="session">
      <strong>${next.title}</strong><br>
      ${next.start}–${next.end}<br>
      ${next.location}
    </div>
  `;
});

loadTimetable();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}
