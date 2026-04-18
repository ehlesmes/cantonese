let appState = {
    lessons: [],
    currentLessonIndex: 0,
    currentPageIndex: 0,
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
        document.getElementById('app-header').classList.remove('hidden');
        document.getElementById('app-footer').classList.remove('hidden');
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
    const savedState = localStorage.getItem('cantoneseAppStateLinear');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        appState.currentLessonIndex = parsedState.currentLessonIndex || 0;
        appState.currentPageIndex = parsedState.currentPageIndex || 0;
        appState.results = parsedState.results || {};
    }
}

function saveState() {
    localStorage.setItem('cantoneseAppStateLinear', JSON.stringify({
        currentLessonIndex: appState.currentLessonIndex,
        currentPageIndex: appState.currentPageIndex,
        results: appState.results
    }));
}

function saveResult(isCorrect) {
    if (!appState.results[appState.currentLessonIndex]) {
        appState.results[appState.currentLessonIndex] = {};
    }
    // Prevent true overwriting an earlier false for this specific page
    if (appState.results[appState.currentLessonIndex][appState.currentPageIndex] === false && isCorrect) {
        return;
    }
    appState.results[appState.currentLessonIndex][appState.currentPageIndex] = isCorrect;
}

function nextStep() {
    const lesson = appState.lessons[appState.currentLessonIndex];
    if (appState.currentPageIndex < lesson.pages.length - 1) {
        appState.currentPageIndex++;
        renderCurrentState();
    } else {
        showCompletion();
    }
    saveState();
}

function setupNavigation() {
    // Top-level Navigation elements
    document.getElementById('next-btn').addEventListener('click', () => nextStep());
    document.getElementById('start-lesson-btn').addEventListener('click', () => nextStep());
    document.getElementById('learn-continue-btn').addEventListener('click', () => nextStep());

    document.getElementById('prev-btn').addEventListener('click', () => {
        if (appState.currentPageIndex > 0) {
            appState.currentPageIndex--;
            renderCurrentState();
        } else if (appState.currentLessonIndex > 0) {
            appState.currentLessonIndex--;
            const prevLesson = appState.lessons[appState.currentLessonIndex];
            appState.currentPageIndex = prevLesson.pages.length - 1;
            renderCurrentState();
        }
        saveState();
    });

    document.getElementById('next-lesson-btn').addEventListener('click', () => {
        if (appState.currentLessonIndex < appState.lessons.length - 1) {
            appState.currentLessonIndex++;
            appState.currentPageIndex = 0;
            hideCompletion();
            renderCurrentState();
            saveState();
        }
    });

    document.getElementById('restart-lesson-btn').addEventListener('click', () => {
        appState.currentPageIndex = 0;
        appState.results[appState.currentLessonIndex] = {}; // Clear results for review
        hideCompletion();
        renderCurrentState();
        saveState();
    });
}

