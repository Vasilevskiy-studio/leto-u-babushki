// ===== game.js — Лето с бабушкой =====
// Главная логика игры. Конфигурация уровней — только в levels.json.

'use strict';

// === Константы ===
const SAVE_KEY        = 'leto_babushka_v1';
const ENERGY_MAX      = 30;
const ENERGY_REGEN_MS = 20 * 60 * 1000;   // 20 минут на 1 единицу
const HINTS_PER_DAY   = 3;
const HINTS_RESET_MS  = 24 * 60 * 60 * 1000;
const HINT_DURATION   = 3000;              // 3 секунды подсветки

// Эмодзи-иконки предметов (ключ совпадает с id в levels.json)
const ITEM_ICONS = {
    samovar:       '🫖',
    fridge:        '🧊',
    radio:         '📻',
    oven:          '🔥',
    window:        '🪟',
    table:         '🪑',
    chair:         '🪑',
    firewood:      '🪵',
    flower:        '🌸',
    pitcher:       '🫙',
    cup:           '☕',
    mug:           '🍵',
    plate:         '🍽️',
    jam_jar:       '🍯',
    pickle_jar:    '🥒',
    egg:           '🥚',
    apple:         '🍎',
    cutting_board: '🟫',
    wooden_spoon:  '🥄',
    clock:         '⏰',
    dill:          '🌿',
    green_onion:   '🧅',
    poker:         '🔧',
    towel:         '🧺',
    garlic_bunch:  '🧄',
    onion_bunch:   '🧅',
    herb_bunch:    '🌱',
    glass_jar:     '🫙',
    rug:           '🟫',
    bucket:        '🪣'
};

// Сюжетные вставки (показываются после уровня 3, 6, 10)
const STORY_SCENES = {
    3: [
        { name: 'Бабушка Галя', emoji: '👵', color: '#DEB887', text: 'Ох, спасибо тебе, внучок! Совсем я стала рассеянная...' },
        { name: 'Бабушка Галя', emoji: '👵', color: '#DEB887', text: 'Пойдём, я тебя пирожками угощу!' },
        { name: 'Мурзик',       emoji: '🐈', color: '#C0A080', text: 'Мррр...' }
    ],
    6: [
        { name: 'Максим',       emoji: '👦', color: '#87CEEB', text: 'Бабуль, а что это за старая шкатулка на чердаке?' },
        { name: 'Бабушка Галя', emoji: '👵', color: '#DEB887', text: 'Это особая шкатулка... Там хранятся воспоминания нашей семьи.' },
        { name: 'Бабушка Галя', emoji: '👵', color: '#DEB887', text: 'Поможешь мне найти к ней ключ?' }
    ],
    10: [
        { name: 'Аня',          emoji: '👧', color: '#FFB6C1', text: 'Мы нашли всё что ты просила, бабуля!' },
        { name: 'Бабушка Галя', emoji: '👵', color: '#DEB887', text: 'Какие же вы у меня молодцы! Это лето я никогда не забуду.' },
        { name: 'Бабушка Галя', emoji: '👵', color: '#DEB887', text: 'Завтра пойдём в баню — там тоже нужна ваша помощь!' }
    ]
};

// Определения достижений
const ACHIEVEMENTS = [
    {
        id: 'first_step', name: 'Первый шаг', icon: '👣',
        desc: 'Пройти 1 уровень',
        check: s => completedCount(s) >= 1
    },
    {
        id: 'helper', name: 'Помощник бабушки', icon: '🤝',
        desc: 'Пройти 5 уровней',
        check: s => completedCount(s) >= 5
    },
    {
        id: 'detective', name: 'Настоящий сыщик', icon: '🔍',
        desc: 'Пройти 10 уровней',
        check: s => completedCount(s) >= 10
    },
    {
        id: 'careful', name: 'Аккуратный', icon: '✨',
        desc: 'Пройти уровень без единой ошибки',
        check: s => s.achievements.careful === true
    },
    {
        id: 'eagle_eye', name: 'Глазастый', icon: '👁️',
        desc: 'Найти суммарно 50 предметов',
        progress: s => `${Math.min(s.stats.totalFound, 50)}/50`,
        check: s => s.stats.totalFound >= 50
    }
];

