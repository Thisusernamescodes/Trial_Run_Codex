// Task list loaded from localStorage or created by user
let tasks = [];
let currentTaskIndex = 0; // index of active task
let timerInterval = null; // reference to setInterval
let chart = null;         // Chart.js instance
let isPaused = false;     // global pause state

// Load timing data and tasks from localStorage
function loadData() {
    const saved = JSON.parse(localStorage.getItem('timeData')) || { tasks: [], lastReset: new Date().toLocaleDateString() };
    const today = new Date().toLocaleDateString();
    tasks = saved.tasks;
    if (saved.lastReset !== today) {
        // new day -> reset accumulated time
        tasks.forEach(t => t.time = 0);
        saved.lastReset = today;
    }
    localStorage.setItem('timeData', JSON.stringify({ tasks, lastReset: saved.lastReset }));
}

// Persist tasks and timing info
function saveData() {
    localStorage.setItem('timeData', JSON.stringify({ tasks, lastReset: new Date().toLocaleDateString() }));
}

// Convert milliseconds to HH:MM:SS
function formatTime(ms) {
    const sec = Math.floor(ms / 1000);
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// Update task name, timer, and chart
function updateDisplay() {
    if (!tasks.length) return;
    const task = tasks[currentTaskIndex];
    document.getElementById('task-name').textContent = task.name;
    document.getElementById('timer').textContent = formatTime(task.time);
    updateChart();
}

// Start interval timer for active task
function startTimer() {
    if (!tasks.length || isPaused) return;
    stopTimer();
    let last = Date.now();
    timerInterval = setInterval(() => {
        const now = Date.now();
        const today = new Date().toLocaleDateString();
        const saved = JSON.parse(localStorage.getItem('timeData'));
        if (saved && saved.lastReset !== today) {
            tasks.forEach(t => (t.time = 0));
            last = now;
            saveData();
        } else {
            tasks[currentTaskIndex].time += now - last;
            last = now;
        }
        updateDisplay();
        saveData();
    }, 1000);
}

// Stop timing
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Toggle pause/resume
function togglePause() {
    if (isPaused) {
        isPaused = false;
        document.getElementById('pause').textContent = 'Pause';
        startTimer();
    } else {
        isPaused = true;
        document.getElementById('pause').textContent = 'Resume';
        stopTimer();
    }
}

// Reset all timers and chart
function refreshAll() {
    tasks.forEach(t => (t.time = 0));
    saveData();
    updateDisplay();
}

// Switch to previous task
function prevTask() {
    if (!tasks.length) return;
    currentTaskIndex = (currentTaskIndex - 1 + tasks.length) % tasks.length;
    updateDisplay();
    startTimer();
}

// Switch to next task
function nextTask() {
    if (!tasks.length) return;
    currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
    updateDisplay();
    startTimer();
}

// Create donut chart from tasks array
function updateChart() {
    if (!tasks.length) return;
    const ctx = document.getElementById('chart').getContext('2d');
    const data = tasks.map(t => t.time / 1000 / 60);
    const labels = tasks.map(t => t.name);
    const colors = tasks.map(t => t.color);
    if (!chart) {
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors }] },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
    } else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].backgroundColor = colors;
        chart.update();
    }
}

// Modal helpers
function showDialog() {
    document.getElementById('task-dialog').classList.remove('hidden');
}

function hideDialog() {
    document.getElementById('task-dialog').classList.add('hidden');
}

// Add task from modal inputs
function addTaskFromDialog() {
    const name = document.getElementById('task-name-input').value.trim();
    const color = document.getElementById('task-color-input').value;
    if (name && tasks.length < 6) {
        tasks.push({ name, color, time: 0 });
        if (tasks.length === 1) currentTaskIndex = 0; // first task
        saveData();
        hideDialog();
        updateDisplay();
        startTimer();
    }
}

// Attach DOM event listeners
function setupEvents() {
    document.getElementById('prev').addEventListener('click', prevTask);
    document.getElementById('next').addEventListener('click', nextTask);
    document.getElementById('pause').addEventListener('click', togglePause);
    document.getElementById('refresh').addEventListener('click', refreshAll);
    document.getElementById('addTask').addEventListener('click', showDialog);
    document.getElementById('task-save').addEventListener('click', addTaskFromDialog);
    document.getElementById('task-cancel').addEventListener('click', hideDialog);
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') prevTask();
        if (e.key === 'ArrowRight') nextTask();
    });
}

function init() {
    loadData();
    setupEvents();
    if (!tasks.length) {
        showDialog();
    } else {
        updateDisplay();
        startTimer();
    }
}


window.addEventListener('load', init);
