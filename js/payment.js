/* =========================================================
 * فاز ۷: اتصال به درگاه‌های پرداخت (زرین‌پال و Telegram Stars)
 * ========================================================= */

const N8N_PAYMENT_URL = "/api/n8n/create-payment";

/**
 * ایجاد تراکنش پرداخت زرین‌پال یا استارز تلگرام
 */
async function initiatePayment(gateway, packageType, amount) {
  const payload = {
    telegram_id: currentUserTelegramId,
    gateway: gateway, // 'zarinpal' یا 'telegram_stars'
    package_type: packageType, // 'monthly', 'quarterly', 'yearly'
    amount: amount,
    currency: gateway === 'telegram_stars' ? 'XTR' : 'IRT'
  };

  try {
    const response = await fetch(N8N_PAYMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("خطا در ایجاد لینک پرداخت");

    const data = await response.json();

    if (gateway === 'zarinpal' && data.payment_url) {
      // هدایت کاربر به درگاه پرداخت زرین‌پال
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openLink(data.payment_url);
      } else {
        window.location.href = data.payment_url;
      }
    } else if (gateway === 'telegram_stars' && data.invoice_link) {
      // باز کردن فاکتور Telegram Stars
      if (window.Telegram?.WebApp?.openInvoice) {
        window.Telegram.WebApp.openInvoice(data.invoice_link, (status) => {
          if (status === 'paid') {
            alert("پرداخت با موفقیت انجام شد! اشتراک شما فعال گردید.");
            initApp();
          }
        });
      }
    }

  } catch (error) {
    console.error("[DEBUG] خطا در پردازش پرداخت:", error);
    alert("ایجاد درگاه پرداخت با خطا مواجه شد.");
  }
}
