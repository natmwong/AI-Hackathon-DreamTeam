// Event listener for add event button
document.addEventListener('DOMContentLoaded', () => {
    const addEventBtn = document.querySelector('.events-add-btn');
    
    if (addEventBtn) {
        addEventBtn.addEventListener('click', handleAddEvent);
    }
    
    // Setup settings modal
    setupSettingsModal();
    
    // Add listeners to existing cards
    setupCardListeners();
});

function handleAddEvent(event) {
    event.preventDefault();
    addEvent('Title...', '00:00 pm');
}

function addEvent(name, time) {
    const eventCard = document.createElement('div');
    eventCard.className = 'event-card new-event';
    eventCard.innerHTML = `
        <button class="event-delete-btn">
            <img src="image/close.svg" alt="Delete">
        </button>
        <div class="event-card-type">Upcoming</div>
        <div class="event-card-title" contenteditable="true" spellcheck="false"></div>
        <div class="event-card-time" contenteditable="true" spellcheck="false"></div>
        <button class="event-card-check" style="display: none;">
            <img src="image/check.svg" alt="Save">
        </button>
    `;
    
    const eventsCardsSelection = document.querySelector('.events-cards-selection');
    const firstEventCard = eventsCardsSelection.querySelector('.event-card');
    if (firstEventCard) {
        eventsCardsSelection.insertBefore(eventCard, firstEventCard);
    } else {
        eventsCardsSelection.appendChild(eventCard);
    }
    
    setupCardListeners();
    const titleField = eventCard.querySelector('.event-card-title');
    titleField.focus();
}

function setupCardListeners() {
    const cards = document.querySelectorAll('.event-card');
    
    cards.forEach(card => {
        const titleField = card.querySelector('.event-card-title');
        const timeField = card.querySelector('.event-card-time');
        const checkBtn = card.querySelector('.event-card-check');
        
        // Store original values
        let originalTitle = titleField.textContent;
        let originalTime = timeField.textContent;
        
        titleField.addEventListener('focus', () => {
            originalTitle = titleField.textContent;
            checkBtn.style.display = 'block';
        });
        
        timeField.addEventListener('focus', () => {
            originalTime = timeField.textContent;
            checkBtn.style.display = 'block';
        });
        
        titleField.addEventListener('blur', (e) => {
            // Don't revert if check button was clicked
            if (e.relatedTarget !== checkBtn) {
                titleField.textContent = originalTitle;
            }
            if (!document.activeElement.classList.contains('event-card-title') &&
                !document.activeElement.classList.contains('event-card-time') &&
                document.activeElement !== checkBtn) {
                checkBtn.style.display = 'none';
            }
        });
        
        timeField.addEventListener('blur', (e) => {
            if (e.relatedTarget !== checkBtn) {
                timeField.textContent = originalTime;
            }
            if (!document.activeElement.classList.contains('event-card-title') &&
                !document.activeElement.classList.contains('event-card-time') &&
                document.activeElement !== checkBtn) {
                checkBtn.style.display = 'none';
            }
        });

        const MAX_TITLE_LENGTH = 50;

        titleField.addEventListener('input', (e) => {
            if (titleField.textContent.length > MAX_TITLE_LENGTH) {
                titleField.textContent = titleField.textContent.substring(0, MAX_TITLE_LENGTH);
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(titleField);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
        
        checkBtn.addEventListener('click', () => {
            checkBtn.style.display = 'none';
            titleField.blur();
            timeField.blur();
        });

        // Delete button functionality
        const deleteBtn = card.querySelector('.event-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                showConfirmation('Are you sure you want to delete this event?', () => {
                    card.remove();
                });
            });
        }
    });
}

function showConfirmation(message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const messageEl = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    messageEl.textContent = message;
    modal.classList.add('active');
    
    const handleConfirm = () => {
        cleanup();
        onConfirm();
    };
    
    const handleCancel = () => {
        cleanup();
    };
    
    const cleanup = () => {
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        document.removeEventListener('keydown', handleEscape);
    };
    
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleEscape);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            handleCancel();
        }
    }, { once: true });
}

function setupSettingsModal() {
    const settingsIcon = document.querySelector('.setting-app');
    const settingsModal = document.getElementById('settingsModal');
    const settingsCloseBtn = document.getElementById('settingsCloseBtn');
    const settingsCancelBtn = document.getElementById('settingsCancelBtn');
    const settingsSaveBtn = document.querySelector('.settings-save');
    const contrastModeToggle = document.getElementById('contrastModeToggle');
    
    // Elements that need theme switching
    const modeElement = document.getElementById('mode');
    const progressBar = document.querySelector('.progression-bar');
    const timerElement = document.getElementById('timer');
    
    // Function to switch theme classes
    const switchTheme = (isContrast) => {
        if (modeElement) {
            modeElement.classList.toggle('default-mode-color', !isContrast);
            modeElement.classList.toggle('contrast-mode-color', isContrast);
        }
        if (progressBar) {
            progressBar.classList.toggle('default-progress-color', !isContrast);
            progressBar.classList.toggle('contrast-progress-color', isContrast);
        }
        if (timerElement) {
            timerElement.classList.toggle('default-timer-color', !isContrast);
            timerElement.classList.toggle('contrast-timer-color', isContrast);
        }
        // Redraw timer canvas with new color
        if (window.redrawTimer) {
            window.redrawTimer();
        }
    };
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'default';
    const isContrast = savedTheme === 'contrast';
    if (contrastModeToggle) contrastModeToggle.checked = isContrast;
    switchTheme(isContrast);
    
    // Open settings modal
    if (settingsIcon) {
        settingsIcon.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }
    
    // Close settings modal functions
    const closeSettingsModal = () => {
        settingsModal.classList.remove('active');
    };
    
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', closeSettingsModal);
    }
    
    if (settingsCancelBtn) {
        settingsCancelBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Handle contrast mode toggle
    if (contrastModeToggle) {
        contrastModeToggle.addEventListener('change', () => {
            switchTheme(contrastModeToggle.checked);
        });
    }
    
    // Save settings
    if (settingsSaveBtn) {
        settingsSaveBtn.addEventListener('click', () => {
            // Save theme preference
            const theme = contrastModeToggle?.checked ? 'contrast' : 'default';
            localStorage.setItem('theme', theme);
            // Here you can add logic to save other settings
            console.log('Settings saved! Theme:', theme);
            closeSettingsModal();
        });
    }
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal.classList.contains('active')) {
            closeSettingsModal();
        }
    });
    
    // Close when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });
}