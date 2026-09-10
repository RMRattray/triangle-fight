// Used to send to backend
let token = null; // token to represent current user
let allPlayerInfo = null;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let width = innerWidth;
let height = innerHeight;
let state = null;
let stars = [];
let particles = [];
let seenExplosion = null;
const keys = { thrust: false, laser: false };
const mouse = { x: width / 2, y: height / 2 };

function resizeCanvas() {
  const ratio = devicePixelRatio || 1;
  width = innerWidth;
  height = innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  stars = Array.from({ length: 260 }, () => ({
    x: Math.random(), y: Math.random(), size: Math.random() * 1.6 + 0.3,
    alpha: Math.random() * 0.65 + 0.25
  }));
}

const playerCraft = () => state?.crafts.find(craft => craft.id === 'player');

function camera() {
  const player = playerCraft();
  return (player?.alive ? player.position : state?.destruction?.position) ||
    { x: state?.world.width / 2 || 0, y: state?.world.height / 2 || 0 };
}

function wrappedDelta(a, b, size) {
  let delta = b - a;
  if (delta > size / 2) delta -= size;
  if (delta < -size / 2) delta += size;
  return delta;
}

function worldToScreen(position) {
  const focus = camera();
  return {
    x: width / 2 + wrappedDelta(focus.x, position.x, state.world.width),
    y: height / 2 + wrappedDelta(focus.y, position.y, state.world.height)
  };
}

function sendInput() {
  // commented out this condition b/c it wouldn't send - perhaps we ought to
  // if (!state || !playerCraft()?.alive) return;
  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: token,
      rotation: Math.atan2(mouse.y - height / 2, mouse.x - width / 2),
      firing_thruster: keys.thrust,
      firing_laser: keys.laser
    })
  }).then((response) => {
    return response.json()
  }).then((data) => {
    console.log(data);
    // at this point, you receive a bunch of data from the backend,
    // of the form:
    /*
      {
        "token1" : {
          token: "token1",
          position: Object { x: 57614, y: 33828 },
          rotation: 3.14159,
          velocity: Object { x: 0, y: 0},
          firing_thruster: false,
          firing_laser: false,
          time_since_explode: -1,
          temperature: 300
        },
        "token2" : {
          token: "token2",
          position: Object { x: 48271, y: 65535 },
          rotation: 3.14159,
          velocity: Object { x: 0, y: 0},
          firing_thruster: false,
          firing_laser: false,
          time_since_explode: -1,
          temperature: 300
        }
      }
    */
   // and you'll want to do something with it!
  });
}

addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousemove', event => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});
canvas.addEventListener('mousedown', event => {
  if (event.button === 0) keys.laser = true;
});
addEventListener('mouseup', event => {
  if (event.button === 0) keys.laser = false;
});
addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault();
    keys.thrust = true;
  }
  if (event.code === 'KeyR' && respawnReady()) {
    fetch('/api/respawn', { method: 'POST' }).catch(() => {});
  }
});
addEventListener('keyup', event => {
  if (event.code === 'Space') keys.thrust = false;
});
addEventListener('blur', () => {
  keys.thrust = false;
  keys.laser = false;
  sendInput();
});

new EventSource('/api/events').onmessage = event => {
  state = JSON.parse(event.data);
  if (state.destruction && state.destruction.id !== seenExplosion) {
    seenExplosion = state.destruction.id;
    createExplosion();
  }
};

function createExplosion() {
  particles = [];
  for (let i = 0; i < 22; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 190;
    particles.push({
      kind: 'shrapnel', x: width / 2, y: height / 2,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 8,
      size: 3 + Math.random() * 8, alpha: 1
    });
  }
  for (let i = 0; i < 90; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 25 + Math.random() * 130;
    particles.push({
      kind: 'gas', x: width / 2, y: height / 2,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 3.5, alpha: 0.7 + Math.random() * 0.3
    });
  }
}

function updateParticles(dt) {
  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.rotation = (particle.rotation || 0) + (particle.spin || 0) * dt;
    particle.alpha = Math.max(0, particle.alpha - dt * 0.14);
  }
}

function drawStars() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, width, height);
  for (const star of stars) {
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
  }
}

