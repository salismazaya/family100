// Family 100 Live Board Client
let socket = null;

const connStatus = document.getElementById('connStatus');
const liveDot = document.getElementById('liveDot');
const soundBtn = document.getElementById('soundBtn');
const questionText = document.getElementById('questionText');
const answersGrid = document.getElementById('answersGrid');
const roundPoints = document.getElementById('roundPoints');
const scoreTeamA = document.getElementById('scoreTeamA');
const scoreTeamB = document.getElementById('scoreTeamB');
const strikeSlots = [
  document.getElementById('strike1'),
  document.getElementById('strike2'),
  document.getElementById('strike3')
];
const strikeOverlay = document.getElementById('strikeOverlay');

// Audio toggle & user activation
soundBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  window.gameSound.init();
  const muted = window.gameSound.toggleMute();
  soundBtn.textContent = muted ? '🔇' : '🔊';
});

// Auto-unlock audio on first touch
['touchstart', 'click'].forEach(evt => {
  document.addEventListener(evt, () => {
    window.gameSound.init();
  }, { once: true, passive: true });
});

function connectWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

  socket.onopen = () => {
    connStatus.textContent = 'LIVE';
    liveDot.style.background = '#10b981';
    liveDot.style.boxShadow = '0 0 8px #10b981';
  };

  socket.onclose = () => {
    connStatus.textContent = 'OFFLINE';
    liveDot.style.background = '#ef4444';
    liveDot.style.boxShadow = 'none';
    setTimeout(connectWS, 2000);
  };

  socket.onerror = () => {
    socket.close();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerEvent(data);
    } catch (err) {
      console.error('WS message error:', err);
    }
  };
}

function handleServerEvent(msg) {
  if (msg.type === 'INIT' || msg.type === 'STATE_CHANGED') {
    renderState(msg.state);
  } else if (msg.type === 'ANSWER_REVEALED') {
    renderState(msg.state);
    triggerRevealCard(msg.index);
    window.gameSound.playCorrect();
  } else if (msg.type === 'STRIKE_TRIGGERED') {
    renderState(msg.state);
    triggerStrikeAnimation(msg.strikes);
    window.gameSound.playWrong();
  }
}

function renderState(state) {
  if (!state) return;

  // Pertanyaan
  questionText.textContent = state.question || 'Menunggu pertanyaan dari host...';

  // Poin & Skor Tim
  roundPoints.textContent = state.currentRoundPoints || 0;
  scoreTeamA.textContent = (state.scores && state.scores.teamA) || 0;
  scoreTeamB.textContent = (state.scores && state.scores.teamB) || 0;

  // Indikator Strike (X)
  const strikes = state.strikes || 0;
  strikeSlots.forEach((slot, idx) => {
    if (idx < strikes) {
      slot.classList.add('active');
    } else {
      slot.classList.remove('active');
    }
  });

  // Render Kartu Jawaban
  renderAnswersGrid(state.answers || []);
}

function renderAnswersGrid(answers) {
  answersGrid.innerHTML = '';
  if (!answers || answers.length === 0) {
    answersGrid.innerHTML = `
      <div style="text-align: center; color: #64748b; font-size: 14px; padding: 30px 10px;">
        Belum ada soal yang dipilih oleh Host
      </div>
    `;
    return;
  }

  answers.forEach((ans, idx) => {
    const card = document.createElement('div');
    card.className = `answer-card ${ans.isRevealed ? 'is-revealed' : ''}`;
    card.id = `card-${idx}`;

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <div class="card-num">${idx + 1}</div>
          <div class="card-dots">•••••••••••••</div>
          <div style="color:var(--text-gold); font-weight:800; font-size: 16px;">?</div>
        </div>
        <div class="card-back">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="card-num">${idx + 1}</div>
            <div class="answer-title">${ans.answer || ''}</div>
          </div>
          <div class="answer-score">${ans.score || 0}</div>
        </div>
      </div>
    `;
    answersGrid.appendChild(card);
  });
}

function triggerRevealCard(index) {
  const card = document.getElementById(`card-${index}`);
  if (card && !card.classList.contains('is-revealed')) {
    card.classList.add('is-revealed');
  }
}

let strikeTimer = null;
function triggerStrikeAnimation(strikesCount) {
  strikeOverlay.innerHTML = '';
  const count = Math.min(Math.max(strikesCount, 1), 3);
  for (let i = 0; i < count; i++) {
    const span = document.createElement('div');
    span.className = 'strike-giant-x';
    span.textContent = '✕';
    strikeOverlay.appendChild(span);
  }

  strikeOverlay.classList.add('visible');
  if (strikeTimer) clearTimeout(strikeTimer);
  strikeTimer = setTimeout(() => {
    strikeOverlay.classList.remove('visible');
  }, 1200);
}

connectWS();
