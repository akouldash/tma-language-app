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



/**
 * js/dashboard.js
 * مدیریت داده‌ها و پویاسازی نمودارها و وضعیت کاربر در داشبورد
 */

/**
 * تابع اصلی رندر داشبورد با دریافت داده‌های کاربر
 * @param {Object} userData داده‌های پردازش‌شده کاربر
 */
async function renderDashboardData(userData) {
  if (!userData) return;

  // ۱. بروزرسانی مشخصات و سطح کاربر
  updateUserProfile(userData);

  // ۲. بروزرسانی نمودار میله‌ای (۷ روز گذشته)
  if (userData.weeklyStats && Array.isArray(userData.weeklyStats)) {
    updateBarChart(userData.weeklyStats);
  }

  // ۳. بروزرسانی نمودار گرد (مهارت‌های ۴گانه)
  if (userData.skills) {
    updateDonutChart(userData.skills);
  }

  // ۴. بروزرسانی موقعیت کاربر در نقشه راه واقعی
  if (userData.level) {
    updateRoadmap(userData.level);
  }
}

/**
 * ۱. بروزرسانی هدر و پروفایل کاربر
 */
function updateUserProfile(data) {
  const fullnameEl = document.getElementById('user-fullname');
  const subtextEl = document.getElementById('user-subtext');
  const levelEl = document.getElementById('user-level');

  if (fullnameEl && data.fullName) fullnameEl.textContent = data.fullName;
  if (subtextEl && data.username) subtextEl.textContent = `@${data.username}`;
  if (levelEl && data.levelTitle) levelEl.textContent = `سطح آموزشی: ${data.levelTitle}`;
}

/**
 * ۲. رندر پویا و انیمیت نمودار میله‌ای
 * @param {Array<number>} weeklyStats آرایه ۷ تایی از درصد یا میزان فعالیت روزانه
 */
function updateBarChart(weeklyStats) {
  const bars = document.querySelectorAll('.bar-chart-container .bar-fill');
  if (!bars.length) return;

  const maxVal = Math.max(...weeklyStats, 1);
  const peakIndex = weeklyStats.indexOf(maxVal);

  weeklyStats.forEach((val, idx) => {
    if (bars[idx]) {
      // محاسبه ارتفاع نسبی با حداقل ۱۰٪ برای زیبایی بصری
      const heightPercent = val > 0 ? Math.min(Math.max(val, 10), 100) : 5;
      bars[idx].style.height = `${heightPercent}%`;

      // اعمال کلاس فعال و نقطه اوج
      bars[idx].classList.toggle('active', val > 0);
      bars[idx].classList.toggle('peak', idx === peakIndex && val > 0);
    }
  });
}

/**
 * ۳. رندر پویا و انیمیت نمودار دایره‌ای (Donut) و راهنما
 * @param {Object} skills مقادیر درصد ۴ مهارت اصلی
 */
function updateDonutChart(skills) {
  const { listening = 0, speaking = 0, reading = 0, writing = 0 } = skills;

  // محاسبه میانگین کل تسلط
  const overallPercent = Math.round((listening + speaking + reading + writing) / 4);

  // بروزرسانی درصد مرکز
  const percentEl = document.querySelector('.donut-percent');
  if (percentEl) percentEl.textContent = `${overallPercent}٪`;

  // محیط دایره SVG (با شعاع ۳۸px) ≈ ۲۳۸.۷
  const circumference = 238.7;
  const segments = document.querySelectorAll('.donut-segment');

  if (segments.length >= 3) {
    segments[0].style.strokeDashoffset = circumference - (listening / 100) * circumference;
    segments[1].style.strokeDashoffset = circumference - (speaking / 100) * circumference;
    segments[2].style.strokeDashoffset = circumference - (reading / 100) * circumference;
  }

  // بروزرسانی مقادیر متنی راهنما (Legend)
  const legendValues = document.querySelectorAll('.skills-legend .legend-item span:last-child');
  if (legendValues.length >= 4) {
    legendValues[0].textContent = `${listening}٪`;
    legendValues[1].textContent = `${speaking}٪`;
    legendValues[2].textContent = `${reading}٪`;
    legendValues[3].textContent = `${writing}٪`;
  }
}

/**
 * ۴. بروزرسانی پین و نوار پیشرفت در نقشه راه واقعی
 * @param {string} userLevel کد سطح استاندارد (A1, A2, B1, B2, C1, C2)
 */
function updateRoadmap(userLevel) {
  const steps = document.querySelectorAll('.roadmap-step');
  const trackProgress = document.querySelector('.roadmap-track-progress');

  let activeIndex = 0;
  let progressHeight = '15%';

  const lvl = String(userLevel).toUpperCase();

  if (lvl.startsWith('A')) {
    activeIndex = 0;
    progressHeight = '15%';
  } else if (lvl.startsWith('B')) {
    activeIndex = 1;
    progressHeight = '55%';
  } else if (lvl.startsWith('C')) {
    activeIndex = 2;
    progressHeight = '90%';
  }

  if (trackProgress) {
    trackProgress.style.height = progressHeight;
  }

  steps.forEach((step, idx) => {
    step.classList.remove('completed', 'active');
    if (idx < activeIndex) {
      step.classList.add('completed');
    } else if (idx === activeIndex) {
      step.classList.add('active');
    }
  });
}
