/* ============================================================
   NU CSE Result Manager — Static Course & Grading Data
   Source: National University Bangladesh, CSE Honours syllabus
   ============================================================ */

// grade boundaries, ordered highest to lowest
const GRADE_SCALE = [
  { grade: 'A+', gpa: 4.00, min: 80, max: 100, label: '80% and above' },
  { grade: 'A',  gpa: 3.75, min: 75, max: 79,  label: '75% – 79%' },
  { grade: 'A-', gpa: 3.50, min: 70, max: 74,  label: '70% – 74%' },
  { grade: 'B+', gpa: 3.25, min: 65, max: 69,  label: '65% – 69%' },
  { grade: 'B',  gpa: 3.00, min: 60, max: 64,  label: '60% – 64%' },
  { grade: 'B-', gpa: 2.75, min: 55, max: 59,  label: '55% – 59%' },
  { grade: 'C+', gpa: 2.50, min: 50, max: 54,  label: '50% – 54%' },
  { grade: 'C',  gpa: 2.25, min: 45, max: 49,  label: '45% – 49%' },
  { grade: 'D',  gpa: 2.00, min: 40, max: 44,  label: '40% – 44%' },
  { grade: 'F',  gpa: 0.00, min: 0,  max: 39,  label: 'Below 40%' }
];

const GRADE_TO_GPA = Object.fromEntries(GRADE_SCALE.map(g => [g.grade, g.gpa]));

function gradeFromPercent(pct) {
  const p = Math.max(0, Math.min(100, Number(pct)));
  for (const g of GRADE_SCALE) {
    if (p >= g.min) return { grade: g.grade, gpa: g.gpa };
  }
  return { grade: 'F', gpa: 0.00 };
}

// course helper
const C = (code, name, credit, group) => ({ code, name, credit, group: group || 'core' });

