/* =========================================================
 * فاز ۶: سیستم ارسال تیکت پشتیبانی (WF 4) و حذف حساب کاربری (WF 5)
 * ========================================================= */

const N8N_SUPPORT_TICKET_URL = "/api/n8n/support-ticket";

/**
 * ارسال تیکت پشتیبانی به n8n جهت دایورشن به آیدی پشتیبانی تلگرام
 */
async function submitSupportTicket(event) {
  if (event) event.preventDefault();

  const messageText = document.getElementById('support-message')?.value || '';

  if (!messageText.trim()) {
    alert("لطفاً متن پیام خود را وارد کنید.");
    return;
  }

  const payload = {
    telegram_id: currentUserTelegramId,
    message: messageText,
    created_at: new Date().toISOString()
  };

  try {
    const response = await fetch(N8N_SUPPORT_TICKET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert("پیام شما با موفقیت به تیم پشتیبانی ارسال شد.");
      document.getElementById('support-message').value = '';
    } else {
      throw new Error("خطا در ارسال تیکت");
    }
  } catch (error) {
    console.error("[DEBUG] خطا در ارسال پیام پشتیبانی:", error);
    alert("ارسال پیام با خطا مواجه شد. لطفاً مجدداً تلاش کنید.");
  }
}

/**
 * حذف حساب کاربری (WF 5)
 */
async function deleteAccount() {
  const confirmDelete = confirm("آیا از حذف کامل حساب کاربری خود اطمینان دارید؟ این عملیات غیرقابل بازگشت است.");
  if (!confirmDelete) return;

  try {
    const response = await fetch(N8N_DELETE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: currentUserTelegramId })
    });

    if (response.ok) {
      alert("حساب کاربری شما با موفقیت پاک‌سازی شد.");
      localStorage.clear();
      sessionStorage.clear();
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.close();
      } else {
        location.reload();
      }
    } else {
      throw new Error("خطا در حذف حساب");
    }
  } catch (error) {
    console.error("[DEBUG] خطا در اجرای حذف حساب:", error);
    alert("حذف حساب با خطا مواجه شد.");
  }
}
