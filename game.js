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
    ],
    103: [
        { char: 'char_dedushka', side: 'right', name: 'Дед Петрович', text: 'О, а вот и помощники! Наслышан, наслышан...' },
        { char: 'char_grandma',  side: 'left',  name: 'Бабушка Галя', text: 'Дед, покажи им как баню топить по-настоящему!' },
        { char: 'char_maxim',    side: 'left',  name: 'Максим',       text: 'А это правда что баня лечит от всех болезней?' }
    ],
    106: [
        { char: 'char_dedushka', side: 'right', name: 'Дед Петрович', text: 'Гляди-ка, а у меня в бане ключик один завалялся...' },
        { char: 'char_anya',     side: 'left',  name: 'Аня',          text: 'Ключик? Может это от бабушкиной шкатулки?!' },
        { char: 'char_dedushka', side: 'right', name: 'Дед Петрович', text: 'Хех, а ну-ка поищите его получше среди веников!' }
    ],
    110: [
        { char: 'char_maxim',    side: 'left',  name: 'Максим',       text: 'Дедушка, мы нашли ключ! Вот он!' },
        { char: 'char_dedushka', side: 'right', name: 'Дед Петрович', text: 'Ай да молодцы! Теперь можно и шкатулку открыть...' },
        { char: 'char_grandma',  side: 'left',  name: 'Бабушка Галя', text: 'Не сегодня, дорогие мои. Сначала — баня, попарьтесь как следует!' },
        { char: 'char_murzik',   side: 'left',  name: 'Мурзик',       text: 'Мяу! (Мурзик довольно потягивается у печки)' }
    ],
    203: [
        { char: 'char_anya',    side: 'left',  name: 'Аня',          text: 'Бабуля, мы принесли ключ! Давай откроем шкатулку!' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Ох, милые... А я ведь и забыла куда её положила!' },
        { char: 'char_maxim',   side: 'left',  name: 'Максим',       text: 'Бабуль, ну ты даёшь! Будем искать!' }
    ],
    206: [
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Помню, прятала её где-то здесь, в спальне...' },
        { char: 'char_anya',    side: 'left',  name: 'Аня',          text: 'А что в ней такое ценное, бабуль?' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Там вся наша жизнь, внученька. Фотографии, письма... и одна очень важная вещь.' },
        { char: 'char_murzik',  side: 'left',  name: 'Мурзик',       text: 'Мррр... (Мурзик принюхивается к сундуку)' }
    ],
    210: [
        { char: 'char_maxim',   side: 'left',  name: 'Максим',       text: 'Смотрите! Мурзик что-то нашёл под кроватью!' },
        { char: 'char_anya',    side: 'left',  name: 'Аня',          text: 'Это она! Шкатулка!' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'Ну что, открываем? Ключик, не подведи...' },
        { char: 'char_grandma', side: 'right', name: 'Бабушка Галя', text: 'щёлк... Ах вот ты где, моя молодость...' }
    ]
};

// Кастомные ключи localStorage для сцен, у которых числовой id уровня
// пересекается между главами (напр. кухня 10 vs баня 110 не пересекаются,
// но именование в задании отличается от дефолтного `after_${id}`)
const STORY_KEYS = {
    103: 'bath_after_3',
    106: 'bath_after_6',
    110: 'bath_after_10',
    203: 'bedroom_after_3',
    206: 'bedroom_after_6',
    210: 'bedroom_after_10'
};

// Нативное соотношение сторон фоновой картинки уровня (1672×941)
const LEVEL_BG_AR = 1672 / 941;

// Видимый прямоугольник картинки уровня внутри game-area при object-fit: contain.
// Возвращает {left, top, width, height, minDim} в пикселях относительно game-area.
// ВСЕ координаты зон (доли 0..1) считаются относительно этого прямоугольника,
// а не всего экрана — поэтому и клики, и dev-инструменты используют imageRect().
function imageRect(area) {
    const W = area.clientWidth  || area.offsetWidth  || 360;
    const H = area.clientHeight || area.offsetHeight || 500;
    let iw, ih;
    if (W / H > LEVEL_BG_AR) {   // экран шире картинки → полосы слева/справа
        ih = H; iw = H * LEVEL_BG_AR;
    } else {                     // экран уже картинки → полосы сверху/снизу
        iw = W; ih = W / LEVEL_BG_AR;
    }
    return {
        left: (W - iw) / 2, top: (H - ih) / 2,
        width: iw, height: ih,
        minDim: Math.min(iw, ih)
    };
}

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
        // При нуле энергии слегка гасим кнопку, но оставляем кликабельной —
        // на карте игрок увидит, что энергии нет, и сможет её купить
        playBtn.style.opacity = save.energy.current <= 0 ? '0.7' : '1';
        playBtn.style.pointerEvents = '';
    }
}

