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
 * مدیریت داده‌ها و پویاسازی نمودارها با پشتیبانی کامل از حالت پیش‌فرض
 */

function renderDashboardData(userData) {
  // مقادیر پیش‌فرض در صورت عدم دریافت داده
  const safeData = userData || {
    fullName: "کاربر جدید",
    username: "guest",
    level: "A1",
    levelTitle: "تعیین نشده",
    weeklyStats: [0, 0, 0, 0, 0, 0, 0],
    skills: { listening: 0, speaking: 0, reading: 0, writing: 0 }
  };

  updateUserProfile(safeData);
  updateBarChart(safeData.weeklyStats || [0, 0, 0, 0, 0, 0, 0]);
  updateDonutChart(safeData.skills || { listening: 0, speaking: 0, reading: 0, writing: 0 });
  updateRoadmap(safeData.level || "A1");
}

function updateUserProfile(data) {
  const fullnameEl = document.getElementById('user-fullname');
  const subtextEl = document.getElementById('user-subtext');
  const levelEl = document.getElementById('user-level');

  if (fullnameEl) fullnameEl.textContent = data.fullName || "کاربر جدید";
  if (subtextEl) subtextEl.textContent = `@${data.username || "username"}`;
  if (levelEl) levelEl.textContent = `سطح آموزشی: ${data.levelTitle || "تعیین نشده"}`;
}

function updateBarChart(weeklyStats) {
  const bars = document.querySelectorAll('.bar-chart-container .bar-fill');
  if (!bars.length) return;

  const maxVal = Math.max(...weeklyStats);
  const peakIndex = maxVal > 0 ? weeklyStats.indexOf(maxVal) : -1;

  weeklyStats.forEach((val, idx) => {
    if (bars[idx]) {
      const heightPercent = val > 0 ? Math.min(Math.max(val, 10), 100) : 5;
      bars[idx].style.height = `${heightPercent}%`;
      bars[idx].classList.toggle('active', val > 0);
      bars[idx].classList.toggle('peak', idx === peakIndex && val > 0);
    }
  });
}

function updateDonutChart(skills) {
  const { listening = 0, speaking = 0, reading = 0, writing = 0 } = skills;
  const overallPercent = Math.round((listening + speaking + reading + writing) / 4);

  const percentEl = document.querySelector('.donut-percent');
  const overallLabel = document.getElementById('overall-percent-label');
  if (percentEl) percentEl.textContent = `${overallPercent}٪`;
  if (overallLabel) overallLabel.textContent = `مجموع ${overallPercent}٪`;

  const circumference = 238.7;
  const segments = document.querySelectorAll('.donut-segment');

  if (segments.length >= 3) {
    segments[0].style.strokeDashoffset = circumference - (listening / 100) * circumference;
    segments[1].style.strokeDashoffset = circumference - (speaking / 100) * circumference;
    segments[2].style.strokeDashoffset = circumference - (reading / 100) * circumference;
  }

  const legendValues = document.querySelectorAll('.skills-legend .legend-item span:last-child');
  if (legendValues.length >= 4) {
    legendValues[0].textContent = `${listening}٪`;
    legendValues[1].textContent = `${speaking}٪`;
    legendValues[2].textContent = `${reading}٪`;
    legendValues[3].textContent = `${writing}٪`;
  }
}

function updateRoadmap(userLevel) {
  const steps = document.querySelectorAll('.roadmap-step');
  const trackProgress = document.querySelector('.roadmap-track-progress');

  let activeIndex = 0;
  let progressHeight = '0%';
  const lvl = String(userLevel).toUpperCase();

  if (lvl.startsWith('B')) {
    activeIndex = 1;
    progressHeight = '50%';
  } else if (lvl.startsWith('C')) {
    activeIndex = 2;
    progressHeight = '100%';
  }

  if (trackProgress) trackProgress.style.height = progressHeight;

  steps.forEach((step, idx) => {
    step.classList.remove('completed', 'active');
    if (idx < activeIndex) {
      step.classList.add('completed');
    } else if (idx === activeIndex) {
      step.classList.add('active');
    }
  });
}
