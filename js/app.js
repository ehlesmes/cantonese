let appState = {
    lessons: [],
    currentLessonIndex: 0,
    currentExerciseIndex: 0,
    scrambledSelection: [],
    results: {}
};

async function initApp() {
    const loadingState = document.getElementById('loading-state');
    const appElement = document.getElementById('app');
    
    try {
        loadingState.classList.remove('hidden');
        appElement.classList.add('hidden');
        
        const response = await fetch('data/content.json');
        if (!response.ok) {
            throw new Error('Failed to fetch content');
        }
        appState.lessons = await response.json();
        
        loadState();
        setupNavigation();
        setupAudio();
        setupExerciseActions();
        renderCurrentState();
        
        loadingState.classList.add('hidden');
        appElement.classList.remove('hidden');
    } catch (error) {
        console.error("Error initializing app:", error);
        loadingState.textContent = "Error loading content. Please try again later.";
    }
}

function setupAudio() {
    const playBtn = document.getElementById('play-btn');
    const audioPlayer = document.getElementById('audio-player');
    
    playBtn.addEventListener('click', () => {
        audioPlayer.play();
    });
}

function loadState() {
    const savedState = localStorage.getItem('cantoneseAppState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        appState.currentLessonIndex = parsedState.currentLessonIndex || 0;
        appState.currentExerciseIndex = parsedState.currentExerciseIndex || 0;
        appState.results = parsedState.results || {};
    }
}

function saveState() {
    localStorage.setItem('cantoneseAppState', JSON.stringify({
        currentLessonIndex: appState.currentLessonIndex,
        currentExerciseIndex: appState.currentExerciseIndex,
        results: appState.results
    }));
}

function saveResult(isCorrect) {
    if (!appState.results[appState.currentLessonIndex]) {
        appState.results[appState.currentLessonIndex] = [];
    }
    // Prevent a 'true' from overwriting an earlier 'false' for this specific session
    if (appState.results[appState.currentLessonIndex][appState.currentExerciseIndex] === false && isCorrect) {
        return;
    }
    appState.results[appState.currentLessonIndex][appState.currentExerciseIndex] = isCorrect;
}

