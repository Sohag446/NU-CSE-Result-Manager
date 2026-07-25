/* ============================================================
   NU CSE Result Manager — Application Logic
   Vanilla JS, offline-first, localStorage persistence
   ============================================================ */

const STORAGE_KEY = 'nucse_rm_v1';
const APP_VERSION = '1.0.0';

/* ---------------- State & persistence ---------------- */

function defaultState() {
  return {
    version: APP_VERSION,
    settings: { theme: 'light' },
    results: {} // semId -> { selectedOptTheory, selectedOptLab, courses: { code: {method, marks, grade, gpa} } }
  };
}

let STATE = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    console.error('Failed to load saved data, starting fresh.', e);
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
  } catch (e) {
    console.error('Failed to save data', e);
    alert('Could not save your data. Your device storage may be full.');
  }
}

function getSemResult(semId) {
  if (!STATE.results[semId]) {
    STATE.results[semId] = { selectedOptTheory: null, selectedOptLab: null, courses: {} };
  }
  return STATE.results[semId];
}

/* ---------------- Calculation engine ---------------- */

// active course list for a semester, resolving semester-8 optional picks
function activeCourses(semId) {
  const sem = SEMESTERS.find(s => s.id === Number(semId));
  if (!sem) return [];
  if (sem.id !== 8) return sem.courses;
  const semRes = getSemResult(8);
  return sem.courses.filter(c => {
    if (c.group === 'core') return true;
    if (c.group === 'optTheory') return c.code === semRes.selectedOptTheory;
    if (c.group === 'optLab') return c.code === semRes.selectedOptLab;
    return false;
  });
}

// courses that currently have an entered result
function enteredCourses(semId) {
  const semRes = getSemResult(semId);
  return activeCourses(semId).filter(c => {
    const r = semRes.courses[c.code];
    return r && r.gpa !== null && r.gpa !== undefined && r.hasResult;
  });
}

function semesterGPA(semId) {
  const semRes = getSemResult(semId);
  const courses = enteredCourses(semId);
  if (courses.length === 0) return null;
  let creditSum = 0, weighted = 0;
  courses.forEach(c => {
    const r = semRes.courses[c.code];
    creditSum += c.credit;
    weighted += c.credit * r.gpa;
  });
  if (creditSum === 0) return null;
  return weighted / creditSum;
}

function semesterCompletedCredits(semId) {
  return enteredCourses(semId).reduce((sum, c) => sum + c.credit, 0);
}

function semesterTotalCredits(semId) {
  return activeCourses(semId).reduce((sum, c) => sum + c.credit, 0);
}

function overallCGPA() {
  let creditSum = 0, weighted = 0;
  SEMESTERS.forEach(sem => {
    const semRes = getSemResult(sem.id);
    enteredCourses(sem.id).forEach(c => {
      const r = semRes.courses[c.code];
      creditSum += c.credit;
      weighted += c.credit * r.gpa;
    });
  });
  if (creditSum === 0) return null;
  return weighted / creditSum;
}

function totalCompletedCredits() {
  let sum = 0;
  SEMESTERS.forEach(sem => sum += semesterCompletedCredits(sem.id));
  return sum;
}

function programmeTotalCredits() {
  return totalProgrammeCredits();
}

function highestSemesterGPA() {
  let best = null;
  SEMESTERS.forEach(sem => {
    const g = semesterGPA(sem.id);
    if (g !== null && (best === null || g > best)) best = g;
  });
  return best;
}

function currentSemesterInfo() {
  // "current" = latest semester (highest id) that has at least one entered result
  let current = null;
  SEMESTERS.forEach(sem => {
    if (enteredCourses(sem.id).length > 0) current = sem;
  });
  return current;
}

function academicStanding(cgpa) {
  if (cgpa === null) return 'Not started';
  if (cgpa >= 3.75) return 'Outstanding';
  if (cgpa >= 3.5) return 'Excellent';
  if (cgpa >= 3.0) return 'Very Good';
  if (cgpa >= 2.5) return 'Good';
  if (cgpa >= 2.0) return 'Satisfactory';
  return 'Needs Improvement';
}

