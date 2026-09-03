/**
 * js/tts.js
 * موتور پخش صوتی تلفظ لغات و متن‌ها
 */

function speakText(text, lang = 'en-US', rate = 0.85) {
  if (!('speechSynthesis' in window)) {
    alert('مرورگر شما از پخش صوتی پشتیبانی نمی‌کند.');
    return;
  }

  // متوقف کردن پخش‌های قبلی جهت جلوگیری از تداخل صداها
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate; // سرعت خوانش (۰.۸۵ برای تلفظ شمرده و آموزشی)
  utterance.pitch = 1.0;

  // انتخاب بهترین گوینده انگلیسی موجود در دستگاه
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// بارگذاری پیش‌فرض صداها در مرورگر
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
