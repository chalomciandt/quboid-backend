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

io.on("connection", (socket) => {
  console.log("New client connected");
  io.emit("lobbyplayers", lobbyPlayers);
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => clock(), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.username);
    const idx = lobbyPlayers.indexOf(socket.username);
    if (idx > -1) {
      lobbyPlayers.splice(idx, 1);
    }
    io.emit("lobbyplayers", lobbyPlayers);
    clearInterval(interval);
  });

  socket.on("newplayer", (username) => {
    socket.username = username;
    lobbyPlayers.push(username);
    io.emit("lobbyplayers", lobbyPlayers);
  });
});


server.listen(port, () => console.log(`Listening on port ${port}`));
