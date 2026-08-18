/* ==========================================================================
   WALL.JS — logic for the /ucapan display wall
   ==========================================================================
   • Loads all existing messages (newest first) and staggers them in.
   • Subscribes to Supabase Realtime; a new submission prepends to the top,
     the existing cards glide aside to make room (a "FLIP" animation), and
     the new card gets a brief honey highlight so the eye catches it.
   • All message text is inserted with textContent (never innerHTML), so a
     visitor can't inject HTML/script through their message — important for
     something projected in public.
   ========================================================================== */

import { supabase } from "./supabase-client.js";
import { MESSAGES_TABLE, isConfigured } from "./supabase-config.js";
import { setupThemeToggle } from "./theme.js";

const grid = document.getElementById("wall-grid");
const emptyState = document.getElementById("wall-empty");
const notice = document.getElementById("wall-notice");

setupThemeToggle(document.getElementById("theme-toggle"));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Remember which message ids we've already put on the wall, so a message
// that arrives via realtime right after the initial load can't appear twice.
const renderedIds = new Set();

/* ----------------------------------------------------------------------
   BUILD ONE CARD (safe: user text goes in via textContent only)
   ---------------------------------------------------------------------- */
function makeCard(row) {
  const card = document.createElement("article");
  card.className = "msg-card";
  card.dataset.id = row.id;

  const hasPhoto = typeof row.photo_url === "string" && row.photo_url.startsWith("http");
  card.dataset.hasPhoto = hasPhoto ? "true" : "false";

  if (hasPhoto) {
    const photoWrap = document.createElement("div");
    photoWrap.className = "msg-photo";
    const img = document.createElement("img");
    img.src = row.photo_url;
    img.alt = "Foto dari " + (row.name || "tamu");
    img.loading = "lazy";
    photoWrap.appendChild(img);
    card.appendChild(photoWrap);
  }

  const body = document.createElement("div");
  body.className = "msg-body";

  const text = document.createElement("p");
  text.className = "msg-text";
  text.textContent = row.message || "";

  const name = document.createElement("p");
  name.className = "msg-name";
  name.textContent = "— " + (row.name || "Tamu");

  body.appendChild(text);
  body.appendChild(name);
  card.appendChild(body);

  return card;
}

/* ----------------------------------------------------------------------
   INITIAL LOAD — append in newest-first order with a short stagger
   ---------------------------------------------------------------------- */
function addInitial(row, index) {
  if (renderedIds.has(row.id)) return;
  renderedIds.add(row.id);

  const card = makeCard(row);
  card.classList.add("enter-start");
  grid.appendChild(card);

  // Stagger: each card plays its entrance shortly after the previous one.
  // The delay is capped so a big initial batch doesn't take forever.
  const delay = 40 + Math.min(index, 12) * 45;
  window.setTimeout(function () {
    card.classList.add("enter-play");
  }, reduceMotion ? 0 : delay);
}

/* ----------------------------------------------------------------------
   REALTIME ARRIVAL — prepend + FLIP the existing cards aside
   ----------------------------------------------------------------------
   FLIP = First, Last, Invert, Play:
     1. First  — record where the existing cards currently are.
     2. (insert the new card at the top, which shoves them to new spots.)
     3. Last   — record where they are now.
     4. Invert — instantly transform them BACK to their old spots.
     5. Play   — release the transform so they glide to the new spots.
   This is what makes the whole wall shift smoothly instead of jumping. */
