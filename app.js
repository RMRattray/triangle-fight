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

const randomPosition = () => ({
  x: 150 + Math.random() * (WORLD.width - 300),
  y: 150 + Math.random() * (WORLD.height - 300)
});

function makeCraft(id, color, isPlayer = false) {
  return {
    id, color, rotation: Math.random() * Math.PI * 2,
    position: randomPosition(), velocity: { x: 0, y: 0 },
    firing_thruster: false, firing_laser: false,
    temperature: AMBIENT_TEMPERATURE, reaction_mass: 100,
    alive: true, isPlayer, lastHeatedBy: null, respawnAt: 0
  };
}

const player = makeCraft('player', '#ffffff', true);
const enemyColors = ['#ff5c5c', '#ffb347', '#d975ff', '#57e3ff', '#ffe45c'];
const enemies = enemyColors.map((color, index) => makeCraft(`enemy-${index + 1}`, color));
const controls = { rotation: 0, firing_thruster: false, firing_laser: false };
const clients = new Set();
let enemiesDestroyed = 0;
let respawnedAt = Date.now();
let destruction = null;

function wrap(craft) {
  craft.position.x = (craft.position.x + WORLD.width) % WORLD.width;
  craft.position.y = (craft.position.y + WORLD.height) % WORLD.height;
}

function wrappedDelta(a, b, size) {
  let delta = b - a;
  if (delta > size / 2) delta -= size;
  if (delta < -size / 2) delta += size;
  return delta;
}

function distanceBetween(a, b) {
  return Math.hypot(
    wrappedDelta(a.position.x, b.position.x, WORLD.width),
    wrappedDelta(a.position.y, b.position.y, WORLD.height)
  );
}

function isInLaserPath(source, target) {
  if (!source.alive || !source.firing_laser || !target.alive || source === target) return false;
  const dx = wrappedDelta(source.position.x, target.position.x, WORLD.width);
  const dy = wrappedDelta(source.position.y, target.position.y, WORLD.height);
  const forwardX = Math.cos(source.rotation);
  const forwardY = Math.sin(source.rotation);
  const alongBeam = dx * forwardX + dy * forwardY;
  if (alongBeam < 0 || alongBeam > LASER_RANGE) return false;
  return Math.abs(dx * forwardY - dy * forwardX) < SHIP_RADIUS;
}

function destroyCraft(craft, cause, sourceId = null) {
  if (!craft.alive) return;
  craft.alive = false;
  craft.firing_thruster = false;
  craft.firing_laser = false;
  if (craft.isPlayer) {
    destruction = {
      id: Date.now(), cause, position: { ...craft.position },
      velocity: { ...craft.velocity }, met_ms: Date.now() - respawnedAt,
      enemies_destroyed: enemiesDestroyed
    };
  } else {
    if (sourceId === player.id) enemiesDestroyed += 1;
    craft.respawnAt = Date.now() + 2500;
  }
}

function respawnEnemy(craft) {
  Object.assign(craft, makeCraft(craft.id, craft.color));
}

function updateEnemy(enemy, time) {
  if (!enemy.alive) {
    if (time >= enemy.respawnAt) respawnEnemy(enemy);
    return;
  }
  const dx = wrappedDelta(enemy.position.x, player.position.x, WORLD.width);
  const dy = wrappedDelta(enemy.position.y, player.position.y, WORLD.height);
  const distance = Math.hypot(dx, dy);
  enemy.rotation = Math.atan2(dy, dx) + Math.sin(time / 850 + Number(enemy.id.slice(-1))) * 0.18;
  enemy.firing_thruster = player.alive && distance > 260 && enemy.reaction_mass > 0;
  enemy.firing_laser = player.alive && distance < LASER_RANGE &&
    Math.abs(Math.sin(time / 900 + Number(enemy.id.slice(-1)))) > 0.72;
}

