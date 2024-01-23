const EventEmitter = require("events").EventEmitter;
const util = require("util")
const Game = require("./Game.js")
module.exports = class RibbonHandler extends EventEmitter {

    game;


    constructor(){
        super();
        this.game = new Game();
    }

    handleMessage(msg) {

        const mode = msg.command.split(".")[0];

        switch(mode){
            case "game":
                this._handleGameMessage(msg);
                break;
        }
    }

    _handleGameMessage(msg){
        switch(msg.command){
            case "game.spectate":
                this.setGameids(msg.data.players);
                this.updateLeaderboard(msg.data.match.leaderboard);
                this.updateReferee(msg.data.match.refereedata);
                break;         
            case "game.ready":
                this.setGameids(msg.data.players);
                break;
            case "game.match":
                this.updateLeaderboard(msg.data.leaderboard, false);
                this.updateReferee(msg.data.refereedata);
                break;
            case "game.score":
                this.updateLeaderboard(msg.data.leaderboard, true);
                this.updateReferee(msg.data.refereedata);
                break;
        }
        
    }

    setGameids(players){
        for(let player of players){
            this.game.gameIds.set(player.gameid, {userid:player.userid, username:player.options.username})
        }
    }

    updateLeaderboard(leaderboard, scoreUpdate){
        this.game.leaderboard = leaderboard;
        this.emit(scoreUpdate ? "match:scoreupdate" : "match:leaderboard", leaderboard);
    }

    updateReferee(referee){
        this.game.referee = referee;
        this.emit("match:referee", referee);
    }

    

}

