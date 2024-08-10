const activityCounts = {};

const dailyActivityLog = JSON.parse(localStorage.getItem('dailyActivityLog')) || {};
let challenges = JSON.parse(localStorage.getItem('challenges')) || {};

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let today = new Date().toLocaleDateString();

// Load data from localStorage
function loadActivityData() {
    const storedActivityCounts = JSON.parse(localStorage.getItem('activityCounts'));
    const storedLastDate = localStorage.getItem('lastDate');

    if (storedActivityCounts) {
        for (const [exercise, data] of Object.entries(storedActivityCounts)) {
            activityCounts[exercise] = data;
            createNewExerciseUI(exercise);
        }
    }

    // Reset counts if a new day, week, month, or year has started
    if (storedLastDate) {
        const lastDate = new Date(storedLastDate);
        const currentDate = new Date();

        // Reset today's counts if a new day has started
        if (lastDate.toLocaleDateString() !== currentDate.toLocaleDateString()) {
            resetTodaysCounts();
        }

        // Reset weekly counts if a new week has started (Monday)
        if (currentDate.getDay() === 1 && lastDate.getDay() !== 1) {
            resetWeeklyCounts();
        }

        // Reset monthly counts if a new month has started
        if (currentDate.getMonth() !== lastDate.getMonth()) {
            resetMonthlyCounts();
        }

        // Reset yearly counts if a new year has started
        if (currentDate.getFullYear() !== lastDate.getFullYear()) {
            resetYearlyCounts();
        }
    }

    updateAllStatistics();
    updateActivityList();

    // Update the last date in localStorage
    localStorage.setItem('lastDate', today);
}

// Save activity data to localStorage
function saveActivityData() {
    localStorage.setItem('activityCounts', JSON.stringify(activityCounts));
    localStorage.setItem('dailyActivityLog', JSON.stringify(dailyActivityLog));
    localStorage.setItem('challenges', JSON.stringify(challenges));
    localStorage.setItem('lastDate', today);
}

// Add activity to the count
function addActivity(activity) {
    const inputElement = document.getElementById("activityInput");
    const count = parseInt(inputElement.value);
    if (!isNaN(count) && count > 0) {
        const today = new Date().toLocaleDateString();

        // Update counts
        activityCounts[activity].count += count;
        activityCounts[activity].week += count;
        activityCounts[activity].month += count;
        activityCounts[activity].year += count;
        activityCounts[activity].total += count;

        // Update daily log
        if (!dailyActivityLog[today]) {
            dailyActivityLog[today] = {};
        }
        if (!dailyActivityLog[today][activity]) {
            dailyActivityLog[today][activity] = 0;
        }
        dailyActivityLog[today][activity] += count;

        updateActivityCounts(activity);
        updateAllStatistics();
        saveActivityData();
        inputElement.value = '';  // Clear the input field

        // Update challenge progress
        updateChallengeProgress(activity, count);
    } else {
        alert("Please enter a valid number.");
    }
}

// Update challenge progress
function updateChallengeProgress(activity, count) {
    if (challenges[activity]) {
        let challenge = challenges[activity];
        challenge.progress += count;

        if (challenge.rank === 'Legend') {
            // Continue counting in legend mode
            challenge.legendLevel += count;
        } else {
            // Check if the current rank is completed
            if (challenge.progress >= challenge.levels[challenge.rank.toLowerCase()]) {
                showCongratulationsModal(activity, challenge.rank);
                advanceChallengeRank(activity);
            }
        }
        saveActivityData();
    }
}

// Advance to the next challenge rank
function advanceChallengeRank(activity) {
    let challenge = challenges[activity];
    const ranks = ['bronze', 'silver', 'gold', 'champion', 'legend'];
    const currentRankIndex = ranks.indexOf(challenge.rank.toLowerCase());

    if (currentRankIndex < ranks.length - 1) {
        challenge.rank = ranks[currentRankIndex + 1];

        if (challenge.rank === 'Legend') {
            challenge.legendLevel = challenge.progress; // Start legend level counting
        }
    }
}

