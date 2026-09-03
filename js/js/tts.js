/**
 * js/tts.js
 * موتور پخش صوتی تلفظ لغات و متن‌های آموزشی
 */

function speakText(text, lang = 'en-US', rate = 0.9) {
  if (!('speechSynthesis' in window)) {
    alert('مرورگر شما از پخش صوتی پشتیبانی نمی‌کند.');
    return;
  }

  // متوقف کردن پخش‌های قبلی
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate; // سرعت پخش (۰.۹ برای درک بهتر)
  utterance.pitch = 1.0;

  // انتخاب گوینده طبیعی انگلیسی در صورت وجود
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}
