// Freak Animation Controller
document.addEventListener('DOMContentLoaded', async function() {
    const freakWalk = document.querySelector('.freak-hide');
    const freakRun = document.querySelector('.freak-run');
    const freakCrawl = document.querySelector('.freak-crawl');
    const freakRelax = document.querySelector('.freak-relax');

    async function updateFreakAnimation() {
        try {
            const response = await fetch('http://localhost:5000/api/pomodoro/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const data = await response.json();

            // Hide all animations first
            if (freakWalk) freakWalk.style.display = 'none';
            if (freakRun) freakRun.style.display = 'none';
            if (freakCrawl) freakCrawl.style.display = 'none';
            if (freakRelax) freakRelax.style.display = 'none';

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
    await updateFreakAnimation();

    // Optional: Update animation periodically (every minute)
    setInterval(updateFreakAnimation, 60000);
});
