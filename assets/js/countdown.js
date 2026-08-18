/* ==========================================================================
   COUNTDOWN.JS — counts down to the launch date and updates the page
   ==========================================================================

   HOW TO CHANGE THE LAUNCH DATE
   ------------------------------
   Edit the ONE line below marked "LAUNCH_DATE". Everything else in this
   file works automatically off that value — you never need to touch
   anything past that line just to change the date.

   A QUICK JAVASCRIPT PRIMER FOR THIS FILE
   -----------------------------------------
   - `const` declares a value that won't be reassigned later.
   - `document.getElementById("x")` finds the HTML element whose
     `id="x"` attribute matches, so we can read/change it from JS.
   - `function name() { ... }` defines a reusable block of code we can
     call by writing `name()`.
   - `setInterval(fn, 1000)` calls `fn` automatically every 1000ms (1 second)
     forever, which is how the numbers keep ticking without the visitor
     reloading the page.
   ========================================================================== */

// ---------------------------------------------------------------------------
// LAUNCH_DATE — the moment the countdown reaches zero.
//
// Written as "2026-07-21T00:00:00+07:00":
//   2026-07-21   = 21 July 2026
//   T00:00:00    = midnight (the very start of that day)
//   +07:00       = WIB, Indonesia's Western timezone (Jakarta), so the
//                  countdown lands on the right moment for Eddy's audience
//                  no matter what timezone a visitor's own device is set to.
//
// To change the date later: edit only the "2026-07-21" part above.
// To change the time of day: edit the "00:00:00" part.
// ---------------------------------------------------------------------------
const LAUNCH_DATE = new Date("2026-07-21T00:00:00+07:00");

// Grab references to every element we need to update, once, up front.
const daysEl = document.getElementById("cd-days");
const hoursEl = document.getElementById("cd-hours");
const minutesEl = document.getElementById("cd-minutes");
const secondsEl = document.getElementById("cd-seconds");
const gridEl = document.getElementById("countdown-grid");
const doneEl = document.getElementById("countdown-done");

/**
 * Turns a number of milliseconds into a "00" style, always-two-digit string.
 * Example: padTwo(7) -> "07", padTwo(23) -> "23"
 * This keeps the digits from jumping around in width as they change.
 */
function padTwo(number) {
  return String(number).padStart(2, "0");
}

// Holds the ID that setInterval gives us below, so updateCountdown() can
// cancel the ticking once the countdown reaches zero. Declared with `let`
// (not `const`) and set to `undefined` first, because updateCountdown()
// below can run once BEFORE setInterval has produced a real ID.
let timerId;

/**
 * Reads the current time, compares it to LAUNCH_DATE, and writes the
 * remaining days/hours/minutes/seconds into the page. Called once
 * immediately below, then once every second by setInterval.
 */
function updateCountdown() {
  const now = new Date();
  const msRemaining = LAUNCH_DATE.getTime() - now.getTime();

  // We've reached (or passed) the launch date: stop ticking, swap the
  // digit grid for a simple "we're live" message, and exit early.
  if (msRemaining <= 0) {
    clearInterval(timerId); // harmless no-op if the interval hasn't started yet
    if (gridEl) gridEl.style.display = "none";
    if (doneEl) doneEl.style.display = "block";
    return;
  }

  // Break the remaining milliseconds down into whole days/hours/minutes/seconds.
  // (1000ms = 1s, 60s = 1min, 60min = 1hr, 24hr = 1 day — the math below just
  // divides step by step and keeps the whole-number remainder each time.)
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  daysEl.textContent = padTwo(days);
  hoursEl.textContent = padTwo(hours);
  minutesEl.textContent = padTwo(minutes);
  secondsEl.textContent = padTwo(seconds);
}

// Run once immediately so visitors see correct numbers instantly, instead
// of a "00 00 00 00" flash while waiting for the first tick.
updateCountdown();

// Then keep it running, updating every 1000ms (1 second).
timerId = setInterval(updateCountdown, 1000);