function drawCraft(craft) {
  if (!craft.alive) return;
  const point = worldToScreen(craft.position);
  if (point.x < -700 || point.x > width + 700 || point.y < -700 || point.y > height + 700) return;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(craft.rotation);
  if (craft.firing_laser) {
    ctx.strokeStyle = 'rgba(255,35,50,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.lineTo(state.laser_range, 0);
    ctx.stroke();
    ctx.strokeStyle = '#ff4655';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (craft.firing_thruster) {
    ctx.fillStyle = '#20aaff';
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(-27 - Math.random() * 8, 0);
    ctx.lineTo(-10, 6);
    ctx.fill();
  }
  ctx.fillStyle = craft.color;
  ctx.strokeStyle = craft.id === 'player' ? '#66e0ff' : '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.translate(particle.x, particle.y);
    if (particle.kind === 'shrapnel') {
      ctx.rotate(particle.rotation);
      ctx.fillStyle = '#dbe7ef';
      ctx.fillRect(-particle.size / 2, -1.5, particle.size, 3);
    } else {
      ctx.fillStyle = Math.random() > 0.45 ? '#ff7a30' : '#7393ad';
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBar(x, y, barWidth, value, color, label, align = 'left') {
  ctx.font = '700 14px ui-monospace, SFMono-Regular, Consolas, monospace';
  ctx.textAlign = align;
  ctx.fillStyle = '#d9e5de';
  ctx.fillText(label, align === 'left' ? x : x + barWidth, y - 9);
  ctx.fillStyle = 'rgba(5,12,10,0.8)';
  ctx.fillRect(x, y, barWidth, 12);
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, (barWidth - 4) * Math.max(0, Math.min(1, value)), 8);
  ctx.strokeStyle = '#718079';
  ctx.strokeRect(x, y, barWidth, 12);
}

function drawRadar() {
  const player = playerCraft();
  if (!player?.alive) return;
  const radius = 55;
  const centerX = width / 2;
  const centerY = height - 69;
  ctx.save();
  ctx.strokeStyle = 'rgba(60,255,135,0.65)';
  ctx.fillStyle = 'rgba(0,20,12,0.72)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius / 2, 0, Math.PI * 2);
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.moveTo(centerX, centerY - radius);
  ctx.lineTo(centerX, centerY + radius);
  ctx.stroke();
  ctx.fillStyle = '#74ff9c';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
  ctx.fill();
  for (const enemy of state.crafts.filter(craft => craft.id !== 'player' && craft.alive)) {
    const dx = wrappedDelta(player.position.x, enemy.position.x, state.world.width);
    const dy = wrappedDelta(player.position.y, enemy.position.y, state.world.height);
    const magnitude = Math.hypot(dx, dy);
    const clamp = magnitude > 700 ? 700 / magnitude : 1;
    ctx.fillStyle = '#ff505c';
    ctx.beginPath();
    ctx.arc(centerX + dx * radius / 700 * clamp, centerY + dy * radius / 700 * clamp, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#9effbb';
  ctx.font = '700 12px ui-monospace, SFMono-Regular, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RADAR', centerX, centerY - radius - 8);
  ctx.restore();
}

function drawHud() {
  const player = playerCraft();
  if (!player?.alive) return;
  drawBar(24, height - 35, 190, player.reaction_mass / 100, '#42e87a', 'REAC. MASS');
  drawBar(width - 214, height - 35, 190, (player.temperature - 300) / 500,
    '#ff4357', `TEMP  ${Math.round(player.temperature)} K`, 'right');
  drawRadar();
}

function formatMet(milliseconds) {
  const total = Math.floor(milliseconds / 1000);
  return [
    Math.floor(total / 3600),
    Math.floor((total % 3600) / 60),
    total % 60
  ].map(value => String(value).padStart(2, '0')).join(':');
}

function destructionText() {
  const death = state.destruction;
  return [
    'CRAFT DESTROYED',
    `CAUSE: ${death.cause}`,
    `MET: ${formatMet(death.met_ms)}`,
    `ENEMIES DESTROYED: ${death.enemies_destroyed}`,
    'PRESS R TO RESPAWN.'
  ].join('\n');
}

function typedCharacters() {
  if (!state?.destruction) return 0;
  return Math.max(0, Math.floor((state.server_time - state.destruction.id - 4400) / 38));
}

function respawnReady() {
  return Boolean(state?.destruction) && typedCharacters() >= destructionText().length;
}

function drawDeathScreen() {
  const elapsed = state.server_time - state.destruction.id;
  if (elapsed < 4000) {
    drawParticles();
    return;
  }
  ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (elapsed - 4000) / 500)})`;
  ctx.fillRect(0, 0, width, height);
  const lines = destructionText().slice(0, typedCharacters()).split('\n');
  const lineHeight = Math.min(46, Math.max(29, width * 0.03));
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  ctx.fillStyle = '#f3f7f5';
  const messageSize = Math.min(32, Math.max(18, width * 0.023));
  ctx.font = `700 ${messageSize}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  lines.forEach((line, index) => ctx.fillText(line, width / 2, startY + index * lineHeight));
}

let previousTime = performance.now();
function frame(time) {
  const dt = Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  drawStars();
  if (state) {
    for (const craft of state.crafts) drawCraft(craft);
    drawHud();
    if (state.destruction) {
      updateParticles(dt);
      drawDeathScreen();
    }
  }
  requestAnimationFrame(frame);
}

resizeCanvas();
requestAnimationFrame(frame);

// Connect to the backend
async function connect_to_backend() {
  await joinGame(); // join the game, receiving a unique ID token

  setInterval(() => { // every 100ms, send my info and receive a list of all players' co-ordinates
    sendInput(); // use Nick's function here
  }, 50); // and his preferred frequency
};
connect_to_backend();
