from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
SW = (ROOT / 'sw.js').read_text(encoding='utf-8')

def test_main_page_is_the_432_session_roadmap():
    assert 'نقشه راه جامع انگلیسی' in HTML
    assert 'Day 001' in HTML and 'Day 432' in HTML
    assert 'const TOTAL_DAYS = 432;' in HTML
    assert 'ویرایش کامل محتوای روز' in HTML

def test_roadmap_removes_pdf_action_and_adds_study_tools():
    assert 'data-action=\"print-day\"' not in HTML
    assert 'ذخیره PDF این روز' not in HTML
    assert 'window.print(' not in HTML
    assert 'print-roadmap' not in HTML
    assert 'data-timer-display' in HTML
    assert 'data-action=\"timer-start\"' in HTML
    assert 'data-action=\"new-speaking-prompt\"' in HTML
    assert 'data-action=\"copy-speaking-prompt\"' in HTML

def test_leitner_and_review_tools_are_preserved():
    assert 'englishPassportLeitnerBox_v1' in HTML
    assert 'leitnerHubCard' in HTML
    assert 'englishPassportLeitnerFolders_v1' in HTML

def test_pwa_registration_and_cache_version_are_present():
    assert 'serviceWorker.register' in HTML
    assert "const VERSION = '" in SW
    assert "'index.html'" in SW
    assert "'assets/daily-details-fa.js'" in SW

def test_repository_data_and_assets_are_preserved():
    for relative in (
        'backup.json', 'manifest.webmanifest', 'assets/daily-details-fa.js',
        'assets/english-passport-days.js', 'assets/progress.css',
        'assets/progress.js', 'icons/icon-192.png', 'icons/icon-512.png',
        'archive/index-180-day-before-432-upgrade.html',
    ):
        assert (ROOT / relative).is_file(), relative
    assert (ROOT / 'backup.json').stat().st_size > 1_000_000

def test_service_worker_version_has_expected_format():
    assert re.search(r"const VERSION = '[A-Za-z0-9-]+';", SW)


def test_pomodoro_has_required_fixed_cycle_and_four_rounds():
    assert "const POMODORO_DURATIONS = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 20 * 60 };" in HTML
    assert "completedPomodoros >= 4" in HTML
    assert "data-action=\"timer-next\"" not in HTML
    assert "data-action=\"timer-pause\"" not in HTML
    assert "data-action=\"timer-start\"" in HTML
    assert "startTimer();" in HTML[HTML.index("function startTimer() {" ):HTML.index("function saveState()")]
    assert "data-action=\"timer-reset\"" in HTML
    assert "data-pomodoro-note" in HTML
    assert "data-action=\"pomodoro-log\"" in HTML
    assert "Shadowing" in HTML
