const N8N_PLACEMENT_TEST_URL = '/api/n8n/placement-test';

async function submitPlacementTest(event) {
  if (event) event.preventDefault();

  const tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) 
                 ? window.Telegram.WebApp.initDataUnsafe.user || {} : {};

  const answers = {
    q1: document.getElementById('quiz-q1')?.value || '',
    q2: document.getElementById('quiz-q2')?.value || '',
    q3: document.getElementById('quiz-q3')?.value || '',
    q4: document.getElementById('quiz-q4')?.value || '',
    q5: document.getElementById('quiz-q5')?.value || ''
  };

  const payload = {
    telegram_id: tgUser.id || currentUserTelegramId,
    first_name: tgUser.first_name || "",
    username: tgUser.username || "",
    answers: answers
  };

  try {
    const response = await fetch(N8N_PLACEMENT_TEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`خطا در سرور: ${response.status}`);

    const result = await response.json();
    
    document.getElementById('quiz-start-card').style.display = 'none';
    if (typeof displayQuizResults === 'function') {
      displayQuizResults(result);
    }

  } catch (error) {
    console.error("[DEBUG] خطا در ارسال تعیین سطح:", error);
    alert("خطا در برقراری ارتباط. لطفاً دوباره تلاش کنید.");
  }
}
