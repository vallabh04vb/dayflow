const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'dayflow.db');
let db;

// Initialize database (must be called before anything else)
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      carried_over INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)');

  save();
  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper to run a query and return all rows as objects
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper to get single row
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper to run mutation
function run(sql, params = []) {
  db.run(sql, params);
  save();
}

// --- Settings ---

function getSetting(key) {
  const row = get('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

function setSetting(key, value) {
  run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

function getAllSettings() {
  const rows = all('SELECT key, value FROM settings');
  const obj = {};
  for (const row of rows) {
    obj[row.key] = row.value;
  }
  return obj;
}

function isSetupComplete() {
  const name = getSetting('user_name');
  const email = getSetting('email');
  return !!(name && email);
}

// --- Tasks ---

function getTasksByDate(date) {
  return all('SELECT * FROM tasks WHERE date = ? ORDER BY order_index ASC, id ASC', [date]);
}

function addTask(date, title, orderIndex, carriedOver = 0) {
  if (orderIndex === undefined || orderIndex === null) {
    const max = get('SELECT MAX(order_index) as m FROM tasks WHERE date = ?', [date]);
    orderIndex = (max && max.m !== null) ? max.m + 1 : 0;
  }
  db.run(
    'INSERT INTO tasks (date, title, order_index, carried_over) VALUES (?, ?, ?, ?)',
    [date, title, orderIndex, carriedOver ? 1 : 0]
  );
  // Get the newly inserted task by matching on all fields (order by id desc to get latest)
  const result = get(
    'SELECT * FROM tasks WHERE date = ? AND title = ? ORDER BY id DESC LIMIT 1',
    [date, title]
  );
  save();
  return result;
}

function updateTask(id, updates) {
  const task = get('SELECT * FROM tasks WHERE id = ?', [id]);
  if (!task) return null;

  if (updates.title !== undefined) {
    run('UPDATE tasks SET title = ? WHERE id = ?', [updates.title, id]);
  }
  if (updates.completed !== undefined) {
    run('UPDATE tasks SET completed = ? WHERE id = ?', [updates.completed ? 1 : 0, id]);
  }
  if (updates.order_index !== undefined) {
    run('UPDATE tasks SET order_index = ? WHERE id = ?', [updates.order_index, id]);
  }
  return get('SELECT * FROM tasks WHERE id = ?', [id]);
}

function deleteTask(id) {
  run('DELETE FROM tasks WHERE id = ?', [id]);
}

function reorderTasks(date, orderedIds) {
  orderedIds.forEach((id, index) => {
    db.run('UPDATE tasks SET order_index = ? WHERE id = ?', [index, id]);
  });
  save();
}

function copyTasksToDate(fromDate, toDate) {
  const existing = getTasksByDate(toDate);
  if (existing.length > 0) return existing;

  const sourceTasks = getTasksByDate(fromDate);
  sourceTasks.forEach((task, index) => {
    const isCarriedOver = !task.completed ? 1 : 0;
    db.run(
      'INSERT INTO tasks (date, title, order_index, carried_over) VALUES (?, ?, ?, ?)',
      [toDate, task.title, index, isCarriedOver]
    );
  });
  save();
  return getTasksByDate(toDate);
}

function getCompletionStats(date) {
  const tasks = getTasksByDate(date);
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  return { total, done, percentage: total > 0 ? Math.round((done / total) * 100) : 0 };
}

function getStreak() {
  let streak = 0;
  const today = getToday();

  const todayStats = getCompletionStats(today);
  if (todayStats.total > 0 && todayStats.done === todayStats.total) {
    streak = 1;
  }

  let d = new Date(today + 'T12:00:00');
  d.setDate(d.getDate() - 1);

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(d);
    const stats = getCompletionStats(dateStr);
    if (stats.total === 0 || stats.done < stats.total) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

function getHistoryRange(startDate, endDate) {
  return all(`
    SELECT date,
           COUNT(*) as total,
           SUM(completed) as done
    FROM tasks
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date ASC
  `, [startDate, endDate]);
}

// --- Seed default tasks ---

function seedDefaultTasks() {
  const today = getToday();
  const tomorrow = getTomorrow();

  const defaults = [
    '\u{1F4A7} Drink hot water',
    '\u{1F3CB}\uFE0F Gym',
    '\u{1F4BB} Coding basics + coding challenge',
    '\u{1F4CB} Plan important things for today',
    '\u{1F3E2} Office deep work block',
    '\u{1F916} AI research & learning',
    '\u{1F4DA} Read (Perplexity / book)',
    '\u{1F5D3}\uFE0F Plan new tasks for tomorrow'
  ];

  const todayTasks = getTasksByDate(today);
  const tomorrowTasks = getTasksByDate(tomorrow);

  if (todayTasks.length === 0) {
    defaults.forEach((title, i) => {
      db.run('INSERT INTO tasks (date, title, order_index) VALUES (?, ?, ?)', [today, title, i]);
    });
    save();
  }
  if (tomorrowTasks.length === 0) {
    defaults.forEach((title, i) => {
      db.run('INSERT INTO tasks (date, title, order_index) VALUES (?, ?, ?)', [tomorrow, title, i]);
    });
    save();
  }
}

// --- Helpers ---

function getToday() {
  return formatDate(new Date());
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  initDb,
  getSetting,
  setSetting,
  getAllSettings,
  isSetupComplete,
  getTasksByDate,
  addTask,
  updateTask,
  deleteTask,
  reorderTasks,
  copyTasksToDate,
  getCompletionStats,
  getStreak,
  getHistoryRange,
  seedDefaultTasks,
  getToday,
  getTomorrow,
  formatDate
};
