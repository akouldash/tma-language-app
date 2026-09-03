/* =========================================================
 * نقطه ورود اصلی برنامه (App Initialization)
 * ========================================================= */

// تابع کمکی پاک‌سازی حافظه محلی در صورت پاک‌سازی دیتابیس یا عدم وجود سطح کاربر
function clearLocalCache() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log("[DEBUG] حافظه محلی مرورگر پاک‌سازی شد.");
  } catch (e) {
    console.warn("[DEBUG] خطا در پاک‌سازی حافظه محلی:", e);
  }
}

async function initApp() {
  console.log("[DEBUG] مقداردهی اولیه برنامه...");

  // ۱. دریافت ایمن مشخصات کاربر از تلگرام
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

  safeSetText('user-fullname', fullName);
  safeSetText('user-subtext', subtext);

  let defaultTrialEnd = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
  let userData = null;

  // ۲. احراز هویت و دریافت اطلاعات کاربر از n8n
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
    } else {
      console.warn("[DEBUG] پاسخ ناموفق از سرور بک‌اند:", response.status);
    }

   // ۳. بررسی دقیق سطح کاربر (عدم پذیرش کاربران بدون تعیین سطح واقعی)
    const rawLevel = userData ? (userData.cefr_level || userData.determined_level || userData.level) : null;
    
    // اگر سطح کاربر وجود داشت و مخالف مقادیر خالی یا اولیه بود
    const hasValidLevel = rawLevel && rawLevel !== 'null' && rawLevel !== 'undefined' && rawLevel !== '';

    if (userData && hasValidLevel) {
      console.log("[DEBUG] کاربر دارای سطح معتبر است:", rawLevel);
      renderDashboard(userData);

      const quizStartCard = document.getElementById('quiz-start-card');
      if (quizStartCard) quizStartCard.style.display = 'none';

      displayQuizResults({
        determined_level: rawLevel,
        summary: userData.ai_analysis_summary || "مسیر آموزشی فعال است."
      });
    } else {
      // کاربر جدید است یا دیتابیس پاک شده -> نمایش حتمی کارت شروع تعیین سطح
      console.log("[DEBUG] کاربر تعیین سطح نشده است. باز کردن فرم تعیین سطح...");
      clearLocalCache();

      const quizStartCard = document.getElementById('quiz-start-card');
      if (quizStartCard) quizStartCard.style.display = 'block';

      const quizResultsCard = document.getElementById('quiz-results-card');
      if (quizResultsCard) quizResultsCard.style.display = 'none';

      if (typeof renderDashboard === 'function') {
        renderDashboard(userData || {});
      }
    }
  // ۴. محاسبه و شروع تایمر اشتراک
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

  startCountdown(targetTimestamp || defaultTrialEnd);
}

// اجرای برنامه به محض بارگذاری کامل DOM
document.addEventListener("DOMContentLoaded", () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.expand();
  }
  initApp();
});