function completedCount(s) {
    return Object.values(s.levels).filter(l => l.completed).length;
}

// =============================================
// СОХРАНЕНИЕ
// =============================================

function defaultSave() {
    return {
        levels:       {},
        energy:       { current: ENERGY_MAX, lastUpdate: Date.now() },
        coins:        0,
        hints:        { used: 0, lastReset: Date.now() },
        achievements: {},
        stats:        { totalFound: 0 },
        settings:     { sound: true, music: true }
    };
}

function loadSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Мёрж — добавляем новые поля без потери старых данных
            return deepMerge(defaultSave(), parsed);
        }
    } catch (e) { console.warn('Ошибка загрузки:', e); }
    return defaultSave();
}

function deepMerge(target, source) {
    const out = Object.assign({}, target);
    for (const k of Object.keys(source)) {
        if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
            out[k] = deepMerge(target[k] || {}, source[k]);
        } else {
            out[k] = source[k];
        }
    }
    return out;
}

function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
    catch (e) { console.warn('Ошибка сохранения:', e); }
}

let save = loadSave();

// =============================================
// ЭНЕРГИЯ
// =============================================

function syncEnergy() {
    const now     = Date.now();
    const elapsed = now - save.energy.lastUpdate;
    const gained  = Math.floor(elapsed / ENERGY_REGEN_MS);
    if (gained > 0 && save.energy.current < ENERGY_MAX) {
        save.energy.current   = Math.min(ENERGY_MAX, save.energy.current + gained);
        save.energy.lastUpdate += gained * ENERGY_REGEN_MS;
        persist();
    }
}

function energyRegenMs() {
    if (save.energy.current >= ENERGY_MAX) return null;
    const elapsed   = Date.now() - save.energy.lastUpdate;
    return ENERGY_REGEN_MS - (elapsed % ENERGY_REGEN_MS);
}

function spendEnergy() {
    syncEnergy();
    if (save.energy.current <= 0) return false;
    save.energy.current--;
    // Корректируем lastUpdate чтобы отсчёт шёл от момента трат
    const elapsed = Date.now() - save.energy.lastUpdate;
    save.energy.lastUpdate = Date.now() - (elapsed % ENERGY_REGEN_MS);
    persist();
    return true;
}

// =============================================
// ПОДСКАЗКИ
// =============================================

function syncHints() {
    if (Date.now() - save.hints.lastReset > HINTS_RESET_MS) {
        save.hints.used      = 0;
        save.hints.lastReset = Date.now();
        persist();
    }
}

function hintsLeft() {
    syncHints();
    return Math.max(0, HINTS_PER_DAY - save.hints.used);
}

function spendHint() {
    if (hintsLeft() <= 0) return false;
    save.hints.used++;
    persist();
    return true;
}

// =============================================
// HUD (верхние показатели)
// =============================================

function updateHUD() {
    syncEnergy();

    const eVal   = document.getElementById('energy-value');
    const eTimer = document.getElementById('energy-timer');
    const cVal   = document.getElementById('coins-value');

    if (eVal)   eVal.textContent   = `${save.energy.current}/${ENERGY_MAX}`;
    if (cVal)   cVal.textContent   = save.coins;

    if (eTimer) {
        const ms = energyRegenMs();
        if (ms !== null && save.energy.current < ENERGY_MAX) {
            const m = Math.floor(ms / 60000);
            const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
            eTimer.textContent = `+1 через ${m}:${s}`;
            eTimer.classList.remove('hidden');
        } else {
            eTimer.classList.add('hidden');
        }
    }

    // Кнопка «Играть»
    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
        if (save.energy.current <= 0) {
            const ms = energyRegenMs();
            if (ms) {
                const m = Math.floor(ms / 60000);
                const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
                playBtn.textContent = `⚡ ${m}:${s}`;
            }
            playBtn.disabled = true;
        } else {
            playBtn.textContent = 'Играть';
            playBtn.disabled    = false;
        }
    }
}

