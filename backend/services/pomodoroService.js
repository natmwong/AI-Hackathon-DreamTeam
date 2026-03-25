/**
 * Pomodoro Timer Logic
 *
 * Work Schedule:
 *   Morning shift: 08:00 – 12:00
 *   Afternoon shift: 13:00 – 17:00
 *
 * Pomodoro cycle: 25 min work / 5 min break
 */

// ─── Constants ───────────────────────────────────────────────────────────────

// Original production values:
// const POMODORO_WORK_MINUTES = 1500;   // 25 min
// const POMODORO_BREAK_MINUTES = 300;   // 5 min
// const POMODORO_CYCLE_MINUTES = 1800;  // 30 min

// Testing values (in seconds for fast iteration):
const POMODORO_WORK_MINUTES = 10; // 10 seconds for testing
const POMODORO_BREAK_MINUTES = 3; // 3 seconds for testing
const POMODORO_CYCLE_MINUTES = POMODORO_WORK_MINUTES + POMODORO_BREAK_MINUTES; // 13 seconds

const SHIFTS = {
  morning: { start: { h: 8, m: 0 }, end: { h: 12, m: 0 }, label: 'morning' },
  afternoon: { start: { h: 13, m: 0 }, end: { h: 17, m: 0 }, label: 'afternoon' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert { h, m } to total minutes since midnight */
const toMinutes = ({ h, m }) => h * 60 + m;

/** Convert total minutes since midnight to "HH:MM" string */
const toTimeString = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Format minutes as "Xh Ym" or just "Ym" */
const formatDuration = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

/**
 * Given elapsed minutes into a shift, calculate where we are in the pomodoro cycle.
 * Returns:
 *   - work_mode: 'work' | 'break'
 *   - current_pomodoro_time: seconds remaining in current pomodoro segment
 *   - pomodoros_completed: how many full cycles done this shift
 */
const getPomodoroState = (elapsedMinutes) => {
  const positionInCycle = elapsedMinutes % POMODORO_CYCLE_MINUTES;

  if (positionInCycle < POMODORO_WORK_MINUTES) {
    // In work segment
    const remainingWork = POMODORO_WORK_MINUTES - positionInCycle;
    return {
      work_mode: 'work',
      current_pomodoro_time: remainingWork * 60, // in seconds
      pomodoros_completed: Math.floor(elapsedMinutes / POMODORO_CYCLE_MINUTES),
      segment_elapsed_minutes: positionInCycle,
    };
  } else {
    // In break segment
    const breakElapsed = positionInCycle - POMODORO_WORK_MINUTES;
    const remainingBreak = POMODORO_BREAK_MINUTES - breakElapsed;
    return {
      work_mode: 'break',
      current_pomodoro_time: remainingBreak * 60, // in seconds
      pomodoros_completed: Math.floor(elapsedMinutes / POMODORO_CYCLE_MINUTES) + 1,
      segment_elapsed_minutes: breakElapsed,
    };
  }
};

// ─── Core Login-Time Logic ────────────────────────────────────────────────────

/**
 * Main function: given a login datetime, calculate the pomodoro context.
 *
 * @param {Date} loginTime - The moment the user logs in (defaults to now)
 * @returns {Object} Pomodoro context object
 */
const getPomodoroContext = (loginTime = new Date()) => {
  const loginHour = loginTime.getHours();
  const loginMinute = loginTime.getMinutes();
  const loginTotalMinutes = loginHour * 60 + loginMinute;

  const morningStart = toMinutes(SHIFTS.morning.start); // 480
  const morningEnd = toMinutes(SHIFTS.morning.end);     // 720
  const afternoonStart = toMinutes(SHIFTS.afternoon.start); // 780
  const afternoonEnd = toMinutes(SHIFTS.afternoon.end);     // 1020

  // ── Determine which shift the user is in (or next shift) ──
  let shift_start, shift_end, message, elapsedMinutes, nextShiftStart;

  if (loginTotalMinutes < morningStart) {
    // Before 8am → full day starts at 8am
    return buildNextShiftResponse({
      message: 'Workday has not started yet. Come back at 08:00 for a full day.',
      next_shift_start: toTimeString(morningStart),
      shift_end: toTimeString(afternoonEnd),
      login_time: loginTime.toISOString(),
    });
  }

  if (loginTotalMinutes >= morningStart && loginTotalMinutes < morningEnd) {
    // ── Between 08:00 and 12:00 ──
    // User is mid-morning: work till noon break, continue 1–5pm
    shift_start = toTimeString(morningStart);
    shift_end = toTimeString(morningEnd);
    elapsedMinutes = loginTotalMinutes - morningStart;
    message = 'Good morning! Working until noon break. Afternoon shift resumes at 13:00.';

  } else if (loginTotalMinutes >= morningEnd && loginTotalMinutes < afternoonStart) {
    // ── Between 12:00 and 13:00 (lunch break) ──
    return buildNextShiftResponse({
      message: 'Lunch break in progress. Afternoon shift starts at 13:00.',
      next_shift_start: toTimeString(afternoonStart),
      shift_end: toTimeString(afternoonEnd),
      login_time: loginTime.toISOString(),
    });

  } else if (loginTotalMinutes >= afternoonStart && loginTotalMinutes < afternoonEnd) {
    // ── Between 13:00 and 17:00 ──
    shift_start = toTimeString(afternoonStart);
    shift_end = toTimeString(afternoonEnd);
    elapsedMinutes = loginTotalMinutes - afternoonStart;
    message = 'Good afternoon! Working until 17:00. Next session starts at 08:00 tomorrow.';

  } else {
    // ── After 17:00 ──
    return buildNextShiftResponse({
      message: 'Workday complete. Come back at 08:00 tomorrow.',
      next_shift_start: '08:00 (tomorrow)',
      shift_end: toTimeString(afternoonEnd),
      login_time: loginTime.toISOString(),
    });
  }

  // ── Calculate pomodoro state ──
  const pomState = getPomodoroState(elapsedMinutes);

  return {
    success: true,
    active: true,
    message,
    work_mode: pomState.work_mode,
    current_pomodoro_time: pomState.current_pomodoro_time,
    current_pomodoro_time_formatted: formatDuration(Math.ceil(pomState.current_pomodoro_time / 60)),
    pomodoros_completed_this_shift: pomState.pomodoros_completed,
    shift_start,
    shift_end,
    elapsed_shift_minutes: elapsedMinutes,
    login_time: loginTime.toISOString(),
    pomodoro_config: {
      work_minutes: POMODORO_WORK_MINUTES,
      break_minutes: POMODORO_BREAK_MINUTES,
      cycle_minutes: POMODORO_CYCLE_MINUTES,
    },
  };
};

/** Helper for responses where the user is outside an active shift */
const buildNextShiftResponse = ({ message, next_shift_start, shift_end, login_time }) => ({
  success: true,
  active: false,
  message,
  work_mode: 'off',
  current_pomodoro_time: 0,
  current_pomodoro_time_formatted: '0m',
  pomodoros_completed_this_shift: 0,
  shift_start: null,
  shift_end,
  next_shift_start,
  login_time,
  pomodoro_config: {
    work_minutes: POMODORO_WORK_MINUTES,
    break_minutes: POMODORO_BREAK_MINUTES,
    cycle_minutes: POMODORO_CYCLE_MINUTES,
  },
});

module.exports = { getPomodoroContext, getPomodoroState, toTimeString, formatDuration };