function addRealtime(row) {
  if (renderedIds.has(row.id)) return;
  renderedIds.add(row.id);
  hideEmpty();

  const card = makeCard(row);
  card.classList.add("enter-start");

  const existing = Array.prototype.slice.call(grid.children);
  const firstRects = existing.map(function (el) { return el.getBoundingClientRect(); });

  grid.prepend(card);

  if (reduceMotion) {
    card.classList.add("enter-play"); // gentle fade only, no movement
    return;
  }

  // Last + Invert
  const lastRects = existing.map(function (el) { return el.getBoundingClientRect(); });
  existing.forEach(function (el, i) {
    const dx = firstRects[i].left - lastRects[i].left;
    const dy = firstRects[i].top - lastRects[i].top;
    if (dx || dy) {
      el.style.transition = "none";
      el.style.transform = "translate(" + dx + "px, " + dy + "px)";
    }
  });

  // Play (next frame): release transforms → they animate to place via the
  // CSS transition on .msg-card; play the new card's entrance + highlight.
  requestAnimationFrame(function () {
    existing.forEach(function (el) {
      if (el.style.transform) {
        el.style.transition = ""; // fall back to the CSS transition
        el.style.transform = "";
      }
    });
    card.classList.add("enter-play");
    card.classList.add("just-arrived");
  });
}

/* ----------------------------------------------------------------------
   EMPTY / NOTICE STATE HELPERS
   ---------------------------------------------------------------------- */
function showEmpty() { emptyState.hidden = false; }
function hideEmpty() { emptyState.hidden = true; }
function showNotice(detail) {
  notice.hidden = false;
  if (detail) {
    const lede = notice.querySelector(".wall-notice-lede");
    if (lede) lede.textContent = detail;
  }
}

/* ----------------------------------------------------------------------
   START UP
   ---------------------------------------------------------------------- */
async function init() {
  if (!isConfigured()) {
    showNotice(); // keys not filled in yet
    return;
  }

  try {
    const { data, error } = await supabase
      .from(MESSAGES_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    if (!data || data.length === 0) {
      showEmpty();
    } else {
      data.forEach(function (row, i) { addInitial(row, i); });
    }
  } catch (err) {
    console.error("Could not load messages:", err);
    showNotice("Gagal memuat ucapan: " + (err && err.message ? err.message : "unknown"));
  }

  subscribeRealtime();
}

function subscribeRealtime() {
  supabase
    .channel("wall-messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: MESSAGES_TABLE },
      function (payload) { addRealtime(payload.new); }
    )
    .subscribe();
}

init();

/* ======================================================================
   DEV-ONLY preview hook (localhost / 127.0.0.1 ONLY — never on the live
   site). Lets you preview the wall layout + animations without a real
   Supabase project. In the browser console:
       __erWall.seed(6)      // drop in 6 sample cards (mix of photo / text)
       __erWall.arrive(true) // simulate a new photo message arriving live
       __erWall.arrive(false)// simulate a new text-only message arriving
   ====================================================================== */
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  let mockN = 0;
  const NAMES = ["Rina", "Budi", "Sari", "Andi", "Maya", "Dewi", "Joko", "Putri"];
  const MSGS = [
    "Selamat ulang tahun, Pak Eddy. Semoga selalu sehat dan sukses.",
    "Terima kasih sudah selalu jadi panutan. Panjang umur ya!",
    "Doa terbaik untukmu hari ini dan selalu. Bahagia terus.",
    "Semoga tahun ini penuh berkah dan kebahagiaan untukmu.",
    "Happy birthday! Semoga semua impianmu tercapai tahun ini.",
  ];
  function mockRow(hasPhoto) {
    mockN += 1;
    return {
      id: "mock-" + mockN,
      name: NAMES[mockN % NAMES.length],
      message: MSGS[mockN % MSGS.length],
      // absolute URL so it passes the same startsWith("http") guard real
      // Supabase photo URLs do (relative paths are rejected on purpose)
      photo_url: hasPhoto ? location.origin + "/assets/images/og-image.png" : null,
      created_at: new Date().toISOString(),
    };
  }
  window.__erWall = {
    seed: function (n) {
      hideEmpty();
      for (let i = 0; i < (n || 6); i++) addInitial(mockRow(i % 3 !== 0), i);
    },
    arrive: function (hasPhoto) {
      addRealtime(mockRow(hasPhoto !== false));
    },
  };
}
