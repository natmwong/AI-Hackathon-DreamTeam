// Freak Animation Controller
document.addEventListener('DOMContentLoaded', async function() {
    const freakWalk = document.querySelector('.freak-hide');
    const freakRun = document.querySelector('.freak-run');
    const freakCrawl = document.querySelector('.freak-crawl');
    const freakRelax = document.querySelector('.freak-relax');

    // DEMO: Global variable to control animation
    window.freakAnimationMode = null; // Set to 'walk', 'run', 'crawl', 'relax' to override

    // Helper to set animation by name
    window.setFreakAnimation = function(mode) {
        window.freakAnimationMode = mode;
        updateFreakAnimation();
    };

    // Accepts optional params for progress and mode
    window.updateFreakAnimation = async function(progressPercent = null, workMode = null) {
        // Hide all animations first
        if (freakWalk) freakWalk.style.display = 'none';
        if (freakRun) freakRun.style.display = 'none';
        if (freakCrawl) freakCrawl.style.display = 'none';
        if (freakRelax) freakRelax.style.display = 'none';

        // DEMO: If freakAnimationMode is set, use it
        if (window.freakAnimationMode) {
            switch (window.freakAnimationMode) {
                case 'walk': if (freakWalk) freakWalk.style.display = 'block'; break;
                case 'run': if (freakRun) freakRun.style.display = 'block'; break;
                case 'crawl': if (freakCrawl) freakCrawl.style.display = 'block'; break;
                case 'relax': if (freakRelax) freakRelax.style.display = 'block'; break;
            }
            return;
        }

        // If progressPercent and workMode are provided, use them for animation logic
        if (progressPercent !== null && workMode !== null) {
            if (workMode === 'break') {
                if (freakRelax) freakRelax.style.display = 'block';
                return;
            }
            if (progressPercent >= 90) {
                if (freakWalk) freakWalk.style.display = 'block';
            } else {
                if (freakRun) freakRun.style.display = 'block';
            }
            return;
        }

        // Otherwise, use backend logic
        try {
            const response = await fetch('http://localhost:5000/api/pomodoro/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const data = await response.json();

            // Determine which animation to show
            if (!data.active || data.work_mode === 'off') {
                // Work day is complete → Show rest
                if (freakRelax) freakRelax.style.display = 'block';
            } else if (data.work_mode === 'break') {
                // In break → Show rest
                if (freakRelax) freakRelax.style.display = 'block';
            } else if (data.work_mode === 'work') {
                // In work mode
                // Check if it's the last hour (less than 60 minutes left in work session)
                if (data.current_pomodoro_time !== null && data.current_pomodoro_time < 60) {
                    // Last hour of work → Show walk
                    if (freakWalk) freakWalk.style.display = 'block';
                } else {
                    // Regular work mode → Show run
                    if (freakRun) freakRun.style.display = 'block';
                }
            }

            console.log('Freak animation updated:', data);
        } catch (error) {
            console.error('Error fetching pomodoro data:', error);
            // Default to running if API fails
            if (freakRun) freakRun.style.display = 'block';
        }
    }

    // Update animation on load
    await window.updateFreakAnimation();

    // Optional: Update animation periodically (every minute)
    setInterval(window.updateFreakAnimation, 60000);
});
