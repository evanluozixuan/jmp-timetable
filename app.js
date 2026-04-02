let timetable = [];

const defaultProfile = {
  campus: "Callaghan",
  year: 1,
  pblGroup: "A",
  clinicalGroup: "C"
};

let userProfile = loadProfile();

async function loadTimetable() {
  try {
    const res = await fetch("./timetable.json");
    timetable = await res.json();
    populateFilterUI();
  } catch (err) {
    console.error("Failed to load timetable:", err);
  }
}

function loadProfile() {
  const saved = localStorage.getItem("userProfile");
  if (!saved) return { ...defaultProfile };

  try {
    const parsed = JSON.parse(saved);
    return {
      campus: parsed.campus || defaultProfile.campus,
      year: Number(parsed.year) || defaultProfile.year,
      pblGroup: parsed.pblGroup || defaultProfile.pblGroup,
      clinicalGroup: parsed.clinicalGroup || defaultProfile.clinicalGroup
    };
  } catch {
    return { ...defaultProfile };
  }
}

function saveProfile() {
  const campus = document.getElementById("campusSelect").value;
  const year = Number(document.getElementById("yearSelect").value);
  const pblGroup = document.getElementById("pblSelect").value;
  const clinicalGroup = document.getElementById("clinicalSelect").value;

  userProfile = {
    campus,
    year,
    pblGroup,
    clinicalGroup
  };

  localStorage.setItem("userProfile", JSON.stringify(userProfile));

  const saveStatus = document.getElementById("saveStatus");
  saveStatus.textContent = "Filters saved.";
}

function populateFilterUI() {
  document.getElementById("campusSelect").value = userProfile.campus;
  document.getElementById("yearSelect").value = String(userProfile.year);
  document.getElementById("pblSelect").value = userProfile.pblGroup;
  document.getElementById("clinicalSelect").value = userProfile.clinicalGroup;
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function matchesProfile(item, profile) {
  const campusOk =
    Array.isArray(item.campus) && item.campus.includes(profile.campus);

  const yearOk =
    Array.isArray(item.year) && item.year.includes(profile.year);

  const pblOk =
    Array.isArray(item.pblGroups) && item.pblGroups.includes(profile.pblGroup);

  const clinicalOk =
    Array.isArray(item.clinicalGroups) &&
    item.clinicalGroups.includes(profile.clinicalGroup);

  return campusOk && yearOk && pblOk && clinicalOk;
}

function getFilteredClasses() {
  return timetable.filter(item => matchesProfile(item, userProfile));
}

function getTodaysClasses() {
  const today = getTodayString();

  return getFilteredClasses()
    .filter(item => item.date === today)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

function getNextClassToday() {
  const nowMinutes = getNowMinutes();
  const todays = getTodaysClasses();

  return todays.find(item => timeToMinutes(item.start) >= nowMinutes) || null;
}

function getNextUpcomingClass() {
  const nowMinutes = getNowMinutes();
  const today = getTodayString();

  const filtered = getFilteredClasses().sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return timeToMinutes(a.start) - timeToMinutes(b.start);
  });

  for (const item of filtered) {
    if (item.date > today) return item;
    if (item.date === today && timeToMinutes(item.start) >= nowMinutes) return item;
  }

  return null;
}

function renderSession(item) {
  return `
    <div class="session">
      <strong>${item.title}</strong><br>
      ${item.type}<br>
      ${item.date}<br>
      ${item.start}–${item.end}<br>
      ${item.location}
    </div>
  `;
}

function showTodaysClasses() {
  const todayResult = document.getElementById("todayResult");
  const todays = getTodaysClasses();

  if (todays.length === 0) {
    todayResult.innerHTML = "<p>No classes today.</p>";
    return;
  }

  todayResult.innerHTML = todays.map(renderSession).join("");
}

function showNextClass() {
  const nextResult = document.getElementById("nextResult");
  const next = getNextUpcomingClass();

  if (!next) {
    nextResult.innerHTML = "<p>No upcoming classes found.</p>";
    return;
  }

  nextResult.innerHTML = renderSession(next);
}

document.getElementById("saveFiltersBtn").addEventListener("click", saveProfile);
document.getElementById("todayBtn").addEventListener("click", showTodaysClasses);
document.getElementById("nextBtn").addEventListener("click", showNextClass);

loadTimetable();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(err => {
      console.error("Service worker registration failed:", err);
    });
  });
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
