$(document).ready(function () {
    var game = {};

    $("#board").hide();
    $("#remake").hide();

    var socket = io();

    const gameId = getGameId();
    if (gameId) {
        socket.emit('join', { gameID: gameId });
    }

    $("#create").on("click", function () {
        socket.emit("create");
        $(".item").hide();
    });

    $("#remake").on("click", function () {
        socket.emit("restart", { id: game.id });
    });

    socket.on('created', function (data) {
        const url = window.location.href + "?gameId=" + data.id;
        $("#status").html(`Отправьте ссылку - прилашение другому игроку`);
        $("#link").text(url);
        $('#link').show();
        $('#copy-btn').text("Скопировать");
    });

   
    socket.on("start", function (data) {
        $("#remake").hide();
        $(".item").hide();
        $('#link').hide();

        game.id = data.id;
        game.board = data.gameboard;
        game.player = data.player;

        $("#board").show();
        updateGameboard();
    });

    socket.on("failed", function () {
        $("#status").html("Приглашение не было найдено.");
        $(".title").hide();
        $("#create").hide();
    });

    socket.on("invalid", function () {
        $("#status").html("Not a valid move.");
    });

    $("table").on("click", function (e) {
        let cellClicked = e.target.id;

        if (game.player.turn === true) {
            if (game.board[cellClicked] === "") {
                let data = { id: game.id, cell: cellClicked, player: game.player };
                socket.emit("move", data);
            } else {
                $("#status").html("Нажмите на пустую ячейку.");
            }
        }
    });

    socket.on("updateGame", function (data) {
        game.player.turn = !game.player.turn;
        game.board = data.gameboard;
        updateGameboard();
    });

    socket.on("win", function (data) {
        game.board = data;
        updateGameboard();
        $("#status").html("Вы победили.");
        $("#remake").show();
    });

    socket.on("loss", function (data) {
        game.board = data;
        updateGameboard();
        $("#status").html("Вы проиграли.");
        $("#remake").show();
    });
    socket.on("tie", function (data) {
        game.board = data.gameboard;
        updateGameboard();
        $("#status").html("Tie.");
        $("#remake").show();
    });
    
    socket.on("quit", function () {
        $("#status").html("Соединение потеряно.");
        $("#board").hide();
        $(".item").show();
        $(".title").hide();
        $("#remake").hide();
    });

    function updateGameboard() {
        $.each(game.board, function (key, value) {
            if (value == "X") {
                $("#" + key).removeClass("red").addClass("blue");
            } else {
                $("#" + key).removeClass("blue").addClass("red");
            }

            $("#" + key).html(value);
        });

        if (game.player.turn) {
            $("#status").html("Ваш ход.");
        } else {
            $("#status").html("Ходит другой игрок.");
        }
    }
});
