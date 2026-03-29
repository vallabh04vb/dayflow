require('dotenv').config();

const express = require('express');
const path = require('path');
const cron = require('node-cron');
const db = require('./db');
const mailer = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Setup redirect middleware ---
app.use((req, res, next) => {
  // Skip API routes and static files
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return next();
  }
  // If setup not complete and not already on setup page, redirect
  if (!db.isSetupComplete() && req.path !== '/setup') {
    return res.redirect('/setup');
  }
  next();
});

// --- Page routes ---
app.get('/setup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- API: Settings ---

app.get('/api/settings', (req, res) => {
  res.json(db.getAllSettings());
});

app.post('/api/settings', (req, res) => {
  const entries = req.body;
  for (const [key, value] of Object.entries(entries)) {
    db.setSetting(key, value);
  }
  res.json({ ok: true });
});

app.get('/api/setup-status', (req, res) => {
  res.json({ complete: db.isSetupComplete() });
});

app.post('/api/setup', (req, res) => {
  const { user_name, email, timezone } = req.body;
  if (!user_name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  db.setSetting('user_name', user_name);
  db.setSetting('email', email);
  db.setSetting('timezone', timezone || 'Asia/Kolkata');

  // Set default reminder settings
  db.setSetting('reminder_morning_enabled', 'true');
  db.setSetting('reminder_morning_time', '07:00');
  db.setSetting('reminder_start_enabled', 'true');
  db.setSetting('reminder_start_time', '08:00');
  db.setSetting('reminder_afternoon_enabled', 'true');
  db.setSetting('reminder_afternoon_time', '15:00');
  db.setSetting('reminder_evening_enabled', 'true');
  db.setSetting('reminder_evening_time', '21:00');

  // Seed default tasks
  db.seedDefaultTasks();

  res.json({ ok: true });
});

// --- API: Tasks ---

app.get('/api/tasks/:date', (req, res) => {
  const tasks = db.getTasksByDate(req.params.date);
  const stats = db.getCompletionStats(req.params.date);
  const streak = db.getStreak();
  res.json({ tasks, stats, streak });
});

app.post('/api/tasks', (req, res) => {
  const { date, title, order_index, carried_over } = req.body;
  if (!date || !title) {
    return res.status(400).json({ error: 'date and title are required' });
  }
  const task = db.addTask(date, title, order_index, carried_over);
  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const task = db.updateTask(parseInt(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  db.deleteTask(parseInt(req.params.id));
  res.json({ ok: true });
});

app.post('/api/tasks/reorder', (req, res) => {
  const { date, ordered_ids } = req.body;
  db.reorderTasks(date, ordered_ids);
  res.json({ ok: true });
});

app.post('/api/tasks/copy', (req, res) => {
  const { from_date, to_date } = req.body;
  const tasks = db.copyTasksToDate(from_date, to_date);
  res.json(tasks);
});

// --- API: History ---

app.get('/api/history', (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end query params required' });
  }
  const data = db.getHistoryRange(start, end);
  res.json(data);
});

// --- API: Email ---

app.post('/api/test-email', async (req, res) => {
  try {
    await mailer.sendTestEmail();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cron Jobs ---

function scheduleCronJobs() {
  // Midnight auto-continuation: copy today's tasks to tomorrow if tomorrow is empty
  cron.schedule('5 0 * * *', () => {
    console.log('[Cron] Midnight auto-continuation check');
    const today = db.getToday();
    const tomorrow = db.getTomorrow();
    const tomorrowTasks = db.getTasksByDate(tomorrow);
    if (tomorrowTasks.length === 0) {
      db.copyTasksToDate(today, tomorrow);
      console.log('[Cron] Copied tasks to tomorrow');
    }
  });

  // Email reminders — check settings before sending
  cron.schedule('* * * * *', async () => {
    const settings = db.getAllSettings();
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (settings.reminder_morning_enabled === 'true' && currentTime === settings.reminder_morning_time) {
      await mailer.sendMorningEmail();
    }
    if (settings.reminder_start_enabled === 'true' && currentTime === settings.reminder_start_time) {
      await mailer.sendReminderEmail();
    }
    if (settings.reminder_afternoon_enabled === 'true' && currentTime === settings.reminder_afternoon_time) {
      await mailer.sendAfternoonEmail();
    }
    if (settings.reminder_evening_enabled === 'true' && currentTime === settings.reminder_evening_time) {
      await mailer.sendEveningEmail();
    }
  });

  console.log('[Cron] Scheduled: midnight auto-continuation, email reminders (checking every minute)');
}

// --- Start ---

(async () => {
  await db.initDb();
  scheduleCronJobs();

  app.listen(PORT, () => {
    console.log(`🌊 DayFlow running at http://localhost:${PORT}`);
    console.log(`   Timezone: ${process.env.TZ || 'system default'}`);
  });
})();
