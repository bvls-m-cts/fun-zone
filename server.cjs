const http = require('http');
const fs = require('fs');
const path = require('path');

const scoresFilePath = path.join(__dirname, 'public', 'scores.json');
const playersFilePath = path.join(__dirname, 'public', 'players.json');
const RESET_PASSWORD = 'reset123'; // In a real app, use environment variables

function readScores() {
  try {
    const data = fs.readFileSync(scoresFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

function writeScores(scores) {
  fs.writeFileSync(scoresFilePath, JSON.stringify(scores, null, 2));
}

function readPlayers() {
  try {
    const data = fs.readFileSync(playersFilePath, 'utf8');
    return JSON.parse(data).players || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function writePlayers(players) {
  fs.writeFileSync(playersFilePath, JSON.stringify({ players }, null, 2));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/scores' && req.method === 'GET') {
    const scores = readScores();
    if (url.searchParams.has('today')) {
      const today = new Date().toISOString().slice(0, 10);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(scores[today] || []));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(scores));
    }
  } else if (url.pathname === '/api/scores' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const { name, score } = JSON.parse(body);
      const scores = readScores();
      const today = new Date().toISOString().slice(0, 10);

      if (!scores[today]) {
        scores[today] = [];
      }

      const playerIndex = scores[today].findIndex(p => p.name.toLowerCase() === name.toLowerCase());
      if (playerIndex > -1) {
        if (typeof score === 'number') {
          scores[today][playerIndex].score += score;
        }
      } else {
        scores[today].push({ name, score });
      }

      writeScores(scores);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(scores[today]));
    });
  } else if (url.pathname === '/api/reset/today' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const { password } = JSON.parse(body);
      if (password !== RESET_PASSWORD) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Incorrect password' }));
        return;
      }
      const scores = readScores();
      const today = new Date().toISOString().slice(0, 10);
      if (scores[today]) {
        delete scores[today];
        writeScores(scores);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
  } else if (url.pathname === '/api/reset/all' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const { password } = JSON.parse(body);
      if (password !== RESET_PASSWORD) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Incorrect password' }));
        return;
      }
      writeScores({});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
  } else if (url.pathname === '/api/players' && req.method === 'GET') {
    const players = readPlayers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(players));
  } else if (url.pathname === '/api/players' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const { name } = JSON.parse(body);
      let players = readPlayers();
      if (!players.includes(name)) {
        players.push(name);
        writePlayers(players);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(players));
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3001, () => {
  console.log('Scores server listening at http://localhost:3001');
});
