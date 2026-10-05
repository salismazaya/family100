function createGameManager() {
  let state = {
    currentQuestion: null,
    revealedIndices: [],
    strikes: 0,
    currentRoundPoints: 0,
    scores: {
      teamA: 0,
      teamB: 0
    }
  };

  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  function setQuestion(questionObj) {
    state.currentQuestion = questionObj ? JSON.parse(JSON.stringify(questionObj)) : null;
    state.revealedIndices = [];
    state.strikes = 0;
    state.currentRoundPoints = 0;
    return getState();
  }

  function revealAnswer(index) {
    if (!state.currentQuestion || !state.currentQuestion.answers) return getState();
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= state.currentQuestion.answers.length) return getState();

    if (!state.revealedIndices.includes(idx)) {
      state.revealedIndices.push(idx);
      state.revealedIndices.sort((a, b) => a - b);
      const score = Number(state.currentQuestion.answers[idx].score) || 0;
      state.currentRoundPoints += score;
    }
    return getState();
  }

  function hideAnswer(index) {
    if (!state.currentQuestion || !state.currentQuestion.answers) return getState();
    const idx = parseInt(index, 10);
    const pos = state.revealedIndices.indexOf(idx);
    if (pos >= 0) {
      const score = Number(state.currentQuestion.answers[idx].score) || 0;
      state.currentRoundPoints = Math.max(0, state.currentRoundPoints - score);
      state.revealedIndices.splice(pos, 1);
    }
    return getState();
  }

  function incrementStrike() {
    if (state.strikes < 3) {
      state.strikes += 1;
    }
    return getState();
  }

  function resetStrikes() {
    state.strikes = 0;
    return getState();
  }

  function awardPointsToTeam(teamKey) {
    if (state.scores[teamKey] !== undefined) {
      state.scores[teamKey] += state.currentRoundPoints;
      state.currentRoundPoints = 0;
    }
    return getState();
  }

  function resetRound() {
    state.revealedIndices = [];
    state.strikes = 0;
    state.currentRoundPoints = 0;
    return getState();
  }

  function resetGame() {
    state.currentQuestion = null;
    state.revealedIndices = [];
    state.strikes = 0;
    state.currentRoundPoints = 0;
    state.scores = { teamA: 0, teamB: 0 };
    return getState();
  }

  function getPublicState() {
    if (!state.currentQuestion) {
      return {
        id: null,
        question: null,
        totalAnswers: 0,
        answers: [],
        strikes: state.strikes,
        currentRoundPoints: state.currentRoundPoints,
        scores: state.scores
      };
    }

    const publicAnswers = state.currentQuestion.answers.map((ans, idx) => {
      const isRevealed = state.revealedIndices.includes(idx);
      return {
        index: idx,
        isRevealed,
        answer: isRevealed ? ans.answer : null,
        score: isRevealed ? ans.score : null
      };
    });

    return {
      id: state.currentQuestion.id,
      question: state.currentQuestion.question,
      totalAnswers: state.currentQuestion.answers.length,
      answers: publicAnswers,
      strikes: state.strikes,
      currentRoundPoints: state.currentRoundPoints,
      scores: state.scores
    };
  }

  return {
    getState,
    getPublicState,
    setQuestion,
    revealAnswer,
    hideAnswer,
    incrementStrike,
    resetStrikes,
    awardPointsToTeam,
    resetRound,
    resetGame
  };
}

module.exports = { createGameManager };
