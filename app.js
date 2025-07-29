/* List of predefined tasks */
const tasks = [
    { name: 'Plan', time: 0 },
    { name: 'Commute', time: 0 },
    { name: 'Gaming', time: 0 }
];

let currentTaskIndex = 0;      // index of the active task
let timerInterval = null;      // reference to setInterval
let chart = null;              // Chart.js instance

/* Load saved data from LocalStorage */
function loadData() {
    const saved = JSON.parse(localStorage.getItem('timeData'));
    if (saved && saved.tasks && saved.lastReset) {
        const today = new Date().toLocaleDateString();
        // If saved date isn't today, reset times
        if (saved.lastReset !== today) {
            saved.tasks.forEach(t => t.time = 0);
            saved.lastReset = today;
        }
        for (let i = 0; i < tasks.length; i++) {
            if (saved.tasks[i]) tasks[i].time = saved.tasks[i].time;
        }
    } else {
        saveData();
    }
}

/* Persist data to LocalStorage */
function saveData() {
    const payload = {
        tasks: tasks.map(t => ({ name: t.name, time: t.time })),
        lastReset: new Date().toLocaleDateString()
    };
    localStorage.setItem('timeData', JSON.stringify(payload));
}

/* Format milliseconds to HH:MM:SS */
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

/* Update DOM elements for the active task */
function updateDisplay() {
    const task = tasks[currentTaskIndex];
    document.getElementById('task-name').textContent = task.name;
    document.getElementById('timer').textContent = formatTime(task.time);
    updateChart();
}

/* Start timing the current task */
function startTimer() {
    stopTimer();
    let last = Date.now();
    timerInterval = setInterval(() => {
        const now = Date.now();
        const today = new Date().toLocaleDateString();
        const saved = JSON.parse(localStorage.getItem('timeData'));
        if (saved && saved.lastReset !== today) {
            tasks.forEach(t => (t.time = 0));
            last = now; // reset reference so new day starts fresh
            saveData();
        } else {
            tasks[currentTaskIndex].time += now - last;
            last = now;
        }
        updateDisplay();
        saveData();
    }, 1000);
}

/* Stop timing */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/* Switch to the previous task */
function prevTask() {
    currentTaskIndex = (currentTaskIndex - 1 + tasks.length) % tasks.length;
    updateDisplay();
    startTimer();
}

/* Switch to the next task */
function nextTask() {
    currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
    updateDisplay();
    startTimer();
}

/* Create or update the donut chart */
function updateChart() {
    const ctx = document.getElementById('chart').getContext('2d');
    const data = tasks.map(t => t.time / 1000 / 60); // minutes
    const labels = tasks.map(t => t.name);
    if (!chart) {
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data, backgroundColor: ['#ff6384','#36a2eb','#ffce56'] }]
            },
            options: {
                plugins: { legend: { position: 'bottom' } }
            }
        });
    } else {
        chart.data.datasets[0].data = data;
        chart.update();
    }
}

/* Attach event listeners */
function setupEvents() {
    document.getElementById('prev').addEventListener('click', prevTask);
    document.getElementById('next').addEventListener('click', nextTask);
    // Arrow key navigation
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') prevTask();
        if (e.key === 'ArrowRight') nextTask();
    });
}

/* Initialize app */
function init() {
    loadData();
    setupEvents();
    updateDisplay();
    startTimer();
}

window.addEventListener('load', init);

