const express = require('express');
const path = require('path');

function createApp(gameManager, questionsStore, broadcastFn = () => {}) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // Web routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  app.get('/remote', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/remote.html'));
  });

  // REST API
  app.get('/api/state', (req, res) => {
    res.json(gameManager.getPublicState());
  });

  app.get('/api/state/host', (req, res) => {
    res.json(gameManager.getState());
  });

  app.get('/api/questions', (req, res) => {
    res.json(questionsStore.getQuestions());
  });

  app.post('/api/questions', (req, res) => {
    const { question, answers } = req.body;
    if (!question || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Pertanyaan dan daftar jawaban wajib diisi' });
    }
    const saved = questionsStore.saveQuestion({ question, answers });
    broadcastFn({
      type: 'QUESTIONS_UPDATED',
      questions: questionsStore.getQuestions()
    });
    res.status(201).json(saved);
  });

  app.delete('/api/questions/:id', (req, res) => {
    const success = questionsStore.deleteQuestion(req.params.id);
    broadcastFn({
      type: 'QUESTIONS_UPDATED',
      questions: questionsStore.getQuestions()
    });
    res.json({ success });
  });

  app.post('/api/action', (req, res) => {
    const { type, payload = {} } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'Action type is required' });
    }

    switch (type) {
      case 'SET_QUESTION': {
        const q = questionsStore.getQuestionById(payload.id);
        if (q) {
          gameManager.setQuestion(q);
          broadcastFn({
            type: 'STATE_CHANGED',
            state: gameManager.getPublicState(),
            hostState: gameManager.getState()
          });
        }
        break;
      }
      case 'REVEAL_ANSWER': {
        gameManager.revealAnswer(payload.index);
        broadcastFn({
          type: 'ANSWER_REVEALED',
          index: payload.index,
          state: gameManager.getPublicState(),
          hostState: gameManager.getState()
        });
        break;
      }
      case 'HIDE_ANSWER': {
        gameManager.hideAnswer(payload.index);
        broadcastFn({
          type: 'STATE_CHANGED',
          state: gameManager.getPublicState(),
          hostState: gameManager.getState()
        });
        break;
      }
      case 'STRIKE': {
        gameManager.incrementStrike();
        broadcastFn({
          type: 'STRIKE_TRIGGERED',
          strikes: gameManager.getState().strikes,
          state: gameManager.getPublicState(),
          hostState: gameManager.getState()
        });
        break;
      }
      case 'RESET_STRIKES': {
        gameManager.resetStrikes();
        broadcastFn({
          type: 'STATE_CHANGED',
          state: gameManager.getPublicState(),
          hostState: gameManager.getState()
        });
        break;
      }
      case 'RESET_ROUND': {
        gameManager.resetRound();
        broadcastFn({
          type: 'STATE_CHANGED',
          state: gameManager.getPublicState(),
          hostState: gameManager.getState()
        });
        break;
      }
      case 'AWARD_TEAM': {
        gameManager.awardPointsToTeam(payload.team);
        broadcastFn({
          type: 'STATE_CHANGED',
          state: gameManager.getPublicState(),
          hostState: gameManager.getState()
        });
        break;
      }
      case 'RESET_GAME': {
        gameManager.resetGame();
        broadcastFn({
          type: 'STATE_CHANGED',
          state: gameManager.getPublicState(),
          hostState: gameManager.getState()
        });
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown action type: ${type}` });
    }

    res.json({ success: true, state: gameManager.getPublicState() });
  });

  return app;
}

module.exports = { createApp };
