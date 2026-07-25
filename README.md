# NU CSE Result Manager

An offline-first GPA / CGPA manager for National University (Bangladesh) CSE students.

NU CSE Result Manager allows students to manually record semester results, calculate semester GPA and overall CGPA, track academic progress, and manage their complete academic profile.

The application works fully offline. No account, server, or internet connection is required. All student profile information and academic result data are stored locally on the device.

The app is built using plain HTML, CSS, and JavaScript and can run as:

* A regular web application
* An installable Progressive Web App (PWA)
* A real Android `.apk` using Capacitor

---

## 1. Project Structure

```text
nucse/
└── app/
    ├── index.html                  # App shell, UI structure
    ├── styles.css                  # Theming, layout and components
    ├── data.js                    # Course catalogue and grading scale
    ├── app.js                     # State, GPA/CGPA engine, routing and rendering
    ├── manifest.json               # PWA manifest and app metadata
    ├── sw.js                       # Service worker for offline caching
    └── Sohag_Hossen_image.jpeg     # Developer profile image
```

The project uses:

* HTML
* CSS
* Vanilla JavaScript
* localStorage
* Service Worker
* PWA support

There is no build step and no framework required.

---

# 2. First-Time Student Profile Setup

When the app is opened for the first time, the user is shown a Student Profile Setup screen.

The user must enter:

* Student Name
* Student Registration Number
* College Name
* Current Semester

Optional information:

* Student ID / Roll Number
* Email Address

Available semesters:

```text
Semester 1
Semester 2
Semester 3
Semester 4
Semester 5
Semester 6
Semester 7
Semester 8
```

The required fields must be completed before the user can continue to the main Dashboard.

After successful completion:

* The student profile is saved locally.
* `profileCompleted` is set to `true`.
* The main Dashboard is opened.
* The setup screen is not shown again on future app launches.

---

## 3. Local Student Profile Storage

The student profile is stored locally on the device using the existing local storage system.

Example profile structure:

```json
{
  "studentName": "",
  "registrationNumber": "",
  "collegeName": "",
  "currentSemester": "",
  "studentId": "",
  "email": "",
  "profileCompleted": true
}
```

The profile remains available after:

* Closing the app
* Refreshing the app
* Restarting the device
* Reopening the application
* Losing internet connectivity

No external server is required.

---

# 4. Dashboard

The Dashboard provides a quick overview of the student's academic profile and performance.

The student profile is displayed prominently on the Dashboard.

Example:

```text
Welcome back,
Sohag Hossen

CSE Student

Registration No: XXXXXXXX
College: ABC College
Current Semester: Semester 7
```

If optional information has been entered, the Dashboard may also display:

* Student ID / Roll Number
* Email Address

The Dashboard also displays an academic summary, including:

* Overall CGPA
* Completed Credits
* Total Programme Credits
* Current Semester GPA
* Highest Semester GPA
* Academic Progress
* Academic Standing

Example:

```text
CGPA
3.42 / 4.00

Completed Credits
72 / 144

Current Semester GPA
3.75

Academic Progress
50%
```

The Dashboard automatically updates whenever the user adds, edits, or deletes a result.

---

# 5. Edit Student Profile

The user can edit their student profile from the Settings screen.

The following information can be updated:

* Student Name
* Registration Number
* College Name
* Current Semester
* Student ID / Roll Number
* Email Address

After saving changes:

* The local profile data is updated.
* The Dashboard updates immediately.
* The updated information is reflected throughout the app.

---

# 6. Reset Student Profile

The application includes a Reset Student Profile option.

Before resetting, the app shows a confirmation dialog:

```text
Are you sure you want to reset your student profile?
```

If confirmed:

* Student profile information is cleared.
* `profileCompleted` is set to `false`.
* The first-time Student Profile Setup screen is shown again.

Important:

Resetting the student profile does not delete academic semester results.

The user's saved results remain available unless the user explicitly performs a full application data reset.

---

# 7. Run the App Locally

Because the app registers a service worker, it should be opened over `http://` or `https://`, not directly through `file://`.

Browsers generally block service workers when files are opened using the `file:` scheme.

## Quickest Option — Python Built-in Server

