const BASE_URL = "http://127.0.0.1:5000";
const userId = "alice";

const clockInBtn = document.getElementById("clockInBtn");
const clockOutBtn = document.getElementById("clockOutBtn");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");

const responseBox = document.getElementById("responseBox");
const taskList = document.getElementById("taskList");
const eventList = document.getElementById("eventList");

function showResponse(text) {
    responseBox.textContent = text;
}

function renderTasks(tasks) {
    taskList.innerHTML = "";

    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = "<p>No tasks yet.</p>";
        return;
    }

    tasks.forEach(task => {
        const div = document.createElement("div");
        div.textContent = typeof task === "string" ? task : task.title;
        taskList.appendChild(div);
    });
}

function renderEvents(events) {
    eventList.innerHTML = "";

    if (!events || events.length === 0) {
        eventList.innerHTML = "<p>No events yet.</p>";
        return;
    }

    events.forEach(event => {
        const div = document.createElement("div");
        div.textContent = `${event.name} - ${event.time} - ${event.location}`;
        eventList.appendChild(div);
    });
}

async function loadTasks() {
    const res = await fetch(`${BASE_URL}/tasks/${userId}`);
    const data = await res.json();
    renderTasks(data);
}

async function loadEvents() {
    const res = await fetch(`${BASE_URL}/events/${userId}`);
    const data = await res.json();
    renderEvents(data);
}

async function clockIn() {
    const res = await fetch(`${BASE_URL}/clock-in`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId })
    });

    const data = await res.json();
    showResponse(data.prompt || data.message || "Clocked in.");

    await loadTasks();
    await loadEvents();
}

async function clockOut() {
    const res = await fetch(`${BASE_URL}/clock-out`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId })
    });

    const data = await res.json();
    showResponse(data.prompt || data.message || "Clocked out.");
}

async function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) {
        showResponse("Please type something first.");
        return;
    }

    const res = await fetch(`${BASE_URL}/message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: userId,
            text: text
        })
    });

    const data = await res.json();

    if (data.response) {
        showResponse(data.response);
    } else if (data.error) {
        showResponse(data.error);
    } else {
        showResponse("Received response from backend.");
    }

    messageInput.value = "";

    await loadTasks();
    await loadEvents();
}

clockInBtn.addEventListener("click", clockIn);
clockOutBtn.addEventListener("click", clockOut);
sendBtn.addEventListener("click", sendMessage);

window.addEventListener("load", async () => {
    await loadTasks();
    await loadEvents();
});