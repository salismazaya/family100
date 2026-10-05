const request = require('supertest');
const { createApp } = require('../src/app');
const { createGameManager } = require('../src/game/state');
const questionsStore = require('../src/store/questions');

describe('Express HTTP App', () => {
  let app;
  let gameManager;

  beforeEach(() => {
    gameManager = createGameManager();
    app = createApp(gameManager, questionsStore);
  });

  it('GET /api/state returns public game state', async () => {
    const res = await request(app).get('/api/state');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('strikes');
    expect(res.body).toHaveProperty('scores');
  });

  it('GET /api/questions returns question list', async () => {
    const res = await request(app).get('/api/questions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/action rejects without action type', async () => {
    const res = await request(app).post('/api/action').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