function fmt(n, d = 2) {
  return (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toFixed(d);
}

/* ---------------- Router ---------------- */

const APP = document.getElementById('app');

function navigate(hash) {
  if (location.hash !== hash) location.hash = hash;
  else render();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  if (!location.hash) location.hash = '#/dashboard';
  render();
});

function currentRoute() {
  const h = location.hash.replace(/^#\//, '') || 'dashboard';
  const parts = h.split('/');
  return { screen: parts[0], param: parts[1] };
}

function render() {
  const { screen, param } = currentRoute();
  let html = '';
  switch (screen) {
    case 'dashboard': html = renderDashboard(); break;
    case 'results': html = param ? renderSemesterDetail(param) : renderResultsList(); break;
    case 'add': html = renderAddResult(param); break;
    case 'calculator': html = renderCalculator(); break;
    case 'grades': html = renderGradeScale(); break;
    case 'settings': html = renderSettings(); break;
    default: html = renderDashboard();
  }
  APP.innerHTML = `<div class="screen">${html}</div>` + renderBottomNav(screen);
  window.scrollTo(0, 0);
  attachScreenHandlers(screen, param);
}

/* ---------------- Bottom Navigation ---------------- */

function renderBottomNav(active) {
  const items = [
    { id: 'dashboard', icon: iconHome(), label: 'Dashboard' },
    { id: 'results', icon: iconList(), label: 'Results' },
    { id: 'add', icon: iconPlus(), label: 'Add' },
    { id: 'calculator', icon: iconTarget(), label: 'Calculator' },
    { id: 'settings', icon: iconGear(), label: 'Settings' }
  ];
  return `<nav class="bottomnav">
    ${items.map(i => `
      <a href="#/${i.id}" class="navitem ${active === i.id ? 'active' : ''}">
        ${i.icon}
        <span>${i.label}</span>
      </a>`).join('')}
  </nav>`;
}

/* ---------------- Dashboard ---------------- */

function renderDashboard() {
  const cgpa = overallCGPA();
  const completed = totalCompletedCredits();
  const total = programmeTotalCredits();
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const cur = currentSemesterInfo();
  const curGPA = cur ? semesterGPA(cur.id) : null;
  const best = highestSemesterGPA();
  const standing = academicStanding(cgpa);
  const arcDeg = cgpa === null ? 0 : Math.min(360, (cgpa / 4) * 360);

  return `
  <header class="topbar">
    <div>
      <p class="eyebrow">National University · CSE</p>
      <h1 class="pagetitle">Result Manager</h1>
    </div>
  </header>

  <section class="hero-card">
    <div class="dial" style="--deg:${arcDeg}deg">
      <div class="dial-inner">
        <span class="dial-value">${fmt(cgpa)}</span>
        <span class="dial-label">CGPA / 4.00</span>
      </div>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <span class="hs-label">Standing</span>
        <span class="hs-value">${standing}</span>
      </div>
      <div class="hero-stat">
        <span class="hs-label">Credits</span>
        <span class="hs-value">${fmt(completed, 1)} / ${fmt(total, 1)}</span>
      </div>
      <div class="hero-stat">
        <span class="hs-label">Progress</span>
        <span class="hs-value">${progress}%</span>
      </div>
    </div>
    <div class="progressbar"><div class="progressbar-fill" style="width:${progress}%"></div></div>
  </section>

  <section class="stat-grid">
    <div class="stat-card">
      <span class="stat-tag">Current semester</span>
      <span class="stat-num">${curGPA !== null ? fmt(curGPA) : '—'}</span>
      <span class="stat-sub">${cur ? cur.name : 'No results yet'}</span>
    </div>
    <div class="stat-card">
      <span class="stat-tag">Highest semester GPA</span>
      <span class="stat-num">${best !== null ? fmt(best) : '—'}</span>
      <span class="stat-sub">Across all semesters</span>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>Semester ledger</h2>
      <a href="#/results" class="link-sm">View all →</a>
    </div>
    <div class="ledger-strip">
      ${SEMESTERS.map(sem => {
        const g = semesterGPA(sem.id);
        const has = enteredCourses(sem.id).length > 0;
        return `<a href="#/results/${sem.id}" class="ledger-chip ${has ? 'filled' : ''}">
          <span class="lc-index">${String(sem.id).padStart(2, '0')}</span>
          <span class="lc-gpa">${g !== null ? fmt(g) : '–'}</span>
        </a>`;
      }).join('')}
    </div>
  </section>

  <section class="section">
    <a href="#/add" class="cta-block">
      <div>
        <h3>Add or update a result</h3>
        <p>Enter marks or pick grades for any semester.</p>
      </div>
      <span class="cta-arrow">→</span>
    </a>
  </section>
  `;
}

/* ---------------- Results list ---------------- */

function renderResultsList() {
  const byYear = {};
  SEMESTERS.forEach(s => { (byYear[s.year] = byYear[s.year] || []).push(s); });

  return `
  <header class="topbar">
    <p class="eyebrow">Academic record</p>
    <h1 class="pagetitle">All Semesters</h1>
  </header>
  ${Object.keys(byYear).map(year => `
    <section class="section">
      <div class="section-head"><h2>Year ${year}</h2></div>
      <div class="sem-card-list">
        ${byYear[year].map(sem => {
          const g = semesterGPA(sem.id);
          const completed = semesterCompletedCredits(sem.id);
          const total = semesterTotalCredits(sem.id);
          const has = enteredCourses(sem.id).length > 0;
          return `
          <a href="#/results/${sem.id}" class="sem-card">
            <div class="sem-card-top">
              <span class="sem-index">${String(sem.id).padStart(2, '0')}</span>
              <div class="sem-name-block">
                <span class="sem-name">${sem.name}</span>
                <span class="sem-status ${has ? 'ok' : 'pending'}">${has ? 'Recorded' : 'Not entered'}</span>
              </div>
              <span class="sem-gpa">${g !== null ? fmt(g) : '–'}</span>
            </div>
            <div class="sem-card-bottom">
              <span>${fmt(completed, 1)} / ${fmt(total, 1)} credits</span>
              <div class="mini-progress"><div style="width:${total ? (completed/total*100) : 0}%"></div></div>
            </div>
          </a>`;
        }).join('')}
      </div>
    </section>
  `).join('')}
  `;
}

/* ---------------- Semester detail (course-wise) ---------------- */

function renderSemesterDetail(semId) {
  const sem = SEMESTERS.find(s => s.id === Number(semId));
  if (!sem) return `<p>Semester not found.</p>`;
  const semRes = getSemResult(sem.id);
  const g = semesterGPA(sem.id);
  const completed = semesterCompletedCredits(sem.id);
  const total = semesterTotalCredits(sem.id);
  const courses = activeCourses(sem.id);

  return `
  <header class="topbar with-back">
    <a href="#/results" class="back-btn">←</a>
    <div>
      <p class="eyebrow">Year ${sem.year}</p>
      <h1 class="pagetitle">${sem.name}</h1>
    </div>
  </header>

  <section class="hero-card compact">
    <div class="hero-stats">
      <div class="hero-stat"><span class="hs-label">Semester GPA</span><span class="hs-value">${fmt(g)}</span></div>
      <div class="hero-stat"><span class="hs-label">Completed</span><span class="hs-value">${fmt(completed,1)}</span></div>
      <div class="hero-stat"><span class="hs-label">Total</span><span class="hs-value">${fmt(total,1)}</span></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>Courses</h2>
      <a href="#/add/${sem.id}" class="link-sm">Edit results →</a>
    </div>
    <div class="course-table">
      <div class="course-row course-row-head">
        <span>Code</span><span>Course</span><span>Cr.</span><span>Grade</span><span>GP</span>
      </div>
      ${courses.map(c => {
        const r = semRes.courses[c.code];
        const has = r && r.hasResult;
        return `<div class="course-row ${has ? '' : 'empty'}">
          <span class="mono">${c.code}</span>
          <span>${c.name}${c.group !== 'core' ? `<em class="tag-opt">${c.group === 'optTheory' ? 'Optional' : 'Optional Lab'}</em>` : ''}</span>
          <span class="mono">${fmt(c.credit,1)}</span>
          <span>${has ? r.grade : '—'}</span>
          <span class="mono">${has ? fmt(r.gpa) : '—'}</span>
        </div>`;
      }).join('')}
    </div>
    ${sem.id === 8 ? `<p class="hint">Optional theory: ${semRes.selectedOptTheory ? courseName(8, semRes.selectedOptTheory) : 'not selected'} · Optional lab: ${semRes.selectedOptLab ? courseName(8, semRes.selectedOptLab) : 'not selected'}</p>` : ''}
  </section>

  <section class="section">
    <button class="btn-outline danger" data-action="delete-semester" data-sem="${sem.id}">Delete this semester's results</button>
  </section>
  `;
}

function courseName(semId, code) {
  const sem = SEMESTERS.find(s => s.id === Number(semId));
  const c = sem.courses.find(c => c.code === code);
  return c ? c.name : code;
}

/* ---------------- Add / Edit Result ---------------- */

function renderAddResult(semIdParam) {
  const semId = semIdParam ? Number(semIdParam) : (SEMESTERS.find(s => enteredCourses(s.id).length === 0) || SEMESTERS[0]).id;
  const sem = SEMESTERS.find(s => s.id === semId);
  const semRes = getSemResult(semId);

  const semPicker = `
    <div class="field">
      <label>Semester</label>
      <select id="semSelect" class="input">
        ${SEMESTERS.map(s => `<option value="${s.id}" ${s.id === semId ? 'selected' : ''}>Year ${s.year} · ${s.name}</option>`).join('')}
      </select>
    </div>`;

  let optionalPickers = '';
  if (sem.id === 8) {
    const optTheories = sem.courses.filter(c => c.group === 'optTheory');
    const optLabs = sem.courses.filter(c => c.group === 'optLab');
    optionalPickers = `
    <div class="field">
      <label>Optional theory course (choose one)</label>
      <select id="optTheorySelect" class="input">
        <option value="">— Select —</option>
        ${optTheories.map(c => `<option value="${c.code}" ${semRes.selectedOptTheory === c.code ? 'selected' : ''}>${c.code} · ${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label>Optional lab (choose one)</label>
      <select id="optLabSelect" class="input">
        <option value="">— Select —</option>
        ${optLabs.map(c => `<option value="${c.code}" ${semRes.selectedOptLab === c.code ? 'selected' : ''}>${c.code} · ${c.name}</option>`).join('')}
      </select>
    </div>`;
  }

  const courses = activeCourses(semId);

  return `
  <header class="topbar">
    <p class="eyebrow">Result entry</p>
    <h1 class="pagetitle">Add / Update Result</h1>
  </header>

  <section class="section">
    ${semPicker}
    ${optionalPickers}
  </section>

  <section class="section">
    <div class="section-head"><h2>Courses — ${sem.name}</h2></div>
    <div id="courseForm" class="course-form-list">
      ${courses.map(c => courseFormRow(semId, c, semRes.courses[c.code])).join('')}
    </div>
  </section>

  <section class="sticky-actions">
    <div class="gpa-preview">
      <span>Live GPA</span>
      <strong id="livePreviewGPA">${fmt(semesterGPA(semId))}</strong>
    </div>
    <button class="btn-primary" id="saveResultBtn">Save results</button>
  </section>
  `;
}

function courseFormRow(semId, c, r) {
  const method = r ? r.method : 'percent';
  const marks = r && r.marks !== null && r.marks !== undefined ? r.marks : '';
  const grade = r ? r.grade : '';
  return `
  <div class="course-form-row" data-code="${c.code}" data-credit="${c.credit}">
    <div class="cfr-head">
      <span class="mono">${c.code}</span>
      <span class="cfr-name">${c.name}</span>
      <span class="cfr-credit">${fmt(c.credit,1)} cr</span>
    </div>
    <div class="cfr-toggle">
      <button type="button" class="chip method-chip ${method === 'percent' ? 'active' : ''}" data-method="percent">Marks %</button>
      <button type="button" class="chip method-chip ${method === 'grade' ? 'active' : ''}" data-method="grade">Grade</button>
      <button type="button" class="chip clear-chip" data-action="clear-course">Clear</button>
    </div>
    <div class="cfr-inputs">
      <input type="number" min="0" max="100" step="0.01" placeholder="Marks (0–100)"
        class="input marks-input ${method === 'grade' ? 'hidden' : ''}" value="${marks}">
      <select class="input grade-input ${method === 'percent' ? 'hidden' : ''}">
        <option value="">— Select grade —</option>
        ${GRADE_SCALE.map(g => `<option value="${g.grade}" ${grade === g.grade ? 'selected' : ''}>${g.grade} (${fmt(g.gpa)})</option>`).join('')}
      </select>
      <span class="cfr-result">${r && r.hasResult ? `${r.grade} · ${fmt(r.gpa)}` : ''}</span>
    </div>
  </div>`;
}

/* ---------------- Calculator (Target + What-if) ---------------- */

function renderCalculator() {
  const cgpa = overallCGPA();
  const completed = totalCompletedCredits();
  const total = programmeTotalCredits();
  const remaining = Math.max(0, total - completed);

  return `
  <header class="topbar">
    <p class="eyebrow">Planning tools</p>
    <h1 class="pagetitle">CGPA Calculator</h1>
  </header>

  <section class="section">
    <div class="section-head"><h2>Target CGPA</h2></div>
    <div class="card-flat">
      <div class="field-row">
        <div class="field"><label>Current CGPA</label><input id="tCurrent" class="input" type="number" step="0.01" min="0" max="4" value="${cgpa !== null ? fmt(cgpa) : ''}"></div>
        <div class="field"><label>Completed credits</label><input id="tCompleted" class="input" type="number" step="0.5" min="0" value="${fmt(completed,1)}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Remaining credits</label><input id="tRemaining" class="input" type="number" step="0.5" min="0" value="${fmt(remaining,1)}"></div>
        <div class="field"><label>Target CGPA</label><input id="tTarget" class="input" type="number" step="0.01" min="0" max="4" placeholder="e.g. 3.50"></div>
      </div>
      <button class="btn-primary" id="calcTargetBtn">Calculate required GPA</button>
      <div class="result-banner" id="targetResult"></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><h2>What-if Calculator</h2></div>
    <p class="hint">Temporarily change a course grade and preview the effect on your CGPA. Nothing is saved.</p>
    <div class="card-flat">
      <div class="field">
        <label>Course</label>
        <select id="whatifCourse" class="input">
          ${SEMESTERS.flatMap(sem => enteredCourses(sem.id).map(c => {
            const r = getSemResult(sem.id).courses[c.code];
            return `<option value="${sem.id}|${c.code}|${c.credit}|${r.gpa}">${sem.name} · ${c.code} — ${c.name} (currently ${r.grade})</option>`;
          })).join('') || '<option value="">No recorded results yet</option>'}
        </select>
      </div>
      <div class="field">
        <label>New hypothetical grade</label>
        <select id="whatifGrade" class="input">
          ${GRADE_SCALE.map(g => `<option value="${g.gpa}">${g.grade} (${fmt(g.gpa)})</option>`).join('')}
        </select>
      </div>
      <button class="btn-outline" id="whatifBtn">Preview new CGPA</button>
      <div class="result-banner" id="whatifResult"></div>
    </div>
  </section>
  `;
}

/* ---------------- Grade scale ---------------- */

function renderGradeScale() {
  return `
  <header class="topbar">
    <p class="eyebrow">Reference</p>
    <h1 class="pagetitle">Grading Scale</h1>
  </header>
  <section class="section">
    <div class="course-table">
      <div class="course-row course-row-head"><span>Grade</span><span>Percentage</span><span>Grade Point</span></div>
      ${GRADE_SCALE.map(g => `<div class="course-row"><span><strong>${g.grade}</strong></span><span>${g.label}</span><span class="mono">${fmt(g.gpa)}</span></div>`).join('')}
    </div>
  </section>
  `;
}

/* ---------------- Settings ---------------- */

function renderSettings() {
  return `
  <header class="topbar">
    <p class="eyebrow">Preferences</p>
    <h1 class="pagetitle">Settings</h1>
  </header>

  <section class="section">
    <div class="settings-list">
      <div class="settings-row">
        <span>Dark mode</span>
        <button class="switch ${STATE.settings.theme === 'dark' ? 'on' : ''}" id="themeSwitch"><span class="knob"></span></button>
      </div>
      <a href="#/grades" class="settings-row link">
        <span>Grading system</span><span class="chev">→</span>
      </a>
      <button class="settings-row" id="exportBtn"><span>Export data (JSON)</span><span class="chev">↓</span></button>
      <label class="settings-row" for="importInput"><span>Import backup</span><span class="chev">↑</span></label>
      <input type="file" id="importInput" accept="application/json" class="hidden">
      <button class="settings-row danger" id="resetBtn"><span>Reset all data</span><span class="chev">⟲</span></button>
    </div>
  </section>

  <section class="section">
  <div class="card-flat about-card">
    <h3>About</h3>
    <p>
      NU CSE Result Manager helps National University CSE students record semester
      results and track GPA/CGPA offline. All data stays on this device unless you export it.
    </p>

    <p class="mono small">Developed by Sohag Hossen</p>
    <p class="mono small">Version ${APP_VERSION}</p>
  </div>
</section>
  `;
}

/* ---------------- Icons (inline SVG, currentColor) ---------------- */
function iconHome(){return `<svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`}
function iconList(){return `<svg viewBox="0 0 24 24" fill="none"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`}
function iconPlus(){return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`}
function iconTarget(){return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/></svg>`}
function iconGear(){return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`}

/* ---------------- Theme ---------------- */

function applyTheme() {
  document.documentElement.setAttribute('data-theme', STATE.settings.theme);
}

/* ---------------- Event wiring ---------------- */

function attachScreenHandlers(screen) {
  if (screen === 'add') wireAddResult();
  if (screen === 'results') wireResultsList();
  if (screen === 'calculator') wireCalculator();
  if (screen === 'settings') wireSettings();

  // semester detail delete
  const delBtn = APP.querySelector('[data-action="delete-semester"]');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      const semId = delBtn.getAttribute('data-sem');
      if (confirm('Delete all recorded results for this semester? This cannot be undone.')) {
        delete STATE.results[semId];
        saveState();
        navigate('#/results');
      }
    });
  }
}

