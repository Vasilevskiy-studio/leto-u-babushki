// ===== game.js — Лето с бабушкой =====
// Конфигурация уровней — только в levels.json, не менять здесь.

'use strict';

// === Константы ===
const SAVE_KEY        = 'leto_babushka_v1';
const ENERGY_MAX      = 8;   // естественный максимум; сверхзаряд выше 8 возможен
const ENERGY_REGEN_MS = 15 * 60 * 1000; // 15 минут
const HINTS_PER_DAY   = 3;
const HINTS_RESET_MS  = 24 * 60 * 60 * 1000;
const HINT_DURATION   = 3000;

// Эмодзи предметов (для карточки нахождения)
const ITEM_EMOJIS = {
    samovar:    '🫖',
    kuvsheen:   '🏺',
    drova:      '🪵',
    tsvetok:    '🌸',
    okno:       '🪟',
    pech:       '🔥',
    polotentse: '🧣',
    yabloki:    '🍎',
    stul:       '🪑',
    hleb:       '🍞',
    yaytsa:     '🥚',
    varene:     '🍯',
    radio:      '📻',
    holodilnik: '🧊',
    lozhka:     '🥄',
    ogurtsy:    '🥒',
    retsept:    '📜',
    protiven:   '🍳'
};

// Сюжетные вставки (после уровней 3, 6, 10)
const STORY_SCENES = {
    3: [
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Ох, спасибо тебе, внучок! Совсем я стала рассеянная...' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Пойдём, я тебя пирожками угощу! Только что из печки.' },
        { char: 'char_murzik',  side: 'left',  name: 'Мурзик',       text: 'Мррр... Мяу!' }
    ],
    6: [
        { char: 'char_maxim',   side: 'left',  name: 'Максим',       text: 'Бабуль, а что это за старая шкатулка на чердаке?' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Это особая шкатулка... Там хранятся воспоминания нашей семьи.' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Поможешь мне найти к ней ключ?' },
        { char: 'char_murzik',  side: 'left',  name: 'Мурзик',       text: 'Мррр! (Мурзик загадочно смотрит в сторону чердака)' }
    ],
    10: [
        { char: 'char_anya',    side: 'left',  name: 'Аня',          text: 'Мы нашли всё что ты просила, бабуля!' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Какие же вы у меня молодцы! Это лето я никогда не забуду.' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Завтра пойдём в баню — там тоже нужна ваша помощь!' },
        { char: 'char_murzik',  side: 'left',  name: 'Мурзик',       text: 'Мяу! (Мурзик довольно мурлычет и трётся о ноги бабушки)' }
    ]
};

// Достижения
const ACHIEVEMENTS = [
    { id: 'first_step', name: 'Первый шаг',         icon: '👣', desc: 'Пройти 1 уровень',                    check: s => completedCount(s) >= 1  },
    { id: 'helper',     name: 'Помощник бабушки',   icon: '🤝', desc: 'Пройти 5 уровней',                    check: s => completedCount(s) >= 5  },
    { id: 'detective',  name: 'Настоящий сыщик',    icon: '🔍', desc: 'Пройти 10 уровней',                   check: s => completedCount(s) >= 10 },
    { id: 'careful',    name: 'Аккуратный',          icon: '✨', desc: 'Пройти уровень без единой ошибки',    check: s => s.achievements.careful === true },
    { id: 'eagle_eye',  name: 'Глазастый',           icon: '👁️', desc: 'Найти суммарно 50 предметов',
        progress: s => `${Math.min(s.stats.totalFound, 50)}/50`,
        check: s => s.stats.totalFound >= 50 }
];

function completedCount(s) {
    return Object.values(s.levels).filter(l => l.completed).length;
}

// =============================================
// СОХРАНЕНИЕ
// =============================================

function defaultSave() {
    return {
        levels: {}, coins: 0, malina: 0,
        energy:       { current: 8, lastUpdate: Date.now() },
        hints:        { used: 0, lastReset: Date.now(), extra: 0 },
        achievements: {},
        stats:        { totalFound: 0 },
        settings:     { sound: true, music: true },
        murzik:       { active: false, expires: 0 }
    };
}

function loadSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) return deepMerge(defaultSave(), JSON.parse(raw));
    } catch (e) { console.warn('Ошибка загрузки:', e); }
    return defaultSave();
}

function deepMerge(target, source) {
    const out = Object.assign({}, target);
    for (const k of Object.keys(source)) {
        if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k]))
            out[k] = deepMerge(target[k] || {}, source[k]);
        else
            out[k] = source[k];
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
    // Восстановление идёт только пока энергия ниже 8 (сверхзаряд не восстанавливается)
    if (save.energy.current >= ENERGY_MAX) return;
    const gained = Math.floor((Date.now() - save.energy.lastUpdate) / ENERGY_REGEN_MS);
    if (gained > 0) {
        save.energy.current    = Math.min(ENERGY_MAX, save.energy.current + gained);
        save.energy.lastUpdate += gained * ENERGY_REGEN_MS;
        persist();
    }
}

function energyRegenMs() {
    // Таймер актуален только когда энергия строго меньше 8
    if (save.energy.current >= ENERGY_MAX) return null;
    return ENERGY_REGEN_MS - ((Date.now() - save.energy.lastUpdate) % ENERGY_REGEN_MS);
}

function spendEnergy() {
    syncEnergy();
    if (save.energy.current <= 0) return false;
    save.energy.current--;
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
        save.hints.used = 0;
        save.hints.lastReset = Date.now();
        persist();
    }
}

function hintsLeft() {
    syncHints();
    return Math.max(0, HINTS_PER_DAY - save.hints.used) + (save.hints.extra || 0);
}

function spendHint() {
    if (hintsLeft() <= 0) return false;
    if ((save.hints.extra || 0) > 0) save.hints.extra--;
    else save.hints.used++;
    persist();
    return true;
}

// =============================================
// HUD
// =============================================

function updateHUD() {
    syncEnergy();
    const eVal   = document.getElementById('energy-value');
    const eTimer = document.getElementById('energy-timer');
    const cVal   = document.getElementById('coins-value');

    const overcharge = save.energy.current > ENERGY_MAX;
    if (eVal) {
        eVal.textContent = overcharge
            ? `${save.energy.current} ⚡`
            : `${save.energy.current}/${ENERGY_MAX}`;
        eVal.style.color = overcharge ? '#FFD700' : '';
    }
    if (cVal) cVal.textContent = save.coins;
    const mVal = document.getElementById('malina-value');
    if (mVal) mVal.textContent = save.malina || 0;

    // Дублируем в магазин
    const sC = document.getElementById('shop-coins-value');
    const sE = document.getElementById('shop-energy-value');
    const sM = document.getElementById('shop-malina-value');
    if (sC) sC.textContent = save.coins;
    if (sE) sE.textContent = save.energy.current;
    if (sM) sM.textContent = save.malina || 0;

    if (eTimer) {
        const ms = energyRegenMs();
        if (ms !== null) {
            const m = Math.floor(ms / 60000);
            const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
            eTimer.textContent = `+1 через ${m}:${s}`;
            eTimer.classList.remove('hidden');
        } else {
            eTimer.classList.add('hidden');
        }
    }

    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
        // Кнопка — картинка, управляем только pointer-events и прозрачностью
        if (save.energy.current <= 0) {
            playBtn.style.opacity        = '0.45';
            playBtn.style.pointerEvents  = 'none';
        } else {
            playBtn.style.opacity        = '1';
            playBtn.style.pointerEvents  = '';
        }
    }
}

setInterval(updateHUD, 1000);

// Кастомный курсор везде
(function() {
    const cur = document.getElementById('custom-cursor');
    if (!cur) return;
    document.addEventListener('mousemove', e => {
        cur.style.left = e.clientX + 'px';
        cur.style.top  = e.clientY + 'px';
    });
})();

// =============================================
// ИГРОВОЕ СОСТОЯНИЕ
// =============================================

let levelsData    = null;
let currentLevel  = null;
let gs            = {};
let currentChapter = 'kitchen';
let storyQ       = { scenes: [], idx: 0 };
let devMode      = false;

// =============================================
// GAME
// =============================================