// Show the congratulations modal
function showCongratulationsModal(activity, rank) {
    const modal = document.getElementById('congratulationsModal');
    const message = document.getElementById('congratulationsMessage');
    message.innerText = `Congratulations! You've completed the ${rank} rank in the ${activity} challenge.`;
    modal.style.display = 'block';
}

// Update activity counts on the UI
function updateActivityCounts(activity) {
    document.getElementById(`${activity}Count`).textContent = `${capitalizeFirstLetter(activity)}: ${activityCounts[activity].count}`;
}

// Update all statistics
function updateAllStatistics() {
    updateStatistics('week');
    updateStatistics('month');
    updateStatistics('year');
    updateTotalStatistics();
}

// Update statistics for a given period
function updateStatistics(period) {
    const periodStatsElement = document.getElementById(`${period}StatsDetails`);
    const stats = Object.keys(activityCounts).map(activity => {
        return `+${activityCounts[activity][period]} ${capitalizeFirstLetter(activity)}`;
    });
    periodStatsElement.innerHTML = stats.map(stat => `<p>${stat}</p>`).join('');
}

// Update total statistics
function updateTotalStatistics() {
    const totalStatsElement = document.getElementById('totalStatsList');
    const stats = Object.keys(activityCounts).map(activity => {
        return `${capitalizeFirstLetter(activity)}: ${activityCounts[activity].total}`;
    });
    totalStatsElement.innerHTML = stats.map(stat => `<p>${stat}</p>`).join('');
}

