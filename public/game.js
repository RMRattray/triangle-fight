// Used to send to backend
let token = null; // token to represent current user
let coords = { x: 0, y: 0 }; // co-ordinates of current user

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let width;
let height;
let stars = [];
const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
const ship = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, angle: 0, thrusting: false };

function resizeCanvas() {
  const ratio = devicePixelRatio || 1;
  width = innerWidth;
  height = innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.25,
    brightness: Math.random() * 0.7 + 0.3
  }));
}

addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousemove', event => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
});
addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault();
    ship.thrusting = true;
  }
});
addEventListener('keyup', event => {
  if (event.code === 'Space') ship.thrusting = false;
});
addEventListener('blur', () => { ship.thrusting = false; });

function update(dt) {
  ship.angle = Math.atan2(mouse.y - ship.y, mouse.x - ship.x);
  if (ship.thrusting) {
    ship.vx += Math.cos(ship.angle) * 180 * dt;
    ship.vy += Math.sin(ship.angle) * 180 * dt;
  }
  const damping = Math.pow(0.995, dt * 60);
  ship.vx *= damping;
  ship.vy *= damping;
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  if (ship.x < -20) ship.x = width + 20;
  if (ship.x > width + 20) ship.x = -20;
  if (ship.y < -20) ship.y = height + 20;
  if (ship.y > height + 20) ship.y = -20;
}

function draw() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, width, height);
  for (const star of stars) {
    ctx.fillStyle = `rgba(255,255,255,${star.brightness})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  if (ship.thrusting) {
    ctx.fillStyle = '#28a9ff';
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(-25 - Math.random() * 8, 0);
    ctx.lineTo(-10, 6);
    ctx.fill();
  }
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#55dfff';
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

let previousTime = performance.now();
function gameLoop(time) {
  const dt = Math.min((time - previousTime) / 1000, 0.033);
  previousTime = time;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

resizeCanvas();
requestAnimationFrame(gameLoop);

// Connect to the backend
async function connect_to_backend() {
  await joinGame(); // join the game, receiving a unique ID token

  setInterval(() => { // every 100ms, send my co-ordinates and receive a list of all players' co-ordinates
    updateLoop();
  }, 100); // 100ms
};
connect_to_backend();