const Game = {

    // ----- Навигация -----

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        Music.forScreen(id);
        if (id !== 'screen-game' && typeof DevTools !== 'undefined') DevTools.hideZones();
        if (id !== 'screen-main' && typeof Profile !== 'undefined') Profile.hidePanel();
    },

    showMain()         { this.showScreen('screen-main');         updateHUD(); Profile.showPanel(); },
    showAchievements() { this.showScreen('screen-achievements'); this.renderAchievements(); },
    showSettings()     { this.showScreen('screen-settings');     this.updateSettingsUI(); },
    showShop()         { this.showScreen('screen-shop');         Shop.init(); updateHUD(); },
    showAlbum()        { this.showScreen('screen-album');        this.renderAlbum(); },

    renderAlbum() {
        const grid = document.getElementById('album-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const kitchenDone = Array.from({length: 10}, (_, i) => i + 1)
            .every(id => ((save.levels || {})[id] || {}).stars > 0);

        const chapters = [
            { name: 'Кухня бабушки', photo: 'photo_kitchen.png.png', done: kitchenDone },
            ...Array.from({length: 9}, (_, i) => ({ name: `Глава ${i + 2}`, photo: null, done: false }))
        ];

        chapters.forEach((ch, idx) => {
            const card = document.createElement('div');
            card.className = 'album-card';
            const imgSrc = ch.done ? `assets/${ch.photo}` : 'assets/photo_locked.png.png';
            card.innerHTML =
                `<img src="${imgSrc}" class="album-card-img" alt="">` +
                `<div class="album-card-label${ch.done ? '' : ' locked'}">${ch.done ? ch.name : `Глава ${idx + 1}`}</div>`;
            if (ch.done) card.addEventListener('click', () => Game.openAlbumLightbox(imgSrc, ch.name));
            grid.appendChild(card);
        });
    },

    openAlbumLightbox(src, name) {
        document.getElementById('album-lightbox-img').src = src;
        document.getElementById('album-lightbox-label').textContent = name;
        document.getElementById('album-lightbox').classList.remove('hidden');
    },

    closeAlbumLightbox() {
        document.getElementById('album-lightbox').classList.add('hidden');
    },

    showMap() {
        this.showScreen('screen-map');
        this.renderMap();
    },

    // ----- Карта уровней -----

    _kitchenAllDone() {
        return Array.from({length: 10}, (_, i) => i + 1)
            .every(id => (save.levels[id] || {}).completed);
    },

    selectChapter(name) {
        if (name === 'bath' && !this._kitchenAllDone()) {
            alert('Сначала пройди все уровни Кухни бабушки Гали!');
            return;
        }
        currentChapter = name;
        this.renderMap();
    },

    renderMap() {
        if (!levelsData) return;
        const grid      = document.getElementById('level-grid');
        const bg        = document.getElementById('map-bg');
        const titleText = document.getElementById('map-chapter-title');
        grid.innerHTML = '';

        const kitchenDone = this._kitchenAllDone();

        // Вкладки глав: kitchen и bath — интерактивны; остальные заблокированы
        const tabChapters = [
            { id: 'kitchen', unlocked: true },
            { id: 'bath',    unlocked: kitchenDone },
            { id: 'bedroom', unlocked: false },
            { id: 'barn',    unlocked: false },
            { id: 'chicken', unlocked: false },
            { id: 'garden',  unlocked: false },
            { id: 'well',    unlocked: false },
            { id: 'glade',   unlocked: false },
            { id: 'river',   unlocked: false },
            { id: 'forest',  unlocked: false },
        ];
        tabChapters.forEach(ch => {
            const btn = document.getElementById(`chapter-tab-${ch.id}`);
            if (!btn) return;
            btn.classList.toggle('active', currentChapter === ch.id);
            btn.classList.toggle('locked', !ch.unlocked);
            btn.disabled = !ch.unlocked;
        });

        // Фон и заголовок
        if (currentChapter === 'bath') {
            if (bg) bg.className = 'bath-bg map-bg-blur';
            if (titleText) titleText.querySelector('textPath').textContent = 'Баня';
        } else {
            if (bg) bg.className = 'kitchen-bg map-bg-blur';
            if (titleText) titleText.querySelector('textPath').textContent = 'Кухня бабушки Гали';
        }

        const levels = currentChapter === 'bath'
            ? (levelsData.bath_levels || [])
            : levelsData.levels;

        for (let r = 0; r < 5; r++) {
            const row = document.createElement('div');
            row.className = 'level-grid-row';

            for (let c = 0; c < 2; c++) {
                const lvl = levels[r * 2 + c];
                if (!lvl) continue;

                // Блокировка: для бани — предыдущий уровень бани; уровень 1 доступен сразу (глава уже открыта)
                let prevDone;
                let isChapterFirst = false;
                if (currentChapter === 'bath') {
                    isChapterFirst = lvl.id === levels[0].id;
                    prevDone = isChapterFirst
                        ? true
                        : (save.levels[levels[r * 2 + c - 1]?.id] || {}).completed;
                } else {
                    prevDone = lvl.id === 1 || (save.levels[lvl.id - 1] || {}).completed;
                }

                const lvlSave   = save.levels[lvl.id] || { stars: 0, completed: false };
                // Первый уровень главы не считается «пустым» — он всегда доступен после открытия главы
                const isEmpty   = lvl.items.length === 0 && !isChapterFirst;
                const isLocked  = !prevDone;
                const isDone    = lvlSave.completed;
                const isCurrent = !isLocked && !isDone && !isEmpty;
                const displayNum = currentChapter === 'bath' ? lvl.id - 100 : lvl.id;

                const cell = document.createElement('div');
                cell.className = 'level-cell' +
                    (isLocked            ? ' level-cell-locked' : '') +
                    (!isLocked && isEmpty ? ' level-cell-soon'   : '') +
                    (isCurrent           ? ' level-cell-current' : '');

                const earned = isDone ? (lvlSave.stars || 0) : 0;
                let starsHTML = '';
                for (let i = 0; i < 3; i++) {
                    const src = i < earned ? 'assets/star_full.png.png' : 'assets/star_empty.png.png';
                    starsHTML += `<img src="${src}" class="star-img" alt="">`;
                }

                cell.innerHTML = `
                    <div class="level-num">${displayNum}</div>
                    ${isLocked ? '<div class="level-lock">🔒</div>' : ''}
                    ${isEmpty && !isLocked ? '<div class="level-soon">Скоро</div>' : ''}
                    <div class="level-stars">${starsHTML}</div>
                `;

                if (!isLocked && !isEmpty) cell.addEventListener('click', () => {
                    if (Tutorial && Tutorial.active) return;
                    this.startLevel(lvl.id);
                });
                row.appendChild(cell);
            }
            grid.appendChild(row);
        }
    },

    starsStr(n) { return ['⭐','⭐','⭐'].map((s, i) => i < n ? s : '☆').join(''); },

    buyMapEnergy() {
        if (save.coins < 100) { alert('Недостаточно монет!'); return; }
        save.coins -= 100;
        save.energy.current += 1; // может превышать 8 (сверхзаряд)
        persist();
        updateHUD();
    },

    showShopEnergy() {
        this.showShop();
        Shop.openTab('energy');
    },

    // ----- Запуск уровня -----

    startLevel(levelId) {
        syncEnergy();
        if (save.energy.current <= 0) { alert('Нет энергии! Она восстанавливается каждые 20 минут.'); return; }
        if (!spendEnergy()) return;

        currentLevel = levelsData.levels.find(l => l.id === levelId)
                    || (levelsData.bath_levels || []).find(l => l.id === levelId);
        if (!currentLevel) return;

        gs = {
            lives:       3,
            timeLeft:    currentLevel.timer || 420,
            found:       0,
            total:       currentLevel.items.length,
            items:       currentLevel.items.map(id => ({
                             ...(levelsData.items.find(i => i.id === id)
                              || levelsData.bath_items.find(i => i.id === id)),
                             found: false
                         })),
            timerHandle: null,
            hintActive:  false,
            perfectRun:  true,
            startTime:   Date.now()
        };

        // Бонус Мурзика: +1 подсказка в начале каждого уровня
        if (save.murzik && save.murzik.active && save.murzik.expires > Date.now()) {
            save.hints.extra = (save.hints.extra || 0) + 1;
        } else if (save.murzik && save.murzik.expires > 0 && save.murzik.expires <= Date.now()) {
            save.murzik.active = false;
        }

        const sceneBg = document.getElementById('game-scene-bg');
        if (sceneBg) sceneBg.className = currentLevel.id >= 101 ? 'bath-bg' : 'kitchen-bg';

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

        const hLeft = document.getElementById('hints-left');
        const hBtn  = document.getElementById('hint-btn');
        if (hLeft) hLeft.textContent = hintsLeft();
        if (hBtn)  hBtn.disabled     = hintsLeft() <= 0;

        // Нижняя панель: только текстовые названия предметов
        const list = document.getElementById('items-list');
        list.innerHTML = '';
        gs.items.forEach(it => {
            const card   = document.createElement('div');
            card.className = 'item-card';
            card.id        = `card-${it.id}`;
            const nameEl   = document.createElement('div');
            nameEl.className   = 'item-card-name';
            nameEl.textContent = it.name;
            card.appendChild(nameEl);
            list.appendChild(card);
        });

        this.renderItems();

        const area = document.getElementById('game-area');
        area.onclick = e => this.handleClick(e);
    },

    // Пустые невидимые div-зоны на игровом поле — никакого текста и иконок
    renderItems() {
        const layer  = document.getElementById('game-items-layer');
        const area   = document.getElementById('game-area');
        layer.innerHTML = '';

        const minDim = Math.min(area.offsetWidth || 360, area.offsetHeight || 500);

        gs.items.forEach(it => {
            const zones = it.zones || [{ x: it.x, y: it.y, radius: it.radius || 0.06 }];
            zones.forEach((zone, i) => {
                const sizePx = Math.max(48, zone.radius * minDim * 2);
                const el      = document.createElement('div');
                el.className  = 'game-item';
                el.id         = `gi-${it.id}-${i}`;
                el.style.left   = `${zone.x * 100}%`;
                el.style.top    = `${zone.y * 100}%`;
                el.style.width  = `${sizePx}px`;
                el.style.height = `${sizePx}px`;
                layer.appendChild(el);
            });
        });
    },

    // ----- Обработка кликов -----

    handleClick(e) {
        const area   = document.getElementById('game-area');
        const rect   = area.getBoundingClientRect();
        const px     = e.clientX - rect.left;
        const py     = e.clientY - rect.top;

        // Блокируем клики во время туториала
        if (Tutorial && Tutorial.active) return;

        // Режим разработчика: фиксируем координаты и копируем в буфер обмена
        if (devMode) {
            const rx = (px / rect.width).toFixed(3);
            const ry = (py / rect.height).toFixed(3);
            const text = `"x": ${rx}, "y": ${ry}`;
            navigator.clipboard.writeText(text).catch(() => {});
            // Показываем подтверждение в панели
            const copiedEl = document.getElementById('dev-copied');
            if (copiedEl) {
                copiedEl.style.display = '';
                clearTimeout(copiedEl._hideTimer);
                copiedEl._hideTimer = setTimeout(() => { copiedEl.style.display = 'none'; }, 1400);
            }
            return;
        }

        if (gs.lives <= 0 || gs.timeLeft <= 0) return;

        const minDim = Math.min(rect.width, rect.height);

        // Собираем все попавшие предметы, запоминаем минимальный размер совпавшей зоны
        let hit = null;
        let hitSize = Infinity;
        for (const it of gs.items) {
            if (it.found) continue;
            const zones = it.zones || [{ x: it.x, y: it.y, radius: it.radius || 0.06 }];
            for (const zone of zones) {
                let inside = false;
                let size;
                if (zone.shape === 'rect') {
                    const rw  = zone.width * rect.width;
                    const rh  = zone.square ? rw : zone.height * rect.height;
                    const cx  = zone.x * rect.width  + rw / 2;
                    const cy  = zone.y * rect.height + rh / 2;
                    let lx = px - cx, ly = py - cy;
                    if (zone.rotation) {
                        const a = -zone.rotation * Math.PI / 180;
                        const cos = Math.cos(a), sin = Math.sin(a);
                        [lx, ly] = [lx * cos - ly * sin, lx * sin + ly * cos];
                    }
                    inside = Math.abs(lx) <= rw / 2 && Math.abs(ly) <= rh / 2;
                    size = (rw / rect.width) * (rh / rect.height);
                } else {
                    const dx = px - zone.x * rect.width;
                    const dy = py - zone.y * rect.height;
                    inside = Math.sqrt(dx * dx + dy * dy) <= zone.radius * minDim;
                    size = zone.radius * zone.radius; // π сокращается при сравнении
                }
                if (inside && size < hitSize) { hit = it; hitSize = size; break; }
            }
        }

        hit ? this.onFound(hit, px, py) : this.onMiss(px, py);
    },

    onFound(item, px, py) {
        item.found = true;
        gs.found++;

        // Помечаем все зоны предмета (их может быть несколько при coords[])
        const points = (item.coords && item.coords.length) ? item.coords : [{}];
        points.forEach((_, i) => {
            const el = document.getElementById(`gi-${item.id}-${i}`);
            if (el) el.classList.add('found');
        });
        const cardEl = document.getElementById(`card-${item.id}`);
        if (cardEl) {
            this.spawnFlyout(item, cardEl);
            // карточка становится зачёркнутой после того как анимация достигает центра
            setTimeout(() => {
                cardEl.classList.add('found');
                cardEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }, 900);
        }

        this.spawnEffect(px, py, true);
        this.refreshFound();
        save.stats.totalFound++;
        persist();

        if (gs.found >= gs.total) setTimeout(() => this.winLevel(), 500);
    },

    spawnFlyout(item) {
        const el = document.createElement('div');
        el.className = 'item-flyout';

        const inner = document.createElement('div');
        inner.className = 'flyout-inner animate__animated animate__bounceIn';
        inner.style.setProperty('--animate-duration', '0.5s');
        inner.innerHTML =
            `<div class="flyout-found-label">Найдено!</div>` +
            `<div class="flyout-name">${item.name}</div>` +
            `<div class="flyout-check">✓</div>`;
        el.appendChild(inner);
        document.body.appendChild(el);

        setTimeout(() => {
            inner.classList.remove('animate__bounceIn');
            inner.classList.add('animate__fadeOutUp');
            inner.style.setProperty('--animate-duration', '0.4s');
            setTimeout(() => el.remove(), 420);
        }, 1200);
    },

    onMiss(px, py) {
        gs.lives--;
        gs.perfectRun = false;
        this.spawnEffect(px, py, false);
        this.refreshLives();
        if (gs.lives <= 0) setTimeout(() => this.loseLevel('lives'), 500);
    },

    spawnEffect(px, py, success) {
        const fx = document.getElementById('click-effects');
        const el = document.createElement('div');
        el.className = success ? 'click-found' : 'click-miss';
        if (success) el.textContent = '✓';
        el.style.left = `${px}px`;
        el.style.top  = `${py}px`;
        fx.appendChild(el);
        setTimeout(() => el.remove(), 900);
    },

    // ----- Обновление UI -----

    refreshLives() {
        const el = document.getElementById('lives-display');
        if (el) el.textContent = ['❤️','❤️','❤️'].map((h, i) => i < gs.lives ? h : '🖤').join('');
    },

    refreshTimer() {
        const el = document.getElementById('timer-value');
        if (!el) return;
        el.textContent = `${Math.floor(gs.timeLeft / 60)}:${String(gs.timeLeft % 60).padStart(2, '0')}`;
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
            if (gs.timeLeft <= 0) { clearInterval(gs.timerHandle); this.loseLevel('time'); }
        }, 1000);
    },

    stopTimer() { clearInterval(gs.timerHandle); gs.timerHandle = null; },

    // ----- Победа / Поражение -----

    winLevel() {
        this.stopTimer();
        const elapsed = (Date.now() - gs.startTime) / 1000;
        const stars   = elapsed < 180 ? 3 : gs.perfectRun ? 2 : 1;

        const prev = save.levels[currentLevel.id] || { stars: 0, completed: false };
        save.levels[currentLevel.id] = { stars: Math.max(prev.stars, stars), completed: true };

        const coins = [0, 10, 15, 20][stars];
        save.coins += coins;
        if (gs.perfectRun && !save.achievements.careful) save.achievements.careful = true;
        persist();
        this.checkAchievements();
        this.showResult(true, stars, coins, '');
    },

    loseLevel(reason) {
        this.stopTimer();
        this.showResult(false, 0, 0, reason === 'time' ? 'Время вышло ⏱' : 'Кончились жизни 💔');
    },

    // ----- Результат -----

    showResult(win, stars, coins, reason) {
        this.showScreen('screen-result');
        updateHUD();

        document.getElementById('result-title').textContent = win ? 'Уровень пройден!' : 'Не получилось...';
        document.getElementById('result-title').className   = 'result-title ' + (win ? 'win' : 'lose');
        document.getElementById('result-reason').textContent = win ? '' : reason;

        const btnNext = document.getElementById('btn-next');
        if (btnNext) btnNext.style.display = win ? '' : 'none';

        // Монеты с иконкой
        const coinsEl = document.getElementById('result-coins');
        coinsEl.innerHTML = win && coins > 0
            ? `<img src="assets/icon_coin.png.png" class="result-coin-icon" alt="">+${coins}`
            : '';

        // Звёзды — img теги
        const starsEl = document.getElementById('result-stars');
        starsEl.innerHTML = '';
        if (win) {
            for (let i = 1; i <= 3; i++) {
                const img = document.createElement('img');
                img.src = i <= stars ? 'assets/star_full.png.png' : 'assets/star_empty.png.png';
                img.className = 'result-star';
                img.style.animationDelay = `${(i - 1) * 0.3}s`;
                starsEl.appendChild(img);
            }
        }

        // Анимация выдачи фотокарточки — только при первом прохождении уровня 10
        if (win && currentLevel.id === 10 && !(save.chapters && save.chapters.kitchen && save.chapters.kitchen.completed)) {
            setTimeout(() => Game.showPhotoAward(), 1500);
        }
    },

    showPhotoAward() {
        const overlay = document.getElementById('photo-award-overlay');
        const wrap    = document.getElementById('photo-award-wrap');
        const hint    = document.getElementById('photo-award-album-hint');

        // Сбрасываем состояние wrap и hint перед показом
        wrap.classList.remove('fly-away');
        hint.classList.remove('glow-hint');

        document.getElementById('photo-award-img').src = 'assets/photo_kitchen.png.png';
        overlay.classList.remove('hidden', 'fade-out');

        // Небольшая задержка чтобы transition успел сработать
        requestAnimationFrame(() => {
            requestAnimationFrame(() => overlay.classList.add('visible'));
        });

        // Через 3.3s (2s после приземления карточки) — запускаем улёт
        setTimeout(() => {
            wrap.classList.add('fly-away');
            hint.classList.add('glow-hint');

            // Fade-out оверлея после завершения полёта
            setTimeout(() => {
                overlay.classList.add('fade-out');
                overlay.classList.remove('visible');

                setTimeout(() => {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('fade-out');

                    // Сохраняем получение карточки
                    if (!save.chapters) save.chapters = {};
                    save.chapters.kitchen = { completed: true, photo: 'photo_kitchen.png' };
                    persist();
                }, 600);
            }, 1000);
        }, 3300);
    },

    nextLevel() {
        const id = currentLevel.id;
        if (STORY_SCENES[id]) {
            const key = `after_${id}`;
            if (!(save.novel_shown || {})[key]) {
                if (!save.novel_shown) save.novel_shown = {};
                save.novel_shown[key] = true;
                persist();
                storyQ = { scenes: STORY_SCENES[id], idx: 0 };
                this.showStory();
                return;
            }
        }
        this.showMap();
    },

    retryLevel() { this.startLevel(currentLevel.id); },

    // ----- Новелла -----

    showStory() {
        this.showScreen('screen-story');
        Profile.hidePanel();
        this._renderNovelScene();
    },

    _renderNovelScene() {
        const scene = storyQ.scenes[storyQ.idx];
        const isLast = storyQ.idx >= storyQ.scenes.length - 1;

        // Портрет: обновляем src, класс стороны, перезапускаем анимацию
        const charEl = document.getElementById('novel-char');
        charEl.src = `assets/${scene.char}.png.png`;
        charEl.className = `novel-char char-${scene.side}`;
        charEl.style.animation = 'none';
        void charEl.offsetWidth;
        charEl.style.animation = `novelCharIn${scene.side === 'left' ? 'Left' : 'Right'} 0.5s ease forwards`;

        // Имя
        document.getElementById('novel-char-name').textContent = scene.name;

        // Текст: перезапускаем анимацию
        const textEl = document.getElementById('novel-text');
        textEl.style.animation = 'none';
        void textEl.offsetWidth;
        textEl.style.animation = 'novelTextIn 0.3s ease forwards';
        textEl.textContent = scene.text;

        // Кнопка "Продолжить" только на последней реплике
        document.getElementById('novel-continue-btn').classList.toggle('hidden', !isLast);
        const hint = document.querySelector('.novel-next-hint');
        if (hint) hint.style.opacity = isLast ? '0' : '';
    },

    storyAdvance() {
        const isLast = storyQ.idx >= storyQ.scenes.length - 1;
        if (isLast) return;

        const prev = storyQ.scenes[storyQ.idx];
        storyQ.idx++;
        const next = storyQ.scenes[storyQ.idx];
        const charChanged = prev.char !== next.char || prev.side !== next.side;

        const textEl = document.getElementById('novel-text');
        textEl.style.animation = 'novelTextOut 0.2s ease forwards';

        if (charChanged) {
            const charEl = document.getElementById('novel-char');
            const outAnim = `novelCharOut${prev.side === 'left' ? 'Left' : 'Right'} 0.3s ease forwards`;
            charEl.style.animation = outAnim;
        }

        setTimeout(() => this._renderNovelScene(), charChanged ? 320 : 220);
    },

    nextStoryLine() {
        this.showMap();
    },

    // ----- Подсказки -----

    useHint() {
        if (gs.hintActive) return;
        const unfound = gs.items.filter(i => !i.found);
        if (!unfound.length || !spendHint()) return;

        const target = unfound[Math.floor(Math.random() * unfound.length)];
        gs.hintActive = true;

        const hLeft = document.getElementById('hints-left');
        const hBtn  = document.getElementById('hint-btn');
        if (hLeft) hLeft.textContent = hintsLeft();
        if (hBtn)  hBtn.disabled     = hintsLeft() <= 0;

        const el = document.getElementById(`gi-${target.id}-0`);
        if (el) {
            el.classList.add('hint-glow');
            setTimeout(() => { el.classList.remove('hint-glow'); gs.hintActive = false; }, HINT_DURATION);
        } else {
            gs.hintActive = false;
        }
    },

    // ----- Достижения -----

    checkAchievements() {
        let updated = false;
        ACHIEVEMENTS.forEach(ach => {
            if (!save.achievements[ach.id] && ach.check(save)) { save.achievements[ach.id] = true; updated = true; }
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
            const prog = ach.progress ? `<div class="achievement-progress">${ach.progress(save)}</div>` : '';
            card.innerHTML = `
                <div class="achievement-icon">${done ? ach.icon : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                    ${prog}
                </div>
                <div style="font-size:1.3rem">${done ? '✅' : ''}</div>`;
            list.appendChild(card);
        });
    },

    // ----- Настройки -----

    updateSettingsUI() {
        const s   = document.getElementById('sound-toggle');
        const m   = document.getElementById('music-toggle');
        const vol = document.getElementById('music-volume-slider');
        const lbl = document.getElementById('music-volume-label');
        if (s)   { s.textContent = save.settings.sound ? 'ВКЛ' : 'ВЫКЛ'; s.classList.toggle('off', !save.settings.sound); }
        if (m)   { m.textContent = Music.isEnabled() ? 'ВКЛ' : 'ВЫКЛ'; m.classList.toggle('off', !Music.isEnabled()); }
        if (vol) { vol.value = Math.round(Music.getVolume() * 100); }
        if (lbl) { lbl.textContent = Math.round(Music.getVolume() * 100) + '%'; }
    },

    toggleSound() {
        save.settings.sound = !save.settings.sound;
        localStorage.setItem('sounds_enabled', String(save.settings.sound));
        persist();
        this.updateSettingsUI();
    },

    toggleMusic() {
        if (Music.isEnabled()) Music.disable();
        else Music.enable();
        this.updateSettingsUI();
    },

    resetSave() {
        if (!confirm('Сбросить весь прогресс? Это действие необратимо.')) return;
        localStorage.removeItem(SAVE_KEY);
        save = defaultSave();
        persist();
        this.showMain();
    },

    resetNovels() {
        delete save.novel_shown;
        delete save.chapters;
        persist();
        alert('Флаги новеллы и фотокарточек сброшены.');
    },

    // ----- Реклама (заглушка до Яндекс SDK) -----
    showCoinsModal() {
        const modal = document.getElementById('coins-modal');
        const panel = document.getElementById('coins-modal-panel');
        modal.classList.remove('hidden');
        panel.classList.remove('animate__zoomOut');
        panel.classList.add('animate__animated', 'animate__zoomIn');
        panel.style.setProperty('--animate-duration', '0.3s');
    },
    hideCoinsModal() {
        const modal = document.getElementById('coins-modal');
        const panel = document.getElementById('coins-modal-panel');
        panel.classList.remove('animate__zoomIn');
        panel.classList.add('animate__zoomOut');
        panel.style.setProperty('--animate-duration', '0.25s');
        setTimeout(() => modal.classList.add('hidden'), 250);
    }
};

