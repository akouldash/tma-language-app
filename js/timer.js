/* =========================================================
 * مدیریت تایمرهای شمارش معکوس اشتراک و زمان مطالعه روزانه
 * ========================================================= */

let studyTimerInterval = null;
let totalStudySeconds = 0;

/**
 * تایمر شمارش معکوس 7 روز دوره آزمایشی
 */
function startCountdown(targetDateMs) {
  setInterval(() => {
    const now = new Date().getTime();
    const diff = targetDateMs - now;

    if (diff <= 0) {
      safeSetText('t-day', '00');
      safeSetText('t-hrs', '00');
      safeSetText('t-min', '00');
      safeSetText('t-sec', '00');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    safeSetText('t-day', String(days).padStart(2, '0'));
    safeSetText('t-hrs', String(hours).padStart(2, '0'));
    safeSetText('t-min', String(minutes).padStart(2, '0'));
    safeSetText('t-sec', String(seconds).padStart(2, '0'));
  }, 1000);
}

/**
 * به‌روزرسانی تایمر زمان مطالعه امروز کاربر
 */
function updateStudyTimerUI(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  safeSetText('timer-hours', String(hrs));
  safeSetText('timer-minutes', String(mins));
  safeSetText('timer-seconds', String(secs));
}

/**
 * شروع تایمر زمان حضور آنلاین
 */
function startStudyTrackerTimer() {
  if (studyTimerInterval) clearInterval(studyTimerInterval);

  studyTimerInterval = setInterval(() => {
    totalStudySeconds++;
    updateStudyTimerUI(totalStudySeconds);
  }, 1000);
}