setInterval(updateHUD, 1000);

// =============================================
// СОСТОЯНИЕ ТЕКУЩЕЙ ИГРЫ
// =============================================

let levelsData  = null;  // Данные из levels.json
let currentLevel = null; // Текущий объект уровня
let gs = {};             // Game State для текущей сессии
let storyQ = { scenes: [], idx: 0, afterLevel: 0 }; // Очередь сюжетных реплик

// =============================================
// ГЛАВНЫЙ ОБЪЕКТ GAME
// =============================================

const Game = {

    // ----- Навигация -----

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },

    showMain() {
        this.showScreen('screen-main');
        updateHUD();
    },

    showMap() {
        this.showScreen('screen-map');
        this.renderMap();
    },

    showAchievements() {
        this.showScreen('screen-achievements');
        this.renderAchievements();
    },

    showSettings() {
        this.showScreen('screen-settings');
        this.updateSettingsUI();
    },

    // ----- Карта уровней -----

    renderMap() {
        if (!levelsData) return;
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';

        levelsData.levels.forEach(lvl => {
            const lvlSave  = save.levels[lvl.id] || { stars: 0, completed: false };
            const prevDone = lvl.id === 1 || (save.levels[lvl.id - 1] || {}).completed;
            const isLocked = !prevDone;
            const isDone   = lvlSave.completed;

            const cell = document.createElement('div');
            cell.className = 'level-cell';

            let circleClass = 'level-circle ' + (isLocked ? 'locked' : isDone ? 'completed' : 'available');
            let content = isLocked ? '🔒' : lvl.id;
            let stars   = isLocked ? '' : (isDone ? this.starsStr(lvlSave.stars) : '☆☆☆');

            cell.innerHTML = `
                <div class="${circleClass}">${content}</div>
                <div class="level-stars">${stars}</div>
            `;

            if (!isLocked) {
                cell.addEventListener('click', () => this.startLevel(lvl.id));
                cell.style.cursor = 'pointer';
            }
            grid.appendChild(cell);
        });
    },

    starsStr(n) {
        return ['⭐','⭐','⭐'].map((s, i) => i < n ? s : '☆').join('');
    },

    // ----- Запуск уровня -----

    startLevel(levelId) {
        syncEnergy();
        if (save.energy.current <= 0) {
            alert('Нет энергии! Она восстанавливается каждые 20 минут.');
            return;
        }
        if (!spendEnergy()) return;

        currentLevel = levelsData.levels.find(l => l.id === levelId);
        if (!currentLevel) return;

        const timer = currentLevel.timer || 420; // 7 минут по умолчанию

        gs = {
            lives:       3,
            timeLeft:    timer,
            found:       0,
            total:       currentLevel.items.length,
            items:       currentLevel.items.map(it => ({ ...it, found: false })),
            timerHandle: null,
            hintActive:  false,
            perfectRun:  true,  // Флаг «без ошибок» для 2-й звезды
            startTime:   Date.now()
        };

        this.showScreen('screen-game');
        this.renderGame();
        this.startTimer();
        updateHUD();
    },

    // ----- Рендер игрового экрана -----

    renderGame() {
        this.refreshLives();
        this.refreshTimer();
        this.refreshFound();

        // Подсказки
        const hBtn = document.getElementById('hint-btn');
        const hLeft = document.getElementById('hints-left');
        if (hLeft) hLeft.textContent = hintsLeft();
        if (hBtn)  hBtn.disabled = hintsLeft() <= 0;

        // Карточки предметов (нижняя панель)
        const list = document.getElementById('items-list');
        list.innerHTML = '';
        gs.items.forEach(it => {
            const icon = ITEM_ICONS[it.id] || '❓';
            const card = document.createElement('div');
            card.className = 'item-card';
            card.id = `card-${it.id}`;
            card.innerHTML = `
                <div class="item-card-icon">${icon}</div>
                <div class="item-card-name">${it.name}</div>
            `;
            list.appendChild(card);
        });

        // Предметы на поле
        this.renderItems();

        // Обработчик кликов по игровой области
        const area = document.getElementById('game-area');
        area.onclick = e => this.handleClick(e);
    },

    renderItems() {
        const layer = document.getElementById('game-items-layer');
        layer.innerHTML = '';

        gs.items.forEach(it => {
            const icon = ITEM_ICONS[it.id] || '❓';
            const el   = document.createElement('div');
            el.className   = 'game-item';
            el.id          = `gi-${it.id}`;
            el.textContent = icon;
            el.style.left  = `${it.x * 100}%`;
            el.style.top   = `${it.y * 100}%`;

            // Сложные предметы — меньше и прозрачнее
            if (it.difficulty === 'hard') {
                el.style.fontSize = 'clamp(1.2rem, 3.2vw, 2.1rem)';
                el.style.opacity  = '0.72';
            } else if (it.difficulty === 'medium') {
                el.style.opacity  = '0.84';
            }

            layer.appendChild(el);
        });
    },

    // ----- Обработка кликов -----

    handleClick(e) {
        if (gs.lives <= 0 || gs.timeLeft <= 0) return;

        const area  = document.getElementById('game-area');
        const rect  = area.getBoundingClientRect();
        const px    = e.clientX - rect.left;
        const py    = e.clientY - rect.top;

        // Ищем предмет под курсором (пиксельное расстояние)
        const minDim = Math.min(rect.width, rect.height);
        let hit = null;

        for (const it of gs.items) {
            if (it.found) continue;
            const dx   = px - it.x * rect.width;
            const dy   = py - it.y * rect.height;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= (it.radius || 0.06) * minDim) {
                hit = it;
                break;
            }
        }

        if (hit) {
            this.onFound(hit, px, py);
        } else {
            this.onMiss(px, py);
        }
    },

    onFound(item, px, py) {
        item.found = true;
        gs.found++;

        // Гасим предмет на поле
        const giEl = document.getElementById(`gi-${item.id}`);
        if (giEl) giEl.classList.add('found');

        // Зачёркиваем в списке
        const cardEl = document.getElementById(`card-${item.id}`);
        if (cardEl) {
            cardEl.classList.add('found');
            cardEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        this.spawnEffect(px, py, true);
        this.refreshFound();

        save.stats.totalFound++;
        persist();

        if (gs.found >= gs.total) {
            setTimeout(() => this.winLevel(), 500);
        }
    },

    onMiss(px, py) {
        gs.lives--;
        gs.perfectRun = false;
        this.spawnEffect(px, py, false);
        this.refreshLives();
        if (gs.lives <= 0) {
            setTimeout(() => this.loseLevel('lives'), 500);
        }
    },

    spawnEffect(px, py, success) {
        const fx  = document.getElementById('click-effects');
        const el  = document.createElement('div');
        el.className = success ? 'click-found' : 'click-miss';
        if (success) el.textContent = '✓';
        el.style.left = `${px}px`;
        el.style.top  = `${py}px`;
        fx.appendChild(el);
        setTimeout(() => el.remove(), 900);
    },

    // ----- Обновление UI игры -----

    refreshLives() {
        const el = document.getElementById('lives-display');
        if (!el) return;
        el.textContent = ['❤️','❤️','❤️'].map((h, i) => i < gs.lives ? h : '🖤').join('');
    },

    refreshTimer() {
        const el = document.getElementById('timer-value');
        if (!el) return;
        const m  = Math.floor(gs.timeLeft / 60);
        const s  = String(gs.timeLeft % 60).padStart(2, '0');
        el.textContent = `${m}:${s}`;
        const wrap = document.getElementById('timer-display');
        if (wrap) wrap.classList.toggle('urgent', gs.timeLeft <= 60);
    },

    refreshFound() {
        const fEl = document.getElementById('found-value');
        const tEl = document.getElementById('total-value');
        if (fEl) fEl.textContent = gs.found;
        if (tEl) tEl.textContent = gs.total;
    },

    // ----- Таймер -----

    startTimer() {
        clearInterval(gs.timerHandle);
        gs.timerHandle = setInterval(() => {
            gs.timeLeft--;
            this.refreshTimer();
            if (gs.timeLeft <= 0) {
                clearInterval(gs.timerHandle);
                this.loseLevel('time');
            }
        }, 1000);
    },

    stopTimer() {
        clearInterval(gs.timerHandle);
        gs.timerHandle = null;
    },

    // ----- Победа / Поражение -----

    winLevel() {
        this.stopTimer();

        const elapsed = (Date.now() - gs.startTime) / 1000;
        const stars   = this.calcStars(elapsed);

        // Обновляем сохранение
        const prev = save.levels[currentLevel.id] || { stars: 0, completed: false };
        save.levels[currentLevel.id] = {
            stars:     Math.max(prev.stars, stars),
            completed: true
        };

        const coins = [0, 10, 15, 20][stars];
        save.coins += coins;

        if (gs.perfectRun && !save.achievements.careful) {
            save.achievements.careful = true;
        }
        persist();
        this.checkAchievements();

        this.showResult(true, stars, coins, '');
    },

    loseLevel(reason) {
        this.stopTimer();
        const text = reason === 'time' ? 'Время вышло ⏱' : 'Кончились жизни 💔';
        this.showResult(false, 0, 0, text);
    },

    calcStars(elapsedSec) {
        if (elapsedSec < 180) return 3;  // меньше 3 минут
        if (gs.perfectRun)    return 2;  // без ошибок
        return 1;
    },

    // ----- Экран результата -----

    showResult(win, stars, coins, reason) {
        this.showScreen('screen-result');
        updateHUD();

        const icon   = document.getElementById('result-icon');
        const title  = document.getElementById('result-title');
        const starsE = document.getElementById('result-stars');
        const coinsE = document.getElementById('result-coins');
        const rsn    = document.getElementById('result-reason');
        const nxt    = document.getElementById('btn-next');

        if (win) {
            icon.textContent   = '🎉';
            title.textContent  = 'Уровень пройден!';
            title.className    = 'result-title win';
            coinsE.textContent = coins > 0 ? `+${coins} 🪙` : '';
            rsn.textContent    = '';
            nxt.style.display  = '';

            // Звёзды с задержкой
            starsE.innerHTML = '';
            for (let i = 1; i <= 3; i++) {
                const s = document.createElement('span');
                s.className = 'result-star';
                s.textContent = i <= stars ? '⭐' : '☆';
                s.style.animationDelay = `${(i - 1) * 0.3}s`;
                starsE.appendChild(s);
            }
        } else {
            icon.textContent   = '😔';
            title.textContent  = 'Не получилось...';
            title.className    = 'result-title lose';
            starsE.innerHTML   = '';
            coinsE.textContent = '';
            rsn.textContent    = reason;
            nxt.style.display  = 'none';
        }
    },

    nextLevel() {
        const id = currentLevel.id;
        if (STORY_SCENES[id]) {
            storyQ = { scenes: STORY_SCENES[id], idx: 0, afterLevel: id };
            this.showStory();
        } else {
            this.showMap();
        }
    },

    retryLevel() {
        this.startLevel(currentLevel.id);
    },

    // ----- Сюжетные вставки -----

    showStory() {
        this.showScreen('screen-story');
        const scene = storyQ.scenes[storyQ.idx];
        document.getElementById('story-text').textContent      = scene.text;
        document.getElementById('story-char-name').textContent = scene.name;
        const av = document.getElementById('story-avatar');
        av.textContent    = scene.emoji;
        av.style.background  = scene.color + '33';
        av.style.borderColor = scene.color;
    },

    nextStoryLine() {
        storyQ.idx++;
        if (storyQ.idx >= storyQ.scenes.length) {
            this.showMap();
        } else {
            this.showStory();
        }
    },

    // ----- Подсказки -----

    useHint() {
        if (gs.hintActive) return;
        const unfound = gs.items.filter(i => !i.found);
        if (!unfound.length) return;
        if (!spendHint()) return;

        // Берём случайный ненайденный предмет
        const target = unfound[Math.floor(Math.random() * unfound.length)];
        gs.hintActive = true;

        const hBtn = document.getElementById('hint-btn');
        const hLeft = document.getElementById('hints-left');
        if (hLeft) hLeft.textContent = hintsLeft();
        if (hBtn)  hBtn.disabled = hintsLeft() <= 0;

        const el = document.getElementById(`gi-${target.id}`);
        if (el) {
            el.classList.add('hint-glow');
            setTimeout(() => {
                el.classList.remove('hint-glow');
                gs.hintActive = false;
            }, HINT_DURATION);
        } else {
            gs.hintActive = false;
        }
    },

    // ----- Достижения -----

    checkAchievements() {
        let updated = false;
        ACHIEVEMENTS.forEach(ach => {
            if (!save.achievements[ach.id] && ach.check(save)) {
                save.achievements[ach.id] = true;
                updated = true;
            }
        });
        if (updated) persist();
    },

    renderAchievements() {
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';
        ACHIEVEMENTS.forEach(ach => {
            const done = !!save.achievements[ach.id];
            const card = document.createElement('div');
            card.className = `achievement-card${done ? ' unlocked' : ''}`;
            const progressHtml = ach.progress
                ? `<div class="achievement-progress">${ach.progress(save)}</div>` : '';
            card.innerHTML = `
                <div class="achievement-icon">${done ? ach.icon : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                    ${progressHtml}
                </div>
                <div style="font-size:1.3rem">${done ? '✅' : ''}</div>
            `;
            list.appendChild(card);
        });
    },

    // ----- Настройки -----

    updateSettingsUI() {
        const sBtn = document.getElementById('sound-toggle');
        const mBtn = document.getElementById('music-toggle');
        if (sBtn) { sBtn.textContent = save.settings.sound ? 'ВКЛ' : 'ВЫКЛ'; sBtn.classList.toggle('off', !save.settings.sound); }
        if (mBtn) { mBtn.textContent = save.settings.music ? 'ВКЛ' : 'ВЫКЛ'; mBtn.classList.toggle('off', !save.settings.music); }
    },

    toggleSound() { save.settings.sound = !save.settings.sound; persist(); this.updateSettingsUI(); },
    toggleMusic() { save.settings.music = !save.settings.music; persist(); this.updateSettingsUI(); },

    resetSave() {
        if (!confirm('Сбросить весь прогресс? Это действие необратимо.')) return;
        localStorage.removeItem(SAVE_KEY);
        save = defaultSave();
        persist();
        this.showMain();
    }
};

// =============================================
// ИНИЦИАЛИЗАЦИЯ
// =============================================

async function init() {
    try {
        // Загружаем конфигурацию уровней
        const resp = await fetch('levels.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        levelsData = await resp.json();
    } catch (e) {
        console.error('Не удалось загрузить levels.json:', e);
        // Показываем сообщение вместо падения
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#fff;text-align:center;padding:20px;background:#2c1810">
                <div>
                    <div style="font-size:3rem">⚠️</div>
                    <h2>Не удалось загрузить игру</h2>
                    <p style="margin-top:12px;opacity:.7">Убедитесь, что файл levels.json находится рядом с index.html<br>и откройте игру через веб-сервер (не через file://)</p>
                </div>
            </div>`;
        return;
    }

    Game.checkAchievements(); // на случай если achievements уже были заработаны
    updateHUD();
    Game.showMain();
}

init();
