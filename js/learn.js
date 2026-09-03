/**
 * js/learn.js
 * مدیریت دریافت درس از n8n و رندر پویای کارت‌های آموزشی، لغات و تمرینات
 */

// آدرس وب‌هوک n8n (آدرس سرور n8n خود را جایگزین کنید)
const N8N_LESSON_WEBHOOK_URL = 'https://n8n.your-domain.com/webhook/generate-lesson';

/**
 * دریافت درس از بک‌اند n8n و نمایش لودینگ
 */
async function loadCurrentLesson() {
  const learnContainer = document.getElementById('tab-learn');
  if (!learnContainer) return;

  // ۱. نمایش وضعیت در حال بارگذاری (Loading State)
  learnContainer.innerHTML = `
    <div class="card" style="text-align: center; padding: 40px 20px;">
      <div class="spinner" style="border: 4px solid rgba(255,255,255,0.1); border-left-color: var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
      <h4 style="margin-bottom: 8px;">در حال تولید درس اختصاصی شما...</h4>
      <p style="font-size: 0.85rem; color: var(--text-sub);">هوش مصنوعی در حال تنظیم محتوا بر اساس سطح شماست.</p>
    </div>
  `;

  try {
    // دریافت شناسه تلگرام کاربر از WebApp
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "guest";

    const response = await fetch(N8N_LESSON_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: String(telegramId) })
    });

    if (!response.ok) throw new Error("خطا در دریافت اطلاعات از سرور");

    const lessonData = await response.json();

    // ۲. رندر محتوای درس پس از دریافت کامل داده
    renderLessonView(lessonData);

  } catch (error) {
    learnContainer.innerHTML = `
      <div class="card" style="text-align: center; border-color: rgba(239, 68, 68, 0.4);">
        <p style="color: #ef4444; font-weight: bold;">❌ دریافت درس با خطا مواجه شد.</p>
        <button class="btn btn-primary" style="margin-top: 12px;" onclick="loadCurrentLesson()">تلاش مجدد</button>
      </div>
    `;
  }
}

/**
 * رندر کامل ساختار درس در زبانه آموزش
 */
function renderLessonView(data) {
  const container = document.getElementById('tab-learn');
  if (!container || !data) return;

  // ساخت هدر درس و بخش لغات
  let html = `
    <!-- هدر درس -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="user-level-badge">${data.level}</span>
        <span style="font-size: 0.8rem; color: var(--text-sub);">ID: ${data.lesson_id}</span>
      </div>
      <h2 style="font-size: 1.3rem; margin-bottom: 6px;">${data.title}</h2>
      <p style="font-size: 0.88rem; color: var(--text-sub);">${data.summary}</p>
    </div>

    <!-- بخش ۱: واژگان جدید (Vocabulary) -->
    <div class="card">
      <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--accent);">📚 لغات کلیدی این درس</h3>
      <div id="vocab-list">
        ${renderVocabularyCards(data.vocabulary || [])}
      </div>
    </div>

    <!-- بخش ۲: مهارت‌های ۴گانه -->
    <div class="card">
      <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--accent);">🎯 تمرین مهارت‌ها</h3>
      ${renderSkillsSection(data.skills_content || {})}
    </div>

    <!-- بخش ۳: آزمون و تمرین تعاملی -->
    <div class="card">
      <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--accent);">📝 خودآزمایی و تثبیت</h3>
      ${renderExercises(data.interactive_exercises || [])}
    </div>
  `;

  container.innerHTML = html;
}

/**
 * تولید کارت‌های لغت همراه با دکمه پخش صوت
 */
function renderVocabularyCards(vocabList) {
  if (!vocabList.length) return '<p>لغتی برای این درس ثبت نشده است.</p>';

  return vocabList.map(item => `
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="font-size: 1.1rem; color: #38bdf8;">${item.word}</strong>
        <button type="button" class="btn-audio" onclick="speakText('${item.word}')">🔊 شنیدن</button>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-sub); margin: 2px 0 6px;">${item.phonetic || ''}</div>
      <div style="font-size: 0.9rem; font-weight: 600; margin-bottom: 8px;">${item.meaning_fa}</div>
      
      <div style="font-size: 0.82rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>${item.example_en}</span>
          <button class="btn-audio" style="padding: 2px 6px; font-size: 0.7rem;" onclick="speakText('${item.example_en.replace(/'/g, "\\'")}')">🔊</button>
        </div>
        <div style="color: var(--text-sub); margin-top: 4px; font-size: 0.78rem;">${item.example_fa}</div>
      </div>
    </div>
  `).join('');
}

/**
 * رندر بخش مهارت‌های ۴گانه
 */
function renderSkillsSection(skills) {
  const listening = skills.listening || {};
  const reading = skills.reading || {};

  return `
    <!-- مهارت شنیداری -->
    ${listening.title ? `
      <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 0.9rem;">🎧 شنیداری: ${listening.title}</strong>
          <button type="button" class="btn-audio" onclick="speakText('${listening.script?.replace(/'/g, "\\'")}')">🔊 پخش متن</button>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-sub);">${listening.script || ''}</p>
      </div>
    ` : ''}

    <!-- مهارت خوانش -->
    ${reading.title ? `
      <div>
        <strong style="font-size: 0.9rem; display: block; margin-bottom: 6px;">📖 خوانش: ${reading.title}</strong>
        <p style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.6;">${reading.passage || ''}</p>
      </div>
    ` : ''}
  `;
}

/**
 * رندر سوالات و تمرینات تعاملی
 */
function renderExercises(exercises) {
  if (!exercises.length) return '<p>تمرینی برای این درس وجود ندارد.</p>';

  return exercises.map((ex, idx) => `
    <div style="margin-bottom: 16px;" id="ex-box-${idx}">
      <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 10px;">${idx + 1}. ${ex.question}</p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${(ex.options || []).map(opt => `
          <button type="button" class="btn" style="background: rgba(255,255,255,0.05); text-align: right; justify-content: flex-start;" onclick="checkAnswer(${idx}, '${opt}', '${ex.correct_answer}', '${ex.explanation?.replace(/'/g, "\\'")}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="ex-feedback-${idx}" style="margin-top: 8px; font-size: 0.85rem; display: none;"></div>
    </div>
  `).join('');
}

/**
 * بررسی پاسخ انتخاب‌شده کاربر در تمرینات
 */
function checkAnswer(index, selected, correct, explanation) {
  const feedbackEl = document.getElementById(`ex-feedback-${index}`);
  if (!feedbackEl) return;

  feedbackEl.style.display = 'block';
  if (selected === correct) {
    feedbackEl.style.color = '#10b981';
    feedbackEl.innerHTML = `✅ **پاسخ درست است!** ${explanation}`;
  } else {
    feedbackEl.style.color = '#ef4444';
    feedbackEl.innerHTML = `❌ **نادرست.** پاسخ صحیح: **${correct}**<br><span style="color: var(--text-sub);">${explanation}</span>`;
  }
}
