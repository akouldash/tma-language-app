/* =========================================================
 * ویزارد تعیین سطح ۵ سوالی و تحلیل هوش مصنوعی Gemini
 * ========================================================= */

const quizQuestions = [
  {
    id: 1,
    title: "1. She ________ to work by bus every morning.",
    type: "mcq",
    options: ["go", "goes", "going", "gone"]
  },
  {
    id: 2,
    title: "2. If I ________ more free time, I would learn French.",
    type: "mcq",
    options: ["have", "had", "will have", "would have"]
  },
  {
    id: 3,
    title: "3. The conference was postponed due to ________ circumstances.",
    type: "mcq",
    options: ["unforeseen", "unlooked", "unthought", "unexpectedly"]
  },
  {
    id: 4,
    title: "4. هدف اصلی شما از یادگیری زبان انگلیسی چیست؟",
    type: "mcq",
    options: ["مهاجرت و زندگی در خارج", "مکالمه روزمره و سفر", "پیشرفت کاری و شغلی", "شرکت در آزمون (آیلتس / تافل)"]
  },
  {
    id: 5,
    title: "5. یک جمله کوتاه به انگلیسی درباره هدف یا برنامه روزانه خود بنویسید:",
    type: "text",
    placeholder: "مثال: I want to improve my speaking for my job."
  }
];

const levelDescriptions = {
  "A1": { title: "A1 — مبتدی (Elementary)", desc: "شما در ابتدای مسیر یادگیری هستید. واژگان پایه و ساختارهای ساده ارائه می‌شود." },
  "A2": { title: "A2 — پیش‌مبتدی (Pre-Intermediate)", desc: "شالوده زبان را دارید و آماده ساخت جملات کاربردی‌تر هستید." },
  "B1": { title: "B1 — متوسط (Intermediate)", desc: "آماده مکالمات واقعی و درک مفاهیم کلیدی موضوعات روزمره." },
  "B2": { title: "B2 — فوق‌متوسط (Upper-Intermediate)", desc: "تسلط روان بر مکالمه و نگارش متون با پیچیدگی متوسط." },
  "C1": { title: "C1 — پیشرفته (Advanced)", desc: "درک آکادمیک و تخصصی زبان با دایره لغات گسترده." },
  "C2": { title: "C2 — تسلط کامل (Mastery)", desc: "تسلط کامل در حد گوینده مادری." }
};

let currentQuizStep = 0;
let userAnswers = {};
let selectedOptionValue = null;

function startPlacementQuiz() {
  currentQuizStep = 0;
  userAnswers = {};
  document.getElementById('quiz-start-card').style.display = 'none';
  document.getElementById('quiz-step-card').style.display = 'block';
  renderQuizStep();
}

function renderQuizStep() {
  const q = quizQuestions[currentQuizStep];
  selectedOptionValue = null;

  const progressPercent = ((currentQuizStep + 1) / quizQuestions.length) * 100;
  document.getElementById('quiz-progress').style.width = `${progressPercent}%`;
  safeSetText('quiz-step-indicator', `سوال ${currentQuizStep + 1} از ${quizQuestions.length}`);
  safeSetText('quiz-question-title', q.title);

  const optionsContainer = document.getElementById('quiz-options-container');
  const textContainer = document.getElementById('quiz-text-container');
  const nextBtn = document.getElementById('quiz-next-btn');

  optionsContainer.innerHTML = '';
  nextBtn.disabled = true;

  if (q.type === 'mcq') {
    optionsContainer.style.display = 'flex';
    textContainer.style.display = 'none';

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('div');
      btn.className = 'quiz-option-btn';
      
      // [SECURITY] ایجاد ایمن المان‌ها
      const spanText = document.createElement('span');
      spanText.textContent = opt;
      const spanSub = document.createElement('span');
      spanSub.style.opacity = '0.5';
      spanSub.style.fontSize = '11px';
      spanSub.textContent = `گزینه ${idx + 1}`;

      btn.appendChild(spanText);
      btn.appendChild(spanSub);

      btn.onclick = () => {
        document.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOptionValue = opt;
        nextBtn.disabled = false;
      };
      optionsContainer.appendChild(btn);
    });
  } else if (q.type === 'text') {
    optionsContainer.style.display = 'none';
    textContainer.style.display = 'block';

    const textInput = document.getElementById('quiz-text-answer');
    textInput.value = '';
    textInput.oninput = (e) => {
      selectedOptionValue = e.target.value.trim();
      nextBtn.disabled = selectedOptionValue.length < 3;
    };
  }

  nextBtn.innerText = (currentQuizStep === quizQuestions.length - 1) ? 'تحلیل نهایی و ساخت مسیر 🤖' : 'تأیید و سوال بعدی ❯';
}

async function handleNextQuizStep() {
  userAnswers[`q${currentQuizStep + 1}`] = selectedOptionValue;

  if (currentQuizStep < quizQuestions.length - 1) {
    currentQuizStep++;
    renderQuizStep();
  } else {
    document.getElementById('quiz-step-card').style.display = 'none';
    document.getElementById('quiz-loading-card').style.display = 'block';

    try {
      const response = await fetch(N8N_PLACEMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: currentUserTelegramId,
          answers: userAnswers
        })
      });

      const data = await response.json();
      const resultData = Array.isArray(data) ? data[0] : data;
      displayQuizResults(resultData);
    } catch (err) {
      console.error("[DEBUG] خطا در ارسال تعیین سطح به n8n:", err);
      alert("خطا در برقراری ارتباط با هوش مصنوعی. لطفاً دوباره تلاش کنید.");
      document.getElementById('quiz-loading-card').style.display = 'none';
      document.getElementById('quiz-step-card').style.display = 'block';
    }
  }
}

function displayQuizResults(result) {
  document.getElementById('quiz-loading-card').style.display = 'none';
  document.getElementById('quiz-result-card').style.display = 'block';

  const rawLevel = (result.determined_level || "A1").trim().toUpperCase();
  const summary = result.summary || result.ai_analysis_summary || "مسیر اختصاصی شما با موفقیت فعال گردید.";
  const levelInfo = levelDescriptions[rawLevel] || levelDescriptions["A1"];

  safeSetText('res-level-badge', levelInfo.title);
  
  // [SECURITY] درج ایمن تحلیل هوش مصنوعی
  const resContainer = document.getElementById('res-analysis-text');
  if (resContainer) {
    resContainer.innerHTML = '';
    
    const p1 = document.createElement('div');
    p1.style.color = 'var(--accent)';
    p1.style.fontWeight = 'bold';
    p1.textContent = '📌 ارزیابی کلی سطح شما:';

    const p2 = document.createElement('div');
    p2.style.marginBottom = '10px';
    p2.textContent = levelInfo.desc;

    const p3 = document.createElement('div');
    p3.style.color = 'var(--accent)';
    p3.style.fontWeight = 'bold';
    p3.textContent = '🤖 تحلیل اختصاصی هوش مصنوعی Gemini:';

    const p4 = document.createElement('div');
    p4.textContent = summary;

    resContainer.appendChild(p1);
    resContainer.appendChild(p2);
    resContainer.appendChild(document.createElement('hr'));
    resContainer.appendChild(p3);
    resContainer.appendChild(p4);
  }

  safeSetText('user-level', `سطح آموزشی: ${levelInfo.title}`);
}
