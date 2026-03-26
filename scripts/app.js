document.addEventListener('DOMContentLoaded', function () {
    // --- Reusable UI Components ---
    // Create a task <li> element with checkbox, editable span, and listeners
    function createTaskElement(task, idx, onEdit, onToggle) {
        const li = document.createElement('li');
        li.className = 'task';
        if (task.completed) {
            li.classList.add('completed');
        }
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} />
            <span class="task-title" tabindex="0">${escapeHTML(task.title)}</span>
        `;
        // Checkbox logic
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            if (onToggle) onToggle(checkbox.checked);
        });
        // Enable editing on click
        const span = li.querySelector('.task-title');
        span.addEventListener('click', () => makeEditable(span, task, idx, onEdit));
        span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') e.preventDefault();
        });
        return li;
    }

    // Make task title editable
    function makeEditable(span, task, idx, onEdit) {
        if (span.isContentEditable) return;
        span.contentEditable = 'true';
        span.focus();
        document.execCommand('selectAll', false, null);
        function finishEdit(e) {
            if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
                span.contentEditable = 'false';
                span.removeEventListener('blur', finishEdit);
                span.removeEventListener('keydown', finishEdit);
                task.title = span.textContent.trim();
                if (onEdit) onEdit(idx, task.title);
            }
        }
        span.addEventListener('blur', finishEdit);
        span.addEventListener('keydown', finishEdit);
    }

    // Create an event card div with editable fields, delete button, and listeners
    function createEventCard(event, onEdit, onDelete) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <button class="event-delete-btn">
                <img src="../image/close.svg" alt="Delete">
            </button>
            <div class="event-card-type">${escapeHTML(event.type || 'Upcoming')}</div>
            <div class="event-card-title" contenteditable="true" spellcheck="false">${escapeHTML(event.name || event.title || '')}</div>
            <div class="event-card-time" contenteditable="true" spellcheck="false">${escapeHTML(event.time || '')}</div>
            <button class="event-card-check" style="display: none;">
                <img src="../image/check.svg" alt="Save">
            </button>
        `;
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
            if (onEdit) onEdit(titleField.textContent.trim(), timeField.textContent.trim());
        });
        // Delete button functionality
        const deleteBtn = card.querySelector('.event-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                showConfirmation('Are you sure you want to delete this event?', () => {
                    if (onDelete) onDelete();
                });
            });
        }
        return card;
    }

    // Show confirmation modal (reuses event.js logic)
    function showConfirmation(message, onConfirm) {
        const modal = document.getElementById('confirmationModal');
        const messageEl = document.getElementById('confirmationMessage');
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const header = modal.querySelector('.confirmation-header');
        // Special case: if message is for already clocked in or must clock out, show only OK button and hide header, and bold the message
        if (
            message === "You have already clocked in for the day." ||
            message === "You must clock out before clocking in again."
        ) {
            messageEl.innerHTML = `<b>${message}</b>`;
            if (header) header.style.display = 'none';
            confirmBtn.textContent = "OK";
            confirmBtn.style.display = "inline-block";
            cancelBtn.style.display = "none";
            const cleanup = () => {
                modal.classList.remove('active');
                confirmBtn.removeEventListener('click', handleOk);
                document.removeEventListener('keydown', handleEscape);
                if (header) header.style.display = '';
            };
            const handleOk = () => { cleanup(); };
            const handleEscape = (e) => { if (e.key === 'Escape') { cleanup(); } };
            confirmBtn.addEventListener('click', handleOk);
            document.addEventListener('keydown', handleEscape);
            modal.classList.add('active');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) { cleanup(); }
            }, { once: true });
        } else {
            messageEl.textContent = message;
            // Default: two buttons (confirm/cancel) and show header
            if (header) header.style.display = '';
            confirmBtn.textContent = "Delete";
            confirmBtn.style.display = "inline-block";
            cancelBtn.style.display = "inline-block";
            modal.classList.add('active');
            const handleConfirm = () => { cleanup(); onConfirm(); };
            const handleCancel = () => { cleanup(); };
            const cleanup = () => {
                modal.classList.remove('active');
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleEscape);
            };
            const handleEscape = (e) => { if (e.key === 'Escape') { handleCancel(); } };
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            document.addEventListener('keydown', handleEscape);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) { handleCancel(); }
            }, { once: true });
        }
    }
    const BASE_URL = "http://127.0.0.1:5000";
    const userId = "alice";

    // New selectors for current HTML structure
    const checkInBtn = document.querySelector(".check-in-btn");
    const checkOutBtn = document.querySelector(".check-out-btn");
    const flowaiModal = document.getElementById("flowaiModal");
    const flowaiMessages = document.getElementById("flowaiMessages");
    const askFlowInput = document.querySelector(".ask-flow-input");
    const askFlowBtn = document.getElementById("askFlowBtn");
    const flowaiInput = document.querySelector(".flowai-input");
    const flowaiSendBtn = document.querySelector(".flowai-send-btn");
    const flowaiArrowBtns = () => document.querySelectorAll(".flowai-arrow-btn");
    const flowaiCloseBtn = document.getElementById("flowaiCloseBtn");
    const taskList = document.querySelector(".task-list");
    const eventsCardsSelection = document.querySelector(".events-cards-selection");

    function showFlowaiModal(prompt) {
        if (flowaiModal) {
                flowaiModal.style.display = "flex";
                if (flowaiInput) flowaiInput.value = "";
                if (flowaiMessages) {
                    flowaiMessages.innerHTML = `<div class="flowai-msg flowai-msg-center">${prompt || "What do you want to accomplish today?"}</div>`;
                }
        }
    }

    // Helper to send message to Flow AI modal
    async function handleAskFlowSend() {
        const text = askFlowInput.value.trim();
        showFlowaiModal("Type a goal, event, or reflection");
        if (!text) return;
        if (flowaiMessages) {
            flowaiMessages.innerHTML = '';
            renderUserMessage(text);
        }
        askFlowInput.value = '';
        // Send to backend
        const res = await fetch(`${BASE_URL}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, text })
        });
        const data = await res.json();
        // Show AI response
        if (data.tasks || data.events) {
            renderAiMessage({ tasks: data.tasks, events: data.events });
        } else if (data.response) {
            renderAiMessage(data.response);
        } else if (data.error) {
            renderAiMessage(data.error);
        } else {
            renderAiMessage("Received response from backend.");
        }
        await loadTasks();
        await loadEvents();
        addFlowaiArrowBtn();
    }

    // Ask Flow send button click
    if (askFlowBtn && askFlowInput) {
        askFlowBtn.addEventListener('click', handleAskFlowSend);
        askFlowInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleAskFlowSend();
        });
    }


    // Helper to hide Flow AI modal
    function hideFlowaiModal() {
        if (flowaiModal) flowaiModal.style.display = "none";
    }

    // Render user's message in Flow AI modal
    function renderUserMessage(text) {
        if (!flowaiMessages) return;
        const msg = document.createElement("div");
        msg.className = "flowai-msg flowai-msg-user";
        msg.textContent = text;
        flowaiMessages.appendChild(msg);
    }

    // Render AI's message in Flow AI modal
    // Enhanced: Render AI's message, supporting tasks/events as interactive lists
    function renderAiMessage(data) {
        if (!flowaiMessages) return;
        const msg = document.createElement("div");
        msg.className = "flowai-msg flowai-msg-ai";
        // If data is a string, render as plain text
        if (typeof data === 'string') {
            msg.textContent = data;
        } else if (data && (data.tasks || data.events)) {
            // If data contains tasks/events, render them interactively
            if (data.tasks) {
                const ul = document.createElement('ul');
                ul.className = 'task-list';
                // Use unified renderTasks for modal
                renderTasks(data.tasks, ul,
                    (idx, newTitle) => { data.tasks[idx].title = newTitle; renderTasks(data.tasks, ul); },
                    (idx, checked) => { data.tasks[idx].completed = checked; renderTasks(data.tasks, ul); }
                );
                msg.appendChild(ul);
            }
            if (data.events) {
                const container = document.createElement('div');
                container.className = 'events-cards-selection';
                renderEvents(data.events, container,
                    (idx, newTitle, newTime) => {
                        data.events[idx].title = newTitle;
                        data.events[idx].time = newTime;
                        renderEvents(data.events, container);
                    },
                    (idx) => {
                        data.events.splice(idx, 1);
                        renderEvents(data.events, container);
                    }
                );
                msg.appendChild(container);
            }
        } else {
            msg.textContent = 'Received response from backend.';
        }
        flowaiMessages.appendChild(msg);
    }

    // Render tasks into .task-list
    function renderTasks(tasks, container = taskList, onEdit, onToggle) {
        if (!container) return;
        container.innerHTML = "";
        if (!tasks || tasks.length === 0) {
            const emptyMsg = document.createElement("li");
            emptyMsg.className = 'task-list-empty';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.color = '#b7bcc5';
            emptyMsg.style.fontSize = '16px';
            emptyMsg.style.padding = '32px 0 24px 0';
            emptyMsg.textContent = 'No tasks yet — Ready to get started?';
            container.appendChild(emptyMsg);
            return;
        }
        // Find the index of the first incomplete (not completed) task
        const firstIncompleteIdx = tasks.findIndex(t => !t.completed);
        tasks.forEach((task, idx) => {
            const li = document.createElement('li');
            li.className = 'task';
            if (task.completed) {
                li.classList.add('completed');
            } else if (idx !== firstIncompleteIdx) {
                li.classList.add('muted');
            }
            li.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} />
                <span class="task-title" tabindex="0">${escapeHTML(task.title)}</span>
            `;
            // Checkbox logic
            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                renderTasks(tasks, container, onEdit, onToggle);
                if (onToggle) onToggle(idx, checkbox.checked);
            });
            // Enable editing on click
            const span = li.querySelector('.task-title');
            span.addEventListener('click', () => makeEditable(span, task, idx, onEdit, tasks, container, onToggle));
            span.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
            container.appendChild(li);
        });
    }

    // Make task title editable
    function makeEditable(span, task, idx, onEdit, tasks, container, onToggle) {
        if (span.isContentEditable) return;
        span.contentEditable = 'true';
        span.focus();
        document.execCommand('selectAll', false, null);
        function finishEdit(e) {
            if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
                span.contentEditable = 'false';
                span.removeEventListener('blur', finishEdit);
                span.removeEventListener('keydown', finishEdit);
                task.title = span.textContent.trim();
                renderTasks(tasks, container, onEdit, onToggle);
                if (onEdit) onEdit(idx, task.title);
            }
        }
        span.addEventListener('blur', finishEdit);
        span.addEventListener('keydown', finishEdit);
    }

    // Render events into .events-cards-selection
    function renderEvents(events, container = eventsCardsSelection, onEdit, onDelete) {
        if (!container) return;
        container.innerHTML = "";
        if (!events || events.length === 0) {
            container.innerHTML = '<div class="event-card">No events yet.</div>';
            return;
        }
        events.forEach((event, idx) => {
            const card = createEventCard(event,
                (newTitle, newTime) => { if (onEdit) onEdit(idx, newTitle, newTime); },
                () => { if (onDelete) onDelete(idx); }
            );
            container.appendChild(card);
        });
    }

    // Escape HTML to prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(tag) {
            const chars = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'};
            return chars[tag] || tag;
        });
    }

    // Load tasks from backend
    async function loadTasks() {
        const res = await fetch(`${BASE_URL}/tasks/${userId}`);
        const data = await res.json();
        renderTasks(data);
    }

    // Load events from backend
    async function loadEvents() {
        const res = await fetch(`${BASE_URL}/events/${userId}`);
        const data = await res.json();
        renderEvents(data);
    }

    // Check In logic
    async function handleCheckIn() {
        const res = await fetch(`${BASE_URL}/clock-in`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId })
        });
        const data = await res.json();
        if (data.already_clocked_in) {
            // Show the backend message, bolded, with only OK button and no header
            showConfirmation(data.message || "You have already clocked in for the day.", () => {});
            return;
        }
        barIsComplete = false; // Reset bar complete state on clock-in
        forceBreakAnimation = false; // Allow animation to change again
        showFlowaiModal(data.prompt || "What would you like to accomplish today?");
        await loadTasks();
        await loadEvents();
        // Start timer and animation on clock-in
        startProgressBar(totalDuration);
        if (window.updateFreakAnimation) {
            window.updateFreakAnimation(0, getWorkMode());
        }
        // Start the Pomodoro timer automatically
        if (window.startTimer) {
            window.startTimer();
        }
    }

    // Check Out logic
    async function handleCheckOut() {
        // POST to backend for clock-out
        const res = await fetch(`${BASE_URL}/clock-out`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId })
        });
        let data;
        try {
            data = await res.json();
        } catch (e) {
            data = {};
        }
        stopProgressBar = true; // Stop the progress bar
        forceBreakAnimation = true; // Lock animation to break
        if (window.updateFreakAnimation) {
            window.updateFreakAnimation(100, 'break'); // Set animation to relax
        }
        showFlowaiModal("What did you accomplish today? Tell me 3 achievements from today separated by semicolons.");
    }

    // Send message to backend and handle response
    async function handleSendMessage() {
        const text = flowaiInput.value.trim();
        if (!text) return;
        renderUserMessage(text);
        flowaiInput.value = "";
        const res = await fetch(`${BASE_URL}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, text })
        });
        const data = await res.json();
        // If backend returns structured tasks/events, pass as object
        if (data.tasks || data.events) {
            renderAiMessage({ tasks: data.tasks, events: data.events });
        } else if (data.response) {
            renderAiMessage(data.response);
        } else if (data.error) {
            renderAiMessage(data.error);
        } else {
            renderAiMessage("Received response from backend.");
        }
        await loadTasks();
        await loadEvents();
        // Add arrow button for closing modal after response
        addFlowaiArrowBtn();
    }

    // Add arrow button to close modal
    function addFlowaiArrowBtn() {
        // Only add if not already present
        if (!flowaiMessages.querySelector('.flowai-arrow-btn')) {
            const actions = document.createElement('div');
            actions.className = 'flowai-msg-actions';
            actions.innerHTML = `<button class=\"flowai-arrow-btn\" title=\"Details\"><img src=\"../image/arrow_forward.svg\" alt=\"Details\" /></button>`;
            flowaiMessages.appendChild(actions);
            actions.querySelector('.flowai-arrow-btn').addEventListener('click', hideFlowaiModal);
        }
    }

    // Event listeners
    if (checkInBtn) checkInBtn.addEventListener("click", handleCheckIn);
    if (checkOutBtn) checkOutBtn.addEventListener("click", handleCheckOut);
    if (flowaiSendBtn) flowaiSendBtn.addEventListener("click", handleSendMessage);
    if (flowaiInput) flowaiInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") handleSendMessage();
    });
    if (flowaiCloseBtn) flowaiCloseBtn.addEventListener("click", hideFlowaiModal);

    // On page load, load tasks and events
    (async () => {
        await loadTasks();
        await loadEvents();
    })();

    // Set the total duration in seconds (e.g., 10 minutes = 600 seconds)
    const totalDuration = 5 * 60; // 5 minutes

    // Get the progression bar element
    const progressionBar = document.querySelector('.progression-bar');


    // Helper to get work mode
    function getWorkMode() {
        // Try to get from timer label, fallback to 'work'
        const modeLabel = document.querySelector('.current-mode');
        if (modeLabel && modeLabel.textContent.toLowerCase().includes('break')) return 'break';
        return 'work';
    }

    let barIsComplete = false;
    let stopProgressBar = false;
    let forceBreakAnimation = false;
    function startProgressBar(durationSeconds) {
        let startTime = Date.now();
        barIsComplete = false;
        stopProgressBar = false;
        function update() {
            if (stopProgressBar) return;
            const elapsed = (Date.now() - startTime) / 1000;
            const percent = Math.min((elapsed / durationSeconds) * 100, 100);
            progressionBar.style.width = percent + '%';
            if (window.updateFreakAnimation) {
                if (forceBreakAnimation) {
                    window.updateFreakAnimation(100, 'break');
                } else if (percent >= 100) {
                    barIsComplete = true;
                    window.updateFreakAnimation(100, 'break'); // Stay in break mode
                } else {
                    window.updateFreakAnimation(percent, getWorkMode());
                }
            }
            if (percent < 100) {
                requestAnimationFrame(update);
            }
        }
        update();
    }

    // Keep freak in break mode after bar is full or after clock out
    setInterval(() => {
        if ((barIsComplete || forceBreakAnimation) && window.updateFreakAnimation) {
            window.updateFreakAnimation(100, 'break');
        }
    }, 1000);

    startProgressBar(totalDuration);
});