function wireResultsList() {
  // nothing extra beyond links
}

function wireAddResult() {
  const semSelect = document.getElementById('semSelect');
  if (semSelect) {
    semSelect.addEventListener('change', () => navigate(`#/add/${semSelect.value}`));
  }
  const optTheorySelect = document.getElementById('optTheorySelect');
  const optLabSelect = document.getElementById('optLabSelect');
  const semId = Number(semSelect ? semSelect.value : 8);

  function refreshCourseList() {
    const semRes = getSemResult(semId);
    document.getElementById('courseForm').innerHTML =
      activeCourses(semId).map(c => courseFormRow(semId, c, semRes.courses[c.code])).join('');
    wireCourseRows(semId);
    updateLivePreview(semId);
  }

  if (optTheorySelect) {
    optTheorySelect.addEventListener('change', () => {
      const semRes = getSemResult(semId);
      const prev = semRes.selectedOptTheory;
      if (prev && prev !== optTheorySelect.value) delete semRes.courses[prev];
      semRes.selectedOptTheory = optTheorySelect.value || null;
      refreshCourseList();
    });
  }
  if (optLabSelect) {
    optLabSelect.addEventListener('change', () => {
      const semRes = getSemResult(semId);
      const prev = semRes.selectedOptLab;
      if (prev && prev !== optLabSelect.value) delete semRes.courses[prev];
      semRes.selectedOptLab = optLabSelect.value || null;
      refreshCourseList();
    });
  }

  wireCourseRows(semId);

  const saveBtn = document.getElementById('saveResultBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      commitFormToState(semId);
      saveState();
      navigate(`#/results/${semId}`);
    });
  }

  updateLivePreview(semId);
}

