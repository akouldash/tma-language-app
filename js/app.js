/* =========================================================
 * نقطه ورود اصلی برنامه (App Initialization)
 * ========================================================= */

// آدرس‌های API پروکسی‌شده بر اساس vercel.json و config.js
const N8N_AUTH_URL = "/api/n8n/auth";
const N8N_PLACEMENT_URL = "/api/n8n/placement-test";
const N8N_LESSON_WEBHOOK_URL = "/api/n8n/generate-lesson";

let currentUserTelegramId = null;

async function initApp() {
  console.log("[DEBUG] مقداردهی اولیه برنامه...");

  // ۱. دریافت ایمن مشخصات کاربر از تلگرام و نمایش در هدر اصلی
  const tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) 
                 ? window.Telegram.WebApp.initDataUnsafe.user 
                 : {};

  currentUserTelegramId = tgUser.id || "";

  const firstName = tgUser.first_name ? String(tgUser.first_name).trim() : "";
  const lastName = tgUser.last_name ? String(tgUser.last_name).trim() : "";
  const fullName = (firstName + " " + lastName).trim() || "کاربر ناشناس";
  const cleanUsername = tgUser.username ? String(tgUser.username).replace(/^@/, '').trim() : "";
  const userId = tgUser.id ? String(tgUser.id) : "";

  let subtext = cleanUsername && userId ? `${cleanUsername} - ${userId}` : (cleanUsername || userId);

  // نمایش پروفایل در ظاهر اولیه
  safeSetText('user-fullname', fullName);
  safeSetText('user-subtext', subtext);

  let defaultTrialEnd = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
  let userData = null;

  // ۲. احراز هویت و دریافت اطلاعات کاربر از n8n (ورکفلو ۱)
  try {
    const initDataStr = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp.initData : "";

    const response = await fetch(N8N_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        telegram_id: tgUser.id, 
        username: tgUser.username, 
        first_name: tgUser.first_name, 
        last_name: tgUser.last_name,
        init_data: initDataStr 
      })
    });

    if (response.ok) {
      const data = await response.json();
      userData = Array.isArray(data) ? data[0] : data;
      console.log("[DEBUG] اطلاعات دریافتی کاربر:", userData);
    }
  } catch (err) {
    console.warn("[DEBUG] خطا در دریافت وضعیت کاربر از بک‌اند:", err);
  }

  // ۳. مدیریت کارت‌های آزمون و داشبورد با حفظ چیدمان قبلی
  const quizStartCard = document.getElementById('quiz-start-card');
  const quizResultsCard = document.getElementById('quiz-results-card');

  if (userData) {
    // رندر داشبورد
    if (typeof renderDashboard === 'function') {
      renderDashboard(userData);
    }

    const rawLevel = userData.cefr_level || userData.determined_level || userData.level;
    const hasValidLevel = rawLevel && rawLevel !== 'null' && rawLevel !== 'undefined' && rawLevel !== '';

    if (hasValidLevel) {
      // اگر تعیین سطح شده، کارت شروع مخفی می‌شود
      if (quizStartCard) quizStartCard.style.display = 'none';

      // اگر روی دکمه ورود به درس کلیک نکرده، کارنامه را نشان بده
      if (localStorage.getItem('first_lesson_started') !== 'true') {
        if (quizResultsCard) quizResultsCard.style.display = 'block';
        if (typeof displayQuizResults === 'function') {
          displayQuizResults({
            determined_level: rawLevel,
            summary: userData.ai_analysis_summary || "مسیر آموزشی شما فعال است."
          });
        }
      } else {
        if (quizResultsCard) quizResultsCard.style.display = 'none';
      }
    } else {
      // کاربر تعیین سطح نشده یا دیتابیس پاک شده است
      if (quizStartCard) quizStartCard.style.display = 'block';
      if (quizResultsCard) quizResultsCard.style.display = 'none';
    }
  } else {
    if (quizStartCard) quizStartCard.style.display = 'block';
    if (quizResultsCard) quizResultsCard.style.display = 'none';
  }

  // ۴. محاسبه و شروع تایمر اشتراک (پشتیبانی از فرمت‌های تاریخ سرور)
  function parseServerDate(dateString) {
    if (!dateString) return null;
    const timeMs = new Date(String(dateString).trim().replace(' ', 'T')).getTime();
    return isNaN(timeMs) ? null : timeMs;
  }

  let targetTimestamp = null;
  if (userData && userData.trial_ends_at) {
    targetTimestamp = parseServerDate(userData.trial_ends_at);
  } else if (userData && userData.created_at) {
    const createdMs = parseServerDate(userData.created_at);
    if (createdMs) targetTimestamp = createdMs + (7 * 24 * 60 * 60 * 1000);
  }

  if (typeof startCountdown === 'function') {
    startCountdown(targetTimestamp || defaultTrialEnd);
  }
}

/* =========================================================
 * مدیریت ارسال تعیین سطح و انتقال کارنامه به داشبورد
 * ========================================================= */

async function submitPlacementTest(event) {
  if (event) event.preventDefault();

  const tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) 
                 ? window.Telegram.WebApp.initDataUnsafe.user || {} : {};

  const answers = {
    q1: document.getElementById('quiz-q1')?.value || '',
    q2: document.getElementById('quiz-q2')?.value || '',
    q3: document.getElementById('quiz-q3')?.value || '',
    q4: document.getElementById('quiz-q4')?.value || '',
    q5: document.getElementById('quiz-q5')?.value || ''
  };

  const payload = {
    telegram_id: tgUser.id || currentUserTelegramId,
    first_name: tgUser.first_name || "",
    username: tgUser.username || "",
    answers: answers
  };

  try {
    const response = await fetch(N8N_PLACEMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`خطا: ${response.status}`);

    const result = await response.json();

    document.getElementById('quiz-start-card').style.display = 'none';
    const quizResultsCard = document.getElementById('quiz-results-card');
    if (quizResultsCard) quizResultsCard.style.display = 'block';

    if (typeof displayQuizResults === 'function') {
      displayQuizResults(result);
    }
  } catch (error) {
    console.error("[DEBUG] خطا در ارسال پاسخ‌های آزمون:", error);
    alert("خطا در ارتباط با سرور. لطفاً مجدداً سعی کنید.");
  }
}

// دکمه «ورود به اولین جلسه درس» (حذف کارنامه و انتقال خلاصه وضعیت به داشبورد)
function startFirstLesson() {
  localStorage.setItem('first_lesson_started', 'true');

  const quizResultsCard = document.getElementById('quiz-results-card');
  if (quizResultsCard) quizResultsCard.style.display = 'none';

  // اگر تابعی برای باز کردن بخش درس یا دریافت WF 3 دارید در اینجا فراخوانی می‌شود
  if (typeof loadLessonData === 'function') {
    loadLessonData();
  }
}

// اجرای برنامه
document.addEventListener("DOMContentLoaded", () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.expand();
  }
  initApp();
});
