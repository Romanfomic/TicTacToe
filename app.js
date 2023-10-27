const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = (process.env.PORT || 8000);
server.listen(port);

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    res.sendFile('index.html');
});

/**
 * @class Player class
 */
class Player {
    /**
     * @param {String}  playerID    The id of the player
     * @param {Boolean} turn        Whether it is the players turn to move
     * @param {String}  type        "X" or "O"
     */
    constructor(playerID, turn, type) {
        this.id = playerID;
        this.turn = turn;
        this.type = type;
    }

    /**
     * @param {Object}  rhs         The other player
     */
    equals(rhs) {
        return (this.id == rhs.id
            && this.turn == rhs.turn
            && this.type == rhs.type);
    }
}

/**
 * @class Game class
 */
class Game {
    /**
     * @param {String}  gameID      Game ID
     */
    constructor(gameID) {
        this.id = gameID;
        this.player1 = null;
        this.player2 = null;
        this.gameboard = {
            0: ""
            , 1: ""
            , 2: ""
            , 3: ""
            , 4: ""
            , 5: ""
            , 6: ""
            , 7: ""
            , 8: ""
        };
    }

    reset() {
        this.gameboard = {
            0: ""
            , 1: ""
            , 2: ""
            , 3: ""
            , 4: ""
            , 5: ""
            , 6: ""
            , 7: ""
            , 8: ""
        };

        this.player1.turn = true;
        this.player2.turn = false;
    }

    /**
     * @param {String}  playerID      Id of the player joining
     */
    addPlayer(playerID) {
        if (this.player1 == null) {
            this.player1 = new Player(playerID, true, "X");
            return "player1";
        } else {
            this.player2 = new Player(playerID, false, "O");
            return "player2";
        }
    }

    /**
     * @param {Object}  player      Player that made move
     * @param {String}  cell        The cell where move was made
     */
    checkValid(player, cell) {
        if (player.turn && (this.player1.equals(player) || this.player2.equals(player))) {
            return this.gameboard[cell] == "";
        }

        return false;
    }

    /**
     * @param {String}  cell        Cell where move was made
     * @param {String}  type        Type of player that made move
     */
    updateBoard(cell, type) {
        this.gameboard[cell] = type;
        this.updateTurns();
    }

    updateTurns() {
        this.player1.turn = !this.player1.turn;
        this.player2.turn = !this.player2.turn;
    }

    /**
     * @return  Returns "win" or "tie" or "ongoing"
     */
    checkStatus() {
        let board = this.gameboard;
        if ((board[0] != "") && ((board[0] == board[1]) && (board[1] == board[2]))) {
            return "win";
        }
        if ((board[3] != "") && ((board[3] == board[4]) && (board[4] == board[5]))) {
            return "win";
        }
        if ((board[6] != "") && ((board[6] == board[7]) && (board[7] == board[8]))) {
            return "win";
        }
        if ((board[0] != "") && ((board[0] == board[3]) && (board[3] == board[6]))) {
            return "win";
        }
        if ((board[1] != "") && ((board[1] == board[4]) && (board[4] == board[7]))) {
            return "win";
        }
        if ((board[2] != "") && ((board[2] === board[5]) && (board[5] == board[8]))) {
            return "win";
        }
        if ((board[0] != "") && ((board[0] === board[4]) && (board[4] == board[8]))) {
            return "win";
        }
        if ((board[2] != "") && ((board[2] === board[4]) && (board[4] == board[6]))) {
            return "win";
        }

        if ((board[0] != "") && (board[1] != "") && (board[2] != "") && (board[3] != "") &&
            (board[4] != "") && (board[5] != "") && (board[6] != "") && (board[7] != "") && (board[8] != "")) {
            return "tie";
        }

        return "ongoing";
    }
}

var games = {};

io.sockets.on('connection', function (socket) {

    socket.on("create", function () {
        let done = false;
        let gameID = Math.floor((Math.random() * 100)).toString();
        while (!done) {
            if (games[gameID] == null) {
                done = true;
            } else {
                gameID = Math.floor((Math.random() * 100)).toString();
            }
        }

        games[gameID] = new Game(gameID);
        games[gameID].addPlayer(socket.id);

        socket.join(gameID);
        socket.lobby = gameID;
        socket.emit('created', {
            id: gameID
        });

    });

    socket.on('join', function (data) {
        let gameID = data.gameID.toString();
        if (games[gameID] != null) {
            games[gameID].addPlayer(socket.id);

            socket.join(gameID);
            socket.lobby = gameID;

            socket.in(gameID).emit('start', {
                id: gameID, gameboard: games[gameID].gameboard,
                player: games[gameID].player1
            });
            
            socket.emit("start", {
                id: gameID, gameboard: games[gameID].gameboard,
                player: games[gameID].player2
            });

        } else {
            socket.emit("failed");
        }
    });

    socket.on("move", function (data) {
        let gameID = data.id;
        let valid = games[gameID].checkValid(data.player, data.cell);
        if (valid) {
            games[gameID].updateBoard(data.cell, data.player.type);

            let status = games[gameID].checkStatus();
            if (status == "ongoing") {
                socket.in(gameID).emit('updateGame', {
                    id: gameID
                    , gameboard: games[gameID].gameboard
                });
                socket.emit("updateGame", {
                    id: gameID
                    , gameboard: games[gameID].gameboard
                });

            } else if (status == "win") {
                socket.emit("win", games[gameID].gameboard);
                socket.in(gameID).emit("loss", games[gameID].gameboard);
            } else {
                socket.emit("tie", { gameboard: games[gameID].gameboard });
                socket.in(gameID).emit("tie", {
                    gameboard: games[gameID].gameboard
                });
            }

        } else {
            socket.emit("invalid");
        }
    });

    socket.on("restart", function (data) {
        let gameID = data.id;
        games[gameID].reset();

        socket.emit("start", {
            id: gameID, gameboard: games[gameID].gameboard, player: games[gameID].player1
        });
        
        socket.in(gameID).emit('start', {
            id: gameID, gameboard: games[gameID].gameboard, player: games[gameID].player2
        });

    });

    socket.on("disconnect", function () {
        if (socket.lobby != null) {
            socket.emit("quit");
            socket.in(socket.lobby.toString()).emit("quit");
            delete games[socket.lobby];
        }
    });

});
