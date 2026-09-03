/* =========================================================
 * تنظیمات ثابت پروژه، ثابت‌های شبکه و متغیرهای عمومی
 * ========================================================= */

// آدرس‌های API پروکسی‌شده توسط Vercel (مسیرهای نسبی)
const N8N_AUTH_URL = "/api/n8n/auth";                   // WF 1: احراز هویت و هماهنگی داده‌ها
const N8N_PLACEMENT_URL = "/api/n8n/placement-test";     // WF 2: آزمون تعیین سطح
const N8N_LESSON_WEBHOOK_URL = "/api/n8n/generate-lesson"; // WF 3: تولید و دریافت درس تجربی (Gemini)
const N8N_DELETE_URL = "/api/n8n/delete-account";        // WF 5: حذف حساب کاربری

// وضعیت عمومی برنامه (Global State)
let currentUserTelegramId = null;
let currentUserData = null;
let currentLessonData = null;

// توابع کمکی DOM
function safeSetText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = text;
}

function safeSetHTML(elementId, html) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = html;
}

function showScreen(screenId) {
  document.querySelectorAll('.app-screen').forEach(screen => {
    screen.style.display = 'none';
  });
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) targetScreen.style.display = 'block';
}