const SEMESTERS = [
  {
    id: 1, year: 1, name: 'Semester 1',
    courses: [
      C('510201', 'Structured Programming Language', 3.0),
      C('510202', 'Structured Programming Language Lab', 1.5),
      C('510203', 'Electrical and Electronic Circuit', 3.0),
      C('510204', 'Electrical and Electronic Circuit Lab', 1.5),
      C('510205', 'Calculus', 3.0),
      C('510207', 'Physics', 3.0),
      C('510209', 'English', 3.0)
    ]
  },
  {
    id: 2, year: 1, name: 'Semester 2',
    courses: [
      C('510221', 'Digital Systems Design', 3.0),
      C('510222', 'Digital Systems Lab', 1.5),
      C('510223', 'Discrete Mathematics', 3.0),
      C('510225', 'Linear Algebra', 3.0),
      C('510227', 'Statistics and Probability', 3.0),
      C('510229', 'History of the Emergence of Independent Bangladesh', 3.0)
    ]
  },
  {
    id: 3, year: 2, name: 'Semester 3',
    courses: [
      C('520201', 'Data Structure', 3.0),
      C('520202', 'Data Structure Lab', 1.5),
      C('520203', 'Object-Oriented Programming', 3.0),
      C('520204', 'Object-Oriented Programming Lab', 1.5),
      C('520205', 'Computer Architecture', 3.0),
      C('520207', 'Ordinary Differential Equation', 3.0),
      C('520209', 'Fundamental of Business Studies', 3.0)
    ]
  },
  {
    id: 4, year: 2, name: 'Semester 4',
    courses: [
      C('520221', 'Database Management System', 3.0),
      C('520222', 'Database Management System Lab', 1.5),
      C('520223', 'Microprocessor and Assembly Language', 3.0),
      C('520224', 'Microprocessor and Assembly Language Lab', 1.5),
      C('520225', 'Design and Analysis of Algorithms', 3.0),
      C('520226', 'Design and Analysis of Algorithms Lab', 1.5),
      C('520227', 'Numerical Analysis', 3.0)
    ]
  },
  {
    id: 5, year: 3, name: 'Semester 5',
    courses: [
      C('530201', 'Peripheral and Interfacing', 3.0),
      C('530202', 'Peripheral and Interfacing Lab', 1.5),
      C('530203', 'Data and Telecommunications', 3.0),
      C('530204', 'Data and Telecommunications Lab', 1.5),
      C('530205', 'Operating System', 3.0),
      C('530206', 'Operating System Lab', 1.5),
      C('530207', 'Economics', 3.0)
    ]
  },
  {
    id: 6, year: 3, name: 'Semester 6',
    courses: [
      C('530219', 'Software Engineering', 3.0),
      C('530220', 'Software Engineering Lab', 1.5),
      C('530221', 'Computer Networking', 3.0),
      C('530222', 'Computer Networking Lab', 1.5),
      C('530223', 'Embedded System Programming', 3.0),
      C('530224', 'Embedded System Programming Lab', 1.5),
      C('530225', 'Theory of Computation', 3.0)
    ]
  },
  {
    id: 7, year: 4, name: 'Semester 7',
    courses: [
      C('540201', 'Artificial Intelligence', 3.0),
      C('540202', 'Artificial Intelligence Lab', 1.5),
      C('540203', 'Compiler Design and Construction', 3.0),
      C('540204', 'Compiler Design Lab', 1.5),
      C('540205', 'Computer Graphics', 3.0),
      C('540206', 'Computer Graphics Lab', 1.5),
      C('540207', 'E-Commerce and Web Engineering', 3.0),
      C('540208', 'E-Commerce and Web Engineering Lab', 1.5)
    ]
  },
  {
    id: 8, year: 4, name: 'Semester 8',
    courses: [
      C('540219', 'Network and Information Security', 3.0),
      C('540220', 'Network and Information Security Lab', 1.5),
      C('540221', 'Information System Management', 3.0),
      C('540222', 'Project/Industry Attachment', 6.0),
      // optional theory group — pick exactly one
      C('540223', 'Simulation and Modeling', 3.0, 'optTheory'),
      C('540225', 'Parallel and Distributed Systems', 3.0, 'optTheory'),
      C('540227', 'Digital Signal Processing', 3.0, 'optTheory'),
      C('540229', 'Digital Image Processing', 3.0, 'optTheory'),
      C('540231', 'Multimedia', 3.0, 'optTheory'),
      C('540233', 'Pattern Recognition', 3.0, 'optTheory'),
      C('540235', 'Design and Analysis of VLSI Systems', 3.0, 'optTheory'),
      C('540237', 'Micro-controller and Embedded System', 3.0, 'optTheory'),
      C('540239', 'Cyber Law and Computer Forensic', 3.0, 'optTheory'),
      C('540241', 'Natural Language Processing', 3.0, 'optTheory'),
      C('540243', 'System Analysis and Design', 3.0, 'optTheory'),
      C('540245', 'Optical Fiber Communication', 3.0, 'optTheory'),
      C('540247', 'Human Computer Interaction', 3.0, 'optTheory'),
      C('540249', 'Graph Theory', 3.0, 'optTheory'),
      // optional lab group — pick exactly one, paired with theory above by index
      C('540224', 'Simulation and Modeling Lab', 1.5, 'optLab'),
      C('540226', 'Parallel and Distributed Systems Lab', 1.5, 'optLab'),
      C('540228', 'Digital Signal Processing Lab', 1.5, 'optLab'),
      C('540230', 'Digital Image Processing Lab', 1.5, 'optLab'),
      C('540232', 'Multimedia Lab', 1.5, 'optLab'),
      C('540234', 'Pattern Recognition Lab', 1.5, 'optLab'),
      C('540236', 'Design and Testing of VLSI Systems Lab', 1.5, 'optLab'),
      C('540238', 'Micro-controller and Embedded System Lab', 1.5, 'optLab'),
      C('540240', 'Cyber Law and Computer Forensics Lab', 1.5, 'optLab'),
      C('540242', 'Natural Language Processing Lab', 1.5, 'optLab'),
      C('540244', 'System Analysis and Design Lab', 1.5, 'optLab'),
      C('540246', 'Optical Fiber Communication Lab', 1.5, 'optLab'),
      C('540248', 'Human Computer Interaction Lab', 1.5, 'optLab'),
      C('540250', 'Graph Theory Lab', 1.5, 'optLab')
    ]
  }
];

// Full-programme totals (all core + exactly one opt-theory + one opt-lab per semester 8)
function totalProgrammeCredits() {
  let total = 0;
  SEMESTERS.forEach(sem => {
    sem.courses.forEach(c => {
      if (c.group === 'core') total += c.credit;
    });
  });
  // semester 8 optional pair: one theory (3.0) + one lab (1.5)
  total += 3.0 + 1.5;
  return total; // = 126 (108 core across sem1-7... ) computed dynamically, not hardcoded
}
