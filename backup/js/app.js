/* =========================================================
 * نقطه ورود اصلی برنامه (App Initialization)
 * ========================================================= */

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

    const data = await response.json();
    userData = Array.isArray(data) ? data[0] : data;
    console.log("[DEBUG] اطلاعات دریافتی کاربر:", userData);

    // ۳. رندر داشبورد اصلی
    if (userData) {
      renderDashboard(userData);

      const userLevel = userData.cefr_level || userData.determined_level || userData.level;
      if (userLevel) {
        document.getElementById('quiz-start-card').style.display = 'none';
        displayQuizResults({
          determined_level: userLevel,
          summary: userData.ai_analysis_summary || "مسیر آموزشی فعال است."
        });
      }
    }
  } catch (err) {
    console.warn("[DEBUG] خطا در دریافت وضعیت کاربر از بک‌اند:", err);
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
