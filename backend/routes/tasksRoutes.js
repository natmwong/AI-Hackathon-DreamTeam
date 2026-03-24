/**
 * routes/tasks.js
 * ---------------
 * Route definitions for the Task CRUD API.
 * All logic lives in taskController — this file is routing only.
 *
 * Mounted at: /api/tasks
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Method  │ Path            │ Action                               │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ POST    │ /               │ Create tasks from a list of titles   │
 * │ GET     │ /               │ Get all tasks (with optional filters)│
 * │ GET     │ /:id            │ Get one task by id                   │
 * │ PATCH   │ /:id            │ Update title / isCompleted           │
 * │ DELETE  │ /:id            │ Delete one task                      │
 * │ DELETE  │ /               │ Delete ALL tasks                     │
 * └──────────────────────────────────────────────────────────────────┘
 */

const express = require('express');
const router  = express.Router();
const {
  createTasks,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  deleteAllTasks,
} = require('../controllers/taskController');

// ── Collection routes (/api/tasks) ───────────────────────────────────────────
router.post  ('/',    createTasks);
router.get   ('/',    getAllTasks);
router.delete('/',    deleteAllTasks);

// ── Individual resource routes (/api/tasks/:id) ──────────────────────────────
router.get   ('/:id', getTaskById);
router.patch ('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
