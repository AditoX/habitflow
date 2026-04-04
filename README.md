# Habitflow — Habit Tracker

A premium monthly habit tracker with Firebase auth, Firestore sync, and Vercel hosting.

---

## Project structure

```
habit-tracker/
├── index.html          ← Landing page
├── auth.html           ← Login / sign-up
├── dashboard.html      ← Main tracker app
├── vercel.json         ← Vercel routing config
├── .gitignore
└── src/
    ├── css/
    │   ├── landing.css
    │   ├── auth.css
    │   ├── tracker.css
    │   └── dashboard.css
    └── js/
        ├── landing.js
        ├── tracker.js
        └── firebase-config.js  ← YOU MUST FILL THIS IN
```

---

## Step 1 — Set up Firebase

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it a name → Continue
3. Click **</>** (Web app) → register app → copy the `firebaseConfig` object
4. Open `src/js/firebase-config.js` and paste your values

### Enable Authentication
- Firebase Console → **Authentication** → **Sign-in method**
- Enable **Email/Password**
- Enable **Google**

### Enable Firestore
- Firebase Console → **Firestore Database** → **Create database**
- Choose **Production mode**
- Go to **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Add your domain to Firebase (after Vercel deploy)
- Firebase Console → Authentication → **Authorized domains**
- Add your Vercel domain e.g. `habitflow.vercel.app`

---

## Step 2 — Push to GitHub

```bash
cd habit-tracker
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 3 — Deploy on Vercel

1. Go to [https://vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework preset: **Other**
4. Root directory: leave as `.` (or `habit-tracker/` if it's a subfolder)
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

---

## Local development

Just open `index.html` directly in a browser, or use any static server:

```bash
npx serve .
# or
python3 -m http.server 3000
```

Then open http://localhost:3000

---

## How data works

- Habit data is saved to **localStorage** immediately on every check
- When the dashboard loads, it syncs from **Firestore** (overrides localStorage)
- Data is saved back to Firestore every **30 seconds** and on page close
- Each user's data is isolated — only they can read/write their own document

---

## Bump the data version (force reset all users)

In `src/js/tracker.js`, find:

```js
const storageVersion = "v3-clean";
```

Change it to `"v4-clean"` (or any new string). This will wipe localStorage and pull fresh from Firestore on next load.
