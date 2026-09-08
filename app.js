const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Run the physics engine!
const {
  updatePositions,
  insertPlayer,
  updatePlayerActions,
  getPlayerInfo
} = require('./src/physics');
const timesPerSecond = 30; // should this be taken from backend.js somehow??
setInterval(() => {
  updatePositions();
}, 1000 / timesPerSecond);

// Mount backend routes
const backend = require('./src/backend');
app.use('/', backend);

app.listen(port, () => {
  console.log(`Game running at http://localhost:${port}`);
});