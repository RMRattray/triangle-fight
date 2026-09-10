/* Thank you. Now, please implement the following changes:



-When the craft explodes, it should become invisible and generate some pieces of shrapnel and gas particles which fly away from the craft's position. After 4 seconds, the particles stop rendering and the screen fades to black, printing this message across the screen 1 letter at a time:


-The backend will calculate and pass the following variables to the frontend for each craft in the game: color, rotation, position, firing_thruster (boolean), firing_laser, temperature */

// - N Babusis

// In-memory store of players: { token: { x, y } }
const players = new Map();

const { PlayerInfo } = require('./classes');

// Constants! Adjust to taste
const timesPerSecond = 30; // how many times positions, etc are adjusted per second
const thrusterEffect = 10; // coefficient of thruster effect on velocity
const thrustTempEffect = 10; // coefficient of thruster effect on temperature
const minTemp = 300;
const maxTemp = 800;
const coolingCoefficient = 10;
const worldBoundaryLen = 65535;
const laserLength = 500;
const laserTempEffect = 40;

// Function to update player info based on physics
function updatePositions() {
    toRemove = [];
    for (var eachPlayer of players.values()) {
        const lx = Math.cos(eachPlayer.rotation);
        const ly = Math.sin(eachPlayer.rotation);
        // position moves per velocity
        eachPlayer.position.x += eachPlayer.velocity.x / timesPerSecond;
        eachPlayer.position.y += eachPlayer.velocity.y / timesPerSecond;
        if (eachPlayer.position.x > worldBoundaryL) eachPlayer.position.x -= worldBoundaryL; // strange error when velocity >> worldBoundaryL
        if (eachPlayer.position.y > worldBoundaryL) eachPlayer.position.y -= worldBoundaryL;
        if (eachPlayer.position.x < 0) eachPlayer.position.x += worldBoundaryL;
        if (eachPlayer.position.y < 0) eachPlayer.position.y += worldBoundaryL;
        // velocity changes iff firing thruster
        if (eachPlayer.firing_thruster) {
            eachPlayer.velocity.x += thrusterEffect * lx;
            eachPlayer.velocity.y += thrusterEffect * ly;
            eachPlayer.temperature += thrustTempEffect / timesPerSecond;
        }
        // laser fire collisions
        if (eachPlayer.firing_laser) {
            for (var other of players) {
                if (other === eachPlayer) continue;
                let dx = other.position.x - eachPlayer.position.x;
                let dy = other.position.y - eachPlayer.position.y;

                // Wrap distances so world loops
                if (dx > worldBoundaryLen / 2) dx -= worldBoundaryLen;
                if (dx < -worldBoundaryLen / 2) dx += worldBoundaryLen;
                if (dy > worldBoundaryLen / 2) dy -= worldBoundaryLen;
                if (dy < -worldBoundaryLen / 2) dy += worldBoundaryLen;

                // Project onto laser direction
                const along = dx * lx + dy * ly;  // distance along beam
                if (along < 0 || along > laserLength) continue;

                // Perpendicular distance from beam
                const perp = Math.abs(dx * ly - dy * lx);

                // If close enough to beam line, apply heating
                if (perp < laserWidth) {
                    other.temperature += laserTempEffect / timesPerSecond;
                }
            }
        }
        // craft explosions
        eachPlayer.temperature -= coolingCoefficient * (eachPlayer.temperature - minTemp) ** 4 / timesPerSecond;
        if (eachPlayer.time_since_explode >= 0) {
            eachPlayer.time_since_explode += 1 / timesPerSecond;
        }
        if (eachPlayer.time_since_explode < 0 && eachPlayer.temperature >= maxTemp) {
            eachPlayer.time_since_explode = 0;
        }
        if (eachPlayer.time_since_explode >= 4) {
            toRemove.push(eachPlayer.token);
        }
    }
    // Remove players outside of iteration on the set
    for (eachToken of toRemove) {
        players.delete(eachToken);
    }
}

function insertPlayer(token) {
    const initialCoords = {
        x: Math.floor(Math.random() * 65535),
        y: Math.floor(Math.random() * 65535)
    };

    var newPlayer = PlayerInfo(token, initialCoords);
    players
}

function updatePlayerActions(token, angle, isThruster, isLaser) {
    const player = players[token];
    if (!player) return false;   // signal failure

    if (angle !== undefined) {
        player.rotation = angle;
    }
    if (isThruster !== undefined) {
        player.firing_thruster = isThruster;
    }
    if (isLaser !== undefined) {
        player.firing_laser = isLaser;
    }

    return true;
}

function getPlayerInfo() {
    return players;
}

module.exports = {
    updatePositions,
    insertPlayer,
    updatePlayerActions,
    getPlayerInfo
};
