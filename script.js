/**
 * @file script.js
 * @description Final Productivity Dashboard logic with daily and weekly celebrations.
 * @version 1.2.0
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // === DOM ELEMENTS ===
    const taskForm = document.getElementById("task-form");
    const taskInput = document.getElementById("task-input");
    const taskList = document.getElementById("task-list");
    const dateDisplay = document.getElementById("date-display");

    const daysList = document.getElementById("days-list");
    const weekDisplay = document.getElementById("week-display");
    const prevWeekBtn = document.getElementById("prev-week-btn");
    const nextWeekBtn = document.getElementById("next-week-btn");

    const weeklyTotalText = document.getElementById("weekly-total-text");
    const weeklyProgressFill = document.getElementById("weekly-progress-fill");

    // === STATE ===
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let currentlyDisplayedDate = new Date();
    let allWeeksProgress = {};

    // === INITIALIZATION ===
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);

    loadTasks();
    loadTrackerData();
    renderTrackerForDate(currentlyDisplayedDate);

    // === EVENT LISTENERS ===
    taskForm.addEventListener("submit", (e) => { 
        e.preventDefault(); 
        addTask(); 
    });
    
    taskList.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            e.target.parentElement.remove();
            saveTasks();
        }
    });

    prevWeekBtn.addEventListener('click', () => {
        currentlyDisplayedDate.setDate(currentlyDisplayedDate.getDate() - 7);
        renderTrackerForDate(currentlyDisplayedDate);
    });

    nextWeekBtn.addEventListener('click', () => {
        currentlyDisplayedDate.setDate(currentlyDisplayedDate.getDate() + 7);
        renderTrackerForDate(currentlyDisplayedDate);
    });

    daysList.addEventListener('click', (e) => {
        const dayItem = e.target.closest('.day-item');
        if (!dayItem) return;

        const dayIndex = parseInt(dayItem.dataset.dayIndex);
        const weekKey = getWeekKey(currentlyDisplayedDate);

        if (e.target.classList.contains('increment-btn')) {
            allWeeksProgress[weekKey][dayIndex]++;
            finalizeUpdate(dayIndex, weekKey);
        } 
        else if (e.target.classList.contains('decrement-btn')) {
            if (allWeeksProgress[weekKey][dayIndex] > 0) {
                allWeeksProgress[weekKey][dayIndex]--;
                finalizeUpdate(dayIndex, weekKey);
            }
        }
    });

    // === CELEBRATION FUNCTIONS ===

    function fireDailyConfetti() {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4a90e2', '#2ecc71']
        });
    }

    function fireWeeklyFanfare() {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#2ecc71', '#f1c40f', '#4a90e2']
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#2ecc71', '#f1c40f', '#4a90e2']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    // === TRACKER LOGIC ===

    function finalizeUpdate(dayIndex, weekKey) {
        saveTrackerData();
        updateDayUI(dayIndex, allWeeksProgress[weekKey][dayIndex]);
        updateWeeklySummary();
    }

    function renderTrackerForDate(date) {
        const weekKey = getWeekKey(date);
        const currentWeekData = allWeeksProgress[weekKey] || Array(7).fill(0);
        allWeeksProgress[weekKey] = currentWeekData;

        weekDisplay.textContent = formatWeekRange(date);
        daysList.innerHTML = '';
        
        const todayKey = getWeekKey(new Date());
        const mondayOfDisplayedWeek = getMonday(date);

        dayNames.forEach((name, index) => {
            const dayItem = document.createElement('li');
            dayItem.className = 'day-item';
            dayItem.dataset.dayIndex = index;
            
            const dayDate = new Date(mondayOfDisplayedWeek);
            dayDate.setDate(mondayOfDisplayedWeek.getDate() + index);
            
            if (weekKey === todayKey && new Date().toDateString() === dayDate.toDateString()) {
                dayItem.classList.add('current-day');
            }

            dayItem.innerHTML = `
                <span class="day-name">${name} - ${dayDate.getDate()}</span>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill"></div>
                </div>
                <div class="day-controls">
                    <button class="decrement-btn" aria-label="Decrement">-</button>
                    <span class="day-counter">0</span>
                    <button class="increment-btn" aria-label="Increment">+</button>
                </div>
            `;
            daysList.appendChild(dayItem);
            updateDayUI(index, currentWeekData[index], false); // Pass false to prevent confetti on initial load
        });

        updateWeeklySummary(false);
    }

    function updateDayUI(dayIndex, progress, triggerCelebration = true) {
        const dayItem = daysList.querySelector(`[data-day-index='${dayIndex}']`);
        if (dayItem) {
            const progressBarFill = dayItem.querySelector('.progress-bar-fill');
            const dayCounter = dayItem.querySelector('.day-counter');

            const widthPercentage = Math.min(progress * 20, 100);
            progressBarFill.style.width = `${widthPercentage}%`;
            dayCounter.textContent = progress;

            if (progress >= 5) {
                if (progress === 5 && triggerCelebration) fireDailyConfetti();
                progressBarFill.classList.add('completed');
            } else {
                progressBarFill.classList.remove('completed');
            }
        }
    }

    function updateWeeklySummary(triggerCelebration = true) {
        const weekKey = getWeekKey(currentlyDisplayedDate);
        const currentWeekData = allWeeksProgress[weekKey] || Array(7).fill(0);
        
        const totalSessions = currentWeekData.reduce((sum, val) => sum + val, 0);
        const weeklyGoal = 25; 
        const percentage = Math.min((totalSessions / weeklyGoal) * 100, 100);

        weeklyProgressFill.style.width = `${percentage}%`;
        weeklyTotalText.textContent = `${totalSessions} / ${weeklyGoal} sessions`;

        if (totalSessions >= weeklyGoal) {
            if (totalSessions === 25 && triggerCelebration) fireWeeklyFanfare();
            weeklyProgressFill.classList.add('completed');
        } else {
            weeklyProgressFill.classList.remove('completed');
        }
    }

    // --- HELPERS ---

    function getMonday(d) {
        d = new Date(d);
        let day = d.getDay(),
            diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function getWeekKey(d) {
        return getMonday(d).toISOString().split('T')[0];
    }
    
    function formatWeekRange(d) {
        const monday = getMonday(d);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const monMonth = monday.toLocaleDateString('en-US', { month: 'long' });
        const sunMonth = sunday.toLocaleDateString('en-US', { month: 'long' });

        return (monday.getMonth() === sunday.getMonth()) 
            ? `${monday.getDate()} - ${sunday.getDate()} ${monMonth} ${sunday.getFullYear()}`
            : `${monday.getDate()} ${monMonth} - ${sunday.getDate()} ${sunMonth} ${sunday.getFullYear()}`;
    }

    function saveTrackerData() {
        localStorage.setItem('allWeeksProgress', JSON.stringify(allWeeksProgress));
    }

    function loadTrackerData() {
        const savedData = localStorage.getItem('allWeeksProgress');
        allWeeksProgress = savedData ? JSON.parse(savedData) : {};
    }
});

// === TO-DO LIST FUNCTIONS ===

function addTask() {
    const taskInput = document.getElementById("task-input");
    const text = taskInput.value.trim();
    if (text) {
        createTaskElement(text);
        taskInput.value = "";
        saveTasks();
    }
}

function createTaskElement(text) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${text}</span><button class="delete-btn" aria-label="Delete">×</button>`;
    document.getElementById("task-list").appendChild(li);
}

function saveTasks() {
    const tasks = Array.from(document.querySelectorAll("#task-list li span")).map(span => span.textContent);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(createTaskElement);
}