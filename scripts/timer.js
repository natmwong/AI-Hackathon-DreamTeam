// --- Pomodoro Timer Logic ---
document.addEventListener('DOMContentLoaded', function() {
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
		playPauseIcon.src = 'image/pause.svg';
		playPauseIcon.alt = 'Pause';
		stopIcon.src = 'image/stop.svg';
		stopIcon.alt = 'Stop';
		updateDisplay();
		timer = setInterval(() => {
			if (timeLeft > 0) {
				timeLeft--;
				updateDisplay();
			} else {
				clearInterval(timer);
				isRunning = false;
				playPauseIcon.src = 'image/play.svg';
				playPauseIcon.alt = 'Play';
				stopIcon.src = 'image/stop.svg';
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
		playPauseIcon.src = 'image/play.svg';
		playPauseIcon.alt = 'Play';
		stopIcon.src = 'image/stop.svg';
		stopIcon.alt = 'Stop';
        updateDisplay();
	}

	function restartTimer() {
		clearInterval(timer);
		isRunning = false;
		isPaused = false;
		timerElement.classList.remove('default-timer-color', 'contrast-timer-color');
		timeLeft = getDuration();
		playPauseIcon.src = 'image/play.svg';
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
		stopIcon.src = 'image/stop.svg';
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

	// Initial display
	updateDisplay();

	// Expose updateDisplay globally so settings can trigger redraw
	window.redrawTimer = updateDisplay;
});
