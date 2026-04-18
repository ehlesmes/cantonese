let appState = {
    activeView: 'dashboard',
    lessons: [],
    currentLessonIndex: 0,
    currentPageIndex: 0,
    scrambledSelection: [],
    results: {},
    completedLessons: {}
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
    const savedState = localStorage.getItem('cantoneseAppStateLinear');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        appState.activeView = parsedState.activeView || 'dashboard';
        appState.currentLessonIndex = parsedState.currentLessonIndex || 0;
        appState.currentPageIndex = parsedState.currentPageIndex || 0;
        appState.results = parsedState.results || {};
        appState.completedLessons = parsedState.completedLessons || {};
    }
}

function saveState() {
    localStorage.setItem('cantoneseAppStateLinear', JSON.stringify({
        activeView: appState.activeView,
        currentLessonIndex: appState.currentLessonIndex,
        currentPageIndex: appState.currentPageIndex,
        results: appState.results,
        completedLessons: appState.completedLessons
    }));
}

function saveResult(isCorrect) {
    if (!appState.results[appState.currentLessonIndex]) {
        appState.results[appState.currentLessonIndex] = {};
    }
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
    } else if (appState.activeView !== 'completion') {
        showCompletion();
    } else {
        goNextLesson();
    }
    saveState();
}

function goNextLesson() {
    if (appState.currentLessonIndex < appState.lessons.length - 1) {
        appState.currentLessonIndex++;
        appState.currentPageIndex = 0;
        appState.activeView = 'lesson';
        appState.results[appState.currentLessonIndex] = {};
        renderCurrentState();
    } else {
        appState.activeView = 'dashboard';
        renderCurrentState();
    }
}

function setupNavigation() {
    document.getElementById('close-btn').addEventListener('click', () => {
        appState.activeView = 'dashboard';
        renderCurrentState();
        saveState();
    });

    document.getElementById('header-restart-btn').addEventListener('click', () => {
        restartLesson();
    });

    document.getElementById('next-btn').addEventListener('click', () => nextStep());
    document.getElementById('start-lesson-btn').addEventListener('click', () => nextStep());
    document.getElementById('learn-continue-btn').addEventListener('click', () => nextStep());
    document.getElementById('scrambled-continue-btn').addEventListener('click', () => nextStep());
    document.getElementById('completion-continue-btn').addEventListener('click', () => nextStep());

    document.getElementById('prev-btn').addEventListener('click', () => {
        if (appState.currentPageIndex > 0) {
            appState.currentPageIndex--;
            renderCurrentState();
        } else if (appState.currentLessonIndex > 0) {
            appState.currentLessonIndex--;
            const prevLesson = appState.lessons[appState.currentLessonIndex];
            appState.currentPageIndex = prevLesson.pages.length - 1;
            renderCurrentState();
        } else {
            appState.activeView = 'dashboard';
            renderCurrentState();
        }
        saveState();
    });
}

