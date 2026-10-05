const http = require('http');
const os = require('os');
const WebSocket = require('ws');
const { createApp } = require('./app');
const { createGameManager } = require('./game/state');
const questionsStore = require('./store/questions');

const PORT = process.env.PORT || 3000;
const gameManager = createGameManager();

// Set initial question if exists
const initialQuestions = questionsStore.getQuestions();
if (initialQuestions && initialQuestions.length > 0) {
  gameManager.setQuestion(initialQuestions[0]);
}

const wss = new WebSocket.Server({ noServer: true });

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (client.role === 'host') {
        client.send(JSON.stringify({
          ...data,
          state: data.state || gameManager.getPublicState(),
          hostState: data.hostState || gameManager.getState()
        }));
      } else {
        client.send(JSON.stringify({
          ...data,
          state: data.state || gameManager.getPublicState(),
          hostState: undefined // Do not leak secrets to players
        }));
      }
    }
  });
}

const app = createApp(gameManager, questionsStore, broadcast);
const server = http.createServer(app);

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, req) => {
  const isHost = req.url && req.url.includes('role=host');
  ws.role = isHost ? 'host' : 'player';

  // Send initial data to this client
  ws.send(JSON.stringify({
    type: 'INIT',
    role: ws.role,
    state: gameManager.getPublicState(),
    hostState: isHost ? gameManager.getState() : undefined,
    questions: isHost ? questionsStore.getQuestions() : undefined
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {
      // Ignore invalid payload
    }
  });
});

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIpAddress();
    console.log(`\n=================================================`);
    console.log(`⭐ FAMILY 100 WEB GAME SHOW (SEKOLAH EDITION) ⭐`);
    console.log(`=================================================`);
    console.log(`📱 Layar HP Siswa/Pemain: http://${localIp}:${PORT}/`);
    console.log(`🕹️ Remote Control Host:   http://${localIp}:${PORT}/remote`);
    console.log(`=================================================\n`);
  });
}

module.exports = { server, wss, broadcast, gameManager, getLocalIpAddress };
