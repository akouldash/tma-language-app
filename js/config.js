/* =========================================================
 * تنظیمات ثابت پروژه‌ و آدرس‌های API پروکسی‌شده
 * [SECURITY]: استفاده از مسیرهای نسبی جهت استفاده از ری‌رایت Vercel
 * ========================================================= */

// آدرس‌های وب‌فوک بر اساس vercel.json تنظیم شده‌اند تا نیاز به VPN نباشد
const N8N_AUTH_URL = "/api/n8n/auth"; 
const N8N_DELETE_URL = "/api/n8n/delete-account";
const N8N_PLACEMENT_URL = "/api/n8n/placement-test";
const N8N_LESSON_WEBHOOK_URL = '/api/n8n/generate-lesson';

// شناسه کاربر جاری تلگرام
let currentUserTelegramId = null;
