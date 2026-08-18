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
const card = document.querySelector(".birthday-card");

/** Adds the "is-open" class, which triggers the CSS fade + pop-in transition. */
function openBirthdayMessage() {
  overlay.classList.add("is-open");

  // Only move keyboard focus to the close button if the visitor hasn't
  // already focused something else on the page. If they've been tabbing
  // through the header or the Follow button, this pop-up appears on a
  // 700ms timer — not because of anything THEY did — so yanking their
  // focus away mid-action would be disorienting (worse for anyone using a
  // screen reader, who could be mid-sentence reading something else).
  //
  // `document.activeElement` is "whatever element currently has keyboard
  // focus". Right when the page loads, before anyone has pressed Tab, it
  // defaults to `document.body` — so this check basically means "only
  // steal focus if nobody has started navigating yet". If someone HAS
  // already tabbed somewhere, the focus trap below still makes sure they
  // can reach the pop-up the next time they press Tab.
  if (document.activeElement === document.body || document.activeElement === null) {
    closeButton.focus();
  }
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

/* FOCUS TRAP
   -----------
   Without this, pressing Tab while the pop-up is open would move keyboard
   focus PAST the close button and into the page behind it (the logo, the
   Follow button) — even though the pop-up is still visually covering the
   screen. That's disorienting for anyone navigating by keyboard.

   The fix: while the pop-up is open, whenever Tab is pressed, we check
   where focus currently is:
     - OUTSIDE the card (this can happen now — see openBirthdayMessage
       above — since we don't always move focus onto the pop-up when it
       opens): send focus INTO the card instead of letting Tab do whatever
       it would normally do next.
     - On the FIRST or LAST focusable thing INSIDE the card: wrap around
       to the other end, instead of leaving the card.
   Either way, focus stays inside the pop-up for as long as it's open.

   `focusable` is looked up fresh every time Tab is pressed (rather than
   once, stored ahead of time) so this keeps working correctly even if
   more buttons/links get added inside the card later. */
document.addEventListener("keydown", function (event) {
  if (event.key !== "Tab") return;
  if (!overlay.classList.contains("is-open")) return; // only trap while actually open

  const focusable = card.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!card.contains(document.activeElement)) {
    // Focus is somewhere outside the dialog — most likely because opening
    // the pop-up didn't steal it (see openBirthdayMessage above). Bring it
    // into the dialog instead of letting Tab carry on wherever the page's
    // normal order would send it next.
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    // Shift+Tab on the FIRST element would normally go backwards, out of
    // the card — send it to the LAST element instead.
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    // Tab on the LAST element would normally go forwards, out of the card
    // — send it back to the FIRST element instead.
    event.preventDefault();
    first.focus();
  }
});

/* NOTE ON "SHOW EVERY VISIT VS. ONLY ONCE"
   -----------------------------------------
   Right now the pop-up appears every time this page loads (every visit,
   every refresh). If you'd rather it only ever appear once per visitor,
   that needs a browser storage check — ask to have that added later if
   you want it; it's a small change but was left out here to keep this
   file simple to read for now. */
