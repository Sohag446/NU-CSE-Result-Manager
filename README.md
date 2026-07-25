# NU CSE Result Manager

An offline-first GPA / CGPA manager for National University (Bangladesh) CSE
students. No login, no server, no internet connection required — everything
is stored on the device via `localStorage`.

It is built as an installable **Progressive Web App (PWA)**: it runs in any
mobile browser, can be added to the home screen as a standalone app icon, and
keeps working with the network off (service worker caches the whole app
shell). Section 3 below shows how to wrap the same code into a real,
installable **Android `.apk`** with Capacitor if you specifically need a
store-ready binary.

---

## 1. Project structure

```
nucse/
└── app/
    ├── index.html      # app shell, loads CSS + JS
    ├── styles.css       # theming (light/dark), layout, components
    ├── data.js          # course catalogue, grading scale (static data)
    ├── app.js           # state, GPA/CGPA engine, router, rendering, events
    ├── manifest.json     # PWA manifest (installable, icon, theme color)
    └── sw.js             # service worker — offline caching
```

No build step, no `npm install`, no framework — plain HTML/CSS/JS so it is
trivial to audit, host, or drop into a native wrapper.

---

## 2. Run it locally

Because the app registers a service worker, open it over `http://`, not
`file://` (browsers block service workers on the `file:` scheme).

**Quickest option — Python's built-in server:**

```bash
cd nucse/app
python3 -m http.server 8080
```

Then open `http://localhost:8080` on your computer, or
`http://<your-computer's-LAN-IP>:8080` on your phone (same Wi‑Fi network).

**Install to home screen (Android/Chrome):** open the URL → menu (⋮) →
"Add to Home screen". It now behaves like a native app icon, opens full
screen, and works offline.

**Install to home screen (iOS/Safari):** open the URL → Share → "Add to
Home Screen".

---

## 3. Building a real Android APK (Capacitor)

The web app above is 100% reusable as the UI layer of a native app. The
fastest supported path is [Capacitor](https://capacitorjs.com), which wraps
a local web app in a real Android project and produces a signed `.apk`/`.aab`.

You'll need, on your own machine: **Node.js 18+**, **Android Studio** (for
the Android SDK + Gradle + an emulator or a USB-connected phone).

```bash
# 1. From the project root, scaffold the native wrapper
npm init -y
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

# 2. Initialize Capacitor (app name + package id — change the id to your own)
npx cap init "NU CSE Result Manager" "com.sohag.nucseresultmanager" --web-dir=app

# 3. Add the Android platform
npx cap add android

# 4. Copy the web assets into the native project & sync
npx cap copy
npx cap sync

# 5. Open the generated Android project in Android Studio
npx cap open android
```

Inside Android Studio:

1. Let Gradle finish syncing.
2. `Build → Build Bundle(s) / APK(s) → Build APK(s)` for a debug APK you can
   sideload immediately, or use `Build → Generate Signed Bundle / APK` for a
   release build signed with your own keystore (required for the Play Store).
3. The generated file appears under
   `android/app/build/outputs/apk/debug/app-debug.apk` (or `release/...`).

Because all data lives in `localStorage`/`WebView` local storage, results
saved in the wrapped app persist across restarts exactly as in the browser
version, fully offline.

> Capacitor is used here instead of React Native/Flutter because it lets you
> ship this exact HTML/CSS/JS unchanged — no rewrite, no new state
> management, no risk of behavior drifting between the web and native
> builds.

---

## 4. GPA / CGPA calculation logic

**Grade from percentage** (`gradeFromPercent` in `data.js`): a course's
percentage is matched against the National University 10-point scale
(A+ = 4.00 down to F = 0.00) and returns both the letter grade and grade
point. Alternatively, a grade can be picked directly, which looks up the
same grade point via `GRADE_TO_GPA`.

**Semester GPA** (credit-weighted, `semesterGPA(semId)` in `app.js`):

```
Semester GPA = Σ(course credit × course grade point) / Σ(course credit)
```

Only courses that currently have an entered result for that semester are
included — an incomplete semester still produces a valid partial GPA.

**Overall CGPA** (`overallCGPA()`):

```
CGPA = Σ(credit × grade point) over every entered course in every semester
       ─────────────────────────────────────────────────────────────────
       Σ(credit) over every entered course in every semester
```

This is **not** an average of the eight semester GPAs — it is a single
credit-weighted pass over every recorded course, which is the correct
university method and matches the brief's requirement.

**Completed vs. total credits:** "completed" only counts courses with a
saved result. "Total" (used for the progress bar) is the fixed programme
total: every core course across all 8 semesters, plus one optional theory
course (3.0 cr) and one optional lab (1.5 cr) from Semester 8 — since a
student can only ever take one of each.

**Semester 8 optional courses:** the UI exposes two dropdowns — "Optional
theory course" and "Optional lab" — each listing the 14 alternatives from
the syllabus. Only the selected pair is shown in the result-entry list and
counted toward credits/GPA; switching the selection clears any previously
entered result for the deselected course so stale data never leaks into the
calculation.

**Target CGPA Calculator:** given current CGPA, completed credits,
remaining credits and a target CGPA, it solves for the required average GPA
in the remaining credits:

```
required GPA = (target × (completed + remaining) − currentCGPA × completed) / remaining
```

It flags targets above 4.00 as unreachable and targets already secured.

**What-if Calculator:** takes one already-recorded course, substitutes a
hypothetical grade point for it only in memory, and recomputes the
credit-weighted CGPA across all recorded courses — nothing is written to
storage unless the user separately edits the real result via "Add Result".

---

## 5. Feature checklist (matches the original brief)

- [x] Manual result entry for all 8 semesters, full official NU CSE course
      list including Semester 8's mandatory single-optional-theory /
      single-optional-lab rule (enforced in the UI, not just documented).
- [x] Two entry methods per course: percentage marks (auto-graded) or direct
      grade selection.
- [x] Instant, credit-weighted semester GPA and overall CGPA recalculated on
      every keystroke.
- [x] Dashboard: CGPA, completed/total credits, progress %, current-semester
      GPA, highest semester GPA, academic standing.
- [x] Results screen grouped by year, each semester card shows GPA, credits,
      completion status; tapping opens a full course-by-course breakdown.
- [x] Edit or delete any semester's results (with confirmation).
- [x] Draft/incomplete entry supported — a semester can be partially filled
      and revisited later without losing progress.
- [x] Target CGPA calculator and non-destructive What-if calculator.
- [x] Dedicated grading-scale reference screen.
- [x] Export data to JSON, import/restore a JSON backup, with a two-step
      confirmation before a full reset.
- [x] Light & dark mode, bottom navigation with 5 tabs, mobile-first layout,
      works fully offline via localStorage + service worker caching.

---

## 6. Testing notes

The calculation engine was exercised directly (`node --check` + inline
sanity runs) for: grade-boundary correctness at every threshold (39/40,
79/80, etc.), credit-weighted semester GPA vs. a plain average (they
diverge as expected when credits differ), CGPA aggregation across multiple
semesters, and total programme credit computation (excludes unselected
Semester 8 optional courses). Manually verify in-browser before relying on
it for real results: enter a full semester, confirm the on-screen "Live GPA"
matches a hand calculation, reload the page to confirm persistence, then
try Export → Import to confirm round-tripping.
