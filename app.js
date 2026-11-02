let events = JSON.parse(localStorage.getItem('cp_events_v1')) || APP_DATA.events;
let savedIds = JSON.parse(localStorage.getItem('cp_saved_v1')) || [];
let selectedDate = null;
let selectedCategory = 'all';
let activeBookingEvent = null;
let currentCardIndex = 0;

function saveState() {
  localStorage.setItem('cp_events_v1', JSON.stringify(events));
  localStorage.setItem('cp_saved_v1', JSON.stringify(savedIds));
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  const emptyCellsBefore = 6; // 1 ноября 2026 — воскресенье
  for (let i = 0; i < emptyCellsBefore; i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (let day = 1; day <= 30; day++) {
    const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
    const hasEv = events.some(e => e.date === dateStr);
    const cell = document.createElement('div');
    cell.className = 'cal-day' + (hasEv ? ' has-event' : '') + (selectedDate === dateStr ? ' selected' : '');
    cell.textContent = day;
    cell.onclick = () => selectDate(selectedDate === dateStr ? null : dateStr);
    grid.appendChild(cell);
  }
}

function selectDate(dateStr) {
  selectedDate = dateStr;
  renderCalendar();
  renderEvents();
}

function setCategory(cat) {
  selectedCategory = cat;
  document.querySelectorAll('#categoryChips .chip').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(cat === 'all' ? 'Все' : cat));
  });
  renderEvents();
}

function formatRuDate(dateStr) {
  const parts = dateStr.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  return `${parseInt(parts[2], 10)} ноября (${days[d.getDay()]})`;
}

function renderEvents() {
  const container = document.getElementById('eventsContainer');
  let filtered = [...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  if (selectedDate) filtered = filtered.filter(e => e.date === selectedDate);
  if (selectedCategory !== 'all') filtered = filtered.filter(e => e.cat === selectedCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="calendar-box" style="text-align:center; padding:28px;">
        <p style="color:var(--gold); font-size:1rem; margin-bottom:6px;">На выбранную дату или фильтр встреч пока нет</p>
        <button class="btn btn-outline" onclick="selectDate(null); setCategory('all')">Показать все анонсы ноября</button>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(ev => {
    const isSaved = savedIds.includes(ev.id);
    return `
      <article class="event-card">
        <div class="event-top">
          <span class="event-badge">${ev.cat}</span>
          <span class="event-price">${ev.price}</span>
        </div>
        <h3 class="event-title">${ev.title}</h3>
        <div class="event-topic">«${ev.topic}»</div>
        <p class="event-desc">${ev.desc}</p>
        <div class="event-meta">
          <span>🗓 ${formatRuDate(ev.date)}</span>
          <span>⏰ ${ev.time}</span>
          <span>👤 ${ev.master}</span>
        </div>
        <div class="event-actions">
          <button class="btn btn-gold" onclick="openBookingModal(${ev.id})">✍️ Записаться</button>
          <button class="btn btn-outline ${isSaved ? 'saved' : ''}" onclick="toggleSaveEvent(${ev.id})">
            ${isSaved ? '✓ В моём плане' : '☆ В план'}
          </button>
        </div>
      </article>`;
  }).join('');
}

function toggleSaveEvent(id) {
  savedIds = savedIds.includes(id) ? savedIds.filter(i => i !== id) : [...savedIds, id];
  saveState();
  renderEvents();
  renderSavedEvents();
}

function renderSavedEvents() {
  const box = document.getElementById('savedEventsList');
  const list = events.filter(e => savedIds.includes(e.id));
  if (list.length === 0) {
    box.innerHTML = `<p style="font-size:0.84rem; color:var(--text-muted);">Вы ещё не добавили мероприятия в свой план.</p>`;
    return;
  }
  box.innerHTML = list.map(ev => `
    <div class="master-item">
      <div>
        <div style="font-weight:600; color:var(--gold); font-size:0.9rem;">${ev.title}: ${ev.topic}</div>
        <div style="font-size:0.78rem; color:var(--text-muted);">${formatRuDate(ev.date)} в ${ev.time} • ${ev.master}</div>
      </div>
      <button class="cal-reset" onclick="toggleSaveEvent(${ev.id})">Удалить</button>
    </div>
  `).join('');
}

function openBookingModal(id) {
  activeBookingEvent = events.find(e => e.id === id);
  if (!activeBookingEvent) return;
  document.getElementById('modalEvTitle').textContent = activeBookingEvent.title;
  document.getElementById('modalEvSub').textContent = `${activeBookingEvent.topic} • ${formatRuDate(activeBookingEvent.date)} в ${activeBookingEvent.time} (${activeBookingEvent.master})`;
  document.getElementById('directCallBtn').href = `tel:${activeBookingEvent.phone}`;
  document.getElementById('bookingModal').classList.add('open');
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
}

function sendBookingWhatsApp() {
  if (!activeBookingEvent) return;
  const name = document.getElementById('clientName').value.trim() || 'Гость';
  const note = document.getElementById('clientNote').value.trim();
  const cleanPhone = activeBookingEvent.phone.replace(/[^\d]/g, '');
  const text = `Здравствуйте! Меня зовут ${name}. Хочу записаться в «Центр Притяжения» на встречу «${activeBookingEvent.title} (${activeBookingEvent.topic})», дата: ${formatRuDate(activeBookingEvent.date)} в ${activeBookingEvent.time}.${note ? ' Комментарий: ' + note : ''}`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  closeBookingModal();
}

function loadMacCardContent() {
  const card = APP_DATA.macCards[currentCardIndex];
  document.getElementById('macSymbol').textContent = card.symbol;
  document.getElementById('macTitle').textContent = card.title;
  document.getElementById('macMetaphor').textContent = card.metaphor;
  document.getElementById('macQuestion').textContent = `Вопрос себе: «${card.question}»`;
}

function flipMacCard() {
  document.getElementById('macCard').classList.toggle('flipped');
}

function drawNewMacCard() {
  const deck = document.getElementById('macCard');
  deck.classList.remove('flipped');
  setTimeout(() => {
    currentCardIndex = (currentCardIndex + 1) % APP_DATA.macCards.length;
    loadMacCardContent();
    deck.classList.add('flipped');
  }, 320);
}

function playSingingBowl() {
  const bowl = document.getElementById('bowlBtn');
  const hint = document.getElementById('breathHint');
  bowl.classList.add('ringing');
  hint.textContent = 'Сделайте медленный глубокий вдох... и плавный выдох...';

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [432, 864, 1296].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.22 / (idx + 1), now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 4.6);
    });
  } catch (e) {}

  setTimeout(() => {
    bowl.classList.remove('ringing');
    hint.textContent = 'Гармония внутри вас. Нажмите ещё раз, если нужно.';
  }, 4500);
}

