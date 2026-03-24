/**
 * taskStore.js
 * -----------
 * Thin wrapper around node-localstorage.
 * All task data lives under a single key: "tasks"
 * Value is a JSON-serialised array of task objects.
 *
 * No cookies, no sessions — pure key/value cache on disk.
 */

const { LocalStorage } = require('node-localstorage');
const path = require('path');

// Persisted to ./data/localStorage on the filesystem
const storage = new LocalStorage(path.join(__dirname, '../data/localStorage'));

const TASKS_KEY = 'tasks';

// ─── Low-level helpers ────────────────────────────────────────────────────────

/** Read all tasks from storage. Returns an array. */
const readAll = () => {
  const raw = storage.getItem(TASKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/** Persist the full task array back to storage. */
const writeAll = (tasks) => {
  storage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return every task in the store. */
const getAll = () => readAll();

/** Find a single task by id. Returns the task or null. */
const getById = (id) => readAll().find((t) => t.id === id) ?? null;

/**
 * Insert one or more tasks.
 * @param {Object|Object[]} taskOrTasks - A single task object or an array.
 * @returns {Object[]} The newly inserted tasks.
 */
const insertMany = (newTasks) => {
  const current = readAll();
  const toInsert = Array.isArray(newTasks) ? newTasks : [newTasks];
  writeAll([...current, ...toInsert]);
  return toInsert;
};

/**
 * Update fields on an existing task by id.
 * @param {string} id
 * @param {Partial<Task>} fields - Only provided fields are updated.
 * @returns {Object|null} The updated task, or null if not found.
 */
const updateById = (id, fields) => {
  const tasks = readAll();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  // Prevent overwriting id or date
  const { id: _id, date: _date, ...safeFields } = fields;
  tasks[idx] = { ...tasks[idx], ...safeFields };
  writeAll(tasks);
  return tasks[idx];
};

/**
 * Delete a task by id.
 * @returns {Object|null} The deleted task, or null if not found.
 */
const deleteById = (id) => {
  const tasks = readAll();
  const target = tasks.find((t) => t.id === id);
  if (!target) return null;
  writeAll(tasks.filter((t) => t.id !== id));
  return target;
};

/** Wipe all tasks. Returns the count that were cleared. */
const clearAll = () => {
  const count = readAll().length;
  storage.removeItem(TASKS_KEY);
  return count;
};

module.exports = { getAll, getById, insertMany, updateById, deleteById, clearAll };
