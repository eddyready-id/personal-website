# EddyReady — Coming Soon page

A static "coming soon" page for **eddyready.id**, built as a birthday gift.
Plain HTML/CSS/JS — no frameworks, no build step, no backend.

**It's live:** https://eddyready.id — deployed on Netlify, auto-deploying
from the `main` branch of [github.com/eddyready-id/personal-website](https://github.com/eddyready-id/personal-website).
Push a commit to `main` and the live site updates within a minute or two,
with no manual redeploy step.

## Folder structure

```
personal-website/
├── index.html                     ← the coming soon page (the only page so far)
├── assets/
│   ├── css/
│   │   ├── tokens.css             ← shared design values (colors, fonts, spacing…)
│   │   └── style.css              ← this page's layout/look
│   ├── js/
│   │   └── birthday.js            ← shows the "Happy Birthday" pop-up shortly after load
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

1. **The "Follow untuk update terbaru!" button.** It currently points
   nowhere (`href="#"`) — open `index.html`, search for `TODO(you)`, and
   change that link to your Instagram/WhatsApp/Telegram/etc.
2. **The birthday pop-up message.** Edit the `<p class="birthday-message">`
   text directly in `index.html` (search for `birthday-message`). The
   timing/behavior (how long before it appears, how it can be closed) is
   in `assets/js/birthday.js`, with comments explaining each part.
3. **Colors/fonts/spacing** — all defined once in `assets/css/tokens.css`.

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

## Deploying changes

Already set up — see the top of this file. Just commit and push to `main`
on GitHub, and Netlify picks it up automatically:

```bash
git add -A
git commit -m "Describe what changed"
git push
```

## What's intentionally not done yet

- **No real destination for the follow button** — see above.

## Notes on the hero background photo

`assets/images/hero-background.jpg` is your supplied artwork (money
stacks, shield, umbrella, house), used full-bleed behind the whole page —
this deliberately overrides the design system's general "no photo as a
full-page background" rule, specifically for this page, per your request.
It lives on the `<body>` element (not `.page`) so it always spans the full
browser width, even on very wide monitors, while the text content itself
stays centered in a readable column. A dark gradient sits between the
photo and the text (defined in `style.css`'s `body` rule, with a wider
left-to-right version for tablet+ screens) so the headline stays readable.
If you ever want to swap the photo for a different one, just replace that
file with a same-named image — no CSS changes needed unless you want the
darkness/readability balance to change too.

## Notes on the birthday pop-up

A personal touch: shortly after the page loads, a "Happy Birthday" message
pops in over a blurred backdrop, with a little scale + fade-in animation.
Visitors can dismiss it by clicking the × button, clicking outside the
card, or pressing Escape. It shows on every page load/refresh — see the
note at the bottom of `assets/js/birthday.js` if you'd rather it only ever
show once per visitor (that needs a small addition using browser storage).