// Capitalize the first letter of a word
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Show history modal
function showHistory() {
    const historyModal = document.getElementById('historyModal');
    updateCalendar();
    updateMonthlyStatistics();
    historyModal.style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Update the calendar with clickable dates
function updateCalendar() {
    const calendarElement = document.getElementById('calendar');
    calendarElement.innerHTML = '';  // Clear previous calendar

    const monthYearElement = document.getElementById('currentMonthYear');
    monthYearElement.textContent = `${new Date(currentYear, currentMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;

    // Get number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Fill with empty days if month doesn't start on Sunday
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDayElement = document.createElement('div');
        emptyDayElement.classList.add('empty-day');
        calendarElement.appendChild(emptyDayElement);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateString = date.toLocaleDateString();

        const dayElement = document.createElement('div');
        dayElement.textContent = day;
        dayElement.onclick = () => showDailyDetails(dateString);  // Set up click handler
        calendarElement.appendChild(dayElement);
    }
}

// Show details for a specific date
function showDailyDetails(date) {
    const detailsModal = document.getElementById('dailyDetailsModal');
    const selectedDateElement = document.getElementById('selectedDate');
    const detailsContentElement = document.getElementById('detailsContent');

    selectedDateElement.textContent = date;
    detailsContentElement.innerHTML = '';  // Clear previous details

    if (dailyActivityLog[date]) {
        const details = Object.keys(dailyActivityLog[date]).map(activity => {
            return `<p>${capitalizeFirstLetter(activity)}: ${dailyActivityLog[date][activity]}</p>`;
        }).join('');
        detailsContentElement.innerHTML = details;
    } else {
        detailsContentElement.innerHTML = "<p>No activities recorded.</p>";
    }

    detailsModal.style.display = 'block';
}

// Change month and update the calendar
function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
    }
    updateCalendar();
    updateMonthlyStatistics();
}

// Search history by date
function searchByDate() {
    const searchDateInput = document.getElementById("searchDate");
    const searchDate = new Date(searchDateInput.value).toLocaleDateString();
    if (searchDate) {
        showDailyDetails(searchDate);
    } else {
        alert("Please select a valid date.");
    }
}

// Update monthly statistics
function updateMonthlyStatistics() {
    const monthlyStatsElement = document.getElementById("monthlyStats");
    const currentMonthName = new Date(currentYear, currentMonth).toLocaleDateString(undefined, { month: 'long' });

    let monthlyTotals = {};
    for (let day = 1; day <= new Date(currentYear, currentMonth + 1, 0).getDate(); day++) {
        const fullDate = new Date(currentYear, currentMonth, day).toLocaleDateString();
        if (dailyActivityLog[fullDate]) {
            Object.keys(dailyActivityLog[fullDate]).forEach(activity => {
                if (!monthlyTotals[activity]) {
                    monthlyTotals[activity] = 0;
                }
                monthlyTotals[activity] += dailyActivityLog[fullDate][activity];
            });
        }
    }

    const stats = Object.keys(monthlyTotals).map(activity => {
        return `${capitalizeFirstLetter(activity)}: ${monthlyTotals[activity]}`;
    }).join('<br>');

    monthlyStatsElement.innerHTML = `<h3>${currentMonthName} Total:</h3>${stats}`;
}

// Reset today's activities
function resetTodaysActivities() {
    const today = new Date().toLocaleDateString();

    if (dailyActivityLog[today]) {
        Object.keys(dailyActivityLog[today]).forEach(activity => {
            const count = dailyActivityLog[today][activity];
            activityCounts[activity].total -= count; // Deduct from total
            activityCounts[activity].count = 0; // Reset today's count
            activityCounts[activity].week -= count;
            activityCounts[activity].month -= count;
            activityCounts[activity].year -= count;

            // Update challenge progress
            if (challenges[activity]) {
                challenges[activity].progress -= count;
                if (challenges[activity].rank === 'Legend') {
                    challenges[activity].legendLevel -= count;
                }
            }

            // Remove today's record
            delete dailyActivityLog[today][activity];
        });

        if (Object.keys(dailyActivityLog[today]).length === 0) {
            delete dailyActivityLog[today];
        }

        updateActivityList();
        updateAllStatistics();
        saveActivityData();
    }
    closeModal('resetTodayModal');
}

// Reset weekly counts to zero
function resetWeeklyCounts() {
    Object.keys(activityCounts).forEach(activity => {
        activityCounts[activity].week = 0;
    });
    saveActivityData();
}

// Reset monthly counts to zero
function resetMonthlyCounts() {
    Object.keys(activityCounts).forEach(activity => {
        activityCounts[activity].month = 0;
    });
    saveActivityData();
}

// Reset yearly counts to zero
function resetYearlyCounts() {
    Object.keys(activityCounts).forEach(activity => {
        activityCounts[activity].year = 0;
    });
    saveActivityData();
}

// Show reset today's activities modal
function showResetTodaysActivitiesModal() {
    const resetTodayModal = document.getElementById('resetTodayModal');
    resetTodayModal.style.display = 'block';
}

// Add a new exercise button dynamically
function addNewExercise() {
    const exerciseNameInput = document.getElementById('newExerciseName');
    const exerciseName = exerciseNameInput.value.trim().toLowerCase();

    if (exerciseName && !activityCounts[exerciseName]) {
        // Initialize new exercise counts
        activityCounts[exerciseName] = { count: 0, week: 0, month: 0, year: 0, total: 0 };

        // Create button and today's activity UI
        createNewExerciseUI(exerciseName);

        exerciseNameInput.value = ''; // Clear the input
        saveActivityData();
    } else {
        alert('Exercise already exists or invalid name!');
    }
    closeModal('exerciseModal');
}

// Create UI elements for a new exercise
function createNewExerciseUI(exerciseName) {
    // Create a button for the new exercise
    const newButton = document.createElement('button');
    newButton.textContent = `Add ${capitalizeFirstLetter(exerciseName)}`;
    newButton.onclick = () => addActivity(exerciseName);
    newButton.classList.add('exercise-button');
    document.getElementById('exerciseButtons').insertBefore(newButton, document.getElementById('addExerciseButton'));

    // Add to "Today's Activities"
    const activityList = document.getElementById('activityList');
    const newActivityElement = document.createElement('p');
    newActivityElement.id = `${exerciseName}Count`;
    newActivityElement.textContent = `${capitalizeFirstLetter(exerciseName)}: 0`;
    activityList.appendChild(newActivityElement);
}

// Show add exercise modal
function showAddExerciseModal() {
    const exerciseModal = document.getElementById('exerciseModal');
    exerciseModal.style.display = 'block';
}

// Show delete exercise modal
function showDeleteExerciseModal() {
    const deleteModal = document.getElementById('deleteModal');
    const exerciseDeleteList = document.getElementById('exerciseDeleteList');
    exerciseDeleteList.innerHTML = '';

    // Populate the list with current exercises
    for (const exercise in activityCounts) {
        const exerciseButton = document.createElement('button');
        exerciseButton.textContent = capitalizeFirstLetter(exercise);
        exerciseButton.classList.add('exercise-delete-button');
        exerciseButton.onclick = () => {
            exerciseButton.classList.toggle('selected');
            exerciseButton.style.backgroundColor = exerciseButton.classList.contains('selected') ? '#ff4d4d' : ''; // Toggle red
        };
        exerciseDeleteList.appendChild(exerciseButton);
    }

    deleteModal.style.display = 'block';
}

// Delete selected exercises
function deleteSelectedExercises() {
    const selectedButtons = document.querySelectorAll('.exercise-delete-button.selected');
    selectedButtons.forEach(button => {
        const exerciseName = button.textContent.toLowerCase();
        delete activityCounts[exerciseName];

        // Remove the button from the UI
        const buttonElements = document.querySelectorAll('#exerciseButtons button');
        buttonElements.forEach(btn => {
            if (btn.textContent.includes(capitalizeFirstLetter(exerciseName))) {
                btn.remove();
            }
        });

        // Remove from today's activities UI
        const activityElement = document.getElementById(`${exerciseName}Count`);
        if (activityElement) {
            activityElement.remove();
        }

        // Remove from dailyActivityLog
        for (let date in dailyActivityLog) {
            if (dailyActivityLog[date][exerciseName]) {
                delete dailyActivityLog[date][exerciseName];
            }
        }

        // Remove from challenges
        if (challenges[exerciseName]) {
            delete challenges[exerciseName];
        }
    });

    saveActivityData();
    updateAllStatistics();
    closeModal('deleteModal');
}

// Reset today's counts to zero
function resetTodaysCounts() {
    Object.keys(activityCounts).forEach(activity => {
        activityCounts[activity].count = 0;
    });
    updateActivityList();
    saveActivityData();
}

// Update the today's activity list on the UI
function updateActivityList() {
    for (const exercise in activityCounts) {
        if (document.getElementById(`${exercise}Count`)) {
            document.getElementById(`${exercise}Count`).textContent = `${capitalizeFirstLetter(exercise)}s: ${activityCounts[exercise].count}`;
        }
    }
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    loadActivityData();
    initMusicControls();
    initChallengeControls();
    showWelcomeScreen();
});

// Initialize music controls
function initMusicControls() {
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');

    // Set initial volume
    backgroundMusic.volume = 0.1;

    // Check local storage for music state
    const isMuted = JSON.parse(localStorage.getItem('musicMuted') || 'false');

    if (isMuted) {
        backgroundMusic.pause();
        musicToggle.classList.add('muted');
    } else {
        backgroundMusic.play();
        musicToggle.classList.remove('muted');
    }

    // Toggle music on button click
    musicToggle.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            musicToggle.classList.remove('muted');
            localStorage.setItem('musicMuted', 'false');
        } else {
            backgroundMusic.pause();
            musicToggle.classList.add('muted');
            localStorage.setItem('musicMuted', 'true');
        }
    });
}

// Initialize challenge controls
function initChallengeControls() {
    const challengeToggle = document.getElementById('challengeToggle');
    challengeToggle.addEventListener('click', () => {
        const challengeModal = document.getElementById('challengeModal');
        updateChallengeList();
        challengeModal.style.display = 'block';
    });
}

// Update the challenge list
function updateChallengeList() {
    const challengeList = document.getElementById('challengeList');
    challengeList.innerHTML = ''; // Clear existing challenges

    const colors = {
        Bronze: '#cd7f32',
        Silver: '#c0c0c0',
        Gold: '#ffd700',
        Champion: '#8b0000',
        Legend: '#800080'
    };

    for (const [exercise, challenge] of Object.entries(challenges)) {
        const progressText = challenge.rank === 'Legend' 
    ? `${challenge.legendLevel}` 
    : `${challenge.progress}${challenge.levels[challenge.rank.toLowerCase()] ? '/' + challenge.levels[challenge.rank.toLowerCase()] : ''}`;

        const challengeElement = document.createElement('div');
        challengeElement.classList.add('challenge-item');
        challengeElement.innerHTML = `
            <div class="progress-circle" style="background-color: ${colors[capitalizeFirstLetter(challenge.rank)]};">
                <span>${progressText}</span>
            </div>
            <div>
                <div class="challenge-name">${capitalizeFirstLetter(exercise)} Challenge</div>
                <div class="challenge-rank">Rank: ${challenge.rank}</div>
            </div>
        `;
        challengeList.appendChild(challengeElement);
    }
}

// Show add challenge modal
function showAddChallengeModal() {
    const addChallengeModal = document.getElementById('addChallengeModal');
    const exerciseSelection = document.getElementById('exerciseSelection');
    exerciseSelection.innerHTML = ''; // Clear existing buttons

    // Populate with exercises
    for (const exercise in activityCounts) {
        const exerciseButton = document.createElement('button');
        exerciseButton.textContent = capitalizeFirstLetter(exercise);
        exerciseButton.onclick = () => {
            // Toggle selection
            const buttons = exerciseSelection.querySelectorAll('button');
            buttons.forEach(btn => btn.classList.remove('selected'));
            exerciseButton.classList.add('selected');

            // Show challenge settings
            const challengeSettings = document.getElementById('challengeSettings');
            challengeSettings.style.display = 'block';
        };
        exerciseSelection.appendChild(exerciseButton);
    }

    addChallengeModal.style.display = 'block';
}

// Create a new challenge
function createChallenge() {
    const selectedButton = document.querySelector('#exerciseSelection button.selected');
    if (!selectedButton) {
        alert('Please select an exercise to start a challenge.');
        return;
    }

    const exercise = selectedButton.textContent.toLowerCase();
    const bronzeLevel = parseInt(document.getElementById('bronzeLevel').value);
    const silverLevel = parseInt(document.getElementById('silverLevel').value);
    const goldLevel = parseInt(document.getElementById('goldLevel').value);
    const championLevel = parseInt(document.getElementById('championLevel').value);

    challenges[exercise] = {
        rank: 'Bronze',
        progress: 0,
        levels: {
            bronze: bronzeLevel,
            silver: silverLevel,
            gold: goldLevel,
            champion: championLevel
        },
        legendLevel: 0 // Initialize legend level count
    };

    saveActivityData();
    updateChallengeList();
    closeModal('addChallengeModal');
}

// Show delete challenge modal
function showDeleteChallengeModal() {
    const challengeList = document.getElementById('challengeList');
    challengeList.innerHTML = ''; // Clear existing challenges

    for (const exercise in challenges) {
        const challengeButton = document.createElement('button');
        challengeButton.textContent = capitalizeFirstLetter(exercise);
        challengeButton.classList.add('challenge-delete-button');
        challengeButton.onclick = () => {
            challengeButton.classList.toggle('selected');
            challengeButton.style.backgroundColor = challengeButton.classList.contains('selected') ? '#ff4d4d' : ''; // Toggle red
        };
        challengeList.appendChild(challengeButton);
    }

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Selected Challenges';
    deleteButton.onclick = () => {
        const selectedButtons = document.querySelectorAll('.challenge-delete-button.selected');
        selectedButtons.forEach(button => {
            const exerciseName = button.textContent.toLowerCase();
            delete challenges[exerciseName];
        });

        saveActivityData();
        updateChallengeList();
        closeModal('challengeModal');
    };

    challengeList.appendChild(deleteButton);
}

// Show the welcome screen modal
function showWelcomeScreen() {
    const welcomeModal = document.getElementById('welcomeModal');
    welcomeModal.style.display = 'block';
}

