const http = require('http');
const WebSocket = require('ws');
const { createApp } = require('../src/app');
const { createGameManager } = require('../src/game/state');
const questionsStore = require('../src/store/questions');

describe('WebSocket Server Realtime', () => {
  let server;
  let port;
  let gameManager;

  beforeAll((done) => {
    gameManager = createGameManager();
    const wss = new WebSocket.Server({ noServer: true });

    function broadcast(data) {
      const msg = JSON.stringify(data);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }

    const app = createApp(gameManager, questionsStore, broadcast);
    server = http.createServer(app);

    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    wss.on('connection', (ws) => {
      ws.send(JSON.stringify({
        type: 'INIT',
        state: gameManager.getPublicState()
      }));
    });

    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('client should connect and receive INIT event', (done) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      expect(msg.type).toBe('INIT');
      expect(msg.state).toBeDefined();
      ws.close();
      done();
    });
  });
});