// =============================================
// БЕГУЩАЯ СТРОКА
// =============================================
// МАГАЗИН
// =============================================

const SHOP_TABS = [
    { id: 'hints',  label: 'Подсказки' },
    { id: 'energy', label: 'Энергия'   },
    { id: 'murzik', label: 'Мурзик'    },
    { id: 'malina', label: 'Малина'    },
];

const SHOP_ITEMS = {
    hints: [
        { id: 'hint1',      icon: 'reward_hint.png.png',   name: 'Подсказка х1',   currency: 'coins',  price: 50,  amount: 1  },
        { id: 'hint5',      icon: 'reward_hint.png.png',   name: 'Подсказка х5',   currency: 'coins',  price: 200, amount: 5  },
        { id: 'hint10',     icon: 'reward_hint.png.png',   name: 'Подсказка х10',  currency: 'coins',  price: 350, amount: 10 },
    ],
    energy: [
        { id: 'energy1',    icon: 'reward_energy.png.png', name: '+1 энергия',        currency: 'coins',  price: 100, amount: 1  },
        { id: 'energy3',    icon: 'reward_energy.png.png', name: '+3 энергии',        currency: 'coins',  price: 200, amount: 3  },
        { id: 'energyFull', icon: 'reward_energy.png.png', name: 'Полная энергия 8/8', currency: 'malina', price: 10,  amount: 0  },
    ],
    murzik: [
        { id: 'murzik1',  icon: 'char_murzik.png.png', name: 'Мурзик 1 день',  currency: 'malina', price: 15,  days: 1  },
        { id: 'murzik7',  icon: 'char_murzik.png.png', name: 'Мурзик 7 дней',  currency: 'malina', price: 85,  days: 7  },
        { id: 'murzik14', icon: 'char_murzik.png.png', name: 'Мурзик 14 дней', currency: 'malina', price: 160, days: 14 },
    ],
    malina: [
        { id: 'malina10',  icon: 'icon_malina.png.png', name: '10 малины',  currency: 'rub', price: '59₽'  },
        { id: 'malina50',  icon: 'icon_malina.png.png', name: '50 малины',  currency: 'rub', price: '249₽' },
        { id: 'malina120', icon: 'icon_malina.png.png', name: '120 малины', currency: 'rub', price: '499₽' },
    ],
};

