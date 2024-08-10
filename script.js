// Initialisieren der Variablen und Laden von Daten aus dem localStorage
const activityCounts = {};
let deactivatedExercises = JSON.parse(localStorage.getItem('deactivatedExercises')) || [];
const dailyActivityLog = JSON.parse(localStorage.getItem('dailyActivityLog')) || {};
let challenges = JSON.parse(localStorage.getItem('challenges')) || {};

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let today = new Date().toLocaleDateString();
let currentDay = new Date().getDay(); // 0 für Sonntag, 1 für Montag, etc.

function loadActivityData() {
    const storedActivityCounts = JSON.parse(localStorage.getItem('activityCounts'));
    const storedLastDate = localStorage.getItem('lastDate');
    const lastDayOfWeek = localStorage.getItem('lastDayOfWeek');
    const lastDayOfMonth = localStorage.getItem('lastDayOfMonth');
    const lastYear = localStorage.getItem('lastYear');

    if (storedActivityCounts) {
        for (const [exercise, data] of Object.entries(storedActivityCounts)) {
            activityCounts[exercise] = data;
            if (!deactivatedExercises.includes(exercise)) {
                createNewExerciseUI(exercise);
            }
        }
    }

    if (storedLastDate && storedLastDate !== today) {
        resetTodaysCounts();
    }

    if (lastDayOfWeek !== undefined && currentDay === 1 && parseInt(lastDayOfWeek) !== 1) {
        resetWeekCounts();
    }

    if (lastDayOfMonth !== undefined && new Date().getDate() === 1 && parseInt(lastDayOfMonth) !== 1) {
        resetMonthCounts();
    }

    if (lastYear !== undefined && currentYear !== parseInt(lastYear)) {
        resetYearCounts();
    }

    updateAllStatistics();
    updateActivityList();

    localStorage.setItem('lastDate', today);
    localStorage.setItem('lastDayOfWeek', currentDay);
    localStorage.setItem('lastDayOfMonth', new Date().getDate());
    localStorage.setItem('lastYear', currentYear);
}

function saveActivityData() {
    localStorage.setItem('activityCounts', JSON.stringify(activityCounts));
    localStorage.setItem('dailyActivityLog', JSON.stringify(dailyActivityLog));
    localStorage.setItem('challenges', JSON.stringify(challenges));
    localStorage.setItem('deactivatedExercises', JSON.stringify(deactivatedExercises));
    localStorage.setItem('lastDate', today);
    localStorage.setItem('lastDayOfWeek', currentDay);
    localStorage.setItem('lastDayOfMonth', new Date().getDate());
    localStorage.setItem('lastYear', currentYear);
}

function resetWeekCounts() {
    for (const exercise in activityCounts) {
        activityCounts[exercise].week = 0;
    }
    console.log("Week stats reset");
}

function resetMonthCounts() {
    for (const exercise in activityCounts) {
        activityCounts[exercise].month = 0;
    }
    console.log("Month stats reset");
}

function resetYearCounts() {
    for (const exercise in activityCounts) {
        activityCounts[exercise].year = 0;
    }
    console.log("Year stats reset");
}

function addActivity(activity) {
    const inputElement = document.getElementById("activityInput");

    if (switchModeActive) {
        return;
    }

    const count = parseInt(inputElement.value);
    if (!isNaN(count) && count > 0) {
        const today = new Date().toLocaleDateString();

        activityCounts[activity].count += count;
        activityCounts[activity].week += count;
        activityCounts[activity].month += count;
        activityCounts[activity].year += count;
        activityCounts[activity].total += count;

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
        inputElement.value = '';

        updateChallengeProgress(activity, count);
    } else {
        alert("Please enter a valid number.");
    }
}

function updateChallengeProgress(activity, count) {
    if (challenges[activity]) {
        let challenge = challenges[activity];
        challenge.progress += count;

        if (challenge.rank === 'Legend') {
            challenge.legendLevel += count;
        } else {
            if (challenge.progress >= challenge.levels[challenge.rank.toLowerCase()]) {
                showCongratulationsModal(activity, challenge.rank);
                advanceChallengeRank(activity);
            }
        }
        saveActivityData();
    }
}

function advanceChallengeRank(activity) {
    let challenge = challenges[activity];
    const ranks = ['bronze', 'silver', 'gold', 'champion', 'legend'];
    const currentRankIndex = ranks.indexOf(challenge.rank.toLowerCase());

    if (currentRankIndex < ranks.length - 1) {
        challenge.rank = ranks[currentRankIndex + 1];

        if (challenge.rank === 'Legend') {
            challenge.legendLevel = challenge.progress;
        }
    }
}

