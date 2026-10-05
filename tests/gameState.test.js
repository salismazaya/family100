const { createGameManager } = require('../src/game/state');

describe('Game State Manager', () => {
  const sampleQuestion = {
    id: 'test-q1',
    question: 'Benda yang ada di dalam kotak pensil?',
    answers: [
      { answer: 'Pulpen', score: 40 },
      { answer: 'Penghapus', score: 30 },
      { answer: 'Penggaris', score: 20 }
    ]
  };

  let game;

  beforeEach(() => {
    game = createGameManager();
  });

  it('should initialize with blank state', () => {
    const state = game.getState();
    expect(state.currentQuestion).toBeNull();
    expect(state.revealedIndices).toEqual([]);
    expect(state.strikes).toBe(0);
    expect(state.currentRoundPoints).toBe(0);
    expect(state.scores).toEqual({ teamA: 0, teamB: 0 });
  });

  it('should set active question and reset round state', () => {
    game.setQuestion(sampleQuestion);
    const state = game.getState();
    expect(state.currentQuestion.id).toBe('test-q1');
    expect(state.revealedIndices).toEqual([]);
    expect(state.strikes).toBe(0);
    expect(state.currentRoundPoints).toBe(0);
  });

  it('should reveal answer index and accumulate points correctly', () => {
    game.setQuestion(sampleQuestion);
    game.revealAnswer(0); // Pulpen (40 pts)
    let state = game.getState();
    expect(state.revealedIndices).toEqual([0]);
    expect(state.currentRoundPoints).toBe(40);

    game.revealAnswer(2); // Penggaris (20 pts)
    state = game.getState();
    expect(state.revealedIndices).toEqual([0, 2]);
    expect(state.currentRoundPoints).toBe(60);
  });

  it('should not double-count points if revealed again', () => {
    game.setQuestion(sampleQuestion);
    game.revealAnswer(0);
    game.revealAnswer(0);
    const state = game.getState();
    expect(state.revealedIndices).toEqual([0]);
    expect(state.currentRoundPoints).toBe(40);
  });

  it('should increment strikes up to 3 and allow reset', () => {
    game.incrementStrike();
    expect(game.getState().strikes).toBe(1);
    game.incrementStrike();
    expect(game.getState().strikes).toBe(2);
    game.incrementStrike();
    expect(game.getState().strikes).toBe(3);
    game.incrementStrike();
    expect(game.getState().strikes).toBe(3); // capped at 3

    game.resetStrikes();
    expect(game.getState().strikes).toBe(0);
  });

  it('should award round points to specified team', () => {
    game.setQuestion(sampleQuestion);
    game.revealAnswer(0); // 40 pts
    game.awardPointsToTeam('teamA');
    expect(game.getState().scores.teamA).toBe(40);
    expect(game.getState().currentRoundPoints).toBe(0);
  });

  it('should return masked public state for players', () => {
    game.setQuestion(sampleQuestion);
    game.revealAnswer(1); // Penghapus (index 1)

    const publicState = game.getPublicState();
    expect(publicState.question).toBe('Benda yang ada di dalam kotak pensil?');
    expect(publicState.answers.length).toBe(3);
    expect(publicState.answers[0].isRevealed).toBe(false);
    expect(publicState.answers[0].answer).toBeNull();
    expect(publicState.answers[0].score).toBeNull();

    expect(publicState.answers[1].isRevealed).toBe(true);
    expect(publicState.answers[1].answer).toBe('Penghapus');
    expect(publicState.answers[1].score).toBe(30);
  });
});
