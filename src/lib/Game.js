const EventEmitter = require("events").EventEmitter;

module.exports = class Game extends EventEmitter {
    gameIds;
    players;
    match;
    replays;

    constructor(){
        super()
        this.gameIds = new Map();
        this.players = null;
        this.match = {
            leaderboard: null,
            refereedata: null
        }
        this.replays = null;
    }



}