const Shop = (() => {
    let _tab = 'hints';

    function _canAfford(item) {
        if (item.currency === 'coins')  return save.coins  >= item.price;
        if (item.currency === 'malina') return save.malina >= item.price;
        return true;
    }

    function _priceLabel(item) {
        if (item.currency === 'coins')
            return `<img src="assets/icon_coin.png.png" class="shop-card-price-icon" alt=""> ${item.price}`;
        if (item.currency === 'malina')
            return `<img src="assets/icon_malina.png.png" class="shop-card-price-icon" alt=""> ${item.price}`;
        return item.price;
    }

    function _fly(iconSrc, fromEl) {
        const rect = fromEl.getBoundingClientRect();
        const img = document.createElement('img');
        img.src = `assets/${iconSrc}`;
        Object.assign(img.style, {
            position: 'fixed', pointerEvents: 'none', zIndex: '1000',
            width: '44px', height: '44px', objectFit: 'contain',
            left: `${rect.left + rect.width / 2 - 22}px`,
            top:  `${rect.top}px`,
            transition: 'top 0.75s ease-out, opacity 0.75s ease-out, transform 0.75s ease-out',
        });
        document.body.appendChild(img);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            img.style.top       = `${rect.top - 100}px`;
            img.style.opacity   = '0';
            img.style.transform = 'scale(0.4)';
        }));
        setTimeout(() => img.remove(), 850);
    }

    function notify(msg, type = 'success') {
        const el = document.getElementById('shop-notify');
        if (!el) return;
        el.textContent = msg;
        el.className = `shop-notify ${type}`;
        clearTimeout(el._t);
        el._t = setTimeout(() => el.classList.add('hidden'), 2200);
    }

    function renderTabs() {
        const c = document.getElementById('shop-tabs');
        if (!c) return;
        c.innerHTML = '';
        SHOP_TABS.forEach(t => {
            const btn = document.createElement('button');
            btn.className = `shop-tab${t.id === _tab ? ' active' : ''}`;
            btn.textContent = t.label;
            btn.onclick = () => { _tab = t.id; renderTabs(); renderCards(); };
            c.appendChild(btn);
        });
    }

    function renderCards() {
        const c = document.getElementById('shop-cards');
        if (!c) return;
        c.innerHTML = '';
        SHOP_ITEMS[_tab].forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-card';
            const affordable = _canAfford(item);
            card.innerHTML = `
                <img src="assets/${item.icon}" class="shop-card-icon" id="si-${item.id}" alt="">
                <div class="shop-card-name">${item.name}</div>
                <div class="shop-card-price">${_priceLabel(item)}</div>
                <button class="shop-card-buy${affordable ? '' : ' cant-afford'}"
                        onclick="Shop.buy('${item.id}')"></button>`;
            c.appendChild(card);
        });
    }

    return {
        init() { _tab = 'hints'; renderTabs(); renderCards(); },
        openTab(tabId) { _tab = tabId; renderTabs(); renderCards(); },

        buy(itemId) {
            let item = null;
            for (const list of Object.values(SHOP_ITEMS)) {
                item = list.find(i => i.id === itemId);
                if (item) break;
            }
            if (!item) return;

            if (item.currency === 'rub') {
                document.getElementById('shop-malina-popup').classList.remove('hidden');
                return;
            }

            if (!_canAfford(item)) {
                notify(item.currency === 'coins' ? 'Недостаточно монет!' : 'Недостаточно малины!', 'error');
                return;
            }

            if (item.currency === 'coins')  save.coins  -= item.price;
            if (item.currency === 'malina') save.malina -= item.price;

            const iconEl = document.getElementById(`si-${item.id}`);

            if (itemId.startsWith('hint')) {
                save.hints.extra = (save.hints.extra || 0) + item.amount;
                if (iconEl) _fly(item.icon, iconEl);
                notify(`+${item.amount} подсказок добавлено!`, 'success');
                const hLeft = document.getElementById('hints-left');
                if (hLeft) hLeft.textContent = hintsLeft();
            } else if (itemId.startsWith('energy')) {
                syncEnergy();
                if (itemId === 'energyFull') {
                    // Восстанавливает до 8, но не уменьшает если уже больше 8
                    if (save.energy.current >= ENERGY_MAX) {
                        notify('Энергия уже полная или заряжена выше!', 'info');
                        if (item.currency === 'coins')  save.coins  += item.price;
                        if (item.currency === 'malina') save.malina += item.price;
                        updateHUD(); return;
                    }
                    save.energy.current = ENERGY_MAX;
                    notify('Энергия восстановлена до 8!', 'success');
                } else {
                    // Обычная покупка — может превышать 8 (сверхзаряд)
                    save.energy.current += item.amount;
                    notify(`+${item.amount} энергии!`, 'success');
                }
                if (iconEl) _fly(item.icon, iconEl);
            } else if (itemId.startsWith('murzik')) {
                const now = Date.now();
                const base = (save.murzik && save.murzik.expires > now) ? save.murzik.expires : now;
                save.murzik = { active: true, expires: base + item.days * 86400000 };
                if (iconEl) _fly(item.icon, iconEl);
                notify(`Мурзик активен ${item.days} дн.!`, 'success');
            }

            persist();
            updateHUD();
            renderCards();
        },

        closeMalinaPopup() {
            document.getElementById('shop-malina-popup').classList.add('hidden');
        },

        notify,
    };
})();

