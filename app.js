const express = require('express');
const path = require('path');

const app = express();
const port = 3000;
const WORLD = { width: 2400, height: 1600 };
const AMBIENT_TEMPERATURE = 300;
const FAILURE_TEMPERATURE = 800;
const THRUST_ACCELERATION = 150;
const THRUSTER_HEATING = 24;
const LASER_HEATING = 85;
const RADIATIVE_COEFFICIENT = 1.0e-10;
const LASER_RANGE = 650;
const SHIP_RADIUS = 15;

app.use(express.json());
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