function recommendTrack(type) {
  const box = document.getElementById('quizResult');
  const recs = {
    relax: '✨ <strong>Рекомендуем:</strong> «Медитации тибетскими поющими чашами» с Еленой Агеевой (8, 15, 22 ноября) или четверговую практику «Медитировать легко» с Мариной Акимовой.',
    psy: '🧭 <strong>Рекомендуем:</strong> «Чаепитие с психологом» или трансформационную игру «Путешествие Души» с Еленой Осинцевой.',
    craft: '🧶 <strong>Рекомендуем:</strong> МК по макраме с Ириной Шиляевой, плетение оберега «Лула», люневильскую вышивку или занятия вокалом.',
    kids: '♟ <strong>Рекомендуем:</strong> Воскресный шахматный клуб с Тимуром Хайретдиновым, «Лабораторию юного учёного» или «Город мастеров» с Ириной Мироновой.'
  };
  box.innerHTML = recs[type];
  box.style.display = 'block';
}

function renderMasters() {
  const container = document.getElementById('mastersList');
  container.innerHTML = APP_DATA.masters.map(m => `
    <div class="master-item">
      <div>
        <div style="font-weight:600; color:var(--text); font-size:0.92rem;">${m.name}</div>
        <div style="font-size:0.78rem; color:var(--text-muted);">${m.role}</div>
      </div>
      <a href="tel:${m.phone}" class="cal-reset" style="text-decoration:none;">📞 Позвонить</a>
    </div>
  `).join('');
}

function initTemplates() {
  const sel = document.getElementById('tplSelect');
  APP_DATA.templates.forEach((t, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = t.label;
    sel.appendChild(opt);
  });
}

function applyTemplate() {
  const val = document.getElementById('tplSelect').value;
  if (val === '') return;
  const t = APP_DATA.templates[val];
  document.getElementById('evTitle').value = t.title;
  document.getElementById('evTopic').value = t.topic;
  document.getElementById('evCat').value = t.cat;
  document.getElementById('evMaster').value = t.master;
  document.getElementById('evPhone').value = t.phone;
  document.getElementById('evPrice').value = t.price;
  document.getElementById('evTime').value = t.time;
  document.getElementById('evDesc').value = t.desc;
}

function unlockAdmin() {
  const pin = document.getElementById('adminPinInput').value.trim();
  if (pin === '2026') {
    document.getElementById('adminLockBox').style.display = 'none';
    document.getElementById('adminPanelBox').style.display = 'block';
  } else {
    alert('Неверный пин-код (используйте 2026)');
  }
}

function addEventFromAdmin() {
  const newEv = {
    id: Date.now(),
    date: document.getElementById('evDate').value || '2026-11-09',
    time: document.getElementById('evTime').value || '18:00',
    title: document.getElementById('evTitle').value || 'Встреча в Центре Притяжения',
    topic: document.getElementById('evTopic').value || 'Специальная тема',
    cat: document.getElementById('evCat').value,
    price: document.getElementById('evPrice').value || 'Уточняйте',
    master: document.getElementById('evMaster').value || 'Мастер Центра',
    phone: document.getElementById('evPhone').value || '+79045407576',
    desc: document.getElementById('evDesc').value || 'Приглашаем в Центр Притяжения (Уральская, 54).'
  };
  events.push(newEv);
  saveState();
  renderCalendar();
  renderEvents();
  alert('Мероприятие добавлено! Чтобы оно появилось у всех пользователей на GitHub, нажмите «Скачать data.js для GitHub» и обновите файл в репозитории.');
}

// Экспорт готового файла data.js для загрузки в репозиторий GitHub
function exportDataJsForGitHub() {
  const updatedData = {
    masters: APP_DATA.masters,
    templates: APP_DATA.templates,
    macCards: APP_DATA.macCards,
    events: events
  };
  const fileContent = `const APP_DATA = ${JSON.stringify(updatedData, null, 2)};\n`;
  const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
  const dlAnchor = document.createElement('a');
  dlAnchor.href = URL.createObjectURL(blob);
  dlAnchor.download = 'data.js';
  dlAnchor.click();
}

function resetDefaultEvents() {
  if (confirm('Сбросить локальные изменения к расписанию из файла data.js?')) {
    localStorage.removeItem('cp_events_v1');
    events = [...APP_DATA.events];
    renderCalendar();
    renderEvents();
  }
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function registerServiceWorkerAndPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  let deferredPrompt;
  const installBtn = document.getElementById('pwaInstallBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadMacCardContent();
  renderCalendar();
  renderEvents();
  renderMasters();
  renderSavedEvents();
  initTemplates();
  registerServiceWorkerAndPWA();
});