function wireCourseRows(semId) {
  document.querySelectorAll('.course-form-row').forEach(row => {
    const code = row.getAttribute('data-code');
    const marksInput = row.querySelector('.marks-input');
    const gradeInput = row.querySelector('.grade-input');
    const resultSpan = row.querySelector('.cfr-result');
    const methodChips = row.querySelectorAll('.method-chip');

    methodChips.forEach(chip => {
      chip.addEventListener('click', () => {
        methodChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const m = chip.getAttribute('data-method');
        marksInput.classList.toggle('hidden', m !== 'percent');
        gradeInput.classList.toggle('hidden', m !== 'grade');
        recomputeRow();
      });
    });

    row.querySelector('.clear-chip').addEventListener('click', () => {
      marksInput.value = '';
      gradeInput.value = '';
      resultSpan.textContent = '';
      updateLivePreview(semId);
    });

    function recomputeRow() {
      const method = row.querySelector('.method-chip.active').getAttribute('data-method');
      let grade = '', gpa = null;
      if (method === 'percent' && marksInput.value !== '') {
        const res = gradeFromPercent(marksInput.value);
        grade = res.grade; gpa = res.gpa;
      } else if (method === 'grade' && gradeInput.value) {
        grade = gradeInput.value; gpa = GRADE_TO_GPA[grade];
      }
      resultSpan.textContent = gpa !== null ? `${grade} · ${fmt(gpa)}` : '';
      updateLivePreview(semId);
    }

    marksInput.addEventListener('input', recomputeRow);
    gradeInput.addEventListener('change', recomputeRow);
  });
}