function updateCraft(craft, dt, allCrafts) {
  if (!craft.alive) return;
  if (craft.firing_thruster && craft.reaction_mass > 0) {
    craft.velocity.x += Math.cos(craft.rotation) * THRUST_ACCELERATION * dt;
    craft.velocity.y += Math.sin(craft.rotation) * THRUST_ACCELERATION * dt;
    craft.reaction_mass = Math.max(0, craft.reaction_mass - 1.4 * dt);
  } else {
    craft.firing_thruster = false;
  }

  // No drag: velocity changes only when thrust (or another future force) is applied.
  craft.position.x += craft.velocity.x * dt;
  craft.position.y += craft.velocity.y * dt;
  wrap(craft);

  let heatingRate = craft.firing_thruster ? THRUSTER_HEATING : 0;
  for (const source of allCrafts) {
    if (isInLaserPath(source, craft)) {
      heatingRate += LASER_HEATING;
      craft.lastHeatedBy = source.id;
    }
  }
  const cooling = RADIATIVE_COEFFICIENT *
    (Math.pow(craft.temperature, 4) - Math.pow(AMBIENT_TEMPERATURE, 4));
  craft.temperature = Math.max(
    AMBIENT_TEMPERATURE,
    craft.temperature + (heatingRate - cooling) * dt
  );
  if (craft.temperature >= FAILURE_TEMPERATURE) {
    destroyCraft(craft, 'OVERHEAT', craft.lastHeatedBy);
  }
}

function updateSimulation(dt) {
  const now = Date.now();
  if (player.alive) {
    player.rotation = controls.rotation;
    player.firing_thruster = controls.firing_thruster;
    player.firing_laser = controls.firing_laser;
  }
  for (const enemy of enemies) updateEnemy(enemy, now);
  const allCrafts = [player, ...enemies];
  for (const craft of allCrafts) updateCraft(craft, dt, allCrafts);

  if (player.alive) {
    for (const enemy of enemies) {
      if (enemy.alive && distanceBetween(player, enemy) < SHIP_RADIUS * 2) {
        destroyCraft(player, 'COLLISION');
        destroyCraft(enemy, 'COLLISION', player.id);
        break;
      }
    }
  }
}

function publicCraft(craft) {
  return {
    id: craft.id, color: craft.color, rotation: craft.rotation,
    position: craft.position, firing_thruster: craft.firing_thruster,
    firing_laser: craft.firing_laser, temperature: craft.temperature,
    reaction_mass: craft.reaction_mass, alive: craft.alive
  };
}

function snapshot() {
  return JSON.stringify({
    world: WORLD, laser_range: LASER_RANGE,
    crafts: [player, ...enemies].map(publicCraft),
    destruction, enemies_destroyed: enemiesDestroyed, server_time: Date.now()
  });
}

app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();
  clients.add(res);
  res.write(`data: ${snapshot()}\n\n`);
  req.on('close', () => clients.delete(res));
});

app.post('/api/input', (req, res) => {
  const { rotation, firing_thruster, firing_laser } = req.body;
  if (Number.isFinite(rotation)) controls.rotation = rotation;
  controls.firing_thruster = Boolean(firing_thruster);
  controls.firing_laser = Boolean(firing_laser);
  res.sendStatus(204);
});

app.post('/api/respawn', (req, res) => {
  if (player.alive || !destruction || Date.now() - destruction.id < 4000) {
    return res.status(409).json({ error: 'Respawn is not available yet.' });
  }
  Object.assign(player, makeCraft('player', '#ffffff', true));
  controls.firing_thruster = false;
  controls.firing_laser = false;
  enemiesDestroyed = 0;
  respawnedAt = Date.now();
  destruction = null;
  return res.sendStatus(204);
});

let previousTime = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  updateSimulation(dt);
}, 1000 / 60);

setInterval(() => {
  const message = `data: ${snapshot()}\n\n`;
  for (const client of clients) client.write(message);
}, 1000 / 30);

app.listen(port, () => console.log(`Game running at http://localhost:${port}`));