function setupExerciseActions() {
    document.getElementById('hint-btn').addEventListener('click', () => {
        const section = document.getElementById('translation-section');
        const lesson = appState.lessons[appState.currentLessonIndex];
        const exercise = lesson.exercises[appState.currentExerciseIndex];

        if (exercise.type === 'scrambled') {
            const existing = document.getElementById('scrambled-hint');
            if (existing) {
                existing.remove();
            } else {
                const hintDiv = document.createElement('div');
                hintDiv.id = 'scrambled-hint';
                hintDiv.innerHTML = `<p style="color: #666; font-size: 1.4rem; font-style: italic; margin: 1rem 0;">Answer: ${exercise.text}</p>`;
                document.getElementById('english-prompt').insertAdjacentElement('afterend', hintDiv);
            }
        } else {
            if (section.classList.contains('hidden')) {
                section.classList.remove('hidden');
                document.getElementById('english-translation').classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        }
    });

    document.getElementById('correct-btn').addEventListener('click', () => {
        saveResult(true);
        nextStep();
    });
    
    document.getElementById('incorrect-btn').addEventListener('click', () => {
        saveResult(false);
        nextStep(); // Revert back to continuing immediately for regular exercises
    });

    document.getElementById('retry-btn').addEventListener('click', () => {
        renderCurrentState(); // Resets the exercise
    });

    document.getElementById('continue-btn').addEventListener('click', () => {
        nextStep();
    });

    document.getElementById('scrambled-continue-btn').addEventListener('click', () => {
        nextStep();
    });

    document.getElementById('check-scrambled-btn').addEventListener('click', () => {
        const lesson = appState.lessons[appState.currentLessonIndex];
        const exercise = lesson.exercises[appState.currentExerciseIndex];
        const result = appState.scrambledSelection.map(s => s.t).join('');
        const statusEl = document.getElementById('scrambled-status');
        
        statusEl.classList.remove('hidden', 'success', 'error');
        
        // Strip punctuation for comparison
        const stripPunct = (str) => str.replace(/[。，！？,.!?]/g, '').trim();
        
        if (stripPunct(result) === stripPunct(exercise.text)) {
            // Only award 'true' if they got it right on the first try (no prior false)
            saveResult(true);
            statusEl.textContent = 'Correct! 🎉';
            statusEl.classList.add('success');
            
            // UI Transition: Hide scrambled UI, show reading/audio UI
            document.getElementById('scrambled-display').classList.add('hidden');
            document.getElementById('exercise-prompt').classList.add('hidden');
            document.getElementById('reading-display').classList.remove('hidden');
            document.getElementById('translation-section').classList.remove('hidden');
            document.getElementById('english-translation').classList.remove('hidden');
            
            // Hide assessment and retry actions, show single continue button
            document.getElementById('assessment-actions').classList.add('hidden');
            document.getElementById('retry-actions').classList.add('hidden');
            document.getElementById('continue-action').classList.remove('hidden');
            
            // Remove hint if visible
            const hint = document.getElementById('scrambled-hint');
            if (hint) hint.remove();
        } else {
            // First time they get it wrong, it marks as false
            saveResult(false);
            statusEl.textContent = 'Try again!';
            statusEl.classList.add('error');
            
            // Hide Check Answer button, show Retry/Continue prompt
            document.getElementById('check-scrambled-btn').classList.add('hidden');
            document.getElementById('retry-actions').classList.remove('hidden');
        }
    });
}

function nextStep() {
    const lesson = appState.lessons[appState.currentLessonIndex];
    if (appState.currentExerciseIndex < lesson.exercises.length - 1) {
        appState.currentExerciseIndex++;
        renderCurrentState();
    } else {
        showCompletion();
    }
    saveState();
}

function showCompletion() {
    document.getElementById('completion-overlay').classList.remove('hidden');
    
    const lesson = appState.lessons[appState.currentLessonIndex];
    const results = appState.results[appState.currentLessonIndex] || [];
    
    let correctCount = 0;
    let wrongCount = 0;
    
    let correctHtml = '';
    let wrongHtml = '';
    
    lesson.exercises.forEach((ex, idx) => {
        const isCorrect = results[idx] === true;
        
        const itemHtml = `<div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold;">Exercise ${idx + 1}</div>
            <div style="color: #666; font-size: 0.9rem;">${ex.text}</div>
            <div style="color: #666; font-size: 0.9rem; font-style: italic;">${ex.translation}</div>
        </div>`;
        
        if (isCorrect) {
            correctCount++;
            correctHtml += itemHtml;
        } else if (results[idx] === false) {
            wrongCount++;
            wrongHtml += itemHtml;
        }
    });
    
    document.getElementById('completion-stats').innerHTML = `
        <div style="display: flex; gap: 2rem; text-align: left; justify-content: center; align-items: flex-start; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px; background: #fed7d7; padding: 1.5rem; border-radius: 8px; border: 1px solid #feb2b2;">
                <h3 style="color: #822727; margin-top: 0; display: flex; justify-content: space-between;">
                    <span>Review</span> <span>${wrongCount}</span>
                </h3>
                ${wrongHtml || '<p style="color: #666; font-style: italic;">None!</p>'}
            </div>
            <div style="flex: 1; min-width: 250px; background: #c6f6d5; padding: 1.5rem; border-radius: 8px; border: 1px solid #9ae6b4;">
                <h3 style="color: #22543d; margin-top: 0; display: flex; justify-content: space-between;">
                    <span>Mastered</span> <span>${correctCount}</span>
                </h3>
                ${correctHtml || '<p style="color: #666; font-style: italic;">None!</p>'}
            </div>
        </div>
    `;
}

function hideCompletion() {
    document.getElementById('completion-overlay').classList.add('hidden');
}

function setupNavigation() {
    document.getElementById('next-btn').addEventListener('click', () => nextStep());

    document.getElementById('prev-btn').addEventListener('click', () => {
        if (appState.currentExerciseIndex > 0) {
            appState.currentExerciseIndex--;
            renderCurrentState();
        } else if (appState.currentLessonIndex > 0) {
            appState.currentLessonIndex--;
            const prevLesson = appState.lessons[appState.currentLessonIndex];
            appState.currentExerciseIndex = prevLesson.exercises.length - 1;
            renderCurrentState();
        }
        saveState();
    });

    document.getElementById('next-lesson-btn').addEventListener('click', () => {
        if (appState.currentLessonIndex < appState.lessons.length - 1) {
            appState.currentLessonIndex++;
            appState.currentExerciseIndex = 0;
            hideCompletion();
            renderCurrentState();
            saveState();
        }
    });

    document.getElementById('restart-lesson-btn').addEventListener('click', () => {
        appState.currentExerciseIndex = 0;
        appState.results[appState.currentLessonIndex] = []; // Clear results for review
        hideCompletion();
        renderCurrentState();
        saveState();
    });
}

function renderCurrentState() {
    const lesson = appState.lessons[appState.currentLessonIndex];
    if (!lesson) return;

    // Reset UI states
    document.getElementById('translation-section').classList.add('hidden');
    document.getElementById('reading-display').classList.add('hidden');
    document.getElementById('scrambled-display').classList.add('hidden');
    document.getElementById('exercise-prompt').classList.add('hidden');
    document.getElementById('scrambled-status').classList.add('hidden');
    document.getElementById('retry-actions').classList.add('hidden');
    document.getElementById('continue-action').classList.add('hidden');
    document.getElementById('assessment-actions').classList.remove('hidden');
    document.getElementById('check-scrambled-btn').classList.remove('hidden');
    
    const existingHint = document.getElementById('scrambled-hint');
    if (existingHint) existingHint.remove();
    
    appState.scrambledSelection = [];

    // Render Lesson Meta
    document.getElementById('lesson-title').textContent = lesson.title;
    document.getElementById('lesson-goal').textContent = lesson.goal;
    document.getElementById('grammar-content').textContent = lesson.grammar;
    document.getElementById('culture-content').textContent = lesson.culture;

    const vocabList = document.getElementById('vocabulary-list');
    vocabList.innerHTML = '';
    lesson.vocabulary.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="vocab-term">${item.term}</span>
            <span class="vocab-romanization">${item.romanization}</span>
            <span class="vocab-meaning">${item.meaning}</span>
        `;
        vocabList.appendChild(li);
    });

    // Render Current Exercise
    const exercise = lesson.exercises[appState.currentExerciseIndex];
    document.getElementById('exercise-number').textContent = `${appState.currentExerciseIndex + 1} / ${lesson.exercises.length}`;
    document.getElementById('english-translation').textContent = exercise.translation;

    // Always populate reading content so it's ready if revealed
    document.getElementById('chinese-text').textContent = exercise.text;
    document.getElementById('romanization').textContent = exercise.romanization;

    if (exercise.type === 'scrambled') {
        renderScrambled(exercise);
        // Hide assessment actions for scrambled until solved
        document.getElementById('assessment-actions').classList.add('hidden');
    } else {
        renderReading(exercise);
        document.getElementById('assessment-actions').classList.remove('hidden');
    }

    const progress = ((appState.currentExerciseIndex + 1) / lesson.exercises.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.src = exercise.audio;
    audioPlayer.load();
}

function renderReading(exercise) {
    document.getElementById('reading-display').classList.remove('hidden');
    document.getElementById('chinese-text').textContent = exercise.text;
    document.getElementById('romanization').textContent = exercise.romanization;
}

function renderScrambled(exercise) {
    document.getElementById('scrambled-display').classList.remove('hidden');
    document.getElementById('exercise-prompt').classList.remove('hidden');
    document.getElementById('english-prompt').textContent = exercise.translation;
    
    const slots = document.getElementById('scrambled-slots');
    const options = document.getElementById('scrambled-options');
    slots.innerHTML = '';
    options.innerHTML = '';

    // Shuffle tokens
    const shuffled = [...exercise.tokens].sort(() => Math.random() - 0.5);
    
    shuffled.forEach((token, index) => {
        const btn = document.createElement('div');
        btn.className = 'token';
        btn.innerHTML = `
            <span class="token-text">${token.t}</span>
            <span class="token-romanization">${token.r}</span>
        `;
        btn.dataset.index = index;
        btn.addEventListener('click', () => {
            if (!btn.classList.contains('selected')) {
                btn.classList.add('selected');
                appState.scrambledSelection.push(token);
                updateScrambledSlots();
            }
        });
        options.appendChild(btn);
    });
}

function updateScrambledSlots() {
    const slots = document.getElementById('scrambled-slots');
    slots.innerHTML = '';
    appState.scrambledSelection.forEach((token, idx) => {
        const btn = document.createElement('div');
        btn.className = 'token';
        btn.innerHTML = `
            <span class="token-text">${token.t}</span>
            <span class="token-romanization">${token.r}</span>
        `;
        btn.addEventListener('click', () => {
            appState.scrambledSelection.splice(idx, 1);
            // Reset option state
            document.querySelectorAll('#scrambled-options .token').forEach(opt => {
                const optText = opt.querySelector('.token-text').textContent;
                if (optText === token.t && opt.classList.contains('selected')) {
                    opt.classList.remove('selected');
                }
            });
            updateScrambledSlots();
        });
        slots.appendChild(btn);
    });
}

document.addEventListener('DOMContentLoaded', initApp);
