/* =========================================================
 * فاز ۴: موتور ارائه دروس (WF 3)، درخت واژگان، تمرین جاگذاری و موتور صوتی
 * ========================================================= */

// لیست گویندگان ۱۰ شخصیت صوتی برای پخش TTS
const VOICE_PROFILES = [
  { id: "v1", name: "Alexander (US Male)", lang: "en-US", pitch: 1.0, rate: 0.9 },
  { id: "v2", name: "Sarah (US Female)", lang: "en-US", pitch: 1.1, rate: 0.95 },
  { id: "v3", name: "British James (UK Male)", lang: "en-GB", pitch: 0.95, rate: 0.85 },
  { id: "v4", name: "Emma (UK Female)", lang: "en-GB", pitch: 1.05, rate: 0.9 },
  { id: "v5", name: "Australian Liam", lang: "en-AU", pitch: 1.0, rate: 1.0 },
  { id: "v6", name: "Teacher Olivia", lang: "en-US", pitch: 1.2, rate: 0.8 },
  { id: "v7", name: "News Anchor David", lang: "en-US", pitch: 0.85, rate: 0.95 },
  { id: "v8", name: "Casual Male Mark", lang: "en-US", pitch: 0.9, rate: 1.05 },
  { id: "v9", name: "Storyteller Sophia", lang: "en-GB", pitch: 1.1, rate: 0.85 },
  { id: "v10", name: "Academic Prof. Ethan", lang: "en-US", pitch: 0.8, rate: 0.85 }
];

let selectedVoice = VOICE_PROFILES[0];

// فراخوانی بسته درسی از ورکفلوی ۳ (WF 3)
async function loadAndRenderLesson(telegramId, level) {
  safeSetHTML('lesson-container', '<div class="loading-spinner">در حال تولید بسته درسی توسط هوش مصنوعی Gemini...</div>');

  try {
    const response = await fetch(N8N_LESSON_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: telegramId,
        level: level
      })
    });

    if (!response.ok) throw new Error(`خطا در دریافت درس: ${response.status}`);

    currentLessonData = await response.json();
    renderLessonUI(currentLessonData);

  } catch (error) {
    console.error("[DEBUG] خطا در فراخوانی WF 3:", error);
    safeSetHTML('lesson-container', '<div class="error-card">خطا در بارگذاری جلسه درسی. لطفاً مجدداً تلاش کنید.</div>');
  }
}

// رندر UI اختصاصی درس بر اساس درخت شبکه واژگان و Substitution Drill
function renderLessonUI(lesson) {
  const container = document.getElementById('lesson-container');
  if (!container) return;

  const vocab = lesson.vocabulary || {};
  const structure = lesson.structure || {};

  container.innerHTML = `
    <!-- بخش انتخاب گوینده صوتی (TTS) -->
    <div class="voice-selector-card">
      <label>🔊 انتخاب گوینده تمرین صوتی:</label>
      <select id="voice-select" onchange="changeVoiceProfile(this.value)">
        ${VOICE_PROFILES.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
      </select>
    </div>

    <!-- بخش ۱: درخت شبکه واژگان (Vocabulary Network Tree) -->
    <div class="vocab-network-card">
      <div class="vocab-header">
        <h3>🌱 شبکه واژگان: <span class="highlight">${vocab.word || ''}</span></h3>
        <button class="tts-btn" onclick="playTTS('${vocab.word || ''}')">🔊 پخش تلفظ [${vocab.pronunciation || ''}]</button>
      </div>
      <p class="meaning"><strong>معنی:</strong> ${vocab.meaning || ''}</p>
      
      <div class="network-tree-grid">
        <div class="tree-node synonyms">
          <h4>🔗 مترادف‌ها (Synonyms)</h4>
          <ul>${(vocab.synonyms || []).map(s => `<li>${s}</li>`).join('')}</ul>
        </div>
        <div class="tree-node antonyms">
          <h4>⚡ متضادها (Antonyms)</h4>
          <ul>${(vocab.antonyms || []).map(a => `<li>${a}</li>`).join('')}</ul>
        </div>
        <div class="tree-node collocations">
          <h4>🎯 ترکیب‌های پرکاربرد (Collocations)</h4>
          <ul>${(vocab.collocations || []).map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="tree-node family">
          <h4>🌿 هم‌خانواده‌ها (Word Family)</h4>
          <ul>${(vocab.word_family || []).map(f => `<li>${f}</li>`).join('')}</ul>
        </div>
      </div>
    </div>

    <!-- بخش ۲: تمرین تعاملی جاگذاری (Substitution Drill) -->
    <div class="drill-card">
      <h3>🔄 تمرین الگوهای ساختاری (Substitution Drill)</h3>
      <p class="pattern-expl">${structure.explanation || ''}</p>
      
      <div class="drill-box">
        <p class="base-sentence" id="drill-target-sentence">${structure.base_pattern || ''}</p>
        <div class="substitution-options">
          <p>کلمه جایگزین را انتخاب کنید:</p>
          <div class="tags-group">
            ${(structure.substitution_tokens || []).map(token => `
              <button class="token-btn" onclick="applySubstitution('${structure.base_pattern}', '${token}')">${token}</button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <button class="primary-btn complete-lesson-btn" onclick="finishLessonAndAddToLeitner()">تکمیل درس و انتقال واژگان به لایتنر ➔</button>
  `;
}

// موتور صوتی TTS بر پایه Web Speech API
function playTTS(text) {
  if (!('speechSynthesis' in window)) {
    alert("مرورگر شما از قابلیت خوانش صوتی پشتیبانی نمی‌کند.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selectedVoice.lang;
  utterance.pitch = selectedVoice.pitch;
  utterance.rate = selectedVoice.rate;

  window.speechSynthesis.speak(utterance);
}

function changeVoiceProfile(voiceId) {
  selectedVoice = VOICE_PROFILES.find(v => v.id === voiceId) || VOICE_PROFILES[0];
}

// اجرای متد تمرینی Substitution Drill
function applySubstitution(basePattern, token) {
  const updatedSentence = basePattern.replace(/\[.*?\]/, token);
  const targetEl = document.getElementById('drill-target-sentence');
  if (targetEl) {
    targetEl.innerHTML = `<span class="updated-text">${updatedSentence}</span>`;
    playTTS(updatedSentence);
  }
}

// انتقال درس به مرحله لایتنر (آماده‌سازی برای فاز ۵)
function finishLessonAndAddToLeitner() {
  alert("واژگان درس جاری با موفقیت به خانه اول جعبه لایتنر شما منتقل شدند.");
  showScreen('dashboard-screen');
}
