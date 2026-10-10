from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
JS = (ROOT / 'assets/progress.js').read_text(encoding='utf-8')
INLINE_RUNTIME = re.search(r'<script id="ep-progress-inline-runtime"[^>]*>(.*?)</script>', HTML, re.S).group(1)
SW = (ROOT / 'sw.js').read_text(encoding='utf-8')


def test_home_entry_and_assets_are_wired():
    assert INLINE_RUNTIME.strip() == JS.strip()
    assert 'id="englishPassport180Inline"' in HTML
    assert HTML.index('class="app-hub-header"') < HTML.index('id="englishPassport180Inline"') < HTML.index('class="ep-toolbar"')
    assert 'mountObserver.observe(document.body' in JS
    assert 'id="ep-progress-inline-runtime"' in HTML
    assert 'id="ep-progress-inline-css"' in HTML
    assert 'assets/progress.css' in SW
    assert 'assets/daily-details-fa.js' in SW
    assert 'assets/daily-details-fa.js' in SW
    assert 'assets/progress.js' in SW
    assert (ROOT / 'assets/progress.css').is_file()
    assert (ROOT / 'assets/progress.js').is_file()


def test_180_day_and_six_phase_model():
    assert 'const TOTAL_DAYS = 180;' in JS
    assert 'const PHASES = [' in JS
    assert "start: 1, end: 30" in JS
    assert "start: 31, end: 60" in JS
    assert "start: 151, end: 180" in JS
    assert 'ep-phase-day-groups' in INLINE_RUNTIME
    assert 'ep-day-search-results' in INLINE_RUNTIME
    for feature in ('باز کردن همه مراحل', 'روزهای باقی‌مانده', 'ارزیابی‌های دوره‌ای', 'پرامپت مربی مکالمه', 'data-day-search', 'data-checkpoint-day', 'copy-coach-prompt'):
        assert feature in INLINE_RUNTIME
    data = (ROOT / 'assets/english-passport-days.js').read_text(encoding='utf-8')
    assert data.count('\"day\":') == 180
    assert 'Day 001 — Listening Baseline & Self-Introduction' in data
    assert 'Day 180 — FINAL CHECKPOINT' in data
    assert 'start: 1, end: 30' in INLINE_RUNTIME
    assert 'start: 31, end: 60' in INLINE_RUNTIME
    assert 'start: 151, end: 180' in INLINE_RUNTIME


def test_sequential_unlock_and_undo_protect_order():
    assert 'return day === 1 || state.completed.includes(day - 1);' in JS
    assert 'مشاهده روز ' in JS
    assert 'این روز برای مشاهده باز است' in JS
    assert 'state.completed = state.completed.filter(n => n < day);' in JS
    assert 'Enforce the sequential-unlock rule on imported completion data.' in JS


def test_metrics_and_backup_are_present():
    for metric in ('listening', 'speaking', 'naturalness', 'ielts'):
        assert f"key: '{metric}'" in JS
    assert 'function exportBackup()' in JS
    assert 'function importBackup(event)' in JS
    assert "localStorage.getItem(STORAGE_KEY)" in JS


def test_service_worker_precaches_module_assets_and_version():
    assert "'assets/progress.css'" in SW
    assert "'assets/progress.js'" in SW
    assert "'assets/english-passport-days.js'" in SW
    assert re.search(r"const VERSION = '[^']+';", SW)


def test_persian_daily_details_are_complete_for_all_180_days():
    details = (ROOT / 'assets/daily-details-fa.js').read_text(encoding='utf-8')
    assert 'window.ENGLISH_PASSPORT_DAILY_DETAILS' in details
    assert details.count('"day":') == 180
    for phrase in ('ارزیابی سطح و تعیین نقطه شروع', 'ارزیابی و تثبیت پایه', 'معرفی حرفه‌ای', 'ارزیابی مرحله سوم', 'آشنایی با ساختار IELTS', 'ارزیابی مرحله چهارم', 'تحلیل دقیق Listening', 'جلسه کامل پروژه', 'ارزیابی جامع و جمع‌بندی', 'تمرین‌ها و دستورالعمل‌ها', 'خروجی مورد انتظار'):
        assert phrase in details or phrase in JS
    assert 'dayDetailMarkup(activeDay)' in INLINE_RUNTIME
    assert 'assets/daily-details-fa.js' in HTML


def test_comprehensive_program_guide_is_embedded_and_complete():
    for phrase in ('راهنمای جامع اجرای برنامه ۱۸۰ روزه', 'روش اجرای روزانه', 'تحلیل عبارت‌ها', 'تلفظ و Shadowing', 'جدول ارزیابی پیشرفت', '۵۴۰ ساعت تمرین', 'Cambridge IELTS', 'هر روز خروجی تولید کن', 'نام منبع در متن ارسالی مشخص نشده است'):
        assert phrase in JS
    assert '${programGuideMarkup()}' in JS
    assert 'ep-program-guide' in (ROOT / 'assets/progress.css').read_text(encoding='utf-8')
    assert INLINE_RUNTIME.strip() == JS.strip()