function commitFormToState(semId) {
  const semRes = getSemResult(semId);
  document.querySelectorAll('.course-form-row').forEach(row => {
    const code = row.getAttribute('data-code');
    const method = row.querySelector('.method-chip.active').getAttribute('data-method');
    const marksInput = row.querySelector('.marks-input');
    const gradeInput = row.querySelector('.grade-input');

    if (method === 'percent') {
      if (marksInput.value === '') {
        delete semRes.courses[code];
        return;
      }
      const res = gradeFromPercent(marksInput.value);
      semRes.courses[code] = { method: 'percent', marks: Number(marksInput.value), grade: res.grade, gpa: res.gpa, hasResult: true };
    } else {
      if (!gradeInput.value) {
        delete semRes.courses[code];
        return;
      }
      semRes.courses[code] = { method: 'grade', marks: null, grade: gradeInput.value, gpa: GRADE_TO_GPA[gradeInput.value], hasResult: true };
    }
  });
}

function updateLivePreview(semId) {
  // build a temp snapshot from the live form without saving, for instant feedback
  const semRes = getSemResult(semId);
  const snapshot = JSON.parse(JSON.stringify(semRes));
  document.querySelectorAll('.course-form-row').forEach(row => {
    const code = row.getAttribute('data-code');
    const credit = Number(row.getAttribute('data-credit'));
    const method = row.querySelector('.method-chip.active').getAttribute('data-method');
    const marksInput = row.querySelector('.marks-input');
    const gradeInput = row.querySelector('.grade-input');
    if (method === 'percent' && marksInput.value !== '') {
      const res = gradeFromPercent(marksInput.value);
      snapshot.courses[code] = { gpa: res.gpa, hasResult: true };
    } else if (method === 'grade' && gradeInput.value) {
      snapshot.courses[code] = { gpa: GRADE_TO_GPA[gradeInput.value], hasResult: true };
    } else {
      delete snapshot.courses[code];
    }
  });
  let creditSum = 0, weighted = 0;
  activeCourses(semId).forEach(c => {
    const r = snapshot.courses[c.code];
    if (r && r.hasResult) { creditSum += c.credit; weighted += c.credit * r.gpa; }
  });
  const gpa = creditSum > 0 ? weighted / creditSum : null;
  const el = document.getElementById('livePreviewGPA');
  if (el) el.textContent = fmt(gpa);
}

