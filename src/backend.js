const express = require('express');
const crypto = require('crypto');
const { PlayerInfo } = require('./classes');

const router = express.Router();

// In-memory store of players: { token: { x, y } }
const players = {};

// POST /join → create a new player
router.post('/join', (req, res) => {
  const token = crypto.randomUUID();

  const initialCoords = {
    x: Math.floor(Math.random() * 65535),
    y: Math.floor(Math.random() * 65535)
  };

  var newPlayer = PlayerInfo(token, initialCoords);

  players[token] = newPlayer;

  res.json({
    token,
    info: players
  });
});

// POST / → update player coords and return all players
router.post('/', (req, res) => {
  const { token } = req.body;

//   if (!token || !coords) {
//     return res.status(400).json({ error: "token and coords required" });
//   }

//   if (!players[token]) {
//     return res.status(404).json({ error: "unknown player token" });
//   }

//   players[token] = coords;

  res.json({ players });
});

module.exports = router;
