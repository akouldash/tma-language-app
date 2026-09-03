/* =========================================================
 * مدیریت جریان اصلی برنامه و احراز هویت (WF 1)
 * ========================================================= */

async function initApp() {
  console.log("[DEBUG] مقداردهی اولیه سیستم...");

  // ۱. دریافت داده‌های کاربر از اپلیکیشن تلگرام
  const tg = window.Telegram?.WebApp;
  if (tg) tg.expand();

  const tgUser = tg?.initDataUnsafe?.user || {};
  currentUserTelegramId = tgUser.id ? String(tgUser.id) : "";

  const firstName = tgUser.first_name ? String(tgUser.first_name).trim() : "";
  const lastName = tgUser.last_name ? String(tgUser.last_name).trim() : "";
  const fullName = (firstName + " " + lastName).trim() || "کاربر مهمان";
  const cleanUsername = tgUser.username ? String(tgUser.username).replace(/^@/, '').trim() : "";
  const subtext = cleanUsername && currentUserTelegramId ? `${cleanUsername} - ${currentUserTelegramId}` : (cleanUsername || currentUserTelegramId);

  safeSetText('user-fullname', fullName);
  safeSetText('user-subtext', subtext);

  // ۲. فراخوانی ورکفلوی ۱ (Auth & DB Sync)
  try {
    const response = await fetch(N8N_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_id: tgUser.id,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        init_data: tg?.initData || ""
      })
    });

    if (response.ok) {
      const data = await response.json();
      currentUserData = Array.isArray(data) ? data[0] : data;
      console.log("[DEBUG] داده‌های کاربر دریافت شد:", currentUserData);
    }
  } catch (err) {
    console.warn("[DEBUG] خطا در احراز هویت اولیه:", err);
  }

  // ۳. مسیریابی هوشمند صفحه اولیه
  const userLevel = currentUserData?.cefr_level;
  const quizStartCard = document.getElementById('quiz-start-card');
  const quizResultsCard = document.getElementById('quiz-results-card');

  if (currentUserData && userLevel && userLevel !== 'null') {
    // کاربر تعیین سطح شده است -> به روزرسانی داشبورد
    updateDashboardSummary(currentUserData);
    
    // اگر کاربر هنوز روی ورود به اولین درس کلیک نکرده، کارنامه را نشان بده؛ در غیر این صورت داشبورد
    if (localStorage.getItem('first_lesson_started') === 'true') {
      if (quizStartCard) quizStartCard.style.display = 'none';
      if (quizResultsCard) quizResultsCard.style.display = 'none';
      showScreen('dashboard-screen');
    } else {
      if (quizStartCard) quizStartCard.style.display = 'none';
      if (quizResultsCard) quizResultsCard.style.display = 'block';
      displayQuizResults({
        determined_level: userLevel,
        summary: currentUserData.ai_analysis_summary || "مسیر آموزشی شما آماده است."
      });
    }
  } else {
    // کاربر جدید یا بدون تعیین سطح -> نمایش کارت شروع آزمون
    if (quizStartCard) quizStartCard.style.display = 'block';
    if (quizResultsCard) quizResultsCard.style.display = 'none';
    showScreen('dashboard-screen');
  }

  // ۴. راه‌اندازی تایمر اشتراک
  setupSubscriptionTimer(currentUserData);
}

function setupSubscriptionTimer(userData) {
  let defaultTrialEnd = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
  let targetTimestamp = null;

  if (userData?.trial_ends_at) {
    targetTimestamp = new Date(String(userData.trial_ends_at).trim().replace(' ', 'T')).getTime();
  } else if (userData?.created_at) {
    const createdMs = new Date(String(userData.created_at).trim().replace(' ', 'T')).getTime();
    if (!isNaN(createdMs)) targetTimestamp = createdMs + (7 * 24 * 60 * 60 * 1000);
  }

  if (typeof startCountdown === 'function') {
    startCountdown(targetTimestamp || defaultTrialEnd);
  }
}

document.addEventListener("DOMContentLoaded", initApp);
