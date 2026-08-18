/* ==========================================================================
   BIRTHDAY.JS — shows the "Happy Birthday" pop-up shortly after page load
   ==========================================================================

   WHAT THIS FILE DOES
   --------------------
   The pop-up markup lives in index.html (look for `id="birthday-overlay"`)
   and starts out invisible via CSS (see `.birthday-overlay` in style.css).
   This file just adds/removes ONE class — "is-open" — at the right moments,
   and CSS transitions handle the actual fade + "pop" animation.

   HOW TO CHANGE THINGS LATER
   ---------------------------
   - Message text: edit the <p class="birthday-message"> in index.html.
   - How long before it appears: change the number in `setTimeout` below
     (it's in milliseconds — 1000ms = 1 second).
   - Whether it shows every visit or only once: see the note at the bottom.
   ========================================================================== */

const overlay = document.getElementById("birthday-overlay");
const closeButton = document.getElementById("birthday-close");

/** Adds the "is-open" class, which triggers the CSS fade + pop-in transition. */
function openBirthdayMessage() {
  overlay.classList.add("is-open");
  closeButton.focus(); // sends keyboard focus to the close button, for accessibility
}

/** Removes the "is-open" class, triggering the CSS fade-out. */
function closeBirthdayMessage() {
  overlay.classList.remove("is-open");
}

// Show the pop-up shortly after the page loads — a small delay (700ms) so
// it feels like a little surprise rather than an abrupt flash the instant
// the page appears.
window.setTimeout(openBirthdayMessage, 700);

// Visitors can close the pop-up three ways:

// 1) Clicking the × button.
closeButton.addEventListener("click", closeBirthdayMessage);

// 2) Clicking the dark backdrop OUTSIDE the message card. We check that the
//    click landed on the overlay itself (the backdrop) and not on something
//    inside it (the card) — otherwise clicking the message would also close it.
overlay.addEventListener("click", function (event) {
  if (event.target === overlay) {
    closeBirthdayMessage();
  }
});

// 3) Pressing the Escape key, from anywhere on the page.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeBirthdayMessage();
  }
});

/* NOTE ON "SHOW EVERY VISIT VS. ONLY ONCE"
   -----------------------------------------
   Right now the pop-up appears every time this page loads (every visit,
   every refresh). If you'd rather it only ever appear once per visitor,
   that needs a browser storage check — ask to have that added later if
   you want it; it's a small change but was left out here to keep this
   file simple to read for now. */
