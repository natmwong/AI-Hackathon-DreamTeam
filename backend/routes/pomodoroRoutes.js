const express = require('express');
const router = express.Router();
const { getPomodoroContext } = require('../services/pomodoroService');

/**
 * POST /api/pomodoro/login
 *
 * Body (optional):
 *   { "login_time": "2024-01-15T09:30:00" }   // ISO string – omit to use server time
 *
 * Returns the pomodoro context for the user at login.
 */
router.post('/login', (req, res) => {
  try {
    let loginTime;

    if (req.body && req.body.login_time) {
      loginTime = new Date(req.body.login_time);
      if (isNaN(loginTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid login_time format. Use ISO 8601 (e.g. "2024-01-15T09:30:00").',
        });
      }
    } else {
      loginTime = new Date(); // default: now
    }

    const context = getPomodoroContext(loginTime);
    return res.json(context);
  } catch (err) {
    console.error('[pomodoro/login] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * GET /api/pomodoro/status
 *
 * Query params (optional):
 *   ?time=HH:MM   e.g. ?time=09:30
 *
 * Convenience endpoint — uses current server time or overridden HH:MM.
 */
router.get('/status', (req, res) => {
  try {
    let loginTime;

    if (req.query.time) {
      const [h, m] = req.query.time.split(':').map(Number);
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time format. Use HH:MM (e.g. ?time=09:30).',
        });
      }
      loginTime = new Date();
      loginTime.setHours(h, m, 0, 0);
    } else {
      loginTime = new Date();
    }

    const context = getPomodoroContext(loginTime);
    return res.json(context);
  } catch (err) {
    console.error('[pomodoro/status] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
