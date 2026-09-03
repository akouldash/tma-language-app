/* =========================================================
 * فاز ۵: الگوریتم جعبه لایتنر ۵ خانه و مرور روزانه کارت‌ها
 * ========================================================= */

const N8N_LEITNER_URL = "/api/n8n/leitner";

let leitnerCards = [];
let currentCardIndex = 0;

// فواصل زمانی روزانه برای خانه‌های ۱ تا ۵
const LEITNER_INTERVALS_DAYS = [1, 2, 5, 8, 14];

/**
 * دریافت کارت‌های آماده مرور از دیتابیس
 */
async function loadLeitnerCards() {
  const container = document.getElementById('leitner-container');
  if (!container) return;

  container.innerHTML = '<div class="loading-spinner">در حال دریافت کارت‌های لایتنر امروز...</div>';

  try {
    const response = await fetch(`${N8N_LEITNER_URL}?telegram_id=${currentUserTelegramId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error("خطا در دریافت کارت‌های لایتنر");

    leitnerCards = await response.json();
    currentCardIndex = 0;

    if (!Array.isArray(leitnerCards) || leitnerCards.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <h3>🎉 تمامی لغات امروز مرور شده‌اند!</h3>
          <p>امروز فلش‌کارتی برای مرور ندارید. دروس جدید را ادامه دهید.</p>
        </div>
      `;
      return;
    }

    renderCurrentLeitnerCard();

  } catch (error) {
    console.error("[DEBUG] خطا در دریافت فلش‌کارت‌ها:", error);
    container.innerHTML = '<div class="error-card">خطا در بارگذاری جعبه لایتنر.</div>';
  }
}

/**
 * رندر کارت جاری لایتنر
 */
function renderCurrentLeitnerCard() {
  const container = document.getElementById('leitner-container');
  if (!container || currentCardIndex >= leitnerCards.length) {
    container.innerHTML = `
      <div class="empty-state-card">
        <h3>✨ مرور امروز به پایان رسید!</h3>
        <p>تمامی ${leitnerCards.length} کارت با موفقیت مرور شدند.</p>
      </div>
    `;
    return;
  }

  const card = leitnerCards[currentCardIndex];
  const boxNum = card.box_number || 1;

  container.innerHTML = `
    <div class="leitner-card-wrapper">
      <div class="leitner-status-bar">
        <span>خانه لایتنر: <strong>${boxNum} از ۵</strong></span>
        <span>کارت <strong>${currentCardIndex + 1} از ${leitnerCards.length}</strong></span>
      </div>

      <div class="flashcard" id="active-flashcard" onclick="flipFlashcard()">
        <div class="flashcard-front">
          <h2>${card.word}</h2>
          <p class="phonetic">[${card.pronunciation || ''}]</p>
          <button class="tts-btn-small" onclick="event.stopPropagation(); playTTS('${card.word}')">🔊 پخش تلفظ</button>
          <span class="tap-hint">👆 برای مشاهده معنی کلیک کنید</span>
        </div>
        <div class="flashcard-back" style="display: none;">
          <h3>معنی: ${card.meaning}</h3>
          <p class="example-text"><strong>مثال:</strong> ${card.example || '-'}</p>
          <p class="collocations"><strong>کلوکیشن:</strong> ${Array.isArray(card.collocations) ? card.collocations.join(', ') : (card.collocations || '-')}</p>
        </div>
      </div>

      <div class="leitner-actions" id="leitner-actions" style="display: none;">
        <button class="btn-wrong" onclick="processLeitnerAnswer(false)">❌ بلد نبودم (انتقال به خانه ۱)</button>
        <button class="btn-correct" onclick="processLeitnerAnswer(true)">✅ بلد بودم (ارتقا به خانه ${Math.min(boxNum + 1, 5)})</button>
      </div>
    </div>
  `;
}

/**
 * چرخش فلش‌کارت و نمایش پاسخ
 */
function flipFlashcard() {
  const backSide = document.querySelector('.flashcard-back');
  const actions = document.getElementById('leitner-actions');
  const hint = document.querySelector('.tap-hint');

  if (backSide) backSide.style.display = 'block';
  if (actions) actions.style.display = 'flex';
  if (hint) hint.style.display = 'none';
}

/**
 * ثبت پاسخ کاربر و محاسبه زمان مرور بعدی
 */
async function processLeitnerAnswer(isCorrect) {
  const card = leitnerCards[currentCardIndex];
  let currentBox = card.box_number || 1;
  let newBox = 1;
  let consecutiveCorrect = card.consecutive_correct || 0;

  if (isCorrect) {
    newBox = Math.min(currentBox + 1, 5);
    consecutiveCorrect += 1;
  } else {
    newBox = 1;
    consecutiveCorrect = 0;
  }

  // محاسبه تاریخ مرور بعدی بر اساس الگوریتم لایتنر
  const daysToAdd = LEITNER_INTERVALS_DAYS[newBox - 1];
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

  const payload = {
    progress_id: card.id,
    telegram_id: currentUserTelegramId,
    vocab_id: card.vocab_id,
    box_number: newBox,
    consecutive_correct: consecutiveCorrect,
    next_review: nextReviewDate.toISOString(),
    status: newBox === 5 ? 'mastered' : 'learning',
    last_reviewed: new Date().toISOString()
  };

  try {
    await fetch(N8N_LEITNER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn("[DEBUG] بروز خطا در ثبت وضعیت لایتنر:", err);
  }

  currentCardIndex++;
  renderCurrentLeitnerCard();
}