// function renderTasks(tasks) {
//     taskList.innerHTML = "";

//     if (!tasks || tasks.length === 0) {
//         taskList.innerHTML = "<p>No tasks yet.</p>";
//         return;
//     }

//     tasks.forEach(task => {
//         const div = document.createElement("div");
//         div.textContent = typeof task === "string" ? task : task.title;
//         taskList.appendChild(div);
//     });
// }

// function renderEvents(events) {
//     eventList.innerHTML = "";

//     if (!events || events.length === 0) {
//         eventList.innerHTML = "<p>No events yet.</p>";
//         return;
//     }

//     events.forEach(event => {
//         const div = document.createElement("div");
//         div.textContent = `${event.name} - ${event.time} - ${event.location}`;
//         eventList.appendChild(div);
//     });
// }

// async function loadTasks() {
//     const res = await fetch(`${BASE_URL}/tasks/${userId}`);
//     const data = await res.json();
//     renderTasks(data);
// }

// async function loadEvents() {
//     const res = await fetch(`${BASE_URL}/events/${userId}`);
//     const data = await res.json();
//     renderEvents(data);
// }

// async function clockIn() {
//     const res = await fetch(`${BASE_URL}/clock-in`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({ user_id: userId })
//     });

//     const data = await res.json();
//     showResponse(data.prompt || data.message || "Clocked in.");

//     await loadTasks();
//     await loadEvents();
// }

// async function clockOut() {
//     const res = await fetch(`${BASE_URL}/clock-out`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({ user_id: userId })
//     });

//     const data = await res.json();
//     showResponse(data.prompt || data.message || "Clocked out.");
// }

// async function sendMessage() {
//     const text = messageInput.value.trim();

//     if (!text) {
//         showResponse("Please type something first.");
//         return;
//     }

//     const res = await fetch(`${BASE_URL}/message`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             user_id: userId,
//             text: text
//         })
//     });

//     const data = await res.json();

//     if (data.response) {
//         showResponse(data.response);
//     } else if (data.error) {
//         showResponse(data.error);
//     } else {
//         showResponse("Received response from backend.");
//     }

//     messageInput.value = "";

//     await loadTasks();
//     await loadEvents();
// }

// clockInBtn.addEventListener("click", clockIn);
// clockOutBtn.addEventListener("click", clockOut);
// sendBtn.addEventListener("click", sendMessage);

// window.addEventListener("load", async () => {
//     await loadTasks();
//     await loadEvents();
// });