function setupExerciseActions() {
    document.getElementById('hint-btn').addEventListener('click', () => {
        const section = document.getElementById('translation-section');
        const lesson = appState.lessons[appState.currentLessonIndex];
        const page = lesson.pages[appState.currentPageIndex];

        if (page.exerciseType === 'scrambled') {
            const existing = document.getElementById('scrambled-hint');
            if (existing) {
                existing.remove();
            } else {
                const hintDiv = document.createElement('div');
                hintDiv.id = 'scrambled-hint';
                hintDiv.innerHTML = `<p style="color: #666; font-size: 1.4rem; font-style: italic; margin: 1rem 0;">Answer: ${page.text}</p>`;
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
        nextStep();
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
        const page = lesson.pages[appState.currentPageIndex];
        const result = appState.scrambledSelection.map(s => s.t).join('');
        const statusEl = document.getElementById('scrambled-status');
        
        statusEl.classList.remove('hidden', 'success', 'error');
        
        // Strip punctuation for comparison
        const stripPunct = (str) => str.replace(/[。，！？,.!?]/g, '').trim();
        
        if (stripPunct(result) === stripPunct(page.text)) {
            saveResult(true);
            statusEl.textContent = 'Correct! 🎉';
            statusEl.classList.add('success');
            
            // Transition UI
            document.getElementById('scrambled-display').classList.add('hidden');
            document.getElementById('reading-display').classList.remove('hidden');
            document.getElementById('translation-section').classList.remove('hidden');
            document.getElementById('english-translation').classList.remove('hidden');
            
            document.getElementById('assessment-actions').classList.add('hidden');
            document.getElementById('retry-actions').classList.add('hidden');
            document.getElementById('check-scrambled-btn').classList.add('hidden');
            document.getElementById('scrambled-continue-btn').classList.remove('hidden');
            
            const hint = document.getElementById('scrambled-hint');
            if (hint) hint.remove();
        } else {
            saveResult(false);
            statusEl.textContent = 'Try again!';
            statusEl.classList.add('error');
            
            document.getElementById('check-scrambled-btn').classList.add('hidden');
            document.getElementById('retry-actions').classList.remove('hidden');
        }
    });
}

function resetFooter() {
    document.getElementById('start-lesson-btn').classList.add('hidden');
    document.getElementById('learn-continue-btn').classList.add('hidden');
    document.getElementById('check-scrambled-btn').classList.add('hidden');
    document.getElementById('scrambled-continue-btn').classList.add('hidden');
    document.getElementById('assessment-actions').classList.add('hidden');
    document.getElementById('retry-actions').classList.add('hidden');
    document.getElementById('hint-btn-container').classList.add('hidden');
}

function renderCurrentState() {
    const lesson = appState.lessons[appState.currentLessonIndex];
    if (!lesson) return;

    const page = lesson.pages[appState.currentPageIndex];
    if (!page) return;

    // Hide all views first
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    resetFooter();

    // Update Progress Bar
    const progress = ((appState.currentPageIndex + 1) / lesson.pages.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    // Render based on type
    if (page.type === 'intro') {
        renderIntro(page);
    } else if (page.type === 'learn') {
        renderLearn(page);
    } else if (page.type === 'practice') {
        renderPractice(page);
    }
}

function renderIntro(page) {
    document.getElementById('intro-view').classList.remove('hidden');
    document.getElementById('intro-title').textContent = page.title;
    document.getElementById('intro-goal').textContent = page.goal;
    document.getElementById('start-lesson-btn').classList.remove('hidden');
}

function renderLearn(page) {
    document.getElementById('learn-view').classList.remove('hidden');
    document.getElementById('learn-title').textContent = page.title;
    document.getElementById('learn-content').innerHTML = page.contentHtml || '';
    document.getElementById('learn-continue-btn').classList.remove('hidden');
}

function renderPractice(page) {
    document.getElementById('practice-view').classList.remove('hidden');
    
    // Reset internal states
    document.getElementById('translation-section').classList.add('hidden');
    document.getElementById('reading-display').classList.add('hidden');
    document.getElementById('scrambled-display').classList.add('hidden');
    document.getElementById('scrambled-status').classList.add('hidden');
    
    const existingHint = document.getElementById('scrambled-hint');
    if (existingHint) existingHint.remove();
    appState.scrambledSelection = [];

    document.getElementById('english-translation').textContent = page.translation;
    document.getElementById('chinese-text').textContent = page.text;
    document.getElementById('romanization').textContent = page.romanization;

    document.getElementById('hint-btn-container').classList.remove('hidden');

    if (page.exerciseType === 'scrambled') {
        renderScrambled(page);
        document.getElementById('check-scrambled-btn').classList.remove('hidden');
    } else {
        renderReading(page);
        document.getElementById('assessment-actions').classList.remove('hidden');
    }

    const audioPlayer = document.getElementById('audio-player');
    if (page.audio) {
        audioPlayer.src = page.audio;
        audioPlayer.load();
    }
}

function renderReading(page) {
    document.getElementById('reading-display').classList.remove('hidden');
}

function renderScrambled(page) {
    document.getElementById('scrambled-display').classList.remove('hidden');
    document.getElementById('english-prompt').textContent = page.translation;
    
    const slots = document.getElementById('scrambled-slots');
    const options = document.getElementById('scrambled-options');
    slots.innerHTML = '';
    options.innerHTML = '';

    const shuffled = [...page.tokens].sort(() => Math.random() - 0.5);
    
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

function showCompletion() {
    document.getElementById('completion-overlay').classList.remove('hidden');
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('app-footer').classList.add('hidden');
    
    const lesson = appState.lessons[appState.currentLessonIndex];
    const results = appState.results[appState.currentLessonIndex] || {};
    
    let correctCount = 0;
    let wrongCount = 0;
    
    let correctHtml = '';
    let wrongHtml = '';
    
    lesson.pages.forEach((page, idx) => {
        // Only practice pages are graded
        if (page.type !== 'practice') return;
        
        const isCorrect = results[idx] === true;
        
        const itemHtml = `<div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold;">${page.text}</div>
            <div style="color: #666; font-size: 0.9rem; font-style: italic;">${page.translation}</div>
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
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('app-footer').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', initApp);