function restartLesson() {
    appState.currentPageIndex = 0;
    appState.activeView = 'lesson';
    appState.results[appState.currentLessonIndex] = {};
    renderCurrentState();
    saveState();
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
        renderCurrentState();
    });

    document.getElementById('continue-btn').addEventListener('click', () => {
        nextStep();
    });

    document.getElementById('check-scrambled-btn').addEventListener('click', () => {
        const lesson = appState.lessons[appState.currentLessonIndex];
        const page = lesson.pages[appState.currentPageIndex];
        const result = appState.scrambledSelection.map(s => s.t).join('');
        const statusEl = document.getElementById('scrambled-status');
        
        statusEl.classList.remove('hidden', 'success', 'error');
        const stripPunct = (str) => str.replace(/[。，！？,.!?]/g, '').trim();
        
        if (stripPunct(result) === stripPunct(page.text)) {
            saveResult(true);
            statusEl.textContent = 'Correct! 🎉';
            statusEl.classList.add('success');
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
    document.getElementById('completion-continue-btn').classList.add('hidden');
    document.getElementById('assessment-actions').classList.add('hidden');
    document.getElementById('retry-actions').classList.add('hidden');
    document.getElementById('hint-btn-container').classList.add('hidden');
}

function renderCurrentState() {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    resetFooter();

    if (appState.activeView === 'dashboard') {
        document.getElementById('app-header').classList.add('hidden');
        document.getElementById('app-footer').classList.add('hidden');
        renderDashboard();
        return;
    }

    const lesson = appState.lessons[appState.currentLessonIndex];
    if (!lesson) return;

    if (appState.activeView === 'completion') {
        document.getElementById('app-header').classList.remove('hidden');
        document.getElementById('app-footer').classList.remove('hidden');
        document.getElementById('completion-continue-btn').classList.remove('hidden');
        renderCompletion();
        return;
    }

    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('app-footer').classList.remove('hidden');

    const page = lesson.pages[appState.currentPageIndex];
    if (!page) return;

    const progress = ((appState.currentPageIndex + 1) / lesson.pages.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    if (page.type === 'intro') renderIntro(page);
    else if (page.type === 'learn') renderLearn(page);
    else if (page.type === 'practice') renderPractice(page);
}

function renderDashboard() {
    const dashView = document.getElementById('dashboard-view');
    dashView.classList.remove('hidden');
    dashView.innerHTML = `<h1 style="color: #e8491d; text-align: center; margin-bottom: 2rem;">Cantonese Learning App</h1>`;
    const grouped = {};
    appState.lessons.forEach((l, idx) => {
        const level = l.level || 'A1';
        if (!grouped[level]) grouped[level] = [];
        grouped[level].push({ ...l, index: idx });
    });
    Object.keys(grouped).forEach(level => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'level-group';
        groupDiv.innerHTML = `<h2 class="level-header">Level ${level}</h2>`;
        grouped[level].forEach((lesson) => {
            const isCompleted = appState.completedLessons[lesson.index];
            const isInProgress = !isCompleted && appState.currentLessonIndex === lesson.index && appState.currentPageIndex > 0;
            let actionHtml = `<button class="action-btn start-lesson-btn" data-index="${lesson.index}">Start</button>`;
            let statusHtml = "Not Started";
            if (isCompleted) {
                actionHtml = `<button class="secondary-btn review-lesson-btn" data-index="${lesson.index}">Review</button>`;
                statusHtml = "✅ Completed";
            } else if (isInProgress) {
                actionHtml = `<button class="action-btn continue-lesson-btn" data-index="${lesson.index}">Continue</button>`;
                statusHtml = "⏳ In Progress";
            }
            const card = document.createElement('div');
            card.className = "lesson-card";
            card.innerHTML = `<div class="lesson-info"><h3>${lesson.index + 1} - ${lesson.title}</h3><p>${statusHtml}</p></div><div class="lesson-action">${actionHtml}</div>`;
            groupDiv.appendChild(card);
        });
        dashView.appendChild(groupDiv);
    });
    dashView.querySelectorAll('.start-lesson-btn, .review-lesson-btn, .continue-lesson-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index, 10);
            appState.currentLessonIndex = idx;
            if (e.target.classList.contains('start-lesson-btn') || e.target.classList.contains('review-lesson-btn')) {
                appState.currentPageIndex = 0;
                appState.results[idx] = {};
            }
            appState.activeView = 'lesson';
            renderCurrentState();
            saveState();
        });
    });
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
        btn.innerHTML = `<span class="token-text">${token.t}</span><span class="token-romanization">${token.r}</span>`;
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
        btn.innerHTML = `<span class="token-text">${token.t}</span><span class="token-romanization">${token.r}</span>`;
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
    appState.completedLessons[appState.currentLessonIndex] = true;
    appState.activeView = 'completion';
    renderCurrentState();
    saveState();
}

function renderCompletion() {
    const lesson = appState.lessons[appState.currentLessonIndex];
    const results = appState.results[appState.currentLessonIndex] || {};
    document.getElementById('completion-view').classList.remove('hidden');
    let correctCount = 0;
    let wrongCount = 0;
    let correctHtml = '';
    let wrongHtml = '';
    lesson.pages.forEach((page, idx) => {
        if (page.type !== 'practice') return;
        const isCorrect = results[idx] === true;
        const itemHtml = `<div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;"><div style="font-weight: bold;">Practice Example</div><div style="color: #666; font-size: 0.9rem;">${page.text}</div><div style="color: #666; font-size: 0.9rem; font-style: italic;">${page.translation}</div></div>`;
        if (isCorrect) {
            correctCount++;
            correctHtml += itemHtml;
        } else if (results[idx] === false) {
            wrongCount++;
            wrongHtml += itemHtml;
        }
    });
    document.getElementById('completion-stats').innerHTML = `<div style="display: flex; gap: 2rem; text-align: left; justify-content: center; align-items: flex-start; flex-wrap: wrap;"><div style="flex: 1; min-width: 250px; background: #fed7d7; padding: 1.5rem; border-radius: 8px; border: 1px solid #feb2b2;"><h3 style="color: #822727; margin-top: 0; display: flex; justify-content: space-between;"><span>Review</span> <span>${wrongCount}</span></h3>${wrongHtml || '<p style="color: #666; font-style: italic;">None!</p>'}</div><div style="flex: 1; min-width: 250px; background: #c6f6d5; padding: 1.5rem; border-radius: 8px; border: 1px solid #9ae6b4;"><h3 style="color: #22543d; margin-top: 0; display: flex; justify-content: space-between;"><span>Mastered</span> <span>${correctCount}</span></h3>${correctHtml || '<p style="color: #666; font-style: italic;">None!</p>'}</div></div>`;
}

document.addEventListener('DOMContentLoaded', initApp);