// =============================================

const NICK_EVENT_TEMPLATES = [
    "{nick} нашла все предметы за 2 минуты!",
    "{nick} получила 3 звезды на уровне 7!",
    "{nick} вернулась и забрала ежедневную награду!",
    "{nick} установила личный рекорд на кухне бабушки!",
    "{nick} нашла секретный предмет!",
    "{nick} прошла 5 уровней подряд без ошибок!",
    "{nick} открыла достижение «Настоящий сыщик»!",
    "{nick} собрала все звёзды на первой локации!",
];

const newsEvents = [
    "Марина прошла уровень «Кухня» без единой ошибки! ⭐⭐⭐",
    "pechkin73 нашёл все предметы за 1 минуту 58 секунд!",
    "Людочка_НН приобрела кота Мурзика 🐱",
    "sunny_garden открыла локацию «Баня»!",
    "Таня из Самары собрала все звёзды на кухне!",
    "dacha_lover прошёл 10 уровней подряд!",
    "Валерия_1981 получила достижение «Настоящий сыщик»!",
    "kot_murzik_fan установила рекорд на уровне 5!",
    "Бабуленька открыла новый альбом воспоминаний 📸",
    "alexey_v нашёл секретный предмет на кухне!",
    "Жанна прошла уровень «Огород» с тремя звёздами!",
    "zvezda_derevni приобрела скин для Мурзика 🐱",
    "Надюша вернулась после 5 дней и получила бонус!",
    "gryadki2024 собрал 1000 монет за один день!",
    "Светик_Мозырь нашла все предметы в локации «Сарай»!",
    "varenye_pro прошла уровень без подсказок!",
    "Оленька_Тверь получила 3 звезды на всех уровнях!",
    "dachnik_forever открыл локацию «Речка»!",
    "Зоя прошла обучение и сразу взяла 3 звезды!",
    "ogurcy_i_pomidory установил личный рекорд скорости!"
];

function initTicker() {
    const track = document.getElementById('news-ticker-track');
    if (!track || track.dataset.inited) return;
    track.dataset.inited = '1';

    // Вставляем персонализированные события (30% шанс для каждого)
    const playerNick = Profile ? Profile.getNick() : null;
    let events = [...newsEvents];
    if (playerNick) {
        events = events.map(e =>
            Math.random() < 0.3
                ? NICK_EVENT_TEMPLATES[Math.floor(Math.random() * NICK_EVENT_TEMPLATES.length)]
                    .replace('{nick}', playerNick)
                : e
        );
    }

    // Перемешиваем случайно
    const shuffled = [...events].sort(() => Math.random() - 0.5);

    // Строим контент с разделителями
    const fragment = document.createDocumentFragment();

    function buildItems() {
        shuffled.forEach(text => {
            const sep  = document.createElement('span');
            sep.className   = 'news-ticker-sep';
            sep.textContent = ' ✦ ';
            fragment.appendChild(sep);

            const item = document.createElement('span');
            item.className   = 'news-ticker-item';
            item.textContent = '🌟 ' + text;
            fragment.appendChild(item);
        });
    }

    // Дублируем контент дважды для бесшовного цикла (анимация -50%)
    buildItems();
    buildItems();

    track.appendChild(fragment);
}

