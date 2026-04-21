let timetable = [];

const defaultProfile = {
  campus: "Callaghan",
  year: 1,
  pblGroup: "A",
  clinicalGroup: "A"
};

let userProfile = loadProfile();

const toggleBtn = document.getElementById("filtersToggleBtn");
const filtersCard = document.getElementById("filtersCard");
const campusSelect = document.getElementById("campusSelect");
const yearSelect = document.getElementById("yearSelect");
const pblSelect = document.getElementById("pblSelect");
const clinicalSelect = document.getElementById("clinicalSelect");
const saveFiltersBtn = document.getElementById("saveFiltersBtn");

function openFilters() {
  toggleBtn.classList.add("active");
  filtersCard.classList.add("open");
  filtersCard.style.maxHeight = filtersCard.scrollHeight + "px";
}

function closeFilters() {
  toggleBtn.classList.remove("active");
  filtersCard.classList.remove("open");
  filtersCard.style.maxHeight = "0px";
}

toggleBtn.addEventListener("click", () => {
  if (filtersCard.classList.contains("open")) {
    closeFilters();
  } else {
    openFilters();
  }
});

async function loadTimetable() {
  try {
    const res = await fetch("./timetable.json");
    timetable = await res.json();
    populateFilterUI();
    refreshResults();

    const savedProfile = localStorage.getItem("userProfile");
    if (!savedProfile) {
      openFilters();
    } else {
      closeFilters();
    }
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
    campus: campusSelect.value,
    year: Number(yearSelect.value),
    pblGroup: pblSelect.value,
    clinicalGroup: clinicalSelect.value
  };
}

function populateFilterUI() {
  campusSelect.value = userProfile.campus;
  yearSelect.value = String(userProfile.year);
  pblSelect.value = userProfile.pblGroup;
  clinicalSelect.value = userProfile.clinicalGroup;
}

function previewFilters() {
  userProfile = getCurrentProfileFromUI();
  refreshResults();

  if (filtersCard.classList.contains("open")) {
    filtersCard.style.maxHeight = filtersCard.scrollHeight + "px";
  }
}

function saveProfile() {
  userProfile = getCurrentProfileFromUI();
  localStorage.setItem("userProfile", JSON.stringify(userProfile));
  refreshResults();
  closeFilters();
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
  const campusOk = Array.isArray(item.campus)
    ? item.campus.includes(profile.campus)
    : item.campus === profile.campus;
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

function dateToLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekRangeSundayToSaturday() {
  const today = new Date();

  // JS: Sunday = 0, Monday = 1, ..., Saturday = 6
  const day = today.getDay();

  const sunday = new Date(today);
  sunday.setDate(today.getDate() - day);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  return {
    sunday: dateToLocalISO(sunday),
    saturday: dateToLocalISO(saturday)
  };
}

function getThisWeeksClasses() {
  const { sunday, saturday } = getWeekRangeSundayToSaturday();

  return getFilteredClasses()
    .filter(item => item.date >= sunday && item.date <= saturday)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return timeToMinutes(a.start) - timeToMinutes(b.start);
    });
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

function isSameClass(a, b) {
  return (
    a &&
    b &&
    a.date === b.date &&
    a.start === b.start &&
    a.end === b.end &&
    a.title === b.title &&
    a.location === b.location
  );
}

function renderSession(item, extraClass = "") {
  return `
    <div class="session ${extraClass}">
      <strong>${item.title} ${item.type}</strong><br>
      ${item.date} ${item.day}<br>
      ${item.start} - ${item.end}<br>
      ${item.location}<br>
      ${item.attendance}<br>
    </div>
  `;
}

function showTodaysClasses() {
  const todayResult = document.getElementById("todayResult");
  const todays = getTodaysClasses();

  if (todays.length === 0) {
    todayResult.innerHTML = "<p>no classes today for your selected filters.</p>";
    return;
  }

  todayResult.innerHTML = todays.map(renderSession).join("");
}

function showThisWeeksClasses() {
  const weekResult = document.getElementById("weekResult");
  const weeksClasses = getThisWeeksClasses();
  const nextClass = getNextUpcomingClass();

  if (weeksClasses.length === 0) {
    weekResult.innerHTML = "<p>no classes this week for your selected filters.</p>";
    return;
  }

  weekResult.innerHTML = weeksClasses
    .map(item => {
      const highlightClass = isSameClass(item, nextClass) ? "current-next-class" : "";
      return renderSession(item, highlightClass);
    })
    .join("");
}

function showNextClass() {
  const nextResult = document.getElementById("nextResult");
  const next = getNextUpcomingClass();

  if (!next) {
    nextResult.innerHTML = "<p>no upcoming classes for your selected filters.</p>";
    return;
  }

  nextResult.innerHTML = renderSession(next);
}

function refreshResults() {
  showNextClass();
  showTodaysClasses();
  showThisWeeksClasses();
}

campusSelect.addEventListener("change", previewFilters);
yearSelect.addEventListener("change", previewFilters);
pblSelect.addEventListener("change", previewFilters);
clinicalSelect.addEventListener("change", previewFilters);
saveFiltersBtn.addEventListener("click", saveProfile);

loadTimetable();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(err => {
      console.error("Service worker registration failed:", err);
    });
  });
}
