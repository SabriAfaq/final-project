// script.js
const StorageManager = {
    CAPSULES_KEY: 'pocketClassroom_capsules',
    PROGRESS_KEY: 'pocketClassroom_progress',
    NOTES_KEY: 'pocketClassroom_notes',

    getCapsules() {
        const data = localStorage.getItem(this.CAPSULES_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveCapsules(capsules) {
        localStorage.setItem(this.CAPSULES_KEY, JSON.stringify(capsules));
    },

    getProgress() {
        const data = localStorage.getItem(this.PROGRESS_KEY);
        return data ? JSON.parse(data) : {};
    },

    saveProgress(progress) {
        localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progress));
    },

    getNotes() {
        const data = localStorage.getItem(this.NOTES_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveNotes(notes) {
        localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
    }
};

const CapsuleManager = {
        capsules: [],
        currentCapsule: null,
        autoSaveTimeout: null,

        init() {
            this.capsules = StorageManager.getCapsules();
            this.renderCapsules();
            this.attachEventListeners();
            this.initNavigation();
            this.initUIEffects();
        },

        initNavigation() {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const navLinks = document.querySelectorAll('.nav-link');

            navLinks.forEach(link => {
                const linkHref = link.getAttribute('href');
                if (linkHref === currentPage) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        },

        initUIEffects() {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-10px)';
                    this.style.transition = 'transform 0.3s ease';
                });

                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });

            const socialIcons = document.querySelectorAll('footer i');
            socialIcons.forEach(icon => {
                icon.addEventListener('click', function() {
                    const platform = this.classList[1];
                    let url = '#';

                    switch (platform) {
                        case 'bi-facebook':
                            url = 'https://facebook.com';
                            break;
                        case 'bi-instagram':
                            url = 'https://instagram.com';
                            break;
                        case 'bi-linkedin':
                            url = 'https://linkedin.com';
                            break;
                        case 'bi-twitter-x':
                            url = 'https://twitter.com';
                            break;
                    }

                    window.open(url, '_blank');
                });
            });
        },

        attachEventListeners() {
            const newCapsuleBtn = document.getElementById('btnNewCapsule');
            const importCapsuleBtn = document.getElementById('btnImportCapsule');
            const fileImport = document.getElementById('fileImport');
            const saveCapsuleBtn = document.getElementById('saveCapsule');
            const capsuleType = document.getElementById('capsuleType');

            if (newCapsuleBtn) newCapsuleBtn.addEventListener('click', () => this.openNewCapsuleModal());
            if (importCapsuleBtn) importCapsuleBtn.addEventListener('click', () => fileImport ? .click());
            if (fileImport) fileImport.addEventListener('change', (e) => this.importCapsule(e));
            if (saveCapsuleBtn) saveCapsuleBtn.addEventListener('click', () => this.saveCapsule());
            if (capsuleType) capsuleType.addEventListener('change', (e) => this.renderContentForm(e.target.value));

            document.addEventListener('click', (e) => {
                if (e.target.closest('.btn-learn')) {
                    const id = e.target.closest('.btn-learn').dataset.id;
                    this.openLearnMode(id);
                }
                if (e.target.closest('.btn-edit')) {
                    const id = e.target.closest('.btn-edit').dataset.id;
                    this.editCapsule(id);
                }
                if (e.target.closest('.btn-delete')) {
                    const id = e.target.closest('.btn-delete').dataset.id;
                    this.deleteCapsule(id);
                }
                if (e.target.closest('.btn-export')) {
                    const id = e.target.closest('.btn-export').dataset.id;
                    this.exportCapsule(id);
                }
            });
        },

        openNewCapsuleModal() {
            this.currentCapsule = null;
            document.getElementById('capsuleForm').reset();
            document.getElementById('contentArea').innerHTML = '';
            document.getElementById('capsuleModalLabel').textContent = 'Create New Capsule';
            const modal = new bootstrap.Modal(document.getElementById('capsuleModal'));
            modal.show();
        },

        renderContentForm(type) {
            const contentArea = document.getElementById('contentArea');

            if (!type) {
                contentArea.innerHTML = '';
                return;
            }

            let html = '';

            if (type === 'notes') {
                html = `
                <div class="mb-3">
                    <label class="form-label">Notes Content *</label>
                    <textarea class="form-control" id="notesContent" rows="8" required placeholder="Write your notes here..."></textarea>
                </div>
            `;
            } else if (type === 'flashcards') {
                html = `
                <div class="mb-3">
                    <label class="form-label">Flashcards</label>
                    <div id="flashcardsContainer"></div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="CapsuleManager.addFlashcard()">
                        <i class="bi bi-plus"></i> Add Flashcard
                    </button>
                </div>
            `;
            } else if (type === 'quiz') {
                html = `
                <div class="mb-3">
                    <label class="form-label">Quiz Questions</label>
                    <div id="quizContainer"></div>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="CapsuleManager.addQuizQuestion()">
                        <i class="bi bi-plus"></i> Add Question
                    </button>
                </div>
            `;
            }

            contentArea.innerHTML = html;

            if (this.currentCapsule && this.currentCapsule.type === type) {
                if (type === 'notes') {
                    document.getElementById('notesContent').value = this.currentCapsule.content || '';
                } else if (type === 'flashcards') {
                    this.currentCapsule.content.forEach(() => this.addFlashcard());
                    this.currentCapsule.content.forEach((fc, i) => {
                        document.querySelectorAll('.flashcard-front-input')[i].value = fc.front;
                        document.querySelectorAll('.flashcard-back-input')[i].value = fc.back;
                    });
                } else if (type === 'quiz') {
                    this.currentCapsule.content.forEach(() => this.addQuizQuestion());
                    this.currentCapsule.content.forEach((q, i) => {
                        document.querySelectorAll('.quiz-question-input')[i].value = q.question;
                        q.options.forEach((opt, j) => {
                            document.querySelectorAll(`.quiz-options-${i} input`)[j].value = opt;
                        });
                        document.querySelectorAll('.quiz-correct-input')[i].value = q.correct;
                    });
                }
            }

            if (type === 'flashcards' && (!this.currentCapsule || this.currentCapsule.content.length === 0)) {
                this.addFlashcard();
            }
            if (type === 'quiz' && (!this.currentCapsule || this.currentCapsule.content.length === 0)) {
                this.addQuizQuestion();
            }
        },

        addFlashcard() {
            const container = document.getElementById('flashcardsContainer');
            const index = container.children.length;
            const html = `
            <div class="flashcard-item border p-3 mb-3 rounded">
                <div class="mb-2">
                    <input type="text" class="form-control form-control-sm flashcard-front-input" placeholder="Front (Question)" required>
                </div>
                <div class="mb-2">
                    <input type="text" class="form-control form-control-sm flashcard-back-input" placeholder="Back (Answer)" required>
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                    <i class="bi bi-trash"></i> Remove
                </button>
            </div>
        `;
            container.insertAdjacentHTML('beforeend', html);
        },

        addQuizQuestion() {
            const container = document.getElementById('quizContainer');
            const index = container.children.length;
            const html = `
            <div class="quiz-item border p-3 mb-3 rounded">
                <div class="mb-2">
                    <input type="text" class="form-control form-control-sm quiz-question-input" placeholder="Question" required>
                </div>
                <div class="mb-2 quiz-options-${index}">
                    <input type="text" class="form-control form-control-sm mb-1" placeholder="Option 1" required>
                    <input type="text" class="form-control form-control-sm mb-1" placeholder="Option 2" required>
                    <input type="text" class="form-control form-control-sm mb-1" placeholder="Option 3" required>
                    <input type="text" class="form-control form-control-sm mb-1" placeholder="Option 4" required>
                </div>
                <div class="mb-2">
                    <select class="form-select form-select-sm quiz-correct-input" required>
                        <option value="">Correct answer...</option>
                        <option value="0">Option 1</option>
                        <option value="1">Option 2</option>
                        <option value="2">Option 3</option>
                        <option value="3">Option 4</option>
                    </select>
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                    <i class="bi bi-trash"></i> Remove
                </button>
            </div>
        `;
            container.insertAdjacentHTML('beforeend', html);
        },

        saveCapsule() {
            const title = document.getElementById('capsuleTitle').value.trim();
            const description = document.getElementById('capsuleDescription').value.trim();
            const type = document.getElementById('capsuleType').value;

            if (!title || !type) {
                alert('Please fill in all required fields');
                return;
            }

            let content;

            if (type === 'notes') {
                content = document.getElementById('notesContent').value.trim();
                if (!content) {
                    alert('Please add notes content');
                    return;
                }
            } else if (type === 'flashcards') {
                const fronts = Array.from(document.querySelectorAll('.flashcard-front-input')).map(el => el.value.trim());
                const backs = Array.from(document.querySelectorAll('.flashcard-back-input')).map(el => el.value.trim());

                if (fronts.some(f => !f) || backs.some(b => !b)) {
                    alert('Please fill in all flashcards');
                    return;
                }

                content = fronts.map((front, i) => ({ front, back: backs[i], known: false }));
            } else if (type === 'quiz') {
                const quizItems = Array.from(document.querySelectorAll('.quiz-item'));

                content = quizItems.map(item => {
                    const question = item.querySelector('.quiz-question-input').value.trim();
                    const optionInputs = Array.from(item.querySelectorAll('[class*="quiz-options-"] input'));
                    const options = optionInputs.map(el => el.value.trim());
                    const correctValue = item.querySelector('.quiz-correct-input').value;

                    if (!question) {
                        alert('Please fill in all quiz questions');
                        return null;
                    }

                    if (options.length !== 4 || options.some(o => !o)) {
                        alert('Please fill in all 4 options for each question');
                        return null;
                    }

                    if (correctValue === '') {
                        alert('Please select the correct answer for each question');
                        return null;
                    }

                    return {
                        question,
                        options,
                        correct: parseInt(correctValue)
                    };
                }).filter(q => q !== null);

                if (content.length === 0) {
                    return;
                }
            }

            const capsule = {
                id: this.currentCapsule ? this.currentCapsule.id : Date.now().toString(),
                title,
                description,
                type,
                content,
                createdAt: this.currentCapsule ? this.currentCapsule.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (this.currentCapsule) {
                const index = this.capsules.findIndex(c => c.id === this.currentCapsule.id);
                this.capsules[index] = capsule;
            } else {
                this.capsules.push(capsule);
            }

            StorageManager.saveCapsules(this.capsules);
            this.renderCapsules();

            bootstrap.Modal.getInstance(document.getElementById('capsuleModal')).hide();
        },

        editCapsule(id) {
            this.currentCapsule = this.capsules.find(c => c.id === id);
            document.getElementById('capsuleTitle').value = this.currentCapsule.title;
            document.getElementById('capsuleDescription').value = this.currentCapsule.description;
            document.getElementById('capsuleType').value = this.currentCapsule.type;
            document.getElementById('capsuleModalLabel').textContent = 'Edit Capsule';

            this.renderContentForm(this.currentCapsule.type);

            const modal = new bootstrap.Modal(document.getElementById('capsuleModal'));
            modal.show();
        },

        deleteCapsule(id) {
            if (confirm('Are you sure you want to delete this capsule?')) {
                this.capsules = this.capsules.filter(c => c.id !== id);
                StorageManager.saveCapsules(this.capsules);
                this.renderCapsules();
            }
        },

        renderCapsules() {
            const container = document.getElementById('capsulesContainer');
            if (!container) return;

            const emptyState = document.getElementById('emptyState');

            if (this.capsules.length === 0) {
                container.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';

            const html = this.capsules.map(capsule => {
                        const typeClass = `capsule-type-${capsule.type}`;
                        const typeName = capsule.type.charAt(0).toUpperCase() + capsule.type.slice(1);
                        const count = Array.isArray(capsule.content) ? capsule.content.length : 1;
                        const itemText = capsule.type === 'notes' ? 'note' : capsule.type === 'flashcards' ? 'cards' : 'questions';

                        return `
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow card-hover">
                        <div class="card-body">
                            <span class="badge bg-primary mb-2">${typeName}</span>
                            <h5 class="card-title">${capsule.title}</h5>
                            ${capsule.description ? `<p class="card-text">${capsule.description}</p>` : ''}
                            <div class="d-flex justify-content-between text-muted small mb-3">
                                <span><i class="bi bi-file-text"></i> ${count} ${itemText}</span>
                                <span><i class="bi bi-clock"></i> ${new Date(capsule.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div class="d-flex gap-2 flex-wrap">
                                <button class="btn btn-primary btn-sm btn-learn" data-id="${capsule.id}">
                                    <i class="bi bi-play-fill"></i> Learn
                                </button>
                                <button class="btn btn-outline-primary btn-sm btn-edit" data-id="${capsule.id}">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-outline-primary btn-sm btn-export" data-id="${capsule.id}">
                                    <i class="bi bi-download"></i> Export
                                </button>
                                <button class="btn btn-outline-danger btn-sm btn-delete" data-id="${capsule.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    },

    openLearnMode(id) {
        const capsule = this.capsules.find(c => c.id === id);
        if (!capsule) return;

        const modal = new bootstrap.Modal(document.getElementById('learnModal'));
        document.getElementById('learnModalTitle').textContent = capsule.title;

        let html = '';

        if (capsule.type === 'notes') {
            html = `
                <div class="notes-content">
                    <p style="white-space: pre-wrap;">${capsule.content}</p>
                </div>
            `;
        } else if (capsule.type === 'flashcards') {
            html = `
                <div id="flashcardLearn">
                    <div class="text-center mb-4">
                        <div class="flashcard" onclick="this.classList.toggle('flipped')">
                            <div class="flashcard-inner">
                                <div class="flashcard-front">
                                    <h4>${capsule.content[0]?.front || 'No content'}</h4>
                                </div>
                                <div class="flashcard-back">
                                    <h4>${capsule.content[0]?.back || 'No content'}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-outline-primary">Previous</button>
                        <button class="btn btn-outline-primary">Next</button>
                    </div>
                </div>
            `;
        } else if (capsule.type === 'quiz') {
            html = `
                <div id="quizLearn">
                    <div class="quiz-question">
                        <h5>${capsule.content[0]?.question || 'No question'}</h5>
                        <div class="mt-3">
                            ${capsule.content[0]?.options?.map((opt, i) => `
                                <button class="btn btn-outline-dark w-100 mb-2">${opt}</button>
                            `).join('') || ''}
                        </div>
                    </div>
                </div>
            `;
        }

        const learnContent = document.getElementById('learnContent');
        if (learnContent) {
            learnContent.innerHTML = html;
            modal.show();
        }
    },

    exportCapsule(id) {
        const capsule = this.capsules.find(c => c.id === id);
        const dataStr = JSON.stringify(capsule, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${capsule.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    importCapsule(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const capsule = JSON.parse(e.target.result);
                
                if (!capsule.title || !capsule.type || !capsule.content) {
                    throw new Error('Invalid capsule format');
                }

                capsule.id = Date.now().toString();
                capsule.createdAt = new Date().toISOString();
                capsule.updatedAt = new Date().toISOString();

                this.capsules.push(capsule);
                StorageManager.saveCapsules(this.capsules);
                this.renderCapsules();
                
                alert('Capsule imported successfully!');
            } catch (error) {
                alert('Error importing capsule: ' + error.message);
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CapsuleManager.init();
});