// =============================================
// ОБУЧЕНИЕ
// =============================================

const TUTORIAL_STEPS = [
    {
        screen:   'screen-main',
        raiseSel: '#top-panel',
        frameSel: '.top-bar-left',
        text:     'Здесь хранятся твои монеты 🪙, энергия ⚡ и малина 🍓. Монеты получаешь за прохождение уровней. Энергия тратится на каждый уровень и восстанавливается со временем. Малина — особая валюта для магазина.'
    },
    {
        screen:   'screen-main',
        raiseSel: '.side-btns',
        frameSel: '.side-btns',
        text:     'В Магазине 🏪 можно купить подсказки и бонусы. В Альбоме 📸 хранятся твои воспоминания о лете. В Настройках ⚙️ можно выключить звук и музыку.'
    },
    {
        screen:   'screen-main',
        raiseSel: '.coins-btn-wrap',
        frameSel: '.coins-btn-wrap',
        text:     'Здесь ты можешь получить бесплатные монеты 🪙 за просмотр короткой рекламы. Смотри рекламу — копи монеты на подсказки и бонусы!'
    },
    {
        screen:   'screen-main',
        raiseSel: '.daily-btn-wrap',
        frameSel: '.daily-btn-wrap',
        text:     'Каждый день заходи в игру и забирай подарок 🎁 Чем дольше играешь без пропусков — тем ценнее награда! На 7-й день подряд получишь особую малину 🍓'
    },
    {
        screen:   'screen-main',
        raiseSel: '.main-play-wrap',
        frameSel: '.main-play-wrap',
        text:     'Нажми Играть чтобы начать помогать бабушке Гале!'
    },
    {
        screen:   'screen-map',
        raiseSel: '.map-board-wrap',
        frameSel: '.level-cell',
        text:     'Выбери первый уровень. Следующие откроются по мере прохождения!'
    },
    {
        screen:   'screen-game',
        raiseSel: '#screen-game',
        frameSel: '.game-bottom-panel',
        text:     'Вот что нужно найти на кухне! Ищи каждый предмет из списка.'
    },
    {
        screen:   'screen-game',
        raiseSel: '#screen-game',
        frameSel: '#game-area',
        text:     'Внимательно осмотри кухню и нажимай на нужные предметы!'
    },
    {
        screen:   'screen-game',
        raiseSel: '#screen-game',
        frameSel: '#lives-display',
        text:     'Осторожно — за неверный клик теряешь жизнь. Три ошибки и уровень начнётся заново!'
    },
    {
        screen:   'screen-game',
        raiseSel: '#screen-game',
        frameSel: '#timer-display',
        text:     'Найди все предметы до того как кончится время!'
    },
    {
        screen:   'screen-game',
        raiseSel: '#screen-game',
        frameSel: '#hint-btn',
        text:     'Если застрял — используй подсказку! Три бесплатные подсказки каждый день.'
    }
];

const Tutorial = {
    step:    0,
    active:  false,
    _raised: [],

    isDone() { return !!localStorage.getItem('tutorial_done'); },

    start() {
        if (this.isDone()) return;
        this.active = true;
        this.step   = 0;
        this._go();
    },

    _go() {
        const cfg  = TUTORIAL_STEPS[this.step];
        const prev = this.step > 0 ? TUTORIAL_STEPS[this.step - 1] : null;

        // Переход на нужный экран при смене
        if (!prev || prev.screen !== cfg.screen) {
            if (cfg.screen === 'screen-main') Game.showMain();
            if (cfg.screen === 'screen-map')  Game.showMap();
            if (cfg.screen === 'screen-game') this._startDemo();
        }

        // Небольшая задержка чтобы DOM обновился
        setTimeout(() => this._render(cfg), 80);
    },

    _render(cfg) {
        this._clearHighlight();

        // Показываем оверлей и панель (они теперь отдельные элементы)
        document.getElementById('tutorial-overlay').classList.remove('hidden');
        document.getElementById('tutorial-panel').style.display = 'flex';

        // Поднимаем нужный элемент над оверлеем (z-index 502 > 500)
        if (cfg.raiseSel) {
            document.querySelectorAll(cfg.raiseSel).forEach(el => {
                el.classList.add('tut-raised');
                this._raised.push(el);
            });
        }

        // Золотая рамка вокруг конкретного элемента (z-index 506, выше raised)
        const frame = document.getElementById('tutorial-frame');
        const target = cfg.frameSel ? document.querySelector(cfg.frameSel) : null;
        if (target) {
            const r = target.getBoundingClientRect();
            const p = 8;
            frame.style.left    = (r.left   - p) + 'px';
            frame.style.top     = (r.top    - p) + 'px';
            frame.style.width   = (r.width  + p * 2) + 'px';
            frame.style.height  = (r.height + p * 2) + 'px';
            frame.style.display = 'block';
        } else {
            frame.style.display = 'none';
        }

        // Текст и кнопка
        document.getElementById('tutorial-text').textContent = cfg.text;
        document.getElementById('tutorial-next-btn').textContent =
            this.step >= TUTORIAL_STEPS.length - 1 ? '🎮 Начать игру!' : 'Далее ▶';
    },

    _clearHighlight() {
        this._raised.forEach(el => el.classList.remove('tut-raised'));
        this._raised = [];
        const frame = document.getElementById('tutorial-frame');
        if (frame) frame.style.display = 'none';
    },

    // Запускаем демо-версию уровня 1 для показа игрового экрана (таймер на паузе)
    _startDemo() {
        if (!levelsData) return;
        currentLevel = levelsData.levels[0];
        gs = {
            lives:       3,
            timeLeft:    currentLevel.timer || 420,
            found:       0,
            total:       currentLevel.items.length,
            items:       currentLevel.items.map(id => ({
                             ...(levelsData.items.find(i => i.id === id)
                              || levelsData.bath_items.find(i => i.id === id)),
                             found: false
                         })),
            timerHandle: null,
            hintActive:  false,
            perfectRun:  true,
            startTime:   Date.now()
        };
        Game.showScreen('screen-game');
        Game.renderGame();
        // Таймер НЕ запускается — туториал управляет паузой
    },

    next() {
        this.step++;
        if (this.step >= TUTORIAL_STEPS.length) {
            this.complete();
            return;
        }
        this._go();
    },

    complete() {
        localStorage.setItem('tutorial_done', 'true');
        this.active = false;
        this._clearHighlight();
        document.getElementById('tutorial-overlay').classList.add('hidden');
        document.getElementById('tutorial-panel').style.display = 'none';
        document.getElementById('tutorial-frame').style.display = 'none';
        Game.showMain();
        updateHUD();
    }
};

// =============================================
// ИНИЦИАЛИЗАЦИЯ
// =============================================

// =============================================
// РЕЖИМ РАЗРАБОТЧИКА (клавиша D)
// =============================================

// Создаём панель один раз, скрыта по умолчанию
function getDevPanel() {
    let panel = document.getElementById('devcoords-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id        = 'devcoords-panel';
        panel.className = 'devcoords-panel';
        panel.innerHTML =
            `<div class="dev-title">🛠 DEV MODE</div>` +
            `<div class="dev-coord" id="dev-x">x: —</div>` +
            `<div class="dev-coord" id="dev-y">y: —</div>` +
            `<div class="dev-hint">клик на поле → копировать</div>` +
            `<div class="dev-copied" id="dev-copied" style="display:none">✓ Скопировано!</div>`;
        document.body.appendChild(panel);
    }
    return panel;
}

// Пробел / Enter — переход к следующей реплике новеллы
document.addEventListener('keydown', e => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const story = document.getElementById('screen-story');
    if (!story || !story.classList.contains('active')) return;
    e.preventDefault();
    Game.storyAdvance();
});

// Клавиша E — мгновенное восстановление энергии (только для тестирования)
document.addEventListener('keydown', e => {
    if (e.key !== 'e' && e.key !== 'E') return;
    save.energy.current    = ENERGY_MAX;
    save.energy.lastUpdate = Date.now();
    persist();
    updateHUD();
    console.log('%c[DEV] Энергия восстановлена до максимума', 'color:lime; font-weight:bold');
});

// Переключение по D
document.addEventListener('keydown', e => {
    if (e.key !== 'd' && e.key !== 'D') return;
    devMode = !devMode;
    const panel = getDevPanel();
    panel.style.display = devMode ? '' : 'none';
});

