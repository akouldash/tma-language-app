/* =========================================================
 * مدیریت و رندر داده‌های داشبورد آموزشی (مطابق داده‌های دیتابیس)
 * ========================================================= */

/**
 * رندر اطلاعات کامل داشبورد
 */
function renderDashboard(data) {
  if (!data) return;

  const dashboardEl = document.getElementById('dash-main-container');
  if (dashboardEl) dashboardEl.style.display = 'block';

  // ۱. متن خلاصه مسیر
  safeSetText('dash-summary-text', data.ai_analysis_summary || "مسیر اختصاصی آموزشی شما بر اساس سطح تعیین‌شده فعال است.");

  // ۲. درصد پیشرفت درس جاری
  const progressPercent = data.lesson_progress || 0;
  const progressFill = document.getElementById('dash-progress-fill');
  if (progressFill) progressFill.style.width = `${progressPercent}%`;
  safeSetText('dash-progress-text', `${progressPercent}%`);

  // ۳. وضعیت ۴ مهارت (با پشتیبانی از لایه ایمنی JSON)
  let skills = {};
  try {
    skills = typeof data.skills_summary === 'string' ? JSON.parse(data.skills_summary) : (data.skills_summary || {});
  } catch(e) { console.error("[DEBUG] خطا در پارس JSON مهارت‌ها:", e); }

  safeSetText('skill-listening-text', skills.listening || "در حال ارزیابی و تقویت مهارت شنیداری");
  safeSetText('skill-reading-text', skills.reading || "در حال تقویت درک مطلب و واژگان");
  safeSetText('skill-speaking-text', skills.speaking || "آماده‌سازی برای تمرینات تلفظ");
  safeSetText('skill-writing-text', skills.writing || "شروع ساختارشناسی و جمله‌سازی");

  // ۴. زمان مطالعه امروز
  totalStudySeconds = data.today_study_seconds || 0;
  updateStudyTimerUI(totalStudySeconds);
  startStudyTrackerTimer();

  // ۵. جمله انگیزشی
  safeSetText('dash-quote-text', data.motivational_quote || "هر روز یک گام کوچک، فردا یک جهش بزرگ در یادگیری!");
}

function onEnterLesson() {
  alert("در حال انتقال به جلسه درس جاری...");
}
