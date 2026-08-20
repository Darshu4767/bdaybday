# 🎒⭐ Kaviyatharshini's Birthday Adventure

A cute, Dora the Explorer–themed animated website where Kaviyatharshini can pick how she wants to celebrate her birthday — the plan, the cake, the gift bag, and more. When she's done, it throws confetti 🎉 and gives you a summary you can copy or email to yourself.

**Live site (after you enable Pages — see below):**
👉 https://darshu4767.github.io/bdaybday/

---

## ✏️ Two things to customize

Open **`script.js`** and edit the two lines at the very top:

```js
const FRIEND_NAME = "Kaviyatharshini";   // already set for you
const YOUR_EMAIL  = "YOUR_EMAIL_HERE";   // 👈 put YOUR email here
```

- **`FRIEND_NAME`** — shown on the intro screen and in the summary/email.
- **`YOUR_EMAIL`** — where the "✉️ Send to my friend" button sends her choices. Replace `YOUR_EMAIL_HERE` with your real email.

---

## 🖼️ Swap the bag photos (optional)

In **`index.html`**, find the three `<img>` tags in the *"which bag?"* section. They currently use placeholder images:

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

### ⚠️ Add the deploy workflow manually

The deploy workflow couldn't be added automatically. Create a file at **`.github/workflows/deploy.yml`** with this content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "."
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

To add it: in this repo click **Add file → Create new file**, type `.github/workflows/deploy.yml` as the name, paste the code above, and commit.

---

## 📁 What's in here

| File | What it does |
|------|--------------|
| `index.html` | The page + all the questions |
| `styles.css` | Dora theme, colours, animations |
| `script.js` | The flow, confetti, summary, email |
| `.github/workflows/deploy.yml` | Auto-deploys to GitHub Pages *(add manually)* |

Made with 💖 for a very special birthday. Vámonos! 🐵🗺️
