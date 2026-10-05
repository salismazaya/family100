// Family 100 Remote Host Controller
let socket = null;
let currentHostState = null;
let allQuestions = [];

const hostStatus = document.getElementById('hostStatus');
const qIndexLabel = document.getElementById('qIndexLabel');
const questionSelect = document.getElementById('questionSelect');
const btnPrevQ = document.getElementById('btnPrevQ');
const btnNextQ = document.getElementById('btnNextQ');
const answersPeekList = document.getElementById('answersPeekList');
const revealedCount = document.getElementById('revealedCount');
const roundPointsBadge = document.getElementById('roundPointsBadge');
const btnTetot = document.getElementById('btnTetot');
const btnResetStrike = document.getElementById('btnResetStrike');
const btnResetRound = document.getElementById('btnResetRound');
const btnAwardA = document.getElementById('btnAwardA');
const btnAwardB = document.getElementById('btnAwardB');
const newQuestionForm = document.getElementById('newQuestionForm');

async function sendAction(type, payload = {}) {
  try {
    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload })
    });
    return await res.json();
  } catch (err) {
    console.error('Action failed:', err);
  }
}

function connectWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${window.location.host}/ws?role=host`);

  socket.onopen = () => {
    hostStatus.textContent = '🟢 Terhubung ke Game Stage';
  };

  socket.onclose = () => {
    hostStatus.textContent = '🔴 Terputus. Menghubungkan ulang...';
    setTimeout(connectWS, 2000);
  };

  socket.onerror = () => {
    socket.close();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'INIT') {
        if (data.questions) {
          allQuestions = data.questions;
          populateQuestionSelect();
        }
        if (data.hostState) {
          currentHostState = data.hostState;
          renderHostView();
        }
      } else if (data.type === 'QUESTIONS_UPDATED') {
        if (data.questions) {
          allQuestions = data.questions;
          populateQuestionSelect();
        }
      } else if (data.hostState) {
        currentHostState = data.hostState;
        renderHostView();
      }
    } catch (e) {
      console.error(e);
    }
  };
}

function populateQuestionSelect() {
  questionSelect.innerHTML = '<option value="">-- Pilih Pertanyaan --</option>';
  allQuestions.forEach((q, idx) => {
    const opt = document.createElement('option');
    opt.value = q.id;
    opt.textContent = `${idx + 1}. ${q.question}`;
    questionSelect.appendChild(opt);
  });

  if (currentHostState && currentHostState.currentQuestion) {
    questionSelect.value = currentHostState.currentQuestion.id;
    updateNavIndices();
  }
}

function updateNavIndices() {
  if (!currentHostState || !currentHostState.currentQuestion) {
    qIndexLabel.textContent = `0/${allQuestions.length}`;
    return;
  }
  const currIdx = allQuestions.findIndex(q => q.id === currentHostState.currentQuestion.id);
  qIndexLabel.textContent = `${currIdx >= 0 ? currIdx + 1 : 0}/${allQuestions.length}`;
}

questionSelect.addEventListener('change', (e) => {
  const qId = e.target.value;
  if (qId) {
    sendAction('SET_QUESTION', { id: qId });
  }
});

btnPrevQ.addEventListener('click', () => {
  if (!currentHostState || !currentHostState.currentQuestion || allQuestions.length === 0) return;
  const currIdx = allQuestions.findIndex(q => q.id === currentHostState.currentQuestion.id);
  if (currIdx > 0) {
    const prevQ = allQuestions[currIdx - 1];
    sendAction('SET_QUESTION', { id: prevQ.id });
  }
});

btnNextQ.addEventListener('click', () => {
  if (!currentHostState || !currentHostState.currentQuestion || allQuestions.length === 0) return;
  const currIdx = allQuestions.findIndex(q => q.id === currentHostState.currentQuestion.id);
  if (currIdx >= 0 && currIdx < allQuestions.length - 1) {
    const nextQ = allQuestions[currIdx + 1];
    sendAction('SET_QUESTION', { id: nextQ.id });
  }
});

btnTetot.addEventListener('click', () => {
  sendAction('STRIKE');
});

btnResetStrike.addEventListener('click', () => {
  sendAction('RESET_STRIKES');
});

btnResetRound.addEventListener('click', () => {
  sendAction('RESET_ROUND');
});

btnAwardA.addEventListener('click', () => {
  sendAction('AWARD_TEAM', { team: 'teamA' });
});

btnAwardB.addEventListener('click', () => {
  sendAction('AWARD_TEAM', { team: 'teamB' });
});

function renderHostView() {
  if (!currentHostState || !currentHostState.currentQuestion) {
    answersPeekList.innerHTML = `
      <div style="color: #64748b; font-size: 13px; text-align: center; padding: 20px;">
        Pilih pertanyaan di atas untuk melihat kunci jawaban
      </div>
    `;
    revealedCount.textContent = '0 Terbuka';
    roundPointsBadge.textContent = '0 Poin';
    updateNavIndices();
    return;
  }

  const q = currentHostState.currentQuestion;
  questionSelect.value = q.id;
  updateNavIndices();

  const revealedIndices = currentHostState.revealedIndices || [];
  revealedCount.textContent = `${revealedIndices.length}/${q.answers.length} Terbuka`;
  roundPointsBadge.textContent = `${currentHostState.currentRoundPoints || 0} Poin`;

  answersPeekList.innerHTML = '';
  q.answers.forEach((ans, idx) => {
    const isRevealed = revealedIndices.includes(idx);
    const row = document.createElement('div');
    row.className = `answer-peek-row ${isRevealed ? 'revealed' : ''}`;

    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-weight:800; font-size:14px; color:var(--warning); width:18px;">${idx + 1}.</span>
        <div>
          <div style="font-weight:700; font-size:14px; color:#fff;">${ans.answer}</div>
          <div style="font-size:11px; color:var(--text-dim);">${ans.score} Poin</div>
        </div>
      </div>
      <button class="btn-toggle-reveal ${isRevealed ? 'close' : 'open'}" data-index="${idx}">
        ${isRevealed ? 'TUTUP' : 'BUKA'}
      </button>
    `;

    const btn = row.querySelector('.btn-toggle-reveal');
    btn.addEventListener('click', () => {
      if (isRevealed) {
        sendAction('HIDE_ANSWER', { index: idx });
      } else {
        sendAction('REVEAL_ANSWER', { index: idx });
      }
    });

    answersPeekList.appendChild(row);
  });
}

// Form Add Question
newQuestionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const qText = document.getElementById('newQText').value.trim();
  const rawAnswers = [
    document.getElementById('newAns1').value.trim(),
    document.getElementById('newAns2').value.trim(),
    document.getElementById('newAns3').value.trim(),
    document.getElementById('newAns4').value.trim(),
    document.getElementById('newAns5').value.trim()
  ].filter(Boolean);

  const parsedAnswers = rawAnswers.map(item => {
    const parts = item.split(',');
    if (parts.length >= 2) {
      return {
        answer: parts[0].trim(),
        score: parseInt(parts[1].trim(), 10) || 10
      };
    }
    return {
      answer: item.trim(),
      score: 10
    };
  });

  if (!qText || parsedAnswers.length < 2) {
    alert('Minimal isi pertanyaan dan 2 jawaban dengan skor!');
    return;
  }

  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: qText,
        answers: parsedAnswers
      })
    });
    if (res.ok) {
      newQuestionForm.reset();
      const created = await res.json();
      sendAction('SET_QUESTION', { id: created.id });
    }
  } catch (err) {
    console.error('Gagal menambah soal:', err);
  }
});

connectWS();
