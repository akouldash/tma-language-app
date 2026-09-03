/* =========================================================
 * نقطه ورود اصلی برنامه (App Initialization)
 * ========================================================= */

// آدرس وب‌هوک احراز هویت از طریق پروکسی Vercel
const N8N_AUTH_URL = '/api/n8n/auth';

async function initApp() {
  console.log("[DEBUG] مقداردهی اولیه برنامه...");

  // ۱. دریافت ایمن مشخصات کاربر از تلگرام و نمایش در پروفایل
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

  // نمایش فوری نام و شناسه کاربر در صفحه
  if (typeof safeSetText === 'function') {
    safeSetText('user-fullname', fullName);
    safeSetText('user-subtext', subtext);
  }

  let defaultTrialEnd = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
  let userData = null;

  // ۲. احراز هویت و دریافت اطلاعات کاربر از n8n پروکسی
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

  // ۳. رندر داشبورد و مدیریت نمایش فرم تعیین سطح
  const quizStartCard = document.getElementById('quiz-start-card');
  const quizResultsCard = document.getElementById('quiz-results-card');

  if (userData) {
    // رندر ایمن داده‌های داشبورد
    if (typeof renderDashboard === 'function') {
      try {
        renderDashboard(userData);
      } catch (e) {
        console.error("[DEBUG] خطا در رندر داشبورد:", e);
      }
    }

    const rawLevel = userData.cefr_level || userData.determined_level || userData.level;
    const hasValidLevel = rawLevel && rawLevel !== 'null' && rawLevel !== 'undefined' && rawLevel !== '';

    if (hasValidLevel) {
      if (quizStartCard) quizStartCard.style.display = 'none';
      if (typeof displayQuizResults === 'function') {
        displayQuizResults({
          determined_level: rawLevel,
          summary: userData.ai_analysis_summary || "مسیر آموزشی فعال است."
        });
      }
    } else {
      if (quizStartCard) quizStartCard.style.display = 'block';
      if (quizResultsCard) quizResultsCard.style.display = 'none';
    }
  } else {
    // عدم وجود داده کاربر (دیتابیس پاک شده یا کاربر جدید)
    if (quizStartCard) quizStartCard.style.display = 'block';
    if (quizResultsCard) quizResultsCard.style.display = 'none';
  }

  // ۴. محاسبه و شروع بدون خطای تایمر اشتراک
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

// اجرای برنامه به محض بارگذاری کامل DOM
document.addEventListener("DOMContentLoaded", () => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.expand();
  }
  initApp();
});