// Обновляем координаты при движении мыши (в реальном времени)
document.addEventListener('mousemove', e => {
    if (!devMode) return;
    const area = document.getElementById('game-area');
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width).toFixed(3);
    const ry = ((e.clientY - rect.top)  / rect.height).toFixed(3);
    const xEl = document.getElementById('dev-x');
    const yEl = document.getElementById('dev-y');
    if (xEl) xEl.textContent = `x: ${rx}`;
    if (yEl) yEl.textContent = `y: ${ry}`;
});

// =============================================
// МУЗЫКА (Howler.js)
// =============================================

const Music = (() => {
    const TRACKS = {
        main: 'assets/Zvonkiy_ruchey.mp3',
        game: 'assets/Zvonkiy_ruchey (1).mp3'
    };
    const VOL_DEFAULT = 0.08;
    let VOL          = VOL_DEFAULT;
    let _unlocked    = false;
    let _enabled     = true;
    let _want        = null;   // трек, который хотим играть
    let _active      = null;   // трек, играющий сейчас
    let _switchToken = 0;      // защита от гонки при быстрых переходах
    const _howls     = {};

    function _mk(src) {
        return new Howl({ src: [src], loop: true, volume: 0,
                          html5: true /* избегаем задержки декодирования */ });
    }

    function _startTrack(name, token) {
        if (token !== _switchToken) return;   // устарело — выходим
        const h = _howls[name];
        h.volume(0);
        if (!h.playing()) h.play();
        h.fade(0, VOL, 800);
    }

    function _switchTo(name) {
        if (!_unlocked || !_enabled) { _want = name; return; }
        if (_active === name) return;

        const prev  = _active;
        _active     = name;
        const token = ++_switchToken;

        if (prev && _howls[prev] && _howls[prev].playing()) {
            // Fade out старого → после завершения стартуем новый
            _howls[prev].fade(_howls[prev].volume(), 0, 500);
            _howls[prev].once('fade', () => {
                _howls[prev].stop();
                _startTrack(name, token);
            });
        } else {
            _startTrack(name, token);
        }
    }

    return {
        init() {
            _howls.main = _mk(TRACKS.main);
            _howls.game = _mk(TRACKS.game);

            const stored = localStorage.getItem('music_enabled');
            _enabled = stored === null ? save.settings.music : stored === 'true';

            const storedVol = parseFloat(localStorage.getItem('music_volume'));
            if (!isNaN(storedVol)) VOL = storedVol;

            // Разблокировка после первого пользовательского жеста
            const unlock = () => {
                if (_unlocked) return;
                _unlocked = true;
                if (_enabled && _want) _switchTo(_want);
            };
            document.addEventListener('click',      unlock, { capture: true });
            document.addEventListener('touchstart', unlock, { capture: true });
        },

        forScreen(screenId) {
            if (screenId === 'screen-main' || screenId === 'screen-map') {
                _want = 'main'; _switchTo('main');
            } else if (screenId === 'screen-game') {
                _want = 'game'; _switchTo('game');
            }
            // Прочие экраны — музыка не меняется
        },

        enable() {
            _enabled = true;
            save.settings.music = true;
            localStorage.setItem('music_enabled', 'true');
            persist();
            if (_unlocked && _want) { _active = null; _switchTo(_want); }
        },

        disable() {
            _enabled = false;
            save.settings.music = false;
            localStorage.setItem('music_enabled', 'false');
            persist();
            Object.values(_howls).forEach(h => {
                if (h.playing()) {
                    h.fade(h.volume(), 0, 500);
                    h.once('fade', () => h.stop());
                }
            });
            _active = null;
        },

        setVolume(v) {
            VOL = Math.max(0, Math.min(1, v));
            localStorage.setItem('music_volume', VOL);
            if (_active && _howls[_active] && _howls[_active].playing()) {
                _howls[_active].volume(VOL);
            }
        },

        getVolume()  { return VOL; },
        isEnabled()  { return _enabled; }
    };
})();

// =============================================
// ЕЖЕДНЕВНЫЕ НАГРАДЫ
// =============================================

const DAILY_KEY = 'daily_reward';

const DAILY_REWARDS = [
    { day:1, type:'coins',  amount:50,  icon:'assets/reward_coins.png.png',      label:'+50 монет'   },
    { day:2, type:'energy', amount:2,   icon:'assets/reward_energy.png.png',     label:'+2 энергии'  },
    { day:3, type:'hints',  amount:2,   icon:'assets/reward_hint.png.png',       label:'+2 подсказки'},
    { day:4, type:'coins',  amount:100, icon:'assets/reward_coins.png.png',      label:'+100 монет'  },
    { day:5, type:'energy', amount:3,   icon:'assets/reward_energy.png.png',     label:'+3 энергии'  },
    { day:6, type:'coins',  amount:200, icon:'assets/reward_coins_big.png.png',  label:'+200 монет'  },
    { day:7, type:'malina', amount:10,  icon:'assets/reward_malina_big.png.png', label:'+10 малины'  },
];

const DailyReward = {
    _load() {
        try {
            const raw = localStorage.getItem(DAILY_KEY);
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return { lastClaim: 0, currentDay: 1, streak: 0 };
    },

    _save(data) {
        localStorage.setItem(DAILY_KEY, JSON.stringify(data));
    },

    _isAvailable(data) {
        return (Date.now() - (data.lastClaim || 0)) >= 24 * 60 * 60 * 1000;
    },

    _checkStreak() {
        const data = this._load();
        if (data.lastClaim > 0) {
            const hoursSince = (Date.now() - data.lastClaim) / 3600000;
            if (hoursSince >= 48) {
                data.currentDay = 1;
                data.streak     = 0;
                this._save(data);
            }
        }
    },

    init() {
        this._checkStreak();
        this.updateIndicator();
    },

    updateIndicator() {
        const data = this._load();
        const dot  = document.getElementById('daily-dot');
        if (dot) dot.classList.toggle('hidden', !this._isAvailable(data));
    },

    show() {
        this._checkStreak();
        this._render();
        const modal = document.getElementById('daily-modal');
        const panel = document.getElementById('daily-panel');
        modal.classList.remove('hidden');
        panel.classList.remove('animate__zoomOut');
        panel.classList.add('animate__animated', 'animate__zoomIn');
        panel.style.setProperty('--animate-duration', '0.35s');
    },

    hide() {
        const modal = document.getElementById('daily-modal');
        const panel = document.getElementById('daily-panel');
        panel.classList.remove('animate__zoomIn');
        panel.classList.add('animate__zoomOut');
        panel.style.setProperty('--animate-duration', '0.25s');
        setTimeout(() => modal.classList.add('hidden'), 250);
    },

    _render() {
        const data      = this._load();
        const available = this._isAvailable(data);
        const cycle     = data.streak >= 7 ? 1.5 : 1;
        const curDay    = data.currentDay || 1;
        const grid      = document.getElementById('daily-grid');
        if (!grid) return;
        grid.innerHTML  = '';

        DAILY_REWARDS.forEach((reward, i) => {
            const day    = i + 1;
            const isPast = day < curDay;
            const isCur  = day === curDay;
            const cell   = document.createElement('div');
            cell.className = 'daily-cell' + (isPast ? ' past' : isCur ? ' current' : ' future');

            const scaledAmt = cycle > 1 ? Math.round(reward.amount * cycle) : reward.amount;
            const label     = reward.label.replace(/\d+/, scaledAmt);

            cell.innerHTML =
                `<div class="daily-cell-day">День ${day}</div>` +
                `<div class="daily-cell-icon-wrap">` +
                    `<img src="${reward.icon}" class="daily-cell-icon" alt="" onerror="this.style.fontSize='1.6rem';this.outerHTML='<span style=\\'font-size:1.6rem\\'>🎁</span>'">` +
                    (isPast ? '<div class="daily-cell-check">✓</div>' : '') +
                `</div>` +
                `<div class="daily-cell-label">${label}</div>`;

            grid.appendChild(cell);
        });

        const btn = document.getElementById('daily-claim-btn');
        if (btn) {
            btn.disabled    = !available;
            btn.textContent = available ? '🎁 Забрать награду!' : '✓ Уже забрано сегодня';
        }
    },

    claim() {
        const data = this._load();
        if (!this._isAvailable(data)) return;

        const cycle    = data.streak >= 7 ? 1.5 : 1;
        const dayIdx   = ((data.currentDay || 1) - 1) % 7;
        const reward   = DAILY_REWARDS[dayIdx];
        const amount   = cycle > 1 ? Math.round(reward.amount * cycle) : reward.amount;

        switch (reward.type) {
            case 'coins':  save.coins += amount; break;
            case 'energy': save.energy.current += amount; break; // сверхзаряд разрешён
            case 'hints':  save.hints.used = Math.max(0, save.hints.used - amount); break;
            case 'malina': save.malina = (save.malina || 0) + amount; break;
        }
        persist();
        updateHUD();

        data.lastClaim  = Date.now();
        data.streak     = (data.streak || 0) + 1;
        data.currentDay = (((data.currentDay || 1) - 1 + 1) % 7) + 1;
        this._save(data);

        this.hide();
        this.updateIndicator();
        this._showToast(reward, amount);
    },

    _showToast(reward, amount) {
        const label = reward.label.replace(/\d+/, amount);
        const el    = document.createElement('div');
        el.className = 'reward-toast';
        el.innerHTML =
            `<img src="${reward.icon}" class="reward-toast-icon" alt="" onerror="this.style.display='none'">` +
            `<span>${label}</span>`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('visible'));
        setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 400);
        }, 2600);
    }
};