function wireCalculator() {
  const calcBtn = document.getElementById('calcTargetBtn');
  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      const cur = parseFloat(document.getElementById('tCurrent').value) || 0;
      const completed = parseFloat(document.getElementById('tCompleted').value) || 0;
      const remaining = parseFloat(document.getElementById('tRemaining').value) || 0;
      const target = parseFloat(document.getElementById('tTarget').value);
      const box = document.getElementById('targetResult');

      if (!target || remaining <= 0) {
        box.className = 'result-banner warn';
        box.textContent = remaining <= 0
          ? 'No remaining credits to plan for.'
          : 'Enter a target CGPA to calculate.';
        return;
      }
      const totalCredits = completed + remaining;
      const requiredWeighted = target * totalCredits - cur * completed;
      const requiredGPA = requiredWeighted / remaining;

      if (requiredGPA > 4.0001) {
        box.className = 'result-banner warn';
        box.textContent = `That target isn't reachable — it would require an average GPA of ${fmt(requiredGPA)} in your remaining ${fmt(remaining,1)} credits, above the 4.00 maximum.`;
      } else if (requiredGPA < 0) {
        box.className = 'result-banner ok';
        box.textContent = `You've already secured this target. Even a 0.00 average in the remaining credits keeps you at or above ${fmt(target)}.`;
      } else {
        box.className = 'result-banner ok';
        box.textContent = `You need an average GPA of ${fmt(requiredGPA)} across your remaining ${fmt(remaining,1)} credits to reach a CGPA of ${fmt(target)}.`;
      }
    });
  }

  const whatifBtn = document.getElementById('whatifBtn');
  if (whatifBtn) {
    whatifBtn.addEventListener('click', () => {
      const courseSel = document.getElementById('whatifCourse');
      const box = document.getElementById('whatifResult');
      if (!courseSel.value) {
        box.className = 'result-banner warn';
        box.textContent = 'No recorded course results to simulate yet.';
        return;
      }
      const [semId, code, credit, oldGpa] = courseSel.value.split('|');
      const newGpa = parseFloat(document.getElementById('whatifGrade').value);

      let creditSum = 0, weighted = 0;
      SEMESTERS.forEach(sem => {
        const semRes = getSemResult(sem.id);
        enteredCourses(sem.id).forEach(c => {
          const r = semRes.courses[c.code];
          const gpaToUse = (String(sem.id) === semId && c.code === code) ? newGpa : r.gpa;
          creditSum += c.credit;
          weighted += c.credit * gpaToUse;
        });
      });
      const newCGPA = creditSum > 0 ? weighted / creditSum : null;
      const actualCGPA = overallCGPA();
      const diff = newCGPA - actualCGPA;
      box.className = 'result-banner ok';
      box.textContent = `If that course became ${document.getElementById('whatifGrade').selectedOptions[0].textContent}, your CGPA would be ${fmt(newCGPA)} (currently ${fmt(actualCGPA)}, ${diff >= 0 ? '+' : ''}${fmt(diff)}). This preview is not saved.`;
    });
  }
}

function wireSettings() {
  const themeSwitch = document.getElementById('themeSwitch');
  if (themeSwitch) {
    themeSwitch.addEventListener('click', () => {
      STATE.settings.theme = STATE.settings.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      saveState();
      render();
    });
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(STATE, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nu-cse-results-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  const importInput = document.getElementById('importInput');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed.results || !parsed.settings) throw new Error('Invalid file format');
          if (confirm('Import this backup? It will replace your current data.')) {
            STATE = Object.assign(defaultState(), parsed);
            saveState();
            applyTheme();
            navigate('#/dashboard');
          }
        } catch (err) {
          alert('This file could not be read as a valid backup.');
        }
      };
      reader.readAsText(file);
    });
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset ALL data? This deletes every saved result and cannot be undone.')) {
        if (confirm('Are you absolutely sure? This is your last chance to cancel.')) {
          STATE = defaultState();
          saveState();
          applyTheme();
          navigate('#/dashboard');
        }
      }
    });
  }
}

/* ---------------- Service worker registration ---------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
