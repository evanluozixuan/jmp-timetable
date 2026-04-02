let timetable = [];

const defaultProfile = {
  campus: "Central Coast",
  year: 2,
  pblGroup: "A",
  clinicalGroup: "A"
};

let userProfile = loadProfile();

async function loadTimetable() {
  try {
    const res = await fetch("./timetable.json");
    timetable = await res.json();
    populateFilterUI();
    refreshResults();
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

function getCurrentProfileFromUI() {
  return {
    campus: document.getElementById("campusSelect").value,
    year: Number(document.getElementById("yearSelect").value),
    pblGroup: document.getElementById("pblSelect").value,
    clinicalGroup: document.getElementById("clinicalSelect").value
  };
}

function saveProfile() {
  userProfile = getCurrentProfileFromUI();
  localStorage.setItem("userProfile", JSON.stringify(userProfile));
  document.getElementById("saveStatus").textContent = "Filters saved.";
  refreshResults();
}

function populateFilterUI() {
  document.getElementById("campusSelect").value = userProfile.campus;
  document.getElementById("yearSelect").value = String(userProfile.year);
  document.getElementById("pblSelect").value = userProfile.pblGroup;
  document.getElementById("clinicalSelect").value = userProfile.clinicalGroup;
}

function handleFilterChange() {
  userProfile = getCurrentProfileFromUI();
  document.getElementById("saveStatus").textContent = "";
  refreshResults();
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function matchesWildcard(value, selectedValue) {
  return value === "all" || value === selectedValue;
}

function matchesProfile(item, profile) {
  const campusOk = item.campus === profile.campus;
  const yearOk = Number(item.year) === Number(profile.year);
  const pblOk = matchesWildcard(item.pblGroups, profile.pblGroup);
  const clinicalOk = matchesWildcard(item.clinicalGroups, profile.clinicalGroup);

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

function getNextUpcomingClass() {
  const today = getTodayString();
  const nowMinutes = getNowMinutes();

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
      <strong>${item.title} ${item.type}</strong><br>
      ${item.date}<br>
      ${item.start}–${item.end}<br>
      ${item.location}<br>
      ${item.attendance}<br>
    </div>
  `;
}

function showTodaysClasses() {
  const todayResult = document.getElementById("todayResult");
  const todays = getTodaysClasses();

  if (todays.length === 0) {
    todayResult.innerHTML = "<p>No classes today for your selected filters.</p>";
    return;
  }

  todayResult.innerHTML = todays.map(renderSession).join("");
}

function showNextClass() {
  const nextResult = document.getElementById("nextResult");
  const next = getNextUpcomingClass();

  if (!next) {
    nextResult.innerHTML = "<p>No upcoming classes found for your selected filters.</p>";
    return;
  }

  nextResult.innerHTML = renderSession(next);
}

function refreshResults() {
  showNextClass();
  showTodaysClasses();
}

document.getElementById("saveFiltersBtn").addEventListener("click", saveProfile);

document.getElementById("campusSelect").addEventListener("change", handleFilterChange);
document.getElementById("yearSelect").addEventListener("change", handleFilterChange);
document.getElementById("pblSelect").addEventListener("change", handleFilterChange);
document.getElementById("clinicalSelect").addEventListener("change", handleFilterChange);

loadTimetable();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(err => {
      console.error("Service worker registration failed:", err);
    });
  });
}  return `${year}-${month}-${day}`;
}

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function matchesWildcard(value, selectedValue) {
  return value === "all" || value === selectedValue;
}

function matchesProfile(item, profile) {
  const campusOk = item.campus === profile.campus;
  const yearOk = Number(item.year) === Number(profile.year);
  const pblOk = matchesWildcard(item.pblGroups, profile.pblGroup);
  const clinicalOk = matchesWildcard(item.clinicalGroups, profile.clinicalGroup);

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

function getNextUpcomingClass() {
  const today = getTodayString();
  const nowMinutes = getNowMinutes();

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
      <strong>${item.title} ${item.type}</strong><br>
      ${item.date}<br>
      ${item.start}–${item.end}<br>
      ${item.location}<br>
      ${item.attendance}<br>
    </div>
  `;
}

function showTodaysClasses() {
  const todayResult = document.getElementById("todayResult");
  const todays = getTodaysClasses();

  if (todays.length === 0) {
    todayResult.innerHTML = "<p>No classes today for your selected filters.</p>";
    return;
  }

  todayResult.innerHTML = todays.map(renderSession).join("");
}

function showNextClass() {
  const nextResult = document.getElementById("nextResult");
  const next = getNextUpcomingClass();

  if (!next) {
    nextResult.innerHTML = "<p>No upcoming classes found for your selected filters.</p>";
    return;
  }

  nextResult.innerHTML = renderSession(next);
}

function refreshResults() {
  showNextClass();
  showTodaysClasses();
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
