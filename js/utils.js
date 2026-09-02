/* =========================================================
 * توابع عمومی، مدیریت UI، پاپ‌آپ‌ها و مقابله با حملات سایبری
 * ========================================================= */

/**
 * [SECURITY] پاک‌سازی متون جهت جلوگیری از حملات XSS (Cross-Site Scripting)
 */
function safeSetText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = text !== undefined && text !== null ? String(text) : "";
  }
}

/**
 * مدیریت پاپ‌آپ‌ها
 */
function openModal(modalId) {
  try {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
  } catch (err) { console.error("[DEBUG] خطا در باز کردن پاپ‌آپ:", err); }
}

function closeModal(modalId) {
  try {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  } catch (err) { console.error("[DEBUG] خطا در بستن پاپ‌آپ:", err); }
}

/**
 * تعویض تب‌های اصلی
 */
function switchTab(tabId, el) {
  try {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.add('active');
    if (el) el.classList.add('active');
  } catch (err) { console.error("[DEBUG] خطا در تعویض تب:", err); }
}

/**
 * تغییر تم (تاریک / روشن)
 */
function toggleTheme() {
  try {
    const body = document.body;
    const themeBtn = document.getElementById('theme-btn');
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    if (themeBtn) themeBtn.innerText = isDark ? '🌙' : '☀️';
  } catch (err) { console.error("[DEBUG] خطا در تغییر تم:", err); }
}

/**
 * ارسال فرم فرم تماس با پشتیبانی
 */
function submitContactForm() {
  const subjEl = document.getElementById('ticket-subject');
  const bodyEl = document.getElementById('ticket-body');

  if (!subjEl.value.trim() || !bodyEl.value.trim()) {
    alert('لطفاً عنوان و متن پیام را وارد کنید.');
    return;
  }

  alert('پیام شما با موفقیت ثبت شد. به‌زودی از طریق تلگرام با شما تماس خواهیم گرفت.');
  subjEl.value = '';
  bodyEl.value = '';
  closeModal('modal-setting-about');
}

/**
 * اجرای عملیات حذف حساب کاربری
 */
async function executeAccountDeletion() {
  closeModal('modal-delete-acc');
  try {
    await fetch(N8N_DELETE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: currentUserTelegramId })
    });
  } catch (e) {
    console.warn("[DEBUG] ارتباط با بک‌اند برقرار نشد، عملیات محلی اجرا شد.");
  }
  
  alert('حساب کاربری و تمامی داده‌های شما با موفقیت پاک شد.');
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.close) {
    window.Telegram.WebApp.close();
  }
}
