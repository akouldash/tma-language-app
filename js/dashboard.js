/* =========================================================
 * مدیریت وضعیت داشبورد و انتقال خلاصه آزمون به کارت اختصاصی
 * ========================================================= */

function updateDashboardSummary(userData) {
  if (!userData) return;

  if (userData.cefr_level) {
    safeSetText('dash-user-level', userData.cefr_level);
  }
  
  if (userData.ai_analysis_summary) {
    safeSetText('dash-analysis-summary', userData.ai_analysis_summary);
  }

  if (userData.study_streak !== undefined) {
    safeSetText('dash-study-streak', `${userData.study_streak} روز`);
  }

  // نمایش وضعیت اشتراک
  const subStatus = userData.subscription_status === 'active' ? 'فعال' : 'آزمایشی';
  safeSetText('dash-sub-status', subStatus);
}
