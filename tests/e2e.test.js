const request = require('supertest');
const { createApp } = require('../src/app');
const { createGameManager } = require('../src/game/state');
const questionsStore = require('../src/store/questions');

describe('E2E Game Flow', () => {
  let app;
  let gameManager;

  beforeAll(() => {
    gameManager = createGameManager();
    app = createApp(gameManager, questionsStore);
  });

  it('full loop: set question, reveal answer, strike, and award team points', async () => {
    // 1. Fetch questions and pick first
    const qRes = await request(app).get('/api/questions');
    expect(qRes.body.length).toBeGreaterThan(0);
    const firstQ = qRes.body[0];

    // 2. Set active question
    const setRes = await request(app).post('/api/action').send({
      type: 'SET_QUESTION',
      payload: { id: firstQ.id }
    });
    expect(setRes.status).toBe(200);

    // 3. Reveal first answer (index 0)
    const revRes = await request(app).post('/api/action').send({
      type: 'REVEAL_ANSWER',
      payload: { index: 0 }
    });
    expect(revRes.status).toBe(200);
    expect(revRes.body.state.answers[0].isRevealed).toBe(true);
    expect(revRes.body.state.currentRoundPoints).toBe(firstQ.answers[0].score);

    // 4. Trigger strike TETOT
    const strikeRes = await request(app).post('/api/action').send({
      type: 'STRIKE'
    });
    expect(strikeRes.status).toBe(200);
    expect(strikeRes.body.state.strikes).toBe(1);

    // 5. Award round points to Team A
    const awardRes = await request(app).post('/api/action').send({
      type: 'AWARD_TEAM',
      payload: { team: 'teamA' }
    });
    expect(awardRes.status).toBe(200);
    expect(awardRes.body.state.scores.teamA).toBe(firstQ.answers[0].score);
    expect(awardRes.body.state.currentRoundPoints).toBe(0);

    // 6. Reset strikes
    const resetStrikeRes = await request(app).post('/api/action').send({
      type: 'RESET_STRIKES'
    });
    expect(resetStrikeRes.body.state.strikes).toBe(0);
  });
});
