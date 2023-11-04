import { Component, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  ngOnInit() {
    function copyLink() {
      var linkElement = document.getElementById('link');
      var divText = linkElement ? linkElement.innerText : '';
      var textarea = document.createElement('textarea');
      textarea.value = divText;
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Приглашение скопировано');
    }
    
    function getGameId() {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());
    
      return params && params['gameId'];
    }
    
    document.addEventListener('DOMContentLoaded', function () {
      var game = {};

      var boardElement = document.getElementById("board");
      var remakeElement = document.getElementById("remake");
      if(boardElement){
        boardElement.style.display = "none";
      }
      if(remakeElement){
        remakeElement.style.display = "none";
      }
    
      var socket = io();
    
      const gameId = getGameId();
      if (gameId) {
        socket.emit('join', { gameID: gameId });
      }
    
      document.getElementById("create").addEventListener("click", function () {
        socket.emit("create");
        var itemElements = document.getElementsByClassName("item");
        Array.from(itemElements).forEach(function (element) {
          element.style.display = "none";
        });
      });
    
      document.getElementById("remake").addEventListener("click", function () {
        socket.emit("restart", { id: game.id });
      });
    
      socket.on('created', function (data) {
        var url = window.location.href + "?gameId=" + data.id;
        document.getElementById("status").innerHTML = "Отправьте ссылку - приглашение другому игроку";
        document.getElementById("link").textContent = url;
        document.getElementById("link").style.display = "inline";
        document.getElementById("copy-btn").textContent = "Скопировать";
      });
    
      socket.on("start", function (data) {
        document.getElementById("remake").style.display = "none";
        var itemElements = document.getElementsByClassName("item");
        Array.from(itemElements).forEach(function (element) {
          element.style.display = "none";
        });
        document.getElementById("link").style.display = "none";
    
        game.id = data.id;
        game.board = data.gameboard;
        game.player = data.player;
    
        document.getElementById("board").style.display = "block";
        updateGameboard();
      });
    
      socket.on("failed", function () {
        document.getElementById("status").innerHTML = "Приглашение не было найдено.";
        var titleElement = document.getElementsByClassName("title")[0];
        titleElement.style.display = "none";
        document.getElementById("create").style.display = "none";
      });
    
      socket.on("invalid", function () {
        document.getElementById("status").innerHTML = "Not a valid move.";
      });
    
      document.querySelector("table").addEventListener("click", function (e) {
        var cellClicked = e.target.id;
    
        if (game.player.turn === true) {
          if (game.board[cellClicked] === "") {
            var data = { id: game.id, cell: cellClicked, player: game.player };
            socket.emit("move", data);
          } else {
            document.getElementById("status").innerHTML = "Нажмите на пустую ячейку.";
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
        document.getElementById("status").innerHTML = "Вы победили.";
        document.getElementById("remake").style.display = "block";
      });
    
      socket.on("loss", function (data) {
        game.board = data;
        updateGameboard();
        document.getElementById("status").innerHTML = "Вы проиграли.";
        document.getElementById("remake").style.display = "block";
      });
    
      socket.on("tie", function (data) {
        game.board = data.gameboard;
        updateGameboard();
        document.getElementById("status").innerHTML = "Tie.";
        document.getElementById("remake").style.display = "block";
      });
    
      socket.on("quit", function () {
        document.getElementById("status").innerHTML = "Соединение потеряно.";
        document.getElementById("board").style.display = "none";
        var itemElements = document.getElementsByClassName("item");
        Array.from(itemElements).forEach(function (element) {
          element.style.display = "block";
        });
        var titleElement = document.getElementsByClassName("title")[0];
        titleElement.style.display = "none";
        document.getElementById("remake").style.display = "none";
      });
    
      function updateGameboard() {
        Object.keys(game.board).forEach(function (key) {
          var value = game.board[key];
          var element = document.getElementById(key);
    
          if (value === "X") {
            element.classList.remove("red");
            element.classList.add("blue");
          } else {
            element.classList.remove("blue");
            element.classList.add("red");
          }
    
          element.innerHTML = value;
        });
    
        if (game.player.turn) {
          document.getElementById("status").innerHTML = "Ваш ход.";
        } else {
          document.getElementById("status").innerHTML = "Ходит другой игрок.";
        }
      }
    });
    
  }
  
}
