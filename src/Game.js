const EventEmitter = require("events").EventEmitter;

module.exports = class Game extends EventEmitter {
    gameIds;
    players;
    leaderboard;
    referee;
    replays;

    constructor(){
        super()
        this.gameIds = new Map();
        this.players = null;
        this.leaderboard = null;
        this.referee = null;
        this.replays = null;
    }



}

