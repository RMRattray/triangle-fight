const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let width;
let height;
let stars = [];

const mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
};

const ship = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  vx: 0,
  vy: 0,
  angle: 0,
  thrusting: false
};

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;

  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Draw using ordinary screen-pixel coordinates.
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.25,
    brightness: Math.random() * 0.7 + 0.3
  }));
}

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('mousemove', event => {
  const rect = canvas.getBoundingClientRect();

  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
});

window.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault();
    ship.thrusting = true;
  }
});

window.addEventListener('keyup', event => {
  if (event.code === 'Space') {
    ship.thrusting = false;
  }
});

window.addEventListener('blur', () => {
  ship.thrusting = false;
});

function update(deltaTime) {
  // Point the nose toward the cursor.
  ship.angle = Math.atan2(
    mouse.y - ship.y,
    mouse.x - ship.x
  );

  if (ship.thrusting) {
    const acceleration = 180; // pixels per second squared

    ship.vx += Math.cos(ship.angle) * acceleration * deltaTime;
    ship.vy += Math.sin(ship.angle) * acceleration * deltaTime;
  }

  // Slight damping prevents the ship from accelerating forever.
  const damping = Math.pow(0.995, deltaTime * 60);
  ship.vx *= damping;
  ship.vy *= damping;

  ship.x += ship.vx * deltaTime;
  ship.y += ship.vy * deltaTime;

  // Wrap around screen edges.
  const margin = 20;

  if (ship.x < -margin) ship.x = width + margin;
  if (ship.x > width + margin) ship.x = -margin;
  if (ship.y < -margin) ship.y = height + margin;
  if (ship.y > height + margin) ship.y = -margin;
}

function drawStars() {
  for (const star of stars) {
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  // Thruster flame.
  if (ship.thrusting) {
    const flameLength = 15 + Math.random() * 12;

    ctx.fillStyle = '#ff8c32';
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(-10 - flameLength, 0);
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff4a3';
    ctx.beginPath();
    ctx.moveTo(-10, -3);
    ctx.lineTo(-16 - Math.random() * 8, 0);
    ctx.lineTo(-10, 3);
    ctx.closePath();
    ctx.fill();
  }

  // Ship points along its local positive-X direction.
  ctx.fillStyle = '#55dfff';
  ctx.strokeStyle = 'white';
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

function draw() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, width, height);

  drawStars();
  drawShip();
}

let previousTime = performance.now();

function gameLoop(currentTime) {
  // Convert milliseconds to seconds and limit large time jumps.
  const deltaTime = Math.min(
    (currentTime - previousTime) / 1000,
    0.033
  );

  previousTime = currentTime;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

resizeCanvas();
requestAnimationFrame(gameLoop);