```bash
cd nucse/app
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

To access the app from a mobile device on the same Wi-Fi network:

```text
http://<your-computer-LAN-IP>:8080
```

---

# 8. Progressive Web App (PWA)

NU CSE Result Manager can be installed as a Progressive Web App.

## Android / Chrome

1. Open the app URL.
2. Open the browser menu.
3. Select `Add to Home screen` or `Install app`.
4. The app will appear as an application icon.

The PWA can:

* Open in standalone mode.
* Work without an internet connection.
* Cache the application shell.
* Store student data locally.
* Store result data locally.

## iOS / Safari

1. Open the app in Safari.
2. Tap the Share button.
3. Select `Add to Home Screen`.

---

# 9. Building a Real Android APK with Capacitor

The same HTML, CSS, and JavaScript application can be wrapped into a real Android application using Capacitor.

This allows the project to be converted into an installable Android `.apk` or `.aab`.

Required software:

* Node.js 18+
* Android Studio
* Android SDK
* Gradle
* Android emulator or USB-connected Android device

## Step 1 — Initialize the Project

From the project root:

```bash
npm init -y
```

Install Capacitor:

```bash
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
```

## Step 2 — Initialize Capacitor

```bash
npx cap init "NU CSE Result Manager" "com.sohag.nucseresultmanager" --web-dir=app
```

## Step 3 — Add Android

```bash
npx cap add android
```

## Step 4 — Copy and Sync Web Assets

```bash
npx cap copy
npx cap sync
```

## Step 5 — Open Android Studio

```bash
npx cap open android
```

Inside Android Studio:

1. Allow Gradle to finish syncing.
2. Connect an Android device or start an emulator.
3. Run the application for testing.

To build a debug APK:

```text
Build
→ Build Bundle(s) / APK(s)
→ Build APK(s)
```

The debug APK will be generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For a release version:

```text
Build
→ Generate Signed Bundle / APK
```

A signed release build is required for publishing to the Google Play Store.

---

# 10. Offline Data Persistence

The application stores data locally using browser/WebView local storage.

Stored data includes:

* Student profile
* Semester results
* Course grades
* Percentage marks
* GPA data
* CGPA-related data
* Application preferences

The application does not require:

* Login
* User account
* Server
* Database server
* Internet connection

When wrapped with Capacitor, the same local data storage continues to work inside the Android WebView.

---

# 11. GPA and CGPA Calculation Logic

## Grade from Percentage

The application uses the National University grading scale.

Percentage marks are matched against the grading scale and converted into:

* Letter grade
* Grade point

A grade can also be selected directly, which uses the same grade-to-GPA mapping.

---

## Semester GPA

Semester GPA is credit-weighted:

```text
Semester GPA =
Σ(course credit × course grade point)
──────────────────────────────────
Σ(course credit)
```

Only courses with an entered result are included in the calculation.

Therefore, an incomplete semester can still produce a valid partial GPA.

---

## Overall CGPA

Overall CGPA is calculated across all recorded courses:

```text
CGPA =
Σ(credit × grade point) across all recorded courses
───────────────────────────────────────────────
Σ(credit) across all recorded courses
```

The application does not calculate CGPA by simply averaging the eight semester GPAs.

Instead, it uses a credit-weighted calculation across all recorded courses, which is the correct method for academic CGPA calculation.

---

# 12. Completed and Total Credits

Completed credits include only courses that have a saved result.

The total programme credit calculation includes:

* All required courses across all 8 semesters.
* One optional theory course from Semester 8.
* One optional laboratory course from Semester 8.

Because only one optional theory course and one optional laboratory course can be selected, unselected optional courses are excluded from the total credit calculation.

---

# 13. Semester 8 Optional Courses

Semester 8 includes:

* One optional theory course.
* One optional laboratory course.

The UI provides separate dropdowns for both selections.

Only the selected theory course and selected laboratory course are shown in the result-entry interface and included in:

* Completed credits
* GPA calculation
* CGPA calculation

When an optional course is changed, previously entered data for the deselected course is cleared to prevent stale data from affecting calculations.

---

# 14. Target CGPA Calculator

The Target CGPA Calculator calculates the average GPA required in the remaining credits to reach a target CGPA.

Formula:

```text
Required GPA =
(
Target CGPA × (Completed Credits + Remaining Credits)
− Current CGPA × Completed Credits
)
÷ Remaining Credits
```

The calculator can:

* Calculate the required future GPA.
* Detect targets above 4.00.
* Identify unreachable targets.
* Detect targets that have already been secured.

---

# 15. What-If Calculator

The What-If Calculator allows the student to test a hypothetical grade for an already-recorded course.

The hypothetical grade:

* Is applied only temporarily.
* Recalculates the CGPA in memory.
* Does not modify saved results.

The real result is changed only when the user manually edits the course through the normal result-entry system.

---

# 16. Result Management Features

The application supports:

* Manual result entry for all 8 semesters.
* Percentage-based result entry.
* Direct grade selection.
* Automatic grade calculation.
* Instant semester GPA calculation.
* Instant overall CGPA calculation.
* Credit-weighted calculations.
* Partial semester results.
* Draft/incomplete result entry.
* Result editing.
* Result deletion.
* Semester-level result management.

---

# 17. Results Screen

The Results screen groups academic results by year and semester.

Each semester card displays:

* Semester name.
* GPA.
* Completed credits.
* Completion status.

Selecting a semester opens a detailed course-by-course breakdown.

The user can:

* View results.
* Add results.
* Edit results.
* Delete results.

Deletion actions require confirmation.

---

# 18. Grading Scale

The application follows the National University grading scale:

| Percentage    | Grade |  GPA | Class                        |
| ------------- | ----- | ---: | ---------------------------- |
| 80% and above | A+    | 4.00 | First Class with Distinction |
| 75% – 79%     | A     | 3.75 | First Class                  |
| 70% – 74%     | A-    | 3.50 | First Class                  |
| 65% – 69%     | B+    | 3.25 | Second Class                 |
| 60% – 64%     | B     | 3.00 | Second Class                 |
| 55% – 59%     | B-    | 2.75 | Second Class                 |
| 50% – 54%     | C+    | 2.50 | Third Class                  |
| 45% – 49%     | C     | 2.25 | Third Class                  |
| 40% – 44%     | D     | 2.00 | Pass                         |
| Below 40%     | F     | 0.00 | Fail                         |

---

# 19. Data Export and Import

The application supports:

* Exporting application data to JSON.
* Importing and restoring a JSON backup.
* Restoring student profile data.
* Restoring academic result data.

A two-step confirmation process is used before performing a full application reset.

This helps prevent accidental data loss.

---

# 20. Themes and Navigation

The application includes:

* Light mode.
* Dark mode.
* Mobile-first responsive layout.
* Bottom navigation.
* Five main navigation tabs.
* Consistent academic dashboard interface.

The application is designed to work comfortably on mobile devices and small screens.

---

# 21. Developer

<p align="center">
  <img
    src="Sohag_Hossen_image.jpeg"
    alt="Sohag Hossen"
    width="150"
    height="150"
  >
</p>

<h3 align="center">NU CSE Result Manager</h3>

<p align="center">
  Developed by <strong>Sohag Hossen</strong>
</p>

<p align="center">
  An offline-first GPA / CGPA manager for National University CSE students.
</p>

---

# 22. Feature Checklist

* [x] First-time student profile setup.
* [x] Student name storage.
* [x] Registration number storage.
* [x] College name storage.
* [x] Current semester storage.
* [x] Optional student ID / roll number.
* [x] Optional email address.
* [x] Local profile storage.
* [x] Profile editing.
* [x] Profile reset without deleting academic results.
* [x] Student information displayed on Dashboard.
* [x] Dashboard academic summary.
* [x] Manual result entry for all 8 semesters.
* [x] Full official NU CSE course list.
* [x] Semester 8 optional theory course support.
* [x] Semester 8 optional laboratory course support.
* [x] Percentage-based result entry.
* [x] Direct grade selection.
* [x] Automatic GPA calculation.
* [x] Instant credit-weighted semester GPA.
* [x] Instant credit-weighted overall CGPA.
* [x] Completed and total credit tracking.
* [x] Academic progress percentage.
* [x] Current-semester GPA.
* [x] Highest-semester GPA.
* [x] Academic standing.
* [x] Results grouped by academic year.
* [x] Course-by-course result breakdown.
* [x] Edit semester results.
* [x] Delete semester results.
* [x] Draft/incomplete semester support.
* [x] Target CGPA Calculator.
* [x] Non-destructive What-If Calculator.
* [x] Grading-scale reference screen.
* [x] JSON data export.
* [x] JSON data import and restore.
* [x] Full reset confirmation.
* [x] Light mode.
* [x] Dark mode.
* [x] Five-tab bottom navigation.
* [x] Mobile-first responsive layout.
* [x] Offline support.
* [x] PWA installation support.
* [x] Capacitor Android APK support.

---

# 23. Testing Notes

The calculation engine should be tested for:

* Grade-boundary correctness.
* 39% / 40% grade boundary.
* 79% / 80% grade boundary.
* Credit-weighted semester GPA.
* Difference between weighted GPA and plain GPA average.
* CGPA aggregation across multiple semesters.
* Total programme credit calculation.
* Semester 8 optional course selection.
* Exclusion of unselected optional courses.

The following should also be manually verified:

1. Complete the first-time student profile setup.
2. Confirm that the profile appears on the Dashboard.
3. Close and reopen the application.
4. Confirm that the profile remains saved.
5. Add a semester result.
6. Confirm that the GPA updates.
7. Confirm that the CGPA updates.
8. Confirm that the completed credit count updates.
9. Edit the student profile.
10. Confirm that the Dashboard updates immediately.
11. Reset the student profile.
12. Confirm that the onboarding screen appears again.
13. Confirm that academic results remain saved after profile reset.
14. Test Export → Import.
15. Confirm that all data is correctly restored.
16. Test the application without an internet connection.
17. Test both Light Mode and Dark Mode.

---

## About

<p align="center">
  <img
    src="Sohag_Hossen_image.jpeg"
    alt="Sohag Hossen"
    width="550"
    height="400"
    style="aspect-ratio: 550 / 400; object-fit: cover;"
  >
</p>

NU CSE Result Manager is designed to help National University CSE students manage their academic results, calculate GPA and CGPA, track credits, and monitor academic progress in one simple offline-first application.

**Developed by Sohag Hossen**

Version: `${APP_VERSION}`
