let appState = {
    lessons: [],
    currentLessonIndex: 0,
    currentExerciseIndex: 0,
    scrambledSelection: []
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
    }
}

function saveState() {
    localStorage.setItem('cantoneseAppState', JSON.stringify({
        currentLessonIndex: appState.currentLessonIndex,
        currentExerciseIndex: appState.currentExerciseIndex
    }));
}

function setupExerciseActions() {
    document.getElementById('hint-btn').addEventListener('click', () => {
        const section = document.getElementById('translation-section');
        const lesson = appState.lessons[appState.currentLessonIndex];
        const exercise = lesson.exercises[appState.currentExerciseIndex];

        if (section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            // If it's a scrambled exercise, show the target text as a hint
            if (exercise.type === 'scrambled') {
                const hintDiv = document.createElement('div');
                hintDiv.id = 'scrambled-hint';
                hintDiv.innerHTML = `<p style="color: #666; font-style: italic;">Answer: ${exercise.text}</p>`;
                
                // Remove existing hint if any
                const existing = document.getElementById('scrambled-hint');
                if (existing) existing.remove();
                
                document.getElementById('translation-section').prepend(hintDiv);
            }
        } else {
            section.classList.add('hidden');
        }
    });

    document.getElementById('correct-btn').addEventListener('click', () => nextStep());
    document.getElementById('incorrect-btn').addEventListener('click', () => nextStep());

    document.getElementById('check-scrambled-btn').addEventListener('click', () => {
        const lesson = appState.lessons[appState.currentLessonIndex];
        const exercise = lesson.exercises[appState.currentExerciseIndex];
        const result = appState.scrambledSelection.map(s => s.t).join('');
        const statusEl = document.getElementById('scrambled-status');
        
        statusEl.classList.remove('hidden', 'success', 'error');
        
        // Strip punctuation for comparison
        const stripPunct = (str) => str.replace(/[。，！？,.!?]/g, '').trim();
        
        if (stripPunct(result) === stripPunct(exercise.text)) {
            statusEl.textContent = 'Correct! 🎉';
            statusEl.classList.add('success');
            document.getElementById('reading-display').classList.remove('hidden');
            document.getElementById('translation-section').classList.remove('hidden');
        } else {
            statusEl.textContent = 'Try again!';
            statusEl.classList.add('error');
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

    if (exercise.type === 'scrambled') {
        renderScrambled(exercise);
    } else {
        renderReading(exercise);
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
