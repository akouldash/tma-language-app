/* =========================================================
 * مدیریت آزمون تعیین سطح و انتقال به اولین جلسه آموزشی
 * ========================================================= */

async function submitPlacementTest(event) {
  if (event) event.preventDefault();

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
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

    if (!response.ok) throw new Error(`ارتباط با سرور ناموفق بود: ${response.status}`);

    const result = await response.json();
    
    // مخفی کردن فرم آزمون و نمایش کارنامه ارزیابی
    document.getElementById('quiz-start-card').style.display = 'none';
    const quizResultsCard = document.getElementById('quiz-results-card');
    if (quizResultsCard) quizResultsCard.style.display = 'block';

    displayQuizResults(result);

  } catch (error) {
    console.error("[DEBUG] خطا در ارسال پاسخ‌های تعیین سطح:", error);
    alert("خطا در تحلیل آزمون. لطفاً مجدداً تلاش کنید.");
  }
}

function displayQuizResults(data) {
  safeSetText('user-cefr-level', data.determined_level || 'A1');
  safeSetText('ai-analysis-text', data.summary || 'سطح شما بر اساس آزمون ورودی تنظیم گردید.');
}

// هدایت کاربر به اولین جلسه درس (حذف کارنامه و انتقال خلاصه به داشبورد)
async function startFirstLesson() {
  // ۱. ثبت در حافظه برای عدم نمایش مجدد کارنامه در ورود بعدی
  localStorage.setItem('first_lesson_started', 'true');

  // ۲. انتقال اطلاعات کارنامه به خلاصه وضعیت داشبورد
  const level = document.getElementById('user-cefr-level')?.textContent || 'A1';
  const summary = document.getElementById('ai-analysis-text')?.textContent || '';
  
  updateDashboardSummary({
    cefr_level: level,
    ai_analysis_summary: summary
  });

  // ۳. مخفی‌سازی کامل کارت کارنامه
  const quizResultsCard = document.getElementById('quiz-results-card');
  if (quizResultsCard) quizResultsCard.style.display = 'none';

  // ۴. فراخوانی موتور تولید درس (WF 3) و نمایش UI جلسه آموزشی
  showScreen('lesson-screen');
  await loadAndRenderLesson(currentUserTelegramId, level);
}
