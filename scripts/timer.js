// --- Pomodoro Timer Logic ---
document.addEventListener('DOMContentLoaded', function() {
	// --- Pomodoro Backend Integration ---
	async function syncPomodoroFromBackend() {
		try {
			const response = await fetch('http://localhost:5000/api/pomodoro/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			const data = await response.json();
			// Set timer and mode from backend
			if (data && data.success) {
				isWorkMode = data.work_mode === 'work';
				timeLeft = data.current_pomodoro_time;
				updateDisplay();
				updateFreakAnimation(data);
				updateShiftProgressBar(data);
			}
		} catch (e) {
			console.error('Failed to sync pomodoro from backend:', e);
		}
	}
	// --- Shift Progress Bar ---
	function updateShiftProgressBar(data) {
		const bar = document.querySelector('.progression-bar');
		if (!bar || !data || !data.active || !data.shift_start || !data.shift_end || typeof data.elapsed_shift_minutes !== 'number') return;
		// Calculate total shift minutes
		const [startH, startM] = data.shift_start.split(':').map(Number);
		const [endH, endM] = data.shift_end.split(':').map(Number);
		const totalShiftMinutes = (endH * 60 + endM) - (startH * 60 + startM);
		const progress = Math.max(0, Math.min(1, data.elapsed_shift_minutes / totalShiftMinutes));
		bar.style.width = (progress * 100) + '%';
	}

	// --- Freak Animation Integration ---
	function updateFreakAnimation(data) {
		const freakWalk = document.querySelector('.freak-hide');
		const freakRun = document.querySelector('.freak-run');
		const freakCrawl = document.querySelector('.freak-crawl');
		const freakRelax = document.querySelector('.freak-relax');
		// Hide all
		if (freakWalk) freakWalk.style.display = 'none';
		if (freakRun) freakRun.style.display = 'none';
		if (freakCrawl) freakCrawl.style.display = 'none';
		if (freakRelax) freakRelax.style.display = 'none';
		if (!data || !data.active || data.work_mode === 'off') {
			if (freakRelax) freakRelax.style.display = 'block';
		} else if (data.work_mode === 'break') {
			if (freakRelax) freakRelax.style.display = 'block';
		} else if (data.work_mode === 'work') {
			if (data.current_pomodoro_time <= 60 * 60) {
				if (freakWalk) freakWalk.style.display = 'block';
			} else {
				if (freakRun) freakRun.style.display = 'block';
			}
		}
	}
	// Timer settings (in seconds)
	const WORK_DURATION = 25 * 60; // 25 minutes
	const BREAK_DURATION = 5 * 60; // 5 minutes
	let timer = null;
	let timeLeft = WORK_DURATION;
	let isRunning = false;
	let isPaused = false;
	let isWorkMode = true;
	let cycleCount = 0;

	// DOM elements
	const timerText = document.getElementById('timer-text');
	const loopCountText = document.getElementById('timer-loop-count');
	const playPauseBtn = document.getElementById('timer-playpause');
	const playPauseIcon = document.getElementById('timer-playpause-icon');
	const stopBtn = document.getElementById('timer-restart');
	const stopIcon = document.getElementById('timer-restart-icon');
	const modeLabel = document.querySelector('.current-mode');
	const timerElement = document.getElementById('timer');
	const canvas = document.getElementById('timer-canvas');
	const ctx = canvas.getContext('2d');

	function getDuration() {
		return isWorkMode ? WORK_DURATION : BREAK_DURATION;
	}

	function updateDisplay() {
		const min = Math.floor(timeLeft / 60);
		const sec = timeLeft % 60;
		timerText.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
		modeLabel.textContent = isWorkMode ? 'Work' : 'Break';
		if (loopCountText) {
			let label = isWorkMode ? 'Focus' : 'Short Break';
			loopCountText.textContent = `#${cycleCount + 1} ${label}`;
		}
		drawProgress();
	}

	function drawProgress() {
		const radius = 100;
		const center = 110;
		const lineWidth = 12;
		const styles = getComputedStyle(timerElement);
		const timerColor = styles.getPropertyValue('--timer-color').trim();
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// Background circle
		ctx.beginPath();
		ctx.arc(center, center, radius, 0, 2 * Math.PI);
		ctx.strokeStyle = '#EFF2F8';
		ctx.lineWidth = lineWidth;
		ctx.stroke();

		// Simulate sharper box-shadow (less blurry, more like a line)
		ctx.save();
		ctx.globalAlpha = 0.7;
		ctx.filter = 'blur(2px)';
		ctx.beginPath();
		ctx.arc(center, center, radius + 6, 0, 2 * Math.PI);
		ctx.strokeStyle = '#CDCFD4';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.filter = 'none';
		ctx.restore();
		ctx.save();
		ctx.globalAlpha = 0.7;
		ctx.filter = 'blur(2px)';
		ctx.beginPath();
		ctx.arc(center, center, radius - 6, 0, 2 * Math.PI);
		ctx.strokeStyle = '#CDCFD4';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.filter = 'none';
		ctx.restore();

		// Progress arc
		const total = getDuration();
		const progress = 1 - (timeLeft / total);
		if (progress > 0) {
			ctx.beginPath();
			ctx.arc(center, center, radius, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * progress, false);
			ctx.globalAlpha = isPaused ? 0.5 : 1;
			ctx.strokeStyle = timerColor;
			ctx.lineWidth = lineWidth;
			ctx.lineCap = 'round';
			ctx.stroke();
			ctx.globalAlpha = 1;
		}
	}

	function startTimer() {
		if (isRunning) return;
		isRunning = true;
		isPaused = false;
		playPauseIcon.src = '../image/pause.svg';
		playPauseIcon.alt = 'Pause';
		stopIcon.src = '../image/stop.svg';
		stopIcon.alt = 'Stop';
		updateDisplay();
		timer = setInterval(() => {
			if (timeLeft > 0) {
				timeLeft--;
				updateDisplay();
			} else {
				clearInterval(timer);
				isRunning = false;
				playPauseIcon.src = '../image/play.svg';
				playPauseIcon.alt = 'Play';
				stopIcon.src = '../image/stop.svg';
				stopIcon.alt = 'Stop';
				// Switch mode
				if (isWorkMode) {
					isWorkMode = false;
					timeLeft = getDuration();
					updateDisplay();
					startTimer(); // auto-play break
				} else {
					isWorkMode = true;
					cycleCount++;
					if (cycleCount < 4) {
						timeLeft = getDuration();
						updateDisplay();
						startTimer(); // auto-play next work
					} else {
						// Finished 4 cycles, reset
						cycleCount = 0;
						timeLeft = WORK_DURATION;
						updateDisplay();
					}
				}
			}
		}, 1000);
	}

	function pauseTimer() {
		if (!isRunning) return;
		clearInterval(timer);
		isRunning = false;
		isPaused = true;
		playPauseIcon.src = '../image/play.svg';
		playPauseIcon.alt = 'Play';
		stopIcon.src = '../image/stop.svg';
		stopIcon.alt = 'Stop';
        updateDisplay();
	}

	function restartTimer() {
		clearInterval(timer);
		isRunning = false;
		isPaused = false;
		timerElement.classList.remove('default-timer-color', 'contrast-timer-color');
		timeLeft = getDuration();
		playPauseIcon.src = '../image/play.svg';
		playPauseIcon.alt = 'Play';
		stopIcon.alt = 'Stop';
		updateDisplay();
	}

	function stopTimer() {
		clearInterval(timer);
		isRunning = false;
		isPaused = false;
		timerElement.classList.remove('default-timer-color', 'contrast-timer-color');
		playPauseIcon.alt = 'Play';
		stopIcon.src = '../image/stop.svg';
		stopIcon.alt = 'Stop';
		cycleCount = 0;
	}

	playPauseBtn.addEventListener('click', function() {
		if (!isRunning && !isPaused) {
			startTimer();
		} else if (isRunning) {
			pauseTimer();
		} else if (isPaused) {
			startTimer();
		}
	});

	stopBtn.addEventListener('click', function() {
		stopTimer();
		isWorkMode = true;
		cycleCount = 0;
		timeLeft = WORK_DURATION;
		updateDisplay();
	});

	// Initial sync from backend
	syncPomodoroFromBackend();

	// Expose updateDisplay globally so settings can trigger redraw
	window.redrawTimer = updateDisplay;
	// Expose startTimer globally so it can be triggered from app.js
	window.startTimer = startTimer;

	// On timer end, re-sync from backend
	// Patch startTimer to re-sync after each segment
	const originalStartTimer = startTimer;
	startTimer = function() {
		originalStartTimer();
		// When timer ends, re-sync
		if (timer) {
			clearInterval(timer);
		}
		timer = setInterval(() => {
			if (timeLeft > 0) {
				timeLeft--;
				updateDisplay();
			} else {
				clearInterval(timer);
				isRunning = false;
				playPauseIcon.src = '../image/play.svg';
				playPauseIcon.alt = 'Play';
				stopIcon.src = '../image/stop.svg';
				stopIcon.alt = 'Stop';
				// Re-sync from backend
				syncPomodoroFromBackend();
			}
		}, 1000);
	};
});
