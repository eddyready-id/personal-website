/* ==========================================================================
   THEME.JS — wires up the light/dark toggle button (shared by both pages)
   ==========================================================================
   The INITIAL theme is applied by a tiny inline <script> in each page's
   <head> (so there's no flash before paint). This file only handles the
   runtime part: clicking the toggle to flip modes and remembering the
   choice for next time.
   ========================================================================== */

export function setupThemeToggle(button) {
  if (!button) return;

  button.addEventListener("click", function () {
    const root = document.documentElement;
    const explicit = root.getAttribute("data-theme");

    // What mode are we effectively in right now?
    let current;
    if (explicit === "dark" || explicit === "light") {
      current = explicit;
    } else {
      // No explicit choice yet → we're following the OS setting.
      current = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("er-theme", next); // remember for next visit
    } catch (e) {
      /* private mode / storage blocked — the toggle still works this visit */
    }
  });
}
