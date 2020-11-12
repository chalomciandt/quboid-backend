const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 4000;
const index = require("./routes/index");
const app = express();
app.use(index);

const server = http.createServer(app);
const io = socketIo(server, {
  // BAD security, should not use in production!
  cors: { origin: "*" }
});
const clock = () => {
  const response = new Date();
  // Broadcasting a new message. Will be consumed by the client
  io.emit("clock", response);
};

let interval;
let lobbyPlayers = [];

function dropPlayer(name) {
  const idx = lobbyPlayers.indexOf(name);
  if (idx > -1) {
    lobbyPlayers.splice(idx, 1);
  }
}

io.on("connection", (socket) => {
  console.log("New client connected");
  io.emit("lobbyplayers", lobbyPlayers);
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => clock(), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.username);
    dropPlayer(socket.username);
    io.emit("lobbyplayers", lobbyPlayers);
    clearInterval(interval);
  });

  socket.on("newplayer", (username) => {
    socket.username = username;
    lobbyPlayers.push(username);
    io.emit("lobbyplayers", lobbyPlayers);
  });

  socket.on("sendchallenge", (data) => {
    console.log("CHALLENGE! " + data.whoami + ' vs ' + data.challenge);
    dropPlayer(data.whoami);
    dropPlayer(data.challenge);
    io.emit("startmatch", {x: data.whoami, o: data.challenge});
    io.emit("lobbyplayers", lobbyPlayers);
  });

  socket.on("sendmove", (data) => {
    console.log("Move received: " + data.whoami + " played at " + data.move);
    io.emit("sendmove", {player: data.whoami, move: data.move});
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