setInterval(updateHUD, 1000);

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
        if (id !== 'screen-game' && typeof ZoneEditor !== 'undefined' && ZoneEditor.active) ZoneEditor.disable();
        if (id !== 'screen-main' && typeof Profile !== 'undefined') Profile.hidePanel();
    },

    showMain()         { this.stopTimer(); this.showScreen('screen-main'); updateHUD(); Profile.showPanel(); },
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
        const bathDone    = this._bathAllDone();
        const bedroomDone = this._bedroomAllDone();

        const chapters = [
            { name: 'Кухня бабушки', photo: 'photo_kitchen.png.png',   done: kitchenDone },
            { name: 'Баня',          photo: 'photo_bath.png.png',      done: bathDone },
            { name: 'Спальня',       photo: 'photo_bedroom.png.png',   done: bedroomDone },
            ...Array.from({length: 7}, (_, i) => ({ name: `Глава ${i + 4}`, photo: null, done: false }))
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
        const img = document.getElementById('album-lightbox-img');
        img.src = src;
        img.classList.remove('zoomed');
        img.style.transformOrigin = 'center center';
        document.getElementById('album-lightbox-label').textContent = name;
        document.getElementById('album-lightbox').classList.remove('hidden');
    },

    closeAlbumLightbox() {
        document.getElementById('album-lightbox').classList.add('hidden');
    },

    toggleAlbumZoom(e) {
        const img = document.getElementById('album-lightbox-img');
        if (img.classList.contains('zoomed')) {
            img.classList.remove('zoomed');
            img.style.transformOrigin = 'center center';
            return;
        }
        // Точка клика становится центром увеличения
        const rect = img.getBoundingClientRect();
        const ox = ((e.clientX - rect.left) / rect.width) * 100;
        const oy = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${ox}% ${oy}%`;
        img.classList.add('zoomed');
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

    _bathAllDone() {
        return Array.from({length: 10}, (_, i) => i + 101)
            .every(id => ((save.levels[id] || {}).stars || 0) > 0);
    },

    _bedroomAllDone() {
        return Array.from({length: 10}, (_, i) => i + 201)
            .every(id => ((save.levels[id] || {}).stars || 0) > 0);
    },

    selectChapter(name) {
        if (name === 'bath' && !this._kitchenAllDone()) {
            alert('Сначала пройди все уровни Кухни бабушки Гали!');
            return;
        }
        if (name === 'bedroom' && !this._bathAllDone()) {
            alert('Сначала пройди все уровни Бани!');
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
        const bathDone    = this._bathAllDone();

        // Вкладки глав: kitchen, bath и bedroom — интерактивны; остальные заблокированы
        const tabChapters = [
            { id: 'kitchen', unlocked: true },
            { id: 'bath',    unlocked: kitchenDone },
            { id: 'bedroom', unlocked: bathDone },
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
        } else if (currentChapter === 'bedroom') {
            if (bg) bg.className = 'bedroom-bg map-bg-blur';
            if (titleText) titleText.querySelector('textPath').textContent = 'Спальня бабушки';
        } else {
            if (bg) bg.className = 'kitchen-bg map-bg-blur';
            if (titleText) titleText.querySelector('textPath').textContent = 'Кухня бабушки Гали';
        }

        const levels = currentChapter === 'bath'    ? (levelsData.bath_levels || [])
                     : currentChapter === 'bedroom' ? (levelsData.bedroom_levels || [])
                     : levelsData.levels;

        for (let r = 0; r < 5; r++) {
            const row = document.createElement('div');
            row.className = 'level-grid-row';

            for (let c = 0; c < 2; c++) {
                const lvl = levels[r * 2 + c];
                if (!lvl) continue;

                // Блокировка: для доп. глав — предыдущий уровень той же главы; уровень 1 доступен сразу (глава уже открыта)
                let prevDone;
                let isChapterFirst = false;
                if (currentChapter !== 'kitchen') {
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
                const displayNum = currentChapter !== 'kitchen' ? lvl.id - (levels[0].id - 1) : lvl.id;

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
        if (save.energy.current <= 0) { alert('Нет энергии! +1 каждые 15 минут — или купи её за монеты на карте.'); return; }
        if (!spendEnergy()) return;

        currentLevel = levelsData.levels.find(l => l.id === levelId)
                    || (levelsData.bath_levels || []).find(l => l.id === levelId)
                    || (levelsData.bedroom_levels || []).find(l => l.id === levelId);
        if (!currentLevel) return;

        gs = {
            lives:       3,
            timeLeft:    currentLevel.timer || 420,
            found:       0,
            total:       currentLevel.items.length,
            items:       currentLevel.items.map(id => ({
                             ...(levelsData.items.find(i => i.id === id)
                              || (levelsData.bath_items || []).find(i => i.id === id)
                              || (levelsData.bedroom_items || []).find(i => i.id === id)),
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
        if (sceneBg) {
            sceneBg.className = currentLevel.id >= 201 ? 'bedroom-bg'
                               : currentLevel.id >= 101 ? 'bath-bg'
                               : 'kitchen-bg';
        }

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

        // Совмещаем слой предметов с видимой картинкой (contain): проценты детей = доли картинки
        const img = imageRect(area);
        layer.style.left   = img.left   + 'px';
        layer.style.top    = img.top    + 'px';
        layer.style.width  = img.width  + 'px';
        layer.style.height = img.height + 'px';
        layer.style.right  = 'auto';
        layer.style.bottom = 'auto';

        const minDim = img.minDim;

        gs.items.forEach(it => {
            const zones = it.zones || [{ x: it.x, y: it.y, radius: it.radius || 0.06 }];
            zones.forEach((zone, i) => {
                const rBase  = zone.radius || zone.radiusX || (zone.width ? zone.width / 2 : 0.06);
                const sizePx = Math.max(48, rBase * minDim * 2);
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
        const px     = e.clientX - rect.left;   // относительно game-area — для визуальных эффектов
        const py     = e.clientY - rect.top;

        // Блокируем клики во время туториала
        if (Tutorial && Tutorial.active) return;

        // Редактор зон: игровые клики полностью отключены
        if (typeof ZoneEditor !== 'undefined' && ZoneEditor.active) return;

        // Координаты относительно ВИДИМОЙ картинки (contain)
        const img = imageRect(area);
        const ix  = px - img.left;
        const iy  = py - img.top;
        const IW  = img.width, IH = img.height, minDim = img.minDim;

        // Режим разработчика: фиксируем координаты (в долях картинки) и копируем в буфер
        if (devMode) {
            const rx = (ix / IW).toFixed(3);
            const ry = (iy / IH).toFixed(3);
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
                    const rw  = zone.width * IW;
                    const rh  = zone.square ? rw : zone.height * IH;
                    const cx  = zone.x * IW + rw / 2;
                    const cy  = zone.y * IH + rh / 2;
                    let lx = ix - cx, ly = iy - cy;
                    if (zone.rotation) {
                        const a = -zone.rotation * Math.PI / 180;
                        const cos = Math.cos(a), sin = Math.sin(a);
                        [lx, ly] = [lx * cos - ly * sin, lx * sin + ly * cos];
                    }
                    inside = Math.abs(lx) <= rw / 2 && Math.abs(ly) <= rh / 2;
                    size = (rw / IW) * (rh / IH);
                } else if (zone.radiusX) {
                    // Овал: radiusX / radiusY — полуоси в долях minDim, rotation в градусах
                    let dx = ix - zone.x * IW;
                    let dy = iy - zone.y * IH;
                    if (zone.rotation) {
                        const a = -zone.rotation * Math.PI / 180;
                        const cos = Math.cos(a), sin = Math.sin(a);
                        [dx, dy] = [dx * cos - dy * sin, dx * sin + dy * cos];
                    }
                    const erx = zone.radiusX * minDim;
                    const ery = zone.radiusY * minDim;
                    inside = (dx * dx) / (erx * erx) + (dy * dy) / (ery * ery) <= 1;
                    size = zone.radiusX * zone.radiusY;
                } else {
                    const dx = ix - zone.x * IW;
                    const dy = iy - zone.y * IH;
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

        if (gs.found >= gs.total) {
            this.stopTimer(); // гасим НЕМЕДЛЕННО, до задержки
            setTimeout(() => this.winLevel(), 500);
        }
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
        clearInterval(gs.timerHandle); // очищаем старый интервал если уровень перезапущен
        gs.timerHandle = setInterval(() => {
            if (!gs.timerHandle) return; // уже остановлен (нашли последний предмет)
            gs.timeLeft--;
            this.refreshTimer();
            if (gs.timeLeft <= 0) {
                this.stopTimer();
                this.loseLevel('time');
            }
        }, 1000);
    },

    stopTimer() { if (gs) { clearInterval(gs.timerHandle); gs.timerHandle = null; } },

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

        // Анимация выдачи фотокарточки — только при первом прохождении последнего
        // уровня главы (не повторяется при повторном прохождении)
        if (win && currentLevel.id === 10 && !(save.chapters && save.chapters.kitchen && save.chapters.kitchen.completed)) {
            setTimeout(() => Game.showPhotoAward('kitchen', 'photo_kitchen.png', 'Кухня бабушки Гали'), 1500);
        } else if (win && currentLevel.id === 110 && !(save.chapters && save.chapters.bath && save.chapters.bath.completed)) {
            setTimeout(() => Game.showPhotoAward('bath', 'photo_bath.png', 'Баня'), 1500);
        }
    },

    showPhotoAward(chapterId, photoFile, label) {
        const overlay = document.getElementById('photo-award-overlay');
        const wrap    = document.getElementById('photo-award-wrap');
        const hint    = document.getElementById('photo-award-album-hint');
        const sub     = document.querySelector('.photo-award-sub');

        // Сбрасываем состояние wrap и hint перед показом
        wrap.classList.remove('fly-away');
        hint.classList.remove('glow-hint');

        document.getElementById('photo-award-img').src = `assets/${photoFile}.png`;
        if (sub) sub.textContent = label;
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

                    // Сохраняем получение карточки — анимация больше не повторится
                    if (!save.chapters) save.chapters = {};
                    save.chapters[chapterId] = { completed: true, photo: photoFile };
                    persist();
                }, 600);
            }, 1000);
        }, 3300);
    },

    nextLevel() {
        const id = currentLevel.id;
        if (STORY_SCENES[id]) {
            const key = STORY_KEYS[id] || `after_${id}`;
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

// Клавиша E — мгновенное восстановление энергии (только при включённом дев-режиме)
document.addEventListener('keydown', e => {
    if (e.key !== 'e' && e.key !== 'E') return;
    if (typeof DevTools === 'undefined' || !DevTools.enabled) return;
    if (typeof ZoneEditor !== 'undefined' && ZoneEditor.active) return; // E занята поворотом зоны
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    save.energy.current    = ENERGY_MAX;
    save.energy.lastUpdate = Date.now();
    persist();
    updateHUD();
    console.log('%c[DEV] Энергия восстановлена до максимума', 'color:lime; font-weight:bold');
});

// Обновляем координаты при движении мыши (в реальном времени)
document.addEventListener('mousemove', e => {
    if (!devMode) return;
    const area = document.getElementById('game-area');
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const img  = imageRect(area);
    // Координаты в долях КАРТИНКИ (0..1), а не всего экрана
    const rx = (((e.clientX - rect.left) - img.left) / img.width ).toFixed(3);
    const ry = (((e.clientY - rect.top)  - img.top)  / img.height).toFixed(3);
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
        game: 'assets/music_game.mp3'
    };
    const VOL_DEFAULT = 0.08;
    let VOL          = VOL_DEFAULT;
    let _unlocked    = false;
    let _enabled     = true;
    let _want        = null;   // трек, который хотим играть
    let _active      = null;   // трек, играющий сейчас
    let _switchToken = 0;      // защита от гонки при быстрых переходах
    const _howls     = {};

    function _mk(name, src) {
        return new Howl({
            src: [src], loop: true, volume: 0,
            html5: true, /* избегаем задержки декодирования */
            onloaderror: (id, err) => console.error(`[Music] Ошибка загрузки "${src}":`, err),
            onplayerror: (id, err) => {
                console.error(`[Music] Ошибка воспроизведения "${src}":`, err);
                // Браузер заблокировал звук — повторим после разблокировки аудио
                _howls[name].once('unlock', () => {
                    if (_enabled && _active === name) _howls[name].play();
                });
            }
        });
    }

    function _startTrack(name, token) {
        if (token !== _switchToken) return;   // устарело — выходим
        const h = _howls[name];
        h.off('fade');                        // снимаем висящие обработчики прошлых переходов
        h.volume(0);
        if (!h.playing()) h.play();
        h.fade(0, VOL, 800);
    }

    function _switchTo(name) {
        _want = name;
        if (!_unlocked || !_enabled) return;
        // Уже играет нужный трек — ничего не делаем (не перезапускаем)
        if (_active === name && _howls[name] && _howls[name].playing()) return;

        const prev  = _active;
        _active     = name;
        const token = ++_switchToken;

        if (prev && prev !== name && _howls[prev] && _howls[prev].playing()) {
            // Fade out старого → после завершения стартуем новый
            const ph = _howls[prev];
            ph.off('fade');
            ph.fade(ph.volume(), 0, 500);
            ph.once('fade', () => {
                if (token !== _switchToken) return;  // переход устарел — не трогаем
                ph.stop();
                _startTrack(name, token);
            });
        } else {
            _startTrack(name, token);
        }
    }

    return {
        init() {
            _howls.main = _mk('main', TRACKS.main);
            _howls.game = _mk('game', TRACKS.game);

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
                _switchTo('main');
            } else if (screenId === 'screen-game') {
                _switchTo('game');
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
            _switchToken++;  // отменяем все незавершённые переходы
            Object.values(_howls).forEach(h => {
                h.off('fade');
                if (h.playing()) {
                    h.fade(h.volume(), 0, 500);
                    h.once('fade', () => { if (!_enabled) h.stop(); });
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
        const ok = nick.length >= 3 && nick.length <= 12
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
    enabled: false,      // Ctrl+Shift+D — показ/скрытие кнопки DEV
    panelOpen: false,
    zonesVisible: false,
    coordsOn: false,

    toggleEnabled() {
        this.enabled = !this.enabled;
        const fab = document.getElementById('dev-fab');
        if (fab) fab.classList.toggle('hidden', !this.enabled);
        if (!this.enabled) {
            // Выключаем все дев-функции
            this.closePanel();
            this.setZones(false);
            this.setCoords(false);
            if (typeof ZoneEditor !== 'undefined' && ZoneEditor.active) ZoneEditor.disable();
            const z = document.getElementById('dev-toggle-zones');
            const c = document.getElementById('dev-toggle-coords');
            if (z) z.checked = false;
            if (c) c.checked = false;
        }
    },

    togglePanel() { this.panelOpen ? this.closePanel() : this.openPanel(); },
    openPanel()   { this.panelOpen = true;  document.getElementById('dev-sidebar').classList.add('open'); },
    closePanel()  { this.panelOpen = false; document.getElementById('dev-sidebar').classList.remove('open'); },

    // ----- Переключатели -----

    setZones(on) {
        if (on && typeof ZoneEditor !== 'undefined' && ZoneEditor.active) ZoneEditor.disable();
        on ? this.drawZones() : this.hideZones();
    },

    setCoords(on) {
        this.coordsOn = on;
        devMode = on;  // при devMode клики по полю копируют координаты и не считаются игровыми
        getDevPanel().style.display = on ? '' : 'none';
    },

    // ----- Кнопки действий -----

    _flash(btn) {
        if (!btn) return;
        btn.classList.remove('flash');
        void btn.offsetWidth;  // перезапуск анимации
        btn.classList.add('flash');
    },

    resetTimer(btn) {
        if (gs && currentLevel) {
            gs.timeLeft = currentLevel.timer || 420;
            Game.refreshTimer();
        }
        this._flash(btn);
    },

    restoreLives(btn) {
        if (gs) { gs.lives = 3; Game.refreshLives(); }
        this._flash(btn);
    },

    restoreEnergy(btn) {
        save.energy.current = ENERGY_MAX;
        save.energy.lastUpdate = Date.now();
        persist(); updateHUD();
        this._flash(btn);
    },

    addCoins(btn)  { save.coins += 999; persist(); updateHUD(); this._flash(btn); },
    addMalina(btn) { save.malina = (save.malina || 0) + 999; persist(); updateHUD(); this._flash(btn); },

    resetGame() {
        if (confirm('Точно сбросить всё?')) {
            localStorage.clear();
            location.reload();
        }
    },

    drawZones() {
        const cb = document.getElementById('dev-toggle-zones');
        if (!gs || !gs.items || !gs.items.length) { if (cb) cb.checked = false; return; }
        const canvas = document.getElementById('dev-zones-canvas');
        const area   = document.getElementById('game-area');
        if (!canvas || !area) { if (cb) cb.checked = false; return; }

        const rect = area.getBoundingClientRect();
        canvas.width  = rect.width;
        canvas.height = rect.height;
        canvas.style.display = 'block';

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Все зоны — в системе координат ВИДИМОЙ картинки (contain)
        const img = imageRect(area);
        const IW = img.width, IH = img.height, OX = img.left, OY = img.top, minDim = img.minDim;

        gs.items.forEach(item => {
            const zones = item.zones || [{ x: item.x, y: item.y, radius: item.radius || 0.06 }];
            zones.forEach(zone => {
                ctx.fillStyle   = 'rgba(255,0,0,0.2)';
                ctx.strokeStyle = 'rgba(255,0,0,0.8)';
                ctx.lineWidth   = 2;

                let labelX, labelY;
                if (zone.shape === 'rect') {
                    const rw  = zone.width  * IW;
                    const rh  = zone.square ? rw : zone.height * IH;
                    const cx  = OX + zone.x * IW + rw / 2;
                    const cy  = OY + zone.y * IH + rh / 2;
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
                } else if (zone.radiusX) {
                    const cx = OX + zone.x * IW;
                    const cy = OY + zone.y * IH;
                    const rot = (zone.rotation || 0) * Math.PI / 180;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, zone.radiusX * minDim, zone.radiusY * minDim, rot, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    labelX = cx;
                    labelY = cy;
                } else {
                    const cx = OX + zone.x * IW;
                    const cy = OY + zone.y * IH;
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

        this.zonesVisible = true;
        if (cb) cb.checked = true;
    },

    hideZones() {
        const canvas = document.getElementById('dev-zones-canvas');
        if (canvas) canvas.style.display = 'none';
        this.zonesVisible = false;
        const cb = document.getElementById('dev-toggle-zones');
        if (cb) cb.checked = false;
    }
};

// =============================================
// РЕДАКТОР ЗОН (дев-панель)
// =============================================
// Работает с временной копией зон — levels.json не меняется до ручного
// применения JSON, скопированного кнопкой «Сохранить зоны».

const ZoneEditor = {
    active: false,
    entries: [],       // { id, name, zi, zone: копия, el }
    selectedEl: null,

    setActive(on) { on ? this.enable() : this.disable(); },

    enable() {
        const cb = document.getElementById('dev-toggle-editor');
        if (!gs || !gs.items || !gs.items.length) { if (cb) cb.checked = false; return; }
        this.active = true;
        DevTools.hideZones();  // канвас показа зон дублировал бы редактор

        // Рабочая копия всех зон уровня
        this.entries = [];
        gs.items.forEach(item => {
            (item.zones || []).forEach((z, zi) => {
                this.entries.push({ id: item.id, name: item.name, zi, zone: JSON.parse(JSON.stringify(z)) });
            });
        });
        this._render();
        const btn = document.getElementById('dev-btn-save-zones');
        if (btn) btn.disabled = false;
    },

    disable() {
        this.active = false;
        const layer = document.getElementById('zone-editor-layer');
        if (layer) layer.remove();
        this.entries = [];
        this.selectedEl = null;
        const btn = document.getElementById('dev-btn-save-zones');
        if (btn) btn.disabled = true;
        const info = document.getElementById('dev-zone-info');
        if (info) info.style.display = 'none';
        const cb = document.getElementById('dev-toggle-editor');
        if (cb) cb.checked = false;
    },

    _area() { return document.getElementById('game-area'); },

    _render() {
        const area = this._area();
        if (!area) return;
        const old = document.getElementById('zone-editor-layer');
        if (old) old.remove();
        const layer = document.createElement('div');
        layer.id = 'zone-editor-layer';
        area.appendChild(layer);
        this.entries.forEach(en => {
            const el = document.createElement('div');
            el.className = 'ze-zone';
            el.innerHTML = `<span class="ze-label">${en.name}</span>`;
            layer.appendChild(el);
            en.el = el;
            this._place(en);
            this._attachDrag(en);
            const shape = this._shapeOf(en.zone);
            if (shape === 'rect')    this._makeRectHandles(en);
            if (shape === 'ellipse') this._makeEllipseHandles(en);
            if (shape !== 'rect')    this._attachWheel(en);
            if (shape !== 'circle')  this._makeRotateHandle(en);
        });
    },

    _shapeOf(z) {
        if (z.shape === 'rect') return 'rect';
        if (z.shape === 'ellipse' || z.radiusX) return 'ellipse';
        return 'circle';
    },

    // Геометрия зоны: центр/полуоси/поворот в системе координат КАРТИНКИ (contain).
    // cx/cy — относительно левого-верхнего угла картинки; offX/offY — смещение картинки
    // внутри game-area (добавляется только в _place при позиционировании div).
    _dims(z) {
        const img = imageRect(this._area());
        const W = img.width, H = img.height, minDim = img.minDim;
        const offX = img.left, offY = img.top;
        const shape = this._shapeOf(z);
        if (shape === 'rect') {
            const w = z.width * W;
            const h = z.square ? w : z.height * H;
            return { W, H, minDim, offX, offY, cx: z.x * W + w / 2, cy: z.y * H + h / 2, hw: w / 2, hh: h / 2, rot: z.rotation || 0 };
        }
        if (shape === 'ellipse') {
            return { W, H, minDim, offX, offY, cx: z.x * W, cy: z.y * H, hw: z.radiusX * minDim, hh: z.radiusY * minDim, rot: z.rotation || 0 };
        }
        const r = z.radius * minDim;
        return { W, H, minDim, offX, offY, cx: z.x * W, cy: z.y * H, hw: r, hh: r, rot: 0 };
    },

    // Позиционирование div по данным зоны (доли картинки → пиксели game-area)
    _place(en) {
        const z = en.zone, el = en.el;
        const d = this._dims(z);
        el.style.left   = (d.offX + d.cx - d.hw) + 'px';
        el.style.top    = (d.offY + d.cy - d.hh) + 'px';
        el.style.width  = d.hw * 2 + 'px';
        el.style.height = d.hh * 2 + 'px';
        el.style.borderRadius = this._shapeOf(z) === 'rect' ? '0' : '50%';
        el.style.transform = d.rot ? `rotate(${d.rot}deg)` : '';
    },

    _attachDrag(en) {
        en.el.addEventListener('mousedown', e => {
            if (e.target.classList.contains('ze-handle')) return;
            e.preventDefault(); e.stopPropagation();
            const img = imageRect(this._area());
            const W = img.width, H = img.height;   // доли считаем от картинки
            const sx = e.clientX, sy = e.clientY;
            const zx = en.zone.x, zy = en.zone.y;
            let moved = false;
            en.el.classList.add('dragging');
            const onMove = ev => {
                if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 3) moved = true;
                en.zone.x = +(zx + (ev.clientX - sx) / W).toFixed(3);
                en.zone.y = +(zy + (ev.clientY - sy) / H).toFixed(3);
                this._place(en);
                if (this.selectedEl === en.el) this._showInfo(en);
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                en.el.classList.remove('dragging');
                if (!moved) this._select(en);  // клик без движения = выбор
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    },

    // Колёсико — размер круга/овала
    _attachWheel(en) {
        en.el.addEventListener('wheel', e => {
            e.preventDefault();
            const step = e.deltaY < 0 ? 0.005 : -0.005;
            const z = en.zone;
            if (z.radiusX) {
                z.radiusX = +Math.max(0.01, z.radiusX + step).toFixed(3);
                z.radiusY = +Math.max(0.01, z.radiusY + step).toFixed(3);
            } else {
                z.radius = +Math.max(0.01, z.radius + step).toFixed(3);
            }
            this._place(en);
            if (this.selectedEl === en.el) this._showInfo(en);
        }, { passive: false });
    },

    // Смещение мыши в локальных осях зоны (с учётом её поворота)
    _localDelta(ev, sx, sy, rot) {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!rot) return { dx, dy };
        const a = -rot * Math.PI / 180;
        const cos = Math.cos(a), sin = Math.sin(a);
        return { dx: dx * cos - dy * sin, dy: dx * sin + dy * cos };
    },

    _dragHandle(handleEl, onStart, onDelta) {
        handleEl.addEventListener('mousedown', e => {
            e.preventDefault(); e.stopPropagation();
            const state = onStart();
            const sx = e.clientX, sy = e.clientY;
            const onMove = ev => onDelta(ev, sx, sy, state);
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    },

    // Прямоугольник: 4 угла + 4 стороны
    _makeRectHandles(en) {
        ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].forEach(dir => {
            const h = document.createElement('div');
            h.className = 'ze-handle ze-' + dir;
            en.el.appendChild(h);
            this._dragHandle(h,
                () => {
                    const d = this._dims(en.zone);
                    // при первом растяжении квадрат превращается в явный rect
                    if (en.zone.square) { en.zone.height = +(d.hh * 2 / d.H).toFixed(3); delete en.zone.square; }
                    return { swPx: d.hw * 2, shPx: d.hh * 2, sxPx: d.cx - d.hw, syPx: d.cy - d.hh, rot: d.rot, W: d.W, H: d.H };
                },
                (ev, sx, sy, s) => {
                    const { dx, dy } = this._localDelta(ev, sx, sy, s.rot);
                    const z = en.zone;
                    let wPx = s.swPx, hPx = s.shPx, xPx = s.sxPx, yPx = s.syPx;
                    if (dir.includes('e')) wPx = s.swPx + dx;
                    if (dir.includes('w')) { wPx = s.swPx - dx; xPx = s.sxPx + dx; }
                    if (dir.includes('s')) hPx = s.shPx + dy;
                    if (dir.includes('n')) { hPx = s.shPx - dy; yPx = s.syPx + dy; }
                    if (wPx < 8) { wPx = 8; }
                    if (hPx < 8) { hPx = 8; }
                    z.width  = +(wPx / s.W).toFixed(3);
                    z.height = +(hPx / s.H).toFixed(3);
                    z.x      = +(xPx / s.W).toFixed(3);
                    z.y      = +(yPx / s.H).toFixed(3);
                    this._place(en);
                    if (this.selectedEl === en.el) this._showInfo(en);
                });
        });
    },

    // Овал: маркеры по горизонтали (radiusX) и вертикали (radiusY)
    _makeEllipseHandles(en) {
        ['n', 's', 'e', 'w'].forEach(dir => {
            const h = document.createElement('div');
            h.className = 'ze-handle ze-' + dir;
            en.el.appendChild(h);
            this._dragHandle(h,
                () => {
                    const d = this._dims(en.zone);
                    return { srx: en.zone.radiusX, sry: en.zone.radiusY, rot: d.rot, minDim: d.minDim };
                },
                (ev, sx, sy, s) => {
                    const { dx, dy } = this._localDelta(ev, sx, sy, s.rot);
                    const z = en.zone;
                    if (dir === 'e') z.radiusX = +Math.max(0.01, s.srx + dx / s.minDim).toFixed(3);
                    if (dir === 'w') z.radiusX = +Math.max(0.01, s.srx - dx / s.minDim).toFixed(3);
                    if (dir === 's') z.radiusY = +Math.max(0.01, s.sry + dy / s.minDim).toFixed(3);
                    if (dir === 'n') z.radiusY = +Math.max(0.01, s.sry - dy / s.minDim).toFixed(3);
                    this._place(en);
                    if (this.selectedEl === en.el) this._showInfo(en);
                });
        });
    },

    // Маркер вращения — кружок на ножке сверху (виден у выбранной зоны)
    _makeRotateHandle(en) {
        const h = document.createElement('div');
        h.className = 'ze-rotate';
        en.el.appendChild(h);
        this._dragHandle(h,
            () => {
                const area = this._area();
                const ar = area.getBoundingClientRect();
                return { ar };
            },
            (ev, sx, sy, s) => {
                const d = this._dims(en.zone);
                // Переводим мышь из координат game-area в координаты картинки
                const mx = ev.clientX - s.ar.left - d.offX, my = ev.clientY - s.ar.top - d.offY;
                let ang = Math.atan2(my - d.cy, mx - d.cx) * 180 / Math.PI + 90;
                en.zone.rotation = this._normDeg(Math.round(ang));
                this._place(en);
                if (this.selectedEl === en.el) this._showInfo(en);
            });
    },

    _normDeg(deg) {
        return ((deg + 180) % 360 + 360) % 360 - 180;
    },

    // Смена формы выбранной зоны с сохранением габаритов
    setShape(shape) {
        const en = this.entries.find(x => x.el === this.selectedEl);
        if (!en || this._shapeOf(en.zone) === shape) return;
        const d = this._dims(en.zone);
        const r3 = v => +v.toFixed(3);
        if (shape === 'circle') {
            en.zone = { x: r3(d.cx / d.W), y: r3(d.cy / d.H), radius: r3((d.hw + d.hh) / 2 / d.minDim), shape: 'circle' };
        } else if (shape === 'ellipse') {
            en.zone = { x: r3(d.cx / d.W), y: r3(d.cy / d.H), radiusX: r3(d.hw / d.minDim), radiusY: r3(d.hh / d.minDim), shape: 'ellipse', rotation: d.rot };
        } else {
            en.zone = { x: r3((d.cx - d.hw) / d.W), y: r3((d.cy - d.hh) / d.H), width: r3(d.hw * 2 / d.W), height: r3(d.hh * 2 / d.H), shape: 'rect', rotation: d.rot };
        }
        // Полная перерисовка (набор маркеров зависит от формы) + восстановление выбора
        const idx = this.entries.indexOf(en);
        this._render();
        this._select(this.entries[idx]);
    },

    _select(en) {
        if (this.selectedEl) this.selectedEl.classList.remove('selected');
        this.selectedEl = en.el;
        en.el.classList.add('selected');
        this._showInfo(en);
    },

    _showInfo(en) {
        const info = document.getElementById('dev-zone-info');
        if (!info) return;
        const z = en.zone;
        const shape = this._shapeOf(z);
        let dims;
        if (shape === 'rect') {
            dims = `w: ${z.width}${z.square ? ' (квадрат)' : ', h: ' + z.height}` +
                   (z.rotation ? `, rot: ${z.rotation}°` : '');
        } else if (shape === 'ellipse') {
            dims = `rx: ${z.radiusX}, ry: ${z.radiusY}` + (z.rotation ? `, rot: ${z.rotation}°` : '');
        } else {
            dims = `r: ${z.radius}`;
        }
        const btn = (s, icon) =>
            `<button class="dev-shape-btn${shape === s ? ' active' : ''}" onclick="ZoneEditor.setShape('${s}')">${icon}</button>`;
        info.style.display = '';
        info.innerHTML =
            `<b>${en.name}</b> [зона ${en.zi + 1}]<br>x: ${z.x}, y: ${z.y}<br>${dims}` +
            `<div class="dev-shape-btns">${btn('circle', '⭕ Круг')}${btn('ellipse', '⬭ Овал')}${btn('rect', '⬜ Прямоуг.')}</div>` +
            `<div class="dev-shape-hint">Q / E — поворот на 5°</div>`;
    },

    _toast(msg) {
        let t = document.getElementById('ze-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'ze-toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._hide);
        t._hide = setTimeout(() => t.classList.remove('show'), 1800);
    },

    saveZones(btn) {
        if (!this.active || !this.entries.length) return;
        const byId = {};
        const order = [];
        this.entries.forEach(en => {
            if (!byId[en.id]) { byId[en.id] = { id: en.id, name: en.name, zones: [] }; order.push(en.id); }
            const z = { ...en.zone };
            z.shape = this._shapeOf(z);            // shape указываем явно
            if (z.shape !== 'circle' && z.rotation === undefined) z.rotation = 0;
            byId[en.id].zones.push(z);
        });
        const json = JSON.stringify(order.map(id => byId[id]), null, 2);
        console.log('%c[ZoneEditor] Зоны текущего уровня:', 'color:#ffd700;font-weight:bold');
        console.log(json);
        navigator.clipboard.writeText(json).catch(err => console.error('[ZoneEditor] Буфер обмена:', err));
        this._toast('JSON скопирован в буфер!');
        if (typeof DevTools !== 'undefined') DevTools._flash(btn);
    }
};

// Ctrl+Shift+D — включение/выключение дев-режима (кнопка DEV внизу экрана)
document.addEventListener('keydown', e => {
    if (e.code === 'KeyD' && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        DevTools.toggleEnabled();
    }
});

// Q / E — поворот выбранной зоны в редакторе на 5°
document.addEventListener('keydown', e => {
    if (!ZoneEditor.active || !ZoneEditor.selectedEl) return;
    if (e.code !== 'KeyQ' && e.code !== 'KeyE') return;
    const en = ZoneEditor.entries.find(x => x.el === ZoneEditor.selectedEl);
    if (!en || ZoneEditor._shapeOf(en.zone) === 'circle') return;
    e.preventDefault();
    const step = e.code === 'KeyQ' ? -5 : 5;
    en.zone.rotation = ZoneEditor._normDeg((en.zone.rotation || 0) + step);
    ZoneEditor._place(en);
    ZoneEditor._showInfo(en);
});
