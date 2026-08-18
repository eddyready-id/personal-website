/* ==========================================================================
   BIRTHDAY.JS — shows the "Happy Birthday" pop-up shortly after page load
   ==========================================================================

   WHAT THIS FILE DOES
   --------------------
   The pop-up markup lives in index.html (look for `id="birthday-overlay"`)
   and starts out invisible via CSS (see `.birthday-overlay` in style.css).
   This file adds/removes an "is-open" class at the right moments — CSS
   transitions handle the actual fade + "pop" animation — and also builds
   a one-time confetti burst (see spawnConfetti() below) right as the card
   pops in.

   HOW TO CHANGE THINGS LATER
   ---------------------------
   - Message text: edit the <p class="birthday-message"> in index.html.
   - How long before it appears: change the number in `setTimeout` below
     (it's in milliseconds — 1000ms = 1 second).
   - Whether it shows every visit or only once: see the note at the bottom.
   - Confetti: the PIECE_COUNT arguments below control how many pieces fly
     in the pop-up's burst vs. the smaller one that drifts onto the page
     as it closes. CONFETTI_COLORS controls what colors they use. Turned
     off automatically for visitors with "reduce motion" on in their OS —
     see `prefersReducedMotion` below.
   ========================================================================== */

const overlay = document.getElementById("birthday-overlay");
const closeButton = document.getElementById("birthday-close");
const card = document.querySelector(".birthday-card");
const confettiContainer = document.getElementById("confetti");
const afterglowContainer = document.getElementById("confetti-afterglow");
const followButton = document.getElementById("follow-btn");

// `matchMedia` lets JS ask the browser "did this visitor turn on 'reduce
// motion' in their OS settings?" — `.matches` is `true` if they did.
// We check this ONCE, up front, and reuse it below rather than calling
// matchMedia again every time the pop-up opens or closes.
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Every confetti piece, in both bursts, only ever uses these brand colors
// — the same "one accent (Pine), plus neutrals" rule the rest of the site
// follows. No rainbow party colors; this is still EddyReady, just a
// livelier moment of it.
const CONFETTI_COLORS = [
  "var(--pine-300)",
  "var(--pine-400)",
  "var(--pine-500)",
  "var(--ink-000)",
];

/**
 * Fills `container` with `count` confetti pieces, each flying a slightly
 * different way, then removes each piece once it finishes falling.
 * Shared by both the pop-up's burst and the smaller one that drifts onto
 * the page as the pop-up closes — see spawnConfetti() and
 * spawnAfterglow() below, which just call this with different numbers.
 *
 * `minDuration`/`maxDuration` (milliseconds) let the two call sites feel
 * different: fast and busy for the pop-up's burst, slower and calmer for
 * the afterglow, so the second one reads as the celebration settling
 * down rather than repeating itself.
 */
function spawnConfettiPieces(container, count, minDuration, maxDuration) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";

    // Spread pieces across the middle width, in percent so it scales with
    // the container instead of using fixed pixel positions.
    piece.style.left = 30 + Math.random() * 40 + "%";
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];

    // These four are read by the `confetti-fall` keyframe in style.css
    // (as `var(--confetti-drift)` etc.) — setting them here, per piece,
    // is what makes each piece fly a slightly different way instead of
    // every piece moving in identical lockstep.
    const drift = Math.round((Math.random() - 0.5) * 140); // sideways travel, -70px to 70px
    const spin = Math.round(360 + Math.random() * 360); // 1 to 2 full rotations
    const duration = Math.round(minDuration + Math.random() * (maxDuration - minDuration));
    const delay = Math.round(Math.random() * 150); // staggered start, 0-150ms
    piece.style.setProperty("--confetti-drift", drift + "px");
    piece.style.setProperty("--confetti-spin", spin + "deg");
    piece.style.setProperty("--confetti-duration", duration + "ms");
    piece.style.setProperty("--confetti-delay", delay + "ms");

    container.appendChild(piece);

    // Once a piece finishes its own fall-and-fade animation, remove it
    // from the page. Without this, new elements would pile up in the DOM
    // every time this runs, sitting there invisible (opacity: 0) but
    // still technically present — harmless visually, but needless
    // clutter. `{ once: true }` means this listener auto-removes itself
    // after firing, so it can't ever run twice for the same piece.
    piece.addEventListener(
      "animationend",
      function () {
        piece.remove();
      },
      { once: true }
    );
  }
}

/**
 * The pop-up's own burst — 16 pieces, quick and lively. Skipped entirely
 * when `prefersReducedMotion` is true — see the note by that constant.
 */
function spawnConfetti() {
  if (prefersReducedMotion) return; // respect the visitor's OS setting — no exceptions
  spawnConfettiPieces(confettiContainer, 16, 1100, 1600);
}

/**
 * The smaller burst that drifts onto the main page as the pop-up closes
 * — purpose: bridge the celebration into the page instead of it just
 * stopping. Fewer pieces (8, half the pop-up's 16) and a slower, wider
 * duration range (1600-2400ms vs. the pop-up's 1100-1600ms) so it reads
 * as the moment settling down, not a second identical show.
 */
function spawnAfterglow() {
  if (prefersReducedMotion) return;
  spawnConfettiPieces(afterglowContainer, 8, 1600, 2400);
}

/** Adds the "is-open" class, which triggers the CSS fade + pop-in transition. */
function openBirthdayMessage() {
  overlay.classList.add("is-open");
  spawnConfetti(); // fires at the same moment the card starts popping in — the card's arrival IS what "sets it off"

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
  spawnAfterglow(); // a few pieces drift onto the page as the pop-up fades — see spawnAfterglow() above

  // A single soft glow around the Follow button, inviting the next action
  // right as attention returns to the page. `.invite-pulse` triggers the
  // `invite-pulse` keyframe in style.css (on .btn::after).
  if (!prefersReducedMotion) {
    followButton.classList.add("invite-pulse");

    // Remove the class once the animation has finished, so it can only
    // ever play again if the pop-up is closed a second time — it never
    // loops on its own. This CSS animation lives on the button's ::after
    // pseudo-element, not the button itself — and pseudo-element
    // animations don't reliably fire an `animationend` event on their
    // host element across browsers (confirmed by testing: zero events
    // received here even though the animation visibly plays). A plain
    // timer matching the animation's own duration (1500ms, set in
    // style.css) is the more portable fix — it doesn't depend on that
    // event working everywhere.
    window.setTimeout(function () {
      followButton.classList.remove("invite-pulse");
    }, 1500);
  }
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
