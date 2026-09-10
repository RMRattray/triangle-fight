const express = require('express');
const crypto = require('crypto');
const { updatePositions, insertPlayer, updatePlayerActions, getPlayerInfo } = require('./physics');

const router = express.Router();

// POST /join → create a new player
router.post('/join', (req, res) => {
  const token = crypto.randomUUID();

  insertPlayer(token);

  res.json({
    token,
    info: getPlayerInfo()
  });
});

router.post('/', (req, res) => {
  const { token, rotation, firing_thruster, firing_laser } = req.body;

  if (token === undefined) {
    return res.status(400).json({ error: "token required" });
  }

  const ok = updatePlayerActions(
    token,
    rotation,
    firing_thruster,
    firing_laser
  );

  if (!ok) {
    return res.status(404).json({ error: "unknown player token" });
  }

  res.json(getPlayerInfo());
});


module.exports = router;
