/**
 * taskController.js
 * -----------------
 * Handles all request/response logic for task CRUD.
 * Business rules live here; raw storage ops stay in taskStore.
 *
 * Task schema:
 *   id          — random 10-char alphanumeric string
 *   title       — string (trimmed, non-empty)
 *   isCompleted — boolean (default: false)
 *   date        — ISO date string of creation time
 */

const store = require('../storage/taskStore');

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Generate a random 10-character alphanumeric ID.
 * Charset: a-z A-Z 0-9  (62 chars → ~3.5 quadrillion combinations)
 */
const generateId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

/** Build a fresh task object from a title string. */
const buildTask = (title) => ({
  id:          generateId(),
  title:       title.trim(),
  isCompleted: false,
  date:        new Date().toISOString(),
});

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * POST /api/tasks
 * Body: { "titles": ["Task A", "Task B", ...] }
 *
 * Creates one task per title string. Returns all created tasks.
 */
const createTasks = (req, res) => {
  const { titles } = req.body;

  // Validate: titles must be a non-empty array of strings
  if (!Array.isArray(titles) || titles.length === 0) {
    return res.status(400).json({
      success: false,
      error: '"titles" must be a non-empty array of strings.',
    });
  }

  const invalid = titles.filter((t) => typeof t !== 'string' || t.trim() === '');
  if (invalid.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'All entries in "titles" must be non-empty strings.',
      invalid_entries: invalid,
    });
  }

  const newTasks = titles.map(buildTask);
  const inserted = store.insertMany(newTasks);

  return res.status(201).json({
    success: true,
    message: `${inserted.length} task(s) created.`,
    count:   inserted.length,
    tasks:   inserted,
  });
};

// ─── READ ALL ─────────────────────────────────────────────────────────────────

/**
 * GET /api/tasks
 * Query params (all optional):
 *   ?completed=true|false   filter by completion status
 *   ?search=keyword         filter titles containing keyword (case-insensitive)
 *
 * Returns all tasks, newest first.
 */
const getAllTasks = (req, res) => {
  let tasks = store.getAll();

  // Filter: isCompleted
  if (req.query.completed !== undefined) {
    const want = req.query.completed === 'true';
    tasks = tasks.filter((t) => t.isCompleted === want);
  }

  // Filter: title search
  if (req.query.search) {
    const kw = req.query.search.toLowerCase();
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(kw));
  }

  // Sort: newest first (by date desc)
  tasks = tasks.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.json({
    success: true,
    count:   tasks.length,
    tasks,
  });
};

// ─── READ ONE ─────────────────────────────────────────────────────────────────

/**
 * GET /api/tasks/:id
 * Returns a single task by its id.
 */
const getTaskById = (req, res) => {
  const task = store.getById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error:   `Task with id "${req.params.id}" not found.`,
    });
  }

  return res.json({ success: true, task });
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * PATCH /api/tasks/:id
 * Body: { "title": "New title", "isCompleted": true }
 *
 * Partially updates a task. Only "title" and "isCompleted" are mutable.
 * id and date are immutable and silently ignored if sent.
 */
const updateTask = (req, res) => {
  const { title, isCompleted } = req.body;

  // At least one valid field required
  if (title === undefined && isCompleted === undefined) {
    return res.status(400).json({
      success: false,
      error:   'Provide at least one field to update: "title" or "isCompleted".',
    });
  }

  // Validate types
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ success: false, error: '"title" must be a non-empty string.' });
  }

  if (isCompleted !== undefined && typeof isCompleted !== 'boolean') {
    return res.status(400).json({ success: false, error: '"isCompleted" must be a boolean.' });
  }

  const fields = {};
  if (title       !== undefined) fields.title       = title.trim();
  if (isCompleted !== undefined) fields.isCompleted = isCompleted;

  const updated = store.updateById(req.params.id, fields);

  if (!updated) {
    return res.status(404).json({
      success: false,
      error:   `Task with id "${req.params.id}" not found.`,
    });
  }

  return res.json({ success: true, message: 'Task updated.', task: updated });
};

// ─── DELETE ONE ───────────────────────────────────────────────────────────────

/**
 * DELETE /api/tasks/:id
 * Removes a single task. Returns the deleted task for confirmation.
 */
const deleteTask = (req, res) => {
  const deleted = store.deleteById(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error:   `Task with id "${req.params.id}" not found.`,
    });
  }

  return res.json({ success: true, message: 'Task deleted.', task: deleted });
};

// ─── DELETE ALL ───────────────────────────────────────────────────────────────

/**
 * DELETE /api/tasks
 * Clears all tasks from the store. Use with care.
 */
const deleteAllTasks = (req, res) => {
  const count = store.clearAll();
  return res.json({ success: true, message: `${count} task(s) deleted.`, count });
};

module.exports = {
  createTasks,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  deleteAllTasks,
};
