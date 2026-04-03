import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('enterprise_academic.db');
const JWT_SECRET = process.env.JWT_SECRET || 'enterprise-secret-2026';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ==========================================
// ENTERPRISE COLLEGE ARCHITECTURE (SQLITE)
// ==========================================
db.exec(`
  -- Global College/Department Structure
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE, -- e.g., "College of Information Technology", "College of Engineering"
    code TEXT UNIQUE, -- e.g., "CIT", "COE"
    head_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Subjects Table
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    code TEXT UNIQUE,
    credits INTEGER DEFAULT 3,
    dept_id INTEGER,
    FOREIGN KEY(dept_id) REFERENCES departments(id)
  );

  -- Degree Programs per Department
  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_id INTEGER,
    name TEXT, -- e.g., "BS in Information Technology"
    code TEXT UNIQUE, -- e.g., "BSIT"
    duration_years INTEGER DEFAULT 4,
    FOREIGN KEY(dept_id) REFERENCES departments(id)
  );

  -- Curriculum Mapping (Year/Semester Structure)
  CREATE TABLE IF NOT EXISTS curriculum (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER,
    subject_id INTEGER,
    year_level INTEGER, -- 1, 2, 3, 4
    semester INTEGER, -- 1, 2
    is_prerequisite_for INTEGER, -- subject_id
    FOREIGN KEY(program_id) REFERENCES programs(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id)
  );

  -- Enhanced User Table (RBAC + Departmental Scoping)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT, -- super_admin, dept_head, instructor, student
    name TEXT,
    dept_id INTEGER, -- Scoping for Dept Heads/Instructors
    program_id INTEGER, -- Scoping for Students
    FOREIGN KEY(dept_id) REFERENCES departments(id),
    FOREIGN KEY(program_id) REFERENCES programs(id)
  );

  -- Scalable Student Table (College Scale)
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- Link to users for login
    student_code TEXT UNIQUE,
    name TEXT,
    email TEXT UNIQUE,
    dept_id INTEGER,
    program_id INTEGER,
    year_level INTEGER,
    section TEXT,
    attendance_rate REAL DEFAULT 100,
    gpa REAL DEFAULT 0,
    risk_score REAL DEFAULT 0,
    risk_level TEXT DEFAULT 'Low',
    last_analysis_at DATETIME,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(dept_id) REFERENCES departments(id),
    FOREIGN KEY(program_id) REFERENCES programs(id)
  );

  -- High-Volume Academic Records
  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject_id INTEGER,
    instructor_id INTEGER,
    term TEXT, -- e.g., "2025-S1"
    score REAL,
    weight REAL DEFAULT 1.0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(instructor_id) REFERENCES users(id)
  );

  -- Subject Assignments (Mapping Instructors to Subjects)
  CREATE TABLE IF NOT EXISTS subject_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instructor_id INTEGER,
    subject_id INTEGER,
    program_id INTEGER,
    year_level INTEGER,
    semester INTEGER,
    section TEXT,
    FOREIGN KEY(instructor_id) REFERENCES users(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(program_id) REFERENCES programs(id)
  );
  -- System Settings
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// ==========================================
// ENTERPRISE SEEDING (COLLEGE SCALE)
// ==========================================
const seedCollege = () => {
  const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('super_admin');
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    
    // 1. Create Settings
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('pass_threshold', '60');
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('attendance_threshold', '75');
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('risk_sensitivity', '0.5');

    // 2. Create Departments
    db.prepare('INSERT OR IGNORE INTO departments (name, code) VALUES (?, ?)').run('College of Information Technology', 'CIT');
    db.prepare('INSERT OR IGNORE INTO departments (name, code) VALUES (?, ?)').run('College of Engineering', 'COE');
    
    const cit = db.prepare('SELECT id FROM departments WHERE code = ?').get('CIT') as any;
    const coe = db.prepare('SELECT id FROM departments WHERE code = ?').get('COE') as any;

    if (!cit || !coe) {
      console.error('Departments not found after seeding. Skipping further seeding.');
      return;
    }

    // 2. Create Programs
    db.prepare('INSERT OR IGNORE INTO programs (dept_id, name, code) VALUES (?, ?, ?)').run(cit.id, 'BS in Information Technology', 'BSIT');
    db.prepare('INSERT OR IGNORE INTO programs (dept_id, name, code) VALUES (?, ?, ?)').run(coe.id, 'BS in Computer Engineering', 'BSCPE');

    const bsit = db.prepare('SELECT id FROM programs WHERE code = ?').get('BSIT') as any;
    const bscpe = db.prepare('SELECT id FROM programs WHERE code = ?').get('BSCPE') as any;

    if (!bsit || !bscpe) {
      console.error('Programs not found after seeding. Skipping further seeding.');
      return;
    }

    // 3. Create Super Admin
    db.prepare('INSERT OR IGNORE INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
      'admin@college.edu', hash, 'super_admin', 'College Super Admin'
    );

    // 4. Create Dept Heads
    db.prepare('INSERT OR IGNORE INTO users (email, password, role, name, dept_id) VALUES (?, ?, ?, ?, ?)').run(
      'it.head@college.edu', hash, 'dept_head', 'Dr. IT Head', cit.id
    );

    // 5. Create Subjects
    db.prepare('INSERT OR IGNORE INTO subjects (name, code, dept_id) VALUES (?, ?, ?)').run('Data Structures', 'IT211', cit.id);
    db.prepare('INSERT OR IGNORE INTO subjects (name, code, dept_id) VALUES (?, ?, ?)').run('Circuit Analysis', 'EE101', coe.id);
    
    const sub1 = db.prepare('SELECT id FROM subjects WHERE code = ?').get('IT211') as any;

    if (!sub1) {
      console.error('Subjects not found after seeding. Skipping further seeding.');
      return;
    }

    // 6. Create Instructor
    const instructorRes = db.prepare('INSERT OR IGNORE INTO users (email, password, role, name, dept_id) VALUES (?, ?, ?, ?, ?)').run(
      'teacher@college.edu', hash, 'instructor', 'Prof. John Smith', cit.id
    );
    const instructorId = instructorRes.changes > 0 ? instructorRes.lastInsertRowid : (db.prepare('SELECT id FROM users WHERE email = ?').get('teacher@college.edu') as any).id;

    // 7. Assign Subject to Instructor
    db.prepare('INSERT OR IGNORE INTO subject_assignments (instructor_id, subject_id, program_id, year_level, semester, section) VALUES (?, ?, ?, ?, ?, ?)').run(
      instructorId, sub1.id, bsit.id, 2, 1, 'A'
    );

    // 8. Create Students (Batch)
    const insertUser = db.prepare('INSERT OR IGNORE INTO users (email, password, role, name, dept_id, program_id) VALUES (?, ?, ?, ?, ?, ?)');
    const insertStudent = db.prepare('INSERT OR IGNORE INTO students (user_id, student_code, name, email, dept_id, program_id, year_level, section, gpa, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    const studentData = [
      ['stu1@college.edu', 'Alice Vance', 'STU-001', cit.id, bsit.id, 2, 'A', 3.8, 'Low'],
      ['stu2@college.edu', 'Bob Miller', 'STU-002', coe.id, bscpe.id, 2, 'B', 1.5, 'High'],
      ['stu3@college.edu', 'Charlie Day', 'STU-003', cit.id, bsit.id, 2, 'A', 2.9, 'Medium'],
    ];

    studentData.forEach(([email, name, code, dept, prog, year, sec, gpa, risk]) => {
      const res = insertUser.run(email, hash, 'student', name, dept, prog);
      if (res.changes > 0) {
        const uid = res.lastInsertRowid;
        insertStudent.run(uid, code, name, email, dept, prog, year, sec, gpa, risk);
      }
    });

    console.log('College Enterprise Data Seeded Successfully');
  }
};

seedCollege();

async function startServer() {
  const app = express();
  app.use(express.json());

  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare(`
      SELECT u.*, d.name as dept_name, p.name as program_name 
      FROM users u 
      LEFT JOIN departments d ON u.dept_id = d.id 
      LEFT JOIN programs p ON u.program_id = p.id 
      WHERE u.email = ?
    `).get(email) as any;

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  // Global Analytics (Super Admin)
  app.get('/api/analytics/global', authenticate, (req, res) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM departments) as total_depts,
        (SELECT COUNT(*) FROM programs) as total_programs,
        (SELECT AVG(gpa) FROM students) as avg_gpa
    `).get() as any;

    const deptBreakdown = db.prepare(`
      SELECT d.name, d.code, COUNT(s.id) as student_count, AVG(s.gpa) as avg_gpa
      FROM departments d
      LEFT JOIN students s ON d.id = s.dept_id
      GROUP BY d.id
    `).all();

    res.json({ stats, deptBreakdown });
  });

  // Department Analytics (Dept Head)
  app.get('/api/analytics/department/:id', authenticate, (req, res) => {
    const deptId = req.params.id;
    // Security: Only super_admin or the specific dept_head can access
    if (req.user.role === 'dept_head' && req.user.dept_id != deptId) return res.sendStatus(403);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_students,
        AVG(gpa) as avg_gpa,
        SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high_risk_count
      FROM students WHERE dept_id = ?
    `).get(deptId) as any;

    const programBreakdown = db.prepare(`
      SELECT p.name, p.code, COUNT(s.id) as student_count, AVG(s.gpa) as avg_gpa
      FROM programs p
      LEFT JOIN students s ON p.id = s.program_id
      WHERE p.dept_id = ?
      GROUP BY p.id
    `).all(deptId);

    res.json({ stats, programBreakdown });
  });

  // Departments CRUD
  app.get('/api/departments', authenticate, (req, res) => {
    res.json(db.prepare('SELECT * FROM departments').all());
  });

  // Programs CRUD
  app.get('/api/programs', authenticate, (req, res) => {
    const { deptId } = req.query;
    let query = 'SELECT * FROM programs';
    if (deptId) return res.json(db.prepare(query + ' WHERE dept_id = ?').all(deptId));
    res.json(db.prepare(query).all());
  });

  // Curriculum Management
  app.get('/api/curriculum/:programId', authenticate, (req, res) => {
    const curriculum = db.prepare(`
      SELECT c.*, s.name as subject_name, s.code as subject_code
      FROM curriculum c
      JOIN subjects s ON c.subject_id = s.id
      WHERE c.program_id = ?
      ORDER BY c.year_level, c.semester
    `).all(req.params.programId);
    res.json(curriculum);
  });

  // Paginated Student List (College Scale)
  app.get('/api/students', authenticate, (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const { risk, deptId, programId, yearLevel } = req.query;

    let query = 'SELECT s.*, p.name as program_name, d.name as dept_name FROM students s JOIN programs p ON s.program_id = p.id JOIN departments d ON s.dept_id = d.id WHERE 1=1';
    const params: any[] = [];

    if (risk) { query += ' AND s.risk_level = ?'; params.push(risk); }
    if (deptId) { query += ' AND s.dept_id = ?'; params.push(deptId); }
    if (programId) { query += ' AND s.program_id = ?'; params.push(programId); }
    if (yearLevel) { query += ' AND s.year_level = ?'; params.push(yearLevel); }

    const total = db.prepare(`SELECT COUNT(*) as count FROM (${query})`).get(...params) as any;
    const students = db.prepare(`${query} ORDER BY s.name LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json({
      data: students,
      pagination: {
        total: total.count,
        pages: Math.ceil(total.count / limit),
        currentPage: page
      }
    });
  });
  // Student Detail with Grades
  app.get('/api/students/:id', authenticate, (req, res) => {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    const grades = db.prepare(`
      SELECT g.*, s.name as subject_name 
      FROM grades g 
      JOIN subjects s ON g.subject_id = s.id 
      WHERE g.student_id = ? 
      ORDER BY g.recorded_at DESC
    `).all(req.params.id);
    
    res.json({ ...student as object, records: grades });
  });

  // Staff Management
  app.get('/api/staff', authenticate, (req, res) => {
    const staff = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, d.name as dept_name 
      FROM users u 
      LEFT JOIN departments d ON u.dept_id = d.id
      WHERE u.role != 'student'
    `).all();
    res.json(staff);
  });

  app.post('/api/staff', authenticate, (req, res) => {
    const { name, email, password, role, dept_id } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      db.prepare('INSERT INTO users (name, email, password, role, dept_id) VALUES (?, ?, ?, ?, ?)').run(name, email, hashedPassword, role, dept_id || null);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ message: 'Staff email already exists' });
    }
  });

  // Subjects & Curriculum
  app.get('/api/subjects', authenticate, (req, res) => {
    const subjects = db.prepare('SELECT * FROM subjects').all();
    res.json(subjects);
  });

  // System Settings
  app.get('/api/curriculum/settings', authenticate, (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const config: any = {};
    settings.forEach((s: any) => config[s.key] = s.value);
    res.json(config);
  });

  app.post('/api/curriculum/settings', authenticate, (req, res) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const { pass_threshold, attendance_threshold, risk_sensitivity } = req.body;
    
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    upsert.run('pass_threshold', pass_threshold.toString());
    upsert.run('attendance_threshold', attendance_threshold.toString());
    upsert.run('risk_sensitivity', risk_sensitivity.toString());
    
    res.json({ success: true });
  });

  // Departments
  app.get('/api/departments', authenticate, (req, res) => {
    const depts = db.prepare('SELECT * FROM departments').all();
    res.json(depts);
  });

  // Programs
  app.get('/api/programs', authenticate, (req, res) => {
    const programs = db.prepare('SELECT * FROM programs').all();
    res.json(programs);
  });

  // Instructor Subject Load
  app.get('/api/instructor/subjects', authenticate, (req, res) => {
    if (req.user.role !== 'instructor') return res.sendStatus(403);
    const subjects = db.prepare(`
      SELECT sa.*, s.name as subject_name, s.code as subject_code, p.name as program_name
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN programs p ON sa.program_id = p.id
      WHERE sa.instructor_id = ?
    `).all(req.user.id);
    res.json(subjects);
  });

  // Instructor Students (Students in assigned subjects)
  app.get('/api/instructor/students', authenticate, (req, res) => {
    if (req.user.role !== 'instructor') return res.sendStatus(403);
    const students = db.prepare(`
      SELECT DISTINCT s.*, p.name as program_name
      FROM students s
      JOIN programs p ON s.program_id = p.id
      JOIN subject_assignments sa ON s.program_id = sa.program_id AND s.year_level = sa.year_level AND s.section = sa.section
      WHERE sa.instructor_id = ?
    `).all(req.user.id);
    res.json(students);
  });

  // Student Personal Data
  app.get('/api/student/me', authenticate, (req, res) => {
    if (req.user.role !== 'student') return res.sendStatus(403);
    const student = db.prepare(`
      SELECT s.*, p.name as program_name, d.name as dept_name
      FROM students s
      JOIN programs p ON s.program_id = p.id
      JOIN departments d ON s.dept_id = d.id
      WHERE s.user_id = ?
    `).get(req.user.id);
    
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    const grades = db.prepare(`
      SELECT g.*, s.name as subject_name, s.code as subject_code
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      WHERE g.student_id = ?
      ORDER BY g.recorded_at DESC
    `).all((student as any).id);

    res.json({ ...student as object, records: grades });
  });

  app.get('/api/analytics/overview', authenticate, (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high_risk,
        AVG(attendance_rate) as avg_attendance,
        AVG(gpa) as avg_gpa
      FROM students
    `).get();
    res.json(stats);
  });

  // AI Prediction
  app.post('/api/predict/:id', authenticate, async (req, res) => {
    try {
      const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id) as any;
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const prompt = `Analyze risk for ${student.name}. GPA: ${student.gpa}, Attendance: ${student.attendance_rate}%. Return JSON: {score: 0-1, reasoning: string}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text || '{}');
      const level = result.score > 0.7 ? 'High' : (result.score > 0.4 ? 'Medium' : 'Low');

      db.prepare('UPDATE students SET risk_score = ?, risk_level = ?, last_analysis_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(result.score, level, req.params.id);

      res.json({ score: result.score, level, reasoning: result.reasoning });
    } catch (error) {
      res.status(500).json({ message: 'AI analysis failed' });
    }
  });

  // Vite
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  app.listen(3000, '0.0.0.0', () => console.log('Enterprise Server Running on Port 3000'));
}

startServer();
