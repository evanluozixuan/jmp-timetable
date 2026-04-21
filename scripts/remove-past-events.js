const fs = require("fs");

const FILE_PATH = "./timetable.json";

function todayISO() {
  const now = new Date();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function currentSundayISO() {
  const sydneyDateString = todayISO();

  const date = new Date(`${sydneyDateString}T00:00:00`);
  const day = date.getDay(); // Sunday = 0, Monday = 1, etc.

  date.setDate(date.getDate() - day);

  return date.toISOString().slice(0, 10);
}

function main() {
  const events = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));

  const today = todayISO();
  const cutoff = currentSundayISO();

  const filteredEvents = events.filter(event => {
    return event.date >= cutoff;
  });

  fs.writeFileSync(FILE_PATH, JSON.stringify(filteredEvents, null, 2) + "\n");

  console.log(`Today: ${today}`);
  console.log(`Cutoff: ${cutoff}`);
  console.log(`Before: ${events.length}`);
  console.log(`After: ${filteredEvents.length}`);
  console.log(`Removed: ${events.length - filteredEvents.length}`);
}

main();
