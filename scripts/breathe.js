// --- Breathe Modal Logic ---
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to the nav-app button for Breathe (assume it's the 2nd nav-app for now)
    const navApps = document.querySelectorAll('.nav-app');
    // If you want a specific nav-app, add an id or class and use that selector instead
    const breatheBtn = navApps[2]; // Change index if needed

    let breatheModalLoaded = false;
    let breatheModal;

    breatheBtn.addEventListener('click', () => {
        if (!breatheModalLoaded) {
            fetch('breathe-modal.html')
                .then(res => res.text())
                .then(html => {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    document.body.appendChild(temp.firstElementChild);
                    setupBreatheModalRefs();
                    showBreatheModal();
                    breatheModalLoaded = true;
                });
        } else {
            showBreatheModal();
        }
    });


    let breatheInterval = null;
    function setupBreatheModalRefs() {
        breatheModal = document.getElementById('breatheModal');
        const closeBtn = document.getElementById('closeBreatheModal');
        closeBtn.addEventListener('click', closeBreatheModal);
        breatheModal.addEventListener('click', (e) => {
            if (e.target === breatheModal) closeBreatheModal();
        });
    }


    function showBreatheModal() {
        breatheModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        startBreatheAnimation();
    }
    function closeBreatheModal() {
        breatheModal.style.display = 'none';
        document.body.style.overflow = '';
        if (breatheInterval) {
            clearInterval(breatheInterval);
            breatheInterval = null;
        }
    }

    // Breathe animation logic
    function startBreatheAnimation() {
        const label = document.getElementById('breatheLabel');
        const countdown = document.getElementById('breatheCountdown');
        let phase = 0; // 0: Inhale, 1: Hold, 2: Exhale, 3: Hold
        let time = 4;
        if (breatheInterval) {
            clearInterval(breatheInterval);
            breatheInterval = null;
        }
        function nextPhase() {
            if (phase === 0) { label.textContent = 'Inhale'; time = 4; }
            else if (phase === 1) { label.textContent = 'Hold'; time = 4; }
            else if (phase === 2) { label.textContent = 'Exhale'; time = 4; }
            else if (phase === 3) { label.textContent = 'Hold'; time = 4; }
            countdown.textContent = time;
        }
        function tick() {
            time--;
            if (time > 0) {
                countdown.textContent = time;
            } else {
                phase = (phase + 1) % 4;
                nextPhase();
            }
        }
        nextPhase();
        breatheInterval = setInterval(tick, 1000);
    }
});