function showCongratulationsModal(activity, rank) {
    const modal = document.getElementById('congratulationsModal');
    const message = document.getElementById('congratulationsMessage');
    message.innerText = `Congratulations! You've completed the ${rank} rank in the ${activity} challenge.`;
    modal.style.display = 'block';
}

function updateActivityCounts(activity) {
    document.getElementById(`${activity}Count`).textContent = `${activity}: ${activityCounts[activity].count}`;
}

function updateAllStatistics() {
    updateStatistics('week');
    updateStatistics('month');
    updateStatistics('year');
    updateTotalStatistics();
}

function updateStatistics(period) {
    const periodStatsElement = document.getElementById(`${period}StatsDetails`);
    const stats = Object.keys(activityCounts).filter(activity => !deactivatedExercises.includes(activity)).map(activity => {
        return `+${activityCounts[activity][period]} ${activity}`;
    });
    periodStatsElement.innerHTML = stats.map(stat => `<p>${stat}</p>`).join('');
}

function updateTotalStatistics() {
    const totalStatsElement = document.getElementById('totalStatsList');
    const stats = Object.keys(activityCounts).filter(activity => !deactivatedExercises.includes(activity)).map(activity => {
        return `${activity}: ${activityCounts[activity].total}`;
    });
    totalStatsElement.innerHTML = stats.map(stat => `<p>${stat}</p>`).join('');
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showHistory() {
    const historyModal = document.getElementById('historyModal');
    updateCalendar();
    updateMonthlyStatistics();
    historyModal.style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function updateCalendar() {
    const calendarElement = document.getElementById('calendar');
    calendarElement.innerHTML = '';

    const monthYearElement = document.getElementById('currentMonthYear');
    monthYearElement.textContent = `${new Date(currentYear, currentMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

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
        dayElement.onclick = () => showDailyDetails(dateString);
        calendarElement.appendChild(dayElement);
    }
}

function showDailyDetails(date) {
    const detailsModal = document.getElementById('dailyDetailsModal');
    const selectedDateElement = document.getElementById('selectedDate');
    const detailsContentElement = document.getElementById('detailsContent');

    selectedDateElement.textContent = date;
    detailsContentElement.innerHTML = '';

    if (dailyActivityLog[date]) {
        const details = Object.keys(dailyActivityLog[date]).map(activity => {
            return `<p>${activity}: ${dailyActivityLog[date][activity]}</p>`;
        }).join('');
        detailsContentElement.innerHTML = details;
    } else {
        detailsContentElement.innerHTML = "<p>No activities recorded.</p>";
    }

    detailsModal.style.display = 'block';
}

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

function searchByDate() {
    const searchDateInput = document.getElementById("searchDate");
    const searchDate = new Date(searchDateInput.value).toLocaleDateString();
    if (searchDate) {
        showDailyDetails(searchDate);
    } else {
        alert("Please select a valid date.");
    }
}

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

    const stats = Object.keys(monthlyTotals).filter(activity => !deactivatedExercises.includes(activity)).map(activity => {
        return `${activity}: ${monthlyTotals[activity]}`;
    }).join('<br>');

    monthlyStatsElement.innerHTML = `<h3>${currentMonthName} Total:</h3>${stats}`;
}

function resetTodaysActivities() {
    const today = new Date().toLocaleDateString();

    if (dailyActivityLog[today]) {
        Object.keys(dailyActivityLog[today]).forEach(activity => {
            const count = dailyActivityLog[today][activity];
            activityCounts[activity].total -= count;
            activityCounts[activity].count = 0;
            activityCounts[activity].week -= count;
            activityCounts[activity].month -= count;
            activityCounts[activity].year -= count;

            if (challenges[activity]) {
                challenges[activity].progress -= count;
                if (challenges[activity].rank === 'Legend') {
                    challenges[activity].legendLevel -= count;
                }
            }

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

function showResetTodaysActivitiesModal() {
    const resetTodayModal = document.getElementById('resetTodayModal');
    resetTodayModal.style.display = 'block';
}

function addNewExercise() {
    const exerciseNameInput = document.getElementById('newExerciseName');
    const exerciseName = exerciseNameInput.value.trim();

    if (exerciseName && !activityCounts[exerciseName]) {
        activityCounts[exerciseName] = { count: 0, week: 0, month: 0, year: 0, total: 0 };

        createNewExerciseUI(exerciseName);

        exerciseNameInput.value = '';
        saveActivityData();
    } else {
        alert('Exercise already exists or invalid name!');
    }
    closeModal('exerciseModal');
}

function createNewExerciseUI(exerciseName) {
    const newButton = document.createElement('button');
    newButton.textContent = `Add ${exerciseName}`;
    newButton.classList.add('exercise-button');
    newButton.onclick = function() {
        if (switchModeActive) {
            selectExerciseForSwitch(newButton);
        } else {
            addActivity(exerciseName);
        }
    };
    document.getElementById('exerciseButtons').insertBefore(newButton, document.getElementById('addExerciseButton'));

    const activityList = document.getElementById('activityList');
    const newActivityElement = document.createElement('p');
    newActivityElement.id = `${exerciseName}Count`;
    newActivityElement.textContent = `${exerciseName}: 0`;
    activityList.appendChild(newActivityElement);
}

let switchModeActive = false;
let firstSelectedExercise = null;

document.getElementById('switchModeButton').addEventListener('click', function() {
    switchModeActive = !switchModeActive;
    this.classList.toggle('active', switchModeActive);

    if (!switchModeActive) {
        resetSelections(); // Alle Markierungen zurücksetzen, wenn der Switch-Modus deaktiviert wird
    }
});

function selectExerciseForSwitch(exerciseButton) {
    if (!switchModeActive) return;

    if (!firstSelectedExercise) {
        // Wähle das erste Exercise aus
        firstSelectedExercise = exerciseButton;
        exerciseButton.classList.add('selected');
    } else if (firstSelectedExercise === exerciseButton) {
        // Hebe die Auswahl auf, wenn dasselbe Exercise erneut ausgewählt wird
        exerciseButton.classList.remove('selected');
        firstSelectedExercise = null;
    } else {
        // Wenn zwei verschiedene Exercises ausgewählt wurden, tausche sie
        swapExercisePositions(firstSelectedExercise, exerciseButton);

        // Nach dem Tausch die Auswahl zurücksetzen
        clearSelection(); 
    }
}

function clearSelection() {
    // Entferne die 'selected'-Klasse von allen Buttons
    document.querySelectorAll('.exercise-button.selected').forEach(button => {
        button.classList.remove('selected');
    });

    // Setze die Variable zurück, um eine neue Auswahl zu ermöglichen
    firstSelectedExercise = null;
}

function swapExercisePositions(button1, button2) {
    const exerciseButtonsContainer = document.getElementById('exerciseButtons');

    const temp = document.createElement('div');
    exerciseButtonsContainer.insertBefore(temp, button1);
    exerciseButtonsContainer.insertBefore(button1, button2);
    exerciseButtonsContainer.insertBefore(button2, temp);
    exerciseButtonsContainer.removeChild(temp);

    updateExerciseOrderInStorage();

    // Nach dem Tausch die Auswahl von beiden Buttons entfernen
    clearSelection(); 
}

function updateExerciseOrderInStorage() {
    const exerciseButtons = document.querySelectorAll('#exerciseButtons button.exercise-button');
    const newActivityCounts = {};

    exerciseButtons.forEach(button => {
        const exerciseName = button.textContent.replace('Add ', '');
        if (activityCounts[exerciseName]) {
            newActivityCounts[exerciseName] = activityCounts[exerciseName];
        }
    });

    activityCounts = newActivityCounts;
    saveActivityData();
}

function resetSelections() {
    document.querySelectorAll('.exercise-button.selected').forEach(button => {
        button.classList.remove('selected');
    });
    firstSelectedExercise = null;
}




function swapExercisePositions(button1, button2) {
    const exerciseButtonsContainer = document.getElementById('exerciseButtons');

    const temp = document.createElement('div');
    exerciseButtonsContainer.insertBefore(temp, button1);
    exerciseButtonsContainer.insertBefore(button1, button2);
    exerciseButtonsContainer.insertBefore(button2, temp);
    exerciseButtonsContainer.removeChild(temp);

    updateExerciseOrderInStorage();
}

function updateExerciseOrderInStorage() {
    const exerciseButtons = document.querySelectorAll('#exerciseButtons button.exercise-button');
    const newActivityCounts = {};

    exerciseButtons.forEach(button => {
        const exerciseName = button.textContent.replace('Add ', '');
        if (activityCounts[exerciseName]) {
            newActivityCounts[exerciseName] = activityCounts[exerciseName];
        }
    });

    activityCounts = newActivityCounts;
    saveActivityData();
}

function showAddExerciseModal() {
    const exerciseModal = document.getElementById('exerciseModal');
    exerciseModal.style.display = 'block';
}

function showDeleteExerciseModal() {
    const deleteModal = document.getElementById('deleteModal');
    const exerciseDeleteList = document.getElementById('exerciseDeleteList');
    exerciseDeleteList.innerHTML = '';

    for (const exercise in activityCounts) {
        const exerciseButton = document.createElement('button');
        exerciseButton.textContent = exercise;
        exerciseButton.classList.add('exercise-delete-button');
        exerciseButton.onclick = () => {
            exerciseButton.classList.toggle('selected');
            exerciseButton.style.backgroundColor = exerciseButton.classList.contains('selected') ? '#ff4d4d' : '';
        };
        exerciseDeleteList.appendChild(exerciseButton);
    }

    deleteModal.style.display = 'block';
}

function deleteSelectedExercises() {
    const selectedButtons = document.querySelectorAll('.exercise-delete-button.selected');
    selectedButtons.forEach(button => {
        const exerciseName = button.textContent;
        delete activityCounts[exerciseName];

        const buttonElements = document.querySelectorAll('#exerciseButtons button');
        buttonElements.forEach(btn => {
            if (btn.textContent.includes(exerciseName)) {
                btn.remove();
            }
        });

        const activityElement = document.getElementById(`${exerciseName}Count`);
        if (activityElement) {
            activityElement.remove();
        }

        for (let date in dailyActivityLog) {
            if (dailyActivityLog[date][exerciseName]) {
                delete dailyActivityLog[date][exerciseName];
            }
        }

        if (challenges[exerciseName]) {
            delete challenges[exerciseName];
        }
    });

    saveActivityData();
    updateAllStatistics();
    closeModal('deleteModal');
}

function resetTodaysCounts() {
    Object.keys(activityCounts).forEach(activity => {
        activityCounts[activity].count = 0;
    });
    updateActivityList();
    saveActivityData();
}

function updateActivityList() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    Object.keys(activityCounts).forEach(activity => {
        if (!deactivatedExercises.includes(activity)) {
            const activityElement = document.createElement('p');
            activityElement.id = `${activity}Count`;
            activityElement.textContent = `${activity}: ${activityCounts[activity].count}`;
            activityList.appendChild(activityElement);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadActivityData();
    initMusicControls();
    initChallengeControls();
    initActivationControls();
    showWelcomeScreen();
});

function initMusicControls() {
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');

    backgroundMusic.volume = 0.1;

    const isMuted = JSON.parse(localStorage.getItem('musicMuted') || 'false');

    if (isMuted) {
        backgroundMusic.pause();
        musicToggle.classList.add('muted');
    } else {
        backgroundMusic.play();
        musicToggle.classList.remove('muted');
    }

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



function initChallengeControls() {
    const challengeToggle = document.getElementById('challengeToggle');
    challengeToggle.addEventListener('click', () => {
        const challengeModal = document.getElementById('challengeModal');
        updateChallengeList();
        challengeModal.style.display = 'block';
    });
}

function updateChallengeList() {
    const challengeList = document.getElementById('challengeList');
    challengeList.innerHTML = '';

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

        const startDate = new Date(challenge.startDate);
        const today = new Date();
        const timeDiff = today - startDate;
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        const startDateText = `${startDate.toLocaleDateString()} (${daysDiff}d ago)`;

        const challengeElement = document.createElement('div');
        challengeElement.classList.add('challenge-item');
        challengeElement.innerHTML = `
            <div class="progress-circle" style="background-color: ${colors[capitalizeFirstLetter(challenge.rank)]};">
                <span>${progressText}</span>
            </div>
            <div>
                <div class="challenge-name">${exercise} Challenge</div>
                <div class="challenge-rank">Rank: ${challenge.rank}</div>
                <div class="challenge-start-date">Started: ${startDateText}</div>
            </div>
        `;
        challengeList.appendChild(challengeElement);
    }
}

function showAddChallengeModal() {
    const addChallengeModal = document.getElementById('addChallengeModal');
    const exerciseSelection = document.getElementById('exerciseSelection');
    exerciseSelection.innerHTML = '';

    for (const exercise in activityCounts) {
        if (!deactivatedExercises.includes(exercise)) {
            const exerciseButton = document.createElement('button');
            exerciseButton.textContent = exercise;
            exerciseButton.onclick = () => {
                const buttons = exerciseSelection.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('selected'));
                exerciseButton.classList.add('selected');

                const challengeSettings = document.getElementById('challengeSettings');
                challengeSettings.style.display = 'block';
            };
            exerciseSelection.appendChild(exerciseButton);
        }
    }

    addChallengeModal.style.display = 'block';
}

function createChallenge() {
    const selectedButton = document.querySelector('#exerciseSelection button.selected');
    if (!selectedButton) {
        alert('Please select an exercise to start a challenge.');
        return;
    }

    const exercise = selectedButton.textContent.trim();
    const bronzeLevel = parseInt(document.getElementById('bronzeLevel').value);
    const silverLevel = parseInt(document.getElementById('silverLevel').value);
    const goldLevel = parseInt(document.getElementById('goldLevel').value);
    const championLevel = parseInt(document.getElementById('championLevel').value);
    const startDate = new Date();

    challenges[exercise] = {
        rank: 'Bronze',
        progress: 0,
        levels: {
            bronze: bronzeLevel,
            silver: silverLevel,
            gold: goldLevel,
            champion: championLevel
        },
        legendLevel: 0,
        startDate: startDate.toISOString()
    };

    saveActivityData();
    updateChallengeList();
    closeModal('addChallengeModal');
}

function showDeleteChallengeModal() {
    const challengeList = document.getElementById('challengeList');
    challengeList.innerHTML = '';

    for (const exercise in challenges) {
        const challengeButton = document.createElement('button');
        challengeButton.textContent = exercise;
        challengeButton.classList.add('challenge-delete-button');
        challengeButton.onclick = () => {
            challengeButton.classList.toggle('selected');
            challengeButton.style.backgroundColor = challengeButton.classList.contains('selected') ? '#ff4d4d' : '';
        };
        challengeList.appendChild(challengeButton);
    }

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Selected Challenges';
    deleteButton.onclick = deleteSelectedChallenges;

    challengeList.appendChild(deleteButton);
}

function deleteSelectedChallenges() {
    const selectedButtons = document.querySelectorAll('.challenge-delete-button.selected');
    selectedButtons.forEach(button => {
        const exerciseName = button.textContent.trim();
        if (challenges[exerciseName]) {
            delete challenges[exerciseName];
        }
    });

    saveActivityData();
    updateChallengeList();
    closeModal('challengeModal');
}

function showWelcomeScreen() {
    const welcomeModal = document.getElementById('welcomeModal');
    welcomeModal.style.display = 'block';
}

function initActivationControls() {
    const activationToggle = document.getElementById('activationToggle');
    activationToggle.addEventListener('click', () => {
        const activationModal = document.getElementById('activationModal');
        updateActivationList();
        activationModal.style.display = 'block';
    });
}

function updateActivationList() {
    const activationList = document.getElementById('exerciseActivationList');
    activationList.innerHTML = '';

    for (const exercise in activityCounts) {
        const activationButton = document.createElement('button');
        activationButton.textContent = exercise;
        activationButton.classList.add('exercise-activation-button');
        if (deactivatedExercises.includes(exercise)) {
            activationButton.classList.add('deactivated');
        }
        activationButton.onclick = () => {
            activationButton.classList.toggle('selected');
            activationButton.style.backgroundColor = activationButton.classList.contains('selected') ? '#ff4d4d' : '';
        };
        activationList.appendChild(activationButton);
    }
}

function activateSelectedExercises() {
    const selectedButtons = document.querySelectorAll('.exercise-activation-button.selected');
    selectedButtons.forEach(button => {
        const exerciseName = button.textContent.trim();
        const index = deactivatedExercises.indexOf(exerciseName);
        if (index !== -1) {
            deactivatedExercises.splice(index, 1);
            button.classList.remove('deactivated');
        }
    });

    saveActivityData();
    updateActivityList();
    updateAllStatistics();
    closeModal('activationModal');
}

function deactivateSelectedExercises() {
    const selectedButtons = document.querySelectorAll('.exercise-activation-button.selected');
    selectedButtons.forEach(button => {
        const exerciseName = button.textContent.trim();
        if (!deactivatedExercises.includes(exerciseName)) {
            deactivatedExercises.push(exerciseName);
            button.classList.add('deactivated');
        }
    });

    saveActivityData();
    updateActivityList();
    updateAllStatistics();
    closeModal('activationModal');
}







