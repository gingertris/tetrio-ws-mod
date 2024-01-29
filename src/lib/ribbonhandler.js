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
            case "game.start":
                this.emit("game:start");
                break;
            case "game.spectate":
                this.game.players=msg.data.players;
                this.updateMatch(msg.data.match);
                this.emit("game:match_state", this.game.match)
                break;         
            case "game.ready":
                this.game.players = msg.data.players;
                this.setGameids(msg.data.players);
                break;
            case "game.advance":
                this.emit("game:advance");
                break;
            case "game.match":
                this.updateMatch(msg.data);
                this.emit("game:match_state", this.game.match)
                break;
            case "game.score":

                this.emit("game:score_transition", {victor: msg.data.victor})
                break;
            case "game.end":
                this.updateMatch(msg.data)
                this.emit("game:match_state", this.game.match);
                const victor = this.game.match.leaderboard.filter((a) => a.success === true)[0].username;
                this.emit("game:end", {victor})
                break;
        }
        
    }

    setGameids(players){
        for(let player of players){
            this.game.gameIds.set(player.gameid, {userid:player.userid, username:player.options.username})
        }
    }

    updateMatch(data){
        //console.log(data)
        this.game.match.leaderboard = data.leaderboard.sort((a,b) => {
            return a.naturalorder - b.naturalorder
        });
        this.game.match.refereedata = data.refereedata;
    }

    


    

}

