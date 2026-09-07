class PlayerInfo {
    constructor(token, coords) {
        this.token = token;
        this.position = coords;
        this.rotation = 0;
        this.velocity = { x: 0, y: 0 };
        this.firing_thruster = false;
        this.firing_laser = false;
        this.time_since_explode = -1;
        this.temperature = 0;
    }
}

module.exports = PlayerInfo;