/**
 * @file script.js
 * @description Core logic for the To-Do List and Weekly Focus Tracker application.
 * @version 1.0.0
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // === TO-DO LIST SECTION ===
    const taskForm = document.getElementById("task-form");
    const taskInput = document.getElementById("task-input");
    const taskList = document.getElementById("task-list");
    const dateDisplay = document.getElementById("date-display");

    const today = new Date();
    // Use 'en-US' locale for consistency with the rest of the UI
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);

    loadTasks();

    taskForm.addEventListener("submit", (e) => { e.preventDefault(); addTask(); });
    
    // Use event delegation for deleting tasks
    taskList.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            e.target.parentElement.remove();
            saveTasks();
        }
    });

    
    // === WEEKLY TRACKER SECTION ===
    const daysList = document.getElementById("days-list");
    const weekDisplay = document.getElementById("week-display");
    const prevWeekBtn = document.getElementById("prev-week-btn");
    const nextWeekBtn = document.getElementById("next-week-btn");
    
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // State variable holding a date within the currently displayed week
    let currentlyDisplayedDate = new Date();
    
    /** * @property {Object.<string, number[]>} allWeeksProgress
     * Stores the progress for all weeks.
     * Key: 'YYYY-MM-DD' string of the week's Monday.
     * Value: An array of 7 numbers representing daily progress.
     */
    let allWeeksProgress = {};


    // --- DATE HELPER FUNCTIONS ---

    /**
     * Calculates the date of the Monday for a given week.
     * @param {Date} d - A date within the target week.
     * @returns {Date} The date of the Monday of that week.
     */
    function getMonday(d) {
        d = new Date(d);
        let day = d.getDay(),
            diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday being the first day of the week (0)
        return new Date(d.setDate(diff));
    }

    /**
     * Generates a unique, consistent string key for a given week based on its Monday.
     * @param {Date} d - A date within the target week.
     * @returns {string} A string in 'YYYY-MM-DD' format.
     */
    function getWeekKey(d) {
        const monday = getMonday(d);
        return monday.toISOString().split('T')[0];
    }
    
    /**
     * Formats a date range string for the tracker's header.
     * @param {Date} d - A date within the target week.
     * @returns {string} A formatted string like "25 - 31 August 2025".
     */
    function formatWeekRange(d) {
        const monday = getMonday(d);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const monthOptions = { month: 'long' };
        // Use 'en-US' for consistency
        const mondayMonth = monday.toLocaleDateString('en-US', monthOptions);
        const sundayMonth = sunday.toLocaleDateString('en-US', monthOptions);

        if (monday.getMonth() === sunday.getMonth()) {
            return `${monday.getDate()} - ${sunday.getDate()} ${mondayMonth} ${sunday.getFullYear()}`;
        } else {
            return `${monday.getDate()} ${mondayMonth} - ${sunday.getDate()} ${sundayMonth} ${sunday.getFullYear()}`;
        }
    }
    
    
    // --- TRACKER CORE LOGIC ---

    /**
     * Renders the entire weekly tracker UI for a given date.
     * It clears the existing list and generates new day items.
     * @param {Date} date - A date within the week to be rendered.
     */
    function renderTrackerForDate(date) {
        const weekKey = getWeekKey(date);
        // Get data for the week, or create a new empty array if it doesn't exist
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
            
            // Highlight the current day only if viewing the current week
            if (weekKey === todayKey && new Date().toDateString() === dayDate.toDateString()) {
                dayItem.classList.add('current-day');
            }

            dayItem.innerHTML = `
                <span class="day-name">${name} - ${dayDate.getDate()}</span>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill"></div>
                </div>
                <div class="day-controls">
                    <button class="decrement-btn" aria-label="Decrement session">-</button>
                    <span class="day-counter">0</span>
                    <button class="increment-btn" aria-label="Increment session">+</button>
                </div>
            `;
            daysList.appendChild(dayItem);
            updateDayUI(index, currentWeekData[index]);
        });
    }

    /**
     * Updates the UI of a single day item in the tracker.
     * @param {number} dayIndex - The index of the day (0-6).
     * @param {number} progress - The current progress value for that day.
     */
    function updateDayUI(dayIndex, progress) {
        const dayItem = daysList.querySelector(`[data-day-index='${dayIndex}']`);
        if (dayItem) {
            const progressBarFill = dayItem.querySelector('.progress-bar-fill');
            const dayCounter = dayItem.querySelector('.day-counter');

            // Cap the visual width of the progress bar at 100%
            const widthPercentage = Math.min(progress * 20, 100);
            progressBarFill.style.width = `${widthPercentage}%`;
            
            dayCounter.textContent = progress;

            // Add a 'completed' class for special styling when the goal is met
            if (progress >= 5) {
                progressBarFill.classList.add('completed');
            } else {
                progressBarFill.classList.remove('completed');
            }
        }
    }

    // --- EVENT HANDLERS ---

    prevWeekBtn.addEventListener('click', () => {
        currentlyDisplayedDate.setDate(currentlyDisplayedDate.getDate() - 7);
        renderTrackerForDate(currentlyDisplayedDate);
    });

    nextWeekBtn.addEventListener('click', () => {
        currentlyDisplayedDate.setDate(currentlyDisplayedDate.getDate() + 7);
        renderTrackerForDate(currentlyDisplayedDate);
    });

    // Use event delegation for the tracker controls
    daysList.addEventListener('click', (e) => {
        const dayItem = e.target.closest('.day-item');
        if (!dayItem) return;

        const dayIndex = parseInt(dayItem.dataset.dayIndex);
        const weekKey = getWeekKey(currentlyDisplayedDate);

        if (e.target.classList.contains('increment-btn')) {
            allWeeksProgress[weekKey][dayIndex]++;
            saveTrackerData();
            updateDayUI(dayIndex, allWeeksProgress[weekKey][dayIndex]);
        } 
        else if (e.target.classList.contains('decrement-btn')) {
            if (allWeeksProgress[weekKey][dayIndex] > 0) {
                allWeeksProgress[weekKey][dayIndex]--;
                saveTrackerData();
                updateDayUI(dayIndex, allWeeksProgress[weekKey][dayIndex]);
            }
        }
    });

    // --- DATA PERSISTENCE ---
    
    /**
     * Saves the entire `allWeeksProgress` object to localStorage.
     */
    function saveTrackerData() {
        localStorage.setItem('allWeeksProgress', JSON.stringify(allWeeksProgress));
    }

    /**
     * Loads the `allWeeksProgress` object from localStorage.
     */
    function loadTrackerData() {
        const savedData = localStorage.getItem('allWeeksProgress');
        allWeeksProgress = savedData ? JSON.parse(savedData) : {};
    }

    // Initialize the tracker on page load
    loadTrackerData();
    renderTrackerForDate(currentlyDisplayedDate);
});


// === TO-DO LIST GLOBAL FUNCTIONS ===

/**
 * Adds a new task to the list from the input field.
 */
function addTask() {
    const taskInput = document.getElementById("task-input");
    const text = taskInput.value.trim();
    if (text) {
        createTaskElement(text);
        taskInput.value = "";
        saveTasks();
    }
}

/**
 * Creates and appends a new task list item to the DOM.
 * @param {string} text - The content of the task.
 */
function createTaskElement(text) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${text}</span><button class="delete-btn" aria-label="Delete task">×</button>`;
    document.getElementById("task-list").appendChild(li);
}

/**
 * Saves all current tasks from the DOM to localStorage.
 */
function saveTasks() {
    const tasks = Array.from(document.querySelectorAll("#task-list li span")).map(span => span.textContent);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Loads tasks from localStorage and populates the list on page load.
 */
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(createTaskElement);
}