// =============================================
// ПРОФИЛЬ ИГРОКА
// =============================================

const Profile = (() => {
    const KEY = 'leto_babushka_profile';
    let _data = null;
    let _setupAvatar = null;
    let _changeAvatar = null;

    function _load() {
        try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
    }

    function _renderGrid(containerId, current, onPick) {
        const grid = document.getElementById(containerId);
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 1; i <= 6; i++) {
            const opt = document.createElement('div');
            opt.className = 'avatar-option' + (current === i ? ' selected' : '');
            opt.innerHTML = `<img src="assets/avatar_${i}.png.png" class="av-img" alt="Аватар ${i}">`;
            opt.addEventListener('click', () => {
                grid.querySelectorAll('.avatar-option')
                    .forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                onPick(i);
            });
            grid.appendChild(opt);
        }
    }

    function _validate() {
        const nick = (document.getElementById('profile-nick-input')?.value || '').trim();
        const ok = nick.length >= 3
            && /^[а-яёА-ЯЁa-zA-Z0-9]+$/.test(nick)
            && _setupAvatar !== null;
        const btn = document.getElementById('profile-start-btn');
        if (btn) btn.disabled = !ok;
    }

    function _updatePanel() {
        if (!_data) return;
        const img  = document.getElementById('profile-avatar-img');
        const nick = document.getElementById('profile-nick-display');
        if (img)  img.src = `assets/avatar_${_data.avatar}.png.png`;
        if (nick) nick.textContent = _data.nick;
    }

    function _showPanel() {
        _updatePanel();
        document.getElementById('profile-panel')?.classList.remove('hidden');
    }

    return {
        init() {
            _data = _load();
            if (_data?.nick) {
                _showPanel();
                afterProfileInit();
                return;
            }
            // Первый запуск — показываем форму выбора ника/аватара
            _setupAvatar = null;
            _renderGrid('profile-avatar-grid', null, av => {
                _setupAvatar = av;
                _validate();
            });
            const input = document.getElementById('profile-nick-input');
            input?.addEventListener('input', _validate);
            document.getElementById('profile-setup-modal')?.classList.remove('hidden');
        },

        save() {
            const nick = (document.getElementById('profile-nick-input')?.value || '').trim();
            if (!nick || nick.length < 3 || _setupAvatar === null) return;
            _data = { nick, avatar: _setupAvatar, created: Date.now() };
            localStorage.setItem(KEY, JSON.stringify(_data));
            document.getElementById('profile-setup-modal')?.classList.add('hidden');
            _showPanel();
            afterProfileInit();
        },

        openAvatarChange() {
            _changeAvatar = _data?.avatar ?? 1;
            _renderGrid('change-avatar-grid', _changeAvatar, av => { _changeAvatar = av; });
            document.getElementById('avatar-change-modal')?.classList.remove('hidden');
        },

        closeAvatarChange() {
            document.getElementById('avatar-change-modal')?.classList.add('hidden');
        },

        saveAvatar() {
            if (_changeAvatar === null || !_data) return;
            _data.avatar = _changeAvatar;
            localStorage.setItem(KEY, JSON.stringify(_data));
            this.closeAvatarChange();
            _updatePanel();
        },

        showPanel()  { _showPanel(); },
        hidePanel()  { document.getElementById('profile-panel')?.classList.add('hidden'); },
        getNick()    { return _data?.nick ?? null; },
    };
})();

// =============================================
// АНИМАЦИЯ ЛОГОТИПА
// =============================================

function animateLogo() {
    const logo = document.getElementById('logo-title');
    if (!logo) return;

    // Фаза 1: своя анимация jackIn с сохранением translate(-50%,-50%) — строго по центру
    logo.style.animation = 'logoJackIn 0.9s cubic-bezier(0.215, 0.61, 0.355, 1) both';

    // Фаза 2: после анимации + пауза — плавный уплыв в угол
    setTimeout(() => {
        logo.style.animation = '';   // снимаем анимацию
        logo.style.opacity   = '1'; // закрепляем видимость

        // Два rAF: даём браузеру два кадра зафиксировать текущую позицию,
        // только после этого запускаем transition — иначе прыжок без анимации
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                logo.style.transition = [
                    'left 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    'top 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                ].join(', ');
                logo.style.left      = '420px';
                logo.style.top       = '90px';
                logo.style.transform = 'none';
                logo.style.width     = '420px';
            });
        });
    }, 2000);
}

function afterProfileInit() {
    Game.showMain();
    animateLogo();
    initTicker();
    Tutorial.start();
}

async function init() {
    try {
        const resp = await fetch('levels.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        levelsData = await resp.json();
    } catch (e) {
        console.error('Не удалось загрузить levels.json:', e);
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;
                        font-family:sans-serif;color:#fff;text-align:center;padding:20px;background:#2c1810">
                <div>
                    <div style="font-size:3rem">⚠️</div>
                    <h2>Не удалось загрузить игру</h2>
                    <p style="margin-top:12px;opacity:.7">
                        Убедитесь что levels.json находится рядом с index.html<br>
                        и откройте игру через Live Server, а не через file://
                    </p>
                </div>
            </div>`;
        return;
    }

    Game.checkAchievements();
    updateHUD();
    Music.init();
    DailyReward.init();
    Profile.init(); // вызывает afterProfileInit() сам — сразу или после ввода ника
}

init();

// ===== DEV TOOLS =====
const DevTools = {
    active: false,
    zonesVisible: false,

    toggle() {
        this.active = !this.active;
        const panel = document.getElementById('dev-panel');
        if (panel) panel.style.display = this.active ? 'flex' : 'none';
        if (!this.active && this.zonesVisible) this.hideZones();
    },

    toggleZones() {
        this.zonesVisible ? this.hideZones() : this.drawZones();
    },

    drawZones() {
        if (!gs || !gs.items || !gs.items.length) return;
        const canvas = document.getElementById('dev-zones-canvas');
        const area   = document.getElementById('game-area');
        if (!canvas || !area) return;

        const rect = area.getBoundingClientRect();
        canvas.width  = rect.width;
        canvas.height = rect.height;
        canvas.style.display = 'block';

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const minDim = Math.min(rect.width, rect.height);

        gs.items.forEach(item => {
            const zones = item.zones || [{ x: item.x, y: item.y, radius: item.radius || 0.06 }];
            zones.forEach(zone => {
                ctx.fillStyle   = 'rgba(255,0,0,0.2)';
                ctx.strokeStyle = 'rgba(255,0,0,0.8)';
                ctx.lineWidth   = 2;

                let labelX, labelY;
                if (zone.shape === 'rect') {
                    const rw  = zone.width  * rect.width;
                    const rh  = zone.square ? rw : zone.height * rect.height;
                    const cx  = zone.x * rect.width  + rw / 2;
                    const cy  = zone.y * rect.height + rh / 2;
                    ctx.save();
                    ctx.translate(cx, cy);
                    if (zone.rotation) ctx.rotate(zone.rotation * Math.PI / 180);
                    ctx.beginPath();
                    ctx.rect(-rw / 2, -rh / 2, rw, rh);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                    labelX = cx;
                    labelY = cy;
                } else {
                    const cx = zone.x * rect.width;
                    const cy = zone.y * rect.height;
                    const r  = zone.radius * minDim;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    labelX = cx;
                    labelY = cy;
                }

                ctx.font         = 'bold 11px sans-serif';
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor  = '#000';
                ctx.shadowBlur   = 4;
                ctx.fillStyle    = '#fff';
                ctx.fillText(item.name, labelX, labelY);
                ctx.shadowBlur   = 0;
            });
        });

        const btn = document.getElementById('dev-btn-zones');
        if (btn) btn.style.background = 'rgba(255,80,80,0.4)';
        this.zonesVisible = true;
    },

    hideZones() {
        const canvas = document.getElementById('dev-zones-canvas');
        if (canvas) canvas.style.display = 'none';
        const btn = document.getElementById('dev-btn-zones');
        if (btn) btn.style.background = 'rgba(255,255,255,0.15)';
        this.zonesVisible = false;
    }
};

document.addEventListener('keydown', e => {
    if (e.code === 'KeyD' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        DevTools.toggle();
    }
});
