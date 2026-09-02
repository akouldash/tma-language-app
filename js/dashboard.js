/* ========================================================= */
/* مدیریت UI و منطق داشبورد اصلی آموزش                        */
/* ========================================================= */

let studyTimerInterval = null;
let totalStudySeconds = 0;

/**
 * رندر کامل اطلاعات داشبورد کاربر بر اساس داده‌های دریافت شده از بک‌اند
 * @param {Object} data - شیء اطلاعات کاربر و مسیر آموزشی
 */
function renderDashboard(data) {
  if (!data) return;

  // ۱. نمایش کارت داشبورد و مخفی کردن کارنامه/آزمون
  const dashboardEl = document.getElementById('dashboard-section');
  const quizCards = document.querySelectorAll('.quiz-card');
  
  quizCards.forEach(card => card.style.display = 'none');
  if (dashboardEl) dashboardEl.style.display = 'flex';

  // ۲. خلاصه مسیر طی‌شده
  const summaryEl = document.getElementById('dash-summary-text');
  if (summaryEl) {
    summaryEl.innerText = data.ai_analysis_summary || "مسیر اختصاصی آموزشی شما بر اساس سطح شما فعال است.";
  }

  // ۳. درصد پیشرفت درس جاری
  const progressPercent = data.lesson_progress || 0;
  const progressFill = document.getElementById('dash-progress-fill');
  const progressText = document.getElementById('dash-progress-text');
  
  if (progressFill) progressFill.style.width = `${progressPercent}%`;
  if (progressText) progressText.innerText = `${progressPercent}%`;

  // ۴. وضعیت ۴ مهارت
  const skills = data.skills_summary || {};
  
  setElementText('skill-listening-text', skills.listening || "در حال ارزیابی");
  setElementText('skill-reading-text', skills.reading || "در حال ارزیابی");
  setElementText('skill-speaking-text', skills.speaking || "در حال ارزیابی");
  setElementText('skill-writing-text', skills.writing || "در حال ارزیابی");

  // ۵. زمان مطالعه امروز
  totalStudySeconds = data.today_study_seconds || 0;
  updateStudyTimerUI(totalStudySeconds);
  startStudyTrackerTimer();

  // ۶. جمله انگیزشی
  const quoteEl = document.getElementById('dash-quote-text');
  if (quoteEl) {
    quoteEl.innerText = data.motivational_quote || "هر روز یک گام کوچک، فردا یک جهش بزرگ!";
  }
}

/**
 * تابع کمکی برای مقداردهی ایمن متن المان‌ها
 */
function setElementText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = text;
}

/**
 * به‌روزرسانی نمایش ساعت، دقیقه و ثانیه مطالعه امروز
 */
function updateStudyTimerUI(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  setElementText('timer-hours', String(hrs));
  setElementText('timer-minutes', String(mins));
  setElementText('timer-seconds', String(secs));
}

/**
 * شروع تایمر زمان مطالعه آنلاین کاربر در صفحه
 */
function startStudyTrackerTimer() {
  if (studyTimerInterval) clearInterval(studyTimerInterval);

  studyTimerInterval = setInterval(() => {
    totalStudySeconds++;
    updateStudyTimerUI(totalStudySeconds);
  }, 1000);
}

/**
 * اکشن کلیک روی دکمه ورود به درس جاری
 */
function onEnterLesson() {
  console.log("ورود به موتور ارائه درس جاری...");
  // در گام بعدی (موتور دروس) این تابع صفحه درس را باز خواهد کرد
  alert("در حال انتقال به جلسه درس جاری...");
}
