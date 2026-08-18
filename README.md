# EddyReady — Coming Soon page

A static "coming soon" page for **eddyready.id**, built as a birthday gift.
Plain HTML/CSS/JS — no frameworks, no build step, no backend. You can open
`index.html` directly in a browser, or serve it with any static file host.

## Folder structure

```
personal-website/
├── index.html                     ← the coming soon page (the only page so far)
├── assets/
│   ├── css/
│   │   ├── tokens.css             ← shared design values (colors, fonts, spacing…)
│   │   └── style.css              ← this page's layout/look
│   ├── js/
│   │   └── countdown.js           ← makes the countdown numbers tick
│   └── images/
│       ├── eddyready-logo-white.svg
│       ├── hero-background.jpg    ← full-bleed hero photo (money/shield/house artwork)
│       ├── favicon.svg            ← browser tab icon (just the mark)
│       ├── apple-touch-icon.png   ← "add to home screen" icon
│       └── og-image.png           ← preview image when the link is shared on social/WhatsApp
├── EddyReady Design System/       ← source material, not part of the live site
└── Reference/                     ← your mockup + the real logo files you supplied
```

**Why this structure:** when you're ready to add more pages later (About,
Services, Contact…), each new page is just another `.html` file at the
root that links the same `assets/css/tokens.css` — so everything stays
visually consistent automatically. `tokens.css` holds the shared design
values; `style.css` is specific to this one page, so give a new page its
own stylesheet rather than growing this one.

Every file has comments in it explaining what each part does and why —
that was requested since you're learning from scratch, so when in doubt,
read the comments in the file itself first.

## Things you'll likely want to change

1. **The launch date.** Open `assets/js/countdown.js` and edit the one
   line marked `LAUNCH_DATE` near the top. ⚠️ See the note below — the
   date currently in there needs your confirmation.
2. **The "Follow untuk update terbaru!" button.** It currently points
   nowhere (`href="#"`) — open `index.html`, search for `TODO(you)`, and
   change that link to your Instagram/WhatsApp/Telegram/etc.
3. **Colors/fonts/spacing** — all defined once in `assets/css/tokens.css`.

## ⚠️ Please confirm the countdown date

You asked for a countdown to **21 July 2026**, but this machine's clock
currently reads **18 August 2026** — a month *after* that date. As built,
the countdown will immediately show as "already launched" rather than
counting down. Please double check the year you meant (2027? a different
2026 date?) and update `LAUNCH_DATE` in `assets/js/countdown.js`
accordingly before this goes live.

## Previewing it on your own computer

You don't need to install anything special — Python 3 (already on most
Macs) can serve the folder as a simple local website:

```bash
cd path/to/personal-website
python3 -m http.server 4173
```

Then open `http://localhost:4173` in your browser. Press `Ctrl+C` in the
terminal to stop the server when you're done. (Opening `index.html`
directly by double-clicking it also mostly works, but a few browsers
restrict things like fonts when there's no server — the command above is
the more reliable way to check your work.)

## Deploying to eddyready.id

This is a static site, so it can be hosted almost anywhere cheaply or for
free — Netlify, Vercel, GitHub Pages, or your domain registrar's own
hosting/cPanel all work. In every case the idea is the same: upload this
whole folder (or connect it to a Git repo) and point `eddyready.id`'s DNS
at whichever host you pick. If you tell me which registrar/host you're
using for the domain, I can give you exact steps.

## What's intentionally not done yet

- **No real destination for the follow button** — see above.

## Notes on the hero background photo

`assets/images/hero-background.jpg` is your supplied artwork (money
stacks, shield, umbrella, house), used full-bleed behind the whole page —
this deliberately overrides the design system's general "no photo as a
full-page background" rule, specifically for this page, per your request.
A dark gradient sits between the photo and the text (defined in
`style.css`'s `.page` rule, with a wider/left-to-right version for
tablet+ screens) so the headline and countdown stay readable. If you ever
want to swap the photo for a different one, just replace that file with
a same-named image — no CSS changes needed unless you want the darkness/
readability balance to change too.
