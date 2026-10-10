/* English Passport PWA — 180-day progress module
 * Dependency-free, local-first. Does not alter lesson content.
 * Version: 1.0.0
 */
(function () {
  'use strict';
  const STORAGE_KEY = 'englishPassportProgress.v1';
  const TOTAL_DAYS = 180;
  const METRICS = [
    { key: 'listening', label: 'Listening', color: '#3984f5' },
    { key: 'speaking', label: 'Speaking', color: '#13a879' },
    { key: 'naturalness', label: 'Naturalness', color: '#b06be0' },
    { key: 'ielts', label: 'IELTS', color: '#ed9b35' }
  ];
  const PHASES = [
    { name: 'مرحله اول: ساخت پایه و ایجاد عادت یادگیری', start: 1, end: 30 },
    { name: 'مرحله دوم: مکالمه طبیعی و زندگی روزمره', start: 31, end: 60 },
    { name: 'مرحله سوم: انگلیسی حرفه‌ای و مهندسی عمران', start: 61, end: 90 },
    { name: 'مرحله چهارم: ورود نظام‌مند به آیلتس', start: 91, end: 120 },
    { name: 'مرحله پنجم: تمرین هدفمند و افزایش دقت', start: 121, end: 150 },
    { name: 'مرحله ششم: تثبیت، شبیه‌سازی و ارزیابی نهایی', start: 151, end: 180 }
  ];
  const CHECKPOINTS = [
    { day: 1, title: 'خط پایه', focus: 'ثبت وضعیت واقعی Listening و Speaking؛ بدون حدس‌زدن سطح.' },
    { day: 30, title: 'پایان مرحله اول', focus: 'بررسی عادت شنیداری، فهم کلی و توانایی معرفی خود و موضوعات آشنا.' },
    { day: 60, title: 'نقطه عطف دوم', focus: 'بررسی مکالمه روزمره، روایت تجربه‌ها و آمادگی حرکت به سمت B1.' },
    { day: 90, title: 'بررسی سطح B1', focus: 'ارزیابی فهم متن/صوت سطح متوسط و توانایی توضیح و بازگویی مستقل.' },
    { day: 120, title: 'آمادگی IELTS', focus: 'بررسی آشنایی با چهار مهارت IELTS و شناسایی شکاف‌های اصلی.' },
    { day: 150, title: 'تمرین هدفمند', focus: 'مقایسه عملکرد زمان‌دار، دقت پاسخ‌ها و خطاهای پرتکرار.' },
    { day: 180, title: 'ارزیابی نهایی', focus: 'مقایسه با خط پایه روز اول، مرور نمونه‌ها و تعیین سه اولویت بعدی.' }
  ];
  const COACH_PROMPT = `نقش تو: مربی مکالمه انگلیسی من برای یک جلسه روزانه ۵۰ دقیقه‌ای، متناسب با سطح واقعی من (حدود B1 یا بالاتر، اما سطح را با عملکردم تنظیم کن).

قواعد جلسه:
۱) در هر نوبت فقط یک سؤال طبیعی بپرس و برای پاسخ من صبر کن؛ چند سؤال را یک‌جا نپرس.
۲) موضوع را از برنامه همان روز English Passport بگیر؛ اگر عنوان روز را دادم، همان را محور قرار بده.
۳) مکالمه را واقعی و تعاملی نگه دار؛ حدود ۷۰٪ زمان را من صحبت کنم.
۴) وسط صحبت دائماً قطع نکن. خطاهای مهم را یادداشت کن و در پایان هر بخش حداکثر سه خطای پرتکرار را توضیح بده.
۵) برای هر خطا: جمله من، نسخه درست، نسخه طبیعی‌تر و یک توضیح کوتاه ارائه کن.
۶) از من بخواه پاسخ اصلاح‌شده را دوباره با صدای بلند بگویم؛ سپس یک سؤال پیگیری بپرس.
۷) واژگان و عبارت‌های کاربردی را در متن مکالمه آموزش بده؛ از درس گرامر طولانی و تصحیح بیش از حد پرهیز کن.
۸) در پایان، خلاصه‌ای کوتاه شامل نقاط قوت، سه خطای مهم، ۵ عبارت مفید و تمرین ۵ دقیقه‌ای بعدی بده.
۹) اگر پاسخ‌ها آسان بود سطح و پیچیدگی را افزایش بده؛ اگر دشوار بود، با جمله‌بندی ساده‌تر کمک کن، نه اینکه پاسخ را به جای من بدهی.
۱۰) شروع کن: از من بپرس امروز کدام روز/موضوع را تمرین می‌کنم و سپس اولین سؤال را بپرس.`;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

  function freshState() {
    return { version: 2, completed: [], metrics: {}, tasks: {}, notes: {}, doneAt: {}, startDate: null, updatedAt: new Date().toISOString() };
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return freshState();
      const state = freshState();
      state.completed = Array.isArray(parsed.completed)
        ? [...new Set(parsed.completed.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= TOTAL_DAYS))].sort((a,b) => a-b)
        : [];
      const sequential = [];
      for (let day = 1; day <= TOTAL_DAYS; day++) { if (state.completed.includes(day) && (day === 1 || sequential.includes(day - 1))) sequential.push(day); else break; }
      state.completed = sequential;
      state.metrics = parsed.metrics && typeof parsed.metrics === 'object' ? parsed.metrics : {};
      state.tasks = parsed.tasks && typeof parsed.tasks === 'object' ? parsed.tasks : {};
      state.notes = parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {};
      state.doneAt = parsed.doneAt && typeof parsed.doneAt === 'object' ? parsed.doneAt : {};
      state.startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.startDate || '')) ? parsed.startDate : null;
      state.updatedAt = parsed.updatedAt || state.updatedAt;
      return state;
    } catch (_) { return freshState(); }
  }
  let state = loadState();
  let activeDay = Math.min(TOTAL_DAYS, (function(){ for(let d=1;d<=TOTAL_DAYS;d++) if(!state.completed.includes(d)) return d; return TOTAL_DAYS; })());
  let expandedPhases = new Set([phaseFor(activeDay)]);
  let trendMode = 'completed';

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (_) { toast('ذخیره در مرورگر انجام نشد؛ فضای ذخیره‌سازی را بررسی کن.'); }
    render();
  }
  function saveStateQuiet() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (_) { toast('ذخیره در مرورگر انجام نشد؛ فضای ذخیره‌سازی را بررسی کن.'); }
  }
  function isUnlocked(day) {
    return day === 1 || state.completed.includes(day - 1);
  }
  function isComplete(day) { return state.completed.includes(day); }
  function phaseFor(day) { return Math.max(1, PHASES.findIndex(phase => day >= phase.start && day <= phase.end) + 1); }
  function completedCount() { return state.completed.length; }
  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
  function metricFor(day, key) {
    const item = state.metrics[String(day)] || {};
    return item[key] === undefined || item[key] === '' ? null : clamp(item[key], 0, 100);
  }
  function dayTitle(day) {
    const detail = Array.isArray(window.ENGLISH_PASSPORT_DAILY_DETAILS) ? window.ENGLISH_PASSPORT_DAILY_DETAILS[day - 1] : null;
    if (detail && detail.title) return detail.title;
    const configured = window.ENGLISH_PASSPORT_DAYS;
    if (Array.isArray(configured) && configured[day - 1]) {
      const item = configured[day - 1];
      if (typeof item === 'string') return item;
      if (item && item.title) return item.title;
    }
    // If the existing lesson page already exposes data-day="N", use its visible heading.
    const node = document.querySelector(`[data-day="${day}"]`);
    if (node) {
      const heading = node.matches('h1,h2,h3,h4,h5,h6') ? node : node.querySelector('h1,h2,h3,h4,h5,h6,[data-day-title]');
      if (heading && heading.textContent.trim()) return heading.textContent.trim();
      const title = node.getAttribute('data-title');
      if (title) return title;
    }
    return `روز ${day}`;
  }
  function programGuideMarkup() {
    return `<details class="ep-section ep-program-guide" id="ep-program-guide"><summary><span><strong>راهنمای جامع اجرای برنامه ۱۸۰ روزه</strong><small>زمان‌بندی روزانه، ارزیابی‌های دوره‌ای، منابع و قوانین اجرا</small></span><span class="ep-guide-toggle">نمایش راهنما</span></summary><div class="ep-program-guide-body">
      <p class="ep-guide-intro">این برنامه با هدف تقویت درک شنیداری، صحبت‌کردن روان و طبیعی، استفاده از انگلیسی در موقعیت‌های واقعی و محیط کاری مهندسی عمران، و آمادگی تدریجی برای IELTS تنظیم شده است. برنامه شامل ۶ مرحلهٔ ۳۰روزه است و زمان پیشنهادی اجرای آن روزانه حداقل ۳ ساعت است.</p>
      <h4>روش اجرای روزانه · مجموع ۱۸۰ دقیقه</h4><div class="ep-guide-table-wrap"><table class="ep-guide-table"><thead><tr><th>فعالیت</th><th>زمان</th><th>روش اجرا</th></tr></thead><tbody>
      <tr><td>شنیداری فعال</td><td>۳۵ دقیقه</td><td>گوش‌دادن به فایل صوتی یا ویدئو و درک مفهوم کلی و جزئیات.</td></tr>
      <tr><td>تحلیل عبارت‌ها</td><td>۲۵ دقیقه</td><td>بررسی متن، یادگیری ۵ تا ۸ عبارت کاربردی و ساختن جمله.</td></tr>
      <tr><td>تلفظ و Shadowing</td><td>۲۵ دقیقه</td><td>تقلید از یک گوینده، ضبط صدا و مقایسه.</td></tr>
      <tr><td>مکالمه</td><td>۵۰ دقیقه</td><td>گفت‌وگو با هوش مصنوعی یا تمرین نقش‌آفرینی.</td></tr>
      <tr><td>مرور واژگان</td><td>۲۰ دقیقه</td><td>مرور عبارت‌های قبلی و ساختن مثال‌های جدید.</td></tr>
      <tr><td>گرامر یا IELTS</td><td>۱۵ دقیقه</td><td>تمرین متناسب با موضوع روز.</td></tr>
      <tr><td>ثبت پیشرفت</td><td>۱۰ دقیقه</td><td>ثبت مشکلات، آموخته‌ها و عملکرد روز.</td></tr>
      <tr class="ep-guide-total"><td><strong>مجموع</strong></td><td><strong>۱۸۰ دقیقه</strong></td><td><strong>۳ ساعت</strong></td></tr></tbody></table></div>
      <p class="ep-guide-callout"><strong>قانون مهم:</strong> قرار نیست هر روز فقط مطلب جدید یاد بگیری. باید آنچه یاد گرفته‌ای را در شنیدن، صحبت‌کردن و جمله‌سازی به کار ببری.</p>
      <h4>جدول ارزیابی پیشرفت در طول ۱۸۰ روز</h4><p>در روزهای مشخص‌شده، عملکردت را با معیارهای یکسان ثبت کن تا پیشرفت واقعی قابل‌مشاهده باشد.</p><div class="ep-guide-table-wrap"><table class="ep-guide-table"><thead><tr><th>روز</th><th>ارزیابی شنیداری</th><th>ارزیابی گفتاری</th><th>ارزیابی تکمیلی</th></tr></thead><tbody>
      <tr><td>۱</td><td>میزان فهم فایل اولیه</td><td>ضبط معرفی ۲ تا ۳ دقیقه‌ای</td><td>ثبت ضعف‌های اولیه</td></tr>
      <tr><td>۳۰</td><td>فهم فایل هم‌سطح</td><td>مکالمه ۵ دقیقه‌ای</td><td>بررسی عادت یادگیری</td></tr>
      <tr><td>۶۰</td><td>فهم گفتار طبیعی‌تر</td><td>مکالمه ۱۲ تا ۱۵ دقیقه‌ای</td><td>ارزیابی مکالمه روزمره</td></tr>
      <tr><td>۹۰</td><td>فهم محتوای عمومی و فنی</td><td>ارائه حرفه‌ای ۷ تا ۱۰ دقیقه‌ای</td><td>ارزیابی واژگان تخصصی</td></tr>
      <tr><td>۱۲۰</td><td>نتیجه تمرین‌های Listening</td><td>آزمون Speaking</td><td>ارزیابی چهار مهارت IELTS</td></tr>
      <tr><td>۱۵۰</td><td>نتیجه تمرین‌های هدفمند</td><td>مکالمه و مصاحبه</td><td>شناسایی ضعف‌های باقی‌مانده</td></tr>
      <tr><td>۱۸۰</td><td>مقایسه با روز اول</td><td>مکالمه آزاد و ارائه حرفه‌ای</td><td>گزارش نهایی چهار مهارت</td></tr></tbody></table></div>
      <h4>منابع پیشنهادی</h4><ul class="ep-guide-list"><li>منبع شنیداری، واژگان و زبان روزمره — نام منبع در متن ارسالی مشخص نشده است.</li><li>منبع شنیدن گویندگان مختلف و آشنایی با لهجه‌های گوناگون — نام منبع در متن ارسالی مشخص نشده است.</li><li>منبع شنیدن تلفظ عبارت‌ها در نمونه‌های واقعی — نام منبع در متن ارسالی مشخص نشده است.</li><li>کتاب‌های رسمی تمرینی Cambridge IELTS — برای تمرین آزمونی و بررسی پاسخ‌ها.</li></ul>
      <h4>قوانین مهم اجرای برنامه</h4><ol class="ep-guide-list"><li><strong>هر روز خروجی تولید کن:</strong> فقط گوش‌دادن و خواندن کافی نیست؛ باید جمله بسازی، بازگویی کنی یا صحبتت را ضبط کنی.</li><li><strong>عبارت‌ها را فعال یاد بگیر:</strong> یادگیری ۵ تا ۸ عبارت که بتوانی واقعاً در مکالمه استفاده کنی، بهتر از حفظ فهرست طولانی واژگان است.</li><li><strong>خطاها را پیگیری کن:</strong> اشتباه‌های پرتکرار را ثبت کن و در روزهای بعد برای اصلاح آن‌ها وقت بگذار.</li><li><strong>برنامه را با عملکردت تنظیم کن:</strong> اگر یک مهارت ضعیف‌تر است، زمان تمرین آن را افزایش بده؛ لازم نیست همه مهارت‌ها همیشه به یک اندازه پیش بروند.</li><li><strong>نتیجه را تضمین‌شده فرض نکن:</strong> ۱۸۰ روز تمرین منظم و سه ساعت مطالعه روزانه، در مجموع حدود <strong>۵۴۰ ساعت تمرین</strong> فراهم می‌کند؛ اما سطح نهایی به کیفیت تمرین، سطح شروع، میزان بازخورد و استمرار بستگی دارد.</li></ol>
      <p class="ep-guide-callout"><strong>پیشنهاد اجرایی:</strong> این فهرست را به‌عنوان چک‌لیست اصلی نگه دار و هر روز پس از انجام واقعی فعالیت‌ها، مربع همان روز را علامت بزن. علامت‌زدن به معنی انجام تمرین است، نه تسلط کامل بر موضوع؛ تسلط را باید با آزمون، ضبط صدا و استفاده عملی بسنجی.</p>
    </div></details>`;
  }

  function dayDetailMarkup(day) {
    const items = window.ENGLISH_PASSPORT_DAILY_DETAILS;
    const item = Array.isArray(items) ? items[day - 1] : null;
    if (!item) return `<div class="ep-lesson-hint"><strong>شرح کامل این روز</strong><p>جزئیات این روز هنوز به برنامه منتقل نشده است. برای روزهای ۹۱ تا ۱۸۰، عنوان و پیوند محتوای مرجع حفظ شده است.</p></div>`;
    return `<section class="ep-daily-instructions" aria-label="شرح کامل روز ${day}"><div class="ep-daily-context"><span>${escapeHTML(item.phaseTitle)}</span><span>${escapeHTML(item.weekTitle)}</span></div><p class="ep-daily-goal"><strong>هدف مرحله:</strong> ${escapeHTML(item.phaseGoal)}</p><h4>تمرین‌ها و دستورالعمل‌ها</h4><ol>${item.tasks.map(task => `<li>${escapeHTML(task)}</li>`).join('')}</ol><div class="ep-daily-output"><strong>خروجی مورد انتظار</strong><p>${escapeHTML(item.output)}</p></div><p class="ep-daily-note">پس از انجام تمرین‌ها، خروجی را ثبت کن و سپس روز را تکمیل‌شده علامت بزن.</p></section>`;
  }
  function dayISO(day) {
    if (state.startDate) {
      const d = new Date(state.startDate + 'T12:00:00'); d.setDate(d.getDate() + day - 1);
      const p2 = n => (n < 10 ? '0' : '') + n;
      return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    }
    const configured = window.ENGLISH_PASSPORT_DAYS;
    const item = Array.isArray(configured) ? configured[day - 1] : null;
    return item && item.date ? item.date : '';
  }
  function faDate(isoStr) {
    try { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoStr + 'T12:00:00')); }
    catch (_) { return isoStr; }
  }
  function faDateTime(value) {
    try { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
    catch (_) { return String(value); }
  }
  function dayDate(day) { const v = dayISO(day); return v ? faDate(v) : ''; }
  function findLessonTarget(day) {
    return document.querySelector(`[data-day="${day}"]`) || document.getElementById(`day-${day}`) || document.getElementById(`day${day}`);
  }
  function toast(message) {
    const el = $('#ep-toast');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { el.hidden = true; }, 2800);
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function icon(name) {
    const icons = {
      lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
      check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
      chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h17M7 15l4-4 3 2 5-7"/></svg>'
    };
    return icons[name] || '';
  }

  function ensureRoot() {
    let root = $('#english-passport-progress');
    if (!root) {
      root = document.createElement('section');
      root.id = 'english-passport-progress';
      root.setAttribute('aria-label', 'پیگیری پیشرفت برنامه ۱۸۰ روزه');
      root.hidden = false;
      const mount = document.getElementById('englishPassport180Inline');
      // Never place the tracker at the top of document.body as a fallback.
      // If the workspace card has not rendered yet, keep it detached until the
      // real mount exists; otherwise the entire dashboard can flash before the app header.
      if (mount) mount.appendChild(root);
    }
    if (!$('#ep-toast')) {
      const toastEl = document.createElement('div');
      toastEl.id = 'ep-toast'; toastEl.className = 'ep-toast'; toastEl.hidden = true;
      root.appendChild(toastEl);
    }
    return root;
  }

  function render() {
    const root = ensureRoot();
    const count = completedCount();
    const overall = pct(count, TOTAL_DAYS);
    const activePhase = phaseFor(firstIncompleteDay());
    const phaseCards = PHASES.map((phase, index) => {
      const start = phase.start, end = phase.end, total = end - start + 1;
      const done = state.completed.filter(day => day >= start && day <= end).length;
      return `<div class="ep-phase-card"><div class="ep-phase-top"><span class="ep-phase-number">مرحله ${index + 1}</span><strong>${pct(done, total)}٪</strong></div><div class="ep-progress-track"><span style="width:${pct(done, total)}%"></span></div><div class="ep-phase-name">${escapeHTML(phase.name)}</div><small>${done} از ${total} روز · روزهای ${start} تا ${end}</small></div>`;
    }).join('');
    const phaseDayGrids = PHASES.map((phase, index) => {
      const phaseNo = index + 1;
      const days = Array.from({length: phase.end - phase.start + 1}, (_, i) => phase.start + i);
      const done = days.filter(isComplete).length;
      const buttons = days.map(day => {
        const unlocked = isUnlocked(day), complete = isComplete(day), selected = day === activeDay;
        const classes = ['ep-day', complete ? 'is-done' : '', !unlocked ? 'is-locked' : '', selected ? 'is-selected' : ''].filter(Boolean).join(' ');
        return `<button type="button" class="${classes}" data-select-day="${day}" aria-label="${!unlocked ? 'مشاهده روز '+day+'؛ قفل است' : 'انتخاب روز '+day}" title="${escapeHTML(dayTitle(day))}"><span>${complete ? icon('check') : (!unlocked ? icon('lock') : day)}</span></button>`;
      }).join('');
      return `<section class="ep-phase-day-section" data-phase-section="${phaseNo}" ${expandedPhases.has(phaseNo) ? '' : 'hidden'}><div class="ep-phase-day-heading"><strong>${escapeHTML(phase.name)}</strong><span>${done}/30 روز · ${pct(done,30)}٪</span></div><div class="ep-day-grid">${buttons}</div></section>`;
    }).join('');
    const dayMetrics = METRICS.map(metric => {
      const value = metricFor(activeDay, metric.key);
      return `<label class="ep-metric-input"><span>${metric.label}</span><span class="ep-metric-control"><input type="range" min="0" max="100" step="1" data-metric="${metric.key}" value="${value === null ? 0 : value}" ${isUnlocked(activeDay) ? '' : 'disabled'} aria-label="${metric.label} برای روز ${activeDay}"><output data-metric-output="${metric.key}">${value === null ? 'ثبت نشده' : value + '٪'}</output></span></label>`;
    }).join('');
    const dayUnlocked = isUnlocked(activeDay);
    const dayComplete = isComplete(activeDay);
    const nextDay = Math.min(TOTAL_DAYS, activeDay + 1);
    root.innerHTML = `
      <div class="ep-shell" dir="rtl">
        <header class="ep-header"><div class="ep-header-copy"><p class="ep-eyebrow">ENGLISH PASSPORT · 180-DAY JOURNEY</p><h2>داشبورد پیشرفت یادگیری</h2><p class="ep-subtitle">پیشرفتت را ثبت کن، مرحله‌ها را دنبال کن و روند چهار مهارت را ببین.</p></div><div class="ep-header-actions"><button type="button" class="ep-btn ep-btn-secondary" data-action="export">خروجی پشتیبان</button><button type="button" class="ep-btn ep-btn-secondary" data-action="import">بازیابی پشتیبان</button><input type="file" id="ep-import-file" accept="application/json,.json" hidden></div></header>
        <div class="ep-summary-grid">
          <article class="ep-summary-card ep-overall-card"><div class="ep-summary-label">پیشرفت کل</div><div class="ep-overall-row"><div class="ep-ring" style="--ep-progress:${overall}"><span>${overall}<small>٪</small></span></div><div><strong>${count} از ${TOTAL_DAYS} روز</strong><p>${count === TOTAL_DAYS ? 'تبریک! مسیر ۱۸۰ روزه کامل شد.' : `مرحله فعلی: ${activePhase} از ۶`}</p></div></div></article>
          <article class="ep-summary-card"><div class="ep-summary-label">روزهای باقی‌مانده</div><div class="ep-stat-number">${TOTAL_DAYS-count}</div><p>از ${TOTAL_DAYS} روز کل برنامه</p></article>
          <article class="ep-summary-card"><div class="ep-summary-label">روز بعدی قابل انجام</div><div class="ep-stat-number">${count === TOTAL_DAYS ? '✓' : Math.min(TOTAL_DAYS, firstIncompleteDay())}</div><p>${count === TOTAL_DAYS ? 'همه روزها تکمیل شده‌اند' : 'با تکمیل روز جاری، روز بعد باز می‌شود.'}</p></article>
          <article class="ep-summary-card"><div class="ep-summary-label">آخرین ذخیره</div><div class="ep-stat-text">${escapeHTML(faDateTime(state.updatedAt))}</div><p>ذخیره محلی روی همین مرورگر</p></article>
        </div>
        ${programGuideMarkup()}
        <section class="ep-section"><div class="ep-section-heading"><div><h3>پیشرفت مرحله‌ها</h3><p>بازه‌های مرحله‌ها مطابق برنامهٔ اصلی و متناسب با هر نقطهٔ عطف هستند.</p></div></div><div class="ep-phase-grid">${phaseCards}</div></section>
        <section class="ep-section" id="ep-checklist-section"><div class="ep-section-heading"><div><h3>چک‌لیست تعاملی ۱۸۰ روزه</h3><p>هر روز ۳ ساعت برنامه دارد. برای خلوت ماندن صفحه، فقط مرحله انتخاب‌شده باز است؛ با «باز کردن همه مراحل» همه روزها را یکجا ببین.</p></div><div class="ep-legend"><span><i class="ep-dot done"></i> تکمیل‌شده</span><span><i class="ep-dot open"></i> قابل انجام</span><span><i class="ep-dot locked"></i> قفل</span></div></div><div class="ep-checklist-toolbar"><label class="ep-day-search-wrap"><span>جستجوی روز</span><input type="search" data-day-search placeholder="شماره یا عنوان روز را بنویس…" autocomplete="off" aria-label="جستجو در ۱۸۰ روز"><div class="ep-day-search-results" data-day-search-results hidden></div></label><div class="ep-phase-tabs">${PHASES.map((phase,i)=>`<button type="button" class="ep-phase-tab ${phaseFor(activeDay)===i+1?'active':''}" data-phase-jump="${i+1}">مرحله ${i+1} · ${phase.start}–${phase.end}</button>`).join('')}</div><div class="ep-expand-actions"><button type="button" class="ep-btn ep-btn-secondary" data-action="expand-all-phases">باز کردن همه مراحل</button><button type="button" class="ep-btn ep-btn-secondary" data-action="collapse-all-phases">بستن مراحل</button></div></div><div class="ep-phase-day-groups">${phaseDayGrids}</div>
          <div class="ep-day-detail"><div class="ep-day-detail-heading"><div><span class="ep-eyebrow">${dayUnlocked ? 'روز قابل انجام' : 'روز قفل‌شده'}</span><h3>${escapeHTML(dayTitle(activeDay))}</h3><p>روز ${activeDay} از ۱۸۰ · مرحله ${phaseFor(activeDay)}${dayDate(activeDay) ? ' · تاریخ برنامه: ' + escapeHTML(dayDate(activeDay)) : ''}</p></div><span class="ep-status ${dayComplete?'complete':dayUnlocked?'open':'locked'}">${dayComplete?'تکمیل شده':dayUnlocked?'آماده شروع':'قفل است'}</span></div>
          ${dayDetailMarkup(activeDay)}
          <div class="ep-day-actions"><a class="ep-btn ep-btn-secondary" href="https://app.notion.com/p/24f79633ffbf4e37b28f69cc0a471f97?v=3e4dba9c4b7881ae87fc000c820f1399&source=copy_link" target="_blank" rel="noopener noreferrer">باز کردن فهرست روزها در Notion</a><button type="button" class="ep-btn ep-btn-secondary" data-action="copy-day-title">کپی عنوان این روز</button>${findLessonTarget(activeDay) ? `<button type="button" class="ep-btn ep-btn-secondary" data-action="open-lesson" data-day="${activeDay}">رفتن به محتوای روز</button>` : ''}${dayUnlocked && !dayComplete ? `<button type="button" class="ep-btn ep-btn-primary" data-action="complete-day" data-day="${activeDay}">تکمیل روز ${activeDay}</button>` : ''}${dayComplete ? `<button type="button" class="ep-btn ep-btn-secondary" data-action="undo-day" data-day="${activeDay}">برگرداندن به حالت ناتمام</button>` : ''}${dayComplete && activeDay < TOTAL_DAYS && isUnlocked(nextDay) ? `<button type="button" class="ep-btn ep-btn-primary" data-action="next-day">رفتن به روز بعد ←</button>` : ''}</div>
          <div class="ep-metrics-editor"><div class="ep-section-heading"><div><h4>ثبت شاخص‌های روز ${activeDay}</h4><p>برای هر شاخص عددی از ۰ تا ۱۰۰ انتخاب کن. ثبت شاخص‌ها مستقل از تیک تکمیل روز است.</p></div></div><div class="ep-metrics-grid">${dayMetrics}</div><div class="ep-metrics-actions"><button type="button" class="ep-btn ep-btn-secondary" data-action="save-metrics" ${dayUnlocked ? '' : 'disabled'}>ذخیره شاخص‌ها</button><span>مقدار «ثبت نشده» در نمودار به‌عنوان صفر یا نمره واقعی در نظر گرفته نمی‌شود.</span></div></div>
        </div></section>
        <section class="ep-section ep-assessment-section"><div class="ep-section-heading"><div><h3>ارزیابی‌های دوره‌ای</h3><p>در روزهای مشخص مکث کن، نمونه‌های واقعی را بررسی کن و چهار شاخص را در پنل همان روز ثبت کن.</p></div></div><div class="ep-assessment-table-wrap"><table class="ep-assessment-table"><thead><tr><th>روز</th><th>نقطهٔ ارزیابی</th><th>تمرکز ارزیابی</th><th>اقدام</th></tr></thead><tbody>${CHECKPOINTS.map(c=>`<tr><td>روز ${c.day}</td><td>${escapeHTML(c.title)}</td><td>${escapeHTML(c.focus)}</td><td><button type="button" class="ep-btn ep-btn-secondary ep-checkpoint-jump" data-checkpoint-day="${c.day}">رفتن به ارزیابی</button></td></tr>`).join('')}</tbody></table></div><p class="ep-assessment-intro">چهار معیار ارزیابی</p><ul class="ep-assessment-list"><li><strong>Listening:</strong> درک پیام اصلی، جزئیات و عبارت‌های پیوسته.</li><li><strong>Speaking:</strong> مدت صحبت مستقل، وضوح، پاسخ‌دادن و گسترش ایده.</li><li><strong>Naturalness:</strong> طبیعی‌بودن عبارت‌ها، اتصال کلمات و روانی بیان.</li><li><strong>IELTS:</strong> دقت پاسخ، مدیریت زمان و عملکرد متناسب با مهارت‌های آزمون.</li></ul><div class="ep-assessment-note" style="margin-top:14px">نتیجه را بر اساس نمونهٔ ضبط‌شده، پاسخ‌های درست و خطاهای واقعی ثبت کن؛ درصدها ابزار مقایسه‌اند، نه نمرهٔ رسمی CEFR یا IELTS.</div></section>
        <section class="ep-section ep-coach-section"><div class="ep-section-heading"><div><h3>پرامپت مربی مکالمهٔ هوش مصنوعی</h3><p>متن را کپی کن و در گفت‌وگوی صوتی/متنی مربی قرار بده؛ عنوان روز را هم به آن بده.</p></div><button type="button" class="ep-btn ep-btn-primary" data-action="copy-coach-prompt">کپی پرامپت</button></div><textarea class="ep-coach-prompt-text" id="ep-coach-prompt" spellcheck="false">${escapeHTML(COACH_PROMPT)}</textarea><div class="ep-assessment-note" style="margin-top:12px">روش پیشنهادی: یک سؤال در هر نوبت، تمرکز روی صحبت‌کردن خودت، حداکثر سه خطای مهم در هر بازخورد و تکرار پاسخ اصلاح‌شده.</div></section>
        <section class="ep-section"><div class="ep-section-heading"><div><h3>گزارش نموداری</h3><p>گزارش بر اساس داده‌هایی است که در همین مرورگر ثبت کرده‌ای.</p></div></div><div class="ep-chart-grid"><article class="ep-chart-card"><div class="ep-chart-title"><h4>روند پیشرفت</h4><select data-trend-mode aria-label="نوع روند"><option value="completed" ${trendMode==='completed'?'selected':''}>تعداد روزهای تکمیل‌شده</option><option value="percent" ${trendMode==='percent'?'selected':''}>درصد پیشرفت تجمعی</option></select></div><div class="ep-chart-wrap"><canvas id="ep-trend-chart" role="img" aria-label="نمودار روند پیشرفت روزانه"></canvas></div><p class="ep-chart-note">محور افقی روزهای برنامه است؛ خط ممتد پیشرفت واقعی تو و خط‌چین طلایی مسیر ایده‌آل (هر روز یک روز) است.</p></article><article class="ep-chart-card"><div class="ep-chart-title"><h4>میانگین چهار شاخص</h4><span class="ep-chart-chip">۰ تا ۱۰۰</span></div><div class="ep-chart-wrap"><canvas id="ep-metrics-chart" role="img" aria-label="نمودار میانگین چهار شاخص"></canvas></div><div class="ep-metric-legend">${METRICS.map(m=>`<span><i style="background:${m.color}"></i>${m.label}</span>`).join('')}</div><p class="ep-chart-note">فقط روزهایی که برای شاخص مربوطه نمره ثبت شده باشد، در میانگین محاسبه می‌شوند.</p></article></div></section>
        <footer class="ep-footer"><span>اطلاعات پیشرفت و تیک‌های این بخش فقط روی همین مرورگر ذخیره می‌شوند و خودکار بین دستگاه‌ها همگام نمی‌شوند. برای اطمینان، خروجی پشتیبان بگیر و نتیجهٔ ارزیابی‌ها/یادداشت‌های مهم را در فایل یا دفترچه‌ای جداگانه هم نگه دار.</span><button type="button" class="ep-text-button" data-action="reset">پاک‌کردن تمام پیشرفت‌ها</button></footer><div id="ep-toast" class="ep-toast" hidden></div>
      </div>`;
    bindEvents(root);
    try { if (window.__epPlanEnhance) window.__epPlanEnhance(root); } catch (err) { console.warn('plan enhance', err); }
    drawCharts();
  }
  function firstIncompleteDay() {
    for (let day = 1; day <= TOTAL_DAYS; day++) if (!isComplete(day)) return day;
    return TOTAL_DAYS;
  }
  function bindEvents(root) {
    const backButton = $('[data-action="back-home"]', root);
    if (backButton) backButton.addEventListener('click', close);
    $$('[data-select-day]', root).forEach(button => button.addEventListener('click', () => {
      const day = Number(button.dataset.selectDay);
      activeDay = day;
      render();
      if (!isUnlocked(day)) toast('این روز برای مشاهده باز است؛ برای تکمیل، ابتدا روزهای قبل را انجام بده.');
    }));
    const daySearch = $('[data-day-search]', root);
    const daySearchResults = $('[data-day-search-results]', root);
    if (daySearch && daySearchResults) {
      daySearch.addEventListener('input', () => {
        const query = daySearch.value.trim().toLocaleLowerCase();
        if (!query) { daySearchResults.hidden = true; daySearchResults.innerHTML = ''; return; }
        const matches = Array.from({length:TOTAL_DAYS},(_,i)=>i+1).filter(day => String(day).includes(query) || dayTitle(day).toLocaleLowerCase().includes(query)).slice(0,8);
        daySearchResults.innerHTML = matches.length ? matches.map(day => `<button type="button" class="ep-day-search-result" data-search-select-day="${day}"><strong>روز ${day}</strong><span>${escapeHTML(dayTitle(day))}</span><small>${dayDate(day) ? escapeHTML(dayDate(day)) : ''}</small></button>`).join('') : '<p class="ep-day-search-empty">موردی پیدا نشد.</p>';
        daySearchResults.hidden = false;
        $$('[data-search-select-day]', daySearchResults).forEach(result => result.addEventListener('click', () => {
          activeDay = Number(result.dataset.searchSelectDay);
          expandedPhases = new Set([phaseFor(activeDay)]);
          render();
          $('#ep-checklist-section')?.scrollIntoView({behavior:'smooth',block:'start'});
        }));
      });
      daySearch.addEventListener('keydown', event => { if (event.key === 'Escape') { daySearch.value=''; daySearchResults.hidden=true; daySearchResults.innerHTML=''; } });
    }
    $$('[data-phase-jump]', root).forEach(button => button.addEventListener('click', () => {
      const phase = Number(button.dataset.phaseJump);
      const selectedPhase = PHASES[phase - 1];
      const start = selectedPhase.start;
      const firstAvailable = Array.from({length: selectedPhase.end - selectedPhase.start + 1}, (_,i)=>start+i).find(isUnlocked);
      activeDay = firstAvailable || start;
      expandedPhases = new Set([phase]);
      render();
      $('#ep-checklist-section')?.scrollIntoView({behavior:'smooth',block:'start'});
    }));
    $$('[data-checkpoint-day]', root).forEach(button => button.addEventListener('click', () => {
      activeDay = Number(button.dataset.checkpointDay);
      expandedPhases = new Set([phaseFor(activeDay)]);
      render();
      $('#ep-checklist-section')?.scrollIntoView({behavior:'smooth',block:'start'});
    }));
    $$('[data-metric]', root).forEach(input => input.addEventListener('input', () => {
      const output = $(`[data-metric-output="${input.dataset.metric}"]`, root);
      if (output) output.textContent = `${input.value}٪`;
    }));
    const trendSelect = $('[data-trend-mode]', root);
    if (trendSelect) trendSelect.addEventListener('change', () => { trendMode = trendSelect.value; drawCharts(); });
    $$('[data-action]', root).forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.action;
      const day = Number(button.dataset.day || activeDay);
      if (action === 'expand-all-phases') { expandedPhases = new Set(PHASES.map((_,i)=>i+1)); render();
      } else if (action === 'collapse-all-phases') { expandedPhases = new Set([phaseFor(activeDay)]); render();
      } else if (action === 'copy-day-title') {
        const title = `روز ${activeDay}: ${dayTitle(activeDay)}`;
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(title).then(()=>toast('عنوان روز کپی شد؛ آن را در Notion جستجو کن.')).catch(()=>fallbackCopy(title));
        else fallbackCopy(title);
      } else if (action === 'copy-coach-prompt') {
        const prompt = $('#ep-coach-prompt', root)?.value || COACH_PROMPT;
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(prompt).then(()=>toast('پرامپت کپی شد.')).catch(()=>fallbackCopy(prompt));
        else fallbackCopy(prompt);
      } else if (action === 'complete-day') {
        if (!isUnlocked(day)) return toast('این روز هنوز قفل است.');
        if (!state.completed.includes(day)) { state.completed.push(day); state.doneAt = state.doneAt || {}; state.doneAt[day] = new Date().toISOString(); }
        state.completed.sort((a,b)=>a-b); activeDay = day; saveState();
        if (day < TOTAL_DAYS) toast(`روز ${day} تکمیل شد؛ روز ${day + 1} باز شد.`);
        else toast('تبریک! هر ۱۸۰ روز را تکمیل کردی.');
      } else if (action === 'undo-day') {
        const later = state.completed.filter(n => n > day);
        if (later.length && !confirm('روزهای بعد از این روز نیز از حالت تکمیل خارج می‌شوند تا قانون ترتیب حفظ شود. ادامه می‌دهی؟')) return;
        state.completed = state.completed.filter(n => n < day); Object.keys(state.doneAt || {}).forEach(k => { if (Number(k) >= day) delete state.doneAt[k]; });
        activeDay = day; saveState(); toast('وضعیت روز و روزهای بعد از آن به‌روزرسانی شد.');
      } else if (action === 'next-day') {
        if (day < TOTAL_DAYS && isUnlocked(day + 1)) { activeDay = day + 1; expandedPhases = new Set([phaseFor(activeDay)]); render(); }
      } else if (action === 'save-metrics') {
        if (!isUnlocked(activeDay)) return toast('برای ثبت شاخص‌ها ابتدا باید به این روز رسیده باشی.');
        const row = Object.assign({}, state.metrics[String(activeDay)] || {});
        $$('[data-metric]', root).forEach(input => { row[input.dataset.metric] = clamp(input.value, 0, 100); });
        state.metrics[String(activeDay)] = row; saveState(); toast('شاخص‌های این روز ذخیره شدند.');
      } else if (action === 'open-lesson') {
        const target = findLessonTarget(day);
        if (target) { target.scrollIntoView({behavior:'smooth', block:'start'}); target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); }
      } else if (action === 'export') exportBackup();
      else if (action === 'import') { const file = $('#ep-import-file'); if (file) file.click(); }
      else if (action === 'reset') resetProgress();
    }));
    const fileInput = $('#ep-import-file', root);
    if (fileInput) fileInput.addEventListener('change', importBackup);
  }
  function fallbackCopy(text) { const area=document.createElement('textarea'); area.value=text; area.style.position='fixed'; area.style.opacity='0'; document.body.appendChild(area); area.select(); try { const ok=document.execCommand('copy'); toast(ok?'متن کپی شد.':'کپی خودکار ممکن نشد؛ متن را دستی انتخاب و کپی کن.'); } catch (_) { toast('کپی خودکار ممکن نشد؛ متن را دستی انتخاب و کپی کن.'); } area.remove(); }
  function resetProgress() {
    if (!confirm('تمام روزهای تکمیل‌شده و شاخص‌های ثبت‌شده پاک شوند؟ این کار قابل بازگشت نیست؛ اگر لازم است ابتدا خروجی پشتیبان بگیر.')) return;
    state = freshState(); activeDay = 1; saveState(); toast('پیشرفت پاک شد.');
  }
  function exportBackup() {
    const payload = { app: 'English Passport PWA', exportVersion: 1, exportedAt: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `english-passport-progress-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('فایل پشتیبان آماده شد.');
  }
  function importBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = parsed.state || parsed;
        if (!imported || !Array.isArray(imported.completed) || typeof imported.metrics !== 'object') throw new Error('invalid');
        if (!confirm('اطلاعات فعلی با اطلاعات فایل پشتیبان جایگزین شود؟')) return;
        state = freshState();
        state.completed = [...new Set(imported.completed.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=TOTAL_DAYS))].sort((a,b)=>a-b);
        state.metrics = imported.metrics || {};
        state.tasks = imported.tasks && typeof imported.tasks === 'object' ? imported.tasks : {};
        state.notes = imported.notes && typeof imported.notes === 'object' ? imported.notes : {};
        state.doneAt = imported.doneAt && typeof imported.doneAt === 'object' ? imported.doneAt : {};
        state.startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(imported.startDate || '')) ? imported.startDate : null;
        // Enforce the sequential-unlock rule on imported completion data.
        const sequential = [];
        for (let day=1; day<=TOTAL_DAYS; day++) { if (state.completed.includes(day) && (day===1 || sequential.includes(day-1))) sequential.push(day); else break; }
        state.completed = sequential;
        state.updatedAt = new Date().toISOString(); activeDay = Math.max(1, Math.min(TOTAL_DAYS, firstIncompleteDay()));
        saveState(); toast('پشتیبان بازیابی شد.');
      } catch (_) { toast('فایل پشتیبان معتبر نیست یا ساختار آن پشتیبانی نمی‌شود.'); }
      finally { event.target.value = ''; }
    };
    reader.readAsText(file);
  }
  function drawCharts() {
    drawTrend($('#ep-trend-chart'));
    drawMetricChart($('#ep-metrics-chart'));
  }
  function prepareCanvas(canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(280, Math.floor(rect.width || 600));
    const height = 230;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = width * ratio; canvas.height = height * ratio;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d'); ctx.setTransform(ratio,0,0,ratio,0,0);
    return {ctx, width, height};
  }
  function themeC() { const cs = getComputedStyle(document.documentElement); const v = (n, f) => cs.getPropertyValue(n).trim() || f; return { grid: v('--line', '#e5e7eb'), axis: v('--ink-soft', '#aab2c0'), muted: v('--ink-soft', '#727b8b'), text: v('--ink', '#313a49'), accent: v('--green', '#3984f5'), gold: v('--gold', '#ed9b35') }; }
  function drawAxes(ctx, width, height, maxY, yLabel, showX) {
    const left = 42, right = width - 14, top = 16, bottom = height - 30;
    ctx.font = '11px system-ui, sans-serif'; ctx.lineWidth = 1;
    for (let i=0;i<=4;i++) {
      const y = bottom - (bottom-top)*i/4;
      ctx.strokeStyle = themeC().grid; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(right,y); ctx.stroke();
      ctx.fillStyle = themeC().muted; ctx.textAlign = 'right'; ctx.fillText(String(Math.round(maxY*i/4)), left-8, y+4);
    }
    ctx.strokeStyle = themeC().axis; ctx.beginPath(); ctx.moveTo(left,top); ctx.lineTo(left,bottom); ctx.lineTo(right,bottom); ctx.stroke();
    if (showX !== false) { ctx.fillStyle = themeC().muted; ctx.textAlign = 'left'; ctx.fillText('روز ۱', left, height-8); ctx.textAlign = 'right'; ctx.fillText('روز ۱۸۰', right, height-8); }
    return {left,right,top,bottom};
  }
  function drawTrend(canvas) {
    const chart = prepareCanvas(canvas); if (!chart) return;
    const {ctx,width,height} = chart; ctx.clearRect(0,0,width,height);
    const maxY = trendMode === 'percent' ? 100 : TOTAL_DAYS;
    const axes = drawAxes(ctx,width,height,maxY);
    ctx.save(); ctx.setLineDash([5,4]); ctx.strokeStyle = themeC().gold; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(axes.left, axes.bottom); ctx.lineTo(axes.right, axes.top); ctx.stroke(); ctx.restore();
    const values = [];
    let running = 0;
    for (let day=1; day<=TOTAL_DAYS; day++) {
      if (state.completed.includes(day)) running++;
      values.push(trendMode==='percent' ? pct(running,TOTAL_DAYS) : running);
    }
    ctx.strokeStyle = themeC().accent; ctx.lineWidth = 2.5; ctx.beginPath();
    values.forEach((value,i) => {
      const x = axes.left + (axes.right-axes.left)*i/(TOTAL_DAYS-1);
      const y = axes.bottom - (axes.bottom-axes.top)*value/maxY;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }); ctx.stroke();
    const current = values[activeDay-1];
    const x = axes.left + (axes.right-axes.left)*(activeDay-1)/(TOTAL_DAYS-1);
    const y = axes.bottom - (axes.bottom-axes.top)*current/maxY;
    ctx.fillStyle = themeC().accent; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
  }
  function drawMetricChart(canvas) {
    const chart = prepareCanvas(canvas); if (!chart) return;
    const {ctx,width,height} = chart; ctx.clearRect(0,0,width,height);
    const axes = drawAxes(ctx,width,height,100,undefined,false);
    const values = METRICS.map(m => {
      const scores = Object.keys(state.metrics).map(day=>metricFor(Number(day),m.key)).filter(v=>v!==null);
      return scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
    });
    const plotW = axes.right-axes.left; const barW = Math.min(52, plotW/(METRICS.length*1.8));
    METRICS.forEach((metric,i) => {
      const x = axes.left + plotW*(i+0.5)/METRICS.length;
      const value = values[i];
      if (value !== null) {
        const y = axes.bottom - (axes.bottom-axes.top)*value/100;
        ctx.fillStyle = metric.color; ctx.globalAlpha = .88; ctx.fillRect(x-barW/2,y,barW,axes.bottom-y); ctx.globalAlpha = 1;
        ctx.fillStyle = themeC().text; ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${value}%`,x,Math.max(12,y-6));
      } else {
        ctx.fillStyle = themeC().muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('—',x,axes.bottom-8);
      }
      ctx.fillStyle = themeC().muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(metric.label,x,height-8);
    });
  }
  function start() {
    const root = ensureRoot();
    const mount = document.getElementById('englishPassport180Inline');
    if (mount && root.parentElement !== mount) mount.appendChild(root);
    root.hidden = false;
    render();
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawCharts,120); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();

  // The app replaces #wrap when navigating between workspace sections. Keep the
  // tracker attached to the current dashboard mount instead of leaving it detached
  // or outside the visible dashboard after a route change.
  if (typeof MutationObserver !== 'undefined' && document.body) {
    let syncingMount = false;
    const mountObserver = new MutationObserver(() => {
      if (syncingMount) return;
      const mount = document.getElementById('englishPassport180Inline');
      if (!mount) return;
      let root = document.getElementById('english-passport-progress');
      const wasMissing = !root;
      syncingMount = true;
      if (!root) root = ensureRoot();
      if (wasMissing || root.parentElement !== mount) {
        mount.appendChild(root);
        root.hidden = false;
        render();
      }
      syncingMount = false;
    });
    mountObserver.observe(document.body, {childList:true, subtree:true});
  }

  function open() {
    const root = ensureRoot();
    const mount = document.getElementById('englishPassport180Inline');
    if (mount && root.parentElement !== mount) mount.appendChild(root);
    root.hidden = false;
    render();
    root.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  function close() {
    const root = $('#english-passport-progress');
    if (root) { root.hidden = true; }
  }
  window.__epPlan = {
    state: () => state, activeDay: () => activeDay,
    setActive(d) { d = Math.max(1, Math.min(TOTAL_DAYS, Number(d) || 1)); activeDay = d; expandedPhases = new Set([phaseFor(d)]); render(); },
    save: saveState, saveQuiet: saveStateQuiet, render, isUnlocked, isComplete, firstIncomplete: firstIncompleteDay,
    dayISO, faDate, toast, total: TOTAL_DAYS,
    reload() { state = loadState(); activeDay = Math.min(TOTAL_DAYS, firstIncompleteDay()); render(); }
  };
  window.EnglishPassportProgress = {
    version: '1.0.0',
    open, close,
    refresh: render,
    selectDay(day) { const n=Number(day); if (n>=1&&n<=TOTAL_DAYS&&isUnlocked(n)) { activeDay=n; render(); } },
    registerDays(days) { if (Array.isArray(days)) window.ENGLISH_PASSPORT_DAYS = days; render(); },
    exportBackup
  };
})();
