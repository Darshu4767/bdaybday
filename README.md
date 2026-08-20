# 🎒⭐ Kaviyatharshini's Birthday Adventure

A cute, Dora the Explorer–themed **adventure map** where Kaviyatharshini walks a jungle trail and picks how she wants to celebrate her birthday. At the end it throws confetti 🎉 and gives you a summary you can copy or email to yourself.

**Live site:**
👉 https://darshu4767.github.io/bdaybday/

---

## 🗺️ How the adventure works

1. **The poem intro** — the explorer girl types *and speaks* a little birthday poem. "Let's go! ⭐" starts the journey.
2. **The adventure map** — a winding dotted trail runs through a forest scene, with **four labelled stops**. The explorer girl **walks along the trail**, stops at each one, and asks a single question:

   | Stop | Question |
   |------|----------|
   | 🌴 Jungle Clearing | How do you want to spend your birthday? |
   | 🍰 Cake Cove | Birthday cake flavour |
   | 👜 Gift Grove | Which bag? (+ paste links you love) |
   | ⛰️ Party Peak | Dress code, playlist, guest vibe, surprise, wishlist |

   Answer, tap **"Vámonos! ➡"**, and she walks on to the next stop. The current stop glows, finished stops get a ✓, and the trail she has walked turns orange.
3. **The finale** — at Party Peak you get confetti 🎉, the full summary, a **📋 Copy my choices** button and an **✉️ Send to my friend** email button.

Answers are saved in your browser (`localStorage`), so a refresh drops you back at the first stop you hadn't answered yet.

The trail reshapes itself for the screen: a wide winding trail on desktop, a tall zig-zag on phones. There is a **⏭ Skip walking** button so nobody has to wait for the animation, everything is keyboard-navigable, and `prefers-reduced-motion` turns the movement off while keeping every question answerable.

---

## ✏️ Things to customize

Open **`script.js`** and edit the lines at the very top:

```js
const FRIEND_NAME  = "Kaviyatharshini";        // shown on the map + in the summary/email
const FRIEND_SHORT = "Kaviya";                 // used in the spoken poem + map title
const YOUR_EMAIL   = "darshana4767@gmail.com"; // where the choices get emailed
```

- **`FRIEND_NAME`** — shown in the summary/email.
- **`FRIEND_SHORT`** — the short name used in the spoken poem and the map title.
- **`YOUR_EMAIL`** — where the "✉️ Send to my friend" button sends her choices.

Want to move the trail around? The `LAYOUTS` object just below (also in `script.js`) holds the bends of the trail as fractions of the map's width/height — one set for desktop (`wide`), one for phones (`tall`).

---

## 🖼️ Swap the bag photos (optional)

In **`index.html`**, find the three `<img>` tags in the *Gift Grove* stop panel. They currently use placeholder images:

```html
<img src="https://placehold.co/300x220/ff9f1c/ffffff?text=Shoulder+Bag" alt="Shoulder bag" />
```

Replace each `src="..."` with a real photo — either a link to an image online, or upload photos to this repo and use the filename (e.g. `src="shoulder.jpg"`).

---

## 🚀 Turn on hosting (GitHub Pages) — one-time setup

This repo includes a workflow that auto-publishes the site whenever you push to `main`. You just need to flip Pages on:

1. Go to **Settings** → **Pages** (in this repo).
2. Under **Build and deployment → Source**, choose **"GitHub Actions"**.
3. Done! On the next push (or re-run the "Deploy to GitHub Pages" action), your site goes live at:
   **https://darshu4767.github.io/bdaybday/**

---

## 📁 What's in here

| File | What it does |
|------|--------------|
| `index.html` | The intro, the map + its 4 stops, and the question cards |
| `styles.css` | Forest theme, the trail, the walking character, responsive + reduced-motion rules |
| `script.js` | Poem, the trail/walking engine, saved answers, confetti, summary, email |
| `.github/workflows/deploy.yml` | Auto-deploys to GitHub Pages on every push to `main` |

Made with 💖 for a very special birthday. Vámonos! 🐵🗺️
